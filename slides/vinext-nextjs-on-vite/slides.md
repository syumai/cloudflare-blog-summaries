---
routerMode: hash
theme: default
title: "Vinext 1.0: Vite で動く Next.js アプリケーション"
info: |
  Vinext 1.0 の解説スライド。
  原文: https://blog.cloudflare.com/vinext-nextjs-on-vite/
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

# Vinext 1.0

<div class="text-2xl pt-2">Vite で動く Next.js アプリケーション</div>

Birthday Week 2026

<div class="pt-4 text-sm opacity-70">
原文: https://blog.cloudflare.com/vinext-nextjs-on-vite/<br>
公開日: 2026-09-28
</div>

---

# TL;DR

- 2月の「1週間のAI駆動の実験」から、顧客が本番で使う <strong>Vinext 1.0</strong> へ
- Pages Router / App Router のどちらの Next.js アプリも、Workers・Netlify・AWS Lambda などへ移植可能に
- 移行は <code>npx vinext check</code> と <code>npx vinext init</code> の2コマンド
- 重要機能での Next.js テスト互換性は <strong>99% 超</strong>（キャッシュコンポーネントを除く）
- ビルド時プリレンダリングを Cloudflare のネットワークへ移す<strong>キャッシュウォーミング</strong>
- 上流の変更をエージェントが毎日追う「オープンソースのソフトウェアファクトリー」

---

# アジェンダ

- 背景: 実験から 1.0 へ
- 互換性とテストの仕組み
- 1.0 に含まれるもの
- プリレンダリングとキャッシュウォーミング
- 今後: ソフトウェアファクトリー
- コード例・ユースケース・まとめ

---

# 背景: 実験から 1.0 へ

<img src="https://blog.cloudflare.com/_emdash/api/media/file/01M3AZQWQ4KAE58XPW65NKJGT5.01M3AZQXMAQ87JD2W3YGR0KQ2P.png" style="max-height: 300px; margin: 0 auto;" />

- 2月: 1人のエンジニアとトークンの山で、Vite 上に Next.js を再現する1週間の実験として公開
- 7か月で、高トラフィックな動的アプリを本番で動かす顧客が使うフレームワークに成長

<div class="text-xs opacity-60 pt-2">出典: Cloudflare Blog https://blog.cloudflare.com/vinext-nextjs-on-vite/</div>

---

# 課題: API だけでなく「挙動」の再現

- 同名の関数を用意するだけでは不十分。たとえば <code>revalidatePath</code> は、レンダリング結果・キャッシュエントリ・以後のリクエストに正しく作用する必要がある
- リクエストがアプリ内をどう通るかをトレースし、Next.js と同じ応答になることを確認する作業が最も難しかった
- 顧客は Pages Router の大規模アプリも多く持つ。最新の App Router 機能だけの対応では役に立たない

<div class="text-xs opacity-60 pt-4">出典: Cloudflare Blog https://blog.cloudflare.com/vinext-nextjs-on-vite/</div>

---

# 互換性: 99% 超

<div class="text-center">
<img src="https://blog.cloudflare.com/_emdash/api/media/file/01M3AZQWQD0T4TN11W4NFV4CC9.01M3AZQYNYHM04YM1R5679P2PW.png" style="max-height: 370px; margin: 0 auto;" />
</div>

<div class="text-sm pt-2">799件のテストファイル（App Router 628、Pages Router 246、両方 95、その他 20）の大半が Pass。5月15日〜9月23日で Supported は約62%から100%近く、Overall は約96%まで上昇。</div>

<div class="text-xs opacity-60 pt-1">出典: Cloudflare Blog https://blog.cloudflare.com/vinext-nextjs-on-vite/（互換性の数値は「キャッシュコンポーネントを除く」）</div>

---

# 回帰を防ぐテストの仕組み

