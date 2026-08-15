# Cloudflareにエージェント開発ライフサイクルの時代が到来

- 原文: [https://blog.cloudflare.com/ja-jp/agent-development-lifecycle/](https://blog.cloudflare.com/ja-jp/agent-development-lifecycle/)（英語版: [https://blog.cloudflare.com/agent-development-lifecycle/](https://blog.cloudflare.com/agent-development-lifecycle/)）
- 公開日: 2026-08-04
- 関連: [Agents Week 2026 まとめ](./2026-08-13-agents-week-review.md) / [Cloudflare Agentsの紹介](./2026-08-04-agents-on-cloudflare.md) / [ローカルトレースでWorkersをデバッグ](./2026-08-04-local-tracing.md) / [Cloudflare Walletsを発表](./2026-08-04-wallets.md)

![記事ヘッダー画像](https://blog.cloudflare.com/_emdash/api/media/file/01KZ6A4Q5CY65JFVVYMJCV4AG7.png)
*図: 記事ヘッダー画像（出典: Cloudflare Blog https://blog.cloudflare.com/ja-jp/agent-development-lifecycle/）*

## TL;DR

- エージェントがコードを書く速度は、人間のチームがそのコードをレビュー・デプロイ・保守する速度をすでに上回っている。
- 従来のソフトウェア開発ライフサイクル（SDLC、1975年にRANDが提唱）は「プラン・デザイン・実装・テスト・デプロイ・保守・廃止」の7段階から成るが、AIが高速化するのは「実装」だけであり、後工程（レビュー・デプロイ・保守）の負荷はむしろ増大している。
- Cloudflareは、コーディング以降の工程（検証・マージ・デプロイ・監視・バグ対応）もエージェントに委ねる**ソフトウェアファクトリー**という発想を提示し、それを支える概念として SDLC に代わる **ADLC（Agent Development Lifecycle：エージェント開発ライフサイクル）** を提唱する。
- ソフトウェアファクトリーが成立するには「プログラムから操作可能」「水平方向にスケール可能」「再現可能」「リアルタイムかつプッシュ型」「個別性」「許可制」「自己改善性」という7つの要件を満たす必要がある。
- この考え方を支えるツール群として、`@cloudflare/ci`、ローカル開発環境でのOpenTelemetryトレース、Cloudflare Agents / Agent Traces、AIによるエンジニアリング標準の適用、Astroのソフトウェアファクトリー事例などが同時に発表された。

## 背景・課題

記事はまず「エージェントのコーディング速度は、開発チームがそのコードをレビュー、デプロイ、保守するスピードを上回ります」という現状のギャップを指摘する。従来のソフトウェア開発ライフサイクル（SDLC）は1975年にRANDが提唱した「Systems Development Lifecycle」に遡り、プラン・デザイン・実装・テスト・デプロイ・保守・廃止という7段階で構成されてきた。

AIコーディングエージェントの登場によって、この中の「実装」工程は劇的に高速化した。しかし、レビュー・デプロイ・保守といった後続工程はそのままの速度でしか回らないため、ボトルネックがそこへ移動しただけになっている。特にオープンソースメンテナーやプロダクションエンジニアは、「AIが雑に量産しただけの成果物（slop）」の後始末に追われ、システムや顧客、そして自分自身を守ることに多くの意識を割かれるようになっているというのが記事の問題提起である。

## 発表内容 / アーキテクチャ

### 「エージェントに多くのことを任せる」という逆説的な解決

多くの企業では、エージェントはコーディングだけに徹し、検証・マージ・デプロイ・監視・バグ対応は人間が引き取るという分業構造になっている。しかしCloudflareはこの構造そのものを見直し、エージェントを「サービスの利用者」として扱う方向に舵を切っている。エージェントがドメインを購入したり、一時的なアカウントを作成したり、Cloudflare APIのすべての機能を直接利用したりできるようにする、という取り組みがその一例として紹介されている。

![SDLCの課題を示す図](https://blog.cloudflare.com/_image?href=https%3A%2F%2Fblog.cloudflare.com%2F_emdash%2Fapi%2Fmedia%2Ffile%2F01KZ6A6DRX3WD507M2ZM4JJ353.png&w=715&h=336&f=webp&fit=cover&position=center)
*図: SDLC各段階のボトルネックを可視化した図（出典: Cloudflare Blog https://blog.cloudflare.com/ja-jp/agent-development-lifecycle/）*

### 同時発表された新しいツール群

- **`@cloudflare/ci`**: Cloudflare Workflowsを基盤とした、数百万ものリポジトリでCI/CDを実行するための新しい方法。自己修復機能を備え、より複雑なタスクが必要な場合はエージェントを起動して対応できる。
- **ローカル開発環境でのOpenTelemetryトレース**: 本番環境と同じ可観測性をエージェントに提供する仕組み。WranglerとCloudflare Viteプラグインに組み込まれている（詳細は[ローカルトレースの記事](./2026-08-04-local-tracing.md)を参照）。
- **Cloudflare AgentsとAgent Traces**: エージェントの状態を観測・改善するための新基盤。OpenTelemetryトレースを中心としたエージェント管理環境を提供する（詳細は[Cloudflare Agentsの記事](./2026-08-04-agents-on-cloudflare.md)を参照）。
- **AIを活用したCloudflareエンジニアリング標準の適用**: すべての製品・システムのリポジトリや仕様に対してベストプラクティスを機械的に適用する社内の取り組み。
- **Astroのソフトウェアファクトリー構築**: 大規模なオープンソースプロジェクト（Astro）において、Issueの自動分類・再現・検証・修正を行うシステムを構築した経験の共有。

### SDLCからADLC（Agent Development Lifecycle）への転換

記事はここで「SDLCをADLC（Agent Development Lifecycle：エージェント開発ライフサイクル）へ置き換える時期が来た」と主張する。従来のSDLCは「ソフトウェアチーム」向けに設計された概念だが、ADLCは「ソフトウェアファクトリー」向けの概念だという整理である。

**ソフトウェアファクトリー**とは、エージェントを中心に動作し、入力された情報（本番環境のエラー、顧客からのバグ報告、新機能のアイデアなど）をもとに、ソフトウェアの構築・改善・デプロイ・管理までを自律的に行うシステムを指す。現在の多くのプロジェクトでは、人間が各工程を管理し、その工程内の個別作業をエージェントに委任するにとどまっている。ソフトウェアファクトリーは「ソフトウェア製作工程すべての自動化は目指せるのか」「人間の時間を、創造性・センス・判断が必要な作業へ振り向けられるか」という問いに基づく発想である。

### ソフトウェアファクトリーに必要な7つの要件

1. **プログラムから操作可能**: 画面をクリックする手動操作（ClickOps）はエージェントには不可能。すべてがAPIとして提供されている必要がある。
2. **水平方向にスケール可能**: すべてのエージェントが、本番環境と一致する専用のプレビュー環境を持てる必要がある。
3. **再現可能**: 「iPhone 15で4G通信をシミュレートした場合」「特定の国のIPアドレスからアクセスした場合」といった特殊な条件下で起きるバグも再現・テストできる必要がある。
4. **リアルタイムかつプッシュ型**: 人間がダッシュボードを確認しに行くような運用では機能しない。イベントをきっかけにエージェントが自ら作業を開始する仕組みが必要。
5. **個別性**: すべての変更は、関連しない部分に影響を与えることなく個別にテスト・リリース・観察でき、必要ならロールバックできる必要がある。
6. **許可制**: 信頼できる少人数の人間にだけ本番環境へのSSH権限を与える運用は多いが、エージェントに同様の権限を無条件に与えるわけにはいかない。必要に応じて権限を段階的に拡大できる仕組みが不可欠。
7. **自己改善性**: 人間が経験から学ぶのと同様に、エージェントも経験（実行結果やフィードバック）から学習できる仕組みが必要。

### 自動運転車との類比

記事は、本番環境で安全に動作するソフトウェアファクトリーの実現を、自動運転車の進化になぞらえている。他の自律システムと同じく、「80%の確率で正しく動く」段階から「99.999%に近い信頼性」へ到達することが課題であり、自動運転車がLidarセンサー・カメラ・強力な推論用コンピューティング・必要に応じた遠隔介入システムといった、従来の車にはなかった仕組みを備えているのと同様に、エージェント駆動の開発にも新しい仕組みが必要だと述べる。

エージェントに自動承認・自動マージをまだ許可していない理由として、「構築しているものの重要性に比例して、その必要性が増していく」ことを挙げている。ダッシュボードへの小さな変更であっても、複数の役割・異なる専門分野・組織構造をまたぐ可能性があり、主観的な判断を伴う変更ほど、テストしにくくエージェントへの委任が難しくなるという指摘である。

### Workflowsの活用

Cloudflare Workflowsは、複数の処理ステップを連結し、失敗したタスクを自動的に再試行し、数分から数週間にわたって状態を保持できる仕組みである。複雑で動的なビジネスプロセスを、理解しやすい論理的なプログラムとして定義できる。Workflowsは単なる直線的な処理列ではなく、状況に応じて処理内容を動的に定義でき、エージェントや別のWorkflowを起動することもできる。この性質が、ADLCの土台となるオーケストレーション機構として活用されている。

### Cloudflareの完全なADLC技術スタック

SDLCの各段階に対応する形で、Cloudflareの技術スタックが整理されている。

**プラン・デザイン・実装段階**
- Vite、Rolldown、Oxc — エージェント向けの最速ツールチェーン
- ローカル開発環境の完全対応 — エージェントがローカルで確認するものと本番ランタイムを一致させる
- Local Explorer、Local Traces — 本番環境と同じAPIをローカルでデバッグ可能にする
- リモートバインディング — ローカルでコードを実行しながら、Cloudflareの本番リソースを利用可能にする
- プレビューURL — すべてのPRに専用のプレビュー環境を提供する

**テスト段階**
- Browser Run — クラウド上で実行できる、プログラムから制御可能なヘッドレスブラウザ
- Vitest — Workers実行環境上でテストを実行できる統合

**デプロイ段階**
- Flagship — すべての変更に専用のフィーチャーフラグを付与する仕組み
- 段階的デプロイ — コードの変更をトラフィックの一部に段階的に適用する仕組み

**保守・廃止段階**
- Workers Logs — リアルタイムでログを追跡し、必要に応じてログを検索して問題を特定・自動修正する
- Agent Traces — エージェントの全セッションを記録し、改善に活用する
- Cloudflare MCP Server — Code ModeとDynamic Workersを活用したMCPサーバー
- Analytics Engine — ClickHouse基盤の高カーディナリティ分析で「誰が何を利用しているか」を検索可能にする

## コード例

記事には2つのTypeScriptコード例が掲載されている。

### 例1: `@cloudflare/ci` によるCI/CDパイプライン定義

```typescript
import { CIWorkflow } from `@cloudflare/ci`

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

**解説**: `ci.runner()` で依存関係のインストール（`bun install --frozen-lockfile`）を行い、`cache.inputs` に指定したファイル（`package.json` / `bun.lock`）が変わらない限りキャッシュを再利用する。インストール完了後、`Promise.all` で lint・test・typecheck・build の4つのタスクを並列実行しているのがポイントで、依存関係のない検証タスクを直列に待たせず一気に走らせることでCI全体のレイテンシを縮めている。最後に `deploy` タスクで `bun wrangler deploy` を実行し、`cloudflareCredentials.accountId` に指定したアカウントへ本番デプロイする。これが「数百万のリポジトリでCI/CDを実行する」ための基本的な記述単位になる。

### 例2: Workflowsによる夜間レビューエージェントの起動

```typescript
import { WorkflowEntrypoint, type WorkflowEvent, type WorkflowStep } from 'cloudflare:workers';
import { init } from '@flue/runtime';
import { Reviewer } from './agents/reviewer.ts';
import { collectFindings } from './shared/nightly.ts';

type Params = { date: string };

export class NightlyReview extends WorkflowEntrypoint {
  async run(event: WorkflowEvent<Params>, step: WorkflowStep) {
    const findings = await step.do('collect findings', () => collectFindings(event.payload.date));

    const agent = init(Reviewer, { id: `nightly-${event.payload.date}` });

    const receipt = await step.do('dispatch review', () =>
      agent.dispatch(`Review these findings:\n${findings}`),
    );

    const review = await step.do('read review', async () => {
      const reply = await agent.read(receipt);
      return { text: reply.text, data: reply.data };
    });

    // ...
  }
}
```

**解説**: `WorkflowEntrypoint` を継承した `NightlyReview` は、Cloudflare Workflowsの1タスクとして定義されている。`step.do()` は各処理ステップを冪等な単位として実行し、失敗時には自動的にリトライされる。まず `collectFindings()` で対象日の新しい知見（本番の問題点など）を収集し、次に Flue フレームワークの `init(Reviewer, ...)` でレビュー担当エージェントを初期化する。`agent.dispatch()` でエージェントにレビュー指示を送信し、`agent.read()` で応答（テキストと構造化データ）を受け取る。Workflowsのステップ単位で処理を分割しているため、エージェントの起動タイミングと指示内容を完全にコード側で制御でき、失敗時の再試行や長時間（数分〜数週間）にわたる状態保持もWorkflowsの仕組みにそのまま乗る。

## ユースケース

### オープンソースプロジェクトのIssue対応

「数千のプルリクエストや問題に圧倒されるオープンソースのメンテナンス担当者」の負荷軽減が主要なユースケースとして挙げられている。Astroプロジェクトでは、GitHub Issueをゼロ件に近づけることを目標に、Issueの自動分類・再現・検証・修正までを行うソフトウェアファクトリーが構築された（詳細記事: [Astroの GitHub Issue をゼロにするソフトウェアファクトリーを構築した方法](https://blog.cloudflare.com/astro-issue-triage/)）。

### 本番環境バグ対応・顧客バグ報告への自動対応

本番環境で発生したエラーや、顧客からのバグ報告を入力として、エージェントが自律的に問題を特定し、コードを修正し、デプロイまで行うシナリオが想定されている。

### 新機能アイデアの実装

新機能の提案をエージェントが受け取り、設計から実装、テスト、段階的デプロイまでを自動で実施するというシナリオも、ソフトウェアファクトリーが目指す姿として言及されている。

### ダッシュボードの変更管理

「ダッシュボードに対する小さな変更であっても、複数の役割、異なる専門分野、組織構造をまたぐ可能性がある」といった、主観的判断を伴う複雑な承認プロセスの自動化も課題として挙げられており、こうしたケースほどエージェントへの完全な委任が難しいことが示唆されている。

## 所感・ポイント

- SDLCの7段階（プラン・デザイン・実装・テスト・デプロイ・保守・廃止）を軸に、AIが速くしたのは「実装」だけであるという整理は明快で、なぜ「エージェントにコードを書かせるだけ」では組織全体のスループットが上がらないのかを説明する良いフレームだと感じる。
- 「ソフトウェアファクトリーの7要件」は、単にエージェントへ権限を与えるという話ではなく、水平スケール・再現性・許可制といった、これまで人間のオペレーション運用でも十分に確立していなかった要素を明文化している点が興味深い。特に「許可制」（段階的な権限拡大）は、エージェントに何をどこまで任せるかという実務上の悩みに直結するテーマである。
- 自動運転車とのアナロジーは、「80%の精度から99.999%の精度へ」という信頼性のギャップの大きさを直感的に示しており、エージェント駆動開発が一足飛びに完成しない理由の説明として説得力がある。
- ADLCという用語自体は本記事が起点となって提示されたコンセプトであり、Agents Week全体を通して発表された個別ツール（`@cloudflare/ci`、ローカルトレース、Cloudflare Agents、Wallets等）は、いずれもこのADLCという傘の下に位置づけられる関係にある。

> **Workers サンプル**: 対象外（ADLCという概念とAgents Week各発表を横断的に紹介するまとめ記事であり、単一のデプロイ可能な中心技術を持たないため。個別技術は各発表の詳細記事・サンプルを参照）

## 関連リンク

- [@cloudflare/ci（Cloudflare Workflowsを基盤としたCI/CD）](https://blog.cloudflare.com/ci-workflows)
- [ローカル開発環境でのOpenTelemetryトレース](https://blog.cloudflare.com/local-tracing)（本リポジトリの[Wiki](./2026-08-04-local-tracing.md)）
- [Cloudflare AgentsとAgent Tracesの紹介](http://blog.cloudflare.com/agents-on-cloudflare)（本リポジトリの[Wiki](./2026-08-04-agents-on-cloudflare.md)）
- [AIを活用してCloudflareがエンジニアリング標準を適用する方法](http://blog.cloudflare.com/engineering-standards-enforcement)
- [AstroのGitHub Issueをゼロ件にするソフトウェアファクトリーの構築方法](https://blog.cloudflare.com/astro-issue-triage/)
- [Artifacts（Git for Agents）](https://blog.cloudflare.com/artifacts-git-for-agents-beta/)
- [Flagship（フィーチャーフラグ）](https://blog.cloudflare.com/flagship/)
- [Dynamic Workers](https://blog.cloudflare.com/dynamic-workers/)
- [Cloudflare Workflows（開発者ドキュメント）](https://developers.cloudflare.com/workflows/)
- [Local Explorer（開発者ドキュメント）](https://developers.cloudflare.com/workers/local-development/local-explorer/)
- [段階的デプロイ（開発者ドキュメント）](https://developers.cloudflare.com/workers/versions-and-deployments/gradual-deployments/)
- [Analytics Engine（開発者ドキュメント）](https://developers.cloudflare.com/analytics/analytics-engine/)
- [RAND: Systems Development Lifecycle（1975年、外部リンク）](https://www.rand.org/pubs/reports/R1855.html)
- [Flue Framework（外部リンク）](https://flueframework.com/)
