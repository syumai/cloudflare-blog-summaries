---
theme: default
routerMode: hash
title: "Birthday Week 2026 で行った発表内容の全て"
info: |
  Cloudflare Birthday Week 2026（2026年9月28日〜10月2日）の週まとめ記事の解説スライド。
  原文: https://blog.cloudflare.com/birthday-week-2026-wrap-up/
drawings:
  persist: false
transition: slide-left
mdc: true
themeConfig:
  primary: '#f6821f'
---

# Birthday Week 2026 で行った発表内容の全て

Cloudflare ブログ記事解説

<div class="pt-8 opacity-70 text-sm">

原文: https://blog.cloudflare.com/birthday-week-2026-wrap-up/

公開日: 2026-10-05

</div>

---

# TL;DR

- Cloudflare は 16 周年の Birthday Week（2026年9月28日〜10月2日）で、<strong>46 件</strong>の発表を行った
- テーマは日ごとに区切られ、<strong>「オープンソース」→「セキュリティとポスト量子」→「エージェント経済」→「開発者プラットフォーム」→「速く・簡単に・誰でも」</strong>の順に展開
- 共通するメッセージは、開発者が形を変えられるオープンなツール、新しい脅威に追いつくセキュリティ、エージェントと作り手の公正な対価、エージェント時代のインフラ
- 週の後に、インターンプログラムの 1 年後の振り返りも公開され、EmDash・CryptoLabe などにインターンが貢献した
- 本スライドは全 46 件への「目次」であり、<strong>45 件</strong>は個別の解説スライド・解説記事にリンクしている

---

# Birthday Week 2026 とは

- Cloudflare の 16 周年を祝う **5 日間**。毎日、異なる切り口で「これからのインターネット」を作る取り組みを発表
- 発表数は **46 件**（月 9・火 9・水 9・木 9・金 10）

## 背景: 今年起きた大きな変化

- 初めて、自動化されたトラフィックが人間の活動を上回った
- AI により、誰もが以前より作れるようになり、インターネットの規模と野心が拡大した
- エージェントの推薦が消費者の選択に影響するため、<strong>新しいビジネスが成功できる余地を作る新しい仕組み</strong>が必要になった

<div class="text-xs opacity-60 pt-2">
出典: Cloudflare Blog https://blog.cloudflare.com/birthday-week-2026-wrap-up/
</div>

---
layout: center
---

# 週全体マップ

| 曜日 | 日付 | テーマ | 件数 |
|------|------|--------|------|
| 月曜 | 09/28 | オープンソースへのコミットメント | 9件 |
| 火曜 | 09/29 | エージェント型インターネットの安全を守る | 9件 |
| 水曜 | 09/30 | エージェント経済を動かす | 9件 |
| 木曜 | 10/01 | 開発者スタックを Cloudflare にさらに広げる | 9件 |
| 金曜 | 10/02 | より速く、シンプルに、誰にとっても使いやすく | 10件 |

<div class="pt-4 text-sm opacity-70">

さらに、創業者レター（9/27）と、インターンの 1 年後の振り返り（10/5）が週の前後を挟む

</div>

---
layout: center
class: text-center
---

<img src="https://blog.cloudflare.com/_emdash/api/media/file/01M45M6F7F4N2RT9KMZ0Q5DRQT.png" style="max-height: 340px; margin: 0 auto;" />

<div class="text-xs opacity-60 pt-4">
Birthday Week 2026 の記事ヘッダー画像（装飾）<br>
出典: Cloudflare Blog https://blog.cloudflare.com/birthday-week-2026-wrap-up/
</div>

---

# 月曜日（09/28）(1/3)

<div class="text-sm opacity-80 pb-2"><strong>オープンソースへのコミットメント</strong>　新しい CLI を、それを生成するパイプラインおよび SDK・ドキュメントと一緒に公開し、エージェントと開発者が Cloudflare を使うための基盤と、プロジェクトを支える OSS への取り組みを示した日。</div>

<div class="pb-2 text-sm">

