# Billable Usage APIを提供開始：Cloudflareの課金情報をプログラムから取得可能に

- 原文: [https://blog.cloudflare.com/ja-jp/billable-usage-api/](https://blog.cloudflare.com/ja-jp/billable-usage-api/)（英語版: [https://blog.cloudflare.com/billable-usage-api/](https://blog.cloudflare.com/billable-usage-api/)）
- 公開日: 2026-08-03
- 関連: [Agents Week 2026 まとめ](./2026-08-10-agents-week-review.md)（月曜日「実行環境とインフラ」のテーマに分類）
- GitHub: [docs/articles/2026-08-03-billable-usage-api.md](https://github.com/syumai/cloudflare-blog-summaries/blob/main/docs/articles/2026-08-03-billable-usage-api.md)

![ヘッダー画像](https://blog.cloudflare.com/_emdash/api/media/file/01KZ1WZB6KJGKY7A4HBARJW87R.png)
*図: 記事ヘッダー画像（出典: Cloudflare Blog https://blog.cloudflare.com/ja-jp/billable-usage-api/）*

## TL;DR

- Cloudflare が **Billable Usage API** を公開した。単一のエンドポイントから、Cloudflareの従量課金型サービスすべての課金情報・利用状況をプログラムで取得できる。
- レスポンスの多くの項目名は、業界標準である **FinOps Open Cost and Usage Specification（FOCUS）** の列名に対応しており、他のクラウドの利用データと同じ語彙で扱える。
- コスト管理プラットフォーム **Vantage** とのネイティブ連携も同時に発表され、Cloudflareの利用データを他のクラウド環境の支出と同じダッシュボード・アラート・FinOpsエージェントで管理できるようになった。
- 開発の動機は、AIエージェントがコード作成やWorkersのデプロイ、インフラ構築を自動化する時代において、コスト把握もダッシュボード（人間向けUI）ではなくプログラムから行える必要があるという課題意識。
- 初回リリースはセルフサービスアカウント向け。Enterprise契約への対応、より細かい時間粒度でのデータ提供、コスト予測機能が今後のロードマップに含まれる。

## 背景・課題

Agents Week 2026 の取り組み全体を貫く問題意識として、AIエージェントがコード作成だけでなく、Workersのデプロイ、R2バケットの作成、D1データベースの管理など、Cloudflareアカウントに対する幅広い操作を自動化する時代が到来している、という前提がある。エージェントにアカウントへのプログラムによるアクセスを許可するのであれば、それによって発生しているコストも同じようにプログラムから確認できる必要がある——これが本記事の出発点である。

しかし、従来のダッシュボードは人間が目視で確認することを前提としたUIであり、自動化システムやスクリプトから利用するのには適していない。月末にまとめて確認するのではなく、**1日単位・製品単位で、他のプログラムが読み取れる形式**でコストを把握したい、というニーズが顧客から寄せられていた。財務チームは利用料金を自社の会計システムに取り込み、社内プロジェクトやチーム、エンドユーザー単位でコストを配分したいと考えており、開発者はスクリプトに組み込めるシンプルな `curl` コマンドを求めていた。これまではスクリーンショットの取得や手動でのデータエクスポートに頼らざるを得なかった。

## 発表内容 / アーキテクチャ

### レスポンスに含まれるデータ

Billable Usage API のレスポンスには、以下の情報が製品ごと・課金期間ごとに1行として含まれる。

- **ServiceName / ServiceFamilyName**: 製品情報（例: Workers Standard や R2 Storage）
- **ChargePeriodStart / ChargePeriodEnd**: そのレコードが対象とする期間
- **PricingQuantity / ConsumedUnit**: 利用量と単位（GB・月、GB秒、リクエスト数など）
- **ContractedCost**: 該当課金期間中の利用料金
- **CumulatedPricingQuantity / CumulatedContractedCost**: 請求期間全体での累計値
- **ZoneId / ZoneName**: 利用状況が特定のゾーンに紐づく場合の識別子

### FOCUS 対応状況

多くの項目名は「**FinOps Open Cost and Usage Specification（FOCUS）**」の列名に意図的に対応させてある。AWS・Azure・Google Cloud・Oracleをはじめ多くのSaaSプロバイダーはすでにFOCUS形式のデータエクスポートを提供しており、主要なコスト管理ツールもFOCUSに対応済みである。他のクラウドサービスからFOCUS形式のデータをすでに取り込んでいる場合、Cloudflareの項目名と意味をそのまま理解できる、というのが狙いである。

| Cloudflareのフィールド | FOCUSとの対応 |
|---|---|
| BillingCurrency | 完全一致 |
| BillingPeriodStart | 完全一致 |
| ChargePeriodStart / ChargePeriodEnd | 完全一致 |
| ServiceName | 完全一致 |
| ConsumedQuantity / ConsumedUnit | 完全一致 |
| PricingQuantity | 完全一致 |
| ContractedCost | 完全一致 |
| ServiceFamilyName | Cloudflare独自の分類（FOCUSでは標準化された用語体系を使用） |
| CumulatedContractedCost | 利便性のためのフィールド（FOCUSでは累計値はクエリ側で計算する前提） |
| ZoneId / ZoneName | 該当する場合のゾーン単位の識別子 |

ただし現時点で完全準拠を謳っているわけではない。FOCUS仕様で必須とされる一部の項目が、現在のレスポンスにはまだ含まれていないためであり、今後のロードマップで対応が予定されている。

### Vantageとのパートナーシップ

Cloudflareは、インフラコスト管理プラットフォーム **Vantage** とのネイティブ連携を発表した。VantageはBilling Read権限を持つ読み取り専用APIトークンを使ってCloudflareに接続し、毎日Billable Usageデータを取得して、製品（Workers、R2など）・ゾーン・アカウント単位に分類する。これにより、Cloudflareの利用データを、他のインフラ環境ですでに使っているCost Reports・Budgets・Cost Alertsと同じ画面・仕組みで扱えるようになる。

Vantage連携で可能になる主なワークフローは次の3つ。

1. **クラウドサービスをまたいだコスト配分**: Cloudflareの利用料金を製品・ゾーン・アカウント単位で分類し、Virtual Tagsを使ってAWSやAzureなど他プロバイダーのコストと同じレポート上で、チームや製品ライン単位にコストを割り当てられる。
2. **異常検出**: Vantage Cost Alertsが接続済みの全プロバイダーの利用料金を監視し、通常パターンから大きく変化した場合にSlackやメールで通知する。WorkersやR2の利用料金の急増も、他のクラウドプロバイダーと同じ方法で検出できる。
3. **FinOpsエージェントとMCP**: Vantageコンソール内のFinOpsエージェントに質問できるほか、ホスト型MCPサーバーを通じてClaudeやChatGPTからも同じデータを問い合わせられる。Cloudflareの利用料金は他の接続済みプロバイダーと同様に扱われる。

FOCUS標準化されたAPIは、Vantage以外のその他のFinOpsツールとも連携できる設計になっている。

## コード例

### 例1: 基本的なリクエスト

```bash
curl https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/billable-usage \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN"
```

**解説**: Billing Read 権限を持つ API トークンを `Authorization: Bearer` ヘッダーに指定して呼び出すだけで、現在の請求期間における利用状況を製品ごとの内訳で取得できる。エンドポイントは他のCloudflare API群と同じ形式（`/accounts/$ACCOUNT_ID/...`）に従っている。

### 例2: 日付範囲を指定したリクエスト

```bash
curl "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/billable-usage?from=2026-02-01&to=2026-02-15" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN"
```

**解説**: クエリパラメータ `from` / `to` で任意の期間を指定して取得できる。月末を待たずに日次でコストを追跡したいというニーズに応える形になっている。

### 例3: レスポンスの例（コード読解）

```json
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

**解説**: レスポンスは他のCloudflare APIと同様、`result` 配列の中に製品・課金期間ごとの行が並ぶ標準形式である。この例では `ServiceName: "Workers Standard"` について、2025年2月の課金期間で `ConsumedQuantity: 150000`（`GB-months`単位）の利用があり、`ContractedCost: 0.75`（この期間の料金）に対し、`CumulatedContractedCost: 2.25`（請求期間全体の累計）となっていることが読み取れる。`CumulatedContractedCost` は請求期間の途中経過を追跡する際に便利なフィールドである。

## ユースケース

### 財務チームによるコストの自社システムへの取り込み

財務チームが `curl` や定期実行スクリプトでBillable Usage APIを叩き、取得した利用料金データを自社の会計・コスト配分システムに取り込み、プロジェクト・チーム・エンドユーザー単位でコストを割り当てる。

### 開発者によるスクリプトへの組み込み

CI/CDパイプラインや監視スクリプトの一部として、日次でコストを取得し、あらかじめ定めた閾値を超えた場合にアラートを出すといった仕組みを、シンプルな `curl` コマンド1つから構築できる。

### Vantageによるクロスクラウドのコスト管理

すでにAWSやAzureなど他クラウドのコストをVantageで管理している組織であれば、Cloudflareアカウントを接続するだけで、同じCost Reports・Budgets・Cost Alerts・異常検出の仕組みにCloudflareの利用料金も統合できる。

### FinOpsエージェント／MCP経由でのコスト問い合わせ

Vantageコンソール内のFinOpsエージェントや、MCPサーバーを通じたClaude・ChatGPTなどのAIアシスタントから、自然言語で「先月のWorkersのコストはいくらか」といった問い合わせを行い、Cloudflareの利用料金を他のクラウドと横断的に確認する。

## 所感・ポイント

- 「ダッシュボードは人間向け、APIは自動化システム向け」という単純だが本質的な整理から出発し、Billing情報という比較的地味な領域までプログラマブルにした点は、Agents Week全体を貫く「エージェントにアカウント操作を任せるなら、そのコストも同じように機械可読にする」という思想と一貫している。
- 独自のスキーマを新規に定義するのではなく、既にAWS・Azure・GCPなどが対応しているFOCUS仕様に項目名を合わせにいったのは、実務上の学習コストを大きく下げる現実的な判断といえる。
- 「完全準拠ではない」ことを正直に明記しつつロードマップに位置づけている点、初回リリースをセルフサービスアカウントに絞りEnterprise対応を段階的に進める姿勢からは、機能を大きく見せずに着実に展開していく方針がうかがえる。

> **Workers サンプル**: [examples/billable-usage-api/](../../examples/billable-usage-api/) — Billable Usage API を呼び出し、サービスごとのコスト集計と閾値超過アラート（Cronトリガー）を体験できる最小 Worker

## 関連リンク

- [FinOps Open Cost and Usage Specification（FOCUS）](https://focus.finops.org/)
- [Vantage コンソール](https://console.vantage.sh/)
- [Cloudflare ダッシュボード](https://dash.cloudflare.com)
- [Cloudflare Enterprise 営業担当者への問い合わせ](https://www.cloudflare.com/ja-jp/plans/enterprise/contact/)
- [Cloudflareでアプリを構築する（サインアップ）](https://dash.cloudflare.com/sign-up)
