---
routerMode: hash
theme: default
title: 数百万のリポジトリのCI/CDを、あなたのプラットフォーム上でCloudflareが動かす
info: |
  Cloudflare Blog記事「Run CI/CD for millions of repos — on your platform, on Cloudflare」の解説スライド。
  原文: https://blog.cloudflare.com/ci-workflows/
class: text-center
highlighter: shiki
drawings:
  persist: false
transition: slide-left
mdc: true
lineNumbers: true
themeConfig:
  primary: '#f6821f'
---

# 数百万のリポジトリのCI/CDを
# あなたのプラットフォーム上でCloudflareが動かす

<div class="pt-4 text-sm opacity-70">
原文: https://blog.cloudflare.com/ci-workflows/<br>
公開日: 2026-08-04
</div>

---

# TL;DR

- Cloudflareは、コードのストア・ビルド・テスト・デプロイを自社プラットフォーム上で完結させる方向へ。第一歩はバージョン管理付きストレージ「Artifacts」
- 今回発表は、Workflows上に構築された<strong>CI SDK</strong>（`@cloudflare/ci`）。Artifactsのpushイベントをそのままワークフロー実行としてCIジョブ化
- CI/CDパイプラインはYAMLではなくTypeScriptで記述し、Sandbox SDKによる隔離環境でコマンドを実行
- Think + Workers AIを組み込んだ「自己修復（self-healing）」CIも実現可能
- 同じnamespace内で、共通CIの一括適用と顧客ごとのカスタムCIを同時に行える

---

# アジェンダ


- 背景: プラットフォームが抱えるCI/CDの悩み
- CI/CDパイプラインは、ただのWorkflowである
- CI SDK（`@cloudflare/ci`）のアーキテクチャ
- コード例: install → 並列チェック → deploy
- トリガー設定と自己修復（self-healing）CI
- Workflow上で動かすメリット
- ユースケース
- 今後の展望


---

# 背景: プラットフォームとCI/CDの悩み


- 多くのチームが「プラットフォーム」を構築している（社内vibe codingツール〜顧客向けカスタマイズ機能まで）
- Artifacts上に自社コードと顧客コードを合わせて**数百万リポジトリ規模**で保存
- チームごとにCI/CDへのニーズは異なる
- 顧客の多くはCI/CD管理という手間を負いたくない


<br>


理想: プラットフォーム側が一度書いたCI/CDを全顧客アプリへ横展開したい
一方で、顧客自身がカスタムCIを書きたいケースもある


---
layout: image-right
image: https://blog.cloudflare.com/_emdash/api/media/file/01KZ4Z777D8N208M839X5BR9F3.png
backgroundSize: contain
---

# 両立する2つのCIモデル

**プラットフォーム管理CI**（一括定義・namespace全体に適用）と
**顧客のカスタムCI**（dynamic workflowsで自分のリポジトリに適用）が、
同じnamespace内で同時に動作できる

<footer class="text-xs opacity-50 mt-4">
出典: Cloudflare Blog https://blog.cloudflare.com/ci-workflows/
</footer>

---

# CI/CDパイプラインは、ただのWorkflowである


- GitHub Actions的なCI/CDは「決まった順序でステップを実行し、失敗したら止める」処理
- 本質的には**単なるWorkflow**
- YAMLの代わりに**TypeScript**でCI/CDを定義 → 高いカスタマイズ性
- 各ステップ = Workflowの `step.do()`


<br>


> YAMLで定義されたCI/CDは「YAML疲れ」を招く制約ですぐ複雑化する


---
layout: image-right
image: https://blog.cloudflare.com/_emdash/api/media/file/01KZ4Z76ZHWTPR0ZA4TBN50FGF.png
backgroundSize: contain
---

# CI/CDパイプラインの構成

install → 並列チェック（lint/test/typecheck/build）→ deploy

<footer class="text-xs opacity-50 mt-4">
出典: Cloudflare Blog https://blog.cloudflare.com/ci-workflows/
</footer>

---

# CI SDKが提供するもの


- 各ステップ（build・lint・typecheck）を**安全な隔離環境**で実行（Workflows + Sandbox SDK）
- イベントサブスクリプション／キュー／コンシューマーの個別設定なしで**push時に直接CI起動**
- Sandbox APIを直接呼ばず、各コマンドを**Workflowの1ステップ**として実行 → リトライ・タイムアウトを標準装備
- **依存関係のキャッシュ**でinstallの再実行を回避し、レイテンシを削減


---

# CIジョブ定義に必要な3ステップ


