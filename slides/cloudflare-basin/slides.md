---
routerMode: hash
theme: default
title: "Cloudflare Basin のご紹介: オープンなサーバーレスデータプラットフォームが一般提供に"
info: |
  Introducing Cloudflare Basin の解説スライド。
  原文: https://blog.cloudflare.com/cloudflare-basin/
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

# Cloudflare Basin の<br>ご紹介

オープンなサーバーレスデータプラットフォームが一般提供（GA）に

Birthday Week 2026

<div class="pt-4 text-sm opacity-70">
原文: https://blog.cloudflare.com/cloudflare-basin/<br>
公開日: 2026-10-01
</div>

---

# TL;DR

- Cloudflare Data Platform が<strong>一般提供（GA）</strong>になり、<strong>Cloudflare Basin</strong> に改名。Apache Iceberg と R2 の上のサーバーレス分析基盤
- 3 製品: <strong>Basin Pipelines</strong>（取り込み）・<strong>Basin Catalog</strong>（管理）・<strong>Basin SQL</strong>（クエリ）
- 改善軸は<strong>速度・オープン性・コスト効率</strong>。Pipelines は 1 ストリーム最大 3GB/s、Basin SQL は 190 以上の関数に対応
- PyIceberg・DuckDB・Snowflake・Spark など Iceberg 互換エンジンから読み書き可能。R2 のエグレス無料と使用量ベース課金
- 既存の Pipelines・R2 Data Catalog・R2 SQL の設定は引き続き動作

---

# アジェンダ

- 背景: Iceberg の標準化と R2 のエグレス無料
- Basin とは: 3 製品と改名
- 3 つの改善軸: 速度・オープン性・コスト効率
- Basin Pipelines / Catalog / SQL の強化点
- コード例・ユースケース
- 今後の方向性とまとめ

---

# 背景: なぜデータプラットフォームか

<div class="grid grid-cols-2 gap-6 pt-4 text-left">
<div class="p-4 border rounded">

<strong>変化 1: Apache Iceberg</strong>

- オープンな標準テーブル形式として定着
- ほぼすべての主要クエリエンジンでデータを持ち運べる

</div>
<div class="p-4 border rounded">

<strong>変化 2: R2 へのデータ集約</strong>

- エグレス料金がない
- ツール・チーム・リージョン・クラウドをまたいでも現実的なコスト

</div>
</div>

<div class="text-sm pt-4 text-left">

ベータ公開後、社内の請求・インフラのチームも採用。EC サイトの最適化、請求メトリクスの長期保存、インフラのテレメトリ測定などに利用された。

</div>

---

# Basin とは: 3 製品と改名

<div class="text-sm pt-2">

| 新名称 | 旧名称 | 役割 |
| --- | --- | --- |
| Basin Pipelines | Cloudflare Pipelines | イベントを受け取り SQL で変換して Iceberg / ファイルとして R2 へ |
| Basin Catalog | R2 Data Catalog | Iceberg メタデータ管理とテーブルの自動メンテナンス |
| Basin SQL | R2 SQL | Iceberg テーブルを直接クエリする分散 SQL エンジン |

</div>

<div class="text-sm pt-4 text-left">

データの流れ: <strong>ソース → Pipelines → Catalog（R2 上の Iceberg）→ Basin SQL / 外部エンジン</strong>

「Basin（流域）」は多くの川が 1 点に集まる場所。Pipelines が Catalog へデータを運び、Basin SQL がすぐクエリできる使われ方を表す。

</div>

---

# 3 つの改善軸

<div class="grid grid-cols-3 gap-4 pt-4 text-left text-sm">
<div class="p-3 border rounded">

<strong>速度</strong>

- Catalog 作成・取り込み・クエリが数秒
- Catalog がコンパクションと統計生成
- SQL は統計でタスク分割し Workers に分散

</div>
<div class="p-3 border rounded">

<strong>オープン性</strong>

- ストレージとコンピュートを分離
- PyIceberg・DuckDB・Snowflake・Spark で読み書き
- 可搬性はエグレス無料が前提

</div>
<div class="p-3 border rounded">

<strong>コスト効率</strong>

- 使用量ベースの課金
- 取り込み・処理・クエリ時のみ課金
- 時間課金・別のインフラ費用なし

