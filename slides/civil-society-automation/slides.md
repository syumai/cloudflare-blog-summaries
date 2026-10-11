---
routerMode: hash
theme: default
title: "社会のために作る: 市民社会組織は Cloudflare で何を自動化しているか"
info: |
  Building for good: How civil society organizations are automating on Cloudflare の解説スライド。
  原文: https://blog.cloudflare.com/civil-society-automation/
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

# 社会のために作る

市民社会組織は Cloudflare で何を自動化しているか

Birthday Week 2026 / Project Galileo / Impact

<div class="pt-4 text-sm opacity-70">
原文: https://blog.cloudflare.com/civil-society-automation/<br>
公開日: 2026-10-02
</div>

---

# TL;DR

- 数十の市民社会組織が、<strong>750万ドル超</strong>の Cloudflare クレジットで開発者サービス上にツールを構築
- ニーズは「守る」から「作る」へ。Project Galileo は <strong>120か国超・3,400ドメイン超</strong>を保護
- 非営利スタートアップの<strong>第1コホート30組織</strong>から、LebTown・Kaya Guides・The Snorkelling Society を紹介
- 人権団体3つ（Freedom House・GNI・Article One）とは、ボランティアエンジニアが共同開発。判断は人が行う設計
- 本日から<strong>第2コホート</strong>の募集を開始

---

# アジェンダ

- 背景: 「守る」から「作る」へ、市民社会が置かれた状況
- Cloudflare の開発者サービスが答える懸念
- 第1コホートの事例（LebTown / Kaya Guides / Snorkelling Society）
- 人権団体との共同開発（Freedom House / GNI / Article One）
- ユースケース、まとめ

---

# 背景: 「守る」から「作る」へ

<div class="text-left text-sm pt-2">

- Project Galileo: 市民社会組織に無料でサイバーセキュリティを提供。<strong>120か国超・3,400ドメイン超</strong>
- 参加組織のニーズが変化: 既存アプリの保護だけでなく、<strong>新しいアプリを作りたい</strong>
- AI により、非技術系のチームでも自分たちの業務に合ったツールを設計・構築できるようになった
- Cloudflare Impact の目標: 非営利組織が AI の恩恵を<strong>最初に</strong>受けられるようにすること

</div>

---

# 市民社会が直面する制約

<div class="grid grid-cols-3 gap-4 pt-4 text-left text-sm">
<div class="p-4 border rounded">

<strong>資金</strong>

- 政府資金の大幅削減でレイオフ・プログラム閉鎖
- CIVICUS 調査: <strong>48%</strong> が資金面の制約を導入の障壁に挙げた

</div>
<div class="p-4 border rounded">

<strong>プライバシー</strong>

- 活動家の所在地、匿名の情報源など機微なデータ
- 調査回答者の半数超がプライバシー懸念を障壁と見ている

</div>
<div class="p-4 border rounded">

<strong>攻撃リスク</strong>

- Cloudflare のデータでも、市民社会組織はサイバー攻撃を不均衡に多く受ける
- 複雑な自動化の構築・運用コストも負担

</div>
</div>

---

# 開発者サービスが答える点

<div class="text-left text-sm pt-2">

| 懸念 | 記事での説明 |
| --- | --- |
| セキュリティ・プライバシー | 最初から保護を組み込み。DDoS や内部システムへの不正アクセスから自動的に保護 |
| コスト | 軽量サーバーレス。アイドルのインフラを用意・支払いしない |
| GPU 運用 | Workers AI で専用 GPU を運用する必要がない |
| AI 利用の制御 | AI Gateway がレート制限・利用の可視化・モデルルーティングを提供 |

</div>

---

# 第1の非営利スタートアップ・コホート

<div class="text-left text-sm pt-2">

- 昨年の Birthday Week で Cloudflare for Startups を非営利・公益組織にも開放（1組織あたり最大<strong>25万ドル</strong>のクレジット）
- <strong>30組織</strong>を選出。領域は気候科学、人道支援、メンタルヘルス、市民参加、教育
- 合計の提供クレジットは <strong>750万ドル超</strong>
- 記事で紹介された3組織
  - LebTown: ローカルニュースの編集基盤
  - Kaya Guides: メンタルヘルス支援の規模拡大
  - The Snorkelling Society: シュノーケリング地点のマップ

</div>

---
layout: image-right
image: https://blog.cloudflare.com/_emdash/api/media/file/01M3W891ZKRSSFHMCYYBVMXZEY.png
backgroundSize: contain
---

