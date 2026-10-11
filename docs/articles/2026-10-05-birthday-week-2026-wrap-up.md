# Birthday Week 2026 で行った発表内容の全て

- 原文: [https://blog.cloudflare.com/birthday-week-2026-wrap-up/](https://blog.cloudflare.com/birthday-week-2026-wrap-up/)（原題: Everything we launched during Birthday Week 2026）
- 日本語版の出どころ: Cloudflare公式の日本語版（`https://blog.cloudflare.com/ja-jp/birthday-week-2026-wrap-up/`）は確認時点で存在しなかった（404）ため、英語版（en-us）から日本語化して要約している。タイトルも筆者による訳。公開日は英語原文の datePublished（2026-10-05T13:00:00Z）に従う。
- 公開日: 2026-10-05
- 著者: Carlos Armada、Meagan Gamache
- 位置づけ: Birthday Week 2026（2026年9月28日〜10月2日）の週まとめ記事。読了目安は原文表記で 4 分
- 関連: [Cloudflare 2026年度創業者レター](./2026-09-27-cloudflares-2026-annual-founders-letter.md)（同じ Birthday Week 2026 の総論）/ [1年後の振り返り: 1.1.1.1 人のインターンが生んだ力](./2026-10-05-one-year-later-1111-interns.md)（Birthday Week のフォローアップ記事）/ [Agents Week 2026 まとめ](./2026-08-10-agents-week-review.md)（同じ形式の週まとめ記事）
- GitHub: [docs/articles/2026-10-05-birthday-week-2026-wrap-up.md](https://github.com/syumai/cloudflare-blog-summaries/blob/main/docs/articles/2026-10-05-birthday-week-2026-wrap-up.md)

![Birthday Week 2026 ヘッダー画像](https://blog.cloudflare.com/_emdash/api/media/file/01M45M6F7F4N2RT9KMZ0Q5DRQT.png)
*図: プレゼントの箱、ケーキ、ロケット、ラバーランプなどが積み重なった Birthday Week の装飾イラスト（出典: Cloudflare Blog, https://blog.cloudflare.com/birthday-week-2026-wrap-up/。原文にキャプションはなく、説明は見た目からの筆者の推定。装飾のため、図としては扱わない）*

## TL;DR

- Cloudflare は 16 周年にあたる 2026 年 9 月 28 日〜10 月 2 日の Birthday Week で、**46 件**の発表を行った。本記事はその全件を日別にまとめた「目次」記事である。
- 日別のテーマは、月曜が「オープンソースへのコミットメント」、火曜が「アプリケーションセキュリティとポスト量子移行」、水曜が「エージェント経済」、木曜が「開発者プラットフォームの拡張」、金曜が「より速く、シンプルで、誰にとっても使いやすいインターネット」。
- 週全体に共通するのは、開発者が形を変えられるオープンなツール、新しい脅威に追いつくセキュリティ、エージェントと作り手の公正な対価、エージェント時代を前提としたインフラ、というメッセージ。
- 週の後に、インターンプログラムの 1 年後の振り返り記事も公開された。EmDash・ポスト量子の可視化・CryptoLabe・Protected Quick Tunnels など、今週の発表にインターンが直接関わっている。
- 本リポジトリには 46 件のうち 45 件の Wiki・スライド・クイズがあり、本ページから相互にたどれる。リポジトリ未収録は 1 件（Workers の ML-KEM / ML-DSA 対応）のみ。

## 背景・課題

記事冒頭で、Matthew と Michelle による今年の創業者レターを引きながら、今年はインターネットの歴史の中でも特に大きな変化が起きた年だと位置づけている。主な論点は次のとおり。

- **自動化トラフィックが人間を上回った**: 初めて、自動化されたトラフィックが人間の活動を超えた。
- **作る人が増え、野心も広がった**: AI により誰もが以前より作れるようになり、インターネットの規模・野心・創造性が拡大している。
- **エージェントの推薦が消費者の選択に影響する**: エージェント主導の推薦が消費行動を左右する様子を見て、新しいビジネスが成功できる余地を作る新たなアプローチが必要だと認識した。

Birthday Week 2026 は、この認識に対して「より良いインターネット」を作るための取り組みを、毎日違う切り口で示した週である。

## 発表内容 / 全体の位置づけ

記事は、週全体の導入文、日別の表（発表名と一文での要約）、結びの 3 部構成になっている。各日の冒頭には、その日の方向性を示す短い説明文が置かれている。

| 日付 | テーマ | 件数 |
|------|--------|------|
| 月曜日（09/28） | オープンソースへのコミットメント | 9 件 |
| 火曜日（09/29） | エージェント型インターネットの安全を守る | 9 件 |
| 水曜日（09/30） | エージェント経済を動かす | 9 件 |
| 木曜日（10/01） | 開発者スタックを Cloudflare にさらに広げる | 9 件 |
| 金曜日（10/02） | より速く、シンプルに、誰にとっても使いやすく | 10 件 |

以下、各日の発表を、記事の表の順に並べる。「詳細記事」列は、本リポジトリにある Wiki へのリンクと英語原文へのリンクである。

### 月曜日（2026-09-28）: オープンソースへのコミットメント

新しい CLI を、それを生成するパイプラインおよび SDK・ドキュメントと一緒に公開し、エージェントと開発者が Cloudflare を使うための基盤と、プロジェクトを支える OSS への取り組みを示した日。

| 発表 | 概要 | 詳細記事 |
|------|------|----------|
| cf のご紹介: Cloudflare API 全体を扱えるエージェント向け CLI | cf CLI。Cloudflare API をそのまま写し取り、JSON ファースト出力と型付き設定で、人とエージェントに一貫したコマンドラインを提供する。 | [Wiki](./2026-09-28-cloudflare-cf-cli-launch.md) / [原文](https://blog.cloudflare.com/cloudflare-cf-cli-launch/) |
| Forge のご紹介: SDK・CLI・ドキュメントなどを生成するオープンソースのパイプライン | Forge。API 定義から SDK・CLI・ドキュメントなどを CI 上で生成する、プラガブルなオープンソースのパイプライン。 | [Wiki](./2026-09-28-forge-open-source-generation-pipeline.md) / [原文](https://blog.cloudflare.com/forge-open-source-generation-pipeline/) |
| EmDash 1.0: 安全なプラグインレジストリを備えた安定版 CMS | EmDash 1.0。Astro ベースのサーバーレス CMS で、プラグインを明示承認した権限のみを持つ分離された Worker サンドボックスで実行する。 | [Wiki](./2026-09-28-emdash-cms-plugin-registry.md) / [原文](https://blog.cloudflare.com/emdash-cms-plugin-registry/) |
| VoidZero が Cloudflare に加わって4か月: オープンソースのJavaScriptツールチェーンを人間にもエージェントにも速く | VoidZero の 4 か月。Vite エコシステムで 80 回超のリリース。商用だった Void プラットフォームは完全オープンソースになる。 | [Wiki](./2026-09-28-voidzero-update.md) / [原文](https://blog.cloudflare.com/voidzero-update/) |
| Vite で動く Next.js アプリケーション: Vinext 1.0 のご紹介 | Vinext 1.0。AI で作った実験を、Vite 上で Next.js アプリを動かす本番品質でポータブルな手段にした。 | [Wiki](./2026-09-28-vinext-nextjs-on-vite.md) / [原文](https://blog.cloudflare.com/vinext-nextjs-on-vite/) |
| エージェント向けブラウザへの道: Kitesurf アップデート | Kitesurf アップデート。Workers ベースのエージェント向けブラウザに WebMCP 対応、高速な DOM 操作、互換性拡大、ターミナル描画が加わる。 | [Wiki](./2026-09-28-kitesurf-update.md) / [原文](https://blog.cloudflare.com/kitesurf-update/) |
| Webはどれくらい速いのか: BEACON で数十億件の実ユーザー計測を探索する | BEACON。主要 1 万サイトの数十億件の匿名化された実ユーザー計測を、公開 BigQuery データセットとして提供する。 | [Wiki](./2026-09-28-how-fast-is-the-web.md) / [原文](https://blog.cloudflare.com/how-fast-is-the-web/) |
| Workers でネイティブ Rust を動かす: wasm-bindgen の新 Emscripten ターゲット | wasm-bindgen の実験的な Emscripten ターゲット。ネイティブ Rust ライブラリ（Tokio 対応に向けた進捗を含む）を Workers へ持ち込める。 | [Wiki](./2026-09-28-rust-workers-emscripten-target.md) / [原文](https://blog.cloudflare.com/rust-workers-emscripten-target/) |
| The Cold Start: Cloudflareのスタートアップ・ピッチコンペ | The Cold Start。初期段階のスタートアップ 5 社が Cloudflare Connect でライブピッチを行い、成長のためのリソースを競う。 | [Wiki](./2026-09-28-introducing-the-cold-start.md) / [原文](https://blog.cloudflare.com/introducing-the-cold-start/) |

### 火曜日（2026-09-29）: エージェント型インターネットの安全を守る

認証局（CA）になる意図の表明に加え、基盤となるインターネット暗号をポスト量子時代へ備えさせる取り組みと、AI 駆動の攻撃に対抗するアプリケーションセキュリティの話題を扱った日。

| 発表 | 概要 | 詳細記事 |
|------|------|----------|
| Cloudflare が「インターネット全体のための認証局」を作る | インターネット全体のための認証局。Universal SSL から 12 年、公開 CA となり無料・自動の証明書発行に耐障害性を加える。 | [Wiki](./2026-09-29-cloudflare-certificate-authority.md) / [原文](https://blog.cloudflare.com/cloudflare-certificate-authority/) |
| Merkle Tree Certificates によるポスト量子認証局の構築 | Merkle Tree Certificates によるポスト量子 CA。証明書・ハンドシェイクの大きなコストを避けつつポスト量子認証を実用化する。 | [Wiki](./2026-09-29-pq-ca-with-mtcs.md) / [原文](https://blog.cloudflare.com/pq-ca-with-mtcs/) |
| AI でポスト量子移行の進路を描く: 社内ツール CryptoLabe による暗号利用の発見 | CryptoLabe。AI でコードベース内の暗号利用を発見・分類し、2029 年までのポスト量子移行完了を目指す。 | [Wiki](./2026-09-29-ai-driven-cryptography-discovery.md) / [原文](https://blog.cloudflare.com/ai-driven-cryptography-discovery/) |
| IPsec に対する量子ダウングレード攻撃の防止 | IPsec の量子ダウングレード防止。IKEv2 のやり取り全体を認証する IETF 拡張で、ポスト量子 IPsec トンネルの格下げを防ぐ。 | [Wiki](./2026-09-29-ipsec-downgrade-protection.md) / [原文](https://blog.cloudflare.com/ipsec-downgrade-protection/) |
| あなたのドメインはポスト量子暗号を使っているか: 自分で確認できるようになりました | ポスト量子の可視化。HTTP Analytics・Log Explorer・Logpush で、リクエストがポスト量子鍵交換を使ったかを確認できる。 | [Wiki](./2026-09-29-post-quantum-visibility.md) / [原文](https://blog.cloudflare.com/post-quantum-visibility/) |
| Cloudflare Application Profiles でポジティブセキュリティを実現する | Application Profiles。HTTP リクエストの期待される構造を学習し、逸脱を特定して「正しい通信」を強制する（ポジティブセキュリティ）。 | [Wiki](./2026-09-29-application-profiles.md) / [原文](https://blog.cloudflare.com/application-profiles/) |
| フロンティア AI モデルで自社の WAF をテストしてみた: 分かったこと | フロンティア AI で自社 WAF をテスト。適応型 AI レッドチームが 6 つの攻撃カテゴリで検知の隙間を見つけ、改善につなげた。 | [Wiki](./2026-09-29-adaptive-ai-waf-testing.md) / [原文](https://blog.cloudflare.com/adaptive-ai-waf-testing/) |
| Threat Signals のご紹介: オープンソース脅威インテリジェンスのためのエージェント型スキル（全 Cloudflare アカウントで無料） | Threat Signals。オープンソースの脅威情報を構造化した指標に変換し WAF ルールにつなぐ。Threat Events Platform は全アカウントに拡大。 | [Wiki](./2026-09-29-threat-signals.md) / [原文](https://blog.cloudflare.com/threat-signals/) |
| AI 時代の適応型アプリケーションセキュリティ: Cloudflare がコード・トラフィック・インテリジェンスをつなぎ、攻撃を止める方法 | AI 時代の適応型アプリケーションセキュリティ。発見・ガバナンス・実行時保護・調査・対応を継続的な学習ループとして接続する枠組み。 | [Wiki](./2026-09-29-ai-era-framework.md) / [原文](https://blog.cloudflare.com/ai-era-framework/) |

### 水曜日（2026-09-30）: エージェント経済を動かす

Pay Per Use と Monetization Gateway ベータにより、クリエイターが自分のコンテンツやサービスを収益化できる新しい経済モデルを支える取り組みを示した日。

| 発表 | 概要 | 詳細記事 |
|------|------|----------|
| インターネットには「第二の読者」がいる: エージェントを迎え入れ、対価を得るためのレール | インターネットには「第二の読者」がいる。エージェントを可視化し、アクセス条件を設定し、利用されたら対価を得る戦略。 | [Wiki](./2026-09-30-agentic-web.md) / [原文](https://blog.cloudflare.com/agentic-web/) |
| Cloudflare Containers を作り直し、エージェントのサンドボックスをスケールさせる | Containers の作り直し。起動の高速化、イメージ・インスタンスの柔軟な選択、スケジューリング制御、永続ワークスペース向けのスナップショット。 | [Wiki](./2026-09-30-faster-agent-sandboxes.md) / [原文](https://blog.cloudflare.com/faster-agent-sandboxes/) |
| Monetization Gateway ベータ: HTTP 402 で AI エージェントに従量課金する | Monetization Gateway ベータ。Cloudflare 配下のリソースに価格を付け、HTTP 402 と x402 でエージェントから支払いを受け取る。 | [Wiki](./2026-09-30-monetization-gateway-beta.md) / [原文](https://blog.cloudflare.com/monetization-gateway-beta/) |
| Pay Per Use: AI があなたの作品を使うなら、対価を受け取るべき | Pay Per Use。参加パブリッシャーは、検証済みの AI バイヤーがコンテンツを利用すると利用レポート・請求・支払いを受け取れる。 | [Wiki](./2026-09-30-pay-per-use.md) / [原文](https://blog.cloudflare.com/pay-per-use/) |
| 人とエージェントのためにドメイン購入をシンプルに: 新しいドメイン検索と Registrar | ドメインの簡素化。新しいドメイン検索と拡張された Registrar API で、人もエージェントも検索・登録・移管・管理しやすくなる。 | [Wiki](./2026-09-30-simplifying-domains.md) / [原文](https://blog.cloudflare.com/simplifying-domains/) |
| User Insights で AI モデルの「過剰利用」を見つける | AI Gateway User Insights。タスクとモデルの適合性・過剰利用を特定し、より小さく安価なモデルで足りる箇所を見つける。 | [Wiki](./2026-09-30-ai-model-overuse-user-insights.md) / [原文](https://blog.cloudflare.com/ai-model-overuse-user-insights/) |
| 本番の問題を検知してエージェントへ直接送る: Workers の Issues | Issues。Workers のエラーをグループ化し、スタックトレース・ログ・トレースをコーディングエージェントや任意の webhook に送る。 | [Wiki](./2026-09-30-real-time-issue-detection.md) / [原文](https://blog.cloudflare.com/real-time-issue-detection/) |
| AI Gateway の Auto Router で AI 支出を削減する | AI Gateway の Auto Router。各リクエストをエッジで分類して適切なモデルへ送り、品質を保ちつつコストを下げる。 | [Wiki](./2026-09-30-auto-router.md) / [原文](https://blog.cloudflare.com/auto-router/) |
| Cloudflare Impact が寄付（提供サービス）1億ドルに到達 | Cloudflare Impact が 1 億ドルに到達。Project Galileo・Athenian Project・Cloudflare for Campaigns などで提供したサービスの累計。 | [Wiki](./2026-09-30-100-million-donations.md) / [原文](https://blog.cloudflare.com/100-million-donations/) |

### 木曜日（2026-10-01）: 開発者スタックを Cloudflare にさらに広げる

データ分析基盤 Cloudflare Basin の一般提供、永続的なサーバーレスイベントストリーム K2、エージェント時代の Git プラットフォームを作るコンペなどで、プラットフォームでできることを広げた日。

| 発表 | 概要 | 詳細記事 |
|------|------|----------|
| Cloudflare Basin のご紹介: オープンなサーバーレスデータプラットフォームが一般提供に | Cloudflare Basin 一般提供。Apache Iceberg と R2 の上で、大規模データの取り込み・管理・クエリを行うサーバーレスデータプラットフォーム。 | [Wiki](./2026-10-01-cloudflare-basin.md) / [原文](https://blog.cloudflare.com/cloudflare-basin/) |
| Support for modern cryptographic algorithms in Workers（**本リポジトリ未収録**） | Workers の最新暗号アルゴリズム対応。ML-KEM と ML-DSA をオプトインでネイティブ Web Crypto から使え、ポスト量子プリミティブを自前でバンドルせずに済む。 | [原文](https://blog.cloudflare.com/workers-ml-kem-ml-dsa-support/)（未収録） |
| AI Search が一般提供（GA）に: マルチモーダル埋め込み・大容量ファイル・OCR・課金開始 | AI Search 一般提供。ビジュアル検索、スキャン PDF の OCR、より大きなファイル、任意のチャットモデルへの対応。 | [Wiki](./2026-10-01-ai-search-ga.md) / [原文](https://blog.cloudflare.com/ai-search-ga/) |
| 次の Git プラットフォームを Cloudflare 上で作ってほしい: Artifacts のオープンベータと開発コンペ | 次の Git プラットフォームを作ってほしい。Artifacts がオープンベータになり、AI エージェント時代の Git を作るコンペを開催。 | [Wiki](./2026-10-01-next-git-platform-on-cloudflare.md) / [原文](https://blog.cloudflare.com/next-git-platform-on-cloudflare/) |
| Cloudflare K2 のご紹介: サーバーレスなイベントストリーム | Cloudflare K2。R2 上の永続的で順序付きのイベントストリーム。ブローカークラスタの運用なしにプロデューサーとコンシューマーを分離する。 | [Wiki](./2026-10-01-cloudflare-k2-streams.md) / [原文](https://blog.cloudflare.com/cloudflare-k2-streams/) |
| Cloudflare OS: 会社のエージェントワークスペースを、マネージドで提供 | Cloudflare OS のマネージド提供。組織のデータやシステムに接続したエージェントワークスペースで、フルマネージド版はウェイトリスト受付中。 | [Wiki](./2026-10-01-managed-cloudflare-os.md) / [原文](https://blog.cloudflare.com/managed-cloudflare-os/) |
| Workers KV Instant のご紹介: Quicksilver で動く、即時反映・低レイテンシの KV モード | Workers KV Instant。Quicksilver で動き、300 拠点超で p99 読み取り 2 ミリ秒未満・高速なグローバル複製を、従来の KV API のまま実現。 | [Wiki](./2026-10-01-workers-kv-instant.md) / [原文](https://blog.cloudflare.com/workers-kv-instant/) |
| 1年後のソブリンAIと「選択」をめぐる戦い: 欧州の2つのオープンモデルを Workers AI に、AI防御ワークショップも開始 | 1 年後のソブリン AI。ローカルのオープンモデルの選択肢とモデル非依存のセキュリティツールを広げ、孤立せずに AI 主権を追える。 | [Wiki](./2026-10-01-sovereign-ai-choice-one-year-later.md) / [原文](https://blog.cloudflare.com/sovereign-ai-choice-one-year-later/) |
| Clef のご紹介: オープンソースの decision model と、新しい RL ファインチューニング基盤 | Clef。高速な分類やエージェントワークフロー向けのオープンソース decision model（Clef・Clef-flash）と、RL ファインチューニング基盤。 | [Wiki](./2026-10-01-clef-decision-models.md) / [原文](https://blog.cloudflare.com/clef-decision-models/) |

### 金曜日（2026-10-02）: より速く、シンプルに、誰にとっても使いやすく

Cloudflare Observability の大型アップデートと Cloudflare Traces、ネットワーク性能の改善、市民社会組織への支援などで締めくくった日。

| 発表 | 概要 | 詳細記事 |
|------|------|----------|
| Cloudflare Observability の 8 つの大型アップデート: ログ・トレース・分析・アラートを 1 つのプラットフォームへ | Observability の 8 つの大型アップデート。ログ・トレース・分析・アラート・ダッシュボード・クエリ・テレメトリ出力を 1 つのプラットフォームに統合し、料金も簡素化。 | [Wiki](./2026-10-02-one-observability-platform.md) / [原文](https://blog.cloudflare.com/one-observability-platform/) |
| Cloudflare Traces の紹介: プラットフォーム全体でリクエストを追跡する | Cloudflare Traces。エージェントや SDK なしで、セキュリティルール・変換・キャッシュ・Workers・サービス・オリジンまで、リクエスト単位で可視化する。 | [Wiki](./2026-10-02-cloudflare-tracing.md) / [原文](https://blog.cloudflare.com/cloudflare-tracing/) |
| 「全員が使える」誓約のアップデート: Enterprise 専用だった機能は今どこまで開放されたか | 「全員が使える」誓約のアップデート。Logpush・マルチアカウントガバナンス・上限引き上げなどが、より多くのプランで使えるようになった。 | [Wiki](./2026-10-02-enterprise-for-all-update.md) / [原文](https://blog.cloudflare.com/enterprise-for-all-update/) |
| Cloudflare OHTTP Gateway の発表: Cloudflare のプライバシー保護インフラを利用しやすく | OHTTP Gateway。セルフサービスのクローズドベータが始まり、役割を区別するため Privacy Gateway は OHTTP Relay に改称。 | [Wiki](./2026-10-02-announcing-cloudflare-ohttp-gateway.md) / [原文](https://blog.cloudflare.com/announcing-cloudflare-ohttp-gateway/) |
| 糸をたどる: アカウント不正を調査するための新しいダッシュボード（Account Abuse Protection） | アカウント不正の調査ダッシュボード。ステートフルな分析とプライバシー保護の Hashed User ID で、クレデンシャルスタッフィングや偽アカウント作成を調査する。 | [Wiki](./2026-10-02-account-abuse-protection-dashboard.md) / [原文](https://blog.cloudflare.com/account-abuse-protection-dashboard/) |
| Protected Quick Tunnels: アカウント不要で、次の開発プロジェクトにシンプルな認証を | Protected Quick Tunnels。メール認証により、Cloudflare アカウントなしでローカルアプリを特定の相手やドメインと共有できる。 | [Wiki](./2026-10-02-protected-quick-tunnels.md) / [原文](https://blog.cloudflare.com/protected-quick-tunnels/) |
| 社会のために作る: 市民社会組織は Cloudflare で何を自動化しているか | 市民社会組織の自動化。人権や公益を守る活動のスケールに、Cloudflare の開発者プラットフォームが使われている。 | [Wiki](./2026-10-02-civil-society-automation.md) / [原文](https://blog.cloudflare.com/civil-society-automation/) |
| 2026 Birthday Week: ネットワーク性能アップデート | ネットワーク性能アップデート。拡張した実ユーザー計測の手法で、上位 1,000 ネットワークの 74% で最速のプロバイダーとなった。 | [Wiki](./2026-10-02-network-performance-birthday-week-2026.md) / [原文](https://blog.cloudflare.com/network-performance-birthday-week-2026/) |
| AI Gateway 経由の Web Search API の紹介: エージェントに最新の Web 情報を、行儀の良いクローラーから | AI Gateway の Web Search API。複数プロバイダーの最新の Web 情報を、REST API・Workers バインディング・顧客管理キーでモデル呼び出しに取り込む。 | [Wiki](./2026-10-02-introducing-web-search-api.md) / [原文](https://blog.cloudflare.com/introducing-web-search-api/) |
| Streamline: Cloudflare Stream と Workers でつくるカスタム動画パイプライン | Streamline。Workers・Durable Objects・コンテナ化したメディアエンジンを組み合わせる、連続動画パイプラインのオープンソース例。 | [Wiki](./2026-10-02-streamline.md) / [原文](https://blog.cloudflare.com/streamline/) |

### 週の前後の記事

| 記事 | 位置づけ | 詳細記事 |
|------|----------|----------|
| Cloudflare 2026年度創業者レター | 週の総論。本記事の導入文でも言及されている | [Wiki](./2026-09-27-cloudflares-2026-annual-founders-letter.md) / [原文](https://blog.cloudflare.com/cloudflares-2026-annual-founders-letter/) |
| 1年後の振り返り: 1.1.1.1 人のインターンが生んだ力 | 週のフォローアップ。EmDash・ポスト量子の可視化・CryptoLabe・Protected Quick Tunnels にインターンが直接貢献した | [Wiki](./2026-10-05-one-year-later-1111-interns.md) / [原文](https://blog.cloudflare.com/one-year-later-1111-interns/) |

## 結び: 次の章を一緒に

記事は、今週の発表に共通する一貫したテーマとして「インターネットは、人々が創り、貢献し、成功する機会を広げ続けるべきだ」と述べる。具体的には、開発者が形を変えられるオープンなツール、新しい脅威に追いつくセキュリティ、エージェントとその成果を利用される人々との公正な交換、エージェント時代のために設計されたインフラの 4 点である。16 年間、開発者・クリエイター・研究者・顧客・パートナー・オープンソースコミュニティとともに作ってきたことへの謝意で締めくくられている。

## コード例

本記事は週の発表をまとめた目次記事であり、コード例（コードブロック）は含まれない。代わりに、上の日別の表で各発表の位置づけと詳細記事を整理している。実装レベルの詳細は、表から各 Wiki（コード例を含むものもある）をたどること。

## ユースケース

製品の利用場面を扱う記事ではないため、個別のユースケースは書かれていない。本記事の使い方としては次のような読み方ができる。

- **領域から探す**: セキュリティ・エージェント経済・データ基盤・可観測性など、関心のある領域を日別のテーマから探す。
- **一文要約で絞る**: 表の一文要約で内容を把握し、必要なものだけ個別の Wiki やスライドで深掘りする。
- **見逃しの確認**: 週に 46 件と多いため、見逃した発表を一覧から拾う。

## 所感・ポイント

- 5 日間の構成は、オープンソース → セキュリティとポスト量子 → エージェント経済 → 開発者プラットフォーム → 可観測性と性能・アクセシビリティという順に並んでおり、単発の発表の寄せ集めというより、エージェント時代のインターネットを下から上まで一通り見せる構成になっている。
- ポスト量子関連は、火曜に 4 件（PQ CA、CryptoLabe、IPsec、可視化）、木曜に Workers の ML-KEM / ML-DSA 対応と、週をまたいで続く。移行を進める側（CA・社内ツール・Workers の API）と、見える化する側（Analytics）の両方から出ている点が特徴。
- 水曜の Monetization Gateway と Pay Per Use は、販売側（HTTP 402 による課金）と、パブリッシャー側（利用レポートと支払い）を別々に扱っており、8 月の Agents Week のウォレット・アイデンティティの発表と合わせて読むと全体像がつかみやすい。
- 木曜と金曜は、Basin・K2・KV Instant といったストレージ／データ系と、Traces・Observability といった可観測性系が連続しており、データを貯める・流す・見るの流れで読める。
- 本ページの件数は原文表記の「46 件」で、日別の内訳は月 9・火 9・水 9・木 9・金 10 件である。
- **サンプル対象外**: 週まとめ記事であり、個別技術を体験する対象ではないため、デプロイ可能なサンプルは作成していない。各発表の詳細記事・サンプルを参照。

## 関連リンク

- 原文（週まとめ記事）: https://blog.cloudflare.com/birthday-week-2026-wrap-up/
- 創業者レター: https://blog.cloudflare.com/cloudflares-2026-annual-founders-letter/
- インターンプログラムの 1 年後の振り返り: https://blog.cloudflare.com/one-year-later-1111-interns/
- Birthday Week タグ: https://blog.cloudflare.com/tag/birthday-week/

### 月曜日
- https://blog.cloudflare.com/cloudflare-cf-cli-launch/
- https://blog.cloudflare.com/forge-open-source-generation-pipeline/
- https://blog.cloudflare.com/emdash-cms-plugin-registry/
- https://blog.cloudflare.com/voidzero-update/
- https://blog.cloudflare.com/vinext-nextjs-on-vite/
- https://blog.cloudflare.com/kitesurf-update/
- https://blog.cloudflare.com/how-fast-is-the-web/
- https://blog.cloudflare.com/rust-workers-emscripten-target/
- https://blog.cloudflare.com/introducing-the-cold-start/

### 火曜日
- https://blog.cloudflare.com/cloudflare-certificate-authority/
- https://blog.cloudflare.com/pq-ca-with-mtcs/
- https://blog.cloudflare.com/ai-driven-cryptography-discovery/
- https://blog.cloudflare.com/ipsec-downgrade-protection/
- https://blog.cloudflare.com/post-quantum-visibility/
- https://blog.cloudflare.com/application-profiles/
- https://blog.cloudflare.com/adaptive-ai-waf-testing/
- https://blog.cloudflare.com/threat-signals/
- https://blog.cloudflare.com/ai-era-framework/

### 水曜日
- https://blog.cloudflare.com/agentic-web/
- https://blog.cloudflare.com/faster-agent-sandboxes/
- https://blog.cloudflare.com/monetization-gateway-beta/
- https://blog.cloudflare.com/pay-per-use/
- https://blog.cloudflare.com/simplifying-domains/
- https://blog.cloudflare.com/ai-model-overuse-user-insights/
- https://blog.cloudflare.com/real-time-issue-detection/
- https://blog.cloudflare.com/auto-router/
- https://blog.cloudflare.com/100-million-donations/

### 木曜日
- https://blog.cloudflare.com/cloudflare-basin/
- https://blog.cloudflare.com/workers-ml-kem-ml-dsa-support/（本リポジトリ未収録: Support for modern cryptographic algorithms in Workers）
- https://blog.cloudflare.com/ai-search-ga/
- https://blog.cloudflare.com/next-git-platform-on-cloudflare/
- https://blog.cloudflare.com/cloudflare-k2-streams/
- https://blog.cloudflare.com/managed-cloudflare-os/
- https://blog.cloudflare.com/workers-kv-instant/
- https://blog.cloudflare.com/sovereign-ai-choice-one-year-later/
- https://blog.cloudflare.com/clef-decision-models/

### 金曜日
- https://blog.cloudflare.com/one-observability-platform/
- https://blog.cloudflare.com/cloudflare-tracing/
- https://blog.cloudflare.com/enterprise-for-all-update/
- https://blog.cloudflare.com/announcing-cloudflare-ohttp-gateway/
- https://blog.cloudflare.com/account-abuse-protection-dashboard/
- https://blog.cloudflare.com/protected-quick-tunnels/
- https://blog.cloudflare.com/civil-society-automation/
- https://blog.cloudflare.com/network-performance-birthday-week-2026/
- https://blog.cloudflare.com/introducing-web-search-api/
- https://blog.cloudflare.com/streamline/

### 本リポジトリ未収録の発表

- Support for modern cryptographic algorithms in Workers（木曜）: https://blog.cloudflare.com/workers-ml-kem-ml-dsa-support/ — 本ページでは外部リンクのみとしている。
