---
routerMode: hash
theme: default
title: "Monetization Gateway ベータ: HTTP 402 で AI エージェントに従量課金する"
info: |
  Monetization Gateway beta: charge AI agents for consumption with HTTP 402 の解説スライド。
  原文: https://blog.cloudflare.com/monetization-gateway-beta/
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

# Monetization Gateway ベータ

HTTP 402 で AI エージェントに従量課金する

Birthday Week 2026

<div class="pt-4 text-sm opacity-70">
原文: https://blog.cloudflare.com/monetization-gateway-beta/<br>
公開日: 2026-09-30
</div>

---

# TL;DR

- <strong>Monetization Gateway</strong> がクローズドベータで利用可能に（米国の適格な売り手・買い手が対象）
- Web サイト・API・MCP ツール・データセットへのアクセスを、数クリックでエージェントに課金できる
- 課金は <strong>HTTP 402 Payment Required</strong> をリクエストの途中で返す形。チェックアウトへのリダイレクトも別の決済 API も不要
- 決済は Coinbase の x402 Facilitator で検証・精算し、<strong>Base</strong> 上の <strong>USDC</strong> で行う
- 本番事例は 4 つ: AI Gateway / Ceramic.ai / Stocktwits / API2PDF

---

# アジェンダ

1. 背景: エージェントと決済手段のずれ
2. Monetization Gateway の仕組み（402 の流れ）
3. 売り手向けの機能と決済の基盤
4. 事例 1: AI Gateway（推論に払う）とコード例
5. 事例 2〜3: Ceramic.ai・Stocktwits
6. 事例 4: API2PDF とコード例
7. ユースケース・まとめ

---

# 背景: エージェントと決済手段のずれ

<div class="grid grid-cols-2 gap-6">
<div class="p-4 border rounded">

<strong>今の売り方</strong>

- サブスクリプション・前払いクレジット
- 買い手は最初にまとまった額を払う
- 予算に収まる少数の契約に絞られる

</div>
<div class="p-4 border rounded">

<strong>エージェントの動き方</strong>

- 「結果」を求めて、新しいサイトを訪れ、MCP ツールを呼び、データを取り込む
- 払いの単位は、リクエスト・検索クエリ・トークン
- 必要なのは、安く・速く・信頼でき・人手をほぼ介さない決済

</div>
</div>

<div class="pt-4 text-sm">

従来の決済手段は、高レイテンシの許容・大きな金額・売り手に素性が知られていることを前提にしている。

</div>

---

# 決済の土台: ステーブルコイン

- 記事は、今の時点ではステーブルコインとその基盤のブロックチェーンが上記の要件を満たせると述べる
- 将来は、既存ネットワークの対応や新しい決済ネットワークの登場もありうる
- Monetization Gateway は、売り手は製品に集中し、買い手は予測しやすい購入体験を得られるようにするためのもの
- 現在の決済: <strong>Base</strong> ブロックチェーン上の <strong>USDC</strong>（米ドル連動）

---

# Monetization Gateway とは

- Cloudflare のネットワークの背後にある任意のリソースに、<strong>使用ごとの価格</strong>を付ける
- 「リクエストそのものが使用になる」API・ツール・データ向け
- 高価値コンテンツ（1 回クロールされ 1,000 回使われうる）は <strong>Pay Per Use</strong> の領域
- 最も単純な形は「<strong>エージェント向けのペイウォール</strong>」
- 売り手が、どのリクエストに課金するか・いくらか・支払いの送り先を定義

<div class="pt-2 text-sm">

▶ <a href="../pay-per-use/" target="_blank">Pay Per Use の解説スライド</a>

</div>

---

# HTTP 402 の流れ

<div class="flex justify-center">
<img src="https://blog.cloudflare.com/_emdash/api/media/file/01M3QKBNG70D3G5H51X2D2D2WV.png" style="max-height: 400px" />
</div>

<div class="absolute bottom-3 text-xs opacity-50">出典: Cloudflare Blog https://blog.cloudflare.com/monetization-gateway-beta/</div>

---

# 図の読み方

<div class="text-left">

1. 買い手が <code>GET /url</code> → Gateway が <code>HTTP 402: Payment Required</code>
2. 買い手が支払いペイロードに署名し、<code>PAYMENT-SIGNATURE</code> ヘッダー付きで再送
3. Gateway が<strong>支払いを検証</strong>し、売り手に <code>PAYMENT-CONTEXT</code> 付きで転送
4. 売り手が支払いコンテキストを検証し、<code>200 OK</code> を返す
5. Gateway が<strong>取引を確定</strong>し、買い手に <code>200 OK</code> を返す

