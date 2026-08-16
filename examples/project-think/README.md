# project-think example

対応記事: [Project Think：Cloudflareで次世代のAIエージェント構築](../../docs/articles/2026-04-15-project-think.md)（[原文](https://blog.cloudflare.com/ja-jp/project-think/)）

## 何を体験できるか

記事で発表された AI エージェントフレームワーク `@cloudflare/think` の `Think` ベースクラスを、記事の「利用開始」節のコード例に沿って最小構成で動かす。

- `Think<Env>` を継承した `MyAgent` を Durable Object として定義するだけで、WebSocket チャットプロトコル・メッセージ永続化・再開可能ストリーミング・ワークスペースファイルツール（read/write/edit/list/find/grep/delete）が自動的に有効になる（記事「Thinkベースクラス」節）。
- `configureSession()` で `soul`（読み取り専用のシステムプロンプト）と `memory`（モデルが `set_context` ツールで書き込める可変ブロック）の2つのコンテキストブロックを設定し、記事「永続的なメモリと長い会話」節にある永続メモリ機構を再現している。
- `getTools()` で独自ツール `getWorkersLimits` を1つ追加し、記事「フレームワークでなくビルディングブロック」節にある「独自ツールは組み込みツールと自動的にマージされる」という統合ポイントを体験できる。

対象外にしているもの（理由は Wiki の「サンプル対象外」注記も参照）:

- `runFiber()` による耐久実行（ファイバー）
- サブエージェント（Facets）
- 実行ラダーの Tier 1〜4（Dynamic Workers / npm 追加 / ヘッドレスブラウザ / Cloudflare Sandbox）
- 自己承認型拡張機能（ExtensionManager）

これらはいずれも追加のバインディング（Browser Run、Sandbox など）や複数 Durable Object 間の連携を要し、100 行前後の最小サンプルでは再現できないため、`Think` ベースクラス単体で体験できる範囲に絞っている。

## セットアップ・実行

```bash
npm install
npx wrangler dev
```

`Think` は `agents` パッケージの `routeAgentRequest()` によって WebSocket チャットプロトコル（`useAgentChat` 互換）でルーティングされる。ブラウザからのHTTP `GET /` など、チャットプロトコル外のパスは 404 を返す。実際にチャットするには、Agents SDK の `useAgent()` / `useAgentChat()`（`agents/react`、`@cloudflare/think/react`）を使ったクライアント、または WebSocket 対応クライアントで `/agents/my-agent/:name` に接続する（本サンプルにクライアントUIは含まない。記事の「利用開始」節にある `src/client.tsx` の実装例を参照）。

## デプロイ

```bash
npx wrangler deploy
```

## 必要な binding・前提条件

- `AI`: Workers AI バインディング。`getModel()` が返す文字列（`@cf/moonshotai/kimi-k2.5`）を、Think 内蔵の `workers-ai-provider` がこのバインディング経由でモデルIDとして解決する。
- `MyAgent`: Durable Object binding（`MyAgent` クラス自身）。`wrangler.jsonc` の `migrations` で `new_sqlite_classes` を指定しているため、SQLite ストレージ対応の Durable Object としてマイグレーションされる（Thinkのメッセージ永続化・永続メモリはこのSQLiteに保存される）。
- `compatibility_flags: ["nodejs_compat"]` が必要（`@cloudflare/think` が Node.js 互換APIを利用するため）。
- 外部APIキーは不要（Workers AI バインディングのみでモデル呼び出しが完結する）。
- Durable Objects の利用には Cloudflare アカウントでの Durable Objects 有効化が必要（プランによって課金体系が異なる。詳細は[Durable Objectsの価格ページ](https://developers.cloudflare.com/durable-objects/platform/pricing/)を参照）。

## 記事との対応

- 記事「利用開始」節の最小サブクラス例（`Think<Env>` を継承し `getModel()` のみオーバーライド）がベース。
- `configureSession()` は記事「永続的なメモリと長い会話」節のコード例（`withContext("soul", ...)` / `withContext("memory", ...)` / `withCachedPrompt()`）とほぼ同一。
- `getTools()` は記事「完全な実行ラダーが組み込まれている」節にある、独自ツールとThink組み込みツールを1つの `getTools()` にまとめる構成を、実行ラダー部分を省いて示したもの。

## 検証結果

- `npx tsc --noEmit`: 成功
- `npx wrangler deploy --dry-run`: 成功（`env.MyAgent` = Durable Object、`env.AI` = AI の2バインディングを確認）
