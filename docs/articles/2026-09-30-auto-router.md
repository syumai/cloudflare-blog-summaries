# AI Gateway の Auto Router で AI 支出を削減する

- 原文: [https://blog.cloudflare.com/auto-router/](https://blog.cloudflare.com/auto-router/)（日本語版なし。ja-jp URL は 404 のため、en-us 版から日本語化した）
- 公開日: 2026-09-30（Birthday Week 2026。英語原文の datePublished は 2026-09-30T13:00:00Z）
- 著者: Ming Lu, Andreas Jansson, Harrison Harnisch
- 関連: [User Insights で AI モデルの「過剰利用」を見つける](2026-09-30-ai-model-overuse-user-insights.md) / [ID情報に基づく分析で、不正なAIの利用を検出](2026-08-05-identity-aware-ai-gateway.md) / [Workers AIとAI Gatewayを単一のAIコントロールプレーンへ統合](2026-08-07-workers-ai-gateway-unification.md) / [Cloudflare OS](2026-08-05-cloudflare-os.md)
- GitHub: [docs/articles/2026-09-30-auto-router.md](https://github.com/syumai/cloudflare-blog-summaries/blob/main/docs/articles/2026-09-30-auto-router.md)

![記事ヘッダー画像](https://blog.cloudflare.com/_emdash/api/media/file/01M3QZK4P6A5H0YYAEW0QN6YNC.png)
*図: 記事ヘッダー画像（複数の水晶玉が経路でつながる装飾イラスト。内容を説明する図ではない。出典: Cloudflare Blog https://blog.cloudflare.com/auto-router/）*

## TL;DR

- AI Gateway の **Auto Router** がパブリックベータで公開された。モデルに `cloudflare/auto` を指定すると、リクエストごとに「そのタスクに十分な能力をもつモデル」へ自動でルーティングされ、利用者がモデル選択を意識しなくてよくなる。ベータ期間中は無料。
- Cloudflare 内部の OpenCode ハーネスでの利用では、フロンティアモデル（OpenAI Sol、Anthropic Claude Opus）だけを使う場合と比べて最大 30% のコスト削減が見られたという。
- 内部の一般ナレッジワーク・ベンチマーク（97 タスク×3 回）では、`cloudflare/auto` は成功率 86.6%・総コスト $2.10。GPT-6 Sol（84.2%・$2.64）と同程度の成功率で、コストは Sol の 80%、Claude Opus 5.5（96.6%・$5.91）の 35%。
- 仕組みは 2 段構成。Workers AI 上の多ヘッド分類モデルがタスク種別（14 カテゴリ）と 4 つの難易度指標を出し、スコアリング行列が品質と価格から `utility = expected quality - adaptive cost penalty` の最大のモデルを選ぶ。プロンプトキャッシュを捨てるコストも考慮して、モデルの切り替えを抑える。

## 背景・課題

記事は、AI 活用が進む企業に共通する流れを述べる。最初は探索期で、新しいツールを次々に導入し、API キーを配り、トークンが自由に流れる。次に、コーディングエージェント・非技術者向けの業務・エージェントの実行とデプロイなど用途ごとの定番ツールに収束する。導入が形になると、ユーザーごとのトークン支出を管理・監督したくなるが、予算やルールで抑えられるのには限りがある。「最も良い節約は、ユーザーが気づかないうちに行われるもの」というのが記事の立場である。

Cloudflare 自身の経験では、コスト管理には複数の手段が必要だった。以前の記事では、AI 支出の予算・上限の設定方法（[spend limits](https://blog.cloudflare.com/ai-gateway-spend-limits)）と、従業員と AI 利用を結びつけて誰が使っているかを見る方法（[identity-aware AI Gateway](2026-08-05-identity-aware-ai-gateway.md)）を紹介してきた。しかし OpenCode・Claude Code・Codex といった多くのハーネスでは、個々のユーザーが手動でモデルを選ぶ。すべてのタスクが同じ難度ではなく、メールやチャットの要約に Opus 級の知能は要らない。一方で、セキュリティエンジニアのチームにはそのモデルを完全には使えなくしたくない。

そこで AI Gateway を「社内で AI を展開する組織のコントロールプレーン」にする、というのが記事の狙いである。すべてのリクエストが通るゲートウェイは、観測と制限だけでなく、利用者に代わって賢い判断を下せる。予算・上限・ID 情報に基づく分析は可視性とガードレールを与えるが、リクエストごとのコスト意識は個人の選択に依存していた。次の一歩として、ゲートウェイ自体が各リクエストを「十分に能力のあるモデル」へ送る。これで組織は支出を自動で減らし、ユーザーは本当に必要なときに最も高性能なモデルを使い続けられる。

## 発表内容 / アーキテクチャ

### 結果: 内部ベンチマーク

Auto Router は、Cloudflare 内部の OpenCode と、独自のエージェントハーネスである Cloudflare OS（[Cloudflare OS](2026-08-05-cloudflare-os.md)）で使われている。コーディングタスクでは、フロンティアモデルに匹敵する結果が得られたとする。ただし最も効果が出るのは、技術系・非技術系の両方の仕事が混ざる大きな組織のような、幅広いナレッジワークだという。

評価は、内部の一般ナレッジワーク・ベンチマークで行った。シミュレートされたワークスペースのツール（メール・カレンダー・Slack・ファイル・出張・財務）を使い、検証可能な答えを出すか操作を完了させるタスクで構成される。比較対象は OpenAI の GPT-6 Sol と Anthropic の Claude Opus 5.5。

| モデル | 成功した試行 | 成功率 | 総コスト | 1 成功あたりのコスト |
| --- | --- | --- | --- | --- |
| cloudflare/auto | 252/291 | 86.6%（+6.2/−6.9 pp） | $2.10 | $0.0084 |
| Anthropic Claude Opus 5.5 | 281/291 | 96.6%（+2.7/−3.8 pp） | $5.91 | $0.0210 |
| OpenAI GPT-6 Sol | 245/291 | 84.2%（+6.5/−6.9 pp） | $2.64 | $0.0108 |

注記（原文）: 97 タスク、1 モデル・1 タスクあたり 3 サンプル。かっこ内は 95% 信頼区間で、タスク単位のブートストラップ（10,000 回）により、同一タスクの 3 回の繰り返しをまとめて再標本化して推定した。pp はパーセンテージポイント。

- Auto Router は他の最先端の日常利用モデルと同程度の性能で、コストは Sol の 80%、Opus の 35%。表の総コストから算出すると、$2.10 / $2.64 ≒ 0.80、$2.10 / $5.91 ≒ 0.36 となり、記事の数字と整合する。
- 成功率だけを見ると Opus 5.5 が最も高い（96.6%）。Auto Router は Opus に成功率で及ばず、コストで大きく下回るトレードオフである点は押さえておきたい（表から読み取れる点で、記事は「Opus と同等」とは述べていない）。
- 説明として記事は、モデル間の「ジャグド（ぎざぎざの）フロンティア」を挙げる。問題を解く能力は、ポートフォリオ全体のどこかに存在する。ルーターの仕事は品質と価格を両立させつつタスクごとに適切なモデルを選ぶこと。節約は、フロンティア以外でこなせる仕事にフロンティア価格を払わないことから生まれ、その量に比例して大きくなる。
- もう 1 つの知見は、トークン単価が低いことが、結果としてのコストの低さにつながるとは限らない点。紙の上では安いモデルが、問題を解くのに桁違いに多くのトークンを使うことがある。よってルーターは、100 万トークンあたりの金額で負荷分散するのではなく、**予測される軌跡（trajectory）のコスト**を最小化すべきだとする。

### 仕組み

![Auto Router のルーティングの流れ](https://blog.cloudflare.com/_emdash/api/media/file/01M3QZK8CSR7YG8VYE7QWJ3TY2.png)
*図: Auto Router の処理の流れ。左から「Recent messages（新しいターンを先頭に、テキストのみ・最大 8 KiB）」→「Task classifier（Task type: 14 カテゴリ、Difficulty: complexity / ambiguity / stakes / context の 4 指標を 1〜5 で評価）」→「Scoring（Quality = strength × gain、Score = quality − price。難しいリクエストほど価格の重みは小さい）」→「Ranked models（スコアの高い順）」→「Model provider（最上位のモデル）」。上から「Model profiles（タスク別の強み・難しい仕事での伸び）」がスコアリングに入力される（出典: Cloudflare Blog https://blog.cloudflare.com/auto-router/。図の内容説明は筆者が画像から読み取ったもの）*

`cloudflare/auto` にリクエストを送ると、次の順で処理される。

1. **候補プールの構築**: まず、リクエストを実際に処理できるモデルのプールを作る。リクエスト形式や実行モードをサポートしないモデルを除外し、ゲートウェイに設定された資格情報・課金設定・アクセス制御ポリシー・支出上限を考慮する。ダウンタイム中の不健全な上流プロバイダーやモデルも除外し、障害が収まれば自動でプールに戻す。
2. **分類**: 残った候補に対し、会話の簡潔な表現を作る。直近のメッセージ（新しいターンを優先）を使い、**Workers AI 上で動き、エッジネットワークの GPU にデプロイされた多ヘッド分類モデル**に送る。分類器は 2 種類のシグナルを出す。(a) 14 のタスクカテゴリ（coding・planning・research・data analysis など）への確率。(b) 4 つの次元（complexity・ambiguity・stakes・前の文脈への依存度）を 1〜5 で評価。
3. **スコアリング**: 別のスコアリング行列が、これらのシグナルとモデルのベンチマーク結果を組み合わせ、各モデルがリクエストにどれだけ合うかを推定する。行列の較正では、タスクと難易度のプロファイルの例ごとに「望ましいモデル」を定義し、その選択が出るように重みを調整した。
4. **価格とのバランス**: 最後に、期待される品質と各モデルの入出力トークン価格を合わせる。単純なリクエストでは価格の重みが大きく、十分な能力があれば小さいモデルが勝つ。難易度が上がると価格のペナルティが下がり、強いモデルが選ばれやすくなる。簡略化すると、`cloudflare/auto` は次で定義される utility が最大のモデルを選ぶ。

```text
utility = expected quality - adaptive cost penalty
```

5. **ランク付きリストを返す**: ルーターはランク付きのリストを返す。AI Gateway はまず 1 位を試し、そのプロバイダーが処理できなければ、別の適格なモデルに移れる。

### 長いエージェントセッションとキャッシュ

デバッグやコーディングのような長いエージェントセッションでは、コストはモデルの定価より、**キャッシュ読み取りのコスト**に左右される。これはセッションが長いほど増える。モデルを切り替えるとキャッシュが捨てられ、新しいモデルがコンテキスト全体を書き込み直すことになる。キャッシュの読み書き価格が安いモデルなら、書き直しのコストをすぐ回収できることもあるため、切り替えが有利な場合もある。

- Auto Router はモデルの切り替えを完全には避けず、キャッシュの読み書きのコストを考慮に入れる。
- **ターン内**（ユーザーの 1 回の入力ループ）ではキャッシュが温まっており、切り替えが得になることはまれなので、同じモデルを使い続けるのがよい。
- **ターン間**では、コンテキスト内のトークン数に応じて大きくなる切り替えペナルティを適用する。セッションの生きたキャッシュを持つモデルは、安いキャッシュ読み取り価格で評価される。ほかの候補は、コンテキストを書き直す全額で評価される。会話が深いほど、切り替えは「より高品質でトークン総量が少ない結果」か「より安いキャッシュ再読み込み」で取り返す必要がある。
- モデルの切り替えにはもう 1 つのコストがある。多くのモデルは他のモデルの推論（reasoning）トークンを読めないため、切り替えで推論トークンが落ちると、新しいモデルが出力価格でやり直す必要が生じうる。将来は、切り替える際に同じモデルファミリーにとどまることを好むよう、ルーターで考慮したいとしている。

### 設計上の利点

- **判断の説明しやすさ**: タスク・次元の分類器からスコアリング行列へ、という 2 段構成のため、各タスクの予測カテゴリと難易度がモデルの選択にどう反映されたかを確認できる。
- **新モデルへの対応が軽い**: 新しいモデルが出ても再学習は不要で、ベンチマークから得た重みをスコアリング行列に加えるだけで済む。
- **プロファイルの拡張**: 同じ分類器で、別のルーティングプロファイルも支えられる。たとえば `cloudflare/auto` に加えて、同じ分類とモデルプールを使いつつ、コストのトレードオフを適用せず最高の期待品質を選ぶ `cloudflare/auto-best` などを将来リリースする予定。

## コード例

記事本文には、コード例（コードブロック）はない。記事が示すのは、モデルに `cloudflare/auto` を指定するという使い方と、`utility = expected quality - adaptive cost penalty` という選択式のみ。代わりに、記事からリンクされているドキュメント（[Auto Router](https://developers.cloudflare.com/ai-gateway/features/auto-router/)）にある呼び出し例を、参考として引用する（以下は記事本文ではなくドキュメントの記載。公開日時点の内容）。

```bash
curl -i -X POST "https://gateway.ai.cloudflare.com/v1/$CLOUDFLARE_ACCOUNT_ID/$CLOUDFLARE_GATEWAY_ID/compat/chat/completions" \
  --header "cf-aig-authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  --header "Content-Type: application/json" \
  --data '{
    "model": "cloudflare/auto",
    "messages": [
      {
        "role": "user",
        "content": "hello"
      }
    ]
  }'
```

- 選ばれたモデルは応答ヘッダーで分かる（ドキュメントの例）: `cf-aig-routed-model: openai/gpt-5.6-luna` / `cf-aig-routing-reason: cost_optimal_within_pool` / `cf-aig-routing-decision-id: 91e0b970-...`。
- マルチターンの会話では `cf-aig-session-id` ヘッダーを送ると、ターン全体で同じモデルを維持し、プロンプトキャッシュを活用できる（OpenCode など対応クライアントは自動で行う）。
- `cf-aig-allowed-models`（例: `anthropic/*`）や `cf-aig-allowed-providers` で、選択肢のモデル・プロバイダーを絞れる。
- Chat Completions と Responses API の形式に対応し、WebSockets API は未対応（ドキュメントの注記）。

## ユースケース

- **全社のコーディングエージェントのコスト削減**: OpenCode・Claude Code・Codex を使う組織で、各ユーザーが手動でモデルを選ぶ代わりに `cloudflare/auto` を既定にする。記事の内部利用では最大 30% の削減。
- **技術・非技術が混在する業務**: メール・カレンダー・Slack・ファイル・財務などのナレッジワークで、単純な要約には小さいモデル、難しい仕事には強いモデルを自動で振り分ける。
- **自社エージェントハーネスへの組み込み**: Cloudflare OS のように自前のハーネスで、モデルの選択を AI Gateway に任せる。
- **User Insights で見つけた過剰利用への対処**: [User Insights](2026-09-30-ai-model-overuse-user-insights.md) の Overkill / Potential Savings で見つけた「高性能モデルに流れている単純なタスク」のワークロードに Auto Router を適用する。
- **障害時の自動フェイルオーバー**: 不健全なプロバイダーを候補から外し、1 位が処理できなければ次のモデルへ移る。

## 所感・ポイント

- 8 月の [統合記事](2026-08-07-workers-ai-gateway-unification.md)（スマートルーティングの予告）と [identity-aware 記事](2026-08-05-identity-aware-ai-gateway.md)（タスクベースのスマートルーティングの予定）で示されていた構想が、Auto Router として出てきた形である。分類器が Workers AI 上で動く、タスク種別・複雑さを推定するなど、予告の内容と対応している。同日公開の [User Insights の記事](2026-09-30-ai-model-overuse-user-insights.md) の分類シグナルとも同じ系統である。
- 「価格ではなく予測される軌跡コストを最小化する」という考え方と、キャッシュの再書き込みを含む切り替えコストの扱いが、単純な「安いモデルに振り分ける」ルーターとの違いである。ターン内は固定、ターン間は切り替えペナルティ、という設計は、長いエージェントセッションの実情に合っている。
- 成功率の数字は内部ベンチマーク（97 タスク）に基づく。信頼区間が広く（Auto の 86.6% は +6.2/−6.9 pp）、Sol との差（2.4 pp）は区間の内側に収まっている。Opus 5.5 には成功率で約 10 pp 及ばない点も表から読み取れる。自社のワークロードでの評価が前提になる。
- 記事の提供段階は「パブリックベータ、ベータ中は無料」。[User Insights の記事](2026-09-30-ai-model-overuse-user-insights.md) には「closed beta」と書かれた箇所があり食い違っていたが、本記事では一貫して public beta と書かれている。
- 今後の予定（原文）: `cloudflare/auto` で提供するモデルの拡大、ゼロデータ保持（ZDR）要件でのモデルの絞り込み、プロバイダーの処理容量の考慮、リクエストごとの推論・思考レベルの選択、Responses API と WebSockets の完全対応、最初の段階の分類器としての構造化された意思決定モデルの検討。
- 謝辞（原文）: Mats Dodd, Sam Scott, Oliver Yu, Jeff Rafter。
- 画像の注記: ヘッダー画像は装飾イラスト。処理の流れの図は原文にキャプションがなく、上記の説明は筆者が画像から読み取ったもの。
- **サンプル**: [examples/auto-router/](../../examples/auto-router/)。`cloudflare/auto` を指定して AI Gateway の OpenAI 互換エンドポイントを呼び、応答ヘッダーから選ばれたモデルと理由を返す最小 Worker。リクエスト形式はドキュメントに従う。`wrangler 4.145.0` で `wrangler deploy --dry-run` と型チェックが通ることを確認したが、実際の Auto Router 呼び出し（AI Gateway の作成と API トークンが必要）は行っていない。

## 関連リンク

- [Auto Router のドキュメント](https://developers.cloudflare.com/ai-gateway/features/auto-router/)（[Default models](https://developers.cloudflare.com/ai-gateway/features/auto-router/#default-models)）
- [AI Gateway の利用上限設定（spend limits）](https://blog.cloudflare.com/ai-gateway-spend-limits)
- 関連記事: [User Insights で AI モデルの「過剰利用」を見つける](2026-09-30-ai-model-overuse-user-insights.md) / [ID情報に基づく分析で、不正なAIの利用を検出](2026-08-05-identity-aware-ai-gateway.md) / [Workers AIとAI Gatewayを単一のAIコントロールプレーンへ統合](2026-08-07-workers-ai-gateway-unification.md) / [Cloudflare OS](2026-08-05-cloudflare-os.md)
- Workers サンプル: [examples/auto-router/](../../examples/auto-router/)
