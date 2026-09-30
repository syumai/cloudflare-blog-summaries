# Pay Per Use: AI があなたの作品を使うなら、対価を受け取るべき

- 原文: [https://blog.cloudflare.com/pay-per-use/](https://blog.cloudflare.com/pay-per-use/)（原題: Pay Per Use: when AI uses your work, you should get paid）
- 日本語版の出どころ: Cloudflare公式の日本語版（`https://blog.cloudflare.com/ja-jp/pay-per-use/`）は確認時点で存在しなかった（404）ため、英語版（en-us）から日本語化して要約している。タイトルも筆者による訳。公開日は英語原文の datePublished（2026-09-30T13:00:00Z）に従う。
- 公開日: 2026-09-30
- 著者: Rúben Teixeira, Jack Galilee, Kayte Johnston, Sam Else
- 位置づけ: Birthday Week 2026 の記事。総論記事で「対価を得る」柱の中心として紹介された Pay Per Use の、ベータ公開の詳細
- 関連: [Monetization Gateway ベータ](2026-09-30-monetization-gateway-beta.md)（同日の記事。リクエスト単位で HTTP 402 課金する側）/ [インターネットには「第二の読者」がいる](2026-09-30-agentic-web.md)（Birthday Week 2026 の総論。Pay Per Use・Monetization Gateway を「対価を得る」柱として紹介）/ [読み取り、発見、呼び出し、決済が可能なオープンなエージェンティックインターネットの構築](2026-08-06-the-agentic-internet.md)（「payable」の構想）/ [Cloudflare Walletsを発表](2026-08-04-wallets.md)（エージェント側の支払い手段）/ [ランク付けから推奨へ（AEO）](2026-08-06-aeo.md)（本記事が対にして紹介している Answer Engine Optimization ツール）
- GitHub: [docs/articles/2026-09-30-pay-per-use.md](https://github.com/syumai/cloudflare-blog-summaries/blob/main/docs/articles/2026-09-30-pay-per-use.md)

![記事ヘッダー画像](https://blog.cloudflare.com/_emdash/api/media/file/01M3Q8WBK852SB7AAAY4NK4NYB.png)
*図: 記事ヘッダー画像。検索バーと、ブラウザ・文書の間を行き交うカニ型のロボットが描かれた装飾イラスト（出典: Cloudflare Blog https://blog.cloudflare.com/pay-per-use/。原文にキャプションはなく、説明は見た目からの筆者の推定。装飾のため、図としては扱わない）*

## TL;DR

- **Pay Per Use** がベータで公開された。買い手（AI 企業）が「コンテンツの特定の使われ方」に価格を提示し、出版社が承諾するかを選ぶ。買い手は使うたびに報告し、Cloudflare が買い手に請求して出版社に支払う。
- 課金の単位は「クロール」ではなく「使用」。2025 年に始めた Pay Per Crawl が「アクセス」に課金するのに対し、Pay Per Use は「その後に起きたこと」に対価を払う。出版社はどちらのモデルも選べる。
- 買い手は Verified bots として識別され、出版社ごとの個別契約や個別統合は要らない。出版社はダッシュボードの **Monetize → Pay Per Use** でオファーを確認し、使用回数と収益を見られる。
- 買い手の使用報告は、1 件 1 行の JSON を送る単一の API（`pay-per-use/usage-reports`）で行う。報告は自己申告だが、Cloudflare が登録済みの出版社に対応するかを検査する。
- API・ツール・データのようにリクエストごとが「使用」になるものは、同日ベータの Monetization Gateway（x402）で売る。両者は ID・計測・価格設定・分析という同じ土台の上にある。

## 背景・課題

AI の回答エンジンは出版社のページを読み、読者に要約を返す。そのため、本来あったはずの訪問と、それに伴う収益が発生しない。多くの出版社は、自分たちの作品を AI 製品に使う企業とライセンス契約を結べず、数百万のサイトと個別に交渉できる企業もない。ウェブには「払ってくれるならイエス」と言う手段が必要だ、というのが記事の出発点になる。

もう 1 つの課題は、クロールへの課金の限界にある。AI 製品は使う量よりずっと多くを取得する（検索エンジンは、表示しないページもインデックスする）。クロールごとに課金すると、買い手は何が必要か分からないうちに払うことになり、多くは払わない。使用に対して払う方式なら、価格が買い手の得る価値に結びつき、買い手も出版社の収益も増えると記事は期待している。買い手側でも、最新のニュース・研究・専門業界誌のように、ブロックやペイウォールの裏にあって最も変化が速いコンテンツが製品に必要になっている。

なお、記事は「7 月に Pay Per Use の計画を示した」と書いており（冒頭の「In July, we outlined our plan」。取得した本文ではリンク先を確認できなかった）、本記事はその後、買い手とコンテンツ所有者と作ってきた結果のベータ公開という位置づけになっている。

## 発表内容 / アーキテクチャ

### 使用に払う（クロールではなく）

出版社の視点: 買い手が特定の使用に価格を提示し、出版社が承諾するかを決める。Cloudflare が登録・使用記録・請求・支払いを担う。出版社は承諾したオファーのコンテンツがどれだけ使われ、いくら稼いだかを見られる。

買い手の視点: 今はブロックやペイウォールの裏にあるコンテンツに、オファーを出せる。実際に製品が使った分だけを払い、すべての出版社に検証済みの買い手として識別され、1 つの API でイエスと言ったすべてのサイトにつながる。数千の統合や個別交渉の契約は要らない。

AI 企業は、払う対象の「使用」を定義して価格を決める。出版社は受けるオファーを選ぶ。

### 仕組み

出版社は、識別された AI 企業に、下流の使われ方を収益に変える条件でコンテンツを提供する。参加するプログラムを選べ、クローラーのアクセスと下流の使い方の制御権を保つ。AI 企業は [Verified bots](https://developers.cloudflare.com/bots/concepts/bot/verified-bots/) としてクロールを識別し、出版社の制御が許す範囲で所有コンテンツにアクセス・インデックスできる。そのコンテンツは後に、AI 検索の引用回答、リサーチエージェントのレポートの引用、ショッピングエージェントが比較する製品レビュー、料理アシスタントが改変するレシピなど、多くの体験を支えうる。

![Pay Per Use の流れの図](https://blog.cloudflare.com/_emdash/api/media/file/01M3Q8WE3A560CVNARSER4DEZR.png)
*図: Pay Per Use の全体の流れ。4 つの領域で構成される。Enroll（出版社が買い手のオファーを承諾 → Cloudflare が参加を記録・有効化。買い手は Web Bot Auth でクローラーを登録）、Access through Cloudflare（出版社がコンテンツへのアクセスを許可 ↔ Cloudflare が買い手ごとに出版社のアクセスルールを適用 ↔ 買い手がアクセス・クロール・インデックス）、Usage（後に「Snippet served」「Audio generated」「Other agreed usage」のような使用が起き、買い手が課金対象イベントを報告）、Settlement（Cloudflare が使用を集計して買い手に請求 → 出版社に支払い、出版社は報告と支払いを受け取る）（出典: Cloudflare Blog https://blog.cloudflare.com/pay-per-use/。原文にキャプションはなく、図の説明は画像内の文言に基づく筆者の整理）*

記事は 4 つのステップで説明している。

1. **何を有償の使用とするかを決める**: 各 AI 企業は Cloudflare でプログラムを設定し、クローラーを識別し、払う対象の使用を定義して価格を決め、支払いアカウントを接続する。記事の例は 2 つ。検索サービスが登録ページの抜粋を顧客に返したときに払う、ショッピングエージェントが登録済みのレビューで推奨を形づくったときに払う（後者は買い物客がレビューを読まなくても、使用に応じて支払いが発生する）。同じ記事が製品ごとに別の価値を生みうるため、出版社は使い方ごとに別のオファーを受けられる。使用の定義は買い手が提案し、Cloudflare は報告と支払いの基盤を提供する。
2. **出版社が参加するかを選ぶ**: Cloudflare ダッシュボードの Monetize → Pay Per Use でオファーを確認する。AI 企業、払う対象の使用、提示価格が表示される。承諾するか決められ、条件が合わなくなれば参加をやめられる。オリジンの変更や AI 企業ごとの技術統合は要らない。各プログラムの条件には、AI 企業がコンテンツで何をしてよいか（学習の制限を含む）も定められる。
3. **買い手が使用を報告する**: 買い手は、オファーを承諾したドメインの一覧を取得し、使用ごとに 1 行の JSON（発生時刻、コンテンツ元の URL、イベント ID）を報告する。使用は自己申告で、プログラムの条件は完全な報告を求め、Cloudflare は報告された使用が登録済みの出版社に対応するかを確認する。
4. **Cloudflare が双方を精算する**: 報告された使用を集計し、買い手に請求し、出版社に月次で、接続された支払いアカウントへ支払う。買い手は統合が 1 つ、出版社は確認する場所が 1 つで済む。

![Pay Per Use のダッシュボード](https://blog.cloudflare.com/_emdash/api/media/file/01M3Q8W932QHJNGQVCPES0QK2D.png)
*図: Pay Per Use のダッシュボード。Publisher ページで、Estimated earnings が $1,125.76（+8.5%、前の期間は $1,037.38）、Reported uses が 53,533（前の期間は 50,091）。Earnings over time と Usage over time のグラフには、買い手別（EdgeWave 20,260 / Example AI 16,878 / Sample Search 9,777 / Demo Agent 6,618）の使用回数が並ぶ。左のナビでは Monetize の下に Monetization Gateway（Beta）と Pay Per Use（Beta）の Analytics / Settings が見える。原文のキャプションは「Pay Per Use dashboard: estimated earnings and reported uses over time, by buyer and domain.」。画面のデータはデモ用の値と見られる（出典: Cloudflare Blog https://blog.cloudflare.com/pay-per-use/）*

### 支払いは製品の半分にすぎない

出版社は現在、AI 企業ごとのコンテンツの使用回数と収益を、ドメイン別・時系列で見られる。[Business Insights](https://developers.cloudflare.com/bots/business-insights/) がどのクローラーが来て何を取っているかを示すのに対し、Pay Per Use は「その後に何が起きたか」（実際に使われたか、何回か、いくら稼いだか）を示す。

今後は AI 企業と、使用ごとの文脈（引用につながったキーワード、リクエストのトピック、支えた製品など）を出版社に報告する取り組みを進める。個人データはやり取りしない。

Cloudflare の Answer Engine Optimization（AEO）ツール（[AEO の記事](2026-08-06-aeo.md)）は、アシスタントが作品についてどう答えるかを示す。Pay Per Use は、買い手が使用したと報告したものと、その収益を示す。合わせて、コンテンツがどう見つかり、どう使われ、いくら払われるかがつながる。これは 2 種類の判断に役立つ。商業的な判断（どのコンテンツが稼ぐか、どの使い方に価値があるか、参加を続けるか）と、編集上の判断（何を書くか、何を更新するか、エージェントに見つけやすくするには何をするか）。

### これから

ベータ期間は、各買い手とオプトインした出版社と直接協力する。問いは「双方が続けたいか」。買い手は価格に見合うコンテンツ、出版社は参加に値する対価・信頼できる報告・期日通りの支払いを求める。

将来は、新しい買い手が自分の製品と支払いモデルでオンボードでき、出版社ごとに登録・報告・精算を作り直さずに済む状態を目指す。出版社側は、1 か所でオファーを承諾・拒否し、価格を提案し返し、使い方ごとに価格を変えられるようにしたい。記事は、先週のレポートのほうが 10 年前のアーカイブページより AI 製品にとって価値があるかもしれず、そこに課金できるべきだと例示している。ベータで、これらを大規模にシンプルかつ実用的にする方法を探る。

### エージェント型ウェブの経済レイヤー

記事は、コンテンツが他者の製品の一部（引用された検索結果、ショッピングの推奨、エージェントのレポート）になっても、新しい読者に届き、持続的な収益を生むべきだと述べる。Pay Per Use は、オファー・承諾・使用の記録を通じて、そうした使用を商業的な関係に変える。

ただし、すべてを同じ方法で売るべきではない。価値の高いコンテンツには、使い方を報告する検証済みの買い手の信頼できるネットワークが要り、それが Pay Per Use。API・ツール・データは、リクエストごとが使用なので事情が違う。その場合は、同日ベータの [Monetization Gateway](https://blog.cloudflare.com/monetization-gateway-beta) が、オープンな x402 プロトコルでエージェントにリクエスト単位で課金できる。2 つは ID・計測・価格設定・分析という同じ基盤で動く。

## コード例

記事中のコード例は、買い手が使用を報告する `curl` コマンド 1 つのみ（原文のまま転記）。

```bash
curl -X POST "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/pay-per-use/usage-reports" \
 -H "Authorization: Bearer $API_TOKEN" \
 -H "Content-Type: application/jsonl" \
 --data-binary @- <<'EOF'
{"used_at":"2026-09-15T13:42:04Z","url":"https://example.com/article/1","id":"request-001"}
EOF
```

- エンドポイントは Cloudflare API の `accounts/$ACCOUNT_ID/pay-per-use/usage-reports` への POST。API トークンで認証する。
- `Content-Type` は `application/jsonl`（JSON Lines）。本文は 1 行が 1 件の使用で、`--data-binary @-` と here-document で標準入力から渡している。複数の使用は行を増やして送る形だと読めるが、記事はそこまでは説明していない。
- 1 件のフィールドは `used_at`（使用の発生時刻、ISO 8601）、`url`（コンテンツの取得元 URL）、`id`（イベント ID、例では `request-001`）の 3 つ。`id` は買い手側で使用を識別するための値と考えられるが、重複排除の仕様は記事に書かれていない。
- 使用は自己申告。プログラムの条件が完全な報告を求め、Cloudflare は報告された URL が登録済みの出版社に対応するかを確認する。

## ユースケース

- **ライセンス契約が届かない中小の出版社**: 個別契約は望めなくても、オファーを承諾するだけで、AI 製品が使うたびに対価を得る（総論記事の「小規模な業界誌」の例に対応）。
- **AI 検索・回答エンジン**: 登録ページの抜粋を返したときに払うオファーを出し、ペイウォールやブロックの裏にあるニュース・研究を正規のルートで使う。
- **ショッピングエージェント**: 登録済みのレビューが推奨を形づくったときに払う。買い物客がレビューを読まなくても支払いが発生する。
- **出版社の編集・商業判断**: ダッシュボードの使用回数と収益（買い手・ドメイン別）から、どのコンテンツが稼ぐか、参加を続けるかを判断する。AEO ツールの結果と合わせて、何を書き、更新するかの参考にもなる。
- **リクエストごとが使用になるもの**: API・ツール・データは Pay Per Use ではなく、Monetization Gateway（x402）でリクエスト単位の課金にする。

## 所感・ポイント

- 「クロールに払う」Pay Per Crawl から「使用に払う」Pay Per Use への展開で、払うタイミングを、買い手が価値を得たときに移した点が中心。出版社は両モデルを選べる。
- 使用の定義は買い手が提案し、報告は自己申告。Cloudflare が行うのは、報告が登録済みの出版社に対応することの確認と精算の基盤の提供までで、使用の真正性そのものは、プログラムの条件に依拠する。ベータで「双方が続けたいか」を確かめる段階である点も、記事が明示している。
- 価格の提案し返し（カウンター）、使い方ごとの価格差、新しい買い手の自己オンボードは「今後」の話で、ベータにはまだない。
- 使用の文脈（キーワード・トピック・製品）の報告も、AI 企業と取り組み中の計画。個人データはやり取りしないとされる。
- 総論記事 [インターネットには「第二の読者」がいる](2026-09-30-agentic-web.md) の「対価を得る」柱の詳細版。エージェント側の支払い手段は [Cloudflare Wallets](2026-08-04-wallets.md)、x402 でリクエスト単位に売る側は Monetization Gateway（[Monetization Gateway ベータ](2026-09-30-monetization-gateway-beta.md)）という分担になる。
- 画像キャプションは、ダッシュボード画像のみ原文にある（`Pay Per Use dashboard: estimated earnings and reported uses over time, by buyer and domain.`）。ヘッダー画像と流れの図は原文にキャプションがなく、説明は筆者の推定・整理。
- **サンプル対象外**: Pay Per Use はベータで、出版社・買い手とも Cloudflare との個別の参加手続きが必要なため、第三者が再現できる一般利用可能な Workers の機能ではない。中心も Cloudflare 側のダッシュボードと精算の仕組みで、100 行前後の Worker で要点を体験できるものではないため、`examples/` は作成していません。

## 関連リンク

- 原文（en-us）: [https://blog.cloudflare.com/pay-per-use/](https://blog.cloudflare.com/pay-per-use/)
- 本リポジトリ内の関連記事: [インターネットには「第二の読者」がいる](2026-09-30-agentic-web.md) / [読み取り、発見、呼び出し、決済が可能なオープンなエージェンティックインターネットの構築](2026-08-06-the-agentic-internet.md) / [Cloudflare Walletsを発表](2026-08-04-wallets.md) / [ランク付けから推奨へ（AEO）](2026-08-06-aeo.md)
- 記事内から張られているリンク:
  - [Pay Per Crawl（2025 年の発表）](https://blog.cloudflare.com/introducing-pay-per-crawl/)
  - [Verified bots のドキュメント](https://developers.cloudflare.com/bots/concepts/bot/verified-bots/)
  - [Business Insights のドキュメント](https://developers.cloudflare.com/bots/business-insights/)
  - [Answer Engine Optimization（AEO）の記事](https://blog.cloudflare.com/aeo/)
  - [Monetization Gateway（ベータ）の記事](https://blog.cloudflare.com/monetization-gateway-beta)（本リポジトリの解説: [Monetization Gateway ベータ](2026-09-30-monetization-gateway-beta.md)）
  - [総論記事（The Internet has a second audience）](https://blog.cloudflare.com/agentic-web/)
