---
routerMode: hash
theme: default
title: "Code Mode: MCPをもっとうまく使う方法"
info: |
  Cloudflare Blog記事「Code Mode: the better way to use MCP」の解説スライド。
  原文: https://blog.cloudflare.com/code-mode/
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

# Code Mode
# MCPをもっとうまく使う方法

<div class="pt-4 text-sm opacity-70">
原文: https://blog.cloudflare.com/code-mode/<br>
公開日: 2025-09-26
</div>

---

# TL;DR

- MCPツールを直接LLMに公開してツール呼び出しさせる従来のやり方をやめ、MCPツール群を<strong>TypeScript API</strong>に変換し、LLMにそのAPIを呼び出す<strong>コードを書かせる</strong>「Code Mode」を提案
- ツール呼び出し用の特殊トークンは合成データでしか学習されないが、実世界のTypeScriptコードはLLMが大量に学習済み。「コードを書く」方が「ツールを呼ぶ」よりLLMは得意
- 複数ツールの連鎖も1回のコード実行にまとめられ、中間結果をいちいちLLMに読ませずに済むため、トークンと時間を節約できる
- 生成されたコードは Dynamic Worker Loading が作る使い捨ての V8 isolate で実行され、インターネット遮断とbinding経由のみのアクセスで安全性を確保する

---

# アジェンダ

- 背景: MCPとは何か、ツール呼び出しの問題点
- Code Modeの発想
- Agents SDKでの実装: `codemode` ヘルパー
- MCPツールをTypeScript APIに変換する仕組み
- サンドボックスでのコード実行
- Dynamic Worker Loading と Worker Loader API
- bindingsによる権限境界
- ユースケース

---

# 背景: MCPとは何か

Model Context Protocol（MCP）は、AIエージェントに外部ツールへのアクセスを与えるための標準プロトコル

- エージェントが会話するだけでなく、実際に作業を代行できるようにする仕組み
- MCPサーバーが公開する「API」は<strong>ツール</strong>の集合として表現される
- 各ツールは事実上のRPC（リモートプロシージャコール）関数で、パラメータを受け取り結果を返す
- MCPは次の3つを統一的な形で提供する: 何かを行うAPI／LLMが理解するためのドキュメント／プロトコル外で扱う認可

---

# ツール呼び出しの仕組み

LLMは出力の中に、ツール呼び出しを表す<strong>特殊トークン</strong>を挟み込む

- 「ここからツール呼び出し」「ここでツール呼び出し終わり」を示す特殊トークンをLLMは学習している
- 挟まれた部分にはJSON形式の呼び出し内容が書かれる
- ハーネス（呼び出し元プログラム）がこれを検出してツールを実行し、結果を返す
- 結果は同様に特殊トークンで囲われ、LLMへの入力として戻される

<div class="text-xs opacity-60 mt-4">
LLMごとにフォーマットは異なるが、基本的な考え方は共通している
</div>

---

# ツール呼び出しの問題点

ツール呼び出し用の特殊トークンは、LLMが現実世界で見たことのない形式

- 特殊トークンの使い方は、合成された学習データをもとに<strong>特別に訓練（ファインチューニング）</strong>しないと身につかない
- ツールが多すぎたり複雑だったりすると、正しいツールを選べない・正しく使えないことがある
- そのためMCPサーバーの設計では、開発者向けAPIより単純化したインターフェースを公開するよう推奨されてきた
- 一方でLLMはコードを書くのが非常に得意で、開発者向けの複雑なAPIをそのままコードで呼び出す分には苦労しない

<div class="text-sm opacity-70 mt-4">
「LLMにツール呼び出しをさせるのは、シェイクスピアに1か月だけ中国語を学ばせてから戯曲を書かせるようなもの。最高の出来にはならない」
</div>

---

# なぜMCPは今も有用なのか

MCPはツール呼び出し用に設計されているが、<strong>その使い方に縛られる必要はない</strong>

