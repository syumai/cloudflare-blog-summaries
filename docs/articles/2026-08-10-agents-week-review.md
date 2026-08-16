# Agents Week 2026で行った発表内容の全て

- 原文: [https://blog.cloudflare.com/ja-jp/agents-week-review-august-2026/](https://blog.cloudflare.com/ja-jp/agents-week-review-august-2026/)（英語版: [https://blog.cloudflare.com/agents-week-review-august-2026/](https://blog.cloudflare.com/agents-week-review-august-2026/)）
- 公開日: 2026-08-10
- 関連: [@cloudflare/computer 記事](./2026-08-03-cloudflare-computer.md)
- GitHub: [docs/articles/2026-08-10-agents-week-review.md](https://github.com/syumai/cloudflare-blog-summaries/blob/main/docs/articles/2026-08-10-agents-week-review.md)

![Agents Week 2026 ヘッダー画像](https://blog.cloudflare.com/_image?href=https%3A%2F%2Fblog.cloudflare.com%2F_emdash%2Fapi%2Fmedia%2Ffile%2F01KZEF2H4G3BD74C5TP4BWMS76.png&w=1999&h=1125&f=webp&fit=cover&position=center)
*図: Agents Week 2026 ヘッダー画像（出典: Cloudflare Blog, https://blog.cloudflare.com/ja-jp/agents-week-review-august-2026/）*

## TL;DR

- Cloudflare は 2026年8月3日〜7日の5日間、「Agents Week」として AI エージェント関連の発表を約26件連続で行った。
- テーマは1日ごとに区切られており、月曜は実行環境とインフラ、火曜はエージェント開発ライフサイクル（ADLC）、水曜は Zero Trust とセキュリティ、木曜はエージェント型インターネット、金曜は実装と現実（エコシステム）という構成。
- 全体に共通するメッセージは、「エージェント経済」の課題はモデル性能だけでは解決できず、アイデンティティ・通信・オーケストレーション・メモリ・オブザーバビリティ・セキュリティといった基盤全体の整備が必要だという点。
- 目玉発表は `@cloudflare/computer`（エージェント専用実行環境）、Agent Development Lifecycle（ADLC）、Agent Access Model、WebMCP、AEO（Answer Engine Optimization）など多岐にわたる。
- 本記事はその5日間・全発表への「目次」的なまとめ記事であり、個々の発表は詳細記事にリンクされている。

## 背景・課題

エージェントの能力が急速に向上する一方で、Cloudflare はエージェント経済（agentic economy）を成立させる上でのボトルネックが「モデルそのもの」ではなく、その周辺の基盤機能にあると位置づけている。具体的には次のような課題が挙げられている。

- **アイデンティティ（ID）**: エージェントが「誰として」「どの権限で」動作しているかを安全に検証・管理する仕組みが不足している。
- **通信**: エージェント同士、あるいはエージェントとサービス間の低レイテンシ・高信頼な通信（TCP・gRPC・RPC など）が未整備。
- **オーケストレーション**: 試作段階のエージェントを本番運用に載せるための開発ライフサイクル（デプロイ、承認、ロールバック、デバッグ）が確立されていない。
- **メモリ・オブザーバビリティ**: エージェントの動作を追跡・デバッグ・監査するためのトレーシングや使用量可視化の仕組みが不十分。
- **セキュリティ**: エージェントによる不正操作やなりすましを防ぐためのアクセス制御・監視の仕組みが必要。

Agents Week 2026 は、この「モデル以外」の課題に対する Cloudflare のプラットフォーム全体からの回答を、1週間かけて連続発表する形で示したイベントである。

## 発表内容 / アーキテクチャ

### 月曜日（2026-08-03）: 実行環境とインフラ

エージェントが実際に「動く」ための土台となる実行環境・言語間連携・コスト可視化・通信プロトコルに関する発表。

| 発表 | 概要 | 詳細記事 |
|------|------|----------|
| AIエージェントに必要なのはコンテナではなくコンピューター — 「@cloudflare/computer」のご紹介 | エージェントのタスクに応じてアイソレート実行とコンテナ実行を切り替えられる、新しい実行環境。SQLite バックエンドの仮想ファイルシステムを介して両バックエンドが同じファイル群を共有する。 | [Wiki](./2026-08-03-cloudflare-computer.md) / [原文](https://blog.cloudflare.com/ja-jp/cloudflare-computer/) |
| Workers RPC が Python と JavaScript 間で利用可能に | Python Workers と JavaScript Workers が RPC 経由で直接メソッド呼び出しできるようになり、複数言語で書かれたエージェントコンポーネントを組み合わせやすくなった。 | [Wiki](./2026-08-03-python-workers-rpc.md) / [原文](https://blog.cloudflare.com/python-workers-rpc/) |
| より小さく、より速く、より安全に：Kimi と GLM を大規模に実行 | オープンウェイトの大規模モデル（Kimi・GLM）を、コストと安全性を両立させながら大規模に提供する方法を模索した発表。 | [Wiki](./2026-08-03-smaller-faster-safer-models.md) / [原文](https://blog.cloudflare.com/smaller-faster-safer-models/) |
| Billable Usage API を提供開始 | エージェントやアプリケーションが自身の課金対象の使用量をプログラムから取得できる API。コスト管理をエージェント自身に組み込める。 | [Wiki](./2026-08-03-billable-usage-api.md) / [原文](https://blog.cloudflare.com/ja-jp/billable-usage-api/) |
| Cloudflare Workers と Containers がインバウンド TCP 接続と gRPC をサポート | Workers / Containers が外部からの TCP 接続と gRPC を直接受け付けられるようになり、リアルタイム音声エージェントなど低レイテンシ通信が必要なユースケースに対応。 | [Wiki](./2026-08-03-grpc-workers.md) / [原文](https://blog.cloudflare.com/grpc-workers/) |

### 火曜日（2026-08-04）: エージェント開発ライフサイクル（ADLC）

「エージェントを試作から本番運用にどう乗せるか」という開発・運用プロセスに関する発表群。SDLC（Software Development Lifecycle）に対する ADLC（Agent Development Lifecycle）というコンセプトが提示された。

| 発表 | 概要 | 詳細記事 |
|------|------|----------|
| Cloudflare にエージェント開発ライフサイクルの時代が到来 | 従来の SDLC に代わる概念として ADLC を提案。エージェントの試作・検証・本番移行を支えるライフサイクル全体像を提示。 | [Wiki](./2026-08-04-agent-development-lifecycle.md) / [原文](https://blog.cloudflare.com/ja-jp/agent-development-lifecycle/) |
| Cloudflare Agents の紹介 | トレース・再実行・承認（approval）機能を備え、本番環境でのエージェント運用を管理できるフレームワーク／プラットフォーム。 | [Wiki](./2026-08-04-agents-on-cloudflare.md) / [原文](https://blog.cloudflare.com/agents-on-cloudflare/) |
| エージェントがローカルトレースで Workers をデバッグ可能に | 分散トレーシングの情報をエージェントに与えることで、デプロイ前に問題を検出・修正できるようにする仕組み。 | [Wiki](./2026-08-04-local-tracing.md) / [原文](https://blog.cloudflare.com/local-tracing/) |
| Cloudflare Wallets を発表 | エージェントが発展しつつある「エージェント経済」の参加者として、安全に取引（決済）を行うためのウォレット機能。 | [Wiki](./2026-08-04-wallets.md) / [原文](https://blog.cloudflare.com/ja-jp/wallets/) |
| 数百万のリポジトリで CI/CD を実行 | コードベースの構成からパイプラインを記述し、失敗時にエージェントが自律的に修復を試みる CI/CD の仕組み。 | [Wiki](./2026-08-04-ci-workflows.md) / [原文](https://blog.cloudflare.com/ci-workflows/) |
| Cloudflare が AI を活用してエンジニアリング標準を徹底する方法 | 開発ワークフロー全体（レビュー・規約チェックなど）に AI を組み込み、エンジニアリング標準の遵守を自動化する社内事例。 | [Wiki](./2026-08-04-engineering-standards-enforcement.md) / [原文](https://blog.cloudflare.com/engineering-standards-enforcement/) |
| Astro の GitHub Issue をゼロにするソフトウェアファクトリーを構築した方法 | Issue の自動分類・トリアージにより、OSS プロジェクト（Astro）の保守作業を最小化し生産性を向上させた事例。 | [Wiki](./2026-08-04-astro-issue-triage.md) / [原文](https://blog.cloudflare.com/astro-issue-triage/) |

### 水曜日（2026-08-05）: Zero Trust とセキュリティ

エージェントが安全にリソースへアクセスし、企業内で監督可能な形で動作するための Zero Trust 拡張とセキュリティ機能。

| 発表 | 概要 | 詳細記事 |
|------|------|----------|
| エージェントアクセスモデル（Agent Access Model） | エージェントが人間やサービスに代わって安全にリソース・サービスへアクセスするためのアクセス制御フレームワーク。 | [Wiki](./2026-08-05-the-agent-access-model.md) / [原文](https://blog.cloudflare.com/the-agent-access-model/) |
| Cloudflare OS で Cloudflare の働き方を見直す | 社内の業務運営プロセスに AI エージェントを組み込みつつ、効率性と人間による監督を両立させた社内事例。 | [Wiki](./2026-08-05-how-we-use-ai-with-cloudflare-os.md) / [原文](https://blog.cloudflare.com/how-we-use-ai-with-cloudflare-os/) |
| Cloudflare OS：エージェント、アプリ、作業のためのオープンプラットフォーム | Cloudflare OS をオープンなプラットフォームとして公開し、他チームがアプリ構築・業務自動化・安全なアクセス管理に利用できるようにした発表。 | [Wiki](./2026-08-05-cloudflare-os.md) / [原文](https://blog.cloudflare.com/ja-jp/cloudflare-os/) |
| ID 情報に基づく分析で、不正な AI の利用を検出 | エージェントのトラフィックを実ユーザーの ID 情報と関連付けて分析し、異常な利用や不正利用を検出する仕組み。 | [Wiki](./2026-08-05-identity-aware-ai-gateway.md) / [原文](https://blog.cloudflare.com/ja-jp/identity-aware-ai-gateway/) |
| WriteGuard：MCP サーバーをきめ細かく制御 | MCP サーバー経由の書き込み系（リスクの高い）呼び出しを制御し、意図しない変更を防ぐための保護機能。 | [Wiki](./2026-08-05-mcp-portal-writeguard-private-beta.md) / [原文](https://blog.cloudflare.com/mcp-portal-writeguard-private-beta/) |

### 木曜日（2026-08-06）: エージェント型インターネット

エージェントが Web を読み取り・発見・呼び出し・決済まで行える「エージェント型インターネット」を実現するための、プロトコルとインフラの発表。

| 発表 | 概要 | 詳細記事 |
|------|------|----------|
| 読み取り、発見、呼び出し、決済が可能なオープンなエージェンティックインターネットの構築 | パブリッシャーがコンテンツへの管理権を維持したまま、エージェントが必要な情報に適切にアクセスできるオープンな仕組みの全体構想。 | [Wiki](./2026-08-06-the-agentic-internet.md) / [原文](https://blog.cloudflare.com/ja-jp/the-agentic-internet/) |
| あらゆる Web サイトに WebMCP インターフェースを提供 | 既存の Web サイトにエージェントが発見・利用しやすい MCP インターフェース（WebMCP）を付与し、エージェントとの連携を簡素化。 | [Wiki](./2026-08-06-webmcp.md) / [原文](https://blog.cloudflare.com/webmcp/) |
| ランク付けから推奨へ：AI エージェント時代でサイトを成功に導く準備を整える | 従来の SEO から、AI エージェントに推奨されるための最適化（AEO: Answer Engine Optimization）への進化を提案。 | [Wiki](./2026-08-06-aeo.md) / [原文](https://blog.cloudflare.com/ja-jp/aeo/) |
| Kitesurf のご紹介 | メモリと CPU 使用量を抑えることを重視して設計された、エージェント専用の軽量ブラウザ。 | [Wiki](./2026-08-06-kitesurf.md) / [原文](https://blog.cloudflare.com/kitesurf/) |
| MCP の次世代バージョン（MCPv2） | MCP プロトコルの次世代版として、サーバーの展開・拡張を簡素化する仕様の発表。 | [Wiki](./2026-08-06-mcp-v2.md) / [原文](https://blog.cloudflare.com/mcp-v2/) |
| Cloudflare AI Search | ファイルや Web サイトのコンテンツを変換し、エージェントが利用しやすい検索エンジンとして提供する機能。 | [Wiki](./2026-08-06-ai-search-easier.md) / [原文](https://blog.cloudflare.com/ai-search-easier/) |

### 金曜日（2026-08-07）: 実装と現実

エージェントが実際にインターネット上で動作する際の振る舞いの評価、AI 基盤サービスの統合、そしてエコシステムを支えるコミュニティ・ツールに関する発表。

| 発表 | 概要 | 詳細記事 |
|------|------|----------|
| エージェントが動くインターネットで、「良い振る舞い」と「悪い振る舞い」を見極める | 従来の bot 対策の考え方を、継続的な信頼評価（continuous trust evaluation）へと転換する取り組み。 | [Wiki](./2026-08-07-good-and-bad-agentic-behaviors.md) / [原文](https://blog.cloudflare.com/ja-jp/good-and-bad-agentic-behaviors/) |
| Workers AI と AI Gateway を単一の AI コントロールプレーンに統合 | 統一されたバインディング・ウォレット・ダッシュボードから、モデル呼び出しを一元管理できるように統合。 | [Wiki](./2026-08-07-workers-ai-gateway-unification.md) / [原文](https://blog.cloudflare.com/workers-ai-gateway-unification/) |
| Cloudflare Ambassadors と Community Engineers を発表 | コミュニティリーダーや OSS メンテナー向けの新プログラムを発表し、今後2年間でオープンソースに追加で100万ドルを提供すると表明。 | [Wiki](./2026-08-07-community-program-refresh.md) / [原文](https://blog.cloudflare.com/community-program-refresh/) |
| Radar Researcher のご紹介 | 自然言語での問いかけによってインターネット関連データを分析できる AI ツール。 | [Wiki](./2026-08-07-introducing-radar-researcher.md) / [原文](https://blog.cloudflare.com/introducing-radar-researcher/) |

![Agents Week 2026 本文図](https://blog.cloudflare.com/_emdash/api/media/file/01KZX2BFZ7V9FZT5F9N1CJG900.png)
*図: 週の発表を貫くテーマを示す図（出典: Cloudflare Blog, https://blog.cloudflare.com/ja-jp/agents-week-review-august-2026/）*

## 所感・ポイント

- 5日間の構成は「実行環境 → 開発ライフサイクル → セキュリティ → インターネット全体への波及 → 現実世界での運用」という順に並んでおり、単発の新機能発表というより、エージェントが本番で安全に動くための「積み重ね」を意識した構成になっている点が特徴的。
- `@cloudflare/computer` は単体でも大きなトピックであり、実行バックエンドの使い分けという発想は、他社のエージェント実行基盤（サンドボックス型が主流）と比較しても独自性が強い。詳細は別 Wiki ページ（[2026-08-03-cloudflare-computer.md](./2026-08-03-cloudflare-computer.md)）を参照。
- ADLC（Agent Development Lifecycle）という言葉の提示は、SDLC の延長線上にエージェント固有のライフサイクル管理が必要であるという問題提起として興味深く、CI/CD・トレーシング・承認フローなど複数の発表がこの概念を具体化する形で連動している。
- Agent Access Model・WriteGuard・ID 情報ベースの分析など、水曜日のセキュリティ関連発表は「エージェントに何をどこまで許可するか」というアクセス制御の細やかさを重視しており、Zero Trust の考え方をエージェント向けに拡張した内容といえる。
- 木曜日の WebMCP・AEO・MCPv2 などは、Web サイト側が「エージェントに読まれること」を前提に設計を変える必要性を示しており、SEO 対策の延長として AEO を捉える視点は日本語圏の開発者・マーケターにも参考になりそうである。
- 本記事自体には具体的なコード例は含まれておらず、各発表の位置づけを俯瞰する「目次」としての役割が強い。実装レベルの詳細を知りたい場合は、各発表の詳細記事（あるいは本リポジトリの個別 Wiki ページ）を参照する必要がある。

> **Workers サンプル**: 対象外（本記事は週内発表のまとめ記事であり、個別技術を体験する対象ではないため。各発表の詳細記事・サンプルを参照）

## 注目ピックアップ

Agents Week 2026 で発表された約26件の中でも、特に読む価値が高いと考える5件を、推薦理由とともに挙げる。

- **[@cloudflare/computer](./2026-08-03-cloudflare-computer.md)**（[スライド](../../slides/cloudflare-computer/slides.md)） — アイソレートとコンテナを動的に使い分けるハイブリッド実行環境。数十億規模のエージェントをどう安価に動かすかという、Agents Week全体を貫くスケーリング課題への最も具体的な回答であり、週の目玉として真っ先に読む価値がある。
- **[WebMCP](./2026-08-06-webmcp.md)**（[スライド](../../slides/webmcp/slides.md)） — オリジンのコード変更ゼロでサイトをエージェント対応にする発想は、AEOやSEOの延長として今後の実務に直結しやすい。ブラウザ標準としての広がりにも注目したい。
- **[Cloudflare OS](./2026-08-05-cloudflare-os.md)**（[スライド](../../slides/cloudflare-os/slides.md)） — 「エージェントは最初はどのアクセス権も持たない」というZero Trustの徹底と、参照履歴に基づく情報漏えい防止（Gatekeeper）は、社内でエージェントを本格運用する際の権限設計の指針として参考になる。
- **[Kitesurf](./2026-08-06-kitesurf.md)**（[スライド](../../slides/kitesurf/slides.md)） — Chromiumを使わずWorkers上で完全に動くエージェント専用ブラウザという発想は独自性が高く、CPU・メモリ効率の実測値（3〜7倍）とWPT準拠の透明性ある性能開示が説得力を持たせている。
- **[Cloudflare Wallets](./2026-08-04-wallets.md)**（[スライド](../../slides/wallets/slides.md)） — エージェントに「安定したID」と「決済手段」を与えるという発想は、エージェント経済が実際にお金を動かすフェーズに入りつつあることを象徴しており、Monetization Gateway・Identityと合わせた全体戦略の理解に役立つ。

## 関連リンク

- 原文（週まとめ記事）: https://blog.cloudflare.com/ja-jp/agents-week-review-august-2026/

### 月曜日
- https://blog.cloudflare.com/ja-jp/cloudflare-computer/
- https://blog.cloudflare.com/python-workers-rpc/
- https://blog.cloudflare.com/smaller-faster-safer-models/
- https://blog.cloudflare.com/ja-jp/billable-usage-api/
- https://blog.cloudflare.com/grpc-workers/

### 火曜日
- https://blog.cloudflare.com/ja-jp/agent-development-lifecycle/
- https://blog.cloudflare.com/agents-on-cloudflare/
- https://blog.cloudflare.com/local-tracing/
- https://blog.cloudflare.com/ja-jp/wallets/
- https://blog.cloudflare.com/ci-workflows/
- https://blog.cloudflare.com/engineering-standards-enforcement/
- https://blog.cloudflare.com/astro-issue-triage/

### 水曜日
- https://blog.cloudflare.com/the-agent-access-model/
- https://blog.cloudflare.com/how-we-use-ai-with-cloudflare-os/
- https://blog.cloudflare.com/ja-jp/cloudflare-os/
- https://blog.cloudflare.com/ja-jp/identity-aware-ai-gateway/
- https://blog.cloudflare.com/mcp-portal-writeguard-private-beta/

### 木曜日
- https://blog.cloudflare.com/ja-jp/the-agentic-internet/
- https://blog.cloudflare.com/webmcp/
- https://blog.cloudflare.com/ja-jp/aeo/
- https://blog.cloudflare.com/kitesurf/
- https://blog.cloudflare.com/mcp-v2/
- https://blog.cloudflare.com/ai-search-easier/

### 金曜日
- https://blog.cloudflare.com/ja-jp/good-and-bad-agentic-behaviors/
- https://blog.cloudflare.com/workers-ai-gateway-unification/
- https://blog.cloudflare.com/community-program-refresh/
- https://blog.cloudflare.com/introducing-radar-researcher/
