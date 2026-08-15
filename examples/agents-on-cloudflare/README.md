# agents-on-cloudflare サンプル

記事「[Cloudflare Agentsの紹介](https://blog.cloudflare.com/agents-on-cloudflare/)」（[Wiki](../../docs/articles/2026-08-04-agents-on-cloudflare.md)）に対応する、デプロイ可能な最小 Worker サンプルです。

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

## 必要な binding

- `AI`（Workers AI バインディング。`wrangler.jsonc` の `ai.binding` で設定済み）

## 検証

```bash
npm install
npx wrangler deploy --dry-run
```

が成功することを確認済みです（実デプロイ・ログインは行っていません）。
