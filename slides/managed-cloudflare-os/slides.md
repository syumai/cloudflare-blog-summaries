---
routerMode: hash
theme: default
title: "Cloudflare OS: 会社のエージェントワークスペースを、マネージドで提供"
info: |
  Cloudflare OS: your company's agent workspace, managed for you の解説スライド。
  原文: https://blog.cloudflare.com/managed-cloudflare-os/
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

# Cloudflare OS

会社のエージェントワークスペースを、マネージドで提供

Birthday Week 2026

<div class="pt-4 text-sm opacity-70">
原文: https://blog.cloudflare.com/managed-cloudflare-os/<br>
公開日: 2026-10-01
</div>

---

# TL;DR

- <strong>フルマネージド版 Cloudflare OS</strong> のウェイトリストが始まった
- 指定するのは <strong>カスタムドメイン・Access ポリシー・AI Gateway</strong> の 3 つ。残りは Cloudflare が担当
- 8 月の発表以来、<strong>数千の組織</strong>が利用を開始
- 追加機能: <strong>Git リポジトリのマウント</strong> / <strong>Google Workspace 連携の強化</strong> / <strong>多様な形式へのエクスポート</strong>
- オープンソース版は引き続き利用でき、自分のアカウントにデプロイできる

---

# アジェンダ

- 背景: Cloudflare OS とは、運用の負担
- フルマネージド版（ウェイトリスト）
- この 1 か月の機能追加
  - Git リポジトリのマウント
  - Google Workspace 連携
  - エクスポート形式
- コード例について
- ユースケース
- まとめ・参考リンク

---

# 背景: 「情報を集めて形にする」作業

<div class="grid grid-cols-2 gap-6 pt-4 text-left">
<div class="p-4 border rounded">

<strong>記事の例: 顧客ミーティングの準備</strong>

- 社内の進め方を調べる
- CRM のアカウントを確認する
- サポートチケットや製品の利用状況を見る
- 短いプレゼンにまとめる
- これを月に 100 回繰り返す

</div>
<div class="p-4 border rounded">

<strong>Cloudflare OS でできること</strong>

- エージェントに作業を任せる
- チーム向けのツールを作る
- 状況に応じて両者を行き来する
- 8 月にオープンソースとして公開

</div>
</div>

---

# 背景: オープンソース版の運用負荷

- オープンソース版は、自分の Cloudflare アカウントにデプロイできる（制御権は完全に自分のもの）
- その一方で、<strong>誰かがデプロイを設定・運用・更新する</strong>必要がある
- 数千の組織が、データの活用・ドキュメントやスライドの作成・ツール構築・業務自動化に利用している

<div class="pt-6 text-sm opacity-70">
→ 運用を任せたい組織向けに、フルマネージド版を用意する
</div>

---

# フルマネージド版: 利用者が決めること

<div class="grid grid-cols-2 gap-6 pt-4 text-left">
<div class="p-4 border rounded">

<strong>ダッシュボードで指定</strong>

- <strong>カスタムドメイン</strong>
- 適用する <strong>Cloudflare Access ポリシー</strong>
- 接続する <strong>AI Gateway</strong>

</div>
<div class="p-4 border rounded">

<strong>組織側が決める統制</strong>

- 誰がアクセスできるか
- どの組織固有のスキル・コンテキストが使えるか
- どのシステムに到達できるか

</div>
</div>

<div class="pt-4 text-sm opacity-70">
残りは Cloudflare が担当。現在はウェイトリスト段階（記事の表現は「you'll be able to」）
</div>

---

# 追加機能①: Git リポジトリのマウント

<div class="grid grid-cols-2 gap-6 pt-4 text-left">
<div class="p-4 border rounded">

<strong>これまで</strong>

- ドキュメント・スライド・自動化・共同作業ツールなど、開発以外の作業が中心
- エージェントはアプリのコードを書けるが、既存の Git リポジトリのコードは扱えなかった

</div>
<div class="p-4 border rounded">

<strong>今回</strong>

- 既存の GitHub リポジトリを接続
- コードの探索・バグ修正・機能追加・PR 作成
- ファイルの検索と編集、変更のレビュー、コミット作成、GitHub への push

</div>
</div>

---

# 追加機能②: Google Workspace 連携

