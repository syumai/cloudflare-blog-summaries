# python-workers-rpc サンプル

記事「[Workers RPC が Python と JavaScript 間で利用可能に](https://blog.cloudflare.com/python-workers-rpc/)」（[Wiki](../../docs/articles/2026-08-03-python-workers-rpc.md)）に対応する、デプロイ可能な最小 Worker サンプルです。

## 記事との対応

記事のコード例1・2をそのまま再現した、2つの Worker から成るペアです。

- `ts/`: `WorkerEntrypoint` を継承した `RpcService` に `add(a, b)` メソッドを実装した TypeScript Worker（コード例1）。
- `py/`: サービスバインディング (`env.RPC`) 経由で `ts/` の `add` メソッドを、あたかもローカルの Python 関数のように呼び出す Python Worker（コード例2）。

## 体験できること

- Python Worker から `await self.env.RPC.add(42, 144)` という通常の関数呼び出しの構文で、TypeScript Worker のメソッドを直接呼び出せること
- 引数・戻り値の数値型が自動的に変換され、シリアライゼーションコードを書く必要がないこと

## セットアップ

`ts/` と `py/` はそれぞれ独立した Worker です。2つのターミナルで同時に起動します。

```bash
# ターミナル1（TypeScript Worker）
cd ts
npm install
npx wrangler dev

# ターミナル2（Python Worker）
cd py
npm install
npx wrangler dev
```

`py/wrangler.jsonc` の `services` バインディングは、`ts/wrangler.jsonc` の `name`（`python-workers-rpc-ts-example`）を参照しています。`wrangler dev` はデフォルトでローカルの他 Worker 名前解決に対応しているため、両方を起動していれば `py` 側から `ts` 側への RPC 呼び出しがそのまま動作します。

`py` 側の Worker にアクセスすると、`{"result": 186}`（42 + 144）が返ります。

## デプロイ

```bash
cd ts && npx wrangler deploy
cd ../py && npx wrangler deploy
```

先に `ts` をデプロイしてから `py` をデプロイしてください（サービスバインディングの参照先が存在している必要があります）。

## 必要な binding

- `py/wrangler.jsonc`: `RPC`（`ts` Worker の `RpcService` エントリポイントへのサービスバインディング）

## 前提条件

- Python Worker のローカル実行には Pyodide のダウンロードが必要なため、初回の `wrangler dev` 起動には数十秒〜数分かかる場合があります。

## 検証

```bash
cd ts && npm install && npx wrangler deploy --dry-run
cd ../py && npm install && npx wrangler deploy --dry-run
```

がいずれも成功することを確認済みです（実デプロイ・ログインは行っていません）。
