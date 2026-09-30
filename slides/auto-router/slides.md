---
routerMode: hash
theme: default
title: "AI Gateway の Auto Router で AI 支出を削減する"
info: |
  Cut your AI spend with AI Gateway's Auto Router の解説スライド。
  原文: https://blog.cloudflare.com/auto-router/
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

# AI Gateway の<br>Auto Router で<br>AI 支出を削減する

モデルに cloudflare/auto を指定するだけで、リクエストごとに適切なモデルへ（パブリックベータ）

Birthday Week 2026

<div class="pt-4 text-sm opacity-70">
原文: https://blog.cloudflare.com/auto-router/<br>
公開日: 2026-09-30
</div>

---

# TL;DR

- AI Gateway の <strong>Auto Router</strong> がパブリックベータで公開（ベータ中は無料）。モデルに <code>cloudflare/auto</code> を指定すると、タスクに十分な能力のモデルへ自動ルーティング
- 社内の OpenCode での利用では、フロンティアモデルのみと比べて<strong>最大 30% のコスト削減</strong>
- 内部ベンチマークでは Sol の 80%・Opus の 35% のコストで、成功率は 86.6%（Sol 84.2% / Opus 96.6%）
- Workers AI 上の<strong>分類器</strong>（14 カテゴリ＋4 つの難易度指標）と<strong>スコアリング行列</strong>の 2 段構成
- <strong>キャッシュの書き直しコスト</strong>を考慮し、ターン内ではモデルを固定する

---

# アジェンダ

- 背景: 予算やルールだけでは届かない節約
- 結果: 内部ベンチマーク
- 仕組み: 候補プール → 分類 → スコアリング → ランク
- 長いセッションでのキャッシュと切り替え
- 設計上の利点・今後の予定
- コード例・ユースケース・まとめ

---

# 背景: 最良の節約は、気づかれない節約

<div class="grid grid-cols-2 gap-6 pt-4 text-left">
<div class="p-4 border rounded">

<strong>AI 導入の流れ</strong>

- 探索期: ツールを次々導入し、API キーを配り、トークンが流れる
- 定番ツールに収束（コーディング・非技術業務・エージェント）
- 支出を管理したくなるが、予算とルールには限界がある

</div>
<div class="p-4 border rounded">

<strong>既存の手段</strong>

- <a href="https://blog.cloudflare.com/ai-gateway-spend-limits" target="_blank">予算・上限</a>の設定
- <a href="../identity-aware-ai-gateway/" target="_blank">ID 情報</a>と AI 利用の紐づけ
- それでも、モデルは個人が手動で選ぶ

</div>
</div>

---

# 課題: モデルが「過剰」になりがち

<div class="pt-4 text-left">

OpenCode・Claude Code・Codex などでは、個々のユーザーが手動でモデルを選ぶ。

</div>

- メールやチャットの要約に Opus 級の知能は要らない
- ただしセキュリティエンジニアのチームには、そのモデルを完全には使えなくしたくない
- 予算・上限・分析は可視性とガードレールを与えるが、リクエストごとのコスト意識は個人任せ

<div class="pt-4 text-left">

AI Gateway はすべてのリクエストが通る<strong>コントロールプレーン</strong>。ゲートウェイ自身が判断を下せる。

</div>

---

# Auto Router とは

<div class="pt-4 text-left">

モデルに <code>cloudflare/auto</code> を指定すると、各リクエストを「そのタスクに十分な能力のモデル」へ自動でルーティングする。

</div>

<div class="grid grid-cols-2 gap-6 pt-4 text-left">
<div class="p-4 border rounded">

<strong>組織にとって</strong>

- 支出が自動で減る
- 社内 OpenCode で最大 30% 削減

</div>
<div class="p-4 border rounded">

<strong>ユーザーにとって</strong>

- モデル選択を意識しなくてよい
- 必要なときは最も高性能なモデルを使い続けられる

</div>
</div>

---

# 結果: 内部ベンチマーク

<div class="text-sm text-left">

一般ナレッジワーク（メール・カレンダー・Slack・ファイル・出張・財務）。97 タスク × 3 回。

</div>

<div class="text-sm pt-2">

| モデル | 成功 | 成功率 | 総コスト | 1 成功あたり |
| --- | --- | --- | --- | --- |
| cloudflare/auto | 252/291 | 86.6% | $2.10 | $0.0084 |
| Claude Opus 5.5 | 281/291 | 96.6% | $5.91 | $0.0210 |
| GPT-6 Sol | 245/291 | 84.2% | $2.64 | $0.0108 |

</div>

<div class="text-sm pt-2 text-left">

- コストは Sol の 80%、Opus の 35%。成功率は Opus に及ばない（内部評価で信頼区間は広い）
- 技術・非技術が混在する幅広いナレッジワークで最も効果が出る

</div>

---

# なぜ安くなるのか

