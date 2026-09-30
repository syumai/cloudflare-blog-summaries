---
routerMode: hash
theme: default
title: "cf: Cloudflare API 全体を扱えるエージェント向け CLI"
info: |
  cf（エージェント向け CLI）の解説スライド。
  原文: https://blog.cloudflare.com/cloudflare-cf-cli-launch/
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

# cf

<div class="text-2xl pt-2">Cloudflare API 全体を扱えるエージェント向け CLI</div>

Birthday Week 2026

<div class="pt-4 text-sm opacity-70">
原文: https://blog.cloudflare.com/cloudflare-cf-cli-launch/<br>
公開日: 2026-09-28
</div>

---

# TL;DR

- エージェント前提の新 CLI <strong>cf</strong> がオープンベータ（<code>npm i -g cf</code>）
- Wrangler の約 280 コマンドに対し、<strong>3,000 超のオペレーション</strong>を網羅。生成は <a href="../forge-open-source-generation-pipeline/">Forge</a>
- <strong>JSON が既定</strong>、<code>cf cli search</code> で自然言語検索、複雑な入力はフォーム
- 設定は TypeScript の <code>cloudflare.config.ts</code>、開発は <strong>Vite が既定</strong>
- 移行は <code>cf migrate</code>。Wrangler はベータ終了後 18 か月保守

---

# アジェンダ

- 背景: エージェントの Wrangler 利用の急増
- Forge による API 全体の CLI 化
- エージェント向けの設計（JSON・検索・フォーム）
- 型付き設定 <code>cloudflare.config.ts</code>
- Vite と Wrangler からの移行
- コード例・ユースケース・まとめ

---

# 背景: エージェントが Wrangler を使い始めた

<img src="https://blog.cloudflare.com/_emdash/api/media/file/01M3KR63G9MAXHAG81FC5HKYRY.01M3KR64BVBYV5MM3YBHRRRWGF.png" style="max-height: 280px; margin: 0 auto;" />

- 2026年3月: Wrangler 利用の <strong>4分の1</strong> がエージェント（前年は1桁%）→ 先週 <strong>48%</strong>
- 1日あたり約2倍の種類のコマンド、6種類以上を使う確率は約4倍

<div class="text-xs opacity-60 pt-2">出典: Cloudflare Blog https://blog.cloudflare.com/cloudflare-cf-cli-launch/</div>

---

# 課題: Wrangler は約 280 コマンドだけ

- Cloudflare の提供機能は、Wrangler のコマンドよりはるかに多い
- 各プロダクトチームが個別に実装したため、パターンの強制は事実上不可能
- 用語の不統一: <code>d1 info</code> / <code>hyperdrive get</code> / <code>workflows describe</code>
- ほとんど使われないのに数千行に膨らんだ独自実装もあった
- 目標: 既存の標準化と、大幅な拡張を同時に行う

---

# Forge: API スキーマから CLI を生成

- すべての機能に OpenAPI スキーマがある。少し注釈を足すと Forge が CLI の元データにできる
- Wrangler の約 280 機能 → API 全体の <strong>3,000 超のオペレーション</strong>
- 1つのツールで Worker のセットアップ・デプロイ・監視・Access 保護・ドメイン購入・WAF まで
- Forge 側の解説: <a href="../forge-open-source-generation-pipeline/">▶ 解説スライド</a>

---

# 新しい CLI を出す理由

- Wrangler は、長年の文書や記事が LLM の学習に含まれている利点がある
- 同時に、仕様を大きく変えると学習済みの挙動と衝突する
- 新しい CLI のほうが、新旧の差異を文脈で説明するより混乱が少ない
- コンテキスト注入と <code>AGENTS.md</code> への追記で支えられる

---

# 設計1: JSON が既定の出力

- Wrangler: エージェントは毎回 <code>--json</code> + <code>jq</code>。非対応コマンドは Unicode の表で、時間とトークンを消費
- cf: <strong>エージェントには JSON</strong> を既定に。人間向けは整形、エージェント向けは圧縮表示（文脈節約）
- 人間の入力が要る操作（ドメイン購入など）は、検証付きの<strong>フォーム</strong>で進められる
- もちろん、エージェントに頼んでもよい

---

# 設計2: cf cli search

- 3,000 の経路から、文脈を膨らませずに目的のコマンドを探す
- 自然言語で質問 → 小さな検索インデックスが、API の説明とパラメータからコマンド候補を返す
- 初めて <code>--help</code> を実行したときに、エージェントへ自動で案内される

---

# 設計3: 型で守られる設定

- <code>cloudflare.config.ts</code>: TypeScript の設定。プログラムで組み立てられる
- 事前知識がなくても、エージェントが設定を見つけて編集できた
- LSP を使うエージェント（Claude Code・Codex など）は型情報から精度の高い提案ができる
- 対比: TOML はスキーマが使いにくく、JSONC はスキーマをエージェントがほぼ使わなかった
- 社内の Wrangler 設定には、5,000 行超から約 <strong>40%</strong> 削減した例
- 共通の土台から環境ごとに生成し、<code>env</code> ブロックのコピーをなくす

---

# コード例1: 最小の設定

