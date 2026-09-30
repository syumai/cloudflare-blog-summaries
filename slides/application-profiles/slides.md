---
routerMode: hash
theme: default
title: "Cloudflare Application Profiles でポジティブセキュリティを実現する"
info: |
  Cloudflare Application Profiles でポジティブセキュリティを実現するの解説スライド。
  原文: https://blog.cloudflare.com/application-profiles/
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

# Application Profiles

<div class="text-xl pt-2">正常なリクエストを学習して、外れたものを検知する</div>

Birthday Week 2026

<div class="pt-4 text-sm opacity-70">
原文: https://blog.cloudflare.com/application-profiles/<br>
公開日: 2026-09-29
</div>

---

# TL;DR

- リクエストの<strong>構造と形式</strong>を学習し、逸脱を検知する<strong>ポジティブセキュリティ</strong>
- 対象: パス・クエリ・ヘッダー・Cookie・JSON / フォームボディ（型と制約を週次で学習）
- 検証は常時オン。結果は<strong>メタデータ</strong>として付与され、ブロックは Security Rules で明示的に作る
- Security Analytics に <strong>Profile Analysis</strong> タブ。まず観測モードで確認
- API Security 顧客は利用可能、他の Enterprise 顧客は招待制クローズドベータ

---

# アジェンダ

- 背景: AI 時代の攻撃とシグネチャ方式の限界
- 学習と検証の仕組み
- 具体例・学習の条件
- 分析画面と Security Rules
- 今後（Critical Field Analysis）・提供状況・ユースケース・まとめ

---

# 背景: AI 駆動の攻撃

- LLM により、非専門家でも 1 回のプロンプトで攻撃を開始できる
- ペイロード生成・既知手法の試行・WAF の反応を見た<strong>自律的な変異</strong>まで可能
- マネージド WAF ルールや ML 検知は引き続き重要
- ただし「既知の攻撃に似たものを探す」方式は、新しい亜種に後れを取る
- 「もっと速くパッチを当てる」だけでは持続可能でない

---

# 発想の転換

- 攻撃らしいものを探す代わりに、<strong>期待どおりのリクエストだけを通す</strong>
- 例: 検索欄が特殊文字を想定しないなら、英数字のみ受理 → 多くの既知攻撃を防げる
- 構造が学べれば、各オペレーションの<strong>目的</strong>まで推定でき、優先保護対象を絞れる
- API 向けの Schema Learning / Validation を Web アプリに拡張したもの

---

# 全体像と検証の流れ

- 学習済みプロファイルができると、常時オンの検証が自動展開される
- 各リクエストに<strong>準拠 / 非準拠</strong>をメタデータとして付与。信号だけではアクションしない
- ブロックは顧客が Security Rules で作る。プロファイルのないオペレーションは分類されない

<div>
<img src="https://blog.cloudflare.com/_emdash/api/media/file/01M3B09CFWMN5RMJ4P52K5QEEZ.01M3B09D3DE13C6NY19SCCGXQX.jpg" style="max-height: 280px; margin: 0 auto;" />
</div>

<div class="text-xs opacity-60 pt-1">出典: Cloudflare Blog https://blog.cloudflare.com/application-profiles/</div>

---

# 非準拠は悪意とは限らない

- アプリのリリース、新しいクライアント、珍しいが正当なリクエストでも差は出る
- Managed Rules と違い、既知の攻撃シグネチャへの一致は不要
- 範囲外の値・未知の enum 値・不正な UUID・想定外の文字を、プロファイルとの差として検出
- そのため<strong>観測モードから開始</strong>し、強制前に影響を確認する

---

# 具体例: UUID と整数

<div class="text-sm">

`www.example.com/shop/2dbda2e7-cfc9-448d-9465-799d2e6ff363/inventory?product_id=938062541`

</div>

- パスは <strong>UUID</strong> 変数を期待、`product_id` は<strong>整数</strong>（範囲も学習）
- `product_id` に文字列 → 違反として検知
- 不正な UUID も検知。強制を有効にすれば、ハンドラーに届かない
- シグネチャなしで、SQL インジェクション・XSS・RCE の多くの経路を絞れる

---

# 何を学習するか

