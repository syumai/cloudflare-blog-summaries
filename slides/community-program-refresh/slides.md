---
theme: default
title: Cloudflare Ambassadors、Community Engineers を発表
info: |
  Cloudflare Ambassadors・Community Engineers を発表する記事の解説スライド。
  原文: https://blog.cloudflare.com/community-program-refresh/
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

# Cloudflare Ambassadors、
# Community Engineers を発表

オープンソースへ2年間で追加100万ドルを投資

<div class="pt-8 opacity-70 text-sm">

原文: https://blog.cloudflare.com/community-program-refresh/

公開日: 2026-08-07

</div>

---

# アジェンダ


- 背景: コミュニティ支援のギャップ
- Cloudflare Ambassadors トラック
- Cloudflare Community Engineers トラック
- Discordコミュニティの改善
- 本記事の位置づけ（コード例は無し）
- ユースケース
- まとめ・所感
- 参考リンク


---

# 背景: 2種類の支援ギャップ

Cloudflareは「インターネットを構築するプラットフォーム」として、
Workers・Discord・オープンソースを通じたコミュニティが既に存在していた


- **草の根の伝道者への支援不足**: 勉強会・ハッカソンを主催する個人への体系的な支援がなかった
- **OSSメンテナーへの直接支援の不足**: `workerd` や `quiche` など、自社が公開・依拠するOSSの貢献者を直接支援する仕組みが限定的だった



これらを埋めるため、既存の取り組み（TanStackスポンサーシップ、VoidZero買収時のVite支援）を土台に、制度化された2トラックのプログラムとして再構成


---

# プログラム全体像

<div class="grid grid-cols-2 gap-6 pt-4">

<div>

### 🧑‍🤝‍🧑 Cloudflare Ambassadors
自身のコミュニティに
Cloudflareを広める人向け

</div>

<div>

### 🛠️ Cloudflare Community Engineers
インターネットを支える
OSSプロジェクトの貢献者向け

</div>

</div>


<div class="pt-8">

共通のハブ: `cloudflare.com/community`

</div>


<div class="text-xs opacity-60 pt-8">
出典: Cloudflare Blog https://blog.cloudflare.com/community-program-refresh/
</div>

---

# Cloudflare Ambassadors とは


- 年1回の応募プロセスで選出、**任期は最大2年間**
- 役割: 地元ミートアップ開催、学生グループの主導、学習スペースの創出、チュートリアル執筆など
- 支援内容: クレジット・マーケティング素材・技術リソース
- Discordなどのオンラインコミュニティスペースで目立つ役割（バッジ的立場）を付与


---

# Ambassadors 応募スケジュール

<div class="grid grid-cols-3 gap-4 pt-6 text-center">

<div class="p-4 rounded" style="background: rgba(246,130,31,0.1)">

### 受付開始
本記事公開と同時

</div>

<div class="p-4 rounded" style="background: rgba(246,130,31,0.1)">

### 締切
**9月6日**

</div>

<div class="p-4 rounded" style="background: rgba(246,130,31,0.1)">

### 通知
**10月5日**

</div>

</div>


<div class="pt-8 text-sm opacity-70">

記事内では、ミシガン大学でコンピュータサイエンスを専攻し
Cloudflareで採用オペレーションズインターンも務める
Sruthi Pereddy さんのコメントが事例として紹介されている

</div>


---

# Cloudflare Community Engineers とは


- 対象: Cloudflareの開発者プラットフォームが依拠する、または自社公開のOSS（`workerd`、`quiche` など）の貢献者・メンテナー
- 先行事例: TanStack（Tanner Linsley氏がCEO）へのスポンサーシップ
- Ambassadorsと異なり**最大在任期間の上限なし**（OSS特有の不規則な貢献サイクルに配慮）
- 初期フォーカス: Astro、Agents SDK、EmDash、Hono、Vinext など、Cloudflareの OSS の活動範囲にあるプロジェクト


---

# Community Engineers への投資


> 今後2年間で、オープンソースプロジェクトの支援に
> **新たに100万ドルを追加投資**



- VoidZero買収に伴い既にコミットしていた、Viteコミュニティ向けの100万ドルとは**別枠**
- 適格と認められたCommunity Engineersは、この基金から助成金を受給できる
- Discordなどでの特別な役職付与も予定
- 応募開始時期は本記事公開時点では未定（「後日開始」とのみ案内）


<div class="text-xs opacity-60 pt-6">
出典: Cloudflare Blog https://blog.cloudflare.com/community-program-refresh/
</div>

---

# Discordコミュニティの改善 (1/2)


- Cloudflare公式Discordは2020年開設以来、**約10万人**が参加する規模に成長
- 質問対応・プロジェクト共有・フィードバック収集の主要な場に
- 規模拡大に伴い、健全性を維持する運営体制の強化が課題に


---

# Discordコミュニティの改善 (2/2)


