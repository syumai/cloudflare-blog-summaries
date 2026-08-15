# cloudflare-computer example

対応記事: [AIエージェントに必要なのはコンテナではなくコンピューター —「@cloudflare/computer」のご紹介](../../docs/articles/2026-08-05-cloudflare-computer.md)（[原文](https://blog.cloudflare.com/ja-jp/cloudflare-computer/)）

## 何を体験できるか

記事の中核である「SQLiteバックエンドの仮想ファイルシステム（Workspace）」を、**アイソレートバックエンドのみ**で最小構成として動かす。

記事のコード例はAIエージェントフレームワーク `@cloudflare/think` と組み合わせて `Workspace` を使っているが、`@cloudflare/computer` パッケージの型定義を確認したところ、`Workspace` は `useThink` を指定しなくても Durable Object の `storage` だけで単体で動作する（`useThink` はThink互換のヘルパーメソッド `readFile`/`writeFile` 等を追加で生やすオプション）。そのため本サンプルでは、AIモデル呼び出しやThinkを一切使わず、`workspace.fs`（ファイルシステムAPI）だけをHTTP経由で直接叩けるようにしている。

- Container バックエンドは使わない（記事でいう「アイソレート型（just-bash相当）」のみ）。
- Workspaceは Durable Object の SQLiteストレージ（`this.ctx.storage`）にバインドされ、書き込んだファイルはDurable Objectが生きている限り永続化される。

## エンドポイント

| メソッド | パス | 内容 |
|---|---|---|
| `POST` | `/write` | `{ "path": "/notes/hello.txt", "content": "..." }` をWorkspaceに書き込む |
| `GET` | `/read?path=/notes/hello.txt` | Workspace上のファイルを読み込む |
| `GET` | `/ls?path=/notes` | ディレクトリの一覧を取得する |

## セットアップ・実行

```bash
npm install
npx wrangler dev
```

別ターミナルで:

```bash
curl -X POST http://localhost:8787/write \
  -H 'content-type: application/json' \
  -d '{"path":"/notes/hello.txt","content":"hello workspace"}'

curl "http://localhost:8787/read?path=/notes/hello.txt"
curl "http://localhost:8787/ls?path=/notes"
```

## デプロイ

```bash
npx wrangler deploy
```

## 必要な binding・前提条件

- `WORKSPACE`: Durable Object binding（`WorkspaceDO` クラス）。`wrangler.jsonc` の `migrations` で `new_sqlite_classes` を指定しているため、SQLiteストレージ対応のDurable Objectとしてマイグレーションされる。
- 外部APIキーは不要（AIモデル呼び出しを行わないため）。
- Durable Objectsの利用にはCloudflareアカウントでのDurable Objects有効化が必要（プランによって課金体系が異なる。詳細は[Durable Objectsの価格ページ](https://developers.cloudflare.com/durable-objects/platform/pricing/)を参照）。
- `compatibility_flags: ["nodejs_compat"]` が必要（`@cloudflare/computer` が `node:crypto` / `node:events` を利用するため）。

## 記事との対応

- 記事のコード例1（`Think` を継承したバグトリアージエージェント）から、Thinkとエージェントループを取り除き、`Workspace` の初期化（`new Workspace({ storage: this.ctx.storage })`）とファイルシステムAPI（`workspace.fs`）の直接呼び出しだけを抜き出したもの。
- 記事のコード例4（`workspace.fs.mkdir` / `workspace.fs.writeFile` を使ったエントリーポイント実装）と同じAPIを、HTTPエンドポイント経由で体験できる。
- コンテナバックエンド（記事のコード例2・3、`CloudflareContainerBackend` や `createAITools`）は含まれていない。それらを体験するには、[本家リポジトリのチュートリアル](https://github.com/cloudflare/computer/tree/main/examples/tutorial)を参照。

## 検証結果

- `npx wrangler deploy --dry-run`: 成功
- `npx tsc --noEmit`: 成功
