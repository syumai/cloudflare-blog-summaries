# AI Search が一般提供（GA）に: マルチモーダル埋め込み・大容量ファイル・OCR・課金開始

- 原文: [https://blog.cloudflare.com/ai-search-ga/](https://blog.cloudflare.com/ai-search-ga/)（原題: AI Search is now generally available）
- 日本語版の出どころ: Cloudflare公式の日本語版（`https://blog.cloudflare.com/ja-jp/ai-search-ga/`）は確認時点で存在しなかった（404）ため、英語版（en-us）から日本語化して要約している。タイトルも筆者による訳。公開日は英語原文の datePublished（2026-10-01T13:00:00Z）に従う。
- 公開日: 2026-10-01
- 著者: Gabriel Massadas, Nelson Duarte, Ashish Vinodkumar
- 位置づけ: Birthday Week 2026 の記事（読了目安は原文表記で 6 分）。8月の Agents Week で発表された AI Search の大型アップデートとプレビュー価格の続報にあたり、GA と課金開始日（2026-11-01）を扱う
- 関連: [Cloudflare AI Search: エージェントにあなたのデータのための検索エンジンを](./2026-08-06-ai-search-easier.md)（前身の記事。Discover クロール・公開エンドポイント・プレビュー価格を扱う）／ [Agents Week 2026 まとめ](./2026-08-10-agents-week-review.md)（Agents Week での AI Search の位置づけ）／ [Workers サンプル（前身記事の最小実装）](../../examples/ai-search-easier/)
- 関連（Web 検索）: [AI Gateway 経由の Web Search API の紹介](./2026-10-02-introducing-web-search-api.md)（自分のデータではなく Web 全体を AI Gateway 経由で検索する側）
- GitHub: [docs/articles/2026-10-01-ai-search-ga.md](https://github.com/syumai/cloudflare-blog-summaries/blob/main/docs/articles/2026-10-01-ai-search-ga.md)

![記事ヘッダー画像](https://blog.cloudflare.com/_emdash/api/media/file/01M3SPF381A5ZFP5JJT0DGXF1T.png)
*図: 記事ヘッダー画像。虫眼鏡とブラウザ画面を組み合わせ、周囲を循環する矢印で囲んだ装飾イラスト（出典: Cloudflare Blog https://blog.cloudflare.com/ai-search-ga/。原文にキャプションはなく、説明は見た目からの筆者の推定。装飾のため、図としては扱わない）*

## TL;DR

- Cloudflare の AI Search（Workers AI・Vectorize・R2・Browser Run を組み合わせた、フルマネージドの索引・検索パイプライン）が**一般提供（GA）**になった。
- **マルチモーダル対応**: 画像のピクセルを直接埋め込む「ネイティブ画像埋め込み」を追加。従来のキャプション方式も併用する。Qwen3-VL-Embedding モデルで利用でき、Matryoshka Representation Learning（MRL）で埋め込みを効率化している。
- **ファイル上限が 4 MiB から 10 MiB に**拡大し、スキャンされた PDF 向けの **OCR** が全アカウントで利用可能になった。
- **課金は 2026-11-01 開始**。プレビュー価格から 1 点だけ変更され、無料枠のクエリが「共有 2,000」から「セマンティック 1,000 ＋ フルテキスト 1,000」になった。
- 今後はビデオ・音声の取り込み、キーワード検索エンジンの再構成、Cloudflare 上の既存サイト向けの簡単な有効化手段が予定されている。

## 背景・課題

AI Search は、1 年以上前の公開以来、社内ドキュメント検索から Web サイトの検索まで幅広い用途で使われてきた。Cloudflare 自身も、ブログと開発者ドキュメントの検索に利用している。

これまでの課題は 2 つあった。ひとつは画像の扱いである。従来の画像対応は「物体検出 → キャプション生成 → そのテキストを埋め込み」という素朴な実装で、キャプションに書かれなかった情報（質感・画面の状態・グラフの関係・文書のレイアウトなど）は検索から失われていた。もうひとつは、スキャンされた PDF（実体は画像で、テキストを取り出せないもの）や、4 MiB を超えるファイルを扱いにくい点である。加えて、料金は Agents Week 時点ではプレビューのままで、GA に向けた確定が必要だった。

## 発表内容 / アーキテクチャ

### マルチモーダル埋め込みと検索

記事は「画像は、それを説明する 1 文以上のものだ」と述べる。AI Search は、画像のピクセルを直接埋め込んで視覚的な検索に使いつつ、キャプションも保持してテキストとしての理解にも使う。この 2 種類の表現を効率よく保持するために、**Matryoshka Representation Learning（MRL）**を活用している。MRL は、短くした埋め込みでも有用な情報を保てる学習手法で、ストレージを抑えつつ検索を高速に保つ狙いがある。

- 従来: 物体検出 → キャプション生成 → テキスト埋め込み（キャプションの内容でしか検索できない）
- 現在: キャプションベースの理解と、ネイティブ画像検索の**両方**を行う
- ネイティブなマルチモーダル検索は、現時点では **Qwen3-VL-Embedding** モデルで利用できる
- クエリ時、AI Search はインスタンスの埋め込みモデルが画像に対応しているかを確認する。対応していれば、クエリ画像をそのモデルで直接埋め込み、インデックス済みの画像・テキストと同じベクトル空間で検索する
- 埋め込みモデルがテキスト専用の場合でも、画像でクエリできる。クエリ画像を **ToMarkdown** でテキスト化（キャプション化）し、その結果で検索する。すべてのモデルに基本的なマルチモーダル対応を与え、ネイティブ対応モデルでは視覚的な情報をフルに使う

記事の鳥の写真の例（Wikimedia Commons の joelfotos による CC0 画像）では、キャプションから得られる理解（「黒と白の模様の小さな鳥が、黄金色の果実と緑の葉の間に止まっている」）に対し、ネイティブ画像検索は、キャプションに含まれない細部（白い眉斑の形、黄緑色の羽毛、滑らかな果実と傷んだ果実の混在、葉の深い筋の質感、暖かい色調と浅い被写界深度の構図）にも一致できるとされる。

これにより、言葉で厳密に表現しにくい検索が可能になる。見つけたい画像を言葉で説明する、別の画像を渡して視覚的に似た結果を探す、両者を組み合わせる（例: 「似た模様の鳥」「プラムの実と葉のある枝に止まっている鳥」）といった使い方ができる。商品探索、スクリーンショットの照合、チャート、図表、スキャン文書など、色・質感・構図・空間的な関係が重要なコレクションで有用とされている。

### クエリの流れ

![AI Search のクエリの流れを示した縦長のフロー図](https://blog.cloudflare.com/_emdash/api/media/file/01M3SPF4DQJEF4XQTBF8H37P47.png)
*図: The life of an AI Search query。上から「Your query」→ Query rewriting（任意・AI Gateway / Workers AI）→ hybrid search の枠内で、左は Query embedding（任意）→ Vector retrieval（任意・Vectorize）、右は Query tokenization（任意）→ Keyword retrieval（任意・BM25）に分かれ、Fusion（任意）で合流 → Reranking（任意・AI Gateway / Workers AI）→ Chunk content retrieval（R2）→ Search result →（任意の）Response generation → Chat Completions result（出典: Cloudflare Blog https://blog.cloudflare.com/ai-search-ga/）*

記事の説明では、クエリはまず（任意で）書き換えられ、次に埋め込まれる（画像クエリは、マルチモーダルモデルなら直接埋め込み、テキスト専用モデルならキャプション化してから埋め込み）。ベクトル検索とキーワード検索が並列で走り、結果は融合（fusion）され、任意で再ランキングされる。上位のチャンクが返されるか、生成モデルに渡されて回答が書かれる。

### 大きなファイルと OCR

- テキストファイル（Markdown・HTML・CSV・JSON など）と PDF の上限が **4 MiB から 10 MiB** に拡大した。
- 多くの PDF は実質的にスキャンした画像で、抽出できるテキストがない。その場合は **OCR を有効にする**と、チャンク化と埋め込みの前に、各ページからテキストが読み取られる。
- OCR は**全アカウントで利用可能**。課金は新しい AI Search の料金体系のもとで、**画像処理の取り込みトークン**として扱われる。

### 課金と料金体系

Agents Week（2026 年 8 月）でプレビューとして発表された料金が GA となり、**課金は 2026-11-01 に開始**される。有効化の前にリマインダーのメールが送られる。すべての Workers プランで無料枠が提供される。

料金の設計思想は「ファイルを 1 つもインデックスする前に請求額を見積もれる」こと。支払うのは 3 つだけで、取り込んだコンテンツ・保存するデータ・実行したクエリである。その間の処理（パース、チャンク化、Workers AI モデルでの埋め込み、キーワードインデックス、再ランキング）は料金に含まれる。インスタンス時間・キャパシティユニット・月額最低料金はない。

- 取り込みは、選んだ Workers AI の埋め込みモデルによらず、トークンあたり 1 つの料金で、トークンの数え方もモデルを問わず共通。テキスト専用モデルからマルチモーダルモデルに切り替えても、画像を処理しない限り取り込み料金は変わらない（画像処理は追加料金）。
- ストレージは、インデックスのデータサイズで課金される。
- クエリは、種類（セマンティック／フルテキスト）と件数で課金される。

| 項目 | 料金 | 月間無料枠（全 Workers プラン） |
| --- | --- | --- |
| Base Ingestion（取り込み） | $0.75 / 1M トークン | 5M トークン † |
| Image processing（追加料金） | +$0.50 / 1M トークン | 5M トークン † |
| Stored data（ストレージ） | $2.00 / GB・月 | 10 GB |
| Semantic（ハイブリッド・ベクトル検索） | $0.75 / 1k クエリ | 1,000 クエリ |
| Full-text | $0.10 / 1k クエリ | 1,000 クエリ |
| Embedding and Reranking（取り込み・クエリ） | 選択した Workers AI モデルでは無料。サードパーティは別請求 | N/A |

† 取り込みトークンの無料枠は、現在サポートされているすべてのファイル種別（テキスト、画像など）を対象とする 1 つのプールで、月 5M トークン。

プレビュー時の価格表との違いは 1 点。無料枠のクエリが、共有プール 2,000 件ではなく、**セマンティック 1,000 件とフルテキスト 1,000 件**に分けられた。それ以外の単価・無料枠は、[前身の記事](./2026-08-06-ai-search-easier.md)のプレビュー価格表と同じである。

### 今後の予定

- マルチモーダル埋め込みは第一歩。ビデオと音声を完全に処理する取り込みパイプラインを構築中で、リッチメディア資産の検索を可能にする。
- 現在の実装に限界がある大規模データストア向けに、キーワード検索エンジンをスケールしやすい形にリファクタリング中。
- すでに Cloudflare 上で動作している Web サイト向けに、AI Search を有効化してインデックスを作るための、よりよく簡単な方法を開発中。AI エージェントがコンテンツを発見・探索・利用しやすくする狙いがある。

## コード例

この記事には、コードスニペットは掲載されていない（概念・料金・機能の発表が中心）。そのため、代わりに記事の構成と、設定上のポイントを整理する。

- 設定の入口は開発者ドキュメント: 対応する[埋め込みモデル](https://developers.cloudflare.com/ai-search/configuration/models/supported-models/#embedding)、[画像と OCR の設定](https://developers.cloudflare.com/ai-search/configuration/data-source/#images-and-optical-character-recognition)、[ファイルの上限](https://developers.cloudflare.com/ai-search/configuration/data-source/#file-limits)、[料金と制限](https://developers.cloudflare.com/ai-search/platform/limits-pricing/)
- 画像検索を有効にしたければ、インスタンスの埋め込みモデルとして Qwen3-VL-Embedding を選ぶ（記事の記述による）
- スキャン PDF を扱いたければ、データソースの設定で OCR を有効にする（記事の記述による）
- Worker からインスタンスを呼び出すコードの書き方（`ai_search_namespaces` バインディングと `search()`）は、[前身の記事のコード例](./2026-08-06-ai-search-easier.md)を参照

## ユースケース

- **画像を含むコレクションの検索**: 商品画像、スクリーンショット、チャート、図表などを、言葉・画像・その組み合わせで検索する。
- **スキャン文書の検索**: スキャンした PDF を OCR してから索引化し、テキスト検索の対象にする。
- **大きめのドキュメントの取り込み**: 4 MiB を超える、10 MiB までの Markdown・HTML・CSV・JSON・PDF をそのまま取り込む。
- **コスト見積もりを前提にした運用**: 取り込み・ストレージ・クエリの 3 軸で月額を事前に見積もり、無料枠の範囲内で小規模に始める。
- **既存の AI Search 利用者の移行判断**: 課金開始日（2026-11-01）とクエリ無料枠の分割を踏まえ、利用量を確認する。

## 所感・ポイント

- 今回の GA は「機能を足す」より「画像・スキャン PDF・大きなファイルといった、検索から漏れていたものを拾う」改善と、「料金を確定する」発表の 2 本立てと捉えると整理しやすい。
- キャプション方式を捨てず、ネイティブ埋め込みと併用する設計が特徴的。キャプションは人間にも読めるテキストの理解に、ネイティブ埋め込みはキャプションが捉えない視覚的な細部に効く、という役割分担になっている。
- テキスト専用の埋め込みモデルでも画像クエリが使える（ToMarkdown でキャプション化する）ため、モデルを変えずに試せる。ただし視覚情報のフル活用にはネイティブ対応モデルが必要。
- 無料枠の変更（共有 2,000 → セマンティック 1,000 ＋ フルテキスト 1,000）は、フルテキスト検索を多用するワークロードの見積もりに影響しうる。
- 本記事の中心機能は設定（埋め込みモデルの選択・OCR の有効化）で、Worker のコードで体験できる固有の API は記事に示されていない。前身の記事の `examples/ai-search-easier/` と重複するため、本記事用のデプロイ可能なサンプルは作成していない（サンプル対象外）。

> **サンプル対象外**: 記事にコード例・新しい API が示されておらず、画像クエリの呼び出し方を記事から確認できないため、`examples/` は追加していない。Worker からの検索の基本形は [examples/ai-search-easier/](../../examples/ai-search-easier/) を参照。

## 関連リンク

- [前身の記事: Cloudflare AI Search: エージェントにあなたのデータのための検索エンジンを](./2026-08-06-ai-search-easier.md)
- [Agents Week 2026 まとめ](./2026-08-10-agents-week-review.md)
- [Workers サンプル（前身記事）: examples/ai-search-easier/](../../examples/ai-search-easier/)
- [AI Search 開発者ドキュメント](https://developers.cloudflare.com/ai-search/)
- [対応する埋め込みモデル](https://developers.cloudflare.com/ai-search/configuration/models/supported-models/#embedding)
- [画像と OCR の設定](https://developers.cloudflare.com/ai-search/configuration/data-source/#images-and-optical-character-recognition)
- [ファイルの上限](https://developers.cloudflare.com/ai-search/configuration/data-source/#file-limits)
- [AI Search の料金と制限](https://developers.cloudflare.com/ai-search/platform/limits-pricing/)
- [Matryoshka Representation Learning（論文）](https://arxiv.org/abs/2205.13147)
- [Qwen3-VL-Embedding（GitHub）](https://github.com/QwenLM/Qwen3-VL-Embedding)