- MCPが公開する「ツール」は、実質的にはドキュメント付きのRPCインターフェース
- ツールとしてではなく、<strong>プログラミング言語のAPI</strong>に変換して使うこともできる
- 既存のAPIをラップしただけのMCPサーバーは多いが、MCPには他にはない価値がある: <strong>接続・認可・学習の方法が統一されている</strong>こと
- エージェントの開発者とMCPサーバーの開発者が互いを知らなくても連携できるのは、この統一性のおかげ

---

# Code Modeの発想

MCPツールを<strong>直接LLMに見せる代わりに</strong>、TypeScript APIに変換してコードを書かせる

- LLMが書いたコードは<strong>安全なサンドボックス</strong>内で実行される
- サンドボックスはインターネットから完全に遮断されており、接続済みMCPサーバーを表すTypeScript API経由でしか外の世界にアクセスできない
- 複数のMCP呼び出しをコード側でまとめて連鎖させ、必要な最終結果だけをLLMに読み返させられる
- 実行結果は `console.log()` の出力としてエージェントに戻される

---

# Agents SDKでの実装: 変更前

ai-sdk の `streamText` を使った、ごく普通のツール呼び出しの例

```javascript
const stream = streamText({
  model: openai("gpt-5"),
  system: "You are a helpful assistant",
  messages: [
    { role: "user", content: "Write a function that adds two numbers" }
  ],
  tools: {
    // tool definitions 
  }
})
```

- `tools` にはMCPツールなどのツール定義をそのまま渡している
- LLMはこの `tools` の中から呼び出すツールを選び、特殊トークンで呼び出す

---

# Agents SDKでの実装: 変更後

`codemode` ヘルパーで `system` と `tools` をラップするだけで良い

```javascript
import { codemode } from "agents/codemode/ai";

const {system, tools} = codemode({
  system: "You are a helpful assistant",
  tools: {
    // tool definitions 
  },
  // ...config
})

const stream = streamText({
  model: openai("gpt-5"),
  system,
  tools,
  messages: [
    { role: "user", content: "Write a function that adds two numbers" }
  ]
})
```

- 元の `tools` 定義や `streamText` の呼び出し方はほぼそのまま
- ラップ後は、内部で生成・実行されたコードがMCPツールを呼び出すようになる

---

# MCPをTypeScript APIに変換する

Code Modeでは、接続したMCPサーバーのスキーマを取得し、<strong>TypeScript API</strong>に変換する

- Agents SDKがMCPサーバーのスキーマを取得する
- スキーマの `description` などから、doc comment（JSDoc）付きの型定義を自動生成する
- 例: `https://gitmcp.io/cloudflare/agents` に接続すると、次のようなTypeScript定義が生成される
- 生成されたTypeScriptは、そのままエージェントのコンテキストに読み込まれる

<div class="text-xs opacity-60 mt-4">
現状は生成されたAPI全体を読み込むが、将来的にはコーディングアシスタントのようにAPIを動的に検索・閲覧できるようにする計画
</div>

---

# 生成されるTypeScript API①: 入出力の型（1/3）

各ツールの入力・出力はスキーマからそのまま型として生成される。doc commentがある場合はそのまま引き継がれる

```typescript
interface FetchAgentsDocumentationInput {
  [k: string]: unknown;
}
interface FetchAgentsDocumentationOutput {
  [key: string]: any;
}

interface SearchAgentsDocumentationInput {
  /**
   * The search query to find relevant documentation
   */
  query: string;
}
interface SearchAgentsDocumentationOutput {
  [key: string]: any;
}
```

---

# 生成されるTypeScript API①: 入出力の型（2/3）

`page?` のようなオプション引数も、そのままオプショナルなプロパティとして表現される

```typescript
interface SearchAgentsCodeInput {
  /**
   * The search query to find relevant code files
   */
  query: string;
  /**
   * Page number to retrieve (starting from 1). Each page contains 30
   * results.
   */
  page?: number;
}
interface SearchAgentsCodeOutput {
  [key: string]: any;
}
```

---

# 生成されるTypeScript API①: 入出力の型（3/3）

出力側の詳細な形が不明なツールは `[key: string]: any` になる

```typescript
interface FetchGenericUrlContentInput {
  /**
   * The URL of the document or page to fetch
   */
  url: string;
}
interface FetchGenericUrlContentOutput {
  [key: string]: any;
}
```

