---
routerMode: hash
theme: default
title: Cloudflareにエージェント開発ライフサイクルの時代が到来
themeConfig:
  primary: '#f6821f'
info: |
  Cloudflare Blog記事「Cloudflareにエージェント開発ライフサイクルの時代が到来」の解説スライド。
  原文: https://blog.cloudflare.com/ja-jp/agent-development-lifecycle/
class: text-center
highlighter: shiki
drawings:
  persist: false
transition: slide-left
mdc: true
lineNumbers: true
---

# Cloudflareに
# エージェント開発ライフサイクルの時代が到来

ADLC（Agent Development Lifecycle）の提唱

<div class="pt-4 text-sm opacity-70">
原文: https://blog.cloudflare.com/ja-jp/agent-development-lifecycle/<br>
公開日: 2026-08-04
</div>

---

# TL;DR

- エージェントによるコード実装速度は、人間によるレビュー・デプロイ・保守の速度をすでに上回っている
- 実装だけを高速化する従来のSDLCに代わり、コーディング以降の工程もエージェントに委ねる**ソフトウェアファクトリー**という発想と、それを支える<strong>ADLC（Agent Development Lifecycle）</strong>を提唱
- ソフトウェアファクトリーの成立には、プログラムから操作可能・水平スケール可能・再現可能など7つの要件が必要
- `@cloudflare/ci`、ローカルOpenTelemetryトレース、Agent Traces、AIによる標準適用など、支えるツール群を同時発表

---

# アジェンダ


- 背景: エージェントの実装速度と組織のボトルネック
- SDLCからADLCへ: 「ソフトウェアファクトリー」という発想
- ソフトウェアファクトリーに必要な7つの要件
- 自動運転車とのアナロジー
- CloudflareのADLC技術スタック
- コード例: `@cloudflare/ci` と Workflows
- ユースケース


---

# 背景: 実装だけが速くなった


> エージェントのコーディング速度は、開発チームが
> そのコードをレビュー、デプロイ、保守するスピードを
> **上回ります**



- 従来のSDLC（1975年、RAND提唱）: プラン・デザイン・実装・テスト・デプロイ・保守・廃止の7段階
- AIが劇的に高速化したのは「実装」工程だけ
- レビュー・デプロイ・保守の負荷はむしろ増大
- OSSメンテナーやプロダクションエンジニアが「AI slop」の後始末に追われる現状


---
layout: image-right
image: https://blog.cloudflare.com/_image?href=https%3A%2F%2Fblog.cloudflare.com%2F_emdash%2Fapi%2Fmedia%2Ffile%2F01KZ6A6DRX3WD507M2ZM4JJ353.png&w=715&h=336&f=webp&fit=cover&position=center
---

# SDLC各段階のボトルネック

実装だけが速くなり、
後工程にボトルネックが移動する

<footer class="text-xs opacity-50 mt-4">
出典: Cloudflare Blog https://blog.cloudflare.com/ja-jp/agent-development-lifecycle/
</footer>

---

# 「エージェントに多くを任せる」という逆説

多くの企業: エージェント＝コーディングのみ担当
検証・マージ・デプロイ・監視・バグ対応は人間が担当


Cloudflareのアプローチ: **エージェントをサービスの利用者として扱う**



- エージェントがドメインを購入できる
- エージェントが一時的なアカウントを作成できる
- エージェントがCloudflare APIのすべての機能を利用できる


---

# 同時発表された新しいツール群


- **`@cloudflare/ci`**: Workflows基盤の自己修復型CI/CD
- **ローカルOpenTelemetryトレース**: 本番同等の可観測性をローカルに
- **Cloudflare Agents / Agent Traces**: エージェント状態の観測・改善基盤
- **AIによるエンジニアリング標準の適用**: 全リポジトリへベストプラクティスを機械的に適用
- **Astroのソフトウェアファクトリー事例**: OSSプロジェクトのIssueを自動処理


---
class: text-center
---

# SDLCからADLCへ

SDLC（Software）はソフトウェア**チーム**向け
ADLC（Agent）はソフトウェア**ファクトリー**向け

---

# 「ソフトウェアファクトリー」とは


エージェントを中心に動作し、入力（本番エラー・バグ報告・
新機能アイデア）をもとに、ソフトウェアの構築・改善・
デプロイ・管理までを**自律的に**行うシステム



- 現状: 人間が各工程を管理し、工程内の作業をエージェントへ委任
- 目指す姿: 製作工程すべての自動化
- 人間の時間を、創造性・センス・判断が必要な作業へ振り向ける


---

# ソフトウェアファクトリーの7要件（1/2）


1. **プログラムから操作可能**: ClickOpsは不可。すべてAPIとして提供
2. **水平方向にスケール可能**: 全エージェントが本番と一致する専用プレビュー環境を持つ
3. **再現可能**: 「iPhone 15で4G通信」「特定国のIPアドレス」等の特殊条件も再現・テスト可能
4. **リアルタイムかつプッシュ型**: ダッシュボード確認ではなく、イベント駆動でエージェントが動く


---

# ソフトウェアファクトリーの7要件（2/2）


5. **個別性**: すべての変更を個別にテスト・リリース・観察・ロールバック可能
6. **許可制**: エージェントに無条件の本番権限は与えず、必要に応じ段階的に拡大
7. **自己改善性**: 人間が経験から学ぶように、エージェントも経験から学習する仕組み


---

# 自動運転車とのアナロジー


他の自律システムと同様、**80%の精度**から
**99.999%に近い信頼性**へ到達することが課題



- 自動運転車: Lidar、カメラ、強力な推論用コンピューティング、遠隔介入システム
- 従来の車にはなかった仕組みが必要だった
- エージェント駆動開発にも同様に新しい仕組みが必要


---