- 対象: パス変数・クエリパラメータ・ヘッダーと Cookie・ボディ（JSON / フォーム）
- 型: 整数・文字列・真偽値・配列・UUID・enum
- 制約: 数値範囲・短い列挙・文字列長・文字クラス
- 単位は「オペレーション」（HTTP メソッド + ホスト名パターン + パスパターン）
- Web Assets が発見したオペレーションは、<strong>Learn profile</strong> を選んで開始
- 手動作成したオペレーションは作成時に開始

---

# 学習の条件と更新

- ゾーンごとに<strong>週 1 回</strong>、直近の成功トラフィックで自動学習
- フィールド学習: 過去 7 日で 2xx が最低 <strong>1,000 件</strong>
- データ境界の学習: 最低 <strong>10,000 件</strong>
- ボットやスキャナーの成功リクエストも混ざりうる → 強制前にレビュー
- ロードマップ: オンデマンド学習、自動化トラフィックの除外

<div>
<img src="https://blog.cloudflare.com/_emdash/api/media/file/01M3B09CFRQWTP4W5S1BCN07X2.01M3B09DWCC8TJAYNP51SB3ENS.png" style="max-height: 170px; margin: 0 auto;" />
</div>

<div class="text-xs opacity-60 pt-1">出典: Cloudflare Blog https://blog.cloudflare.com/application-profiles/</div>

---

# 学習結果の確認と固定

- オペレーションの View details → Security overview で学習済みスキーマを確認
- <strong>OpenAPI v3</strong> としてエクスポート可能
- 毎週更新: 新フィールドは追加、観測されなくなったものは削除
- 固定したい場合は、ダウンロードして Schema Validation にアップロード

<div>
<img src="https://blog.cloudflare.com/_emdash/api/media/file/01M3B09EY75HGTKJ084869Z1FF.01M3B09G3R8J7APCEQMP5H1E6J.png" style="max-height: 230px; margin: 0 auto;" />
</div>

<div class="text-xs opacity-60 pt-1">出典: Cloudflare Blog https://blog.cloudflare.com/application-profiles/</div>

---

# Profile Analysis

- Security Analytics の新タブ。過去 7 日の非準拠トラフィックの傾向を表示
- サンプルログで、違反の場所・フィールド・理由を確認
- 違反は型の不一致・範囲外・不正形式など <strong>10 種類</strong>に分類
- 可視化だけでトラフィックには影響しない

<div>
<img src="https://blog.cloudflare.com/_emdash/api/media/file/01M3B09F8Z0TBJ67BMHRQTA9K3.01M3B09GMCWVTKENJ3VM6G0HEJ.png" style="max-height: 260px; margin: 0 auto;" />
</div>

<div class="text-xs opacity-60 pt-1">出典: Cloudflare Blog https://blog.cloudflare.com/application-profiles/</div>

---

# 違反詳細の例

<div class="text-sm">パス変数に、期待される整数の代わりに文字列が使われた例。違反の詳細が表示される。</div>

<div>
<img src="https://blog.cloudflare.com/_emdash/api/media/file/01M3B09FY7NMQHSG9V987FX95H.01M3B09HSZMSQJNSAVK54BKMW3.png" style="max-height: 340px; margin: 0 auto;" />
</div>

<div class="text-xs opacity-60 pt-2">出典: Cloudflare Blog https://blog.cloudflare.com/application-profiles/</div>

---

# Security Rules で強制

- 検証結果はフィールド <code>cf.schema_validation.learned.violated</code> として公開
- Bot Score・Attack Score など他の信号と 1 つのルールで組み合わせ可能
- アプリ全体にも、特定のパス・オペレーション・フィールドにも限定できる
- 従来の WAF 学習モードのような、提案レビューやポリシー実体の維持が不要

<div>
<img src="https://blog.cloudflare.com/_emdash/api/media/file/01M3B09JH896EEFN63XD2BYFMM.01M3B09KNR0W4AKRJ2P0T68WAV.png" style="max-height: 260px; margin: 0 auto;" />
</div>

<div class="text-xs opacity-60 pt-1">出典: Cloudflare Blog https://blog.cloudflare.com/application-profiles/</div>

---
layout: two-cols
---

# コード例: ルール式

<div class="text-sm">

違反位置を特定（`learned.[location].violated_parameters`）:

</div>

```txt
cf.schema_validation.learned.query
  .violated_parameters = ["product_id"]
```

<div class="text-sm">

未宣言パラメータを検出（`undeclared_parameters`）:

</div>

```txt
cf.schema_validation.learned.query
  .undeclared_parameters = ["adminMode", "utm"]
```