</div>
</div>

---

# Basin Pipelines の強化点

<div class="text-sm text-left">

HTTP エンドポイントまたは Workers バインディングで受け取り、SQL で処理して Catalog（Iceberg）または R2（JSON / Parquet）へ。ベータ以降、数万の Pipeline が作られた。

</div>

<div class="text-sm pt-3 text-left">

- <strong>スケール</strong>: 1 ストリームあたり最大 3GB/s
- <strong>Logpush 連携</strong>: Cloudflare ログを SQL で変換し Parquet / Iceberg へ
- <strong>スキーマ認識バインディング</strong>: <code>wrangler types</code> でストリームのスキーマから型を生成
- <strong>データ品質エラーの可視化</strong>: 欠落・型不一致・パース失敗・null を区別して表示
- <strong>IaC</strong>: Terraform が Catalog・ストリーム・シンク・SQL を網羅

</div>

---

# Basin Catalog の強化点

<div class="text-sm text-left">

1 コマンドで、フルマネージドの Iceberg REST カタログが手に入り、定期メンテナンスは自動で行われる。

</div>

<div class="text-sm pt-3 text-left">

- <strong>テーブル単位のコンパクションポリシー</strong>: アクセスパターンに応じた目標ファイルサイズ
- <strong>スナップショットの自動期限切れ</strong>: 保持ポリシーに従い、最小数の直近スナップショットは保持
- <strong>未参照データファイルの削除</strong>: 別の Spark メンテナンスジョブが不要
- <strong>マニフェストの最適化</strong>: 断片化したマニフェストをパーティション単位でまとめ、メタデータ I/O を削減

</div>

---

# Basin SQL の強化点

<div class="text-sm text-left">

サーバーレスの分散クエリエンジン。クラスタのプロビジョニングは不要で、人やエージェントがすぐにクエリできる API。

</div>

<div class="text-sm pt-3 text-left">

- 標準・近似の集計、GROUP BY、HAVING、スキーマ探索
- 文字列・タイムスタンプ・正規表現・暗号・統計・配列・マップ・構造体にわたる <strong>190 以上</strong>の関数
- CASE、CTE、キャスト、EXPLAIN、各種 JOIN、サブクエリ
- DISTINCT / UNION / INTERSECT / EXCEPT、ウィンドウ関数、QUALIFY、rollup、cube、JSON 関数群
- Wrangler・API・ダッシュボードのエディタ（補完、プラン表示、結果エクスポート）から実行

</div>

---

# コード例 1: Pipelines の SQL

```sql {all|1-2|3-5|6-7|all}
INSERT INTO http_logs_sink
SELECT
  EdgeResponseStatus,
  to_timestamp_micros(EdgeStartTimestamp) AS event_time,
  upper(ClientRequestMethod) AS method,
  sha256(ClientIP) AS hashed_ip
FROM http_logs_stream
WHERE EdgeResponseStatus >= 400;
```

<div class="text-sm pt-2 text-left">

ストリームからシンクへ。400 以上のログだけを残し、IP を SHA-256 でハッシュ化。取り込み時の変換で保存量とノイズを減らし、機密値を書き込まない。

</div>

---

# コード例 2: Catalog の作成

```bash
npx wrangler basin catalog create CATALOG_NAME
```

<div class="text-sm pt-4 text-left">

- 1 コマンドで、フルマネージドの Apache Iceberg REST カタログが手に入る
- ルーチンのメンテナンス（コンパクション・スナップショット期限切れなど）は自動で行われる
- 外部エンジン（DuckDB・PyIceberg など）からは、この Iceberg REST カタログ経由で R2 上のテーブルにアクセスできる

</div>

---

# コード例 3: Basin SQL の分析クエリ

```sql {all|1-12|13-16|17|all}
WITH account_activity AS (
  SELECT
    a.plan,
    e.account_id,
    count(*) AS events,
    approx_distinct(e.user_id) AS active_users
  FROM analytics.events e
  JOIN analytics.accounts a
    ON e.account_id = a.account_id
  WHERE e.event_time >= '2026-09-01T00:00:00Z'
  GROUP BY a.plan, e.account_id
)
SELECT
  *,
  rank() OVER (PARTITION BY plan ORDER BY events DESC) AS activity_rank
FROM account_activity
QUALIFY rank() OVER (PARTITION BY plan ORDER BY events DESC) <= 10;
```