- 4つのツールすべてが、このように入出力の型を持つTypeScript APIとして表現される

---

# 生成されるTypeScript API②: codemodeオブジェクト（1/2）

各ツールはメソッドとして公開され、ツールの説明はそのままdoc commentになる

```typescript
declare const codemode: {
  /**
   * Fetch entire documentation file from GitHub repository:
   * cloudflare/agents. Useful for general questions. Always call
   * this tool first if asked about cloudflare/agents.
   */
  fetch_agents_documentation: (
    input: FetchAgentsDocumentationInput
  ) => Promise<FetchAgentsDocumentationOutput>;

  /**
   * Semantically search within the fetched documentation from
   * GitHub repository: cloudflare/agents. Useful for specific queries.
   */
  search_agents_documentation: (
    input: SearchAgentsDocumentationInput
  ) => Promise<SearchAgentsDocumentationOutput>;
```

---

# 生成されるTypeScript API②: codemodeオブジェクト（2/2）

```typescript
  /**
   * Search for code within the GitHub repository: "cloudflare/agents"
   * using the GitHub Search API (exact match). Returns matching files
   * for you to query further if relevant.
   */
  search_agents_code: (
    input: SearchAgentsCodeInput
  ) => Promise<SearchAgentsCodeOutput>;

  /**
   * Generic tool to fetch content from any absolute URL, respecting
   * robots.txt rules. Use this to retrieve referenced urls (absolute
   * urls) that were mentioned in previously fetched documentation.
   */
  fetch_generic_url_content: (
    input: FetchGenericUrlContentInput
  ) => Promise<FetchGenericUrlContentOutput>;
};
```

- LLMはこの `codemode` オブジェクトに対してコードを書くだけで、4つのMCPツールすべてを扱える
- 「いつ呼ぶべきか」までdoc commentに書かれているため、判断材料もコードの中に揃っている

---

# サンドボックスでのコード実行

エージェントに公開されるツールは実質<strong>1つだけ</strong>: TypeScriptコードを実行するツール

- 接続済みのすべてのMCPサーバーのツールを個別に見せる代わりに、コード実行ツール1つだけを公開する
- コードは安全なサンドボックス内で実行され、インターネットから完全に遮断されている
- サンドボックスが外の世界にアクセスできるのは、接続されたMCPサーバーを表すTypeScript API経由のみ
- これらのAPIはRPC呼び出しとして実装されており、呼び出しはエージェントループに戻ってMCPサーバーへディスパッチされる
- 実行結果は `console.log()` の出力として、エージェントにまとめて返される

---

# サンドボックス実行フロー

<img src="https://blog.cloudflare.com/_emdash/api/media/file/01KW4807976ECKPP0XV15W0KBX.png" class="mx-auto rounded mt-4" alt="サンドボックス実行フロー図" style="max-height: 380px;" />

<footer class="text-xs opacity-50 mt-4">
出典: Cloudflare Blog https://blog.cloudflare.com/code-mode/
</footer>

---

# Dynamic Worker Loading: コンテナを使わない理由

任意のコードを実行する安全なサンドボックスが必要だが、<strong>コンテナは使わない</strong>

- Cloudflare Workersはこれまでずっと<strong>V8 isolate</strong>（V8エンジンによる隔離されたJavaScript実行環境）を基盤にしてきた
- isolateはコンテナよりはるかに軽量
- 起動にかかるのはわずか数ミリ秒、使用メモリも数MB程度
- isolateが軽いからこそ、エージェントが実行するコード片ごとに<strong>使い捨てのisolate</strong>を新規作成できる

---

# isolateの軽さがもたらすもの

isolateが速すぎるので、<strong>再利用もプリウォームも不要</strong>になる

- 必要なときに作り、コードを実行し、使い終わったら捨てるだけで良い
- オーバーヘッドはほとんど無視できるほど小さく、体感としては安全性を保ったまま `eval()` しているのに近い
- これまでWorkerのコードはCloudflare APIでアップロードし、世界中にデプロイする形でしか動かせなかった
- エージェント用途ではそれでは困る: コードはエージェントがいる場所でそのまま実行したい

---

# Worker Loader API①: Workerの取得とコード定義

