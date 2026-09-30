---
routerMode: hash
theme: default
title: "本番の問題を検知してエージェントへ直接送る"
info: |
  Detect and send production issues straight to your agent（Workers の Issues）の解説スライド。
  原文: https://blog.cloudflare.com/real-time-issue-detection/
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

# 本番の問題を検知してエージェントへ直接送る

Cloudflare Workers の組み込みエラー監視「Issues」（オープンベータ）

Birthday Week 2026

<div class="pt-4 text-sm opacity-70">
原文: https://blog.cloudflare.com/real-time-issue-detection/<br>
公開日: 2026-09-30
</div>

---

# TL;DR

- Workers に組み込みのエラー監視 <strong>Issues</strong>（オープンベータ）。繰り返す例外・5xx・エラーログを 1 つの issue にまとめる
- 有効化は設定 1 行（<code>observability.issues.enabled</code>）。SDK もラッパーも不要
- issue には、エラー・スタックトレース・ログ・トレース・Worker のバージョンが付き、<code>tracing</code> API でユーザー ID などの文脈を足せる
- <strong>Automations</strong> で、閾値超えや再発をきっかけに Claude Code・Cursor・Devin・Webhook・チャットなどへ自動送信。Cloudflare MCP を併用すれば、ログとトレースの追加調査から PR まで進む
- 社内の Workflows で、1 日で 2 件の不具合を見つけて修正

---

# アジェンダ

1. 背景: 検知から修正までの手作業のつなぎ目
2. 流れの全体像（5 段階）
3. 失敗を自動でつかまえる（検出対象・一覧・詳細）
4. 文脈を足す（コード例）
5. Automations: エージェントへ直接送る
6. 事例: 1 日で 2 件の Workflows の不具合
7. ユースケース・まとめ

---

# 背景: つなぎ目が手作業のまま

<div class="grid grid-cols-2 gap-6">
<div class="p-4 border rounded">

<strong>エージェントがすでにできること</strong>

- オブザーバビリティのデータを問い合わせる
- リポジトリをたどり、コードを直す
- テストを書き、PR を出す

</div>
<div class="p-4 border rounded">

<strong>手作業で残っていること</strong>

- 繰り返す失敗が同じバグと気づく
- 関連するログとトレースを集める
- その文脈をエージェントに渡す
- 修正が効いたかを確かめる

</div>
</div>

<div class="pt-4 text-sm">

構造化された引き渡しがないと、エージェントは生のテレメトリを探し回り、失敗の範囲と文脈を復元するところから始めることになる。

</div>

---

# Issues が担うこと

- 繰り返し起きる<strong>例外・5xx 応答・エラーログ</strong>を 1 つの issue にまとめる
- エラー・スタックトレース・ログ・トレース・Worker のバージョンを、設定したコーディングエージェントへ送る
- エージェントの既定のワークフロー（トリアージ → 追加のデータ取得 → PR 作成）を起動する

<div class="pt-4 text-sm">

「検知してまとめ、文脈つきで渡す」までが Issues。修正の提案と PR はエージェント、レビューとデプロイは人。

</div>

---

# 流れの全体像: 5 段階

<div class="flex justify-center">
<img src="https://blog.cloudflare.com/_emdash/api/media/file/01M3QYT05Y21ZDERDW929GEFN1.png" style="max-height: 300px" />
</div>

<div class="text-sm pt-2">

1 本番 Worker → 2 検出とグループ化 → 3 送り先へルーティング → 4 エージェントが調査・PR（任意で Cloudflare MCP）→ 5 人がレビューしてデプロイ

</div>

<div class="absolute bottom-3 text-xs opacity-50">出典: Cloudflare Blog https://blog.cloudflare.com/real-time-issue-detection/（図中の文言を日本語で要約）</div>

---

# 失敗を自動でつかまえる

- <a href="http://developers.cloudflare.com/workers/observability/issues/#enable-issues">設定 1 行</a>で有効化。追加の計装なし。ランタイムに組み込み済み
- 記録する対象:
  - 未処理の例外・失敗した呼び出し・HTTP 5xx 応答
  - <code>console.log()</code> / <code>console.error()</code> の出力
  - スタックトレースを含むログ
- 加えて、<strong>暴走するアラーム</strong>と<strong>ループ内の大量ログ書き込み</strong>も検出
- 例: デプロイ後に失敗したリクエストが、どれも同じバグ由来 → リクエスト ID は違っても 1 つにまとめ、初出・回数・増加傾向を表示

---

# Issues 一覧

<div class="flex justify-center">
<img src="https://blog.cloudflare.com/_emdash/api/media/file/01M3QYT25VMJ2V35QMW8F4E6HC.png" style="max-height: 340px" />
</div>

<div class="text-sm pt-2">

Type・Issue・Events（件数と推移）・Last seen・Status の表。上部に、最新の発生・Active issues・Active occurrences・Resolved issues の集計。

</div>