::right::

<div class="pl-4 text-sm pt-16">

- いずれも<strong>最大 20 要素の配列</strong>
- <code>violated_parameters</code>: location は query / path / headers / cookies / body
- <code>undeclared_parameters</code>: location は query
- 特定フィールドだけ強制、または除外できる
- 新バージョンのデプロイ時は未宣言パラメータを観測して扱いを決められる

<div class="text-xs opacity-60 pt-2">記事にはコードはなく、ルール用フィールドの例（記事の表）を示した</div>

</div>

---

# 今後: Critical Field Analysis

- 大規模アプリは数千オペレーション・数万フィールド。リスクは均一でない
- Workers AI 上のモデルで 4 アプリのプロファイルを試験
- <strong>`clientId` と `account_number`</strong> の関連、OTP の共通依存を識別
- 文脈から、ブルートフォース対策のレート制限などを優先できる
- ダッシュボードで、過去トラフィックによる緩和シミュレーション付きのルール推奨を予定

<div>
<img src="https://blog.cloudflare.com/_emdash/api/media/file/01M3B09JMC84K6WW8TAWM92HSB.01M3B09KVXR0XGE9Y8WRT653AH.png" style="max-height: 150px; margin: 0 auto;" />
</div>

<div class="text-xs opacity-60 pt-1">出典: Cloudflare Blog https://blog.cloudflare.com/application-profiles/</div>

---

# 優先順位付けの指標（開発中）

- <strong>データ流出</strong>: 異常なデータ転送量の増加傾向
- <strong>偵察活動</strong>: 未知パラメータの多さ
- <strong>ビジネス上の重要度</strong>: 一意のセッション ID に紐づくトラフィック総量
- 将来は ASN や JA4 など、他の「期待される特性」も同じ流れで学習する構想

---

# 提供状況と制限

- <strong>API Security 顧客</strong>: 利用可能
- <strong>その他の Enterprise 顧客</strong>: 招待制クローズドベータ（将来のプラン提供を約束しない）
- 対応: パス・クエリ・ヘッダー・Cookie・JSON / フォームボディ、整数・文字列・UUID・配列・enum（最大 3 値）
- 非対応: multipart フォーム・GraphQL・XML
- 必須パラメータの強制や、新パラメータだけでのブロックは行わない

---

# ユースケース 1: インジェクションの入口を絞る

- <code>product_id</code> が整数と学習済み → 文字列は違反として検知
- 強制を有効にすれば、SQL インジェクションなどの多くの経路がハンドラーに届かない
- 不正な UUID のパス変数も同様に除外できる
- 既知のシグネチャに依存しないため、新しい亜種にも有効

---

# ユースケース 2: 新バージョンの移行・未知パラメータ

- <code>undeclared_parameters</code> で新パラメータを観測し、リリース時の扱いを決める
- 安定後は、過去に定義されていないパラメータをすべて弾く厳格な運用へ
- <code>adminMode</code> のような未宣言パラメータを検知して弾く
- まず Profile Analysis で 7 日間の非準拠割合を確認してからルール化

---

# ユースケース 3: 重要フィールドの優先保護

- LLM 分析（予定）で、アカウント関連のフィールドや OTP の依存を特定
- アカウント狙いのブルートフォースへ、レート制限を優先して設定
- 緩和シミュレーションで、過去トラフィックへの影響を確認してからデプロイ

---

# まとめ・所感

- 「攻撃を探す」から「<strong>正常を定義して外れを探す</strong>」への転換
- 検知（常時オンのメタデータ）と強制（Security Rules）を分離し、観測モードで段階導入
- 学習データにボット等が混ざりうる点と、現時点の制限（必須パラメータ・新パラメータ）に注意
- LLM による重要フィールド分析は予告段階
- 構想はゼロデイ対策の Proactive Security ワークフローへ

---

# 参考リンク

- 原文: https://blog.cloudflare.com/application-profiles/
- Application Profiles: https://developers.cloudflare.com/waf/detections/application-profiles/
- 違反詳細の見方: https://developers.cloudflare.com/waf/detections/application-profiles/analyze-profile-detections/
- Web Assets: https://developers.cloudflare.com/security/web-assets/
- Workers サンプルは対象外（Enterprise 向け WAF / API Security 機能のため）
- 関連スライド: [WAF を AI でテストしてみた](../adaptive-ai-waf-testing/)
