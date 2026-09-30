---
routerMode: hash
theme: default
title: "VoidZero が Cloudflare に加わって4か月"
info: |
  VoidZero が Cloudflare に加わって4か月の解説スライド。
  原文: https://blog.cloudflare.com/voidzero-update/
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

# VoidZero が Cloudflare に加わって4か月

<div class="text-2xl pt-2">OSS の JavaScript ツールチェーンを人間にもエージェントにも速く</div>

Birthday Week 2026

<div class="pt-4 text-sm opacity-70">
原文: https://blog.cloudflare.com/voidzero-update/<br>
公開日: 2026-09-28
</div>

---

# TL;DR

- 参画から4か月で <strong>80回超のリリース、1,200件超の issue クローズ</strong>。OSS・ベンダー中立・コミュニティ主導の約束を継続
- 性能改善: Oxc React Compiler <strong>10倍</strong>、Vitest 5 最大<strong>50%</strong>、tsgolint <strong>12〜18倍</strong>、Oxfmt <strong>7倍</strong>
- 統合ツールチェーン <strong>Vite+ が 1.0</strong> に到達
- 最適化の対象は人間だけでなく<strong>エージェント</strong>。待ち時間がボトルネックになる
- 今後: Oxc パーサー最大3倍、Rolldown チャンク再設計、Void の OSS セルフホスト版

---

# アジェンダ

- 背景: エージェント時代のボトルネック
- レイヤー構造とツール群
- Oxc React Compiler / Vitest 5
- tsgolint / Oxfmt
- Bundled Dev / Vite+ 1.0
- OSS 投資と今後の予定
- コード例・ユースケース・まとめ

---

# 背景: エージェント時代のボトルネック

- 開発者体験と性能の改善は、もともと<strong>フィードバックループを短くする</strong>ための取り組み
- エージェントが使い手になると、推論が速くなる分、型チェック・lint・ビルドの待ち時間が再びボトルネックに
- 処理が長いほど、エージェントは次の進捗を得るまで待たされる
- 4か月前の約束: Vite・Vitest・Rolldown・Oxc・Vite+ は OSS・ベンダー中立・コミュニティ主導のまま

<div class="text-xs opacity-60 pt-4">出典: Cloudflare Blog https://blog.cloudflare.com/voidzero-update/</div>

---

# ツールが積み上がる構造

<div class="text-lg pt-4">

- コンパイラ: <strong>Oxc</strong>
- バンドラー: <strong>Rolldown</strong>（Oxc の上）
- ビルドツール: <strong>Vite</strong>（Rolldown の上）
- linter: <strong>Oxlint</strong>、テストランナー: <strong>Vitest</strong>

</div>

下のレイヤーの最適化が、上に載るすべてのツールへ自動的に効く。

<div class="text-xs opacity-60 pt-4">出典: Cloudflare Blog https://blog.cloudflare.com/voidzero-update/</div>

---

# 4か月の成果一覧

| 項目 | 内容 |
| --- | --- |
| Oxc React Compiler（8月） | React アプリのコンパイルが 10倍高速 |
| Vitest 5（9月） | Vitest 4 比で最大 50% 高速 |
| tsgolint 安定版 | 大規模コードで ESLint 比 最大 18倍高速 |
| Oxfmt | 主要フォーマッターを Rust 化、Prettier 比 7倍高速 |
| Vite+ 1.0 | ツールチェーンを統合 |
| Bundled Dev | 実験段階、Cloudflare ダッシュボードで使用 |

<div class="text-xs opacity-60 pt-4">出典: Cloudflare Blog https://blog.cloudflare.com/voidzero-update/</div>

---

# Oxc React Compiler: 10倍高速

- React チームの Rust 書き直しを土台にした <strong>React Compiler</strong> の再実装
- Babel 実装より <strong>10倍速く</strong>、メモリも少なく、エラー処理も充実
- Vite では <code>oxc-transform-react</code> を入れて <code>compiler: true</code>

```js {all}
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react({ compiler: true })],
});
```

<div class="text-xs opacity-60 pt-2">依存: pnpm add -D @vitejs/plugin-react@^6.1.0 oxc-transform-react</div>

---

# Vitest 5: 最大50%高速

- <strong>高速化</strong>: プロジェクト間で変換済みファイルを共有、ディスクにモジュールをキャッシュ、プロセス間通信を削減
- <strong>vitest doctor</strong>: setup / import / transform / test 時間の内訳と、速い設定の提案
- <strong>Trace View</strong>: ブラウザ操作・アサーション・DOM スナップショットを記録し再生
- <strong>vi.when</strong>: 引数から戻り値へのマッピングで条件付きモック
- <strong>ベンチマーク刷新</strong>、<strong>偽陽性の削減</strong>（未 await の非同期アサーションを失敗に、<code>--repeats</code> 追加）

<div class="text-xs opacity-60 pt-4">出典: Cloudflare Blog https://blog.cloudflare.com/voidzero-update/</div>

---

# tsgolint: 安定版、12〜18倍高速

- Oxlint の型認識 lint エンジン。TypeScript の型情報が必要なバグを検出
- ESLint + typescript-eslint 比で <strong>12〜18倍</strong>（大規模コードベース）
- typescript-eslint の型認識ルール61個のうち <strong>59個</strong>に対応
- lint と型チェックで <strong>1つの TypeScript プログラムを共有</strong>（2回解析しない）

```ts {all}
export default defineConfig({
  options: {
    typeAware: true,  // tsgolint による型認識ルール
    typeCheck: true,  // TypeScript 診断
  },
});
```

