# 次の Git プラットフォームを Cloudflare 上で作ってほしい: Artifacts のオープンベータと開発コンペ

- 原文: [https://blog.cloudflare.com/next-git-platform-on-cloudflare/](https://blog.cloudflare.com/next-git-platform-on-cloudflare/)（原題: We want you to build the next Git platform on Cloudflare）
- 日本語版の出どころ: Cloudflare公式の日本語版（`https://blog.cloudflare.com/ja-jp/next-git-platform-on-cloudflare/`）は確認時点で存在しなかった（404）ため、英語版（en-us）から日本語化して要約している。タイトルも筆者による訳。公開日は英語原文の datePublished（2026-10-01T13:00:00Z）に従う。
- 公開日: 2026-10-01
- 著者: Dina Kozlov, Dillon Mulroy, Zebulon Piasecki
- 位置づけ: Birthday Week 2026 の記事（読了目安は原文表記で 6 分）。2026 年前半に発表された Artifacts（エージェント向けの Git 互換バージョン管理ストレージ）のオープンベータ入りと、その上に「次の Git プラットフォーム」を作るコンペの告知
- 関連: [数百万のリポジトリのCI/CDを、あなたのプラットフォーム上でCloudflareが動かす](./2026-08-04-ci-workflows.md)（Artifacts の push イベントを Workflow に直接つなぐ CI SDK）／ [Cloudflareにエージェント開発ライフサイクルの時代が到来](./2026-08-04-agent-development-lifecycle.md)（Artifacts を含む ADLC の全体像）／ [AIエージェントに必要なのはコンテナではなくコンピューター](./2026-08-03-cloudflare-computer.md)（`workspace.git` による Git 操作）／ [Cloudflare Containers を作り直し、エージェントのサンドボックスをスケールさせる](./2026-09-30-faster-agent-sandboxes.md)（リポジトリをクローンして作業するサンドボックス基盤）
- GitHub: [docs/articles/2026-10-01-next-git-platform-on-cloudflare.md](https://github.com/syumai/cloudflare-blog-summaries/blob/main/docs/articles/2026-10-01-next-git-platform-on-cloudflare.md)

![記事ヘッダー画像](https://blog.cloudflare.com/_emdash/api/media/file/01M3VGDDQQHKX35297BEXJZ5H0.01M3VGDEMW20N9CFDP5TEPV5EJ.png)
*図: 記事ヘッダー画像。ラバランプを載せた台座の周りにロボットと各種ブロックが矢印でつながれた装飾イラスト（出典: Cloudflare Blog https://blog.cloudflare.com/next-git-platform-on-cloudflare/。原文にキャプションはなく、説明は見た目からの筆者の推定。装飾のため、図としては扱わない）*

## TL;DR

- Cloudflare は、GitHub が前提としてきた「人間がコードを書く世界」とは別に、**数百〜数千のエージェントが同じコードベースで同時に作業する世界**の Git 基盤を、開発者自身に作ってほしいと呼びかけている。
- 土台になるのが **Artifacts**（Git を話すバージョン管理付きファイルシステムで、数百万リポジトリまでスケールする）。今回**オープンベータ**になり、新機能が追加された（Workers へのデプロイ、Workers バインディング、イベント購読、データジュリスディクション、メトリクス）。
- **課金は 2026-10-15 開始**。リポジトリ操作数と保存データ量に基づく。
- **コンペ「Build the next Git platform on Cloudflare」**: Workers と Artifacts でエージェント時代の Git プラットフォームを作る。最低条件は「複数のエージェントが同時に変更を進める」こと。**締め切りは 2026-10-14**。上位 3 チームを Cloudflare Connect（サンフランシスコ）へ招待し、1 位には **25,000 ドル分の Cloudflare クレジット**。

## 背景・課題

GitHub は「人間がコードを書き、リポジトリに整理し、ブランチ・コミット・Issue・プルリクエストで協力する」世界のために作られた、と記事は述べる。ところがエージェントはすでにバグ修正、機能実装、テスト作成、レビュー、依存関係の更新、日常的な保守までこなしている。ひとつのコードベースに数百、数千のエージェントが同時に取り組む世界では、基盤はどうあるべきか。

記事が挙げる問いは次のとおり。

- エージェントは、他のエージェントが何をしているかをどう知るのか
- 変更が衝突したときはどうなるのか
- 大量の成果物をどうレビューするのか
- 「何が変わったか」だけでなく「なぜ変えたか」をどう追跡するのか

そして「次の GitHub はどんな姿か」という問いに、Cloudflare 単独ではなく、開発者と一緒に答えを探したい、というのが記事の主旨である。

## 発表内容 / アーキテクチャ

### Artifacts という土台

Artifacts は、年初に発表された「Git を話すバージョン管理付きファイルシステムで、数百万のリポジトリまでスケールできる」サービスである。最初から、開発者が自分のプロダクトやワークフロー、抽象化を作るための**プログラム可能なプリミティブ**として設計されている。

![Artifacts のロゴ画像](https://blog.cloudflare.com/_emdash/api/media/file/01M3SQC6HRKEPPV90RWXN9CTKR.png)
*図: 「ARTIFACTS」の文字を霧がかった高層ビル群の写真に重ねたタイトル画像（出典: Cloudflare Blog https://blog.cloudflare.com/next-git-platform-on-cloudflare/。原文にキャプションはなく、説明は見た目からの筆者の推定。装飾画像のため、図としては扱わない）*

Artifacts が提供するのは次の部品である。

- プログラムから作成・フォークできるリポジトリ
- コードとエージェントの文脈を保存するバージョン管理付きストレージ
- エージェントがすでに知っている Git 操作

この土台の上で開発者が作るべき層は、「エージェント同士がどう作業を調整するか」「変更をどうレビューし、マージするか」「数百〜数千のエージェントが働くときの開発者体験はどうあるべきか」だ、と記事は位置づけている。

既存の利用例として記事が挙げるのは、(1) vibe coding プラットフォームがユーザーのプロジェクトを保存する、(2) エージェントセッションのコードと文脈を永続化する、(3) 複数のエージェントが同じ出発点から作業できるよう分離したリポジトリを用意し、後で結果を比較・マージする、の 3 つ。

### オープンベータで追加された機能

**1. Artifacts リポジトリを Workers にデプロイする（Workers Builds 連携）**

Artifacts リポジトリを Workers Builds 経由で Worker に接続できる。あなた（またはエージェント）がリポジトリへ push すると、Cloudflare がビルドし、本番ブランチなら Worker を更新する。それ以外のブランチへの push では Workers Previews が作成・更新され、公開前に試せる隔離されたプレビュー環境ができる。既存の Worker を接続することも、新規プロジェクトを最初から Artifacts に保存することもできる。

![Workers の新規作成画面で Continue with Artifacts を選べるスクリーンショット](https://blog.cloudflare.com/_emdash/api/media/file/01M3SQC8RKCYFADSHXNX2XR1XF.png)
*図: 「Make something new」画面。「Continue with Artifacts」「Continue with GitHub」「Connect with GitLab」「Start with Hello World!」「Select a template」「Upload your static files」の選択肢が並ぶ（出典: Cloudflare Blog https://blog.cloudflare.com/next-git-platform-on-cloudflare/。原文にキャプションはなく、説明は画像内の文言からの筆者の推定）*

**2. Worker から Artifacts を直接操作する（Artifacts バインディング）**

Workers の Artifacts バインディングで、リポジトリの作成・フォーク、ファイルやコミットの参照、リポジトリ単位の Git トークンの発行ができる。新しいタスクが来たら Worker がプロジェクトをフォークし、必要なファイルを読んで文脈を作り、エージェントに作業用リポジトリを渡す。エージェントが変更を push したら、自動化がその結果を検査してレビューを始める。こうした手順を、エージェントの流儀に合わせてコードで定義できる。

**3. すべての変更にイベント購読で反応する**

Artifacts は、リポジトリの作成・インポート・フォーク・削除・push・clone・fetch のたびにイベントを発行する。購読すれば、CI の実行、コードレビューエージェントの起動、デプロイなどを次の処理として決められる。

**4. Artifacts リポジトリのデータジュリスディクション**

Artifacts がリポジトリデータを保存・処理する場所を選べる。名前空間の作成時に U.S. または EU のジュリスディクションを指定すると、その名前空間に作られるすべてのリポジトリが同じ制限に従う。

**5. メトリクスの表示**

Cloudflare ダッシュボードで、リポジトリごとに操作の総数・pull・push・エラー・エラー率を確認できる。メトリクスを直接クエリして、独自のダッシュボードや監視を組むこともできる。

![Artifacts のメトリクス画面](https://blog.cloudflare.com/_emdash/api/media/file/01M3SQC9MA49HNQD82GBG58EDM.png)
*図: Artifacts のダッシュボード「myproject」の Metrics タブ。Total operations 22、Pulls 20、Pushes 0、Errors 0、Error rate 0% と、Pull と Read の操作数の棒グラフ（出典: Cloudflare Blog https://blog.cloudflare.com/next-git-platform-on-cloudflare/。原文にキャプションはなく、説明は画像内の表示からの筆者の推定）*

**料金**: リポジトリ操作と保存データ量に基づく。Artifacts の課金は **2026-10-15** に開始される。

### コンペの概要

| 項目 | 内容 |
| --- | --- |
| テーマ | Workers と Artifacts でエージェント時代の Git プラットフォームを作る |
| 最低条件 | 複数のエージェントが変更を同時並行で進めていること |
| 提出物 | 5〜10 分のデモ動画（何を作ったか、エージェントと開発者に何を可能にするか、仕組み）／ソースコードへのリンク（MIT・Apache・BSD などの寛容なオープンソースライセンス）／実行・試用の手順 |
| 締め切り | 2026-10-14 |
| 賞 | 上位 3 プロジェクトから最大 2 名ずつをサンフランシスコの Cloudflare Connect へ招待。1 位は 25,000 ドル分の Cloudflare クレジットと、月曜夜の VIP スピーカーディナーへの招待 |

記事は「今日の GitHub にエージェントを足したものを求めているのではない」と明言し、リポジトリ・ブランチ・プルリクエスト・ワークツリー・コードレビュー・マージコンフリクトの再考、エージェントの文脈の保存、複数の変更の同時比較と採用判断といった方向を例示している。

## コード例

### Worker からプロジェクトをフォークして AGENTS.md を読む

記事のコード例（Artifacts バインディング）。新しいエージェントタスクのためにプロジェクトをフォークし、`AGENTS.md` から指示を読む。

```ts
using project = await env.ARTIFACTS.get("my-project");
const { defaultBranch } = await project.info();
const workspace = await project.fork(`task-${crypto.randomUUID()}`);

using repo = await env.ARTIFACTS.get(workspace.name);
const instructions = await repo.readFile({
  ref: defaultBranch,
  path: "AGENTS.md",
});

const agentTask = {
  remote: workspace.remote,
  token: workspace.token,
  instructions: instructions ? await instructions.text() : null,
};
```

**解説**: `env.ARTIFACTS.get("my-project")` でリポジトリを取得し、`info()` でデフォルトブランチ名を得る。`project.fork()` でタスクごとにユニークな名前（`task-<UUID>`）のフォークを作り、その `workspace.name` で作業用リポジトリを取得する。`readFile()` でデフォルトブランチの `AGENTS.md` を読み、`remote`（リモート URL）・`token`（リポジトリ単位の Git トークン）・指示文を `agentTask` にまとめてエージェントへ渡す、という流れである。`using` 宣言により、リポジトリのハンドルはスコープを抜けると解放される。

### push イベントでレビュー Workflow を起動する

Artifacts の push イベントを購読する Queue コンシューマー。push ごとにレビュー用の Workflow を起動する。

```ts
export default {
  async queue(batch, env) {
    for (const message of batch.messages) {
      const event = message.body;
      if (event.type !== "cf.artifacts.repo.pushed") continue;

      await env.REVIEW_WORKFLOW.create({
        params: {
          namespace: event.source.namespace,
          repo: event.source.repoName,
          ref: event.payload.ref,
          commit: event.payload.after,
        },
      });
    }
  },
};
```

**解説**: キューのメッセージ本文が Artifacts のイベントで、`type` が `cf.artifacts.repo.pushed` のものだけを処理する。Workflow にはリポジトリの名前空間・リポジトリ名・ブランチ（`ref`）・新しいコミット（`after`）を渡し、レビューエージェントが変更を調べるための文脈にする。なお、記事のこのコードは `batch` と `env` の型注釈を省略した抜粋である。

### 名前空間にジュリスディクションを設定する

```bash
curl "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/artifacts/namespaces" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  --json '{"namespace":"my-eu-namespace","jurisdiction":"eu"}'
```

**解説**: 名前空間を作成する API に `jurisdiction`（`"eu"` など）を指定する。以降、その名前空間に作られるリポジトリは自動的に同じ制限に従う。

## ユースケース

- **タスクごとの作業用リポジトリ**: タスクが届くたびに Worker がプロジェクトをフォークし、エージェントに専用リポジトリとトークンを渡す。複数のエージェントが同じ出発点から並行して作業し、結果を比較・マージできる。
- **push 起点のレビューと CI**: push イベントを購読して、レビューエージェントや CI を自動で起動する。Workflow へ直接つなぐ方法は [CI Workflows](./2026-08-04-ci-workflows.md) を参照。
- **Workers の継続的デプロイとプレビュー**: エージェントが Artifacts に push するだけで、本番ブランチは Worker として公開され、他のブランチは Workers Previews として確認できる。
- **vibe coding プラットフォーム**: ユーザーが作ったプロジェクトを Artifacts に保存し、データ所在地は名前空間のジュリスディクションで制御する。
- **コンペ参加**: 記事が例示する「worktree の再考」「複数の変更の同時比較と採用判断」「エージェントの文脈の保存」などを題材に、新しい Git プラットフォームを試作する。

## 所感・ポイント

- 記事自体は「新機能の紹介＋コンペ告知」で、Artifacts の内部設計を掘り下げるものではない。設計思想や初期の発表は、記事内でリンクされている Artifacts の発表記事（`artifacts-git-for-agents-beta`）を参照する必要がある。
- 「フォークをタスク単位に作り、トークンはリポジトリ単位で発行する」という形は、エージェントに渡す権限を最小限にする設計として分かりやすい。コード例の `workspace.token` が、その入口になっている。
- イベント購読（push・clone・fetch など）と Workflows の組み合わせが、「Git 上の変更を起点に別のエージェントが動く」連鎖の基本形になる。CI SDK の記事と合わせて読むと、全体像がつかみやすい。
- 日付に注意: コンペの締め切りは **2026-10-14**、Artifacts の課金開始は **2026-10-15**。いずれも本 Wiki の作成日時点では近い（または過ぎている）可能性があるため、最新の状況は原文・公式ドキュメントで確認すること。
- 記事の対象はオープンベータで、Workers Paid プランの利用者向けとされている。

> **Workers サンプル**: 対象外（中心機能の Artifacts が現時点でオープンベータで、Workers Paid プランとアカウント側のリポジトリ・名前空間の準備が必要なため。ローカルや `wrangler deploy --dry-run` だけでは要点を体験できず、100行前後の最小実装で再現しにくい。記事のコード断片は上の「コード例」に引用している）

## 関連リンク

- [原文（英語）: We want you to build the next Git platform on Cloudflare](https://blog.cloudflare.com/next-git-platform-on-cloudflare/)
- [Artifacts: Git for Agents（ベータ発表記事）](https://blog.cloudflare.com/artifacts-git-for-agents-beta/)
- [Artifacts ドキュメント](https://developers.cloudflare.com/artifacts/)
- [Workers Builds と Artifacts の連携](https://developers.cloudflare.com/workers/ci-cd/builds/git-integration/artifacts-integration/)
- [Workers Previews](https://developers.cloudflare.com/workers/previews/)
- [Artifacts の Workers バインディング](https://developers.cloudflare.com/artifacts/api/workers-binding/)
- [Artifacts のデータローカライゼーション](https://developers.cloudflare.com/artifacts/guides/data-localization/)
- [Artifacts のメトリクス](https://developers.cloudflare.com/artifacts/observability/metrics/)
- [コンペの応募ページ](http://cloudflare.com/git-competition)
- [Cloudflare Connect](https://www.cloudflare.com/connect/)
- [Artifacts ダッシュボード](https://dash.cloudflare.com/?to=/:account/workers/artifacts)
- 本リポジトリ: [CI Workflows](./2026-08-04-ci-workflows.md) ／ [エージェント開発ライフサイクル](./2026-08-04-agent-development-lifecycle.md) ／ [@cloudflare/computer](./2026-08-03-cloudflare-computer.md) ／ [Containers の再設計（エージェントのサンドボックス）](./2026-09-30-faster-agent-sandboxes.md)
