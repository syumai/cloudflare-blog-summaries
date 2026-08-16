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

`wrangler.jsonc` の `ai_search_namespaces[0].namespace` は、上記コマンドの `--namespace` と同じ値（`example-ai-search`）にしてあります。**インスタンス**（`wrangler ai-search create` で作る、実際にクロール・インデックス化を行うリソース）が存在しない状態でも、`/search` を呼んだ時にエラーになるだけで Worker コード自体は動作します。

ただし注意点として、`ai_search_namespaces` バインディングが参照する**名前空間**（`namespace` フィールドの値、インスタンスとは別物）が存在しない場合、`npx wrangler deploy` はこの名前空間を確認なしに自動作成（auto provisioning）します。名前空間自体の作成にクロール等の課金は伴いませんが、この動作を検証した際に実際に確認したため記録しておきます。

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

**このサンプルは現時点でデプロイを見送っています。** コード改修（Cloudflare Access ガードの追加）と `npx tsc --noEmit` / `npx wrangler deploy --dry-run` の成功確認までは完了していますが、AI Search インスタンス作成（クロール・インデックス化が走り課金対象になる）を避けるという方針のため、実デプロイは行っていません。検証時に `npx wrangler deploy` を試したところ、`ai_search_namespaces` バインディングが参照する名前空間 `example-ai-search` が存在しないと wrangler が確認なしに自動作成することを確認したため、作成された名前空間は `npx wrangler ai-search namespace delete example-ai-search --force` で削除し、デプロイ自体も `npx wrangler delete` で取り消して、インスタンス・名前空間ともに存在しない状態に戻しています。

実際にデプロイする場合は、上記の「事前準備」でインスタンスを作成する意思決定を行った上で、`npx wrangler deploy` を実行してください。

## Cloudflare Access 設定

このサンプルは [Cloudflare Access](https://developers.cloudflare.com/workers/configuration/cloudflare-access/)（参考: [Workers protected by Access](https://blog.cloudflare.com/workers-protected-by-access/)）で保護する実装が入っています。デプロイした場合、`syumai@gmail.com` 以外はすべてのエンドポイントで 403 になります。

### 実装

- 許可メールアドレスの単一ソースは [`examples/shared/allowed-emails.json`](../shared/allowed-emails.json)。
- ガード関数 [`examples/shared/access.ts`](../shared/access.ts) の `requireAllowedAccess(ctx)` を `src/index.ts` の `fetch` ハンドラー冒頭で呼び出しています。
  - `ctx.access` が `undefined`（= この Worker に Cloudflare Access アプリケーションが設定されていない）場合は 403。
  - Access 経由でも `ctx.access.getIdentity()` の `email` が allowedEmails に含まれなければ 403。
  - これにより、**Access のダッシュボード設定を忘れていても Worker 自体が fail closed で保護され**、未認証アクセスによる課金悪用が構造的に発生しません。

### 本番の Access アプリケーションを有効化する（手動・ダッシュボード。デプロイする場合）

`wrangler.jsonc` の `access.dev` は `wrangler dev` 用のローカルシミュレーションのみです。本番の Access ポリシー（どのメールアドレスを許可するか）は wrangler では設定できません（`node_modules/wrangler/config-schema.json` の `Access` 定義には `dev` 以外のフィールドがなく、`wrangler` CLI にも Access/Zero Trust を管理するサブコマンドはありません）。デプロイして本番で `syumai@gmail.com` のみアクセスできるようにする場合は、以下を手動で行ってください。

1. [Zero Trust ダッシュボード](https://one.dash.cloudflare.com/) → **Access** → **Applications** → **Add an application** → **Self-hosted**
2. Application domain にデプロイ後の Worker のドメイン（例: `example-ai-search-easier.syumai.workers.dev`）を設定
3. Policy を追加: Action = **Allow**、Include = **Emails** = `syumai@gmail.com`
4. 保存後、Application の Overview で **Application Audience (AUD) Tag** を確認し、`wrangler.jsonc` の `access.dev.aud` を実際の値に置き換える（ローカル `wrangler dev` のシミュレーションを本番と一致させるためで、ランタイムガード自体の安全性には影響しません）

上記の Access アプリケーションが未設定の間も、ランタイムガードにより全エンドポイントは 403 を返します。

## 参考

- [Wiki: ai-search-easier](../../docs/articles/2026-08-06-ai-search-easier.md)
- [Cloudflare AI Search ドキュメント](https://developers.cloudflare.com/ai-search/)
- [AI Playground](https://playground.ai.cloudflare.com)
