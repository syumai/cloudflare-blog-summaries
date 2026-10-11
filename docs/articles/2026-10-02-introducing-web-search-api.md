# AI Gateway 経由の Web Search API の紹介: エージェントに最新の Web 情報を、行儀の良いクローラーから

- 原文: [https://blog.cloudflare.com/introducing-web-search-api/](https://blog.cloudflare.com/introducing-web-search-api/)（原題: Introducing Web Search API via AI Gateway）
- 日本語版の出どころ: Cloudflare公式の日本語版（`https://blog.cloudflare.com/ja-jp/introducing-web-search-api/`）は確認時点で存在しなかった（404）ため、英語版（en-us）から日本語化して要約している。タイトルも筆者による訳。公開日は英語原文の datePublished（2026-10-02T13:28:10Z）に従う。
- 公開日: 2026-10-02
- 著者: Michelle Chen、Sam Else、Gabriel Massadas
- 位置づけ: Birthday Week 2026 の記事（読了目安は原文表記で 5 分）。パートナーの検索プロバイダー（Ceramic.ai、Exa、Linkup）を、AI Gateway・REST API・Workers バインディングから使えるようにする Web Search API の発表
- 関連: [Workers AIとAI Gatewayを単一のAIコントロールプレーンへ統合](./2026-08-07-workers-ai-gateway-unification.md)（`env.AI` と `gateway: { id: "default" }` の土台。本記事の `env.AI.websearch()` はこの統合の上に載る）/ [AI Gateway の Auto Router で AI 支出を削減する](./2026-09-30-auto-router.md)（同じ AI Gateway の制御面の機能）/ [ID情報に基づく分析で、不正なAIの利用を検出](./2026-08-05-identity-aware-ai-gateway.md)（AI Gateway の可観測性・アクセス制御）/ [インターネットには「第二の読者」がいる](./2026-09-30-agentic-web.md)（クローラーの透明性・制御を整える流れの総論）/ [Cloudflare AI Search: エージェントにあなたのデータのための検索エンジンを](./2026-08-06-ai-search-easier.md) / [AI Search が一般提供（GA）に](./2026-10-01-ai-search-ga.md)（自分のデータを検索させる側。本記事は Web 全体を検索させる側）/ [Kitesurfのご紹介](./2026-08-06-kitesurf.md) / [エージェント向けブラウザへの道: Kitesurf アップデート](./2026-09-28-kitesurf-update.md)（検索結果の先のページを開いて読む側）/ [あらゆるWebサイトにWebMCPインターフェースを付与する](./2026-08-06-webmcp.md)
- GitHub: [docs/articles/2026-10-02-introducing-web-search-api.md](https://github.com/syumai/cloudflare-blog-summaries/blob/main/docs/articles/2026-10-02-introducing-web-search-api.md)

![記事ヘッダー画像](https://blog.cloudflare.com/_emdash/api/media/file/01M3XMA3KN5CDQCSF0YHZ0WFBH.01M3XMA452ZT41JBXKRPY1HH3F.png)
*図: 記事ヘッダー画像。ブラウザ風ウィンドウの手前に大きな虫眼鏡があり、周囲を 2 本の矢印が回っている装飾イラスト（出典: Cloudflare Blog https://blog.cloudflare.com/introducing-web-search-api/。原文にキャプションはなく、説明は見た目からの筆者の記述。装飾のため、図としては扱わない）*

## TL;DR

- **Web Search API** が AI Gateway 経由で使えるようになった。エージェントが URL を推測して curl するのではなく、検索エンジンのクエリから始めて、最新の情報でレスポンスの根拠づけ（grounding）ができる。最初のパートナーは **Ceramic.ai、Exa、Linkup**。
- パートナーは、Cloudflare のボットクローリング基準を満たすことに合意している。クローラーは Cloudflare の「Verified bots」の要件に従い、検索レスポンスにはクロールしたコンテンツの場所へのリンクを含める。
- 利用方法は 3 つ。AI Gateway（ログ・課金・アクセス制御付き）、**直接 REST API**（`/ai/websearch/`）、**Workers バインディング**（`env.AI.websearch()`）。
- 課金は AI Gateway のクレジットから引き落とされる。パートナーの定価 API 料金に上乗せなしで提供し、BYOK（持ち込みキー）にも対応する。ZDR（Zero Data Retention）対応のパートナーは識別される。
- 今後、AI Gateway に組み込みの **Server Tools** を提供する予定で、Web 検索はその最初のツールの一つになる。

## 背景・課題

記事は、エージェントがライブの Web ページを取得したいときに、ページの URL を推測して curl のツール呼び出しをする場合が多い、という点から始める。URL を外すと 404 になり、効率がよくない。

人間が検索エンジンのクエリから情報探しを始めるように、エージェントにも「インターネットを閲覧する」方法を持たせる、というのが Web 検索の位置づけである。

もう一つの課題はモデルの知識の鮮度である。モデルは学習後に時点を固定され、知識のカットオフ日より後の出来事、変更された API、動きの速いニュースには弱い。Web Search API を推論パイプラインに組み込むと、新鮮で構造化されたスニペットがコンテキストに直接入り、モデルがライブの情報にアクセスできる。記事の例では、Cloudflare の開発者ツールで開発しているエージェントが、Birthday Week で出る新製品・新機能を見落とさずに済む。

さらに記事は、検索がクロールに依存する以上、クローラーの振る舞い（正直さ、透明性、ボットルールの尊重）が重要だという立場をとる。

## 発表内容 / アーキテクチャ

### 業界標準を引き上げる: パートナーに課す基準

Cloudflare は、クローラーは正直で透明で、すべてのボットのルールや好みを尊重すべきであり、サイト運営者はコンテンツの使われ方について意味のある透明性と制御を持つべきだ、という立場を示す。今回のパートナーは、Cloudflare のボットクローリング基準を満たすことをコミットした。

| 基準 | 内容 |
|---|---|
| クローラーの要件 | 検索プロバイダーが使うクローラーは、Cloudflare の開発者ドキュメントで定義する「Verified bots」の公開要件に従う |
| 出典の明示 | 検索レスポンスには、クロールしたコンテンツの場所へのリンクを含める |

記事は、これらの規則が公正なインターネットに資し、クリエイターが自分のデータをどうするかを決められるようにする、と述べる。Cloudflare 上で Web 検索を使うことは、クローラーの識別、robots.txt の尊重、検索結果の出どころの提示にコミットした運営者から検索知識を得る選択だ、という整理である。

### AI Gateway 経由で使う

AI Gateway は新しい Web Search API 製品の主要な統合ポイントで、アプリケーションの制御面として、可観測性・統合課金・セキュリティ・アクセス制御を持つ。Web 検索もそこに載せる、というのが記事の説明である。

| できること | 内容 |
|---|---|
| 課金 | AI Gateway のクレジットで Web 検索を利用する |
| ログ | Web 検索の呼び出しのログとリクエストデータを収集する。通常の AI Gateway の可観測性ログに表示される |
| アクセス制御 | 誰がどの検索プロバイダーを使えるかを制御する |
| ZDR | Zero Data Retention に対応するパートナーを識別する。データが保持されないことが分かる |
| 価格 | パートナーの定価 API 料金のまま、上乗せなしで直接提供する |
| BYOK | モデル推論プロバイダーと同様に、検索プロバイダーでも Bring-Your-Own-Key に対応する |

![AI Gateway のログ詳細画面](https://blog.cloudflare.com/_emdash/api/media/file/01M3XM9HE47XBWP8CA3AT4B233.png)
*図: AI Gateway のログ詳細画面。一覧の行は 2026-09-28 22:32:25 UTC、成功、モデル `exa/search`、コスト `$0.00700000`、所要時間 3,451 ms で、入出力トークンは「—」。下のパネルの Request は `query`（"What are some fun things to do in Salt Lake City as fall approaches?"）、`limit: 5`、`provider: "exa"`。Response は HTTP 200 で `truncated: true`、`original_bytes: 17608`（ログ上の本文は切り詰められている）。下部の表示は Endpoint が `/websearch`、Billing が `Unified Billing`、Model Type が `websearch`（出典: Cloudflare Blog https://blog.cloudflare.com/introducing-web-search-api/。原文にキャプションはなく、説明は画像の見た目と画像内の文字からの筆者の記述）*

### 直接 REST API

既存のバックエンド、モバイルアプリ、外部サービスから HTTP で呼ぶ場合は、標準の REST エンドポイントで検索できる。AI Gateway の認証トークンを渡し、ペイロードで検索プロバイダーを指定すると、検索結果が返る。

### Workers バインディング

Cloudflare Workers で直接開発する場合は、1 行で組み込める。エージェント向けの Web 検索に使える、単体の Worker バインディング `env.AI.websearch()` が用意されている。`gatewayId`・`query`・`provider`・`limit` を渡す。

### Coming soon: Server Tools

AI Gateway に、ネイティブの **Server Tools** を組み込んでいる最中である。ツールを自分で定義する必要がなくなり、制御面に最初から組み込まれる。ハーネスのオーケストレーションではなく開発に時間を使える、というのが狙いで、Web 検索は最初に組み込むツールの一つになる。

今すぐ自分で Web 検索をサーバーツールとして組み立てたい場合のために、記事は Worker のコードを載せている（次節）。

## コード例

記事には 3 つのコード例がある。以下は原文のとおり。

### 直接 REST API（curl）

```bash
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

エンドポイントは `POST /client/v4/accounts/{account_id}/ai/websearch/`。`provider` に検索プロバイダー（この例では `ceramic`）を、`limit` に件数を、`options.gateway.id` に AI Gateway の ID を指定する。

### Workers バインディング

```ts
const response = await env.AI.websearch({
  gatewayId: "default",
  query: "What are some fun things to do in Salt Lake City as fall approaches?",
  provider: "exa",
  limit: 5,
})

const results = await response.json()
```

`env.AI.websearch()` は `Response` を返し、`response.json()` で検索結果を取り出す。

### Web 検索をサーバーツールとして自分で組み立てる

```ts
const completion = await env.AI.run(
  "@cf/google/gemma-4-26b-a4b-it",
  {
    messages: [{ role: "user", content: "What happened in the last Cloudflare Birthday Week in 2025?" }],
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
    }],
  },
  { gateway: { id: "default" } },
)

const toolCall = completion.tool_calls?.[0]

if (toolCall?.name === "web_search") {
  const response = await env.AI.websearch({
    gatewayId: "default",
    query: toolCall.arguments.query,
    limit: 5,
  })

  const searchResults = await response.json()
  const finalResponse = await env.AI.run(
    model,
    {
      messages: [
        { role: "user", content: prompt },
        {
          role: "tool",
          name: "web_search",
          content: JSON.stringify(searchResults),
        },
      ],
    },
    { gateway: { id: "default" } },
  )
}
```

流れは次のとおり。

1. `env.AI.run()` に `web_search` 関数ツールの定義を渡し、モデルに呼ぶかどうかを判断させる。
2. モデルが `web_search` を呼んだら、`tool_calls` の引数の `query` で `env.AI.websearch()` を実行する。
3. 検索結果を `role: "tool"` のメッセージとして `JSON.stringify` して渡し、`env.AI.run()` をもう一度呼んで最終回答を得る。

なお、原文のコードは抜粋で、最後の `env.AI.run()` が参照する `model` と `prompt` は定義されていない（1 回目の呼び出しのモデル名とユーザーのメッセージに当たると読める）。また 2 回目の呼び出しの `messages` には、1 回目のモデルのツール呼び出しのメッセージは含まれていない。そのまま動かすには補う必要がある。

## ユースケース

- **最新情報で根拠づけたエージェント**: カットオフ後に変わった API や新機能、ニュースを検索で取り込み、回答の根拠にする。
- **開発支援エージェント**: Cloudflare の開発者ツールの新機能やドキュメントなど、変化の速い情報を取得して、実装を進める。
- **組織内の統制付きの検索利用**: AI Gateway のログで検索クエリを追い、誰がどのプロバイダーを使えるかを制御し、クレジットで一元的に課金する。
- **既存システムからの利用**: バックエンドやモバイルアプリから REST で検索する。
- **Server Tools の先取り**: `web_search` をツールとして定義し、今のうちからモデルの判断で検索させる。

## 所感・ポイント

- 記事の中心は「検索 API を足した」ことより、検索プロバイダーに Verified bots 相当の要件と出典リンクを課した点にある。サイト運営者側の制御（[インターネットには「第二の読者」がいる](./2026-09-30-agentic-web.md)）と、エージェント利用側の選択肢を、同じ基準でつなぐ位置づけと読める。
- `env.AI.websearch()` は、`env.AI.run()` と同じ `gatewayId`（`default`）の考え方を使う。[Workers AIとAI Gatewayの統合](./2026-08-07-workers-ai-gateway-unification.md)で、ゲートウェイを事前に作らなくてもログが取れるようになったことの延長にある。
- ログ画面の例では、`exa/search` 1 回で `$0.007`、3.45 秒だった（この画面での 1 件の例で、一般的な料金・遅延ではない）。
- 記事は、各プロバイダーの料金表、ベータ・GA の区分、`provider` に指定できる値の一覧、レート制限を載せていない。詳細は記事が案内する[開発者ドキュメント](https://developers.cloudflare.com/web-search)を確認する必要がある。コード例の `provider` の値は `ceramic` と `exa` が確認できる（`linkup` の指定値は記事に例がない）。
- 画像キャプションは原文にないため、すべて画像の見た目と画像内の文字からの筆者による記述である。
- **サンプル**: [examples/introducing-web-search-api/](../../examples/introducing-web-search-api/)。`env.AI.websearch()` による `GET /search` と、記事のサーバーツールの流れに沿った `POST /ask` を持つ最小 Worker。`wrangler 4.149.0` で `wrangler deploy --dry-run` と型チェックが通ることを確認した。実際の検索呼び出しには AI Gateway のクレジットまたはプロバイダーキーが必要なため、実呼び出しは行っていない。`env.AI.websearch` は記事のコード例に従っており、型定義に含まれない場合に備えて最小限の型を自前で宣言している。

## 関連リンク

- 原文: https://blog.cloudflare.com/introducing-web-search-api/
- Web Search 開発者ドキュメント: https://developers.cloudflare.com/web-search
- Verified bots の定義: https://developers.cloudflare.com/bots/concepts/bot/verified-bots/
- Birthday Week 2026: https://www.cloudflare.com/birthday-week/
- AI Playground: https://playground.ai.cloudflare.com/
- Workers サンプル: [examples/introducing-web-search-api/](../../examples/introducing-web-search-api/)
- [Workers AIとAI Gatewayを単一のAIコントロールプレーンへ統合（本リポジトリのWiki）](./2026-08-07-workers-ai-gateway-unification.md)
- [AI Gateway の Auto Router で AI 支出を削減する（本リポジトリのWiki）](./2026-09-30-auto-router.md)
- [ID情報に基づく分析で、不正なAIの利用を検出（本リポジトリのWiki）](./2026-08-05-identity-aware-ai-gateway.md)
- [インターネットには「第二の読者」がいる（本リポジトリのWiki）](./2026-09-30-agentic-web.md)
- [Cloudflare AI Search: エージェントにあなたのデータのための検索エンジンを（本リポジトリのWiki）](./2026-08-06-ai-search-easier.md)
- [AI Search が一般提供（GA）に（本リポジトリのWiki）](./2026-10-01-ai-search-ga.md)
- [Kitesurfのご紹介（本リポジトリのWiki）](./2026-08-06-kitesurf.md) / [Kitesurf アップデート（本リポジトリのWiki）](./2026-09-28-kitesurf-update.md)
- [あらゆるWebサイトにWebMCPインターフェースを付与する（本リポジトリのWiki）](./2026-08-06-webmcp.md)
