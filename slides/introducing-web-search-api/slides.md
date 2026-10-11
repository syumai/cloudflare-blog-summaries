---
routerMode: hash
theme: default
title: "AI Gateway 経由の Web Search API の紹介"
info: |
  Introducing Web Search API via AI Gateway の解説スライド。
  原文: https://blog.cloudflare.com/introducing-web-search-api/
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

# AI Gateway 経由の Web Search API の紹介

エージェントに最新の Web 情報を、行儀の良いクローラーから

Birthday Week 2026 / AI Gateway / Web Search

<div class="pt-4 text-sm opacity-70">
原文: https://blog.cloudflare.com/introducing-web-search-api/<br>
公開日: 2026-10-02
</div>

---

# TL;DR

- <strong>Web Search API</strong> が AI Gateway 経由で利用可能に。最初のパートナーは <strong>Ceramic.ai・Exa・Linkup</strong>
- エージェントが URL を推測して 404 になるのではなく、<strong>検索から始めて最新情報で根拠づけ</strong>できる
- パートナーは Cloudflare の <strong>Verified bots 要件</strong>に従い、<strong>出典リンク</strong>を返すことにコミット
- 使い方は 3 通り: AI Gateway、直接 <strong>REST API</strong>、Workers の <code>env.AI.websearch()</code>
- 課金は AI Gateway のクレジット。パートナーの定価に上乗せなし、BYOK も可。<strong>Server Tools</strong> は開発中

---

# アジェンダ

- 背景: URL を推測するエージェントと、止まった知識
- パートナーに課す基準（Verified bots・出典リンク）
- AI Gateway で使う: ログ・課金・アクセス制御
- REST API と Workers バインディング
- サーバーツールとして組み立てる、Server Tools の予告
- ユースケース、まとめ

---

# 背景: URL を推測して curl するエージェント

<div class="text-left text-sm pt-2">

- ライブのページを取りたいとき、エージェントは URL を<strong>推測</strong>して curl のツール呼び出しをしがち
- 推測が外れると <strong>404 Not Found</strong>。ランダムに URL を当てるのは非効率
- 人間は検索エンジンのクエリから探し始める。エージェントにも同じ入口を

<div class="mt-6 p-4 border rounded">

モデルの知識は学習時点で止まっている。カットオフ後の出来事・変わった API・速いニュースには弱い。

</div>

- Web Search API で、新鮮で構造化されたスニペットを推論のコンテキストに直接入れる

</div>

---

# パートナーに課す基準

<div class="text-left text-sm pt-2">

| 基準 | 内容 |
|---|---|
| クローラーの要件 | Cloudflare が定める「Verified bots」の公開要件に従う |
| 出典の明示 | 検索レスポンスに、クロールしたコンテンツの場所へのリンクを含める |

- 狙い: クローラーは正直・透明で、ボットのルールや好みを尊重すべき
- サイト運営者が、コンテンツの使われ方を決められるように
- 利用者は、クローラーを識別し、robots.txt を尊重し、出どころを示す運営者から検索知識を得る

</div>

---

# AI Gateway で使う

<div class="text-left text-sm pt-2">

| できること | 内容 |
|---|---|
| 課金 | AI Gateway のクレジットで Web 検索を利用 |
| ログ | 通常の AI Gateway の可観測性ログに検索呼び出しが表示される |
| アクセス制御 | 誰がどの検索プロバイダーを使えるかを制御 |
| ZDR | Zero Data Retention 対応のパートナーを識別 |
| 価格 | パートナーの定価 API 料金のまま、上乗せなし |
| BYOK | 検索プロバイダーでも持ち込みキーに対応 |

</div>

---

# ログ詳細画面の例

<div class="text-center">
<img src="https://blog.cloudflare.com/_emdash/api/media/file/01M3XM9HE47XBWP8CA3AT4B233.png" style="max-height: 320px; margin: 0 auto;" />
</div>

<div class="text-left text-sm pt-2">

