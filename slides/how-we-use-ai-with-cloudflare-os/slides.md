---
theme: default
title: Cloudflare OSで、Cloudflareの働き方を再構築する
info: |
  Cloudflare Blog記事「How we're rethinking work at Cloudflare with Cloudflare OS」の解説スライド。
  原文: https://blog.cloudflare.com/how-we-use-ai-with-cloudflare-os/
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

# Cloudflare OSで、
# Cloudflareの働き方を再構築する

CIO Sam Rhea氏が語る、社内AI活用の舞台裏

<div class="pt-4 text-sm opacity-70">
原文: https://blog.cloudflare.com/how-we-use-ai-with-cloudflare-os/（英語版のみ）<br>
著者: Sam Rhea（Cloudflare チーフインフォメーションオフィサー）<br>
公開日: 2026-08-05
</div>

---

# アジェンダ

<v-clicks>

- 発端: ある社員からの「過大な権限」リクエスト
- 5つの基本原則
- 2つの並行パイロット（エンジニア向け／非エンジニア向け）
- Cloudflare OS v1: ブラウザ完結のワークスペース
- Cloudflare OS v2: 誰もが使えるエージェントで、より決定論的に
- ユースケース: ITヘルプデスクの日次レポート
- 展開の成果とまとめ

</v-clicks>

---

# 発端: 「約12システムへの本番アクセス」

<v-click>

> 営業組織のあるメンバーが、AIで"スーパーアプリ"を作って
> go-to-marketチームを変革したいとして、
> **約12の本番システムへのアクセスと、
> デプロイメントパイプラインへの管理者権限**を要求した

</v-click>

<v-click>

この要求の大きさが、当時Cloudflareが直面していた課題を象徴している

</v-click>

---

# 背景: 慎重姿勢から一転した年末年始

<v-clicks>

- 2025年を通じて、Cloudflareは AI 導入に慎重だった
  - 情報チャットボット、ボイラープレートコード生成止まり
- 年末年始の数日間でモデル・ツールが急速に進化
- AIエージェントが実際に「タスクをやり遂げる」ようになった
- 数百人の社員が新ツールを試し、かつてないほど簡単に構築できると気付く
- 「仕事のやり方を変えたい」という要望が一気に押し寄せた

</v-clicks>

---

# 2つの相反する責務

<div class="grid grid-cols-2 gap-4 pt-4">
<div>

### 装備・有効化する責務
チームメンバーにAIツールを
使いこなせるようにする

</div>
<div>

### 安全に保つ責務
システム・内部データ・
顧客データを安全に保つ

</div>
</div>

<v-click>

<div class="pt-8 text-center">

この2つを両立するために構築されたのが **Cloudflare OS**

</div>

</v-click>

---

# 基本ルール: 5つの原則①②

<v-clicks>

- **原則1: AIを使うためにAIを使わない**
  - まず「解決すべき仕事」を定義し、その後で適切なツールを選ぶ
- **原則2: 全員が"超能力"を持つに値する**
  - 開発者向けCLIに偏らず、直感的なプラットフォームで
    非開発者にも力を与える

</v-clicks>

---

# 基本ルール: 5つの原則③④⑤

<v-clicks>

- **原則3: 出力の所有者は人間である**
  - AIはツール（メーカー）。品質・テストの責任は人間が負う
  - エージェントの運用責任も、人間の業務同様に引き継がれる
- **原則4: 組織の文脈はモデルより重要**
  - Cloudflare固有の事情を理解させるための文脈層に投資する
- **原則5: AI利用でアクセス権を拡張しない**
  - 既存のスコープされたデータアクセスを、AI利用時もそのまま適用

</v-clicks>

---
class: text-center
---

# 2つの並行パイロット

エンジニア向け と 非エンジニア向け

---

# パイロット①: エンジニア向け「Engineering Codex」

<v-clicks>

- AIツールはエンジニアの業務を加速する一方、悪いコードもより速く書けてしまう
- 権威あるガイド「Cloudflare Engineering Codex」を整備
  - ポリシー = してはいけないこと／ Codex = すべきこと
