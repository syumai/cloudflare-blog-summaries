---
routerMode: hash
theme: default
title: "Forge のご紹介: SDK・CLI・ドキュメントなどを生成するオープンソースのパイプライン"
info: |
  Forge のご紹介の解説スライド。
  原文: https://blog.cloudflare.com/forge-open-source-generation-pipeline/
class: text-center
highlighter: shiki
drawings:
  persist: false
transition: slide-left
mdc: true
lineNumbers: true
themeConfig:
  primary: '#f6821f'
---

# Forge のご紹介
# SDK・CLI・ドキュメントを生成するOSSパイプライン

Birthday Week 2026

<div class="pt-4 text-sm opacity-70">
原文: https://blog.cloudflare.com/forge-open-source-generation-pipeline/<br>
公開日: 2026-09-28
</div>

---

# TL;DR

- Cloudflare が生成パイプライン <strong>Forge</strong> をオープンソース公開（Apache 2.0）
- 各チームのAPIリポジトリの <strong>CI 上</strong>で動き、PR ごとに CLI・ドキュメント・SDK の<strong>プレビュー</strong>を生成
- 出力を次の生成器の入力にする<strong>チェーン可能な transformer</strong>（OpenAPI → TypeScript SDK → cf CLI / Cap'n Web）
- すでに cf CLI の生成に使用。API ドキュメントと各言語 SDK も順次 Forge へ
- 旧クライアントを壊さない新しい API バージョニングの土台にもなる

---

# アジェンダ

- 背景: APIが生成器の規模を超えた
- CI 上の生成とプレビュー
- transformer と Cap'n Web
- チェーンと cf CLI
- API バージョニングとオープンソース化
- コード例・ユースケース・まとめ

---

# 背景: API が生成器の規模を超えた

- 3,500 超のオペレーション、数百のサービス（Rust / Go / TypeScript / Python）
- 求められたこと: チーム間の調整コスト削減、マージ前のプレビュー、生成パイプラインの破損検出、SDK以外への拡張
- 既存のホスト型サービスは要件を満たさず、終了したものもあった
- あるチームのマージが生成を壊し、別チームがリリース時に気づく問題

<div class="text-xs opacity-60 pt-4">出典: Cloudflare Blog https://blog.cloudflare.com/forge-open-source-generation-pipeline/</div>

---

# Forge の基本: CI で動き、PR ごとにプレビュー

- AI コードレビューやテストと同じく、各チームのAPIリポジトリの CI で動作
- 変更を lint し、変更点を強調した CLI・ドキュメント・SDK のプレビューを生成
- 考え方は Workers Previews と同じ（変更ごとに完全なプレビュー）を、数百リポジトリの SDK 生成へ適用

<img src="https://blog.cloudflare.com/_emdash/api/media/file/01M3J4EPCB6S3BJ6C7BY6HKZKN.png" style="max-height: 260px; margin: 1rem auto 0;" />

<div class="text-xs opacity-60 pt-1">出典: Cloudflare Blog https://blog.cloudflare.com/forge-open-source-generation-pipeline/</div>

---
layout: image-right
image: https://blog.cloudflare.com/_emdash/api/media/file/01M3J4EVDEJ0CVMAT598QFERDT.png
backgroundSize: contain
---

# 下流で問題になる前に CI で検出

- API 変更者がマージ前に成果物への影響を確認
- 生成の破損も PR の段階で検出
- リリース時に他チームが発見する、という流れを防ぐ

<div class="text-xs opacity-60 pt-4">出典: Cloudflare Blog https://blog.cloudflare.com/forge-open-source-generation-pipeline/</div>

---

# transformer は何でも生成できる

- Cap'n Web: TypeScript からリモート API をローカルメソッドのように呼ぶ RPC
- OpenAPI から Cap'n Web を直接生成 → Workers のバインディング生成にもつながる
- TanStack Query バインディング、Zod / Valibot スキーマ、MCP サーバーなども同じ発想
- 実際の API から常に最新・検証済みの状態で生成

<div class="text-xs opacity-60 pt-4">出典: Cloudflare Blog https://blog.cloudflare.com/forge-open-source-generation-pipeline/</div>

---
layout: image-right
image: https://blog.cloudflare.com/_emdash/api/media/file/01M3J4ERXXG0DDMKKETZXQQHHX.png
backgroundSize: contain
---

# OpenAPI から TypeScript SDK へ

