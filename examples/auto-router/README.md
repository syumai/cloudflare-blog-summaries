# auto-router サンプル

記事「[AI Gateway の Auto Router で AI 支出を削減する](https://blog.cloudflare.com/auto-router/)」（[Wiki](../../docs/articles/2026-09-30-auto-router.md)）に対応する、最小の Worker サンプルです。Auto Router は記事の時点でパブリックベータ（ベータ期間中は無料）です。

## 記事との対応

- `src/index.ts`: 記事の「モデルに `cloudflare/auto` を指定する」使い方を、Worker から AI Gateway の OpenAI 互換エンドポイント（`/compat/chat/completions`）に対して再現する。選ばれたモデルと理由は、ドキュメントにある応答ヘッダー `cf-aig-routed-model` / `cf-aig-routing-reason` / `cf-aig-routing-decision-id` から読み取って返す。
- リクエスト形式とヘッダーは記事本文ではなく、記事からリンクされている[ドキュメント](https://developers.cloudflare.com/ai-gateway/features/auto-router/)の記載に従っています。

## セットアップ

前提: Cloudflare アカウント、AI Gateway のゲートウェイ（ダッシュボードで作成）、`wrangler login`。

1. `wrangler.jsonc` の `CLOUDFLARE_ACCOUNT_ID` と `CLOUDFLARE_GATEWAY_ID` を自分の値に置き換える。
2. API トークンを登録する: `npx wrangler secret put CLOUDFLARE_API_TOKEN`（ゲートウェイの認証に使う）。
3. デプロイする。

```bash
npm install
npx wrangler deploy
```

## 体験手順

`curl 'https://<your-worker>.workers.dev/?q=hello'` のように、簡単な質問と複雑な質問（例: 複数ファイルにまたがるコードの設計）を送り、`routedModel` と `routingReason` がどう変わるかを見る。ゲートウェイ側の設定（利用可能なモデル・課金設定・支出上限）によって結果は変わります。

この環境では実際の Auto Router の呼び出しは行っておらず、`wrangler deploy --dry-run` と型チェックのみ確認しています。
