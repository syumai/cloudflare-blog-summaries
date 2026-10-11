---
routerMode: hash
theme: default
title: "Protected Quick Tunnels: アカウント不要で、次の開発プロジェクトにシンプルな認証を"
info: |
  Protected Quick Tunnels: simple accountless authentication for your next dev project の解説スライド。
  原文: https://blog.cloudflare.com/protected-quick-tunnels/
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

# Protected Quick Tunnels

アカウント不要で、次の開発プロジェクトにシンプルな認証を

Birthday Week 2026 / Cloudflare Tunnel / Cloudflare Access

<div class="pt-4 text-sm opacity-70">
原文: https://blog.cloudflare.com/protected-quick-tunnels/<br>
公開日: 2026-10-02
</div>

---

# TL;DR

- Quick Tunnels は、アカウント・ドメイン・費用なしでローカルのサービスを <strong>trycloudflare.com</strong> の URL で公開する機能。課題は「リンクを知っていれば誰でも開ける」こと
- <strong>cloudflared 2026.9.3</strong> 以降、<code>--allowed-mail</code> で許可するメールアドレス・ドメインを指定できる
- 訪問者は Cloudflare Access のワンタイム PIN でメールを証明。<strong>どちら側も Cloudflare アカウントは不要</strong>
- 認証は Access、認可は<strong>手元の cloudflared</strong>。招待者リストはマシンの外に出ない
- 無料。Wrangler からも起動でき、2人のインターンが開発した

---

# アジェンダ

- 背景: エージェントで増えた Quick Tunnels の利用と、公開リンクの課題
- `--allowed-mail` の使い方（cloudflared / Wrangler / エージェントの既定）
- 設計: 認証と認可を分ける理由、検討された2案
- リクエストの流れ
- ユースケース、まとめ

---

# 背景: Quick Tunnels とエージェント

<div class="text-left text-sm pt-2">

- 2021年に提供開始。cloudflared がローカルのポートをランダムな URL で公開する
- アカウント登録・ドメイン・費用は不要。エージェントも、サインアップで詰まらずに自分で実行できる
- エージェントが使う場面の例
  - コーディングエージェントが結果を見せる場所が要る
  - 自宅の Mac mini のエージェントにスマートフォンから到達したい
  - ノートPC上の MCP サーバーを、ホスト型アシスタントから呼ぶために公開したい
- `--output json` でログが JSON になり、エージェントは URL をスクレイピングなしで取り出せる

</div>

---

# 課題: リンクを知っていれば誰でも開ける

<div class="text-left text-sm pt-2">

- 2026年9月18日、Quick Tunnels のページが Hacker News のトップに（800ポイント超・300コメント超）
- コメントの問い: 「誰かのエージェントが、機微な情報や安全でない開発中アプリを世界に公開するまで、どれくらいか」
- 本記事はこの問いへの回答

<div class="mt-6 p-4 border rounded">

開発中アプリやプレビューを、<strong>選んだ人だけ</strong>に見せたい。<br>
ただし、アカウント作成や設定ファイルは増やしたくない。

</div>

</div>

---

# 使い方: `--allowed-mail`

<div class="text-left text-sm pt-2">

```sh
cloudflared tunnel --url http://localhost:8080 \
  --allowed-mail alice@example.com
```

- Alice が URL を開く → メールアドレスを入力 → 受信箱のコードを入力 → アプリに到達
- それ以外の人は、リクエストがマシンに届く前に止まる
- DNS レコード・設定ファイル・ダッシュボードは引き続き不要
- `--allowed-mail` を付けなければ、従来どおり公開の Quick Tunnel

</div>

---

# 複数アドレス・ドメイン全体

<div class="text-left text-sm pt-2">

```sh
cloudflared tunnel --url http://localhost:8080 \
  --allowed-mail alice@example.com \
  --allowed-mail bob@example.com \
  --allowed-mail '*@example.com'
```

- フラグを繰り返せば複数人を許可できる。`'*@example.com'` でドメイン全体
- 許可者を変えるときは、cloudflared を止めて新しいトンネルを開始する
- プロセスが終了した時点で、全員のアクセスが終わる
- 固定ホスト名や IdP グループが要るなら Cloudflare Tunnel + Access、公開 URL なしで自分のデバイスから届くなら Cloudflare Mesh

