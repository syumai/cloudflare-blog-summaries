---
routerMode: hash
theme: default
title: エージェンティック・インターネットにおける「良い振る舞い」と「悪い振る舞い」を見極める
info: |
  エージェンティック・インターネットにおける「良い振る舞い」と「悪い振る舞い」を見極めるの解説スライド。
  原文: https://blog.cloudflare.com/ja-jp/good-and-bad-agentic-behaviors/
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

# エージェンティック・インターネットにおける
# 「良い振る舞い」と「悪い振る舞い」を見極める

<div class="pt-4 text-sm opacity-70">
原文: https://blog.cloudflare.com/ja-jp/good-and-bad-agentic-behaviors/<br>
公開日: 2026-08-07
</div>

---

# TL;DR


- 「ボットは悪、人間は善」という二分法はもはや通用せず、人間とエージェントが主体を切り替える「ハイブリッドトラフィック」も一般化
- Cloudflareはリスク（一時的な害）と信頼（積み上げた評判）を別軸で扱い、組み合わせて対応の選択肢を提供
- 検出面では、セッション全体を継続評価する「Precursor」と新エンジン「Adaptive Intelligence」が軸
- 対応面では単純な403ブロックを避け、予測不能な処理・「AI Labyrinth」・良性ボットのキューイングなど複数手法を組み合わせる


---

# アジェンダ


- 背景: 「ボットは悪、人間は善」が通用しない世界
- リスクと信頼: 独立しながらも影響し合う2つの指標
- 悪い振る舞いの検出: Precursorと今後のAdaptive Intelligence
- 決定論的な対応の限界と「ボットの抗生物質問題」
- 3つの対策アプローチ（予測不能性 / AI Labyrinth / キューイング）
- ユースケース
- 自分に合った信頼のエコシステムを構築する


---

# 背景①: 二分できなくなったトラフィック


長らくWebセキュリティの経験則は
**「ボットは悪、人間は善」** だった



- 人間が不正を行うこともあれば、ボットが有益な存在であることもある
- サイト運営者自身が、一部の自動トラフィックの訪問を望んでいる
- 「人間」と「ボット」の境界はますます曖昧になっている



<div class="pt-4">

例: ユーザーが自分でストアを閲覧し、購入手続きだけを
**ショッピングエージェントに委譲**する「ハイブリッドセッション」

</div>


---

# 背景②: ボットの適応スピードという課題


- 悪意のあるボット運営者は、防御側の反応パターンを観察して
  **短時間で回避策を編み出す**
- 検出を逃れるため「わずかに人間らしくない」程度に振る舞いを
  留めるボットも存在し、ネットワークシグナルだけでは見抜けない
- 静的な一時点判定では、こうした巧妙な相手に対応しきれない


<br>


必要なのは、**継続的に信頼を評価する仕組み**への移行


---

# リスクと信頼の定義

Cloudflareは、リスクと信頼を同じ物差しの両端ではなく
**互いに独立しながらも影響し合う2つの指標**として扱う


- **リスク**: あるリクエスト・行動がどの程度害を及ぼしうるかを示す、一時的な性質の指標
- **信頼**: 評判に基づき、時間をかけて積み上げられていく指標



> 夜、自宅で何度もチャイムが鳴らされた。ドアカメラを確認すると、
> 相手は信頼している隣の親友だった——同じ行動でも、相手への
> **信頼**によって対応は変わる。


---

# 信頼・リスクの判定マトリックス

信頼度は上から下へ低くなる軸

右列はサイト運営者が取りうる一般的な対応

<img src="https://blog.cloudflare.com/_emdash/api/media/file/01KZCHB9V3BAKZ4ADYESCQ1BS7.png" class="mx-auto rounded" style="max-height: 320px;" />

<footer class="text-xs opacity-50 mt-4">
出典: Cloudflare Blog https://blog.cloudflare.com/ja-jp/good-and-bad-agentic-behaviors/
</footer>

---

# 透明性に根ざした良い振る舞い

検証済みボット・エージェントとして扱われる条件


