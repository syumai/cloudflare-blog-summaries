# clef-decision-models サンプル

記事「[Introducing Clef: our open-source decision models, and new RL fine-tuning platform](https://blog.cloudflare.com/clef-decision-models/)」（[Wiki](../../docs/articles/2026-10-01-clef-decision-models.md)）に対応する、最小の Worker サンプルです。

## 記事との対応

- `src/index.ts`: Workers AI の Workers binding（`env.AI.run("@cf/cloudflare/clef", ...)`）から Clef を呼び出し、`state`（分類対象のテキスト）と、型付きの質問（`noul` / `choice` / `score`）を渡して確率付きの答えを得る。質問のスキーマは記事の curl 例と同じ。
- リクエスト形式は記事本文および Workers AI のモデルページ（<https://developers.cloudflare.com/workers-ai/models/clef/>）の Usage に従っています。`type: "noul"` はドキュメントの表記のとおりです。

## セットアップ

前提: Cloudflare アカウントと `wrangler login`。Workers AI binding（`AI`）は `wrangler.jsonc` で宣言済みです。

```bash
npm install
npx wrangler deploy
```

## 体験手順

`curl 'https://<your-worker>.workers.dev/?state=Please%20send%20me%20last%20month%27s%20invoice'` のように `state` を変えて、`team` の確率や `urgent` の確率がどう変わるかを見る。

この環境では実際の Clef の呼び出し（Workers AI の利用）は行っておらず、`wrangler deploy --dry-run` と型チェックのみ確認しています。
