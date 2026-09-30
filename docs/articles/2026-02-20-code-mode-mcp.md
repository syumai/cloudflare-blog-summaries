# コードモード: エージェントに1,000トークンのAPI全体を提供

- 原文: [https://blog.cloudflare.com/ja-jp/code-mode-mcp/](https://blog.cloudflare.com/ja-jp/code-mode-mcp/)（英語版: [https://blog.cloudflare.com/code-mode-mcp/](https://blog.cloudflare.com/code-mode-mcp/)）
- 公開日: 2026-02-20
- 関連: [Code Mode: MCPをもっとうまく使う方法](2025-09-26-code-mode.md)、[次世代のMCP — ステートレスなプロトコルへ生まれ変わったModel Context Protocol](2026-08-06-mcp-v2.md)、[あらゆるWebサイトにWebMCPインターフェースを付与する](2026-08-06-webmcp.md)、[WriteGuard: MCPサーバーのためのきめ細かな制御機能](2026-08-05-mcp-portal-writeguard-private-beta.md)、[Forge のご紹介](2026-09-28-forge-open-source-generation-pipeline.md)（OpenAPI から SDK・CLI・MCP サーバー等を生成）
- GitHub: [docs/articles/2026-02-20-code-mode-mcp.md](https://github.com/syumai/cloudflare-blog-summaries/blob/main/docs/articles/2026-02-20-code-mode-mcp.md)

![ヘッダー画像](https://blog.cloudflare.com/_emdash/api/media/file/01KW487D5XYR4AZJYHJN5AX56Q.png)
*図: 記事ヘッダー画像（出典: Cloudflare Blog https://blog.cloudflare.com/ja-jp/code-mode-mcp/）*

## TL;DR

- Cloudflare APIには2,500以上のエンドポイントがあり、それぞれを個別のMCPツールとして公開すると、モデルに渡すツール定義だけで約117万トークンを消費してしまう。
- Cloudflareが公開した統合MCPサーバー（`https://mcp.cloudflare.com/mcp`）は、ツールを `search()` と `execute()` の2つだけに絞り込み、必要なコンテキストを約1,000トークンまで削減した（99.9%の削減）。
- 削減の仕組みは「サーバー側コードモード」と呼ばれる方式で、`search()` も `execute()` も、引数として渡されたJavaScriptコードを、Dynamic Worker Loadingで作られたV8アイソレートのサンドボックス内でCloudflare自身が実行する。
- `search()` はあらかじめ `$refs` を解決済みのOpenAPI仕様オブジェクト `spec` に対してJavaScriptで検索し、`execute()` は `cloudflare.request({ method, path })` を使って実際に認証済みAPI呼び出しを行う。
- コンテキスト削減へのアプローチとして、クライアント側コードモード・CLI型・動的ツール検索・サーバー側コードモードの4つを比較し、サーバー側コードモードが最もバランスが良いという立場を取っている。

## 背景・課題

MCP（Model Context Protocol）でツールを増やすほど、モデルに渡す「このツールはこう使える」という説明文（ツール定義）が増え、それだけでコンテキストウィンドウを圧迫してしまう。この問題はCloudflareのように大きなAPI面を持つサービスほど深刻になる。

Cloudflareは以前、DNS管理やWorkers Observabilityなど製品ごとに個別のMCPサーバーを用意していた。しかしCloudflare APIには2,500を超えるエンドポイントがあり、それらすべてを個別のツールとしてMCP経由で公開すると、ツール定義だけでおよそ117万トークンが必要になる計算になる。これは1回のやり取りのたびにモデルへ流し込まれるコンテキストとしてはあまりに大きく、製品ごとに手作業でMCPサーバーを増やし続けるやり方では、Cloudflareの巨大なAPI面をスケールして扱えない。

この記事は、この「API全体をエージェントに使わせたいが、ツール定義のトークンコストが大きすぎる」という課題に対して、Cloudflareが実際にどう解決したかをまとめたものである。

## 発表内容 / アーキテクチャ

### サーバー側コードモードという発想

Cloudflareが選んだ答えは、個々のAPIエンドポイントをそれぞれ独立したツールとして公開するのをやめ、代わりに `search()` と `execute()` という2つの汎用ツールだけを公開することだった。どちらのツールも、引数として渡されるのは「JavaScriptコード」1つだけである。

```json
[
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
  },
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
]
```

エージェント（モデル）は、個々のAPIエンドポイントの存在をあらかじめ知っている必要がない。「どんなAPIがあるか調べたければ `search()` にJavaScriptコードを渡し、実際に呼び出したければ `execute()` にJavaScriptコードを渡す」という2種類の操作だけを覚えておけばよい。この構成により、ツール定義そのものが小さく保たれ、扱えるAPIエンドポイントの数がいくら増えても、モデルに渡す最初のコンテキストコストは一定のまま（約1,000トークン）に保たれる。

![ネイティブMCPとコードモードのトークン削減を示すグラフ](https://blog.cloudflare.com/_emdash/api/media/file/01KW48S1W1QET0HW2VBF96B97E.png)
*図: 個別ツールを並べる従来型MCPと、コードモードとのトークン消費量比較（出典: Cloudflare Blog https://blog.cloudflare.com/ja-jp/code-mode-mcp/）*

### 実行環境: サンドボックス化されたV8アイソレート

`search()` や `execute()` に渡されたJavaScriptコードは、そのままサーバー上で実行されるわけではなく、Dynamic Worker Loadingによって生成された軽量なV8アイソレートのサンドボックス内で動く。このサンドボックスにはファイルシステムがなく、プロンプトインジェクションによって漏えいしうる環境変数もデフォルトで無効化されている。アウトバウンドの外部fetchもデフォルトでは無効で、必要な場合のみ明示的にハンドラーで制御できる。

サンドボックス内で実行されるコードからは、`cloudflare.request({ method, path })` という関数を使って、認証済みのCloudflare API呼び出しを行える。つまりモデルが書くコードは「Cloudflare APIのクライアントライブラリを、その場でJavaScriptとして書いて実行している」のに近い形になる。

![サーバー側コードモードの仕組みを示す図](https://blog.cloudflare.com/_emdash/api/media/file/01KW49GDDXDC3J77QYJRE40PVA.png)
*図: サーバー側コードモードのアーキテクチャ（search/execute とサンドボックスの関係）（出典: Cloudflare Blog https://blog.cloudflare.com/ja-jp/code-mode-mcp/）*

### エージェントのループ

エージェントは、まず `search()` でAPI仕様の中から目的のエンドポイントを見つけ、必要であればさらにレスポンススキーマの詳細を調べ、最後に `execute()` で実際のAPI呼び出しを行う、という流れを繰り返す。ツール呼び出し1回ごとに小さなJavaScriptコード片をやり取りするだけで済むため、モデルが最初からすべてのエンドポイント定義を把握している必要がなく、段階的に必要な情報だけを取得していける（プログレッシブディスカバリー）。

![エージェントループの図](https://blog.cloudflare.com/_emdash/api/media/file/01KW47VC53BWNJ923RVB2YGTHM.png)
*図: search/execute を繰り返しながらタスクを進めるエージェントループ（出典: Cloudflare Blog https://blog.cloudflare.com/ja-jp/code-mode-mcp/）*

### Cloudflare MCPサーバー: 個別サーバーから統合サーバーへ

以前のCloudflareは、DNS管理やWorkers Observabilityなど製品ごとに個別のMCPサーバーを提供していた。しかしCloudflare APIのエンドポイント数（2,500以上）を考えると、製品ごとに手作業でMCPサーバーを増やし続けるアプローチには限界がある。

統合されたMCPサーバーでは、2つのツール・約1,000トークンでAPI全体をカバーできる。ここで重要なのは、新しい製品がCloudflareに追加されたときの扱いである。個別ツール方式であれば、新しい製品のためにツール定義を新しく書き、MCPサーバーにデプロイし直す必要がある。しかしサーバー側コードモードでは、新しい製品のAPIエンドポイントも既存のOpenAPI仕様に載ってさえいれば、同じ `search()` / `execute()` のコードパスがそのまま発見・呼び出しに使える。新しいツール定義も新しいMCPサーバーも不要という点が、このアーキテクチャのスケーラビリティの核心である。

なお、統合MCPサーバーは [GraphQL Analytics API](https://developers.cloudflare.com/analytics/graphql-api/) もサポートしている。

### 認証とセキュリティ

Cloudflareの統合MCPサーバーは、最新のMCP仕様に基づいて構築され、OAuth 2.1に準拠している。Workers OAuth Providerを使い、発行されるトークンは接続時にユーザーが許可した権限の範囲までダウンスコープされる。つまりエージェントは、ユーザーが明示的に許可した範囲の操作しか行えない。

認証方式としてはユーザートークンとアカウントトークンの両方をサポートしており、いずれも `Authorization` ヘッダーのベアラートークンとして渡せる。

### codemode SDKのオープンソース公開

この記事で使われているサーバー側コードモードの実装は、Cloudflare Agents SDKの一部として [codemode SDK](https://github.com/cloudflare/agents/tree/main/packages/codemode)（npm: `@cloudflare/codemode`）としてオープンソース公開されている。自分たちのMCPサーバーやAIエージェントを作る開発者も、同じアプローチをそのまま採用できる。

## コンテキスト削減へのアプローチ比較

記事では、MCPのコンテキスト肥大化に対する4つのアプローチを比較している。

![4つのコンテキスト削減アプローチを比較した図](https://blog.cloudflare.com/_emdash/api/media/file/01KW47A6RDKCN3G22F2NEMK5FT.png)
*図: クライアント側コードモード・CLI・動的ツール検索・サーバー側コードモードの比較（出典: Cloudflare Blog https://blog.cloudflare.com/ja-jp/code-mode-mcp/）*

- **クライアント側コードモード**: モデルが型付きSDKに対してTypeScriptコードを書き、それをクライアント側のDynamic Worker Loaderで実行する方式。GooseやAnthropicのClaude SDKでは「Programmatic Tool Calling」として実装されている。ツール群を統一的なコードとして扱える利点はあるが、エージェント実行環境そのものに安全なサンドボックスを用意する責任がクライアント側に生じる。
- **CLI型**: MCPサーバーをCLIツールに変換し、コマンドのヘルプ表示などを通じてエージェントに段階的に情報を開示する方式。OpenClawやMoltworkerのような実装は、MCPorterを使ってMCPサーバーをCLIに変換している。CLIは自己文書化されているという利点がある一方、シェルの実行が前提になるため、サンドボックス化されたアイソレートに比べて攻撃対象領域がはるかに広くなる。
- **動的ツール検索**: 全ツールを常に見せるのではなく、現在のタスクに関連しそうなツールだけを絞り込んで提示する方式。Anthropicが Claude Code で採用している。コンテキストの使用量は縮小できるが、検索の仕組み自体が必要になり、ヒットした各ツールの定義は依然としてトークンを消費する。
- **サーバー側コードモード**: この記事が採用した方式。APIの規模に関係なくトークンコストが一定で、エージェント側に変更を加える必要がなく、プログレッシブディスカバリーが最初から組み込まれており、サンドボックス化された隔離環境内で安全にコードを実行できる。エージェントは `search()` と `execute()` の2つのツールをコードで呼び出すだけでよく、それ以外はすべてサーバー側で処理される。

## コード例

記事では、DDoS対策とWAF（Webアプリケーションファイアウォール）の設定を確認・調査する一連の流れを通じて、`search()` と `execute()` の実際の使い方を段階的に示している。

### 1. WAF・ルールセット関連エンドポイントの検索

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

**解説**: `search()` に渡すコードの例。`spec.paths` はあらかじめ `$refs` が解決済みのOpenAPI仕様オブジェクトで、これをJavaScriptの `for...of` で普通にループしながら、パスに `firewall/waf` または `rulesets` が含まれるエンドポイントだけを抽出している。結果は `GET /zones/{zone_id}/firewall/waf/packages` のような、メソッド・パス・概要（summary）の一覧として返る。ツール定義を1件ずつ読ませるのではなく、モデル自身が「検索条件を書いたコード」を実行させて絞り込む、という発想がよく分かる例である。

### 2. スキーマを調べてフェーズ（phase）の一覧を取得

```javascript
async () => {
  const op = spec.paths['/zones/{zone_id}/rulesets']?.get;
  const items = op?.responses?.['200']?.content?.['application/json']?.schema;
  // Walk the schema to find the phase enum
  const props = items?.allOf?.[1]?.properties?.result?.items?.allOf?.[1]?.properties;
  return { phases: props?.phase?.enum };
}
```

**解説**: 1回目の検索で見つけた `GET /zones/{zone_id}/rulesets` のレスポンススキーマを、`spec` オブジェクトの中でさらにたどり（オプショナルチェイニング `?.` を多用している点に注目）、`phase` フィールドが取りうる列挙値（enum）を取得している。結果は `ddos_l4`・`ddos_l7`・`http_request_firewall_managed` などのフェーズ名の配列になる。エンドポイントを見つけるだけでなく、その入出力スキーマの詳細もコードとして自由に掘り下げられることを示す例である。

### 3. 既存ルールセットの確認（execute の利用）

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

**解説**: ここからは `execute()` に渡すコードになる。`cloudflare.request({ method, path })` が、認証済みでCloudflare APIを実際に呼び出す関数である。取得した `response.result` を `map()` でルールセットの名前・フェーズ・種類だけに整形して返している。`search()` はAPI仕様というデータに対する検索だったのに対し、`execute()` は実際にネットワーク越しにAPIを呼び出す点が異なる。

### 4. DDoS L7とWAFの管理ルールセットを取得

```javascript
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

**解説**: 1つの `execute()` 呼び出しの中で、DDoS L7フェーズとWAFマネージドルールフェーズという2つの異なるエンドポイントを続けて呼び出している。これも `execute()` の特徴で、複数のAPI呼び出しを1回のツール呼び出し（1つのコード片）にまとめられるため、「1ツール呼び出し=1 APIコール」という制約を持つ従来型のMCPツールに比べてラウンドトリップの回数を減らせる。

以上の4回のツール呼び出し（検索2回・実行2回）だけで、「DDoS対策とWAFの設定がどうなっているかを調べる」という一連のタスクを完了できている点が、コードモードのコンテキスト効率の良さを具体的に示している。

### 利用開始時のMCPクライアント設定

```json
{
  "mcpServers": {
    "cloudflare-api": {
      "url": "https://mcp.cloudflare.com/mcp"
    }
  }
}
```

**解説**: MCPクライアント側の設定ファイルに、Cloudflareの統合MCPサーバーのURLを1つ登録するだけで、`search()` と `execute()` の2ツールが使えるようになる。認証はOAuth 2.1のフローに従って接続時に行われる。

## ユースケース

### インフラの調査・診断

コード例で示されているように、DDoS対策やWAFの設定状況を調べる、といった調査系のタスクに向いている。関連するエンドポイントを検索し、スキーマを確認し、実際の設定値を取得するまでを、少ないツール呼び出し回数でこなせる。

### 新しいCloudflare製品への追従

Cloudflareに新しい製品・APIエンドポイントが追加されても、MCPサーバー側でツール定義を作り直す必要がない。エージェントは常に同じ `search()` / `execute()` を使い、OpenAPI仕様が更新されればそのまま新しい機能を発見・利用できる。

### 独自のMCPサーバー・AIエージェントへの応用

オープンソース公開されたcodemode SDKを使えば、Cloudflare以外の大規模なAPI面を持つサービスでも、同じ「search + execute」の設計をそのまま採用できる。個々のAPIエンドポイントの数だけツールを増やすのではなく、コードを実行させる2つの汎用ツールに集約するという設計パターンとして再利用しやすい。

## 所感・ポイント

- この記事の核心は「ツールの数を増やすのではなく、コードを実行する場を用意する」という発想の転換にある。MCPのツール定義をどれだけ工夫しても、エンドポイント数に比例してコンテキストが膨らむ構造そのものは変わらない。search/executeという2つの入り口に絞り込むことで、この比例関係を断ち切っている点が本質的だと感じる。
- サンドボックスの設計（ファイルシステムなし・環境変数の既定無効化・外部fetchの既定無効化）は、「モデルが書いたコードをそのまま実行する」という一見リスクの大きい仕組みを、実運用に耐える形に落とし込むための現実的な安全策になっている。
- 4つのアプローチ比較は、単に「うちのやり方が一番良い」と主張するだけでなく、それぞれの方式が抱えるトレードオフ（攻撃対象領域・検索コスト・クライアント側の実装負担など）を整理している点が参考になる。どの方式を選ぶかはAPIの規模やセキュリティ要件次第で変わりうる。
- 記事末尾で触れられている「MCPサーバーポータル」の構想は、[WriteGuard](2026-08-05-mcp-portal-writeguard-private-beta.md)が実現しているような複数MCPサーバーの一元的なガバナンスと方向性が近い。Cloudflareが社内外の両方で、MCPサーバーを1つずつ増やすのではなく、まとめて管理・スケールさせる方向に舵を切っていることがうかがえる。
- 本記事の中心機能である統合MCPサーバーはCloudflareがホストするマネージドサービス（`https://mcp.cloudflare.com/mcp`）であり、記事内のコード例もそのサーバー内部のサンドボックスで実行されることが前提になっている。

> **Workers サンプル**: 対象外。サーバー側コードモードの基盤である Dynamic Worker Loading（Worker Loader binding）は、本番環境ではクローズドベータ（サインアップ制）のため、デプロイ可能なサンプルは作成していません（ローカルの `wrangler dev` では試せます）。

## 関連リンク

- [Code Mode: MCPをもっとうまく使う方法（クライアント側コードモードの元記事）](2025-09-26-code-mode.md)
- [Cloudflare MCPサーバー統合設定用URL（https://mcp.cloudflare.com/mcp）](https://mcp.cloudflare.com/mcp)
- [Cloudflare MCPリポジトリ（GitHub）](https://github.com/cloudflare/mcp)
- [codemode SDK（Cloudflare Agents SDK）](https://github.com/cloudflare/agents/tree/main/packages/codemode)
- [GraphQL Analytics API ドキュメント](https://developers.cloudflare.com/analytics/graphql-api/)
- [Workers OAuth Provider（GitHub）](https://github.com/cloudflare/workers-oauth-provider)
