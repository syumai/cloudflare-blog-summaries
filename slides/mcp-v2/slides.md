---
routerMode: hash
theme: default
title: 次世代のMCP
info: |
  Cloudflare Blog記事「次世代のMCP」の解説スライド。
  原文: https://blog.cloudflare.com/mcp-v2/
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

# 次世代のMCP

ステートレスなプロトコルへ生まれ変わったModel Context Protocol

<div class="pt-4 text-sm opacity-70">
原文: https://blog.cloudflare.com/mcp-v2/<br>
公開日: 2026-08-06
</div>

---

# TL;DR

- MCPの新仕様 `2026-07-28` がリリースされ、**ステートフル**から**ステートレス**なプロトコルへと作り変えられた
- `initialize`/`initialized`ハンドシェイクと`Mcp-Session-Id`ヘッダーが不要になり、`McpAgent`（Durable Object）を使わずとも通常のCloudflare Workers上でMCPサーバーを動かせるように
- elicitationは、オープンストリームに依存しない新方式の<strong>MRTR（Multi Round-Trip Requests）</strong>に置き換え
- HTTPリクエストに`Mcp-Method`/`Mcp-Name`ヘッダーが追加され、ゲートウェイやWAFがJSON本文をパースせずにルーティング・レート制限が可能に
- 認可まわりも強化。CIMD採用が進み、DCRは非推奨化、2027年夏以降に廃止予定

---

# アジェンダ


- 背景: MCPが抱えていた「ステートフルネス」の課題
- MCP 2026-07-28仕様の全体像
- MCPはステートレスになった
- elicitationはMRTRへ
- HTTPインフラがMCPを理解できるようになった
- 認可（Authorization）のさらなる進化
- コード例で見る新しいSDK
- ユースケース
- まとめ・所感


---

# 背景: McpAgentとDurable Objects

Cloudflareは2025年3月、Agents SDK向けの `McpAgent` プリミティブをリリース


- Durable Objectsを土台にした**ステートフルなサーバー**
- コンピュート・永続的なトランザクションストレージ（組み込みSQLite）・
  リアルタイムのコネクション維持を1つに統合
- MCPが必要とする双方向・継続的なやり取りには最適だった


---

# 課題: ステートフルネスというコスト


> ほとんどのやり取りが必要としないはずの「セッション調整」の
> コストを、常に払うことになっていた



- `initialize`/`initialized` ハンドシェイクと `Mcp-Session-Id` によるセッション管理が必須
- オートスケールするインフラはアクティブなセッションを維持し続ける必要がある
- インスタンスが失われるとクライアントは再接続を強いられ、セッションが壊れることも
- サーバーレス基盤でも動かせるが、不要な複雑さを常に抱えることになる


---

# MCP 2026-07-28仕様: 何が変わったか


- **ステートレス化**: ハンドシェイク・セッションIDが不要に
- **MRTR**: elicitationがオープンストリーム不要のリトライ方式へ
- **HTTPヘッダー**: `Mcp-Method` / `Mcp-Name` でゲートウェイがMCPを理解
- **認可の強化**: CIMD・RFC 9207・RFC 8707への準拠
- **機能ライフサイクル**: Active / Deprecated / Removed の正式な運用ポリシー


---

# MCPはステートレスになった


- 必須だったハンドシェイクと `Mcp-Session-Id` ヘッダーを廃止
- 各リクエストが、必要なプロトコルバージョン・クライアント識別情報・
  capabilitiesを自身の中に含むように
- サーバー事前調査用の `server/discover` は任意（オプション）
- 保存すべきプロトコルセッションが存在しない


<br>


`McpAgent`（Durable Object）は必須ではなくなり、通常のWorkers上で動作可能に


---
layout: image-right
image: https://blog.cloudflare.com/_emdash/api/media/file/01KZA53A6RYJARJY0Q83JSH53M.png
backgroundSize: contain
---

# ステートフルからステートレスへ

「リクエストを受け取り、
ツール・プロンプト・リソースを呼び出し、
結果を返す」という単純なモデルへ

<footer class="text-xs opacity-50 mt-4">
出典: Cloudflare Blog https://blog.cloudflare.com/mcp-v2/
</footer>

---

# elicitationはMRTRへ

サーバーが追加情報を必要とする場面（デプロイ承認・色選択・返金確認など）


- 従来: `elicitation/create` はオープンストリームに依存
- 新方式（**MRTR**: Multi Round-Trip Requests）:
  - サーバーが `input_required` という結果を返す
  - クライアントが回答を集め、その入力を添えて元の操作をリトライ
  - 両者ともトランスポートセッションを保持し続ける必要がない


<br>


破壊的変更だが、運用面ではるかに実装しやすい設計


---
layout: image-right
image: https://blog.cloudflare.com/_emdash/api/media/file/01KZA53A5N7VQM3QTA57A2FN83.png
backgroundSize: contain
---

# MRTRのフロー

`input_required` → クライアントが回答収集
→ 入力を添えてリトライ → 完了

