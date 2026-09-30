# User Insights で AI モデルの「過剰利用」を見つける

- 原文: [https://blog.cloudflare.com/ai-model-overuse-user-insights/](https://blog.cloudflare.com/ai-model-overuse-user-insights/)（日本語版なし。ja-jp URL は 404 のため、en-us 版から日本語化した）
- 公開日: 2026-09-30（Birthday Week 2026。英語原文の datePublished は 2026-09-30T13:00:00Z）
- 著者: Ayush Kumar, Frank Meszaros
- 関連: [ID情報に基づく分析で、不正なAIの利用を検出](2026-08-05-identity-aware-ai-gateway.md) / [Workers AIとAI Gatewayを単一のAIコントロールプレーンへ統合](2026-08-07-workers-ai-gateway-unification.md)
- GitHub: [docs/articles/2026-09-30-ai-model-overuse-user-insights.md](https://github.com/syumai/cloudflare-blog-summaries/blob/main/docs/articles/2026-09-30-ai-model-overuse-user-insights.md)

![記事ヘッダー画像](https://blog.cloudflare.com/_emdash/api/media/file/01KZ7B4V2YNVJJXE8VE6E5ZK5E.png)
*図: 記事ヘッダー画像（装飾イラスト。出典: Cloudflare Blog https://blog.cloudflare.com/ai-model-overuse-user-insights/）*

## TL;DR

- AI Gateway の **User Insights** に、トラフィックの「中身」を示す文脈が加わった。選ばれたモデルがタスクに対して高性能すぎる（overkill）会話を見つけ、どのユーザー・エージェントが関わっているかを示す。
- 追加された見方は、**モデル適合（Model fit）**、**Potential Savings**、**タスク分析**（coding / research / writing / summarization / data analysis など）、**ターン分析**（やり取りの往復数とコスト）の 4 つ。AI Gateway ユーザーは無料で使える。
- 分類は専用の Cloudflare Worker が AI Gateway のログを**非同期**に処理して行う。リクエスト経路にレイテンシは加わらないが、ダッシュボードの反映は約 1 日遅れることがある。
- 分かった傾向は Auto Router（タスク種別・複雑さ・モデル適合のシグナルで自動的にモデルを選ぶ）につなげられる。カスタムアプリでは `cf-aig-metadata` に `user_id` と `session_id` を付ける。

## 背景・課題

[先月 User Insights を公開した](2026-08-05-identity-aware-ai-gateway.md)際の問いは「人々は AI で実際に何をしているのか」だった。ユーザー・アプリケーション・タスク・モデルごとのトラフィックや、ユーザー／エージェントの異常を見られるようになったが、利用者からは「モデル名とリクエスト数だけでは、その裏にある仕事が分からない」という声が届いた。コードレビューなのか、調査なのか、エージェントが何度も呼び出して 1 つの仕事を終えているのか。同じトークン数でも中身はまったく違い、タスクを知らなければモデル選択の是非も評価できない。

記事は次の例で問題を示す。社内の AI トラフィックを AI Gateway に通している組織で、数週間後に支出が増え、一部のリクエストが遅く感じられる。原因の候補は、開発者のコーディング作業が複雑になった、エージェントがフォローアップの呼び出しを多用している、少数のユーザー／エージェントが利用の大半を占めている、など複数ある。トークン数とリクエスト数だけでは、どれが原因か判別できない。モデル・ワークフロー・ルーティングルールのどれを変えるべきかを決める前に、トラフィックが何を表すかを知る必要がある。

## 発表内容 / アーキテクチャ

### モデル過剰利用（Overkill）ビュー

**Model overkill** ビューは、選択されたモデルがタスクの要求より高性能に見える会話を特定する。たとえば、単純な整形や要約のリクエストが高性能な推論モデルに送られている、といった状況を見つけられる。どのユーザー・エージェント・アプリケーションがそのパターンに関係しているかを確認し、その背後のタスクを調べる出発点になる。原因は、デフォルトのモデルだから、どれを選べばよいか分からないから、エージェントが全ステップで同じモデルを使う設定だから、などが考えられるという。

![モデル適合の概要](https://blog.cloudflare.com/_emdash/api/media/file/01M3AZ6B7XX7RT89TZ6F0XJ6WA.01M3AZ6C7YPP42RBCM2643NKM5.png)
*図: Model fit overview。「Model fit by token usage」が Overkill 89.81B（29%）、Appropriate 166.22B（53%）、Underpowered 56.52B（18%）、Could not assess 88.47M（<1%）の帯で表示されている（出典: Cloudflare Blog https://blog.cloudflare.com/ai-model-overuse-user-insights/）*

このビューはランキングではなく、置き換え先のモデルを自動で推薦するものでもない。チームが次の問いを立てる助けになる。

- このタスクにこのモデルは適切か
- 余分な能力は結果を良くしているか
- より速く安いモデルでも同等の結果になるか
- 問題は特定のワークフロー・ユーザー・エージェントに限られるか

そのうえでコスト・レイテンシ・トークン使用量・会話のターン数を比べ、変更を決める。

### Potential Savings ビューと Auto Router

この知見は、新しい **Potential Savings** ビューと、このリリースと同時に公開される Auto Router（[後述](#auto-router-への接続)）の両方を支える。Potential Savings は、より速く安いモデルで品質を損なわずに処理できそうなリクエストを特定する。Auto Router は同じタスクとモデル適合のシグナルを自動で適用し、ワークロードごとにルーティングルールを書かなくてもコストを減らせるようにする。

![Potential Savings ビュー](https://blog.cloudflare.com/_emdash/api/media/file/01M3AZ6B8GNYBK51EQG36J8DZE.01M3AZ6CT48X3YN9G1R7X1V67Q.png)
*図: Potential Savings ビュー。「3% of analyzed spend」と、Top opportunities の表（Task / Model used / Suggested model / Conversations / Estimated spend / With suggested model / Savings）。例として General Q&A で Claude Opus 5 → GPT-5.6 Luna（110 会話、節約 $3.5K）、Research search で Claude Opus 5 → Kimi K3（680 会話、$1.5K）などが並ぶ。金額の一部は画像内でマスクされている（出典: Cloudflare Blog https://blog.cloudflare.com/ai-model-overuse-user-insights/）*

画面の説明文は「必要以上に強力なモデルで処理された会話が、提案モデルで節約できた額。提案モデルが安い場合のみ計上。請求額ではなく推定値」となっている。記事は、難しいコーディングや調査には高性能な推論モデルが必要なこともあり、短い要約や単純な分類には不要なこともあると述べ、「すべてを最安モデルに移す」のが目的ではなく、選択が仕事に合っているかを理解することが目的だとしている。

![Overkill の支出が大きいユーザー](https://blog.cloudflare.com/_emdash/api/media/file/01M3CXY6CQTPWGG5B33C3B12DB.01M3CXY6ZMJRE91ABT6BBK684X.png)
*図: Users with Overkill Spend。「Users with most overkill spend」として、ユーザーごとの overkill 期間の推定支出（$3.4K / $1.5K / $1.3K / $943.31 / $911.96 など）とトークン数を横棒で表示。ユーザー名はマスクされている（出典: Cloudflare Blog https://blog.cloudflare.com/ai-model-overuse-user-insights/）*

### タスク分析

**タスク分析**は、会話を仕事の種類で分類する。初期のカテゴリは coding、research、writing、summarization、data analysis。モデル名の一覧にはない文脈が得られ、エンジニアリングチームは主にコーディングとデバッグ、別のチームは調査と要約、といった違いが見える。単純なタスクが意外に多く、しかも高性能モデルに送られていたと分かることもある。AI Gateway をすでに通っているトラフィックで調べられ、デフォルトモデルが広く当てられすぎていないかの確認にも使える。

![タスクのカテゴリ別内訳](https://blog.cloudflare.com/_emdash/api/media/file/01M3AZ6DWSCCXQY45YN6S47Z81.01M3AZ6F7QFT74B209Q5T0QWCG.png)
*図: Categorical breakdown of tasks within a fictitious organization（架空の組織のタスクのカテゴリ別内訳）。「Task and model analysis」の「Tasks by model」がツリーマップで表示され、タスク（Debugging / Code planning / Code Q&A / Coding / Research search など）ごとにモデル別のトークン使用量が色分けされる。Token usage と Estimated spend を切り替えられる（出典: Cloudflare Blog https://blog.cloudflare.com/ai-model-overuse-user-insights/）*

### ターン分析（タスクの総コスト）

**ターン分析**は、タスクごとにどれだけやり取りが必要かを示す。1 往復で終わる仕事もあれば、質問・修正・追質問を重ねる仕事もある。長い会話が悪いとは限らない（複雑な仕事なら自然）が、単純なタスクが何ターンも続くなら、プロンプト・モデル・ワークフローを見直す価値がある。最初のリクエストはコストの一部にすぎず、完了までの時間・トークン・金額も見る必要がある。

![セッションのターン分析](https://blog.cloudflare.com/_emdash/api/media/file/01M3AZ6ENNC17M0QB8823KZBBX.01M3AZ6G3G02MCXG73AHJ9ZNFE.png)
*図: Turn analysis on sessions。「Average cost by user turns」の棒グラフ。ユーザーターン数（1 / 2-9 / 10-49 / 50+）ごと、モデル別（Claude Opus 5、GPT-5.6 Sol、Kimi K3、Claude Sonnet 5）の平均推定コストを表示。ユーザーターンは「アシスタントが応答する前にユーザーが送る 1 通または連続したメッセージ」と定義されている。画像内では 10-49 ターンの Claude Opus 5 が突出しており、縦軸の値は隠されている（出典: Cloudflare Blog https://blog.cloudflare.com/ai-model-overuse-user-insights/）*

### Auto Router への接続

overkill のパターンをタスク・コスト・レイテンシ・ターンのデータで確認できたら、自動ルーティングの判断に変えられる。記事の例では、タスクビューで要約と整形が多く、モデルビューでそれらが大きな推論モデルに送られ、ターンビューでほとんどが 1 ターンで終わっている。この 3 つが重なると、評価すべき具体的なワークロードになる。

Auto Router は、会話の軌跡・タスクカテゴリ・タスクの複雑さ・モデル適合のシグナルを使い、コストを考慮して適切なモデルへ自動でルーティングする。ワークロードごとのルールを書く代わりに、アプリケーションが使えるモデルの中から選ばせる。ただし常に最安モデルを選ぶわけではなく、複雑なコーディングや調査は高性能モデルのままになりうる。

なお、Auto Router の提供段階について、記事内に食い違いがある。Model fit の節は「public beta で公開」、本節は「closed beta で利用可能」と書かれている（原文のまま転記。どちらが正しいかは、Auto Router の記事で確認する必要がある）。詳細は記事内からリンクされている Auto Router の記事（https://blog.cloudflare.com/auto-router/）を参照。

### トラフィックの分類方法

各会話には、User Insights で集計できる「分析シグナル」が付く。シグナルはレポートとルーティング分析のためのもので、元のリクエストを置き換えたり露出したりするものではない。

- **分類エンジン**は、対象となる AI Gateway ログを処理する専用の Cloudflare Worker。ユーザーのリクエスト・アシスタントの応答・ツール呼び出し・ツール結果を含む会話の軌跡を調べ、coding / debugging / research / summarization などの仕事の種類を判定する。信頼度スコアも返し、タスクの複雑さ・意図の曖昧さ・重大性（stakes）・文脈依存度といった次元も評価する。
- 返されたカテゴリは、ダッシュボードが使うログのメタデータと結合できる。候補モデルのタスクへの適合度とコストを比べる、モデル適合の評価にも使える。現在の実装は、理解しやすい少数のカテゴリに絞っており、ユーザーの仕事の細部をすべて推測しようとはしていない。
- 既存の AI Gateway のログ構成に従う。メタデータはログ本文と別に保存され、現在の実装ではメタデータが **Durable Objects**、ログ本文が **R2** に置かれる。User Insights が見せるのは派生したカテゴリと集計ビューで、生のプロンプトを閲覧するダッシュボードにはならない。元のログ本文の保持期間は、設定済みの AI Gateway のロギング設定に従うため、分類器に流す対象を決める際はその設定を確認する。
- 分類は**非同期**。AI Gateway がリクエストを処理したあとで行われ、ユーザーの応答を待たせない。AI Gateway が先にログを既存のストレージ経路へ書き、分類 Worker があとから処理する。リクエスト経路にレイテンシは加わらない。
- トレードオフとして、User Insights はリアルタイムではない。新しい会話はすぐには表示されず、ログの処理・集計のため、分析はトラフィックに対して約 1 日遅れることがある。ライブの監視ではなく、時間をかけた利用パターンの把握に向く。

![User Insights のフロー](https://blog.cloudflare.com/_emdash/api/media/file/01M3AZ6G46ZRJMXSTJCT4NFWQC.01M3AZ6HBB27Q12C73PC5A3F5Q.png)
*図: User Insights Flow。左の「Request path · no added latency」で AI Gateway proxy が Log body を R2 に、Log metadata を Durable Objects に保存する。右の「Asynchronous analysis」で、R2 の対象ログ（Process eligible logs）を Classification worker が処理し、Classify task で Smart Router に渡し、Derived category in User Insights を出力する。Durable Objects のメタデータは Join log metadata で結合される（出典: Cloudflare Blog https://blog.cloudflare.com/ai-model-overuse-user-insights/。図中の「Smart Router」は本文の「Auto Router」と同じものを指すと思われるが、原文に説明はなく、筆者の推定）*

![支出によるタスク分類](https://blog.cloudflare.com/_emdash/api/media/file/01M3AZ6HD80WB0Q9PW0MT8MSM2.01M3AZ6K828MRS3BKB8JG89K8N.png)
*図: Task classification by spend。「Tasks by model」で Debugging を選択した状態のツリーマップと、「Top models for Debugging」のカード（GPT-5.6 Sol、Kimi K3（Workers AI）、Claude Opus 5、Claude Sonnet 5 など）。モデルを選ぶと該当ログを表示できる。金額の一部はマスクされている（出典: Cloudflare Blog https://blog.cloudflare.com/ai-model-overuse-user-insights/）*

### ユーザー・チーム・ツールとの結びつけ

タスクカテゴリは、ユーザー・チーム・アプリケーション別に見るとさらに役立つ。AI Gateway は ID を認識する（identity-aware）ため、別途レポート用のパイプラインを作らなくてもその文脈が得られる。自作アプリだけでなく、Claude Code、Codex、OpenCode などの開発ツールやエージェントハーネスにも使える。AI Gateway を Cloudflare Access の背後に置くと、認証されたユーザーとセッションを AI トラフィックに結びつけられる。

自作アプリでは、User Insights の分析のために、リクエストに安定した `user_id` と `session_id` の両方を含める必要がある。正確な ID 設定やフィールド名は、アプリやツールの構成による。重要なのは、安定していて機微でない識別子を渡し、ID 情報をプロンプトに混ぜずに利用をグループ化できるようにすること。Access を AI Gateway の前に置けば、Claude Code・Codex・OpenCode などは ID 文脈を自動で引き継げる。Cloudflare Access は 50 ユーザーまで無料。

## コード例

記事中のコード例は、自作アプリが AI Gateway にリクエストを送る際のメタデータを示した HTTP リクエスト 1 つのみ（原文のまま転記。`cf-aig-metadata` の値は原文ではエスケープされた引用符で書かれている）。

```http
POST https://gateway.ai.cloudflare.com/v1/$ACCOUNT_ID/$GATEWAY_ID/openai/chat/completions

Content-Type: application/json

Authorization: Bearer $OPENAI_API_KEY

cf-aig-metadata: { user_id: "user-123", session_id: "session-456", idp_group: "engineering", application: "code-review" }
```

リクエストボディには、会話のモデルとメッセージが入る（記事でも省略されている）。

- エンドポイントは `https://gateway.ai.cloudflare.com/v1/$ACCOUNT_ID/$GATEWAY_ID/openai/chat/completions`。AI Gateway 経由で OpenAI の Chat Completions を呼んでいる。
- `cf-aig-metadata` ヘッダに `user_id` と `session_id`（必須）、`idp_group` と `application`（例として付けられた属性）を渡す。これらでタスクカテゴリをユーザー・チーム・アプリ別に集計できる。
- ID 情報はプロンプトではなくメタデータに入れる。

## ユースケース

- **支出増の原因切り分け**: 支出増や遅延が、コーディングの複雑化・エージェントの過剰な呼び出し・一部ユーザーへの偏りのどれによるのかを、タスク・モデル・ターンのビューで確認する。
- **単純タスクの高性能モデル利用の発見**: 整形・要約・分類のリクエストが高性能な推論モデルに送られていないかを、Model fit と Potential Savings で探す。
- **利用者・エージェント単位の調査**: 「Users with Overkill Spend」で overkill の支出が大きいユーザーやエージェントを特定し、デフォルトモデル・モデル選択の迷い・全ステップ同一モデルといった原因を確認する。
- **ワークフローの見直し**: ターン分析で、単純なタスクが多ターンになっていないか、プロンプトやワークフローを見直す箇所を探す。
- **自動ルーティングへの移行**: task・model・turns のシグナルが揃ったワークロードを、Auto Router で評価する。
- **開発ツールの利用可視化**: Cloudflare Access 経由で Claude Code・Codex・OpenCode の利用を、認証済みユーザー・セッションと結びつけて見る。

## 所感・ポイント

- 8 月の記事は「普段と違う利用（異常）」の検知が主題だった。本記事は「同じ利用でもモデルが仕事に合っているか」という、コスト最適化の軸を加える位置づけで、[Workers AI と AI Gateway の統合記事](2026-08-07-workers-ai-gateway-unification.md)で予告されたスマートルーティング（タスクの種類・複雑さの推定）の下地に当たるシグナルでもある。
- 「Overkill」は推定であり、請求額ではない（Potential Savings の説明文）。結論ではなく調査の出発点という姿勢が一貫しており、自動で置き換えを推薦しない点が記事の強調点。
- 非同期処理のため、リアルタイムの監視には使えない（約 1 日の遅れ）。リクエスト経路の遅延ゼロとの引き換えである点は、導入時に理解しておきたい。
- ログ本文の保持期間は AI Gateway のロギング設定に従う。分類に回すデータの範囲を、この設定に合わせて確認する。
- 一部の数値は画像内でマスクされており、画像に写る Claude Opus 5、GPT-5.6 Sol/Luna、Kimi K3 などのモデル名は記事中の例示（架空の組織を含む）として扱うのがよい。
- 原文の食い違いが 2 点ある。Auto Router が「public beta」と「closed beta」の両方で書かれていること、フロー図の「Smart Router」が本文では「Auto Router」と呼ばれていること。
- 画像キャプションは原文のもの（Model fit overview / Potential Savings view / Users with Overkill Spend / Categorical breakdown of tasks within a fictitious organization / Turn analysis on sessions / User Insights Flow / Task classification by spend）。図の内容の説明文は筆者が画像から読み取ったもので、推定を含む。
- サンプル対象外の理由: 記事の中心機能は AI Gateway のダッシュボード上の分析機能（User Insights）と、クローズドベータの Auto Router であり、デプロイ可能な Workers の最小実装で再現できないため、本リポジトリでは `examples/` は作成していません。

## 関連リンク

- 原文（en-us）: [https://blog.cloudflare.com/ai-model-overuse-user-insights/](https://blog.cloudflare.com/ai-model-overuse-user-insights/)
- 本リポジトリ内の関連記事: [ID情報に基づく分析で、不正なAIの利用を検出](2026-08-05-identity-aware-ai-gateway.md) / [Workers AIとAI Gatewayを単一のAIコントロールプレーンへ統合](2026-08-07-workers-ai-gateway-unification.md)
- 記事内から張られているリンク:
  - [User Insights を公開した記事（Identity-aware AI Gateway）](https://blog.cloudflare.com/identity-aware-ai-gateway/#the-new-user-insights-tab)
  - [AI Gateway（製品ページ）](https://www.cloudflare.com/products/ai-gateway/)
  - [Auto Router の記事](https://blog.cloudflare.com/auto-router/)
  - [AI Gateway User Insights のドキュメント](https://developers.cloudflare.com/ai-gateway/observability/user-insights/)
  - [Cloudflare ダッシュボード（AI Gateway）](https://dash.cloudflare.com/?to=/:account/ai/ai-gateway)
