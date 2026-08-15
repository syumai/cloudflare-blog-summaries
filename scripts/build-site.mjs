#!/usr/bin/env node
// site/ を毎回クリーンビルドする静的サイトビルドスクリプト。
// 依存は marked のみ（他はすべて Node.js 標準ライブラリ）。
//
// 使い方:
//   npm run build                              # BASE_PATH=/ でローカル向けビルド
//   BASE_PATH=/cloudflare-blog-summaries/ npm run build   # GitHub Pages 向けビルド
//   SKIP_SLIDES=1 npm run build                # Slidev ビルドをスキップ（docs・クイズのみ検証したい場合）

import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { marked } from "marked";
import { parse as parseYaml } from "yaml";
import { renderQuizPage } from "../quizzes/template/render.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const DOCS_DIR = path.join(ROOT, "docs");
const ARTICLES_DIR = path.join(DOCS_DIR, "articles");
const SLIDES_DIR = path.join(ROOT, "slides");
const QUIZZES_DIR = path.join(ROOT, "quizzes");
const SITE_DIR = path.join(ROOT, "site");

// SKIP_SLIDES=1 が指定された場合は Slidev ビルドをスキップする。
// slides/ が別途並行作業中でビルド不能な場合に、docs・クイズ生成だけを検証したいときに使う。
const SKIP_SLIDES = process.env.SKIP_SLIDES === "1";

/**
 * BASE_PATH は先頭・末尾ともに "/" が付いた形に正規化する。
 * 例: "" -> "/"、"cloudflare-blog-summaries" -> "/cloudflare-blog-summaries/"
 */
function normalizeBasePath(raw) {
  let base = raw && raw.trim() !== "" ? raw.trim() : "/";
  if (!base.startsWith("/")) base = "/" + base;
  if (!base.endsWith("/")) base += "/";
  return base;
}

const BASE_PATH = normalizeBasePath(process.env.BASE_PATH);

console.log(`[build-site] BASE_PATH = ${BASE_PATH}`);

// ---------------------------------------------------------------------------
// 共通ユーティリティ
// ---------------------------------------------------------------------------

function log(msg) {
  console.log(`[build-site] ${msg}`);
}

function ensureDir(dir) {
  mkdirSync(dir, { recursive: true });
}

function listDirs(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
    .filter((entry) => entry.name !== "node_modules" && entry.name !== "dist")
    .map((entry) => entry.name)
    .sort();
}

function listFiles(dir, ext) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(ext))
    .map((entry) => entry.name)
    .sort();
}

/**
 * Markdown の先頭 "# 見出し" をタイトルとして抽出する。
 */
