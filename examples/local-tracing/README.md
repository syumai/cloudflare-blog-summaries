# local-tracing サンプル

記事「[エージェントがローカルトレースでWorkersをデバッグ可能に](https://blog.cloudflare.com/local-tracing/)」（[Wiki](../../docs/articles/2026-08-04-local-tracing.md)）に対応する、デプロイ可能な最小 Worker サンプルです。

## Demo

https://local-tracing-example.syumai.workers.dev

Cloudflare Access により syumai@gmail.com のみ許可。未認証アクセスは 403。

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
```

記事のシナリオ（マイグレーション未適用による失敗）を再現するため、リモート D1 には意図的に `0001_create_orders.sql` のみを適用しており、`0002_add_delivery_window.sql` は未適用のままにしています。そのため、デプロイ済みの `POST /api/orders` はマイグレーション未適用の状態を再現したままです。`0002` まで適用してデプロイ後の失敗を解消したい場合のみ、以下を実行してください。

```bash
npx wrangler d1 migrations apply local-tracing-example-db --remote
```

## Cloudflare Access 設定

このサンプルは [Cloudflare Access](https://developers.cloudflare.com/workers/configuration/cloudflare-access/)（参考: [Workers protected by Access](https://blog.cloudflare.com/workers-protected-by-access/)）で保護されており、`syumai@gmail.com` 以外はすべてのエンドポイントで 403 になります。

### 実装

- 許可メールアドレスの単一ソースは [`examples/shared/allowed-emails.json`](../shared/allowed-emails.json)。
- ガード関数 [`examples/shared/access.ts`](../shared/access.ts) の `requireAllowedAccess(ctx)` を `src/index.ts` の `fetch` ハンドラー冒頭で呼び出しています。
  - `ctx.access` が `undefined`（= この Worker に Cloudflare Access アプリケーションが設定されていない）場合は 403。
  - Access 経由でも `ctx.access.getIdentity()` の `email` が allowedEmails に含まれなければ 403。
  - これにより、**Access のダッシュボード設定を忘れていても Worker 自体が fail closed で保護され**、未認証アクセスによる課金悪用が構造的に発生しません。

### 本番の Access アプリケーションを有効化する（手動・ダッシュボード）

`wrangler.jsonc` の `access.dev` は `wrangler dev` 用のローカルシミュレーションのみです。本番の Access ポリシー（どのメールアドレスを許可するか）は wrangler では設定できません（`node_modules/wrangler/config-schema.json` の `Access` 定義には `dev` 以外のフィールドがなく、`wrangler` CLI にも Access/Zero Trust を管理するサブコマンドはありません）。本番で `syumai@gmail.com` のみアクセスできるようにするには、以下を手動で行ってください。

1. [Zero Trust ダッシュボード](https://one.dash.cloudflare.com/) → **Access** → **Applications** → **Add an application** → **Self-hosted**
2. Application domain に `local-tracing-example.syumai.workers.dev` を設定
3. Policy を追加: Action = **Allow**、Include = **Emails** = `syumai@gmail.com`
4. 保存後、Application の Overview で **Application Audience (AUD) Tag** を確認し、`wrangler.jsonc` の `access.dev.aud` を実際の値に置き換える（ローカル `wrangler dev` のシミュレーションを本番と一致させるためで、ランタイムガード自体の安全性には影響しません）

上記の Access アプリケーションが未設定の間も、ランタイムガードにより全エンドポイントは 403 を返します。

## 必要な binding

- `CARTS`（KV Namespace。実際に作成済みの namespace ID を `wrangler.jsonc` に設定済み）
- `DB`（D1 Database。実際に作成済みのデータベース ID を `wrangler.jsonc` に設定済み。マイグレーションは記事のシナリオを再現するため `0001_create_orders.sql` のみリモートに適用しており、`0002_add_delivery_window.sql` は意図的に未適用のままにしています）

## 検証

```bash
npm install
npx tsc --noEmit
npx wrangler deploy --dry-run
```

が成功することを確認済みです。実デプロイも行い（`npx wrangler deploy`）、KV namespace・D1 データベースを実際に作成した上で `0001` マイグレーションのみリモート適用しています。デプロイ後、認証なしアクセスが 403 になることも確認済みです。
