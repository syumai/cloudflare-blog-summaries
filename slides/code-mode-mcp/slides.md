---
routerMode: hash
theme: default
title: "コードモード: エージェントに1,000トークンのAPI全体を提供"
info: |
  Cloudflare Blog記事「コードモード: エージェントに1,000トークンのAPI全体を提供」の解説スライド。
  原文: https://blog.cloudflare.com/ja-jp/code-mode-mcp/
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

# コードモード
# エージェントに1,000トークンの
# API全体を提供

<div class="pt-4 text-sm opacity-70">
原文: https://blog.cloudflare.com/ja-jp/code-mode-mcp/<br>
公開日: 2026-02-20
</div>

---

# TL;DR

- Cloudflare APIの2,500以上のエンドポイントを個別のMCPツールとして公開すると、ツール定義だけで約117万トークンを消費する
- 新しい統一MCPサーバー（`https://mcp.cloudflare.com/mcp`）は `search()` と `execute()` の**2つのツールのみ**を公開し、消費トークンは約1,000（<strong>99.9%削減</strong>）
- どちらのツールもJavaScriptコードを引数に取り、Workers の Dynamic Worker Loading が作るV8アイソレート内で実行される「サーバー側コードモード」
- ファイルシステムなし・env漏洩なし・外部通信デフォルト無効という安全なサンドボックスと、OAuth 2.1によるトークンのダウンスコープで安全性を確保

---

# アジェンダ

- 背景: MCPツールのコンテキスト消費問題
- コンテキスト削減の4つのアプローチ
- サーバー側コードモードの仕組み
- `search()` と `execute()`
- isolateサンドボックスと権限管理
- 統一MCPサーバーの登場
- コード例で見る: DDoS/WAF設定
- ユースケース
- 今後の計画

---

# 背景: MCPツールのコンテキスト消費問題

MCPサーバーは通常、APIエンドポイントを**1つずつ個別のツール**として公開する

- Cloudflare APIには**2,500以上**のエンドポイントが存在する
- すべてを個別ツール化すると、ツール定義だけで**約117万トークン**を消費する
- ツール定義はエージェントが動くたびに毎回コンテキストに載る「固定費」になる
- APIが大きくなるほど、この固定費はそのまま膨張していく

---

# コンテキスト削減の4つのアプローチ

Cloudflareは、この問題への対処法を4種類に整理している

<img src="https://blog.cloudflare.com/_emdash/api/media/file/01KW47A6RDKCN3G22F2NEMK5FT.png" class="mx-auto rounded mt-2" alt="4つのアプローチの比較図" style="max-height: 380px;" />

<footer class="text-xs opacity-50 mt-4">
出典: Cloudflare Blog https://blog.cloudflare.com/ja-jp/code-mode-mcp/
</footer>

---

# アプローチ①②

<div class="grid grid-cols-2 gap-4">
<div>

### ① クライアント側コードモード
- 実装例: Goose、Anthropic Claude SDK（Programmatic Tool Calling）
- 型付けSDKに対してTypeScriptを書き、<strong>クライアント側</strong>で実行
- エージェント環境に安全なサンドボックスを用意することが前提になる

</div>
<div>

### ② CLI型
- 実装例: OpenClaw、Moltworker、MCPorter
- CLIは自己文書化されており、段階的に情報を開示できる
- シェルが必要になり、攻撃対象領域が広がる。環境への依存も大きい

</div>
</div>

---

# アプローチ③④

<div class="grid grid-cols-2 gap-4">
<div>

### ③ 動的ツール検索
- 実装例: Anthropic Claude Code
- 現在のタスクに関連しそうなツールだけを表示する
- 検索機能自体の維持・評価コストがかかり、マッチしたツールもトークンを消費する

</div>
<div>

### ④ サーバー側コードモード
- APIの規模に関係なく**固定のトークンコスト**で済む
- エージェント側の変更が不要
- 段階的な情報開示とサンドボックス隔離が**サーバー側に組み込まれている**

</div>
</div>

<br>

Cloudflareが選んだのは④のサーバー側コードモード

