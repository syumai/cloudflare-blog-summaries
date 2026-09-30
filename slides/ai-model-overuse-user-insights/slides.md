---
routerMode: hash
theme: default
title: "User Insights で AI モデルの「過剰利用」を見つける"
info: |
  Identify AI model overuse with User Insights の解説スライド。
  原文: https://blog.cloudflare.com/ai-model-overuse-user-insights/
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

# User Insights で<br>AI モデルの<br>「過剰利用」を見つける

Model fit・Potential Savings・タスク分析・ターン分析

Birthday Week 2026

<div class="pt-4 text-sm opacity-70">
原文: https://blog.cloudflare.com/ai-model-overuse-user-insights/<br>
公開日: 2026-09-30
</div>

---

# TL;DR

- User Insights が「何の仕事に、どのモデルを使ったか」という<strong>文脈</strong>を示すようになった
- 新しい見方は <strong>Model fit / Potential Savings / タスク分析 / ターン分析</strong>。AI Gateway ユーザーは無料
- 選ばれたモデルがタスクに対して高性能すぎる会話（<strong>overkill</strong>）と、関わるユーザー・エージェントが分かる
- 分類は専用 Worker による<strong>非同期処理</strong>。レイテンシは加わらないが、反映は約 1 日遅れる
- 分かった傾向は <strong>Auto Router</strong> につなげられる。自作アプリは <code>user_id</code> と <code>session_id</code> を渡す

---

# アジェンダ

- 背景: トークン数とリクエスト数だけでは分からないこと
- Overkill ビューと Model fit
- Potential Savings と Auto Router
- タスク分析・ターン分析
- 分類の仕組みと非同期処理
- ユーザー・ツールとの結びつけ
- コード例・ユースケース・まとめ

---

# 背景: 先月の User Insights

<div class="pt-4 text-left">

<a href="../identity-aware-ai-gateway/" target="_blank">先月公開された User Insights</a> は、ユーザー・アプリ・タスク・モデルごとのトラフィックと、ユーザー／エージェントの異常を見せる機能。

</div>

<div class="grid grid-cols-2 gap-6 pt-4 text-left">
<div class="p-4 border rounded">

<strong>できていたこと</strong>

- 誰が・どのアプリが・どのモデルで使ったか
- 普段と違う利用の検知

</div>
<div class="p-4 border rounded">

<strong>利用者の声</strong>

- モデル名とリクエスト数だけでは、裏にある仕事が分からない
- 同じトークン数でも中身は別物
- タスクを知らないとモデル選択を評価できない

</div>
</div>

---

# 課題: 支出が増えた、でも原因が分からない

<div class="pt-4 text-left">

社内の AI トラフィックを AI Gateway に通して数週間。支出が増え、一部のリクエストが遅く感じられる。

</div>

- 開発者のコーディング作業が複雑になった？
- エージェントがフォローアップの呼び出しを多用している？
- 少数のユーザーやエージェントが利用の大半を占めている？

<div class="pt-4 text-left">

トークン数とリクエスト数だけでは、どれが原因か判別できない。変更するのがモデルなのかワークフローなのかルーティングルールなのかは、トラフィックの意味を知ってから決める。

</div>

---

# Overkill ビュー

選ばれたモデルが、タスクの要求より高性能に見える会話を特定する。

<div class="grid grid-cols-2 gap-6 pt-4 text-left">
<div class="p-4 border rounded">

<strong>見つかる例</strong>

- 単純な整形・要約が、高性能な推論モデルへ送られている
- どのユーザー・エージェント・アプリが関係するかを確認できる

</div>
<div class="p-4 border rounded">

<strong>考えられる原因</strong>

- デフォルトのモデルだから
- どれを選べばよいか分からないから
- エージェントが全ステップで同じモデルを使う設定だから

</div>
</div>

---

# Model fit の概要

<div class="text-sm text-left">

「Model fit by token usage」: Overkill 29% / Appropriate 53% / Underpowered 18% / Could not assess &lt;1%

</div>

<div class="flex justify-center pt-4">
<img src="https://blog.cloudflare.com/_emdash/api/media/file/01M3AZ6B7XX7RT89TZ6F0XJ6WA.01M3AZ6C7YPP42RBCM2643NKM5.png" style="max-height: 120px" />
</div>

<div class="text-sm pt-4 text-left">

ランキングでも、置き換え先の自動推薦でもない。次の問いを立てるための材料。

- このモデルはタスクに適切か / 余分な能力は結果を良くしているか
- より速く安いモデルで同等の結果になるか / 問題は特定のワークフロー・ユーザー・エージェントに限られるか

</div>

