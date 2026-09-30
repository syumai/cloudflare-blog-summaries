---
routerMode: hash
theme: default
title: "Webはどれくらい速いのか: BEACON"
info: |
  Webはどれくらい速いのか: BEACON で数十億件の実ユーザー計測を探索する の解説スライド。
  原文: https://blog.cloudflare.com/how-fast-is-the-web/
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

# Webはどれくらい速いのか

<div class="text-2xl pt-2">BEACON で数十億件の実ユーザー計測を探索する</div>

Birthday Week 2026

<div class="pt-4 text-sm opacity-70">
原文: https://blog.cloudflare.com/how-fast-is-the-web/<br>
公開日: 2026-09-28
</div>

---

# TL;DR

- Cloudflare が <strong>BEACON</strong> を公開: 大規模サイト1万件の匿名化済み実ユーザー計測（RUM）データセット
- Google BigQuery に<strong>毎日更新</strong>。RUM Archive 規格に準拠し、フットプリントを<strong>100倍</strong>に拡大
- LCP / CLS / INP を平均値ではなく<strong>ヒストグラム</strong>で提供し、ロングテールを分析できる
- 分析例: WebKit vs Blink、業種別、LCP サブパーツ、ハード vs ソフトナビゲーション、GDP・IQI との相関
- ドメイン・URL パスの除去、上位1万サイトの正規化、5件未満の破棄でプライバシーを担保

---

# アジェンダ

- 背景: 「手元では速い」と「全員に速い」のギャップ
- BEACON データセットの概要
- 誰が遅いウェブを体験しているか（ブラウザ・業種）
- 何がページを遅くするか（LCP / INP サブパーツ）
- アプリケーションアーキテクチャの影響
- データの結合（GDP・IQI・転送サイズ）
- データ処理とプライバシー
- BigQuery の使い方・ユースケース・まとめ

---

# 背景: 手元では速い、は全員に速いとは限らない

- 技術者は高性能なノート PC・最新スマホ・高速 Wi-Fi で作業しがち
- 実際のユーザーは古い廉価スマホ、低バッテリー、2GB で速度制限されるデータプラン、整備が不十分な回線の中にいる
- 数十億人規模でギャップが広がると、技術選定や優先順位の判断が歪む
- 客観的なデータでギャップを埋めることが「誰にとっても速く使えるインターネット」の土台になる

---

# BEACON とは

| 項目 | 内容 |
| --- | --- |
| 正式名 | Browser Experience Across Cloudflare's Observed Network |
| 対象 | Cloudflare ネットワーク上の大規模サイト1万件 |
| 範囲 | 主要なブラウザエンジンすべて |
| 配布 | Google BigQuery（毎日更新） |
| 規格 | コミュニティ主導の RUM Archive |

<div class="pt-4">

- 顧客向けに長年集めてきた RUM テレメトリを匿名化して一般公開
- LCP（読み込み）・CLS（視覚的安定性）・INP（応答性）の3指標

</div>

---

# 平均値ではなくヒストグラム

- 単一の平均値ではなく<strong>完全なヒストグラム</strong>として公開
- 任意のパーセンタイルを導出できる
- P75（Core Web Vitals の標準的な評価点）で止まらず、<strong>P90・P95 のロングテール</strong>まで確認できる
- 「業界がまだ全員に速い体験を提供できていない箇所」を見つけるのが狙い

---

# 誰が遅いウェブを体験しているか（1）: WebKit

- 現在 iOS で唯一のエンジン <strong>WebKit</strong> は全体として最良の成績
- ただし WebKit が10%超を占める<strong>46か国</strong>では、LCP・INP の一方または両方が Blink 系より10%以上悪い
- 例: カンボジアでは WebKit がページビューの 17.5%、LCP は Blink より <strong>50%悪い</strong>

<div class="text-center pt-2">
<img src="https://blog.cloudflare.com/_emdash/api/media/file/01M3CW03Y63NTVT66FJ88HX38K.png" style="max-height: 290px; margin: 0 auto;" />
</div>

<div class="text-xs opacity-60 text-center">出典: Cloudflare Blog https://blog.cloudflare.com/how-fast-is-the-web/</div>

---

# P90 の Core Web Vitals: iOS と Android

<div class="text-center">
<img src="https://blog.cloudflare.com/_emdash/api/media/file/01M3CW029B6K1FRNH3XPPX7VR1.png" style="max-height: 180px; margin: 0 auto;" />
</div>