- ソフトウェア開発ライフサイクル全体でエージェントが活用
  - 作業計画支援、MRレビュー、技術設計レビュー、インシデントレビュー

</v-clicks>

<v-click>

<div class="pt-4 text-center text-lg">

過去4か月で **約250万件** の潜在的問題を検出、**16,000件**のマージをブロック、
コードが書かれる前に**約600件**の設計でアーキテクチャ問題を発見

</div>

</v-click>

---

# パイロット②: 非エンジニア向け「魔法のメールエイリアス」

<v-clicks>

- エンジニア向けハーネス（リポジトリをクローン＋`AGENTS.md`）は
  非エンジニアの業務（1回限りの成果物、複数システム横断）と相性が悪い
- 社員が「自動化したいがやりたくない仕事」をメールで送れる
  「魔法のメールエイリアス」を用意
- 裏側の小さなチームが数百、やがて数千件のセッションを処理
- 繰り返し依頼される定型業務のパターンをスキルファイル・文脈ファイル化

</v-clicks>

---
layout: image-right
image: https://blog.cloudflare.com/_emdash/api/media/file/01KZ7KNN9369M9JEXJ7W2AGR0Z.png
---

# Cloudflare OS v1

ブラウザ完結の
クラウドワークスペース

<v-clicks>

- コンテナ上で動くシンプルなハーネス
- Cloudflare Zero Trustで認証
- ローカル環境の構成は不要

</v-clicks>

<footer class="text-xs opacity-50 mt-4">
出典: Cloudflare Blog https://blog.cloudflare.com/how-we-use-ai-with-cloudflare-os/
</footer>

---

# v1: クラウドベースであることの利点

<v-clicks>

- エフェメラルなクラウド環境は、そのセッションで
  持ち込んだデータへのアクセスのみを持つ
- セキュリティチームは監査可視性とネットワーク制御を確保
  （インターネット上のどこへ接続できるかのフィルタリングを含む）
- スキルファイル（部門横断で識別された共通ワークフロー）を
  ワンクリックで実行可能
- 出力（ドキュメント・スライド等）は右パネルにレンダリングされ、
  チームメイトと共有できる

</v-clicks>

---
layout: image-right
image: https://blog.cloudflare.com/_emdash/api/media/file/01KZ7KNNHBNVFCWA84C9DZH2FS.png
backgroundSize: contain
---

# v1: MCP Portalによるデータ接続

<v-clicks>

- MCP標準でAIツールをシステムオブレコードに接続
- アクセス範囲は本人の既存の権限にスコープ
- 多くの場合、自前実装のMCPサーバーをWorkers上に構築
  - ロール・地域別のレート制限などを独自に追加可能

</v-clicks>

<footer class="text-xs opacity-50 mt-4">
出典: Cloudflare Blog https://blog.cloudflare.com/how-we-use-ai-with-cloudflare-os/
</footer>

---
layout: image-right
image: https://blog.cloudflare.com/_emdash/api/media/file/01KZ7KNNTTDXVRB6GPN1XPVADD.png
backgroundSize: contain
---

# v1: AI Gatewayによる監視・制御

<v-clicks>

- すべての推論リクエストがAI Gatewayを経由
- Secure Web GatewayのDLPルールを再利用してブロック可能
- モデル利用をロール別にゲート制御
  - 自動化ユースケースはより効率的なモデルへ誘導

</v-clicks>

<footer class="text-xs opacity-50 mt-4">
出典: Cloudflare Blog https://blog.cloudflare.com/how-we-use-ai-with-cloudflare-os/
</footer>

---

# 課題: 都度実行するAI推論のコスト

<v-click>

> Cloudflare OS v1では、ユーザーがスキルファイルを実行するたびに
> **トークン集約的な推論セッション**が立ち上がっていた

</v-click>

<v-clicks>

- しかしCloudflareの業務の多くは、実質ほぼ決定論的な一連のステップ
- 適切な箇所にだけ推論（あるいは人間の判断）を挟めば十分
- 「AIは常にツールである必要はなく、**ツールメーカー**であればよい」

</v-clicks>

---

# Cloudflare OS v2: より決定論的なエージェント

<v-clicks>

