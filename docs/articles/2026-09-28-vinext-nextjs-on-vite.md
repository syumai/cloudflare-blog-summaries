# Vite で動く Next.js アプリケーション: Vinext 1.0 のご紹介

- 原文: [https://blog.cloudflare.com/vinext-nextjs-on-vite/](https://blog.cloudflare.com/vinext-nextjs-on-vite/)
- 日本語版の出どころ: Cloudflare公式の日本語版（ja-jp）は確認時点で存在しなかった（404）ため、英語版（en-us）から日本語化して要約している。公開日は英語原文の datePublished に従う。
- 公開日: 2026-09-28
- 位置づけ: Birthday Week 2026 の記事
- 著者: James Anderson、Matt "TK" Taylor
- 関連: [AstroのGitHub Issue数をゼロへ導くソフトウェアファクトリー](./2026-08-04-astro-issue-triage.md)（エージェントが上流の変更を追う「ソフトウェアファクトリー」の先行事例）、[VoidZero が Cloudflare に加わって4か月](./2026-09-28-voidzero-update.md)（Vite エコシステムの同週の発表）、[examples/vinext-nextjs-on-vite/](../../examples/vinext-nextjs-on-vite/)（最小の App Router アプリのサンプル）
- GitHub: [docs/articles/2026-09-28-vinext-nextjs-on-vite.md](https://github.com/syumai/cloudflare-blog-summaries/blob/main/docs/articles/2026-09-28-vinext-nextjs-on-vite.md)

![ヘッダー画像](https://blog.cloudflare.com/_emdash/api/media/file/01M3AZQWQ4KAE58XPW65NKJGT5.01M3AZQXMAQ87JD2W3YGR0KQ2P.png)
*図: 記事ヘッダー画像。ラバランプから植物が伸びるイラスト（出典: Cloudflare Blog https://blog.cloudflare.com/vinext-nextjs-on-vite/。画像の内容は実際に画像を見て記述）*

## TL;DR

- 2月に「1人のエンジニアとトークンの山で、Vite 上に Next.js を再現できるか」という1週間のAI駆動の実験として始まった Vinext が、**1.0** に到達した。本番の高トラフィックな動的アプリを動かす顧客も出ている。
- 既存の Next.js アプリ（Pages Router / App Router のどちらでも）を、Cloudflare Workers の無料プラン・Netlify・AWS Lambda などへ移植可能にする。移行は `npx vinext check` と `npx vinext init` の2コマンド。
- 重要機能での Next.js テスト互換性は **99% 超**（キャッシュコンポーネントを除く）。Next.js の E2E テストを毎晩 Vinext に対して実行している。
- ビルド時に行っていたプリレンダリングを Cloudflare のネットワーク側へ移す**キャッシュウォーミング**（`--warm-cache`）を導入した。
- 今後は、Next.js canary の変更を毎朝エージェントが確認し、差分の特定・再現・テスト移植・修正案の提案まで行う、オープンソース向けの「ソフトウェアファクトリー」として維持していく。

## 背景・課題

Vinext は2月に、Next.js の API 面を Vite 上で再実装する実験として公開された。当初は有望だったが未完成で、特に App Router の互換性が課題だった。記事によれば、顧客が特に重視していたのは次の点である。

- **Pages Router への対応**: 長年の Next.js ユーザーには Pages Router で作られた大規模アプリが多く、移行は一度にできない。最新の App Router 機能だけに対応したツールでは役に立たない。
- **同名の関数を作るだけでは不十分**: `revalidatePath` のような関数を別実装で用意するのは簡単だが、それがレンダリング結果・キャッシュエントリ・以後のリクエストに正しく作用するかを確認する必要がある。Next.js の「API」だけでなく、その裏の「機械（挙動）」まで再現することが最も難しかった。
- **ビルド時レンダリングの非効率**: 数万〜数十万の URL を持つサイトでは、ほとんどアクセスのないページのレンダリングにビルド時間を奪われ、重要なページが終わった後も数時間待たされる。

## 発表内容 / アーキテクチャ

### 1.0 への到達と互換性

GitHub プロジェクトのコミュニティが、公開直後からさまざまなアプリに Vinext を適用し、テストでは見つからなかった穴を見つけてきた。リクエストがアプリ内をどう通るかをトレースし、Next.js と同じ応答になることを確認する作業が中心だった。

回帰を防ぐための仕組みとして、次を整備している。

- 両ルーター、開発サーバー／本番サーバー、Node.js と Cloudflare Workers というデプロイ先にまたがる、**数千件の焦点を絞ったテスト**
- Next.js の E2E テストスイートを**毎晩** Vinext に対して実行（互換性の動向を継続的に把握し、マージによる回帰をすぐ検知）
- Vinext を本番で使う大口顧客との直接のやりとり

![Next.js テスト互換性の推移](https://blog.cloudflare.com/_emdash/api/media/file/01M3AZQWQD0T4TN11W4NFV4CC9.01M3AZQYNYHM04YM1R5679P2PW.png)
*図: Next.js テストスイートに対する互換性の可視化（出典: Cloudflare Blog https://blog.cloudflare.com/vinext-nextjs-on-vite/。原文の図の下には「Our test compatibility has risen to more than 99%, excluding cache components」とある。以下の説明は実際に画像を見て記述）*

図の上半分は799件のテストファイルを1つずつ色分けしたグリッドで、タブは All (799) / App Router (628) / Pages Router (246) / Mixed (both) (95) / Other (20)。凡例は Pass（緑）・Partial・Fail・Deferred・Vite-equivalent required・Unsupported by vinext・Skipped by Next.js で、大半が緑（Pass）である。下半分は互換性の時系列グラフ（5月15日〜9月23日）で、Supported（緑の点）は約62%から100%近くまで、Overall（青線）は約60%から約96%まで上昇している。

### 1.0 に含まれるもの

| 項目 | 内容 |
| --- | --- |
| ルーター | App Router、Pages Router、両者の混在。React Server Components、Server Actions、API routes、route handlers、middleware、クライアントサイドナビゲーション |
| ページのライフサイクル | サーバー側レンダリング、ビルド時プリレンダリング、静的アセットとしてのエクスポート、ページ単位の ISR（バックグラウンド／オンデマンド再検証はどの出力でも動作） |
| キャッシュ | App / Pages ルーターとランタイムに共通のキャッシュ関数群。Cloudflare の [Workers Cache](https://developers.cloudflare.com/workers/cache) も利用可能 |
| オブザーバビリティ | 両ルーターで Next.js 互換のトレース。既存の OpenTelemetry・Sentry の設定がそのまま使え、Workers では Workers Observability と統合 |
| エコシステム互換 | 公開されている `next/*` の範囲を実装。認証、MDX、画像最適化、フォント、メタデータ、環境変数など |
| Workers の第一級サポート | 開発・本番ともに workerd ランタイムでサーバーコードを実行でき、画像最適化や Hyperdrive などのバインディングに直接アクセスできる |
| 移行支援 | 2コマンドで互換性を検証し、Vite とデプロイ設定を追加（従来の Next.js のプロジェクト構造は維持） |

顧客の声として、Next.js のすべての新機能に対応する必要はなく、要となる機能が動けば十分に有用だったという。Next.js 16 は Cache Components を将来の柱としたが、話を聞いた多くのチームは使っておらず、移行の前提条件とも考えていなかった。そのため、Cache Components を駆動する `"use cache"` ディレクティブは**限定的な対応**にとどめ、上記の中核機能を優先している。

### プリレンダリングとキャッシュウォーミング

初公開時の Vinext は最初のリクエスト後の ISR には対応していたが、ビルド時のレンダリングには未対応だった。アプリは `generateStaticParams()` や `getStaticPaths()` でビルド時にレンダリングするページを指定し、ページ単位の ISR がその初回応答をバックグラウンド／オンデマンドの再検証へつなぐことを期待する。1.0 では両ルーターでこのライフサイクルに対応し、ルートをビルド時にプリレンダリングし、パスやタグで無効化できる。完全な静的サイトなら `output: "export"` も使える。

そのうえで記事は「そもそも、なぜビルド時にレンダリングするのか」と問い直す。ビルドマシンは、ロングテールのトラフィックのうちどのページが重要かを判断できず、逐次ビルドで何千ページもの処理を待つことになる。

**キャッシュウォーミング**は、ページのプリレンダリングをビルドマシンから Cloudflare のネットワークへ移す仕組みである。

- 開発者は従来どおり Next.js の仕組みでプリレンダリング対象を指定し、Vinext は高トラフィックのページを追加で特定して対象に加えられる。
- デプロイ処理の中で、新しい Worker バージョンを**本番トラフィックの 0%** でアップロードし、そのバージョンを指定してページをリクエストする。実ユーザーが新バージョンに触れる前に、レンダリングとキャッシュへの投入が行われる。
- キャッシュが温まったら、デプロイを安全に昇格（promote）する。

### 今後: オープンソースのソフトウェアファクトリー

元の実験が「使い捨てのスロップフォーク」を生んだとすれば、より重要なのは、自己改善のプロセスを回し続ける方法だと記事は述べる。現在は上流への追従が中心で、次の自動化を回している。

- Next.js の canary には毎日コミットがある。**毎朝**、エージェントが変更を確認し、差分を取得し、Vinext に影響しうるものについて追跡用 issue を作る。
- **毎晩**、Next.js のテストスイートを Vinext に対して実行し、互換性マトリクスを再生成する。
- テストや issue でギャップが見つかると、エージェントが両コードベースにまたがる変更を特定し、再現を作り、関連テストを移植し、修正を提案する。

この仕組みで、見落としていたケース、安全でないキャッシュ動作、開発サーバーと本番サーバーの差異などが見つかっている。メンテナーは「Next.js の実装を Vite にどう対応づけるか」という文脈が必要な課題に集中できる。

## コード例

記事に掲載されているのは、いずれもコマンドである。新しいアプリを作る:

```bash
npm create vinext-app@latest my-app
```

既存の Next.js アプリを移行する（互換性チェックのあと、Vite とデプロイ設定を追加）:

```bash
npx vinext check && npx vinext init
```

Cloudflare Workers にキャッシュウォーミング付きでデプロイする:

```bash
npx @vinext/cloudflare deploy --warm-cache
```

`--warm-cache` を付けると、上で説明したとおり、新バージョンを 0% でアップロード → ビルド時に検出されたパスをリクエストしてキャッシュを温める → 昇格、という順でデプロイされる。

参考として、`create-vinext-app` が生成する Vite 設定は次のようになる（`examples/vinext-nextjs-on-vite/vite.config.ts`。記事本文ではなく、vinext 1.0.0 の生成物に基づく）:

```ts
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

`vinext()` が `app/` または `pages/` を自動検出し、`next.config.*` を読み込む。`@cloudflare/vite-plugin` が Worker（workerd）上での実行を受け持つ。

## ユースケース

- **Next.js アプリのポータビリティ確保**: 既存の Next.js アプリを、Cloudflare Workers（無料プラン含む）、Netlify、AWS Lambda など、任意の Web プラットフォームにデプロイできるようにする。
- **Pages Router の大規模アプリの段階移行**: App Router への書き換えを待たず、Pages Router のまま（または両者混在のまま）Vite ベースのビルドとデプロイに移る。
- **大量ページを持つサイトのデプロイ時間短縮**: 数万〜数十万 URL のプリレンダリングをビルドマシンではなく Cloudflare のネットワーク側で行い、ロングテールのページを待たずに配信する。
- **既存のオブザーバビリティ基盤の継続利用**: OpenTelemetry や Sentry の設定を維持したまま移行し、Workers では Workers Observability でも確認する。
- **Workers のバインディング活用**: サーバーコードから Hyperdrive や画像最適化などに、開発時から直接アクセスする。

## 所感・ポイント

- 互換性の「99% 超」は、重要な顧客要望機能に限った値で、キャッシュコンポーネントは除外されている。`"use cache"` は限定対応であり、`vinext check` で自分のアプリを事前に確認するのが前提になる。
- グラフでは Overall（全テスト対象）が約96%、Supported（Vinext が対応対象とした範囲）がほぼ100% と2本の線が分かれている。何を分母にするかで数値が変わるため、「99%」が指す範囲を把握して読む必要がある。
- キャッシュウォーミングは、ビルドの仕事を「デプロイ先のネットワーク」に移すという発想で、0% トラフィックでのバージョン配備という Workers のデプロイ機構を前提にしている。
- 毎朝の canary 確認と毎晩の互換性テストによるエージェント運用は、[Astro の issue トリアージ](./2026-08-04-astro-issue-triage.md)と同じ「ソフトウェアファクトリー」の考え方で、上流の変更へ追従し続けるという課題に適用したものと読める。
- 画像キャプションのうち、ヘッダー画像とグラフの説明は、原文に説明文がないため、実際の画像の内容から筆者が記述したものである（原文にあるのは「Our test compatibility has risen to more than 99%, excluding cache components」のみ）。
- **サンプル**: Workers 上で動作する GA の機能であり最小構成で再現できるため、[examples/vinext-nextjs-on-vite/](../../examples/vinext-nextjs-on-vite/) に最小の App Router アプリ（Server Component・SSR ページ・Route Handler）を作成した。`npx vinext-cloudflare deploy --dry-run` が通ることを確認済み。記事の `--warm-cache` は ISR などを使うアプリ向けのため、サンプルでは使っていない。

## 関連リンク

- [vinext.dev](https://vinext.dev)（ドキュメント・例・互換性マトリクス）
- [github.com/cloudflare/vinext](https://github.com/cloudflare/vinext)
- [Workers Cache ドキュメント](https://developers.cloudflare.com/workers/cache)
- [How we rebuilt Next.js with AI in one week（Vinext 初公開の記事）](https://blog.cloudflare.com/vinext/)
- サンプル: [examples/vinext-nextjs-on-vite/](../../examples/vinext-nextjs-on-vite/)
- [AstroのGitHub Issue数をゼロへ導くソフトウェアファクトリー](./2026-08-04-astro-issue-triage.md)
- [VoidZero が Cloudflare に加わって4か月](./2026-09-28-voidzero-update.md)
