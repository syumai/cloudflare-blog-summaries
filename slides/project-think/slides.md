---
routerMode: hash
theme: default
title: "Project Think：Cloudflareで次世代のAIエージェント構築"
info: |
  Cloudflare Blog記事「Project Think：Cloudflareで次世代のAIエージェント構築」の解説スライド。
  原文: https://blog.cloudflare.com/ja-jp/project-think/
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

# Project Think
# Cloudflareで次世代のAIエージェント構築

<div class="pt-4 text-sm opacity-70">
原文: https://blog.cloudflare.com/ja-jp/project-think/<br>
公開日: 2026-04-15
</div>

---

# TL;DR

- Cloudflareは、AIエージェント構築のための新しいプリミティブ群<strong>「Project Think」</strong>をプレビュー公開
- 基盤は<strong>Durable Objects</strong>。各エージェントは固有ID・永続状態・アイドル時ゼロコストのハイバネーションを持つ
- モデルにツールを1個ずつ呼ばせず、タスク全体を<strong>コードとして書かせサンドボックス実行</strong>させることでトークン消費を約99.9%削減した事例を紹介
- Tier 0〜Tier 4の5段階の<strong>実行展開ラダー</strong>を導入し、エージェントは必要な分だけ能力をエスカレーションできる
- 全プリミティブを組み合わせた<strong>Thinkベースクラス</strong>（`@cloudflare/think`）で、最小実装からエージェントを構築できる

---

# アジェンダ

- 背景: エージェントが「ノートパソコンの外」に出られない理由
- 長時間実行されるエージェント: Durable Objectsという基盤
- クラッシュ耐久性・サブエージェント・セッションAPI
- ツール呼び出しからコード実行へ
- 実行展開ラダー（Tier 0〜4）
- Thinkベースクラス
- 第3の波
- ユースケース

---

# 背景: 2026年初頭に起きた変化

Pi・OpenClaw・Claude Code・Codexといったツールが証明したこと


- LLMに**ファイル読み取り・コード作成・実行・学習記憶**能力を持たせるだけで汎用アシスタントになる
- カレンダー管理・データ分析・購入交渉・納税・ビジネスワークフロー自動化にまで用途が拡大


<br>

これらのエージェントを「自分のノートパソコンの外」で動かそうとすると、
構造的な壁にぶつかる

---

# 課題: ノートパソコンの外で動かす壁


- ノートパソコンか高価なVPS上でしか動かせず、デバイスをまたいで共有できない
- 稼働状況にかかわらず<strong>月額定額でコストが発生</strong>し、アイドル中も高コスト
- 依存関係インストール・更新管理・認証情報設定など、手動セットアップが必須
- 従来のWebアプリは1インスタンス→多数ユーザーだが、エージェントは基本的に<strong>1対1</strong>
- 1億人が使えば数千万の同時セッションが必要になり、現在のコンテナコストモデルでは持続不可能


---

# Project Thinkとは

エージェント構築のための新しいプリミティブ群


- <strong>耐久性のある実行</strong>（ファイバー）
- <strong>サブエージェント</strong>
- <strong>永続セッション</strong>
- <strong>サンドボックス化されたコード実行</strong>
- <strong>実行ラダー</strong>
- <strong>自己承認型拡張機能</strong>


<br>

組み合わせて使うか、`Think`ベースクラスで迅速に開始できる

---

# 長時間実行されるエージェント: Durable Objectsという基盤

Agents SDKはDurable Objectsを基盤とする


- **アクターモデル**を採用し、全エージェントにID・永続状態・メッセージ認識能力を付与
- 各エージェントは独自の**SQLiteデータベース**を保有
- **ハイバネーション**時の消費はゼロ
- HTTPリクエスト・WebSocket・スケジュール警告・受信メールなどで起動し、処理後は再びスリープ


---

# VM/コンテナ vs Durable Objects

| 観点 | VM/コンテナ | Durable Objects |
|---|---|---|
| アイドルコスト | 常にフルコスト | ゼロ |
| スケーリング | 容量プロビジョニング管理が必要 | エージェント毎に自動 |
| 状態 | 外部DBが必要 | 内蔵SQLite |
| 復旧 | ユーザーが構築 | プラットフォームが実行 |
| ID/ルーティング | ユーザーが構築 | 組み込み |
| 10,000エージェント・1%稼働時 | 10,000インスタンス常時稼働 | 約100インスタンスが稼働 |

---

# クラッシュ耐久性: ファイバーによる耐久実行

`runFiber()` = 耐久性のある関数呼び出し


- 実行前にSQLiteへ登録される
- `ctx.stash()` で任意の時点にチェックポイントを保存
- `onFiberRecovered` フックが再起動時にスナップショットから復旧
- 分単位の作業には `keepAlive()` / `keepAliveWhile()` で退去を防止