</div>

---

# エージェントの既定にする / Wrangler から起動

<div class="grid grid-cols-2 gap-4 pt-2 text-left text-sm">
<div>

<strong>エージェントの指示ファイル（AGENTS.md など）</strong>

```text
When you start a Quick Tunnel,
always add --allowed-mail me@example.com.
```

- 1行足すだけで、共有プレビューは自分だけが開ける
- エージェントが従わないこともあるので実行内容は確認する。cloudflared は認証方式とルール数を表示する（アドレスは表示しない）

</div>
<div>

<strong>Wrangler</strong>

```sh
npx wrangler tunnel quick-start \
  http://localhost:8080 \
  --allowed-mail alice@example.com
```

- 繰り返しフラグ・カンマ区切り・ワイルドカードドメインに対応
- デバッグログから `--allowed-mail` の値を取り除く

</div>
</div>

---

# 設計の核: 認証と認可を分ける

<div class="grid grid-cols-2 gap-4 pt-4 text-left text-sm">
<div class="p-4 border rounded">

<strong>認証</strong>: この人はこのメールを所有しているか

- Cloudflare Access のワンタイム PIN
- メール配信・悪用対策・セッション・サインインページの運用を Access に任せる

</div>
<div class="p-4 border rounded">

<strong>認可</strong>: その人を入れてよいか

- 手元の cloudflared が、検証済みアドレスとルールを比較
- メモリ上で判断。中央のポリシー参照はない

</div>
</div>

<div class="text-left text-sm pt-4">

- 通常、認可ルールは Cloudflare アカウントに置かれる。Quick Tunnel にはアカウントがないため、「招待者リストの置き場所」が難所だった

</div>

---

# 4つの要件と、検討された2案

<div class="text-left text-sm pt-2">

要件: ①アカウント不要を保つ ②公開 Quick Tunnels の経路を変えない ③サインイン後に中央のポリシー参照をしない ④入力したメールのプライバシーを守る

| 案 | 内容 | 結果 |
|---|---|---|
| 案1 | 全ホスト名の前に Access アプリを置く | 数十万の短命トンネルごとにアプリ・ポリシーが要り、所有するアカウントもない。不採用 |
| 案2 | cloudflared がルールを持ち、Tunnel サービスがコード送信と検証も行う | 認可側は良いが、メール配信・悪用対策・セッション等の運用が重く、認証側は不採用 |
| 採用 | Access が所有確認、Workers のブローカーが署名付きハンドオフ、cloudflared が認可 | 招待者リストがマシンの外に出ない |

</div>

---

# 認証ブローカー: ステートレスな橋渡し

<div class="text-left text-sm pt-2">

- Cloudflare Workers 上の小さなブローカーが、Access の ID を<strong>短命の署名付き assertion</strong> に変換する
- ブローカーは、トンネルのポリシー・訪問者のセッション・ID レコードを<strong>保存しない</strong>
- トンネルの招待者リストを<strong>見ない</strong>
- Cloudflare が知るのは「このトンネルはメール認証を要求する」ことだけ

<div class="mt-6 p-4 border rounded">

保護付きトンネルの作成時に cloudflared が送るのは認証モードのみ（ルールは送らない）。<br>
サービスがそのモードを確認できなければ、<strong>公開 URL を渡さず起動を拒否する</strong>。

</div>

</div>

---

# 図: リクエストの4ステップ

<div class="text-center">
<img src="https://blog.cloudflare.com/_emdash/api/media/file/01M3WEQPPSBFQSKRNK84673MEC.png" style="max-height: 300px; margin: 0 auto;" />
</div>

<div class="text-left text-sm pt-2">

- 訪問者がリンクを開く → Access がワンタイム PIN で検証 → cloudflared が許可メールと照合 → 招待された人だけがアプリに到達

</div>

<div class="text-xs opacity-60 pt-2">出典: Cloudflare Blog https://blog.cloudflare.com/protected-quick-tunnels/</div>

---

# 初回アクセスの流れ（1/2）

<div class="text-left text-sm pt-2">