<div class="text-xs pt-1 text-left">

CTE で 2 テーブルを JOIN して集計 → プランごとにランク付け → <code>QUALIFY</code> で各プランの上位 10 件に絞る。

</div>

---

# ユースケース 1: ログの変換と保存

<div class="text-left pt-2">

- Logpush で Cloudflare の HTTP ログを Pipelines に流す
- SQL でフィルタ・ハッシュ化し、Parquet または Iceberg テーブルとして保存
- Basin SQL や他のエンジンですぐにクエリ

</div>

<div class="text-sm pt-4 text-left">

保存前に不要な行や機密値を落とせるため、保存量とノイズの削減につながる。

</div>

---

# ユースケース 2: アプリのイベント分析

<div class="text-left pt-2">

- Workers から Pipelines のバインディングでイベントを送る
- Iceberg テーブルに蓄積し、Basin SQL でプラン別・顧客別のアクティビティを集計
- スキーマ認識の型生成で、フィールド欠落をデプロイ前に検出

</div>

<div class="text-sm pt-4 text-left">

プロンプトからコーディングエージェントがデータアプリを作る場面でも、待機やポーリングなしに使い始められる、と記事は述べる。

</div>

---

# ユースケース 3: 外部エンジンとの併用・データ共有

<div class="text-left pt-2">

- DuckDB・PyIceberg・Snowflake・Spark から、R2 上の Iceberg テーブルを読み書き
- エグレス無料なので、リージョン・クラウドをまたいでも転送料がかからない
- Bobsled のように、複数のデータ・AI プラットフォームへデータ製品を提供

</div>

<div class="text-sm pt-4 text-left">

社内でも、請求メトリクスの長期保存やインフラのテレメトリ分析に使われている。

</div>

---

# 今後の方向性

<div class="text-sm text-left">

長期のビジョン: データ基盤が抽象化され、開発者が <code>CREATE</code> 文や CLI ではなく問いから始められる。

</div>

<div class="text-sm pt-3 text-left">

- 全体での最新の Iceberg 仕様（V3・Variant 型）への対応
- Cloudflare の開発者向け・可観測性の製品とのゼロ設定接続
- 実際のクエリパターンに合わせた適応的なテーブルメンテナンス
- SQL の互換性・性能・可観測性の拡充（DDL 全面対応を含む）
- ステートフル処理（ストリーミング集計・結合・マテリアライズドビュー）
- コンプライアンス・データ主権のためのツール（jurisdiction 対応）

</div>

---

# まとめ・所感

- 中心は「GA」と「Basin への統一ブランド」。取り込み→管理→クエリの流れが名前から分かる
- 軸は Iceberg という標準形式と、エグレス無料の R2。他のエンジンと併用できる
- クエリ性能のベンチマークは示されておらず、数値は Pipelines の最大 3GB/s のみ
- 既存設定は引き続き動作するため、移行作業は不要
- 最小の Worker サンプルを <code>examples/cloudflare-basin/</code> に用意（dry-run のみ確認）

---

<div class="text-center">

# 参考リンク

</div>

- 原文: [Introducing Cloudflare Basin](https://blog.cloudflare.com/cloudflare-basin/)（日本語版なし）
- [Basin ドキュメント](http://developers.cloudflare.com/basin/) / [チュートリアル](http://developers.cloudflare.com/basin/get-started/guide/)
- [Cloudflare Data Platform の発表（2025）](https://blog.cloudflare.com/cloudflare-data-platform/)
- 関連解説スライド: [ポスト量子暗号の利用状況を可視化](../post-quantum-visibility/)
- Workers サンプル: [examples/cloudflare-basin/](https://github.com/syumai/cloudflare-blog-summaries/tree/main/examples/cloudflare-basin)
- オブザーバビリティ 8 件の更新: ▶ <a href="../one-observability-platform/" target="_blank">解説スライド</a>

<div class="pt-8 text-sm opacity-50">
Wiki: docs/articles/2026-10-01-cloudflare-basin.md
</div>