新しく追加された Worker Loader API を使うと、Workerのコードをオンデマンドでロードできる。次の点に注目

- `env.LOADER.get(id, ...)` でIDを指定してWorkerを取得し、存在しなければコールバックで生成する
- コールバックは `compatibilityDate` と `mainModule` / `modules` を返すだけで良い
- モジュール本体はここでは文字列として直接埋め込まれている

```javascript
// Gets the Worker with the given ID, creating it if no such Worker exists yet.
let worker = env.LOADER.get(id, async () => {
  // If the Worker does not already exist, this callback is invoked.
  return {
    compatibilityDate: "2025-06-01",
    mainModule: "foo.js",
    modules: {
      "foo.js":
        "export default {\n" +
        "  fetch(req, env, ctx) { return new Response('Hello'); }\n" +
        "}\n",
    },
```

---

# Worker Loader API②: env（bindings）とglobalOutbound

返すオブジェクトには、動的Workerの `env` と `globalOutbound`（発信ネットワークの扱い）も指定できる。次の点に注目

- `env` には数値などの単純な値だけでなく、親Workerの<strong>RPCインターフェースへのbinding</strong>（`ctx.exports.MyBindingImpl(...)`）も渡せる
- `globalOutbound` に `ctx.exports.OutboundProxy(...)` を指定すると、`fetch()` / `connect()` を親Worker経由にプロキシしてインターネットアクセスを監視・制限できる
- `globalOutbound` に `null` を渡せば、インターネットアクセスを完全に遮断できる

```javascript
    // Specify the dynamic Worker's environment (`env`).
    env: {
      SOME_NUMBER: 123,
      SOME_RPC_BINDING: ctx.exports.MyBindingImpl({props})
    },
    // Proxy or block (`null`) all Internet access.
    globalOutbound: ctx.exports.OutboundProxy({props}),
  };
});
```

---

# Worker Loader API③: エントリポイントの呼び出し

生成したWorkerは `getEntrypoint()` で取得し、通常のWorkerと同じように呼び出せる。次の点に注目

- 引数なしの `getEntrypoint()` はデフォルトのエントリポイントを返す
- 名前付きエントリポイントを指定する場合、`props` を渡して `ctx.props` として届けられる

```javascript
// Now you can get the Worker's entrypoint and send requests to it.
let defaultEntrypoint = worker.getEntrypoint();
await defaultEntrypoint.fetch("http://example.com");

// You can get non-default entrypoints as well, and specify the
// `ctx.props` value to be delivered to the entrypoint.
let someEntrypoint = worker.getEntrypoint("SomeEntrypointClass", {
  props: {someProp: 123}
});
```

<div class="text-xs opacity-60 mt-4">
本番環境での利用は現在クローズドベータ。`wrangler` と `workerd` を使ったローカル環境ではすぐに試せる
</div>

---

# bindingsによる権限境界

Code Modeでは、サンドボックス化されたWorkerのインターネットアクセスを禁止する

- グローバルの `fetch()` / `connect()` はエラーを投げるようにしてある
- 多くのプラットフォームでは、まず一般的なネットワークアクセスを与え、そこからAPIキー付きでリクエストを送る形で個別サービスにアクセスする
- Workersでは `env` オブジェクトが文字列だけでなく<strong>ライブオブジェクト（binding）</strong>を持てる
- Code Modeでは、接続されたMCPサーバーを表すbindingだけをサンドボックスに渡し、<strong>ネットワークアクセス自体は持たせない</strong>まま個別のMCPサーバーにアクセスさせる

---

# なぜbindingsの方が良いのか

ネットワークレベルのフィルタリングやHTTPプロキシより、bindingによる制限の方がすっきりしている

- フィルタリングは境界が曖昧になりがちで、監督側は「本当に必要な通信」を正確に見極めるのが難しい
- LLM側も、どんなリクエストがブロックされるか予測しづらい
- bindingを使えば境界は明確: bindingが提供するJavaScriptインターフェースだけが使える
- bindingはAPIキーそのものも隠す。呼び出しはすべて先にエージェントのsupervisor側を経由し、そこでアクセストークンを付与してMCPへ送る
- この仕組みにより、AIが書いたコードがAPIキーを漏らすことは<strong>構造的にあり得ない</strong>

