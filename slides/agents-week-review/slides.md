---
theme: default
title: Agents Week 2026で行った発表内容の全て
info: |
  Cloudflare Agents Week 2026（2026年8月3日〜7日）の振り返り記事の解説スライド。
  原文: https://blog.cloudflare.com/ja-jp/agents-week-review-august-2026/
drawings:
  persist: false
transition: slide-left
mdc: true
themeConfig:
  primary: '#f6821f'
---

# Agents Week 2026で行った発表内容の全て

Cloudflare ブログ記事解説

<div class="pt-8 opacity-70 text-sm">

原文: https://blog.cloudflare.com/ja-jp/agents-week-review-august-2026/

公開日: 2026-08-13

</div>

---

# Agents Week 2026 とは

- 2026年8月3日〜7日の **5日間**、Cloudflare が AI エージェント関連の発表を連続して行ったイベント
- 約 **26件** の発表が5つのテーマ（曜日）に分かれて公開された

## エージェント経済の課題は「モデル」だけではない

Cloudflare の主張:

> エージェントの能力向上に伴い、課題はモデル自体にとどまらず、
> **アイデンティティ・通信・オーケストレーション・メモリ・オブザーバビリティ・セキュリティ**
> にまで広がっている

- モデル性能の勝負ではなく、**エージェントが安全かつ本番品質で動くための基盤全体**をどう整備するかが焦点

---

# 週全体マップ

| 曜日 | 日付 | テーマ | 件数目安 |
|------|------|--------|----------|
| 月曜 | 8/3 | 実行環境とインフラ | 5件 |
| 火曜 | 8/4 | エージェント開発ライフサイクル（ADLC） | 7件 |
| 水曜 | 8/5 | Zero Trust とセキュリティ | 5件 |
| 木曜 | 8/6 | エージェント型インターネット | 6件 |
| 金曜 | 8/7 | 実装と現実 | 4件 |

<div class="pt-4 text-sm opacity-70">

「動く基盤」→「開発・運用フロー」→「安全な権限管理」→「インターネット全体への波及」→「現実世界での運用・エコシステム」という順に構成されている

</div>

---

# 月曜日: 実行環境とインフラ (1/3)

エージェントが実際に「動く」ための土台

<div class="pb-3">