---

# コード例: ファイバーによる耐久実行（1/2）

```ts {1-3|5-9|10-14|15-17|all}
import { Agent } from "agents";

export class ResearchAgent extends Agent {
  async startResearch(topic: string) {
    void this.runFiber("research", async (ctx) => {
      const findings = [];
      for (let i = 0; i < 10; i++) {
        const result = await this.callLLM(`Research step ${i}: ${topic}`);
        findings.push(result);

        // チェックポイント: 退去されてもここから再開する
        ctx.stash({ findings, step: i, topic });
        this.broadcast({ type: "progress", step: i });
      }
      return { findings };
    });
  }
```

- `runFiber("research", ...)`（5行目）で登録した処理はSQLiteに記録される
- 10ステップの調査ループの**各ステップ後**に `ctx.stash()`（12行目）でチェックポイント
- `ResearchAgent`（続きは次のスライド）

---

# コード例: ファイバーによる耐久実行（2/2）

```ts {1-6|all}
  async onFiberRecovered(ctx) {
    if (ctx.name === "research" && ctx.snapshot) {
      const { topic } = ctx.snapshot;
      await this.startResearch(topic);
    }
  }
}
```

- `onFiberRecovered`（1行目）フックは、退去（eviction）後の再起動時に呼び出される
- 直前に `ctx.stash()` で保存されたスナップショットから処理を再開し、途中経過を失わずに長時間タスクを完走できる

---

# 作業の委任: Facetsを介したサブエージェント


- サブエージェントは、**Facets**を介して親と併置される子Durable Objects
- 各サブエージェントは独自の**分離されたSQLite**と実行コンテキストを保有
- ストレージレベルで分離（暗黙的なデータ共有はない）
- RPC呼び出しはランタイム上で通常の関数呼び出しとして実行
- TypeScriptがコンパイル時に誤用を検出

<br>

次スライドのコードでは、`Orchestrator.handleTask()` が
`this.subAgent(ResearchAgent, "research")` / `this.subAgent(ReviewAgent, "review")`
の2行でサブエージェントを生成し、`Promise.all()` で並列実行する

---

# コード例: サブエージェントによる並列処理

```ts {1-7|9-19|all}
import { Agent } from "agents";

export class ResearchAgent extends Agent {
  async search(query: string) { /* ... */ }
}

export class ReviewAgent extends Agent {
  async analyze(query: string) { /* ... */ }
}

export class Orchestrator extends Agent {
  async handleTask(task: string) {
    const researcher = await this.subAgent(ResearchAgent, "research");
    const reviewer = await this.subAgent(ReviewAgent, "review");

    const [research, review] = await Promise.all([
      researcher.search(task),
      reviewer.analyze(task)
    ]);

    return this.synthesize(research, review);
  }
}
```

<footer class="text-xs opacity-50 mt-4">
出典: Cloudflare Blog https://blog.cloudflare.com/ja-jp/project-think/
</footer>

---

# 続く会話: セッションAPI（実験的）


- 会話を**ツリー構造**として保存。各メッセージは親メッセージIDを持つ
- 既存の履歴を保ったまま別方向へ**フォーク**して代替案を探索できる
- **非破壊的圧縮**: 古いメッセージを削除せず要約、全履歴はSQLiteに保存され続ける
- **FTS5**（SQLite全文検索）でセッション内・全セッション横断の検索が可能


---

# ツール呼び出しの限界

> モデルが1つのツールを呼ぶ → 結果を受け取る → また1つ呼ぶ、を繰り返す


- 対象領域が広がるほど**高コストで使い勝手が悪化**
- 100ファイルを扱うタスクは、単純計算で**100回の往復**を意味しうる


<br>

モデルは「ツール呼び出しゲーム」より「システムを使うためのコードを書く」方が得意
(`@cloudflare/codemode` の背後にある洞察)

---

# コード例: LLMが生成し、サンドボックスで実行するコード

```js
// The LLM writes this. It runs in a sandboxed Dynamic Worker.
const files = await tools.find({ pattern: "**/*.ts" });
const results = [];
for (const file of files) {
  const content = await tools.read({ path: file });
  if (content.includes("TODO")) {
    results.push({ file, todos: content.match(/\/\/ TODO:.*/g) });
  }
}
return results;
```

<br>

モデルとの100往復の代わりに、**単一プログラムの実行**に置き換える

---

# 実証事例: Cloudflare API MCPサーバー


公開ツールは<strong>`search()`</strong>と<strong>`execute()`</strong>の2つのみ