---

# サーバー側コードモードの仕組み

エージェントは `search()` と `execute()` の2ツールだけを見る。
どちらも**JavaScriptコード**を引数に取り、サーバー側のアイソレートで実行される

<img src="https://blog.cloudflare.com/_emdash/api/media/file/01KW49GDDXDC3J77QYJRE40PVA.png" class="mx-auto rounded mt-4" alt="サーバー側コードモードの構成図" style="max-height: 320px;" />

<footer class="text-xs opacity-50 mt-4">
出典: Cloudflare Blog https://blog.cloudflare.com/ja-jp/code-mode-mcp/
</footer>

---

# `search()`: OpenAPI仕様を検索するツール

- Cloudflareの<strong>OpenAPI仕様</strong>（`$ref` はすべて事前解決済み）に対してJavaScriptを実行する
- エージェントは、必要なエンドポイントを絞り込むコードを書いて渡す
- サーバーはWorkersのアイソレート内でそのコードを実行し、絞り込んだ結果だけを返す
- 仕様全体をコンテキストに載せることなく、<strong>製品名・パス・タグ</strong>などで検索できる

<br>

コンテキストに載るのは検索結果だけ。段階的な情報開示（プログレッシブディスクロージャー）を実現している

---

# `execute()`: APIを呼び出すツール

- Cloudflare APIに対して**認証済みのコード実行**を行うツール
- コード内では `cloudflare.request({ method, path })` というクライアントが使える
- 1回の実行の中で**複数のAPI呼び出しを連鎖**させられる
- 取得したレスポンスを次の呼び出しの判断材料にする、といったロジックも書ける

---

# isolateサンドボックスの安全性

`search()` / `execute()` に渡されたコードは、Dynamic Worker Loadingが作る
軽量なV8アイソレート内で実行される

- **ファイルシステムを持たない** — ディスクへの直接アクセスができない
- **環境変数が漏れない** — プロンプトインジェクション経由の漏洩をデフォルトで防ぐ
- **外部への通信はデフォルトで無効** — 必要な場合のみ明示的なハンドラーで許可する
- V8アイソレートによる分離実行で、他のリクエストやワーカーの状態に影響しない

<div class="text-xs opacity-60 mt-4">
注: 基盤となる Dynamic Worker Loading（Worker Loader binding）は、本番環境での利用は現在クローズドベータ。ローカルの `wrangler dev` では利用できる
</div>

---

# OAuth 2.1によるトークンのダウンスコープ

- 統一MCPサーバーは**OAuth 2.1**に準拠し、Workers OAuth Providerを使って実装されている
- 接続時にユーザーが**許可した権限の範囲だけ**にトークンをダウンスコープする
- エージェントは、ユーザーが明示的に許可した機能にしかアクセスできない
- 最小権限の原則を保ちながら、ユーザー自身がアクセス範囲をコントロールできる

---

# 統一MCPサーバーの登場

製品ごとに分かれていた個別のMCPサーバーを、
`search()` と `execute()` の2ツールだけを持つ**1つの統一サーバー**にまとめた

<img src="https://blog.cloudflare.com/_emdash/api/media/file/01KW48S1W1QET0HW2VBF96B97E.png" class="mx-auto rounded mt-4" alt="ネイティブMCPとコードモードのトークン消費比較" style="max-height: 260px;" />

ネイティブMCP方式の**約117万トークン**に対し、コードモード方式は<strong>約1,000トークン</strong>（99.9%削減）

<footer class="text-xs opacity-50 mt-4">
出典: Cloudflare Blog https://blog.cloudflare.com/ja-jp/code-mode-mcp/
</footer>

---

# エージェントループへの組み込まれ方

エージェントから見ると、統一MCPサーバーはシンプルな2ツールのMCPサーバーとして振る舞う。
実際の検索・実行・段階的な情報開示はすべてサーバー側で完結する

<img src="https://blog.cloudflare.com/_emdash/api/media/file/01KW47VC53BWNJ923RVB2YGTHM.png" class="mx-auto rounded mt-4" alt="エージェントループの図" style="max-height: 340px;" />