---

# Oxfmt: Prettier 比7倍高速

- JSON / CSS / SCSS / Less / GraphQL / YAML のフォーマッターを <strong>Rust で書き直し</strong>
- Prettier 互換の出力と使い勝手を維持
- 移行コマンドあり

```shell {all}
pnpm add -D oxfmt
pnpm oxfmt --migrate prettier   # Prettier の設定から移行
pnpm oxfmt
```

<div class="text-xs opacity-60 pt-4">出典: Cloudflare Blog https://blog.cloudflare.com/voidzero-update/</div>

---

# Bundled Dev: 大規模アプリの開発サーバー

- 旧称 Full Bundle Mode。<strong>開発中にも Vite の本番用バンドラー</strong>を使う
- 大規模アプリで開発サーバーが大幅に高速化、リモートサンドボックスでのネットワーク負荷も低減
- Cloudflare ダッシュボードなど巨大コードベースとの協業で形作られた
- ダッシュボードは<strong>すべての社内開発者</strong>が Bundled Dev を使用中。実験状態を近く解除予定

```js {all}
export default defineConfig({
  experimental: { bundledDev: true },
});
```

---

# Vite+ 1.0: 統合ツールチェーン

- Vite 8・Vitest 5・Rolldown・Oxlint・Oxfmt と<strong>タスクキャッシュ</strong>を同梱
- 「どの linter を使うか」といった判断疲れを減らし、良いデフォルトを提供
- 人間とエージェントの双方がソフトウェアを速く出荷するための、もう一つのアプローチ

---

# Vite+ のタスクキャッシュ

<div class="text-center">
<img src="https://blog.cloudflare.com/_emdash/api/media/file/01M3JF3B663NP132B5X1EGYZTG.png" style="max-height: 340px; margin: 0 auto;" />
</div>

<div class="text-sm pt-2">hono リポジトリでの例: キャッシュヒットしたタスクは再実行されず再生され、<code>2/4 cache hit (50%), 1.75s saved.</code> と表示される。</div>

<div class="text-xs opacity-60 pt-1">出典: Cloudflare Blog https://blog.cloudflare.com/voidzero-update/</div>

---

# Cloudflare の OSS 投資と今後の予定

- VoidZero は Open Source Pledge のメンバー
- Vite エコシステム基金に <strong>100万ドル</strong>、その後のコミュニティプログラム刷新で <strong>さらに100万ドル</strong>を OSS に追加
- 今後数か月の予定:
  - Oxc パーサーの改善（最大3倍の高速化の可能性）
  - Rolldown のチャンク分割アルゴリズム再設計
  - <strong>Void</strong>（Vite ネイティブのデプロイプラットフォーム）の OSS・セルフホスト版

<div class="text-xs opacity-60 pt-4">出典: Cloudflare Blog https://blog.cloudflare.com/voidzero-update/</div>

---

# コード例: 設定のまとめ

各設定例は前のスライドに掲載した。ここでは設定を一覧にまとめる。

| 目的 | 設定・コマンド |
| --- | --- |
| React Compiler | <code>compiler: true</code>（plugin-react） |
| 型認識 lint + 型チェック | <code>typeAware: true, typeCheck: true</code> |
| Prettier 移行 | <code>pnpm oxfmt --migrate prettier</code> |
| Bundled Dev | <code>experimental.bundledDev: true</code> |

---

# ユースケース（1/2）

- <strong>React アプリのビルド時間短縮</strong>: Babel 版から Oxc React Compiler へ切り替え、時間とメモリを削減
- <strong>大規模モノレポのテスト高速化</strong>: Vitest 5 の共有・ディスクキャッシュ。<code>vitest doctor</code> で遅い原因を特定
- <strong>エージェントのループでの lint + 型チェック</strong>: <code>typeAware</code> と <code>typeCheck</code> で1回の解析に

---

# ユースケース（2/2）

- <strong>Prettier からの移行</strong>: <code>oxfmt --migrate prettier</code> で設定を引き継ぎ高速化
- <strong>巨大フロントエンドの開発サーバー</strong>: Bundled Dev で大規模アプリやリモートサンドボックスの体験を改善
- <strong>ツール選定の簡略化</strong>: Vite+ で linter・フォーマッター・テスト・タスクキャッシュを一括導入

---

# まとめ・所感

- 4か月で80回超のリリース。性能改善が各レイヤーで進み、Vite+ 1.0 で統合された
- 倍率は特定ベンチマーク条件での値。自分のプロジェクトでの効果は計測が必要
- 「推論が速くなるとビルド・lint・テストが待ち時間になる」という見立てが戦略の軸
- Void の OSS 版は今後の予定で、詳細は未公開

---

# 参考リンク

- 原文: https://blog.cloudflare.com/voidzero-update/
- VoidZero joins Cloudflare: https://blog.cloudflare.com/voidzero-joins-cloudflare/
- Vitest 5: https://vitest.dev/blog/vitest-5.html
- tsgolint 安定版: https://oxc.rs/blog/2026-07-22-type-aware-linting-stable
- Vite+ 1.0: https://voidzero.dev/posts/announcing-vite-plus-1-0
- 関連スライド: [コミュニティプログラムの刷新](../community-program-refresh/) / [エンジニアリング標準の自動適用](../engineering-standards-enforcement/)
- Wiki: [docs/articles/2026-09-28-voidzero-update.md](https://github.com/syumai/cloudflare-blog-summaries/blob/main/docs/articles/2026-09-28-voidzero-update.md)
