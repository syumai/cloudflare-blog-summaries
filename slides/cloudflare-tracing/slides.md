---
routerMode: hash
theme: default
title: "Cloudflare Traces の紹介: プラットフォーム全体でリクエストを追跡する"
info: |
  Introducing Cloudflare Traces: follow requests through our entire platform の解説スライド。
  原文: https://blog.cloudflare.com/cloudflare-tracing/
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

# Cloudflare Traces の紹介

プラットフォーム全体でリクエストを追跡する

Birthday Week 2026 / Observability / Tracing

<div class="pt-4 text-sm opacity-70">
原文: https://blog.cloudflare.com/cloudflare-tracing/<br>
公開日: 2026-10-02
</div>

---

# TL;DR

- <strong>Cloudflare Traces</strong> がオープンベータ。Workers だけだった自動トレーシングを、HTTP リクエスト経路全体に広げる
- セキュリティルール・変換・キャッシュ・ルーティング・Worker・オリジンの各ステップが span として 1 つのタイムラインに載る。<strong>追加の計装は不要</strong>
- 基準のサンプリング率と <strong>Trace Rules</strong> で、取るリクエストを制御する
- W3C <code>traceparent</code> の受け入れ・転送と OTLP エクスポートで、自社サービスまで 1 本のトレースにつなげる
- 料金は取り込み量と保持期間ベース（2026年12月1日から）

---

# アジェンダ

- 背景: Workers Tracing の次の一歩
- 1 つのリクエストを端から端まで追う（4 つの問い）
- 設定: サンプリング率と Trace Rules
- トレースコンテキストの伝播と OTLP エクスポート
- エージェントによる調査、料金、今後の予定
- ユースケース、まとめ

---

# 背景: 内部で使っている可視性を外へ

<div class="text-left text-sm pt-2">

- Cloudflare 内部のトレースは、1 トレースに数千の span、数十のサービス・機能が関わる
- 第一歩が Workers Tracing: Worker 呼び出しの自動計装（アウトバウンド fetch、KV・R2・D1・Durable Objects・他の Workers）
- ただし見えるのは <strong>Workers ランタイムの中</strong>だけ
- 目標: Cloudflare 上でアプリを作る人も、オリジンの前に Cloudflare を置いているだけの人も、同じ水準で見えるようにする

<div class="mt-6 p-4 border rounded">

自分の Cloudflare 設定が、処理時間やルーティングの判断にどう影響しているかを、つなげて見たい。

</div>

</div>

---

# 機能の全体像

<div class="text-left text-sm pt-2">

| 機能 | 内容 |
|---|---|
| 自動トレース | 対応する操作を 1 つのリクエスト単位のタイムラインに記録。追加設定不要 |
| トレース対象の制御 | 基準のサンプリング率 + Trace Rules で上書き |
| コンテキスト伝播 | W3C <code>traceparent</code> の受け入れと転送 |
| ダッシュボードで調査 | タイムラインと span の詳細を表示 |
| OTLP エクスポート | OTLP 互換の任意の宛先へ span を送信 |

- ダッシュボード・API・Terraform から利用できるオープンベータ

</div>

---

# トレース画面: 1 リクエストのタイムライン

<div class="text-center">
<img src="https://blog.cloudflare.com/_emdash/api/media/file/01M3XE76PJXWGQ86MMXRXPYYED.png" style="max-height: 330px; margin: 0 auto;" />
</div>

<div class="text-left text-sm pt-2">

- ルート <code>cloudflare_request</code>（766.16ms）の下に、リダイレクト・変換・Page Rules・<code>workers_routing</code>・<code>upstream</code>・<code>response</code> の span が並ぶ
- 右側に選択した span の属性が出る

</div>

<div class="text-xs opacity-60 pt-1">出典: Cloudflare Blog https://blog.cloudflare.com/cloudflare-tracing/</div>

---

# 問い 1: なぜブロック・チャレンジされたか

