---
routerMode: hash
theme: default
title: "Cloudflare Observability の 8 つの大型アップデート: ログ・トレース・分析・アラートを 1 つのプラットフォームへ"
info: |
  8 major updates to Cloudflare Observability の解説スライド。
  原文: https://blog.cloudflare.com/one-observability-platform/
class: text-center
highlighter: shiki
drawings:
  persist: false
transition: slide-left
mdc: true
lineNumbers: true
themeConfig:
  primary: '#f6821f'
---

# Cloudflare Observability の 8 つの大型アップデート

ログ・トレース・分析・アラートを 1 つのプラットフォームへ

Birthday Week 2026 / Observability / Logs / Tracing

<div class="pt-4 text-sm opacity-70">
原文: https://blog.cloudflare.com/one-observability-platform/<br>
公開日: 2026-10-02
</div>

---

# TL;DR

- ログ・トレース・分析・アラート・ダッシュボード・エクスポートを <strong>1 つのオブザーバビリティ基盤</strong>へ寄せる 8 件の更新
- 新しい Logs ホーム、Traces オープンベータ、<strong>統一 SQL API</strong>（ベータ）、カスタムアラート（ベータ）、ドメイン分析 30 日保持、Custom Dashboards、Logpush の全セルフサーブ開放
- ログ・トレースは<strong>取り込み量・保存量ベース</strong>の統一料金へ（2026年12月1日から）
- 軸は OpenTelemetry・W3C Trace Context・SQL。人とエージェントの両方が使う前提

---

# アジェンダ

- 背景: 信号がどの製品にあるかを知らないと調べられない
- 8 件の更新（Logs / Traces / SQL API / 料金 / アラート / 分析 / ダッシュボード / Logpush）
- 今後の予定
- ユースケース、まとめ

---

# 背景: 原因が製品をまたぐ

<div class="text-left text-sm pt-2">

- 5xx の急増は、Worker・オリジン・Cloudflare からオリジンへの接続（全世界的または地域的）のどれにも原因がありうる
- 現状は「どの製品がどの信号を持ち、どう問い合わせるか」を知っていないと調べられない

<div class="mt-6 p-4 border rounded">

オブザーバビリティはプラットフォーム全体の能力であるべき。アプリケーションが実際にどう動くかを反映し、解決に必要な文脈をそろえる。

</div>

- 今後数か月で、より多くの製品・データセット・ワークフローが加わり、料金や体験も揃っていく

</div>

---

# 8 件の更新の一覧

<div class="text-sm">

| # | 更新 | 状態 |
|---|---|---|
| 1 | 新しい Logs ホーム | 提供中 |
| 2 | Cloudflare Traces | オープンベータ |
| 3 | 統一 SQL API | ベータ |
| 4 | ログ・トレースの新料金 | 2026年12月1日から |
| 5 | カスタムアラート | ベータ |
| 6 | ドメイン分析の統合と 30 日保持 | 全プラン |
| 7 | Custom Dashboards | 提供中 |
| 8 | Logpush 全セルフサーブ開放・Transformers GA | 提供中 |

</div>

---

# 1. すべてのログを 1 か所で

<div class="text-left text-sm pt-2">

- <strong>Workers Observability</strong>（Workers のデバッグ）と <strong>Log Explorer</strong>（セキュリティログ検索）を統合
- データセット: HTTP events、firewall events、Workers、Containers、R2、AI Gateway など。調査機能は共通
- 例: レイテンシ増 → ホスト名・データセンターでグループ化 → パスで絞る → Ray ID で個別リクエスト
- 生の SQL か組み込みフィルター。自然言語で可視化を作成。異常の調査も可能
- 複数データセットをまたぐ問い合わせは近日提供

</div>

---

# Logs 画面

<div class="text-center">
<img src="https://blog.cloudflare.com/_emdash/api/media/file/01M3XHC8MQ4VMGRP0JX5412SDR.png" style="max-height: 330px; margin: 0 auto;" />
</div>

<div class="text-left text-sm pt-2">

- 条件 <code>edgeResponseStatus >= 499</code>、直近 6 時間。リクエスト結果・ステータスコード・オリジン応答レイテンシのグラフと、個別リクエスト一覧

</div>

<div class="text-xs opacity-60 pt-1">出典: Cloudflare Blog https://blog.cloudflare.com/one-observability-platform/（キャプションは筆者による記述）</div>

---

# 2. Cloudflare Traces（オープンベータ）

<div class="text-left text-sm pt-2">

- セキュリティルール・変換・キャッシュ判断・ルーティング・Workers・オリジン処理を、リクエスト単位で可視化
- 基準のサンプリング率 + <strong>Trace Rules</strong> で調査中だけ特定トラフィックを高率で取得（ホスト名・パス・IP・ヘッダー）
- Ray ID で検索、ダッシュボードで span を確認
- OpenTelemetry エクスポート、W3C trace context の受け入れ・伝播