<div class="absolute bottom-3 text-xs opacity-50">出典: Cloudflare Blog https://blog.cloudflare.com/ai-model-overuse-user-insights/</div>

---

# Potential Savings ビュー

<div class="text-sm text-left">

より速く安いモデルで品質を損なわず処理できそうなリクエストを特定する。提案モデルが安い場合のみ計上される<strong>推定値</strong>（請求額ではない）。

</div>

<div class="flex justify-center pt-2">
<img src="https://blog.cloudflare.com/_emdash/api/media/file/01M3AZ6B8GNYBK51EQG36J8DZE.01M3AZ6CT48X3YN9G1R7X1V67Q.png" style="max-height: 290px" />
</div>

<div class="text-xs pt-1 text-left">

例: General Q&A で Claude Opus 5 → GPT-5.6 Luna（110 会話、節約 $3.5K）。金額の一部は画像内でマスクされている。

</div>

<div class="absolute bottom-3 text-xs opacity-50">出典: Cloudflare Blog https://blog.cloudflare.com/ai-model-overuse-user-insights/</div>

---

# 目的は「最安モデルへの移行」ではない

<div class="pt-4 text-left">

遅延・入出力トークン・会話のターン数・総コストを、同じ種類のタスクで比べる。

</div>

<div class="grid grid-cols-2 gap-6 pt-4 text-left">
<div class="p-4 border rounded">

<strong>高性能モデルが要るかもしれない</strong>

- 難しいコーディング
- 調査タスク

</div>
<div class="p-4 border rounded">

<strong>要らないかもしれない</strong>

- 短い要約
- 単純な分類

</div>
</div>

<div class="pt-4 text-left">

選んだモデルが仕事に合っているかを理解することが目的。

</div>

---

# Overkill の支出が大きいユーザー

<div class="text-sm text-left">

「Users with most overkill spend」: overkill な期間の推定支出とトークン数をユーザー別に表示。

</div>

<div class="flex justify-center pt-2">
<img src="https://blog.cloudflare.com/_emdash/api/media/file/01M3CXY6CQTPWGG5B33C3B12DB.01M3CXY6ZMJRE91ABT6BBK684X.png" style="max-height: 290px" />
</div>

<div class="text-xs pt-1 text-left">

例: $3.4K（22,196,632 トークン）/ $1.5K / $1.3K / $943.31 / $911.96。ユーザー名は画像内でマスクされている。

</div>

<div class="absolute bottom-3 text-xs opacity-50">出典: Cloudflare Blog https://blog.cloudflare.com/ai-model-overuse-user-insights/</div>

---

# タスク分析

会話を仕事の種類で分類する。初期カテゴリは次の 5 つ。

<div class="flex gap-3 justify-center pt-4 text-sm">
<span class="px-3 py-1 border rounded">coding</span>
<span class="px-3 py-1 border rounded">research</span>
<span class="px-3 py-1 border rounded">writing</span>
<span class="px-3 py-1 border rounded">summarization</span>
<span class="px-3 py-1 border rounded">data analysis</span>
</div>

<div class="pt-6 text-left">

- エンジニアリングチームは主にコーディングとデバッグ、別のチームは調査と要約、といった違いが見える
- 単純なタスクが意外に多く、高性能モデルに送られていると分かることもある
- 既に AI Gateway を通っているトラフィックで調べられる
- デフォルトモデルが広く当てられすぎていないかの確認にも使える

</div>

---

# タスクとモデルのツリーマップ

<div class="text-sm text-left">

架空の組織のタスク別内訳。Token usage / Estimated spend を切り替えられ、タスクごとにモデル別の使用量が分かる。

</div>

<div class="flex justify-center pt-2">
<img src="https://blog.cloudflare.com/_emdash/api/media/file/01M3AZ6DWSCCXQY45YN6S47Z81.01M3AZ6F7QFT74B209Q5T0QWCG.png" style="max-height: 340px" />
</div>

<div class="absolute bottom-3 text-xs opacity-50">出典: Cloudflare Blog https://blog.cloudflare.com/ai-model-overuse-user-insights/</div>

---

# ターン分析: タスクの総コスト

<div class="text-sm text-left">

ユーザーターン = アシスタントが応答する前にユーザーが送る 1 通または連続したメッセージ。ターン数ごと・モデル別の平均推定コストを表示。

</div>

<div class="flex justify-center pt-2">
<img src="https://blog.cloudflare.com/_emdash/api/media/file/01M3AZ6ENNC17M0QB8823KZBBX.01M3AZ6G3G02MCXG73AHJ9ZNFE.png" style="max-height: 260px" />
</div>

<div class="text-xs pt-2 text-left">