<div class="text-center">
<img src="https://blog.cloudflare.com/_emdash/api/media/file/01M3XE7C96A091RSXKVQZ6Z146.png" style="max-height: 300px; margin: 0 auto;" />
</div>

<div class="text-left text-sm pt-2">

- カスタム・マネージドルールの評価時刻、所要時間、結果のアクションが分かる
- 原因のルールは span の event（<code>cloudflare.rule.ref</code>）から特定する
- 図は <code>http_request_firewall_custom</code>（35.52μs、1 event）

</div>

<div class="text-xs opacity-60 pt-1">出典: Cloudflare Blog https://blog.cloudflare.com/cloudflare-tracing/</div>

---

# 問い 2: Transform Rule で URL は書き換わったか

<div class="text-center">
<img src="https://blog.cloudflare.com/_emdash/api/media/file/01M3XE79N2WXESWBXHEV6S25AC.png" style="max-height: 300px; margin: 0 auto;" />
</div>

<div class="text-left text-sm pt-2">

- <code>http_request_transform</code> span で、変更ごとに「影響した要素」と「原因のルール」が分かる
- ルーティングやオリジン処理に対して、いつ変換が起きたかも見える
- 図では 3 events（<code>cloudflare.transform.component=path</code> など）

</div>

<div class="text-xs opacity-60 pt-1">出典: Cloudflare Blog https://blog.cloudflare.com/cloudflare-tracing/</div>

---

# 問い 3: どのルール・Worker が処理したか

<div class="text-center">
<img src="https://blog.cloudflare.com/_emdash/api/media/file/01M3XE7AY2H6B2DZ17WTVVPJ7Q.png" style="max-height: 300px; margin: 0 auto;" />
</div>

<div class="text-left text-sm pt-2">

- <code>workers_routing</code> span に、ルートの一致の有無・ルーティングの種類・一致したパターンが属性として残る
- 図の例: outcome が <code>"matched"</code>、type が <code>"routes"</code>、pattern が <code>"cache.test.walshy.dev/*"</code>

</div>

<div class="text-xs opacity-60 pt-1">出典: Cloudflare Blog https://blog.cloudflare.com/cloudflare-tracing/</div>

---

# 問い 4: どこで時間を使ったか

<div class="text-center">
<img src="https://blog.cloudflare.com/_emdash/api/media/file/01M3XE7DT8DPBXHKN54FJHF0NJ.png" style="max-height: 300px; margin: 0 auto;" />
</div>

<div class="text-left text-sm pt-2">

- <code>upstream</code> の中に <code>cache</code>、さらにその中に <code>origin</code> が入れ子
- 例: キャッシュミスがオリジンへ行き、539ms のうち <strong>527ms</strong> をレスポンス取得に使っていた
- 属性 <code>cloudflare.cache.status</code> は <code>"miss"</code>

</div>

<div class="text-xs opacity-60 pt-1">出典: Cloudflare Blog https://blog.cloudflare.com/cloudflare-tracing/</div>

---

# 設定: 基準のサンプリング率

<div class="text-left text-sm pt-2">

- 特別な計装・設定・プラグインは不要。ドメインで有効化すれば span が自動で生成される
- 基準のサンプリング率（head sampling）で、可視性・データ量・コストのバランスを取る
- 例: 通常時は<strong>リクエストの 1%</strong> を取り、継続的な全体像を得る

<div class="mt-6 p-4 border rounded">

全リクエストを取らなくても、挙動の傾向は見える。

</div>

</div>

---

# 設定: Trace Rules

<div class="grid grid-cols-2 gap-4 pt-2 text-left text-sm">
<div class="p-4 border rounded">

<strong>使い方</strong>

- 基準は 1% のまま
- 問題を報告した顧客のホスト名・送信元 IP・識別ヘッダーだけ <strong>100%</strong>
- 調査中だけ、一時的なデバッグヘッダー付きを 100%

</div>
<div class="p-4 border rounded">

<strong>条件の書き方</strong>

- Cloudflare の Rules 言語
- パス・メソッド・ヘッダー・IP・地域、またはその組み合わせ
- ドメイン全体のトレースを増やさずに問題を再現できる

