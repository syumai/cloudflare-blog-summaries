---
routerMode: hash
theme: default
title: あらゆるWebサイトにWebMCPインターフェースを付与する
info: |
  Cloudflare Blog記事「Give any website a WebMCP interface」の解説スライド。
  原文: https://blog.cloudflare.com/webmcp/
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

# あらゆるWebサイトに
# WebMCPインターフェースを

Cloudflareが developer preview として提供する
コード変更不要のエージェント対応機能

<div class="pt-4 text-sm opacity-70">
原文: https://blog.cloudflare.com/webmcp/<br>
公開日: 2026-08-06
</div>

---

# TL;DR

- Cloudflareは、任意のWebサイトにAIエージェント向けの「ツール」インターフェースを付与するdeveloper preview版**WebMCP**を発表
- WebMCPはChrome 146で実験的に提供されるブラウザ標準で、ページ上に`document.modelContext`として現れ、サイトが自身の「ツール」一式をAIエージェントに公開できる仕組み
- Cloudflareの実装は、サイトのオリジンコードを一切変更せず、エッジ側でHTML配信時に小さなブリッジスクリプトを1行注入するだけで有効化できる
- 初回プレビューでは「Content Credentials」（C2PA画像の来歴確認）と「Site MCP Server」（サイト自身のMCPサーバーへのプロキシ）という2つの「ツールパック」が提供される
- 登録されるツールはMCPの`Tool`/`CallToolResult`型に準拠しており、既存のMCPクライアント・エージェントは特別な対応なしにページ上のツールを呼び出せる

---

# アジェンダ


- 背景: Webサイトを訪れる「新しい訪問者」としてのAIエージェント
- 課題: クローラー型スクレイピングの限界
- WebMCPというブラウザ標準
- Cloudflareの実装: ツールパックとエッジ注入
- コード例で見る仕組み
- ユースケース
- まとめ・所感


---

# 背景: Webは人間のためのものだった


- 従来のWebは「人間が読む・クリックする・フォームを埋める」ことを前提に設計されてきた
- 近年、AIエージェントがWebサイトを訪問しタスクを代行するケースが急増
- 従来型のクローラーはページをスクレイピングし、コンテンツをサーバー側にコピーする


<br>


結果として、元のサイト運営者にはトラフィックもクレジット（帰属）もほとんど還元されない


---

# 課題: 推測に頼るエージェント操作


- エージェントはページ構造やナビゲーションの流れを自力で推測してから操作を組み立てる必要がある
- これは遅く、壊れやすく、無駄なトークン消費（推測・試行錯誤）を生む
- サイト運営者側には、エージェント経由の訪問を制御・可視化する手段がない
- エージェント開発者側には、サイトを操作するための正式なAPIが事実上存在しない


---

# WebMCPという新しいブラウザ標準


- Chrome 146で**実験的**に搭載される新しいブラウザ標準
- ページ上に `document.modelContext` として公開される
- サイトは「ツール」のセットをエージェントに公開できる
- エージェントはページのナビゲーションを推測する代わりに、公開されたツールを直接呼び出せる


<br>


トークンは「ページ構造の推測」ではなく「本来のタスク遂行」に使われるようになる


---

# Cloudflareの実装戦略: ツールパック


- 関連するツール群をまとめた「**ツールパック（tool pack）**」という単位で機能を提供
- サイト運営者はダッシュボードでパックを有効化するだけで機能拡張——**再デプロイ不要**
- 今回のプレビューでは2つのパックを提供。いずれも訪問者の**ブラウザ内**で完全に実行される


<div class="grid grid-cols-2 gap-4 pt-4">
<div>

### Content Credentials パック
C2PA画像の来歴情報を読み取る

</div>
<div>

### Site MCP Server パック
サイト自身のMCPサーバーをプロキシする

</div>
</div>

---

# 実装の2要素


1. **Edge injection**: HTMLRewriterで全HTMLレスポンスにブリッジスクリプトを1行注入
2. **The bridge**: ページ内で実行され、ツールを `document.modelContext` に登録


<br>


**"no code and nothing changed at your origin"**
——オリジン側のコードは一切変更しない


---

# コード例: エッジでの注入スクリプト

```html
<!-- Cloudflare injects this at the edge. Same origin, and your HTML is otherwise untouched. -->
<script type="module"
        src="/.webmcp/bridge.js"
        data-packs="c2pa,mcp-server-client"
        data-mcp-url="/mcp"></script>
```