1. **install**: bundler・linter・test runnerなど依存関係をインストール
2. **各ステップのコマンド**: `bun run build` / `bun run test` / `bun run lint` など（依存関係はキャッシュ済みなので並列実行可能）
3. **deploy**: `wrangler deploy` を渡すと、ビルド成功時に自動デプロイ


---

# コード例① 基本パイプライン

CI/CDパイプラインが「ただのWorkflow」であることを、実際のコードで確認する。次のコードでは以下に注目

- 1〜5行目: `ci.runner()` の呼び出し1回 = Workflowの1ステップ（`step.do()`）。`install` は `cache.inputs` のファイル内容に基づきキャッシュされ、`deps` を返す
- 7〜12行目: `deps.runner()` を `Promise.all()` でまとめることで **lint/test/typecheck/build を並列実行**
- 14〜20行目: すべての検証が完了して初めて `deploy` ステップが `wrangler deploy` を実行

---

# コード例①（コード全文）

```ts {1-5|7-12|14-20|all}
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


---
layout: image-right
image: https://blog.cloudflare.com/_emdash/api/media/file/01KZ4Z76GKCCHH18MTF77SMYVZ.png
backgroundSize: contain
---

# ステップは
# デフォルトで並列実行

依存関係のない検証は同時に走らせ、
CI全体のレイテンシを短縮する

<footer class="text-xs opacity-50 mt-4">
出典: Cloudflare Blog https://blog.cloudflare.com/ci-workflows/
</footer>

---
layout: two-cols
---

# コード例② トリガー設定（wrangler config）

```json {2-3|5-8|9-13|all}
{
  "triggers": {
    "events": [
      {
        "type": "cf.artifacts.repo.pushed",
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

<style>
.slidev-code { font-size: 0.72em; }
</style>

::right::

<div class="pl-4 pt-8">

- `triggers.events` に `cf.artifacts.repo.pushed` イベントを登録
- 該当する `namespace`（と任意で `repoName`）へのpushでWorkflowが自動起動
- `repoName` を**省略**すると、namespace内の全リポジトリへのpushで同じWorkflowを実行
- プラットフォーム事業者が顧客の全リポジトリに同一CIを適用する用途に最適
- 必要なバインディング: `artifacts` / `workflows` / `containers` / `durable_objects` / `r2`（キャッシュ用）

</div>


---
class: text-center
---

# 自己修復（self-healing）CI

ビルドが壊れたら、AIエージェントが自動的に修正を提案する

---

# 自己修復に必要な2つの要素


- **LLM**: 修正内容を生成するモデル
- **エージェントハーネス**: Think agent（`HealingAgent`）


<br>


CIジョブはリモートで実行・再実行される → ノートPCを開いたまま待つ必要がない
エンジニアは**修正コミットをレビューしてマージするだけ**


---
layout: image-right
image: https://blog.cloudflare.com/_emdash/api/media/file/01KZ4Z77AA36JAVHQKVZ7B6VZ8.png
backgroundSize: contain
---

# 自己修復CIの流れ

失敗検知 → エージェントが修正 →
別ブランチへコミット → 人間が承認

<footer class="text-xs opacity-50 mt-4">
出典: Cloudflare Blog https://blog.cloudflare.com/ci-workflows/
</footer>

---

# コード例③ Healerエージェントの定義

```ts
export class Healer extends HealingAgent {
  getModel() {
    return '@cf/moonshotai/kimi-k2.7-code';
  }
}
```


`HealingAgent` を継承し `getModel()` を実装するだけで、
失敗時に呼び出せる `heal` メソッドを持つエージェントになる


---

# コード例④ 失敗検知とhealへの委譲

ビルドが壊れたとき、CIジョブがどうやってHealerエージェントに処理を委譲するか。
次の2枚のコード（1/2・2/2）に分けて見ていく。以下に注目

- **1/2の2〜14行目**: `try` でinstall（3〜7行目）と並列チェック lint/test/typecheck/build（9〜14行目）を実行
- **1/2の15〜18行目**: `catch (failure)` と `isCiRunnerFailure()` — **runnerが報告した失敗だけ**をhealの対象にし、それ以外は再スロー
- **2/2の1〜13行目**: healへの委譲自体も `step.do('heal', ...)`（タイムアウト5時間・リトライなし）で実行
- **2/2の6〜10行目**: `healer.heal()` は修正の `branch` / `commit` / `steps` を返す
- **2/2の15行目**: 元の実行は `CiRunFailedWithFix` で**失敗のまま記録**し、検証済みの修正は**別ブランチ**に残す

---

# コード例④ 失敗検知とhealへの委譲（1/2）

```ts {1-13|14-19|all}
let deps: CiRunnerResult;
try {
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
  if (!isCiRunnerFailure(failure)) {
    throw failure;
  }

  // heal への委譲は次のスライドへ続く
```

---

# コード例④ 失敗検知とhealへの委譲（2/2）

```ts {1-13|15-16|18-21|all}
  const healed = await step.do(
    'heal',
    { retries: { limit: 0, delay: 0 }, timeout: '5 hours' },
    async () => {
      const healer = await getAgentByName(this.env.HEALER, event.instanceId);
      using result = await healer.heal({
        failure: enrichFailure({ failure, event, baseBranch }),
        prompt: 'Fix every observed failure without weakening validation.',
      });
      const { branch, commit, steps } = result;
      return { branch, commit, steps };
    }
  );

  throw new CiRunFailedWithFix(failure, healed);
}

await deps.runner({
  name: 'deploy',
  command: 'bun wrangler deploy',
});
```

<div class="text-xs opacity-50 mt-2">前スライドの try / catch(failure) の続き</div>


---
layout: image-right
image: https://blog.cloudflare.com/_emdash/api/media/file/01KZ4Z773EGW5B21ZP96VBS7PP.png
backgroundSize: contain
---

# 各ステップは
# 隔離サンドボックスで実行

Sandbox SDK上の安全な環境で
コマンドを実行する

<footer class="text-xs opacity-50 mt-4">
出典: Cloudflare Blog https://blog.cloudflare.com/ci-workflows/
</footer>

---

# Workflow上で動かすメリット


- **レジリエントなリトライ**: 状態を永続化した自動リトライ、ステップ単位のリトライ/タイムアウト設定、特定ステップからの再開
- **Workflowsのオブザーバビリティ**: ダッシュボードでステップごとの入出力・実時間・CPU時間を確認、並列/直列の可視化
- **コードであることの強み**: AIコードレビュアー・R2への成果物書き込み・完了/失敗時のメール通知など、任意のロジックをステップとして実装可能


---
class: text-center
---

# ユースケース

---

# ユースケース①: プラットフォームによるCI一括管理


- `repoName` を指定しないfilterで、namespace内の**全顧客リポジトリ**に同一CIを適用
- プラットフォーム側は一度Workflowを書くだけ
- 顧客はCI/CDパイプラインを個別管理しなくてよい


---

# ユースケース②: 顧客ごとのカスタムCI


- dynamic workflowsで顧客自身がWorkflowを記述
- 自分のリポジトリだけにカスタムCIジョブを適用
- プラットフォーム管理CIと**同じnamespace内で共存**可能


---

# ユースケース③: 自己修復CIによる無人運用


- Think + Workers AIのhealingエージェントがビルド/lintの失敗を自動修正
- エンジニアはCIジョブに張り付く必要がない
- 用意された修正コミットを**レビューしてマージするだけ**


---

# 今後の展望


- **直接統合**: `build.preview()` / `build.deploy()` プリミティブ（Workers & Workers for Platforms向け）
- **段階的デプロイ**: Workflowsによるパーセンテージベースのロールアウト管理
- **モノレポ対応**: 1つのCIパイプラインで複数Workerのデプロイを管理
- **トリガー拡張**: Artifacts以外のバージョン管理システムからのpushイベントにも対応


---

# まとめ


- CI/CDパイプラインは、本質的には**ただのWorkflow**である
- YAMLではなくTypeScriptで、`step.do()` を単位にCI/CDを記述できる
- 依存関係キャッシュと並列実行の標準化で、CIのレイテンシを削減
- AIエージェントによる**自己修復CI**で、ビルド失敗の一次対応を自動化
- プラットフォーム管理CIと顧客のカスタムCIが**同じnamespaceで共存**可能


---

<div class="text-center">

# 参考リンク

</div>

- 原文: [Run CI/CD for millions of repos — on your platform, on Cloudflare](https://blog.cloudflare.com/ci-workflows/)
- [Artifacts ドキュメント](https://developers.cloudflare.com/artifacts/)
- [CI SDK リポジトリ（GitHub）](https://github.com/cloudflare/ci)
- [Cloudflare Workflows ドキュメント](https://developers.cloudflare.com/workflows/)
- [自己修復CIのサンプル（Project Think）](https://github.com/cloudflare/ci/blob/main/examples/self-healing)
- [Sandbox SDK ドキュメント](https://developers.cloudflare.com/sandbox/)
- 関連デッキ: <a href="../project-think/" target="_blank">Project Think：Cloudflareで次世代のAIエージェント構築</a>

<div class="pt-8 text-sm opacity-50">
Wiki: docs/articles/2026-08-04-ci-workflows.md
</div>
