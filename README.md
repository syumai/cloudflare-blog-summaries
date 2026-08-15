# cloudflare-blog-summaries

Cloudflare ブログの記事を対象に、日本語での要約 Wiki・スライド・理解度テストを継続的に蓄積するリポジトリです。

各記事につき、以下の3点セットを作成します。

1. **Wiki**: 記事の詳細サマリ（日本語、`docs/`）
2. **スライド**: 記事解説用のプレゼン資料（[Slidev](https://sli.dev/) 製、`slides/`）
3. **理解度テスト**: 選択式クイズ（`quizzes/`）

記事追加の作業には再現性を持たせるため、[`add-article`](.claude/skills/add-article/SKILL.md) という Claude Code Skill としてワークフローをツール化しています。

## ディレクトリ構成

```
cloudflare-blog-summaries/
├── README.md                  # このファイル
├── .gitignore
├── package.json                # サイトビルド用（marked）
├── scripts/
│   └── build-site.mjs          # 静的サイトビルドスクリプト
├── docs/                      # === Wiki ===
│   ├── index.md               # 記事一覧
│   └── articles/
│       ├── 2026-08-13-agents-week-review.md
│       └── 2026-08-05-cloudflare-computer.md
├── slides/                    # === スライド (Slidev) ===
│   ├── package.json           # 全デッキ共通の devDependencies
│   ├── .gitignore
│   ├── agents-week-review/
│   │   └── slides.md
│   └── cloudflare-computer/
│       └── slides.md
├── quizzes/                   # === 理解度テスト（自己完結HTML） ===
│   ├── agents-week-review.html
│   └── cloudflare-computer.html
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Pages への自動デプロイ
└── .claude/
    └── skills/
        └── add-article/
            └── SKILL.md        # 記事追加ワークフロー
```

## 記事一覧

| 公開日 | タイトル | Wiki | スライド | クイズ | 原文リンク |
|--------|----------|------|----------|--------|------------|
| 2026-08-13 | Agents Week 2026で行った発表内容の全て | [Wiki](docs/articles/2026-08-13-agents-week-review.md) | [スライド](slides/agents-week-review/slides.md) | [クイズ](quizzes/agents-week-review.html) | [原文](https://blog.cloudflare.com/ja-jp/agents-week-review-august-2026/) |
| 2026-08-05 | AIエージェントに必要なのはコンテナではなくコンピューター —「@cloudflare/computer」のご紹介 | [Wiki](docs/articles/2026-08-05-cloudflare-computer.md) | [スライド](slides/cloudflare-computer/slides.md) | [クイズ](quizzes/cloudflare-computer.html) | [原文](https://blog.cloudflare.com/ja-jp/cloudflare-computer/) |

記事一覧の全体は [docs/index.md](docs/index.md) にもまとめています。

## スライドの起動方法

スライドは [Slidev](https://sli.dev/) で作成しています。初回のみ依存パッケージのインストールが必要です。

```sh
cd slides
npm install
npm run dev -- <slug>/slides.md
```

例:

```sh
cd slides
npm install
npm run dev -- cloudflare-computer/slides.md
```

PDF などへのエクスポートが必要な場合:

```sh
npm run export -- <slug>/slides.md
```

## サイトのビルド

Wiki・スライド・クイズすべてにアクセスできる静的サイトを、リポジトリルートの `npm run build` でビルドできます。ビルド結果は `site/`（gitignore 対象）に出力され、GitHub Actions によって [GitHub Pages](https://syumai.github.io/cloudflare-blog-summaries/) に自動デプロイされます。

ローカルでビルド・確認する場合:

```sh
npm install
cd slides && npm install && cd ..
npm run build
npx serve site
```

ブラウザで `http://localhost:3000`（`serve` が出力するURL）を開くと、ローカル向けに生成されたサイトを確認できます。

GitHub Pages 向けのビルド（本番と同じベースパス）を手元で確認したい場合:

```sh
BASE_PATH=/cloudflare-blog-summaries/ npm run build
```

`main` ブランチへの push をトリガーに [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) が実行され、サイトが自動的に公開されます。公開URL: https://syumai.github.io/cloudflare-blog-summaries/

## 記事の追加方法

新しい記事を追加する場合は、`add-article` Skill を使用してください。

```
/add-article https://blog.cloudflare.com/ja-jp/<slug>/
```

Wiki・スライド・クイズの3点セットと `docs/index.md` / `README.md` への一覧追加までを自動化します。詳細は [`.claude/skills/add-article/SKILL.md`](.claude/skills/add-article/SKILL.md) を参照してください。
