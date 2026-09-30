---
routerMode: hash
theme: default
title: Cloudflare 2026年度創業者レター
info: |
  Cloudflare 2026年度創業者レターの解説スライド。
  原文: https://blog.cloudflare.com/ja-jp/cloudflares-2026-annual-founders-letter/
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

# Cloudflare 2026年度
# 創業者レター

Birthday Week 2026 ／ 16周年に寄せて

<div class="pt-4 text-sm opacity-70">
原文: https://blog.cloudflare.com/ja-jp/cloudflares-2026-annual-founders-letter/<br>
公開日: 2026-09-27
</div>

---

# TL;DR

- Cloudflareは16周年。インターネットは創業以来もっとも大きく変化しており、リスクを感じつつも全体としては強い楽観を持っている
- AIで「アイデアはあるがコードは書けない」新しいクリエイターが生まれ、700万人以上の開発者がCloudflareのプラットフォーム上で開発している
- 自動化トラフィックが人間を上回る時期は2027年後半の予測から<strong>2026年5月</strong>へ前倒し。5年後には人間の<strong>1,000倍</strong>に達する見通し
- 1,000軒を調べて1軒だけ推薦するエージェントは、残り999軒にコストだけを負わせる「コモンズの悲劇」を生む
- 目指す姿は「5社ではなく50万社のAI企業」。クローラー効率化・クリエイター報酬・パートナーシップを発表する

---

# アジェンダ

- Webとクリエイターの変化
- 自動化トラフィックの急増
- 999軒のレストラン問題
- 新規参入者へのリスク
- 16年前の記憶と目指す未来
- Birthday Weekの取り組み
- 記事の構成整理（コード例に代わる整理）
- ユースケース
- まとめ

---

# 背景: Webの成長が再び始まった

- 2012年〜2025年: Webは停滞し、指標によっては縮小
- 2025年半ば: 新しいWebサイトが急増
- 「AIの粗悪なコンテンツ」という見方もあるが、Cloudflareが見ている大半はそうではない
- 実態は<strong>新しいクリエイターの波</strong>

<img src="https://blog.cloudflare.com/_emdash/api/media/file/01M3G3GKE91PTTG4H3XN6RP5XY.01M3G3GKYC5DWBJAEH5H5QE6VK.png" style="max-height: 170px; margin: 1rem auto 0;" />

<div class="text-xs opacity-60 pt-1">出典: Cloudflare Blog https://blog.cloudflare.com/ja-jp/cloudflares-2026-annual-founders-letter/</div>

---

# バイブコーディングと700万人の開発者

- アイデアはあるがプログラミングスキルのなかった人が、「バイブコーディング」ツールで作品を公開
- そうしたツールの多くが、デプロイ先にCloudflareの開発者プラットフォームを選んでいる
- 学生が現実の課題を解くアプリを作り、スタートアップが記録的な速さで立ち上がる
- 現在、<strong>700万人以上</strong>の開発者がCloudflare上で開発

> テクノロジーは、より多くの人が創造性を発揮できるときに最善の形で機能する

---

# 自動化トラフィックの急増

| 項目 | 内容 |
|------|------|
| 当初の予測 | 自動化トラフィックが人間を上回るのは2027年後半 |
| 実際 | AIエージェント・AIクローラーの台頭で<strong>2026年5月</strong>に前倒し |
| 5年後の見通し | 人間のトラフィックの<strong>約1,000倍</strong>（筆者らは保守的と評価） |
| 理由 | 人間が減るのではなく、エージェントのトラフィックが爆発的に増える |

---

# 999軒のレストラン問題

エージェントに「昼食はどこで？」と聞くと……

- 周辺の<strong>1,000軒</strong>のメニューを調べ、<strong>1軒</strong>だけ推薦
- 選ばれた1軒: 来店客を得られる
- 残り<strong>999軒</strong>: 見返りなしで、エージェントへの対応コストだけを負担
- 構図は<strong>コモンズの悲劇</strong>: 利益を得る側が、システムへの負荷コストを負担しない

<img src="https://blog.cloudflare.com/_emdash/api/media/file/01M3G3HVVEVJX24W4QX0B4SFBA.01M3G3HWFFH42645BGBG56CK4J.png" style="max-height: 200px; margin: 1rem auto 0;" />

<div class="text-xs opacity-60 pt-1">出典: Cloudflare Blog https://blog.cloudflare.com/ja-jp/cloudflares-2026-annual-founders-letter/</div>

---

# 新規参入者が不利になるリスク

