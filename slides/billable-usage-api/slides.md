---
routerMode: hash
theme: default
themeConfig:
  primary: '#f6821f'
title: Billable Usage APIを提供開始
info: |
  Cloudflare Blog記事「Billable Usage APIを提供開始：Cloudflareの課金情報をプログラムから取得可能に」の解説スライド。
  原文: https://blog.cloudflare.com/ja-jp/billable-usage-api/
class: text-center
highlighter: shiki
drawings:
  persist: false
transition: slide-left
mdc: true
lineNumbers: true
---

# Billable Usage APIを提供開始

Cloudflareの課金情報をプログラムから取得可能に

<div class="pt-4 text-sm opacity-70">
原文: https://blog.cloudflare.com/ja-jp/billable-usage-api/<br>
公開日: 2026-08-06
</div>

---

# TL;DR

- Cloudflareが**Billable Usage API**を公開。単一エンドポイントから全従量課金サービスの課金・利用状況をプログラムで取得可能に
- レスポンス項目の多くが業界標準**FOCUS**仕様に対応し、他クラウドと同じ語彙で扱える
- コスト管理プラットフォーム**Vantage**とのネイティブ連携も同時発表
- 開発動機は、AIエージェントがインフラ構築を自動化する時代に、コスト把握もプログラムから行える必要があるという課題意識
- 初回リリースはセルフサービスアカウント向け。Enterprise対応や予測機能は今後のロードマップ

---

# アジェンダ


- 背景: エージェント時代のコスト可視化という課題
- 発表内容: Billable Usage API
- FOCUS仕様への対応
- Vantageとのパートナーシップ
- コード例
- ユースケース
- 今後の展開


---

# 背景: なぜプログラムからコストを取得したいのか


- AIエージェントがコード作成・Workersのデプロイ・インフラ構築を自動化する時代が到来
- アカウントへのプログラムによる操作を許すなら、そのコストも**プログラムから確認**できる必要がある
- ダッシュボードは**人間向け**。自動化システムには不向き



> 月末ではなく、1日の中で、製品ごとに、
> 別のプログラムが利用できる形式で把握することが重要


---

# 求められていたニーズ


- 財務チーム: 利用料金を自社システムに取り込み、プロジェクト・チーム単位でコスト配分したい
- 開発者: スクリプトに組み込めるシンプルな `curl` コマンドが欲しい
- これまでは: スクリーンショット取得・手動データエクスポートに頼るしかなかった


---

# Billable Usage API とは

単一エンドポイントから、全従量課金型Cloudflare製品の
コスト・利用状況をプログラムで取得できるAPI


- 製品ごと・課金期間ごとに1レコード
- 日単位に近い粒度でコストを追跡可能
- セルフサービスアカウント向けに本日より提供開始


---

# レスポンスに含まれる主なフィールド


- **ServiceName / ServiceFamilyName**: 製品情報（例: Workers Standard、R2 Storage）
- **ChargePeriodStart / ChargePeriodEnd**: レコードの対象期間
- **PricingQuantity / ConsumedUnit**: 利用量と単位
- **ContractedCost**: 課金期間中の利用料金
- **CumulatedPricingQuantity / CumulatedContractedCost**: 請求期間中の累計
- **ZoneId / ZoneName**: 特定ゾーンに紐づく場合の識別子


---

# FOCUS仕様への対応


**FinOps Open Cost and Usage Specification（FOCUS）** の列名に
多くの項目名を意図的に対応させている


<div class="pt-4">

| Cloudflareのフィールド | FOCUSとの対応 |
|---|---|
| BillingCurrency / ChargePeriodStart 等 | 完全一致 |
| ServiceName / ConsumedQuantity 等 | 完全一致 |
| ServiceFamilyName | Cloudflare独自分類 |
| CumulatedContractedCost | 利便性フィールド |

</div>


AWS・Azure・GCP等のFOCUS対応データと**同じ語彙**で扱える
（※現時点では完全準拠ではなく、今後のロードマップで対応予定）


---

# Vantageとのパートナーシップ


- インフラコスト管理プラットフォーム **Vantage** とネイティブ連携
- Billing Read権限の読み取り専用トークンで毎日データを取得
- 製品・ゾーン・アカウント単位で自動分類
- 他のクラウド（AWS/Azure等）と**同じ画面・仕組み**でCloudflareのコストを管理


---

# Vantage連携でできる3つのワークフロー