```typescript {all|1-2|4-5|9-10}
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

- <code>defineConfig</code> のコールバックで Vite の <code>mode</code> を受け取り、環境を切り替える
- <code>with { type: "cf-worker" }</code> でエントリを取り込み、<code>env</code> は <code>bindings.*</code> で定義

<div class="text-xs opacity-60">出典: Cloudflare Blog https://blog.cloudflare.com/cloudflare-cf-cli-launch/</div>

---

# コード例2: bindings ヘルパー（前半）

```typescript {all|7-11|12|13-17|18}
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
      // ... 次のスライドへ続く
```

- 環境変数は <code>bindings.text</code>、秘密は <code>bindings.secret</code>、KV は <code>bindings.kv</code>
- <code>mode</code> の三項演算子で本番とステージングを切り替える

---

# コード例2: bindings ヘルパー（後半）

```typescript {all|2|3-5|6|7-9|10}
      // ... 前のスライドの続き（env の中）
      UPLOADS: bindings.r2({ name: `example-${mode}-uploads` }),
      JOBS: bindings.queue < { userId: string } > ({
        name: `example-${mode}-jobs`,
      }),
      AI: bindings.ai(),
      SEARCH_INDEX: bindings.vectorize({
        name: `example-${mode}-search`,
      }),
      API: bindings.worker({ worker: `example-${mode}-api` }),
```

- R2・Queue・AI・Vectorize・他の Worker まで、すべて <code>bindings.*</code> で並び、エディタが補完と説明を出す
- Queue の型引数まわりの表記（<code>JOBS</code> の行）は、原文の整形崩れをそのまま引用している

---

# コード例3: triggers ヘルパー

```typescript {all|7|8|9|10}
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

- Worker を起動するきっかけ（ルート・スケジュール・Queue・メール）を1つのブロックに集約
- 将来はポリシー・ゾーン・DNS なども同じ設定ファイルで管理する構想

<div class="text-xs opacity-60">出典: Cloudflare Blog https://blog.cloudflare.com/cloudflare-cf-cli-launch/</div>

---

# 開発体験: Vite が既定

- かつての Wrangler: esbuild でバンドル、<code>:8787</code> の開発サーバーは自前実装（Miniflare など内部への変更が必要）
- Vite: プラグインの豊富なエコシステム、HMR 付きの開発サーバー、Rust 製 <strong>Rolldown</strong> によるツリーシェイキング
- Cloudflare Vite Plugin が Workers ビルドの推奨手段。Vitest プラグインと合わせて Workers ランタイムに合致した開発・テスト
- esbuild が必要な JavaScript Worker・Rust・Python は、dev とデプロイを Wrangler に委譲

---

# Wrangler からの移行

```sh
cf migrate   # Vite でビルドしている Worker は cloudflare.config.ts に変換
cf init      # 新規プロジェクト（Hello World）
cf deploy    # 静的サイトは設定ファイルなしでデプロイ
```

- <code>cf init/deploy</code>: Cloudflare Vite Plugin の導入と設定ファイルの作成まで自動化
- ベータ終了後に Wrangler の最終メジャーを公開し、cf へ誘導。その後 <strong>18 か月</strong>は保守
- cf はオープンソース（github.com/cloudflare/cf）

---

# ユースケース1: エージェントに運用を任せる

- Worker のセットアップ → デプロイ → 監視 → Access で保護 → ドメイン購入 → WAF の前段配置
- 1つのツールで完結し、エージェントは <code>cf cli search</code> で不足するコマンドを探す
- 人間の入力が必要な購入などは、フォームで確認しながら進める

---

# ユースケース2: 設定の移行と多環境管理

- <code>cf migrate</code> で Vite ビルドの Worker を <code>cloudflare.config.ts</code> へ
- <code>mode</code> によって本番・ステージングの <code>bindings</code> を切り替え、環境ごとの <code>env</code> ブロックの重複をなくす
- 型と LSP の補完で、エージェントも人間も誤設定に気づきやすい

---

# ユースケース3: 新規プロジェクトの立ち上げ

- <code>cf init</code> で Hello World を作成
- <code>cf deploy</code> でデプロイ。静的サイトなら設定ファイルなしで開始できる
- Cloudflare Vite Plugin が自動で入り、HMR 付きの開発サーバーで開発できる

---

# まとめ・所感

- エージェントが主な利用者という前提で、既定値（JSON）・検索・型付き設定を設計し直した
- 対象範囲の広さは <a href="../forge-open-source-generation-pipeline/">Forge</a> による OpenAPI からの生成に支えられる
- Vite が既定になる流れは VoidZero・Vinext の記事と合わせて読むと分かりやすい
- オープンベータで、esbuild / Rust / Python は Wrangler に委譲。完全移行までは移行期間がある
- デプロイ可能なサンプルは対象外（オープンベータで、cf 固有の型に依存するため）

---

# 参考リンク

- 原文（en-us）: https://blog.cloudflare.com/cloudflare-cf-cli-launch/
- cf（GitHub）: https://github.com/cloudflare/cf
- 予告記事: https://blog.cloudflare.com/cf-cli-local-explorer
- Vite: https://vite.dev/
- 関連スライド: <a href="../forge-open-source-generation-pipeline/">Forge</a> / <a href="../voidzero-update/">VoidZero</a> / <a href="../vinext-nextjs-on-vite/">Vinext</a>
- Wiki: [docs/articles/2026-09-28-cloudflare-cf-cli-launch.md](https://github.com/syumai/cloudflare-blog-summaries/blob/main/docs/articles/2026-09-28-cloudflare-cf-cli-launch.md)