- 自らの正体を**正直に自己申告**すること
- 獲得した信頼を**悪用しない**こと


<br>


**`BotBase`**: 従来のBots Directory（良いボットの名簿）とは異なり、
好ましくない振る舞いをするボットも継続的に追跡する。
信頼を悪用したボットは検証済みステータスから外される。


---

# 悪い振る舞い: Precursorとは

クライアント側で**継続的に**動作する振る舞い検出システム


- JavaScriptをCDN経由で自動挿入
- ネットワークシグナルだけでは見逃される
  「わずかに人間らしくない」ボットトラフィックを検出
- **セッション全体**を通じて振る舞いを継続的に評価


---

# 直近24時間の稼働実績


- **73,438** ゾーンで実行
- **2億600万件**のPrecursor評価イベント

<img src="https://blog.cloudflare.com/_emdash/api/media/file/01KZCHB9H9G0DQFWTMBJV2JSPN.png" class="mx-auto rounded" style="max-height: 300px;" />

<footer class="text-xs opacity-50 mt-4">
出典: Cloudflare Blog https://blog.cloudflare.com/ja-jp/good-and-bad-agentic-behaviors/
</footer>

---

# 検出パターンからの気づき


- 不審な振る舞いは**セッションの途中**で現れることが多い
  → 開始時点だけの検査では見逃してしまう
- 同一セッション内で人間→AIエージェント→人間へと
  **主体が切り替わる**ハイブリッドトラフィックが実在する
- サイト運営者には、トラフィックの「意図」を理解することが求められる


---

# Precursor Trace

インタラクティブなデモ:
自分のカーソル操作が人間らしいか、ボットらしいかを確認できる


- カーソルの速度変化
- 軌道の微修正
- 動きのリズム



<div class="pt-4">

こうした細かな特徴が、人間らしさの可視化対象になっている

</div>


---

# カーソル動作の評価画面

Precursor Traceが
カーソルの動きをリアルタイムに評価している様子

<img src="https://blog.cloudflare.com/_emdash/api/media/file/01KZCHB9VXYV81SE8T9TT2SFZN.png" class="mx-auto rounded" style="max-height: 320px;" />

<footer class="text-xs opacity-50 mt-4">
出典: Cloudflare Blog https://blog.cloudflare.com/ja-jp/good-and-bad-agentic-behaviors/
</footer>

---

# Adaptive Intelligenceが近日登場


従来のBots MLは**バージョン単位**の更新
→ 数時間〜数分で適応するボットに追いつけない



- モデル自体が変化に**自ら適応**する新しい検出エンジン
- これまで観測したデータから学習しつつ、新規データにも基づいて
  継続的に学習・自動調整
- 良い振る舞いから悪い振る舞いまで幅広いパターンで自動更新
- 正式な新モデルのリリースを待たず、常に最新の予測検出が利用可能


---

# ボットの抗生物質問題


> ボットに対して常に決まった応答（403によるブロックなど）を
> 返していると、悪意のあるボット開発者は防御の仕組みを探り、
> その反応を観察して、簡単にリバースエンジニアリングできてしまう。


<br>


抗生物質を使い続けることで耐性菌が生まれる状況と同じ構図


---

# 対策① 予測不能性とランダム処理


- ブロック・チャレンジ・許可を**ランダムに**適用
- ボット側が自動再試行ロジックのパターンを特定しにくくなる
- 常に同じ応答を返す決定論的な対応の弱点を補う


---

# 対策② AI Labyrinth

許可されていないボットを**AI生成ページの無限迷路**に誘導し
ボットの計算リソースを浪費させる


- **Maze**: リンクでつながったページを無限に生成し、ボットに巡回させ続ける
- **Summary**: 本物らしく見えるが、AI学習データとしては役に立たない
  LLM生成の要約ページをクローラーに提供する
- **Poison**: 偽の価格・在庫情報などを提供し、AI学習用データへ
  誤った情報を混入させる


---

# 対策③ 良いボットのキューイング


- ショッピングエージェントのような正当な自動トラフィックは
  **完全拒否ではなく処理量を調整**
