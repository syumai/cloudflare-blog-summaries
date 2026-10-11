# Clef のご紹介: オープンソースの decision model と、新しい RL ファインチューニング基盤

- 原文: [https://blog.cloudflare.com/clef-decision-models/](https://blog.cloudflare.com/clef-decision-models/)（原題: Introducing Clef: our open-source decision models, and new RL fine-tuning platform）
- 日本語版の出どころ: Cloudflare公式の日本語版（`https://blog.cloudflare.com/ja-jp/clef-decision-models/`）は確認時点で存在しなかった（404）ため、英語版（en-us）から日本語化して要約している。タイトルも筆者による訳。公開日は英語原文の datePublished（2026-10-01T15:34:02Z）に従う。
- 公開日: 2026-10-01
- 著者: Michelle Chen、Alex Reneau、Kevin Flansburg
- 位置づけ: Birthday Week 2026 の記事（読了目安は原文表記で 10 分）。タグは AI / Birthday Week / Developers / Machine Learning / Open Source / Workers AI
- 関連: [Workers AI と AI Gateway を単一の AI コントロールプレーンへ統合](./2026-08-07-workers-ai-gateway-unification.md)（Workers AI のモデル提供の枠組み）、[より小さく、より速く、より安全に: Kimi と GLM を大規模に実行](./2026-08-03-smaller-faster-safer-models.md)（Workers AI のモデル運用・最適化）、[1年後のソブリンAIと「選択」をめぐる戦い](./2026-10-01-sovereign-ai-choice-one-year-later.md)（同日の Workers AI 周辺の発表）、[AI Search の一般提供](./2026-10-01-ai-search-ga.md)、[AI Gateway の Auto Router](./2026-09-30-auto-router.md)（AI Gateway によるリクエスト蓄積・ルーティング）、[Cloudflare にエージェント開発ライフサイクルの時代が到来](./2026-08-04-agent-development-lifecycle.md)（エージェント開発の文脈）
- GitHub: [docs/articles/2026-10-01-clef-decision-models.md](https://github.com/syumai/cloudflare-blog-summaries/blob/main/docs/articles/2026-10-01-clef-decision-models.md)

![ヘッダー画像: 水晶玉の中に音楽のハ音記号（clef）が描かれた装飾イラスト](https://blog.cloudflare.com/_emdash/api/media/file/01M3TJPKAE7MFBW626XHNC9QVA.png)
*図: 記事ヘッダー画像（出典: Cloudflare Blog https://blog.cloudflare.com/clef-decision-models/）。装飾的なイラストで、技術的な図ではない。原文にキャプションは付いておらず、上記の説明は画像を見た筆者による記述。*

## TL;DR

- Cloudflare が自社で学習した decision model **Clef**（高精度）と **Clef-flash**（低レイテンシ向け）を **Workers AI** で公開した。Apache 2.0 ライセンスで Hugging Face にもウェイトを公開している。
- decision model は「状態（入力）と型付きの質問を渡すと、各選択肢の確率つきで構造化された答えを返す」モデル。LLM のようにテキストを生成せず、安価・高速・一貫した判定をワークフローに組み込める。
- Jev API 互換。Jev Decision Index で首位（Clef 61.2、Clef-flash 57.1、Jev 57.9。いずれも図中の値）。画像入力（vision encoder）と 64k のコンテキストが特徴。
- 学習は Qwen をバックボーンにした prefill-only の非自己回帰方式。強化学習（RLCD）も併用している。
- 追加で、Clef を顧客のワークロード向けに調整する **RL ファインチューニング**を、まず FDE（forward-deployed engineer）チームによるハンズオンの形で提供し、のちにセルフサーブ基盤にする計画。

## 背景・課題

LLM は非決定的だが、推論やテキスト・ツール呼び出しの生成には向く。一方、エージェントのワークフローの途中では「この問い合わせは緊急か」「どのチームに回すか」のような、**有限の選択肢から素早く一貫して選ぶ**判断が頻繁に必要になる。従来の分類器はカテゴリが変わるたびに再学習が必要だった。

記事によれば、Typesafe AI の **Jev**（System One モデル）が、任意の入力に対して再学習なしに境界のある構造化出力を返す「decision model」という概念を打ち出して話題になった。Clef はこの流れを受けた Cloudflare 版で、Jev API 互換のまま、画像入力・長いコンテキスト・低レイテンシを加えたものと位置づけられる。

## 発表内容 / アーキテクチャ

### decision model とは

状態（例: カスタマーサポートの問い合わせ文）と質問を渡すと、型付きの答えと確率が返る。コードはそれを使ってチケットを振り分けたり、エスカレーションしたり、人に判断を委ねたりできる。記事は「エージェントの判断に必ずしも人が介在する必要がなくなる」と述べる。

![decision model の入出力図](https://blog.cloudflare.com/_emdash/api/media/file/01M3TJPNG3PJHDJ88KJZJ7Q29T.png)
*図: decision model の入出力（出典: Cloudflare Blog https://blog.cloudflare.com/clef-decision-models/）。左に入力（サポートチケット「APIが 20 分前から 500 エラーを返している…」と、質問・カテゴリ「Which team? Billing / Technical / Sales」「Is it urgent? Yes / No」）、中央に Decision model、右に並列の出力（Department: Technical 100%、Urgency: Yes 100%）が描かれている。原文に図のキャプションはなく、上記の説明は画像を見た筆者による記述。*

社内での利用例として、Threat Intelligence チームがドメイン分類に Clef を試している。Browser Run でページを取得・レンダリングし Clef に渡すと、「ファッションサイトである確率 95%、EC 85%、フィッシング 1% 未満」のようなカテゴリ判定が返る。取得・レンダリング・分類まで 2.2 秒。同じワークフローで最速の汎用 LLM である gpt-oss-120b は 4.7 秒で、返せた分類も 2 つだけだった。

名前の由来は音楽の「clef（音部記号）」。音部記号が五線譜の各線の音名を定めるように、decision model が文脈の領域を定めて後続の動作を決める、という見立てで、「CF」が Cloudflare を指す語呂もある。

### Clef の特徴

1. **vision encoder** を持ち、画像を入力してビジュアルコンテンツを分類できる（Jev は現状テキスト分類のみ）。
2. **64k コンテキスト**（Jev は 32k）。
3. 各種ベンチマークで他の decision model と競合する精度。

![Decision Index とレイテンシの散布図](https://blog.cloudflare.com/_emdash/api/media/file/01M3W09VBACVT4420YA2SDXZE8.01M3W09YK4NRJQNV2S8HMMCQF0.png)
*図: 横軸が median latency（ms、右ほど遅い）、縦軸が Decision Index 0.2.1（上ほど良い）。Clef 61.2（約 210ms）と Clef-flash 57.1（約 40ms）が efficient frontier 上にあり、Jev は 57.9 だが約 520ms 付近。Kev 9B は 38.5。凡例は Cloudflare（自己報告）／ Jev（クローズド）／ Open models（board-validated）（出典: Cloudflare Blog https://blog.cloudflare.com/clef-decision-models/）。原文に図のキャプションはなく、説明は画像を見た筆者による記述で、プロット位置の数値の一部は目盛りからの読み取り。*

記事の表から主な数値を転記する（Clef / Clef-flash / Jev / DiffusionGemma Jev / Kev 9B / Laya の順）。

| ベンチマーク | Clef | Clef-flash | Jev | DiffusionGemma Jev | Kev 9B | Laya |
| --- | --- | --- | --- | --- | --- | --- |
| BFCL · case exact | 98.47 | 98.76 | 95.75 | 96.52 | 94.51 | 38.13 |
| ToolRet · nDCG@10 | 69.19 | 66.43 | 65.28 | 61.21 | 64.26 | 12.69 |
| API-Bank · accuracy | 91.93 | 93.11 | 88.19 | 83.66 | 56.30 | 11.41 |
| Home appliances · case exact | 82.95 | 97.73 | 52.27 | 42.05 | 25.00 | 0.00 |
| When2Call · accuracy | 72.37 | 65.58 | 80.97 | 75.44 | 49.62 | 11.94 |
| BANKING77 · macro-F1 | 94.20 | 90.93 | 79.74 | 74.28 | 84.83 | 14.29 |
| CLINC150+OOS · macro-F1 | 97.43 | 66.77 | 89.27 | 83.49 | 79.03 | 3.19 |
| BRIGHT · nDCG@10 | 45.91 | 39.26 | 47.52 | 42.94 | 38.53 | 19.90 |
| Amazon ESCI · macro-F1 | 57.48 | 57.39 | 55.21 | 53.37 | 49.22 | 24.40 |
| PhishNChips · accuracy | 79.60 | 75.05 | 62.55 | 85.35 | 50.75 | 50.15 |

Typesafe 自身の eval スイート（記事は「3 領域で Jev を上回る」と述べる）:

| ワークフロー | Clef | Clef-flash | Jev |
| --- | --- | --- | --- |
| Invoice processing | 64.7 | 57.1 | 61.8 |
| Customer service | 76.3 | 77 | 76.0 |
| Security incidents | 62.9 | 61.7 | 61.7 |
| Agent trace observability | 68.5 | 69.8 | 71.6 |

43 の評価ベンチマークでのレイテンシ（記事は「非常に高速だが品質を犠牲にしている Laya を除き、Clef 系がレイテンシで勝る」と述べる）:

| 指標 | Clef | Clef-flash | Jev | DiffusionGemma Jev | Kev-9B | Laya |
| --- | --- | --- | --- | --- | --- | --- |
| Median latency (ms) | 209.3 | 38.8 | 524.1 | 84.4 | 51.4 | 5.8 |
| p95 latency (ms) | 238.6 | 122.4 | 536.0 | 211.2 | 187.9 | 222.5 |

Workers AI 上でホストされるため、エッジの GPU による低いネットワークレイテンシも得られる。記事は「Clef をエージェントのホットパスに置き、行動の実行は Workers AI 上の LLM と組み合わせられる」と述べる。大きい Clef は精度重視、Clef-flash はレイテンシ重視の判断向け。Cloudflare は、リクエストとレスポンスを読み取らず、保存せず、学習にも使わないとしている（ファインチューニング製品を利用する場合を除く）。

### どう学習したか

Jev 公開と同じ週に、Cloudflare は自社の実験として、DiffusionGemma モデルを LLM の logprobs を露出させて決定論的な確率を出すように適応させた事例を公開していた（独立研究者 Matt Mastracci の研究と、vLLM への DiffusionGemma 対応の pull request を土台にしている）。Clef はこの考え方を発展させ、バックボーンを **Qwen** に変えた。

- 推論時は Qwen で **prefill-only** の 1 パスを行い、スキーマで許される選択肢を**並列にスコアリング**する。決定ステップは非自己回帰で、中間テキストをトークンごとに生成しないため、自己回帰型の LLM より大幅に速い。
- 構造化された答えを中間テキスト経由ではなく、バックボーンの内部表現から直接導く。選択肢ごとに文脈を抽出し、フィールド同士と元のペイロードの間で cross-attend してからスコアリングする二段階の attention ルーティングを使う。lexical prior により、選択肢間で意味の意図を保つ。
- 学習: Clef では Qwen3.8-27B、Clef-flash では Qwen3.5-9B を凍結し、ルーティングヘッドと rank-256 の低ランクアダプタを同時に最適化した（モデル名は原文表記のまま）。損失は有効なスキーマ出力に対する label-smoothed cross-entropy と、確率較正のための Brier loss。フィールドの順序・プロンプト・スキーマ構造を入れ替えた社内の合成データセットを使う。
- 二次的な最適化として **RLCD**（Reinforcement Learning for Calibrated Decisions）を開発。隣接する順序選択肢への部分点、完全に正確なレコード出力への報酬、分布シフトを防ぐ参照ペナルティを組み込む。

結果として、分類精度の向上、確率のみを出力する制約、Jev やベースの Qwen モデルより高速であることを実現したと述べている。

### ファインチューニングと RL サービス

社内には、Trust & Safety の申告の評価、Cloudflare サポートのトリアージ、Bot 製品でのクローラの良し悪し判定など、固有の分類器ニーズがある。15 年以上のネットワークデータとラベル付きの意思決定履歴があるため、特定ドメイン向けに調整すれば汎用 Clef より精度・速度ともに高められる、とする。ファインチューニングでは汎用性能の一部を手放して特定領域の精度を得る。

顧客向けには、FDE チームがハンズオンでファインチューニングを支援するサービスを提供し、その経験からデータ収集・微調整・再デプロイをすべて Cloudflare 上で行えるセルフサーブ基盤を作る計画。構成要素は次のとおり。

| 役割 | プロダクト |
| --- | --- |
| リクエストのデータセット化 | Cloudflare AI Gateway（AI トラフィックを通すと、ユースケース用のリクエストデータセットが自動で作られる） |
| ロールアウト生成 | Cloudflare Workers AI（ベースの Clef に対して生成） |
| スコアリング・リプレイ用の RL サンドボックス | Cloudflare Containers |
| 重みの更新 | **[NEW] Trainer** |
| 再デプロイ | Workers AI + BYO Model（Cog。Replicate 買収以降進めてきた取り組み） |

![RL 学習ループの図](https://blog.cloudflare.com/_emdash/api/media/file/01M3TJPQEG983EA9PS20PQZS6R.png)
*図: RL の学習フロー（出典: Cloudflare Blog https://blog.cloudflare.com/clef-decision-models/）。Capture（AI Gateway が本番のリクエスト／レスポンスをログ）→ Prepare（自社のデータパイプラインでタスクを選別し報酬を定義。「ログだけではラベルにならない」）→ RL training loop（Generate: Workers AI が現在のポリシーから行動／応答をサンプリング → Execute + Score: Containers と自前の報酬コードでツール／テストを実行してタスク固有の報酬を計算 → Update weights: RL trainer、新しい GPU 学習コンポーネントで RL 損失と勾配を計算して重みを更新）→ Deploy（Workers AI + BYO Model で選んだチェックポイントを本番配信）→ 新しい本番トラフィックとフィードバックが Capture に戻る。原文に図のキャプションはなく、説明は画像を見た筆者による記述。*

## コード例

記事の curl 例（Workers AI の REST API、`@cf/cloudflare/clef`）。1 つの `state` に対し、`noul`（緊急かどうかの二値）、`choice`（チーム選択）、`score`（深刻度の序数）の 3 種類の型付き質問を同時に渡している。

```bash
curl https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/ai/run/@cf/cloudflare/clef \
  -X POST \
  -H "Authorization: Bearer $CLOUDFLARE_AUTH_TOKEN" \
  -d '{
    "model": "clef",
    "state": "Checkout has been failing for every customer for the last hour.",
    "questions": {
      "urgent": { "type": "noul", "instructions": "Is this support request urgent?" },
      "team": {
        "type": "choice",
        "instructions": "Which team should handle this request?",
        "criteria": {
          "billing": "Payments, invoices, and refunds",
          "technical": "Outages, errors, and configuration",
          "sales": "Plans and upgrades"
        }
      },
      "severity": {
        "type": "score",
        "instructions": "How severe is the customer impact?",
        "criteria": ["No impact", "Minor", "Major", "Critical"]
      }
    }
  }'
```

- `state`: 分類対象の入力（テキスト。モデルページによればテキスト・JSON・画像・動画を読める）。
- `questions`: 質問名をキーにしたスキーマ。`choice` は `criteria` に選択肢名と説明、`score` は `criteria` に順序つきの段階を渡す。`type: "noul"` の綴りはモデルページの記載のまま。
- 返り値は各質問の選択肢ごとの確率（モデルページのコメントによれば、`urgent` は緊急である確率、`team` は選択肢ごとの確率、`severity` は確率加重のスコア）。応答の厳密な JSON 構造は記事には載っていない。
- Workers binding からは `env.AI.run("@cf/cloudflare/clef", {...})` で呼べる（モデルページの Usage に基づく）。

## ユースケース

- **サポートチケットの振り分け**: チームの選択と緊急度・深刻度を 1 回の呼び出しで並列に判定し、ルーティング・エスカレーション・人への引き継ぎにつなげる。
- **ドメイン・サイトの分類（Threat Intelligence）**: Browser Run で取得したページを分類し、カテゴリごとの確率を得る。社内テストで gpt-oss-120b の 4.7 秒に対し 2.2 秒。
- **画像を含む分類**: vision encoder により、画像コンテンツの分類にも使える。
- **エージェントのホットパス上の判断**: 行動の前段で Clef-flash のような低レイテンシモデルに判定させ、実行は LLM に任せる。
- **社内の専用分類器**: Trust & Safety の申告の評価、サポートのトリアージ、Bot 製品での良い／悪いクローラの判定など（RL ファインチューニングの想定用途）。

## 所感・ポイント

- 「LLM に自由記述で判断させる」のではなく、**スキーマと確率を前提にした判定専用モデル**を呼ぶ設計で、結果を `if` 分岐や閾値判定にそのまま使える点が実用的。確率が返るため、閾値以下は人に回す、といった設計がしやすい。
- ベンチマークは多くが Jev Decision Index の項目で、Cloudflare 自身が実行した結果（図の凡例も「Cloudflare (self-reported)」）。When2Call や BRIGHT、PhishNChips のように Clef が首位でない項目もあり、記事も「競合するスコア」という表現にとどめている。モデル選択では自分のタスクで評価するのが前提になる。
- レイテンシは Clef-flash（中央値 38.8ms）と Clef（209.3ms）で大きく違う。精度を取るか速度を取るかのトレードオフが明確。
- RL サービスは、現時点では FDE によるハンズオン提供で、セルフサーブ基盤は「今後構築する」段階。Trainer は [NEW] と書かれている新コンポーネントで、詳細な提供条件・料金は記事には書かれていない。
- 本文の数値・モデル名（Qwen3.8-27B など）は原文のとおり転記した。
- **サンプルについて**: Clef は Workers AI 上で公開済みで、Workers binding から呼べるため、最小の Worker サンプルを [examples/clef-decision-models/](../../examples/clef-decision-models/) に用意した（`wrangler deploy --dry-run` と型チェックで確認。実際のモデル呼び出しは行っていない）。RL ファインチューニング基盤はサンプル対象外（FDE 経由のハンズオン提供のため再現不能）。

## 関連リンク

- 原文（en-us）: [https://blog.cloudflare.com/clef-decision-models/](https://blog.cloudflare.com/clef-decision-models/)
- Workers サンプル: [examples/clef-decision-models/](../../examples/clef-decision-models/)
- 本リポジトリ内の関連記事: [Workers AI と AI Gateway の統合](./2026-08-07-workers-ai-gateway-unification.md) / [Kimi と GLM を大規模に実行](./2026-08-03-smaller-faster-safer-models.md) / [1年後のソブリンAIと「選択」](./2026-10-01-sovereign-ai-choice-one-year-later.md) / [AI Search の一般提供](./2026-10-01-ai-search-ga.md) / [Auto Router](./2026-09-30-auto-router.md) / [エージェント開発ライフサイクル](./2026-08-04-agent-development-lifecycle.md)
- 記事内から張られているリンク:
  - [Clef のモデルページ（Workers AI）](https://developers.cloudflare.com/workers-ai/models/clef)
  - [Hugging Face: Cloudflare/clef](https://huggingface.co/Cloudflare/clef) / [Cloudflare/clef-flash](https://huggingface.co/Cloudflare/clef-flash)
  - [Jev Decision Index](https://huggingface.co/spaces/multimodalart/jev-decision-index) / [ライブのベンチマークデモ](https://clef-evals.workers-ai-mle.workers.dev)
  - [Typesafe AI: Jev の紹介](https://typesafe.ai/blog/introducing-system-one-models-and-jev) / [Typesafe の eval スイート](https://huggingface.co/collections/typesafe/workflowevals)
  - [Kev 9B](https://huggingface.co/jaredpalmer/kev-9b) / [Laya](https://huggingface.co/convaiinnovations/laya)
  - [Michelle Chen の DiffusionGemma 実験の投稿](https://x.com/michellechen/status/2101091012559151480) / [Matt Mastracci](https://x.com/mmastrac) / [vLLM の pull request](https://github.com/vllm-project/vllm/pull/57250)
  - [RL のデザインパートナー募集](https://www.cloudflare.com/resource/clef-rl-interest) / [採用情報](https://www.cloudflare.com/careers/)