# LebTown

<div class="text-left text-sm">

ペンシルベニア州レバノン郡の独立系非営利ニュースルーム

- 従来: 2つの Google ドキュメント、Google カレンダー、Discord、Gmail
- 置き換え先: ピッチから公開までを追う<strong>編集管理システム</strong>
- 読者リーチの追跡、記者によるコミュニティ影響の記録
- 郡の不動産移転記録を PDF から構造化データへ変換
- WordPress と連携するリアルタイムの<strong>校正エージェント</strong>

</div>

<div class="text-xs opacity-60 pt-2">図: LebTown の Analytics 画面（出典: Cloudflare Blog https://blog.cloudflare.com/civil-society-automation/）</div>

---

# Kaya Guides

<div class="text-left text-sm pt-2">

- インドでうつ症状のある人を、訓練を受けた一般のカウンセラーと結ぶ <strong>WhatsApp ベース</strong>のアプリ
- 従来の治療にあるコストや待ち時間なしで支援できる
- 2026年9月時点: <strong>10,439人</strong>を支援、<strong>2,325人</strong>が登録中
- ケアマネジメントシステムを Cloudflare に移行し、月に約<strong>50万件</strong>の WhatsApp メッセージを処理
- カウンセリング通話を聞き取り、カウンセラーに<strong>リアルタイムでフィードバック</strong>するライブ AI システム
- Kaya によれば、規模拡大しても一貫性と自己修正性があり、追加コスト・複雑さも大きく増えていない

</div>

---

# The Snorkelling Society

<div class="text-left text-sm pt-2">

- 英国の非営利団体。世界のシュノーケリング愛好家向けの Web・モバイルアプリ「SnorkelMap」を開発
- 場所の発見、場所の情報の確認、体験の投稿ができる
- ボランティアが開発・保守しているため、Cloudflare で<strong>安全なストレージ</strong>（投稿・画像アップロード）とサイバー攻撃からの保護を確保

</div>

<img src="https://blog.cloudflare.com/_emdash/api/media/file/01M3W894JG702AN8NK0PB0A044.png" style="max-height: 280px; margin: 0.5rem auto 0;" />

<div class="text-xs opacity-60 pt-1">図: SnorkelMap の画面（出典: Cloudflare Blog https://blog.cloudflare.com/civil-society-automation/）</div>

---

# 人権団体との共同開発

<div class="text-left text-sm pt-2">

- 大規模な団体から、複雑なワークフローとエンジニアリング支援を求める声
- 共通課題: 手作業で集めた分散情報を、統合・レビュー・構造化して初めて分析できる
- データは機微（被害者の名前など）。不正アクセス・漏えい・ハルシネーションの影響が重大
- Cloudflare は無償提供に加え、<strong>ボランティアのエンジニアチーム</strong>（製品専門家、フロントエンドデザイナー、バックエンド開発者、セキュリティアドバイザー）を組んで設計・構築を支援
- 探っている問い: どこで自動化が役立つか / どのモデルが合うか / どんなセキュリティ制御が要るか / どこで人が関与し続けるか

</div>

---

# Freedom House: 越境弾圧の追跡

<div class="text-left text-sm pt-2">

- 1941年設立。越境弾圧（政府が国境を越えて亡命者・ディアスポラの異論を封じる行為）の包括的なデータベースを維持
- 課題: 数千件の候補事例を手作業で特定・コード化するのは負担が大きい
- 対話型ダッシュボード: 公開報道から潜在的な事例を<strong>取り込み・構造化・フラグ付け</strong>
- 団体の方法論でファインチューニング。全工程に Freedom House が関与
- セキュリティとデータ最小化を設計判断の優先事項に

</div>

<img src="https://customer-eq7kiuol0tk9chox.cloudflarestream.com/2356cc9ad90cf36722b1e6410fedee8c/thumbnails/thumbnail.jpg?height=600" style="max-height: 250px; margin: 0.5rem auto 0;" />

<div class="text-xs opacity-60 pt-1">図: プロトタイプ動画のサムネイル（出典: Cloudflare Blog https://blog.cloudflare.com/civil-society-automation/）</div>

---

# Global Network Initiative: 政策動向の把握

<div class="text-left text-sm pt-2">

- 市民社会・学術・投資家・テック企業（Cloudflare を含む）のメンバー組織
- EU の透明性要件からアジア太平洋のデータローカライゼーション義務まで、数十の法域の動きを追う
- ダッシュボード: 関連ニュース・意見公募・立法の動きを抽出・説明・分類し、<strong>提言の機会</strong>を推奨
- 内部レビューの進捗を追跡し、期限をスタッフに通知