▶ <a href="../cloudflare-tracing/" target="_blank">解説スライド: Cloudflare Traces</a>

</div>

---

# 3. 統一 SQL API（ベータ）

<div class="text-left text-sm pt-2">

- Workers ログ、Containers セキュリティイベント、HTTP リクエストログ、分析データを <strong>1 つの SQL 方言・認証モデル・API</strong> で問い合わせ
- エージェントは <code>cf</code> CLI または Observability MCP サーバーで利用
- データセットのスキーマ・フィールド・クエリ例がドキュメントにある
- <strong>Workers のネイティブバインディング</strong>としても提供。別の API クライアント不要

<div class="mt-4 p-3 border rounded">

Worker からの用途: Analytics Engine での顧客利用量の計測・課金、顧客向け分析、ヘルスレポート、インシデント調査の自動化

</div>

</div>

---

# 4. 新料金: 取り込み量・保存量ベース

<div class="text-sm">

| プラン | 含まれる量 | 保持期間 | 超過分 |
|---|---|---|---|
| Free | 1 日 0.5 GB 取り込み | 7 日 | 利用不可 |
| Paid / Enterprise | 50 GB 取り込み + 10 GB-month 保存 / 請求サイクル | 最長 1 年（近日提供） | $0.25 / GB 取り込み、$0.10 / GB-month 保存 |

</div>

<div class="text-left text-sm pt-2">

- <strong>2026年12月1日</strong>から全プラン（Enterprise は更新時）
- Workers・Containers・AI Gateway の既存ログと、すべてのトレースが対象
- イベント数ではなく、取り込み・保存するデータ量ベース

</div>

---

# 5. カスタムアラート（ベータ）

<div class="text-left text-sm pt-2">

- Notifications は「<strong>Alerts</strong>」に呼称変更。統一 SQL API の対象データすべてにアラートを定義できる
- データセットを選ぶか、カスタム SQL で条件を定義 → <strong>しきい値・異常検知・SLO</strong> → 評価ウィンドウ → 通知先
- 通知先: インシデント管理ツール、チャット、Webhook（<strong>Webhook は全プラン</strong>）。エージェントへの送信も可能
- 例: 5xx が 5 分間しきい値超え / Container の繰り返し失敗 / デプロイ後の Worker エラー増 / トレースのレイテンシ超過

</div>

---

# アラート作成画面

<div class="text-center">
<img src="https://blog.cloudflare.com/_emdash/api/media/file/01M3XHC79NCEBD9739PJEG1BX4.png" style="max-height: 330px; margin: 0 auto;" />
</div>

<div class="text-left text-sm pt-2">

- 「Custom alert: 5xx Error Anomaly Detection」（Beta）。Anomaly detection、Dataset は Workers Logs、Metric は Count rows、Filter は <code>httpStatus >= 500</code>。右にクエリのプレビュー

</div>

<div class="text-xs opacity-60 pt-1">出典: Cloudflare Blog https://blog.cloudflare.com/one-observability-platform/（キャプションは筆者による記述）</div>

---

# 6. ドメイン分析を 1 か所に・30 日保持

<div class="text-center">
<img src="https://blog.cloudflare.com/_emdash/api/media/file/01M3Y5WM6SW825JHAF6XANM665.01M3Y5WNRM8N1DW2B1AC94KXZF.png" style="max-height: 300px; margin: 0 auto;" />
</div>

<div class="text-left text-sm pt-2">

- トラフィック・パフォーマンス・セキュリティ・キャッシュ・オリジン・DNS を統合。<strong>全プランで 30 日</strong>
- 数週間前との比較、一時的なスパイクと長期傾向の見分けが可能

</div>

<div class="text-xs opacity-60 pt-1">出典: Cloudflare Blog https://blog.cloudflare.com/one-observability-platform/（キャプションは筆者による記述）</div>

---

# 7. Custom Dashboards

<div class="text-center">
<img src="https://blog.cloudflare.com/_emdash/api/media/file/01M3XHC42Q6QC70QHNQKTWNW44.png" style="max-height: 300px; margin: 0 auto;" />
</div>

<div class="text-left text-sm pt-2">

- 分析・Workers のログとトレース・セキュリティイベントを 1 つのビューに。チームと共有できる
- 画像は「health dash (prod)」の例（リクエスト数・エラー率・P50 / P99 など）

</div>

<div class="text-xs opacity-60 pt-1">出典: Cloudflare Blog https://blog.cloudflare.com/one-observability-platform/（キャプションは筆者による記述）</div>

---

# 8. Logpush を全セルフサーブプランへ

<div class="text-left text-sm pt-2">

- 従来 Enterprise 限定の <strong>Logpush</strong> が全セルフサーブプランで利用可能
- <strong>Transformers</strong> が GA。配信前の絞り込み・伏字化・付加・整形を SQL で。別の ETL 不要

</div>

<div class="text-sm">

