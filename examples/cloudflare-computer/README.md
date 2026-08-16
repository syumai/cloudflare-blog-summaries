# cloudflare-computer example

対応記事: [AIエージェントに必要なのはコンテナではなくコンピューター —「@cloudflare/computer」のご紹介](../../docs/articles/2026-08-03-cloudflare-computer.md)（[原文](https://blog.cloudflare.com/ja-jp/cloudflare-computer/)）

## Demo

https://cloudflare-computer-example.syumai.workers.dev

Cloudflare Access により syumai@gmail.com のみ許可。未認証アクセスは 403。

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

## Cloudflare Access 設定

このサンプルは [Cloudflare Access](https://developers.cloudflare.com/workers/configuration/cloudflare-access/)（参考: [Workers protected by Access](https://blog.cloudflare.com/workers-protected-by-access/)）で保護されており、`syumai@gmail.com` 以外はすべてのエンドポイントで 403 になります。

### 実装

- 許可メールアドレスの単一ソースは [`examples/shared/allowed-emails.json`](../shared/allowed-emails.json)。
- ガード関数 [`examples/shared/access.ts`](../shared/access.ts) の `requireAllowedAccess(ctx)` を `src/index.ts` の `fetch` ハンドラー冒頭（Durable Object へのプロキシより前）で呼び出しています。
  - `ctx.access` が `undefined`（= この Worker に Cloudflare Access アプリケーションが設定されていない）場合は 403。
  - Access 経由でも `ctx.access.getIdentity()` の `email` が allowedEmails に含まれなければ 403。
  - これにより、**Access のダッシュボード設定を忘れていても Worker 自体が fail closed で保護され**、未認証アクセスによる課金悪用が構造的に発生しません。

### 本番の Access アプリケーションを有効化する（手動・ダッシュボード）

`wrangler.jsonc` の `access.dev` は `wrangler dev` 用のローカルシミュレーションのみです。本番の Access ポリシー（どのメールアドレスを許可するか）は wrangler では設定できません（`node_modules/wrangler/config-schema.json` の `Access` 定義には `dev` 以外のフィールドがなく、`wrangler` CLI にも Access/Zero Trust を管理するサブコマンドはありません）。本番で `syumai@gmail.com` のみアクセスできるようにするには、以下を手動で行ってください。

1. [Zero Trust ダッシュボード](https://one.dash.cloudflare.com/) → **Access** → **Applications** → **Add an application** → **Self-hosted**
2. Application domain に `cloudflare-computer-example.syumai.workers.dev` を設定
3. Policy を追加: Action = **Allow**、Include = **Emails** = `syumai@gmail.com`
4. 保存後、Application の Overview で **Application Audience (AUD) Tag** を確認し、`wrangler.jsonc` の `access.dev.aud` を実際の値に置き換える（ローカル `wrangler dev` のシミュレーションを本番と一致させるためで、ランタイムガード自体の安全性には影響しません）

上記の Access アプリケーションが未設定の間も、ランタイムガードにより全エンドポイントは 403 を返します。

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
