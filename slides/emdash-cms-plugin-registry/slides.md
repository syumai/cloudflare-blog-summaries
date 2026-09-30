---
routerMode: hash
theme: default
title: "EmDash 1.0: 安全なプラグインレジストリを備えた安定版 CMS"
info: |
  EmDash 1.0 の解説スライド。
  原文: https://blog.cloudflare.com/emdash-cms-plugin-registry/
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

# EmDash 1.0
# 安全なプラグインレジストリを備えた安定版 CMS

Birthday Week 2026

<div class="pt-4 text-sm opacity-70">
原文: https://blog.cloudflare.com/emdash-cms-plugin-registry/（英語版）<br>
公開日: 2026-09-28
</div>

---

# TL;DR

- Astro ベースのオープンソース CMS <strong>EmDash が 1.0</strong> に到達（MIT ライセンス）
- プラグインレジストリは <strong>AT Protocol</strong> 上に構築。アカウント・パッケージ・カタログを分離
- プラグインは<strong>サンドボックス</strong>で実行（Cloudflare は Dynamic Workers、Node.js は workerd）
- Workers for Platforms と組み込み MCP サーバーで、サイト作成プラットフォームを構築可能
- AI サイトビルダー <strong>EmDash Build</strong>（アルファ）も公開

---

# アジェンダ

- 1.0 までの道のりとコミュニティ
- プラグインレジストリ（AT Protocol）
- サンドボックス化されたプラグイン
- プラットフォームとしての EmDash
- EmDash Build
- コード例・ユースケース・まとめ

---

# 背景・課題

- 従来の CMS ではプラグインが本番コンテンツと同じ権限で動く
  - DB、ファイルシステム、ネットワークに自由にアクセス可能
- プラグイン配布は単一の運営元に集約されがち
- EmDash 1.0 の答え: <strong>実行時の分離</strong>と<strong>配布の分散</strong>

<img src="https://blog.cloudflare.com/_emdash/api/media/file/01M3D0T7XHPBZM8YB0PX5W78EQ.png" class="mx-auto rounded mt-4" style="max-height: 230px;" />

<div class="text-xs opacity-70 mt-1">出典: Cloudflare Blog https://blog.cloudflare.com/emdash-cms-plugin-registry/</div>

---

# 1.0 までの道のり

- ベータ後の 5 か月間、実運用の声をもとに強化
  - データ保護・DB マイグレーション・編集ワークフロー・多言語・プラグイン安全性・性能・信頼性
- <strong>Avulux</strong>: WordPress から 1 日足らずで移行（EmDash Agent Skills を利用）
- <strong>Customer Zero</strong>: Cloudflare 自身が 8 月にブログを移行
  - 多言語・メディア管理・最大 5,000 リクエスト/秒のスパイクが要件に

---

# オープンな開発とエコシステム

- MIT ライセンス。175 人・1,800 コミット・25 言語への翻訳
- インターンの Noah Pham 氏が 2 人目のメンテナに（80 件超の変更）

| 参加者 | 内容 |
|--------|------|
| Lexington Themes | 44 の Astro テーマの EmDash 版 |
| Urumi | WooCommerce の知見を活かした eCommerce プラグイン |
| Empress | 複数ブランドのサイト管理プラットフォーム |

---

# プラグインレジストリ: 3つの分離

| 分離される機能 | 役割 |
|----------------|------|
| 発行者アカウント | Atmosphere のポータブルな ID |
| パッケージ記録 | 公開者が所有権とリリース履歴を保持 |
| 発見用カタログ | モデレーションは表示のみに作用 |

- <strong>AT Protocol</strong>（Bluesky を支える分散ネットワーク）上に構築
- 署名付き Merkle Search Tree で第三者が独立して検証可能

---

# レジストリの構成要素

- <strong>aggregator</strong>: レジストリのデータを集約
- <strong>labeler サービス</strong>: Workers AI を使用
- <strong>Astro live content loader</strong>: サイトからレジストリを参照
- すべてオープンソース
- 有料プラグインは Atproto Spaces（アルファ）を使い将来対応予定

---

# 明確な境界を持つプラグイン

| 機能 | WordPress | EmDash |
|------|-----------|--------|
| DB への直接アクセス | あり | なし |
| ファイルシステム | あり | プライベートなストレージのみ |
| ネットワーク | 無制限 | 承認された宛先のみ |
| プラグイン間アクセス | 全面的 | なし |

- Cloudflare: <strong>Dynamic Workers</strong> として実行
- Node.js: オープンソースの <strong>workerd</strong> を別プロセスで実行

---

# 単一サイトからプラットフォームへ

- <strong>Workers for Platforms</strong> でサイト作成サービスを提供可能
- コンテンツ層: 管理画面・API・CLI・組み込みの <strong>MCP サーバー</strong>
- 例: パン屋のオーナーが自然言語で営業時間を変更 → エージェントが読み取り・更新・保存
- サンドボックス化されたプラグインで、マルチテナントでも安全に拡張
- 厳選したプラグインのみ、またはレジストリ全体から選択可能

---

# EmDash Build（アルファ）

<div class="text-left">

1. エージェントが自然言語の依頼を受ける
2. EmDash MCP サーバーでコンテンツモデルを設計
3. コンテンツを表示するページを作成
4. 所有者は管理画面またはエージェントで編集
5. 変更は Cloudflare Sandbox 内で git コミットとして記録
6. 公開コンテンツは Workers for Platforms 上の本番 EmDash へ

</div>

<div class="text-sm opacity-70 mt-4">build.emdashcms.com で公開中</div>

---

# コード例: セットアップ

記事にあるコードはセットアップコマンドのみ（代表的な利用イメージとして示す）

```sh
npm create emdash@latest
```

<div class="mt-4">

- 対話的にプロジェクトを作成
- Cloudflare ダッシュボードからのワンクリックデプロイも可能
- プラグイン開発は公式ガイド「Your first plugin」を参照

</div>

---

# ユースケース

| 場面 | 内容 |
|------|------|
| WordPress からの移行 | Avulux は 1 日足らずで移行。開発者は拡張、マーケターは直接編集 |
| 安全なプラグイン導入 | 検索インデックス・画像最適化・公開通知を必要な権限のみで |
| サイト作成プラットフォーム | Workers for Platforms 上で顧客ごとに EmDash サイトを提供 |
| エージェントによる更新 | MCP サーバー経由で自然言語からコンテンツを更新 |
| AI によるサイト生成 | EmDash Build で依頼文から構造・ページ・編集環境まで |

---

# まとめ・所感

- 中心は「実行時の分離」と「配布の分散」の 2 軸
- モデレーションがカタログ表示のみに効く点は、レジストリが公開物を削除できない設計
- Node.js でも workerd を使うため、Cloudflare 以外でも同じ分離モデル
- EmDash Build・有料プラグインはアルファ段階のため要確認
- 最小構成の Worker では再現できないため、デプロイ可能なサンプルは作成していない

---

# 参考リンク

- 原文（en-us、日本語版なし）: https://blog.cloudflare.com/emdash-cms-plugin-registry/
- リポジトリ: https://github.com/emdash-cms/emdash
- Playground: https://try.emdashcms.com/
- プラグインレジストリ: https://plugins.emdashcms.com/
- ドキュメント: https://docs.emdashcms.com/
- Wiki: [docs/articles/2026-09-28-emdash-cms-plugin-registry.md](https://github.com/syumai/cloudflare-blog-summaries/blob/main/docs/articles/2026-09-28-emdash-cms-plugin-registry.md)