</div>

<img src="https://customer-eq7kiuol0tk9chox.cloudflarestream.com/f43514ec54547cf2194580dd710474c8/thumbnails/thumbnail.jpg?height=600" style="max-height: 250px; margin: 0.5rem auto 0;" />

<div class="text-xs opacity-60 pt-1">図: プロトタイプ動画のサムネイル（出典: Cloudflare Blog https://blog.cloudflare.com/civil-society-automation/）</div>

---

# Article One: 人権リスクの評価

<div class="text-left text-sm pt-2">

- 企業が方針・製品・事業の人権への影響を理解し軽減するのを助けるコンサルティング会社
- 仕事: 工場監査から国別状況レポートまで、大量の文書を読んで要約
- リスク評価ツール: 情報を処理・構造化し、<strong>重要な人権リスクを特定</strong>、推奨案の<strong>ドラフト</strong>を生成
- スタッフがレビュー・修正する。「AI は構造化を助けるが、判断はすべて Article One が行う」

</div>

---

# コード例について

<div class="text-left text-sm pt-2">

- 本記事にコード例はない（事例紹介とプログラム発表の記事）
- 代わりに、3つの人権団体ツールに共通する「人が関与する」処理の流れを整理する

```text {all|1|2|3|4}
1. 公開報道・監査文書などの分散した情報を取り込む
2. AI が構造化し、候補・リスクにフラグを立てる／下書きを作る
3. 人（団体のスタッフ）がレビューし、修正・判断する
4. 判断の結果を分析・提言・報告に使う
```

- 上の流れは、記事の記述（各団体が全工程に関与、判断は人が行う）を整理した図で、記事内の図ではない

</div>

---

# ユースケース

<div class="grid grid-cols-2 gap-4 pt-2 text-left text-sm">
<div class="p-3 border rounded"><strong>ローカルニュースの業務基盤</strong><br>分散ツールを、企画から公開・読者分析までの1システムに（LebTown）</div>
<div class="p-3 border rounded"><strong>メンタルヘルス支援の規模拡大</strong><br>WhatsApp 上のカウンセリング。通話中の AI フィードバック（Kaya Guides）</div>
<div class="p-3 border rounded"><strong>人権データの一次選別</strong><br>公開報道から候補事例を取り込み・フラグ付け（Freedom House）</div>
<div class="p-3 border rounded"><strong>政策動向と提言の管理</strong><br>数十の法域の動きを分類し、レビューと期限を管理（GNI）</div>
<div class="p-3 border rounded"><strong>人権リスク評価の下書き</strong><br>監査文書を構造化しリスクと推奨案を起案（Article One）</div>
<div class="p-3 border rounded"><strong>ボランティア運営のコミュニティアプリ</strong><br>投稿・画像の保管と攻撃からの保護（Snorkelling Society）</div>
</div>

---

# まとめ・所感

<div class="text-left text-sm pt-2">

- 力点は「AI を使う」ことより、<strong>機微なデータを扱う組織が安全・低コストに使える土台</strong>
- 守られる側から、作る側へ。Project Galileo の延長にある取り組み
- 人権団体3件に共通するのは、AI の役割が取り込み・構造化・下書きに限られ、<strong>最終判断は人</strong>という点
- 数値（750万ドル、3,400ドメイン、10,439人など）は Cloudflare または各組織の自己報告
- 各ツールの実装詳細（モデル・構成）は記事に書かれていない
- 関連: Impact プログラムの総論 ▶ <a href="../100-million-donations/">解説スライド</a>
- 第2コホートの募集中。申込時に「non-profit」を選択

</div>

---

# 参考リンク

<div class="text-left text-sm pt-2">

- 原文: https://blog.cloudflare.com/civil-society-automation/
- 非営利向けスタートアッププログラム: https://blog.cloudflare.com/expanding-startups-for-nonprofits/
- 応募: https://www.cloudflare.com/startups/
- Project Galileo: https://www.cloudflare.com/galileo/
- Workers AI: https://www.cloudflare.com/products/workers-ai/
- AI Gateway: https://www.cloudflare.com/products/ai-gateway/
- 関連解説スライド: [Cloudflare Impact が寄付1億ドルに到達](../100-million-donations/) / [Cloudflare 2026年度創業者レター](../cloudflares-2026-annual-founders-letter/)

</div>
