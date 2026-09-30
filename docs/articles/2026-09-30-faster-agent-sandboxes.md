# Cloudflare Containers を作り直し、エージェントのサンドボックスをスケールさせる

- 原文: [https://blog.cloudflare.com/faster-agent-sandboxes/](https://blog.cloudflare.com/faster-agent-sandboxes/)（原題: Cloudflare Containers, rebuilt to scale agent sandboxes）
- 日本語版の出どころ: Cloudflare公式の日本語版（`https://blog.cloudflare.com/ja-jp/faster-agent-sandboxes/`）は確認時点で存在しなかった（404）ため、英語版（en-us）から日本語化して要約している。タイトルも筆者による訳。公開日は英語原文の datePublished（2026-09-30）に従う。
- 公開日: 2026-09-30
- 著者: Thomas Gauvin、Rushil Mehra、Gabi Villalonga Simón、Thomas Lefebvre
- 位置づけ: Birthday Week 2026 の開発者プラットフォーム系の記事。エージェントが「タスクごとにサンドボックスを作る」使い方に合わせて Containers の設定・スケジューリング・保存の仕組みを作り直した発表
- 関連: [AIエージェントに必要なのはコンテナではなくコンピューター —「@cloudflare/computer」のご紹介](./2026-08-03-cloudflare-computer.md)（本記事が冒頭で「エージェントにはコンピューターが必要」と参照している記事。`@cloudflare/computer` は本記事でも Dynamic Workers と Containers を組み合わせる高レベル環境として言及）、[Project Think：Cloudflareで次世代のAIエージェント構築](./2026-04-15-project-think.md)（Durable Object 上でエージェントを動かす基盤）、[Cloudflare Agentsの紹介](./2026-08-04-agents-on-cloudflare.md)、[Cloudflare OS：エージェント、アプリ、作業のためのオープンプラットフォーム](./2026-08-05-cloudflare-os.md)（本記事が Outbound Request Handler の使い方の比喩として Gatekeeper パターンを参照）、[数百万のリポジトリのCI/CDを、あなたのプラットフォーム上でCloudflareが動かす](./2026-08-04-ci-workflows.md)
- GitHub: [docs/articles/2026-09-30-faster-agent-sandboxes.md](https://github.com/syumai/cloudflare-blog-summaries/blob/main/docs/articles/2026-09-30-faster-agent-sandboxes.md)

![ヘッダー画像](https://blog.cloudflare.com/_emdash/api/media/file/01KW46H9N3ZPBVM99CMTJZRPF3.png)
*図: 記事ヘッダー画像。砂場の中央に盾と砂の城、周囲にシャベル・バケツ・植物・立方体が描かれたオレンジ基調の装飾イラスト（出典: Cloudflare Blog https://blog.cloudflare.com/faster-agent-sandboxes/。原文にキャプションはなく、「ヘッダー画像」という呼称と説明は掲載位置と見た目からの筆者の推定。装飾のため、図としては扱わない）*

## TL;DR

- Cloudflare Containers を、エージェントのワークロード向けに**よりプログラマブルで高速**に作り直した。新しい `durable_object` スケジューリングポリシーにより、**サンドボックスのイメージとインスタンスタイプをコードから実行時に選べる**。
- Containers の起動は **6 倍以上高速**になった。ComputeSDK の独立ベンチマーク（100 個を同時起動）で、中央値は **4.049 秒 → 648 ミリ秒**（6.2 倍）。Cloudflare 自身の予備的なバースト試験では、1 アカウントが **6 か所で 100,000 個の Container を 5.387 秒で起動**した。
- **ファイルシステムのスナップショット**（パブリックベータ）と、すぐ使えるシステムイメージ `cloudflare/debian-trixie` が加わり、ワークスペースを保存して後で再開できる。
- すべての Container は専用の Durable Object を持つ。新機能は `ctx.container` の**ネイティブ API** としてのみ提供される。旧 `Container` クラスと旧 `Sandbox` クラスは 2026 年 12 月 31 日まで維持され、**Sandbox SDK 1.0 は基底クラスではなくユーティリティ集**になる。

## 背景・課題

これまでの Containers は「アプリケーションのデプロイ」を単位に設計されていた。イメージと計算リソースをデプロイ時に決め、アプリケーション全体へロールアウトして一元管理する形である。

エージェントのワークスペースは性質が違う。エージェントが作業している最中にオンデマンドで作られ、イメージ・リソース・ツール・初期のファイルシステムはタスクごとに決まる。数分で終わることも、リクエストの合間に眠ることも、数日後に復元されることもある。こうした判断はタスクを処理するアプリケーションコードの側にあるべきで、しかも起動が遅ければ、その 1 秒ごとにユーザーが待たされる。

記事は、同じパターンを次のような利用で見てきたとしている。

- Base44（アプリ構築用のワークスペース）、Kilo Code（クラウドエージェントのセッション）
- Cursor Cloud Agents、Devin Outposts、OpenAI Agents API、Claude Managed Agents との連携

ワークロードごとに要件は異なる。コーディングエージェントにはリポジトリ、パッケージマネージャー、コンパイラ、テストランナー、開発サーバーが必要。評価（eval）には既知の状態から始まるサンドボックスが、強化学習には大量の環境を作成・採点・リセットする仕組みが、長時間のタスクには成果物のファイルを保存して後で続ける仕組みが必要になる。

## 発表内容 / アーキテクチャ

### 1. イメージとインスタンスタイプをコードから選ぶ

従来は「イメージ × インスタンスタイプ」の組み合わせごとに別々の Containers アプリケーション（専用の Durable Object 名前空間）を `wrangler deploy` で用意する必要があった。Node.js の小さなサンドボックスと Python の大きなサンドボックスが欲しければ、アプリケーションが 2 つ、名前空間が 2 つ、さらに Worker 側にルーティングが必要だった。

新しい `durable_object` スケジューリングポリシーでは、イメージとインスタンスタイプはサンドボックス起動時に渡す**引数**になる。設定ファイルで `scheduling_policy` を指定し、選択肢となるイメージを `images` に宣言する。宣言したイメージは Durable Object 内で `this.ctx.container.images.<name>` として使える。タスクが届いたら、コードがそのタスクに合うイメージとインスタンスを選ぶ。これまで別アプリケーションと別デプロイが必要だったことが「if 文」になる。新しい環境の追加はデプロイではなくコード変更で済む。

### 2. ロールアウトは「ただのコード」

従来はイメージ更新がアプリケーション全体の更新だった。猶予期間（grace period）、段階的な割合指定、API による設定の反映が必要で、エージェントの作業中であっても、どのインスタンスをいつ置き換えるかはプラットフォームが決めていた。

`durable_object` ポリシーではロールアウト設定自体がない。Container は、コードが止めるまで起動時のイメージのまま動き続け、その Durable Object が次に Container を起動するときに、コードが選んだイメージが使われる。記事が挙げる例は次のとおり。

- Durable Object の ID をハッシュして、新しいサンドボックスの 5% でカナリア運用する
- 進行中のプロジェクトは現在のイメージに固定し、タスク中に環境が入れ替わらないようにする
- スナップショット後や次のセッションなど、区切りのよい時点でワークスペースを移行する
- 以降の起動で選ぶイメージを変えるだけでロールバックする（設定の反映も、ドレインの待機も不要）

### 3. 最初のコマンドまでが速くなる

従来は Container の起動にグローバルなコントロールプレーンが関わっていた（アプリケーション設定の解決、空き容量の探索、配置の調整）。`durable_object` ポリシーでは、需要は Durable Object から始まる。まず同じマシン上で空きを探し、なければ同じロケーション内に探索を広げる。また、イメージやスナップショットがローカルストレージに既にあるホストを優先するので、ダウンロードせずに起動できる。

ホストに着いてからの作業も減らした。仮想マシンを一から起動する代わりに、まだ割り当てられていない準備済みの仮想マシンを復元する。ネットワークやファイルシステムの設定を再利用し、繰り返し発生する操作をまとめ、最初のコマンドに不要なサービスの待機もやめた。

ComputeSDK の Burst TTI Benchmark（100 個のサンドボックスを同時に起動し、クライアントから見た time-to-interactive を測る）の結果は次のとおり。

| 指標 | 従来のスケジューリング | 新ポリシー | 改善 |
|---|---|---|---|
| 中央値 | 4.049 秒 | 648 ミリ秒 | 6.2 倍 |
| 95 パーセンタイル | 5.839 秒 | 910 ミリ秒 | 6.4 倍 |
| 99 パーセンタイル | 6.717 秒 | 1129 ミリ秒 | 5.9 倍 |

さらに Cloudflare 自身の予備的なバースト試験では、1 アカウントが 6 つのロケーションで 100,000 個の Container を 5.387 秒で起動した（記事は「preliminary」と断っている）。

### 4. 準備済みのシステムイメージ `cloudflare/debian-trixie`

スケジューリングが速くなると、残りの待ち時間ではイメージの準備（ホストへの取得と展開）の比重が大きくなる。そこで Debian Trixie Slim と Node.js 24.20.0 LTS を含む、エージェント向けの即利用可能なイメージ `cloudflare/debian-trixie` が導入された。Dockerfile を書いたりイメージをビルドして Cloudflare へ push したりせずに Linux サンドボックスを起動でき、起動後に `exec()` でリポジトリのクローン、パッケージのインストール、環境設定ができる。Cloudflare が管理するイメージなので、リクエストが来る前に対象ホストへ配布・準備しておける。

### 5. ファイルシステムのスナップショット（パブリックベータ）

起動が速くなっても、リポジトリのクローン、依存関係のインストール、ツールチェーンの設定といったワークスペースの準備は、Container の起動そのものより長くかかることがある。そこでネイティブのファイルシステムスナップショットが追加された。作業が止まるときにワークスペースを保存し、セッション再開時に復元できる。

記事が挙げる 2 つのパターンは次のとおり。

- **1 つのワークスペースを複数セッションにまたがって続ける**: ユーザーが作業を終えたときに保存し、翌日戻ってきたときに復元する。リポジトリ、依存関係、ビルドキャッシュ、設定、編集内容がそのまま使える。
- **多数のサンドボックスの共通チェックポイント**: スナップショットは不変（immutable）で再利用できるので、複数の Container が同じ準備済み環境から独立に起動し、それぞれ変更を加えられる。たとえば eval で、システムプロンプト・スキル・モデル・エージェントのバージョンを変えて同じタスクを走らせるとき、リポジトリや依存関係などを固定した同一のベースラインから多数の隔離環境を起動でき、環境のずれが結果に影響するのを防げる。

`cloudflare/debian-trixie` から起動して `exec()` で環境を整え、スナップショットとして保存すれば、以降のサンドボックスはリポジトリ・依存関係・ツールチェーンが入った状態から始められる。

### 6. エージェントサンドボックスにおける Durable Object の強み

ここまでの改善はすべて「Durable Object を、付随する Container のコントローラーとしてさらに前面に出す」という同じ設計判断から来ている。記事は Anthropic の「brain と hands の分離」パターンに言及し、エージェントをサンドボックスの外に置けば、サンドボックスが停止・故障・入れ替えになってもエージェントは利用可能なままだとする。逆にエージェントをサンドボックス内で動かす場合は、外側の環境がそれを監督して進捗を報告できる。

`durable_object` ポリシーの新しい点は、Durable Object が**ラッパークラスなしで Container を直接制御できる**こと。`exec()` は Workers ランタイム内で直接実行され、アウトバウンドリクエストの傍受、実行時のイメージ・インスタンス選択、ファイルシステムスナップショットがすべて `ctx.container` にある。Durable Object のストレージ、アラーム、WebSocket、RPC と組み合わせられる。Container は Durable Object の「計算拡張」であり、Linux 環境は Container が、ID・状態・ポリシー・ライフサイクルは Durable Object が持つという分担になる。記事は Dynamic Workers（軽量な隔離実行）を加えれば、タスクごとに実行環境を選べるとも述べる。

![Containers と Durable Objects のエージェント向けパターン](https://blog.cloudflare.com/_emdash/api/media/file/01M3RZHX4W63MBJM5R8X7VVE2G.01M3RZHXT3X1AAZRW96ZVHJNB2.png)
*図: 「Containers and Durable Objects patterns for agents」。Durable Object と Container の組み合わせを 3 つ並べた図で、「Agent sessions」（Container as workspace）、「Trusted access」（Configure security boundary。Container を Outbound handler が囲む）、「Evaluations and reinforcement learning」（Supervise agent attempts）（出典: Cloudflare Blog https://blog.cloudflare.com/faster-agent-sandboxes/。図中の文言は画像から読み取ったもので、原文本文にキャプションはない）*

記事が挙げる 3 つのパターン:

- **エージェントセッション**: エージェントループを Durable Object で動かし（セッション状態、WebSocket でのユーザー通信、モデル呼び出し）、シェル・コンパイラ・開発サーバーが必要なときだけ Container を起こす。ユーザーやモデルを待つ間は Container を止め、アイドル中の Linux コンピュートには課金されない。
- **信頼されたアクセス**: Durable Object が、ユーザーが許可したサービス・リポジトリ・操作を覚えておき、Container の Outbound Request Handler を更新して、新しく許可された資格情報の注入、ポリシーの強制、追加のアクティビティ記録を行う。Cloudflare OS の Gatekeeper パターンを、エージェントごとのコンピューターに適用したものと説明されている。
- **評価と強化学習**: コーディネーターがベースのワークスペースをスナップショットし、N 個の試行にフォークする。各試行は専用の Durable Object と Container を持ち、Container がクラッシュしても Durable Object が実行を監視して結果を保持する。コーディネーターが採点し、最良のものをスナップショットして、そこからまたフォークする。

### 7. Container クラスと Sandbox SDK への影響

Containers の開始時は、あえて Durable Object を `Container` クラスの裏に隠していた。Sandbox SDK もそのクラスの上に作られ、当時ランタイムになかったコマンド実行・アウトバウンド傍受・スナップショットをユーザー空間で補っていた。しかしエージェントのワークスペースが主要なワークロードになった今、その抽象化のコストが明らかになったという。Durable Object が持つ ID・状態・協調を Container と組み合わせにくく、多くのチームが独自のスリープポリシー、資格情報の扱い、eval の追跡方法を必要としたためである。そこで Durable Object を開発者体験の表に出す。

- **新機能はネイティブ限定**: `durable_object` スケジューリングポリシー、高速な起動、実行時のイメージ・インスタンス選択、ファイルシステムスナップショットは `ctx.container` でのみ使える。
- **旧クラスの維持期限**: `Container` クラスと旧 `Sandbox` クラスは **2026 年 12 月 31 日まで**維持される。その日以降も既存のデプロイは動き続けるが、更新は行われない。`ctx.container` への移行が推奨されている。
- **Sandbox SDK 1.0**: 基底クラスではなくユーティリティの集合で、自分の Durable Object クラスの中で `ctx.container` と並べて使う。
- **高レベル環境**: Dynamic Workers と Containers を、同期されるファイルシステムで組み合わせた `@cloudflare/computer` が用意されている。
- **移行**: 多くの場合は `extends Container` を `extends DurableObject` に変え、`this.ctx.container` を直接呼ぶ形になる（移行ガイドあり）。

## コード例

記事中のコードをそのまま引用し、日本語で解説する。

### wrangler.jsonc（スケジューリングポリシーとイメージの宣言）

```jsonc
// wrangler.jsonc
{
  "containers": [
    {
      "class_name": "AgentSandbox",
      "scheduling_policy": "durable_object",

      "images": {
        "node": { "dockerfile": "./images/node/Dockerfile" },
        "python": { "dockerfile": "./images/python/Dockerfile" }
      }

    }
  ],
  "durable_objects": {
    "bindings": [{ "name": "SANDBOX", "class_name": "AgentSandbox" }]
  }
}
```

`scheduling_policy: "durable_object"` でオプトインし、`images` に Durable Object が選べるイメージを名前付きで宣言する。宣言したイメージは `this.ctx.container.images.node` のように参照できる。

### タスクごとにイメージとインスタンスを選んで起動する

```js
import { DurableObject } from "cloudflare:workers";

export class AgentSandbox extends DurableObject {
  async startWorkspace(workspace) {
    if (this.ctx.container.running) {
      return;
    }

    const image =
      workspace.toolchain === "python"
        ? this.ctx.container.images.python
        : this.ctx.container.images.node;

    const instance =
      workspace.workload === "build"
        ? "standard-2"
        : "standard-1";

    this.ctx.container.start({
      image,
      instance,
      enableInternet: true,
    });
  }
}
```

`extends DurableObject` であって `Container` ではない点に注意。すでに起動中なら何もせず、そうでなければツールチェーン（Python か Node）でイメージを、ワークロード（ビルドか否か）でインスタンスタイプ（`standard-2` か `standard-1`）を選んで `start()` する。

### ロールアウト戦略（カナリアとピン留め）

```js
const image =
  (await this.ctx.storage.get("pinned-image")) ??
  (isCanary(this.ctx.id)
    ? this.ctx.container.images.nodeV2
    : this.ctx.container.images.node);
```

Durable Object のストレージにピン留めされたイメージがあればそれを使い、なければ Durable Object の ID から判定するカナリア対象（`isCanary`。記事は実装を示していないので利用者側で定義する関数）に新しいイメージ（`nodeV2`）を割り当てる。ロールアウト設定ではなく、単なる条件分岐で表現できる。

### 準備済みのシステムイメージを使う

```js
this.ctx.container.start({
  image: "cloudflare/debian-trixie",
  instance: "standard-2",
  enableInternet: true,
  entrypoint: ["/bin/sleep", "infinity"]
});
```

Dockerfile なしで Debian Trixie Slim + Node.js 24.20.0 LTS の環境が起動する。`entrypoint` に `sleep infinity` を指定して Container を起動したままにし、あとから `exec()` でコマンドを流し込む使い方である。

### スナップショットの保存と復元

```js
async saveWorkspace() {
  const snapshot = await this.ctx.container.snapshotContainer({
    name: "project-ready",
  });

  await this.ctx.storage.put("workspace-snapshot", snapshot);
}

async restoreWorkspace() {
  const snapshot = await this.ctx.storage.get("workspace-snapshot");

  if (!snapshot) {
    throw new Error("No workspace snapshot found");
  }

  this.ctx.container.start({
    containerSnapshot: snapshot,
    instance: "standard-2",
    enableInternet: true,
  });
}
```

`snapshotContainer()` が返すスナップショットの参照を Durable Object のストレージに保存しておき、復元時は `start()` に `containerSnapshot` として渡す。Container を止めてもスナップショットから続きを再開できる。

## ユースケース

- **コーディングエージェントのワークスペース**: Node.js 用・Python 用などのイメージを 1 つの Durable Object クラスから使い分け、作業の合間は Container を停止し、翌日スナップショットから復元する。
- **アプリ構築・クラウドエージェントのセッション**: Base44（アプリごとの隔離された開発環境）や Kilo Code（セッションごとのワークスペース）の事例。引用されたコメントによれば、どちらも Containers で隔離環境をオンデマンドに作っている。
- **eval（エージェント評価）**: 1 つのスナップショットから多数の隔離環境を起動し、モデルやプロンプトだけを変えて比較する。環境のずれの影響を避けられる。
- **強化学習・大量試行**: コーディネーターがスナップショットをフォークして N 個の試行を並列に走らせ、最良のものからまた分岐する。バースト時の大量起動の性能が効く。
- **信頼されたアクセスの制御**: ユーザーが許可した範囲に応じ、Outbound Request Handler で資格情報の注入やポリシー適用を動的に更新する。
- **ロールアウト管理**: ID ハッシュによる 5% カナリア、進行中プロジェクトのイメージ固定、チェックポイントでの移行、イメージの選択を戻すだけのロールバック。

## 所感・ポイント

- 発表の核は「インフラをリクエスト時に実行されるコードにする」こと。イメージとインスタンスタイプという、これまで宣言的にデプロイ時に固定されていた 2 つの設定が、Durable Object 内のコードになる。
- 速度の改善は 2 段構え。スケジューリングは Durable Object のある場所から始まり（同一マシン → 同一ロケーション、イメージを持つホスト優先）、ホスト側では準備済みの仮想マシンを復元する。数値は ComputeSDK の独立ベンチマークに基づく（100 個の同時起動）が、バースト試験の 100,000 個 / 5.387 秒は Cloudflare 自身の予備的な結果という断りがある。
- **状態の切り分けを意識する**: 記事の整理では、Linux 環境は Container、ID・状態・ポリシー・ライフサイクルは Durable Object。スナップショットの参照を Durable Object のストレージに置くコード例が、その分担をよく表している。
- **移行の注意点**: 新機能は `ctx.container` 限定で、`Container` クラスと旧 `Sandbox` クラスは 2026 年 12 月 31 日以降は更新されない。既存の利用者は移行ガイドを確認したい。Sandbox SDK 1.0 は基底クラスではなくなる点も変更として大きい。
- `durable_object` スケジューリングポリシーは記事時点でパブリックベータ（「available to all today in public beta」）。スナップショットもパブリックベータと明記されている。
- 記事中のコードは `startWorkspace(workspace)` のように引数の型などを省略した抜粋で、そのままでは動かない部分がある（`isCanary` の定義など）。
- サンプル対象外の理由: 記事の中心機能である `durable_object` スケジューリングポリシーとスナップショットはパブリックベータであり、イメージのビルドが必要なうえ、記事自身が公式のデモ（[containers-demos](https://github.com/cloudflare/containers-demos/tree/main/sandbox)）を案内しているため、本リポジトリではデプロイ可能なサンプル（`examples/`）は作成していません。
- 画像は 2 点。ヘッダーは装飾イラスト、もう 1 点は Durable Object と Container のパターンを示した図。いずれも原文にキャプションはなく、呼称・説明は筆者の推定を含む。

## 関連リンク

- 原文（en-us）: [https://blog.cloudflare.com/faster-agent-sandboxes/](https://blog.cloudflare.com/faster-agent-sandboxes/)
- 本リポジトリ内の関連記事: [@cloudflare/computer](./2026-08-03-cloudflare-computer.md) / [Project Think](./2026-04-15-project-think.md) / [Cloudflare Agents](./2026-08-04-agents-on-cloudflare.md) / [Cloudflare OS](./2026-08-05-cloudflare-os.md) / [CI/CD をプラットフォーム上で](./2026-08-04-ci-workflows.md)
- 記事内から張られているリンク:
  - [Durable Object スケジューリングポリシーの API](https://developers.cloudflare.com/containers/api/durable-object-container/)
  - [ファイルシステムスナップショットのガイド](https://developers.cloudflare.com/containers/guides/snapshots/)
  - [`Container` クラスから Durable Object API への移行ガイド](https://developers.cloudflare.com/containers/guides/migrate-to-durable-object-container-api/)
  - [Durable Object スケジューリングポリシーを使った完全なサンドボックスのデモ（GitHub）](https://github.com/cloudflare/containers-demos/tree/main/sandbox)
  - [ComputeSDK Burst TTI Benchmark（Cloudflare）](https://www.computesdk.com/benchmarks/sandboxes/burst-tti/cloudflare)
  - [Dynamic Workers](https://developers.cloudflare.com/dynamic-workers/)
  - 連携: [Cursor Cloud Agents](https://developers.cloudflare.com/sandbox/tutorials/cursor-cloud-agents/)、[Devin Outposts](https://developers.cloudflare.com/sandbox/tutorials/devin-outposts/)、[OpenAI Agents API](https://developers.cloudflare.com/sandbox/tutorials/openai-agents-api/)、[Claude Managed Agents](https://blog.cloudflare.com/claude-managed-agents/)
  - [Containers のパブリックベータ発表（過去記事）](https://blog.cloudflare.com/containers-are-available-in-public-beta-for-simple-global-and-programmable/)
  - [Anthropic: Managed Agents（brain と hands の分離）](https://www.anthropic.com/engineering/managed-agents)