- HTMLRewriterによって、すべてのHTMLレスポンスにこの1行が自動挿入される
- `data-packs`: 有効化するツールパック名をカンマ区切りで指定
- `data-mcp-url`: 既存のMCPサーバーがあればそのエンドポイントを指定（未指定時は `/mcp`）
- オリジンのHTMLはこの1行が足されるだけで、他は一切変更されない


---

# ブリッジの動作: 静的パック vs 動的パック


まずブラウザにWebMCPサーフェス（`document.modelContext`）があるか確認。
無ければ何もせず終了する（＝未対応ブラウザには無害）


<div class="grid grid-cols-2 gap-4 pt-4">
<div>

### 🗂 静的パック
例: Content Credentials

あらかじめ定義済みのツールを
そのまま宣言

</div>
<div>

### 🔄 動的パック
例: Site MCP Server

起動時にサイト自身のMCPサーバーへ
問い合わせ、ツールを発見してから登録

</div>
</div>


<br>登録後、すべてのツールは訪問者自身の**ブラウザ内**で実行される


---

# MCP標準との関係


- Site MCP Serverパックが登録するツールは、MCPの `Tool` / `CallToolResult` 型にそのまま準拠
- ブリッジは「サイト自身のMCPサーバーへのブラウザ内プロキシ」として機能
- 既存のMCPサーバーと通信できるエージェントは、**特別な追加対応なしに**ページ上のツールを呼び出せる


<br>


ブリッジ自体はエッジ上のWorkerが配信。将来的には「サイト単独ではできないタスク」（サイトマップ要約、AI Searchインデックス参照など）も担う方向性が示されている


---
layout: image-right
image: https://blog.cloudflare.com/_emdash/api/media/file/01KZ9RNNWJYGQX5J64W5GW04E3.png
backgroundSize: contain
---

# ダッシュボードでの設定

Cloudflare Dashboardの
「**Agent Readiness > WebMCP**」から
ドメインを選択し、パックを選ぶだけ


Content CredentialsとSite MCP Serverは
デフォルトで有効


<footer class="text-xs opacity-50 mt-4">
出典: Cloudflare Blog https://blog.cloudflare.com/webmcp/
</footer>

---

# Content Credentials パックの詳細

C2PA（Content Authenticity and Provenance Association）準拠の
画像来歴メタデータを扱う2つのツール


- **`scan_images_c2pa`**: ページ内の全画像をスキャンし、C2PAメタデータの有無・件数・要約を一括で返す
- **`inspect_image_c2pa`**: 単一画像の完全なマニフェスト（編集履歴・作者・署名証明書）をデコードして返す


<br>


現時点では認証情報の「報告」のみで、暗号学的な署名検証は行わない
（レスポンスには常に `signatureVerified: false`）


---

# コード例: MCP Tool Proxy の見どころ


- Site MCP Serverパックの中核実装。次のコードに注目
- サイト自身のMCPサーバーが `tools/list` で公開しているツールごとに、
  `document.modelContext.registerTool()`（4行目）でプロキシツールを登録
- `execute()`（8行目〜）は標準のMCP JSON-RPCリクエスト（`tools/call`）を、
  訪問者本人のブラウザから `credentials: "same-origin"` 付きで `/mcp` に送信
- つまりツール呼び出しは「訪問者本人のセッション・Cookieで
  サイト自身のMCPサーバーを叩く」形で実行される
- レスポンスの `result`（MCPの `CallToolResult`）はそのままエージェントに返される（20行目）

---

# コード例: MCP Tool Proxy

```javascript {1-3|5-10|11-19|20-21|all}
// For each tool the site's own MCP server advertises (via tools/list),
// registering a proxy whose execute() calls the site back on the
// visitor's origin, with their session.
document.modelContext.registerTool({
  name: tool.name,                 // e.g. "search_products"
  description: tool.description,
  inputSchema: tool.inputSchema,   // taken straight from tools/list
  execute: async (args) => {
    const res = await fetch(mcpUrl, {   // same-origin /mcp
      method: "POST",
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0", id: 1, method: "tools/call",
        params: { name: tool.name, arguments: args },
      }),
    });
    const { result } = await res.json();
    return result;   // an MCP CallToolResult, passed straight through
  },
});
```


