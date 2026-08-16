# Cloudflare OS：エージェント、アプリ、作業のためのオープンプラットフォーム

- 原文: [https://blog.cloudflare.com/ja-jp/cloudflare-os/](https://blog.cloudflare.com/ja-jp/cloudflare-os/)（英語版: [https://blog.cloudflare.com/cloudflare-os/](https://blog.cloudflare.com/cloudflare-os/)）
- 公開日: 2026-08-05
- 関連: [Cloudflare OSで、Cloudflareの働き方を再構築する（CIO Sam Rhea視点）](2026-08-05-how-we-use-ai-with-cloudflare-os.md)、[WriteGuard: MCPサーバーのためのきめ細かな制御機能](2026-08-05-mcp-portal-writeguard-private-beta.md)
- GitHub: [docs/articles/2026-08-05-cloudflare-os.md](https://github.com/syumai/cloudflare-blog-summaries/blob/main/docs/articles/2026-08-05-cloudflare-os.md)

![記事ヘッダー画像](https://blog.cloudflare.com/_emdash/api/media/file/01KZ7PDXE4XKZZQV409JNYTS85.png)
*図: 記事ヘッダー画像（出典: Cloudflare Blog https://blog.cloudflare.com/ja-jp/cloudflare-os/）*

## TL;DR

- Cloudflareは、社員が自社の知識・業務フローを活用しながらアプリ開発・業務自動化・社内システムへの安全なアクセスを行える社内プラットフォーム「Cloudflare OS」を、オープンソースとして公開した。
- 今年5月に全社員へ展開して以来、数千人が日常的に利用している。
- 構成要素は「エージェントワークスペース」「新しいセキュリティ・ガバナンス基盤（Gatekeeper）」「個人向けアプリのプラットフォーム」の3つ。
- エージェントは最初はどのアクセス権も持たず、必要なリソースへのアクセスを要求し、管理者の許可を経て、型付きバインディングとしてコードに渡される。
- Gatekeeperは、エージェントが「参照した情報」を記録し、その後の共有・公開・外部送信を、参照元データへのアクセス権に応じて制御する。
- 作成されたアプリはすべて、Dynamic Worker上で動くDurable Object Facetとして、専用のSQLiteデータベースを持つフルスタックアプリケーションになる。
- コアリポジトリ`cloudflare-os`とサンプルデプロイメント`cloudflare-os-starter`の2つがGitHubで公開されており、自社のCloudflareアカウントに構築・カスタマイズできる。

## 背景・課題

すべての組織には、代々受け継がれてきた独自の用語・業務手順・システム・ルール・仕事の進め方が存在する。プログラムコードは「動くか動かないか」で成果が明確に判断できるため、ここ数年でエージェントへのフィードバックを通じて「動作するコード」を書けるようになってきた。しかし、開発者以外の仕事も含めて組織全体で同じようにAIを活用するのは、はるかに難しい課題である。エージェントが組織全体で活躍するには、その会社固有の事情や知識を理解し、社員が業務で使っているシステムにアクセスでき、そこで得た知識・権限を使って組織の目的達成につながる仕事を実行できなければならない。

Cloudflareは今年5月に最初のバージョンのCloudflare OSを全社員へ展開したが、そこにはいくつかの課題があった。

**技術的課題**: アプリが静的で社内システムとリアルタイムに連携しない、同じ定型作業のたびにAIエージェントを再実行しなければならずトークン消費が積み重なる、といった課題があった。

**セキュリティ上の課題**: より根本的な問題は、社員同士がワークスペースやアプリ、成果物を共有し始めたときに表面化した。MCPサーバーへのアクセスによって「どのツールを使えるか」は分かるが、そのツールを通じてエージェントが「実際にどの情報・データを見たのか」までは管理できなかった。そのため、権限のない情報が共有を通じて誤って別の人に見えてしまう可能性があった。

これらを踏まえ、Cloudflareはセキュリティをアプリ制作者やエージェント利用者任せにせず、プラットフォーム自体に組み込む方針でCloudflare OSを新しい基盤の上に作り直した。

## 発表内容 / アーキテクチャ

Cloudflare OSは、ブラウザ上での会話から始まる点は多くのAIツールと同じだが、すべての会話が組織が蓄積・整理した知識やスキルに基づいて行われる点が異なる。ワークスペースに目的を与えると、Cloudflare OSは会社が用意した知識と、組織が既に使っているツール・データを活用しながら、その目的の達成に向けて作業を進める。

![Cloudflare OSの3つの構成要素](https://blog.cloudflare.com/_emdash/api/media/file/01KZ7PDY68A0TND85MN4AZCF3G.png)
*図: Cloudflare OSの3つの構成要素（出典: Cloudflare Blog https://blog.cloudflare.com/ja-jp/cloudflare-os/）*

Cloudflare OSは以下の3つの構成要素からなる。

1. **エージェントワークスペース**: 会社が整理した知識・スキルを基盤に動作するAIエージェントの作業環境。エージェントは隔離された実行環境の中でコードを書いたり実行したりできる。
2. **新しいセキュリティ・ガバナンス基盤**: 社内データやサービスへ安全にアクセスするための仕組み（後述のGatekeeper）。
3. **個人向けアプリのプラットフォーム**: 社員が作成・共有・継続的に変更できるアプリケーション環境。

### エージェントワークスペース

ワークスペースは、開発者知識やターミナル操作の知識がなくても、組織内の誰もがブラウザ上で利用できるように設計されている。「エージェントとのセッション」「ステータスの永続保持」「出力とファイル」「各種リソースへのアクセス」「エージェントがコードを書き・実行するための隔離実行環境」が統合されている。またワークスペースには、チームや会社が蓄積してきた知識・スキルがあらかじめ登録されているため、作業のたびに同じ業務手順や専門用語をゼロから説明し直す必要がない。

想定される使い方は多岐にわたる。

- **調査・質問への回答**: あるテーマの調査を依頼すると、エージェントは会社の知識と利用可能な社内リソースを使って調査する。必要な情報をすべてモデルの処理領域に読み込むのではなく、エージェント自身が検索・フィルタリング・結合・分析を行うコードを自分で書く。
- **ドキュメント・プレゼン資料・スプレッドシートの作成**: 調査結果をもとに成果物を作る。静的ファイルに限らず、元データに接続して情報源の更新に追随する成果物も作成でき、Google Driveなど馴染みのあるフォーマット・サービスへのエクスポートも可能。
- **チームで使える連携型アプリの作成**: ドキュメントやスプレッドシートでは不十分な場合、エージェントは独自のインターフェース・ロジック・状態管理を持つアプリを構築し、接続された社内リソースを利用しながら複数メンバーで共同利用できる。
- **決められた手順の自動実行ワークフロー**: すべての作業に完全なエージェント対話が必要なわけではない。あらかじめ決まった手順の流れをコードで処理し、判断が必要な部分だけモデルを使うことで、効率的かつ安定した処理を実現する。ワークフローは手動実行・スケジュール実行・接続システムのイベントトリガーのいずれでも起動できる。

システム連携は、Gatekeeperを通じたSoR（システムオブレコード）へのアクセス制御と、組織が既に使っているMCPサーバーをMCP Server Portal経由で連携する仕組みの2つによって支えられている。

### 新しいセキュリティ・ガバナンス基盤：Gatekeeper

社員が仕事でAIを使い始めるとまず求められるのが、社内システムに接続するためのAPIキーである。しかしAPIキーを社員やAIエージェントに直接渡すのは危険で、大規模運用には向かない。APIキーは広範囲かつ長期間有効なアクセス権を持つことが多く、利用範囲の制限・安全な共有・利用状況の監査が難しい。

MCPは、資格情報をサーバー側に保持し、エージェントには定義済みのツール一式のみを公開することで、より安全な社内システム利用の方法を提供する。しかし、エージェントが利用できる「ツール」を制御することは第一歩にすぎず、MCPだけでは、エージェントが実際にどのデータや情報を参照したのかまでは管理できない。エージェントは複数システムの情報を組み合わせたり、権限の弱い場所へ送ったり、成果物を通じて本来見る権限のない人に情報を公開してしまう可能性がある。承認は、取得したデータがその後どこへ流れうるかまで考慮する必要がある。

**エージェントはどのアクセス権も持たない状態から始まる**。Cloudflare Accessは、Cloudflare OSへアクセスできる人自体を制御する。Cloudflare OS内部では、すべてのエージェント・アプリは最初はどのアクセス権も持たない状態から開始する。エージェントは特定リソースへのアクセスを要求し、管理者がそれを許可・拒否する。許可されたリソースは、生成されたコードに型付きバインディング（typed binding）として渡される。

```typescript
const issues = await env.PROJECT.listIssues({
  teamId: "ENG",
  state: "open",
});
```

`env.PROJECT`は、特定のポリシーのもとで特定のリソースを利用する権限（capability）を表す。重要なのは、資格情報がエージェントや生成されたコードから完全に分離されている点である。サーバー側のコードは外部ネットワーク通信が無効化されたDynamic Worker上で実行され、クライアント側のコードはブラウザ内のサンドボックス化されたフレーム上で動作する。どちらも、明示的に許可された権限（capability）を経由しない限りインターネットへアクセスできない。

**Gatekeeperがリソースと操作を管理する**。Gatekeeperは、Cloudflare OSと外部サービスの間に配置されるサービス専用のWorkerで、対象サービスのAPI、管理対象リソース、実行可能な操作を理解している。

![Gatekeeperのアーキテクチャ図](https://blog.cloudflare.com/_emdash/api/media/file/01KZ7PDXZJ8CW8K5Y8DBCBACM7.png)
*図: Gatekeeperのアーキテクチャ（出典: Cloudflare Blog https://blog.cloudflare.com/ja-jp/cloudflare-os/）*

例えば、AIエージェントにGitHubアカウント全体へのアクセスを与えるのは広すぎる権限になりうる。Gatekeeperは、単一リポジトリのみのアクセス許可、Issueのみの読み取り許可（ソースコードへのアクセスは禁止）、特定フィールドのマスキング、レート制限の適用、Pull Requestのマージ前承認要求など、細かな権限制御を行える。AIエージェントやアプリから見えるのは小さなTypeScript APIだけで、Gatekeeperの側でOAuth認証の処理・認証情報の管理・アクセスルールの適用・読み取ったデータの記録を行い、外部に影響を与える操作（データ変更・公開処理など）が発生する場合はその操作自体を仲介・制御する。

**ポリシーは、エージェントが見た情報に基づいて適用される**。最初のデータ取得だけを制御すれば十分というわけではない。例えば、AIエージェントがデータウェアハウスの機密テーブルを読み取り、その情報でリアルタイムダッシュボードを作成した場合、そのダッシュボードの共有が「元のテーブル情報を本来アクセスできない人に共有する抜け道」になってはならない。Cloudflare OSは、エージェントが参照したすべてのリソースを記録し、この参照履歴をエージェントやその成果物に関連付けて保持する。別のユーザーがそのワークスペースを開いたり、成果物を閲覧しようとした場合、Gatekeeperがそのユーザーが参照元データへのアクセス権を持っているか確認する。同じ参照履歴は、エージェントが外部へリクエストを送信できる条件を決めるポリシーにも使われる。機密データを参照したエージェントは、その後の特定宛先への書き込み・新規コラボレーターの追加・別エージェントへの作業委任・外部リクエスト送信などを制限されうる。こうした制御はプラットフォーム自体が処理するため、利用者やアプリ制作者が毎回意識する必要はない。

### 個人向けアプリのプラットフォーム

多くの業務ツールでは、文書作成・表計算・プレゼン作成といった決められたアプリケーションが提供される。しかしCloudflare OSでは、1つ1つの「ファイル」自体が独立したアプリケーションになる。AIエージェントが個人・プロジェクト・チームの目的に合わせて作成するこれらのアプリは、単なるプロトタイプではなく、クライアントコード・サーバーコード・API・耐久性のある状態を備えたフルスタックアプリケーションである。初期状態は非公開だが、ドキュメントのように共有もできる。

**すべてのアプリはWorkerとして動作する**。ワークスペースにアプリ作成を依頼すると、AIエージェントはブラウザ上でUIを表示するクライアントコードと、状態を保存し処理・動作を実装するサーバーコードの2種類を作成する。サーバー側は必要なときにDynamic Workerとして読み込まれ、Durable Object Facetとして実行される（どちらもこのプロジェクトのためにCloudflareが開発した機能）。Durable Object Facetにより、各アプリはCloudflare OS本体の実行環境とは分離された専用のSQLiteデータベースを持てる。Dynamic Workersは軽量なV8アイソレートを使うため、すべてのアプリが専用サーバーやコンテナを必要とせず、それぞれ独立した実行環境を持つ。

![Worker/Durable Objectアーキテクチャ図](https://blog.cloudflare.com/_emdash/api/media/file/01KZ7PDXTESRQTCERH9MDPVGC3.png)
*図: アプリのWorker/Durable Objectアーキテクチャ（出典: Cloudflare Blog https://blog.cloudflare.com/ja-jp/cloudflare-os/）*

ブラウザ上のクライアントは、Cloudflareがオープンソース公開しているオブジェクト・ケーパビリティ方式のRPCシステム「Cap'n Web」を使ってサーバーと通信する。これにより、サーバー側メソッドを通常のJavaScript関数のようにクライアント側から呼び出せる。

```typescript
const issues = await app.listIssues({
 status: "done",
});
```

重要なのは、エージェントも同じメソッドを呼び出せるという点である。自分で仕事をするためのツールを構築できれば、エージェントは利用者が不在でもそのツールを使って同じ作業を実行できるようになる。

**アプリの共有方法は2通り**。「アプリ自体を共有する」（他のユーザーと同じ状態をリアルタイムで共同利用）と、「アプリの設計図（ブループリント）を共有する」（他のユーザーがアプリの複製を作成できるようにする）の2種類がある。

![アプリ共有方法の図](https://blog.cloudflare.com/_emdash/api/media/file/01KZ7PDXN0ZTW8DZZ0VC98Z0AP.png)
*図: アプリの共有方法（アプリ本体／ブループリント）（出典: Cloudflare Blog https://blog.cloudflare.com/ja-jp/cloudflare-os/）*

ブループリントから作成されたアプリに引き継がれるのは元のアプリのコードのみで、SQLiteデータベースの内容・会話履歴・資格情報・接続済みリソースは引き継がれない。そのため複製後のアプリはそれぞれ独立したデータ・設定を持つ状態で始まり、チームでアプリを共有しても、利用者はAIを使って自分用に自由に改変でき、機能追加のたびに開発者へ依頼する必要がなくなる。

### あらゆるAIモデルを利用でき、コストも管理できる

Cloudflare OSはさまざまなモデルと組み合わせて使える。AIモデルへのすべての推論リクエストはCloudflare AI Gatewayを経由するため、組織は利用できるAIモデルや、業務ごとにどのモデルを使うかを一元管理できる。

![AI Gatewayによるモデル管理図](https://blog.cloudflare.com/_emdash/api/media/file/01KZ7PDXTSXP67QP4M7F21B9V1.png)
*図: AI Gatewayによるモデル利用管理（出典: Cloudflare Blog https://blog.cloudflare.com/ja-jp/cloudflare-os/）*

すべての作業に最も高価なモデルが必要なわけではない（例えば毎朝の未読メール要約に最先端かつ最も高価なモデルを使う必要はない）。AI Gatewayは高価なモデルを本当に難しい業務にだけ使わせる制御を可能にする。また、すべての推論リクエストは実行したユーザー・チーム・ワークスペースに関連付けて記録されるため、管理者はAI推論のコストがどこで発生しているかを把握し、予算やレート制限、上限到達時の挙動を設定できる。

### オープンソース公開・カスタマイズ

Cloudflare OSは本日から利用可能で、オープンソースとして公開されている。自社のCloudflareアカウントにデプロイし、自社のAccessポリシー、AI Gatewayの設定、データ、連携機能を使って運用できる。Cloudflare OSは、コア部分を変更することなく、画面インターフェースのカスタマイズ、独自Gatekeeperの追加、組織固有機能の実装ができるように設計されている。

公開されたリポジトリは以下の2つ。

1. **コア**: [github.com/cloudflare/cloudflare-os](https://github.com/cloudflare/cloudflare-os)
2. **サンプルデプロイメント**: [github.com/cloudflare/cloudflare-os-starter](https://github.com/cloudflare/cloudflare-os-starter) — Cloudflare社内で実際に運用している構成をベースにしており、コア部分にパッチを当てずに、設定・独自UI・社内システム連携・分析機能・デプロイパイプラインなどを追加・管理するための土台になる。

戦略パートナーであるPresidioとHappy Cogは、各組織の業務・運用方法に合わせたCloudflare OSのカスタマイズと全社展開を支援し、スキル・ナレッジ整備、独自UI構築、GatekeeperやMCP Server Portalを通じた社内システム連携、セキュリティ・モデル・コスト管理の設定などを提供する。

## コード例

記事では、Gatekeeper経由でリソースを型付きバインディングとして受け取るコード例（SoRへのアクセス）と、Cap'n Web RPCによるアプリ間呼び出しのコード例の2本が示されている。いずれも短いスニペットだが、Cloudflare OSの権限モデルの核心を表している。

**型付きバインディングとしてのリソースアクセス**（「エージェントはどのアクセス権も持たない状態から始まります」セクション）:

```typescript
const issues = await env.PROJECT.listIssues({
  teamId: "ENG",
  state: "open",
});
```

`env.PROJECT`は、Gatekeeperが発行する「特定ポリシー下で特定リソースを扱う権限（capability）」を表すオブジェクトである。生のAPIキーや資格情報がコード側に直接渡ることはなく、エージェントが生成したコードもこのcapabilityを経由してしかリソースへアクセスできない。

**Cap'n Web RPCによるアプリ呼び出し**（「すべてのアプリはWorkerとして動作する」セクション）:

```typescript
const issues = await app.listIssues({
 status: "done",
});
```

こちらはアプリのクライアントコードからサーバー側メソッドを呼び出す例で、サーバー側メソッドを通常のJavaScript関数のように呼べる。ポイントは、この同じメソッドをAIエージェントも呼び出せるということで、「自分が使うために作ったツールを、エージェントが不在時に代行できる」という設計思想を体現している。

## ユースケース

### 調査・質問への回答

会社の知識と利用可能な社内リソースを使ってエージェントが調査を行う。必要な情報をすべてモデルへ読み込むのではなく、エージェント自身が検索・フィルタリング・結合・分析のコードを書く点が特徴。

### ドキュメント・プレゼン資料・スプレッドシートの作成

調査結果を元データに接続したまま成果物にでき、情報源の更新に追随する。Google Driveなど既存フォーマットへのエクスポートにも対応。

### チームで使う連携型アプリの作成

ドキュメントでは足りない場合、独自インターフェース・ロジック・状態を持つアプリをエージェントが構築し、社内リソースに接続したまま複数人で共同利用する。

### 決まった手順のワークフロー自動化

固定的な処理はコードに、判断が必要な部分だけモデルに任せることで、効率的かつ安定した自動化を実現する。手動・スケジュール・イベントトリガーいずれでも起動可能。

## 所感・ポイント

- 「エージェントは最初はどのアクセス権も持たない」という設計は、Zero Trustの発想をAIエージェントの権限モデルにそのまま持ち込んだものであり、APIキーの直接共有という従来の危険なパターンからの明確な転換点として読める。
- Gatekeeperが「最初のデータ取得」だけでなく「その後の共有・公開・外部送信」まで、参照履歴に基づいて制御するという発想は、生成AI活用における情報漏えいリスクへの実務的な回答になっている。
- アプリがすべてDynamic Worker + Durable Object Facetという軽量な実行単位として動く設計は、[@cloudflare/computer](2026-08-03-cloudflare-computer.md)で語られていた「アイソレート優先・専用サーバー不要」という思想と地続きであり、Cloudflareの製品群全体を貫く一貫したアーキテクチャ思想が見て取れる。
- 同時公開されたCIO Sam Rhea氏の一人称記事「[Cloudflare OSで、Cloudflareの働き方を再構築する](2026-08-05-how-we-use-ai-with-cloudflare-os.md)」を合わせて読むと、本記事のGatekeeperやAI Gatewayが実際の社内業務でどう機能しているかの具体例（ITヘルプデスクのレポート自動化など）がよく分かる。

> **Workers サンプル**: 対象外（中心機能であるGatekeeper・Dynamic Worker・Durable Object Facetを組み合わせた社内プラットフォーム全体は、100行前後の最小実装では要点を再現できないため）。個別要素のCap'n Web RPCやAI Gateway経由の推論は他記事のサンプル（例: [examples/workers-ai-gateway-unification/](../../examples/workers-ai-gateway-unification/)）で扱っている。

## 関連リンク

- [Cloudflare OS（ホーム）](https://os.cloudflare.app/)
- [Cloudflare OSで、Cloudflareの働き方を再構築する（CIO Sam Rhea視点の記事）](2026-08-05-how-we-use-ai-with-cloudflare-os.md)
- [Model Context Protocol（MCP）公式](https://modelcontextprotocol.io/docs/2026-07-28/getting-started/intro)
- [MCP Server Portal](https://developers.cloudflare.com/cloudflare-one/access-controls/ai-controls/mcp-portals/)
- [Cloudflare Access](https://developers.cloudflare.com/cloudflare-one/access-controls/)
- [Dynamic Workers ドキュメント](https://developers.cloudflare.com/workers/)
- [Cap'n Web（GitHub）](https://github.com/cloudflare/capnweb)
- [Cloudflare AI Gateway](https://developers.cloudflare.com/ai-gateway/)
- [cloudflare-os（GitHubリポジトリ、コア）](https://github.com/cloudflare/cloudflare-os)
- [cloudflare-os-starter（サンプルデプロイメント）](https://github.com/cloudflare/cloudflare-os-starter)
- [Cloudflare OS Interest Landing Page](https://www.cloudflare.com/resource/cloudflare-os-interest-landing-page/)

---

※本文中で「ポリシーは、エージェントが見た情報に基づいて適用される」節の画像として原文に掲載されていた図（データフロー図）は、確認時点でURLが404となり参照できなかった。該当箇所は本文の説明のみで構成している。
