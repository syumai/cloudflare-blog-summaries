---
routerMode: hash
theme: default
title: "1年後のソブリンAIと「選択」をめぐる戦い"
info: |
  One year later: Sovereign AI and the fight for choice の解説スライド。
  原文: https://blog.cloudflare.com/sovereign-ai-choice-one-year-later/
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

# 1年後のソブリンAIと<br>「選択」をめぐる戦い

欧州の 2 つのオープンモデルを Workers AI に、AI 防御ワークショップも開始

Birthday Week 2026

<div class="pt-4 text-sm opacity-70">
原文: https://blog.cloudflare.com/sovereign-ai-choice-one-year-later/<br>
公開日: 2026-10-01
</div>

---

# TL;DR

- 欧州発の 2 つのオープンモデル <strong>EuroLLM</strong> と <strong>Apertus</strong> が <strong>Workers AI</strong> に登場予定（アクセス申請は受付中）
- 前年の主張「ソブリンAIの答えは<strong>選択</strong>」の続報。アジア太平洋の開発者が国産モデルで実用ツールを構築
- 複数モデルを並列に使う<strong>ハーネス</strong>で、1 つのモデルを失っても防御が止まらない
- 政府のサイバー機関・重要インフラ事業者向けの<strong>ハンズオンワークショップ</strong>を開始（初回は 10 月、シンガポール）
- 結論: 選択は AI ソブリンティの道であり、AI セキュリティの道でもある

---

# アジェンダ

- 背景: 1 年間で硬直した議論と、記事の立場
- EuroLLM と Apertus
- 昨年のモデルで人々が作ったもの
- 1 つのモデルに依存しない AI 防御とワークショップ
- コード例の扱い、ユースケース、まとめ

---

# 背景: 「壁を築くしかない」への反論

<div class="grid grid-cols-2 gap-6 pt-4 text-left text-sm">
<div class="p-4 border rounded">

<strong>この 1 年で硬直した議論</strong>

- 攻撃者がフロンティアモデルでサイバー攻撃を実行
- 一部のフロンティアモデルへのアクセスが所在地に左右される
- オープンモデルを制限しようという声が強まる
- → 「AI ソブリンティはゼロサム。壁を築くのが安全」という結論に傾きやすい

</div>
<div class="p-4 border rounded">

<strong>記事の立場</strong>

- 1 年前の答えは「選択」: 適切な道具を選び、必要なら乗り換える自由
- この 1 年は、選択肢を増やす方向の事例を示した
- どの国も 1 社の AI に依存すべきではない。<strong>Cloudflare も含む</strong>
- 根拠: オープン標準、無料で始められる製品、335 以上の都市・125 以上の国と地域のネットワーク（230 以上の都市に GPU）

</div>
</div>

---

# 欧州の 2 つのオープンモデル

<div class="grid grid-cols-2 gap-4 pt-2 text-left text-sm">
<div class="p-3 border rounded">

<strong>EuroLLM</strong>

- 35 言語、EU 公用語 24 言語すべてを含む
- Horizon Europe・ERC・EuroHPC の支援を受けたコンソーシアム（IST、エディンバラ大、パリ=サクレー大など）
- MareNostrum 5 で学習
- 同規模モデルを EU 多言語ベンチマークと機械翻訳で上回るとコンソーシアムは述べる

</div>
<div class="p-3 border rounded">

<strong>Apertus</strong>（ラテン語で「開かれた」）

- スイス初の大規模・完全オープン・多言語モデル
- 15 兆トークン超、1,500 以上の言語、学習データの 40% が英語以外
- ETH Zurich・EPFL・CSCS（Swiss AI Initiative）
- Alps（10,000 基超の GH200）で学習
- 構成・重み・学習データ・手法をすべて公開

</div>
</div>

<div class="text-sm pt-3 text-left">

どちらも公的な大学・研究機関が開発。Workers AI へは<strong>アクセス申請</strong>ベースで提供される。

</div>

---

# Apertus の設計方針

<div class="text-left pt-2">

- EU AI Act と GDPR などの欧州の規則を意識した設計
- 学習時のオプトアウトを尊重
- 個人データを除去
- 記憶化（memorization）を防止
- 開発者の報告: ロマンシュ語・スイスドイツ語、アジア・アフリカの低リソース言語などで、主要なクローズド／オープンモデルを大きく上回る

</div>

<div class="text-sm pt-4 text-left">

アーキテクチャ・重み・学習データ・手法がすべて公開されているため、検証や再現が可能という点が「完全オープン」の意味。

</div>

---

# 昨年のモデルで人々が作ったもの

<div class="text-sm text-left pt-1">

Workers AI に各国モデルが載って以降、アジア太平洋の学生・スタートアップ・中小企業・公務員数百人が利用（現地パートナーとのビルダソンも多数）。

</div>

<div class="grid grid-cols-3 gap-3 pt-3 text-left text-sm">
<div class="p-3 border rounded">

<strong>Form Mitra（インド）</strong>

英語の給付申請書類を、22 のインド言語で音声ガイド。IIT デリーの学生が CyberPeace のビルダソンで開発。IndicTrans2 を利用

</div>
<div class="p-3 border rounded">