<div class="grid grid-cols-2 gap-6 pt-4 text-left">
<div class="p-4 border rounded">

<strong>ジャグド・フロンティア</strong>

- 問題を解く能力は、モデル群のどこかにある
- ルーターの仕事は、品質と価格を両立させてタスクごとに選ぶこと
- フロンティア以外でできる仕事に、フロンティア価格を払わない

</div>
<div class="p-4 border rounded">

<strong>単価が安い ≠ 安く済む</strong>

- 紙の上で安いモデルが、桁違いに多くのトークンを使うことがある
- 100 万トークンあたりの金額で負荷分散するのではなく、<strong>予測される軌跡のコスト</strong>を最小化する

</div>
</div>

---

# 仕組み: 全体の流れ

<div class="text-sm text-left">

新しいターンを優先した直近のメッセージ（テキストのみ・最大 8 KiB）を分類 → モデルごとのプロファイルと合わせてスコア化 → ランク付け。

</div>

<div class="flex justify-center pt-2">
<img src="https://blog.cloudflare.com/_emdash/api/media/file/01M3QZK8CSR7YG8VYE7QWJ3TY2.png" style="max-height: 330px" />
</div>

<div class="absolute bottom-3 text-xs opacity-50">出典: Cloudflare Blog https://blog.cloudflare.com/auto-router/</div>

---

# 仕組み: 候補プールと分類

<div class="grid grid-cols-2 gap-6 pt-4 text-left">
<div class="p-4 border rounded">

<strong>1. 候補プールの構築</strong>

- リクエスト形式・実行モードに非対応のモデルを除外
- 資格情報・課金設定・アクセス制御・支出上限を考慮
- 障害中のプロバイダー／モデルは除外し、復旧後に自動で戻す

</div>
<div class="p-4 border rounded">

<strong>2. 分類</strong>

- Workers AI 上の多ヘッド分類モデル（エッジの GPU）
- 14 のタスクカテゴリへの確率（coding・planning・research・data analysis など）
- 4 次元を 1〜5 で評価: complexity・ambiguity・stakes・前の文脈への依存度

</div>
</div>

---

# 仕組み: スコアリングと選択

<div class="pt-2 text-left text-sm">

モデルのベンチマーク結果とシグナルを組み合わせるスコアリング行列が、各モデルの適合度を推定する。

</div>

```text
utility = expected quality - adaptive cost penalty
```

<div class="text-sm pt-2 text-left">

- 単純なリクエスト: 価格の重みが大きく、十分な能力があれば小さいモデルが勝つ
- 難易度が上がる: コストのペナルティが下がり、強いモデルが選ばれやすい
- 最後にランク付きリストを返す。1 位を試し、処理できなければ次の適格なモデルへ

</div>

---

# 長いセッションとキャッシュ

<div class="text-sm text-left">

長いエージェントセッションでは、コストの中心は定価よりキャッシュ読み取り。モデルを切り替えるとキャッシュが捨てられ、全コンテキストを書き直す。

</div>

<div class="grid grid-cols-2 gap-6 pt-3 text-left text-sm">
<div class="p-3 border rounded">

<strong>ターン内</strong>

- キャッシュが温まっている
- 切り替えは得になりにくい → 同じモデルを使い続ける

</div>
<div class="p-3 border rounded">

<strong>ターン間</strong>

- コンテキストのトークン数に応じた切り替えペナルティ
- 生きたキャッシュを持つモデルは安い読み取り価格、他は書き直しの全額で評価

</div>
</div>

<div class="text-sm pt-3 text-left">

推論トークンは他のモデルが読めないことが多く、切り替えで出力価格のやり直しが生じうる。将来は同じモデルファミリーを優先したい、としている。

</div>

---

# 設計上の利点

- <strong>説明しやすい</strong>: 予測カテゴリと難易度が、モデルの選択にどう反映されたかを確認できる
- <strong>新モデルに再学習は不要</strong>: ベンチマーク由来の重みをスコアリング行列に加えるだけ
- <strong>プロファイルの拡張</strong>: 同じ分類器で別のルーターも作れる。例: <code>cloudflare/auto-best</code>（同じモデルプールで、コストのトレードオフなしに最高の期待品質を選ぶ。将来リリース予定）

---

# コード例: cloudflare/auto の呼び出し

<div class="text-sm text-left">

記事本文にコードブロックはない。以下は、記事がリンクする<strong>ドキュメント</strong>の呼び出し例。

</div>

<style>
.slidev-code { font-size: 0.6rem !important; }
</style>

```bash
curl -i -X POST "https://gateway.ai.cloudflare.com/v1/$CLOUDFLARE_ACCOUNT_ID/$CLOUDFLARE_GATEWAY_ID/compat/chat/completions" \
  --header "cf-aig-authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  --header "Content-Type: application/json" \
  --data '{
    "model": "cloudflare/auto",
    "messages": [
      { "role": "user", "content": "hello" }
    ]
  }'
```