- 今の中小企業は、感情や利便性で選ばれている（名前を覚えてくれる惣菜屋、帰り道にある店）
- AIエージェントは愛着や動線を気にせず、<strong>最も情報量の多い対象</strong>を選ぶ
- 情報量が多いのは、たいてい最も長く事業を続けてきた企業
- エージェント経由の商取引が増えるほど、新規参入が難しくなる
- 結果として、業界の集約とより脆弱な事業環境につながりうる

---

# 16年前の記憶: TechCrunch Disruptでのローンチ

- 2010年9月27日、TechCrunch Disruptのステージでローンチ
- 壇上に上がった時点で<strong>8件のバグ</strong>が残り、エンジニアが客席で修正
- 降壇時にはすべて修正され、<strong>3大陸5か所</strong>のデータセンターで稼働
- どのAIエージェントも当時のCloudflareを推薦しなかっただろう。それでも人々は賭けてくれた
- 次の新規参入者にも同じ機会を

---

# 目指す未来

| これではなく | こうしたい |
|--------------|------------|
| 5社のAI企業だけの未来 | 世界中に<strong>50万社</strong>が存在する未来 |
| 報酬を得られず苦境に立つクリエイター | 誰でも制作・配信し、報酬を得られる |
| 一握りの巨大企業が何もせず勝ち続ける | より優れた製品を持つ新規参入者が勝てる |

昨年はパブリッシャーへの影響を論じた。今年は同じ地殻変動がレストランや惣菜屋にも及んでいる。

---

# Birthday Weekの取り組み

<div class="grid grid-cols-2 gap-6">
<div>

- <strong>クローラーの効率化</strong>: 良性ボットが取得するコンテンツの半数以上は前回訪問から未変更。新しいコンテンツだけを取得できるようにし、クロールされる側の負荷を軽減
- <strong>クリエイターへの報酬</strong>: 公開したコンテンツやアプリをAIエージェントが活用したときに報酬を受け取れる仕組み
- <strong>パートナーシップ</strong>: 同じ未来を目指す企業・組織との提携

</div>
<div>

<img src="https://blog.cloudflare.com/_emdash/api/media/file/01M3G3K9KYAB3AF7F3HTG79N1V.01M3G3KA36XJ6B1Y15MYZS5WJM.png" style="max-height: 260px; margin: 0 auto;" />

</div>
</div>

<div class="text-xs opacity-60 pt-2">出典: Cloudflare Blog https://blog.cloudflare.com/ja-jp/cloudflares-2026-annual-founders-letter/</div>

---

# コード例に代わる整理: 論の流れ

本記事は創業者レターのためコード例は含まれない。代わりに、論の構造を整理する。

```text {1-2|4-5|7-8|10-12|all}
[観測]   Webの成長再開 / 開発者700万人超
         自動化トラフィックの逆転は2026年5月、5年後に1,000倍

[課題]   1,000軒を調べて1軒を推薦 -> 999軒がコストを負担
         既存の大手が有利になり、新規参入障壁が上がる

[目標]   5社ではなく50万社のAI企業
         クリエイターが報酬を得られ、新規参入者が勝てる市場

[打ち手] クローラーの効率化 / クリエイター報酬 / パートナーシップ
```

---

# ユースケース: 記事が挙げる具体的な場面

| 場面 | 内容 |
|------|------|
| 昼食のレストラン選び | 1,000軒を調べ1軒を推薦。推薦されない999軒がコストを負担 |
| フライト・業者・スマホプランの下調べ | 人間が午後いっぱいかける調査を1分で代行。調べられる側の負荷は増える |
| バイブコーディングによる新規開発 | 学生やスタートアップが短期間でアプリを公開 |
| サイト運営者のクロール負荷 | 半数以上が未変更のコンテンツの繰り返し取得を、変更分のみの取得に |

---

# まとめ・所感

- 自動化トラフィックの逆転は予測より約1年早く、2026年5月に起きた
- 問題の核心は、エージェントの利用者と調べられる側でコストと便益が非対称になること
- 目標は「5社ではなく50万社」。新規参入者が勝てる市場を保つこと
- 具体的な仕組みの詳細は、Birthday Week中の続報で扱われる
- 本記事は方針表明のため、デプロイ可能なサンプルは作成していない

---

# 参考リンク

- 原文（ja-jp、Cloudflare公式日本語版）: https://blog.cloudflare.com/ja-jp/cloudflares-2026-annual-founders-letter/
- 原文（en-us）: https://blog.cloudflare.com/cloudflares-2026-annual-founders-letter/
- Wiki: [docs/articles/2026-09-27-cloudflares-2026-annual-founders-letter.md](https://github.com/syumai/cloudflare-blog-summaries/blob/main/docs/articles/2026-09-27-cloudflares-2026-annual-founders-letter.md)
