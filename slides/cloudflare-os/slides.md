---
theme: default
title: Cloudflare OS：エージェント、アプリ、作業のためのオープンプラットフォーム
info: |
  Cloudflare Blog記事「Cloudflare OS：エージェント、アプリ、作業のためのオープンプラットフォーム」の解説スライド。
  原文: https://blog.cloudflare.com/ja-jp/cloudflare-os/
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
# エージェント、アプリ、作業のための
# オープンプラットフォーム

<div class="pt-4 text-sm opacity-70">
原文: https://blog.cloudflare.com/ja-jp/cloudflare-os/<br>
公開日: 2026-08-10
</div>

---

# アジェンダ


- 背景・課題: 最初のバージョンから学んだこと
- Cloudflare OSの3つの構成要素
- エージェントワークスペース
- セキュリティ・ガバナンス基盤: Gatekeeper
- 個人向けアプリのプラットフォーム
- コード例
- コスト管理とオープンソース公開
- ユースケースとまとめ


---

# 背景: 組織全体でAIを活かす難しさ


- すべての組織には、独自の用語・業務手順・システム・仕事の進め方がある
- プログラムコードは「動くか動かないか」で成果が明確
- 開発者以外の仕事も含め、組織全体でAIを活かすのはより難しい
- エージェントには、会社固有の知識と、業務システムへのアクセスが必要
- 得た知識・権限を使って、組織の目的達成につながる仕事を実行できねばならない


---

# 最初のバージョンから学んだこと

<div class="grid grid-cols-2 gap-4 pt-4">
<div>

### 技術的課題
- アプリが静的で社内システムと
  リアルタイム連携しない
- 定型作業のたびに再実行 →
  トークン消費が積み重なる

</div>
<div>

### セキュリティ上の課題
- 「どのツールを使えるか」は
  分かるが「何を実際に見たか」
  までは管理できない
- 共有により権限のない情報が
  誤って見えてしまう可能性

</div>
</div>


<div class="pt-6 text-center">

セキュリティはプラットフォーム自体に組み込む方針で作り直した

</div>


---
layout: image-right
image: https://blog.cloudflare.com/_emdash/api/media/file/01KZ7PDY68A0TND85MN4AZCF3G.png
backgroundSize: contain
---

# Cloudflare OSの3つの構成要素


1. **エージェントワークスペース**
   会社の知識・スキルを基盤に動くAIの作業環境
2. **新しいセキュリティ・ガバナンス基盤**
   社内データ・サービスへの安全なアクセス
3. **個人向けアプリのプラットフォーム**
   社員が作成・共有・変更し続けられるアプリ環境


<footer class="text-xs opacity-50 mt-4">
出典: Cloudflare Blog https://blog.cloudflare.com/ja-jp/cloudflare-os/
</footer>

---
class: text-center
---

# エージェントワークスペース

---

# 誰もが使えるワークスペース


- 開発者知識・ターミナル操作の知識は不要、ブラウザで完結
- 「セッション」「ステータス永続保持」「出力とファイル」
  「各種リソースへのアクセス」「隔離実行環境」を統合
- 会社が蓄積した知識・スキルがあらかじめ登録済み
- 業務手順・専門用語をゼロから説明し直す必要がない


---

# ワークスペースでできること①②


- **調査・質問への回答**
  - 会社の知識と社内リソースを使って調査
  - エージェント自身が検索・フィルタリング・分析コードを書く
- **ドキュメント／プレゼン／スプレッドシート作成**
  - 元データに接続したまま更新に追随する成果物も可能
  - Google Driveなど既存フォーマットへのエクスポート対応


---

# ワークスペースでできること③④


- **チームで使う連携型アプリの作成**
  - 独自インターフェース・ロジック・状態を持つアプリを構築
  - 社内リソースに接続したまま複数人で共同利用
- **決まった手順のワークフロー自動化**
  - 固定処理はコードで、判断が必要な部分だけモデルに
  - 手動・スケジュール・イベントトリガーで起動可能


---
class: text-center
---

# 新しいセキュリティ・ガバナンス基盤
# Gatekeeper

---

# なぜAPIキーの直接付与は危険か


