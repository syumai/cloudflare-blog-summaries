# Monetization Gateway ベータ: HTTP 402 で AI エージェントに従量課金する

- 原文: [https://blog.cloudflare.com/monetization-gateway-beta/](https://blog.cloudflare.com/monetization-gateway-beta/)（原題: Monetization Gateway beta: charge AI agents for consumption with HTTP 402）
- 日本語版の出どころ: Cloudflare公式の日本語版（`https://blog.cloudflare.com/ja-jp/monetization-gateway-beta/`）は確認時点で存在しなかった（404）ため、英語版（en-us）から日本語化して要約している。タイトルも筆者による訳。公開日は英語原文の datePublished（2026-09-30T13:00:00Z）に従う。
- 公開日: 2026-09-30
- 著者: Rohin Lohe, Jorge Silva, Caleb Carithers, Isaac Bremseth
- 位置づけ: Birthday Week 2026 の記事。3 か月前に発表された Monetization Gateway の計画が、クローズドベータとして利用可能になった。4 つの本番利用事例を紹介している
- 関連: [Pay Per Use: AI があなたの作品を使うなら、対価を受け取るべき](2026-09-30-pay-per-use.md)（同日の記事。使用に払う「信頼できる買い手のネットワーク」。リクエスト単位で売るのが本記事）/ [インターネットには「第二の読者」がいる](2026-09-30-agentic-web.md)（Birthday Week 2026 の総論。「対価を得る」柱）/ [Cloudflare Walletsを発表](2026-08-04-wallets.md)（エージェント側の支払い手段）/ [読み取り、発見、呼び出し、決済が可能なオープンなエージェンティックインターネットの構築](2026-08-06-the-agentic-internet.md)（「payable」の構想）
- GitHub: [docs/articles/2026-09-30-monetization-gateway-beta.md](https://github.com/syumai/cloudflare-blog-summaries/blob/main/docs/articles/2026-09-30-monetization-gateway-beta.md)

![記事ヘッダー画像](https://blog.cloudflare.com/_emdash/api/media/file/01M3QKS7979PTKRYVR2CN111JZ.01M3QKS7ZDZ74AXKMWXG7F3C2K.png)
*図: 記事ヘッダー画像。開いたドアの両側に、カメラ・本・ペン立て・ロボットなどが並ぶ装飾イラスト（出典: Cloudflare Blog https://blog.cloudflare.com/monetization-gateway-beta/。原文にキャプションはなく、説明は見た目からの筆者の推定。装飾のため、図としては扱わない）*

## TL;DR

- **Monetization Gateway** がクローズドベータで利用可能になった（対象は米国の適格な売り手・買い手。他地域は対応予定）。数クリックで、Web サイト・API・MCP ツール・データセットへのアクセスをエージェントに課金できる。
- 課金は **HTTP 402 Payment Required** をリクエストの途中で返す形で行う。チェックアウトページへのリダイレクトも、別の決済 API も要らない。支払いの検証と精算は Coinbase の x402 Facilitator が担い、**Base** ブロックチェーン上で **USDC**（米ドル連動のステーブルコイン）で決済される。
- 売り手は、URL・ヘッダー・クエリパラメータなどに一致するルールで価格を書き、複数の課金方式から選ぶ。Cloudflare が支払い検証・精算、失敗と再試行、分析、x402 の仕様追従を引き受ける。
- 本番事例は 4 つ。**Cloudflare AI Gateway**（推論に払う）、**Ceramic.ai**（ウェブ検索に払う）、**Stocktwits**（株式シグナルに払う）、**API2PDF**（PDF 生成 API に払う）。
- リクエストごとが「使用」になる API・ツール・データは本製品、高価値コンテンツの「使用」への課金は [Pay Per Use](2026-09-30-pay-per-use.md) という分担になる。

## 背景・課題

記事は、ソフトウェア事業の多くが、サブスクリプションか前払いクレジットで売られていると述べる。買い手は最初にまとまった額を払うため、予算に収まる少数の契約に絞る。インターネットのトラフィックの中心になったエージェントの動き方とは、合わない。

エージェントは「結果」を求めて動く。新しいサイトを訪れ、MCP ツールを呼び、データフィードを取り込む。事業者は、エージェントがより良い結果を出す経路に入りたい。そこで払いの単位を、エージェントの消費の単位（リクエスト、検索クエリ、トークン）に合わせる必要がある。しかし従来の決済手段は、買い手が高レイテンシを許容し、大きな金額しか扱わず、売り手に素性が知られていることを前提にしている。エージェントが求めるのは逆で、安く、速く、信頼でき、人の手をほとんど介さずに拡張できる決済である。記事は、現時点ではステーブルコインとその基盤のブロックチェーンがこの要件を満たせるとし、将来は既存ネットワークの対応や新しいネットワークの登場もありうると書く。

## 発表内容 / アーキテクチャ

### Monetization Gateway の位置づけ

Cloudflare のネットワークの背後にある任意のリソースに、使用ごとの価格を付けられる。「リクエストそのものが使用になる」API・ツール・データ向けに作られている。一方、ページを 1 回クロールして 1,000 回使うようなコンテンツは事情が違い、そちらは [Pay Per Use](2026-09-30-pay-per-use.md) が、使用を報告して払う検証済みの買い手のネットワークを提供する、と書かれている。

### HTTP 402 の流れ

- 決済は、リソースを要求するリクエストと同じ HTTP の流れの中で行う。チェックアウトへのリダイレクトも、呼び出すべき別の決済 API もない。
- 売り手は、どのリクエストに課金するか、いくらか、支払いをどこに送るかを定義する。
- 買い手は支払い指示を受け取り、認可に署名し、決済が済んでからリソースを受け取る。

![Monetization Gateway の基本の流れ（シーケンス図）](https://blog.cloudflare.com/_emdash/api/media/file/01M3QKBNG70D3G5H51X2D2D2WV.png)
*図: 基本の流れ。Buyer (agent) → Cloudflare Monetization Gateway に `GET /url`。Gateway が `HTTP 402: Payment Required` を返す。買い手が Sign payment payload（支払いペイロードに署名）し、`PAYMENT-SIGNATURE: {...}` ヘッダー付きで再度 `GET /url`。Gateway が Verify payment（支払いの検証）を行い、Seller に `PAYMENT-CONTEXT: {...}` ヘッダー付きで `GET /url`。Seller が Validate payment context（支払いコンテキストの検証）をして `HTTP 200 OK` の Response を返す。Gateway が Finalize transaction（取引の確定）をして、買い手に `HTTP 200 OK` の Response を返す（出典: Cloudflare Blog https://blog.cloudflare.com/monetization-gateway-beta/。原文のキャプションは取得した本文から確認できず、説明は図の内容に基づく筆者の整理）*

図の読み方のポイント:

- 買い手は、最初のリクエストで 402 を受け取り、署名した支払いを `PAYMENT-SIGNATURE` ヘッダーに載せて同じリクエストを再送する。
- Gateway は支払いを検証してから、売り手のオリジンに `PAYMENT-CONTEXT` ヘッダーを付けて転送する。売り手はこのコンテキストを検証し、リソースを返す。
- 売り手の応答後に、Gateway が取引を確定（決済）して買い手に返す。つまり、リソースが返る前に支払いの検証が済んでいて、確定は売り手が応答した後である。

記事は、最も単純な形では「エージェント向けのペイウォール」だと説明する。数クリックで公開でき、課金対象の相手を指定し、支払うまでリソースにアクセスできないようにできる。

### 売り手向けの機能

- **ルール**: URL・ヘッダー・クエリパラメータなど、リクエストの任意の部分に一致する価格ルールを書き、複数の課金方式から選ぶ（本記事の事例では「固定価格」「可変価格」「オリジン管理の価格」が登場する）。
- **Cloudflare が引き受けるもの**: 支払いの検証と精算（[Coinbase の x402 Facilitator](https://docs.cdp.coinbase.com/x402/seller/facilitator) 経由）、失敗と再試行、分析、x402 プロトコルの変更への追従。
- **決済**: [Base](https://www.base.org/) ブロックチェーン上の USDC。
- **今後の予定**: エージェントから発見されやすくする、全取引のログを提供する、他の決済手段に対応する、ID のプリミティブを組み込む。

### 事例 1: Cloudflare AI Gateway（推論に払う）

AI Gateway は、1 つの API キーで何百ものモデルを使えるコントロールプレーンかつモデルのマーケットプレイス。これまではクレジットを購入して使う方式だったが、エージェントがウォレットを持つようになると、残高を維持することが摩擦になる。そこで、米国の Cloudflare 顧客は、選ばれたモデルに対し、リクエスト時に `PAYMENT-METHOD: x402` ヘッダーを足して推論に払えるようになった。記事は、今後 Cloudflare の他のインフラ製品にも HTTP 402 が組み込まれていくと書いている。

AI Gateway はトークンごとの課金を扱う複雑な価格エンジンを持つ。そのため Monetization Gateway は「オリジン管理の価格」に対応するよう共同設計された。この設定では、Gateway が売り手（AI Gateway）に価格情報を直接問い合わせる。AI Gateway は既存の価格モジュールをそのまま使え、Monetization Gateway 側にルールの一覧を持たずに済む。

![AI Gateway での推論課金（シーケンス図）](https://blog.cloudflare.com/_emdash/api/media/file/01M3QKBQRZ3BXBS0C4Z04GFXS6.png)
*図: AI Gateway の場合の流れ。Buyer (agent) が `POST /ai/run`。AI Gateway が Estimate maximum token cost（最大トークンコストの見積もり）をして `HTTP 402: Payment Required` を返す。買い手が Sign payment payload し、`PAYMENT-SIGNATURE: {...}` 付きで再度 `POST /ai/run`。Monetization Gateway が Verify payment を行い、AI Gateway に `PAYMENT-CONTEXT: {...}` 付きで転送。AI Gateway が Validate payment context をして、Model Provider に Inference Execution を依頼し、Response + Actual Cost を受け取る。AI Gateway が `HTTP 200 OK` と `PAYMENT-SETTLEMENT: {Actual Cost}` ヘッダー付きで返す。Monetization Gateway が Finalize transaction をして、買い手に `HTTP 200 OK` の Response を返す（出典: Cloudflare Blog https://blog.cloudflare.com/monetization-gateway-beta/。原文のキャプションは取得した本文から確認できず、説明は図の内容に基づく筆者の整理）*

この図では、見積もった「最大」のコストに対して支払いを承認し、実際のコスト（Actual Cost）は推論の後に `PAYMENT-SETTLEMENT` で確定する。本文にこの説明は明記されていないが、図に「Estimate maximum token cost」と「Actual Cost」が出ており、次の API2PDF の「最大価格を伝え、実消費だけを精算する」と同じ考え方だと読める。

オリジンで価格を決めたい売り手は、メールで連絡すると支援を受けられる、と記事は書く。

### 事例 2: Ceramic.ai（ウェブ検索に払う）

エージェント向けのウェブ検索 API を提供する。独自のインデックスは 400 億ページ以上（more than 40 billion pages）、最速で 50 ミリ秒で結果を返す。検索はエージェントが買うものの中で最も伸縮しやすく、簡単な質問なら 1 クエリ、複雑な調査なら数百クエリになる。エージェントが自分で払えれば、あらかじめ決められた予算に合わせてクエリを抑える必要がなく、状況に応じて検索の深さを決められる。Ceramic.ai は「固定価格」の課金方式を使い、エージェントが API キーなしで検索を実行できるようにしている。創業者の Dr. Anna Patterson 氏の引用がある（Web は人間の買い手のために作られていた。エージェントが自分のために動くには決済が必要で、検索は最初に買えるべきものの 1 つ、という趣旨）。デモと Ceramic.ai のドキュメントが案内されている。

### 事例 3: Stocktwits（株式シグナルに払う）

2008 年に始まり、キャッシュタグ（`$NET` など）を広めた投資家向けのソーシャルサービスで、1,000 万人以上が使う（記事は「18 年間」と書く）。センチメント（強気・弱気）、メッセージ量、フォロワー数、トレンドなどのシグナルを既存のデータ製品で提供してきた。Monetization Gateway は、市場の文脈を随時必要とする AI エージェントという新しい顧客への配信経路になる。従来のデータライセンスではなく、エージェントが実際に行ったリクエストごとに払える。Stocktwits は、エージェント向けの別の経路を作り、その前に Monetization Gateway を置いた。既存の API と企業向けデータ製品は変わらない。各リクエストが個別に価格付けされる。CEO の Howard Lindzon 氏の引用がある。

### 事例 4: API2PDF（API アクセスに払う）

HTML や Office 文書から PDF を生成する REST API で、2018 年から提供している。従量課金で、各リクエストに必要な帯域と計算に対して課金していた。これまでは、アカウント作成と API キーの取得が必要で、最初の月の後にはクレジットカードが必要になり、そこで**コンバージョンが 50% を超えて下がった**（>50% drop off）。今は、API キーなしのリクエストに Monetization Gateway が HTTP 402 を返す。リクエストごとに計算・帯域のコストが変わるため「可変価格」を使い、エージェントに 1 リクエストの最大価格を伝える。支払いが済むと API2PDF がリクエストを処理し、**実際に消費した分だけ**を精算する。エージェントも、自分で PDF を作るためにトークンを使うか、専用 API に 1 セントの何分の一かを払って正しく作らせるか、という「作るか買うか」の判断をする、と記事は書く。

## コード例

記事中のコード例は 2 つ。いずれも原文のまま転記する。

### 1. AI Gateway に x402 で払って推論する（`Payment-Method: x402`）

```bash
$ curl -iX POST "https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/ai/run" \
  --header "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  --header "Payment-Method: x402" \
  --header "Content-Type: application/json" \
  --data '{
    "model": "z-ai/glm-4.7-flash",
    "input": {
      "max_tokens": 9001,
      "messages": [
        {
          "role": "user",
          "content": "What is Cloudflare?"
        }
      ]
    }
  }'
```

- エンドポイントは Cloudflare API の `accounts/$CLOUDFLARE_ACCOUNT_ID/ai/run` への POST。`Authorization: Bearer` で API トークンを渡す。
- `Payment-Method: x402` ヘッダーが、クレジットの残高ではなく、リクエスト時の x402 決済を選ぶ指定。本文では `PAYMENT-METHOD: x402` と大文字で書かれ、コマンドでは `Payment-Method: x402` と書かれている（HTTP ヘッダー名は大文字小文字を区別しない）。
- `max_tokens` が 9001 と指定されている。図の「Estimate maximum token cost」が、この上限から最大コストを見積もるという関係になっていると読めるが、記事はこの対応を明記していない。
- この段階では、支払いのない最初のリクエストであり、402 の応答が返る想定。署名して再送する手順は本文に書かれておらず、詳細は AI Gateway のドキュメントに任されている。

### 2. API2PDF に API キーなしでリクエストし、HTTP 402 を受け取る

```bash
$ curl -iX POST https://v2.api2pdf.com/chrome/pdf/html --header "Content-Type: application/json" --data '{"html":"<p>Hello from an AI agent</p>"}'

HTTP/2 402
content-type: application/json
payment-required: eyJ4NDAy...
```

- API キーもなしで PDF 生成を依頼すると、`HTTP/2 402` が返る。
- `payment-required` ヘッダーに、支払い指示が（省略形で）入っている。値は `eyJ4NDAy...` と途中で切れている。先頭の `eyJ` は Base64 でエンコードした JSON によくある形だが、記事は内容を説明していない（これは筆者の推測で、記事の記述ではない）。
- 買い手は、この指示を受け取って署名し、`PAYMENT-SIGNATURE` ヘッダー付きで再送する（前掲の流れの図に対応する）。

## ユースケース

- **AI モデルの推論**: AI Gateway が、クレジットの事前購入なしに、リクエスト時の x402 で推論を売る（選ばれたモデル、米国顧客）。
- **エージェント向け検索 API**: Ceramic.ai が、API キーなしの固定価格で検索を売る。クエリ数が読めないエージェントが、検索の深さを自分で決められる。
- **市場データ**: Stocktwits が、センチメントなどのシグナルを、エージェントのリクエストごとに売る。既存のデータ製品とは別の経路。
- **従量課金 API**: API2PDF が、アカウント作成とクレジットカードの壁（>50% の離脱）を避け、可変価格で実消費だけを精算する。
- **売り手一般**: Web サイト・API・MCP ツール・データセットを持つ事業者が、エージェントを新しい顧客として、サブスクリプションなしで受け入れる。

## 所感・ポイント

- 同日の [Pay Per Use](2026-09-30-pay-per-use.md) と対をなす。リクエストそのものが使用になるもの（API・ツール・データ）は本製品、ページのように 1 回の取得が複数回の使用になりうるコンテンツは Pay Per Use、という分担が、記事の冒頭近くで明示されている。
- 「支払いの検証と精算」は Coinbase の x402 Facilitator、決済は Base 上の USDC。記事は、既存ネットワークの対応や新ネットワークの登場を排除しておらず、将来の追加の決済手段も予定として挙げている。現時点の決済経路は USDC に限られる点は押さえておきたい。
- 価格の決め方は 3 種類が見える: 売り手が Cloudflare 側でルールを書く固定価格（Ceramic.ai）、最大価格を提示して実消費を精算する可変価格（API2PDF）、売り手のオリジンに問い合わせるオリジン管理の価格（AI Gateway）。可変価格とオリジン管理の価格の細かい仕様は本文にない。
- エージェント側の支払い手段は [Cloudflare Wallets](2026-08-04-wallets.md)。売り手の Monetization Gateway、買い手の Wallets、Identity が組み合わさって「ヘッドレスなマーケットプレイス」を目指す、という大きな構図の中の、売り手側の実装の一部として読める。
- ベータは、米国の適格な売り手と買い手が対象のクローズドで、ダッシュボードから申し込む。他地域への対応、ログ提供、追加の決済手段、ID は今後の予定であり、現時点の機能ではない。
- 総論記事 [インターネットには「第二の読者」がいる](2026-09-30-agentic-web.md) の「対価を得る」柱の詳細版のひとつ。
- 画像キャプションは、2 つの図とヘッダー画像のいずれも、取得した本文から原文のキャプションを確認できなかったため、説明は図の内容に基づく筆者の整理・推定。
- **サンプル対象外**: 本機能は米国の適格な売り手・買い手向けのクローズドベータで、第三者が再現できる一般利用可能な Workers の機能ではない。また、決済の署名や Facilitator との連携は Cloudflare 側の基盤にあり、100 行前後の Worker で要点を体験できるものでもないため、`examples/` は作成していません。

## 関連リンク

- 原文（en-us）: [https://blog.cloudflare.com/monetization-gateway-beta/](https://blog.cloudflare.com/monetization-gateway-beta/)
- 本リポジトリ内の関連記事: [Pay Per Use](2026-09-30-pay-per-use.md) / [インターネットには「第二の読者」がいる](2026-09-30-agentic-web.md) / [Cloudflare Walletsを発表](2026-08-04-wallets.md) / [読み取り、発見、呼び出し、決済が可能なオープンなエージェンティックインターネットの構築](2026-08-06-the-agentic-internet.md)
- 記事内から張られているリンク:
  - [Monetization Gateway の最初の発表（約 3 か月前）](https://blog.cloudflare.com/monetization-gateway/)
  - [Pay Per Use の記事](https://blog.cloudflare.com/pay-per-use/)
  - [Monetization Gateway の申し込み（Cloudflare ダッシュボード）](https://dash.cloudflare.com/?to=/:account/monetize/monetization-gateway)
  - [Monetization Gateway の開発者ドキュメント](https://developers.cloudflare.com/monetization-gateway)
  - [Coinbase の x402 Facilitator](https://docs.cdp.coinbase.com/x402/seller/facilitator)
  - [Base](https://www.base.org/)
  - [AI Gateway](https://www.cloudflare.com/products/ai-gateway/) / [AI Gateway のユニファイド課金](https://developers.cloudflare.com/ai-gateway/features/unified-billing/) / [AI Gateway のマシンペイメント（開発者ドキュメント）](https://developers.cloudflare.com/ai-gateway/features/machine-payments/)
  - [Ceramic.ai](http://ceramic.ai) / [デモ（GitHub）](https://github.com/CeramicTeam/ceramic-x402-search-agent) / [Ceramic.ai のドキュメント](https://docs.ceramic.ai)
  - [Stocktwits](https://stocktwits.com/) / [Stocktwits の Monetization Gateway（x402）ドキュメント](https://api-docs.stocktwits.com/#tag--Monetization-Gateway-(x402))
  - [API2PDF](https://api2pdf.com/)