<div class="absolute bottom-3 text-xs opacity-50">出典: Cloudflare Blog https://blog.cloudflare.com/real-time-issue-detection/</div>

---

# issue の詳細

<div class="flex justify-center">
<img src="https://blog.cloudflare.com/_emdash/api/media/file/01M3QYT4ESTTWJM2TD7B3D0PVE.png" style="max-height: 330px" />
</div>

<div class="text-sm pt-2">

エラー・Context・Execution trail（直前のリクエストやログ）・Worker のバージョンなどのメタデータを左に、期間中の件数・送り先・履歴を右に表示。Context 欄は、アプリの文脈を足すよう促している。

</div>

<div class="absolute bottom-3 text-xs opacity-50">出典: Cloudflare Blog https://blog.cloudflare.com/real-time-issue-detection/</div>

---

# コード例: 文脈を足す

<div class="text-[12px]">

```ts {all|1|4|5-8|9}
import { tracing } from "cloudflare:workers";

export default {
  async fetch(request: Request): Promise<Response> {
    const { userId, accountId, sessionId } = await getAuthDetails(request);
    const span = tracing.getActiveSpan();
    span?.setAttribute("user.id", userId);
    span?.setAttribute("account.id", accountId);
    span?.setAttribute("session.id", sessionId);
    return handleRequest(request);
  },
} satisfies ExportedHandler;
```

</div>

<div class="text-sm pt-1">

- Cloudflare は Worker 内の出来事は捕捉できるが、どのユーザー・アカウント・セッションが重要かは知らない。ランタイム組み込みの OpenTelemetry API（<code>tracing</code>）で識別子を足す。追加パッケージなし
- <code>getActiveSpan()</code> で現在のスパンを取り、<code>setAttribute</code> で属性を付与（<code>span?.</code> は、スパンがない場合に備えたオプショナルチェーンと読める）
- 各 occurrence に表示され、失敗が特定のアカウントに偏っていないかを、エージェントへ送る前に確認できる

</div>

---

# 文脈が表示された occurrence

<div class="flex justify-center">
<img src="https://blog.cloudflare.com/_emdash/api/media/file/01M3QYSXV0EC5ECJM87EFHNGWB.png" style="max-height: 200px" />
</div>

<div class="text-sm pt-4">

- Context 欄に User ID と Session ID が表示される
- Execution trail には、<code>GET /</code> と「Unexpected end of JSON input」
- 前のスライドのコード例で付けた <code>user.id</code> や <code>session.id</code> が、ここに出る

</div>

<div class="absolute bottom-3 text-xs opacity-50">出典: Cloudflare Blog https://blog.cloudflare.com/real-time-issue-detection/</div>

---

# コード例: 有効化とエージェントへの最初の依頼

<div class="text-[10px]">

<pre class="text-[11px] leading-snug p-3 rounded" style="white-space: pre-wrap; background: #f4f5f7">Set up cf: https://developers.cloudflare.com/cf/. Enable Issues for this Worker in cloudflare.config.ts; show the diff and ask before deploying. After approved deployment, wait 1 minute, then find the most frequent issue and retrieve an occurrence using its returned ID:

cf observability issues list --order-by count --order desc --per-page 1
cf observability issues occurrences &lt;ISSUE_ID&gt; --per-page 1

If no issues exist, report that. Otherwise, diagnose from the details, fix locally, run relevant checks, and show the diff and results. Ask before deploying the fix.</pre>

</div>

<div class="text-sm pt-2">

- 記事のボタン「Copy prompt: Set up for cf」の中身（原文のまま）。設定は <code>observability.issues.enabled</code> を <code>true</code>（記事の Get started は <code>wrangler.jsonc</code>、このプロンプトは <code>cloudflare.config.ts</code> と書く）
- <code>cf observability issues list</code> で最多の issue、<code>occurrences</code> でその 1 件を取得 → 診断 → ローカルで修正。<strong>デプロイの前は必ず人に確認</strong>

</div>

---

# Automations: issue をエージェントへ直接送る

- issue が<strong>回数の閾値</strong>を超えたとき、または<strong>静かな期間の後に再発</strong>したときに送信
- いつ動かすか、どこへ送るかを選べる
- 送り先:
  - <strong>コーディングエージェント</strong>: Claude Code（routine ID とトークン）/ Cursor（Automation の Webhook URL）/ Devin（API トークンと組織 ID）
  - <strong>汎用 Webhook</strong>: 自前のエージェントや HTTPS エンドポイント
  - <strong>チャット・インシデント管理</strong>: チームへの通知、オンコールの流れ

---

# Automation の設定画面

<div class="flex justify-center">
<img src="https://blog.cloudflare.com/_emdash/api/media/file/01M3QYST2KRKZ4KS08A9FCW90K.png" style="max-height: 230px" />
</div>

<div class="text-sm pt-3">

左から「Create automation」（Trigger は Occurrence threshold など）→「Setup integration」（Generic Webhook・Coding Agent・Chat・Incident Management。Cloudflare Workers は Coming soon）→「Coding Agent」（Claude Code・Cursor・Devin）。

