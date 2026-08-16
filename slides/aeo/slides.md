---
routerMode: hash
theme: default
title: ランク付けから推奨へ：AIエージェント時代でサイトを成功に導く準備を整える
info: |
  Cloudflare Blog記事「ランク付けから推奨へ：AIエージェント時代でサイトを成功に導く準備を整える」の解説スライド。
  原文: https://blog.cloudflare.com/ja-jp/aeo/
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

# ランク付けから推奨へ
# AIエージェント時代でサイトを
# 成功に導く準備を整える

Agent Readiness と Answer Engine Optimization（AEO）

<div class="pt-4 text-sm opacity-70">
原文: https://blog.cloudflare.com/ja-jp/aeo/<br>
公開日: 2026-08-10
</div>

---

# TL;DR

- Cloudflareの集計では、HTMLページへの人間によるリクエストはすでに半数を下回っている
- 「見つけてもらう」の意味が、検索順位表示からAIエージェントに発見・推奨されることへシフト
- サイトのエージェント可読性を診断する**Agent Readiness / Diagnostics**と、新機能<strong>AEO（Answer Engine Optimization）</strong>をダッシュボードに追加
- AEOはCitation Rate・Prominence・Mention Rate・Share of Voiceの4指標でAIアシスタントからの引用・推奨度を計測
- AI Gatewayとカテゴリベンチマークにより、都度のモデル呼び出しなしで低遅延・低コストに実現

---

# アジェンダ


- 背景: 人間より機械からのアクセスが多い時代
- 課題: 「見つけてもらう」の意味の変化と計測できない機会損失
- Diagnostics: サイトのエージェント対応状況を診断する
- AEO: AIアシスタントから推奨されているかを計測する
- （コード例について）
- ユースケース
- まとめ・所感


---

# 背景: 人間より機械からのアクセスが多い時代


> 現在、HTMLページへの人間によるリクエストは半数未満となっています



- リクエストの半分以上が、人ではなく機械から送られている
- すべての機械が人の代わりに行動する「エージェント」ではないが、その割合は急速に増加している
- 顧客がサイトを訪れるかどうかは、検索エンジンではなく **AIアシスタントへの質問の回答内容** に左右されつつある


---

# 課題: 「見つけてもらう」の意味が変わった


これまで：検索結果ページで **上位表示** されること



これから：顧客を導くAIエージェントに **見つけられ、読み取られ、自信を持って推奨される** こと


<br>


- アクセスログにAIボットが大量に記録されていても、実際にサイトを使いこなせているかは分からない
- 検索順位のようなインプレッション数・クリック数のレポートが存在しない
- 自社ではなく競合が推奨されても、その事実に気付く手段がなかった


---

# Cloudflareの対応

<div class="text-center pt-8">

既存の **Agent Readiness（Diagnostics）** をダッシュボードに統合し、
新たに **Answer Engine Optimization（AEO）** を追加

</div>


- ほとんどのサイトはまだエージェントを考慮した作りになっていない
- 参入のハードルは低く、大きなチャンスがある
- 見つけやすく、読みやすく、信頼しやすいサイトこそが推奨されるサイトになる


---

# Diagnostics: サイトのエージェント対応状況を診断


- エージェントがサイトを読み取るのと **同じ方法** でサイトをスキャン
- robots.txt、サイトマップ、レスポンスヘッダー、コンテンツのMarkdown版、認証・利用可能なツールの公開メタデータなどを確認
- 評価は「Not Ready（未対応）」から「fully agent-native（エージェントに完全対応）」までの単一スコアで表示
- 各チェックは **Pass / Fail / Neutral** で判定され、理由とエビデンス（実際のリクエスト・レスポンス）が示される


---
layout: image-right
image: https://blog.cloudflare.com/_emdash/api/media/file/01KZA2SCFCH4GV8MQGRGPKSRT4.png
backgroundSize: contain
---

# Diagnosticsの評価画面

サイトのエージェント対応状況を
Pass / Fail / Neutral で判定

理由と実際のリクエスト・レスポンスの
エビデンスを提示

<footer class="text-xs opacity-50 mt-4">
出典: Cloudflare Blog https://blog.cloudflare.com/ja-jp/aeo/
</footer>

---
layout: image-right
image: https://blog.cloudflare.com/_emdash/api/media/file/01KZA2SCJRV8Y84DTKX4CRC06F.png
backgroundSize: contain
---

# チェック項目の4段階分類


1. **Quick wins**: robots.txt、XMLサイトマップ、AIクローラー向けルール、クリーンなMarkdown配信
2. **Technical groundwork**: Content Signals、APIカタログ、Linkヘッダー、エージェント向けログイン手順
3. **Advanced integration**: OAuth Discovery、MCP／A2Aのエージェントカード、Skills Index、Web Bot Auth、WebMCP
4. **Commerce**: x402、ACP、UCP、AP2（現時点ではスコア非反映・参考情報）