| 指標 | iOS | Android |
| --- | --- | --- |
| LCP | 2,458ms | 3,252ms |
| CLS | 未対応 | 0.617 |
| INP | 233ms | 414ms |

<div class="text-xs opacity-60">出典: Cloudflare Blog https://blog.cloudflare.com/how-fast-is-the-web/</div>

---
layout: image-right
image: https://blog.cloudflare.com/_emdash/api/media/file/01M3CVZVSHQAM412CTZ6ED1JMD.png
backgroundSize: contain
---

# 誰が遅いウェブを体験しているか（2）: 業種

- 業種分類は Intel API 由来
- 高成績: <strong>Government and Politics、Health、Safe for Kids</strong>
- 低成績: <strong>Ads、Religion、Weather</strong>
- 追加のパーセンタイルで P75 では見えない差が露呈
- 特に <strong>CLS のロングテール</strong>で大きく悪化する業種が多い

<div class="text-xs opacity-60 pt-4">出典: Cloudflare Blog https://blog.cloudflare.com/how-fast-is-the-web/<br>クエリ: 'CWVs by Industry'</div>

---

# 何がページを遅くするか: LCP サブパーツ

| 帯 | TTFB | Load Delay | Load Duration | Render Delay |
| --- | --- | --- | --- | --- |
| Good | 598ms | 76ms | 119ms | 157ms |
| Needs Improvement | 1015ms | 1049ms | 199ms | 437ms |
| Poor | 1891ms | 1485ms | 119ms | 2002ms |

- <strong>ダウンロード（Load Duration）が最小の要因</strong>という通説に反する結果
- 改善余地が大きいのは LCP 候補の<strong>発見</strong>と<strong>描画のブロック解除</strong>
- 発見の遅延には Smart Hints が有効
- クエリ: 'Global LCP Sub-parts'

---

# 応答性: INP サブパーツ

| 帯 | Input Delay | Processing Time | Presentation Delay |
| --- | --- | --- | --- |
| Good | 18ms | 55ms | 56ms |
| Needs Improvement | 32ms | 112ms | 111ms |
| Poor | 84ms | 284ms | 217ms |

- 最も遅い操作では <strong>JavaScript 実行</strong>が最長
- <strong>Presentation Delay</strong> も大きく伸びる（多くは複雑な CSS レイアウト再計算）
- サードパーティ JavaScript の影響軽減には Zaraz
- クエリ: 'Global INP Sub-parts'

---

# アプリケーションアーキテクチャ: ハード vs ソフト

Chrome の Soft Navigations API に対応し、SPA のクライアント側遷移でも LCP を計測

| LCP | P50 | P75 | P90 | P95 |
| --- | --- | --- | --- | --- |
| Hard Navigations | 791ms | 1,421ms | 2,636ms | 4,122ms |
| Soft Navigations | 274ms | 582ms | 1,169ms | 1,816ms |
| Landing Page | 1,370ms | 2,681ms | 5,397ms | 8,940ms |

- ソフトは全パーセンタイルでハードの<strong>2〜3倍速い</strong>
- ただし初回ランディングは重い。<strong>ランディング以降に進まないユーザーが多いなら回収できない</strong>

---

# データの結合: GDP と Web 性能

<div class="text-center">
<img src="https://blog.cloudflare.com/_emdash/api/media/file/01M3D2CQZQKQVQX6D8FY3RREKY.01M3D2CRG6S7HCCYKA2SWA2RWT.png" style="max-height: 330px; margin: 0 auto;" />
</div>

- 世界銀行の1人あたり GDP と結合すると、経済状況と P75 LCP の相関（R² = 0.43）が見える
- クエリ: 'Country-level Performance Aggregates'

<div class="text-xs opacity-60">出典: Cloudflare Blog https://blog.cloudflare.com/how-fast-is-the-web/</div>

---

# Radar の IQI と組み合わせる

- Cloudflare Radar に新しい <strong>Web Performance セクション</strong>を追加予定
- IQI（Internet Quality Index）は<strong>ユーザー側ネットワーク</strong>の性能、BEACON は<strong>訪問先サイト</strong>の性能
- 両者が合わさって、体験が苦痛か快適かが決まる
- 良い性能と良いネットワーク品質は概ね一緒に動く。帯域が高いほど LCP は速い
- 注目点: 「片方がもう片方の改善を打ち消す頻度」

---

# 意外な発見: アフリカの転送サイズ

<div class="text-center">
<img src="https://blog.cloudflare.com/_emdash/api/media/file/01M3CW87JV0HXH3G8HZ4JFZH94.01M3CW88SY8QJCZMJZYP0DPQTK.png" style="max-height: 280px; margin: 0 auto;" />
</div>

