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
│       ├── 2026-08-10-agents-week-review.md
│       └── 2026-08-03-cloudflare-computer.md
├── slides/                    # === スライド (Slidev) ===
│   ├── package.json           # 全デッキ共通の devDependencies
│   ├── .gitignore
│   ├── agents-week-review/
│   │   └── slides.md
│   └── cloudflare-computer/
│       └── slides.md
├── quizzes/                   # === 理解度テスト（YAML + テンプレートからビルド） ===
│   ├── agents-week-review.yaml
│   └── cloudflare-computer.yaml
├── examples/                  # === Workers サンプルコード ===
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
| 2025-09-26 | Code Mode: MCPをもっとうまく使う方法 | [Wiki](docs/articles/2025-09-26-code-mode.md) | [スライド](slides/code-mode/slides.md) | [クイズ](quizzes/code-mode.html) | [原文](https://blog.cloudflare.com/code-mode/) |
| 2026-02-20 | コードモード: エージェントに1,000トークンのAPI全体を提供 | [Wiki](docs/articles/2026-02-20-code-mode-mcp.md) | [スライド](slides/code-mode-mcp/slides.md) | [クイズ](quizzes/code-mode-mcp.html) | [原文](https://blog.cloudflare.com/ja-jp/code-mode-mcp/) |
| 2026-04-15 | Project Think：Cloudflareで次世代のAIエージェント構築 | [Wiki](docs/articles/2026-04-15-project-think.md) | [スライド](slides/project-think/slides.md) | [クイズ](quizzes/project-think.html) | [原文](https://blog.cloudflare.com/ja-jp/project-think/) |
| 2026-08-03 | AIエージェントに必要なのはコンテナではなくコンピューター —「@cloudflare/computer」のご紹介 | [Wiki](docs/articles/2026-08-03-cloudflare-computer.md) | [スライド](slides/cloudflare-computer/slides.md) | [クイズ](quizzes/cloudflare-computer.html) | [原文](https://blog.cloudflare.com/ja-jp/cloudflare-computer/) |
| 2026-08-03 | Billable Usage APIを提供開始：Cloudflareの課金情報をプログラムから取得可能に | [Wiki](docs/articles/2026-08-03-billable-usage-api.md) | [スライド](slides/billable-usage-api/slides.md) | [クイズ](quizzes/billable-usage-api.html) | [原文](https://blog.cloudflare.com/ja-jp/billable-usage-api/) |
| 2026-08-03 | Cloudflare Workers と Containers がインバウンド TCP 接続と gRPC をサポート | [Wiki](docs/articles/2026-08-03-grpc-workers.md) | [スライド](slides/grpc-workers/slides.md) | [クイズ](quizzes/grpc-workers.html) | [原文](https://blog.cloudflare.com/grpc-workers/) |
| 2026-08-03 | Workers RPC が Python と JavaScript 間で利用可能に | [Wiki](docs/articles/2026-08-03-python-workers-rpc.md) | [スライド](slides/python-workers-rpc/slides.md) | [クイズ](quizzes/python-workers-rpc.html) | [原文](https://blog.cloudflare.com/python-workers-rpc/) |
| 2026-08-03 | より小さく、より速く、より安全に：Kimi と GLM を大規模に実行 | [Wiki](docs/articles/2026-08-03-smaller-faster-safer-models.md) | [スライド](slides/smaller-faster-safer-models/slides.md) | [クイズ](quizzes/smaller-faster-safer-models.html) | [原文](https://blog.cloudflare.com/smaller-faster-safer-models/) |
| 2026-08-04 | Cloudflareにエージェント開発ライフサイクルの時代が到来 | [Wiki](docs/articles/2026-08-04-agent-development-lifecycle.md) | [スライド](slides/agent-development-lifecycle/slides.md) | [クイズ](quizzes/agent-development-lifecycle.html) | [原文](https://blog.cloudflare.com/ja-jp/agent-development-lifecycle/) |
| 2026-08-04 | Cloudflare Agentsの紹介 | [Wiki](docs/articles/2026-08-04-agents-on-cloudflare.md) | [スライド](slides/agents-on-cloudflare/slides.md) | [クイズ](quizzes/agents-on-cloudflare.html) | [原文](https://blog.cloudflare.com/agents-on-cloudflare/) |
| 2026-08-04 | AstroのGitHub Issue数をゼロへ導くソフトウェアファクトリーを構築した方法 | [Wiki](docs/articles/2026-08-04-astro-issue-triage.md) | [スライド](slides/astro-issue-triage/slides.md) | [クイズ](quizzes/astro-issue-triage.html) | [原文](https://blog.cloudflare.com/astro-issue-triage/) |
| 2026-08-04 | 数百万のリポジトリのCI/CDを、あなたのプラットフォーム上でCloudflareが動かす | [Wiki](docs/articles/2026-08-04-ci-workflows.md) | [スライド](slides/ci-workflows/slides.md) | [クイズ](quizzes/ci-workflows.html) | [原文](https://blog.cloudflare.com/ci-workflows/) |
| 2026-08-04 | CloudflareがAIを使ってエンジニアリング標準を徹底する方法 | [Wiki](docs/articles/2026-08-04-engineering-standards-enforcement.md) | [スライド](slides/engineering-standards-enforcement/slides.md) | [クイズ](quizzes/engineering-standards-enforcement.html) | [原文](https://blog.cloudflare.com/engineering-standards-enforcement/) |
| 2026-08-04 | エージェントがローカルトレースでWorkersをデバッグ可能に | [Wiki](docs/articles/2026-08-04-local-tracing.md) | [スライド](slides/local-tracing/slides.md) | [クイズ](quizzes/local-tracing.html) | [原文](https://blog.cloudflare.com/local-tracing/) |
| 2026-08-04 | Cloudflare Walletsを発表：エージェント型インターネットのためのプログラム可能なウォレット | [Wiki](docs/articles/2026-08-04-wallets.md) | [スライド](slides/wallets/slides.md) | [クイズ](quizzes/wallets.html) | [原文](https://blog.cloudflare.com/ja-jp/wallets/) |
| 2026-08-05 | Cloudflare OS：エージェント、アプリ、作業のためのオープンプラットフォーム | [Wiki](docs/articles/2026-08-05-cloudflare-os.md) | [スライド](slides/cloudflare-os/slides.md) | [クイズ](quizzes/cloudflare-os.html) | [原文](https://blog.cloudflare.com/ja-jp/cloudflare-os/) |
| 2026-08-05 | Cloudflare OSで、Cloudflareの働き方を再構築する | [Wiki](docs/articles/2026-08-05-how-we-use-ai-with-cloudflare-os.md) | [スライド](slides/how-we-use-ai-with-cloudflare-os/slides.md) | [クイズ](quizzes/how-we-use-ai-with-cloudflare-os.html) | [原文](https://blog.cloudflare.com/how-we-use-ai-with-cloudflare-os/) |
| 2026-08-05 | ID情報に基づく分析で、不正なAIの利用を検出 | [Wiki](docs/articles/2026-08-05-identity-aware-ai-gateway.md) | [スライド](slides/identity-aware-ai-gateway/slides.md) | [クイズ](quizzes/identity-aware-ai-gateway.html) | [原文](https://blog.cloudflare.com/ja-jp/identity-aware-ai-gateway/) |
| 2026-08-05 | WriteGuard: MCPサーバーのためのきめ細かな制御機能 | [Wiki](docs/articles/2026-08-05-mcp-portal-writeguard-private-beta.md) | [スライド](slides/mcp-portal-writeguard-private-beta/slides.md) | [クイズ](quizzes/mcp-portal-writeguard-private-beta.html) | [原文](https://blog.cloudflare.com/mcp-portal-writeguard-private-beta/) |
| 2026-08-05 | エージェントアクセスモデル（The Agent Access Model） | [Wiki](docs/articles/2026-08-05-the-agent-access-model.md) | [スライド](slides/the-agent-access-model/slides.md) | [クイズ](quizzes/the-agent-access-model.html) | [原文](https://blog.cloudflare.com/the-agent-access-model/) |
| 2026-08-06 | ランク付けから推奨へ：AIエージェント時代でサイトを成功に導く準備を整える | [Wiki](docs/articles/2026-08-06-aeo.md) | [スライド](slides/aeo/slides.md) | [クイズ](quizzes/aeo.html) | [原文](https://blog.cloudflare.com/ja-jp/aeo/) |
| 2026-08-06 | Cloudflare AI Search: エージェントにあなたのデータのための検索エンジンを | [Wiki](docs/articles/2026-08-06-ai-search-easier.md) | [スライド](slides/ai-search-easier/slides.md) | [クイズ](quizzes/ai-search-easier.html) | [原文](https://blog.cloudflare.com/ai-search-easier/) |
| 2026-08-06 | Kitesurfのご紹介 — Cloudflare Workers上で動く、エージェントファーストのブラウザ | [Wiki](docs/articles/2026-08-06-kitesurf.md) | [スライド](slides/kitesurf/slides.md) | [クイズ](quizzes/kitesurf.html) | [原文](https://blog.cloudflare.com/kitesurf/) |
| 2026-08-06 | 次世代のMCP — ステートレスなプロトコルへ生まれ変わったModel Context Protocol | [Wiki](docs/articles/2026-08-06-mcp-v2.md) | [スライド](slides/mcp-v2/slides.md) | [クイズ](quizzes/mcp-v2.html) | [原文](https://blog.cloudflare.com/mcp-v2/) |
| 2026-08-06 | 読み取り、発見、呼び出し、決済が可能なオープンなエージェンティックインターネットの構築 | [Wiki](docs/articles/2026-08-06-the-agentic-internet.md) | [スライド](slides/the-agentic-internet/slides.md) | [クイズ](quizzes/the-agentic-internet.html) | [原文](https://blog.cloudflare.com/ja-jp/the-agentic-internet/) |
| 2026-08-06 | あらゆるWebサイトにWebMCPインターフェースを付与する | [Wiki](docs/articles/2026-08-06-webmcp.md) | [スライド](slides/webmcp/slides.md) | [クイズ](quizzes/webmcp.html) | [原文](https://blog.cloudflare.com/webmcp/) |
| 2026-08-07 | Cloudflare Ambassadors、Community Engineers を発表 ― オープンソースへ2年間で追加100万ドルを投資 | [Wiki](docs/articles/2026-08-07-community-program-refresh.md) | [スライド](slides/community-program-refresh/slides.md) | [クイズ](quizzes/community-program-refresh.html) | [原文](https://blog.cloudflare.com/community-program-refresh/) |
| 2026-08-07 | エージェンティック・インターネットにおける「良い振る舞い」と「悪い振る舞い」を見極める | [Wiki](docs/articles/2026-08-07-good-and-bad-agentic-behaviors.md) | [スライド](slides/good-and-bad-agentic-behaviors/slides.md) | [クイズ](quizzes/good-and-bad-agentic-behaviors.html) | [原文](https://blog.cloudflare.com/ja-jp/good-and-bad-agentic-behaviors/) |
| 2026-08-07 | 平易な言葉でインターネットデータを探索するAIツール「Radar Researcher」のご紹介 | [Wiki](docs/articles/2026-08-07-introducing-radar-researcher.md) | [スライド](slides/introducing-radar-researcher/slides.md) | [クイズ](quizzes/introducing-radar-researcher.html) | [原文](https://blog.cloudflare.com/introducing-radar-researcher/) |
| 2026-08-07 | Workers AIとAI Gatewayを単一のAIコントロールプレーンへ統合 | [Wiki](docs/articles/2026-08-07-workers-ai-gateway-unification.md) | [スライド](slides/workers-ai-gateway-unification/slides.md) | [クイズ](quizzes/workers-ai-gateway-unification.html) | [原文](https://blog.cloudflare.com/workers-ai-gateway-unification/) |
| 2026-08-10 | Agents Week 2026で行った発表内容の全て | [Wiki](docs/articles/2026-08-10-agents-week-review.md) | [スライド](slides/agents-week-review/slides.md) | [クイズ](quizzes/agents-week-review.html) | [原文](https://blog.cloudflare.com/ja-jp/agents-week-review-august-2026/) |
| 2026-09-27 | Cloudflare 2026年度創業者レター | [Wiki](docs/articles/2026-09-27-cloudflares-2026-annual-founders-letter.md) | [スライド](slides/cloudflares-2026-annual-founders-letter/slides.md) | [クイズ](quizzes/cloudflares-2026-annual-founders-letter.html) | [原文](https://blog.cloudflare.com/ja-jp/cloudflares-2026-annual-founders-letter/) |
| 2026-09-28 | Workers でネイティブ Rust を動かす: wasm-bindgen の新 Emscripten ターゲット | [Wiki](docs/articles/2026-09-28-rust-workers-emscripten-target.md) | [スライド](slides/rust-workers-emscripten-target/slides.md) | [クイズ](quizzes/rust-workers-emscripten-target.html) | [原文](https://blog.cloudflare.com/rust-workers-emscripten-target/) |
| 2026-09-28 | EmDash 1.0: 安全なプラグインレジストリを備えた安定版 CMS | [Wiki](docs/articles/2026-09-28-emdash-cms-plugin-registry.md) | [スライド](slides/emdash-cms-plugin-registry/slides.md) | [クイズ](quizzes/emdash-cms-plugin-registry.html) | [原文](https://blog.cloudflare.com/emdash-cms-plugin-registry/) |
| 2026-09-28 | The Cold Start: Cloudflareのスタートアップ・ピッチコンペ | [Wiki](docs/articles/2026-09-28-introducing-the-cold-start.md) | [スライド](slides/introducing-the-cold-start/slides.md) | [クイズ](quizzes/introducing-the-cold-start.html) | [原文](https://blog.cloudflare.com/introducing-the-cold-start/) |
| 2026-09-28 | エージェント向けブラウザへの道: Kitesurf アップデート | [Wiki](docs/articles/2026-09-28-kitesurf-update.md) | [スライド](slides/kitesurf-update/slides.md) | [クイズ](quizzes/kitesurf-update.html) | [原文](https://blog.cloudflare.com/kitesurf-update/) |
| 2026-09-28 | Forge のご紹介: SDK・CLI・ドキュメントなどを生成するオープンソースのパイプライン | [Wiki](docs/articles/2026-09-28-forge-open-source-generation-pipeline.md) | [スライド](slides/forge-open-source-generation-pipeline/slides.md) | [クイズ](quizzes/forge-open-source-generation-pipeline.html) | [原文](https://blog.cloudflare.com/forge-open-source-generation-pipeline/) |
| 2026-09-28 | VoidZero が Cloudflare に加わって4か月: オープンソースのJavaScriptツールチェーンを人間にもエージェントにも速く | [Wiki](docs/articles/2026-09-28-voidzero-update.md) | [スライド](slides/voidzero-update/slides.md) | [クイズ](quizzes/voidzero-update.html) | [原文](https://blog.cloudflare.com/voidzero-update/) |
| 2026-09-28 | Webはどれくらい速いのか: BEACON で数十億件の実ユーザー計測を探索する | [Wiki](docs/articles/2026-09-28-how-fast-is-the-web.md) | [スライド](slides/how-fast-is-the-web/slides.md) | [クイズ](quizzes/how-fast-is-the-web.html) | [原文](https://blog.cloudflare.com/how-fast-is-the-web/) |
| 2026-09-28 | Vite で動く Next.js アプリケーション: Vinext 1.0 のご紹介 | [Wiki](docs/articles/2026-09-28-vinext-nextjs-on-vite.md) | [スライド](slides/vinext-nextjs-on-vite/slides.md) | [クイズ](quizzes/vinext-nextjs-on-vite.html) | [原文](https://blog.cloudflare.com/vinext-nextjs-on-vite/) |
| 2026-09-28 | cf のご紹介: Cloudflare API 全体を扱えるエージェント向け CLI | [Wiki](docs/articles/2026-09-28-cloudflare-cf-cli-launch.md) | [スライド](slides/cloudflare-cf-cli-launch/slides.md) | [クイズ](quizzes/cloudflare-cf-cli-launch.html) | [原文](https://blog.cloudflare.com/cloudflare-cf-cli-launch/) |
| 2026-09-29 | IPsec に対する量子ダウングレード攻撃の防止 | [Wiki](docs/articles/2026-09-29-ipsec-downgrade-protection.md) | [スライド](slides/ipsec-downgrade-protection/slides.md) | [クイズ](quizzes/ipsec-downgrade-protection.html) | [原文](https://blog.cloudflare.com/ipsec-downgrade-protection/) |
| 2026-09-29 | Cloudflare Application Profiles でポジティブセキュリティを実現する | [Wiki](docs/articles/2026-09-29-application-profiles.md) | [スライド](slides/application-profiles/slides.md) | [クイズ](quizzes/application-profiles.html) | [原文](https://blog.cloudflare.com/application-profiles/) |
| 2026-09-29 | あなたのドメインはポスト量子暗号を使っているか: 自分で確認できるようになりました | [Wiki](docs/articles/2026-09-29-post-quantum-visibility.md) | [スライド](slides/post-quantum-visibility/slides.md) | [クイズ](quizzes/post-quantum-visibility.html) | [原文](https://blog.cloudflare.com/post-quantum-visibility/) |
| 2026-09-29 | Threat Signals のご紹介: オープンソース脅威インテリジェンスのためのエージェント型スキル | [Wiki](docs/articles/2026-09-29-threat-signals.md) | [スライド](slides/threat-signals/slides.md) | [クイズ](quizzes/threat-signals.html) | [原文](https://blog.cloudflare.com/threat-signals/) |
| 2026-09-29 | フロンティア AI モデルで自社の WAF をテストしてみた: 分かったこと | [Wiki](docs/articles/2026-09-29-adaptive-ai-waf-testing.md) | [スライド](slides/adaptive-ai-waf-testing/slides.md) | [クイズ](quizzes/adaptive-ai-waf-testing.html) | [原文](https://blog.cloudflare.com/adaptive-ai-waf-testing/) |
| 2026-09-29 | Merkle Tree Certificates によるポスト量子認証局の構築 | [Wiki](docs/articles/2026-09-29-pq-ca-with-mtcs.md) | [スライド](slides/pq-ca-with-mtcs/slides.md) | [クイズ](quizzes/pq-ca-with-mtcs.html) | [原文](https://blog.cloudflare.com/pq-ca-with-mtcs/) |
| 2026-09-29 | AI 時代の適応型アプリケーションセキュリティ: Cloudflare がコード・トラフィック・インテリジェンスをつなぎ、攻撃を止める方法 | [Wiki](docs/articles/2026-09-29-ai-era-framework.md) | [スライド](slides/ai-era-framework/slides.md) | [クイズ](quizzes/ai-era-framework.html) | [原文](https://blog.cloudflare.com/ai-era-framework/) |
| 2026-09-29 | Cloudflare が「インターネット全体のための認証局」を作る | [Wiki](docs/articles/2026-09-29-cloudflare-certificate-authority.md) | [スライド](slides/cloudflare-certificate-authority/slides.md) | [クイズ](quizzes/cloudflare-certificate-authority.html) | [原文](https://blog.cloudflare.com/cloudflare-certificate-authority/) |
| 2026-09-29 | AI でポスト量子移行の進路を描く: 社内ツール CryptoLabe による暗号利用の発見 | [Wiki](docs/articles/2026-09-29-ai-driven-cryptography-discovery.md) | [スライド](slides/ai-driven-cryptography-discovery/slides.md) | [クイズ](quizzes/ai-driven-cryptography-discovery.html) | [原文](https://blog.cloudflare.com/ai-driven-cryptography-discovery/) |
| 2026-09-30 | インターネットには「第二の読者」がいる: エージェントを迎え入れ、対価を得るためのレール | [Wiki](docs/articles/2026-09-30-agentic-web.md) | [スライド](slides/agentic-web/slides.md) | [クイズ](quizzes/agentic-web.html) | [原文](https://blog.cloudflare.com/agentic-web/) |

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