- APIキーは広範囲・長期間有効なアクセス権を持つことが多い
- 利用範囲の制限・安全な共有・利用状況の監査が困難
- MCPはサーバー側に資格情報を保持し、定義済みツールのみ公開
- しかしMCPだけでは「実際にどのデータを参照したか」までは
  管理できない



<div class="pt-4 text-center">

承認は、取得したデータがその後どこへ流れうるかまで考慮する必要がある

</div>


---

# エージェントは無権限の状態から始まる


- Cloudflare Accessが「誰がOSにアクセスできるか」を制御
- Cloudflare OS内部では、すべてのエージェント・アプリは
  最初はどのアクセス権も持たない
- エージェントが特定リソースへのアクセスを要求し、管理者が許可
- 許可されたリソースは**型付きバインディング**としてコードに渡される


```ts
const issues = await env.PROJECT.listIssues({
  teamId: "ENG",
  state: "open",
});
```

---

# サンドボックスとcapability


- `env.PROJECT`は特定ポリシー下で特定リソースを扱う権限（capability）
- 資格情報はエージェント・生成コードから完全に分離されている
- サーバー側: 外部ネットワーク通信が無効化されたDynamic Worker
- クライアント側: ブラウザ内のサンドボックス化されたフレーム
- どちらも許可されたcapability経由でしかインターネットへアクセス不可


---
layout: image-right
image: https://blog.cloudflare.com/_emdash/api/media/file/01KZ7PDXZJ8CW8K5Y8DBCBACM7.png
backgroundSize: contain
---

# Gatekeeperがリソースと操作を管理


- Cloudflare OSと外部サービスの間に立つサービス専用Worker
- 対象APIとリソース、実行可能な操作を理解している
- 単一リポジトリのみ許可、読み取り専用、フィールドマスキング、
  レート制限、マージ前承認要求など細かな制御が可能


<footer class="text-xs opacity-50 mt-4">
出典: Cloudflare Blog https://blog.cloudflare.com/ja-jp/cloudflare-os/
</footer>

---

# ポリシーは、見た情報に基づいて適用される


> AIエージェントが機密テーブルを読み取り、
> リアルタイムダッシュボードを作成した場合、
> その共有が「元データへの抜け道」になってはならない



- Cloudflare OSは、エージェントが参照した全リソースを記録
- 参照履歴はエージェント・成果物に関連付けて保持される
- 別のユーザーが成果物を見る際、Gatekeeperがアクセス権を確認
- 機密データ参照後は、外部送信・共有・作業委任などを制限しうる


---
class: text-center
---

# 個人向けアプリのプラットフォーム

---

# 「ファイル」自体がアプリになる


- 文書作成・表計算のような決められたアプリではなく、
  1つ1つの「ファイル」が独立したアプリケーション
- AIエージェントが個人・プロジェクト・チームの目的に合わせて作成
- クライアントコード・サーバーコード・API・耐久性のある状態を
  備えたフルスタックアプリケーション
- 初期状態は非公開、ドキュメントのように共有も可能


---
layout: image-right
image: https://blog.cloudflare.com/_emdash/api/media/file/01KZ7PDXTESRQTCERH9MDPVGC3.png
backgroundSize: contain
---

# すべてのアプリはWorkerとして動作


- クライアントコード（UI）とサーバーコードの2種類を生成
- サーバー側はDynamic Worker上のDurable Object Facetとして実行
- 各アプリが専用のSQLiteデータベースを持つ
- 軽量なV8アイソレートのため専用サーバー・コンテナ不要


<footer class="text-xs opacity-50 mt-4">
出典: Cloudflare Blog https://blog.cloudflare.com/ja-jp/cloudflare-os/
</footer>

---

# Cap'n WebによるRPC通信


- オブジェクト・ケーパビリティ方式のRPCシステム（OSS公開済み）
- サーバー側メソッドを、通常のJavaScript関数のように呼び出せる


```ts
const issues = await app.listIssues({
 status: "done",
});
```


<div class="pt-4 text-center text-lg">

**重要**: エージェントも同じメソッドを呼び出せる<br>
→ 自分のために作ったツールを、不在時にエージェントが代行できる

</div>


---
layout: image-right
image: https://blog.cloudflare.com/_emdash/api/media/file/01KZ7PDXN0ZTW8DZZ0VC98Z0AP.png
backgroundSize: contain
---

# アプリの共有方法は2通り


