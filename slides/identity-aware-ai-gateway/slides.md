---
routerMode: hash
theme: default
title: ID情報に基づく分析で、不正なAIの利用を検出
info: |
  Cloudflare Blog記事「ID情報に基づく分析で、不正なAIの利用を検出」の解説スライド。
  原文: https://blog.cloudflare.com/ja-jp/identity-aware-ai-gateway/
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

# ID情報に基づく分析で、
# 不正なAIの利用を検出

Identity-aware AI Gateway と User Insights

<div class="pt-4 text-sm opacity-70">
原文: https://blog.cloudflare.com/ja-jp/identity-aware-ai-gateway/<br>
公開日: 2026-08-10
</div>

---

# TL;DR


- AI利用の請求書だけでは異常を判断しづらく、「通常の利用パターン」の把握が鍵になる
- Cloudflare Accessと連携する**Identity-aware AI Gateway**がオープンベータで、全リクエストに確認済みユーザーIDを紐付け
- **User Insights**が全AI Gateway利用者に無償提供され、普段の利用パターンからの逸脱を検知
- 異常判定は、そのアカウントのp95の**2倍**、かつ組織全体のp99を超えるかという相対基準で行う


---

# アジェンダ


- 背景・課題: 請求書だけでは異常が分からない
- AI Gatewayという中央管理基盤
- Identity-aware AI Gateway
- User Insights: 行動パターンからの異常検知
- 異常検知の仕組み（3つの図で見る）
- ユースケースと今後の展開


---

# 背景: 「知識不足」というガバナンスの壁


- AIの請求書を見ても、その支出が妥当かどうか判断は難しい
- 「通常の利用状況」という基準があって初めて逸脱に気付ける
- スタンフォード大学の調査: **59%の組織**が
  「責任あるAIガバナンス最大の障害は知識不足」と回答
- 課題解決には2つの要素が必要
  1. すべてのリクエストに確認済みのIDを紐付けること
  2. そのIDの普段の利用状況を把握すること


---

# AI Gateway: 中央管理基盤


- OpenAI・Anthropic・Google・Workers AIへの直接呼び出しをやめ、
  すべてAI Gatewayを経由させる
- すべてのAI利用を横断的に観察・保護・管理できる
- Claude Code・Codex・GitHub Copilotなどコーディングツールにも対応
  - 開発ツールのAI利用も可視化・アクセス制御の対象にできる


---

# Identity-aware AI Gateway


- AI GatewayとCloudflare Accessを連携
- ゲートウェイ前段にバニティドメインを置き、Accessで保護
- OktaやEntraなど、SAML対応の任意のIDプロバイダーで認証
- 誰がゲートウェイにアクセスできるかを細かく管理
- `ai.example.com`のようなシンプルなホスト名でリクエスト送信


---

# `cf.user_id`によるID紐付け


- Accessで認証されたリクエストにユーザーID情報が付与される
- AI Gatewayが確認済みのAccessユーザーIDを
  `cf.user_id`というメタデータに追加
- ユーザー単位でログ・分析情報・AI利用料金を確認・集計できる
- 利用料金の上限設定と組み合わせ、ユーザー単位の予算管理も可能
  - 上限到達でブロック、または安価なモデルへ自動切替


---

# 早期導入企業: Flexportの声


> 共有APIキーでは、誰がAIサービスを利用しているのかを
> 把握することがほぼ不可能であり、従業員向けに設定している
> 既存のアクセスルールを適用することも困難です。
> Cloudflare AccessをAI Gatewayの前段に配置することで、
> 各リクエストに認証済みのIDを付与でき、既存のID管理ポリシーを
> ゲートウェイで利用できるようになります。


<div class="text-right text-sm opacity-70 pt-2">
— Max Baumgarten氏, Staff Security Engineer, Flexport
</div>

---
class: text-center
---

# User Insights
行動パターンからの異常検知

---

# User Insightsとは


- AI Gatewayに新設された「User Insights」タブ
- 各アカウントの通常の利用パターンを学習
- そこから外れた利用を特定し、判断材料を提供
  - 「不正なAIエージェントの異常動作」か「単なる利用増加」か
- 既存の通信を利用するため、追加の導入作業は不要
- コスト増加要因（低いキャッシュヒット率など）の把握にも活用


---

# 人間とエージェントで異なる利用パターン


- エージェント（例: 3時間ごとの要約タスク）は行動パターンが安定
- 人間はプロンプト内容・時間帯・作業の長さで不規則になりがち
- 同じ変化でも、エージェントは異常の兆候、人間は単なるばらつき
  という場合がある
- → セッション単位で、**そのアカウント自身の履歴**と比較する


---

# 基準値の作り方: p95の2倍


- 普段利用量が多いユーザーが+500ドルでも通常の範囲かもしれない
- 普段5ドルのエージェントが50ドル使えば10倍 → 重大な異常の疑い
- 固定しきい値ではこの違いを判断できない
- → 過去30日間のセッションコストの**p95**（95パーセンタイル）を基準に
  - セッションコストがその**2倍**を超えたら異常の可能性


---
layout: image-right
image: https://blog.cloudflare.com/_emdash/api/media/file/01KZ7B4VMH9D9FYZTWDMRSWZJS.png
backgroundSize: contain
---

# 図1: セッションコストの異常検知


- X軸: セッションコスト（対数）
- Y軸: ユーザー自身のp95基準値に対する倍率（対数）
- 2本の破線: 2× User p95 と アカウント全体のp99


<footer class="text-xs opacity-50 mt-4">
出典: Cloudflare Blog https://blog.cloudflare.com/ja-jp/identity-aware-ai-gateway/
</footer>

