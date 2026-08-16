# WriteGuard: MCPサーバーのためのきめ細かな制御機能

- 原文: [https://blog.cloudflare.com/mcp-portal-writeguard-private-beta/](https://blog.cloudflare.com/mcp-portal-writeguard-private-beta/)（日本語版なし）
- 著者: Scott Roe-Meschke, Kenny Johnson
- 公開日: 2026-08-05
- 関連: [Cloudflare OS：エージェント、アプリ、作業のためのオープンプラットフォーム](2026-08-05-cloudflare-os.md)
- GitHub: [docs/articles/2026-08-05-mcp-portal-writeguard-private-beta.md](https://github.com/syumai/cloudflare-blog-summaries/blob/main/docs/articles/2026-08-05-mcp-portal-writeguard-private-beta.md)

![記事ヘッダー画像](https://blog.cloudflare.com/_emdash/api/media/file/01KZ7CJ0VE6ERSW1KPEN5DGYJX.png)
*図: 記事ヘッダー画像（出典: Cloudflare Blog https://blog.cloudflare.com/mcp-portal-writeguard-private-beta/）*

## TL;DR

- CloudflareがMCPサーバー向けのきめ細かな制御レイヤー「**WriteGuard**」を、Cloudflare MCPサーバーポータルを通じたプライベートベータで提供開始した。
- WriteGuardは、ツールごとに設定した「リスク層（Risk Tier）」に基づいて、呼び出しをそのまま通す・エージェント帰属情報を付与した上で監査ログに記録する・実行前にブロックする、のいずれかを判断する共有ポリシー層である。
- Cloudflare社内では27のMCPサーバーがポータルに接続されており、読み取り専用ツールに加えて「書き込みを伴うツール」の需要が急増したことが、WriteGuard開発の背景にある。
- エージェントはあくまで人間（従業員）の権限で動作させる方針を維持しつつ、WriteGuardがMCPクライアントとセッションのコンテキストを人間のアイデンティティに紐付け、「誰に代わって動いているエージェントか」を可視化する。
- GitLab MCPサーバーの`get_merge_request`（読み取り専用）、`create_mr_note`（書き込み・帰属付与）、`merge_mr`（重大操作・ブロック）という3つのツールを例に、リスク層ごとの挙動が具体的に示されている。

## 背景・課題

記事は「Endlessly Closing Tickets（無限に閉じられるチケット）」という架空のシナリオから始まる。エンジニアのJoeが数千件のチケットを自動的に閉じてしまうという事例だが、実際にはJoeの背後で複数の自動エージェントが3つの同時セッションで動いており、「少し広すぎる」クリーンアップタスクのプロンプトが原因だった。記事はこの種の問題の深刻さについて、「エージェントが契約ソフトウェアにアクセスできれば契約を書き換えてしまうかもしれず、サポートキューで混乱を起こすエージェントは数百件の顧客への返信を送信し、データベースアクセス権を持つエージェントはテーブル全体を削除してしまう可能性がある」と述べている（実際に外部でAIエージェントが本番データベースを削除してしまった事例も記事中でリンクされている）。

Cloudflareは「全従業員がすべてのエージェントを完璧に設定し、すべてのツール呼び出しを監視し続けることに依存することはできない」と判断し、WriteGuardを構築した。

MCP（Model Context Protocol）は、AIアプリケーションを外部ツール・データソースに接続するための標準である。MCPサーバーはクライアントが使えるツールを提供し、各ツールは「名前・説明・入力スキーマ・実際の作業を行うハンドラー」を持つ。エージェントがツールを選ぶと、MCPクライアントはツール呼び出しをサーバーに送り、サーバーがダウンストリームのアプリケーションと連携する。

MCPはCloudflareの内部エージェントを支えるインフラの重要な部分になっている。これらのエージェントは、OpenCodeやCloudflare OSといったローカルクライアントを通じてMCPを利用するほか、長時間実行されるエージェントサービスからも利用される。サーバーはCloudflare Accessの背後で稼働し、単一の内部MCPサーバーポータルを通じて接続される。Cloudflareが4月に「内部AI工学スタック」を紹介した時点でポータルが接続していたMCPサーバーは13個だったが、現在は27個に増え、各チームが毎月さらに多くのサーバーを提供している。

すべては読み取り専用サーバーとして始まり、Jira・GitLab・ウィキ・運用システムを検索できるようにするところからスタートした。しかしモデルの改善とAI体験の向上に伴い、エンジニアリング・プロダクト・デザイン・セールス・カスタマーサクセスなど各部門の従業員から「アクションを実行できるツール」への要望が増えていった。「無限に閉じられるチケット」のようなケースを避けるため、Cloudflareには以下が必要だった。

- エージェントが実行できる書き込みアクションの一元的な制御
- ダウンストリームアプリケーション上に表示されるエージェントのラベル（帰属表示）
- エージェントの活動を調査しやすくする監査証跡

なお、スキルやプロンプトエンジニアリングといったクライアント側の制御には頼れない。これらの挙動はハーネスによって異なり、ユーザー側で無効化することもできるためである。

## 発表内容 / アーキテクチャ

### WriteGuardとは

WriteGuardは「共有ポリシー、帰属、および監査層」である。各ツールの構成とリクエストのコンテキストを使って、何が起きるべきかを判断する。WriteGuardは以下のいずれかを実行できる。

- 呼び出しをそのまま通す
- サポートされた書き込みにエージェント帰属情報を付与し、スクラブ（機密情報除去）された監査イベントを生成する
- ハンドラーが実行される前にアクションをブロックする

![WriteGuardの位置付けを示すMCPアーキテクチャ図](https://blog.cloudflare.com/_emdash/api/media/file/01KZ9329Z2GK7CVX8PNC84Z1RA.png)
*図: Cloudflareの内部MCPアーキテクチャにおけるWriteGuardの位置（出典: Cloudflare Blog https://blog.cloudflare.com/mcp-portal-writeguard-private-beta/）*

WriteGuardは、ツールポリシーと人間/エージェントの識別情報、ダウンストリームへの帰属表示、そして一元化された監査を組み合わせ、エージェント操作を制御し理解するために必要なコンテキストを保持する単一の場所を提供する。

### 呼び出し可能なツールから統治可能なアクションへ

WriteGuardでは、基盤となるMCPサーバー自体を変更することなく、ツールごとにポリシーを定義できる。すべてのツールには「リスク層（Risk Tier）」「有効／無効の状態」「ラベリング構成」が与えられる。リスク層によって、アクションがログされるか、ツール呼び出しが許可されるかが決まり、リスク層ごとに監査ログをクエリできる。ラベリング機能は、エージェント帰属ラベルを挿入し、MCPサーバー自体にコード変更を加えることなくダウンストリームアプリケーションに最適なテキスト形式を使えるようにする。

| リスク層 | 例 |
|---|---|
| Read Only（読み取り専用） | 問題を検索、マージリクエスト（MR）を読む、パイプラインステータスを表示（例: `get_merge_request`） |
| Minimal Impact（軽微な影響） | リアクションを追加、通知を既読にする、問題を購読 |
| Contained Write（限定的な書き込み） | コメントを追加、MRを作成、問題フィールドを更新（例: `create_mr_note`） |
| Critical（重大） | MRをマージ、本番環境デプロイをトリガー、レコードを一括削除（例: `merge_mr`） |

構成は次のような形でツールに紐付けられる。

```typescript
const sendEmailTool = {
  tool: EmailMCP.sendEmailTool,
  writeGuard: {
    riskLevel: RiskLevel.CONTAINED_WRITE,
    enabled: true,
    labeling: {
      field: "body",
      supportedFormats: [
        LabelFormat.PLAIN_TEXT,
        LabelFormat.HTML,
      ],
    },
  },
};
```

現在この構成はCloudflare内部のMCPモノレポ内でTypeScriptとして定義されている。プライベートベータが今後数か月かけて展開されるにつれ、サーバー所有者はCloudflare MCPサーバーポータルを通じて同じポリシーを構成できるようになる。すべてのMCPサーバーには、ベースラインのアクセスポリシーと、個々のツール向けのWriteGuard制御の両方が含まれる。

### 人間を維持し、エージェントを追加する

Cloudflareの内部MCPサーバーは、Cloudflare AccessとOAuthを使ってユーザーを識別する。これらのサーバーを使うエージェントは、その従業員本人の権限で動作する。つまり、Joeが特定のチケットを閉じられない権限しか持っていなければ、Joeのエージェントもそのチケットを閉じられない。

Cloudflareは、独立した「エージェントアカウント」を新設する道は選ばなかった。エージェントアカウントは管理すべき権限の2つ目のセットを生み、責任の所在を曖昧にしてしまうためである。ただし、このトレードオフには代償もある。ダウンストリームアプリケーションにはJoeの資格情報しか表示されず、そのアクションの背後で動いているのがどのエージェントなのかを示すものが何もない、という問題である。

WriteGuardは、MCPクライアントとセッションのコンテキストを人間のアイデンティティに追加し、それぞれの書き込みを「特定の人物に代わって動作しているエージェントセッション」として識別する。この帰属情報は、何も問題が起きていない場合でも非常に有用で、人間や他のエージェントが変更内容を解釈し、対応方法を判断するのに役立つ。

### 機械速度のアクティビティをクエリ可能にする

見えるラベルは個々のアクションを説明し、ダウンストリームアプリケーション内で有用な文脈を提供するが、システム全体の俯瞰的な視点は与えてくれない。エージェントは人間よりもはるかに速くアクションを繰り返せるため、すべてのMCPサーバーを横断した一元的な監査も必要だった。

WriteGuardは各呼び出しを成功・失敗・ブロックのいずれかに分類し、非同期でスクラブ済みイベントを内部の監査ワーカーに送信する。イベントは「秘密」または「機密」とみなされるキーの値を省略し、サーバー・ツール・リスク層・結果・ユーザー・クライアント・処理時間を含む。これにより、すべてのMCP対応システム横断でエージェントの活動をクエリ可能にする。

![WriteGuard内部ダッシュボード](https://blog.cloudflare.com/_emdash/api/media/file/01KZ7CJ0NRRE7DXB99C8W5YZ1N.jpg)
*図: Cloudflare社内のWriteGuardダッシュボード（サンプルデータ付き）（出典: Cloudflare Blog https://blog.cloudflare.com/mcp-portal-writeguard-private-beta/）*

このダッシュボードは、MCPサーバーポータルが提供するリクエストログを補完するもので、ポータルログがツール呼び出しそのものを表示するのに対し、WriteGuardは意味的なツール分類・エージェントのコンテキスト・バッキングサーバーからの結果を追加する。監査ログを非同期化しているため、エージェントが待つ応答に遅延が加わることもない。

### 実例で見るWriteGuard: GitLab

記事前半で触れたGitLab MCPサーバーの3つのツール（`get_merge_request`、`create_mr_note`、`merge_mr`）を例に、それぞれの挙動をたどっている。

**マージリクエストの読み取り**: エンジニアが提案されたコード変更の要約をエージェントに依頼し、エージェントが`get_merge_request`ツールを呼び出す。WriteGuardはこのツールを`READ_ONLY`に分類しており、呼び出しをそのまま通す。

**マージリクエストへのメモ追加**: エンジニアがエージェントにMRへのコメントを依頼し、`create_mr_note`ツールが呼ばれる。このツールは`CONTAINED_WRITE`に分類されている。WriteGuardは、構成済みのノートフィールドにGitLabがサポートする形式でエージェント帰属情報を追加した上でツールハンドラーを呼び出し、あわせて非同期でユーザー・ツール・結果・エージェント識別コンテキストを含むスクラブ済み監査イベントを記録する。

![GitLab create_mr_noteツールのスクリーンショット例](https://blog.cloudflare.com/_emdash/api/media/file/01KZ7CJ0Z8WCP1DWTHRKC9QHYJ.png)
*図: GitLabの`create_mr_note`ツールの実行例（出典: Cloudflare Blog https://blog.cloudflare.com/mcp-portal-writeguard-private-beta/）*

![GitLab create_mr_noteツールの監査ログ例](https://blog.cloudflare.com/_emdash/api/media/file/01KZ7CJ0VPZ860CSARB07DCVP2.png)
*図: `create_mr_note`ツール呼び出しの監査ログ例（出典: Cloudflare Blog https://blog.cloudflare.com/mcp-portal-writeguard-private-beta/）*

**コードのマージ**: エンジニアがエージェントにマージリクエストのレビュー支援を依頼したところ、エージェントが「役に立とうとして」依頼された範囲を超え、指示されていないのに`merge_mr`ツールを呼び出してしまうケースを想定している。Cloudflareでのマージは通常デプロイメントパイプラインをトリガーするため人間の判断を介在させる必要があり、`merge_mr`ツールは「CRITICAL」リスク層に分類した上で、WriteGuardで無効（disabled）として構成されている。呼び出された場合、WriteGuardはハンドラーが実行される前にリクエストをブロックし、その試行を記録する。

![WriteGuard監査ダッシュボード上のブロックされたmerge_mr呼び出し](https://blog.cloudflare.com/_emdash/api/media/file/01KZ7CJ17VV6MV8G86SYGD0S1D.jpg)
*図: WriteGuard監査ダッシュボードでブロックされた`merge_mr`呼び出しの表示例（出典: Cloudflare Blog https://blog.cloudflare.com/mcp-portal-writeguard-private-beta/）*

### 単一サーバーの例を超えて

これら3つのツールはいずれも同じサーバー・アイデンティティフロー・ダウンストリームAPIを使うが、WriteGuardはコードが実行される前にそれぞれを異なる方法で処理する。GitLabだけであれば、これらの制御をサーバーに直接組み込むこともできたかもしれない。しかし、Jira、社内ウィキ、Google Workspace、そして今後追加されるすべての新しいMCPサーバーにも同じ機能が必要だった。各サーバーで個別に再実装すれば作業量が増える上、挙動の一貫性も保てなくなる。そこでCloudflareはWriteGuardを共有レイヤーとして構築し、ツールごとの構成だけで、ポータル経由で接続されたすべてのMCPサーバーに対して機能するようにした。

### 内部展開からプライベートベータへ

CloudflareはもともとWriteGuardを自社のMCPサーバー向けに、読み取り専用ツールの先へ進む必要に迫られて構築した。ただしその後も、書き込みに対する制御を失いたくはなかった。プライベートベータでは、このアーキテクチャをMCPサーバーポータルに持ち込み、書き込みツールの分類・実行前のブロック・エージェント帰属の付与・接続された全サーバーの書き込みアクティビティの検査を行う方法を提供する。

ベータは小さく始め、時間をかけて拡大し、一般提供につなげる計画である。Cloudflareは、リスクモデルが顧客のツールにどうマッピングされるか、ダウンストリームアプリケーションがどの帰属形式を必要とするか、WriteGuardを広く提供する前に顧客が求める監査配信の保証水準は何か、といった点を検証したいとしている。

## コード例

記事内で示されているコード例は、WriteGuardのツールポリシー設定の1本のみである（「呼び出し可能なツールから統治可能なアクションへ」セクション）。

```typescript
const sendEmailTool = {
  tool: EmailMCP.sendEmailTool,
  writeGuard: {
    riskLevel: RiskLevel.CONTAINED_WRITE,
    enabled: true,
    labeling: {
      field: "body",
      supportedFormats: [
        LabelFormat.PLAIN_TEXT,
        LabelFormat.HTML,
      ],
    },
  },
};
```

**解説**: `sendEmailTool`という既存のMCPツール（`EmailMCP.sendEmailTool`）に対し、`writeGuard`という設定オブジェクトを外付けする形でポリシーを定義している。`riskLevel: RiskLevel.CONTAINED_WRITE`は、このツールが「限定的な書き込み」（例のリスク層テーブルでいう「コメントを追加」「MRを作成」相当の重大度）であることを示す。`enabled: true`でこのツール自体の呼び出しは許可されている。`labeling`フィールドは、メール本文（`field: "body"`）にエージェント帰属を挿入する際、プレーンテキストとHTMLのどちらの形式にも対応できることを指定している。ポイントは、MCPサーバー本体（`EmailMCP`）のコードを一切変更せずに、この構成オブジェクトを追加するだけでガバナンスを適用できる点であり、これがWriteGuardの「共有レイヤーとして、ツールごとの構成だけで機能する」という設計方針を端的に表している。

## ユースケース

### GitLabマージリクエストの安全な自動化

`get_merge_request`（読み取り、素通し）、`create_mr_note`（限定書き込み、帰属付与＋監査）、`merge_mr`（重大操作、実行前ブロック）という3段階のリスク層を使い分けることで、「レビューの要約」や「コメント追加」といった有用な自動化は許可しつつ、デプロイパイプラインをトリガーする「マージ」だけは人間の判断を必須にする、という現実的な線引きを実現している。

### メール送信エージェントのガバナンス

先述のコード例が示す通り、サポートやカスタマーサクセスのエージェントが顧客に送るメールに対しても、`CONTAINED_WRITE`のリスク層と帰属ラベリングを適用することで、「どのエージェントが、誰に代わって、何を送ったか」を追跡可能にしつつ、既存のメールMCPサーバーのコードには手を入れずに済む。

### 横断的な監査によるインシデント調査

エージェントが人間よりもはるかに速い頻度でアクションを実行できるため、個々のツールのログだけでは全体像を追いにくい。WriteGuardの一元化された監査ダッシュボードにより、27のMCPサーバーを横断してエージェントの活動をクエリでき、「無限に閉じられるチケット」のような事象が起きた際の調査を容易にする。

## 所感・ポイント

- 「エージェントアカウントを新設せず、あくまで人間の権限で動かす」という設計判断は、権限管理をシンプルに保つ一方で、帰属追跡の問題を別レイヤー（WriteGuard）で解決するというトレードオフの取り方が明快である。同様の課題は他社のMCP／エージェント基盤でも共通して直面するはずで、参考になる設計判断だと言える。
- リスク層を「Read Only → Minimal Impact → Contained Write → Critical」という4段階で定義し、`Critical`は既定で無効化してMCPサーバー側の変更なしにブロックできるようにしている点は、[Cloudflare OS](2026-08-05-cloudflare-os.md)のGatekeeperが持つ「エージェントは最初はどのアクセス権も持たない」という思想とも通じる、Cloudflare全体に一貫したゼロトラスト的な設計思想の表れと読める。
- 監査ログを非同期送信にすることでエージェントの応答レイテンシに影響を与えない、という実装上の配慮も、実運用を意識した現実的な設計として参考になる。

> **Workers サンプル**: 対象外（WriteGuardはプライベートベータの機能であり、一般利用可能ではないため）。

## 関連リンク

- [Model Context Protocol公式サイト](https://modelcontextprotocol.io/)
- [OpenCode](https://opencode.ai/)
- [Cloudflare OS：エージェント、アプリ、作業のためのオープンプラットフォーム](2026-08-05-cloudflare-os.md)
- [Cloudflare Access](https://developers.cloudflare.com/cloudflare-one/access-controls/)
- [MCP Server Portals](https://developers.cloudflare.com/cloudflare-one/access-controls/ai-controls/mcp-portals/)
- [Cloudflare AccessとOAuth](https://blog.cloudflare.com/managed-oauth-for-access/)
- [WriteGuardプライベートベータへの申し込み](https://www.cloudflare.com/resource/writeguard-beta-landing-page/)