---

# コード例: `scan_images_c2pa` の実行結果

```json {1-4|5-13|14|all}
{
  "imageCount": 12,
  "scanned": 12,
  "withC2pa": 8,
  "results": [
    {
      "src": "https://example.com/hero.jpg",
      "hasC2pa": true,
      "format": "image/jpeg",
      "manifestCount": 1,
      "claimGenerator": "Adobe Firefly",
      "title": "sunrise over the bay",
      "signedBy": "Adobe Inc."
    },
    { "src": "https://example.com/logo.png", "hasC2pa": false, "format": "image/png" }
  ]
}
```


12枚中8枚にC2PAメタデータあり。`claimGenerator` や `signedBy` から生成・編集ツールや署名者が分かる


---

# 有効化の確認

有効化後、注入されたスクリプトタグの存在をコマンドで確認できる

```bash
curl -s https://your-site.example | grep webmcp
```


- 動作確認には Cloudflare のリモートブラウザサービス **BrowserRun** を利用可能
- BrowserRunは既にWebMCPに対応済み
- ラップトップ上のブラウザ／クラウド上のヘッドレスブラウザのどちらでも同じ方法で検証できる
- 今後 **Cloudflare Radar** も自身のWebMCPツールを提供予定


---
class: text-center
---

# ユースケース

---

# ユースケース①: コンテンツの来歴（真正性）確認


- `scan_images_c2pa` / `inspect_image_c2pa` を使い、ページ内の画像がAI生成かどうか、誰がどのツールで作成・編集したかを機械的に確認できる
- ファクトチェック、ニュース記事の検証、画像の出所調査に直結する
- 署名の暗号学的検証は行われない点には留意が必要（`signatureVerified: false`）


---

# ユースケース②: 既存MCPサーバーの公開


- すでにMCPサーバーを持つサイト（例: `search_products` を公開するECサイト）は `data-mcp-url` を指定するだけ
- ツール群をブラウザ経由でそのままエージェントに公開できる
- エージェントはページ操作の代わりに、ツールを直接呼び出して検索・注文などのタスクを実行できる


---

# ユースケース③: 既存MCPクライアントとの相互運用


- 登録されるツールはMCP標準の `Tool` / `CallToolResult` 型に準拠
- 既にMCP対応済みのエージェントフレームワーク・クライアントは追加実装なしに利用可能
- BrowserRunがすでにこの仕組みに対応していることが記事内で紹介されている


---

# ユースケース④: 再デプロイ不要のツール拡張


- ツールパック単位で機能を有効化・無効化できる
- サイト運営者はコード変更や再デプロイを行うことなく、ダッシュボード操作だけでエージェント向け機能を追加・変更できる
- 新しいパックが追加されれば、有効化するだけで即座に機能拡張される想定


---

# まとめ


- WebMCPはChrome 146で実験的に搭載される新ブラウザ標準（`document.modelContext`）
- Cloudflareの実装は「エッジでの1行注入 + ブラウザ内ブリッジ」構成で、**オリジン側のコード変更ゼロ**を実現
- 静的パック（Content Credentials）と動的パック（Site MCP Server）の2種類でツールを提供
- ツールはMCP標準の型に準拠し、既存のMCPエコシステムとそのまま相互運用可能
- ツール実行は訪問者自身のブラウザ・セッション内で行われ、権限境界は人間の操作と変わらない


---

<div class="text-center">

# 参考リンク

</div>

- 原文: [Give any website a WebMCP interface](https://blog.cloudflare.com/webmcp/)
- [BrowserRun](https://developers.cloudflare.com/browser-run/)
- [BrowserRun WebMCP ドキュメント](https://developers.cloudflare.com/browser-run/features/webmcp/)
- [Cloudflare Radar](https://radar.cloudflare.com/)
- [Cloudflare Dashboard: Agent Readiness > WebMCP](https://dash.cloudflare.com/?to=/:account/:zone/agent-readiness/webmcp)
- [C2PA（Content Authenticity and Provenance Association）](https://c2pa.org/)
- Workers サンプル: [github.com/syumai/cloudflare-blog-summaries/tree/main/examples/webmcp](https://github.com/syumai/cloudflare-blog-summaries/tree/main/examples/webmcp)

<div class="pt-8 text-sm opacity-50">
Wiki: docs/articles/2026-08-06-webmcp.md
</div>
