# Webはどれくらい速いのか: BEACON で数十億件の実ユーザー計測を探索する

- 原文: [https://blog.cloudflare.com/how-fast-is-the-web/](https://blog.cloudflare.com/how-fast-is-the-web/)
- 日本語版の出どころ: Cloudflare公式の日本語版（ja-jp）は確認時点で存在しなかった（404）ため、英語版（en-us）から日本語化して要約している。公開日は英語原文の datePublished に従う。
- 公開日: 2026-09-28
- 位置づけ: Birthday Week 2026 の記事
- 著者: Ryan Townsend、Nic Jansma
- 関連: [Radar Researcher の紹介](./2026-08-07-introducing-radar-researcher.md)（同じ Cloudflare Radar の公開データ基盤に関する記事）
- GitHub: [docs/articles/2026-09-28-how-fast-is-the-web.md](https://github.com/syumai/cloudflare-blog-summaries/blob/main/docs/articles/2026-09-28-how-fast-is-the-web.md)

![WebKit（Safari）の利用率が高い国々の地図](https://blog.cloudflare.com/_emdash/api/media/file/01M3CW03Y63NTVT66FJ88HX38K.png)
*図: 国によっては WebKit（Safari）の利用率が最大48%に達する（2026年9月9日時点）（出典: Cloudflare Blog https://blog.cloudflare.com/how-fast-is-the-web/）*

## TL;DR

- Cloudflare が **BEACON**（Browser Experience Across Cloudflare's Observed Network）を公開した。自社ネットワーク上の大規模サイト1万件から集めた、匿名化済みの実ユーザー計測（RUM）データセットで、Google BigQuery に毎日更新される。
- コミュニティ主導の [RUM Archive](https://rumarchive.com/) の規格に沿っており、そのフットプリントを100倍に拡大する。Core Web Vitals（LCP・CLS・INP）を平均値ではなく**ヒストグラム**で提供するため、P75 を超えたロングテールも分析できる。
- 分析例: WebKit は全体では優秀だが46か国で Blink より悪い、業種別の差、LCP のサブパーツ（ダウンロードが最小の要因）、ハード／ソフトナビゲーションの差、GDP との相関、大陸別の転送サイズ。
- 個人やサイトが特定されないよう、ドメイン・URL パスの除去、上位1万サイトへの絞り込みと正規化、集計（5件未満は破棄）を行っている。
- 記事中の全データに対応するクエリが BigQuery に保存されており、自分の分析に流用できる。

## 背景・課題

技術者は高性能なノート PC や最新スマホ、高速な Wi-Fi で作業していることが多い。一方、エンドユーザーは4年前の廉価なスマホ、バッテリー残量の少ない端末、2GB で速度制限がかかるデータプラン、整備が不十分な公共インフラなどの環境にいる。世界の数十億人規模でこの差が広がると、「自分の環境では動く」と「全員に対して動く」の乖離が、技術選定や優先順位の判断を歪める。

Cloudflare は RUM（Real User Monitoring）のテレメトリを長年、顧客ごとのサイト向けに収集してきた。BEACON は、その視点を匿名化したうえで一般に公開し、「実際の人々がウェブをどう体験しているか」を客観的なデータで示す試みである。

## 発表内容 / アーキテクチャ

### BEACON データセットの概要

| 項目 | 内容 |
| --- | --- |
| 対象 | Cloudflare ネットワーク上の大規模サイト1万件 |
| 範囲 | 主要なブラウザエンジンすべて |
| 配布 | Google BigQuery（毎日更新） |
| 規格 | [RUM Archive](https://rumarchive.com/) に準拠（そのフットプリントを100倍に拡大） |
| 指標 | Core Web Vitals（LCP / CLS / INP）をヒストグラムで提供 |

- LCP（Largest Contentful Paint）: 読み込み時間
- CLS（Cumulative Layout Shift）: 視覚的な安定性
- INP（Interaction to Next Paint）: 操作への応答性

ヒストグラムで公開されるため、任意のパーセンタイルを導出できる。P75 で止まらず、ロングテールを確認できる点が特徴。

### 誰がより遅いウェブを体験しているか

![iOS と Android の P90 Core Web Vitals](https://blog.cloudflare.com/_emdash/api/media/file/01M3CW029B6K1FRNH3XPPX7VR1.png)
*図: iOS と Android の P90 Core Web Vitals（出典: Cloudflare Blog https://blog.cloudflare.com/how-fast-is-the-web/）*

- 図では iOS の LCP が 2,458ms、Android が 3,252ms、INP は iOS 233ms・Android 414ms、CLS は Android が 0.617（iOS は未対応）。
- 現在 iOS で唯一のエンジンである **WebKit** は全体として最良の成績だが、例外がある。WebKit が全トラフィックの10%超を占める46か国では、LCP・INP の一方または両方が Blink 系（Chrome・Edge・Opera）より10%以上悪い。例: カンボジアでは WebKit がページビューの17.5%を占めるが、LCP は Blink より50%悪い。

### 業種別の違い

BEACON には [Intel API](https://developers.cloudflare.com/api/resources/intel/subresources/domains/subresources/bulks/methods/get/) による業種分類が含まれる。Government and Politics、Health、Safe for Kids は高成績で、Ads、Religion、Weather は概して低成績。P75 だけでは見えない差が追加のパーセンタイルで露呈し、特に CLS ではロングテールで大きく悪化する業種が多い。

![業種別の Core Web Vitals（LCP・CLS・INP の P75/P90/P95）](https://blog.cloudflare.com/_emdash/api/media/file/01M3CVZVSHQAM412CTZ6ED1JMD.png)
*図: 業種別の Core Web Vitals。BigQuery に 'CWVs by Industry' として保存されたクエリの結果（出典: Cloudflare Blog https://blog.cloudflare.com/how-fast-is-the-web/）*

### ページが遅く感じる原因: サブパーツ分析

BEACON は RUM Archive の規格を拡張し、LCP と INP の**サブパーツ**を含む。数週間以内に Cloudflare の RUM ダッシュボードにも追加される予定。

**LCP のサブパーツ**（各値は該当しきい値帯でのサブパーツの時間）

| 帯 | Document TTFB | Load Delay | Load Duration | Render Delay |
| --- | --- | --- | --- | --- |
| Good | 598ms | 76ms | 119ms | 157ms |
| Needs Improvement | 1015ms | 1049ms | 199ms | 437ms |
| Poor | 1891ms | 1485ms | 119ms | 2002ms |

- Document TTFB: HTML が届くまで何も描画できない
- Load Delay: JavaScript への依存で LCP 候補の発見が遅れていないか
- Load Duration: LCP の画像・動画・Webフォントのダウンロードに時間がかかっていないか
- Render Delay: 準備ができた後、描画を妨げているものがないか

「リソース（画像・フォント・動画）自体のダウンロードが体感時間に占める割合は最も小さい」という通説に反する結果が出ている。Good を外れるページビューの多くでは、LCP 候補の**発見**と**描画のブロック解除**に大きな改善余地がある。リソース発見の遅延には [Smart Hints](https://blog.cloudflare.com/smart-hints/) が有効とされる。

**INP のサブパーツ**

| 帯 | Input Delay | Processing Time | Presentation Delay |
| --- | --- | --- | --- |
| Good | 18ms | 55ms | 56ms |
| Needs Improvement | 32ms | 112ms | 111ms |
| Poor | 84ms | 284ms | 217ms |

最も遅い操作では JavaScript の実行時間が最長だが、プレゼンテーション遅延も大きく伸びる（多くは複雑な CSS レイアウト再計算）。サードパーティ JavaScript の影響軽減には [Zaraz](https://www.cloudflare.com/application-services/products/zaraz/) が使える。

### アプリケーションアーキテクチャによる違い

Cloudflare は最近、Chrome の [Soft Navigations API](https://developers.cloudflare.com/changelog/post/2026-08-21-improved-soft-navigation-measurement-for-single-page-applications/) に対応した。React・Vue・Angular・Svelte などの SPA で多いクライアント側遷移でも、正確な LCP を報告できる。

| LCP パーセンタイル | P50 | P75 | P90 | P95 |
| --- | --- | --- | --- | --- |
| Hard Navigations | 791ms | 1,421ms | 2,636ms | 4,122ms |
| Soft Navigations | 274ms | 582ms | 1,169ms | 1,816ms |
| Landing Page | 1,370ms | 2,681ms | 5,397ms | 8,940ms |

ソフトナビゲーションはどのパーセンタイルでもハードナビゲーションの2〜3倍速い。ただし最初のランディングページは相当に重くなりがちで、2回目以降の高速化が初回の遅さを上回るかはトレードオフになる。ユーザーがランディングページ以降にほとんど進まないなら、重い初回ロードは回収できない。

### データを組み合わせる: GDP・IQI・転送サイズ

BEACON はオープンデータなので、他のデータと結合できる。世界銀行の1人あたり GDP と組み合わせると、国ごとの経済状況とウェブ性能の相関が見える。

![1人あたり GDP と P75 LCP の散布図](https://blog.cloudflare.com/_emdash/api/media/file/01M3D2CQZQKQVQX6D8FY3RREKY.01M3D2CRG6S7HCCYKA2SWA2RWT.png)
*図: GDP per Capita と P75 LCP（トレンド R² = 0.43）。BigQuery に 'Country-level Performance Aggregates' として保存（出典: Cloudflare Blog https://blog.cloudflare.com/how-fast-is-the-web/）*

[Cloudflare Radar](https://radar.cloudflare.com/) は、BEACON と Internet Quality Index（IQI）の相関を扱う新しい Web Performance セクションを提供する予定。IQI は半期ごとのネットワーク性能アップデートの元になる集約データである。BEACON は「訪問先サイトの性能」、IQI は「ユーザー側ネットワーク（アイボールネットワーク）の性能」を表し、両者が合わさって体験が「苦痛」か「快適」かが決まる。

![IQI の帯域幅と LCP の関係](https://blog.cloudflare.com/_emdash/api/media/file/01M3CW87N5G9JC3ST2RJV98866.01M3CW89EM48V9VDRR5PKPQJBM.png)
*図: 大陸別の帯域幅と LCP の関係（出典: Cloudflare Blog https://blog.cloudflare.com/how-fast-is-the-web/）*

![IQI と転送サイズの関係](https://blog.cloudflare.com/_emdash/api/media/file/01M3CW87JV0HXH3G8HZ4JFZH94.01M3CW88SY8QJCZMJZYP0DPQTK.png)
*図: 大陸別の帯域幅（IQI）と転送サイズの関係（出典: Cloudflare Blog https://blog.cloudflare.com/how-fast-is-the-web/）*

- 帯域幅が高いほど体感の読み込み時間（LCP）が速い、という予想通りの関係が見える。
- 意外な点は転送サイズ。サイトの中身は概ね同じはずなのに、アフリカは転送サイズが目立って小さい。IQI ではアフリカの帯域が低いことから、現地の事業者がネットワーク制約に合わせてサイトを最適化している可能性がある。一方、高品質なネットワークは最適化の甘いサイトに寛容で、低速なネットワークはボトルネックを増幅する、という仮説も示される。原因は断定されておらず、今後の分析課題とされている。

### データ処理とプライバシー

![BEACON のデータ処理パイプライン](https://blog.cloudflare.com/_emdash/api/media/file/01M3CW070MPY4SH24TFNTHWM8D.png)
*図: Anonymize → Select top 10K → Normalize → Aggregate & remove tiny outliers（出典: Cloudflare Blog https://blog.cloudflare.com/how-fast-is-the-web/）*

1. **匿名化（Anonymization）**: RUM 製品はもともとプライバシーファーストの設計。BEACON ではさらにドメイン名や URL パスなど、顧客サイトを特定し得る識別子を削除する。
2. **正規化（Normalization）**: 全サイトを含めると、最大手サイトがトラフィック量で支配的になり特定アーキテクチャに偏る。逆に最小サイトの量に揃えるとレコード数が激減する。この2つの極端を避けるため、ネットワーク上の大規模サイト1万件に絞った。1万番目のサイトの量に揃えても、全体で1日あたり数十億レコード規模を保てるバランス点として選ばれた。
3. **集約（Aggregation）**: 国・OS・ブラウザ・接続プロトコルなどの次元が同じレコードを集約し、データ点が5件未満のレコードは破棄する。個人や特定サイトが識別されないことをさらに担保する。

## コード例

本記事の本文にはコードブロックは含まれない。代わりに、記事中の表や図のそれぞれに対応するクエリが BigQuery にデータセットと並べて保存されている。

| 記事中の内容 | BigQuery 上のクエリ名 |
| --- | --- |
| 業種別 Core Web Vitals | CWVs by Industry |
| LCP サブパーツ | Global LCP Sub-parts |
| INP サブパーツ | Global INP Sub-parts |
| ハード vs ソフトナビゲーション | Blink - Hard vs Soft Navigations |
| ランディングページ | Blink - Landing Pages |
| 国別の性能集約（GDP 結合用） | Country-level Performance Aggregates |

データセットは BigQuery のプロジェクト `cf-open-web-performance`、データセット `rumarchive` にある（[BigQuery リンク](https://console.cloud.google.com/bigquery?ws=!1m4!1m3!3m2!1scf-open-web-performance!2srumarchive)）。以下は記事のクエリそのものではなく、スキーマを確認するための出発点として本Wikiが補足した BigQuery 標準の書き方である（記事では個別クエリの SQL 本文は示されていない）。

```sql
-- データセット内のテーブル一覧を確認する
SELECT table_name
FROM `cf-open-web-performance.rumarchive.INFORMATION_SCHEMA.TABLES`;

-- 列構成を確認してからクエリを書く
SELECT column_name, data_type
FROM `cf-open-web-performance.rumarchive.INFORMATION_SCHEMA.COLUMNS`
WHERE table_name = '<テーブル名>';
```

RUM Archive の[クエリ方法のドキュメント](https://rumarchive.com/docs/querying/)も参照できる。ヒストグラムから任意のパーセンタイルを求める手順やスキーマの詳細は、保存済みクエリを開いて確認するのが確実である。

## ユースケース

- **ブラウザベンダー・標準化団体**: 国やブラウザエンジンごとの差（WebKit と Blink の差など）を実データで特定する。
- **開発者**: 自サイトと同じ業種の分布を比較し、P90・P95 の位置づけを把握する。LCP・INP のサブパーツから、最適化すべき段階（発見・描画ブロック解除・JavaScript 実行など）を絞り込む。
- **アーキテクチャ選定**: SPA のソフトナビゲーションによる高速化と、重くなりがちな初回ランディングのトレードオフを、データで評価する。
- **研究者**: GDP など外部データと結合し、経済状況・ネットワーク品質・サイト設計の関係を調べる。
- **ネットワーク品質の分析**: Radar の IQI と組み合わせ、サイト側・ネットワーク側のどちらが体験を制限しているかを切り分ける。

## 所感・ポイント

- 「平均値ではなくヒストグラム」という公開形式が、このデータセットの実用性の核になっている。P75 だけの指標では見えないロングテールの問題（特に CLS）を、誰でも BigQuery 上で再現できる。
- 「ダウンロード時間は最小の要因」という知見は、画像圧縮などの帯域側の最適化より、リソースの早期発見やレンダリングのブロック解除を優先すべきだという示唆になる。
- 結果は Cloudflare 上の大規模サイト1万件に基づく標本であり、全ウェブを代表するとは限らない点に留意したい。GDP との相関（R² = 0.43）や転送サイズの解釈も、記事自身が仮説段階としている。
- 本記事の中心は BigQuery 上のデータセットであり、Workers 上で動かすコンポーネントではないため、デプロイ可能な Workers サンプルは作成していない（サンプル対象外）。

## 関連リンク

- [BEACON データセット（Google BigQuery）](https://console.cloud.google.com/bigquery?ws=!1m4!1m3!3m2!1scf-open-web-performance!2srumarchive)
- [RUM Archive](https://rumarchive.com/) / [クエリ方法](https://rumarchive.com/docs/querying/)
- [Cloudflare Radar](https://radar.cloudflare.com/)
- [Intel API（業種分類）](https://developers.cloudflare.com/api/resources/intel/subresources/domains/subresources/bulks/methods/get/)
- [Soft Navigations 対応の changelog](https://developers.cloudflare.com/changelog/post/2026-08-21-improved-soft-navigation-measurement-for-single-page-applications/)
- [Smart Hints](https://blog.cloudflare.com/smart-hints/)
- [Zaraz](https://www.cloudflare.com/application-services/products/zaraz/)
- [世界銀行: GDP per capita](https://data.worldbank.org/indicator/NY.GDP.PCAP.KN)
- [Cloudflare's 1,111 intern program](https://blog.cloudflare.com/cloudflare-1111-intern-program/)（本プロジェクトを進めたインターンへの謝辞）
- [Cloudflare コミュニティフォーラム](https://community.cloudflare.com) / [Discord](https://discord.cloudflare.com/)
