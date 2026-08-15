# 数百万のリポジトリのCI/CDを、あなたのプラットフォーム上でCloudflareが動かす

- 原文: [https://blog.cloudflare.com/ci-workflows/](https://blog.cloudflare.com/ci-workflows/)（日本語版なし）
- 公開日: 2026-08-04
- 著者: André Venceslau, Mia Malden, Tomáš Hobza
- 関連: [[2026-08-04-agent-development-lifecycle.md]]

![ヘッダー画像](https://blog.cloudflare.com/_emdash/api/media/file/01KZ4Z776V82BHE7244CN1VVD7.png)
*図: 記事ヘッダー画像（出典: Cloudflare Blog https://blog.cloudflare.com/ci-workflows/）*

## TL;DR

- Cloudflareは、コードのストア・ビルド・テスト・デプロイをすべて自社プラットフォーム上で完結させる方向に進んでいる。その第一歩が、数百万規模のリポジトリを扱えるバージョン管理付きストレージ「Artifacts」だった。
- 今回発表されたのは、Cloudflare Workflows上に構築された **CI SDK**（`@cloudflare/ci`）。Artifactsへのpushイベントを直接Workflowに送り込み、その実行インスタンスをそのままCIジョブとして扱えるようにする。
- wrangler設定ファイルに新しい `events` フィールドを追加するだけで、Artifactsのpushイベント（`cf.artifacts.repo.pushed`）をトリガーにWorkflowを起動できる。
- CI/CDパイプラインはYAMLではなくTypeScriptで記述する。各ステップはWorkflowの `step.do()` に対応し、Sandbox SDKを使った安全な隔離環境でコマンドを実行する。
- AIエージェント（Think + Workers AI）を組み込んだ「自己修復（self-healing）」CIも実現できる。ビルドが壊れた際にエージェントが自動的に修正し、コミットとして提案する。
- プラットフォーム事業者は、顧客のリポジトリすべてに共通のCIを一括適用することも、顧客ごとにカスタムCIを書かせることも、同じnamespace内で同時に行える。

## 背景・課題

多くのチームが、社内向けのvibe codingプラットフォームであれ、顧客向け製品のコードによるカスタマイズ機能であれ、何らかの「プラットフォーム」を構築しつつある。こうしたプラットフォームは、Artifacts上に自社のコードと顧客のコードを合わせて数百万リポジトリ規模で保存し、その両方のバージョン管理を担うようになってきている。しかし、CI/CDパイプラインに対するニーズはチームによって異なる。プラットフォーム事業者は、自社コード用のCIジョブと顧客コード用のCIジョブを別々に定義したい場合もある。

さらに、こうしたプラットフォーム上で開発する顧客の多くは、CI/CDパイプラインの管理という余計な手間を負いたくない。理想は、プラットフォーム側がCI/CDパイプラインを一度書けば、それを全顧客のアプリケーションに横展開できることだ。一方で、顧客の中には自分たちでCIを定義したいケースもある。その場合は、dynamic workflowsの仕組みを使って顧客自身のWorkflowを書き、そのリポジトリだけにカスタムCIジョブを走らせられる。重要なのは「どちらか一方を選ぶ」必要がないという点で、プラットフォーム管理のCIと顧客のカスタムCIは同じnamespace内で同時に共存できる。

## 発表内容 / アーキテクチャ

### CI/CDパイプラインは、ただのWorkflowである

これまでもCloudflare上でCI/CDパイプラインを組み立てるための部品はすべて揃っていたが、今回はそれをより良い開発者体験としてまとめ上げた。GitHub Actionsに代表されるCI/CDパイプラインは、決まった順序でステップを実行し、いずれかが失敗すればパイプラインを止めてエラーを報告する、という一連の処理にすぎない。つまり本質的には、CI/CDパイプラインは単なるWorkflowである。YAMLで定義されたCI/CDは、いわゆる「YAML疲れ」につながる制約によってすぐに複雑化しがちだが、CI/CDパイプラインの各ステップは単純にWorkflowの `step.do()` に対応させられる。YAMLの代わりにTypeScriptでCI/CDパイプラインを定義することで、より高いカスタマイズ性と設定の柔軟性が得られる。

CI SDKの新しいツール群により、CIパイプライン内の各ステップ（build・lint・typecheckなど）を、Workflowsと Sandbox SDK の上に直接構築された安全な隔離環境で実行できるようになった。加えて、イベントサブスクリプション・キュー・キューコンシューマーを個別に設定しなくても、push時に直接CIジョブを起動できる。

これまではSandbox APIを直接呼び出し、CIパイプラインの各ステップ間で状態を自前管理する必要があった。CI SDKを使えば、各サンドボックス化されたコマンドをWorkflowの1ステップとして実行でき、Cloudflare Workflowsに組み込まれたリトライやタイムアウトの恩恵をそのまま受けられる。

ステップの結果（たとえばinstallステップ）をキャッシュすることでもパイプラインを高速化できる。依存関係のキャッシュにより、後続のすべての操作で再インストールが不要になり、CI/CDパイプライン全体のレイテンシが下がる。

CIジョブを定義するのに必要なのは次の3点だけである。

1. bundler（例: esbuild）・linter（例: eslint）・test runner（例: vitest）など、CIジョブが必要とする依存関係のinstallステップを定義する。
2. CIジョブの各ステップに対するコマンド（例: `bun run build`、`bun run test`、`bun run lint`）を指定する。依存関係がキャッシュされているため、各CIステップは並列実行でき、全体のレイテンシを削減できる。
3. `wrangler deploy` をdeployステップとして渡す。ビルドステップが成功すると、Workerは自動的にデプロイされる。

![CI/CDパイプラインのアーキテクチャ図](https://blog.cloudflare.com/_emdash/api/media/file/01KZ4Z76ZHWTPR0ZA4TBN50FGF.png)
*図: install・並列チェック・deployからなるCI/CDパイプラインの構成（出典: Cloudflare Blog https://blog.cloudflare.com/ci-workflows/）*

Workflow内でCIパイプラインを自分で書くことで、好きなだけカスタマイズできる。たとえば、CI Workflowからエージェントを呼び出して「自己修復（self-healing）」機能を持たせることもできる。ビルドのステップでエラーが起きた場合、エージェントが自動的に修正し、承認のためのコミットをpushする。

![プラットフォーム管理CIとカスタムCIの共存図](https://blog.cloudflare.com/_emdash/api/media/file/01KZ4Z777D8N208M839X5BR9F3.png)
*図: プラットフォーム管理のCIと顧客のカスタムCIが同じnamespace内で同時に動作する様子（出典: Cloudflare Blog https://blog.cloudflare.com/ci-workflows/）*

### 独自のCI Workflowを書く

自分のCI Workflowを書くには、`@cloudflare/ci` から `import { CIWorkflow } from '@cloudflare/ci'` してスタートする。まずはinstallステップから始める。

- CIステップが必要とする外部ツールやライブラリ（例: vite、react）を含む依存関係をダウンロードする。
- 依存関係が変更されたかどうかを追跡するlockfileを指定する。
- サンドボックスのスナップショットを使って依存関係をキャッシュし、以降のすべてのステップからアクセスできるようにする。スナップショットはアカウント上のR2バケットに保存される。

その後、buildと各種checkのステップを定義する。それぞれが独立した安全なサンドボックス環境で実行される。

Workflow内の各ステップはデフォルトで独立して開始されるため、特に指定しない限り並列実行される。各ステップを並列実行することで、CI実行全体のレイテンシが下がる。すべてのチェック（build・lint・test・typecheck）がdeployステップの開始前に完了することを保証するには、`Promise.all()` でラップする。

CI Workflowを実際にトリガーするには、Workerのwrangler設定ファイルに `events` フィールドを追加する（Workflow・Artifactのバインディングと並べて設定する）。`events` フィールドは、`triggers` フィールド内でサポートされる新しいフィールドである。

これまでもCloudflare QueuesのイベントサブスクリプションでArtifactsを購読し、push イベントのたびにビルドパイプラインを起動することはできたが、それにはイベントサブスクリプション・Queue・コンシューマー・キューハンドラーの設定が必要だった。現在は、そのイベントに対してWorkflowを直接ターゲットにでき、イベントが発火するたびにWorkflowのインスタンスがトリガーされる。

`cf.artifacts.repo.pushed` イベントのターゲットとしてCI Workflowを指定すると、そのイベントが発火するたびに自動的にWorkflowインスタンスがトリガーされる。各CI実行はWorkflowインスタンスとして表れるため、Workflowsダッシュボード上でステップごとの実行状況とオブザーバビリティを直接確認できる。これはArtifacts起点の統合であり、近い将来、Cloudflareアカウント内の他のソースからのイベントもプログラム的に消費できるよう型がサポートされる予定である。

namespace内のすべてのリポジトリでCI Workflowを実行したい場合（たとえば、顧客の全リポジトリに対してCIを実行するプラットフォーム事業者の場合）は、filter内で `repoName` を省略し、namespaceだけを指定すればよい。

CI Workflowを完全に動作させるには、パイプラインを支えるインフラ一式へのバインディングを追加する必要がある: `artifacts`・`workflows`・`containers`・`durable_objects`（+ exports設定、サンドボックスへのアクセス用）、そしてキャッシュを使う場合は `r2` バインディング（installステップのサンドボックスのスナップショットがバケットに保存されるため必須）。

![並列実行されるステップの図](https://blog.cloudflare.com/_emdash/api/media/file/01KZ4Z76GKCCHH18MTF77SMYVZ.png)
*図: lint・test・typecheck・buildが並列実行される様子（出典: Cloudflare Blog https://blog.cloudflare.com/ci-workflows/）*

### 自己修復するCI実行

CIジョブを自己修復可能にするには、LLMとそのエージェントハーネスの2つが必要になる。上記の例では、Workers AIを使ったThinkエージェントを組み込み、パイプライン内のエラーを検知して代わりに修正を実行させている。CIジョブはリモートで実行・再実行できるため、ノートPCを開いたままにしたり数分おきに様子を見に行ったりする必要はない。代わりにCloudflareがクラウド上で処理を行い、healerエージェントをコンテナ内でCIステップと並行して実行する。CIジョブに付きっきりで手動修正して再実行する代わりに、エージェントが修正した後にコミットをマージするだけでよい。

CIパイプラインを自己修復させるエージェントをセットアップするには、まずThinkエージェント用のDurable Objectバインディングを追加する（`HEALER` という名前で `Healer` クラスを指定する）。

次に、`HealingAgent` クラスを継承して `Healer` エージェントを作成する。`HealingAgent` には失敗時に呼び出す `heal` メソッドが含まれており、使用したいモデルを指定して渡す（記事の例では `@cf/moonshotai/kimi-k2.7-code` を指定）。

その後、失敗時にhealingエージェントを起動する `try/catch` ブロックで各ステップをラップする。失敗が `isCiRunnerFailure` によるものだけをhealするべきであり、それ以外のエラーは再スローする。エラーは `enrichFailure` でイベントやbaseBranchの情報とともにエージェントへ渡され、healerは `prompt: 'Fix every observed failure without weakening validation.'`（検証を弱めることなく、観測されたすべての失敗を修正せよ）という指示のもとで修正を行う。修正結果として `branch`・`commit`・`steps`（修正に要したステップ数）が返され、元の失敗と修正結果を合わせた `CiRunFailedWithFix` がスローされる。元の実行は失敗のままにしておき、検証済みの修正は別ブランチ上に存在する形になる。

この例は自己修復パイプラインを示しているが、本質的には「Bring Your Own Workflow（BYO-W）」モデルにより、CIジョブを好きなようにカスタマイズできる。セキュリティルール・フィルター・条件付きCIステップを追加する場所としても使え、プラットフォーム事業者はBYO-Wモデルを使って、チームや顧客、アプリケーションごとに異なるCI/CDパイプラインを個別のユースケースに応じて設定できる。

![自己修復CIワークフローの図](https://blog.cloudflare.com/_emdash/api/media/file/01KZ4Z77AA36JAVHQKVZ7B6VZ8.png)
*図: AIエージェントによる自己修復CIワークフローの流れ（出典: Cloudflare Blog https://blog.cloudflare.com/ci-workflows/）*

### Workflow上で動かすメリット

CIパイプラインをCloudflare Workflow上で実行すると、以下を自動的に手に入れられる。

- **レジリエントなリトライ（永続実行）**: CIジョブのいずれかのステップが失敗した場合、状態が永続化されたまま自動的にリトライされ、進行状況が失われない。各ステップは個別にリトライ・タイムアウトの挙動をカスタマイズできるため、ステップごとに異なる失敗時ロジックを定義できる。さらに、特定のステップから再開できるため、たとえばlintだけが失敗した場合にパイプライン全体を再実行する必要がない。
- **Workflowsのオブザーバビリティ**: Workflowsダッシュボード上でCIジョブをステップごとに確認できる。各インスタンスは入力・出力・実時間・CPU時間とともにステップを表示する。Workflowsダイアグラムでジョブを可視化することで、どのステップが並列に、どのステップが順次実行されているかを一目で把握できる。Workers ObservabilityとGraphQLを通じてWorkflowsのログを確認し、CIジョブの実行についてさらに詳しく調べることもできる。
- **コードであることの強み**: Workflow内でCIを実行することで、望むものは何でもステップとして書ける。たとえば、CI/CDパイプラインの一部としてAIコードレビュアーを実行したり、`step.do()` を使ってコードレビューエージェントを呼び出したり、コードに落とし込める任意のカスタムロジックを実行したりできる。他にも、ビルド成果物をR2に書き込んだり、CIが失敗・完了・mainへのマージをした際にメールを送信したりする例が考えられる。

![サンドボックス隔離環境の図](https://blog.cloudflare.com/_emdash/api/media/file/01KZ4Z773EGW5B21ZP96VBS7PP.png)
*図: 各CIステップが安全な隔離サンドボックス環境で実行される仕組み（出典: Cloudflare Blog https://blog.cloudflare.com/ci-workflows/）*

### 今後の展望

- Workers & Workers for Platforms向けの直接統合: mainブランチへのpushで自動デプロイし、非デフォルトブランチへのpushでプレビューを作成する `build.preview()` と `build.deploy()` プリミティブ
- 段階的デプロイ: Workflowsを通じてパーセンテージベースのロールアウトを管理し、デプロイの進行やロールバックロジックをカスタマイズできるようにする
- モノレポ対応: 1つのCIパイプラインで複数Workerのデプロイをまとめて管理できるようにする簡素化
- トリガー: Artifactsだけでなく、任意のバージョン管理システムからのpushイベントを送ってリポジトリのCIジョブを実行できるようにする

## コード例

記事では、TypeScriptによるCI Workflow定義のコード例が段階的に示されている。

### 例1: install → 並列チェック → deploy の基本パイプライン

```typescript
const deps: CiRunnerResult = await ci.runner({
  name: 'install',
  command: 'bun install --frozen-lockfile',
  cache: { inputs: ['package.json', 'bun.lock'] },
});

await Promise.all([
  deps.runner({ name: 'lint', command: 'bun run lint' }),
  deps.runner({ name: 'test', command: 'bun run test' }),
  deps.runner({ name: 'typecheck', command: 'bun run typecheck' }),
  deps.runner({ name: 'build', command: 'bun run build' }),
]);

await deps.runner({
  name: 'deploy',
  command: 'bun wrangler deploy',
  cloudflareCredentials: {
    accountId: this.env.CLOUDFLARE_DEPLOY_ACCOUNT_ID,
  },
});
```

**解説**: `ci.runner()` の呼び出し1回が、Workflowの1ステップ（`step.do()`）に対応する。最初の `install` ステップは `cache.inputs` に指定したファイル（`package.json` と `bun.lock`）の内容に基づいてキャッシュされ、以降のステップから参照できる `deps` オブジェクトを返す。`deps.runner()` を `Promise.all()` でまとめて呼び出すことで、lint・test・typecheck・buildの4つの検証ステップが並列実行され、CI全体のレイテンシが短縮される。すべての検証が完了して初めて、最後の `deploy` ステップが `wrangler deploy` を実行する。

### 例2: `events` フィールドによるトリガー設定（wrangler設定）

```json
{
  "triggers": {
    "events": [
      {
        "type": "cf.artifacts.repo.pushed",
        // filter is optional. If you don't set repoName we will run the same workflow for every push on any repo in your Artifacts namespace
        "filter": {
          "namespace": "CI",
          "repoName": "my-repo"
        },
        "target": {
          "type": "workflow",
          "workflow_name": "ci-workflow"
        }
      }
    ]
  }
}
```

**解説**: `triggers.events` に `cf.artifacts.repo.pushed` イベントを登録すると、指定した `namespace`（と任意で `repoName`）に該当するArtifactsへのpushが起きるたびに、`target.workflow_name` で指定したWorkflowのインスタンスが自動的に起動される。`repoName` を省略すれば、そのnamespace内のどのリポジトリへのpushでも同じWorkflowが実行されるため、プラットフォーム事業者が顧客の全リポジトリに同一のCIを適用する用途に向いている。

### 例3: 自己修復エージェント（Healer）の定義

```typescript
export class Healer extends HealingAgent {
  getModel() {
    return '@cf/moonshotai/kimi-k2.7-code';
  }
}
```

**解説**: `HealingAgent` を継承し、`getModel()` で使用するモデルを指定するだけで、失敗時に呼び出せる `heal` メソッドを持つエージェントが定義できる。Durable Objectとして `HEALER` バインディングにひも付けて使用する。

### 例4: 失敗を検知してhealエージェントを呼び出す

```typescript
let deps: CiRunnerResult;
try {
  // Install once, then run independent checks from the shared and cached snapshot
  deps = await ci.runner({
    name: 'install',
    command: 'bun install --frozen-lockfile',
    cache: { inputs: ['package.json', 'bun.lock'] },
  });

  await Promise.all([
    deps.runner({ name: 'lint', command: 'bun run lint' }),
    deps.runner({ name: 'test', command: 'bun run test' }),
    deps.runner({ name: 'typecheck', command: 'bun run typecheck' }),
    deps.runner({ name: 'build', command: 'bun run build' }),
  ]);
} catch (failure) {
  // This catches both failed Sandbox commands and ordinary Workflow errors.
  // Only failures reported by a runner should be healed; rethrow the rest.
  if (!isCiRunnerFailure(failure)) {
    throw failure;
  }

  // Pass the error along to the agent so that it can fix it
  const healed = await step.do(
    'heal',
    { retries: { limit: 0, delay: 0 }, timeout: '5 hours' },
    async () => {
      const healer = await getAgentByName(this.env.HEALER, event.instanceId);
      using result = await healer.heal({
        failure: enrichFailure({ failure, event, baseBranch }),
        prompt: 'Fix every observed failure without weakening validation.',
      });
      // Report the Fix Branch, its commit, and how many steps it took.
      const { branch, commit, steps } = result;
      return { branch, commit, steps };
    }
  );

  // The source run stays failed; its verified fix lives on another branch
  throw new CiRunFailedWithFix(failure, healed);
}

await deps.runner({
  name: 'deploy',
  command: 'bun wrangler deploy',
});
```

**解説**: `try` ブロックでinstallと4つの並列チェックを実行し、いずれかが失敗すると `catch` に処理が移る。`isCiRunnerFailure()` で「runnerが報告した失敗」だけを対象にし、それ以外のエラーはそのまま再スローする点がポイントである。healへの委譲自体も `step.do('heal', ...)` というWorkflowステップとして実行され、5時間というタイムアウトとリトライなし（`limit: 0`）が設定されている。`healer.heal()` は失敗内容とプロンプトを受け取り、修正のブランチ・コミット・ステップ数を返す。最終的に、元の失敗と修正結果を合わせた `CiRunFailedWithFix` がスローされ、元の実行自体は「失敗」のまま記録される一方、検証済みの修正は別ブランチに残る。

## ユースケース

### プラットフォーム事業者によるCI一括管理

数百万規模のリポジトリをArtifacts上でホストするプラットフォーム事業者が、`repoName` を指定しないイベントfilterを使って、namespace内の全顧客リポジトリに同一のCI/CDパイプラインを適用するケース。プラットフォーム側は一度Workflowを書くだけで済み、顧客はCI/CDパイプラインを個別に管理する必要がなくなる。

### 顧客ごとのカスタムCI（dynamic workflows）

プラットフォームの顧客のうち、自分たちで独自のCIを定義したいケースでは、dynamic workflowsを使って顧客自身のWorkflowを書き、自分のリポジトリだけにカスタムCIジョブを走らせられる。プラットフォーム管理のCIと共存できるため、標準化と柔軟性の両立が可能になる。

### 自己修復CIによる無人運用

Think + Workers AIによるhealingエージェントを組み込み、ビルドやlintの失敗を自動的に修正してブランチとして提案させるケース。エンジニアはCIジョブに張り付いて手動修正・再実行を繰り返す必要がなくなり、エージェントが用意した修正コミットをレビューしてマージするだけで済む。

## 所感・ポイント

- 「CI/CDパイプラインはただのWorkflowである」という言い切りが本記事の核心である。YAMLの制約から離れ、TypeScriptの通常のプログラミングモデル（`try/catch`、`Promise.all`、クラス継承）でCI/CDを記述できる点は、既存のGitHub Actions的なCIに慣れたエンジニアには大きな発想の転換に見える。
- 自己修復のコード例が「`isCiRunnerFailure` で対象を絞り、それ以外は再スロー」「healの結果は別ブランチに置き、元の実行は失敗のまま記録する」という設計になっている点は、AIエージェントを本番運用のCIに組み込む際の安全策として参考になる。エージェントの修正がそのまま本流にマージされるのではなく、必ず人間のレビューを経る設計である。
- Artifacts・Workflows・Sandbox SDK・Workers AIという既存のCloudflareプリミティブを組み合わせて新しいプロダクト（CI SDK）を構成している点は、Cloudflareのプラットフォーム戦略（プリミティブの組み合わせによる新機能提供）を象徴する事例と言える。

> **Workers サンプル**: 対象外（`@cloudflare/ci`の中核機能はSandbox SDK・Containers・Artifacts（いずれもベータ機能や有料プラン前提）を組み合わせた実行基盤に依存し、無料/標準プランの範囲で100行前後の最小実装として再現するのが難しいため）

## 関連リンク

- [Artifacts ドキュメント](https://developers.cloudflare.com/artifacts/)
- [CI SDK リポジトリ（GitHub）](https://github.com/cloudflare/ci)
- [Cloudflare Workflows ドキュメント](https://developers.cloudflare.com/workflows/)
- [@cloudflare/ci（npm）](https://www.npmjs.com/package/@cloudflare/ci)
- [自己修復CIのサンプル（Project Think）](https://github.com/cloudflare/ci/blob/main/examples/self-healing)
- [Dynamic Workflows](https://blog.cloudflare.com/dynamic-workflows/)
- [Sandbox SDK ドキュメント](https://developers.cloudflare.com/sandbox/)
- [Workflows CI ガイド](https://developers.cloudflare.com/artifacts/guides/build-and-deploy-on-push/)
- [Cloudflare Developers Discord](https://discord.cloudflare.com/)
