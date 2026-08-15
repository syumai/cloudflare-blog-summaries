# workers-ai-gateway-unification サンプル

元記事: [Workers AIとAI Gatewayを単一のAIコントロールプレーンへ統合](https://blog.cloudflare.com/workers-ai-gateway-unification/)（[Wiki](../../docs/articles/2026-08-07-workers-ai-gateway-unification.md)）

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

## 参考

- [Wiki: workers-ai-gateway-unification](../../docs/articles/2026-08-07-workers-ai-gateway-unification.md)
- [Set up your first gateway](https://developers.cloudflare.com/ai-gateway/get-started/)
- [Workers AI model catalog](https://developers.cloudflare.com/workers-ai/models/)
