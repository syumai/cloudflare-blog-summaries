---
routerMode: hash
theme: default
title: "The Cold Start: Cloudflareのスタートアップ・ピッチコンペ"
info: |
  The Cold Start の解説スライド。
  原文: https://blog.cloudflare.com/introducing-the-cold-start/
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

# The Cold Start
# Cloudflareのスタートアップ・ピッチコンペ

Birthday Week 2026

<div class="pt-4 text-sm opacity-70">
原文: https://blog.cloudflare.com/introducing-the-cold-start/<br>
公開日: 2026-09-28
</div>

---

# TL;DR

- 初期スタートアップ5社が各5分でピッチする「The Cold Start」を、2026年10月19日にサンフランシスコの Cloudflare Connect で開催
- 対象は米国・カナダ拠点で調達額1,000万ドル未満。応募締切は<strong>2026年10月2日（金）</strong>
- 賞品は<strong>50万ドル分のクレジット</strong>、ビルボード掲出、VIPスピーカーズディナー招待
- 審査員は Matthew Prince、Michelle Zatlyn、Dane Knecht
- 着想は2010年のTechCrunch Disruptでの自社ピッチ

---

# アジェンダ

- 背景: 2010年のピッチ
- 開催概要
- 応募資格と賞品
- 求めているもの
- 流れの整理（コード例に代わる整理）
- ユースケース
- まとめ

---

# 背景: 2010年のTechCrunch Disruptと本コンペ

- Cloudflareは2010年、TechCrunch Disruptのステージでローンチ
- ライブピッチ中に<strong>100件以上</strong>のサインアップを獲得
- 「適切なタイミングで適切なステージ」が持つ力を、次の世代にも
- 創業者レターの「5社ではなく50万社」という方向性と連動する取り組み

<img src="https://blog.cloudflare.com/_emdash/api/media/file/01M3KPTYC36CJQF99DE2AHZXMV.01M3KPTZVQS15TZPV93V8FNAS2.png" style="max-height: 200px; margin: 1rem auto 0;" />

<div class="text-xs opacity-60 pt-1">出典: Cloudflare Blog https://blog.cloudflare.com/introducing-the-cold-start/</div>

---

# 開催概要

| 項目 | 内容 |
|------|------|
| 日時・会場 | 2026年10月19日 / サンフランシスコ Cloudflare Connect |
| 参加枠 | 初期スタートアップ5社 |
| 持ち時間 | ピッチ5分 + Q&A 3〜5分 |
| 審査員 | Matthew Prince（CEO）、Michelle Zatlyn（President）、Dane Knecht（CTO） |
| 応募締切 | <strong>2026年10月2日（金）</strong> |

---

# 応募資格と賞品

<div class="grid grid-cols-2 gap-6">
<div>

### 応募資格

- 米国・カナダ拠点
- 調達額が1,000万ドル未満
- 初期段階の企業

</div>
<div>

### 賞品

- <strong>50万ドル分</strong>のCloudflareクレジット
- サンフランシスコのビルボード掲出
- VIPスピーカーズディナー招待

</div>
</div>

---

# 求めているもの

- 「一度誰かが作れば当たり前に見えるアイデア」
- 「最初は少し無茶に聞こえる構想」
- 関心領域: インフラの課題解決 / ソフトウェアの新しい作り方 / 新しい市場機会
- 特に Cloudflare のプラットフォームを活用する事業

---

# コード例に代わる整理: 応募から当日までの流れ

本記事は告知のためコード例は含まれない。代わりに流れを整理する。

```text {1-2|4|6|8-9|all}
[資格確認] 米国・カナダ拠点 / 調達額1,000万ドル未満 / 初期段階

[応募]     2026-10-02（金）締切
           https://www.cloudflare.com/connect/cold-start/

[選出]     5社

[当日]     2026-10-19 Cloudflare Connect（サンフランシスコ）
           ピッチ5分 + Q&A 3〜5分 -> 審査員3名が審査
```

---

# ユースケース

| 場面 | 内容 |
|------|------|
| Cloudflare上でプロダクトを作る創業者 | クレジットでインフラコストを抑えて開発を進める |
| 初期スタートアップ | 短時間のピッチで構想を伝え、認知を得る |
| Cloudflare Connect の参加者 | 成長初期の企業のピッチをライブで見る |

---

# まとめ・所感

- 応募締切は記事公開から数日後と短い
- 応募資格は米国・カナダ拠点に限られ、日本拠点の企業は対象外
- 選出企業や結果は本記事には含まれない
- 告知記事のため、デプロイ可能なサンプルは作成していない

---

# 参考リンク

- 原文（en-us）: https://blog.cloudflare.com/introducing-the-cold-start/
- 応募ページ: https://www.cloudflare.com/connect/cold-start/
- Wiki: [docs/articles/2026-09-28-introducing-the-cold-start.md](https://github.com/syumai/cloudflare-blog-summaries/blob/main/docs/articles/2026-09-28-introducing-the-cold-start.md)
