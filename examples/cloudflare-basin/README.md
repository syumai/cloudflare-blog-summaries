# cloudflare-basin サンプル

記事「[Cloudflare Basin のご紹介: オープンなサーバーレスデータプラットフォームが一般提供に](https://blog.cloudflare.com/cloudflare-basin/)」（[Wiki](../../docs/articles/2026-10-01-cloudflare-basin.md)）に対応する、最小の Worker サンプルです。Basin は記事の時点で一般提供（GA）です。

## 記事との対応

- `src/index.ts`: 記事の「Basin Pipelines は HTTP エンドポイントまたは Workers バインディングでイベントを受け取る」部分を再現する。`POST /events` で受けた JSON に `event_time` を付け、`env.EVENTS.send([record])` でストリームへ書き込む。バインディング名とレコード型は、記事の SQL 例（`analytics.events`）のカラムに合わせている。
- `wrangler.jsonc` の `pipelines` で、Worker にストリームを紐づける。`wrangler types` でストリームのスキーマから型を生成できる点は記事に書かれているが、このサンプルでは型を手書きしている。
- バインディングの形式（`pipelines` 設定と `send()`）は記事本文ではなく、wrangler の設定スキーマと `@cloudflare/workers-types` の型定義に従っています。

## セットアップ

前提: Cloudflare アカウント、`wrangler login`、Pipelines のストリーム（と、そこから Basin Catalog の Iceberg テーブルへのシンク）。作成手順は記事の[チュートリアル](https://developers.cloudflare.com/basin/get-started/guide/)に従ってください。

1. `wrangler.jsonc` の `stream` を、自分のストリームの ID に置き換える。
2. デプロイする。

```bash
npm install
npx wrangler deploy
```

## 体験手順

```bash
curl -X POST 'https://<your-worker>.workers.dev/events' \
  -H 'Content-Type: application/json' \
  -d '{"account_id":"acc_1","user_id":"u_1","event_type":"login"}'
```

送ったイベントは、Pipelines の SQL で変換されて Iceberg テーブルに書かれ、Basin SQL（Wrangler・API・ダッシュボードのエディタ）でクエリできます。

この環境では実際のストリームへの書き込みは行っておらず、`wrangler deploy --dry-run` と型チェックのみ確認しています。