# なぜまだ自動承認・自動マージを許可しないのか


> 構築しているものの重要性に比例して、
> その必要性が増していく



- ダッシュボードの小さな変更でも、複数の役割・専門分野・組織構造をまたぐ可能性
- 主観的判断を伴う変更ほど、テストしにくくエージェントへの委任が難しい


---

# Workflowsの活用


- 複数の処理ステップを連結し、失敗タスクを自動再試行
- 数分〜数週間にわたる状態保持が可能
- 複雑で動的なビジネスプロセスを、理解しやすい論理的プログラムとして定義
- 処理内容を状況に応じて動的に定義し、エージェントや別のWorkflowを起動できる


<br>


ADLCを支えるオーケストレーション機構として活用


---
class: text-center
---

# CloudflareのADLC技術スタック

SDLCの各段階に対応する形で整理された技術群

---

# プラン・デザイン・実装段階


- **Vite / Rolldown / Oxc**: エージェント向け最速ツールチェーン
- **ローカル開発環境の完全対応**: ローカルと本番ランタイムを一致させる
- **Local Explorer / Local Traces**: 本番と同じAPIをローカルでデバッグ
- **リモートバインディング**: ローカル実行しながら本番リソースを利用
- **プレビューURL**: すべてのPRに専用プレビュー環境


---

# テスト段階・デプロイ段階

<div class="grid grid-cols-2 gap-4">
<div>

### テスト

- **Browser Run**: プログラム制御可能なクラウドヘッドレスブラウザ
- **Vitest**: Workers実行環境上でのテスト統合

</div>
<div>

### デプロイ

- **Flagship**: すべての変更に専用フィーチャーフラグ
- **段階的デプロイ**: トラフィックの一部へ段階適用

</div>
</div>

---

# 保守・廃止段階


- **Workers Logs**: リアルタイムログ追跡、検索して問題を特定・自動修正
- **Agent Traces**: エージェントの全セッションを記録し改善に活用
- **Cloudflare MCP Server**: Code ModeとDynamic Workersを活用
- **Analytics Engine**: ClickHouse基盤で「誰が何を利用しているか」を検索可能に


---
class: text-center
---

# コード例

---

# コード例① `@cloudflare/ci` によるCI/CD定義

```ts {1|3-6|8-13|15-20|all}
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

---

# コード例① 解説


- `ci.runner()` で依存関係をインストール。`cache.inputs` が変わらなければキャッシュ再利用
- `Promise.all` で lint・test・typecheck・build を**並列実行**し、CI全体のレイテンシを短縮
- 最後に `deploy` タスクで `wrangler deploy` を実行し本番デプロイ
- これが「数百万のリポジトリでCI/CDを実行する」ための基本単位


---

# コード例② 夜間レビューエージェントの起動

```ts {1-4|6|8-9|11|13-14|16-19|all} {maxHeight:'440px'}
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
  }
}
```

---

# コード例② 解説


- `WorkflowEntrypoint` を継承し、Workflowsの1タスクとして定義
- `step.do()` は各ステップを冪等な単位として実行し、失敗時は自動リトライ
- `collectFindings()` で対象日の知見を収集 → Flueの `init(Reviewer, ...)` でエージェント初期化
- `agent.dispatch()` で指示を送信し、`agent.read()` で応答を取得
- ステップ単位の分割により、起動タイミングと指示内容をコード側で完全に制御


---
class: text-center
---

# ユースケース

---

# ユースケース①: OSSプロジェクトのIssue対応


- 「数千のプルリクエストや問題に圧倒されるOSSメンテナー」の負荷軽減
- Astroプロジェクト: Issueをゼロ件に近づける目標
- Issueの自動分類・再現・検証・修正までを行うソフトウェアファクトリーを構築


---

# ユースケース②: 本番バグ対応・新機能実装


- 本番環境のエラーや顧客のバグ報告を入力に、問題特定〜修正〜デプロイを自律実行
- 新機能提案を受け取り、設計〜実装〜テスト〜段階的デプロイまで自動化


---

# ユースケース③: ダッシュボードの変更管理


- 小さな変更でも複数の役割・専門分野・組織構造をまたぐ可能性
- 主観的判断を伴う変更ほど、エージェントへの委任が難しい
- ソフトウェアファクトリーが最も苦手とする領域として言及


---

# まとめ


- 実装だけが速くなったことで、レビュー・デプロイ・保守にボトルネックが移動した
- 解決策は「エージェントに多くを任せる」ソフトウェアファクトリーという発想
- それを支える概念がSDLCに代わる**ADLC**
- 7つの要件（API操作可能・水平スケール・再現可能・リアルタイム・個別性・許可制・自己改善性）が土台
- `@cloudflare/ci` やWorkflowsなど、ADLCを支えるツール群がすでに揃いつつある


---

<div class="text-center">

# 参考リンク

</div>

- 原文: [Cloudflareにエージェント開発ライフサイクルの時代が到来](https://blog.cloudflare.com/ja-jp/agent-development-lifecycle/)
- 英語版: [Welcome to the agent development lifecycle](https://blog.cloudflare.com/agent-development-lifecycle/)
- [@cloudflare/ci](https://blog.cloudflare.com/ci-workflows)
- [ローカルOpenTelemetryトレース ▶ 解説スライド](../local-tracing/)
- [Cloudflare Agents / Agent Traces ▶ 解説スライド](../agents-on-cloudflare/)
- [AstroのGitHub Issueをゼロ件にする方法](https://blog.cloudflare.com/astro-issue-triage/)
- [Cloudflare Workflows（開発者ドキュメント）](https://developers.cloudflare.com/workflows/)

<div class="pt-8 text-sm opacity-50">
Wiki: docs/articles/2026-08-04-agent-development-lifecycle.md
</div>