| 方式 | 消費トークン |
|---|---|
| `search()` + `execute()`（コード実行方式） | 約1,000 |
| エンドポイント毎に単純ツールを用意 | 約117万 |


<div class="text-center pt-6 text-2xl">

<strong>約99.9%のトークン削減</strong>

</div>

---

# 安全なサンドボックス: Dynamic Workers


- 数メガバイトのメモリで、**数ミリ秒**でスピンアップ
- コンテナ比で**約100倍高速・最大100倍メモリ効率**
- リクエスト毎に新規起動、実行後は破棄可能


<br>

**設計上の重要な選択（能力モデル）**

- 汎用機から制約を加えるのではなく、`globalOutbound: null`（ネットワークアクセスなし）から出発
- 開発者はバインディング経由でリソース毎に明示的に機能を付与
- 「過剰な行為を防ぐ」ではなく「何を許可するか」という発想

---
layout: image-right
image: https://blog.cloudflare.com/_emdash/api/media/file/01KW48H0G3Y1NFFRVA3Z21GJX2.png
backgroundSize: contain
---

# 実行展開ラダー

能力モデルは自然に、多様な
コンピューティング環境の
段階的な利用へつながる

- エスカレーションは必要に応じて加算的
- 多くのタスクは**Tier 0**を出ない

<footer class="text-xs opacity-50 mt-4">
出典: Cloudflare Blog https://blog.cloudflare.com/ja-jp/project-think/
</footer>

---

# 実行展開ラダーの5段階

| Tier | 内容 | 提供パッケージ |
|---|---|---|
| Tier 0 | ワークスペース（SQLite + R2、read/write/edit/find/grep） | `@cloudflare/shell` |
| Tier 1 | Dynamic Worker（ネットワークなしのサンドボックスでJS実行） | `@cloudflare/codemode` |
| Tier 2 | npm追加（レジストリ取得＋esbuildバンドル） | `@cloudflare/worker-bundler` |
| Tier 3 | ヘッドレスブラウザ（ナビゲート・クリック・抽出） | Cloudflare Browser Run |
| Tier 4 | Cloudflare Sandbox（git clone・npm test・cargo build） | Cloudflare Sandbox |

設計原則: エージェントは<strong>Tier 0単独でも有用</strong>であるべき。各階層は付加的（additive）

---

# フレームワークでなくビルディングブロック


全プリミティブはスタンドアロンパッケージとして利用可能


- Dynamic Workers
- `@cloudflare/codemode`
- `@cloudflare/worker-bundler`
- `@cloudflare/shell`（永続ファイルシステム）


<br>

いずれも `Think` ベースクラスから直接使用でき、
組み合わせて作業領域・コード実行・パッケージ解決を提供する

---
class: text-center
---

# Thinkベースクラス

プリミティブを全てつなぎ合わせた結果

---

# コード例: 最小構成のThinkエージェント

```ts
import { Think } from "@cloudflare/think";
import { createWorkersAI } from "workers-ai-provider";

export class MyAgent extends Think<Env> {
  getModel() {
    return createWorkersAI({ binding: this.env.AI })(
      "@cf/moonshotai/kimi-k2.5"
    );
  }
}
```

<br>

`getModel()` のみで、ストリーミング・永続化・中断/キャンセル・
再開可能ストリーム・組み込みワークスペースを備えたエージェントが動く

`npx wrangler deploy` でそのままデプロイ可能

---

# Thinkの内部動作とライフサイクルフック

各ターンで完全なエージェントループを実行


1. コンテキスト（指示＋ツール説明＋スキル＋メモリ＋履歴）を組み立て
2. `streamText()` を呼び出し
3. ツール呼び出しを実行（出力は切り捨てでコンテキスト肥大化を防止）
4. 結果を追加し、完了かステップ制限までループ


```
beforeTurn()
  → streamText()
    → beforeToolCall()
    → afterToolCall()
  → onStepFinish()
→ onChatResponse()
```

---

# コード例: 永続的なメモリ（コンテキストブロック）

```ts {2-4|5-8|9|all}
configureSession(session: Session) {
  return session
    .withContext("soul", {
      provider: { get: async () => "You are a helpful coding assistant." }
    })
    .withContext("memory", {
      description: "Important facts learned during conversation.",
      maxTokens: 2000
    })
    .withCachedPrompt();
}
```


- `soul`: 読み取り専用、システムプロンプトの先頭に常に配置
- `memory`: モデルが `set_context` ツールで能動的に更新
- 書き込んだ内容は<strong>DOのハイバネーションを越えて</strong>SQLiteに永続化される


---

# 自己承認型拡張機能


エージェントが自分でコードを書き、Dynamic Workersで実行される
独自拡張を追加できる