<strong>MedBridge（シンガポール）</strong>

福建語・広東語を含む 14 言語で患者との健康に関する会話を支援。方言が通じない看護師の言葉の壁を解消

</div>
<div class="p-3 border rounded">

<strong>Anshin Concierge（日本）</strong>

「膝が痛い」などの自分の言葉から、東京都の適切な支援窓口へ 1 タップで案内。ハッカソンのプロトタイプ

</div>
</div>

---

# AI 防御: 1 つのモデルに依存しない

<div class="text-left pt-2 text-sm">

- 前提: 脆弱性を大規模に見つけられるフロンティアモデルは、防御側にも使える
- 課題: 1 つのモデルに基づく防御は、そのモデルへのアクセス次第で崩れる
- 対応: Cloudflare のセキュリティチームが<strong>ハーネス</strong>を構築

</div>

<div class="p-3 border rounded text-left text-sm mt-3">

<strong>ハーネス</strong> = 複数の AI モデルを並列に動かし、脆弱性の探索・発見の検証・脅威の優先度付けを調整するオーケストレーション層

</div>

<div class="text-sm pt-3 text-left">

クローズド／オープンを問わず任意のモデルで動くため、1 つのプロバイダーを失っても防御は止まらない。

</div>

---

# 公開済みの関連記事とワークショップ

<div class="grid grid-cols-2 gap-4 pt-2 text-left text-sm">
<div class="p-3 border rounded">

<strong>公開済みの 3 本</strong>

- cyber-frontier-models: フロンティアモデルとオープンモデルの併用の知見
- build-your-own-vulnerability-harness: ハーネスのオープンソース化
- frontier-model-defense: 攻撃者の発見を防ぐ多層アーキテクチャ

</div>
<div class="p-3 border rounded">

<strong>ハンズオンワークショップ</strong>

- 対象: 政府のサイバーセキュリティ機関、重要インフラ事業者
- 参加者が自分の AI セキュリティハーネスと多層防御を構築
- モジュールは plug-and-play で、各国の AI スキリング・サイバーレジリエンス施策に組み込める
- 初回: 10 月、Singapore International Cyber Week

</div>
</div>

---

# コード例について

<div class="text-left pt-2">

- 本記事にコード例は掲載されていない
- 政策・エコシステム寄りの発表で、モデルの呼び出し方はモデルページへのリンクのみ
  - EuroLLM: <code>developers.cloudflare.com/workers-ai/models/eurollm-9b-it/</code>
  - Apertus: <code>developers.cloudflare.com/workers-ai/models/apertus-v1.5-8b</code>
- 2 モデルはアクセス申請制のため、デプロイ可能なサンプルは作成していない

</div>

---

# ユースケース 1: 多言語の公共サービス

<div class="text-left pt-2">

- 低識字・視覚障害・地方在住の人が、複雑な英語の書類で給付から閉め出されない
- 22 のインド言語で、音声ガイドしながら記入を支援（Form Mitra）
- 行政窓口の案内も、自分の言葉で困りごとを伝えるだけ（Anshin Concierge）

</div>

---

# ユースケース 2: 医療・ケアと多言語処理

<div class="text-left pt-2">

- 14 言語（福建語・広東語を含む）で患者と看護師の会話を支援（MedBridge）
- EU 公用語 24 言語を含む EuroLLM での翻訳・多言語タスク（記事が挙げる位置づけからの想定）
- 少数言語・低リソース言語を Apertus で扱う

</div>

---

# ユースケース 3: モデル非依存のサイバー防御

<div class="text-left pt-2">

- 複数モデルを並列に動かし、脆弱性を探索・検証・優先度付け
- 特定プロバイダーへのアクセスが制限されても防御が継続
- 自組織の環境・ルールのもとで立ち上げ、ワークショップで運用方法を習得

</div>

---

# まとめ

<div class="text-left pt-2">

- 「選択」を、モデルの選択（EuroLLM・Apertus・各国モデル）と防御の選択（モデル非依存のハーネス）に具体化した続報
- 発表の実体は 2 モデルの<strong>アクセス申請受付</strong>とワークショップ開始。詳細な提供条件は記事に無い
- 前年の記事 <code>sovereign-ai-and-choice</code> は本リポジトリに未収録（外部リンクのみ）
- 連絡先: policy-team@cloudflare.com

</div>

---

# 参考リンク

<div class="text-sm text-left">

- 原文: https://blog.cloudflare.com/sovereign-ai-choice-one-year-later/
- 前年の記事: https://blog.cloudflare.com/sovereign-ai-and-choice/
- EuroLLM: https://developers.cloudflare.com/workers-ai/models/eurollm-9b-it/
- Apertus: https://developers.cloudflare.com/workers-ai/models/apertus-v1.5-8b
- ハーネス: https://blog.cloudflare.com/build-your-own-vulnerability-harness/
- 関連スライド: <a href="../ai-search-ga/">▶ AI Search GA</a> / <a href="../managed-cloudflare-os/">▶ Cloudflare OS</a> / <a href="../ai-era-framework/">▶ AI 時代の適応型セキュリティ</a> / <a href="../adaptive-ai-waf-testing/">▶ WAF テスト</a>

</div>