---

# コンテナとの比較

isolateベースのCode Modeは、コンテナベースのサンドボックスと何が違うのか

| | isolate（Workers） | コンテナ |
|---|---|---|
| 起動時間 | 数ミリ秒 | 秒〜数十秒規模 |
| メモリ使用量 | 数MB程度 | 数十〜数百MB規模 |
| 再利用・プリウォーム | 不要（都度使い捨てで問題ない） | 必要になりやすい |
| ネットワーク遮断 | bindingで明確に制御 | プロキシ・フィルタリングに頼りがち |

コード片1つごとに使い捨てのisolateを作っても、オーバーヘッドは無視できるほど小さい

---

# ユースケース①: 複数ツールをまたぐドキュメント調査

`gitmcp.io/cloudflare/agents` のようなMCPサーバーに接続すると、ドキュメント取得・検索・コード検索・URL取得の4ツールがTypeScript APIとして使える

- 「このAPIの使い方を教えて」という質問に対し、まず `fetch_agents_documentation` でドキュメント全体を読み、次に `search_agents_code` で該当コードを検索する、という一連の処理を<strong>1回のコード実行</strong>にまとめられる
- 途中結果（ドキュメント全文や検索結果一覧）をいちいちLLMに読ませる必要がなく、最終的に必要な要約だけを `console.log()` で返せる
- ツール呼び出しの往復が減る分、トークンと時間の節約になる

---

# ユースケース②: 既存のai-sdkアプリをCode Mode化する

`codemode` ヘルパーは既存の `tools` 定義をそのまま受け取れるため、大きな書き換えなしに導入できる

- `streamText` に渡していた `system` と `tools` を `codemode({ system, tools })` でラップするだけ
- MCPサーバー由来のツール定義も、通常の関数ツールもまとめて扱える
- 導入後は、LLMがツールを直接呼ぶのではなく、それらを呼び出すTypeScriptコードを書いて実行するようになる

---

# まとめ

- MCPツールを直接LLMに公開する代わりに、TypeScript APIに変換してコードを書かせる<strong>Code Mode</strong>という発想
- LLMは特殊トークンによるツール呼び出しより、現実世界で大量に学んだコードを書く方が得意
- 複数ツールの連鎖を1回のコード実行にまとめられ、中間結果をLLMに読ませずに済む
- 生成コードは Dynamic Worker Loading による使い捨ての V8 isolate 上で実行され、インターネット遮断とbindingによる権限境界で安全性を確保している
- MCP自体は、接続・認可・ドキュメントを統一的に扱える仕組みとして引き続き価値がある

---

# 所感

- ツール呼び出し用の特殊トークンとコードの学習量の差、という説明はシンプルだが説得力がある
- 「MCPをやめる」のではなく「MCPの価値（統一的な接続性）は残しつつ、LLMへの見せ方だけを変える」という設計判断が特徴的
- isolateとbindingを使った権限境界の設計は、Cloudflare Workersのアーキテクチャをそのまま活かした形になっている
- 同時期に発表された「code-mode-mcp」（サーバー側でのコードモード）と対になる内容で、クライアント側・サーバー側それぞれの適用例として読み比べると理解が深まる

---

<div class="text-center">

# 参考リンク

</div>

- 原文: [Code Mode: the better way to use MCP](https://blog.cloudflare.com/code-mode/)
- Model Context Protocol: https://modelcontextprotocol.io/docs/getting-started/intro
- Cloudflare Agents SDK: https://developers.cloudflare.com/agents/
- codemode ドキュメント: https://github.com/cloudflare/agents/blob/main/docs/codemode.md
- Worker Loader API: https://developers.cloudflare.com/workers/runtime-apis/bindings/worker-loader/
- Workersのライブオブジェクトbindings: https://blog.cloudflare.com/workers-environment-live-object-bindings/

<a href="../code-mode-mcp/" target="_blank">▶ 解説スライド: コードモード（サーバー側）</a>

<div class="pt-8 text-sm opacity-50">
Wiki: docs/articles/2025-09-26-code-mode.md
</div>