ストリームを維持したまま
待ち続ける必要がない

<footer class="text-xs opacity-50 mt-4">
出典: Cloudflare Blog https://blog.cloudflare.com/mcp-v2/
</footer>

---

# HTTPインフラがMCPを理解できるようになった


- 新仕様は `Mcp-Method` / `Mcp-Name` ヘッダーをリクエストに要求
- ゲートウェイ・レートリミッター・WAFがJSON本文をパースせずに判断可能
- メソッド単位のルール適用、ツール単位のメトリクス記録が可能に
- `tools/list` 等に `ttlMs` / `cacheScope` ヒントを追加し、キャッシュを安定化


---

# リクエスト例: Mcp-Method / Mcp-Name

```http {2|3-4|6-13|all}
POST /mcp HTTP/1.1
MCP-Protocol-Version: 2026-07-28
Mcp-Method: tools/call
Mcp-Name: search
Content-Type: application/json

{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "search",
    "arguments": { "q": "otters" }
  }
}
```


JSON本文と同じ情報（`method` / `params.name`）が
**HTTPヘッダーにも重複して**載っている点がポイント


---
layout: image-right
image: https://blog.cloudflare.com/_emdash/api/media/file/01KZA53A660J99FJBX7DAWZ4MZ.png
backgroundSize: contain
---

# ヘッダーで見えるMCP

ボディをパースしなくても、
リクエストの種類が分かる

既存のHTTPインフラの語彙で
MCPを扱えるようになる

<footer class="text-xs opacity-50 mt-4">
出典: Cloudflare Blog https://blog.cloudflare.com/mcp-v2/
</footer>

---

# 認可（Authorization）のさらなる進化


- クライアント登録の優先順位: **事前登録済みクライアント → CIMD → DCR（非推奨）**
- DCR（Dynamic Client Registration）は新規実装で非推奨、2027年夏以降に廃止予定
- **RFC 9207**: issuer識別。`iss` パラメータで認可レスポンスの発行元を検証
- **RFC 8707**: リソースaudience。トークンは正規URIのaudience向けにのみ発行・受理


---

# コード例② Workers OAuth Providerでラップ

```ts {1|3-6|8-9|10-15|all}
import { OAuthProvider } from "@cloudflare/workers-oauth-provider";

export default new OAuthProvider({
  apiRoute: "/mcp",
  apiHandler: mcpHandler,
  defaultHandler: authorizationHandler,
  authorizeEndpoint: "/authorize",
  tokenEndpoint: "/oauth/token",
  clientIdMetadataDocumentEnabled: true,
  resourceMetadata: {
    resource: "https://mcp.example.com/mcp",
    authorization_servers: ["https://mcp.example.com"],
    scopes_supported: ["mcp:read"],
  },
});
```


`clientIdMetadataDocumentEnabled: true` でCIMDを有効化。
`resourceMetadata.resource` がRFC 8707準拠のaudience制限の土台になる


---

# 機能ライフサイクル: Active / Deprecated / Removed


> 非推奨化された機能は削除されるまで
> **最低12か月間**は利用可能であり続けなければならない



- このリリースで非推奨に: Roots・Sampling・Logging・DCR・レガシーHTTP+SSEトランスポート
- 突然の廃止ではなく、計画的なアップグレードが可能に
- 新しいアイデアは **Extensions（拡張）** フレームワークでコア外に切り出し
  - MCP Apps / Enterprise-Managed Authorization / Tasks


---
class: text-center
---

# コード例で見る:
# 新しいSDK

`createMcpHandler` が公式MCP TypeScript SDKに正式採用

---

# 新しいSDKの背景


- 2025年11月: Agents SDKに実験的な `createMcpHandler` を導入
- 2026年初め: MCP TypeScript SDKをNode.jsからWeb Standardsへ再プラットフォーム化
  - Bun / Deno / Cloudflare Workersとの相互運用性を向上
- 今回のリリースで `createMcpHandler` が**公式SDKに正式採用**
- `/mcp` エンドポイントは新プロトコルと2025年のStreamable HTTPクライアントの
  両方を受け付け、後方互換性を維持


---

# コード例③ 最小構成のMCPサーバー: 見どころ


- 次の2枚のコードは `McpServer`（公式SDK）に `registerTool()` で
  `hello` ツールを1つ登録するだけの最小構成
- 入力スキーマは `zod` で定義（`name` は任意の文字列）
- 2枚目末尾の `export default` に注目
  — これは**通常のWorkersの `fetch` ハンドラー**そのもの
- `createMcpHandler(createServer)` が `fetch(request, env, ctx)` を返す
- Durable Objectのクラス継承も `Agent` クラスも**一切登場しない**
  — これが「ステートレス化」がコードレベルにもたらした最も分かりやすい変化

---

# コード例③ 最小構成のMCPサーバー

