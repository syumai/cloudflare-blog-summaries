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

<v-click>

## エージェント経済の課題は「モデル」だけではない

Cloudflare の主張:

> エージェントの能力向上に伴い、課題はモデル自体にとどまらず、
> **アイデンティティ・通信・オーケストレーション・メモリ・オブザーバビリティ・セキュリティ**
> にまで広がっている

</v-click>

<v-click>

- モデル性能の勝負ではなく、**エージェントが安全かつ本番品質で動くための基盤全体**をどう整備するかが焦点

</v-click>

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
layout: image-right
image: https://blog.cloudflare.com/_emdash/api/media/file/01KZX2BFZ7V9FZT5F9N1CJG900.png
---

# 月曜日: 実行環境とインフラ (1/2)

エージェントが実際に「動く」ための土台

- **@cloudflare/computer**
  タスクに応じてアイソレート実行とコンテナ実行を切り替えられる新しい実行環境
- **Workers RPC が Python ⇄ JavaScript 間で利用可能に**
  多言語エージェントコンポーネントを直接連携
- **Kimi / GLM を大規模に実行**
  オープンウェイトモデルを「より小さく、速く、安全に」提供

<div class="text-xs opacity-60 pt-4">
出典: Cloudflare Blog https://blog.cloudflare.com/ja-jp/agents-week-review-august-2026/
</div>

---

# 月曜日: 実行環境とインフラ (2/2)

- **Billable Usage API**
  エージェント自身が使用量・コストをプログラムから取得できる API
- **インバウンド TCP / gRPC サポート**（Workers・Containers）
  リアルタイム音声エージェントなど低レイテンシ通信が必要なユースケースに対応

<div class="pt-8">

具体的に何ができるようになるか:

- エージェントが**自分のコスト**を把握しながら動作できる
- **音声・ストリーミング**を扱うエージェントを Workers 上に直接構築できる
- Python と JavaScript のエージェント部品を**組み合わせて**開発できる

</div>

---

# 火曜日: エージェント開発ライフサイクル (1/3)

## ADLC (Agent Development Lifecycle) の提案

- 従来の **SDLC**（Software Development Lifecycle）に代わる概念として提示
- エージェントは「試作 → 本番」の間に、通常のソフトウェアとは異なる検証・承認・トレースが必要

<v-click>

- **Cloudflare Agents**: トレース・再実行・承認機能で本番運用を管理
- **ローカルトレースによる Workers デバッグ**: 分散トレーシングをデプロイ前の問題検出に活用

</v-click>

---

# 火曜日: エージェント開発ライフサイクル (2/3)

- **Cloudflare Wallets**
  エージェントが「エージェント経済」の参加者として安全に取引を行うためのウォレット
- **数百万リポジトリで CI/CD を実行**
  パイプラインをコードベースから記述し、失敗時にエージェントが自律的に修復を試行

<div class="pt-6 text-sm opacity-70">

これらは「エージェントを信頼して本番に任せる」ための土台となる機能群

</div>

---

# 火曜日: エージェント開発ライフサイクル (3/3)

- **AI によるエンジニアリング標準の徹底**
  開発ワークフロー全体にAIを組み込み、規約遵守を自動チェック
- **Astro の GitHub Issue をゼロにするソフトウェアファクトリー**
  Issue の自動分類・トリアージで OSS 保守コストを削減

<div class="pt-8">

具体的に何ができるようになるか:

- **試作から本番までの一連のプロセス**をエージェント前提で設計できる（ADLC）
- CI/CD・Issue 対応など、**運用の定常業務をエージェントに任せられる**

</div>

---

# 水曜日: Zero Trust とセキュリティ (1/2)

エージェントが安全にリソースへアクセスするための仕組み

- **Agent Access Model**
  エージェントが人間・サービスに代わって安全にリソースへアクセスするアクセス制御フレームワーク
- **Cloudflare OS**
  社内業務にAIエージェントを組み込みつつ、オープンプラットフォームとして他チームにも提供
  （効率性と人間の監督の両立が狙い）

---

# 水曜日: Zero Trust とセキュリティ (2/2)

- **ID情報ベースの分析**
  エージェントのトラフィックを実ユーザーのID情報と関連付け、不正利用を検出
- **WriteGuard**
  MCP サーバー経由のリスクの高い書き込み操作をきめ細かく制御

<div class="pt-8">

具体的に何ができるようになるか:

- エージェントに**「何を・どこまで」許可するか**を細かく制御できる
- 「エージェントが勝手にデータを書き換えた」といった事故を**未然に防止**できる

</div>

<div class="text-xs opacity-60 pt-4">
出典: Cloudflare Blog https://blog.cloudflare.com/ja-jp/agents-week-review-august-2026/
</div>

---

# 木曜日: エージェント型インターネット (1/3)

## オープンなエージェンティックインターネットの構築

- 読み取り・発見・呼び出し・決済までを、パブリッシャーが管理権を維持したまま実現
- **WebMCP**: あらゆる Web サイトにエージェント向けの MCP インターフェースを付与

---

# 木曜日: エージェント型インターネット (2/3)

- **AEO (Answer Engine Optimization)**
  SEO（検索エンジン最適化）から、AI エージェントに「推奨」されるための最適化へ
- **Kitesurf**
  メモリ・CPU使用量を抑えた、エージェント専用の軽量ブラウザ

---

# 木曜日: エージェント型インターネット (3/3)

- **MCPv2**
  MCP プロトコルの次世代版。サーバーの展開・拡張を簡素化
- **Cloudflare AI Search**
  ファイル・Web サイトを変換し、エージェント向け検索エンジンとして提供

<div class="pt-8">

具体的に何ができるようになるか:

- サイト運営者は**エージェントに読まれる前提**でコンテンツを最適化できる（AEO・WebMCP）
- エージェントは**軽量なブラウザ**で Web を探索し、必要な情報だけを取得できる

</div>

---

# 金曜日: 実装と現実 (1/2)

エージェントが実際にインターネット上で動く際の「現実」への対応

- **良い振る舞い / 悪い振る舞いの見極め**
  従来の bot 対策を、継続的な信頼評価（continuous trust evaluation）へ転換
- **Workers AI と AI Gateway の統合**
  統一されたバインディング・ウォレット・ダッシュボードでモデル呼び出しを一元管理

---

# 金曜日: 実装と現実 (2/2)

- **Cloudflare Ambassadors / Community Engineers**
  コミュニティリーダー・OSSメンテナー向けの新プログラム。今後2年間で OSS に追加100万ドルを提供
- **Radar Researcher**
  自然言語での問いかけでインターネットデータを分析できる AI ツール

<div class="pt-8">

具体的に何ができるようになるか:

- プラットフォーム側は**エージェントの振る舞いを継続的に評価**し、悪意ある挙動を判別できる
- OSS エコシステムを支える**人とコミュニティ**にも投資が続けられる

</div>

---

# 注目ピックアップ: @cloudflare/computer

- 月曜日の発表の中でも特に大きなトピック
- **アイソレート実行**（高速起動・軽量）と **コンテナ実行**（FUSEマウント）を、
  タスクの要求に応じて使い分ける新しい実行環境
- SQLite バックエンドの仮想ファイルシステムで両バックエンドがファイルを共有

<div class="pt-6">

詳細は別デッキ・別 Wiki ページで解説:

- Wiki: `docs/articles/2026-08-05-cloudflare-computer.md`
- スライド: `slides/cloudflare-computer/slides.md`

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