```json
{
  "name": "github",
  "description": "GitHub integration: PRs, issues, repos",
  "tools": ["create_pr", "list_issues", "review_pr"],
  "permissions": {
    "network": ["api.github.com"],
    "workspace": "read-write"
  }
}
```

<br>

ネットワーク・ワークスペース権限をJSONで明示的に宣言。
拡張はDOストレージに永続化され、微調整・RLHFなしの自己改善ループを実現

---
class: text-center
---

# 第3の波

AIエージェントの進化を3段階で整理する

---

# 第1波・第2波・第3波

<div class="grid grid-cols-3 gap-4 text-sm">
<div>

### 第1波
**チャットボット**

- ステートレス
- リアクティブ
- 脆弱
- 会話は毎回ゼロから
- メモリ・ツール・行動なし

</div>
<div>

### 第2波
**コーディングエージェント**

- Pi・Claude Code・OpenClaw・Codex
- ステートフルで高いツール使用能力
- 1ユーザーのノートPC上
- 耐久性の保証なし

</div>
<div>

### 第3波
**インフラとしてのエージェント**

- 耐久性・分散性
- 構造的安全性
- サーバーレス
- インターネット上で実行
- アイドルコストなし

</div>
</div>

<br>

Project Thinkは<strong>第3の波</strong>を実現するためのプリミティブ群

---
class: text-center
---

# ユースケース

---

# ユースケース①: 数千万規模の同時セッション基盤


- Agents SDKは既に**数千の本番エージェント**を支えている
- Durable Objectsのハイバネーション（アイドル時ゼロコスト）と自動スケーリング
- 従来の「1ユーザー1コンテナ」モデルでは成立しなかった
  大規模なマルチユーザーエージェント配信が可能に


---

# ユースケース②: 大量ツールを持つAPI・MCPサーバーの効率化


- Cloudflare API MCPサーバーの事例: `search()` + `execute()` の2ツールに集約
- モデルにコードを書かせて `execute` させることでトークン消費**約99.9%削減**
- ツール数が多い社内API・SaaS連携などに応用できる考え方


---

# ユースケース③: 段階的に権限をエスカレーションするエージェント


- ファイル操作のみで完結するタスク → **Tier 0**
- npm依存関係が必要なタスク → **Tier 2**
- Webブラウジングが必要なタスク → **Tier 3**
- フルのビルド・テスト環境が必要なタスク → **Tier 4**


<br>

多くのタスクがTier 0を出ない前提で、コストとセキュリティリスクを最小化

---

# ユースケース④: 自己改善するツールセットを持つアシスタント


- 会話の中で必要になった外部連携（GitHub、Slackなど）を
  エージェント自身がTypeScriptコードとして実装
- サンドボックス実行を経て、次のターンから新しいツールとして使用可能
- 微調整・ファインチューニングを伴わない、コードベースの自己改善ループ


---

# まとめ


- Project Thinkは、AIエージェント構築のための新しいプリミティブ群
  （ファイバー・サブエージェント・セッションAPI・コード実行・実行ラダー・自己承認型拡張機能）
- 基盤はDurable Objects。アイドル時ゼロコストで数千万規模の同時セッションに対応
- <strong>「ツール呼び出し」から「コード実行」へ</strong>の転換でトークン消費を約99.9%削減
- 実行展開ラダー（Tier 0〜4）により、必要な分だけ能力をエスカレーション
- `Think`ベースクラスで、最小実装から本番エージェントを構築できる
- プレビュー段階であり、APIサーフェスは今後も進化する


---

<div class="text-center">

# 参考リンク

</div>

- 原文: [Project Think：Cloudflareで次世代のAIエージェント構築](https://blog.cloudflare.com/ja-jp/project-think/)
- 英語版: [Project Think: building the next generation of AI agents on Cloudflare](https://blog.cloudflare.com/project-think/)
- [Agents SDK ドキュメント](https://developers.cloudflare.com/agents/)
- [Durable Objects ドキュメント](https://developers.cloudflare.com/durable-objects/)
- [Code Mode ブログ記事](https://blog.cloudflare.com/code-mode/)
- [Dynamic Workers（ブログ）](https://blog.cloudflare.com/dynamic-workers/)
- [Think ドキュメント（GitHub）](https://github.com/cloudflare/agents/blob/main/docs/think/index.md)
- 関連デッキ: <a href="../cloudflare-computer/" target="_blank">AIエージェントに必要なのはコンテナではなくコンピューター</a>
- Workers サンプル: [examples/project-think/](https://github.com/syumai/cloudflare-blog-summaries/tree/main/examples/project-think)

<div class="pt-8 text-sm opacity-50">
Wiki: docs/articles/2026-04-15-project-think.md
</div>