<footer class="text-xs opacity-50 mt-4">
出典: Cloudflare Blog https://blog.cloudflare.com/ja-jp/aeo/
</footer>

---

# 改善へのアクション支援


- 改善が必要な項目には、次に取るべき対応が併せて提示される
- Cloudflareの機能で対応できる場合: **「Set up in Cloudflare」** から設定画面（Markdown for Agents、Managed robots.txtなど）へ直接遷移
- それ以外の項目: **「Copy Agent Prompt」** でコーディングAIに実装を依頼するプロンプトを生成


---
class: text-center
---

# AEO: AIアシスタントから
# 推奨されているかを計測する

Diagnosticsの「読み取れるか」から一歩進んで
「推奨されるか」を確認する

---

# AEOが確認すること


> 誰かがAIに自分のサイトに関連する質問をしたとき、
> AIは自分のサイトを推奨するのか、それとも競合サイトを推奨するのか



- サイトの内容から業界・カテゴリ（例: 健康・フィットネス業界のスポーツウェアカテゴリ）を推測
- 主要アシスタント（現時点で **Anthropic Claude** と **OpenAI GPT**）に、顧客が投げかけそうなプロンプトで応答を確認
- プロンプトは商品のおすすめ、製品比較、カテゴリに関する一般的なアドバイスなど、実際の情報収集に近い形で構成


---

# AEOの4つの指標

<div class="grid grid-cols-2 gap-4 pt-4">

<div>

### Citation Rate（引用率）
カテゴリに関する回答のうち、
情報源として自サイトが引用された割合

### Prominence（突出度）
引用された場合、回答内容が
どの程度自サイトの情報に基づくか

</div>

<div>

### Mention Rate（言及率）
回答内でブランド名に言及された割合
（引用の有無を問わない）

### Share of Voice（シェアオブボイス）
自サイトと競合サイトの
引用数の割合

</div>

</div>


<div class="pt-4 text-sm">
Mention Rate が Citation Rate を大きく上回る場合、
「認知はされているが情報源としては引用されていない」ことを示す
</div>


---
layout: image-right
image: https://blog.cloudflare.com/_emdash/api/media/file/01KZA2SCHB021NKDSW68C9X8SR.png
backgroundSize: contain
---

# AEOタブの表示例

4つの指標を一画面で確認できる

サイトごとに算出されるため、
改善策の効果を再スキャンで測定できる

<footer class="text-xs opacity-50 mt-4">
出典: Cloudflare Blog https://blog.cloudflare.com/ja-jp/aeo/
</footer>

---

# カテゴリ別ベンチマークの事前計算


- ブランド名を指定せず、カテゴリで想定される質問をAIに投げて記録
- カテゴリごとに **一度だけ** 作成し、同じカテゴリの全アカウントで共有


<br>

<div class="grid grid-cols-3 gap-4 pt-2">

<div>

### ⚡ 遅延がない
保存済みスナップショットから
即座に結果を表示

</div>

<div>

### 💰 計算コスト削減
カテゴリ単位でまとめて
問い合わせを実行

</div>

<div>

### 📊 Industry Fit算出
どのブランドが同じ文脈で
語られやすいかを分析

</div>

</div>

---
layout: image-right
image: https://blog.cloudflare.com/_emdash/api/media/file/01KZA2SCKJERT2KXC0AXWDZT8R.png
backgroundSize: contain
---

# 複数モデルでの
# テストと評価


- Cloudflare AI Gateway で複数モデルに同じ質問を複数回実行
- 回答本文と引用された情報源の両方を分析
- 言及・引用・引用位置・回答内容の反映度を評価
- 人間に近い判断は **Workers AI** が処理し、厳密なテキスト解析も併用


<footer class="text-xs opacity-50 mt-4">
出典: Cloudflare Blog https://blog.cloudflare.com/ja-jp/aeo/
</footer>

---

# Industry Fitスコア


- 共通のベンチマークデータから、どのブランド同士がAIの回答で一緒に登場するかを分析
- AIが自サイトを **本来の競合サイトと同じ市場のプレイヤー** として認識しているかを示す指標
- カテゴリ推測の妥当性そのものを検証する役割も持つ


---

# AI Operator Activity


- OpenAIやGoogleなど、AI事業者ごとの実際のクロール・送客状況を確認
- どの事業者がコンテンツを読み取り、どの事業者が訪問者を送り返しているか
- 403（アクセス拒否）・404（リンク切れ）などクロール時のエラーも確認可能
- 特に注意すべきは、大量にクロールしながら訪問者を一切送り返さない事業者

---

# AI Operator Activity（ダッシュボード画面）