長い会話は複雑な仕事なら自然。単純なタスクが何ターンも続くなら、プロンプト・モデル・ワークフローを見直す。

</div>

<div class="absolute bottom-3 text-xs opacity-50">出典: Cloudflare Blog https://blog.cloudflare.com/ai-model-overuse-user-insights/</div>

---

# 洞察を Auto Router につなぐ

<div class="grid grid-cols-3 gap-3 pt-4 text-sm text-left">
<div class="p-3 border rounded">

<strong>タスクビュー</strong>

要約と整形が多い

</div>
<div class="p-3 border rounded">

<strong>モデルビュー</strong>

それらが大きな推論モデルへ

</div>
<div class="p-3 border rounded">

<strong>ターンビュー</strong>

ほとんどが 1 ターンで完了

</div>
</div>

<div class="pt-4 text-left">

3 つが重なると、評価すべき具体的なワークロードになる。

</div>

- Auto Router は会話の軌跡・タスクカテゴリ・複雑さ・モデル適合のシグナルで、コストを考慮して自動ルーティング
- ワークロードごとのルールは不要。ただし常に最安モデルを選ぶわけではない

<div class="text-xs pt-2 opacity-70 text-left">

提供段階は原文で public beta / closed beta の両方の記述がある。

</div>

---

# 分類の仕組み

<div class="text-left text-sm">

各会話に「分析シグナル」が付く。元のリクエストを置き換えたり露出したりするものではない。

</div>

<div class="grid grid-cols-2 gap-6 pt-2 text-left text-sm">
<div class="p-3 border rounded">

<strong>分類エンジン</strong>

- 専用の Cloudflare Worker が、対象の AI Gateway ログを処理
- ユーザーの要求・応答・ツール呼び出し・ツール結果を含む軌跡を調べる
- 仕事の種類（coding / debugging / research / summarization など）と信頼度を返す
- 複雑さ・意図の曖昧さ・重大性・文脈依存度も評価

</div>
<div class="p-3 border rounded">

<strong>保存のしくみ</strong>

- メタデータは Durable Objects、ログ本文は R2
- 表示するのは派生カテゴリと集計。生のプロンプトの閲覧画面にはならない
- ログ本文の保持期間は AI Gateway のロギング設定に従う
- 少数の分かりやすいカテゴリに絞った実装

</div>
</div>

---

# 非同期処理のフロー

<div class="flex justify-center pt-2">
<img src="https://blog.cloudflare.com/_emdash/api/media/file/01M3AZ6G46ZRJMXSTJCT4NFWQC.01M3AZ6HBB27Q12C73PC5A3F5Q.png" style="max-height: 200px" />
</div>

<div class="text-sm pt-2 text-left">

- 左: AI Gateway proxy が Log body を R2、Log metadata を Durable Objects へ保存（追加レイテンシなし）
- 右: Classification worker が R2 の対象ログを処理し、タスクを分類して Derived category を出力。Durable Objects のメタデータと結合
- 図中の「Smart Router」は本文の「Auto Router」と同じものと思われる（筆者の推定）

</div>

<div class="absolute bottom-3 text-xs opacity-50">出典: Cloudflare Blog https://blog.cloudflare.com/ai-model-overuse-user-insights/</div>

---

# トレードオフ: リアルタイムではない

<div class="grid grid-cols-2 gap-6 pt-4 text-left">
<div class="p-4 border rounded">

<strong>得られるもの</strong>

- ユーザーの応答を待たせない
- AI Gateway が先に既存の経路へログを書き、分類 Worker があとから処理
- リクエスト経路にレイテンシを足さない

</div>
<div class="p-4 border rounded">

<strong>引き換えに</strong>

- 新しい会話はすぐには表示されない
- 分析はトラフィックに対して約 1 日遅れることがある
- ライブ監視ではなく、時間をかけた利用パターンの把握に使う

</div>
</div>

---

# 支出によるタスク分類

<div class="text-sm text-left">

「Tasks by model」で Debugging を選択した状態。下部の「Top models for Debugging」でモデルごとの使用量・支出を確認し、モデルを選ぶと該当ログを表示できる。

</div>

<div class="flex justify-center pt-2">
<img src="https://blog.cloudflare.com/_emdash/api/media/file/01M3AZ6HD80WB0Q9PW0MT8MSM2.01M3AZ6K828MRS3BKB8JG89K8N.png" style="max-height: 340px" />
</div>

<div class="absolute bottom-3 text-xs opacity-50">出典: Cloudflare Blog https://blog.cloudflare.com/ai-model-overuse-user-insights/</div>

---

# ユーザー・チーム・ツールと結びつける