- サイトの中身は同じはずなのに、アフリカは<strong>転送サイズが目立って小さい</strong>
- 仮説: 現地の事業者がネットワーク制約に合わせて最適化している／高品質な回線は最適化の甘いサイトに寛容
- 原因は断定されておらず、今後の分析課題

<div class="text-xs opacity-60">出典: Cloudflare Blog https://blog.cloudflare.com/how-fast-is-the-web/</div>

---

# データ処理とプライバシー

<div class="text-center">
<img src="https://blog.cloudflare.com/_emdash/api/media/file/01M3CW070MPY4SH24TFNTHWM8D.png" style="max-height: 150px; margin: 0 auto;" />
</div>

- <strong>匿名化</strong>: ドメイン名・URL パスなど、サイトを特定し得る識別子を削除
- <strong>正規化</strong>: 上位1万サイトに絞る。最大手への偏りと、最小サイトへ揃えることによるレコード減の両方を回避
- <strong>集約</strong>: 国・OS・ブラウザ・プロトコルが同じレコードを集約し、<strong>5件未満は破棄</strong>

<div class="text-xs opacity-60">出典: Cloudflare Blog https://blog.cloudflare.com/how-fast-is-the-web/</div>

---

# コード例: BigQuery で始める

記事に SQL 本文はなく、各結果に対応するクエリが BigQuery に保存されている。以下は<strong>スキーマ確認用の補足例</strong>（記事のクエリではない）。プロジェクトは `cf-open-web-performance`、データセットは `rumarchive`

```sql
-- テーブル一覧を確認
SELECT table_name
FROM `cf-open-web-performance.rumarchive.INFORMATION_SCHEMA.TABLES`;

-- 列構成を確認
SELECT column_name, data_type
FROM `cf-open-web-performance.rumarchive.INFORMATION_SCHEMA.COLUMNS`
WHERE table_name = '<テーブル名>';
```

---

# 保存済みクエリと記事の対応

| 記事中の内容 | 保存済みクエリ名 |
| --- | --- |
| 業種別 Core Web Vitals | CWVs by Industry |
| LCP サブパーツ | Global LCP Sub-parts |
| INP サブパーツ | Global INP Sub-parts |
| ハード vs ソフト | Blink - Hard vs Soft Navigations |
| ランディングページ | Blink - Landing Pages |
| 国別集約（GDP 結合用） | Country-level Performance Aggregates |

- 自分の分析に合わせて改変して使える。詳細は RUM Archive のクエリ方法ドキュメントを参照

---

# ユースケース（1）: 開発者

- 同じ業種の分布と比べて、自サイトの P90・P95 の位置を把握する
- LCP サブパーツから、最適化する段階（発見・描画ブロック解除・TTFB）を絞り込む
- INP サブパーツから、JavaScript 実行か CSS レイアウトかを見極める

---

# ユースケース（2）: 研究者・ブラウザベンダー

- 国・ブラウザエンジン別の差（WebKit と Blink）を実データで特定
- GDP など外部データと結合し、経済状況・ネットワーク品質・サイト設計の関係を調べる
- Radar の IQI と組み合わせ、サイト側とネットワーク側のどちらが体験を制限しているかを切り分ける

---

# ユースケース（3）: アーキテクチャ選定

- SPA のソフトナビゲーションによる高速化を評価
- ただし初回ランディングが重くなるトレードオフを、データで検証
- ユーザーがランディング以降に進む割合を踏まえて判断する

---

# まとめ・所感

- BEACON は「実ユーザーのウェブ体験」をオープンデータとして開く試み
- ヒストグラム形式により、P75 では見えないロングテールが分析できる
- 「ダウンロードより発見とブロック解除」など、最適化の優先順位を見直す示唆がある
- 標本は Cloudflare 上の大規模サイト1万件。GDP 相関や転送サイズの解釈は仮説段階
- Workers 上のコンポーネントではないため、デプロイ可能なサンプルは作成していない

---

# 参考リンク

- 原文: https://blog.cloudflare.com/how-fast-is-the-web/
- BigQuery: `cf-open-web-performance.rumarchive`
- RUM Archive: https://rumarchive.com/
- Cloudflare Radar: https://radar.cloudflare.com/
- Wiki: https://github.com/syumai/cloudflare-blog-summaries/blob/main/docs/articles/2026-09-28-how-fast-is-the-web.md