<img src="https://blog.cloudflare.com/_emdash/api/media/file/01KZA2SC8RB6YS1V3S3FQ1RS1P.png" class="mx-auto rounded mt-4" style="max-height: 340px;" />

<footer class="text-xs opacity-50 mt-4">
出典: Cloudflare Blog https://blog.cloudflare.com/ja-jp/aeo/
</footer>

---

# コード例について


この記事はダッシュボード機能の紹介記事であり、
**コード例は掲載されていない**



代わりに、記事内で言及されている技術要素を整理する


<div class="grid grid-cols-2 gap-4 pt-4">

<div>

### Diagnosticsが対象とする要素
robots.txt / サイトマップ / Markdown版コンテンツ /
Content Signals / APIカタログ / Linkヘッダー /
OAuth Discovery / MCP・A2Aエージェントカード /
Skills Index / Web Bot Auth / WebMCP

</div>

<div>

### Commerce関連の新標準
x402（402 Payment Requiredの拡張）/
ACP / UCP / AP2

### AEOの計測基盤
Cloudflare AI Gateway / Workers AI

</div>

</div>

---
class: text-center
---

# ユースケース

---

# ユースケース①: サイトの読み取り可能性を確認する


- Diagnosticsで robots.txt・サイトマップ・Markdown版コンテンツなど基礎項目から、MCP／A2Aのような高度な統合まで段階的に点検
- Quick winsから着手すれば、投資対効果の高い改善を優先しやすい
- 改善項目には「Set up in Cloudflare」または「Copy Agent Prompt」で次のアクションが提示される


---

# ユースケース②: ブランドの扱われ方を把握する


- 自社の業種・カテゴリで想定される質問をClaudeやGPTに投げたときの応答を分析
- 情報源として引用されているか、ブランド名だけが言及されているに留まるかを Citation Rate と Mention Rate の差から把握
- 「認知はされているが引用はされていない」というギャップを可視化し、改善の優先順位付けに使える


---

# ユースケース③: 競合との相対的な存在感を測る


- Share of Voiceで、同じカテゴリの競合サイトと比べたAI回答内での優位性を確認
- Industry Fitスコアで、AIが自社を本来の競合と同じ市場のプレイヤーとして認識しているかを確認
- どの質問で競合に負けているかを定量的に把握できる


---

# ユースケース④: AI事業者別のクロール・送客バランスを確認する


- AI Operator Activityで、事業者ごとのクロール状況と送客状況を突き合わせる
- コンテンツを大量にクロールしながら訪問者を一切送り返さない事業者を特定
- 403・404などのクロールエラーを手がかりに、robots.txtのルール調整など次のアクションを検討


---

# まとめ


- HTMLページへのアクセスは既に機械が過半数を占める時代になった
- 「見つけてもらう」の意味は、検索順位からAIエージェントへの推奨へとシフトしている
- Diagnosticsは「エージェントに読み取れるか」を、AEOは「AIに推奨されるか」を計測する
- AEOはCitation Rate・Prominence・Mention Rate・Share of Voiceの4指標と、カテゴリ別ベンチマークの事前計算で、低遅延・低コストに計測を実現
- AI Operator Activityで事業者ごとのクロール・送客のバランスも可視化できる


---

# 所感・ポイント


- 「SEOからAEOへ」の本質は名称変更ではなく、評価対象がページの検索順位からAIの回答本文内での扱われ方へ質的に変わったこと
- 直接観測できない指標（引用位置・言及と引用の乖離・回答内での比重）を複数モデルへの反復問い合わせとテキスト解析で近似する設計は、他のAI可観測性の取り組みにも応用が利きそうである
- カテゴリ単位のベンチマーク事前計算は、リアルタイム問い合わせのコストとレイテンシーを回避しつつ、Industry Fitスコアという相対評価を副次的に導出できる実務的な工夫
- Mention RateとCitation Rateを分離して計測する発想は、コンテンツ改善の優先順位づけに直結しやすい


---

# 参考リンク


- 原文: [ランク付けから推奨へ：AIエージェント時代でサイトを成功に導く準備を整える](https://blog.cloudflare.com/ja-jp/aeo/)
- 英語版: [https://blog.cloudflare.com/aeo/](https://blog.cloudflare.com/aeo/)
- [Agent Readiness（関連記事）](https://blog.cloudflare.com/agent-readiness/)
- [Cloudflare AI Gateway](https://www.cloudflare.com/products/ai-gateway/)
- [Cloudflare Radar: Bot vs Human トラフィック比率](https://radar.cloudflare.com/traffic#bot-vs-human)
- [x402（関連記事）](https://blog.cloudflare.com/x402/)
- [Cloudflareダッシュボード](https://dash.cloudflare.com/)
- [Cloudflare Developer Discord](https://discord.cloudflare.com)


<div class="pt-8 text-sm opacity-50">
Wiki: docs/articles/2026-08-06-aeo.md
</div>
