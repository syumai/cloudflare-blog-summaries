# 平易な言葉でインターネットデータを探索するAIツール「Radar Researcher」のご紹介

- 原文: [https://blog.cloudflare.com/introducing-radar-researcher/](https://blog.cloudflare.com/introducing-radar-researcher/)（日本語版なし）
- 公開日: 2026-08-07
- GitHub: [docs/articles/2026-08-07-introducing-radar-researcher.md](https://github.com/syumai/cloudflare-blog-summaries/blob/main/docs/articles/2026-08-07-introducing-radar-researcher.md)

![Radar Researcherヘッダー画像](https://blog.cloudflare.com/_emdash/api/media/file/01KZCGV8J1HF1P5HPSDNRYWTR7.png)
*図: 記事ヘッダー画像（出典: Cloudflare Blog https://blog.cloudflare.com/ja-jp/introducing-radar-researcher/）*

## TL;DR

- [Cloudflare Radar](https://radar.cloudflare.com) は2020年の立ち上げ以来、インターネットトラフィックに関するグローバルな洞察を無償で公開してきた。利用者は人権活動家からネットワーク運用者、初心者まで幅広い。
- しかし、Radarが扱う複雑なデータセットを使いこなすには一定の専門知識が必要で、この「専門知識の壁」がデータへのアクセスを妨げていた。
- Cloudflareはこの壁を下げるため、自然言語でRadarのデータを問い合わせ、実際のインタラクティブなチャートとともに回答を返すAIツール「**Radar Researcher**」を発表した。
- Radar Researcherは、言語モデルが生の数値を直接出力するのではなく、Radar APIのエンドポイントを参照する「チャート仕様」を発行し、フロントエンドがそれを実データで描画する設計になっている。
- 実装は Cloudflare Agents SDK・Durable Objects・Workers AI・AI Gateway・Cloudflare MCP server・Code Mode といった、Cloudflareの各種プロダクトを組み合わせて構築されている。

## 背景・課題

Cloudflare Radarは、Cloudflareのネットワークを流れる膨大なトラフィックをもとに、インターネットの利用状況・障害・攻撃傾向などを可視化して無償公開してきたプロダクトである。この6年間でRadarチームは、複雑なデータセットを誰にでも分かりやすく、かつ信頼できる形で可視化する取り組みを続けてきた。

一方で、Radarの利用者層は非常に幅広い。ネットワーク運用の専門家やセキュリティ研究者だけでなく、ジャーナリストや人権活動家、統計に不慣れな一般の関心層まで、多様なユーザーが同じデータセットにアクセスしようとする。しかし「どのAPIエンドポイントを使えばよいか」「どのパラメータを組み合わせれば知りたい問いに答えられるか」といった判断には一定の専門知識が要求され、これが実質的なアクセスの壁になっていた。

記事はこの壁について、AIツールが専門知識の障壁を引き下げ、これまでデータへのアクセスにおいて「門番（ゲートキーパー）」の役割を担っていた専門家を、非専門家にとっての「協力者」に変えうる、という視点を示している。Radar Researcherは、この発想を具体的な製品として実装したものである。

## 発表内容 / アーキテクチャ

### Radar Researcherとは何か

Radar Researcherは、Radar APIを土台として構築された、自然言語でインターネットデータにアクセスするためのAIチャットツールである。Radarのダッシュボード上の「Researcher」ボタンから起動できる。

![Researcherボタン](https://blog.cloudflare.com/_emdash/api/media/file/01KZCGV8CGKHH0H5K32A9HXB9C.png)
*図: Radarダッシュボード上のResearcherボタン（出典: Cloudflare Blog https://blog.cloudflare.com/ja-jp/introducing-radar-researcher/）*

主な機能は次のとおりである。

- 平文（プレーンテキスト）での回答と、実データに基づくインタラクティブなチャートを同時に提示する
- 回答の深さを「簡潔な要約」と「詳細なレポート」から選べる
- 会話の流れに応じて、関連する追加の質問候補を提案する
- 会話履歴を検索・共有できる
- LLMがどのような推論・データ取得を経て回答に至ったかを、後から監査（確認）できる

![Radar RechercherのUIデモ](https://blog.cloudflare.com/_emdash/api/media/file/01KZCGV8V7BER6V3SV5M412R6R.png)
*図: Radar ResearcherのUIデモ（出典: Cloudflare Blog https://blog.cloudflare.com/ja-jp/introducing-radar-researcher/）*

### 既存のチャートを会話に変える（Explain with AI）

Radar Researcherは、ゼロから質問を組み立てる用途だけでなく、Radar上ですでに表示されているチャートを起点にした対話にも対応する。各チャートに用意された「Explain with AI」アクションを使うと、そのチャートを話題にした会話がその場で始まる。

このとき裏側では、(1) チャートのスクリーンショット、(2) API から取得した生データ、(3) 現在表示中のビューのパラメータ（対象国・期間などの条件）という3種類の情報がまとめてモデルに渡される。単なる画像認識ではなく、実データと表示条件を突き合わせた上で説明を組み立てられる点が特徴である。

![Explain with AIアクション](https://blog.cloudflare.com/_emdash/api/media/file/01KZCGV8C36Q2QXHDPGR9ZP8HT.png)
*図: チャートから「Explain with AI」で会話を開始する例（出典: Cloudflare Blog https://blog.cloudflare.com/ja-jp/introducing-radar-researcher/）*

![チャート説明の例](https://blog.cloudflare.com/_emdash/api/media/file/01KZCGV8R46TFB08XZ4T2PG0QM.png)
*図: Radar Researcherによるチャート説明の応答例（出典: Cloudflare Blog https://blog.cloudflare.com/ja-jp/introducing-radar-researcher/）*

### 内部アーキテクチャ（How we built it）

Radar Researcherは、Cloudflareの各種プロダクトを組み合わせて構築されている。

- **コア**: [Cloudflare Agents SDK](https://agents.cloudflare.com/) を実行する Cloudflare Worker
- **状態管理**: [Durable Objects](https://www.cloudflare.com/products/durable-objects/) を使い、会話履歴をSQLiteに保存してステートフルに管理する
- **推論エンジン**: [Workers AI](https://www.cloudflare.com/products/workers-ai/) 上で、Kimi K2.7などの[オープンモデル](https://developers.cloudflare.com/workers-ai/models/)を実行する
- **フォールバック**: あるモデルが失敗・過負荷の場合に、別のモデルファミリーへとカスケードして切り替える
- **ルーティング**: [AI Gateway](https://www.cloudflare.com/products/ai-gateway/) を経由させることで、ロギング・コスト追跡・安全性の担保をまとめて行う

データ取得の経路には [Cloudflare MCP server](https://github.com/cloudflare/mcp) と [Code Mode](https://blog.cloudflare.com/code-mode-mcp) を利用しており、Radar APIのOpenAPI仕様から、質問内容に応じた適切なエンドポイントを自動的に検索・選択する仕組みになっている。

![アーキテクチャ図](https://blog.cloudflare.com/_emdash/api/media/file/01KZCGV8QFJNCYQPD2FV56JEB6.png)
*図: Radar Researcherの内部アーキテクチャ（出典: Cloudflare Blog https://blog.cloudflare.com/ja-jp/introducing-radar-researcher/）*

### 細かい工夫（A few small touches）

- 会話タイトルや関連質問候補の生成には、応答本体とは別に小型・高速なモデルを使う
- 現在の日時や、リクエスト元の接続情報（どこからアクセスしているかなど）をコンテキストとしてモデルに渡す
- 会話を共有する機能は [R2](https://www.cloudflare.com/products/r2/) を使って保存されている

### エージェント時代を見据えた対応（Powered by agents — and ready for them）

Radar Researcher自身がAIエージェントとして動作するだけでなく、Radar自体を外部のブラウザエージェントから直接操作できるよう、[WebMCP](https://webmachinelearning.github.io/webmcp/) 標準への対応も行っている。

- **命令的（imperative）API**: JavaScriptでツールとして明示的に登録する方式
- **宣言的（declarative）API**: 既存のHTML構造をそのままツールとして解釈させる方式

この対応は、Radarを「エージェントにとって使いやすいサイト」にするという [Agent-ready](https://blog.cloudflare.com/agent-readiness/) の取り組みの一環でもあり、実際に [Agent readiness check](https://isitagentready.com/radar.cloudflare.com) でRadarのエージェント対応状況を確認できる。

## コード例

Radar Researcherの応答生成では、言語モデルは基本的にMarkdownでテキスト回答を組み立てる。しかし、グラフとして提示すべき数値データについては、モデルが数値そのものを本文に埋め込むのではなく、Radar APIのパスを参照する「チャート仕様」の専用ブロックを発行する設計になっている。

````
```radar-chart
{ "type": "speedFlower", "title": "Internet speed quality — Portugal", "dataFrom": "/radar/quality/speed/summary?location=PT" }
```
````

この `radar-chart` ブロックは、Markdown内のコードフェンスとして出力される点は通常のMarkdownと同じだが、フロントエンド側がこれを検出すると、`dataFrom` に書かれたAPIパス（この例では `/radar/quality/speed/summary?location=PT`、ポルトガルのインターネット速度品質サマリー）に対して実際にリクエストを送り、その場でインタラクティブなチャートとして描画する。

この設計の意図は次のように整理できる。

- モデルが数値を「記憶」や「推測」で書き出すことによる誤り（ハルシネーション）を避けられる。数値は常に実データから取得される。
- `type`（チャートの種類）や `title` はモデルが文脈に応じて選ぶが、実際のデータ取得はAPI呼び出しに委ねられるため、常に最新の値が反映される。
- 結果として得られるのは静的な画像ではなく、Radar本体の他のチャートと同様に操作可能なインタラクティブなチャートになる。

## ユースケース

### ユースケース1: ポルトガルのインターネット品質を調べる

「ポルトガルのインターネット品質はどうなっていますか」といった平文の質問を投げると、Radar Researcherが対応する[インターネット品質API](https://developers.cloudflare.com/api/resources/radar)を自動的に照会し、対話的なチャートとともに回答する。ユーザーはAPIのエンドポイント名やパラメータを一切意識する必要がない。

![ポルトガルのインターネット品質質問例](https://blog.cloudflare.com/_emdash/api/media/file/01KZCGV8FHJFVTRA14X5JTMK6R.png)
*図: 「ポルトガルのインターネット品質は？」という質問に対するRadar Researcherの応答例（出典: Cloudflare Blog https://blog.cloudflare.com/ja-jp/introducing-radar-researcher/）*

### ユースケース2: インターネット遮断の調査

2026年初頭に発生した、イラン政府によるインターネット遮断を題材にした例も紹介されている。「遮断中にイランのインターネットトラフィックに何が起きたか」という質問に対して、Radar Researcherは複数のデータビュー（トラフィック推移など）を自動的に集約し、時系列に沿って何が起きたかを説明する。単一のAPI呼び出しでは終わらない、複数のデータソースを横断した調査に対応している点が特徴である。

![イランのインターネット遮断調査例](https://blog.cloudflare.com/_emdash/api/media/file/01KZCGV8H47VKY4CQSX6RVK88Q.png)
*図: イランのインターネット遮断について調査するRadar Researcherの応答例（出典: Cloudflare Blog https://blog.cloudflare.com/ja-jp/introducing-radar-researcher/）*

### ユースケース3: 既存のチャートを深掘りする対話の起点にする

Radar上で普段からチェックしているチャートについて「これはなぜこの形なのか」「他の地域と比べてどうか」と深掘りしたい場合、ゼロから質問を書く代わりに、そのチャートの「Explain with AI」から会話を始められる。チャートのスクリーンショット・生データ・表示条件（対象国や期間）がまとめてモデルに渡されるため、いま見ている画面そのものを踏まえた説明・追加の掘り下げが可能になる。

## 所感・ポイント

- 本記事の核心は、「専門家しか使えなかったAPIを、モデルが仲介役になって誰でも扱えるようにする」という発想を、Radarという実データを持つ製品の上で具体化した点にある。単なるチャットボットではなく、モデルの出力を実データに紐づけるチャート仕様（`radar-chart`）という中間表現を設けているのが工夫どころだと感じる。
- 数値をモデルに直接生成させず、API参照を発行させてフロントエンドで解決する設計は、LLMを使った可視化ツール全般に応用が利く考え方である。ハルシネーション対策として汎用性が高い。
- Cloudflare MCP serverとCode ModeによるAPIエンドポイントの自動検索は、OpenAPI仕様さえ整備されていれば同様の仕組みを他のAPI群にも展開できることを示唆している。自社プロダクトのAPIに対話型インターフェースを追加したい開発者にとって参考になる構成である。
- WebMCPへの対応は、Radar自体を「人間が読むページ」から「エージェントが操作できるページ」へ広げる試みであり、Radar Researcherの内部だけでなく、Radarというサイト全体のエージェント対応方針とセットで捉えると理解しやすい。

> **Workers サンプル**: [examples/introducing-radar-researcher/](../../examples/introducing-radar-researcher/) — LLMに数値を書かせず `radar-chart` 仕様（APIパス参照）を発行させ、実データはAPI呼び出しで取得するという、ハルシネーション対策の核心部分だけを再現した最小Worker。

## 関連リンク

- [Cloudflare Radar](https://radar.cloudflare.com)
- [Radar Researcher（ライブ版）](https://radar.cloudflare.com/?showResearcher=true)
- [Agents Week](https://blog.cloudflare.com/agents-week-welcome/)
- [1.1.1.1](https://one.one.one.one/)
- [Cloudflare Speed Test](https://speed.cloudflare.com/)
- [Radar API ドキュメント](https://developers.cloudflare.com/api/resources/radar)
- [2026 FIFA World Cup とインターネットトラフィック](https://blog.cloudflare.com/2026-world-cup-internet-traffic/)
- [ポルトガルのインターネット品質（Radar）](https://radar.cloudflare.com/quality/pt#connection-quality)
- [イランのインターネット遮断（一部回復）についての記事](https://blog.cloudflare.com/iran-internet-partially-restored-may-2026/)
- [Cloudflare Agents SDK](https://agents.cloudflare.com/)
- [Durable Objects](https://www.cloudflare.com/products/durable-objects/)
- [Workers AI](https://www.cloudflare.com/products/workers-ai/)
- [Workers AIのオープンモデル一覧](https://developers.cloudflare.com/workers-ai/models/)
- [AI Gateway](https://www.cloudflare.com/products/ai-gateway/)
- [Cloudflare MCP server（GitHub）](https://github.com/cloudflare/mcp)
- [Code Mode MCP](https://blog.cloudflare.com/code-mode-mcp)
- [Radar URL Scanner](https://radar.cloudflare.com/scan)
- [Agent-ready の取り組みについて](https://blog.cloudflare.com/agent-readiness/)
- [Agent readiness check（radar.cloudflare.com）](https://isitagentready.com/radar.cloudflare.com)
- [Radar IPページ](https://radar.cloudflare.com/ip)
- [R2](https://www.cloudflare.com/products/r2/)
- [WebMCP](https://webmachinelearning.github.io/webmcp/)
