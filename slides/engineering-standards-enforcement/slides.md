---
theme: default
title: CloudflareがAIを使ってエンジニアリング標準を徹底する方法
info: |
  Cloudflare Blog記事「How Cloudflare enforces engineering standards using AI」の解説スライド。
  原文: https://blog.cloudflare.com/engineering-standards-enforcement/
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

# CloudflareがAIを使って
# エンジニアリング標準を徹底する方法

<div class="pt-4 text-sm opacity-70">
原文: https://blog.cloudflare.com/engineering-standards-enforcement/<br>
公開日: 2026-08-04
</div>

---

# アジェンダ


- 背景: 散らばったガイダンスという課題
- Cloudflare Codex: 統治されたエンジニアリング標準
- Codexの組織構成とRFCワークフロー
- コード例: RFCステートメントのJSON抽出
- 3つのCodex利用者: AIコードレビュアー・spec reviewer・incident report reviewer
- ユースケース
- 今後の展望


---

# 背景: 散らばったガイダンス


- 開発者向けガイダンスが、正式ドキュメント・リポジトリ内ファイル・チャット・個人の知識に分散
- エンジニアはガイダンス探しに多くの時間を費やす
- 見つけた答えが最新か、権威あるものかも判断しづらい


<br>


**組織の成長とともに限界に**: どのエンジニアもすべての標準を読み切れず、レビュアーも要件を確実にチェックできない
→ 一貫して周知されないガイダンスが、プロジェクト間の「ズレ（drift）」を生む


---

# 答え: Cloudflare Codex


エージェントが**作業時点で取得・適用できる**、統治されたエンジニアリング標準の集合体



- コードレビュー
- 技術設計レビュー
- インシデントレポートレビュー
- その他多くのユースケースに同じガイダンスを活用


<br>


エンジニアはガイダンス探しではなく、**指摘内容への判断**に集中できる


---

# Codexの組織構成


- ドメインごとに分割（アーキテクチャ、横断的関心事、言語別 など）
- 各ドメインに**オーナー**が存在し、内容・一貫性・品質に責任を持つ
- RFC（Request for Comments）形式で標準を記述
- 要求レベルは `SHOULD` / `MUST`（RFC 2119）
- フロントマターにドメイン・RFCステータスなどのメタデータ


---

# RFCワークフロー


1. Cloudflare従業員が規定の構造に沿ってRFCを提案（マージリクエスト）
2. 段階的に幅広いレビュアーからフィードバック
3. ドメインオーナーが最終承認 → Codexの一部に
4. Astro製の社内サイトへ公開


---

# approved → enforced の2段階


- **approved（承認済み）**: すぐにクライアント/エージェントが参照可能。違反は**非ブロッキング**の指摘
- **enforced（強制適用）**: 明示的な昇格を経て初めて、MUST違反が**マージをブロック**


<br>


この段階分けにより、チームは新要件を消化する時間を確保できる


---

# なぜCodex全体をそのままLLMに渡さないのか


- RFCはすでに**60件以上**、今も増加中
- コーパス全体を渡すとコンテキストウィンドウに負荷がかかり、結果にも悪影響
- 専用エージェントが `SHOULD`/`MUST` の文を**JSON構造へ自動抽出・圧縮**
- lazy discovery（遅延発見）・progressive disclosure（段階的開示）向けのメタデータを付与


---

# コード例: RFCステートメントのJSON表現

```json {1-4|5-14|15-21|all} {maxHeight:'400px'}
{
  "rfc": 14,
  "title": "Control Plane Services",
  "status": "approved",
  "domain": "control-plane",
  "statements": [
    {
      "slug": "use-quicksilver-for-edge-configuration-propagation",
      "section": ["Proposal", "Infrastructure"],
      "level": "SHOULD",
      "text": "If you need to propagate system or customer configuration to the edge,
        use Quicksilver via the outbox pattern",
      "href": "/rfcs/014-control-plane-services/#infrastructure"
    },
    {
      "slug": "api-schemas-must-be-documented-in-openapi-spec",
      "section": ["Proposal", "API Gateway"],
      "level": "MUST",
      "text": "API request and response schemas MUST be documented using an OpenAPI spec",
      "href": "/rfcs/014-control-plane-services/#api-gateway"
    }
  ]
}
```

---

# コード例 解説


- `rfc`・`title`・`status`・`domain` でRFC全体のライフサイクル状態とドメインを表現
- `statements` 配列の各要素が1つの要求事項に対応
- `level`（SHOULD/MUST）でレビュアーの対応が変わる
- `slug` は**RFC更新後も変わらない安定識別子** → 同じ要求事項を時間をまたいで追跡
- `href` は元RFCの該当セクションへのリンク