<footer class="text-xs opacity-50 mt-4">
出典: Cloudflare Blog https://blog.cloudflare.com/ja-jp/code-mode-mcp/
</footer>

---
class: text-center
---

# コード例で見る:
# DDoS攻撃からオリジンを守る

「DDoS攻撃からオリジンを保護してください」という指示を、
`search()` → 仕様確認 → `execute()` の流れで実現する

---

# ツール定義: エージェントに見えるのは2つだけ

エージェントに公開されるツール定義自体がこの通り小さい。次の点に注目

- `search` — OpenAPI仕様を検索するJavaScriptコードを受け取る
- `execute` — Cloudflare APIを呼び出すJavaScriptコードを受け取る
- どちらの `inputSchema` も **`code: string` の1プロパティのみ**
- 2,500以上あるエンドポイントの情報は、この定義には一切含まれていない

---

# ツール定義①: search（コード全文）

```json
{
  "name": "search",
  "description": "Search the Cloudflare OpenAPI spec. All $refs are pre-resolved inline.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "code": {
        "type": "string",
        "description": "JavaScript async arrow function to search the OpenAPI spec"
      }
    },
    "required": ["code"]
  }
}
```

`code`（JavaScriptの非同期アロー関数）だけを受け取る、ごく小さな定義になっている

---

# ツール定義②: execute（コード全文）

```json
{
  "name": "execute",
  "description": "Execute JavaScript code against the Cloudflare API.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "code": {
        "type": "string",
        "description": "JavaScript async arrow function to execute"
      }
    },
    "required": ["code"]
  }
}
```

`search` と同じ形で、実行対象のJavaScriptコードだけを受け取る

---

# ステップ1: `search()` で関連エンドポイントを探す

WAFとルールセットに関連するエンドポイントをパス名で絞り込む。次の点に注目

- 3行目: `spec.paths` を総当たりし、パスに `/zones/` を含むものだけを対象にする
- 4〜5行目: さらにパスに `firewall/waf` または `rulesets` を含むものだけに絞り込む
- 8行目: メソッド・パス・概要（`summary`）だけを抽出して返す
- この検索で、WAF・DDoS関連の**10個のエンドポイント**が見つかる

```javascript
async () => {
  const results = [];
  for (const [path, methods] of Object.entries(spec.paths)) {
    if (path.includes('/zones/') &&
        (path.includes('firewall/waf') || path.includes('rulesets'))) {
      for (const [method, op] of Object.entries(methods)) {
        results.push({ method: method.toUpperCase(), path, summary: op.summary });
      }
    }
  }
  return results;
}
```

---

# ステップ2: `search()` でスキーマを検査する

ルールセットの `phase`（フェーズ）に何が指定できるかを、仕様のスキーマから調べる。次の点に注目

- 2行目: `GET /zones/{zone_id}/rulesets` のオペレーション定義を取得
- 3〜5行目: レスポンススキーマをたどり、`phase` の列挙値（enum）を取り出す
- この結果、`ddos_l7` や `http_request_firewall_managed` などのフェーズ名がわかる
- ドキュメントを読まなくても、仕様そのものから必要な値を発見できる

```javascript
async () => {
  const op = spec.paths['/zones/{zone_id}/rulesets']?.get;
  const items = op?.responses?.['200']?.content?.['application/json']?.schema;
  // Walk the schema to find the phase enum
  const props = items?.allOf?.[1]?.properties?.result?.items?.allOf?.[1]?.properties;
  return { phases: props?.phase?.enum };
}
```

---

# ステップ3・4: `execute()` で既存設定を確認する

対象フェーズがわかったところで、実際にAPIを呼び出して現状を確認する。次の点に注目

- 1枚目（3〜6行目）: 単体の `cloudflare.request()` で既存ルールセットの一覧を取得
- 2枚目（3〜7行目・9〜12行目）: `ddos_l7` と `http_request_firewall_managed` の
  エントリポイントを、<strong>1回の実行の中で連鎖して</strong>両方取得している
