# introducing-radar-researcher サンプル

元記事: [平易な言葉でインターネットデータを探索するAIツール「Radar Researcher」のご紹介](https://blog.cloudflare.com/introducing-radar-researcher/)（[Wiki](../../docs/articles/2026-08-07-introducing-radar-researcher.md)）

## Demo

https://example-introducing-radar-researcher.syumai.workers.dev

Cloudflare Access により syumai@gmail.com のみ許可。未認証アクセスは 403。

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
2. Application domain に `example-introducing-radar-researcher.syumai.workers.dev` を設定
3. Policy を追加: Action = **Allow**、Include = **Emails** = `syumai@gmail.com`
4. 保存後、Application の Overview で **Application Audience (AUD) Tag** を確認し、`wrangler.jsonc` の `access.dev.aud` を実際の値に置き換える（ローカル `wrangler dev` のシミュレーションを本番と一致させるためで、ランタイムガード自体の安全性には影響しません）

上記の Access アプリケーションが未設定の間も、ランタイムガードにより全エンドポイントは 403 を返します。

## 参考

- [Wiki: introducing-radar-researcher](../../docs/articles/2026-08-07-introducing-radar-researcher.md)
- [Cloudflare Radar](https://radar.cloudflare.com)
- [Radar API ドキュメント](https://developers.cloudflare.com/api/resources/radar)
- [Cloudflare Agents SDK](https://agents.cloudflare.com/)
