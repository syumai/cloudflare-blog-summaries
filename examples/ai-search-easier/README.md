# ai-search-easier サンプル

元記事: [Cloudflare AI Search: エージェントにあなたのデータのための検索エンジンを](https://blog.cloudflare.com/ai-search-easier/)（[Wiki](../../docs/articles/2026-08-06-ai-search-easier.md)）

## これは何か

これまで Workers AI・AI Gateway・Vectorize・R2・Browser Rendering を個別に組み合わせる必要があった検索/RAGパイプラインが、`ai_search_namespaces` バインディングと `env.AI_SEARCH` の呼び出しだけで実現できるようになりました。

このサンプルは、記事内のコード例（②Workerバインディング設定、③複数インスタンス横断検索）をそのまま最小のHTTPエンドポイントにしたものです。

- `GET /search?instance=<id>&q=<query>` — 単一のAI Searchインスタンスを検索する
- `GET /search?instance=<id1>&instance=<id2>&q=<query>` — 複数インスタンスを横断検索する（記事の Dev Stack MCP と同じパターン）

## 事前準備: AI Search インスタンスの作成

検索結果を得るには、事前に対象インスタンスを作成しておく必要があります（記事内のコード例①と同じコマンド）。

```bash
npx wrangler ai-search create example-instance \
  --namespace example-ai-search \
  --source https://developers.cloudflare.com \
  --type web-crawler \
  --parse-type discover
```

`wrangler.jsonc` の `ai_search_namespaces[0].namespace` は、上記コマンドの `--namespace` と同じ値（`example-ai-search`）にしてあります。インスタンスが存在しない状態でも、この Worker 自体のデプロイ・起動には影響しません（`/search` を呼んだ時にのみエラーになります）。

## セットアップ

```bash
npm install
npx wrangler dev
```

### 動作確認

```bash
curl -s "http://localhost:8787/search?instance=example-instance&q=Workers%20AI"
```

## デプロイ

```bash
npx wrangler deploy
```

Cloudflare アカウントへのログイン (`npx wrangler login`) が必要です。追加の環境変数は不要ですが、上記の AI Search インスタンス作成が別途必要です。

## 参考

- [Wiki: ai-search-easier](../../docs/articles/2026-08-06-ai-search-easier.md)
- [Cloudflare AI Search ドキュメント](https://developers.cloudflare.com/ai-search/)
- [AI Playground](https://playground.ai.cloudflare.com)