- 複数のAPI呼び出しをまとめられるので、往復のたびにツール呼び出しが発生しない

```javascript
async () => {
  const response = await cloudflare.request({
    method: "GET",
    path: `/zones/${zoneId}/rulesets`
  });
  return response.result.map(rs => ({
    name: rs.name, phase: rs.phase, kind: rs.kind
  }));
}
```

---

# ステップ3・4（続き: 複数呼び出しの連鎖）

```javascript {1-7|9-12|all}
async () => {
  // Get the current DDoS L7 entrypoint ruleset
  const ddos = await cloudflare.request({
    method: "GET",
    path: `/zones/${zoneId}/rulesets/phases/ddos_l7/entrypoint`
  });

  // Get the WAF managed ruleset
  const waf = await cloudflare.request({
    method: "GET",
    path: `/zones/${zoneId}/rulesets/phases/http_request_firewall_managed/entrypoint`
  });
}
```

この後、既存ルールセットが見つかった場合は設定を確認し、
見つからない場合は新規作成のリクエストを組み立てて `execute()` に渡す

---
class: text-center
---

# ユースケース

---

# ユースケース①: DDoS/WAF設定の自動化

- 「DDoS攻撃からオリジンを保護してください」という自然文の指示だけで作業が完結する
- `search()` → スキーマ確認 → `execute()`（既存確認）→ `execute()`（連鎖取得）の
  **わずか4回のツール呼び出し**で必要な情報が揃う
- ツール定義を個別に117万トークン分読み込む必要はない
- コード例①〜④で一貫して扱っているシナリオ

---

# ユースケース②: 統一MCPサーバーへの接続

MCPクライアントの設定ファイルに、統一MCPサーバーのURLを1つ書くだけで
Cloudflareの全API（2,500以上のエンドポイント）にアクセスできるようになる

```json
{
  "mcpServers": {
    "cloudflare-api": {
      "url": "https://mcp.cloudflare.com/mcp"
    }
  }
}
```

- ユーザートークン・アカウントトークンいずれも `Authorization` ヘッダーの
  Bearerトークンとして利用できる
- 製品ごとに個別のMCPサーバーを設定・管理する必要がなくなる

---

# 今後の計画: MCPサーバーポータル

エージェントがGitHub・データベース・社内ドキュメントなど**複数のサービス**と
通信する場合、MCPサーバーを追加するたびにコンテキスト圧力が増えていく

- Cloudflareは、複数のMCPサーバーを**1つのゲートウェイ**の背後にまとめる
  「MCPサーバーポータル」を計画している
- 統合された認証・アクセス制御を提供する
- ゲートウェイ配下のすべてのMCPサーバーに、コードモードの統合を**組み込み**で用意する

<br>

背後のサービス数に関係なく、固定のトークンフットプリントを目指す

---

# まとめ

- Cloudflare APIの2,500以上のエンドポイントを、`search()` と `execute()` の
  2ツール・約1,000トークンで扱えるようにした
- 個別ツール化（約117万トークン）に比べて**99.9%の削減**
- コードモードは4つのアプローチのうち「サーバー側」を選んだ実装であり、
  固定コスト・変更不要・組み込みのサンドボックス隔離という利点を兼ね備える
- V8アイソレートによる安全な実行環境と、OAuth 2.1によるダウンスコープで
  安全性を確保している
- 今後はMCPサーバーポータルで、複数サービスへの統合も見据えている

---

<div class="text-center">

# 参考リンク

</div>

- 原文: [コードモード: エージェントに1,000トークンのAPI全体を提供](https://blog.cloudflare.com/ja-jp/code-mode-mcp/)
- 英語版: [Code Mode: give agents an entire API in 1,000 tokens](https://blog.cloudflare.com/code-mode-mcp/)
- 統一MCPサーバー: https://mcp.cloudflare.com/mcp
- codemode SDK: [github.com/cloudflare/agents](https://github.com/cloudflare/agents/tree/main/packages/codemode)

<div class="pt-8 text-sm opacity-50">
Wiki: docs/articles/2026-02-20-code-mode-mcp.md
</div>
