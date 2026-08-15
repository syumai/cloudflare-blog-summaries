# introducing-radar-researcher サンプル

元記事: [平易な言葉でインターネットデータを探索するAIツール「Radar Researcher」のご紹介](https://blog.cloudflare.com/introducing-radar-researcher/)（[Wiki](../../docs/articles/2026-08-07-introducing-radar-researcher.md)）

## これは何か

Radar Researcher 本体は、Cloudflare Agents SDK・Durable Objects・複数モデルのフォールバック・Cloudflare MCP server・Code Mode を組み合わせた大規模なアプリケーションで、100行程度のサンプルでは全体を再現できません。

このサンプルは、記事が示す最も重要な設計上のポイント――**言語モデルに数値そのものを出力させず、Radar APIのエンドポイントを参照する「チャート仕様」（`radar-chart` ブロック）を発行させ、実データは常にAPI呼び出しで取得する**というハルシネーション対策の核心部分だけを最小構成で再現したものです。

`POST /ask` に質問を送ると、

1. Workers AI が、記事と同じ形式の `radar-chart` ブロック（具体的な数値は書かない）を含む短い説明を生成する
2. Worker が実際に Cloudflare Radar API から実データを取得し、レスポンスに埋め込んで返す

という2段構成になっており、モデルの出力（文章・チャート仕様）と実データの取得を分離する設計を体験できます。

## セットアップ

```bash
npm install
```

実データを取得するには、Radar APIを呼び出せる Cloudflare API トークンが必要です（任意。未設定でもモデルの応答自体は取得できます）。

```bash
npx wrangler secret put RADAR_API_TOKEN
```

```bash
npx wrangler dev
```

### 動作確認

```bash
curl -s http://localhost:8787/ask \
  -H 'Content-Type: application/json' \
  -d '{"question": "ポルトガルのインターネット品質はどうなっていますか？"}'
```

## デプロイ

```bash
npx wrangler deploy
```

Cloudflare アカウントへのログイン (`npx wrangler login`) が必要です。`ai` バインディング（`wrangler.jsonc` で設定済み）以外に、実データ取得を有効にする場合は `RADAR_API_TOKEN` の設定が必要です。

## 参考

- [Wiki: introducing-radar-researcher](../../docs/articles/2026-08-07-introducing-radar-researcher.md)
- [Cloudflare Radar](https://radar.cloudflare.com)
- [Radar API ドキュメント](https://developers.cloudflare.com/api/resources/radar)
- [Cloudflare Agents SDK](https://agents.cloudflare.com/)
