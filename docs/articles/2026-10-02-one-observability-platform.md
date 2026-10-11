# Cloudflare Observability の 8 つの大型アップデート: ログ・トレース・分析・アラートを 1 つのプラットフォームへ

- 原文: [https://blog.cloudflare.com/one-observability-platform/](https://blog.cloudflare.com/one-observability-platform/)（原題: 8 major updates to Cloudflare Observability）
- 日本語版の出どころ: Cloudflare公式の日本語版（`https://blog.cloudflare.com/ja-jp/one-observability-platform/`）は確認時点で存在しなかった（404）ため、英語版（en-us）から日本語化して要約している。タイトルも筆者による訳。公開日は英語原文の datePublished（2026-10-02T18:00:00Z）に従う。
- 公開日: 2026-10-02
- 著者: Nevi Shah、Arti Kumar、Tom Benn、Sahidya Devadoss
- 位置づけ: Birthday Week 2026 の記事（読了目安は原文表記で 8 分）。ログ・トレース・分析・アラート・ダッシュボード・エクスポートを 1 つのオブザーバビリティ基盤にまとめる 8 件の発表
- 関連: [Cloudflare Traces の紹介](./2026-10-02-cloudflare-tracing.md)（本記事の 2 番目の更新の詳細記事）/ [エージェントがローカルトレースでWorkersをデバッグ可能に](./2026-08-04-local-tracing.md)（Workers の組み込み OpenTelemetry 計測）/ [本番の問題を検知してエージェントへ直接送る: Workers の Issues](./2026-09-30-real-time-issue-detection.md)（同じ観測データをエージェントに渡す Issues）/ [「全員が使える」誓約のアップデート](./2026-10-02-enterprise-for-all-update.md)（Logpush・Transformers・Custom Dashboards の全プラン開放を扱う記事。本記事の 6〜8 番目と重なる）/ [Billable Usage API](./2026-08-03-billable-usage-api.md)（課金情報の取得。本記事の SQL API・Observability 料金と並べて読める）/ [cf のご紹介](./2026-09-28-cloudflare-cf-cli-launch.md)（本記事で SQL API の問い合わせ手段として挙がる `cf` CLI）/ [Cloudflare Basin](./2026-10-01-cloudflare-basin.md)・[Cloudflare K2](./2026-10-01-cloudflare-k2-streams.md)（Logpush のログを SQL で変換して保存する Pipelines と、そのイベントストリーム層）
- GitHub: [docs/articles/2026-10-02-one-observability-platform.md](https://github.com/syumai/cloudflare-blog-summaries/blob/main/docs/articles/2026-10-02-one-observability-platform.md)

![記事ヘッダー画像](https://blog.cloudflare.com/_emdash/api/media/file/01M3XHE6D45CDHQVM71QYA6EEJ.01M3XHE6YHC44V1DZB0VG3DCGV.png)
*図: 記事ヘッダー画像。大きな虫眼鏡の輪の中に折れ線グラフとトグル・バーを持つダッシュボード風ウィンドウがあり、左右に別のウィンドウ（ドーナツグラフなど）と棒グラフが並ぶ装飾イラスト（出典: Cloudflare Blog https://blog.cloudflare.com/one-observability-platform/。原文にキャプションはなく、説明は見た目からの筆者の推定。装飾のため、図としては扱わない）*

## TL;DR

- ログ・トレース・分析・アラート・ダッシュボード・エクスポートを **1 つのオブザーバビリティ基盤**に寄せる 8 件の更新が発表された。今後数か月で、より多くの製品・データセット・ワークフローがこの基盤に加わり、料金や体験も揃えていく。
- 主な更新は、新しい **Logs ホーム**（Workers Observability と Log Explorer の統合）、**Cloudflare Traces のオープンベータ**、**統一 SQL API（ベータ）**、**カスタムアラート（ベータ）**、**ドメイン分析の全プラン 30 日保持**、**Custom Dashboards**、**Logpush の全セルフサーブプラン開放と Transformers の GA**。
- ログとトレースの料金は、イベント数ではなく**取り込み量と保存量**ベースの統一モデルに変わる。**2026年12月1日**から全プランに適用（Enterprise は更新時）。
- Logpush と Transformers にも従量課金（毎月の無料枠つき）が導入される。
- 設計の軸は OpenTelemetry・W3C Trace Context・SQL という標準・可搬なインターフェースで、人だけでなくエージェントが調べる前提になっている。

## 背景・課題

原因調査には、1 つの Cloudflare 製品のデータだけでは足りないことが多い。5xx の急増は、Worker 由来かもしれないし、オリジン由来かもしれないし、Cloudflare がオリジンへ（全世界的または地域的に）接続できていないのかもしれない。しかし現状では、どの信号をどの製品が持っているか、どう問い合わせるかを知らなければ調べられない。

記事は、オブザーバビリティを「プラットフォーム全体の能力」にすべきだと述べる。アプリケーションが実際にどう動くかを反映し、問題を解決するのに必要な文脈をそろえる、という考え方である。今回の 8 件はその最初の一歩で、記事は「Cloudflare はブラックボックスに感じられる」という声に応えるものだと位置づけている。

## 発表内容 / アーキテクチャ

記事冒頭で 8 件が次のように列挙されている。

| # | 更新 | 状態 |
|---|---|---|
| 1 | 新しい Logs ホーム（Workers Observability と Log Explorer の統合） | 提供中 |
| 2 | Cloudflare Traces | オープンベータ |
| 3 | 統一 SQL API | ベータ |
| 4 | ログ・トレースの新料金 | 2026年12月1日から |
| 5 | オブザーバビリティデータへのカスタムアラート | ベータ |
| 6 | ドメイン分析の統合と 30 日保持 | 全プランで提供 |
| 7 | Custom Dashboards | 提供中 |
| 8 | Logpush の全セルフサーブプラン開放・Transformers GA・従量課金 | 提供中 |

### 1. すべてのログを 1 か所で調べる

新しい **Logs ホーム**は、Workers アプリとその接続リソースをデバッグする **Workers Observability** と、セキュリティログを横断検索する **Log Explorer** を 1 つにまとめる。HTTP events、firewall events、Workers、Containers、R2、AI Gateway などのデータセットを選び、どれも同じ調査機能で扱える。

調査の流れの例は、リクエストレイテンシの増加から始めて、ホスト名やデータセンターでグループ化し、影響を受けたパスに絞り、Ray ID で個々のリクエストを調べる、というもの。調査が別の Cloudflare 製品に移るときは、Logs を離れずにデータセットを切り替えられる。複数データセットをまたぐ問い合わせは「近日提供」とされている。ログは生の SQL か組み込みフィルターで問い合わせでき、自然言語で可視化を作ったり、検出された異常を調べたりもできる。

![Logs 画面: edgeResponseStatus >= 499 でのフィルタリング](https://blog.cloudflare.com/_emdash/api/media/file/01M3XHC8MQ4VMGRP0JX5412SDR.png)
*図: Logs 画面。上部に検索条件 `edgeResponseStatus >= 499`（Add filter は 1 件）と「Last 6 hours」があり、左にフィールド一覧（Response 配下の Edge time to first byte のパーセンタイル分布など）がある。中央に「Request outcomes over time」（Mitigated by Cloudflare / Served by Cloudflare / Served by Origin）、「Top Status Codes Over Time」（499・502・504）、「Origin Response Latency: p50, p95, p99」のグラフが並び、下に個々のリクエストの一覧（Timestamp・HTTP method・Host・Path・Edge status code・Cache status・Country）が表示されている（出典: Cloudflare Blog https://blog.cloudflare.com/one-observability-platform/。原文にキャプションはなく、説明は画像の見た目からの筆者による記述）*

### 2. プラットフォーム全体でリクエストを追跡する（オープンベータ）

**Cloudflare Traces** がオープンベータになった。セキュリティルール・変換・キャッシュの判断・ルーティング・Workers・オリジン処理を、リクエスト単位で見られる。基準のサンプリング率を決め、**Trace Rules** で調査中だけ特定のトラフィック（ホスト名・パス・IP・ヘッダー）を高い率で取り、Ray ID で検索してダッシュボードで span を調べる。OpenTelemetry でのエクスポートと、W3C trace context の受け入れ・オリジンへの伝播にも対応する。詳細は [Cloudflare Traces の紹介](./2026-10-02-cloudflare-tracing.md) を参照。

![トレースのウォーターフォールと span の詳細パネル](https://blog.cloudflare.com/_emdash/api/media/file/01M3XE76PJXWGQ86MMXRXPYYED.png)
*図: Cloudflare Traces のトレース画面（Cloudflare Traces 記事と同じ画像）。左に span のウォーターフォール（ルート `cloudflare_request https://blobflare.com/tracing-demo` 766.16ms の下に `http_request_transform`、`workers_routing`、`upstream` 754.02ms などが並ぶ）、右に選択した span の詳細（service `edge_processing`、trigger `http`、同種 45419 span との比較など）がある（出典: Cloudflare Blog https://blog.cloudflare.com/one-observability-platform/。原文にキャプションはなく、説明は画像の見た目からの筆者による記述）*

### 3. エージェントが 1 つの SQL API でオブザーバビリティデータを問い合わせる（ベータ）

**統一 SQL API**（ベータ）は、Cloudflare 全体のテレメトリを 1 つの SQL 方言・認証モデル・API で問い合わせられるようにする。これまでは Workers のログ、Containers のセキュリティイベント、HTTP リクエストログ、分析データをそれぞれ別に連携する必要があった。

- エージェントは、新しい Cloudflare CLI の `cf` でクエリを探して実行するか、**Cloudflare の Observability MCP サーバー**に接続して、ログ・トレース・分析を調べられる。
- データセットのスキーマ・フィールド・クエリ例がドキュメントに用意されていて、人とエージェントの両方がクエリを組み立てやすい。
- SQL インターフェースは、Workers の**ネイティブバインディング**としても提供される。Worker から、別の API クライアントを設定せずに Analytics Engine のデータを問い合わせられる。記事が挙げる用途は、顧客利用量の計測と課金ワークフロー、顧客向け分析ダッシュボード、ヘルスレポートの生成、インシデント調査の自動化である。

### 4. ログ・トレースの新料金

Cloudflare 上で取り込み・保存するすべてのログとトレースについて、統一された Observability サブスクリプションと料金に移行する。**2026年12月1日**から全プランに適用され（Enterprise は更新時）、Workers・Containers・AI Gateway など既存の Developer Platform のログと、すべてのトレースデータを対象にする。ログやトレースはサイズの幅が大きいため、イベント数ではなく**取り込み・保存するデータ量**に基づく。

| プラン | 含まれる量 | 保持期間 | 超過分 |
|---|---|---|---|
| Free | 1 日 0.5 GB の取り込み | 7 日 | 利用不可 |
| Paid / Enterprise | 請求サイクルあたり 50 GB の取り込みと 10 GB-month の保存 | 最長 1 年（近日提供） | 取り込み $0.25 / GB、保存 $0.10 / GB-month |

なお、原文には料金調整について「This pricing adjustment will be.」という文が途中で切れた形で載っている（原文の記述ミスと思われ、内容は確認できない）。詳細はドキュメントの料金ページを参照する、と案内されている。

### 5. オブザーバビリティデータにカスタムアラートを設定する（ベータ）

Notifications（現在の呼称は「**Alerts**」）が大きく強化された。統一 SQL API が扱うあらゆるデータ（HTTP リクエストログ、Workers イベント、Workers Analytics Engine データセット、分析データセット、トレース、セキュリティイベント）にカスタムアラートを定義できる。

- ダッシュボードでデータセットを選ぶか、カスタム SQL で条件を定義する。
- 条件は**しきい値・異常検知・SLO** から選び、評価ウィンドウと通知先を設定する。
- 例: オリジンの 5xx が 5 分間しきい値を超える、Container が繰り返し失敗する、デプロイ後に Worker のエラーが増える、トレースのレイテンシが想定上限を超える。
- 通知先は、インシデント管理ツール、チャットプラットフォーム、Webhook。**Webhook は全プランで利用可能**になり、独自サービスやエージェントへ送って、すぐ調査を始めさせられる。

![カスタムアラートの作成画面](https://blog.cloudflare.com/_emdash/api/media/file/01M3XHC79NCEBD9739PJEG1BX4.png)
*図: 「Custom alert: 5xx Error Anomaly Detection」（Beta）の作成画面。左に評価方法（Anomaly detection）、Query builder / Custom SQL の切り替え、Dataset（Workers Logs）、Metric（Count rows）、Filters（`httpStatus >= 500`）があり、右に「Query preview」として直近 6 時間のクエリ結果の折れ線グラフが表示されている（出典: Cloudflare Blog https://blog.cloudflare.com/one-observability-platform/。原文にキャプションはなく、説明は画像の見た目からの筆者による記述）*

### 6. ドメイン分析を 1 か所に集約し、30 日間保持する

トラフィック・パフォーマンス・セキュリティ・キャッシュ・オリジン・DNS のデータを 1 つにまとめ、関係を見られるようにする。レイテンシが上がったとき、特定のデータセンター・ホスト名・オリジンに結びつくかを素早く確認できる。さらに、**すべてのプランで 30 日間のドメイン分析**を利用できる。発生後に調べる時間が取れ、数週間前の同じ曜日と比べたり、一時的なスパイクと長期的な傾向を見分けたりできる。

![ドメイン分析の画面](https://blog.cloudflare.com/_emdash/api/media/file/01M3Y5WM6SW825JHAF6XANM665.01M3Y5WNRM8N1DW2B1AC94KXZF.png)
*図: ドメイン分析の画面。上部に Requests / Visitors / Performance / Security / Cache / Origin / DNS のタブと「Last 24 hours」があり、Total requests（2.89B）、Total data transfer（49.04 TB）、Total visits（142.78k）、Cache hit rate、5xx error rate、Edge TTFB (p95) のカード、その下に Requests over time、Data transfer、Requests by status code、Requests by cache status のグラフが並ぶ（出典: Cloudflare Blog https://blog.cloudflare.com/one-observability-platform/。原文にキャプションはなく、説明は画像の見た目からの筆者による記述）*

### 7. カスタムダッシュボードを作る

あらかじめ用意されたダッシュボードは一般的な用途に対応するが、アプリケーションは Cloudflare の複数の部分を使う。**Custom Dashboards** では、Cloudflare 全体の分析、Workers プラットフォームのログ・トレース、セキュリティイベントを 1 つのビューにまとめ、リクエスト量・エラー・レイテンシ・ストレージ・ブロックされたトラフィックを追跡し、チームと共有できる。調査のたびにクエリを組み直さず、重要な信号を 1 か所で見られる。

![カスタムダッシュボードの例](https://blog.cloudflare.com/_emdash/api/media/file/01M3XHC42Q6QC70QHNQKTWNW44.png)
*図: 「health dash (prod)」という名前のカスタムダッシュボード。Total Requests（164.8M）・Total Errors（65.09k）・Error Rate（0.04%）のカード、Top Scripts・By Status（ドーナツ）・Top Namespaces、Requests over time、Wall time P50 vs P99 のグラフがある。右上に Print / Copy link / Add a chart のボタンがある（出典: Cloudflare Blog https://blog.cloudflare.com/one-observability-platform/。原文にキャプションはなく、説明は画像の見た目からの筆者による記述）*

### 8. Logpush が全セルフサーブプランで利用可能に

従来 Enterprise 限定だった **Logpush** が、すべてのセルフサーブプランで使えるようになった。Cloudflare のすべてのログを、すでに使っているツールや宛先にエクスポートできる。配信前に絞り込み・伏字化・付加情報の追加・出力の整形をしたい場合は、**Transformers** が GA になり、別の ETL パイプラインなしで任意の SQL 変換を適用できる。Logpush と Transformers には**従量課金**が導入され、それぞれ毎月の無料枠がある。

| エクスポート | 毎月の無料枠 | 超過分 |
|---|---|---|
| Cloudflare の宛先へのエクスポート | 25 GB | $0.03 / GB |
| 外部の宛先へのエクスポート | 25 GB | $0.10 / GB |
| Logpush Transformers | 1 GB | $0.04 / GB |

### 今後の予定

- **より長い保持期間**: ログとトレースを最長 1 年保持できるようにする。
- **Workers での OpenTelemetry API 対応**: 既存の span への属性追加や、トレースコンテキストの取得ができるよう API を整備する。
- **OpenTelemetry による簡単なメトリクスのエクスポート**: Cloudflare のメトリクスを OpenTelemetry 互換の宛先に送り、スタックの残りのテレメトリと一緒に分析できるようにする。
- **新料金は 2026年12月1日から有効**: 変更の前に通知する、とされている。

## コード例

記事本文にはコード例（コードブロック）がない。記事は、各機能の説明、ダッシュボードのスクリーンショット、料金表、今後の予定で構成されている。一部の節には、コーディングエージェントに設定を任せるための「Copy prompt」ボタンが付いているが、プロンプトの中身は記事の HTML からは確認できなかった。そのため、このリポジトリの他記事のような「コード例」は載せず、代わりに更新ごとのデータセットと機能の対応を次の表に整理する（記事の記述にもとづく）。

| 更新 | 扱うデータ | 操作の入口 |
|---|---|---|
| Logs ホーム | HTTP events、firewall events、Workers、Containers、R2、AI Gateway | ダッシュボード（SQL またはフィルター、自然言語での可視化） |
| Traces | セキュリティルール・変換・キャッシュ・ルーティング・Workers・オリジンの span | ダッシュボード、OTLP エクスポート、`traceparent` |
| 統一 SQL API | Workers ログ、Containers セキュリティイベント、HTTP リクエストログ、分析データ | API、`cf` CLI、Observability MCP サーバー、Workers バインディング |
| カスタムアラート | HTTP リクエストログ、Workers イベント、Analytics Engine、分析、トレース、セキュリティイベント | ダッシュボード、カスタム SQL |
| ドメイン分析 | トラフィック・パフォーマンス・セキュリティ・キャッシュ・オリジン・DNS | ダッシュボード（30 日保持） |
| Custom Dashboards | 分析・ログ・トレース・セキュリティイベント | ダッシュボード |
| Logpush / Transformers | Cloudflare の各種ログ | 設定、SQL 変換 |

`cf observability` などの具体的なコマンド例は、[本番の問題を検知してエージェントへ直接送る: Workers の Issues](./2026-09-30-real-time-issue-detection.md) の「コード例」と、[cf のご紹介](./2026-09-28-cloudflare-cf-cli-launch.md) にある。

## ユースケース

記事が挙げる、あるいは記事から読み取れる使い方を整理する。

- **5xx 急増の切り分け**: Worker・オリジン・Cloudflare とオリジン間の接続のどれが原因かを、Logs でデータセットを切り替えながら調べる。
- **リクエスト遅延の深掘り**: ホスト名やデータセンターでグループ化し、パスで絞り、Ray ID で個別のリクエストを確認し、Traces の span で時間の内訳を見る。
- **Worker での利用量の計測・課金**: Worker から SQL バインディングで Analytics Engine を問い合わせ、顧客ごとの利用量を集計する。
- **顧客向け分析・ヘルスレポート**: 同じバインディングで分析ダッシュボードやヘルスレポートを生成する。
- **インシデント調査の自動化**: Webhook でアラートをエージェントに送り、SQL API・`cf`・MCP サーバーで調べさせて修正を確認させる。
- **カスタムアラート**: オリジンの 5xx がしきい値を 5 分超過、Container の繰り返し失敗、デプロイ後の Worker エラー増加、トレースのレイテンシ超過などを通知する。
- **ログの外部エクスポート**: Logpush と Transformers で、機微情報を伏字化・絞り込みしてから SIEM やストレージへ送る。

## 所感・ポイント

- 8 件のうち Traces（記事 [Cloudflare Traces の紹介](./2026-10-02-cloudflare-tracing.md)）や Logpush・Custom Dashboards（[誓約アップデート](./2026-10-02-enterprise-for-all-update.md)）は、同日の別記事ですでに詳しく扱われている。本記事は、それらを 1 つの基盤の構成要素として位置づける総覧と読める。
- 技術面の軸は SQL と OpenTelemetry である。統一 SQL API が、人・エージェント・Worker（バインディング）・アラートの共通の入口になっている点が、基盤としての一貫性を支えている。
- 料金は、イベント数ではなくデータ量ベースへ変わる。2026年12月1日から既存の Workers のログ・Containers・AI Gateway のログにも適用されるため、現在これらを使っている場合は、取り込み量を見積もっておく必要がある。Free プランは 1 日 0.5 GB・7 日保持で、超過分は利用できない。
- Logpush は、取り込み先が Cloudflare 内（25 GB 無料、$0.03 / GB）か外部（25 GB 無料、$0.10 / GB）かで単価が異なる。Cloudflare 内の宛先として、このリポジトリでは [Basin](./2026-10-01-cloudflare-basin.md) の Pipelines などが関連する。
- 「統一 SQL API」「カスタムアラート」はベータ、「複数データセットをまたぐ問い合わせ」「最長 1 年の保持」は近日提供と明記されている。本番運用に取り入れる前に、各機能の提供状態を確認する。
- 記事の画像キャプションは、原文にないため、すべて画像の見た目と画像内の文字からの筆者による記述である。ヘッダー画像は装飾である。
- **サンプル対象外**: 本記事の中心は、ダッシュボード・料金・複数機能の総覧であり、Worker の最小実装で要点を体験できる内容ではない。Worker から触れる SQL バインディングはベータで、記事にバインディング名・API の詳細が示されておらず、検証可能な最小実装を正確に書けないため、デプロイ可能なサンプルは作成していない。トレースの属性付与は既存の [examples/local-tracing/](../../examples/local-tracing/)・[examples/real-time-issue-detection/](../../examples/real-time-issue-detection/) が扱い、Logpush・Pipelines は [examples/cloudflare-basin/](../../examples/cloudflare-basin/) が扱う。

## 関連リンク

- 原文: https://blog.cloudflare.com/one-observability-platform/
- Observability ドキュメント: https://developers.cloudflare.com/observability/
- 新しい Logs ホーム: https://developers.cloudflare.com/observability/logs/
- Workers Observability: https://developers.cloudflare.com/workers/observability/
- Log Explorer: https://developers.cloudflare.com/log-explorer/
- Cloudflare Traces の設定（Trace Rules など）: https://developers.cloudflare.com/observability/traces/configuration/
- Ray ID: https://developers.cloudflare.com/fundamentals/reference/cloudflare-ray-id
- 統一 SQL API: https://developers.cloudflare.com/analytics/sql-api/
- SQL API のデータセット: https://developers.cloudflare.com/analytics/sql-api/datasets/
- Workers の Analytics SQL バインディング: https://developers.cloudflare.com/workers/runtime-apis/bindings/analytics-sql/
- Workers Analytics Engine: https://developers.cloudflare.com/analytics/analytics-engine/
- Cloudflare CLI `cf` の発表: https://blog.cloudflare.com/cloudflare-cf-cli-launch/
- Cloudflare MCP（Observability MCP サーバー）: https://github.com/cloudflare/mcp
- Observability の料金: https://developers.cloudflare.com/observability/pricing/
- Notifications（Alerts）: https://developers.cloudflare.com/notifications/
- Webhook の設定: https://developers.cloudflare.com/notifications/get-started/configure-webhooks/
- ドメイン分析（Zone analytics）: https://developers.cloudflare.com/analytics/account-and-zone-analytics/zone-analytics/
- Custom Dashboards: https://developers.cloudflare.com/analytics/custom-dashboards/
- Logpush: https://developers.cloudflare.com/logs/logpush/
- Logpush Transformers: https://developers.cloudflare.com/logs/logpush/transformers/
- Logpush の従量課金（Changelog）: https://developers.cloudflare.com/changelog/post/2026-09-30-logpush-usage-based-pricing/
- OpenTelemetry: https://opentelemetry.io/
- W3C Trace Context: https://www.w3.org/TR/trace-context/
- [Cloudflare Traces の紹介（本リポジトリのWiki）](./2026-10-02-cloudflare-tracing.md) / [解説スライド](../../slides/cloudflare-tracing/slides.md)
- [エージェントがローカルトレースでWorkersをデバッグ可能に（本リポジトリのWiki）](./2026-08-04-local-tracing.md)
- [本番の問題を検知してエージェントへ直接送る: Workers の Issues（本リポジトリのWiki）](./2026-09-30-real-time-issue-detection.md)
- [「全員が使える」誓約のアップデート（本リポジトリのWiki）](./2026-10-02-enterprise-for-all-update.md)
- [Billable Usage API（本リポジトリのWiki）](./2026-08-03-billable-usage-api.md)
- [cf のご紹介（本リポジトリのWiki）](./2026-09-28-cloudflare-cf-cli-launch.md)
- [Cloudflare Basin（本リポジトリのWiki）](./2026-10-01-cloudflare-basin.md) / [Cloudflare K2（本リポジトリのWiki）](./2026-10-01-cloudflare-k2-streams.md)
