# billable-usage-api example

## Demo

デプロイ済み: https://billable-usage-api-example.syumai.workers.dev

Cloudflare Access により syumai@gmail.com のみ許可（未認証は 403）。

`CLOUDFLARE_API_TOKEN` の secret を設定していないため、認証済みでも現時点では `/usage` にアクセスすると 501 を返すのみです。

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

**注意（順序）:** `CLOUDFLARE_API_TOKEN` を設定する前に、下記の「Cloudflare Access 設定」の手順で本番の Access アプリケーションを作成し、`syumai@gmail.com` 以外からアクセスできない状態にしてください。この Worker はコード側のガード（fail closed）により Access アプリケーション未設定時も 403 を返しますが、secret（請求情報を取得できるトークン）を投入する前に Access アプリケーションも実際に設定しておくことで、Access 側の設定漏れ・解除にも備えた多層防御になります。

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

## Cloudflare Access 設定

このサンプルは [Cloudflare Access](https://developers.cloudflare.com/workers/configuration/cloudflare-access/)（参考: [Workers protected by Access](https://blog.cloudflare.com/workers-protected-by-access/)）で保護されており、`syumai@gmail.com` 以外はすべてのエンドポイント（`/`・`/usage` を含む全パス）で 403 になります。`CLOUDFLARE_API_TOKEN` を設定すると請求情報（Billable Usage API のレスポンス）が返るようになるため、これは必須の保護です。

### 実装

- 許可メールアドレスの単一ソースは [`examples/shared/allowed-emails.json`](../shared/allowed-emails.json)。
- ガード関数 [`examples/shared/access.ts`](../shared/access.ts) の `requireAllowedAccess(ctx)` を `src/index.ts` の `fetch` ハンドラー冒頭で呼び出しています。
  - `ctx.access` が `undefined`（= この Worker に Cloudflare Access アプリケーションが設定されていない）場合は 403。
  - Access 経由でも `ctx.access.getIdentity()` の `email` が allowedEmails に含まれなければ 403。
  - これにより、**Access のダッシュボード設定を忘れていても Worker 自体が fail closed で保護され**、`CLOUDFLARE_API_TOKEN` 設定後も請求情報が未認証で公開されることはありません。
  - `scheduled`（Cron Trigger）ハンドラーは Cloudflare Access を経由しないため、このガードの対象外です（HTTP 経由ではないため保護の必要がありません）。

### 本番の Access アプリケーションを有効化する（手動・ダッシュボード）

`wrangler.jsonc` の `access.dev` は `wrangler dev` 用のローカルシミュレーションのみです。本番の Access ポリシー（どのメールアドレスを許可するか）は wrangler では設定できません（`node_modules/wrangler/config-schema.json` の `Access` 定義には `dev` 以外のフィールドがなく、`wrangler` CLI にも Access/Zero Trust を管理するサブコマンドはありません）。本番で `syumai@gmail.com` のみアクセスできるようにするには、以下を手動で行ってください。

1. [Zero Trust ダッシュボード](https://one.dash.cloudflare.com/) → **Access** → **Applications** → **Add an application** → **Self-hosted**
2. Application domain に `billable-usage-api-example.syumai.workers.dev` を設定
3. Policy を追加: Action = **Allow**、Include = **Emails** = `syumai@gmail.com`
4. 保存後、Application の Overview で **Application Audience (AUD) Tag** を確認し、`wrangler.jsonc` の `access.dev.aud` を実際の値に置き換える（ローカル `wrangler dev` のシミュレーションを本番と一致させるためで、ランタイムガード自体の安全性には影響しません）

上記の Access アプリケーションが未設定の間も、ランタイムガードにより全エンドポイントは 403 を返します。

## 必要な binding / 環境変数

| 名前 | 種類 | 説明 |
|---|---|---|
| `CLOUDFLARE_ACCOUNT_ID` | vars | 利用状況を取得する対象アカウントの ID |
| `COST_ALERT_THRESHOLD_USD` | vars | このドル額を超えたら警告ログを出す閾値 |
| `CLOUDFLARE_API_TOKEN` | secret | Billing Read 権限を持つ Cloudflare API トークン（[取得方法](https://developers.cloudflare.com/fundamentals/api/get-started/create-token/)） |

外部の課金 API 以外に必要な Cloudflare 側の binding（KV/D1 等）はありません。