</div>

<div class="absolute bottom-3 text-xs opacity-50">出典: Cloudflare Blog https://blog.cloudflare.com/real-time-issue-detection/</div>

---

# 送られる内容と、その先

<div class="grid grid-cols-2 gap-6">
<div class="p-4 border rounded">

<strong>Automation が送るもの</strong>

- 例外・エラー
- ソースマップ済みのスタックトレース
- 前後のログとトレース
- Worker のバージョン
- 足したアプリの文脈

</div>
<div class="p-4 border rounded">

<strong>さらに調べるとき</strong>

- エージェントを <a href="https://github.com/cloudflare/mcp-server-cloudflare/tree/main/apps/workers-observability">Cloudflare MCP</a> に別途接続
- 関連するログとトレースを自分で問い合わせる
- コードとテストの変更案を作り、PR を出す

</div>
</div>

<div class="pt-4 text-sm">

本番に出るものは人が握る: PR をレビューし、修正をデプロイし、issue を解決済みにする。

</div>

---

# 事例: 1 日で 2 件の Workflows の不具合

- Workflows は Workers 上に作られ、ステップ・リトライ・保存された状態を裏で管理する。自社の本番システムでの試験に向く
- 有効化から 1 日のうちに、大量のトラフィックに埋もれた 2 件を発見

<div class="grid grid-cols-2 gap-4 pt-2">
<div class="p-3 border rounded">

<strong>リトライの無限ループ</strong>

コントロールプレーンのマイグレーションが、ある境界的な状況で SQLite の外部キーエラーを繰り返した

</div>
<div class="p-3 border rounded">

<strong>終わらない削除</strong>

インスタンスの削除中に Workers のサブリクエスト上限を超え、完了しなくなる境界的なケースがあった

</div>
</div>

<div class="pt-3 text-sm">

Automation で issue が Cloudflare OS に送られ、エラーから Workflows のコードをたどって 2 件とも修正案を提示。

</div>

---

# ユースケース

<div class="grid grid-cols-3 gap-3 text-sm">
<div class="p-3 border rounded">

<strong>デプロイ直後の不具合把握</strong>

リクエスト ID の違う失敗を 1 つにまとめ、初出・回数・増加傾向を見る

</div>
<div class="p-3 border rounded">

<strong>影響範囲の見極め</strong>

<code>user.id</code> などを足し、失敗の集中先を確認してからエージェントへ

</div>
<div class="p-3 border rounded">

<strong>エージェントによる修正</strong>

閾値超えの issue を Claude Code・Cursor・Devin に送り、調査から PR 作成まで。人はレビューとデプロイ

</div>
<div class="p-3 border rounded">

<strong>チームへの通知</strong>

チャットやインシデント管理・オンコールへ流す

</div>
<div class="p-3 border rounded">

<strong>稀な境界ケースの発見</strong>

大量のトラフィックに埋もれた、無限リトライや上限超えによる未完了

</div>
<div class="p-3 border rounded">

<strong>暴走の検知</strong>

止まらないアラームや、ループ内の大量ログ出力

</div>
</div>

---

# まとめ・所感

- エラー監視を外部 SDK ではなく<strong>ランタイムの機能</strong>にした点が要点。設定 1 行で始められる
- 役割分担が明確: Cloudflare が検知・グループ化・文脈の添付、エージェントが調査と PR、人がレビューとデプロイ
- 生のテレメトリを探し回る代わりに、例外・スタックトレース・前後のログとトレース・バージョンが最初から揃う
- オープンベータのため、仕様や送り先は変わりうる（図では Automation の送り先に Cloudflare Workers が「Coming soon」）
- 開発中のデバッグにはローカルトレース、本番の監視には Issues、という使い分けになる

---

# 参考リンク

- 原文: https://blog.cloudflare.com/real-time-issue-detection/
- Issues のドキュメント: http://developers.cloudflare.com/workers/observability/issues/
- Automations: http://developers.cloudflare.com/workers/observability/issues/automations/
- カスタムスパン: https://developers.cloudflare.com/workers/observability/traces/custom-spans/
- Cloudflare MCP（workers-observability）: https://github.com/cloudflare/mcp-server-cloudflare/tree/main/apps/workers-observability
- ローカルトレース: ▶ <a href="../local-tracing/" target="_blank">解説スライド</a>
- エージェント開発ライフサイクル: ▶ <a href="../agent-development-lifecycle/" target="_blank">解説スライド</a>
- cf CLI: ▶ <a href="../cloudflare-cf-cli-launch/" target="_blank">解説スライド</a>
- Cloudflare OS: ▶ <a href="../cloudflare-os/" target="_blank">解説スライド</a>
- Workers サンプル: <code>examples/real-time-issue-detection/</code>（有効化の設定と、例外を起こして Context を付ける最小 Worker。<code>wrangler deploy --dry-run</code> で確認済み）
