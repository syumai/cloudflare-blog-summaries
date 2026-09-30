# Forge のご紹介: SDK・CLI・ドキュメントなどを生成するオープンソースのパイプライン

- 原文: [https://blog.cloudflare.com/forge-open-source-generation-pipeline/](https://blog.cloudflare.com/forge-open-source-generation-pipeline/)
- 日本語版の出どころ: Cloudflare公式の日本語版（ja-jp）は確認時点で存在しなかった（404）ため、英語版（en-us）から日本語化して要約している。公開日は英語原文の datePublished に従う。
- 公開日: 2026-09-28
- 位置づけ: Birthday Week 2026 の記事
- 著者: Dimitri Mitropoulos、Matt "TK" Taylor、Samuel Macleod
- 関連: [コードモード: エージェントに1,000トークンのAPI全体を提供](./2026-02-20-code-mode-mcp.md)（OpenAPI仕様の扱い）、[CI Workflows](./2026-08-04-ci-workflows.md)（CI上の処理基盤）、[cf のご紹介](./2026-09-28-cloudflare-cf-cli-launch.md)（Forge で生成された CLI）
- GitHub: [docs/articles/2026-09-28-forge-open-source-generation-pipeline.md](https://github.com/syumai/cloudflare-blog-summaries/blob/main/docs/articles/2026-09-28-forge-open-source-generation-pipeline.md)

![ヘッダー画像](https://blog.cloudflare.com/_emdash/api/media/file/01M3J4EWN0BM1HFWCRCV3ND3H8.png)
*図: 記事ヘッダー画像（出典: Cloudflare Blog https://blog.cloudflare.com/forge-open-source-generation-pipeline/）*

## TL;DR

- Cloudflare が、SDK・CLI・ドキュメント・ライブラリを生成するオープンソースのパイプライン **Forge** を公開した（Apache 2.0、誰でも無料でデプロイ・改変できる）。
- Forge は各チームのAPIリポジトリの **CI 上で動き**、変更を lint し、変更点を強調した CLI・ドキュメント・SDK の **プレビュービルド**を生成する。
- 出力を別の生成器の入力にできる **チェーン可能な transformer** が特徴。OpenAPI から TypeScript SDK を作り、そこから `cf` CLI や Cap'n Web の仕様を生成する。
- Forge はすでに `cf` CLI の生成に使われており、数か月かけて API ドキュメントや SDK（TypeScript / Rust / Python / Go / PHP / Terraform）も Forge で生成する計画。
- 新しい API バージョニング方式（旧クライアントを壊さずにメジャーバージョンを出す）の土台にもなる。

## 背景・課題

Cloudflare の API は 3,500 を超えるオペレーションを持ち、それを支える数百のサービスは Rust・Go・TypeScript・Python など複数の言語で書かれている。全 API を対象にした CLI、SDK、API ドキュメントを作るには、この規模と言語の多様さ、各チームの流儀の違いを受け止められる生成パイプラインが必要だった。

具体的な要求は次のとおり。

- チーム間の調整コストを減らす。
- プロダクトチームが API を変更したとき、マージ前に、Cloudflare 全体の CLI・SDK・ドキュメントサイトの**プレビュービルド**を試せる。
- 変更が生成パイプラインを壊していないことをマージ前に確認できる。
- SDK だけでなく、Cap'n Web から MCP まで、さまざまな出力へ拡張できる。

既存のホスト型サービスも試し、一部は本番でも使ったが、どれも要件を満たさず、サービス終了したものもあったという。あるチームのマージが生成を壊し、別のチームがリリース時に初めて気づく、といった問題が起きていた。

## 発表内容 / アーキテクチャ

### CI 上で動く生成とプレビュー

Forge は、AI コードレビューやテストパイプラインと同様に、各チームの API リポジトリの CI で動く。変更を lint したうえで、変更箇所をハイライトした CLI・ドキュメント・SDK のプレビュービルドを生成し、インストールして試せる。考え方は [Workers Previews](https://blog.cloudflare.com/worker-previews/)（変更ごとに完全なプレビューを作る）と同じで、それを数百サービス・数百リポジトリに分散した API の SDK 生成に当てはめたものだ。

![PRごとのプレビュー生成のイメージ](https://blog.cloudflare.com/_emdash/api/media/file/01M3J4EPCB6S3BJ6C7BY6HKZKN.png)
*図: すべてのプルリクエストでプレビューを生成する（出典: Cloudflare Blog https://blog.cloudflare.com/forge-open-source-generation-pipeline/）*

![CIで問題を検出するイメージ](https://blog.cloudflare.com/_emdash/api/media/file/01M3J4EVDEJ0CVMAT598QFERDT.png)
*図: Forge は下流で問題になる前に CI で検出する（出典: Cloudflare Blog https://blog.cloudflare.com/forge-open-source-generation-pipeline/）*

### あらゆるものを生成できる transformer（Cap'n Web を含む）

Forge の生成器（transformer）は、通常の言語ターゲットを超えた出力を目指している。例として挙げられているのが [Cap'n Web](https://capnweb.com/) で、TypeScript からリモート API をローカルメソッドのように呼べる Cloudflare の RPC システムである。Forge は OpenAPI 仕様から Cap'n Web を直接生成でき、Workers から他の API へのバインディング生成にもつながる（Workers ランタイムのバインディングは RPC メソッドを公開する Worker として実装されているため）。

同じ考え方で、TanStack Query のバインディング、Zod / Valibot スキーマ、MCP サーバーなど、API を使いやすくするものを、実際の API から常に最新の状態で生成できる。Forge の生成器は「ある出力から別の出力へ情報を流す」ために作られている。

![OpenAPI定義からTypeScript SDK、CLI、Cap'n Webへ流れる図](https://blog.cloudflare.com/_emdash/api/media/file/01M3J4ERXXG0DDMKKETZXQQHHX.png)
*図: 元の OpenAPI 定義が TypeScript SDK に組み込まれ、そこから cf CLI と Cap'n Web の仕様が生成される（出典: Cloudflare Blog https://blog.cloudflare.com/forge-open-source-generation-pipeline/）*

### チェーン可能な transformer

Forge は入力・出力の種類を差し替えられるプラガブルな設計で、CLI・SDK・ドキュメントの生成器を備える。ライブラリ固有のパッケージや、ダッシュボード・アプリ全体を生成する transformer を足すこともできる。入力は現在 OpenAPI だが、将来は AsyncAPI、GraphQL、Cap'n Proto、Protobuf なども想定している。

重要なのは**ターゲットのチェーン**をユーザー自身が制御できる点だ。他の生成器でも、Go SDK から CLI や Terraform を作るような連鎖はあるが、その連鎖をユーザーが決められるものは少ない。

`cf` CLI は TypeScript で書かれており、通常 SDK 生成器は TypeScript から CLI を連鎖生成しない。CLI には、`cf dev` や `cf build`（Vite など他パッケージの TypeScript API を呼ぶ）のように、API 呼び出しに対応しない手書きのローカル専用コマンドがある。さらに、OpenAPI だけから CLI とドキュメントを生成すると、手書きコマンドをドキュメントに反映できない。この問題を解く既存ツールが見つからなかったため、Forge に組み込んでいる。

![ターゲットをチェーンして新しい出力を作る図](https://blog.cloudflare.com/_emdash/api/media/file/01M3J4EQPM3GPCFH9MW0W9W0AB.png)
*図: Forge はターゲットをチェーンして新しい出力を作れる（出典: Cloudflare Blog https://blog.cloudflare.com/forge-open-source-generation-pipeline/）*

### ユーザーを壊さずに API を変更する

Cloudflare の v4 API は 10 年間、唯一のメジャーバージョンであり続けている。SemVer 上は新メジャーに値する変更が多数あり、内部の `v2` タグや `beta` 識別子が残ったオペレーションもある。一方で v5 を出せば多くの顧客を置き去りにする。そこで Forge で成果物を出しながら、旧クライアントや SDK を壊さずに新しいメジャー API バージョンを出せる方式を検討している。SDK（TypeScript・Rust・Python・Go・PHP・Terraform）の詳細は近日公開予定で、特に Terraform の移行には慎重に取り組むという。

### 重要なツールは誰にでも開かれているべき

SDK・CLI・ドキュメントは利用者が所有すべきで、生成する場合もどこでも自由に無料で実行できるべきだ、というのが Cloudflare の立場。Forge は Apache 2.0 で公開され、コントリビュートも、非公開環境での独自改変利用も自由にできる。

## コード例

記事中のコードは Cap'n Web の使用例のみ。Forge 自体の設定やコマンドは記事に載っていない。Cap'n Web は、認証・プロフィール取得・友人一覧のプロフィール取得という依存のある呼び出しを、パイプライン化して **1 回のリクエスト**にまとめられる。

```ts
// Authenticate, get the user's ID, fetch their profile, and fetch every friend's profile...
let authed = api.authenticate(apiToken);
let profile = api.getUserProfile(authed.getUserId());
let friends = authed.getFriendIds().map(id => api.getUserProfile(id));

// ...in a *single* request
let [me, myFriends] = await Promise.all([profile, friends]);
```

`authed.getUserId()` のように、まだ結果が届いていない値を次の呼び出しへ渡せる。`await` は最後の `Promise.all` だけなので、ネットワークの往復は 1 回で済む。Forge はこうした Cap'n Web のバインディングを OpenAPI 仕様から生成できる。

## ユースケース

- **プロダクトチームのAPI変更の事前確認**: PR ごとに CLI・ドキュメント・SDK のプレビューをインストールして試し、生成の破損もマージ前に検出する。
- **`cf` CLI の生成**: 生成コードと手書きコマンド（`cf dev` / `cf build`）を組み合わせ、手書き部分もドキュメントに反映する。
- **自社APIからの多様な成果物の生成**: TanStack Query バインディング、Zod / Valibot スキーマ、MCP サーバー、Cap'n Web バインディングなど。
- **自社SDK生成基盤のセルフホスト**: SaaS に依存せず、Apache 2.0 のもとで非公開環境に立てて改変する。
- **API の互換性を保ったバージョン管理**: 旧クライアントを壊さずに新メジャーバージョンを出す方式の実現。

## 所感・ポイント

- 要点は「生成を CI に置き、PR ごとにプレビューを作る」こと。コードレビューやテストと同じ位置に生成パイプラインを置くことで、API 変更者自身が成果物への影響を確かめられる。
- 「出力を別の生成器の入力にする」チェーンをユーザーが制御できるのが設計上の差別化点。CLI の言語を SDK の言語と切り離して選べるという主張は分かりやすい。
- 記事に Forge の設定ファイル形式や CLI の使い方は載っておらず、具体的な使い方は [リポジトリ](https://github.com/cloudflare/forge) を確認する必要がある（人手確認点）。
- 図版の説明文は原文から取得できなかったものがあり、掲載位置から筆者が補っている。
- **サンプル対象外**: Forge は Workers 上で動くものではなく、CI で動く生成パイプラインであり、記事の内容も最小の Workers サンプルとして再現できないため、デプロイ可能なサンプルは作成していません。

## 関連リンク

- [コードモード: エージェントに1,000トークンのAPI全体を提供（本リポジトリ）](./2026-02-20-code-mode-mcp.md)
- [CI Workflows（本リポジトリ）](./2026-08-04-ci-workflows.md)
- Forge（GitHub）: https://github.com/cloudflare/forge
- [cf のご紹介: Cloudflare API 全体を扱えるエージェント向け CLI（本リポジトリ）](./2026-09-28-cloudflare-cf-cli-launch.md)
- cf CLI の記事: https://blog.cloudflare.com/cloudflare-cf-cli-launch/
- Workers Previews: https://blog.cloudflare.com/worker-previews/
- Cap'n Web: https://capnweb.com/
- Workers バインディング: https://developers.cloudflare.com/workers/runtime-apis/bindings/
- TanStack Query: https://tanstack.com/query/
- AsyncAPI: http://asyncapi.com