- 両ルーター、開発／本番サーバー、Node.js と Cloudflare Workers にまたがる<strong>数千件の焦点を絞ったテスト</strong>
- Next.js の E2E テストスイートを<strong>毎晩</strong> Vinext に対して実行し、互換性の動向を継続的に把握
- マージによる回帰をすぐ検知
- 本番利用の大口顧客と直接やりとりして問題を確認
- 公開直後からコミュニティがさまざまなアプリに適用し、テストで見つからなかった穴を発見

<div class="text-xs opacity-60 pt-4">出典: Cloudflare Blog https://blog.cloudflare.com/vinext-nextjs-on-vite/</div>

---

# 1.0 に含まれるもの（1/2）

- <strong>ルーター</strong>: App Router、Pages Router、混在。RSC、Server Actions、API routes、route handlers、middleware、クライアントサイドナビゲーション
- <strong>ページのライフサイクル</strong>: SSR、ビルド時プリレンダリング、静的エクスポート、ページ単位の ISR（バックグラウンド／オンデマンド再検証はどの出力でも動作）
- <strong>キャッシュ</strong>: 両ルーターとランタイムに共通のキャッシュ関数。Cloudflare の Workers Cache も利用可能

<div class="text-xs opacity-60 pt-4">出典: Cloudflare Blog https://blog.cloudflare.com/vinext-nextjs-on-vite/</div>

---

# 1.0 に含まれるもの（2/2）