<strong>cf CLI</strong><br>
Cloudflare API をそのまま写し取り、JSON ファースト出力と型付き設定で、人とエージェントに一貫したコマンドラインを提供する。<br>
<span class="text-xs opacity-50">📄 [原文](https://blog.cloudflare.com/cloudflare-cf-cli-launch/)</span> ・ <span class="text-xs">▶ <a href="../cloudflare-cf-cli-launch/" target="_blank">解説スライド</a></span> ・ <span class="text-xs"><a href="../../docs/articles/2026-09-28-cloudflare-cf-cli-launch.html" target="_blank">📖 解説記事</a></span>

</div>

<div class="pb-2 text-sm">

<strong>Forge</strong><br>
API 定義から SDK・CLI・ドキュメントなどを CI 上で生成する、プラガブルなオープンソースのパイプライン。<br>
<span class="text-xs opacity-50">📄 [原文](https://blog.cloudflare.com/forge-open-source-generation-pipeline/)</span> ・ <span class="text-xs">▶ <a href="../forge-open-source-generation-pipeline/" target="_blank">解説スライド</a></span> ・ <span class="text-xs"><a href="../../docs/articles/2026-09-28-forge-open-source-generation-pipeline.html" target="_blank">📖 解説記事</a></span>

</div>

<div class="pb-2 text-sm">

<strong>EmDash 1.0</strong><br>
Astro ベースのサーバーレス CMS で、プラグインを明示承認した権限のみを持つ分離された Worker サンドボックスで実行する。<br>
<span class="text-xs opacity-50">📄 [原文](https://blog.cloudflare.com/emdash-cms-plugin-registry/)</span> ・ <span class="text-xs">▶ <a href="../emdash-cms-plugin-registry/" target="_blank">解説スライド</a></span> ・ <span class="text-xs"><a href="../../docs/articles/2026-09-28-emdash-cms-plugin-registry.html" target="_blank">📖 解説記事</a></span>

</div>

<div class="text-xs opacity-60 pt-1">
出典: Cloudflare Blog https://blog.cloudflare.com/birthday-week-2026-wrap-up/
</div>

---

# 月曜日（09/28）(2/3)

<div class="text-sm opacity-80 pb-2"><strong>オープンソースへのコミットメント</strong></div>

<div class="pb-2 text-sm">

<strong>VoidZero の 4 か月</strong><br>
Vite エコシステムで 80 回超のリリース。商用だった Void プラットフォームは完全オープンソースになる。<br>
<span class="text-xs opacity-50">📄 [原文](https://blog.cloudflare.com/voidzero-update/)</span> ・ <span class="text-xs">▶ <a href="../voidzero-update/" target="_blank">解説スライド</a></span> ・ <span class="text-xs"><a href="../../docs/articles/2026-09-28-voidzero-update.html" target="_blank">📖 解説記事</a></span>

</div>

<div class="pb-2 text-sm">

<strong>Vinext 1.0</strong><br>
AI で作った実験を、Vite 上で Next.js アプリを動かす本番品質でポータブルな手段にした。<br>
<span class="text-xs opacity-50">📄 [原文](https://blog.cloudflare.com/vinext-nextjs-on-vite/)</span> ・ <span class="text-xs">▶ <a href="../vinext-nextjs-on-vite/" target="_blank">解説スライド</a></span> ・ <span class="text-xs"><a href="../../docs/articles/2026-09-28-vinext-nextjs-on-vite.html" target="_blank">📖 解説記事</a></span>

</div>

<div class="pb-2 text-sm">

<strong>Kitesurf アップデート</strong><br>
Workers ベースのエージェント向けブラウザに WebMCP 対応、高速な DOM 操作、互換性拡大、ターミナル描画が加わる。<br>
<span class="text-xs opacity-50">📄 [原文](https://blog.cloudflare.com/kitesurf-update/)</span> ・ <span class="text-xs">▶ <a href="../kitesurf-update/" target="_blank">解説スライド</a></span> ・ <span class="text-xs"><a href="../../docs/articles/2026-09-28-kitesurf-update.html" target="_blank">📖 解説記事</a></span>

</div>

<div class="text-xs opacity-60 pt-1">
出典: Cloudflare Blog https://blog.cloudflare.com/birthday-week-2026-wrap-up/
</div>

---

# 月曜日（09/28）(3/3)

<div class="text-sm opacity-80 pb-2"><strong>オープンソースへのコミットメント</strong></div>

<div class="pb-2 text-sm">

<strong>BEACON</strong><br>
主要 1 万サイトの数十億件の匿名化された実ユーザー計測を、公開 BigQuery データセットとして提供する。<br>
<span class="text-xs opacity-50">📄 [原文](https://blog.cloudflare.com/how-fast-is-the-web/)</span> ・ <span class="text-xs">▶ <a href="../how-fast-is-the-web/" target="_blank">解説スライド</a></span> ・ <span class="text-xs"><a href="../../docs/articles/2026-09-28-how-fast-is-the-web.html" target="_blank">📖 解説記事</a></span>

</div>

<div class="pb-2 text-sm">

<strong>wasm-bindgen の実験的な Emscripten ターゲット</strong><br>
ネイティブ Rust ライブラリ（Tokio 対応に向けた進捗を含む）を Workers へ持ち込める。<br>
<span class="text-xs opacity-50">📄 [原文](https://blog.cloudflare.com/rust-workers-emscripten-target/)</span> ・ <span class="text-xs">▶ <a href="../rust-workers-emscripten-target/" target="_blank">解説スライド</a></span> ・ <span class="text-xs"><a href="../../docs/articles/2026-09-28-rust-workers-emscripten-target.html" target="_blank">📖 解説記事</a></span>

</div>

<div class="pb-2 text-sm">

<strong>The Cold Start</strong><br>
初期段階のスタートアップ 5 社が Cloudflare Connect でライブピッチを行い、成長のためのリソースを競う。<br>
<span class="text-xs opacity-50">📄 [原文](https://blog.cloudflare.com/introducing-the-cold-start/)</span> ・ <span class="text-xs">▶ <a href="../introducing-the-cold-start/" target="_blank">解説スライド</a></span> ・ <span class="text-xs"><a href="../../docs/articles/2026-09-28-introducing-the-cold-start.html" target="_blank">📖 解説記事</a></span>

</div>

<div class="text-xs opacity-60 pt-1">
出典: Cloudflare Blog https://blog.cloudflare.com/birthday-week-2026-wrap-up/
</div>

---

# 火曜日（09/29）(1/3)

<div class="text-sm opacity-80 pb-2"><strong>エージェント型インターネットの安全を守る</strong>　認証局（CA）になる意図の表明に加え、基盤となるインターネット暗号をポスト量子時代へ備えさせる取り組みと、AI 駆動の攻撃に対抗するアプリケーションセキュリティの話題を扱った日。</div>

<div class="pb-2 text-sm">

<strong>インターネット全体のための認証局</strong><br>
Universal SSL から 12 年、公開 CA となり無料・自動の証明書発行に耐障害性を加える。<br>
<span class="text-xs opacity-50">📄 [原文](https://blog.cloudflare.com/cloudflare-certificate-authority/)</span> ・ <span class="text-xs">▶ <a href="../cloudflare-certificate-authority/" target="_blank">解説スライド</a></span> ・ <span class="text-xs"><a href="../../docs/articles/2026-09-29-cloudflare-certificate-authority.html" target="_blank">📖 解説記事</a></span>

</div>

<div class="pb-2 text-sm">

<strong>Merkle Tree Certificates によるポスト量子 CA</strong><br>
証明書・ハンドシェイクの大きなコストを避けつつポスト量子認証を実用化する。<br>
<span class="text-xs opacity-50">📄 [原文](https://blog.cloudflare.com/pq-ca-with-mtcs/)</span> ・ <span class="text-xs">▶ <a href="../pq-ca-with-mtcs/" target="_blank">解説スライド</a></span> ・ <span class="text-xs"><a href="../../docs/articles/2026-09-29-pq-ca-with-mtcs.html" target="_blank">📖 解説記事</a></span>

</div>

<div class="pb-2 text-sm">

<strong>CryptoLabe</strong><br>
AI でコードベース内の暗号利用を発見・分類し、2029 年までのポスト量子移行完了を目指す。<br>
<span class="text-xs opacity-50">📄 [原文](https://blog.cloudflare.com/ai-driven-cryptography-discovery/)</span> ・ <span class="text-xs">▶ <a href="../ai-driven-cryptography-discovery/" target="_blank">解説スライド</a></span> ・ <span class="text-xs"><a href="../../docs/articles/2026-09-29-ai-driven-cryptography-discovery.html" target="_blank">📖 解説記事</a></span>

</div>

<div class="text-xs opacity-60 pt-1">
出典: Cloudflare Blog https://blog.cloudflare.com/birthday-week-2026-wrap-up/
</div>

---

# 火曜日（09/29）(2/3)

<div class="text-sm opacity-80 pb-2"><strong>エージェント型インターネットの安全を守る</strong></div>

<div class="pb-2 text-sm">

<strong>IPsec の量子ダウングレード防止</strong><br>
IKEv2 のやり取り全体を認証する IETF 拡張で、ポスト量子 IPsec トンネルの格下げを防ぐ。<br>
<span class="text-xs opacity-50">📄 [原文](https://blog.cloudflare.com/ipsec-downgrade-protection/)</span> ・ <span class="text-xs">▶ <a href="../ipsec-downgrade-protection/" target="_blank">解説スライド</a></span> ・ <span class="text-xs"><a href="../../docs/articles/2026-09-29-ipsec-downgrade-protection.html" target="_blank">📖 解説記事</a></span>

</div>

<div class="pb-2 text-sm">

<strong>ポスト量子の可視化</strong><br>
HTTP Analytics・Log Explorer・Logpush で、リクエストがポスト量子鍵交換を使ったかを確認できる。<br>
<span class="text-xs opacity-50">📄 [原文](https://blog.cloudflare.com/post-quantum-visibility/)</span> ・ <span class="text-xs">▶ <a href="../post-quantum-visibility/" target="_blank">解説スライド</a></span> ・ <span class="text-xs"><a href="../../docs/articles/2026-09-29-post-quantum-visibility.html" target="_blank">📖 解説記事</a></span>

</div>

<div class="pb-2 text-sm">

<strong>Application Profiles</strong><br>
HTTP リクエストの期待される構造を学習し、逸脱を特定して「正しい通信」を強制する（ポジティブセキュリティ）。<br>
<span class="text-xs opacity-50">📄 [原文](https://blog.cloudflare.com/application-profiles/)</span> ・ <span class="text-xs">▶ <a href="../application-profiles/" target="_blank">解説スライド</a></span> ・ <span class="text-xs"><a href="../../docs/articles/2026-09-29-application-profiles.html" target="_blank">📖 解説記事</a></span>

</div>

<div class="text-xs opacity-60 pt-1">
出典: Cloudflare Blog https://blog.cloudflare.com/birthday-week-2026-wrap-up/
</div>

---

# 火曜日（09/29）(3/3)

<div class="text-sm opacity-80 pb-2"><strong>エージェント型インターネットの安全を守る</strong></div>

<div class="pb-2 text-sm">

<strong>フロンティア AI で自社 WAF をテスト</strong><br>
適応型 AI レッドチームが 6 つの攻撃カテゴリで検知の隙間を見つけ、改善につなげた。<br>
<span class="text-xs opacity-50">📄 [原文](https://blog.cloudflare.com/adaptive-ai-waf-testing/)</span> ・ <span class="text-xs">▶ <a href="../adaptive-ai-waf-testing/" target="_blank">解説スライド</a></span> ・ <span class="text-xs"><a href="../../docs/articles/2026-09-29-adaptive-ai-waf-testing.html" target="_blank">📖 解説記事</a></span>

</div>

<div class="pb-2 text-sm">

<strong>Threat Signals</strong><br>
オープンソースの脅威情報を構造化した指標に変換し WAF ルールにつなぐ。Threat Events Platform は全アカウントに拡大。<br>
<span class="text-xs opacity-50">📄 [原文](https://blog.cloudflare.com/threat-signals/)</span> ・ <span class="text-xs">▶ <a href="../threat-signals/" target="_blank">解説スライド</a></span> ・ <span class="text-xs"><a href="../../docs/articles/2026-09-29-threat-signals.html" target="_blank">📖 解説記事</a></span>

</div>

<div class="pb-2 text-sm">

<strong>AI 時代の適応型アプリケーションセキュリティ</strong><br>
発見・ガバナンス・実行時保護・調査・対応を継続的な学習ループとして接続する枠組み。<br>
<span class="text-xs opacity-50">📄 [原文](https://blog.cloudflare.com/ai-era-framework/)</span> ・ <span class="text-xs">▶ <a href="../ai-era-framework/" target="_blank">解説スライド</a></span> ・ <span class="text-xs"><a href="../../docs/articles/2026-09-29-ai-era-framework.html" target="_blank">📖 解説記事</a></span>

</div>

<div class="text-xs opacity-60 pt-1">
出典: Cloudflare Blog https://blog.cloudflare.com/birthday-week-2026-wrap-up/
</div>

---

# 水曜日（09/30）(1/3)

<div class="text-sm opacity-80 pb-2"><strong>エージェント経済を動かす</strong>　Pay Per Use と Monetization Gateway ベータにより、クリエイターが自分のコンテンツやサービスを収益化できる新しい経済モデルを支える取り組みを示した日。</div>

<div class="pb-2 text-sm">

<strong>インターネットには「第二の読者」がいる</strong><br>
エージェントを可視化し、アクセス条件を設定し、利用されたら対価を得る戦略。<br>
<span class="text-xs opacity-50">📄 [原文](https://blog.cloudflare.com/agentic-web/)</span> ・ <span class="text-xs">▶ <a href="../agentic-web/" target="_blank">解説スライド</a></span> ・ <span class="text-xs"><a href="../../docs/articles/2026-09-30-agentic-web.html" target="_blank">📖 解説記事</a></span>

</div>

<div class="pb-2 text-sm">

<strong>Containers の作り直し</strong><br>
起動の高速化、イメージ・インスタンスの柔軟な選択、スケジューリング制御、永続ワークスペース向けのスナップショット。<br>
<span class="text-xs opacity-50">📄 [原文](https://blog.cloudflare.com/faster-agent-sandboxes/)</span> ・ <span class="text-xs">▶ <a href="../faster-agent-sandboxes/" target="_blank">解説スライド</a></span> ・ <span class="text-xs"><a href="../../docs/articles/2026-09-30-faster-agent-sandboxes.html" target="_blank">📖 解説記事</a></span>

</div>

<div class="pb-2 text-sm">

<strong>Monetization Gateway ベータ</strong><br>
Cloudflare 配下のリソースに価格を付け、HTTP 402 と x402 でエージェントから支払いを受け取る。<br>
<span class="text-xs opacity-50">📄 [原文](https://blog.cloudflare.com/monetization-gateway-beta/)</span> ・ <span class="text-xs">▶ <a href="../monetization-gateway-beta/" target="_blank">解説スライド</a></span> ・ <span class="text-xs"><a href="../../docs/articles/2026-09-30-monetization-gateway-beta.html" target="_blank">📖 解説記事</a></span>

</div>

<div class="text-xs opacity-60 pt-1">
出典: Cloudflare Blog https://blog.cloudflare.com/birthday-week-2026-wrap-up/
</div>

---

# 水曜日（09/30）(2/3)

<div class="text-sm opacity-80 pb-2"><strong>エージェント経済を動かす</strong></div>

<div class="pb-2 text-sm">

<strong>Pay Per Use</strong><br>
参加パブリッシャーは、検証済みの AI バイヤーがコンテンツを利用すると利用レポート・請求・支払いを受け取れる。<br>
<span class="text-xs opacity-50">📄 [原文](https://blog.cloudflare.com/pay-per-use/)</span> ・ <span class="text-xs">▶ <a href="../pay-per-use/" target="_blank">解説スライド</a></span> ・ <span class="text-xs"><a href="../../docs/articles/2026-09-30-pay-per-use.html" target="_blank">📖 解説記事</a></span>

</div>

<div class="pb-2 text-sm">

<strong>ドメインの簡素化</strong><br>
新しいドメイン検索と拡張された Registrar API で、人もエージェントも検索・登録・移管・管理しやすくなる。<br>
<span class="text-xs opacity-50">📄 [原文](https://blog.cloudflare.com/simplifying-domains/)</span> ・ <span class="text-xs">▶ <a href="../simplifying-domains/" target="_blank">解説スライド</a></span> ・ <span class="text-xs"><a href="../../docs/articles/2026-09-30-simplifying-domains.html" target="_blank">📖 解説記事</a></span>

</div>

<div class="pb-2 text-sm">

<strong>AI Gateway User Insights</strong><br>
タスクとモデルの適合性・過剰利用を特定し、より小さく安価なモデルで足りる箇所を見つける。<br>
<span class="text-xs opacity-50">📄 [原文](https://blog.cloudflare.com/ai-model-overuse-user-insights/)</span> ・ <span class="text-xs">▶ <a href="../ai-model-overuse-user-insights/" target="_blank">解説スライド</a></span> ・ <span class="text-xs"><a href="../../docs/articles/2026-09-30-ai-model-overuse-user-insights.html" target="_blank">📖 解説記事</a></span>

</div>

<div class="text-xs opacity-60 pt-1">
出典: Cloudflare Blog https://blog.cloudflare.com/birthday-week-2026-wrap-up/
</div>

---

# 水曜日（09/30）(3/3)

<div class="text-sm opacity-80 pb-2"><strong>エージェント経済を動かす</strong></div>

<div class="pb-2 text-sm">

<strong>Issues</strong><br>
Workers のエラーをグループ化し、スタックトレース・ログ・トレースをコーディングエージェントや任意の webhook に送る。<br>
<span class="text-xs opacity-50">📄 [原文](https://blog.cloudflare.com/real-time-issue-detection/)</span> ・ <span class="text-xs">▶ <a href="../real-time-issue-detection/" target="_blank">解説スライド</a></span> ・ <span class="text-xs"><a href="../../docs/articles/2026-09-30-real-time-issue-detection.html" target="_blank">📖 解説記事</a></span>

</div>

<div class="pb-2 text-sm">

<strong>AI Gateway の Auto Router</strong><br>
各リクエストをエッジで分類して適切なモデルへ送り、品質を保ちつつコストを下げる。<br>
<span class="text-xs opacity-50">📄 [原文](https://blog.cloudflare.com/auto-router/)</span> ・ <span class="text-xs">▶ <a href="../auto-router/" target="_blank">解説スライド</a></span> ・ <span class="text-xs"><a href="../../docs/articles/2026-09-30-auto-router.html" target="_blank">📖 解説記事</a></span>

</div>

<div class="pb-2 text-sm">

<strong>Cloudflare Impact が 1 億ドルに到達</strong><br>
Project Galileo・Athenian Project・Cloudflare for Campaigns などで提供したサービスの累計。<br>
<span class="text-xs opacity-50">📄 [原文](https://blog.cloudflare.com/100-million-donations/)</span> ・ <span class="text-xs">▶ <a href="../100-million-donations/" target="_blank">解説スライド</a></span> ・ <span class="text-xs"><a href="../../docs/articles/2026-09-30-100-million-donations.html" target="_blank">📖 解説記事</a></span>

</div>

<div class="text-xs opacity-60 pt-1">
出典: Cloudflare Blog https://blog.cloudflare.com/birthday-week-2026-wrap-up/
</div>

---

# 木曜日（10/01）(1/3)

<div class="text-sm opacity-80 pb-2"><strong>開発者スタックを Cloudflare にさらに広げる</strong>　データ分析基盤 Cloudflare Basin の一般提供、永続的なサーバーレスイベントストリーム K2、エージェント時代の Git プラットフォームを作るコンペなどで、プラットフォームでできることを広げた日。</div>

<div class="pb-2 text-sm">

<strong>Cloudflare Basin 一般提供</strong><br>
Apache Iceberg と R2 の上で、大規模データの取り込み・管理・クエリを行うサーバーレスデータプラットフォーム。<br>
<span class="text-xs opacity-50">📄 [原文](https://blog.cloudflare.com/cloudflare-basin/)</span> ・ <span class="text-xs">▶ <a href="../cloudflare-basin/" target="_blank">解説スライド</a></span> ・ <span class="text-xs"><a href="../../docs/articles/2026-10-01-cloudflare-basin.html" target="_blank">📖 解説記事</a></span>

</div>

<div class="pb-2 text-sm">

<strong>Workers の最新暗号アルゴリズム対応</strong><br>
ML-KEM と ML-DSA をオプトインでネイティブ Web Crypto から使え、ポスト量子プリミティブを自前でバンドルせずに済む。<br>
<span class="text-xs opacity-50">📄 [原文](https://blog.cloudflare.com/workers-ml-kem-ml-dsa-support/)</span> ・ <span class="text-xs opacity-70">（本リポジトリ未収録）</span>

</div>

<div class="pb-2 text-sm">

<strong>AI Search 一般提供</strong><br>
ビジュアル検索、スキャン PDF の OCR、より大きなファイル、任意のチャットモデルへの対応。<br>
<span class="text-xs opacity-50">📄 [原文](https://blog.cloudflare.com/ai-search-ga/)</span> ・ <span class="text-xs">▶ <a href="../ai-search-ga/" target="_blank">解説スライド</a></span> ・ <span class="text-xs"><a href="../../docs/articles/2026-10-01-ai-search-ga.html" target="_blank">📖 解説記事</a></span>

</div>

<div class="text-xs opacity-60 pt-1">
出典: Cloudflare Blog https://blog.cloudflare.com/birthday-week-2026-wrap-up/
</div>

---

# 木曜日（10/01）(2/3)

<div class="text-sm opacity-80 pb-2"><strong>開発者スタックを Cloudflare にさらに広げる</strong></div>

<div class="pb-2 text-sm">

<strong>次の Git プラットフォームを作ってほしい</strong><br>
Artifacts がオープンベータになり、AI エージェント時代の Git を作るコンペを開催。<br>
<span class="text-xs opacity-50">📄 [原文](https://blog.cloudflare.com/next-git-platform-on-cloudflare/)</span> ・ <span class="text-xs">▶ <a href="../next-git-platform-on-cloudflare/" target="_blank">解説スライド</a></span> ・ <span class="text-xs"><a href="../../docs/articles/2026-10-01-next-git-platform-on-cloudflare.html" target="_blank">📖 解説記事</a></span>

</div>

<div class="pb-2 text-sm">

<strong>Cloudflare K2</strong><br>
R2 上の永続的で順序付きのイベントストリーム。ブローカークラスタの運用なしにプロデューサーとコンシューマーを分離する。<br>
<span class="text-xs opacity-50">📄 [原文](https://blog.cloudflare.com/cloudflare-k2-streams/)</span> ・ <span class="text-xs">▶ <a href="../cloudflare-k2-streams/" target="_blank">解説スライド</a></span> ・ <span class="text-xs"><a href="../../docs/articles/2026-10-01-cloudflare-k2-streams.html" target="_blank">📖 解説記事</a></span>

</div>

<div class="pb-2 text-sm">

<strong>Cloudflare OS のマネージド提供</strong><br>
組織のデータやシステムに接続したエージェントワークスペースで、フルマネージド版はウェイトリスト受付中。<br>
<span class="text-xs opacity-50">📄 [原文](https://blog.cloudflare.com/managed-cloudflare-os/)</span> ・ <span class="text-xs">▶ <a href="../managed-cloudflare-os/" target="_blank">解説スライド</a></span> ・ <span class="text-xs"><a href="../../docs/articles/2026-10-01-managed-cloudflare-os.html" target="_blank">📖 解説記事</a></span>

</div>

<div class="text-xs opacity-60 pt-1">
出典: Cloudflare Blog https://blog.cloudflare.com/birthday-week-2026-wrap-up/
</div>

---

# 木曜日（10/01）(3/3)

<div class="text-sm opacity-80 pb-2"><strong>開発者スタックを Cloudflare にさらに広げる</strong></div>

<div class="pb-2 text-sm">

<strong>Workers KV Instant</strong><br>
Quicksilver で動き、300 拠点超で p99 読み取り 2 ミリ秒未満・高速なグローバル複製を、従来の KV API のまま実現。<br>
<span class="text-xs opacity-50">📄 [原文](https://blog.cloudflare.com/workers-kv-instant/)</span> ・ <span class="text-xs">▶ <a href="../workers-kv-instant/" target="_blank">解説スライド</a></span> ・ <span class="text-xs"><a href="../../docs/articles/2026-10-01-workers-kv-instant.html" target="_blank">📖 解説記事</a></span>

</div>

<div class="pb-2 text-sm">

<strong>1 年後のソブリン AI</strong><br>
ローカルのオープンモデルの選択肢とモデル非依存のセキュリティツールを広げ、孤立せずに AI 主権を追える。<br>
<span class="text-xs opacity-50">📄 [原文](https://blog.cloudflare.com/sovereign-ai-choice-one-year-later/)</span> ・ <span class="text-xs">▶ <a href="../sovereign-ai-choice-one-year-later/" target="_blank">解説スライド</a></span> ・ <span class="text-xs"><a href="../../docs/articles/2026-10-01-sovereign-ai-choice-one-year-later.html" target="_blank">📖 解説記事</a></span>

</div>

<div class="pb-2 text-sm">

<strong>Clef</strong><br>
高速な分類やエージェントワークフロー向けのオープンソース decision model（Clef・Clef-flash）と、RL ファインチューニング基盤。<br>
<span class="text-xs opacity-50">📄 [原文](https://blog.cloudflare.com/clef-decision-models/)</span> ・ <span class="text-xs">▶ <a href="../clef-decision-models/" target="_blank">解説スライド</a></span> ・ <span class="text-xs"><a href="../../docs/articles/2026-10-01-clef-decision-models.html" target="_blank">📖 解説記事</a></span>

</div>

<div class="text-xs opacity-60 pt-1">
出典: Cloudflare Blog https://blog.cloudflare.com/birthday-week-2026-wrap-up/
</div>

---

# 金曜日（10/02）(1/4)

<div class="text-sm opacity-80 pb-2"><strong>より速く、シンプルに、誰にとっても使いやすく</strong>　Cloudflare Observability の大型アップデートと Cloudflare Traces、ネットワーク性能の改善、市民社会組織への支援などで締めくくった日。</div>

<div class="pb-2 text-sm">

<strong>Observability の 8 つの大型アップデート</strong><br>
ログ・トレース・分析・アラート・ダッシュボード・クエリ・テレメトリ出力を 1 つのプラットフォームに統合し、料金も簡素化。<br>
<span class="text-xs opacity-50">📄 [原文](https://blog.cloudflare.com/one-observability-platform/)</span> ・ <span class="text-xs">▶ <a href="../one-observability-platform/" target="_blank">解説スライド</a></span> ・ <span class="text-xs"><a href="../../docs/articles/2026-10-02-one-observability-platform.html" target="_blank">📖 解説記事</a></span>

</div>

<div class="pb-2 text-sm">

<strong>Cloudflare Traces</strong><br>
エージェントや SDK なしで、セキュリティルール・変換・キャッシュ・Workers・サービス・オリジンまで、リクエスト単位で可視化する。<br>
<span class="text-xs opacity-50">📄 [原文](https://blog.cloudflare.com/cloudflare-tracing/)</span> ・ <span class="text-xs">▶ <a href="../cloudflare-tracing/" target="_blank">解説スライド</a></span> ・ <span class="text-xs"><a href="../../docs/articles/2026-10-02-cloudflare-tracing.html" target="_blank">📖 解説記事</a></span>

</div>

<div class="pb-2 text-sm">

<strong>「全員が使える」誓約のアップデート</strong><br>
Logpush・マルチアカウントガバナンス・上限引き上げなどが、より多くのプランで使えるようになった。<br>
<span class="text-xs opacity-50">📄 [原文](https://blog.cloudflare.com/enterprise-for-all-update/)</span> ・ <span class="text-xs">▶ <a href="../enterprise-for-all-update/" target="_blank">解説スライド</a></span> ・ <span class="text-xs"><a href="../../docs/articles/2026-10-02-enterprise-for-all-update.html" target="_blank">📖 解説記事</a></span>

</div>

<div class="text-xs opacity-60 pt-1">
出典: Cloudflare Blog https://blog.cloudflare.com/birthday-week-2026-wrap-up/
</div>

---

# 金曜日（10/02）(2/4)

<div class="text-sm opacity-80 pb-2"><strong>より速く、シンプルに、誰にとっても使いやすく</strong></div>

<div class="pb-2 text-sm">

<strong>OHTTP Gateway</strong><br>
セルフサービスのクローズドベータが始まり、役割を区別するため Privacy Gateway は OHTTP Relay に改称。<br>
<span class="text-xs opacity-50">📄 [原文](https://blog.cloudflare.com/announcing-cloudflare-ohttp-gateway/)</span> ・ <span class="text-xs">▶ <a href="../announcing-cloudflare-ohttp-gateway/" target="_blank">解説スライド</a></span> ・ <span class="text-xs"><a href="../../docs/articles/2026-10-02-announcing-cloudflare-ohttp-gateway.html" target="_blank">📖 解説記事</a></span>

</div>

<div class="pb-2 text-sm">

<strong>アカウント不正の調査ダッシュボード</strong><br>
ステートフルな分析とプライバシー保護の Hashed User ID で、クレデンシャルスタッフィングや偽アカウント作成を調査する。<br>
<span class="text-xs opacity-50">📄 [原文](https://blog.cloudflare.com/account-abuse-protection-dashboard/)</span> ・ <span class="text-xs">▶ <a href="../account-abuse-protection-dashboard/" target="_blank">解説スライド</a></span> ・ <span class="text-xs"><a href="../../docs/articles/2026-10-02-account-abuse-protection-dashboard.html" target="_blank">📖 解説記事</a></span>

</div>

<div class="pb-2 text-sm">

<strong>Protected Quick Tunnels</strong><br>
メール認証により、Cloudflare アカウントなしでローカルアプリを特定の相手やドメインと共有できる。<br>
<span class="text-xs opacity-50">📄 [原文](https://blog.cloudflare.com/protected-quick-tunnels/)</span> ・ <span class="text-xs">▶ <a href="../protected-quick-tunnels/" target="_blank">解説スライド</a></span> ・ <span class="text-xs"><a href="../../docs/articles/2026-10-02-protected-quick-tunnels.html" target="_blank">📖 解説記事</a></span>

</div>

<div class="text-xs opacity-60 pt-1">
出典: Cloudflare Blog https://blog.cloudflare.com/birthday-week-2026-wrap-up/
</div>

---

# 金曜日（10/02）(3/4)

<div class="text-sm opacity-80 pb-2"><strong>より速く、シンプルに、誰にとっても使いやすく</strong></div>

<div class="pb-2 text-sm">

<strong>市民社会組織の自動化</strong><br>
人権や公益を守る活動のスケールに、Cloudflare の開発者プラットフォームが使われている。<br>
<span class="text-xs opacity-50">📄 [原文](https://blog.cloudflare.com/civil-society-automation/)</span> ・ <span class="text-xs">▶ <a href="../civil-society-automation/" target="_blank">解説スライド</a></span> ・ <span class="text-xs"><a href="../../docs/articles/2026-10-02-civil-society-automation.html" target="_blank">📖 解説記事</a></span>

</div>

<div class="pb-2 text-sm">

<strong>ネットワーク性能アップデート</strong><br>
拡張した実ユーザー計測の手法で、上位 1,000 ネットワークの 74% で最速のプロバイダーとなった。<br>
<span class="text-xs opacity-50">📄 [原文](https://blog.cloudflare.com/network-performance-birthday-week-2026/)</span> ・ <span class="text-xs">▶ <a href="../network-performance-birthday-week-2026/" target="_blank">解説スライド</a></span> ・ <span class="text-xs"><a href="../../docs/articles/2026-10-02-network-performance-birthday-week-2026.html" target="_blank">📖 解説記事</a></span>

</div>

<div class="text-xs opacity-60 pt-1">
出典: Cloudflare Blog https://blog.cloudflare.com/birthday-week-2026-wrap-up/
</div>

---

# 金曜日（10/02）(4/4)

<div class="text-sm opacity-80 pb-2"><strong>より速く、シンプルに、誰にとっても使いやすく</strong></div>

<div class="pb-2 text-sm">

<strong>AI Gateway の Web Search API</strong><br>
複数プロバイダーの最新の Web 情報を、REST API・Workers バインディング・顧客管理キーでモデル呼び出しに取り込む。<br>
<span class="text-xs opacity-50">📄 [原文](https://blog.cloudflare.com/introducing-web-search-api/)</span> ・ <span class="text-xs">▶ <a href="../introducing-web-search-api/" target="_blank">解説スライド</a></span> ・ <span class="text-xs"><a href="../../docs/articles/2026-10-02-introducing-web-search-api.html" target="_blank">📖 解説記事</a></span>

</div>

<div class="pb-2 text-sm">

<strong>Streamline</strong><br>
Workers・Durable Objects・コンテナ化したメディアエンジンを組み合わせる、連続動画パイプラインのオープンソース例。<br>
<span class="text-xs opacity-50">📄 [原文](https://blog.cloudflare.com/streamline/)</span> ・ <span class="text-xs">▶ <a href="../streamline/" target="_blank">解説スライド</a></span> ・ <span class="text-xs"><a href="../../docs/articles/2026-10-02-streamline.html" target="_blank">📖 解説記事</a></span>

</div>

<div class="text-xs opacity-60 pt-1">
出典: Cloudflare Blog https://blog.cloudflare.com/birthday-week-2026-wrap-up/
</div>

---

# 週の前後の記事

<div class="pb-3">

<strong>『Cloudflare 2026年度創業者レター』</strong><br>
週の総論。自動化トラフィックの増加やエージェント時代の変化を踏まえた全体方針<br>
<span class="text-xs opacity-50">📄 [原文](https://blog.cloudflare.com/cloudflares-2026-annual-founders-letter/)</span> ・ <span class="text-xs">▶ <a href="../cloudflares-2026-annual-founders-letter/" target="_blank">解説スライド</a></span> ・ <span class="text-xs"><a href="../../docs/articles/2026-09-27-cloudflares-2026-annual-founders-letter.html" target="_blank">📖 解説記事</a></span>

</div>

<div class="pb-3">

<strong>『1年後の振り返り: 1.1.1.1 人のインターンが生んだ力』</strong><br>
Birthday Week のフォローアップ。EmDash・ポスト量子の可視化・CryptoLabe・Protected Quick Tunnels にインターンが直接貢献<br>
<span class="text-xs opacity-50">📄 [原文](https://blog.cloudflare.com/one-year-later-1111-interns/)</span> ・ <span class="text-xs">▶ <a href="../one-year-later-1111-interns/" target="_blank">解説スライド</a></span> ・ <span class="text-xs"><a href="../../docs/articles/2026-10-05-one-year-later-1111-interns.html" target="_blank">📖 解説記事</a></span>

</div>

---

# 記事の構成とコード例について

- 本記事は週の発表を日別の表で並べた「目次」であり、<strong>コード例（コードブロック）は含まれない</strong>
- 代わりに、各発表の位置づけと詳細記事への経路を整理したのが本スライドの前半
- 実装レベルの詳細は、各スライド・Wiki（コード例を含むものもある）で確認できる

## 読み方（ユースケース）

- **領域から探す**: セキュリティ・エージェント経済・データ基盤・可観測性などを日別のテーマから選ぶ
- **見逃しを拾う**: 46 件と多いため、一文要約で内容を把握して必要なものだけ深掘りする

---

# まとめ: 5 日間で見えた方向性

1. **オープンなツール**（月曜）: CLI・SDK 生成・CMS・Vite エコシステムなど、開発者が形を変えられる基盤
2. **新しい脅威に追いつくセキュリティ**（火曜）: 認証局、ポスト量子移行、AI 時代のアプリケーションセキュリティ
3. **エージェントと作り手の公正な対価**（水曜）: Pay Per Use、Monetization Gateway、エージェントの可視化
4. **エージェント時代のインフラ**（木曜）: Basin・K2・KV Instant・AI Search・Git プラットフォーム
5. **速く、簡単に、誰にとっても**（金曜）: Observability、Traces、性能、市民社会への支援

<div class="pt-4 opacity-80 text-sm">

本リポジトリには 46 件中 45 件の解説があり、未収録は Workers の ML-KEM / ML-DSA 対応の 1 件

</div>

---

# 参考リンク (1/2)

<div class="text-sm">

**週まとめ記事**: https://blog.cloudflare.com/birthday-week-2026-wrap-up/

**月曜日**: https://blog.cloudflare.com/cloudflare-cf-cli-launch/ ・ https://blog.cloudflare.com/forge-open-source-generation-pipeline/ ・ https://blog.cloudflare.com/emdash-cms-plugin-registry/ ・ https://blog.cloudflare.com/voidzero-update/ ・ https://blog.cloudflare.com/vinext-nextjs-on-vite/ ・ https://blog.cloudflare.com/kitesurf-update/ ・ https://blog.cloudflare.com/how-fast-is-the-web/ ・ https://blog.cloudflare.com/rust-workers-emscripten-target/ ・ https://blog.cloudflare.com/introducing-the-cold-start/

**火曜日**: https://blog.cloudflare.com/cloudflare-certificate-authority/ ・ https://blog.cloudflare.com/pq-ca-with-mtcs/ ・ https://blog.cloudflare.com/ai-driven-cryptography-discovery/ ・ https://blog.cloudflare.com/ipsec-downgrade-protection/ ・ https://blog.cloudflare.com/post-quantum-visibility/ ・ https://blog.cloudflare.com/application-profiles/ ・ https://blog.cloudflare.com/adaptive-ai-waf-testing/ ・ https://blog.cloudflare.com/threat-signals/ ・ https://blog.cloudflare.com/ai-era-framework/

**水曜日**: https://blog.cloudflare.com/agentic-web/ ・ https://blog.cloudflare.com/faster-agent-sandboxes/ ・ https://blog.cloudflare.com/monetization-gateway-beta/ ・ https://blog.cloudflare.com/pay-per-use/ ・ https://blog.cloudflare.com/simplifying-domains/ ・ https://blog.cloudflare.com/ai-model-overuse-user-insights/ ・ https://blog.cloudflare.com/real-time-issue-detection/ ・ https://blog.cloudflare.com/auto-router/ ・ https://blog.cloudflare.com/100-million-donations/

</div>

---

# 参考リンク (2/2)

<div class="text-sm">

**木曜日**: https://blog.cloudflare.com/cloudflare-basin/ ・ https://blog.cloudflare.com/workers-ml-kem-ml-dsa-support/ ・ https://blog.cloudflare.com/ai-search-ga/ ・ https://blog.cloudflare.com/next-git-platform-on-cloudflare/ ・ https://blog.cloudflare.com/cloudflare-k2-streams/ ・ https://blog.cloudflare.com/managed-cloudflare-os/ ・ https://blog.cloudflare.com/workers-kv-instant/ ・ https://blog.cloudflare.com/sovereign-ai-choice-one-year-later/ ・ https://blog.cloudflare.com/clef-decision-models/

**金曜日**: https://blog.cloudflare.com/one-observability-platform/ ・ https://blog.cloudflare.com/cloudflare-tracing/ ・ https://blog.cloudflare.com/enterprise-for-all-update/ ・ https://blog.cloudflare.com/announcing-cloudflare-ohttp-gateway/ ・ https://blog.cloudflare.com/account-abuse-protection-dashboard/ ・ https://blog.cloudflare.com/protected-quick-tunnels/ ・ https://blog.cloudflare.com/civil-society-automation/ ・ https://blog.cloudflare.com/network-performance-birthday-week-2026/ ・ https://blog.cloudflare.com/introducing-web-search-api/ ・ https://blog.cloudflare.com/streamline/

**週の前後**: https://blog.cloudflare.com/cloudflares-2026-annual-founders-letter/ ・ https://blog.cloudflare.com/one-year-later-1111-interns/

</div>