- モデル <code>exa/search</code>、コスト <code>$0.00700000</code>、3,451 ms、Endpoint <code>/websearch</code>、<code>Unified Billing</code>
- Request は <code>query</code>・<code>limit: 5</code>・<code>provider: "exa"</code>。Response は HTTP 200 で本文は切り詰め表示（<code>original_bytes: 17608</code>）

</div>

<div class="text-xs opacity-60 pt-1">出典: Cloudflare Blog https://blog.cloudflare.com/introducing-web-search-api/（キャプションは原文になく、画像内の文字からの記述）</div>

---

# コード例 1: 直接 REST API

```bash {all|1|3-4|6-12}
curl https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/ai/websearch/ \
  --request POST \
  --header "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  --header "Content-Type: application/json" \
  --data '{
    "query": "What are some fun things to do in Salt Lake City as fall approaches?",
    "provider": "ceramic",
    "limit": 5,
    "options": {
      "gateway": { "id": "default" }
    }
  }'
```

<div class="text-sm pt-2">

- <code>POST .../ai/websearch/</code> に、API トークン・<code>query</code>・<code>provider</code>・<code>limit</code> を渡す
- <code>options.gateway.id</code> で AI Gateway を指定（ログ・課金の対象になる）

</div>

---

# コード例 2: Workers バインディング

```ts {all|1-6|8}
const response = await env.AI.websearch({
  gatewayId: "default",
  query: "What are some fun things to do in Salt Lake City as fall approaches?",
  provider: "exa",
  limit: 5,
})

const results = await response.json()
```

<div class="text-sm pt-2">

- 単体の Worker バインディング <code>env.AI.websearch()</code>。<code>gatewayId</code>・<code>query</code>・<code>provider</code>・<code>limit</code> を渡す
- 戻り値は <code>Response</code>。<code>response.json()</code> で結果を取り出す
- REST の <code>options.gateway.id</code> は、ここでは <code>gatewayId</code>

</div>

---

# コード例 3: サーバーツールの全体像

<div class="text-left text-sm pt-2">

Server Tools が入るまでは、<code>web_search</code> を関数ツールとして自分で定義して組み立てる。

1. <code>env.AI.run()</code> に <code>web_search</code> のツール定義を渡す
2. モデルが <code>web_search</code> を呼んだら、引数の <code>query</code> で <code>env.AI.websearch()</code> を実行
3. 結果を <code>role: "tool"</code> のメッセージで渡し、<code>env.AI.run()</code> を再度呼んで最終回答を得る

- 次の 2 枚で、前半（ツール定義と 1 回目の呼び出し）と後半（検索と 2 回目の呼び出し）に分けて示す
- 使うモデルは <code>@cf/google/gemma-4-26b-a4b-it</code>、ゲートウェイ ID は <code>default</code>

</div>

---

# 前半: ツール定義と 1 回目の呼び出し

```ts {all|2-3|4-14|16|18}
const completion = await env.AI.run(
  "@cf/google/gemma-4-26b-a4b-it",
  { messages: [{ role: "user", content: "What happened in the last Cloudflare Birthday Week in 2025?" }],
    tools: [{
      type: "function",
      function: {
        name: "web_search",
        description: "Search the web for current information.",
        parameters: {
          type: "object",
          properties: { query: { type: "string" } },
          required: ["query"],
        },
      },
    }] },
  { gateway: { id: "default" } },
)

const toolCall = completion.tool_calls?.[0]
```

<div class="text-sm">モデルは <code>web_search</code> を呼ぶかを自分で判断する。結果は <code>tool_calls</code> に入る。</div>

---

# 後半: 検索して結果をモデルへ返す

```ts {all|1|2-6|8|9-21}
if (toolCall?.name === "web_search") {
  const response = await env.AI.websearch({
    gatewayId: "default",
    query: toolCall.arguments.query,
    limit: 5,
  })

  const searchResults = await response.json()
  const finalResponse = await env.AI.run(
    model,
    { messages: [
        { role: "user", content: prompt },
        { role: "tool", name: "web_search",
          content: JSON.stringify(searchResults) },
      ] },
    { gateway: { id: "default" } },
  )
}
```