- <strong>オブザーバビリティ</strong>: Next.js 互換のトレース。OpenTelemetry・Sentry の既存設定が使え、Workers では Workers Observability と統合
- <strong>エコシステム互換</strong>: 公開された <code>next/*</code> を実装。認証、MDX、画像最適化、フォント、メタデータ、環境変数など
- <strong>Workers の第一級サポート</strong>: 開発・本番とも workerd で実行。画像最適化や Hyperdrive などのバインディングに直接アクセス
- <strong>移行支援</strong>: 2コマンドで検証と設定。既存のプロジェクト構造は維持

---

# 割り切り: Cache Components は限定対応

- Next.js 16 は Cache Components を将来の柱としたが、話を聞いた多くのチームは未使用で、移行の前提とも考えていなかった
- そのため <code>"use cache"</code> は<strong>限定的な対応</strong>。今後も改善するが、中核機能を優先
- 「Next.js の全新機能」より「要となる機能が動くこと」を重視した方針

<div class="text-xs opacity-60 pt-4">出典: Cloudflare Blog https://blog.cloudflare.com/vinext-nextjs-on-vite/</div>

---

# プリレンダリング: ビルド時の課題

- 初公開時: 最初のリクエスト後の ISR には対応、ビルド時レンダリングは未対応
- 1.0: <code>generateStaticParams()</code> / <code>getStaticPaths()</code> の対象を両ルーターでビルド時にプリレンダリングし、ページ単位の ISR で配信、パスやタグで無効化。<code>output: "export"</code> にも対応
- ただし数万〜数十万 URL のサイトでは、アクセスの少ないページの逐次レンダリングにビルド時間を取られる
- ビルドマシンはロングテールのトラフィックを評価できず、重要なページに計算資源を集中できない

<div class="text-xs opacity-60 pt-4">出典: Cloudflare Blog https://blog.cloudflare.com/vinext-nextjs-on-vite/</div>

---

# キャッシュウォーミングの流れ

<div class="text-lg pt-4">

1. 新しい Worker バージョンを<strong>本番トラフィック 0%</strong> でアップロード
2. そのバージョンを指定して、プリレンダリング対象のページをリクエスト
3. Cloudflare のキャッシュにページが投入される
4. 準備ができたらデプロイを<strong>昇格（promote）</strong>

</div>

- 対象は Next.js の仕組みで指定。Vinext は高トラフィックのページも追加できる
- 実ユーザーが新バージョンに触れる前に、レンダリングが終わっている

<div class="text-xs opacity-60 pt-4">出典: Cloudflare Blog https://blog.cloudflare.com/vinext-nextjs-on-vite/</div>

---

# 今後: オープンソースのソフトウェアファクトリー

- Next.js canary には毎日コミットがある
- <strong>毎朝</strong>: エージェントが変更を確認し、差分を取得し、影響しうるものの追跡 issue を作成
- <strong>毎晩</strong>: Next.js のテストスイートを Vinext に対して実行し、互換性マトリクスを再生成
- ギャップが見つかれば、エージェントが両コードベースの変更を特定 → 再現 → テスト移植 → 修正提案
- メンテナーは「Next.js の実装を Vite にどう対応づけるか」という文脈が必要な課題に集中

<div class="text-xs opacity-60 pt-4">出典: Cloudflare Blog https://blog.cloudflare.com/vinext-nextjs-on-vite/</div>

---

# コード例: 作成・移行・デプロイ

新規作成と、既存アプリの移行:

```bash {all}
npm create vinext-app@latest my-app
npx vinext check && npx vinext init
```

- 1行目: 新しいアプリを作成
- 2行目: <code>check</code> で互換性を検証し、<code>init</code> で Vite とデプロイ設定を追加（既存構造は維持）

キャッシュウォーミング付きで Workers へデプロイ:

```bash {all}
npx @vinext/cloudflare deploy --warm-cache
```

- 0% でアップロード → 対象パスをリクエスト → 昇格、の順に実行

---

# コード例: Vite 設定（create-vinext-app の生成物）

```ts {all}
import { defineConfig } from "vite";
import vinext from "vinext";
import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  plugins: [
    vinext(),
    cloudflare({
      viteEnvironment: { name: "rsc", childEnvironments: ["ssr"] },
    }),
  ],
});
```

- <code>vinext()</code>: <code>app/</code> または <code>pages/</code> を自動検出し、<code>next.config.*</code> を読み込む
- <code>cloudflare()</code>: Worker（workerd）上での実行を担当

<div class="text-xs opacity-60 pt-2">記事本文ではなく vinext 1.0.0 の生成物に基づく。examples/vinext-nextjs-on-vite/ に同内容を収録</div>

---

# ユースケース（1/2）

- <strong>Next.js アプリのポータビリティ確保</strong>: Workers（無料プラン含む）、Netlify、AWS Lambda など任意のプラットフォームへ
- <strong>Pages Router の大規模アプリの段階移行</strong>: App Router への書き換えを待たず、Pages / 混在のまま Vite ベースへ
- <strong>大量ページを持つサイトのデプロイ時間短縮</strong>: プリレンダリングを Cloudflare のネットワーク側で実行

---

# ユースケース（2/2）

- <strong>既存のオブザーバビリティ基盤の継続利用</strong>: OpenTelemetry・Sentry の設定を維持し、Workers では Workers Observability でも確認
- <strong>Workers のバインディング活用</strong>: Hyperdrive や画像最適化に、開発時から直接アクセス

---

# まとめ・所感

- 99% 超は「重要な顧客要望機能」かつ「キャッシュコンポーネント除外」の値。<code>vinext check</code> で自分のアプリを確認するのが前提
- グラフでは Supported（約100%）と Overall（約96%）が別の線。分母の違いに注意
- キャッシュウォーミングは、ビルドの仕事をデプロイ先ネットワークへ移す発想
- 上流追従のエージェント運用は、Astro の issue トリアージと同じソフトウェアファクトリーの考え方
- サンプル: examples/vinext-nextjs-on-vite/

---

# 参考リンク

- 原文: https://blog.cloudflare.com/vinext-nextjs-on-vite/
- ドキュメント: https://vinext.dev
- リポジトリ: https://github.com/cloudflare/vinext
- Vinext 初公開の記事: https://blog.cloudflare.com/vinext/
- 関連スライド: [Astro の issue トリアージ](../astro-issue-triage/) / [VoidZero 参画4か月](../voidzero-update/)
- サンプル: [examples/vinext-nextjs-on-vite/](https://github.com/syumai/cloudflare-blog-summaries/tree/main/examples/vinext-nextjs-on-vite)
- Wiki: [docs/articles/2026-09-28-vinext-nextjs-on-vite.md](https://github.com/syumai/cloudflare-blog-summaries/blob/main/docs/articles/2026-09-28-vinext-nextjs-on-vite.md)