function extractTitle(markdown, fallback) {
  const match = markdown.match(/^#\s+(.+)\s*$/m);
  return match ? match[1].trim() : fallback;
}

// ---------------------------------------------------------------------------
// Markdown 内リンクの書き換え
//
//   - http(s)://, mailto:, # 始まりのリンクはそのまま
//   - ../slides/<slug>/slides.md            -> <BASE_PATH>slides/<slug>/
//   - ../quizzes/<slug>.html                -> <BASE_PATH>quizzes/<slug>.html
//   - それ以外の相対 ".md" リンク           -> 同じ相対パスのまま ".html" に置換
//
// コードフェンス（```...```）の中身は対象外にする。
// ---------------------------------------------------------------------------

function rewriteHref(href) {
  if (/^[a-z][a-z0-9+.-]*:/i.test(href)) {
    // http(s):, mailto:, tel: など、スキーム付きの絶対リンクはそのまま
    return href;
  }
  if (href.startsWith("#")) return href;

  const slidesMatch = href.match(/^\.\.\/slides\/([^/]+)\/slides\.md$/);
  if (slidesMatch) {
    return `${BASE_PATH}slides/${slidesMatch[1]}/`;
  }

  const quizMatch = href.match(/^\.\.\/quizzes\/([^/]+\.html)$/);
  if (quizMatch) {
    return `${BASE_PATH}quizzes/${quizMatch[1]}`;
  }

  // examples/ はサイトには含まれないため、GitHub リポジトリへのリンクに変換する
  const examplesMatch = href.match(/^(?:\.\.\/)+examples\/([^/]+)\/?$/);
  if (examplesMatch) {
    return `https://github.com/syumai/cloudflare-blog-summaries/tree/main/examples/${examplesMatch[1]}`;
  }

  const mdMatch = href.match(/^([^#]+)\.md(#.*)?$/);
  if (mdMatch) {
    return `${mdMatch[1]}.html${mdMatch[2] ?? ""}`;
  }

  return href;
}

function rewriteMarkdownLinks(markdown) {
  // ``` で囲まれたコードフェンスは書き換え対象から除外する。
  const segments = markdown.split(/(```[\s\S]*?```)/g);
  return segments
    .map((segment, index) => {
      const isCodeFence = index % 2 === 1;
      if (isCodeFence) return segment;
      // Markdown のリンク/画像記法 ](href "title") を書き換える。
      return segment.replace(/\]\(([^)\s]+)((?:\s+"[^"]*")?)\)/g, (whole, href, rest) => {
        return `](${rewriteHref(href)}${rest})`;
      });
    })
    .join("");
}

// ---------------------------------------------------------------------------
// HTML テンプレート
// ---------------------------------------------------------------------------

const PAGE_CSS = `
  :root {
    --bg: #ffffff;
    --fg: #1a1a1a;
    --muted: #6b7280;
    --border: #e2e2e7;
    --card-bg: #f8f8fa;
    --accent: #f6821f;
    --link: #0b5fff;
    --code-bg: #f2f2f5;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --bg: #14151a;
      --fg: #ececef;
      --muted: #9a9aa5;
      --border: #2c2d34;
      --card-bg: #1c1d24;
      --accent: #f6821f;
      --link: #7aa2ff;
      --code-bg: #1c1d24;
    }
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 2rem 1rem 4rem;
    background: var(--bg);
    color: var(--fg);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Hiragino Kaku Gothic ProN",
      "Hiragino Sans", Meiryo, system-ui, sans-serif;
    line-height: 1.75;
  }
  .container { max-width: 860px; margin: 0 auto; }
  .site-nav { margin-bottom: 1.5rem; font-size: 0.9rem; }
  .site-nav a { color: var(--link); text-decoration: none; }
  .site-nav a:hover { text-decoration: underline; }
  article h1 { font-size: 1.75rem; line-height: 1.4; }
  article h2 {
    font-size: 1.35rem;
    margin-top: 2.25rem;
    padding-bottom: 0.35rem;
    border-bottom: 1px solid var(--border);
  }
  article h3 { font-size: 1.1rem; margin-top: 1.75rem; }
  a { color: var(--link); }
  img { max-width: 100%; height: auto; border-radius: 6px; }
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 1.25rem 0;
    font-size: 0.92rem;
  }
  th, td {
    border: 1px solid var(--border);
    padding: 0.5rem 0.75rem;
    text-align: left;
    vertical-align: top;
  }
  th { background: var(--card-bg); }
  pre {
    background: var(--code-bg);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 1rem;
    overflow-x: auto;
    font-size: 0.85rem;
    line-height: 1.5;
  }
  code {
    font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
  }
  :not(pre) > code {
    background: var(--code-bg);
    padding: 0.15em 0.35em;
    border-radius: 4px;
    font-size: 0.9em;
  }
  pre code { background: none; padding: 0; }
  blockquote {
    margin: 1rem 0;
    padding: 0.25rem 1rem;
    border-left: 3px solid var(--accent);
    color: var(--muted);
  }
  hr { border: none; border-top: 1px solid var(--border); margin: 2rem 0; }
`;

function renderPage({ title, bodyHtml }) {
  return `<!doctype html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)}</title>
<style>${PAGE_CSS}</style>
</head>
<body>
<div class="container">
<nav class="site-nav"><a href="${BASE_PATH}index.html">&larr; サイトトップへ戻る</a></nav>
<article>
${bodyHtml}
</article>
</div>
</body>
</html>
`;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// ---------------------------------------------------------------------------
// ビルド本体
// ---------------------------------------------------------------------------

function cleanSite() {
  log(`site/ をクリーンビルドします: ${SITE_DIR}`);
  rmSync(SITE_DIR, { recursive: true, force: true });
  ensureDir(SITE_DIR);
  // GitHub Pages (actions/deploy-pages) は Jekyll 処理を行わないが、
  // 念のため .nojekyll を置いて "_" 始まりのアセットが無視されないようにする。
  writeFileSync(path.join(SITE_DIR, ".nojekyll"), "");
}

function buildDocsMarkdown() {
  const outDocsDir = path.join(SITE_DIR, "docs");
  const outArticlesDir = path.join(outDocsDir, "articles");
  ensureDir(outArticlesDir);

  const built = [];

  // docs/index.md -> site/docs/index.html
  const indexPath = path.join(DOCS_DIR, "index.md");
  if (existsSync(indexPath)) {
    const raw = readFileSync(indexPath, "utf8");
    const title = extractTitle(raw, "記事一覧");
    const bodyHtml = marked.parse(rewriteMarkdownLinks(raw));
    writeFileSync(path.join(outDocsDir, "index.html"), renderPage({ title, bodyHtml }));
    built.push("site/docs/index.html");
  }

  // docs/articles/*.md -> site/docs/articles/*.html
  for (const file of listFiles(ARTICLES_DIR, ".md")) {
    const raw = readFileSync(path.join(ARTICLES_DIR, file), "utf8");
    const title = extractTitle(raw, file.replace(/\.md$/, ""));
    const bodyHtml = marked.parse(rewriteMarkdownLinks(raw));
    const outFile = file.replace(/\.md$/, ".html");
    writeFileSync(path.join(outArticlesDir, outFile), renderPage({ title, bodyHtml }));
    built.push(`site/docs/articles/${outFile}`);
  }

  log(`Markdown を HTML 化しました (${built.length} ページ)`);
  return built;
}

/**
 * quiz.wiki（例: "../docs/articles/2026-08-05-cloudflare-computer.md"）を
 * サイト内で有効な Wiki ページへの絶対リンク（BASE_PATH 込み）に変換する。
 */
function resolveWikiHref(wikiRelativePath) {
  const base = path.basename(wikiRelativePath).replace(/\.md$/, ".html");
  return `${BASE_PATH}docs/articles/${base}`;
}

/**
 * quizzes/*.yaml をパースし、共通テンプレート（quizzes/template/render.mjs）を適用して
 * site/quizzes/<slug>.html を生成する。
 */
function buildQuizzes() {
  const outQuizzesDir = path.join(SITE_DIR, "quizzes");
  ensureDir(outQuizzesDir);
  const files = listFiles(QUIZZES_DIR, ".yaml");
  for (const file of files) {
    const raw = readFileSync(path.join(QUIZZES_DIR, file), "utf8");
    const quiz = parseYaml(raw);
    const slug = quiz.slug ?? file.replace(/\.yaml$/, "");
    const wikiHref = resolveWikiHref(quiz.wiki);
    const html = renderQuizPage(quiz, { wikiHref });
    writeFileSync(path.join(outQuizzesDir, `${slug}.html`), html);
  }
  log(`quizzes/*.yaml から site/quizzes/*.html を生成しました (${files.length} ファイル)`);
  return files;
}

/**
 * slides/ 配下のサブディレクトリを走査し、slides.md を持つデッキを自動発見する。
 */
function discoverSlideDecks() {
  return listDirs(SLIDES_DIR).filter((slug) =>
    existsSync(path.join(SLIDES_DIR, slug, "slides.md"))
  );
}

function buildSlides(decks) {
  const outSlidesRoot = path.join(SITE_DIR, "slides");
  ensureDir(outSlidesRoot);

  if (SKIP_SLIDES) {
    log("SKIP_SLIDES=1 が指定されたため、Slidev ビルドをスキップします");
    return;
  }

  if (decks.length === 0) {
    log("スライドデッキが見つかりませんでした（slides/<slug>/slides.md）");
    return;
  }

  const slidevBin = path.join(SLIDES_DIR, "node_modules", ".bin", "slidev");
  if (!existsSync(slidevBin)) {
    throw new Error(
      "slides/node_modules に @slidev/cli が見つかりません。先に `cd slides && npm install` を実行してください。"
    );
  }

  for (const slug of decks) {
    const entry = `${slug}/slides.md`;
    const outDir = path.join(outSlidesRoot, slug);
    const base = `${BASE_PATH}slides/${slug}/`;
    log(`スライドをビルドしています: ${entry} -> site/slides/${slug}/ (base=${base})`);
    execFileSync(slidevBin, ["build", entry, "--base", base, "--out", outDir], {
      cwd: SLIDES_DIR,
      stdio: "inherit",
    });
  }
}

/**
 * docs/articles/*.md からメタデータ（タイトル・公開日・原文URL）を組み立てる。
 * 新しい記事が docs/articles/ に追加されるだけで自動的にポータルへ反映される。
 */
function collectArticleMeta() {
  const articles = [];
  for (const file of listFiles(ARTICLES_DIR, ".md")) {
    const raw = readFileSync(path.join(ARTICLES_DIR, file), "utf8");
    const nameMatch = file.match(/^(\d{4}-\d{2}-\d{2})-(.+)\.md$/);
    const dateFromName = nameMatch ? nameMatch[1] : null;
    const slug = nameMatch ? nameMatch[2] : file.replace(/\.md$/, "");

    const title = extractTitle(raw, slug);
    const dateMatch = raw.match(/^-\s*公開日:\s*(\d{4}-\d{2}-\d{2})/m);
    const publishedAt = dateMatch ? dateMatch[1] : dateFromName;
    const origMatch = raw.match(/^-\s*原文:\s*\[(https?:\/\/[^\]]+)\]/m);
    const originalUrl = origMatch ? origMatch[1] : null;

    const wikiHtmlFile = file.replace(/\.md$/, ".html");
    const hasSlides = existsSync(path.join(SLIDES_DIR, slug, "slides.md"));
    const hasQuiz = existsSync(path.join(QUIZZES_DIR, `${slug}.yaml`));

    articles.push({
      slug,
      title,
      publishedAt,
      originalUrl,
      wikiHref: `${BASE_PATH}docs/articles/${wikiHtmlFile}`,
      slidesHref: hasSlides ? `${BASE_PATH}slides/${slug}/` : null,
      quizHref: hasQuiz ? `${BASE_PATH}quizzes/${slug}.html` : null,
    });
  }
  // 公開日の新しい順（公開日が無いものは末尾）
  articles.sort((a, b) => {
    if (!a.publishedAt) return 1;
    if (!b.publishedAt) return -1;
    return b.publishedAt.localeCompare(a.publishedAt);
  });
  return articles;
}

function linkOrDash(href, label) {
  return href ? `<a href="${href}">${label}</a>` : `<span class="muted">-</span>`;
}

function buildPortal(articles) {
  const rows = articles
    .map((a) => {
      const original = a.originalUrl
        ? `<a href="${a.originalUrl}" target="_blank" rel="noopener">原文</a>`
        : `<span class="muted">-</span>`;
      return `      <tr>
        <td>${a.publishedAt ?? "-"}</td>
        <td>${escapeHtml(a.title)}</td>
        <td>${linkOrDash(a.wikiHref, "Wiki")}</td>
        <td>${linkOrDash(a.slidesHref, "スライド")}</td>
        <td>${linkOrDash(a.quizHref, "クイズ")}</td>
        <td>${original}</td>
      </tr>`;
    })
    .join("\n");

  const bodyHtml = `
<p>Cloudflare ブログ記事の日本語サマリ（Wiki）・解説スライド・理解度クイズをまとめたポータルです。記事ごとに Wiki・スライド・クイズ・原文へのリンクをまとめています。</p>
<table>
  <thead>
    <tr>
      <th>公開日</th>
      <th>タイトル</th>
      <th>Wiki</th>
      <th>スライド</th>
      <th>クイズ</th>
      <th>原文</th>
    </tr>
  </thead>
  <tbody>
${rows}
  </tbody>
</table>
<p><a href="${BASE_PATH}docs/index.html">記事一覧ページ（Markdown 版）</a></p>
`;

  const html = `<!doctype html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Cloudflare Blog Summaries</title>
<style>${PAGE_CSS}
  .muted { color: var(--muted); }
  header.hero { margin-bottom: 1.5rem; }
  header.hero h1 { font-size: 1.85rem; margin-bottom: 0.25rem; }
  header.hero p.lead { color: var(--muted); margin-top: 0; }
</style>
</head>
<body>
<div class="container">
<article>
<header class="hero">
  <h1>Cloudflare Blog Summaries</h1>
  <p class="lead">Cloudflare ブログ記事の日本語 Wiki・スライド・理解度クイズ一覧</p>
</header>
${bodyHtml}
</article>
</div>
</body>
</html>
`;

  writeFileSync(path.join(SITE_DIR, "index.html"), html);
  log(`ポータルページを生成しました: site/index.html (${articles.length} 記事)`);
}

function main() {
  cleanSite();
  buildDocsMarkdown();
  buildQuizzes();

  const decks = discoverSlideDecks();
  buildSlides(decks);

  const articles = collectArticleMeta();
  buildPortal(articles);

  log("ビルド完了: site/");
}

main();
