#!/usr/bin/env node
// ビルド時／ソース時のリンク切れチェッカー。
//
// 2つのチェックを行う:
//   1. サイト側チェック: site/**/*.html の href/src のうち内部リンクが、
//      site/ 内の実在ファイル（またはディレクトリの index.html）を指しているか検証する。
//   2. ソース側チェック: docs/**/*.md・README.md の相対リンク（.md・slides・quizzes・examples）が
//      リポジトリ内に実在するファイル/ディレクトリを指しているか検証する
//      （GitHub 上で直接閲覧した際にもリンク切れにならないことを保証するため）。
//
// 壊れたリンクが1件でもあれば「ファイル -> リンク」の一覧を出力して exit 1 する。
// 環境変数 SKIP_LINK_CHECK=1 でスキップできる。
//
// 使い方:
//   node scripts/check-links.mjs                 # BASE_PATH=/ 相当でチェック
//   BASE_PATH=/cloudflare-blog-summaries/ node scripts/check-links.mjs
//   SKIP_LINK_CHECK=1 node scripts/check-links.mjs   # 何もせず exit 0

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const SITE_DIR = path.join(ROOT, "site");
const DOCS_DIR = path.join(ROOT, "docs");
const README_PATH = path.join(ROOT, "README.md");

/**
 * BASE_PATH は先頭・末尾ともに "/" が付いた形に正規化する（build-site.mjs と同じ規則）。
 */
function normalizeBasePath(raw) {
  let base = raw && raw.trim() !== "" ? raw.trim() : "/";
  if (!base.startsWith("/")) base = "/" + base;
  if (!base.endsWith("/")) base += "/";
  return base;
}

// スキーム付き絶対リンク（http:, https:, mailto:, tel: など）かどうか。
const SCHEME_RE = /^[a-z][a-z0-9+.-]*:/i;
// プロトコル相対URL（//example.com/...）も外部リンクとして扱う。
function isExternalLink(href) {
  return SCHEME_RE.test(href) || href.startsWith("//");
}

function walkFiles(dir, ext, out = []) {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".")) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === "dist") continue;
      walkFiles(full, ext, out);
    } else if (entry.isFile() && entry.name.endsWith(ext)) {
      out.push(full);
    }
  }
  return out;
}

function relRoot(p) {
  return path.relative(ROOT, p);
}

// ---------------------------------------------------------------------------
// 1. サイト側チェック（site/**/*.html）
// ---------------------------------------------------------------------------

const HTML_ATTR_LINK_RE = /\b(?:href|src)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;

function extractHtmlLinks(html) {
  const links = [];
  let m;
  while ((m = HTML_ATTR_LINK_RE.exec(html))) {
    const href = m[1] ?? m[2] ?? "";
    links.push(href);
  }
  return links;
}

/**
 * サイト内のパス（フラグメント除去済み、site/ 相対の絶対パスまたはファイルパス）が
 * 実在するかを判定する。ディレクトリの場合は index.html の存在をもって「存在する」とみなす。
 */
function siteTargetExists(absPathNoFragment) {
  if (existsSync(absPathNoFragment)) {
    const st = statSync(absPathNoFragment);
    if (st.isDirectory()) {
      return existsSync(path.join(absPathNoFragment, "index.html"));
    }
    return true;
  }
  // 拡張子なし・末尾スラッシュなしで、ディレクトリ+index.html を想定しているケースにも対応する。
  if (existsSync(path.join(absPathNoFragment, "index.html"))) return true;
  return false;
}

function checkSiteLinks(basePath) {
  const problems = [];
  if (!existsSync(SITE_DIR)) {
    console.log("[check-links] site/ が存在しないため、サイト側チェックをスキップします（先に npm run build を実行してください）");
    return problems;
  }

  const htmlFiles = walkFiles(SITE_DIR, ".html");
  for (const htmlFile of htmlFiles) {
    const html = readFileSync(htmlFile, "utf8");
    const fileDir = path.dirname(htmlFile);
    for (const rawHref of extractHtmlLinks(html)) {
      const href = rawHref.trim();
      if (href === "" || isExternalLink(href)) continue;

      // 同一ページ内アンカー（"#foo" のようにファイル部分が空）はスキップする。
      if (href.startsWith("#")) continue;

      const hashIndex = href.indexOf("#");
      const filePart = hashIndex === -1 ? href : href.slice(0, hashIndex);
      const fragment = hashIndex === -1 ? "" : href.slice(hashIndex + 1);

      // Slidev のスライド番号ルーティング（#/N）はディレクトリ存在のみ検証する。
      const isSlideHashRoute = /^\/\d+$/.test(fragment);

      if (filePart === "") {
        // フラグメントのみ（上のガードで弾いているはずだが念のため）
        continue;
      }

      let targetAbs;
      if (filePart.startsWith("/")) {
        // BASE_PATH 込みの絶対パス。BASE_PATH を取り除いて site/ 相対に直す。
        let stripped = filePart;
        if (stripped.startsWith(basePath)) {
          stripped = stripped.slice(basePath.length);
        } else if (stripped.startsWith("/")) {
          stripped = stripped.slice(1);
        }
        targetAbs = path.join(SITE_DIR, stripped);
      } else {
        targetAbs = path.resolve(fileDir, filePart);
      }

      // site/ の外を指しているリンクは対象外（通常発生しないが念のため無視する）。
      if (!targetAbs.startsWith(SITE_DIR)) continue;

      let ok;
      if (isSlideHashRoute) {
        // ディレクトリ（またはそこに index.html があるか）のみ確認する。
        ok = existsSync(targetAbs) && statSync(targetAbs).isDirectory()
          ? existsSync(path.join(targetAbs, "index.html"))
          : siteTargetExists(targetAbs);
      } else {
        ok = siteTargetExists(targetAbs);
      }

      if (!ok) {
        problems.push({ file: relRoot(htmlFile), link: rawHref });
      }
    }
  }
  return problems;
}