---

# 図1の4象限


- **右上（★）**: 両方の基準値を超える → **アラート対象**
- **左上**: ユーザー基準値は超えるがp99未満 → アラートなし
  （少額増加による不要なアラートを防ぐ）
- **右下**: 高額だが普段からその程度の利用 → アラートなし
- **左下**: どちらの基準値も超えない → 通常の利用


---
layout: image-right
image: https://blog.cloudflare.com/_emdash/api/media/file/01KZ7B4V6XV5D14V3FW55YHKTZ.png
backgroundSize: contain
---

# 図2: アカウント全体のコスト分布


- 大半のセッションは10ドル未満
- p95 = 20ドル
- p99 = 200ドル（全体の上位わずか1%）



<div class="pt-4 text-sm">

p99を「絶対的な上限」として併用することで、
特定ユーザーの増加だけでなく組織全体で見た希少性も条件にする

</div>


<footer class="text-xs opacity-50 mt-4">
出典: Cloudflare Blog https://blog.cloudflare.com/ja-jp/identity-aware-ai-gateway/
</footer>

---
layout: image-right
image: https://blog.cloudflare.com/_emdash/api/media/file/01KZ7B4VJ083H8C3Q82M6D6Q6W.png
backgroundSize: contain
---

# 図3: 単一ユーザーのセッション履歴


- 基準値は固定ではない
- 過去30日間のp95（緑線）としきい値（オレンジ線）が
  利用傾向の変化に応じて自動更新される
- コストには最低金額も設定
  - 「統計的異常」かつ「調査する価値のある金額」が条件


<footer class="text-xs opacity-50 mt-4">
出典: Cloudflare Blog https://blog.cloudflare.com/ja-jp/identity-aware-ai-gateway/
</footer>

---
layout: image-right
image: https://blog.cloudflare.com/_emdash/api/media/file/01KZBWJPJZPCZJYCR5D89H0DZ3.png
backgroundSize: contain
---

# 不正利用を検出する最適な視点


- 通常の利用を除外し、自身の通常パターンから
  外れた利用だけを表示
- 不審な利用の一覧フィードとして機能
- 分かりやすい兆候（禁止操作等）ではなく、
  信頼されたアカウントによる許可済み操作が対象


<footer class="text-xs opacity-50 mt-4">
出典: Cloudflare Blog https://blog.cloudflare.com/ja-jp/identity-aware-ai-gateway/
</footer>

---
layout: image-right
image: https://blog.cloudflare.com/_emdash/api/media/file/01KZ93AY5C3BJQW575MS95PZXC.png
backgroundSize: contain
---

# User Insightsの役割の境界


- 意図の判断や自動ブロックは行わない
- 通常パターンから外れた**少数のアカウント**を管理者に提示
- 本格的なセキュリティ調査に発展する場合もあれば、
  単なるユーザー指導で済む場合もある


<footer class="text-xs opacity-50 mt-4">
出典: Cloudflare Blog https://blog.cloudflare.com/ja-jp/identity-aware-ai-gateway/
</footer>

---
class: text-center
---

# ユースケース

---

# ユースケース①: 共有APIキーからの脱却


- Flexportの事例: 共有APIキーでは利用者を特定できない
- Cloudflare Accessを前段に置き、認証済みIDを各リクエストに付与
- 既存のID管理ポリシーをそのままゲートウェイに適用
- クライアントごとの個別認証システム構築が不要に


---

# ユースケース②③: 予算管理とリスク検知


- **ユーザー単位の予算管理**
  - `cf.user_id`で集計・上限設定
  - 上限到達で安価なモデルへ自動切替
- **インサイダーリスク・資格情報不正利用の早期検知**
  - 普段5ドルのサービスアカウントが突然50ドル使うケースを検知
  - 固定しきい値では見逃されがちな異常を発見


---

# 今後の展開


- **コスト最適化**: タスクベースのスマートルーティングを開発中
  - リクエスト内容を分析し、必要な品質を保ちつつ低コストなモデルへ
- **利用目的の自動分類**: プロンプト分類機能を開発中
  - 「コーディング」「文章作成」等のカテゴリに自動分類
  - いつものカテゴリと異なる急増を見分けやすくする


---

# まとめ


- Identity-aware AI Gatewayで、すべてのAI利用リクエストに
  確認済みIDを紐付け可能に
- User Insightsは追加費用なしで全AI Gatewayユーザーに提供
- 固定しきい値ではなく、アカウント自身のp95×2とp99の
  2軸で異常を判定
- 人間とエージェントの利用パターンの違いを前提に設計
- 今後はコスト最適化・利用目的の自動分類へと発展予定


---

<div class="text-center">

# 参考リンク

</div>

- 原文: [ID情報に基づく分析で、不正なAIの利用を検出](https://blog.cloudflare.com/ja-jp/identity-aware-ai-gateway/)
- 英語版: [Detect rogue AI usage with identity-aware analysis](https://blog.cloudflare.com/identity-aware-ai-gateway/)
- 関連解説スライド: [Cloudflare OS：エージェント、アプリ、作業のためのオープンプラットフォーム](../cloudflare-os/)
- [AI Gateway](https://developers.cloudflare.com/ai-gateway/)
- [Cloudflare Access（AI Gatewayとの連携）](https://developers.cloudflare.com/ai-gateway/configuration/cloudflare-access)
- [利用料金の上限設定](https://developers.cloudflare.com/ai-gateway/features/spend-limits/)

<div class="pt-8 text-sm opacity-50">
Wiki: docs/articles/2026-08-05-identity-aware-ai-gateway.md
</div>