<div class="text-sm">

- <code>toolCall.arguments.query</code> が、モデルが決めた検索クエリ
- 原文は抜粋で、<code>model</code>・<code>prompt</code> は未定義。1 回目のツール呼び出しのメッセージも含まれていない

</div>

---

# Coming soon: Server Tools

<div class="text-left text-sm pt-2">

- AI Gateway に、ネイティブな <strong>Server Tools</strong> を組み込み中
- ツールを自分で定義しなくてよくなり、制御面に最初から入っている
- ハーネスのオーケストレーションではなく、開発に時間を使える
- Web 検索は、組み込む最初のツールの一つ

<div class="mt-6 p-4 border rounded">

今すぐ試したい場合は、前の 2 枚のように自分で <code>web_search</code> ツールを組み立てる。

</div>

</div>

---

# ユースケース 1: 最新情報で根拠づけたエージェント

<div class="text-left text-sm pt-2">

- カットオフ後に変わった API・新機能・ニュースを検索して回答の根拠にする
- 例: Birthday Week で出た新製品を、開発エージェントが見落とさずに取得する
- 検索結果の出典リンクにより、回答の根拠を辿れる

</div>

---

# ユースケース 2: 統制された検索利用

<div class="text-left text-sm pt-2">

- 検索の呼び出しが AI Gateway のログに残り、クエリとコストを追える
- 誰がどのプロバイダーを使えるかを制御できる
- クレジットで、モデル推論と Web 検索を一元的に課金できる
- ZDR 対応のパートナーを識別して選べる

</div>

---

# ユースケース 3: 既存システムから REST で

<div class="text-left text-sm pt-2">

- 既存のバックエンド、モバイルアプリ、外部サービスから HTTP で検索
- AI Gateway の認証トークンとプロバイダー指定だけで、検索結果が返る
- Workers を使わないスタックでも、同じログ・課金の仕組みに載せられる

</div>

---

# まとめ・所感

<div class="text-left text-sm pt-2">

- 検索 API を足しただけでなく、<strong>プロバイダーに Verified bots 要件と出典リンクを課した</strong>点が中心
- <code>env.AI.websearch()</code> は <code>env.AI.run()</code> と同じ <code>gatewayId</code> の考え方で使える
- ログ画面の例は、1 回で <code>$0.007</code>・約 3.45 秒（一例であり、一般的な料金ではない）
- 料金表・提供段階（ベータ/GA）・<code>provider</code> の一覧・レート制限は記事にない。開発者ドキュメントを確認する
- サンプル: <code>examples/introducing-web-search-api/</code>（<code>wrangler deploy --dry-run</code> と型チェックを確認。実呼び出しは AI Gateway のクレジットが必要なため未実施）

</div>

---

# 参考リンク

- 原文: https://blog.cloudflare.com/introducing-web-search-api/
- Web Search 開発者ドキュメント: https://developers.cloudflare.com/web-search
- Verified bots: https://developers.cloudflare.com/bots/concepts/bot/verified-bots/
- AI Playground: https://playground.ai.cloudflare.com/
- AI Gateway の統合: ▶ <a href="../workers-ai-gateway-unification/" target="_blank">解説スライド</a>
- 「第二の読者」: ▶ <a href="../agentic-web/" target="_blank">解説スライド</a>
- AI Search: ▶ <a href="../ai-search-easier/" target="_blank">解説スライド</a> / ▶ <a href="../ai-search-ga/" target="_blank">GA</a>
- Kitesurf: ▶ <a href="../kitesurf/" target="_blank">解説スライド</a> / ▶ <a href="../kitesurf-update/" target="_blank">アップデート</a>
- Workers サンプル: https://github.com/syumai/cloudflare-blog-summaries/tree/main/examples/introducing-web-search-api

<div class="pt-8 text-sm opacity-50">
Wiki: docs/articles/2026-10-02-introducing-web-search-api.md
</div>