// ---------------------------------------------------------------------------
// 2. ソース側チェック（docs/**/*.md・README.md）
// ---------------------------------------------------------------------------

const MD_LINK_RE = /\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;

function extractMarkdownLinksExcludingCodeFences(markdown) {
  const segments = markdown.split(/(```[\s\S]*?```)/g);
  const links = [];
  segments.forEach((segment, index) => {
    const isCodeFence = index % 2 === 1;
    if (isCodeFence) return;
    let m;
    const re = new RegExp(MD_LINK_RE.source, "g");
    while ((m = re.exec(segment))) {
      links.push(m[1]);
    }
  });
  return links;
}

/**
 * quizzes/<slug>.yaml の "wiki: ../docs/articles/....md" 行から相対リンクを抽出する。
 */
function extractYamlWikiLinks(yamlText) {
  const links = [];
  const re = /^wiki:\s*(\S+)\s*$/m;
  const m = yamlText.match(re);
  if (m) links.push(m[1]);
  return links;
}

function sourceTargetExists(baseDir, href) {
  // "../quizzes/<slug>.html" のようにビルド後にしか存在しない .html は、
  // 対応するソース（quizzes/<slug>.yaml）の存在で判定する。
  const quizHtmlMatch = href.match(/^(\.\.\/)*quizzes\/([^/#]+)\.html$/);
  if (quizHtmlMatch) {
    return existsSync(path.join(ROOT, "quizzes", `${quizHtmlMatch[2]}.yaml`));
  }

  const hashIndex = href.indexOf("#");
  const filePart = hashIndex === -1 ? href : href.slice(0, hashIndex);
  if (filePart === "") return true; // 同一ページ内アンカー

  const targetAbs = path.resolve(baseDir, filePart);
  if (existsSync(targetAbs)) return true;
  // ディレクトリ参照（末尾スラッシュ有無を問わず）の場合は存在確認のみで良しとする。
  return false;
}

function checkSourceLinks() {
  const problems = [];

  const mdFiles = [...walkFiles(DOCS_DIR, ".md")];
  if (existsSync(README_PATH)) mdFiles.push(README_PATH);

  for (const mdFile of mdFiles) {
    const raw = readFileSync(mdFile, "utf8");
    const baseDir = path.dirname(mdFile);
    const links = extractMarkdownLinksExcludingCodeFences(raw);
    for (const href of links) {
      if (href === "" || isExternalLink(href) || href.startsWith("#")) continue;
      if (!sourceTargetExists(baseDir, href)) {
        problems.push({ file: relRoot(mdFile), link: href });
      }
    }
  }

  // quizzes/*.yaml の wiki: フィールドも合わせて検証する。
  const quizzesDir = path.join(ROOT, "quizzes");
  if (existsSync(quizzesDir)) {
    for (const entry of readdirSync(quizzesDir, { withFileTypes: true })) {
      if (!entry.isFile() || !entry.name.endsWith(".yaml")) continue;
      const yamlPath = path.join(quizzesDir, entry.name);
      const raw = readFileSync(yamlPath, "utf8");
      const baseDir = path.dirname(yamlPath);
      for (const href of extractYamlWikiLinks(raw)) {
        if (!sourceTargetExists(baseDir, href)) {
          problems.push({ file: relRoot(yamlPath), link: href });
        }
      }
    }
  }

  return problems;
}

// ---------------------------------------------------------------------------
// エントリポイント
// ---------------------------------------------------------------------------

export function runLinkCheck({ basePath } = {}) {
  const resolvedBasePath = normalizeBasePath(basePath ?? process.env.BASE_PATH);

  const siteProblems = checkSiteLinks(resolvedBasePath);
  const sourceProblems = checkSourceLinks();

  const allProblems = [...siteProblems, ...sourceProblems];

  if (allProblems.length === 0) {
    console.log(
      `[check-links] リンク切れは見つかりませんでした（サイト側 ${siteProblems.length} 件 / ソース側 ${sourceProblems.length} 件のリンク切れ）`
    );
    return { ok: true, problems: [] };
  }

  console.error(`[check-links] リンク切れが ${allProblems.length} 件見つかりました:`);
  for (const { file, link } of allProblems) {
    console.error(`  ${file} -> ${link}`);
  }
  return { ok: false, problems: allProblems };
}

function isMainModule() {
  return path.resolve(process.argv[1] ?? "") === path.resolve(fileURLToPath(import.meta.url));
}

if (isMainModule()) {
  if (process.env.SKIP_LINK_CHECK === "1") {
    console.log("[check-links] SKIP_LINK_CHECK=1 が指定されたため、リンクチェックをスキップします");
    process.exit(0);
  }
  const { ok } = runLinkCheck({});
  process.exit(ok ? 0 : 1);
}
