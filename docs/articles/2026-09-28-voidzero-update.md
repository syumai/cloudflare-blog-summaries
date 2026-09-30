# VoidZero が Cloudflare に加わって4か月: オープンソースのJavaScriptツールチェーンを人間にもエージェントにも速く

- 原文: [https://blog.cloudflare.com/voidzero-update/](https://blog.cloudflare.com/voidzero-update/)
- 日本語版の出どころ: Cloudflare公式の日本語版（ja-jp）は確認時点で存在しなかった（404）ため、英語版（en-us）から日本語化して要約している。公開日は英語原文の datePublished に従う。
- 公開日: 2026-09-28
- 位置づけ: Birthday Week 2026 の記事
- 著者: Evan You
- 関連: [コミュニティプログラムの刷新](./2026-08-07-community-program-refresh.md)（Vite エコシステム基金とは別に追加された100万ドル）、[エンジニアリング標準の自動適用](./2026-08-04-engineering-standards-enforcement.md)（VoidZero チームがメンテナンスする oxlint を標準の linter に採用）
- GitHub: [docs/articles/2026-09-28-voidzero-update.md](https://github.com/syumai/cloudflare-blog-summaries/blob/main/docs/articles/2026-09-28-voidzero-update.md)

![ヘッダー画像](https://blog.cloudflare.com/_emdash/api/media/file/01M3JF39Y5YKC8AHHGD706PRKV.png)
*図: 記事ヘッダー画像（出典: Cloudflare Blog https://blog.cloudflare.com/voidzero-update/）*

## TL;DR

- VoidZero が Cloudflare に参画して4か月で、80回超のリリース、1,200件超の issue クローズを達成した。Vite・Vitest・Rolldown・Oxc・Vite+ はオープンソース、ベンダー中立、コミュニティ主導のまま維持するという約束も継続している。
- 主な性能改善は、Oxc React Compiler（10倍高速）、Vitest 5（Vitest 4 比で最大50%高速）、tsgolint 安定版（ESLint + typescript-eslint 比で12〜18倍高速）、Oxfmt（Prettier 比で7倍高速）。
- 統合ツールチェーン **Vite+ が 1.0** に到達し、Vite 8・Vitest 5・Rolldown・Oxlint・Oxfmt とタスクキャッシュを同梱する。
- 最適化の対象は「人間」だけでなく「エージェント」。推論が速くなるほど、型チェック・lint・ビルドの待ち時間がボトルネックになるという認識が根底にある。
- 今後は Oxc パーサーの改善（最大3倍の高速化見込み）、Rolldown のチャンク分割アルゴリズムの再設計、Void（Vite ネイティブのデプロイプラットフォーム）のオープンソース・セルフホスト版を予定している。

## 背景・課題

VoidZero は Vite の作者 Evan You らによる JavaScript ツールチェーンの会社で、4か月前に Cloudflare への参画が発表された（[VoidZero joins Cloudflare](https://blog.cloudflare.com/voidzero-joins-cloudflare/)）。その際に「Vite、Vitest、Rolldown、Oxc、Vite+ はオープンソースであり続け、特定ベンダーに依存せず、コミュニティ主導で進める」と約束していた。本記事は Birthday Week（Cloudflare がインターネットに還元する週）の一環として、その約束をどう果たしてきたかの中間報告にあたる。

記事が強調する背景は、AI エージェントがコードを書く時代のボトルネックの変化である。開発者体験と性能の改善は、もともと「フィードバックループを短くする」ための取り組みだった。エージェントが使い手になると、推論自体が速くなる分、型チェック・lint・ビルド・テストの所要時間が相対的に大きな待ち時間になる。プロセスが長引くほど、エージェントは次の進捗を得るまで待たされる。

## 発表内容 / アーキテクチャ

### 4か月の成果

| 項目 | 内容 |
| --- | --- |
| Oxc React Compiler（8月） | React.js アプリのコンパイルが10倍高速 |
| Vitest 5（9月） | Vitest 4 比で最大50%高速 |
| tsgolint 安定版 | 大規模コードベースで ESLint より最大18倍高速 |
| Oxfmt | JSON / CSS / SCSS / Less / GraphQL / YAML のフォーマッターを Rust 化し、Prettier 比で7倍高速 |
| Vite+ 1.0 | ツールチェーン全体を統合 |
| Bundled Dev | 実験段階。Cloudflare のダッシュボードが社内開発者向けに使用 |

### レイヤー構造の利点

VoidZero のツールは下のレイヤーの上に積み上がっている: コンパイラ（Oxc）→ バンドラー（Rolldown）→ ビルドツール（Vite）、および linter（Oxlint）とテストランナー（Vitest）。そのため、あるレイヤーの最適化は、その上に載るすべてのツールに自動的に効く。これが、人間とエージェントの双方に対して全体を速くできる根拠として挙げられている。

### Oxc React Compiler: コンパイル10倍高速

React チームによる Rust での書き直しを土台にした、[React Compiler](https://react.dev/learn/react-compiler) の再実装。元の Babel 実装より10倍速く、メモリ使用量も少なく、エラー処理もより完全だとされる。Vite では `oxc-transform-react` をインストールし、`@vitejs/plugin-react` の `compiler` フラグを有効にして使う。

### Vitest 5: 最大50%高速

- 高速化: プロジェクト間での変換済みファイルの共有、ディスク上のモジュールキャッシュ、メインプロセスとワーカー間のデータ転送量の削減。
- `vitest doctor`: セットアップ・import・変換・テストの各時間を内訳表示し、他の設定も試して速い設定を提案する。
- Trace View: ブラウザ操作・アサーション・DOM スナップショットを記録し、失敗の再生や HTML レポートでの確認ができる。
- `vi.when`: 手書きの `mockImplementation` なしに、引数から戻り値へのマッピングで条件付きモックを書ける。
- ベンチマークの刷新: フィクスチャ・フック・リトライ・フィルタ・アサーションが通常のテストと同様に使える。
- 偽陽性の削減: await されていない非同期アサーションを失敗にし、各テスト前にモック呼び出しをクリアし、断続的な失敗を見つける `--repeats` フラグを追加。

### tsgolint: 安定版、最大18倍高速

Oxlint の型認識 lint エンジン tsgolint が安定版になった。TypeScript の型情報を必要とするバグを検出しつつ、ESLint + typescript-eslint より12〜18倍速い。typescript-eslint の61個の型認識ルールのうち59個に対応する。さらに Oxlint は1つの TypeScript プログラムを lint と型チェックで共有でき、プロジェクトを2回解析せずに済む。

### Oxfmt: Prettier 比7倍、フォーマッターを Rust 化

JSON・CSS・SCSS・Less・GraphQL・YAML のフォーマッターを Rust で書き直し、Prettier 互換の出力と使い勝手を保ったまま高速化した。`oxfmt --migrate prettier` で Prettier からの移行ができる。

### Bundled Dev: 大規模アプリ向けの開発サーバー

旧称 Full Bundle Mode。開発中にも Vite の本番用バンドラーを使うモードで、大規模アプリケーションで開発サーバーが大きく速くなり、リモートサンドボックスで作業する際のネットワークオーバーヘッドも減らすことを狙う。Cloudflare のダッシュボードなど巨大なコードベースを持つ顧客との協業で形作られており、ダッシュボードはすでにすべての社内開発者に対して Bundled Dev を使っている。実験的機能（`experimental.bundledDev`）だが、近く experimental を外す見込み。

### Vite+ 1.0

ツールを速くするだけでなく、「どの linter を使うか」といった判断疲れを減らし、良いデフォルトを提供することも、人間とエージェントがソフトウェアを速く出荷する助けになる。Vite+ は VoidZero のツールを1つの統合ツールチェーンにまとめ、Vite 8・Vitest 5・Rolldown・Oxlint・Oxfmt とタスクキャッシュを同梱する。

![vp run --cache によるタスクキャッシュのターミナル出力](https://blog.cloudflare.com/_emdash/api/media/file/01M3JF3B663NP132B5X1EGYZTG.png)
*図: hono リポジトリで `vpr --cache build` を実行した例。キャッシュヒットしたタスクは再実行されず結果が再生され、`2/4 cache hit (50%), 1.75s saved.` と表示される（出典: Cloudflare Blog https://blog.cloudflare.com/voidzero-update/）*

### Cloudflare のオープンソース投資

VoidZero は Open Source Pledge のメンバーである。Cloudflare は当初の発表で Vite エコシステム基金に100万ドルをコミットし、その後 [コミュニティプログラムの刷新](https://blog.cloudflare.com/community-program-refresh/) でオープンソース向けにさらに100万ドルを追加した。

### 今後の予定

- Oxc パーサーの大幅な改善（最大3倍の高速化の可能性）
- Rolldown のチャンク分割アルゴリズムの再設計
- Void（Cloudflare 上に構築された Vite ネイティブのデプロイプラットフォーム）の、オープンソースでセルフホスト可能なバージョン

## コード例

記事中のコードは、いずれも各機能を有効にする短い設定例である。

Oxc React Compiler を Vite で有効にする:

```shell
pnpm add -D @vitejs/plugin-react@^6.1.0 oxc-transform-react
```

```js
// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react({ compiler: true })],
});
```

`oxc-transform-react` を入れたうえで `compiler: true` を渡すだけで、React Compiler の Oxc 実装に切り替わる。

型認識 lint と TypeScript 診断を Oxlint 設定で有効にする:

```ts
import { defineConfig } from "oxlint";

export default defineConfig({
  options: {
    typeAware: true,
    typeCheck: true,
  },
});
```

`typeAware` が tsgolint による型認識ルール、`typeCheck` が TypeScript の診断（型チェック）である。両方を有効にすると、同じ TypeScript プログラムが共有される。

Prettier から Oxfmt へ移行する:

```shell
pnpm add -D oxfmt
pnpm oxfmt --migrate prettier
pnpm oxfmt
```

Bundled Dev を有効にする:

```js
import { defineConfig } from "vite";

export default defineConfig({
  experimental: {
    bundledDev: true,
  },
});
```

## ユースケース

- **React アプリのビルド時間短縮**: Babel ベースの React Compiler から Oxc 版へ切り替え、コンパイル時間とメモリ使用量を減らす。
- **大規模モノレポのテスト高速化**: Vitest 5 への更新で、プロジェクト間の変換共有とディスクキャッシュの恩恵を受ける。`vitest doctor` で遅い原因を特定する。
- **CI・エージェントループでの lint + 型チェック**: Oxlint の `typeAware` と `typeCheck` で、1回の解析で両方を実行する。エージェントが修正を試すたびのフィードバックを短くできる。
- **Prettier からの移行**: `oxfmt --migrate prettier` で既存設定を引き継ぎ、フォーマットを高速化する。
- **巨大フロントエンドの開発サーバー**: Bundled Dev で、大規模アプリやリモートサンドボックスでの開発体験を改善する。
- **ツール選定の簡略化**: Vite+ を使うことで、linter・フォーマッター・テストランナー・タスクキャッシュを個別に選ぶ手間を省く。

## 所感・ポイント

- 性能数値は「X倍」と並ぶが、いずれも特定のベンチマーク条件（リンク先のリポジトリに結果がある）での値で、自分のプロジェクトで同じ倍率になるとは限らない。特に tsgolint の「最大18倍」は大規模コードベースでの上限側の値である。
- 「推論が速くなるとビルド・lint・テストがボトルネックになる」という見立ては、ツールチェーンの最適化をエージェント時代の課題として位置づけ直している。下位レイヤー（Oxc、Rolldown）の高速化が上位ツールへ波及する構造も、この戦略の根拠になっている。
- Bundled Dev が Cloudflare ダッシュボードのような巨大コードベースで鍛えられている点は、VoidZero が Cloudflare の一員であることの実利として説明されている。
- Void のオープンソース・セルフホスト版は今後の予定で、詳細は記事では触れられていない。
- Workers 上で動く機能の紹介ではなく、ローカル／CI で使う JavaScript ツールチェーンの記事であるため、デプロイ可能な Workers サンプル（`examples/`）は作成していません（サンプル対象外）。

## 関連リンク

- [VoidZero joins Cloudflare](https://blog.cloudflare.com/voidzero-joins-cloudflare/)
- [Oxc React Compiler 発表](https://oxc.rs/blog/2026-08-18-react-compiler-support) / [ドキュメント](https://oxc.rs/docs/guide/usage/transformer/react-compiler.html)
- [Vitest 5 発表](https://vitest.dev/blog/vitest-5.html)
- [tsgolint 安定版](https://oxc.rs/blog/2026-07-22-type-aware-linting-stable)
- [Oxfmt ドキュメント](https://oxc.rs/docs/guide/usage/formatter.html)
- [Vite 8.1 と Bundled Dev](https://vite.dev/blog/announcing-vite8-1#experimental-bundled-dev-mode)
- [Vite+ 1.0 発表](https://voidzero.dev/posts/announcing-vite-plus-1-0) / [Vite+](https://viteplus.dev/)
- [Open Source Pledge の VoidZero](https://opensourcepledge.com/members/voidzero/)
- [コミュニティプログラムの刷新](https://blog.cloudflare.com/community-program-refresh/)