<div class="text-sm pt-2 text-left">

プロバイダー固有のモデル名の代わりに <code>"model": "cloudflare/auto"</code> を指定する。選ばれたモデルは応答ヘッダー <code>cf-aig-routed-model</code> で分かる。

</div>

---

# コード例: ヘッダーとセッション

<div class="text-sm text-left">

ドキュメントにある、Auto Router 用のヘッダー（記事本文にはない補足）。

</div>

<div class="text-sm pt-2">

| ヘッダー | 役割 |
| --- | --- |
| <code>cf-aig-session-id</code> | セッションを識別。ターン内で同じモデルを維持しキャッシュを活かす |
| <code>cf-aig-allowed-models</code> | 選択肢のモデルを絞る（例: <code>anthropic/*</code>） |
| <code>cf-aig-allowed-providers</code> | 選択肢のプロバイダーを絞る |
| <code>cf-aig-routed-model</code>（応答） | 実際に使われたモデル |
| <code>cf-aig-routing-reason</code>（応答） | 選ばれた理由 |

</div>

<div class="text-sm pt-2 text-left">

Chat Completions と Responses API に対応。WebSockets は未対応。サンプル: <code>examples/auto-router/</code>

</div>

---

# ユースケース 1: コーディングエージェントの既定

<div class="pt-4 text-left">

OpenCode・Claude Code・Codex を使う組織で、<code>cloudflare/auto</code> を既定にする。

</div>

- 各ユーザーが手動でモデルを選ぶ代わりに、ゲートウェイがタスクに応じて選ぶ
- 社内の OpenCode では、フロンティアのみと比べて最大 30% の削減
- コーディングタスクでは、フロンティアモデルに匹敵する結果

---

# ユースケース 2: 幅広いナレッジワーク

<div class="pt-4 text-left">

技術・非技術の仕事が混ざる大きな組織。メール・カレンダー・Slack・ファイル・出張・財務。

</div>

- 単純な要約や整理には小さいモデル、難しい仕事には強いモデル
- ベンチマークでは Sol の 80%・Opus の 35% のコスト
- <a href="../cloudflare-os/" target="_blank">Cloudflare OS</a> のような自前のエージェントハーネスにも組み込める

---

# ユースケース 3: 過剰利用への対処と耐障害性

<div class="grid grid-cols-2 gap-6 pt-4 text-left">
<div class="p-4 border rounded">

<strong>過剰利用の解消</strong>

- <a href="../ai-model-overuse-user-insights/" target="_blank">User Insights</a> の Overkill / Potential Savings で見つけたワークロードに適用

</div>
<div class="p-4 border rounded">

<strong>自動フェイルオーバー</strong>

- 不健全なプロバイダーは候補から外れ、復旧後に戻る
- 1 位が処理できなければ次のモデルへ

</div>
</div>

---

# 今後の予定

- <code>cloudflare/auto</code> で提供するモデルの拡大
- ゼロデータ保持（ZDR）要件でのモデルの絞り込み
- プロバイダーの処理容量の考慮
- リクエストごとの推論・思考レベルの選択
- Responses API と WebSockets の完全対応
- 最初の段階の分類器としての構造化された意思決定モデルの検討

---

# まとめ・所感

- 8 月に予告された<a href="../workers-ai-gateway-unification/" target="_blank">スマートルーティング</a>が、Auto Router として登場
- 単価ではなく<strong>予測される軌跡コスト</strong>を最小化し、キャッシュの書き直しコストも考慮する点が特徴
- ベンチマークは内部評価で信頼区間が広い。Opus 5.5 には成功率で約 10 pp 及ばないため、自社ワークロードでの評価が前提
- 原文の提供段階は public beta（<a href="../ai-model-overuse-user-insights/" target="_blank">User Insights の記事</a>の「closed beta」と食い違い）
- 最小の Worker サンプルを <code>examples/auto-router/</code> に用意（dry-run のみ確認）

---

<div class="text-center">

# 参考リンク

</div>

- 原文: [Cut your AI spend with AI Gateway's Auto Router](https://blog.cloudflare.com/auto-router/)（日本語版なし）
- 関連解説スライド: [User Insights で AI モデルの「過剰利用」を見つける](../ai-model-overuse-user-insights/) / [ID情報に基づく分析で、不正なAIの利用を検出](../identity-aware-ai-gateway/) / [Workers AIとAI Gatewayを単一のAIコントロールプレーンへ統合](../workers-ai-gateway-unification/)
- [Auto Router のドキュメント](https://developers.cloudflare.com/ai-gateway/features/auto-router/)
- Workers サンプル: [examples/auto-router/](https://github.com/syumai/cloudflare-blog-summaries/tree/main/examples/auto-router)

<div class="pt-8 text-sm opacity-50">
Wiki: docs/articles/2026-09-30-auto-router.md
</div>