- 対策: **Cloudflare Ambassadors + スタッフ**からなる新しい「Discord委員会」を設置
- 重点はモデレーション・管理業務そのものではない
  - スパム・悪質リンクへの防御は自動化ツールで対応（新機能を開発中）
- 委員会はコンテンツのキュレーション・機会の提供・社内チームとの橋渡しに集中
- これらの防御ツールは将来的に**オープンソースとして公開・共有**する計画


---
class: text-center
---

# 本記事の位置づけについて

コード例は含まれていません

---

# コード例が無い記事です


この記事は、コミュニティプログラムの**制度設計・運営体制**に関する発表であり、
技術的なAPIやSDKを紹介する記事ではないため、コード例は掲載されていない



<div class="pt-6">

代わりに、記事全体の位置づけを整理する

</div>


---

# 記事の位置づけ: Agents Week 2026 の中で


- 本記事は、2026年8月3日〜7日の「Agents Week 2026」最終日（金曜・テーマ「実装と現実」）に発表された4本の1つ
- 同じ金曜日の他の発表:
  - エージェントの振る舞いを継続的に評価する取り組み
  - Workers AI と AI Gateway の統合
  - Radar Researcher（自然言語でインターネットデータを分析するAIツール）



<div class="pt-6">

技術寄りの発表が並ぶ中、本記事は「**エージェント経済・開発者エコシステムを支える人とコミュニティへの投資**」という文脈に位置づけられている

</div>


<div class="text-xs opacity-60 pt-4">
出典: Cloudflare Blog https://blog.cloudflare.com/ja-jp/agents-week-review-august-2026/
</div>

---
class: text-center
---

# ユースケース

---

# ユースケース①: 学生団体のハンズオンイベント


- Ambassadorに選出された学生が、大学のCS系サークルでWorkersのハンズオンワークショップを開催
- Cloudflareから提供されるクレジットや技術資料を活用して教材を作成
- キャンパス内での学習スペース創出にもつながる


---

# ユースケース②: 地域コミュニティのミートアップ継続開催


- 地元の開発者コミュニティを主宰するAmbassadorが、マーケティング素材や登壇者リソースの支援を受ける
- 定期的な勉強会・ハッカソンを企画・運営
- Discord上での可視的な役割により、参加者からの信頼・認知も得やすくなる


---

# ユースケース③: OSSメンテナーへの継続支援


- Astro や Hono など、Cloudflareの OSS の活動範囲にあるプロジェクトのメンテナーがCommunity Engineersに
- 助成金を受け取りながら、不規則な貢献サイクルの中でもプロジェクト保守を継続
- 最大在任期間の上限がないため、燃え尽き期間や活動休止を挟んでも支援を受けやすい設計


---

# ユースケース④: Discordでの情報キュレーション


- 新設のDiscord委員会が、自動スパム対策ツールと合わせて有益な議論・機会をキュレーション
- イベント告知やコラボレーションの機会が、約10万人規模のコミュニティの中で埋もれにくくなる
- 社内チーム・ビルダーとの橋渡し役としても機能


---

# まとめ


- 「コミュニティを広める人」（Ambassadors）と「コードを書く人」（Community Engineers）の2トラックに明確に分離
- Community Engineersへの投資は、既存のVite向け100万ドルとは別枠で**新たに2年間100万ドルを追加**
- Ambassadorsの応募締切は**9月6日**、通知は**10月5日**
- Discordは自動化ツール＋人によるキュレーションの二段構えで健全性を維持する方針


---

# 所感


- Community Engineersの「在任期間上限なし」は、OSS貢献の不規則さに配慮した設計判断として興味深い
- 2つの100万ドル規模の投資が並走する構図は、OSSエコシステムの持続可能性が企業スポンサーシップの積み重ねで支えられている実態をよく表している
- Discord運営で「モデレーションではなくキュレーションに重点を置く」という役割分担は、他のコミュニティ運営にも参考になりうる
- 技術記事ではないため、新機能・SDKの詳細を期待すると肩透かしになる点は留意が必要


---

# 参考リンク

<div class="text-sm">

**原文**: https://blog.cloudflare.com/community-program-refresh/

**Cloudflare Community（プログラム詳細・応募）**: https://www.cloudflare.com/community

**Ambassador応募フォーム**: https://www.cloudflare.com/community/#community-application

**workerd**: https://github.com/cloudflare/workerd ・ **quiche**: https://github.com/cloudflare/quiche

**TanStack**: https://tanstack.com/ ・ 過去のスポンサーシップ発表: https://blog.cloudflare.com/cloudflare-astro-tanstack/

**VoidZero買収発表**: https://blog.cloudflare.com/voidzero-joins-cloudflare/

**Cloudflare Discord**: https://discord.cloudflare.com/

**Agents Week 2026 まとめ記事**: https://blog.cloudflare.com/ja-jp/agents-week-review-august-2026/

</div>

<div class="pt-8 text-sm opacity-50">
Wiki: docs/articles/2026-08-07-community-program-refresh.md
</div>