1. **クラウド横断のコスト配分**: Virtual Tagsでチーム・製品ライン単位に割り当て
2. **異常検出**: 通常パターンからの変化をSlack/メールで通知
3. **FinOpsエージェント/MCP**: Vantageコンソール、あるいはClaude/ChatGPT経由でも同じデータに自然言語で問い合わせ


---
class: text-center
---

# コード例

---

# コード例① 基本的なリクエスト

```bash
curl https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/billable-usage \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN"
```


Billing Read 権限のAPIトークンを指定するだけで、
現在の請求期間の利用状況を製品ごとの内訳で取得できる


---

# コード例② 日付範囲を指定したリクエスト

```bash
curl "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/billable-usage?from=2026-02-01&to=2026-02-15" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN"
```


クエリパラメータ `from` / `to` で任意の期間を指定可能。
月末を待たず日次でコストを追跡できる


---

# コード例③ レスポンス例（コード読解）

```json {1-2|4-14|all} {maxHeight:'380px'}
{
  "result": [
    {
      "BillingCurrency": "USD",
      "BillingPeriodStart": "2025-02-01T00:00:00Z",
      "ChargePeriodStart": "2025-02-01T00:00:00Z",
      "ChargePeriodEnd": "2025-02-28T23:59:59Z",
      "ServiceName": "Workers Standard",
      "ServiceFamilyName": "Workers",
      "ConsumedQuantity": 150000,
      "ConsumedUnit": "GB-months",
      "ContractedCost": 0.75,
      "CumulatedContractedCost": 2.25
    }
  ],
  "success": true,
  "errors": [],
  "messages": []
}
```

---

# コード例③ 解説


- `result` 配列の中に製品・課金期間ごとの行が並ぶ、標準的なCloudflare APIレスポンス形式
- `ServiceName: "Workers Standard"` について 2025年2月の課金期間の利用量・料金を表現
- `ConsumedQuantity: 150000`（`GB-months`）に対し `ContractedCost: 0.75`
- `CumulatedContractedCost: 2.25` は請求期間全体の累計 — 途中経過の追跡に便利


---
class: text-center
---

# ユースケース

---

# ユースケース①: 財務チームのコスト取り込み


- 定期実行スクリプトでAPIを叩き、自社の会計・コスト配分システムに取り込む
- プロジェクト・チーム・エンドユーザー単位でコストを割り当てる


---

# ユースケース②: 開発者によるスクリプト組み込み・アラート


- CI/CDや監視スクリプトの一部として日次でコストを取得
- 閾値超過時にアラートを出す仕組みを `curl` 1つから構築


---

# ユースケース③: Vantageによるクロスクラウド管理


- AWS/Azure等のコストをすでにVantageで管理している場合、Cloudflareを接続するだけで統合
- 同じCost Reports・Budgets・Cost Alertsの仕組みにそのまま乗る


---

# ユースケース④: FinOpsエージェント/MCP経由の問い合わせ


- 「先月のWorkersのコストはいくらか」を自然言語でVantageのFinOpsエージェントに質問
- MCPサーバー経由でClaudeやChatGPTからも同じデータに問い合わせ可能


---

# 今後の展開


- **より細かい時間単位**での利用状況提供（日次を超えたリアルタイムに近い粒度）
- **コスト予測機能**: `CumulatedContractedCost` を活用した最終コスト予測。アカウント単位・製品単位の両方を検討
- **Enterprise契約への対応**: 初回リリースはセルフサービスアカウントのみ。Enterprise向けも開発中


---

# まとめ


- Cloudflareの全従量課金製品のコストを、単一エンドポイントからプログラムで取得可能に
- FOCUS仕様準拠の項目名により、他クラウドのコストデータと同じ語彙で扱える
- Vantageとのネイティブ連携で、クロスクラウドのコスト管理・異常検出・FinOpsエージェント対応が可能
- 「アカウント操作をエージェントに任せるなら、コストも機械可読に」という思想の実装


---

<div class="text-center">

# 参考リンク

</div>

- 原文: [Billable Usage APIを提供開始](https://blog.cloudflare.com/ja-jp/billable-usage-api/)
- 英語版: [Introducing the Billable Usage API](https://blog.cloudflare.com/billable-usage-api/)
- [FinOps Open Cost and Usage Specification（FOCUS）](https://focus.finops.org/)
- [Vantage コンソール](https://console.vantage.sh/)
- [Cloudflare ダッシュボード](https://dash.cloudflare.com)
- [Workers サンプル](https://github.com/syumai/cloudflare-blog-summaries/tree/main/examples/billable-usage-api)

<div class="pt-8 text-sm opacity-50">
Wiki: docs/articles/2026-08-03-billable-usage-api.md
</div>