- **アプリ自体を共有**
  同じ状態をリアルタイムで共同利用
- **ブループリントを共有**
  複製を作成できるようにする
  （コードのみ引き継ぎ、データ・履歴・資格情報は引き継がない）


<footer class="text-xs opacity-50 mt-4">
出典: Cloudflare Blog https://blog.cloudflare.com/ja-jp/cloudflare-os/
</footer>

---
class: text-center
---

# コード例で見る:
# Cloudflare OSの権限モデル

---

# コード例① 型付きバインディングでのアクセス

```ts {all}
const issues = await env.PROJECT.listIssues({
  teamId: "ENG",
  state: "open",
});
```


- `env.PROJECT`はGatekeeperが発行するcapabilityを表すオブジェクト
- 生のAPIキー・資格情報がコードへ直接渡ることはない
- エージェント生成コードもこのcapability経由でしかアクセスできない


---

# コード例② アプリ間のCap'n Web呼び出し

```ts {all}
const issues = await app.listIssues({
 status: "done",
});
```


- クライアントコードからサーバーメソッドを直接呼び出す例
- ポイントは、AIエージェントも**同じメソッド**を呼び出せること
- 「自分が使うために作ったツールを、エージェントが代行できる」
  という設計思想を体現している


---
layout: image-right
image: https://blog.cloudflare.com/_emdash/api/media/file/01KZ7PDXTSXP67QP4M7F21B9V1.png
backgroundSize: contain
---

# あらゆるモデルを使え、コストも管理できる


- すべての推論リクエストはAI Gateway経由
- 利用できるモデル・業務ごとのモデルを一元管理
- すべての作業に最高価格のモデルは不要
- 予算・レート制限、上限到達時の挙動も設定可能


<footer class="text-xs opacity-50 mt-4">
出典: Cloudflare Blog https://blog.cloudflare.com/ja-jp/cloudflare-os/
</footer>

---

# オープンソース公開・カスタマイズ


- **コア**: github.com/cloudflare/cloudflare-os
- **サンプルデプロイメント**: github.com/cloudflare/cloudflare-os-starter
  - Cloudflare社内運用構成がベース
  - コアを変更（パッチ）せずに独自UI・連携・分析を追加できる
- 戦略パートナー（Presidio、Happy Cog）がカスタマイズ・展開を支援


---
class: text-center
---

# ユースケース

---

# ユースケース①〜④


- **調査・質問への回答**: エージェント自身が分析コードを書く
- **ドキュメント／プレゼン／スプレッドシート作成**:
  元データに接続したまま更新に追随
- **チームで使う連携型アプリの作成**:
  独自ロジック・状態を持つアプリを構築・共同利用
- **決まった手順のワークフロー自動化**:
  固定処理はコード、判断が必要な部分だけモデルに


---

# まとめ


- Cloudflare OSは、社員が組織の知識を活かして
  アプリ開発・自動化・安全なアクセスを行うオープンプラットフォーム
- 核心は「エージェントは最初はどの権限も持たない」というゼロトラスト設計
- Gatekeeperが取得後の情報の流れまで参照履歴に基づいて制御
- アプリはDynamic Worker + Durable Object Facetで軽量に実行
- コア・スターターの両リポジトリがOSSとして公開されている


---

<div class="text-center">

# 参考リンク

</div>

- 原文: [Cloudflare OS：エージェント、アプリ、作業のためのオープンプラットフォーム](https://blog.cloudflare.com/ja-jp/cloudflare-os/)
- 英語版: [Cloudflare OS](https://blog.cloudflare.com/cloudflare-os/)
- 関連解説スライド: [Cloudflare OSで、Cloudflareの働き方を再構築する](../how-we-use-ai-with-cloudflare-os/)
- 関連解説スライド: [WriteGuard: MCPサーバーのためのきめ細かな制御機能](../mcp-portal-writeguard-private-beta/)
- [cloudflare-os（GitHub、コア）](https://github.com/cloudflare/cloudflare-os)
- [cloudflare-os-starter（サンプルデプロイメント）](https://github.com/cloudflare/cloudflare-os-starter)
- [Cap'n Web（GitHub）](https://github.com/cloudflare/capnweb)

<div class="pt-8 text-sm opacity-50">
Wiki: docs/articles/2026-08-05-cloudflare-os.md
</div>
