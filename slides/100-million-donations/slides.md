---
routerMode: hash
theme: default
title: "Cloudflare Impact が寄付（提供サービス）1億ドルに到達"
info: |
  Cloudflare Impact reaches $100 million in donations の解説スライド。
  原文: https://blog.cloudflare.com/100-million-donations/
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

# Cloudflare Impact が<br>提供サービス 1 億ドルに到達

慈善ではなく、事業とミッションの根幹として

Birthday Week 2026

<div class="pt-4 text-sm opacity-70">
原文: https://blog.cloudflare.com/100-million-donations/<br>
公開日: 2026-09-30
</div>

---

# TL;DR

- Impact プログラムの<strong>提供サービスが 1 億ドル</strong>に到達。報道機関・市民社会・選挙管理機関・公立学校など数千の組織を保護
- Impact は慈善ではなく<strong>事業とミッションの根幹</strong>。無料サービスから出発し、Project Galileo（2014）へ発展
- Galileo は 120 か国超・3,500 ドメイン超。2025 年に 385 億件超の攻撃をブロック
- 今後は防御に加えて、<strong>AI 時代への適応</strong>を支援（ジャーナリスト向けハッカソン、AI クローラー対策、非営利スタートアップ、人権団体向けツール）

---

# アジェンダ

- Free から Impact へ
- 主なプログラム（Galileo・Athenian・Campaigns ほか）
- 市民社会への攻撃レポート
- バルセロナのハッカソンと AIdas
- 拡大中の取り組み
- コード例（対象外）・ユースケース・まとめ

---

# 背景: 無料サービスからの出発

<div class="grid grid-cols-2 gap-6 pt-4 text-left">
<div class="p-4 border rounded">

<strong>当初の発想</strong>

- 基本機能を開発者・小規模事業者に無料で提供
- 攻撃データをもとに有償の高度な製品を作る

</div>
<div class="p-4 border rounded">

<strong>気づき</strong>

- 無料顧客に、汚職や侵攻を報じる重要な活動の組織がいた
- そうした組織が、ネットワーク上でも最大級の攻撃を受けていた
- 無料提供にとどまらず、公共のために狙われる組織をより手厚く支援する方針へ

</div>
</div>

---

# Project Galileo（2014）

<div class="pt-4 text-left">

ジャーナリスト・人権擁護者・市民社会団体など、重要だが脆弱なオンラインの人・組織に高度なセキュリティを提供。

</div>

| 項目 | 数値 |
| --- | --- |
| 対象 | 120 か国超・3,500 ドメイン超 |
| 2025 年のブロック数 | 385 億件超（DDoS・脆弱性・フィッシング等） |
| 1 日あたり | 約 1 億 540 万件 |

---

# Impact プログラムの広がり

| プログラム | 開始 | 対象・規模 |
| --- | --- | --- |
| Athenian Project | 2017 | 州・地方政府の選挙。米国 33 州で 440 超のサイト。のち 8 か国の選挙管理機関へ |
| Cloudflare for Campaigns | 2020 | 公職候補者。米国で 530 超のサイト（Defending Digital Campaigns と提携） |
| 重要インフラ向け | - | 公立学校・COVID-19 対応・ウクライナ政府・公衆衛生クリニック・コミュニティネットワークなど |

---

# 市民社会への攻撃レポート（2026）

- 初の年次レポート「市民社会に対するサイバー攻撃」を公開
- 市民社会の組織は、他の Cloudflare 顧客より<strong>頻繁かつ激しく</strong>狙われる
- Galileo 参加者への Web 脆弱性の悪用試行は、平均的なユーザーの<strong>7 倍超</strong>
- Galileo への申込数は、前年の 2 倍を超えるペース

<div class="pt-2 text-sm opacity-70">
組織タイプ別の内訳（組織あたりの平均探索回数、埋め込み画像の値）
</div>

| 組織タイプ | 平均探索回数 |
| --- | --- |
| Media | 4.49M |
| Environmental | 2.70M |
| Human Rights | 2.13M |
| Social Welfare | 1.65M |

---

# 防御から「AI 時代への適応」へ

<div class="pt-4 text-left">

Impact プログラムは、公益組織を守るだけでなく、AI 時代に適応して成長するための支援へ広がっている。

</div>

- ジャーナリスト向けハッカソン（バルセロナ）
- ローカルニュースを AI クローラーから守る
- 非営利スタートアップ向けクレジット
- 人権団体向けの自動化ツール

---

# バルセロナのハッカソン

<div class="text-sm text-left">

2026 年 9 月、Media Party のカンファレンスの一部として共催。ジャーナリスト向けは初めて。テーマは 4 つ。

</div>

