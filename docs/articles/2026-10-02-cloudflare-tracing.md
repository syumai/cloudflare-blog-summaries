# Cloudflare Traces の紹介: プラットフォーム全体でリクエストを追跡する

- 原文: [https://blog.cloudflare.com/cloudflare-tracing/](https://blog.cloudflare.com/cloudflare-tracing/)（原題: Introducing Cloudflare Traces: follow requests through our entire platform）
- 日本語版の出どころ: Cloudflare公式の日本語版（`https://blog.cloudflare.com/ja-jp/cloudflare-tracing/`）は確認時点で存在しなかった（404）ため、英語版（en-us）から日本語化して要約している。タイトルも筆者による訳。公開日は英語原文の datePublished（2026-10-02T13:00:00Z）に従う。
- 公開日: 2026-10-02
- 著者: Mar Witek、Dan Lapid、Nevi Shah、Daniel Walsh
- 位置づけ: Birthday Week 2026 の記事（読了目安は原文表記で 7 分）。Cloudflare Traces（ドメイン単位の自動トレーシング）のオープンベータ発表
- 関連: [エージェントがローカルトレースでWorkersをデバッグ可能に](./2026-08-04-local-tracing.md)（Workers の組み込み OpenTelemetry 計測をローカルで使う記事。本記事は同じ計測を HTTP リクエスト経路全体に広げる位置づけ）/ [本番の問題を検知してエージェントへ直接送る: Workers の Issues](./2026-09-30-real-time-issue-detection.md)（同じ `cloudflare:workers` の `tracing` API でトレースにアプリ固有の属性を足す記事。Issues は本記事のトレースを材料にする）/ [Cloudflare Agentsの紹介](./2026-08-04-agents-on-cloudflare.md)（エージェントのトレーシング基盤）/ [Cloudflareにエージェント開発ライフサイクルの時代が到来](./2026-08-04-agent-development-lifecycle.md)（エージェントが本番テレメトリを扱う流れの総論）
- GitHub: [docs/articles/2026-10-02-cloudflare-tracing.md](https://github.com/syumai/cloudflare-blog-summaries/blob/main/docs/articles/2026-10-02-cloudflare-tracing.md)

![記事ヘッダー画像](https://blog.cloudflare.com/_emdash/api/media/file/01M3XE9TZRDPWVKPPQNAVJDCYT.01M3XE9W5HREEF8Q70M7G034M2.png)
*図: 記事ヘッダー画像。ブラウザ風ウィンドウの上に大きな虫眼鏡の輪があり、中央に双眼鏡を持つロボットが描かれている。周囲を点線の経路がチェックマーク・バツ印・歯車・タグなどのアイコンをつないでいる装飾イラスト（出典: Cloudflare Blog https://blog.cloudflare.com/cloudflare-tracing/。原文にキャプションはなく、説明は見た目からの筆者の推定。装飾のため、図としては扱わない）*

## TL;DR

- **Cloudflare Traces** がオープンベータになった。Workers だけだった自動トレーシングを、セキュリティルール・変換・キャッシュ・ルーティング・Worker 実行・オリジン処理を含む HTTP リクエスト経路全体に広げる。
- 対応する各ステップが span として 1 つのリクエスト単位のタイムラインに記録される。**追加の計装・設定・プラグインは不要**で、ドメインで有効化するだけでよい。
- 基準のサンプリング率に加え、**Trace Rules**（Cloudflare Rules 言語）で特定のホスト名・IP・ヘッダーなどに一致するリクエストだけ 100% 取る、といった上書きができる。
- W3C `traceparent` ヘッダーの受け入れと転送で、自社サービスやオリジンまで 1 つのトレースにつなげられる。span は OTLP でそのまま任意のバックエンドへエクスポートできる。
- 料金は取り込み量と保持期間ベースの統一モデル（2026年12月1日から。Workers Tracing も対象）。Free は 1 日 0.5 GB・7 日保持、Paid / Enterprise は 50 GB・10 GB-month を含み、超過は $0.25 / GB 取り込み、$0.10 / GB-month 保存。

## 背景・課題

Cloudflare の内部チームは、1 つのトレースに数千の span が含まれ、数十のサービス・機能が生成する内部トレースで調査している。記事は、この種の可視性を内部だけに留めない、という動機を述べる。

その第一歩が Workers Tracing で、昨年 Worker の呼び出しの自動計装（アウトバウンド fetch や KV・R2・D1・Durable Objects・他の Workers の呼び出しを含む）を提供した。ただし、これは Workers ランタイム内の処理だけを見せる。Cloudflare を使う多くの人は、Worker を書かず「オリジンの前に Cloudflare を置いている」だけである。

その場合に困る点を、記事は次のように挙げる。

- リクエストが Cloudflare のセキュリティルール・変換・ルーティング・キャッシュなどを通るとき、どの設定がどう効いたのかが、個別のログと設定を突き合わせないと分からない。
- 自分で設定した Cloudflare の挙動が、処理時間やルーティングの判断にどう影響するかを結びつけにくい。
- 分散トレーシングへの要望が最も多く、Cloudflare に入り、プラットフォームを通り、自分のスタックの残りへ続く 1 本のトレースが求められていた。

## 発表内容 / アーキテクチャ

### Cloudflare Traces の機能

記事冒頭で、次の 5 点が挙げられている。

| 機能 | 内容 |
|---|---|
| 自動トレース | 対応するプラットフォームの操作を 1 つのリクエスト単位のタイムラインに記録する。追加設定は不要 |
| トレース対象の制御 | 基準のサンプリング率を決め、Trace Rules で一致するトラフィックだけ上書きする |
| トレースコンテキストの伝播 | W3C `traceparent` ヘッダーを受け入れ、転送する |
| Cloudflare 内での調査 | ダッシュボードでリクエストのタイムラインと span の詳細を見る |
| OpenTelemetry でのエクスポート | OTLP 互換のエンドポイントなら任意の宛先へ span を送れる |

有効化は、ダッシュボードの任意のドメインでできる。記事にはコーディングエージェントに設定を任せるためのコピー用プロンプトも付いている（プロンプトの中身は記事の HTML からは確認できない）。

![トレースのウォーターフォールと span の詳細パネル](https://blog.cloudflare.com/_emdash/api/media/file/01M3XE76PJXWGQ86MMXRXPYYED.png)
*図: Cloudflare ダッシュボードのトレース画面。左に span のウォーターフォール、右に選択した span の詳細パネルがある。ルートは `cloudflare_request https://blobflare.com/tracing-demo`（766.16ms）で、子に `http_request_dynamic_redirect`、`http_request_transform`、`page_rules`、`http_config_settings`、`http_request_redirect`、`http_request_late_transform`、`workers_routing`、`upstream`（754.02ms、中に `GET https://blobflare.com/tracing-demo` の 739ms）、`response`（`http_response_headers_transform`、`http_response_compression`）が並ぶ。右は `cloudflare_request` の詳細で、service が `edge_processing`、trigger が `http`、同一種別の 45419 span との比較（最小 2ms〜最大 2.22s）、`cloud.provider`・`cloud.platform` などの属性が見える（出典: Cloudflare Blog https://blog.cloudflare.com/cloudflare-tracing/。原文にキャプションはなく、説明は画像の見た目からの筆者による記述）*

### 1 つのリクエストを端から端まで追う

リクエストは Cloudflare の中で、セキュリティルール、変換、ルーティング、キャッシュ、他サービスへのプロキシなどを通る。Cloudflare Traces は対応する各ステップを span として記録し、所要時間・結果・関連する属性を持たせる。記事は、これで答えられる問いを 4 つ挙げている。

**1. リクエストがブロック・チャレンジされた理由と、動作したセキュリティルールは何か**

カスタムルールやマネージドルールがリクエストをいつ評価し、評価にどれだけかかり、どんなアクションになったかが分かる。ブロックやチャレンジの原因ルールは、span の event から特定できる。

![セキュリティルールの span と event](https://blog.cloudflare.com/_emdash/api/media/file/01M3XE7C96A091RSXKVQZ6Z146.png)
*図: ルート `cloudflare_request`（3.37ms）の下に `http_request_transform`、`page_rules`、`http_request_firewall_custom`（35.52μs、1 event）、`response`（1.11ms、中に `http_response_compression`）が並ぶトレース。`http_request_firewall_custom` を選択し、右の Events タブに `cloudflare.rule.ref=...` を含む event と、その JSON（`cloudflare.rule.ref` 属性）が表示されている（出典: Cloudflare Blog https://blog.cloudflare.com/cloudflare-tracing/。原文にキャプションはなく、説明は画像の見た目からの筆者による記述）*

**2. URL が Transform Rule で書き換えられてからアプリに届いたか**

`http_request_transform` span を開くと、変更ごとに、影響を受けたリクエストの構成要素と、原因のルールが見える。変換が、ルーティングやオリジン処理に対してどの段階で起きたかも分かる。

![Transform Rule の span と event](https://blog.cloudflare.com/_emdash/api/media/file/01M3XE79N2WXESWBXHEV6S25AC.png)
*図: ルート `cloudflare_request`（152.81ms）の下に `http_request_transform`（44.98μs、3 events）、`page_rules`、`http_request_firewall_custom`、`http_request_redirect`、`http_request_late_transform`（5 events）、`http_request_snippets`、`workers_routing`、`upstream`（149.39ms）、`response` が並ぶ。`http_request_transform` を選択し、Events (3) に `cloudflare.transform.component=path, ...` と `cloudflare.rule.ref=...` の event が見える（出典: Cloudflare Blog https://blog.cloudflare.com/cloudflare-tracing/。原文にキャプションはなく、説明は画像の見た目からの筆者による記述）*

**3. どの Page Rules・Snippets・Workers がリクエストを処理・変更したか**

`workers_routing` span で、ルートが一致したか、どの種類のルーティングか、一致したルートのパターンが分かる。

![workers_routing span の属性](https://blog.cloudflare.com/_emdash/api/media/file/01M3XE7AY2H6B2DZ17WTVVPJ7Q.png)
*図: `workers_routing`（30.5μs）を選択した画面。右の属性欄に `cloudflare.workers.routing.preview = false`、`cloudflare.workers.routing.outcome = "matched"`、`cloudflare.workers.routing.type = "routes"`、`cloudflare.workers.routes.pattern = "cache.test.walshy.dev/*"`、`service.name = "edge_processing"` が見える（出典: Cloudflare Blog https://blog.cloudflare.com/cloudflare-tracing/。原文にキャプションはなく、説明は画像の見た目からの筆者による記述）*

**4. キャッシュから返ったか。Cloudflare・オリジン接続・アプリのどこで時間を使ったか**

入れ子になった cache・upstream・origin の span を展開して、時間の使い道を見る。記事の例では、キャッシュミスがオリジンまで行き、539ms のうち 527ms をレスポンスの取得に使っていた。

![キャッシュミスとオリジンの span](https://blog.cloudflare.com/_emdash/api/media/file/01M3XE7DT8DPBXHKN54FJHF0NJ.png)
*図: ルート `cloudflare_request https://origin.blobflare.c...`（539.31ms）の下に `upstream`（535.96ms）があり、その中に `cache`（535.41ms）、さらにその中に `origin`（527.79ms）が入れ子になっている。`response` は 226.6ms。`cache` を選択し、右の属性欄に `cloudflare.colo = "EWR"`、`cloudflare.cache.status = "miss"`、`http.response.status_code = 200`、`http.response.body.size = 92685` などが見える（出典: Cloudflare Blog https://blog.cloudflare.com/cloudflare-tracing/。原文にキャプションはなく、説明は画像の見た目からの筆者による記述）*

### トレースの設定

特別な計装・設定・プラグインは要らない。ドメインでトレーシングを有効にすれば、Cloudflare が span を自動で生成する。そのうえで、取る範囲を 2 段階で制御する。

- **基準のサンプリング率（head sampling）**: 可視性・データ量・コストのバランスを取る。通常時はリクエストの 1% を取る、といった使い方ができる。
- **Trace Rules**: 基準を低く保ったまま、特定の調査のために完全なトレースを取る。記事の例は、ある顧客から問題が報告されたらそのホスト名・送信元 IP・識別用リクエストヘッダーのトラフィックだけ 100% 取る、調査中だけ一時的なデバッグヘッダーのあるリクエストを 100% 取る、など。ドメイン全体のトレースを増やさずに問題を再現できる。条件は Cloudflare の Rules 言語で書くので、パス・メソッド・ヘッダー・IP・地域やその組み合わせを指定できる。

### トレースコンテキストの受け入れと伝播

分散トレーシングの要望に応える部分である。

- **受け入れ**: 受信リクエストの W3C `traceparent` ヘッダーを Cloudflare が受け入れると、Cloudflare の span は、リクエストが届く前に始まっていたトレースに参加できる。受け入れるかどうかは incoming propagation policy で決める。
- **転送**: Cloudflare は新しい `traceparent` ヘッダーをオリジンへ転送することもできる。計装された他のサービスはそのコンテキストを取り出して、API・データベース・Cloudflare 上や他の場所で動くサービスを通じてトレースを続けられる。
- **1 つの接続されたトレースとして見る**: Cloudflare の span とアプリケーションの span を、同じ OpenTelemetry 互換のバックエンドに送る。

![切れたトレースと、1 つにつながったトレースの対比](https://blog.cloudflare.com/_emdash/api/media/file/01M3XE753D6PZGPRRR4XFNDZWD.png)
*図: 左の「BEFORE: Disconnected traces」は、Service A（`GET /api/v1`、`auth check`、trace 7f3a…）、Cloudflare（`worker invocation`、`fetch`、trace b21c…）、Service C（`build report`、`update db`、trace e9d4…）がそれぞれ別のトレースを持つ状態を示す（「Each service starts its own trace. No shared context.」）。右の「AFTER: One connected trace」は、同じ trace 7f3a… の下に、Service A の `GET /api/v1`・`auth check` から Cloudflare の `worker invocation`・`fetch`、Service C の `build report`・`update db` までが 1 つの階層としてつながる（「Trace context propagates across every service.」）（出典: Cloudflare Blog https://blog.cloudflare.com/cloudflare-tracing/。原文にキャプションはなく、説明は画像内の文字と見た目からの筆者による記述）*

### OpenTelemetry でのエクスポート

Cloudflare の span を OTLP で、互換のオブザーバビリティプラットフォームへ送れる。アカウント単位の宛先（destination）を設定し、どのドメインがそこにトレースを送るかを選ぶ。記事は、Cloudflare がリクエストの動きを OpenTelemetry の span として表現し、OTLP で配信することで、データをツール間で持ち運べる状態に保つ、と位置づけている。

![Observability Destinations 画面](https://blog.cloudflare.com/_emdash/api/media/file/01M3XE782NVN38FX5K674ZXXB2.png)
*図: ダッシュボードの「Observability Destinations」画面（説明: 「Configure endpoints to send trace data to observability platforms」）。右上に「View docs」と「Add Destination」ボタンがある。表は Dataset・Destination・Status の列を持ち、`metrics` データセットの `test-destination-otlp-payload-logger`（宛先 `https://otlp-payload-logger.burritobots.workers.dev/v1/metrics`、状態 Last: 3 minutes…）と、`traces` データセットの `workers-observability`（宛先 `https://api.honeycomb.io/v1/traces`、状態 Never run）の 2 行が見える（出典: Cloudflare Blog https://blog.cloudflare.com/cloudflare-tracing/。原文にキャプションはなく、説明は画像内の文字からの筆者による記述）*

### エージェントによる調査

コーディングエージェントに本番の問題を調べさせても、コードとテストしか見られず、本番でリクエストに何が起きたかは見えないことがある。**Cloudflare Observability MCP サーバー**を使うと、エージェントは SQL API でトレース（と、他のすべてのオブザーバビリティデータ）を問い合わせられる。失敗したトレースと成功したトレースを比べ、span がどこで分岐するかを見つけ、さらにリポジトリを調べて該当コードに結びつけ、変更案まで作れる、と記事は述べる。

### 料金

Cloudflare Traces は、統一された Cloudflare Observability の料金モデルに入る。span やイベントの数ではなく、取り込んだオブザーバビリティデータの量と保持期間で課金する。新料金は Cloudflare Tracing（と Workers Tracing）に **2026年12月1日**から適用される。

| プラン | 含まれる量 | 保持期間 | 超過分 |
|---|---|---|---|
| Free | 1 日 0.5 GB の取り込み | 7 日 | 利用不可 |
| Paid / Enterprise | 請求サイクルあたり 50 GB の取り込みと 10 GB-month の保存 | 最長 1 年（近日提供） | 取り込み $0.25 / GB、保存 $0.10 / GB-month |

### 今後の予定

オープンベータの後に計画されているもの。

- **より広い自動計装**: HTTP リクエスト経路（DDoS ルール、Access など）と、Workers 実行経路（Workflows、Queues、Pipelines など）で span を増やす。
- **認証付きのコンテキスト伝播**: すべての受信リクエストからコンテキストを受け入れず、信頼できる呼び出し元だけが既存のトレースを続けられるようにする。
- **アドホックなトレース**: 基準のサンプリング率を変えずに、特定のリクエストをオンデマンドで取る。
- **Workers での OpenTelemetry API 対応**: 既存の span への属性追加やトレースコンテキストの取得ができるよう、OpenTelemetry API の整備を続ける。
- **より長い保持期間**: 長い調査向けに、最長 365 日。

## コード例

記事本文にはコード例（コードブロック）がない。内容は、機能の説明、ダッシュボードのスクリーンショット、料金、今後の予定で構成されている。設定はダッシュボード、API、Terraform から行う（記事によれば、オープンベータはこの 3 経路で利用でき、OTLP 宛先へのエクスポートに対応する）。そのため、このリポジトリのほかの記事のような「コード例」セクションは設けず、代わりに記事が示す span の種類と属性を整理する。

記事の図に現れる span 名の例（画像から読み取れたもの。一覧の網羅は記事にない）:

| span 名 | 内容（記事の説明・図から） |
|---|---|
| `cloudflare_request` | リクエスト全体のルート span |
| `http_request_dynamic_redirect` / `http_request_redirect` | リダイレクト関連の処理 |
| `http_request_transform` / `http_request_late_transform` | Transform Rules の評価。変更した要素とルールが event に残る |
| `page_rules` | Page Rules の処理 |
| `http_request_firewall_custom` | カスタムルールの評価。動作したルールの参照が event に残る |
| `http_request_snippets` | Snippets の処理 |
| `http_config_settings` | 設定の適用 |
| `workers_routing` | Workers へのルーティング。一致の有無・種類・パターンが属性に残る |
| `upstream` / `cache` / `origin` | オリジン側の取得。cache は入れ子で、`cloudflare.cache.status` などの属性を持つ |
| `response` / `http_response_headers_transform` / `http_response_compression` | レスポンス側の処理 |

Workers 内のコードからトレースに属性を足す `tracing` API の例は、[本番の問題を検知してエージェントへ直接送る: Workers の Issues](./2026-09-30-real-time-issue-detection.md) の「コード例」を参照。Workers でのトレースをローカルで確認する流れは [エージェントがローカルトレースでWorkersをデバッグ可能に](./2026-08-04-local-tracing.md) にある。

## ユースケース

記事が挙げる、あるいは記事から読み取れる使い方を整理する。

- **ブロック・チャレンジの原因調査**: `http_request_firewall_custom` などの span の event から、動作したルールの参照を特定する。
- **URL 書き換えの確認**: Transform Rule がどのリクエスト要素をどう変えたか、ルーティングやオリジン処理に対していつ起きたかを確認する。
- **ルーティングの切り分け**: Page Rules・Snippets・Workers のどれがリクエストを処理・変更したかを、`workers_routing` span で確かめる。
- **遅さの内訳の確認**: キャッシュミスがオリジンに行き、539ms のうち 527ms をオリジンの応答待ちに使っていた、といった内訳を cache・upstream・origin の span で見る。
- **特定顧客・特定リクエストの深掘り**: 基準を 1% に保ちつつ、Trace Rules で問題の顧客のホスト名・IP・ヘッダーだけ 100% 取る。
- **サービスをまたいだ 1 本のトレース**: `traceparent` を受け入れ・転送して、自社のサービスやオリジンのアプリの span と Cloudflare の span を同じバックエンドで 1 つのトレースとして見る。
- **エージェントによる原因調査**: Cloudflare Observability MCP サーバーと SQL API を使い、失敗と成功のトレースを比べて span の分岐点を見つけ、コードの修正案までつなげる。

## 所感・ポイント

- 従来の Workers Tracing は「Worker の中」を見せる機能だった。今回の Cloudflare Traces は、Worker を書かないドメイン（オリジンの前に Cloudflare を置いているだけ）にも同じ見え方を広げる点が大きい。設定と挙動の因果関係（どのルールがいつ効き、時間にどう影響したか）を、1 つのタイムラインで見られる。
- Trace Rules は、トレースのコストと可視性のトレードオフに対する実用的な答えである。常時 1% で全体を眺め、問題の顧客・ヘッダーだけ 100% にする、という運用が設定だけでできる。
- 受信側の `traceparent` の受け入れは、現状 policy で一括して決める形である。記事も「認証付きのコンテキスト伝播」を今後の予定に挙げており、信頼できない外部クライアントのコンテキストをどこまで受けるかは、導入時に検討する点になる。
- 課金は span 数ではなくデータ量と保持期間ベースになる。2026年12月1日から Workers Tracing にも新料金が適用されるため、既存の Workers Tracing の利用者も確認が必要。Free プランは 1 日 0.5 GB・7 日保持で、追加利用はできない。
- OpenTelemetry と OTLP を前提にしているため、既存のオブザーバビリティ基盤（宛先の例として画像には Honeycomb の URL がある）にそのまま流し込める。Cloudflare 内のダッシュボードを見るだけでなく、自社のアプリの span と同じ場所で見られる点が分散トレーシングの価値になる。
- 「今後の予定」の Workers での OpenTelemetry API 対応は、すでに利用できる `cloudflare:workers` の `tracing` API（[Issues の記事](./2026-09-30-real-time-issue-detection.md)で `getActiveSpan` として登場）の延長にあると読める（筆者の読みであり、記事が明言しているわけではない）。
- 記事の画像キャプションは、原文にないため、すべて画像の見た目と画像内の文字からの筆者による記述である。
- **サンプル対象外**: 中心機能は、ドメイン単位のトレーシング（ダッシュボード・API・Terraform で有効化する Cloudflare のプラットフォーム側の計装）であり、Worker のコードから「要点を体験できる最小実装」にならない。Worker から触れる `tracing` API は既存の [examples/local-tracing/](../../examples/local-tracing/)・[examples/real-time-issue-detection/](../../examples/real-time-issue-detection/) が扱っており、重複を避けるため、本記事用のデプロイ可能なサンプルは作成していない。

## 関連リンク

- 原文: https://blog.cloudflare.com/cloudflare-tracing/
- Cloudflare Traces のドキュメント: https://developers.cloudflare.com/observability/traces/
- トレースの有効化: https://developers.cloudflare.com/observability/traces/#enable-tracing
- トレースの確認（Inspect a trace）: https://developers.cloudflare.com/observability/traces/#inspect-a-trace
- Span の一覧: https://developers.cloudflare.com/observability/traces/spans/
- Ruleset phase spans: https://developers.cloudflare.com/observability/traces/spans/#ruleset-phase-spans
- 設定（Head sampling / Trace Rules / Incoming trace context / Forward context）: https://developers.cloudflare.com/observability/traces/configuration/
- OpenTelemetry エクスポート: https://developers.cloudflare.com/observability/export/opentelemetry/
- オブザーバビリティの料金: https://developers.cloudflare.com/observability/pricing/
- Cloudflare Rules 言語: https://developers.cloudflare.com/ruleset-engine/rules-language/
- SQL API: https://developers.cloudflare.com/analytics/sql-api/
- Cloudflare MCP（Observability MCP サーバー）: https://github.com/cloudflare/mcp
- Workers Tracing オープンベータの発表: https://blog.cloudflare.com/workers-tracing-now-in-open-beta/
- Workers のスパンと属性: https://developers.cloudflare.com/workers/observability/traces/spans-and-attributes/
- Workers のカスタムスパン: https://developers.cloudflare.com/workers/observability/traces/custom-spans/
- W3C Trace Context（traceparent）: https://www.w3.org/TR/trace-context-1/#traceparent-header
- OpenTelemetry: https://opentelemetry.io/
- OTLP 仕様: https://opentelemetry.io/docs/specs/otlp/
- [エージェントがローカルトレースでWorkersをデバッグ可能に（本リポジトリのWiki）](./2026-08-04-local-tracing.md) / [Workers サンプル: examples/local-tracing/](../../examples/local-tracing/)
- [本番の問題を検知してエージェントへ直接送る: Workers の Issues（本リポジトリのWiki）](./2026-09-30-real-time-issue-detection.md) / [Workers サンプル: examples/real-time-issue-detection/](../../examples/real-time-issue-detection/)
