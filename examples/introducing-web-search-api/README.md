# introducing-web-search-api サンプル

元記事: [Introducing Web Search API via AI Gateway](https://blog.cloudflare.com/introducing-web-search-api/)（[Wiki](../../docs/articles/2026-10-02-introducing-web-search-api.md)）

## これは何か

AI Gateway 経由の Web Search API を、Workers バインディング（`env.AI.websearch()`）から呼ぶ最小の Worker です。記事の「Workers Bindings」と「Coming soon: Server tools」のコード例に沿っています。

| エンドポイント | 内容 |
|---|---|
| `GET /search?q=...&provider=exa&limit=5` | `env.AI.websearch()` を呼び、検索結果の JSON を返す |
| `POST /ask` `{"prompt": "..."}` | モデルに `web_search` ツールを渡し、ツール呼び出しがあれば `env.AI.websearch()` で検索して結果をモデルへ返す |

## 前提条件

- AI Gateway（`default` ゲートウェイ）と、Web Search API の利用に必要なクレジットまたはプロバイダーキー（BYOK）があること
- `ai` バインディング（`wrangler.jsonc` で設定済み）以外の binding・環境変数は不要です
- 検索の課金は AI Gateway のクレジットから引き落とされます。実際の呼び出しはこのリポジトリでは確認していません（`wrangler deploy --dry-run` と型チェックのみ確認）

## セットアップ

```bash
npm install
npx wrangler dev
```

```bash
curl -s 'http://localhost:8787/search?q=cloudflare+birthday+week&provider=exa&limit=5'
```

## デプロイ

```bash
npx wrangler deploy
```

## Cloudflare Access 設定

このサンプルは [Cloudflare Access](https://developers.cloudflare.com/workers/configuration/cloudflare-access/) で保護する前提です。[`examples/shared/access.ts`](../shared/access.ts) の `requireAllowedAccess(ctx)` を `fetch` の冒頭で呼んでおり、Access のアプリケーションが未設定、または許可メール（[`examples/shared/allowed-emails.json`](../shared/allowed-emails.json)）以外のアクセスはすべて 403 になります。

本番で有効にするには、Zero Trust ダッシュボードの **Access > Applications** でこの Worker のドメインに対する Self-hosted アプリケーションを作成し、Allow ポリシーに許可メールを設定してください。`wrangler.jsonc` の `access.dev` は `wrangler dev` 用のローカルシミュレーションです。

## 参考

- [Wiki: introducing-web-search-api](../../docs/articles/2026-10-02-introducing-web-search-api.md)
- [Web Search ドキュメント](https://developers.cloudflare.com/web-search)