</div>
</div>

---

# コンテキストの受け入れと伝播

<div class="text-center">
<img src="https://blog.cloudflare.com/_emdash/api/media/file/01M3XE753D6PZGPRRR4XFNDZWD.png" style="max-height: 270px; margin: 0 auto;" />
</div>

<div class="text-left text-sm pt-2">

- 受け入れ: 受信した W3C <code>traceparent</code> を incoming propagation policy に従って受け入れ、トレースに参加する
- 転送: 新しい <code>traceparent</code> をオリジンへ転送。他のサービスが取り出して続ける
- 左（BEFORE）は別々のトレース、右（AFTER）は 1 つにつながったトレース

</div>

<div class="text-xs opacity-60 pt-1">出典: Cloudflare Blog https://blog.cloudflare.com/cloudflare-tracing/</div>

---

# OTLP エクスポート

<div class="text-center">
<img src="https://blog.cloudflare.com/_emdash/api/media/file/01M3XE782NVN38FX5K674ZXXB2.png" style="max-height: 250px; margin: 0 auto;" />
</div>

<div class="text-left text-sm pt-2">

- アカウント単位の宛先（destination）を設定し、どのドメインがトレースを送るかを選ぶ
- Cloudflare は span を OpenTelemetry の形で表現し、OTLP で配信する。データはツール間で持ち運べる
- 同じバックエンドに Cloudflare とアプリの span を送れば、1 本のトレースとして見える

</div>

<div class="text-xs opacity-60 pt-1">出典: Cloudflare Blog https://blog.cloudflare.com/cloudflare-tracing/</div>

---

# エージェントによる調査

<div class="text-left text-sm pt-2">

- コーディングエージェントはコードとテストを見られても、<strong>本番でリクエストに何が起きたか</strong>は見えないことがある
- <strong>Cloudflare Observability MCP サーバー</strong>で、SQL API からトレース（と他のオブザーバビリティデータ）を問い合わせられる
- 失敗したトレースと成功したトレースを比べ、span が分岐する場所を見つける
- リポジトリも調べられるので、該当コードに結びつけ、修正案までつなげられる

</div>

---

# 料金（2026年12月1日から）

<div class="text-left text-sm pt-2">

span やイベントの数ではなく、<strong>取り込んだデータ量と保持期間</strong>で課金（Workers Tracing も対象）

| プラン | 含まれる量 | 保持 | 超過分 |
|---|---|---|---|
| Free | 1 日 0.5 GB 取り込み | 7 日 | 利用不可 |
| Paid / Enterprise | 50 GB 取り込み + 10 GB-month 保存（請求サイクルあたり） | 最長 1 年（近日提供） | $0.25 / GB 取り込み、$0.10 / GB-month 保存 |

</div>

---

# 今後の予定

<div class="text-left text-sm pt-2">

- <strong>より広い自動計装</strong>: HTTP 経路（DDoS ルール、Access など）と Workers 実行経路（Workflows、Queues、Pipelines など）
- <strong>認証付きのコンテキスト伝播</strong>: 信頼できる呼び出し元だけがトレースを続けられる
- <strong>アドホックなトレース</strong>: 基準を変えずに、特定のリクエストをオンデマンドで取る
- <strong>Workers での OpenTelemetry API 対応</strong>: 既存 span への属性追加、トレースコンテキストの取得
- <strong>より長い保持</strong>: 最長 365 日

</div>

---

# コード例について

<div class="text-left text-sm pt-2">

記事本文にコード例（コードブロック）はない。設定はダッシュボード・API・Terraform で行う。代わりに、記事の図に現れる span 名と見どころを整理する。

| span 名 | 見どころ |
|---|---|
| <code>cloudflare_request</code> | リクエスト全体のルート |
| <code>http_request_transform</code> | 変更した要素と原因のルールが event に残る |
| <code>http_request_firewall_custom</code> | 動作したルールの参照が event に残る |
| <code>workers_routing</code> | 一致の有無・種類・パターンが属性に残る |
| <code>upstream</code> / <code>cache</code> / <code>origin</code> | 入れ子で時間の内訳が分かる |

