# Cloudflare Basin のご紹介: オープンなサーバーレスデータプラットフォームが一般提供に

- 原文: [https://blog.cloudflare.com/cloudflare-basin/](https://blog.cloudflare.com/cloudflare-basin/)（原題: Introducing Cloudflare Basin: an open, serverless data platform, now generally available）
- 日本語版の出どころ: Cloudflare公式の日本語版（`https://blog.cloudflare.com/ja-jp/cloudflare-basin/`）は確認時点で存在しなかった（404）ため、英語版（en-us）から日本語化して要約している。タイトルも筆者による訳。公開日は英語原文の datePublished（2026-10-01T12:58:00Z）に従う。
- 公開日: 2026-10-01
- 著者: Marc Selwan, Micah Wylde
- 位置づけ: Birthday Week 2026 の記事（読了目安は原文表記で 11 分）。昨年の Birthday Week 2025 で発表した Cloudflare Data Platform の一般提供（GA）と、「Cloudflare Basin」への改名を扱う
- 関連: [ポスト量子暗号の利用状況を可視化](./2026-09-29-post-quantum-visibility.md)（Logpush でログを取得する側の記事。本記事の Pipelines は Logpush のログを SQL で変換して保存できる）、[Cloudflare K2 のご紹介: サーバーレスなイベントストリーム](./2026-10-01-cloudflare-k2-streams.md)（Pipelines の取り込み層として作られた永続イベントストリーム。Pipelines との使い分けも説明されている） / [Cloudflare Observability の 8 つの大型アップデート](./2026-10-02-one-observability-platform.md)（Birthday Week 2026 のオブザーバビリティ統合の総覧記事）
- GitHub: [docs/articles/2026-10-01-cloudflare-basin.md](https://github.com/syumai/cloudflare-blog-summaries/blob/main/docs/articles/2026-10-01-cloudflare-basin.md)

![記事ヘッダー画像](https://blog.cloudflare.com/_emdash/api/media/file/01M3TBHN0F85Z2NSDVC4T3HF05.png)
*図: 記事ヘッダー画像。中央の円柱型のデータストアに、左下の入力側から Pipelines を通ってデータが流れ込み、右上のテーブルやクエリ側へ流れていく様子を描いた装飾イラスト（出典: Cloudflare Blog https://blog.cloudflare.com/cloudflare-basin/。原文にキャプションはなく、説明は見た目からの筆者の推定。装飾のため、図としては扱わない）*

## TL;DR

- Birthday Week 2025 に発表した **Cloudflare Data Platform** が**一般提供（GA）**になり、**Cloudflare Basin** に改名された。Apache Iceberg と R2 Object Storage の上に作られた、サーバーレスのデータ分析プラットフォーム。
- 構成は 3 製品。**Basin Pipelines**（旧 Cloudflare Pipelines: イベントの取り込み・SQL 変換・書き込み）、**Basin Catalog**（旧 R2 Data Catalog: Iceberg のメタデータ管理とテーブルの自動メンテナンス）、**Basin SQL**（旧 R2 SQL: Iceberg テーブルを直接クエリする分散 SQL エンジン）。
- 改善の軸は**速度・オープン性・コスト効率**。Pipelines は 1 ストリームあたり最大 3GB/s の取り込み、Basin SQL は 190 以上の関数と JOIN・ウィンドウ関数・CTE に対応。
- 任意の Iceberg 互換エンジン（PyIceberg・DuckDB・Snowflake・Apache Spark）から読み書きでき、R2 のエグレス無料と使用量ベースの課金（時間課金なし）が前提。
- 既存の Cloudflare Pipelines・R2 Data Catalog・R2 SQL の設定は引き続き動作する。

## 背景・課題

記事は、昨年データプラットフォームを作り始めた理由を、2 つの変化として挙げる。1 つ目は、**Apache Iceberg が標準のオープンなテーブル形式**として定着し、ほぼすべての主要なクエリエンジンでデータを持ち運べるようになったこと。2 つ目は、開発者が分析データを **R2** に置き始めたこと。エグレス料金がないため、異なるツール・チーム・リージョン・クラウドからデータにアクセスしても現実的なコストで済む。

ベータ公開後、Cloudflare 社内の請求（billing）やインフラのチームも含め、すぐに採用が始まった。用途は、リアルタイムデータを使った EC サイトの最適化、請求メトリクスの長期保存とレポート、Cloudflare インフラのテレメトリの取り込みと稼働効率の測定など。記事には Anomaly 共同創業者 Dax Raad 氏の引用があり、AWS の S3 と Athena の複雑な構成を、Basin のサーバーレス構成に置き換えて全社のイベントデータを処理していると述べている。

初期の利用者から学んだことを踏まえて、この 1 年は **速度・オープン性・コスト効率** の 3 点を改善してきた、というのが記事の筋立てである。

## 発表内容 / アーキテクチャ

### 全体像とリブランド

Basin は、Apache Iceberg と R2 Object Storage の上に作られたサーバーレスのデータ分析プラットフォームで、次の 3 製品からなる。

| 新名称 | 旧名称 | 役割 |
| --- | --- | --- |
| Basin Pipelines | Cloudflare Pipelines | Workers・HTTP・Logpush からイベントを受け取り、SQL で変換して、R2 に Iceberg テーブルまたはファイルとして書く |
| Basin Catalog | R2 Data Catalog | Iceberg のメタデータを管理し、テーブルを自動でメンテナンスして高速・低コストに保つ |
| Basin SQL | R2 SQL | Cloudflare 上の Iceberg テーブルを直接クエリする、サーバーレスの分散 SQL エンジン |

これで、アプリ・インフラ・デバイス・他の Cloudflare サービスなどからデータを集め、分析の問いに答えるまでを Developer Platform 上で完結できる、と記事は述べる。

### 名前の由来

「Basin（盆地・流域）」は、多くの川が 1 点に集まる場所。Pipelines が Basin Catalog へデータを運び、Basin SQL がそれをすぐクエリできる、という使われ方を表す。小ネタとして、地球の陸地の約 20% が内陸流域（endorheic basin）に流れ込むことと、Web の 20% 超が Cloudflare のネットワークの背後にあることが重ねられている。

![スウェーデンのヴェーネルン湖](https://blog.cloudflare.com/_emdash/api/media/file/01M3TBHJX9WGXWD3N702DWC4QP.jpg)
*図: スウェーデンのヴェーネルン湖。原文のキャプションは「Lake Vänern, Sweden - A basin created from tectonic activity 200-300 million years ago.」（約 2〜3 億年前の地殻変動でできた盆地）（出典: Cloudflare Blog https://blog.cloudflare.com/cloudflare-basin/）*

### 3 つの改善軸

- **速度**: Catalog の作成・Pipeline の設定・Basin SQL でのクエリを数秒で行える。プロンプトからコーディングエージェントがデータアプリを作る場面では、リソースやデータの待機・ポーリングが不要になる点が重要、と記事は書く。データが増えると、Basin Catalog がメタデータとデータファイルをコンパクションして I/O を減らし、クエリ計画用の統計を生成する。Basin SQL はその統計でクエリを小さなタスクに分割し、Workers に分散させて、データ規模が増えても速さと一貫性を保つ。
- **オープン性**: 開発者が自分のデータを所有・管理する、という考え方に沿い、ストレージ層とコンピュート層を分離して、用途に合うクエリエンジンを使えるようにする。PyIceberg・DuckDB・Snowflake・Apache Spark など Iceberg 互換のエンジンで読み書きできる。この可搬性は、リージョンやクラウドを問わずアクセスできる**エグレス無料**があって成り立つ、という主張。Bobsled の Julien Grobbelaar 氏の引用では、主要なデータ・AI プラットフォームのあらゆるリージョンでデータ製品を提供でき、ゼロエグレスでコストを抑えられるとしている。
- **コスト効率**: サーバーレスなので使用量ベースの課金。データを取り込み・処理・クエリしたときだけ課金され、時間課金や別のインフラ費用はない。趣味のプロジェクトならほぼ無料で、大規模でも経済的にスケールする、としている。

### Basin Pipelines

HTTP エンドポイントまたは Workers バインディングでイベントを受け取り、SQL クエリに従って処理し、Basin Catalog の Iceberg テーブルへ、または R2 に JSON / Parquet ファイルとして届ける。ベータ以降、利用者は**数万**の Pipeline を作成した。

取り込み時に SQL で処理すると、保存量の削減、動的なデータ源のノイズ低減、機密や不要な値を書き込まないことにつながる、と記事は説明する（コード例を参照）。ベータ以降の強化点は次のとおり。

- **スケーラビリティ**: 1 ストリームあたり最大 3GB/s の取り込みに対応。
- **Cloudflare Logpush 連携**: Cloudflare のログを SQL で変換し、圧縮 Parquet または Iceberg テーブルとして保存し、Basin SQL などでクエリできる。
- **スキーマを認識する Worker バインディング**: `wrangler types` がストリームのスキーマから TypeScript 型を生成し、フィールドの欠落や型の不一致をデプロイ前に検出できる。
- **データ品質エラーの可視化**: ダッシュボードと GraphQL API が、破棄されたイベントを表示し、フィールド欠落・型不一致・パース失敗・null 値を区別する。
- **IaC 対応**: Terraform のリソースが Catalog・ストリーム・シンクと、それをつなぐ SQL を網羅する。

今後の予定: Basin Catalog への書き込み時のカスタムパーティショニング、スキーマのマイグレーションと設定・Pipelines SQL の更新、Iceberg V3（半構造化データ向けの Variant 型を含む）対応、ストリーミング集計・結合・インクリメンタルに更新されるマテリアライズドビューなどのステートフル処理。

### Basin Catalog

昨年最初に発表した製品。DuckDB に R2 上の分析データへの構造化されたアクセスを与える単純な用途から、ゼロエグレスと使いやすい API を活かした企業向けのデータ共有基盤まで、数千人の開発者が利用している。Apache Iceberg を始める最も簡単な方法で、1 コマンドで、定期的なメンテナンスを自動で行う、フルマネージドの Iceberg REST カタログが手に入る。

データ量の増加に合わせて、次のメンテナンス機能が加わった。

- **テーブル単位のコンパクションポリシー**: アクセスパターンに応じて目標ファイルサイズを選べる。
- **スナップショットの自動期限切れ**: 保持ポリシーに従い古い Iceberg スナップショットを削除しつつ、直近のスナップショットを最小数だけ残す。
- **参照されなくなったデータファイルの削除**: スナップショットの期限切れで解放できる領域を回収する。別の Spark メンテナンスジョブは不要。
- **マニフェストの最適化**: コンパクションの前に、断片化したマニフェストをパーティション単位でまとめ、クラスタ化して、クエリ計画時のメタデータ I/O を減らす。

開発中: 検索性能向上のためのデータのソート・クラスタ化を効率化する新しいコンパクション、名前空間とテーブル単位の細かい認可制御、データ主権・コンプライアンス要件のための jurisdiction（管轄）対応。

### Basin SQL

Basin Catalog の Iceberg テーブルに対する、サーバーレスの分散クエリエンジン。大きなデータセットの読み取り向けで、Cloudflare のグローバルネットワーク全体へ自動でスケールする。プロビジョニングするクラスタやリソースはなく、人やエージェントがすぐにクエリできる API として使える。

ベータ時点ではイベントや時系列の大きなテーブルのフィルタ・探索が得意だったが、この 1 年で数百の関数に対応した。

- 標準・近似の集計、GROUP BY、HAVING、スキーマ探索のコマンド
- 文字列・タイムスタンプ・正規表現・暗号・統計・配列・マップ・構造体にわたる 190 以上のスカラー／集計関数
- CASE 式、共通テーブル式（CTE）、キャスト、算術、EXPLAIN
- inner / outer / semi / anti 結合、サブクエリ、自己結合、複数テーブルのクエリ
- DISTINCT、UNION、INTERSECT、EXCEPT
- ウィンドウ関数、QUALIFY、grouping sets、rollup、cube
- JSON 関数群

Wrangler、API、またはダッシュボードの組み込みエディタから実行できる。エディタは、シンタックスハイライトと補完、名前空間・テーブルのブラウザ、クエリの統計と計画、結果のエクスポートを備える。

開発中: 高度な統計と適応的スケジューリング、Basin SQL 自体からの DDL の全面対応、VARIANT と地理空間型を含む Iceberg V3 対応。

### 今後の方向性

データ基盤が完全に抽象化され、ストレージ形式・製品・リソースが実装の詳細になる、というのが長期のビジョン。開発者が `CREATE` 文や CLI コマンドではなく、問いから始められるプラットフォームを目指す。具体的には、プラットフォーム全体での最新の Iceberg 仕様への対応、Cloudflare の開発者向け・可観測性の製品とのゼロ設定の接続（ワンクリックの取り込み元・書き出し先）、実際のクエリパターンに合わせてデータを整理する適応的なテーブルメンテナンス、SQL 互換性・性能・可観測性の拡充、データのシグナルに応じて処理やアクションを起こすリアルタイム処理の拡充、コンプライアンス・データ主権のツールが挙げられている。オープンな形式・プロトコルを使い続け、依存するプロジェクトへ改善を還元する、とも述べる。

### 始め方

Basin Pipelines・Basin Catalog・Basin SQL は本日 GA。3 つをまとめたエンドツーエンドのプラットフォームとしても、既存の構成に合う部分だけの採用でも使える。チュートリアルで、イベントを取り込み、Basin Catalog に Iceberg テーブルを作り、Basin SQL でクエリする流れを体験できる。**既存の Cloudflare Pipelines・R2 Data Catalog・R2 SQL の設定は引き続き動作する**。

## コード例

記事のコード例は 3 つ。いずれも原文のまま転記する。

### 1. Pipelines: HTTP ログを変換して保存する SQL

```sql
INSERT INTO http_logs_sink
SELECT
  EdgeResponseStatus,
  to_timestamp_micros(EdgeStartTimestamp) AS event_time,
  upper(ClientRequestMethod) AS method,
  sha256(ClientIP) AS hashed_ip
FROM http_logs_stream
WHERE EdgeResponseStatus >= 400;
```

ストリーム（`http_logs_stream`）から読み、シンク（`http_logs_sink`）へ書く。ステータスコード 400 以上のログだけを残し（`WHERE`）、マイクロ秒のタイムスタンプを `event_time` に変換し、メソッドを大文字化し、クライアント IP を SHA-256 でハッシュ化している。取り込み時の変換で、保存量・ノイズを減らし、生の IP のような機密値を書き込まずに済ませる例として示されている。

### 2. Catalog の作成コマンド

```bash
npx wrangler basin catalog create CATALOG_NAME
```

1 コマンドで、フルマネージドの Apache Iceberg REST カタログが作成される（記事の説明）。

### 3. Basin SQL: JOIN・集計・ウィンドウ関数・QUALIFY を 1 クエリで

```sql
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

Pipeline が「アプリのイベント」と「アカウントのデータ」を別テーブルに届けている想定。CTE `account_activity` で、2 つのテーブルを `account_id` で JOIN し、プランとアカウントごとにイベント数（`count(*)`）と近似の一意ユーザー数（`approx_distinct`）を集計する。外側のクエリでは、プランごとにイベント数の多い順のランク（`rank() OVER`）を付け、`QUALIFY` でランク 10 位以内だけに絞り込む。

## ユースケース

- **ログの変換・保存**: Cloudflare の HTTP ログを Logpush から Pipelines に流し、SQL でフィルタ・ハッシュ化してから Parquet または Iceberg テーブルに保存する。
- **アプリのイベント分析**: Workers から Pipelines のバインディングでイベントを送り、Iceberg テーブルに蓄積して、Basin SQL でプラン別・顧客別のアクティビティを集計する。
- **請求メトリクスの長期保存**: 記事が挙げる社内の用途。請求系のメトリクスを長期間保存し、レポートに使う。
- **インフラのテレメトリ分析**: 稼働状況を取り込み、使用率や効率の測定・改善に使う。
- **DuckDB・Spark など外部エンジンとの併用**: R2 上の Iceberg テーブルを、Basin Catalog 経由で他のエンジンから読み書きする。エグレス無料なので、リージョンやクラウドをまたいでもデータ転送料がかからない。
- **データ共有基盤**: Bobsled のように、ゼロエグレスを活かして複数のデータ・AI プラットフォームにデータ製品を提供する。

## 所感・ポイント

- 製品自体は昨年からあり、今回の中心は「GA」と「Basin への統一ブランド」。3 製品の名前が `Basin <機能>` にそろい、Pipelines（取り込み）→ Catalog（保存・管理）→ SQL（クエリ）の流れが名前から分かるようになった。既存設定は引き続き動作するとされているので、移行作業は要らない。
- 設計の軸は「Iceberg という標準形式＋エグレス無料の R2」。ベンダーロックインを避けつつ、他のエンジンと併用できる点が、記事全体の主張になっている。
- Basin SQL の分散実行が Workers 上で行われる（統計でクエリをタスクに分割して Workers に分散する）という説明は、Cloudflare 自身のプラットフォームを使った構成として興味深い。
- 記事の性能に関する数値は、Pipelines の「1 ストリームあたり最大 3GB/s」のみで、クエリ性能のベンチマークは示されていない。
- 開発中の項目（Iceberg V3・Variant 型・DDL・ステートフル処理など）は現時点では未提供の予定である点に注意。
- 画像キャプション: ヘッダー画像は原文のキャプションが確認できず、説明は見た目からの筆者の推定。湖の写真は原文のキャプションをそのまま訳した。
- **サンプルについて**: 記事の中心機能は Workers から使え GA であるため、Pipelines のストリームへ Workers バインディングでイベントを送る最小サンプルを [`examples/cloudflare-basin/`](../../examples/cloudflare-basin/) に用意した（`wrangler deploy --dry-run` と型チェックのみ確認。実際のストリームへの書き込みは未確認）。Catalog・SQL 側はアカウントのリソース作成が必要なため、記事のチュートリアルに従う。

## 関連リンク

- 原文（en-us）: [https://blog.cloudflare.com/cloudflare-basin/](https://blog.cloudflare.com/cloudflare-basin/)
- 本リポジトリ内の関連記事: [ポスト量子暗号の利用状況を可視化](./2026-09-29-post-quantum-visibility.md)
- Workers サンプル: [examples/cloudflare-basin/](../../examples/cloudflare-basin/)
- 記事内から張られているリンク:
  - [Cloudflare Data Platform の発表（Birthday Week 2025）](https://blog.cloudflare.com/cloudflare-data-platform/)
  - [Apache Iceberg](https://iceberg.apache.org/) / [R2 Object Storage](https://developers.cloudflare.com/r2/)
  - [Basin チュートリアル](http://developers.cloudflare.com/basin/get-started/guide/) / [Basin ドキュメント](http://developers.cloudflare.com/basin/)
  - [Basin Pipelines](http://developers.cloudflare.com/basin-pipelines/) / [Basin Catalog](http://developers.cloudflare.com/basin-catalog/) / [Basin SQL](http://developers.cloudflare.com/basin-sql/)
  - [Cloudflare Developer Discord](https://discord.com/invite/cloudflaredev)
