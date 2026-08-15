# エージェントがローカルトレースでWorkersをデバッグ可能に

- 原文: [https://blog.cloudflare.com/local-tracing/](https://blog.cloudflare.com/local-tracing/)（日本語版なし）
- 公開日: 2026-08-04
- 関連: [Agents Week 2026 まとめ](./2026-08-13-agents-week-review.md) / [Cloudflareにエージェント開発ライフサイクルの時代が到来](./2026-08-04-agent-development-lifecycle.md) / [Cloudflare Agentsの紹介](./2026-08-04-agents-on-cloudflare.md)

![記事ヘッダー画像](https://blog.cloudflare.com/_image?href=https%3A%2F%2Fblog.cloudflare.com%2F_emdash%2Fapi%2Fmedia%2Ffile%2F01KZ4VE2P2E0N8JGH2VJ245E2G.png&w=1999&h=1125&f=webp&fit=cover&position=center)
*図: 記事ヘッダー画像（出典: Cloudflare Blog https://blog.cloudflare.com/local-tracing/）*

## TL;DR

- `wrangler dev` と `vite dev` が、ローカルでのWorker呼び出しに対して自動的にOpenTelemetryトレースを生成するようになった。
- コーディングエージェントのセッションが動作していることを検出すると、CloudflareのツールはSDKのインストール・設定・プロンプトへの明示的な言及なしに、エージェントを**Local Explorer API**（ローカルデバッグ用インターフェース）へ自動的に誘導する。
- 狙いは、エージェントがデプロイ前にローカルで失敗を特定し、修正を検証できるようにすること。
- Local Explorerはブラウザ向けUIとREST APIの両方を提供し、ローカルのリソース（D1・KV・R2・Durable Objects・Workflowsなど）の閲覧・編集や、可観測性データへのSQLクエリができる。
- 基盤技術は、workerd（OSSのWorkersランタイム）への組み込み計測と、Miniflareによるローカルでの実行・トレース収集の仕組みである。SDKのインストールやコード変更なしに動作する。

## 背景・課題

エージェントがWorkersのコードを書き、動作を確認する際、これまでは「エラーが起きたことは分かるが、どこで・なぜ起きたのかが分からない」という状況に陥りがちだった。500エラーが返ってきても、それがどの処理（KVの読み取りか、D1への書き込みか、キューへの送信か）で発生したのかを特定するには、エージェントが手動でログを追加し、リクエストを再実行し、出力を確認し、それを繰り返す必要があった。これはテキストベースでのリクエストの再構成を伴う、時間とトークンを消費する作業である。

記事はこの課題に対し、`wrangler dev` / `vite dev` によるローカル開発サーバーそのものに、本番環境と同様のOpenTelemetryトレース生成機能を組み込むことで応えている。これはMiniflareの導入やWrangler 3のローカルファースト化といった、これまでの投資の延長線上にある取り組みである。

## 発表内容 / アーキテクチャ

### エージェントがLocal Explorer APIを自動発見する仕組み

開発サーバーは、対応しているコーディングエージェントのセッションを検出すると、次のようなヒントメッセージを出力する。

```text
This dev session is running in an AI agent.

The Local Explorer API is available at
http://localhost:8787/cdn-cgi/explorer/api

Debug with traces:
POST /cdn-cgi/explorer/api/local/observability/query -- query traces and logs with SQL
```

Local Explorerは、ブラウザ向けのインターフェースとREST APIの両方として機能し、ローカルのリソースの閲覧・編集や可観測性データへのクエリを行える。APIのルートはOpenAPIスキーマを提供しており、ハードコードされた指示がなくても、エージェントが実行時にエンドポイントを発見できるようになっている。自動的に記録されたトレースは、相関付けられたコンソールログとともに読み取り専用の可観測性エンドポイントに存在する。エージェントはこのテレメトリに対してクエリを実行できるほか、追加のAPI操作を通じてローカルのWorker・バインディング・D1・KV・R2・Durable Objects・Workflowsを検査できる。

### 具体例: 失敗を見つけて修正を検証する

記事では、次のようなシナリオが示されている。`POST /api/orders` エンドポイントは、KVからアクティブなカートを取得し、D1にチェックアウト内容を保存し、注文処理のためのメッセージをキューに送信する。あるスキーマ変更の後、このエンドポイントが500エラーを返すようになった。

**ローカルトレースがない場合**: 500レスポンスからはどの処理が失敗したのか分からない。エージェントはKV・D1・キューの各処理の周りに手動でログを追加し、リクエストを再実行し、出力を確認し、それを繰り返すことになる。時間とトークンを消費しながら、テキストベースでリクエストを再構成する作業になる。

**ローカルトレースがある場合**: エージェントはエラーを再現した上で、読み取り専用の可観測性エンドポイントにクエリを投げる。トレースデータから、KVの読み取りは成功したこと、D1への挿入が「no such column: delivery_window」というエラーで失敗したこと、そしてキューは一度も呼び出されなかったことが明らかになる。Local Explorer APIを使うことで、エージェントはUI上で見えるのと同じトレースデータにアクセスできる。

![Local Explorerでのトレース可視化](https://blog.cloudflare.com/_image?href=https%3A%2F%2Fblog.cloudflare.com%2F_emdash%2Fapi%2Fmedia%2Ffile%2F01KZ4VE2DX8FKHW5QXQB829PGY.png&w=715&h=394&f=webp&fit=cover&position=center)
*図: Local Explorerでのトレース可視化画面（出典: Cloudflare Blog https://blog.cloudflare.com/local-tracing/）*

エージェントはAPI経由でD1のスキーマを検査し、`delivery_window` カラムを追加するマイグレーションが存在するもののローカルには未適用であることを突き止める。マイグレーションを適用し、リクエストを再送信し、新しいトレースをクエリする。失敗の特定・環境の修正・結果の検証という一連のデバッグサイクルが、デプロイや一時的なログ追加なしに、すべてローカルで完結する。

### Local Explorerでのトレース・ログの閲覧

エージェントはAPI経由でテレメトリにクエリを投げる一方、人間はローカル開発サーバーに組み込まれたブラウザインターフェース「Local Explorer」で同じデータを視覚的に確認できる。リクエストを選択すると、スパン・タイミング・属性・エラー、および相関付けられたコンソールログとローカルのバインディング状態の検査が可能になる。

Local ExplorerはCloudflareダッシュボード上ではなく、Workerと同じlocalhostオリジン上で動作する。Wranglerで `e` キーを押すか、ローカルサーバーの `/cdn-cgi/explorer` にアクセスすることで開くことができる。

![Local Explorerのインターフェース](https://blog.cloudflare.com/_image?href=https%3A%2F%2Fblog.cloudflare.com%2F_emdash%2Fapi%2Fmedia%2Ffile%2F01KZ4VE2E11BF2S4PHMXV262T1.png&w=715&h=352&f=webp&fit=cover&position=center)
*図: Local Explorerのインターフェース（出典: Cloudflare Blog https://blog.cloudflare.com/local-tracing/）*

### 仕組みの内側

Workers Tracingは、workerd（Workersを支えるOSSランタイム）に直接組み込まれた計測機能として提供されている。SDKのインストールやコード変更なしに、ランタイムが次のスパンを自動的にキャプチャする。

- **fetch呼び出し**: すべてのアウトバウンドHTTPリクエスト。タイミング、ステータスコード、リクエストのメタデータを含む
- **バインディング呼び出し**: KV・R2・D1・Durable Objects・Queuesなど、バインディングとのすべてのやり取り
- **ハンドラー呼び出し**: `fetch`・`scheduled`・キューハンドラーなど、各呼び出しの全ライフサイクル

アプリケーションが発行するカスタムスパンも、自動生成されるスパンと並んで表示される。

WranglerとCloudflare ViteプラグインはMiniflareを使ってWorkerをローカルで（本番と同じランタイム上で）実行しているため、この計測機能はローカル開発時にもそのまま利用できる。Miniflareはランタイムのイベントとコンソール出力を収集し、それらを相関付けられたログとともにOpenTelemetryトレースへ組み立て、ローカルのトレースストアとして機能する内部のSQLiteバックエンドDurable Objectにテレメトリを書き込む。Local Explorer APIは、このデータをローカル開発サーバーを通じて公開し、エージェントがトレース・ログをクエリしたりローカルの状態を検査したりできるようにしている。

## コード例

記事にはアプリケーションコードの例は含まれていないが、機能を有効にするためのインストールコマンドと、エージェントに提示されるヒントメッセージが示されている。

### インストールコマンド

```bash
# Wrangler
npm install --save-dev wrangler@latest

# Cloudflare Vite plugin
npm install --save-dev @cloudflare/vite-plugin@latest
```

**解説**: `wrangler` または `@cloudflare/vite-plugin` を最新版に更新するだけで、ローカル開発サーバーは自動的にOpenTelemetryトレースの生成を開始する。追加のSDKインストールや設定ファイルの変更は不要であり、既存のプロジェクトに対して最小限の変更でローカルトレースを有効化できる。

### Local Explorer APIへの誘導メッセージ

```text
This dev session is running in an AI agent.

The Local Explorer API is available at
http://localhost:8787/cdn-cgi/explorer/api

Debug with traces:
POST /cdn-cgi/explorer/api/local/observability/query -- query traces and logs with SQL
```

**解説**: このメッセージは開発サーバーが標準出力に自動的に表示するものであり、人間向けのドキュメントを読ませることなく、エージェント自身がAPIのURLとクエリ方法（SQLでトレースとログを検索できること）を発見できるようにする役割を持つ。APIルートがOpenAPIスキーマを返す設計と組み合わさることで、エージェントは実行時にエンドポイント一覧を動的に把握できる。

## ユースケース

### スキーマ変更後の500エラーのデバッグ

記事内で一貫して例示されているのがこのシナリオである。`POST /api/orders` がKV読み取り・D1書き込み・キュー送信という3つの処理から成る場合、トレースなしでは失敗箇所の特定に手動ログ追加とリクエスト再実行の繰り返しが必要だが、ローカルトレースがあればSQLクエリ1回で「D1挿入がスキーマ不一致で失敗し、キューは未実行だった」ことまで即座に特定できる。

### マイグレーション未適用の検出と修正

D1のスキーマをAPI経由で検査し、マイグレーションが定義済みだが未適用であることを突き止めて適用する、という一連の流れは、ローカル環境と本番環境の状態のズレをエージェント自身が発見・修正する典型例になっている。

### デプロイ前の検証サイクルの完結

失敗の特定・環境の修正・結果の検証という一連のデバッグサイクルを、デプロイや一時的なログ追加なしにローカルだけで完結させられる点は、CI/CDパイプラインを回す前段階での「セルフチェック」としてエージェントに組み込みやすいユースケースである。

## 所感・ポイント

- 「SDKのインストール・設定・プロンプトへの明示的な言及なしに」エージェントがLocal Explorer APIを発見できるという設計は、[エージェント開発ライフサイクル（ADLC）](./2026-08-04-agent-development-lifecycle.md)で挙げられていた「プログラムから操作可能」という要件を体現した実装例といえる。
- workerdへの組み込み計測とMiniflareの活用により、SDKレスでローカル・本番両方のトレースが同じ仕組みで得られる点は、[Cloudflare Agentsの紹介](./2026-08-04-agents-on-cloudflare.md)で説明されているエージェントトレーシングとも地続きの技術基盤であり、Agents Week全体を通して「同じトレーシング基盤をローカルと本番の両方で使い回す」という一貫性が見える。
- 500エラーの原因特定を、人間が事後的にログを見て推測する作業から、エージェントがSQLクエリで直接掘り下げる作業に置き換えている点は、デバッグの主体をエージェント側に移す実践的な一歩である。
- 記事自体にはアプリケーションコードのサンプルがなく、インストールコマンドと出力メッセージの提示にとどまるため、実際のクエリの文法や返却されるトレースのJSON構造など、より踏み込んだ実装詳細は開発者ドキュメント側を参照する必要がある。

> **Workers サンプル**: [examples/local-tracing/](../../examples/local-tracing/) — KV→D1書き込みが未適用マイグレーションで失敗する様子をローカルトレースで特定する最小構成

## 関連リンク

- [OpenTelemetryトレース（開発者ドキュメント）](https://developers.cloudflare.com/workers/observability/traces/)
- [Local Explorer APIドキュメント（AIコーディングエージェントとの利用）](https://developers.cloudflare.com/workers/local-development/local-explorer/#use-with-ai-coding-agents)
- [Miniflareのブログ記事](https://blog.cloudflare.com/miniflare/)
- [Wrangler 3の発表記事](https://blog.cloudflare.com/wrangler3/)
- [Local Explorerドキュメント](https://developers.cloudflare.com/workers/local-development/local-explorer)
- [ローカル開発サーバーのセットアップ](https://developers.cloudflare.com/workers/local-development/#start-a-local-development-server)
- [Cloudflare Viteプラグインドキュメント](https://developers.cloudflare.com/workers/vite-plugin/)
- [Workers Tracingオープンベータの発表記事](https://blog.cloudflare.com/workers-tracing-now-in-open-beta/)
- [workerd（OSSリポジトリ）](https://github.com/cloudflare/workerd)
- [カスタムスパンのドキュメント](https://developers.cloudflare.com/workers/observability/traces/custom-spans/)
- [エージェント開発ライフサイクル（本リポジトリのWiki）](./2026-08-04-agent-development-lifecycle.md)
- [Cloudflare Agentsの紹介（本リポジトリのWiki）](./2026-08-04-agents-on-cloudflare.md)