```ts {1-3|5-6|8-17|19-20|all}
import { McpServer } from "@modelcontextprotocol/server";
import { createMcpHandler } from "agents/mcp/server";
import { z } from "zod";

function createServer() {
  const server = new McpServer({ name: "hello-server", version: "1.0.0" });

  server.registerTool(
    "hello",
    {
      description: "Return a greeting",
      inputSchema: { name: z.string().optional() },
    },
    async ({ name }) => ({
      content: [{ type: "text", text: `Hello, ${name ?? "World"}!` }],
    }),
  );

  return server;
}
```

---

# コード例③ 最小構成のMCPサーバー（続き）

`export default` に注目 — 通常のWorkersの `fetch` ハンドラーそのもの

```ts
export default {
  fetch(request, env, ctx) {
    return createMcpHandler(createServer)(request, env, ctx);
  },
}
```

---
class: text-center
---

# ユースケース

---

# ユースケース①: McpAgentからの移行


- 既存の`McpAgent`（Durable Object）サーバーを段階的に移行
- ステートレスなルートを既存ルートと並行稼働させる
- 機能を少しずつ移し、アクティブなセッションをドレイン
- 非推奨期間の終わりにレガシーパスを削除
- MCPクライアント側は `agents` パッケージのアップグレードのみで対応可能


---

# ユースケース②: ゲートウェイでのルーティング・可観測性


- `Mcp-Method` / `Mcp-Name` ヘッダーで既存のHTTPゲートウェイをそのまま活用
- WAF・レートリミッターがJSON本文をパースせずに判断
- メソッド・ツール単位でのルール適用やメトリクス収集が可能に


---

# ユースケース③: 承認フローを伴うエージェント


- デプロイ承認、デザインツールでの色選択、返金確認など
- MRTRによりオープンストリームを維持し続ける必要がない
- サーバーレス環境上でも「人による確認」を挟むワークフローを実装しやすくなる


---

# ユースケース④: エンタープライズ規模のセキュアなMCP公開


- Workers OAuth Providerで CIMD・RFC 9207・RFC 8707準拠の認可を実現
- OAuthプロトコルの詳細をコード側で意識せずに実装可能
- SentryやLinearなど、製品データを様々なAIクライアントへ安全に公開する事例


---

# ユースケース⑤: 大規模トラフィックのAPIラッパー型サーバー


- CloudflareのCode Mode MCP Server（Cloudflare API全体をラップ）
- 非公式ステートレスモードを先行採用
- 毎秒数千リクエスト・累計数十億回のツール呼び出しの規模で実運用


<br>


ステートレスなMCPサーバーが、通常のHTTPワークロードと同じスケーラビリティを持つ実例


---

# 実運用の声


- **Sentry**（David Cramer氏）: 「7-28仕様が最終化される前から本番投入したが、
  プロダクションを壊さなかった。認可とツール周りが整理されたのが良い」
- **Linear**（Tom Moor氏）: 「サーバーのホスティングが簡単・信頼性の高いものになり、
  必要な機能も追加された。標準に一度実装すれば、どんなAIクライアントとも動く」
- **Anthropic**（David Soria Parra氏）: 「ローンチ以来最も大きなプロトコルの進化。
  エンジニアリングの手間を最小限に、意味のある性能向上が得られる」


---

# まとめ


- MCP 2026-07-28仕様は、プロトコルを**ステートフルからステートレスへ**転換
- ハンドシェイク・セッションIDが不要になり、`McpAgent`（Durable Object）は
  選択肢の1つに——通常のWorkersでもMCPサーバーを動かせる
- elicitationはMRTRへ、認可はCIMD・RFC 9207・RFC 8707へと強化
- `Mcp-Method` / `Mcp-Name` ヘッダーで、既存のHTTPインフラの語彙が使えるように
- `createMcpHandler` が公式MCP TypeScript SDKへ正式採用
- 非推奨機能には最低12か月の移行猶予を保証するライフサイクルポリシーを導入


---

<div class="text-center">

# 参考リンク

</div>

- 原文: [The next generation of MCP](https://blog.cloudflare.com/mcp-v2/)
- [MCP SDK v2 移行ガイド](https://developers.cloudflare.com/agents/model-context-protocol/guides/migrate-to-mcp-sdk-v2/)
- [createMcpHandler ドキュメント](https://developers.cloudflare.com/agents/model-context-protocol/apis/handler-api/)
- [Workers OAuth Provider（GitHub）](https://github.com/cloudflare/workers-oauth-provider)
- [MRTR仕様](https://modelcontextprotocol.io/specification/draft/basic/patterns/mrtr)
- [Cloudflare Code Mode MCP Server（ブログ）](https://blog.cloudflare.com/code-mode-mcp/)
- Workers サンプル: [github.com/syumai/cloudflare-blog-summaries/tree/main/examples/mcp-v2](https://github.com/syumai/cloudflare-blog-summaries/tree/main/examples/mcp-v2)

<div class="pt-8 text-sm opacity-50">
Wiki: docs/articles/2026-08-06-mcp-v2.md
</div>