<div class="grid grid-cols-2 gap-6 pt-4 text-left">
<div class="p-4 border rounded">

<strong>背景</strong>

- 判断はメールのスレッド
- 文脈は Google Drive
- 分析は Sheets
- 調整は Calendar

</div>
<div class="p-4 border rounded">

<strong>Google Workspace Gatekeeper を改善</strong>

- Gmail のスレッドを読んで調査
- 下書きの作成、メールの送信
- Drive 全体・特定フォルダ・個別のドキュメントやシートを接続

</div>
</div>

<div class="pt-4 text-sm opacity-70">
Gatekeeper: Cloudflare OS と外部サービスの間に入る、サービス固有の Worker
</div>

---

# 追加機能③: エクスポート形式

| 形式 | 状況 |
| --- | --- |
| Microsoft Excel (.xlsx) | 利用可能 |
| CSV | 利用可能 |
| PDF | 利用可能 |
| Markdown | 利用可能 |
| HTML | 利用可能 |
| Word (.docx) / PowerPoint (.pptx) | 近日対応予定 |

<div class="pt-4 text-sm">
作成したツール自身が独自のエクスポート形式を定義できる。例:「このスケジュールを .ics でダウンロードしたい」と伝えるとエクスポートメニューに追加される
</div>

---

# コード例について

- 本記事は製品発表・機能追加の紹介記事で、<strong>コード例は掲載されていない</strong>
- 代わりに、マネージド版で利用者が指定する項目と、追加機能の流れを整理する

```text
マネージド版 の指定項目:
  1. カスタムドメイン      (例: 自社ドメイン)
  2. Cloudflare Access ポリシー  (誰が使えるか)
  3. AI Gateway            (どのモデル経路か)
  → 残りの構成・運用・更新は Cloudflare が担当
```

<div class="text-xs opacity-60">
上記は記事の説明を整理した概念図であり、実際の設定コードではありません
</div>

---

# ユースケース

<div class="grid grid-cols-2 gap-4 text-left">
<div class="p-3 border rounded">

<strong>顧客ミーティングの準備</strong>（記事の例）<br>
CRM・サポートチケット・利用状況を集め、短いプレゼンにまとめる

</div>
<div class="p-3 border rounded">

<strong>既存コードベースの修正</strong><br>
リポジトリをマウントして、バグ修正から PR 作成まで任せる

</div>
<div class="p-3 border rounded">

<strong>メール起点の調査と返信</strong><br>
Gmail のスレッドを読んで下書きを作り、確認して送信する

</div>
<div class="p-3 border rounded">

<strong>成果物の受け渡し</strong><br>
.xlsx・CSV・PDF などで書き出し、既存の業務フローへ渡す

</div>
</div>

---

# まとめ・所感

- 新しい仕組みの解説ではなく、<strong>マネージド提供の予告と機能追加のダイジェスト</strong>
- 利用者に残る判断は、アクセス・組織文脈・到達先・AI Gateway の 4 点で、いずれも統制に関わる
- 提供時期・料金などは記事に記載がなく、<strong>ウェイトリスト段階</strong>
- 設計の詳細（Gatekeeper・Dynamic Worker など）は前身の記事で解説されている

---

<div class="text-center">

# 参考リンク

</div>

- 原文: [Cloudflare OS: your company's agent workspace, managed for you](https://blog.cloudflare.com/managed-cloudflare-os/)
- 前身の解説スライド: [Cloudflare OS：エージェント、アプリ、作業のためのオープンプラットフォーム](../cloudflare-os/)
- 関連解説スライド: [Cloudflare OSで、Cloudflareの働き方を再構築する](../how-we-use-ai-with-cloudflare-os/)
- 関連解説スライド: [エージェントアクセスモデル](../the-agent-access-model/)
- 関連解説スライド: [ID情報に基づく分析で、不正なAIの利用を検出](../identity-aware-ai-gateway/)
- [cloudflare-os（GitHub）](https://github.com/cloudflare/cloudflare-os)
- [マネージド版のウェイトリスト](http://cloudflare.com/resource/cloudflare-os-managed/)

<div class="pt-8 text-sm opacity-50">
Wiki: docs/articles/2026-10-01-managed-cloudflare-os.md
</div>
