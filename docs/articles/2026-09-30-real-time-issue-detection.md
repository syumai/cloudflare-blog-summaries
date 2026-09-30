# 本番の問題を検知してエージェントへ直接送る: Workers の Issues

- 原文: [https://blog.cloudflare.com/real-time-issue-detection/](https://blog.cloudflare.com/real-time-issue-detection/)（原題: Detect and send production issues straight to your agent）
- 日本語版の出どころ: Cloudflare公式の日本語版（`https://blog.cloudflare.com/ja-jp/real-time-issue-detection/`）は確認時点で存在しなかった（404）ため、英語版（en-us）から日本語化して要約している。タイトルも筆者による訳。公開日は英語原文の datePublished（2026-09-30T13:00:00Z）に従う。
- 公開日: 2026-09-30
- 著者: Thomas Ankcorn, Maksym Makuch, Nevi Shah
- 位置づけ: Birthday Week 2026 の記事（読了目安は原文表記で 5 分）。Cloudflare Workers の組み込みエラー監視機能 **Issues**（オープンベータ）の発表
- 関連: [エージェントがローカルトレースでWorkersをデバッグ可能に](./2026-08-04-local-tracing.md)（同じ組み込み OpenTelemetry 計測。本記事のカスタム属性はこのトレースの仕組みを使う）/ [Cloudflareにエージェント開発ライフサイクルの時代が到来](./2026-08-04-agent-development-lifecycle.md)（エージェントが本番の問題まで扱う流れの総論）/ [cf のご紹介: Cloudflare API 全体を扱えるエージェント向け CLI](./2026-09-28-cloudflare-cf-cli-launch.md)（`cf observability issues` で Issues を調べられる CLI）/ [Cloudflare OS：エージェント、アプリ、作業のためのオープンプラットフォーム](./2026-08-05-cloudflare-os.md)（Workflows の 2 件の不具合に修正案を出した側）/ [インターネットには「第二の読者」がいる](./2026-09-30-agentic-web.md)（Birthday Week 2026 の総論）
- GitHub: [docs/articles/2026-09-30-real-time-issue-detection.md](https://github.com/syumai/cloudflare-blog-summaries/blob/main/docs/articles/2026-09-30-real-time-issue-detection.md)

![記事ヘッダー画像](https://blog.cloudflare.com/_emdash/api/media/file/01M3QYSQZS2E3XN2KS33WWKWGT.png)
*図: 記事ヘッダー画像。虫眼鏡と警告マーク（三角形に感嘆符）の周りにロボットたちが浮かぶ装飾イラスト（出典: Cloudflare Blog https://blog.cloudflare.com/real-time-issue-detection/。原文にキャプションはなく、説明は見た目からの筆者の推定。装飾のため、図としては扱わない）*

## TL;DR

- Cloudflare Workers に、組み込みのエラー監視 **Issues** が登場した（オープンベータ）。繰り返し起きる例外・5xx 応答・エラーログを、1 つの issue にまとめる。
- 有効化は設定 1 行（`observability.issues.enabled`）。Issues は Workers のランタイムに組み込まれており、SDK の導入もアプリのラッパーも要らない。
- issue には、エラー、スタックトレース、ログ、トレース、Worker のバージョンが付く。ここに `tracing` API でユーザー ID などのアプリ固有の文脈を足せる。
- **Automations** で、回数の閾値や「しばらく静かだった後の再発」を条件に、Claude Code・Cursor・Devin・Webhook・チャット・オンコール系へ issue を自動で送れる。Cloudflare MCP を併用すると、エージェントが関連するログとトレースを自分で問い合わせ、修正の PR まで進められる。
- Cloudflare 社内では Workflows に適用し、1 日で 2 件の不具合（マイグレーションの無限リトライ、削除処理の未完了）を見つけて修正した。

## 背景・課題

記事は、エージェントがアプリ開発を助けるようになった今、人にもエージェントにも、本番で何が壊れているかを把握する手段が必要だと述べる。コーディングエージェントはすでに、オブザーバビリティのデータを問い合わせ、リポジトリをたどり、コードを直し、テストを書き、PR を出せる。手作業で残っているのは、それらをつなぐ部分である。

- 繰り返す失敗が同じバグから来ていると気づく
- 関連するログとトレースを集める
- その文脈をエージェントに渡す
- 修正が効いたかを確かめる

この「構造化された引き渡し」がないと、エージェントは生のテレメトリを自分で探し回り、失敗の範囲と文脈を復元するところから始めなければならない。Issues は、この引き渡しを自動化する位置づけである。

## 発表内容 / アーキテクチャ

### 全体の流れ

![Issues の流れを示す 5 段階の図](https://blog.cloudflare.com/_emdash/api/media/file/01M3QYT05Y21ZDERDW929GEFN1.png)
*図: 本番の Worker から人による確認までの 5 段階。1 Production Worker（例外・5xx・エラーログが起きる）→ 2 Detect and group（関連する失敗が、診断情報つきの 1 つの issue になる）→ 3 Route the issue（Automation のトリガー、または手動で、設定した送り先へ）→ 4 Investigate（コーディングエージェントがコードとテストの変更を提案し、PR を出す。任意で Cloudflare MCP を併用）→ 5 Review and deploy（チームが提案を確認し、本番に出すものを決める）。ラベルは 1 が PRODUCTION、2〜3 が CLOUDFLARE AUTOMATION、4 が AGENT-ASSISTED、5 が HUMAN CONTROL（出典: Cloudflare Blog https://blog.cloudflare.com/real-time-issue-detection/。原文にキャプションはなく、図中の文言の筆者による日本語訳。図の見出しの位置づけは原文本文に基づく）*

### 失敗を自動でつかまえる

- [設定 1 行](http://developers.cloudflare.com/workers/observability/issues/#enable-issues)で、追加の計装なしに、Worker で検出された Issues を受け取れる。Issues は Workers ランタイムに組み込まれているので、SDK もラッパーも不要。
- 有効にすると、Issues は次を記録する。
  - 未処理の例外
  - 失敗した呼び出し
  - HTTP 5xx 応答
  - `console.log()` と `console.error()` の出力
  - スタックトレースを含むログ
- さらに、**暴走するアラーム**の状態と、**ループの中で大量のログを書き込むコード**も検出して知らせる。
- 例: デプロイ後にハンドラがエラーを投げ始めたとき、失敗したリクエストごとにリクエスト ID は違っても、原因は同じバグである。Issues はそれらを 1 つにまとめ、いつ初めて現れたか、何回起きたか、頻度が増えているかを示す。

![Issues 一覧のダッシュボード画面](https://blog.cloudflare.com/_emdash/api/media/file/01M3QYT25VMJ2V35QMW8F4E6HC.png)
*図: Worker「portal-prod」の Issues タブ。上部に Latest occurrence（4 minutes ago）、Active issues（244）、Active occurrences（93.64k）、Resolved issues（0）の集計があり、下に Type・Issue・Events（件数と推移のスパークライン）・Last seen・Status の表が並ぶ。行の例は「Worker exceeded CPU time limit.」（748 件）、「TimeoutError · The operation was aborted due to timeout」（3.57k 件）、「Portal failure」（23.72k 件）など（出典: Cloudflare Blog https://blog.cloudflare.com/real-time-issue-detection/。原文にキャプションはなく、説明は画面の見た目からの筆者による記述）*

issue を開くと、エラー、（あれば）スタックトレース、直前までのログとトレース、Worker のバージョン、リクエストの詳細、時間経過による件数の推移が見られる。

![issue の詳細画面](https://blog.cloudflare.com/_emdash/api/media/file/01M3QYT4ESTTWJM2TD7B3D0PVE.png)
*図: issue の詳細画面。左に Latest occurrence（TimeoutError、Unhandled exception、Context、Execution trail、Invocation metadata）、右に Summary（期間中の件数の棒グラフ、Total occurrences 3.57k、Last seen、Send to、Activity、Breakdown）が並ぶ。Execution trail には `POST /telemetry/query`、jsRpcCall、fetch、Event、「The operation was aborted due to timeout」が時刻つきで載る。Context 欄は「No application context found」で、ユーザー・テナント・セッション ID の追加を促している（出典: Cloudflare Blog https://blog.cloudflare.com/real-time-issue-detection/。原文にキャプションはなく、説明は画面の見た目からの筆者による記述）*

### エージェントに向けて、エラーの文脈を足す

Cloudflare は Worker の中で何が起きたかは捕捉できるが、アプリにとってどのユーザー・アカウント・セッションが重要かは知らない。そこで、Worker ランタイム（[workerd](https://github.com/cloudflare/workerd)）に組み込まれた OpenTelemetry API で識別子を足す。追加のパッケージは要らない（[カスタムスパン](https://developers.cloudflare.com/workers/observability/traces/custom-spans/)）。

追加した識別子は、各 occurrence に表示される。これにより、失敗が特定のアカウントやセッションに集中していないかを、エージェントへ送る前に確かめられる。

![Context にユーザー ID とセッション ID が表示された画面](https://blog.cloudflare.com/_emdash/api/media/file/01M3QYSXV0EC5ECJM87EFHNGWB.png)
*図: Context 欄に User ID（`usr_8f2a1c9d`）と Session ID（`sess_01JQ9CX7P4R8N2KM`）が表示された occurrence。Execution trail には `GET /` と「Unexpected end of JSON input」が載る（出典: Cloudflare Blog https://blog.cloudflare.com/real-time-issue-detection/。原文にキャプションはなく、説明は画面の見た目からの筆者による記述）*

### 検出した issue をエージェントへ送る

issue を画面で眺めて、スタックトレースをコピーしてプロンプトに貼る、という手間をなくす。[Automations](http://developers.cloudflare.com/workers/observability/issues/automations/) を一度設定しておくと、issue が**回数の閾値**を超えたとき、または**しばらく静かだった後に再発**したときに、issue がそのままエージェントへ送られる。いつ動かすか、どこへ送るかを選べる。

送り先は次のとおり。

- **組み込みのコーディングエージェント**: [Claude Code](https://code.claude.com/docs/en/routines#add-an-api-trigger)（routine ID とトークン）、[Cursor](https://cursor.com/docs/cloud-agent/automations#webhook-triggers)（Automation の Webhook URL）、[Devin](https://docs.devin.ai/api-reference/authentication)（API トークンと組織 ID）
- **汎用 Webhook**: 自前のエージェントや HTTPS エンドポイントへ issue の文脈を送る
- **チャットとインシデント管理**: チャットやオンコールの流れでチームに通知する

![Automation の作成ダイアログから送り先の選択までの 3 画面](https://blog.cloudflare.com/_emdash/api/media/file/01M3QYST2KRKZ4KS08A9FCW90K.png)
*図: 左から「Create automation」（Trigger に Occurrence threshold、閾値 1 occurrence、Send to に送り先の選択、Enabled のトグル）→「Setup integration」（Generic Webhook、Coding Agent、Chat、Incident Management、Cloudflare Workers は Coming soon）→「Coding Agent」（Claude Code、Cursor、Devin）の 3 画面が矢印でつながる（出典: Cloudflare Blog https://blog.cloudflare.com/real-time-issue-detection/。原文にキャプションはなく、説明は画面の見た目からの筆者による記述）*

Automation が動くと、Issues は issue と一緒に捕捉した診断の文脈を送る。内容は、例外・エラー、ソースマップ済みのスタックトレース、前後のログとトレース、Worker のバージョン、上で足したアプリの文脈である。さらに調べたいときは、エージェントを別途 [Cloudflare MCP](https://github.com/cloudflare/mcp-server-cloudflare/tree/main/apps/workers-observability) に接続する。すると、エージェントが関連するログとトレースを自分で問い合わせ、コードとテストの変更案を作り、PR を出せる。

本番に何が出るかは人が握る。PR をレビューし、修正をデプロイし、issue を解決済みにするのは人である。

### 事例: 1 日で 2 件の Workflows の不具合を見つけた

[Cloudflare Workflows](https://developers.cloudflare.com/workflows/) は、長く動く複数ステップのアプリを支える仕組みで、Workers プラットフォームの上に完全に作られている。裏ではサービス群が、ステップ・リトライ・保存された状態を管理している。そのため、Issues を自社の本番システムで試すのに向いていた。有効にして 1 日のうちに、大量のトラフィックに埋もれた 2 件の珍しい問題が見つかった。

1. **リトライの無限ループに入ったマイグレーション**: Workflows のコントロールプレーンのマイグレーションが、ある境界的な状況で適用しようとして、SQLite の外部キーのエラーを繰り返し起こしていた。
2. **終わらない削除処理**: Workflow インスタンスの削除中に、Workers のサブリクエスト上限を超えて処理が完了しなくなる境界的なケースがあった。

どちらも、チームが何千もの個別のテレメトリやユーザーからの報告をつなぎ合わせる代わりに、Automation の設定で issue が [Cloudflare OS](./2026-08-05-cloudflare-os.md) に直接送られた。Cloudflare OS がエラーを Workflows のコードまでたどり、2 件とも修正案を出した。

## コード例

記事中のコードは、アプリ固有の識別子を issue に足す `tracing` API の 1 例（TypeScript）のみ。

```ts
import { tracing } from "cloudflare:workers";

export default {
  async fetch(request: Request): Promise<Response> {
    const { userId, accountId, sessionId } = await getAuthDetails(request);
    const span = tracing.getActiveSpan();
    span?.setAttribute("user.id", userId);
    span?.setAttribute("account.id", accountId);
    span?.setAttribute("session.id", sessionId);
    return handleRequest(request);
  },
} satisfies ExportedHandler;
```

- `cloudflare:workers` から `tracing` を import する。追加パッケージは不要。
- `tracing.getActiveSpan()` で、いま動いているリクエストのスパンを取り、`setAttribute` で `user.id`・`account.id`・`session.id` を付ける。`span?.` と書くのは、アクティブなスパンがない場合に備えたオプショナルチェーンである（記事は理由を書いていないため、この点は筆者の読み）。
- 付けた属性は、各 occurrence の Context に出る（上の図の User ID・Session ID）。

有効化と、エージェントに最初の issue を直させるための手順も記事に書かれている。

- 有効化: `wrangler.jsonc` で `observability.issues.enabled` を `true` にする（原文の文言は「Set `observability.issues.enabled` to true in your wrangler.jsonc file」）。
- エージェントに渡すプロンプト（記事内の「Copy prompt: Set up for cf」ボタンの中身。原文の表記のまま）:

```text
Set up cf: https://developers.cloudflare.com/cf/. Enable Issues for this Worker in cloudflare.config.ts; show the diff and ask before deploying. After approved deployment, wait 1 minute, then find the most frequent issue and retrieve an occurrence using its returned ID:

cf observability issues list --order-by count --order desc --per-page 1
cf observability issues occurrences <ISSUE_ID> --per-page 1

If no issues exist, report that. Otherwise, diagnose from the details, fix locally, run relevant checks, and show the diff and results. Ask before deploying the fix.
```

このプロンプトは、[cf CLI](./2026-09-28-cloudflare-cf-cli-launch.md) で Issues を有効にし、最も件数の多い issue とその occurrence を取得させ、ローカルで直して確認まで進めさせる。デプロイ前には必ず人に確認を求める。`cloudflare.config.ts` という設定ファイル名は、ここで初めて出てくる（`wrangler.jsonc` との関係を記事は説明していない）。

## ユースケース

- **デプロイ直後の不具合の把握**: 新しいバージョンで例外が増えたとき、リクエスト ID の違う失敗を 1 つの issue にまとめ、いつから・何回・増加傾向かを見る。
- **影響範囲の見極め**: `user.id`・`account.id`・`session.id` を足しておき、失敗が特定のアカウントやセッションに集中しているかを確認してから、エージェントに渡す。
- **エージェントによる修正の自動化**: 閾値を超えた issue を Claude Code・Cursor・Devin に送り、調査から PR 作成まで進めさせる。人は PR のレビューとデプロイを担う。
- **チームへの通知**: チャットやインシデント管理・オンコールの流れに issue を流す。
- **稀な境界ケースの発見**: Workflows の事例のように、大量のトラフィックに埋もれたマイグレーションの無限リトライや、サブリクエスト上限による削除の未完了を拾う。
- **暴走の検知**: 止まらないアラームや、ループでの大量ログ出力のようなコードの問題を知る。

## 所感・ポイント

- 「エラー監視」を外部 SDK ではなくランタイムの機能にしたのが要点。Sentry のような SDK 導入型と違い、設定 1 行で始められ、アプリの起動前や SDK 自体が動かない失敗も拾える可能性がある（ただし記事は外部サービスとの比較を書いていないため、これは筆者の推測）。
- Issues の役割は「検知してまとめ、文脈つきで渡す」まで。修正の提案と PR はエージェント、レビューとデプロイは人、という分担が図にも明示されている。
- エージェントが生のログを探し回る代わりに、例外・ソースマップ済みスタックトレース・前後のログとトレース・Worker のバージョンが最初から揃って届く点が、調査のコストを下げる。
- オープンベータなので、仕様や送り先の一覧は変わりうる。図では Automation の送り先に Cloudflare Workers が「Coming soon」と表示されている。
- 日本語話者の開発者向けの補足として、Issues の検出対象と Automations の設定は、関連記事の [ローカルトレース](./2026-08-04-local-tracing.md)（開発中のデバッグ）と使い分けると理解しやすい。ローカルトレースは手元の開発時、Issues は本番を対象にする。
- **サンプル**: [examples/real-time-issue-detection/](../../examples/real-time-issue-detection/)。`observability.issues.enabled` の設定と、記事のコード例の形で属性を付ける最小 Worker（意図的に例外を起こすエンドポイントつき）。`wrangler 4.145.0` で `wrangler deploy --dry-run` と型チェックが通ることを確認した。Issues の検出と Automations は Cloudflare 側の機能のため、エージェントへの送信まではサンプルに含まない。

## 関連リンク

- [Issues のドキュメント](http://developers.cloudflare.com/workers/observability/issues/)（[有効化](http://developers.cloudflare.com/workers/observability/issues/#enable-issues)、[Automations](http://developers.cloudflare.com/workers/observability/issues/automations/)）
- [カスタムスパンのドキュメント](https://developers.cloudflare.com/workers/observability/traces/custom-spans/)
- [Cloudflare MCP（workers-observability）](https://github.com/cloudflare/mcp-server-cloudflare/tree/main/apps/workers-observability)
- [Cloudflare Workflows](https://developers.cloudflare.com/workflows/)
- [workerd](https://github.com/cloudflare/workerd)
- 連携先: [Claude Code の routine（API トリガー）](https://code.claude.com/docs/en/routines#add-an-api-trigger) / [Cursor の Automations（Webhook トリガー）](https://cursor.com/docs/cloud-agent/automations#webhook-triggers) / [Devin の API 認証](https://docs.devin.ai/api-reference/authentication)
- 関連記事: [cf のご紹介](./2026-09-28-cloudflare-cf-cli-launch.md) / [Cloudflare OS](./2026-08-05-cloudflare-os.md) / [ローカルトレース](./2026-08-04-local-tracing.md) / [エージェント開発ライフサイクル](./2026-08-04-agent-development-lifecycle.md)
- Workers サンプル: [examples/real-time-issue-detection/](../../examples/real-time-issue-detection/)