</div>

<div class="pt-4 text-sm">

リソースが返る前に支払いの検証が済み、確定は売り手の応答の後。リダイレクトも別 API もない。

</div>

---

# 売り手向けの機能

<div class="grid grid-cols-2 gap-6">
<div class="p-4 border rounded">

<strong>売り手が書くもの</strong>

- URL・ヘッダー・クエリパラメータなどに一致する価格ルール
- 複数の課金方式から選択（固定・可変・オリジン管理など）
- 課金対象の相手の指定

</div>
<div class="p-4 border rounded">

<strong>Cloudflare が引き受けるもの</strong>

- 支払いの検証と精算（Coinbase の x402 Facilitator 経由）
- 失敗と再試行
- 分析
- x402 プロトコルの変更への追従

</div>
</div>

<div class="pt-4 text-sm">

今後の予定: エージェントから発見されやすくする・全取引のログ・他の決済手段・ID のプリミティブ

</div>

---

# 事例 1: AI Gateway（推論に払う）

- 1 つの API キーで何百ものモデルを使えるコントロールプレーンかつモデルのマーケットプレイス
- これまではクレジット購入。エージェントがウォレットを持つ時代には、残高の維持が摩擦に
- 米国の顧客は、選ばれたモデルに <code>PAYMENT-METHOD: x402</code> ヘッダーで、リクエスト時に払える
- <strong>オリジン管理の価格</strong>: Gateway が売り手（AI Gateway）に価格を直接問い合わせる。既存の価格モジュールをそのまま使える
- 今後、他のインフラ製品にも HTTP 402 が組み込まれていく

---

# AI Gateway の流れ

<div class="flex justify-center">
<img src="https://blog.cloudflare.com/_emdash/api/media/file/01M3QKBQRZ3BXBS0C4Z04GFXS6.png" style="max-height: 400px" />
</div>

<div class="absolute bottom-3 text-xs opacity-50">出典: Cloudflare Blog https://blog.cloudflare.com/monetization-gateway-beta/</div>

---

# AI Gateway の図の読み方

- 最初の <code>POST /ai/run</code> に対し、AI Gateway が<strong>最大トークンコストを見積もって</strong> 402 を返す
- 買い手が署名して再送 → Monetization Gateway が検証 → AI Gateway に <code>PAYMENT-CONTEXT</code> 付きで転送
- AI Gateway がモデルプロバイダーで推論を実行し、<strong>実際のコスト</strong>を受け取る
- 応答に <code>PAYMENT-SETTLEMENT</code> ヘッダー（実際のコストを載せる）を付け、Gateway が取引を確定して買い手に返す

<div class="pt-4 text-sm">

見積もりは最大、確定は実コスト。本文に明記はないが、図に両方が出ている。

</div>

---

# コード例 1: x402 で推論に払う

<div class="text-[10px]">

```bash {all|2|3|4-11}
curl -iX POST "https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/ai/run" \
  --header "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  --header "Payment-Method: x402" \
  --header "Content-Type: application/json" \
  --data '{
    "model": "z-ai/glm-4.7-flash",
    "input": {
      "max_tokens": 9001,
      "messages": [
        { "role": "user", "content": "What is Cloudflare?" }
      ]
    }
  }'
```

</div>

<div class="text-sm">

- <code>ai/run</code> への POST。2 行目の API トークンで認証。3 行目の <code>Payment-Method: x402</code> が、残高ではなくリクエスト時の x402 決済を選ぶ指定
- <code>max_tokens</code> は 9001。図の「最大トークンコストの見積もり」に対応すると読める（記事に明記はない）。原文は <code>messages</code> の要素を複数行で書いている（ここでは 1 行に整形）

</div>

---

# 事例 2: Ceramic.ai（ウェブ検索に払う）

- エージェント向けのウェブ検索 API。<strong>400 億ページ以上</strong>の独自インデックス、最速 <strong>50 ミリ秒</strong>
- 検索は最も伸縮しやすい購入: 簡単な質問は 1 クエリ、複雑な調査は数百クエリ
- エージェントが自分で払えれば、あらかじめ決められた予算に合わせてクエリを抑えずに済む
- <strong>固定価格</strong>の課金方式で、API キーなしで検索を実行できる
- デモと Ceramic.ai のドキュメントが案内されている

---

# 事例 3: Stocktwits（株式シグナルに払う）

<div class="grid grid-cols-2 gap-6">
<div class="p-4 border rounded">

<strong>提供するシグナル</strong>

- Sentiment（強気・弱気）
- Message volume（会話量）
- Followers（フォロワー数）
- Trending（注目が集まる銘柄）

</div>
<div class="p-4 border rounded">

