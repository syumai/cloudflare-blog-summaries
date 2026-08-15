# local-tracing サンプル

記事「[エージェントがローカルトレースでWorkersをデバッグ可能に](https://blog.cloudflare.com/local-tracing/)」（[Wiki](../../docs/articles/2026-08-04-local-tracing.md)）に対応する、デプロイ可能な最小 Worker サンプルです。

## 記事との対応

記事内で紹介されている具体例（KVからアクティブなカートを取得し、D1にチェックアウト内容を保存する `POST /api/orders` が、スキーマ変更後に500エラーを返すようになるシナリオ）を、そのまま再現しています。

- `migrations/0001_create_orders.sql`: `orders` テーブルを作成（`delivery_window` カラムは含まない）
- `migrations/0002_add_delivery_window.sql`: `delivery_window` カラムを追加するマイグレーション（記事内の「マイグレーションは定義済みだがローカルには未適用」の状態を再現するため、意図的に自動適用しない）
- `src/index.ts`: `delivery_window` を含む `INSERT` を常に実行するため、マイグレーション0002が未適用のままだと D1 への挿入が `no such column: delivery_window` で失敗する

## 体験できること

`wrangler.jsonc` で `observability.traces.enabled: true` にしているため、`wrangler dev` はリクエストを自動的にOpenTelemetryトレースとして記録します。

1. マイグレーションを適用せずに `wrangler dev` を起動し、`POST /api/orders` を呼ぶ → 500エラー
2. Local Explorer（`wrangler dev` 中に `e` キー、または `http://localhost:8787/cdn-cgi/explorer`）でトレースを開くと、KVの読み取りは成功し、D1への挿入が `no such column: delivery_window` で失敗していることが分かる
3. `npm run migrate:local` でマイグレーションをローカルDBに適用し、再度 `POST /api/orders` を呼ぶと成功する

## セットアップ

```bash
npm install
npx wrangler dev
```

別ターミナルで（先に失敗を再現したい場合はこの手順を後回しにしてください）:

```bash
npm run migrate:local
```

失敗を再現する:

```bash
curl -X POST http://localhost:8787/api/orders
```

`wrangler dev` のターミナル上で `e` キーを押すと Local Explorer が開き、Tracesタブで失敗したリクエストのスパン（KV読み取り成功 → D1挿入失敗）を確認できます。マイグレーション適用後に同じリクエストを送ると、`{"orderId": ..., "cart": {...}}` が返るようになります。

## デプロイ

```bash
npx wrangler deploy
npx wrangler d1 migrations apply local-tracing-example-db --remote
```

## 必要な binding

- `CARTS`（KV Namespace）
- `DB`（D1 Database）

`wrangler.jsonc` の `database_id` はプレースホルダーです。実際にデプロイする場合は `npx wrangler d1 create local-tracing-example-db` で作成したデータベースのIDに置き換えてください。

## 検証

```bash
npm install
npx wrangler deploy --dry-run
```

が成功することを確認済みです（実デプロイ・ログインは行っていません）。