1. cloudflared がセッションのないリクエストを検知し、`login.trycloudflare.com` にリダイレクト。ブラウザに紐づく単回使用の state（有効10分）を付ける
2. Cloudflare Access が訪問者のメールにワンタイム PIN を送り、検証する
3. ブローカーが Access の ID を確認し、トンネルのホスト名と state に紐づく<strong>署名付き assertion</strong> を返す。form POST で渡るため、URL・履歴・ログには残らない

</div>

---

# 初回アクセスの流れ（2/2）

<div class="text-left text-sm pt-2">

4. cloudflared が assertion を検証して state を使い切り、メールをルールと照合する
   - 一致: ローカルのセッションを作り、元のページへ送る
   - 不一致: リストについて何も明かさない汎用の応答
5. 以降は<strong>最長4時間</strong>（Access のサインインが先に切れればそれまで）または cloudflared 停止まで、そのセッションを使う。中央の参照はない

<div class="mt-4 p-4 border rounded">

- セッション Cookie はランダム値と有効期限だけ。誰かは含まれない
- 認証用の資格情報は転送前に取り除かれ、アプリには見えない
- 確認に失敗したリクエストはローカルサービスに届かず、公開モードにもフォールバックしない

</div>

</div>

---

# コード例のまとめ

<div class="text-left text-sm pt-2">

```sh {1-2|4-7|10|all}
# 保護なし（従来どおり公開）
cloudflared tunnel --url http://localhost:5173

# 1アドレス + ドメイン全体を許可
cloudflared tunnel --url http://localhost:8080 \
  --allowed-mail alice@example.com \
  --allowed-mail '*@example.com'

# Wrangler から
npx wrangler tunnel quick-start http://localhost:8080 --allowed-mail alice@example.com
```

- 記事に掲載されたコマンドの組み合わせ。出力例は記事にない
- 行 1-2: 保護なし / 行 4-7: cloudflared の `--allowed-mail` / 行 10: Wrangler

</div>

---

# ユースケース 1: プレビューを自分のスマホで確認

<div class="text-left text-sm pt-2">

- dev サーバーを公開しつつ、`--allowed-mail me@example.com` で自分だけを許可
- 指示ファイルに1行足せば、エージェントが毎回フラグを付ける
- 実行後は、cloudflared の表示（メール認証の有無・ルール数）で確認する

</div>

---

# ユースケース 2: 限定共有と MCP サーバーの公開

<div class="text-left text-sm pt-2">

- <strong>特定の人に見せる</strong>: 同僚や顧客のアドレス、または `'*@example.com'` を指定。アカウント作成は不要
- <strong>MCP サーバーの一時公開</strong>: 未保護の公開エンドポイントを避ける動機になる
- 注意: 保護の対象は、ブラウザでメール認証する訪問者。非ブラウザのクライアントの扱いは記事では説明されていない
- 長期運用・細かいルールが要る場合は Cloudflare Tunnel + Access

</div>

---

# まとめ・所感

<div class="text-left text-sm pt-2">

- 保護はフラグ1つ。アカウント不要・無料という Quick Tunnels の性質を保っている
- 認証は Access に任せ、認可は端末側。ステートレスなブローカーで、短命な大量のトンネルにも対応できる
- 失敗時に公開モードへ落ちない設計
- 記事はフロー図1点のみ。キャプションは画像の alt テキストをもとにしている
- 関連: エージェントに与える権限を小さくする考え方 ▶ <a href="../the-agent-access-model/">解説スライド</a>
- 関連: MCP の仕様更新 ▶ <a href="../mcp-v2/">解説スライド</a>

</div>

---

# 参考リンク

<div class="text-left text-sm pt-2">

- 原文: https://blog.cloudflare.com/protected-quick-tunnels/
- Quick Tunnels ドキュメント: https://developers.cloudflare.com/tunnel/get-started/quick-tunnels/
- cloudflared のダウンロード: https://developers.cloudflare.com/tunnel/downloads/
- Quick Tunnels の紹介（2021年）: https://blog.cloudflare.com/quick-tunnels-anytime-anywhere/
- Cloudflare Mesh: https://blog.cloudflare.com/mesh/
- 関連解説スライド: [エージェントアクセスモデル](../the-agent-access-model/) / [次世代のMCP](../mcp-v2/) / [ローカルトレース](../local-tracing/)

</div>