<strong>Monetization Gateway の使い方</strong>

- 2008 年開始、1,000 万人以上が利用
- エージェント向けの別の経路を作り、その前に Gateway を置く
- 既存の API・企業向けデータ製品は変更なし
- 各リクエストを個別に価格付け

</div>
</div>

---

# 事例 4: API2PDF（API アクセスに払う）

<div class="grid grid-cols-2 gap-6">
<div class="p-4 border rounded">

<strong>以前</strong>

- アカウント作成と API キーが必要
- 最初の月の後にクレジットカードが必要
- そこでコンバージョンが <strong>50% 超</strong>下がった

</div>
<div class="p-4 border rounded">

<strong>今</strong>

- API キーなしのリクエストに <strong>402</strong> を返す
- <strong>可変価格</strong>: 1 リクエストの最大価格を伝える
- 支払い後に処理し、<strong>実際の消費分だけ</strong>を精算

</div>
</div>

<div class="pt-4 text-sm">

エージェントにも「自分で作るか、専用 API に 1 セント未満を払うか」の作るか買うかの判断がある。

</div>

---

# コード例 2: API キーなしで 402 を受け取る

<div class="text-xs">

```bash {all|1-3|5|7}
$ curl -iX POST https://v2.api2pdf.com/chrome/pdf/html \
  --header "Content-Type: application/json" \
  --data '{"html":"<p>Hello from an AI agent</p>"}'

HTTP/2 402
content-type: application/json
payment-required: eyJ4NDAy...
```

</div>

- 1〜3 行目: API キーなしで PDF 生成を依頼（原文は 1 行。読みやすさのため改行を加えた）
- 5 行目: <code>HTTP/2 402</code>。支払いが必要
- 7 行目: <code>payment-required</code> ヘッダーに支払い指示が入る（値は原文でも <code>eyJ4NDAy...</code> と省略。内容の説明は記事にない）
- 買い手は署名して <code>PAYMENT-SIGNATURE</code> 付きで再送する（流れの図のとおり）

---

# ユースケース

<div class="grid grid-cols-2 gap-4 text-sm">
<div class="p-3 border rounded">

<strong>推論（AI Gateway）</strong>

クレジットの事前購入なしに、リクエスト時の x402 で推論を買う

</div>
<div class="p-3 border rounded">

<strong>検索（Ceramic.ai）</strong>

クエリ数が読めないエージェントが、API キーなしで、必要なだけ検索する

</div>
<div class="p-3 border rounded">

<strong>市場データ（Stocktwits）</strong>

データライセンスなしに、エージェントが必要なシグナルを必要なときに 1 リクエストずつ買う

</div>
<div class="p-3 border rounded">

<strong>従量課金 API（API2PDF）</strong>

アカウントとカード登録の壁なしに、可変価格で実消費だけを払う

</div>
</div>

---

# まとめ・所感

- リクエストがそのまま使用になる API・ツール・データは <strong>Monetization Gateway</strong>、高価値コンテンツの使用への課金は <strong>Pay Per Use</strong>
- 現時点の決済経路は Base 上の USDC。他の決済手段・ログ・ID は今後の予定
- 価格は、固定（Ceramic.ai）・可変（API2PDF）・オリジン管理（AI Gateway）の 3 種類が事例に出る。詳細仕様は本文にない
- 米国の適格な売り手・買い手向けのクローズドベータで、再現できる一般利用可能な Workers の機能ではないため、サンプルは対象外
- 関連: <a href="../wallets/" target="_blank">▶ Wallets</a> / <a href="../agentic-web/" target="_blank">▶ 総論</a>

---

<div class="text-center">

# 参考リンク

</div>

- 原文: [Monetization Gateway beta: charge AI agents for consumption with HTTP 402](https://blog.cloudflare.com/monetization-gateway-beta/)（日本語版なし）
- 関連解説スライド: [Pay Per Use](../pay-per-use/) / [総論（第二の読者）](../agentic-web/) / [Wallets](../wallets/) / [エージェンティックインターネット](../the-agentic-internet/)
- [Monetization Gateway の開発者ドキュメント](https://developers.cloudflare.com/monetization-gateway)
- [AI Gateway のマシンペイメント](https://developers.cloudflare.com/ai-gateway/features/machine-payments/)
- [Coinbase の x402 Facilitator](https://docs.cdp.coinbase.com/x402/seller/facilitator)
- [Monetization Gateway の最初の発表](https://blog.cloudflare.com/monetization-gateway/)

<div class="pt-8 text-sm opacity-50">
Wiki: docs/articles/2026-09-30-monetization-gateway-beta.md
</div>