| エクスポート | 毎月の無料枠 | 超過分 |
|---|---|---|
| Cloudflare の宛先 | 25 GB | $0.03 / GB |
| 外部の宛先 | 25 GB | $0.10 / GB |
| Logpush Transformers | 1 GB | $0.04 / GB |

</div>

---

# 今後の予定

<div class="text-left text-sm pt-2">

- <strong>より長い保持期間</strong>: ログ・トレースを最長 1 年
- <strong>Workers での OpenTelemetry API 対応</strong>: 既存 span への属性追加、トレースコンテキストの取得
- <strong>OpenTelemetry によるメトリクスのエクスポート</strong>: Cloudflare のメトリクスを互換の宛先へ
- <strong>新料金は 2026年12月1日から</strong>: 変更前に通知される

</div>

---

# コード例: 本記事にコードブロックはない

<div class="text-left text-sm pt-2">

記事にはコード例がないため、更新ごとの「入口」を整理する（記事の記述にもとづく）。

| 更新 | 入口 |
|---|---|
| Logs ホーム | ダッシュボード（SQL / フィルター / 自然言語） |
| Traces | ダッシュボード、OTLP エクスポート、<code>traceparent</code> |
| 統一 SQL API | API、<code>cf</code> CLI、Observability MCP、Workers バインディング |
| カスタムアラート | ダッシュボード、カスタム SQL、Webhook |
| Logpush / Transformers | 設定、SQL 変換 |

</div>

---

# ユースケース 1: 5xx 急増の切り分け

<div class="text-left text-sm pt-2">

- Logs で HTTP events から始め、ホスト名・データセンターでグループ化し、パスで絞る
- Ray ID で個別リクエストを開き、Workers やオリジンのデータセットへ切り替える
- Traces の span で、時間がどこに使われたかを確認する
- ドメイン分析の 30 日履歴で、過去の同じ曜日と比べる

</div>

---

# ユースケース 2: エージェントによる調査と修正の確認

<div class="text-left text-sm pt-2">

- カスタムアラートの Webhook から、調査を始めるエージェントへ通知を送る
- エージェントは <code>cf</code> CLI や Observability MCP サーバーで、ログ・トレース・分析を 1 つの SQL で問い合わせる
- 修正後に同じクエリで結果を確認し、変更と結果の間をつなぐ

</div>

---

# ユースケース 3: Worker から利用量を集計する

<div class="text-left text-sm pt-2">

- SQL バインディングで、Analytics Engine のデータを Worker から直接問い合わせる
- 顧客ごとの利用量の計測と課金ワークフロー
- 顧客向けの分析ダッシュボード、ヘルスレポートの生成
- Logpush + Transformers で、伏字化したログを SIEM・ストレージへ送る運用も組み合わせられる

</div>

---

# まとめ・所感

<div class="text-left text-sm pt-2">

- 8 件は、同日の記事（Traces、誓約アップデート）で詳述された機能を 1 つの基盤として位置づける総覧
- SQL（統一 SQL API）と OpenTelemetry が、人・エージェント・Worker・アラートの共通の入口になる
- 料金はデータ量ベース。2026年12月1日から既存の Workers・Containers・AI Gateway のログにも適用されるため、取り込み量の見積もりが要る
- SQL API とアラートはベータ、複数データセット横断や 1 年保持は近日提供
- 画像キャプションは原文になく、画像の見た目からの記述
- サンプル対象外: 総覧記事で、SQL バインディングはベータかつ詳細が記事に無く、最小実装を正確に書けないため

</div>

---

# 参考リンク

- 原文: https://blog.cloudflare.com/one-observability-platform/
- Observability ドキュメント: https://developers.cloudflare.com/observability/
- 統一 SQL API: https://developers.cloudflare.com/analytics/sql-api/
- 料金: https://developers.cloudflare.com/observability/pricing/
- Alerts: https://developers.cloudflare.com/notifications/
- Custom Dashboards: https://developers.cloudflare.com/analytics/custom-dashboards/
- Logpush: https://developers.cloudflare.com/logs/logpush/

---

# 関連スライド

- Cloudflare Traces: ▶ <a href="../cloudflare-tracing/" target="_blank">解説スライド</a>
- ローカルトレース: ▶ <a href="../local-tracing/" target="_blank">解説スライド</a>
- Workers の Issues: ▶ <a href="../real-time-issue-detection/" target="_blank">解説スライド</a>
- 誓約アップデート: ▶ <a href="../enterprise-for-all-update/" target="_blank">解説スライド</a>
- Billable Usage API: ▶ <a href="../billable-usage-api/" target="_blank">解説スライド</a>
- cf CLI: ▶ <a href="../cloudflare-cf-cli-launch/" target="_blank">解説スライド</a>
- Basin: ▶ <a href="../cloudflare-basin/" target="_blank">解説スライド</a>

<div class="pt-8 text-sm opacity-50">
Wiki: docs/articles/2026-10-02-one-observability-platform.md
</div>
