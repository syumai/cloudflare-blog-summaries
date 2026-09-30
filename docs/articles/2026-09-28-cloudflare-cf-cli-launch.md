# cf のご紹介: Cloudflare API 全体を扱えるエージェント向け CLI

- 原文: [https://blog.cloudflare.com/cloudflare-cf-cli-launch/](https://blog.cloudflare.com/cloudflare-cf-cli-launch/)
- 日本語版の出どころ: Cloudflare公式の日本語版（`https://blog.cloudflare.com/ja-jp/cloudflare-cf-cli-launch/`）は確認時点で存在しなかった（404）ため、英語版（en-us）から日本語化して要約している。公開日は英語原文の datePublished に従う。
- 公開日: 2026-09-28
- 位置づけ: Birthday Week 2026 の記事
- 著者: Matt "TK" Taylor、Samuel Macleod
- 関連: [人とエージェントのためにドメイン購入をシンプルに](./2026-09-30-simplifying-domains.md)（`cf registrar` でドメインの検索・購入・移管を行う例）、[Forge のご紹介: SDK・CLI・ドキュメントなどを生成するオープンソースのパイプライン](./2026-09-28-forge-open-source-generation-pipeline.md)（cf のコマンドを OpenAPI スキーマから生成する基盤）、[VoidZero が Cloudflare に加わって4か月](./2026-09-28-voidzero-update.md)（Vite / Rolldown）、[Vite で動く Next.js アプリケーション: Vinext 1.0](./2026-09-28-vinext-nextjs-on-vite.md)（Vite 上の Workers 開発）
- GitHub: [docs/articles/2026-09-28-cloudflare-cf-cli-launch.md](https://github.com/syumai/cloudflare-blog-summaries/blob/main/docs/articles/2026-09-28-cloudflare-cf-cli-launch.md)

![ヘッダー画像](https://blog.cloudflare.com/_emdash/api/media/file/01M3KR63G9MAXHAG81FC5HKYRY.01M3KR64BVBYV5MM3YBHRRRWGF.png)
*図: 記事ヘッダー画像（出典: Cloudflare Blog https://blog.cloudflare.com/cloudflare-cf-cli-launch/。原文に alt テキストやキャプションがないため、掲載位置から「ヘッダー画像」と筆者が補った）*

## TL;DR

- Cloudflare が、エージェントの利用を前提にした新 CLI **cf** をオープンベータで公開した（`npm i -g cf`）。
- Wrangler の約 280 コマンドに対し、cf は Cloudflare API の **3,000 超のオペレーション**をカバーする。コマンドは [Forge](./2026-09-28-forge-open-source-generation-pipeline.md) が OpenAPI スキーマから生成する。
- エージェント向けの設計: **JSON が既定の出力**、自然言語で探せる `cf cli search`、複雑な入力はフォーム形式。
- 設定は TypeScript の **`cloudflare.config.ts`**（`defineConfig` / `bindings` / `triggers`）。開発環境は **Vite が既定**になる。
- 既存 Worker は `cf migrate` で移行できる。ベータ終了後に Wrangler の最終メジャーが出て、その後 **18 か月**は保守される。

## 背景・課題

記事は、Wrangler へのエージェントの利用が急増しているという数字から始まる。2026年3月には Wrangler 利用の4分の1がエージェントで（前年は1桁%）、先週には **48%** に達した。エージェントは1日あたり約2倍の種類のコマンドを使い、6種類以上のコマンドを使う確率は約4倍だという。

しかし Wrangler が提供するのは約 280 のコマンド経路で、Cloudflare の提供機能はそれより遥かに多い。Wrangler は各プロダクトチームが個別に作り込んだため、`d1 info`、`hyperdrive get`、`workflows describe` のように用語が揃わず、ほとんど使われないまま数千行に膨らんだ独自実装もあった。チーム間でパターンを強制するのは事実上不可能だった。

そこで「既存を標準化しつつ、一気に大きく拡張する」ために、コマンドを API スキーマから生成する方針を採った。これを可能にしたのが Forge である。

## 発表内容 / アーキテクチャ

### Forge で API 全体を CLI にする

Cloudflare のあらゆる機能には OpenAPI スキーマがある。そこに少しだけ注釈を足せば、Forge が CLI の元データとして使える。これで cf は Wrangler の約 280 機能から、API 全体の **3,000 超のオペレーション**へ広がる。Worker のセットアップ、デプロイ、監視、Access による保護、ドメイン購入、WAF の前段配置までを1つのツールで任せられる、というのが記事の描く姿である。

### 「cf を見たことがないエージェント」のための設計

Wrangler は長年の文書や記事が LLM の学習に含まれている利点がある一方、仕様を大きく変えると学習済みの挙動と衝突する。記事は、まったく新しい CLI を出すほうが、似たツールの新旧の差異を文脈で説明するよりも混乱が少なく、コンテキスト注入や `AGENTS.md` への追記で支えられる、と説明している。

- **JSON が既定**: Wrangler ではエージェントが毎回 `--json` を付けて `jq` で絞っていた。`--json` 非対応のコマンドは Unicode の表を返し、時間とトークンを余計に消費した。cf は「エージェントには JSON で十分」として JSON を既定にした。人間向けには整形表示、エージェント向けには文脈を節約する圧縮表示になる。
- **フォーム入力**: ドメイン購入のように人間の入力が要る操作は、API の要件を検証付きの入力項目に分解したフォームで進められる。もちろんエージェントに頼んでもよい。
- **`cf cli search`**: 3,000 の経路から必要な操作を探すため、自然言語で質問すると、API の説明とパラメータに基づく小さな検索インデックスがコマンド候補を返す。初めて `--help` を実行したエージェントに自動で案内される。

### 型で守られる設定: `cloudflare.config.ts`

設定形式は TypeScript。人間にもエージェントにも読みやすく、プログラムで組み立てられる。記事は、事前知識がなくてもエージェントが設定を見つけて編集でき、Claude Code や Codex のように LSP プラグインを使うエージェントは型情報から精度の高い提案ができる、と述べる。TOML にはアクセスしやすいスキーマがなく、JSONC はスキーマがリンクされていてもエージェントがほとんど使わなかった、という対比である。

Cloudflare 社内の Wrangler 設定には、5,000 行超から約 40% 削減できたものもある。開発者ごとの多数のカスタム環境を、共通の土台からファクトリで生成するようにし、Wrangler のように `env` ブロックをコピーしなくて済むためだ。Vite 標準の `mode` 引数で環境を切り替える。

設定は最初は Worker（`defineConfig.worker`）からで、将来はポリシー、ゾーン、DNS なども同じファイルで型付きに管理できるようにする意向が示されている。

### 開発体験: Vite が既定

Wrangler が JavaScript Worker の対応を始めた頃は Vite がなく、esbuild でバンドルし、`:8787` の開発サーバーは自前実装で、変更には Miniflare のような内部に手を入れる必要があった。Vite なら、豊富なプラグイン、HMR 付きの開発サーバー、Rust 製 Rolldown によるツリーシェイキングが使え、Cloudflare Vite Plugin は Workers のビルドの推奨手段となっている。Vitest プラグインと合わせて、Workers ランタイムに合致した開発・テスト環境になる。

esbuild が必要な JavaScript Worker、Rust Worker、Python Worker は、dev とデプロイを Wrangler に委譲し続ける。

### Wrangler からの移行

- `cf migrate`: すでに Vite でビルドしている Worker は `cloudflare.config.ts` に変換される。esbuild を Wrangler に頼る Worker はビルドを Wrangler に委譲する。
- `cf init` / `cf deploy`: 新規プロジェクトを Cloudflare 向けに自動構成（Cloudflare Vite Plugin の導入と設定ファイルの作成）。静的サイトは設定ファイル不要で `cf deploy` できる。
- ベータ終了時に Wrangler の最終メジャーを公開し、利用者とエージェントを cf へ誘導する。その後 18 か月は保守される。
- cf はオープンソースで、[GitHub リポジトリ](https://github.com/cloudflare/cf)で issue を報告できる。

## コード例

以下は記事のコードを引用したもの。

### 最小の `cloudflare.config.ts`

```typescript
import { bindings, defineConfig } from "cf/config";
import * as entrypoint from "./index.js" with { type: "cf-worker" };

export default defineConfig(({ mode }) => ({
  worker: {
    name: "example-worker", 
      entrypoint,
      compatibilityDate: "2026-09-27",
      env: {
        Environment: bindings.text(`This is ${mode} environment`),
      },
    },
}));
```

`defineConfig` にコールバックを渡し、Vite の `mode` で設定を切り替えられる。`entrypoint` は `with { type: "cf-worker" }` の import 属性で Worker のエントリを取り込む。`env` には `bindings.text()` のようなヘルパーで環境変数やバインディングを定義する。

### `bindings` ヘルパー

```typescript
import { bindings, defineConfig } from "cf/config";

export default defineConfig(({ mode }) => ({
  worker: {
    // ...
    env: {
      API_URL: bindings.text(
        mode === "production"
          ? "https://example.com"
          : "https://staging.example.com",
      ),
      API_TOKEN: bindings.secret(),
      CACHE: bindings.kv({
        id: mode === "production"
          ? "production-namespace-id"
          : "staging-namespace-id",
      }),
      DATABASE: bindings.d1({ name: `example-${mode}-database` }),
      UPLOADS: bindings.r2({ name: `example-${mode}-uploads` }),
      JOBS: bindings.queue < { userId: string } > ({
        name: `example-${mode}-jobs`,
      }),
      AI: bindings.ai(),
      SEARCH_INDEX: bindings.vectorize({
        name: `example-${mode}-search`,
      }),
      API: bindings.worker({ worker: `example-${mode}-api` }),
    },
  },
}));
```

環境変数、シークレット、KV、D1、R2、Queue、AI、Vectorize、他の Worker へのバインディングを `bindings.*` で並べられ、エディタが補完と説明を出す。`mode` による三項演算子で本番とステージングを切り替えている。なお `bindings.queue < { userId: string } > ({...})` という表記は原文のまま（型引数 `<{ userId: string }>` の書式が整形で崩れたものと思われる）。

### `triggers` ヘルパー

```typescript
import { defineConfig, triggers } from "cf/config";

export default defineConfig({
  worker: {
    // ...
    triggers: [
      triggers.fetch({ pattern: "example.com/*" }),
      triggers.scheduled({ schedule: "0 * * * *" }),
      triggers.queue({ name: "jobs", maxBatchSize: 10 }),
      triggers.email({ addresses: ["support@example.com"] }),
    ],
  },
});
```

ルート、スケジュール、Queue、メールといった「Worker を起動するきっかけ」を1つのブロックにまとめる。Wrangler では設定ファイル内に散らばっていた。

### コマンド

```sh
npm i -g cf     # オープンベータをグローバルにインストール
cf init         # 新規の Hello World プロジェクト
cf deploy       # デプロイ（静的サイトは設定ファイル不要）
cf migrate      # Wrangler 設定から cloudflare.config.ts へ移行
cf cli search   # 自然言語でコマンドを検索
```

記事には、エージェント向けの指示文（「Copy prompt」ボタンのテキスト）も掲載されている。内容は、`cf <product> <action>` 形式（例: `cf d1 list`）で使うこと、Wrangler は `wrangler.jsonc` / `wrangler.json` / `wrangler.toml` を使う既存プロジェクトかユーザーが求めた場合のみ使い、その場合は `cf migrate` を使うこと、`cf` のコマンドは Wrangler と異なるので推測せず `cf --help` か `cf cli search` で確認すること、などである（文章は一部のみ確認できたため要約）。

## ユースケース

- **エージェントへの Cloudflare 運用の一括委任**: Worker の作成・デプロイ・監視、Access での保護、ドメイン購入、WAF の設定までを1つの CLI でエージェントが実行する（ドメインは `cf registrar registrations check / create / transfer-in`。詳細は [人とエージェントのためにドメイン購入をシンプルに](./2026-09-30-simplifying-domains.md)）。
- **既存 Worker の型付き設定への移行**: Vite でビルドしている Worker を `cf migrate` で `cloudflare.config.ts` へ変換する。
- **多環境の設定を一箇所で生成**: `mode` に応じて本番・ステージングのバインディングを切り替え、Wrangler のような `env` ブロックの重複をなくす。
- **コマンド探索**: 3,000 の操作からエージェントが `cf cli search` で目的のコマンドを自然言語で見つける。
- **新規プロジェクトの立ち上げ**: `cf init` / `cf deploy` で Cloudflare Vite Plugin の導入から設定ファイル作成、デプロイまでを行う。

## 所感・ポイント

- 要点は「エージェントが主な利用者」という前提で CLI の既定値を決め直したこと。JSON 既定、コマンド検索、型付き設定は、いずれもトークンと試行錯誤を減らす方向の設計である。
- cf の対象範囲の広さは [Forge](./2026-09-28-forge-open-source-generation-pipeline.md) の生成パイプラインによるもの。OpenAPI に注釈を足してコマンドを作る仕組みなので、API が増えれば CLI も追随する。Forge 側の記事では、`cf dev` / `cf build` のような API に対応しない手書きコマンドと生成コードを組み合わせる点が論じられており、本記事の cf はその実例にあたる。
- Vite が既定になる点は、[VoidZero の記事](./2026-09-28-voidzero-update.md)（Vite / Rolldown）や [Vinext](./2026-09-28-vinext-nextjs-on-vite.md) の流れと合わせて読むと位置づけが分かりやすい。
- 記事は open beta の段階で、esbuild / Rust / Python の Worker は Wrangler に委譲されるなど、Wrangler 完全置き換えまでには移行期間がある。
- 確認できていない点（人手確認点）: 記事のコードのうち `name: "example-worker", ` の行は原文の字下げ・末尾スペースのまま引用しており、`bindings.queue < ... > (...)` も整形で崩れた表記と思われる。エージェント向け指示文は一部しか確認できていない。
- **サンプル対象外**: cf は npm に公開されており（`cf` パッケージ、記事時点のバージョンは 1.0.0-beta.x）、実在を確認した。ただし記事の機能はオープンベータで、CLI と設定形式が変わりうること、デプロイには Cloudflare アカウントでの認証が必要で、設定ファイルも cf 固有の型（`cf/config`）に依存することから、一般利用可能を前提とする本リポジトリの基準（GA かつ 100 行前後で再現できる）を満たさないと判断し、デプロイ可能なサンプルは作成していません。

## 関連リンク

- [Forge のご紹介: SDK・CLI・ドキュメントなどを生成するオープンソースのパイプライン（本リポジトリ）](./2026-09-28-forge-open-source-generation-pipeline.md)
- [VoidZero が Cloudflare に加わって4か月（本リポジトリ）](./2026-09-28-voidzero-update.md)
- [Vite で動く Next.js アプリケーション: Vinext 1.0（本リポジトリ）](./2026-09-28-vinext-nextjs-on-vite.md)
- cf（GitHub）: https://github.com/cloudflare/cf
- cf の予告記事: https://blog.cloudflare.com/cf-cli-local-explorer
- Forge の記事: https://blog.cloudflare.com/forge-open-source-generation-pipeline/
- Vite: https://vite.dev/