- 自然言語でワークフローを説明
- AIエージェントがそのワークフローを支えるコードを実際に生成
- オンデマンド・スケジュール実行・イベントトリガーで動作
- 権限管理は`gatekeeper`サービスが担当
  - データセットへの安全な接続を組み込む

</v-clicks>

---
class: text-center
---

# ユースケース:
# ITヘルプデスクの日次レポート

Sam Rhea氏自身の事例

---
layout: image-right
image: https://blog.cloudflare.com/_emdash/api/media/file/01KZ7KNNJ3NG9A98ZYVSZNKF36.png
backgroundSize: contain
---

# Before: 手作業によるレポート作成

<v-clicks>

- 毎朝、未処理チケットのキューとメトリクスを確認したい
- チケットシステムの組み込みダッシュボードは簡易的
- CSVをダウンロード → Google Sheetsへ → チャート作成
- クローズ済みチケットを手動で1件ずつ確認
- 時間がかかり、システム外に冗長なコピーも発生

</v-clicks>

<footer class="text-xs opacity-50 mt-4">
出典: Cloudflare Blog https://blog.cloudflare.com/how-we-use-ai-with-cloudflare-os/
</footer>

---

# v1での改善、そして残った課題

<v-clicks>

- チケットシステムのMCPサーバーに接続したスキルファイルとして実行
- 手作業は減り、安全性も向上
- しかし、ほぼ毎朝内容が変わらない同じレポートのために
  **毎回数千トークンを消費**
- チケットのトリアージや返信ドラフトでも同様にトークンを消費

</v-clicks>

---
layout: image-right
image: https://blog.cloudflare.com/_emdash/api/media/file/01KZ7KNNJMKFH9E6MDZY92DWW1.png
backgroundSize: contain
---

# v2での解決

<v-clicks>

- 見たいチャートを説明するだけ
- AIエージェントがそれを実現するコードを**一度だけ**生成
- `gatekeeper`経由でデータセットへ安全に接続
- 以後、レポート読み込みのトークン消費は実質**ゼロ**
- 返信ドラフトなど推論が必要な部分だけアプリ内に埋め込み
- 同僚と共有しても、各自の権限でデータ境界を越えない

</v-clicks>

<footer class="text-xs opacity-50 mt-4">
出典: Cloudflare Blog https://blog.cloudflare.com/how-we-use-ai-with-cloudflare-os/
</footer>

---

# 展開の成果

<v-clicks>

- 専任AIチームではなく、各部門の早期採用者を「チャンピオン」に
- 数千人のCloudflareチームメンバーが毎週プラットフォームを利用
- 直近1か月で、営業チームだけで**1万時間以上**を削減
  （テリトリー計画・提案作成など）
- 同じ30日間で**4,000以上**のアプリ・ツールが作成された

</v-clicks>

---

# まとめ

<v-clicks>

- Cloudflare OSは「装備・有効化」と「安全に保つ」という
  相反する責務を両立させるために構築された
- 5原則の核心は「AI利用でアクセス権を拡張しない」というゼロトラスト的発想
- v1（都度推論）→ v2（推論をコード化し以後は決定論的に実行）は
  AIエージェント活用のコスト最適化パターンとして参考になる
- Gatekeeperがv1・v2を貫く権限管理の要

</v-clicks>

---

<div class="text-center">

# 参考リンク

</div>

- 原文: [How we're rethinking work at Cloudflare with Cloudflare OS](https://blog.cloudflare.com/how-we-use-ai-with-cloudflare-os/)
- 関連解説スライド: [Cloudflare OS：エージェント、アプリ、作業のためのオープンプラットフォーム](../cloudflare-os/)
- [Cloudflare OS製品紹介記事](http://blog.cloudflare.com/cloudflare-os)
- [Engineering Codexとコードレビュー自動化について](http://blog.cloudflare.com/engineering-standards-enforcement)
- [AI Gatewayの利用上限設定（spend limits）](https://blog.cloudflare.com/ai-gateway-spend-limits/)

<div class="pt-8 text-sm opacity-50">
Wiki: docs/articles/2026-08-05-how-we-use-ai-with-cloudflare-os.md
</div>
