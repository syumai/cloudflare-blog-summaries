# mcp-v2 サンプル

## Demo

デプロイ済み: https://example-mcp-v2.syumai.workers.dev

`POST /mcp` に JSON-RPC リクエストを送ると応答します（例: `curl -X POST https://example-mcp-v2.syumai.workers.dev/mcp -H 'content-type: application/json' -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'`）。

元記事: [次世代のMCP — ステートレスなプロトコルへ生まれ変わったModel Context Protocol](https://blog.cloudflare.com/mcp-v2/)（[Wiki](../../docs/articles/2026-08-06-mcp-v2.md)）

## これは何か

MCP（Model Context Protocol）の新仕様 `2026-07-28` は、プロトコルを**ステートフルからステートレスへ**作り変えました。従来必須だった `initialize`/`initialized` のハンドシェイクと `Mcp-Session-Id` によるセッション管理が不要になり、各リクエストが単独で完結するようになったため、MCP サーバーの実装に Durable Object ベースの `McpAgent` はもはや必須ではなくなりました。

このサンプルは、公式 MCP TypeScript SDK に正式採用（graduate）された `createMcpHandler`（Cloudflare Agents SDK の `agents/mcp/server` からエクスポートされるステートレス版ハンドラー）を使い、通常の Cloudflare Workers の `fetch` ハンドラーだけで動く最小の MCP サーバーを実装したものです。Durable Object クラスも `Agent` の継承も一切登場しません。

`hello`（あいさつを返す）と `current_time`（サーバー時刻を返す）という2つのツールを登録しています。`current_time` は「呼び出しごとに完結し、以前の呼び出しの状態を一切参照しない」というステートレス化のポイントを体験するためのツールです。

## セットアップ

```bash
npm install
npx wrangler dev
```

`http://localhost:8787/mcp` に対して、標準的な MCP クライアント（Claude Code、MCP Inspector など）や `curl` で JSON-RPC リクエストを送れます。

### `curl` での動作確認例

ツール一覧を取得する:

```bash
curl -s http://localhost:8787/mcp \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

`hello` ツールを呼び出す:

```bash
curl -s http://localhost:8787/mcp \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"hello","arguments":{"name":"Cloudflare"}}}'
```

セッションIDの発行・受け渡しが一切不要な点（旧仕様との最大の違い）を確認してください。

## デプロイ

```bash
npx wrangler deploy
```

Cloudflare アカウントへのログイン (`npx wrangler login`) が必要です。追加の binding や環境変数は不要です。

## 参考

- [Wiki: mcp-v2](../../docs/articles/2026-08-06-mcp-v2.md)
- [MCP SDK v2 移行ガイド](https://developers.cloudflare.com/agents/model-context-protocol/guides/migrate-to-mcp-sdk-v2/)
- [createMcpHandler ドキュメント](https://developers.cloudflare.com/agents/model-context-protocol/apis/handler-api/)
