# agents-on-cloudflare サンプル

記事「[Cloudflare Agentsの紹介](https://blog.cloudflare.com/agents-on-cloudflare/)」（[Wiki](../../docs/articles/2026-08-04-agents-on-cloudflare.md)）に対応する、デプロイ可能な最小 Worker サンプルです。

## Demo

https://agents-on-cloudflare-example.syumai.workers.dev

Cloudflare Access により syumai@gmail.com のみ許可。未認証アクセスは 403。

## 記事との対応

記事の第一弾機能である**エージェントトレーシング**を有効化する設定（`wrangler.jsonc` の `observability.traces.enabled: true`）を実際に構成し、Workers AI バインディングでモデルを1回呼び出すだけの最小の「エージェント」を実装しています。

デプロイ後にこの Worker を呼び出すと、モデル呼び出しが Cloudflare ダッシュボードの **Agents** / **Traces** ビューにスパンとして記録されます（トレーシングはベータ期間中は無料）。

記事本文で紹介されている Think・Flue・AI SDK（`wrapAISDK()`）とのフレームワーク統合は含みません。これらを使うと、エージェント・会話・ターン・ツール実行単位のスパンが自動収集されますが、本サンプルは Workers AI バインディングを `env.AI.run()` で直接呼び出す最小構成にとどめています。

## 体験できること

- `observability.traces.enabled: true` の設定方法
- Workers AI バインディング（`env.AI`）による最小のモデル呼び出し
- デプロイ後、Cloudflareダッシュボードの Workers & Pages → 対象Worker → Agents/Traces タブでスパンが記録される様子

## セットアップ

```bash
npm install
npx wrangler dev
```

`http://localhost:8787/?q=<質問文>` にアクセスすると、Workers AI でモデルを呼び出した結果が返ります（`q` を省略すると「2日間のリスボン旅行の見どころ」を尋ねるデフォルト質問になります）。

## デプロイ

```bash
npx wrangler deploy
```

デプロイには Cloudflare アカウントへのログイン（`npx wrangler login`）と Workers AI が利用可能なアカウントが必要です。Workers AI には無料枠があり、追加の外部 API キーは不要です。

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
2. Application domain に `agents-on-cloudflare-example.syumai.workers.dev` を設定
3. Policy を追加: Action = **Allow**、Include = **Emails** = `syumai@gmail.com`
4. 保存後、Application の Overview で **Application Audience (AUD) Tag** を確認し、`wrangler.jsonc` の `access.dev.aud` を実際の値に置き換える（ローカル `wrangler dev` のシミュレーションを本番と一致させるためで、ランタイムガード自体の安全性には影響しません）

上記の Access アプリケーションが未設定の間も、ランタイムガードにより全エンドポイントは 403 を返します。

## 必要な binding

- `AI`（Workers AI バインディング。`wrangler.jsonc` の `ai.binding` で設定済み）

## 検証

```bash
npm install
npx wrangler deploy --dry-run
```

が成功することを確認済みです（実デプロイ・ログインは行っていません）。
