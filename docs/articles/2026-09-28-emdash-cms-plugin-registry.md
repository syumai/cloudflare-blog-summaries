# EmDash 1.0: 安全なプラグインレジストリを備えた安定版 CMS

- 原文: [https://blog.cloudflare.com/emdash-cms-plugin-registry/](https://blog.cloudflare.com/emdash-cms-plugin-registry/)（公式の日本語版なし。英語版から日本語化）
- 公開日: 2026-09-28
- 関連: [Cloudflare 2026年度創業者レター](./2026-09-27-cloudflares-2026-annual-founders-letter.md)・[Workers でネイティブ Rust を動かす](./2026-09-28-rust-workers-emscripten-target.md)（いずれも Birthday Week 2026 の記事）、[Cloudflare OS](./2026-08-05-cloudflare-os.md)・[Project Think](./2026-04-15-project-think.md)（Dynamic Workers の関連記事）、[Cloudflare Computer](./2026-08-03-cloudflare-computer.md)（サンドボックス実行の関連記事）
- GitHub: [docs/articles/2026-09-28-emdash-cms-plugin-registry.md](https://github.com/syumai/cloudflare-blog-summaries/blob/main/docs/articles/2026-09-28-emdash-cms-plugin-registry.md)

![ヘッダー画像](https://blog.cloudflare.com/_emdash/api/media/file/01M3D0T7XHPBZM8YB0PX5W78EQ.png)
*図: 記事ヘッダー画像（出典: Cloudflare Blog https://blog.cloudflare.com/emdash-cms-plugin-registry/）*

## TL;DR

- Astro ベースのオープンソース CMS **EmDash が 1.0** に到達した（MIT ライセンス）。エイプリルフールの発表から始まったプロジェクトが、5か月の作り込みを経て本番利用可能になった。
- 新しい**プラグインレジストリ**は AT Protocol（Bluesky と同じ分散ネットワーク）上に構築され、「発行者アカウント」「パッケージ記録」「発見用カタログ」の3つを分離している。
- プラグインは**サンドボックス**で動く。Cloudflare では Dynamic Workers、Node.js では workerd を別プロセスで使い、DB・ファイル・ネットワークへのアクセスを許可制にする。
- Workers for Platforms と組み合わせて Web サイト作成プラットフォームを作れる。組み込みの MCP サーバーでエージェント連携も可能。
- AI サイトビルダーのアルファ版 **EmDash Build** も公開された。

## 背景・課題

従来の CMS（特に WordPress）では、プラグインが本番コンテンツと同じ権限（DB・ファイルシステム・ネットワーク）で動くため、1つのプラグインの脆弱性がサイト全体の危険につながる。また、プラグインの配布は「アカウント」「パッケージ」「カタログ」が単一の運営元に集約されがちで、運営元がゲートキーパーになる。EmDash 1.0 は、この「実行時の権限」と「配布の中央集権」の両方に対する答えとして設計されている。

## 発表内容 / アーキテクチャ

### 1.0 までの道のり

ベータ後の5か月間、データ保護、DB マイグレーション、編集ワークフロー、多言語対応、プラグインの安全性、性能、信頼性が優先された。実運用の例として、Avulux が WordPress から EmDash へ1日足らずで移行した（EmDash Agent Skills を利用）。Cloudflare 自身も 8 月にブログを EmDash へ移行し（Customer Zero）、多言語、メディア管理、最大 5,000 リクエスト/秒のスパイクへの対応が要件として洗い出された。

### オープンな開発

MIT ライセンスで無料。175 人が 1,800 コミットで貢献し、25 言語への翻訳やドキュメントも含まれる。インターンの Noah Pham 氏は 2 人目のメンテナとなり、メディアライブラリと管理画面で 80 件超の変更を行った。「エージェントが人間の開発者を助ける」ようなワークフローを意識して運営されている。

### エコシステム

- **Lexington Themes**: 44 の Astro テーマの EmDash 版を提供
- **Urumi**: WooCommerce の知見を活かした eCommerce プラグインを公開予定
- **Empress**: EmDash を土台にした複数ブランドのサイト管理プラットフォーム

### プラグインレジストリ: 分散された管理

レジストリは、従来まとめて扱われがちだった次の3つを分離する。

1. 発行者アカウント
2. パッケージ記録
3. 発見用カタログ

特徴:

- **AT Protocol** 上に構築（Bluesky を支える分散ネットワーク）
- プラグイン作者は **Atmosphere** のポータブルな ID アカウントを使う
- 公開者がパッケージの所有権とリリース履歴を保持する
- レジストリのモデレーションが影響するのはカタログ上の表示のみで、公開物そのものではない
- 署名付きの Merkle Search Tree により、第三者が独立して検証できる

オープンソースの構成要素は、[aggregator](https://github.com/emdash-cms/emdash/tree/main/apps/aggregator)、[labeler サービス](https://github.com/emdash-cms/emdash/tree/main/apps/labeler)（Workers AI を使用）、[Astro live content loader](https://github.com/emdash-cms/emdash/tree/main/packages/registry-loader)。有料プラグインは Atproto Spaces（アルファ）を使って将来対応する予定。

### 明確な境界を持つプラグイン

EmDash のプラグインは分離されたランタイムで動き、承認された機能だけを使える。

| 機能 | WordPress | EmDash |
|------|-----------|--------|
| DB への直接アクセス | あり | なし（分離ランタイム） |
| ファイルシステム | あり | プライベートなストレージのみ |
| ネットワーク | 無制限 | 承認された宛先のみ |
| プラグイン間アクセス | 全面的 | なし（分離） |

例: 検索インデックス用プラグインは公開済みコンテンツを読み、検索サービスに通信できるが記事は編集できない。画像最適化はメディアを扱えるがユーザーのコンテンツには触れない。公開通知は、イベントを観測してメールを送るが、コンテンツは変更しない。

実装はデプロイ先で異なる。**Cloudflare** ではプラグインが Dynamic Workers として動く。**Node.js** では、オープンソースの [workerd](https://github.com/cloudflare/workerd) を別プロセスとして使う。

### 単一サイトからプラットフォームへ

Workers for Platforms を使えば、Web サイト作成サービスを提供できる。EmDash はコンテンツ層として、管理画面、API・CLI、組み込みの MCP サーバーを提供する。例えばパン屋のオーナーが自然言語で営業時間を変えると、エージェントがコンテンツを読み、更新し、保存する。サンドボックス化されたプラグインにより、マルチテナントでも安全に拡張でき、プラットフォーム側は厳選したプラグインだけか、レジストリ全体かを選べる。

### EmDash Build: AI サイトビルダー（アルファ）

[build.emdashcms.com](http://build.emdashcms.com) で公開。流れは次のとおり。

1. エージェントが自然言語の依頼を受ける
2. EmDash MCP サーバー経由でコンテンツモデルを設計する
3. コンテンツを表示するページを書く
4. サイト所有者は管理画面またはエージェントで編集する
5. 変更は Cloudflare Sandbox 内で git コミットとして記録される
6. 公開コンテンツは Workers for Platforms 上の本番 EmDash に移る

## コード例

記事にあるコードは、セットアップ用のコマンド1行のみ。

```sh
npm create emdash@latest
```

プロジェクトを対話的に作成する。Cloudflare ダッシュボードからのワンクリックデプロイも用意されている。プラグイン開発は[公式ガイド](https://docs.emdashcms.com/plugins/creating-plugins/your-first-plugin/)を参照。

## ユースケース

- **WordPress からの移行**: Avulux は EmDash Agent Skills を使い、1日足らずで移行した。開発者は機能を拡張し、マーケターは直接コンテンツを編集できる。
- **安全なプラグインの導入**: 検索インデックス、画像最適化、公開通知など、必要な権限だけを与えたプラグインを使う。
- **サイト作成プラットフォームの構築**: Workers for Platforms 上で、顧客ごとに EmDash サイトを提供する。
- **エージェントによるコンテンツ更新**: 組み込み MCP サーバーで、営業時間の変更などを自然言語から実行する。
- **AI によるサイト生成**: EmDash Build で、依頼文から構造・ページ・編集環境までを作る。

## 所感・ポイント

- 記事の中心は「実行時の分離（サンドボックス）」と「配布の分散（AT Protocol）」の2軸。前者は Dynamic Workers など Cloudflare が別記事で示してきた技術の実応用で、後者は公開者に主導権を残す設計である。
- モデレーションが「カタログ表示」だけに効く点は、削除権限をレジストリが持たないことを意味し、検閲耐性と安全対策のバランスを取る仕組みとして読める。
- Node.js でも workerd を別プロセスとして使うため、Cloudflare 以外でも同じ分離モデルを使える。
- EmDash Build や有料プラグイン（Atproto Spaces）はアルファ段階の記述なので、詳細な仕様は公式ドキュメントで要確認。
- 本記事の中心は CMS 本体とレジストリで、100行程度の最小構成で再現できる Workers 単体のサンプルではないため、デプロイ可能なサンプル（`examples/`）は作成していません。試すには公式の [Playground](https://try.emdashcms.com/) が手軽です。
- 公式の日本語版は存在しないため、英語版から日本語化した。

## 関連リンク

- リポジトリ: https://github.com/emdash-cms/emdash
- Playground: https://try.emdashcms.com/
- プラグインレジストリ: https://plugins.emdashcms.com/
- ドキュメント: https://docs.emdashcms.com/
- プラグインサンドボックス: https://docs.emdashcms.com/deployment/plugin-sandbox/
- 初めてのプラグイン: https://docs.emdashcms.com/plugins/creating-plugins/your-first-plugin/
- EmDash Build（アルファ）: http://build.emdashcms.com
- workerd: https://github.com/cloudflare/workerd
- サンプル対象外: CMS 本体とレジストリが対象で、最小構成の Worker では再現できないため