- 元の OpenAPI 定義が TypeScript SDK に組み込まれる
- その SDK から <strong>cf CLI</strong> と <strong>Cap'n Web</strong> の仕様を生成
- 出力が次の入力になる

<div class="text-xs opacity-60 pt-4">出典: Cloudflare Blog https://blog.cloudflare.com/forge-open-source-generation-pipeline/</div>

---
layout: image-right
image: https://blog.cloudflare.com/_emdash/api/media/file/01M3J4EQPM3GPCFH9MW0W9W0AB.png
backgroundSize: contain
---

# チェーンをユーザーが制御できる

- 入力は現在 OpenAPI。将来は AsyncAPI / GraphQL / Cap'n Proto / Protobuf も想定
- 他の生成器でも Go SDK → CLI / Terraform のような連鎖はあるが、ユーザーが決められない
- Forge はチェーンを利用者が組み立てられる（Python 製 CLI も選べる）

<div class="text-xs opacity-60 pt-4">出典: Cloudflare Blog https://blog.cloudflare.com/forge-open-source-generation-pipeline/</div>

---

# cf CLI: 生成と手書きの両立

- cf CLI は TypeScript 製。SDK 生成器は通常 TypeScript から CLI を連鎖生成しない
- `cf dev` や `cf build` は API に対応しない手書きのローカル専用コマンド（Vite などを呼ぶ）
- OpenAPI だけから CLI とドキュメントを作ると、手書きコマンドがドキュメントに載らない
- この問題を解く既存ツールがなかったため、Forge に組み込んでいる

---

# API バージョニング

- v4 API は 10 年間、唯一のメジャーバージョン
- SemVer 上は新メジャーに値する変更が多数。内部の `v2` / `beta` 識別子も残存
- 大きな v5 は顧客を置き去りにする → 旧クライアント・SDK を壊さずに新メジャーを出す方式を検討
- SDK（TypeScript / Rust / Python / Go / PHP / Terraform）は近日公開。Terraform は特に慎重に移行

---

# コード例: Cap'n Web のパイプライン呼び出し

```ts {1-2|3|4|5-6|all}
// Authenticate, get the user's ID, fetch their profile, and fetch every friend's profile...
let authed = api.authenticate(apiToken);
let profile = api.getUserProfile(authed.getUserId());
let friends = authed.getFriendIds().map(id => api.getUserProfile(id));

// ...in a *single* request
let [me, myFriends] = await Promise.all([profile, friends]);
```

- 結果が届く前の値（`authed.getUserId()`）を次の呼び出しへ渡せる
- `await` は最後だけなので、往復は 1 回。Forge は OpenAPI からこのバインディングを生成できる
- 記事に載るコードはこの例のみ（Forge の設定・コマンドは記載なし）

---

# ユースケース

| 場面 | 内容 |
|------|------|
| API 変更の事前確認 | PR ごとのプレビューを入れて試し、生成破損をマージ前に検出 |
| cf CLI の生成 | 生成コード + 手書きコマンドを統合し、ドキュメントにも反映 |
| 多様な成果物 | TanStack Query / Zod / Valibot / MCP サーバー / Cap'n Web |
| セルフホスト | Apache 2.0。SaaS に依存せず非公開環境で改変・運用 |
| 互換性を保つ版管理 | 旧クライアントを壊さず新メジャーを提供 |

---

# まとめ・所感

- 生成を CI に置き、PR ごとにプレビューを作ることで、API 変更者が影響を確認できる
- チェーンをユーザーが制御できる点が設計上の差別化
- 記事に Forge の設定形式や使い方はなく、詳細はリポジトリ参照（要確認）
- 「SDK・CLI・ドキュメントは利用者が所有すべき」という立場でオープンソース化
- デプロイ可能な Workers サンプルは対象外（CI 上の生成パイプラインのため）

---

# 参考リンク

- 原文（en-us）: https://blog.cloudflare.com/forge-open-source-generation-pipeline/
- Forge: https://github.com/cloudflare/forge
- Cap'n Web: https://capnweb.com/
- Workers Previews: https://blog.cloudflare.com/worker-previews/
- 関連スライド: [コードモード（OpenAPI仕様の扱い）](../code-mode-mcp/) / [CI Workflows](../ci-workflows/) / [cf CLI（Forge で生成）](../cloudflare-cf-cli-launch/)
- Wiki: [docs/articles/2026-09-28-forge-open-source-generation-pipeline.md](https://github.com/syumai/cloudflare-blog-summaries/blob/main/docs/articles/2026-09-28-forge-open-source-generation-pipeline.md)