**@cloudflare/computer**<br>
<span class="text-sm opacity-60">『AIエージェントに必要なのはコンテナではなくコンピューター —「@cloudflare/computer」のご紹介』</span><br>
エージェントのタスクに応じてアイソレート実行とコンテナ実行を切り替えられる、新しい実行環境<br>
<span class="text-xs opacity-50">📄 [原文](https://blog.cloudflare.com/ja-jp/cloudflare-computer/)</span> ・ <span class="text-xs">▶ <a href="../cloudflare-computer/" target="_blank">解説スライド</a></span>

</div>

<div class="pb-3">

**Workers RPC が Python ⇄ JavaScript 間で利用可能に**<br>
<span class="text-sm opacity-60">『Workers RPC が Python と JavaScript 間で利用可能に』</span><br>
多言語エージェントコンポーネントを直接連携できるようになった<br>
<span class="text-xs opacity-50">📄 [原文](https://blog.cloudflare.com/python-workers-rpc/)</span> ・ <span class="text-xs">▶ <a href="../python-workers-rpc/" target="_blank">解説スライド</a></span>

</div>

<div class="text-xs opacity-60 pt-4">
出典: Cloudflare Blog https://blog.cloudflare.com/ja-jp/agents-week-review-august-2026/
</div>

---

# 月曜日: 実行環境とインフラ (2/3)

<div class="pb-3">

**Kimi / GLM を大規模に実行**<br>
<span class="text-sm opacity-60">『より小さく、より速く、より安全に：Kimi と GLM を大規模に実行』</span><br>
オープンウェイトモデルを「より小さく、速く、安全に」提供する取り組み<br>
<span class="text-xs opacity-50">📄 [原文](https://blog.cloudflare.com/smaller-faster-safer-models/)</span> ・ <span class="text-xs">▶ <a href="../smaller-faster-safer-models/" target="_blank">解説スライド</a></span>

</div>

<div class="pb-3">

**Billable Usage API**<br>
<span class="text-sm opacity-60">『Billable Usage API を提供開始』</span><br>
エージェント自身が使用量・コストをプログラムから取得できる API<br>
<span class="text-xs opacity-50">📄 [原文](https://blog.cloudflare.com/ja-jp/billable-usage-api/)</span> ・ <span class="text-xs">▶ <a href="../billable-usage-api/" target="_blank">解説スライド</a></span>

</div>

---

# 月曜日: 実行環境とインフラ (3/3)

<div class="pb-3">

**インバウンド TCP / gRPC サポート**（Workers・Containers）<br>
<span class="text-sm opacity-60">『Cloudflare Workers と Containers がインバウンド TCP 接続と gRPC をサポート』</span><br>
リアルタイム音声エージェントなど低レイテンシ通信が必要なユースケースに対応<br>
<span class="text-xs opacity-50">📄 [原文](https://blog.cloudflare.com/grpc-workers/)</span> ・ <span class="text-xs">▶ <a href="../grpc-workers/" target="_blank">解説スライド</a></span>

</div>

---

# 火曜日: エージェント開発ライフサイクル (1/4)

## ADLC (Agent Development Lifecycle) の提案

エージェントは「試作 → 本番」の間に、通常のソフトウェアとは異なる検証・承認・トレースが必要

<div class="pb-3">

**ADLC 提案**<br>
<span class="text-sm opacity-60">『Cloudflare にエージェント開発ライフサイクルの時代が到来』</span><br>
従来の SDLC（Software Development Lifecycle）に代わる概念として ADLC を提案<br>
<span class="text-xs opacity-50">📄 [原文](https://blog.cloudflare.com/ja-jp/agent-development-lifecycle/)</span> ・ <span class="text-xs">▶ <a href="../agent-development-lifecycle/" target="_blank">解説スライド</a></span>

</div>

<div class="pb-3">

**Cloudflare Agents**<br>
<span class="text-sm opacity-60">『Cloudflare Agents の紹介』</span><br>
トレース・再実行・承認機能で本番運用を管理できるフレームワーク<br>
<span class="text-xs opacity-50">📄 [原文](https://blog.cloudflare.com/agents-on-cloudflare/)</span> ・ <span class="text-xs">▶ <a href="../agents-on-cloudflare/" target="_blank">解説スライド</a></span>

</div>

---

# 火曜日: エージェント開発ライフサイクル (2/4)

<div class="pb-3">

**ローカルトレースによる Workers デバッグ**<br>
<span class="text-sm opacity-60">『エージェントがローカルトレースで Workers をデバッグ可能に』</span><br>
分散トレーシングをデプロイ前の問題検出に活用する仕組み<br>
<span class="text-xs opacity-50">📄 [原文](https://blog.cloudflare.com/local-tracing/)</span> ・ <span class="text-xs">▶ <a href="../local-tracing/" target="_blank">解説スライド</a></span>

</div>

<div class="pb-3">

**Cloudflare Wallets**<br>
<span class="text-sm opacity-60">『Cloudflare Wallets を発表』</span><br>
エージェントが「エージェント経済」の参加者として安全に取引を行うためのウォレット<br>
<span class="text-xs opacity-50">📄 [原文](https://blog.cloudflare.com/ja-jp/wallets/)</span> ・ <span class="text-xs">▶ <a href="../wallets/" target="_blank">解説スライド</a></span>

</div>

---

# 火曜日: エージェント開発ライフサイクル (3/4)

<div class="pb-3">

**数百万リポジトリで CI/CD を実行**<br>
<span class="text-sm opacity-60">『数百万のリポジトリで CI/CD を実行』</span><br>
パイプラインをコードベースから記述し、失敗時にエージェントが自律的に修復を試行<br>
<span class="text-xs opacity-50">📄 [原文](https://blog.cloudflare.com/ci-workflows/)</span> ・ <span class="text-xs">▶ <a href="../ci-workflows/" target="_blank">解説スライド</a></span>

</div>

<div class="pb-3">

**AI によるエンジニアリング標準の徹底**<br>
<span class="text-sm opacity-60">『Cloudflare が AI を活用してエンジニアリング標準を徹底する方法』</span><br>
開発ワークフロー全体に AI を組み込み、規約遵守を自動チェック<br>
<span class="text-xs opacity-50">📄 [原文](https://blog.cloudflare.com/engineering-standards-enforcement/)</span> ・ <span class="text-xs">▶ <a href="../engineering-standards-enforcement/" target="_blank">解説スライド</a></span>

</div>

<div class="pt-2 text-sm opacity-70">

これらは「エージェントを信頼して本番に任せる」ための土台となる機能群

</div>

---

# 火曜日: エージェント開発ライフサイクル (4/4)

<div class="pb-3">

**Astro の GitHub Issue をゼロにするソフトウェアファクトリー**<br>
<span class="text-sm opacity-60">『Astro の GitHub Issue をゼロにするソフトウェアファクトリーを構築した方法』</span><br>
Issue の自動分類・トリアージで OSS 保守コストを削減<br>
<span class="text-xs opacity-50">📄 [原文](https://blog.cloudflare.com/astro-issue-triage/)</span> ・ <span class="text-xs">▶ <a href="../astro-issue-triage/" target="_blank">解説スライド</a></span>

</div>

---

# 水曜日: Zero Trust とセキュリティ (1/3)

エージェントが安全にリソースへアクセスするための仕組み

<div class="pb-3">

**Agent Access Model**<br>
<span class="text-sm opacity-60">『エージェントアクセスモデル（Agent Access Model）』</span><br>
エージェントが人間・サービスに代わって安全にリソースへアクセスするアクセス制御フレームワーク<br>
<span class="text-xs opacity-50">📄 [原文](https://blog.cloudflare.com/the-agent-access-model/)</span> ・ <span class="text-xs">▶ <a href="../the-agent-access-model/" target="_blank">解説スライド</a></span>

</div>

<div class="pb-3">

**Cloudflare OS で働き方を見直す**<br>
<span class="text-sm opacity-60">『Cloudflare OS で Cloudflare の働き方を見直す』</span><br>
社内業務に AI エージェントを組み込みつつ、効率性と人間の監督を両立<br>
<span class="text-xs opacity-50">📄 [原文](https://blog.cloudflare.com/how-we-use-ai-with-cloudflare-os/)</span> ・ <span class="text-xs">▶ <a href="../how-we-use-ai-with-cloudflare-os/" target="_blank">解説スライド</a></span>

</div>

---

# 水曜日: Zero Trust とセキュリティ (2/3)

<div class="pb-3">

**Cloudflare OS（オープンプラットフォーム）**<br>
<span class="text-sm opacity-60">『Cloudflare OS：エージェント、アプリ、作業のためのオープンプラットフォーム』</span><br>
社内向けに構築した Cloudflare OS を、オープンなプラットフォームとして他チームにも提供<br>
<span class="text-xs opacity-50">📄 [原文](https://blog.cloudflare.com/ja-jp/cloudflare-os/)</span> ・ <span class="text-xs">▶ <a href="../cloudflare-os/" target="_blank">解説スライド</a></span>

</div>

<div class="pb-3">

**ID情報ベースの分析**<br>
<span class="text-sm opacity-60">『ID 情報に基づく分析で、不正な AI の利用を検出』</span><br>
エージェントのトラフィックを実ユーザーの ID 情報と関連付け、不正利用を検出<br>
<span class="text-xs opacity-50">📄 [原文](https://blog.cloudflare.com/ja-jp/identity-aware-ai-gateway/)</span> ・ <span class="text-xs">▶ <a href="../identity-aware-ai-gateway/" target="_blank">解説スライド</a></span>

</div>

---

# 水曜日: Zero Trust とセキュリティ (3/3)

<div class="pb-3">

**WriteGuard**<br>
<span class="text-sm opacity-60">『WriteGuard：MCP サーバーをきめ細かく制御』</span><br>
MCP サーバー経由のリスクの高い書き込み操作をきめ細かく制御<br>
<span class="text-xs opacity-50">📄 [原文](https://blog.cloudflare.com/mcp-portal-writeguard-private-beta/)</span> ・ <span class="text-xs">▶ <a href="../mcp-portal-writeguard-private-beta/" target="_blank">解説スライド</a></span>

</div>

<div class="text-xs opacity-60 pt-4">
出典: Cloudflare Blog https://blog.cloudflare.com/ja-jp/agents-week-review-august-2026/
</div>

---

# 木曜日: エージェント型インターネット (1/4)

## オープンなエージェンティックインターネットの構築

<div class="pb-3">

**オープンなエージェンティックインターネットの構築**<br>
<span class="text-sm opacity-60">『読み取り、発見、呼び出し、決済が可能なオープンなエージェンティックインターネットの構築』</span><br>
読み取り・発見・呼び出し・決済までを、パブリッシャーが管理権を維持したまま実現する全体構想<br>
<span class="text-xs opacity-50">📄 [原文](https://blog.cloudflare.com/ja-jp/the-agentic-internet/)</span> ・ <span class="text-xs">▶ <a href="../the-agentic-internet/" target="_blank">解説スライド</a></span>

</div>

<div class="pb-3">

**WebMCP**<br>
<span class="text-sm opacity-60">『あらゆる Web サイトに WebMCP インターフェースを提供』</span><br>
あらゆる Web サイトにエージェント向けの MCP インターフェースを付与<br>
<span class="text-xs opacity-50">📄 [原文](https://blog.cloudflare.com/webmcp/)</span> ・ <span class="text-xs">▶ <a href="../webmcp/" target="_blank">解説スライド</a></span>

</div>

---

# 木曜日: エージェント型インターネット (2/4)

<div class="pb-3">

**AEO (Answer Engine Optimization)**<br>
<span class="text-sm opacity-60">『ランク付けから推奨へ：AI エージェント時代でサイトを成功に導く準備を整える』</span><br>
SEO（検索エンジン最適化）から、AI エージェントに「推奨」されるための最適化へ<br>
<span class="text-xs opacity-50">📄 [原文](https://blog.cloudflare.com/ja-jp/aeo/)</span> ・ <span class="text-xs">▶ <a href="../aeo/" target="_blank">解説スライド</a></span>

</div>

<div class="pb-3">

**Kitesurf**<br>
<span class="text-sm opacity-60">『Kitesurf のご紹介』</span><br>
メモリ・CPU使用量を抑えた、エージェント専用の軽量ブラウザ<br>
<span class="text-xs opacity-50">📄 [原文](https://blog.cloudflare.com/kitesurf/)</span> ・ <span class="text-xs">▶ <a href="../kitesurf/" target="_blank">解説スライド</a></span>

</div>

---

# 木曜日: エージェント型インターネット (3/4)

<div class="pb-3">

**MCPv2**<br>
<span class="text-sm opacity-60">『MCP の次世代バージョン（MCPv2）』</span><br>
MCP プロトコルの次世代版。サーバーの展開・拡張を簡素化<br>
<span class="text-xs opacity-50">📄 [原文](https://blog.cloudflare.com/mcp-v2/)</span> ・ <span class="text-xs">▶ <a href="../mcp-v2/" target="_blank">解説スライド</a></span>

</div>

<div class="pb-3">

**Cloudflare AI Search**<br>
<span class="text-sm opacity-60">『Cloudflare AI Search』</span><br>
ファイル・Web サイトを変換し、エージェント向け検索エンジンとして提供<br>
<span class="text-xs opacity-50">📄 [原文](https://blog.cloudflare.com/ai-search-easier/)</span> ・ <span class="text-xs">▶ <a href="../ai-search-easier/" target="_blank">解説スライド</a></span>

</div>

---

# 木曜日: エージェント型インターネット (4/4)

- サイト運営者は**エージェントに読まれる前提**でコンテンツを最適化できる（AEO・WebMCP）
- エージェントは**軽量なブラウザ**で Web を探索し、必要な情報だけを取得できる

---

# 金曜日: 実装と現実 (1/3)

エージェントが実際にインターネット上で動く際の「現実」への対応

<div class="pb-3">

**良い振る舞い / 悪い振る舞いの見極め**<br>
<span class="text-sm opacity-60">『エージェントが動くインターネットで、「良い振る舞い」と「悪い振る舞い」を見極める』</span><br>
従来の bot 対策を、継続的な信頼評価（continuous trust evaluation）へ転換<br>
<span class="text-xs opacity-50">📄 [原文](https://blog.cloudflare.com/ja-jp/good-and-bad-agentic-behaviors/)</span> ・ <span class="text-xs">▶ <a href="../good-and-bad-agentic-behaviors/" target="_blank">解説スライド</a></span>

</div>

<div class="pb-3">

**Workers AI と AI Gateway の統合**<br>
<span class="text-sm opacity-60">『Workers AI と AI Gateway を単一の AI コントロールプレーンに統合』</span><br>
統一されたバインディング・ウォレット・ダッシュボードでモデル呼び出しを一元管理<br>
<span class="text-xs opacity-50">📄 [原文](https://blog.cloudflare.com/workers-ai-gateway-unification/)</span> ・ <span class="text-xs">▶ <a href="../workers-ai-gateway-unification/" target="_blank">解説スライド</a></span>

</div>

---

# 金曜日: 実装と現実 (2/3)

<div class="pb-3">

**Cloudflare Ambassadors / Community Engineers**<br>
<span class="text-sm opacity-60">『Cloudflare Ambassadors と Community Engineers を発表』</span><br>
コミュニティリーダー・OSSメンテナー向けの新プログラム。今後2年間で OSS に追加100万ドルを提供<br>
<span class="text-xs opacity-50">📄 [原文](https://blog.cloudflare.com/community-program-refresh/)</span> ・ <span class="text-xs">▶ <a href="../community-program-refresh/" target="_blank">解説スライド</a></span>

</div>

<div class="pb-3">

**Radar Researcher**<br>
<span class="text-sm opacity-60">『Radar Researcher のご紹介』</span><br>
自然言語での問いかけでインターネットデータを分析できる AI ツール<br>
<span class="text-xs opacity-50">📄 [原文](https://blog.cloudflare.com/introducing-radar-researcher/)</span> ・ <span class="text-xs">▶ <a href="../introducing-radar-researcher/" target="_blank">解説スライド</a></span>

</div>

---

# 金曜日: 実装と現実 (3/3)

- プラットフォーム側は**エージェントの振る舞いを継続的に評価**し、悪意ある挙動を判別できる
- OSS エコシステムを支える**人とコミュニティ**にも投資が続けられる

---

# 注目ピックアップ: 5つの発表

Agents Week 2026 の中でも特に掘り下げて、別デッキ・別 Wiki ページで詳しく解説している5件

1. **@cloudflare/computer**（月曜）— エージェント専用の実行環境
2. **Cloudflare Wallets**（火曜）— エージェント経済のためのプログラム可能なウォレット
3. **Cloudflare OS**（水曜）— エージェント・アプリ・作業のためのオープンプラットフォーム
4. **WebMCP**（木曜）— あらゆるサイトをエージェント対応にするブラウザ標準
5. **Kitesurf**（木曜）— Workers 上で動くエージェント専用ブラウザ

---

# 注目ピックアップ: @cloudflare/computer

<div class="text-sm opacity-60 pb-4">

『AIエージェントに必要なのはコンテナではなくコンピューター —「@cloudflare/computer」のご紹介』

</div>

- 高性能なエージェントに必要な「専用コンピューター環境」を、全エージェント分のコンテナで用意するのは現実的に不可能という課題認識
- <strong>アイソレート実行</strong>（高速起動・軽量、just-bash でシェルを JS 変換）と<strong>コンテナ実行</strong>（フル Linux、FUSE マウント）を状況に応じて自動選択
- SQLite バックエンドの仮想ファイルシステム「Workspace」を介して両バックエンドが同じファイルを共有
- ツールの説明文にバックエンド選択のヒントを埋め込み、モデル自身が最適な実行環境を判断
- 目標はエージェント作業のうちコンテナが必要になる割合を**10%未満**に抑えること

<div class="pt-6 text-sm">

📄 [原文](https://blog.cloudflare.com/ja-jp/cloudflare-computer/) ・ <a href="../cloudflare-computer/" target="_blank">▶ 解説スライド</a>

</div>

<div class="text-xs opacity-50 pt-2">
Wiki: `docs/articles/2026-08-05-cloudflare-computer.md`
</div>

---

# 注目ピックアップ: Cloudflare Wallets

<div class="text-sm opacity-60 pb-4">

『Cloudflare Walletsを発表：エージェント型インターネットのためのプログラム可能なウォレット』

</div>

- エージェントが「安定した ID」と「ネイティブな決済手段」を持てないことが、オンボーディングと商取引普及を妨げてきた課題に対応
- `cloudflare.pay` で一意のハンドルを取得し、ステーブルコインの保管・サービス購入・Web 全体での資金受け取りが可能に
- 利用条件（予算・許可販売先・1回あたりの上限額）を設定できる **Virtual Wallets** で、エージェントに安全な範囲だけ資金を利用させられる
- `research.example.cloudflare.pay` のような人間可読な識別子で、エージェントが「誰の代理か」を検証可能に
- Monetization Gateway（販売側）・Wallets（購入側）・Identity（本人確認）の3要素で「ヘッドレスマーケットプレイス」を目指す

<div class="pt-6 text-sm">

📄 [原文](https://blog.cloudflare.com/ja-jp/wallets/) ・ <a href="../wallets/" target="_blank">▶ 解説スライド</a>

</div>

<div class="text-xs opacity-50 pt-2">
Wiki: `docs/articles/2026-08-04-wallets.md`
</div>

---

# 注目ピックアップ: Cloudflare OS

<div class="text-sm opacity-60 pb-4">

『Cloudflare OS：エージェント、アプリ、作業のためのオープンプラットフォーム』

</div>

- 社内で数千人が日常利用してきた業務プラットフォームをオープンソースとして公開
- 構成要素は「エージェントワークスペース」「セキュリティ・ガバナンス基盤（Gatekeeper）」「個人向けアプリのプラットフォーム」の3つ
- エージェントは最初は**どのアクセス権も持たない状態**から始まり、許可されたリソースのみ型付きバインディングとしてコードに渡される
- Gatekeeper はエージェントが「参照した情報」を記録し、その後の共有・公開・外部送信まで参照履歴に基づいて制御
- 作成されたアプリは**Dynamic Worker 上の Durable Object Facet**として動く、専用 SQLite 付きフルスタックアプリケーション

<div class="pt-6 text-sm">

📄 [原文](https://blog.cloudflare.com/ja-jp/cloudflare-os/) ・ <a href="../cloudflare-os/" target="_blank">▶ 解説スライド</a>

</div>

<div class="text-xs opacity-50 pt-2">
Wiki: `docs/articles/2026-08-05-cloudflare-os.md`
</div>

---

# 注目ピックアップ: WebMCP

<div class="text-sm opacity-60 pb-4">

『あらゆるWebサイトにWebMCPインターフェースを付与する』

</div>

- Chrome 146 で実験提供される新ブラウザ標準。ページ上に `document.modelContext` として現れ、サイトが「ツール」をエージェントに公開できる
- Cloudflare の実装は<strong>オリジンのコード変更ゼロ</strong>。エッジで HTMLRewriter により1行のブリッジスクリプトを注入するだけで有効化
- 初回プレビューは「Content Credentials（C2PA 画像の来歴確認）」と「Site MCP Server（自サイトの MCP サーバーへのプロキシ）」の2ツールパック
- 登録ツールは MCP の `Tool` / `CallToolResult` 型に準拠し、既存の MCP クライアント／エージェントがそのまま呼び出し可能
- ツールはすべて訪問者自身のブラウザ内・セッションで実行され、人間の操作と同じ認証境界を保つ

<div class="pt-6 text-sm">

📄 [原文](https://blog.cloudflare.com/webmcp/) ・ <a href="../webmcp/" target="_blank">▶ 解説スライド</a>

</div>

<div class="text-xs opacity-50 pt-2">
Wiki: `docs/articles/2026-08-06-webmcp.md`
</div>

---

# 注目ピックアップ: Kitesurf

<div class="text-sm opacity-60 pb-4">

『Kitesurfのご紹介 — Cloudflare Workers上で動く、エージェントファーストのブラウザ』

</div>

- Chromium など既存エンジンを使わず、**Cloudflare Workers 上で完全動作**する AI エージェント専用ブラウザ
- Rust 実装を Wasm にコンパイルして構築。HTML/CSS は Blitz・Stylo、`eval` 実行は Boa JS で実現
- スクリーンショット・HTML 抽出で Chromium より CPU・メモリ消費が**3〜7倍**少ない（壁時計時間は1.7〜1.8倍遅い）
- Web Platform Tests を**21万5,000件以上**通過、CDP 互換で既存の Puppeteer / Playwright / MCP クライアントがそのまま接続可能
- Browser Run 経由で無料ベータとして利用開始可能（動画再生・WebGL・長時間認証セッションなどは非対応）

<div class="pt-6 text-sm">

📄 [原文](https://blog.cloudflare.com/kitesurf/) ・ <a href="../kitesurf/" target="_blank">▶ 解説スライド</a>

</div>

<div class="text-xs opacity-50 pt-2">
Wiki: `docs/articles/2026-08-06-kitesurf.md`
</div>

---

# まとめ: 5日間で見えた「エージェントに必要なもの」

Agents Week 2026 全体を通じて見えてきたのは、エージェントには以下がすべて必要だということ

1. **動作するための実行レイヤーと基盤機能**（月曜）
2. **次第に自己記述型へと進化する開発ライフサイクル**（火曜）
3. **人間とエージェントのための安全なアクセス環境**（水曜）
4. **エージェント型インターネット**（木曜）
5. **これらを現実に即したものに保つ人々とコミュニティ**（金曜）

<div class="pt-6 opacity-80">

モデルの進化だけでは「エージェント経済」は成立しない、というのが Cloudflare からの一貫したメッセージ

</div>

---

# 参考リンク

<div class="text-sm">

**週まとめ記事**: https://blog.cloudflare.com/ja-jp/agents-week-review-august-2026/

**月曜**: https://blog.cloudflare.com/ja-jp/cloudflare-computer/ ・ https://blog.cloudflare.com/python-workers-rpc/ ・ https://blog.cloudflare.com/smaller-faster-safer-models/ ・ https://blog.cloudflare.com/ja-jp/billable-usage-api/ ・ https://blog.cloudflare.com/grpc-workers/

**火曜**: https://blog.cloudflare.com/ja-jp/agent-development-lifecycle/ ・ https://blog.cloudflare.com/agents-on-cloudflare/ ・ https://blog.cloudflare.com/local-tracing/ ・ https://blog.cloudflare.com/ja-jp/wallets/ ・ https://blog.cloudflare.com/ci-workflows/ ・ https://blog.cloudflare.com/engineering-standards-enforcement/ ・ https://blog.cloudflare.com/astro-issue-triage/

**水曜**: https://blog.cloudflare.com/the-agent-access-model/ ・ https://blog.cloudflare.com/how-we-use-ai-with-cloudflare-os/ ・ https://blog.cloudflare.com/ja-jp/cloudflare-os/ ・ https://blog.cloudflare.com/ja-jp/identity-aware-ai-gateway/ ・ https://blog.cloudflare.com/mcp-portal-writeguard-private-beta/

**木曜**: https://blog.cloudflare.com/ja-jp/the-agentic-internet/ ・ https://blog.cloudflare.com/webmcp/ ・ https://blog.cloudflare.com/ja-jp/aeo/ ・ https://blog.cloudflare.com/kitesurf/ ・ https://blog.cloudflare.com/mcp-v2/ ・ https://blog.cloudflare.com/ai-search-easier/

**金曜**: https://blog.cloudflare.com/ja-jp/good-and-bad-agentic-behaviors/ ・ https://blog.cloudflare.com/workers-ai-gateway-unification/ ・ https://blog.cloudflare.com/community-program-refresh/ ・ https://blog.cloudflare.com/introducing-radar-researcher/

</div>