<div class="text-center pt-2">
<img src="https://blog.cloudflare.com/_emdash/api/media/file/01M3RVY4DRY4XEPDWN5Q698E2C.01M3RVY5A72360N6872TCA9TR9.jpeg" style="max-height: 290px; margin: 0 auto;" />
</div>

<div class="text-xs opacity-60 pt-1">
Media Party ハッカソン（BIT Habitat、2026-09-09）。出典: Cloudflare Blog https://blog.cloudflare.com/100-million-donations/
</div>

---

# ハッカソンの内容と優勝チーム

<div class="grid grid-cols-2 gap-6 pt-4 text-left">
<div class="p-4 border rounded">

<strong>4 つのテーマ</strong>

- ワークフロー自動化
- エージェント型ジャーナリズム
- 合成コンテンツの検証
- 情報の完全性

各チームに、開発者プラットフォームの無料アクセスとボランティアエンジニアの支援。4 チームが決勝へ。

</div>
<div class="p-4 border rounded">

<strong>優勝: AIdas</strong>

- 同じ質問への複数 LLM の答えを比較
- 応答をオープンデータとして記録
- 政治的に争点となるテーマでの AI のバイアスを研究者・ジャーナリストが調べられる

</div>
</div>

---

# 拡大中の 3 つの取り組み

<div class="text-sm pt-2">

| 取り組み | 内容 |
| --- | --- |
| ローカルニュースの保護 | Galileo 参加者（750 超の報道機関等）に Bot Management と AI Crawl Control を無償提供 |
| 非営利スタートアップ | 25 万ドル超のクレジットのプログラムを非営利に開放。今週、最初の 30 組織を発表予定 |
| 人権団体向けツール | 3 団体向けに 3 プロジェクトを発表予定（国境を越えた弾圧の追跡、デジタル権利の政策、企業の人権デューデリジェンス） |

</div>

---

# コード例について

<div class="pt-4 text-left">

本記事は事業・社会貢献プログラムの節目を振り返る記事で、<strong>コード例・API・設定例は含まれない</strong>。

</div>

- 代わりに、プログラムごとの対象・開始年・規模を整理して読み解く
- Workers 上で動く機能の発表ではないため、Workers サンプルは対象外

---

# ユースケース（支援の受け手）1: 報道機関

- Project Galileo による防御
- Bot Management / AI Crawl Control で AI クローラーのアクセスを把握・制御
- ハッカソンで AI ツールの開発を支援

---

# ユースケース 2: 人権団体・市民社会

- Galileo による防御（攻撃は平均の 7 倍超の割合）
- 人権団体向けの自動化ツール
  - 国境を越えた弾圧の追跡
  - デジタル権利に関する法制度・政策の策定
  - 企業の人権デューデリジェンス

---

# ユースケース 3: 選挙・学校・非営利スタートアップ

<div class="grid grid-cols-2 gap-6 pt-4 text-left">
<div class="p-4 border rounded">

<strong>選挙・公共</strong>

- Athenian Project: 州・地方政府・選挙管理機関
- Cloudflare for Campaigns: 公職候補者
- 公立学校・クリニックなどの重要インフラ

</div>
<div class="p-4 border rounded">

<strong>非営利スタートアップ</strong>

- 25 万ドル超のクレジット
- 開発者プラットフォーム上でコミュニティ向けのツールを構築

</div>
</div>

---

# まとめ・所感

- 1 億ドルは現金ではなく、<strong>提供したサービスの価値</strong>（donated services）
- 無料提供が事業の出発点にあり、Impact は事業とミッションの根幹、という一貫した主張
- 攻撃件数・7 倍という数字は Cloudflare 自身のデータと別 PDF レポートに基づく
- 同じ週の <a href="../cloudflares-2026-annual-founders-letter/" target="_blank">創業者レター</a>・<a href="../introducing-the-cold-start/" target="_blank">The Cold Start</a> と合わせて読むと、Birthday Week の位置づけが分かる
- 締めくくりは、ボランティアのエンジニアが「Galileo が入社理由」と語った話と、採用への呼びかけ

---

<div class="text-center">

# 参考リンク

</div>

- 原文: [Cloudflare Impact reaches $100 million in donations](https://blog.cloudflare.com/100-million-donations/)（日本語版なし）
- 関連解説スライド: [Cloudflare 2026年度創業者レター](../cloudflares-2026-annual-founders-letter/) / [The Cold Start](../introducing-the-cold-start/) / [Cloudflare Ambassadors、Community Engineers](../community-program-refresh/)
- [Protecting Local News from AI Crawlers](https://blog.cloudflare.com/ai-crawl-control-for-project-galileo/) / [非営利向けスタートアッププログラム](https://blog.cloudflare.com/expanding-startups-for-nonprofits/)
- Workers サンプル: 技術発表ではないため対象外

<div class="pt-8 text-sm opacity-50">
Wiki: docs/articles/2026-09-30-100-million-donations.md
</div>