</div>

---

# コード例: Workers から属性を足す（関連記事）

<div class="text-left text-sm pt-2">

- 記事自体にコードはないが、Workers 内のコードから現在の span に属性を足す API は関連記事にある
- 今後の予定にある「OpenTelemetry API 対応」は、この延長にあると読める（筆者の読み）

<div class="mt-4 p-4 border rounded">

- Issues の記事: <code>tracing.getActiveSpan()</code> で属性を設定 ▶ <a href="../real-time-issue-detection/" target="_blank">解説スライド</a>
- ローカルトレースの記事: <code>wrangler dev</code> でのトレース生成 ▶ <a href="../local-tracing/" target="_blank">解説スライド</a>

</div>

</div>

---

# ユースケース 1: ブロックと書き換えの原因調査

<div class="text-left text-sm pt-2">

- 「なぜ止まったのか」: <code>http_request_firewall_custom</code> の event から、動作したルールを特定する
- 「なぜ URL が変わったのか」: <code>http_request_transform</code> の event で、変更した要素と原因のルールを確認する
- Page Rules・Snippets・Workers のどれが効いたかは <code>workers_routing</code> で切り分ける
- 個別のログと設定を突き合わせて復元する作業が、1 つのタイムラインで済む

</div>

---

# ユースケース 2: 遅さの内訳と特定顧客の深掘り

<div class="text-left text-sm pt-2">

- <strong>遅さの内訳</strong>: cache・upstream・origin の span で、キャッシュミス後のオリジン応答待ちが支配的かを確認する
- <strong>特定顧客の問題</strong>: 基準 1% のまま、その顧客のホスト名・IP・ヘッダーだけ Trace Rules で 100%
- <strong>サービスをまたぐ調査</strong>: <code>traceparent</code> の伝播と OTLP エクスポートで、アプリの span と同じバックエンドで見る
- <strong>エージェントに調査させる</strong>: MCP サーバーと SQL API で、失敗と成功のトレースを比べさせる

</div>

---

# まとめ・所感

<div class="text-left text-sm pt-2">

- Workers の「中」だけだった可視性が、リクエスト経路全体に広がった。設定と挙動の因果関係を 1 本のタイムラインで追える
- Trace Rules により、低い基準サンプリングと、問題時の 100% 取得を両立できる
- OpenTelemetry / OTLP 前提なので、既存のオブザーバビリティ基盤に流し込める
- 料金は 2026年12月1日からデータ量ベース。Workers Tracing の既存利用者も確認が必要
- 記事の画像キャプションは原文になく、画像の見た目からの記述
- サンプル対象外: 中心機能がドメイン単位のプラットフォーム側の計装で、最小の Worker では再現できないため（Workers の <code>tracing</code> API は既存サンプルが扱う）

</div>

---

# 参考リンク

- 原文: https://blog.cloudflare.com/cloudflare-tracing/
- Cloudflare Traces ドキュメント: https://developers.cloudflare.com/observability/traces/
- Span の一覧: https://developers.cloudflare.com/observability/traces/spans/
- 設定（Trace Rules など）: https://developers.cloudflare.com/observability/traces/configuration/
- OpenTelemetry エクスポート: https://developers.cloudflare.com/observability/export/opentelemetry/
- 料金: https://developers.cloudflare.com/observability/pricing/
- Workers Tracing オープンベータ: https://blog.cloudflare.com/workers-tracing-now-in-open-beta/
- ローカルトレース: ▶ <a href="../local-tracing/" target="_blank">解説スライド</a>（<code>examples/local-tracing/</code>）
- Workers の Issues: ▶ <a href="../real-time-issue-detection/" target="_blank">解説スライド</a>（<code>examples/real-time-issue-detection/</code>）

<div class="pt-8 text-sm opacity-50">
Wiki: docs/articles/2026-10-02-cloudflare-tracing.md
</div>
