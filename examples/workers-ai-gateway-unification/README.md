# workers-ai-gateway-unification サンプル

元記事: [Workers AIとAI Gatewayを単一のAIコントロールプレーンへ統合](https://blog.cloudflare.com/workers-ai-gateway-unification/)（[Wiki](../../docs/articles/2026-08-07-workers-ai-gateway-unification.md)）

## Demo

https://example-workers-ai-gateway-unification.syumai.workers.dev

Cloudflare Access により syumai@gmail.com のみ許可。未認証アクセスは 403。

## これは何か

これまで別々のセットアップが必要だった Workers AI と AI Gateway が統合され、`env.AI.run()` の第3引数に `{ gateway: { id: "default" } }` を渡すだけで、事前にダッシュボードでゲートウェイを作成しなくても、自動的にリクエストロギング・トークン使用量・コスト帰属などの可観測性が有効になりました。

このサンプルは、記事内のコード例をそのまま Worker として動かせる形にしたものです。`POST /chat` にプロンプトを送ると、`default` ゲートウェイ経由で Workers AI のモデル（Llama 3.1 8B Instruct）を呼び出します。

## セットアップ

```bash
npm install
npx wrangler dev
```

### 動作確認

```bash
curl -s http://localhost:8787/chat \
  -H 'Content-Type: application/json' \
  -d '{"prompt": "What is the capital of France?"}'
```

## デプロイ

```bash
npx wrangler deploy
```

Cloudflare アカウントへのログイン (`npx wrangler login`) が必要です。`ai` バインディング（`wrangler.jsonc` で設定済み）以外の追加の binding や環境変数は不要です。デプロイ後、Cloudflare ダッシュボードの **AI Gateway > default** から、このサンプルが送ったリクエストのログ・トークン使用量を確認できます。

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
2. Application domain に `example-workers-ai-gateway-unification.syumai.workers.dev` を設定
3. Policy を追加: Action = **Allow**、Include = **Emails** = `syumai@gmail.com`
4. 保存後、Application の Overview で **Application Audience (AUD) Tag** を確認し、`wrangler.jsonc` の `access.dev.aud` を実際の値に置き換える（ローカル `wrangler dev` のシミュレーションを本番と一致させるためで、ランタイムガード自体の安全性には影響しません）

上記の Access アプリケーションが未設定の間も、ランタイムガードにより全エンドポイントは 403 を返します。

## 参考

- [Wiki: workers-ai-gateway-unification](../../docs/articles/2026-08-07-workers-ai-gateway-unification.md)
- [Set up your first gateway](https://developers.cloudflare.com/ai-gateway/get-started/)
- [Workers AI model catalog](https://developers.cloudflare.com/workers-ai/models/)
