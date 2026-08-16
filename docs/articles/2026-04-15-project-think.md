# Project Think：Cloudflareで次世代のAIエージェント構築

- 原文: [https://blog.cloudflare.com/ja-jp/project-think/](https://blog.cloudflare.com/ja-jp/project-think/)（英語版: [https://blog.cloudflare.com/project-think/](https://blog.cloudflare.com/project-think/)）
- 公開日: 2026-04-15
- 関連: [AIエージェントに必要なのはコンテナではなくコンピューター —「@cloudflare/computer」のご紹介](./2026-08-03-cloudflare-computer.md) / [Cloudflare Agentsの紹介](./2026-08-04-agents-on-cloudflare.md) / [数百万のリポジトリのCI/CDを、あなたのプラットフォーム上でCloudflareが動かす](./2026-08-04-ci-workflows.md)
- GitHub: [docs/articles/2026-04-15-project-think.md](https://github.com/syumai/cloudflare-blog-summaries/blob/main/docs/articles/2026-04-15-project-think.md)

![ヘッダー画像](https://blog.cloudflare.com/_emdash/api/media/file/01KW477PMS3SA3XABZZ49GCCZ6.png)
*図: 記事ヘッダー画像（出典: Cloudflare Blog https://blog.cloudflare.com/ja-jp/project-think/）*

## TL;DR

- Cloudflareは、AIエージェント構築のための新しいプリミティブ群「**Project Think**」をプレビュー公開した。耐久性のある実行（ファイバー）、サブエージェント、永続セッション、サンドボックス化されたコード実行、実行ラダー、自己承認型拡張機能などが含まれる。
- 基盤は**Durable Objects**。各エージェントは固有ID・永続状態（SQLite）・アイドル時ゼロコストのハイバネーションを持ち、VM／コンテナ常時起動モデルに比べ桁違いに低コストで数千万規模の同時セッションを支えられる。
- モデルに「ツールを1個ずつ呼ばせる」のではなく「タスク全体をコードとして書かせて**Dynamic Workers**上でサンドボックス実行させる」ことで、Cloudflare API MCPサーバーの事例ではトークン消費を約99.9%削減できたとしている。
- Tier 0（ワークスペース）からTier 4（フル機能のCloudflare Sandbox）まで5段階の「**実行展開ラダー**」を導入し、エージェントは必要な分だけ能力をエスカレーションできる。多くのタスクはTier 0のみで完結する設計。
- これら全プリミティブを組み合わせた**Thinkベースクラス**（`@cloudflare/think`）を使うと、`getModel()` を1つ実装するだけでストリーミング・永続化・ツール実行を備えたチャットエージェントが動く。プレビュー版であり、APIは今後変化しうる。

## 背景・課題

記事はまず、2026年初頭に起きた認識の変化を指摘する。Pi・OpenClaw・Claude Code・Codexといったツールが、LLMにファイル読み取り・コード作成・実行・学習記憶能力を持たせるだけで汎用アシスタントになることを証明した。これらのエージェントはもはや単なるコード記述ツールではなく、カレンダー管理・データ分析・購入交渉・納税・ビジネスワークフロー自動化にまで使われ始めている。

しかし、こうしたエージェントを「自分のノートパソコン」の外で動かそうとすると、いくつもの構造的な壁にぶつかる。

- ノートパソコンか高価なVPS上でしか動かせず、デバイスをまたいで共有できない。
- 稼働状況にかかわらず月額定額でコストがかかり、アイドル中も高コストなまま。
- 依存関係のインストール、更新管理、認証情報の設定など、手動セットアップが必須。
- 従来のWebアプリは1インスタンスから多数ユーザーに配信できるが、エージェントは基本的に1対1（1エージェント＝1インスタンス＝1ユーザー）の関係になりやすい。
- 仮に1億人のナレッジワーカーがそれぞれエージェントを使うようになれば、数千万の同時セッションを支える必要が生まれるが、現在の「コンテナを並べる」コストモデルではこの規模を持続的に支えられない。

Project Thinkは、この「エージェントのインフラ問題」に対する Cloudflare の回答として位置づけられている。

## 発表内容 / アーキテクチャ

### 長時間実行されるエージェント：Durable Objectsという基盤

Agents SDKはDurable Objectsを基盤にしている。アクターモデルを採用し、すべてのエージェントに固有ID・永続的状態・メッセージ認識能力を与える。各エージェントは独自のSQLiteデータベースを持ち、ハイバネーション中の消費はゼロ。HTTPリクエスト・WebSocketメッセージ・スケジュール警告・受信メールなどをきっかけに起動し、状態をロードしてイベントを処理し、作業後は再びスリープする。

記事では、この特性をVM／コンテナモデルと対比する表を提示している。10,000エージェントのうち1%だけがアクティブな状況では、VMモデルは10,000インスタンスを常時稼働させる必要があるのに対し、Durable Objectsではおよそ100インスタンスの稼働で済むという。

### クラッシュ耐久性：ファイバーによる耐久実行

`runFiber()` は耐久性のある関数呼び出しを提供する。実行前にSQLiteへ登録され、`ctx.stash()` で任意の時点にチェックポイントを打てる。エージェントが退去（eviction）されても、`onFiberRecovered` フックが再起動時にスナップショットから処理を再開する。長時間かかる調査タスクなどで、途中経過を失わずに継続できる仕組みである。分単位の作業には `keepAlive()` / `keepAliveWhile()` を使い、アクティブな作業中は退去を防止できる。

### 作業の委任：Facetsを介したサブエージェント

サブエージェントは、Facetsを介して親と併置される子Durable Objectsとして実装される。各サブエージェントは独自の分離されたSQLiteと実行コンテキストを持ち、ストレージレベルで分離される（暗黙的なデータ共有はない）。RPC呼び出しはランタイム上で通常の関数呼び出しとして実行され、TypeScriptによってコンパイル時に誤用を検出できる。記事のコード例では、研究用エージェントと分析用エージェントを`Promise.all`で並列実行し、結果を統合するオーケストレーターパターンが示されている。

### 続く会話：セッションAPI

実験的な**セッションAPI**は、会話をツリー構造として保存する。各メッセージは親メッセージIDを持ち、既存の履歴を保ったまま別の方向へ「フォーク」して代替案を探索できる。コンテキストが膨らんだ場合は、メッセージを削除するのではなく要約する「非破壊的圧縮」で対応し、全履歴はSQLiteに保存され続ける。FTS5（SQLiteの全文検索エンジン）により、セッション内や全セッションを横断した会話履歴の検索も可能。

### ツール呼び出しからコード実行へ

記事は、従来型の「モデルがツールを1つ呼ぶ→結果を受け取る→また1つ呼ぶ」という繰り返しパターンの限界を指摘する。対象領域が広がるほどコストが高く使い勝手も悪化し、100ファイルを扱うタスクなら単純計算で100回の往復が発生しうる。

これに対する解決策が「モデルにコードを書かせる」アプローチであり、`@cloudflare/codemode`の背後にある洞察でもある。ツール呼び出しの列を積み重ねる代わりに、LLMがタスク全体を処理する単一のプログラムを書き、それを一度に実行する。記事の例では、100ファイルを検索して内容を読み込みTODOコメントを抽出するタスクを、モデルとの100往復ではなく単一プログラムの実行に置き換えている。

この効果はCloudflare API MCPサーバーの事例で実証されている。公開されているツールは`search()`と`execute()`の2つのみで、消費トークンは約1,000。これに対し、エンドポイントごとに単純なツールを用意する従来方式では約117万トークンを消費するとされ、**約99.9%のトークン削減**につながったという。

### 安全なサンドボックス：Dynamic Workers

モデルがユーザーに代わってコードを書く以上、それをどこで実行するかが問題になる。Cloudflareの答えは**Dynamic Workers**によるサンドボックス化である。数メガバイトのメモリで、数ミリ秒でスピンアップでき、コンテナと比較して約100倍高速・最大100倍メモリ効率が良いとされる。リクエストごとに新規に起動し、実行後は破棄できる。

設計上の重要な選択は「能力モデル」である。汎用機から権限を制約していくのではなく、Dynamic Workersは`globalOutbound: null`（ネットワークアクセスなし）という権限が最も少ない状態から出発する。開発者はバインディングを通じてリソースごとに明示的に機能を付与していく。これにより「過剰な行為をどう防ぐか」ではなく「具体的に何を許可するか」という発想から設計が始まる。

### 実行展開ラダー

能力モデルは自然に、多様なコンピューティング環境の段階的な利用へとつながる。記事は5段階の「実行展開ラダー」を提示している。

![実行展開ラダー](https://blog.cloudflare.com/_emdash/api/media/file/01KW48H0G3Y1NFFRVA3Z21GJX2.png)
*図: Tier 0からTier 4までの実行展開ラダー。エスカレーションは必要に応じて加算的に行われ、多くのタスクはTier 0を出ない（出典: Cloudflare Blog https://blog.cloudflare.com/ja-jp/project-think/）*

| Tier | 内容 | 提供パッケージ |
|---|---|---|
| Tier 0 | ワークスペース。SQLiteとR2に支えられた耐久仮想ファイルシステム（read/write/edit/find/grep/diff） | `@cloudflare/shell` |
| Tier 1 | Dynamic Worker。ネットワークアクセスなしのサンドボックス分離環境でLLM生成JavaScriptを実行 | `@cloudflare/codemode` |
| Tier 2 | npmパッケージの追加。`@cloudflare/worker-bundler`がレジストリから取得しesbuildでバンドル、Dynamic Workerに読み込む（`import { z } from "zod"`のようなコードが動作） | `@cloudflare/worker-bundler` |
| Tier 3 | ヘッドレスブラウザ。Cloudflare Browser Run経由でナビゲート・クリック・抽出・スクリーンショットが可能。MCPやAPI未対応のサービスに有用 | Cloudflare Browser Run |
| Tier 4 | Cloudflare Sandbox。ツールチェーン・リポジトリ・依存関係を備え、`git clone`・`npm test`・`cargo build`がワークスペースと双方向同期する | Cloudflare Sandbox |

設計原則として、エージェントはTier 0単独でも有用であるべきで、各階層は付加的（additive）に積み上がる。ユーザーは必要に応じて機能を追加すればよく、最初から全ての権限を持たせる必要はない。

### フレームワークでなくビルディングブロック

Dynamic Workers、`@cloudflare/codemode`、`@cloudflare/worker-bundler`、`@cloudflare/shell`（永続ファイルシステム）は、いずれもスタンドアロンのパッケージとして単体利用でき、Thinkのエージェントベースクラスからも直接使える。組み合わせることで、作業領域・コード実行・ランタイムパッケージ解決を提供する。

### Thinkベースクラス

これまでのプリミティブを1つにつなぎ合わせた結果が`Think`である。独自の規約に基づくハーネスとして、エージェントループ・メッセージ永続化・ストリーミング・ツール実行・ストリーム再開・拡張機能を一括して処理する。開発者は`getModel()`をオーバーライドするだけで、ストリーミング・永続化・中断/キャンセル・エラー処理・再開可能ストリーム・組み込みワークスペースファイルシステムを備えたチャットエージェントを得られる。制御を強めたい場合のみ、`getSystemPrompt()`・`getTools()`・`maxSteps`・`configureSession()`などをオーバーライドすればよい。

内部的には、Thinkは各ターンごとに完全なエージェントループを実行する。コンテキスト（基本指示＋ツール説明＋スキル＋メモリ＋会話履歴）を組み立て、`streamText()`を呼び出し、ツール呼び出しを実行（コンテキスト肥大化を防ぐため出力は切り捨てられる）、結果を追加し、モデルが完了するかステップ制限に達するまでループを続ける。

**ライフサイクルフック**により、パイプライン全体を所有しなくても、チャットターンの各段階にフックできる（`beforeTurn()` → `streamText()` の前後に `beforeToolCall()`/`afterToolCall()` → `onStepFinish()` → `onChatResponse()`）。フォローアップターンを低コストモデルに切り替えたり、使用ツールを制限したり、全ツール呼び出しを分析用にログ記録したりできる。

**永続メモリと長い会話**では、ThinkはセッションAPIをストレージ層として利用しつつ、コンテキストブロックによる永続メモリを追加する。これはモデルが時間をかけて読み書きできるシステムプロンプトの構造化セクションで、DOのハイバネーションを越えて存続する。コンテキストが肥大化した場合は非破壊的圧縮で対応し、全履歴はSQLiteに保存されたまま、FTS5による検索も可能。

**自己承認型拡張機能**では、エージェント自身が新しい拡張機能をコードとして記述し、Dynamic Workersで実行できる。拡張機能はネットワークアクセスやワークスペース操作の権限をJSONで明示的に宣言するTypeScriptプログラムとして表現され、ThinkのExtensionManagerがバンドル・ロード・ツール登録を行う。拡張はDOストレージに永続化され、ハイバネーションにも耐える。微調整やRLHFではなく、サンドボックス化・監査可能・取消可能なTypeScriptコードによる自己改善ループを実現する狙いがある。

### 第3の波

記事は、AIエージェントの進化を3つの波として整理している。

1. **第1波：チャットボット** — ステートレス・リアクティブ・脆弱。会話は毎回ゼロから始まり、メモリもツールも行動もない。
2. **第2波：コーディングエージェント** — Pi・Claude Code・OpenClaw・Codexのような、ステートフルでツール使用能力の高いエージェント。適切なツールを持ったLLMは汎用機になり得ることを証明したが、1ユーザーのノートパソコン上で動作し、耐久性の保証がない。
3. **第3波：インフラとしてのエージェント** — 耐久性・分散性・構造的安全性・サーバーレス性を備え、インターネット上で実行される。障害を指定でき、アイドルコストがなく、アーキテクチャそのものによってセキュリティが強化される。開発者は任意の数のユーザーのために構築・展開できる。

Project Thinkは、この第3の波を実現するためのプリミティブ群として位置づけられている。

## コード例

### 最小構成のThinkエージェント

`Think`を継承し、`getModel()`のみをオーバーライドする最小構成。

```typescript
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

**解説**: このクラス定義だけで、ストリーミング・メッセージ永続化・中断/キャンセル・エラー処理・再開可能ストリーム・組み込みのワークスペースファイルシステムを備えたチャットエージェントが動作する。`npx wrangler deploy`でそのままデプロイできる。

### ファイバーによる耐久実行

```typescript
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

  async onFiberRecovered(ctx) {
    if (ctx.name === "research" && ctx.snapshot) {
      const { topic } = ctx.snapshot;
      await this.startResearch(topic);
    }
  }
}
```

**解説**: `runFiber()`で登録された処理はSQLiteに記録され、`ctx.stash()`で任意のタイミングのスナップショットを保存できる。エージェントが途中で退去されても、`onFiberRecovered`フックがスナップショットから処理を再開するため、10ステップの調査ループが途中経過を失わずに完走できる。

### サブエージェントによる並列処理

```typescript
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

**解説**: `this.subAgent()`で生成されるサブエージェントはFacetsを介した子Durable Objectsであり、それぞれ独自のSQLiteと実行コンテキストを持つ。RPC呼び出し（`researcher.search()`など）はランタイム上で通常の関数呼び出しとして実行されるため、`Promise.all`で自然に並列化できる。

### 永続的なメモリ（コンテキストブロック）

```typescript
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

**解説**: `"soul"`は読み取り専用でシステムプロンプトの先頭に常に配置される。`"memory"`は書き込み可能なブロックで、モデルはこれを見て「MEMORY（重大事実、更新はset_context使用）[42%、462/1100トークン]」のように現在の使用状況を把握しながら、`set_context`ツールで能動的に記憶を更新できる。書き込まれた内容はDOのハイバネーション後も存続する。

### LLMが生成し、サンドボックスで実行するコード

```javascript
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

**解説**: モデルとの100往復ではなく、100ファイルの検索・読み込み・TODO抽出を行う単一プログラムをモデル自身に書かせ、Dynamic Worker上で一度に実行させている。これがCloudflare API MCPサーバー事例における約99.9%のトークン削減の実体である。

### 自己承認型拡張機能の権限宣言

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

**解説**: エージェントが自分で書いた拡張機能に、アクセスできるネットワーク先（`api.github.com`のみ）とワークスペースへの権限（読み書き可）をJSONで明示的に宣言させる。ThinkのExtensionManagerがこの宣言に基づいて拡張をバンドル・実行し、次にユーザーがプルリクエストについて質問したときには、エージェントは30秒前まで存在しなかった`github_create_pr`ツールを保有している状態になる。

## ユースケース

### 数千万規模の同時セッションを支えるバックグラウンドエージェント基盤

Agents SDKは既に数千の本番エージェントを支えているという。Durable Objectsのハイバネーション（アイドル時ゼロコスト）と自動スケーリングにより、従来の「1ユーザー1コンテナ」モデルでは成立しなかった大規模なマルチユーザーエージェント配信が可能になる。

### 大量ツールを持つAPI・MCPサーバーの効率化

Cloudflare API MCPサーバーの事例が示すように、数百のエンドポイントを個別ツールとして公開するのではなく、`search()`と`execute()`の2ツールに絞り、モデルにコードを書かせて`execute`させることで、トークン消費を約99.9%削減できる。ツール数が多い社内API・SaaS連携などに応用できる考え方である。

### 段階的に権限をエスカレーションするエージェント

実行展開ラダーの設計思想により、ファイル操作だけで完結するタスク（Tier 0）から、npm依存関係が必要なタスク（Tier 2）、Webブラウジングが必要なタスク（Tier 3）、フルのビルド・テスト環境が必要なタスク（Tier 4）まで、必要な分だけ能力を積み増していくエージェントを設計できる。多くのタスクがTier 0を出ないという前提により、コストとセキュリティリスクを最小化できる。

### 自己改善するツールセットを持つアシスタント

自己承認型拡張機能により、エージェントは会話の中で必要になった外部連携（GitHub、Slackなど）を自らTypeScriptコードとして実装し、サンドボックス実行を経て次回以降のターンで新しいツールとして使えるようにできる。微調整やファインチューニングを伴わない、コードベースの自己改善ループのユースケースである。

## サンプル対象外の判断について

Project Think本体（`@cloudflare/think`）はプレビュー版として一般提供されている（npm経由でインストール可能、プライベートベータではない）ため、記事の「利用開始」節に沿った`Think`ベースクラスの最小サンプルを`examples/project-think/`として作成した。ただし、ファイバー・サブエージェント・実行ラダーのTier 1〜4（Dynamic Workers／npm追加／ヘッドレスブラウザ／Cloudflare Sandbox）・自己承認型拡張機能は、追加のバインディングや複数Durable Object間の連携を要するため、100行前後の最小サンプルの範囲外とし、`Think`ベースクラス単体（永続メモリ・独自ツール統合を含む）に絞っている。

## 所感・ポイント

- 「ツール呼び出しの反復」から「コード生成＋サンドボックス実行」への転換は、コスト面（トークン削減）と実装面（100往復のツール呼び出しループが1つのプログラムに置き換わる）の両方でインパクトが大きい。`@cloudflare/codemode`単体でも既存のエージェントに組み込める点は応用が利きそうである。
- 実行展開ラダーの「多くのタスクはTier 0を出ない」という設計は、[`@cloudflare/computer`](./2026-08-03-cloudflare-computer.md)の「コンテナ利用を10%未満に抑える」という思想と方向性が一致しており、両記事は補完的に読める。実際、`@cloudflare/computer`の記事内コード例も`Think`を継承する形で書かれている。
- Durable Objectsのハイバネーション・ファイバー・セッションAPIといった「状態と耐久性」の扱いは、Cloudflare Agentsの[エージェントトレーシング](./2026-08-04-agents-on-cloudflare.md)や、[CI/CDでのself-healingエージェント](./2026-08-04-ci-workflows.md)ともThinkフレームワークを通じてつながっており、Cloudflareのエージェント基盤全体を理解する上でProject Thinkは中核に位置する記事だと言える。
- APIサーフェスは「安定しているが今後も進化する」とされており、プレビュー段階であることには注意が必要。本記事のコード例・パッケージ名は執筆時点（2026年4月）の内容である。

> **Workers サンプル**: [examples/project-think/](../../examples/project-think/) — `Think`ベースクラスを継承した最小エージェント。永続メモリ（`configureSession()`）と独自ツール統合（`getTools()`）を体験できる（ファイバー・サブエージェント・実行ラダー・自己承認型拡張機能は対象外）。

## 関連リンク

- [Agents SDK ドキュメント](https://developers.cloudflare.com/agents/)
- [Durable Objects ドキュメント](https://developers.cloudflare.com/durable-objects/)
- [Durable Object Facets（ブログ）](https://blog.cloudflare.com/durable-object-facets-dynamic-workers/)
- [セッションAPI ドキュメント](https://developers.cloudflare.com/agents/api-reference/sessions/)
- [Code Mode ブログ記事](https://blog.cloudflare.com/code-mode/)
- [Cloudflare API MCPサーバー（GitHub）](https://github.com/cloudflare/mcp)
- [Dynamic Workers（ブログ）](https://blog.cloudflare.com/dynamic-workers/)
- [Cloudflare Browser Run ドキュメント](https://developers.cloudflare.com/browser-rendering/)
- [Cloudflare Sandbox ドキュメント](https://developers.cloudflare.com/sandbox/)
- [runFiber() API リファレンス](https://developers.cloudflare.com/agents/api-reference/durable-execution/)
- [サブエージェント API リファレンス](https://developers.cloudflare.com/agents/api-reference/sub-agents/)
- [@cloudflare/shell（npm）](https://www.npmjs.com/package/@cloudflare/shell)
- [@cloudflare/codemode（npm）](https://www.npmjs.com/package/@cloudflare/codemode)
- [@cloudflare/worker-bundler（GitHub）](https://github.com/cloudflare/agents/tree/main/packages/worker-bundler)
- [Think ドキュメント（GitHub）](https://github.com/cloudflare/agents/blob/main/docs/think/index.md)
- [Think 利用例（GitHub）](https://github.com/cloudflare/agents/tree/main/examples/assistant)
- 関連記事（本リポジトリ内）: [AIエージェントに必要なのはコンテナではなくコンピューター —「@cloudflare/computer」のご紹介](./2026-08-03-cloudflare-computer.md) / [Cloudflare Agentsの紹介](./2026-08-04-agents-on-cloudflare.md) / [数百万のリポジトリのCI/CDを、あなたのプラットフォーム上でCloudflareが動かす](./2026-08-04-ci-workflows.md)