---
class: text-center
---

# Codexの利用者

AIコードレビュアー / spec reviewer / incident report reviewer

---

# ① AIコードレビュアー


- マージリクエストをCodex準拠を含む複数観点で評価
- RFCを取得しCodexステートメントを解析（本文全体は必要な場合のみ読み込む）
- approved → 非ブロッキングの推奨事項
- enforced のMUST違反 → 承認保留 or マージブロック


<br>


**約23万件**の違反を検出、うち**約1万6,000件**が承認保留の原因に


---

# コードレビューの代替手段

<div class="grid grid-cols-2 gap-4">
<div>

### カスタムlinter
- 言語固有のCodex要件を機械的に検証
- TypeScriptが最初に対応（oxlint採用）
- Rust対応は開発中、Goも今後対応

</div>
<div>

### ローカルCLI
- CIを介さずローカルでAIコードレビュアーを実行
- CIと同じ（OpenCodeベースの）エージェント群
- 自動判定した差分に対して実行、結果はターミナルに表示

</div>
</div>

<br>


linterはほぼ全開発者向け、CLIは好みに応じた代替手段


---

# ② spec reviewer


- 実装前の設計文書（spec）をCodex要件に照らして評価
- Developer Platform上で動作: Worker + D1 + AI Gateway + Cron Trigger
- specに関連するドメイン・セクションでCodexを絞り込み
- 深刻度別に指摘、完了後はダッシュボードへのリンクをspecに記載


<br>


2026年5月以降 **約600件**のspecをレビュー（再実行含め3,200件超の実行）


---
layout: image-right
image: https://blog.cloudflare.com/_emdash/api/media/file/01KZ4XJH7NG8XCB5KBBM7BMHVW.png
backgroundSize: contain
---

# spec reviewerのUI

深刻度別（major/minor/critical）に
指摘を一覧表示

<footer class="text-xs opacity-50 mt-4">
出典: Cloudflare Blog https://blog.cloudflare.com/engineering-standards-enforcement/
</footer>

---

# 指摘の深刻度分布


- major（重大）: **65%**
- minor（軽微）: **29%**
- critical（致命的）: **6%**


<br>


今後: specへの直接コメント投稿、人間とエージェントの対話の埋め込み、高影響提案への追加レビュー


---

# ③ incident report reviewer


- インシデントレポート（ポストモーテム）の完全性を評価
- 何が起きたか・要因・解決内容・フォローアップが明確かをチェック
- spec reviewerと**同じDeveloper Platform構成要素**を利用


<br>


2026年5月以降 **200件超**のレポートを評価。深刻度の高いインシデントでは**必須ステップ**として組み込み


---
class: text-center
---

# ユースケース

---

# ユースケース①: マージリクエストのCodex準拠チェック


- 過去4か月で約25万件の違反を検出
- 1万6,000件のマージをブロック
- SHOULD/MUSTとRFCステータスに応じて対応を切り替え


---

# ユースケース②: 実装前の技術設計レビュー


- spec reviewerが設計文書を自動発見・評価
- 実装着手前にアーキテクチャ上のミスを検出
- 後工程での手戻りを削減


---

# ユースケース③: インシデントレポートの品質保証


- 要因・解決内容・フォローアップの記載を自動チェック
- 深刻度の高いインシデントでは中央レビューの必須ステップ
- 全指摘への対応完了までレポートを未完了扱い


---

# 今後の展望


- SDLC全体（設計・実装・運用）への拡張
- エージェントが課題を発見するだけでなく**修正案を提案**する自律性を段階的に強化
- エンジニアは引き続き**レビューと承認**に責任を持つ
- Codexをエンジニアリング以外（プロダクト・セキュリティ・コンプライアンス・信頼と安全性）へ拡張


---

# まとめ


- 散らばったガイダンスを**Cloudflare Codex**として一元化・統治
- approved → enforced の2段階で、標準の導入と強制適用を分離
- RFC全文ではなく`SHOULD`/`MUST`文をJSON抽出してLLMのコンテキスト負荷を軽減
- AIコードレビュアー・spec reviewer・incident report reviewerが同じ基盤を共有
- 目標はSDLC全体への拡張と、修正提案までを担うエージェントへの進化


---

<div class="text-center">

# 参考リンク

</div>

- 原文: [How Cloudflare enforces engineering standards using AI](https://blog.cloudflare.com/engineering-standards-enforcement/)
- [Agent Development Lifecycle（ADLC）に関する記事](https://blog.cloudflare.com/ja-jp/agent-development-lifecycle/)

<div class="pt-8 text-sm opacity-50">
Wiki: docs/articles/2026-08-04-engineering-standards-enforcement.md
</div>