- AI Gateway は ID を認識するため、別のレポート用パイプラインが要らない
- 自作アプリに加え、<strong>Claude Code・Codex・OpenCode</strong> などのツールにも使える
- AI Gateway を <strong>Cloudflare Access</strong> の背後に置くと、認証済みユーザーとセッションを AI トラフィックに結びつけられる
- Access は 50 ユーザーまで無料
- 自作アプリは、安定していて機微でない <code>user_id</code> と <code>session_id</code> を渡す（ID をプロンプトに混ぜない）

---

<style>
.wrapcode pre, .wrapcode code { white-space: pre-wrap !important; word-break: break-all; }
</style>

# コード例: cf-aig-metadata

記事中の唯一のコード例（HTTP リクエスト）。OpenAI の Chat Completions を AI Gateway 経由で呼ぶ。

<div class="wrapcode">

```http {all|1|3-5|7}
POST https://gateway.ai.cloudflare.com/v1/$ACCOUNT_ID/$GATEWAY_ID/openai/chat/completions

Content-Type: application/json

Authorization: Bearer $OPENAI_API_KEY

cf-aig-metadata: { user_id: "user-123", session_id: "session-456", idp_group: "engineering", application: "code-review" }
```

</div>

<div class="text-sm">

- 7 行目: <code>cf-aig-metadata</code> に <code>user_id</code> と <code>session_id</code>（必須）。<code>idp_group</code> と <code>application</code> は例として付けた属性
- ボディ（モデル・メッセージ）は記事でも省略されている

</div>

---

# ユースケース 1: 支出増の原因を切り分ける

<div class="pt-4 text-left">

支出が増え、一部のリクエストが遅い。

</div>

- 複雑なコーディングの増加か、エージェントの過剰な呼び出しか、一部ユーザーへの偏りかを見分ける
- タスク・モデル・ターンのビューを並べて確認する
- 見直す対象（モデル・ワークフロー・ルーティング）を、理由付きで決める

---

# ユースケース 2: 単純タスクの高性能モデルを探す

- 整形・要約・分類が高性能な推論モデルに送られていないかを Model fit と Potential Savings で探す
- Top opportunities で、タスクとモデルの組み合わせごとの推定節約額を確認
- 「Users with Overkill Spend」で、関わるユーザー・エージェントを特定し、原因（デフォルト設定・モデル選択の迷い・全ステップ同一モデル）を調べる

---

# ユースケース 3: ワークフローと自動ルーティング

<div class="grid grid-cols-2 gap-6 pt-4 text-left">
<div class="p-4 border rounded">

<strong>ワークフローの見直し</strong>

- 単純なタスクが何ターンも続いていないか
- プロンプト・モデル・ワークフローの改善箇所を探す

</div>
<div class="p-4 border rounded">

<strong>自動ルーティングへ</strong>

- task・model・turns のシグナルが揃ったワークロードを Auto Router で評価
- Claude Code・Codex・OpenCode の利用も、Access 経由でユーザー・セッションと結びつけて確認

</div>
</div>

---

# まとめ・所感

- 8 月は「普段と違う利用」の検知、今回は「同じ利用でもモデルが仕事に合っているか」という軸を加えた
- Overkill は推定であり、請求額ではない。結論ではなく調査の出発点
- 非同期処理のため約 1 日遅れる。ログ本文の保持は AI Gateway の設定に従う
- スマートルーティング（<a href="../workers-ai-gateway-unification/" target="_blank">統合記事</a>で予告）の下地になるシグナルでもある
- 原文の食い違い: Auto Router が public / closed beta の両方で記載、図は「Smart Router」表記
- 中心機能はダッシュボード分析とクローズドベータの Auto Router のため、Workers サンプルは対象外

---

<div class="text-center">

# 参考リンク

</div>

- 原文: [Identify AI model overuse with User Insights](https://blog.cloudflare.com/ai-model-overuse-user-insights/)（日本語版なし）
- 関連解説スライド: [AI Gateway の Auto Router で AI 支出を削減する](../auto-router/) / [ID情報に基づく分析で、不正なAIの利用を検出](../identity-aware-ai-gateway/) / [Workers AIとAI Gatewayを単一のAIコントロールプレーンへ統合](../workers-ai-gateway-unification/)
- [User Insights のドキュメント](https://developers.cloudflare.com/ai-gateway/observability/user-insights/)
- [AI Gateway](https://www.cloudflare.com/products/ai-gateway/)
- [Auto Router の記事](https://blog.cloudflare.com/auto-router/)

<div class="pt-8 text-sm opacity-50">
Wiki: docs/articles/2026-09-30-ai-model-overuse-user-insights.md
</div>