- アクセス自体は維持しつつ、負荷をコントロールする
- 「良い」振る舞いへの適切な報い方としての選択肢


---

# 防御の進化的アプローチ


- 固定ルールではなく、動的に入れ替わる「使い捨て」の
  ルール構成システム
- 攻撃側の進化に、防御側も進化し続けて対抗する
- 上記の機能は年末に近い時期から順次提供予定

<img src="https://blog.cloudflare.com/_emdash/api/media/file/01KZCHB9MEHG636KGSKZVJV4GR.png" class="mx-auto rounded" style="max-height: 280px;" />

<footer class="text-xs opacity-50 mt-4">
出典: Cloudflare Blog https://blog.cloudflare.com/ja-jp/good-and-bad-agentic-behaviors/
</footer>

---
class: text-center
---

# ユースケース

---

# ユースケース①②: 検出面の応用


- **巧妙に人間を装うボットの検出**: セッション途中の挙動変化を
  Precursorが継続的に評価し、単発のリクエスト検査では
  見逃す相手を捉える
- **人間とAIエージェントが混在するセッションへの対応**: 購入手続き
  だけをショッピングエージェントに委譲するような場面で、
  セッション内の主体の切り替わりを踏まえて対応する


---

# ユースケース③④: 対応面の応用


- **リバースエンジニアリング対策**: 予測不能なランダム応答や
  AI Labyrinthへの誘導で、ボット側が防御パターンを
  学習・回避しにくい状態を作る（「抗生物質問題」への対処）
- **AI学習用データのスクレイピング対応**: 許可のないクローラーに
  Summary/Poisonオプションで役に立たない・誤った情報を提供し、
  無断学習された場合の被害を軽減する


---

# ユースケース⑤: 正当な自動化トラフィックとの共存


- ショッピングエージェントなど、サイト運営者にとって
  有益な自動トラフィックは完全に遮断しない
- キューイングで処理量を調整し、アクセス自体は維持する
- 「良いボット」への報い方を用意することが
  信頼ベースのエコシステムを機能させる鍵になる


---

# 自分に合った信頼のエコシステムを構築する


- Precursorを有効化する
- Precursor Traceを試してみる
- BotBaseの内容を確認する


<br>


静的な一時点チェックから継続的な信頼評価へ移行することで、
次々に現れる新しいボット運営者への**場当たり的な対応**を減らせる


---

# まとめ


- 「ボット=悪、人間=善」の二分法はもはや成立しない。
  ハイブリッドトラフィックへの対応が求められている
- リスクと信頼を独立した2軸として扱い、Precursorによる
  継続的な振る舞い評価と、近日登場のAdaptive Intelligenceで検出面を強化
- 決定論的な対応は「抗生物質問題」を招く。予測不能性・
  AI Labyrinth・キューイングという3つの対策で対応面を補強
- ゴールは、特定時点の判定から継続的な信頼評価へのシフト


---

<div class="text-center">

# 参考リンク

</div>

- 原文: [エージェンティック・インターネットにおける「良い振る舞い」と「悪い振る舞い」を見極める](https://blog.cloudflare.com/ja-jp/good-and-bad-agentic-behaviors/)
- 英語版: [Unveiling good and bad behaviors on the Agentic Internet](https://blog.cloudflare.com/good-and-bad-agentic-behaviors/)
- [BotBase（ドキュメント）](https://developers.cloudflare.com/bots/botbase/)
- [検証済みボット（ドキュメント）](https://developers.cloudflare.com/bots/concepts/bot/verified-bots/)
- [Precursorの初回発表記事](https://blog.cloudflare.com/introducing-precursor/)
- [Precursor（ドキュメント）](https://developers.cloudflare.com/cloudflare-challenges/precursor/)
- [Precursor Trace（デモ）](https://precursor-trace.cloudflare.app)
- [AI Labyrinth（ドキュメント）](https://developers.cloudflare.com/bots/additional-configurations/ai-labyrinth/)

<div class="pt-8 text-sm opacity-50">
Wiki: docs/articles/2026-08-07-good-and-bad-agentic-behaviors.md
</div>
