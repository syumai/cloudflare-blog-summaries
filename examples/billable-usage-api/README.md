# billable-usage-api example

対応記事: [Billable Usage APIを提供開始](../../docs/articles/2026-08-03-billable-usage-api.md)

Cloudflare の **Billable Usage API**（`GET /accounts/:account_id/billable-usage`）を Worker から呼び出す最小サンプルです。記事内のユースケース「開発者によるスクリプトへの組み込み（日次でコストを取得し、閾値超過でアラートを出す）」を再現しています。

## 体験できること

- `GET /usage`: Billable Usage API のレスポンスを取得し、サービス（`ServiceName`）ごとの `ContractedCost` 合計に整形して返す。
- `scheduled`（Cron Trigger、デフォルトは毎日 6:00 UTC）: 同様に利用料金を取得し、合計が `COST_ALERT_THRESHOLD_USD` を超えていたら警告ログを出力する（実運用では `console.log` の代わりに Slack Webhook 等への通知に置き換える）。

`CLOUDFLARE_API_TOKEN` が未設定の場合でも Worker 自体は起動し、`/usage` は 501 でその旨を返します（キー無しでも起動確認だけはできる構成）。

## セットアップ

```bash
npm install
```

`wrangler.jsonc` の `vars.CLOUDFLARE_ACCOUNT_ID` を自分の Cloudflare アカウント ID に書き換えてください。

Billing Read 権限を持つ API トークンを発行し、secret として登録します（`.dev.vars` にローカル用の値を書いてもよい）。

```bash
npx wrangler secret put CLOUDFLARE_API_TOKEN
```

ローカルでは `.dev.vars` に以下のように書いても動作します（コミットしないこと）。

```
CLOUDFLARE_API_TOKEN=your-token-here
```

## 実行

```bash
npx wrangler dev
# 別ターミナルで
curl http://localhost:8787/usage
```

## デプロイ

```bash
npx wrangler deploy
```

## 必要な binding / 環境変数

| 名前 | 種類 | 説明 |
|---|---|---|
| `CLOUDFLARE_ACCOUNT_ID` | vars | 利用状況を取得する対象アカウントの ID |
| `COST_ALERT_THRESHOLD_USD` | vars | このドル額を超えたら警告ログを出す閾値 |
| `CLOUDFLARE_API_TOKEN` | secret | Billing Read 権限を持つ Cloudflare API トークン（[取得方法](https://developers.cloudflare.com/fundamentals/api/get-started/create-token/)） |

外部の課金 API 以外に必要な Cloudflare 側の binding（KV/D1 等）はありません。
