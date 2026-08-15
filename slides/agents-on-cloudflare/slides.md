---
theme: default
title: Cloudflare Agentsの紹介
themeConfig:
  primary: '#f6821f'
info: |
  Cloudflare Blog記事「Cloudflare Agentsの紹介（Introducing: Cloudflare Agents）」の解説スライド。
  原文: https://blog.cloudflare.com/agents-on-cloudflare/
class: text-center
highlighter: shiki
drawings:
  persist: false
transition: slide-left
mdc: true
lineNumbers: true
---

# Cloudflare Agentsの紹介

デプロイしたエージェントを一元管理する統合プラットフォーム

<div class="pt-4 text-sm opacity-70">
原文: https://blog.cloudflare.com/agents-on-cloudflare/<br>
公開日: 2026-08-04
</div>

---

# アジェンダ

<v-clicks>

- 背景: 「HTTP 200でも失敗する」エージェント
- Cloudflare Agentsとは
- 第一弾機能: エージェントトレーシング
- 2つのデバッグ手法（リプレイ／トレース）
- 有効化の手順とOpenTelemetryエクスポート
- 料金
- ユースケース

</v-clicks>

---

# 背景: HTTP 200でも失敗するエージェント

<v-click>

> エージェントはHTTP 200を返しながら、
> それでも失敗することがある

</v-click>

<v-clicks>

- 誤ったツールを選んでしまう
- サブエージェントに古いコンテキストを渡してしまう
- リトライループでトークンを浪費してしまう

</v-clicks>

<br>

<v-click>

従来のインフラ監視（レイテンシ・エラー率）だけでは検知できない

</v-click>

---

# エージェントテレメトリが答えるべき問い

<v-clicks>

- 時間はどこ（モデル・ツール・インフラ）で消費されているか
- ターンは承認待ちで一時停止していないか
- どのモデルが呼ばれ、トークン使用量はどれくらいか
- エージェントは正しいツールを選択できたか
- 外部API呼び出しは成功したか、タイムアウトしたか
- どのサブエージェントが作業を行い、応答にどう影響したか

</v-clicks>

---

# Cloudflare Agentsとは

エージェントのセッションをすべて1つの体験に集約し、
大規模稼働時の重要な情報とインサイトを可視化する

<v-clicks>

- モデルアクセス: **AI Gateway**
- 永続的なランタイム: **Durable Objects**
- オーケストレーション: **Workflows**
- サンドボックス実行環境
- 永続ストレージ: **R2**

</v-clicks>

<br>

<v-click>

いずれも9年かけて構築してきた既存インフラの上に成り立つ

</v-click>

---

# 第一弾機能: エージェントトレーシング

<v-clicks>

- すべての**モデル呼び出し**・**ツール実行**・**トークン消費**を計測
- 単一の統合インターフェースに表示
- OpenTelemetry互換ハーネスに対応: **Think** / **Flue** / **AI SDK**
- 今後さらに多くのフレームワークへ対応拡大予定

</v-clicks>

---

# 既存Workersトレーシングとの統合

<div class="grid grid-cols-2 gap-4">
<div>

### Workersトレーシング（既存）
- fetch呼び出し
- KV読み取り
- D1クエリ

</div>
<div>

### エージェントトレーシング（新規）
- エージェント呼び出し
- モデル呼び出し
- ツール実行・承認イベント
- サブエージェント呼び出し

</div>
</div>

<br>

<v-click>

両者が**同じウォーターフォール**上に並んで表示される

</v-click>

---
layout: image-right
image: https://blog.cloudflare.com/_image?href=https%3A%2F%2Fblog.cloudflare.com%2F_emdash%2Fapi%2Fmedia%2Ffile%2F01KZ4WGY4GARDCD8QBXHMJXZ7W.png&w=715&h=445&f=webp&fit=cover&position=center
---

# ダッシュボード: Agentsビュー

観測されたエージェント・トレース・実行（run）・
セッション・インスタンス・トークン使用量を一覧表示

<footer class="text-xs opacity-50 mt-4">
出典: Cloudflare Blog https://blog.cloudflare.com/agents-on-cloudflare/
</footer>

---

# デバッグ手法①: セッションの再生

<v-clicks>

- Messagesタブ: システム指示・ユーザーメッセージ・モデルの思考・
  ツール呼び出し（引数と結果）・最終応答を表示
- あくまで「記録済みデータの再生」であり、**再実行ではない**
- 不正な形式のツール引数の発見
- ツール選択時のコンテキスト確認
- サブエージェントへの引き継ぎの理解

</v-clicks>

---
layout: image-right
image: https://blog.cloudflare.com/_image?href=https%3A%2F%2Fblog.cloudflare.com%2F_emdash%2Fapi%2Fmedia%2Ffile%2F01KZ4WGY3V7MFS80WYSPV8SFS9.png&w=715&h=462&f=webp&fit=cover&position=center
---

# 例: リスボン旅行プランニング

「2日間のリスボン旅行を計画して」

<v-clicks>

- モデルの推論過程
- `destination_researcher` への2回の呼び出し（1回のリトライを含む）
- 旅程を組み立てる際の思考過程

</v-clicks>

<footer class="text-xs opacity-50 mt-4">
出典: Cloudflare Blog https://blog.cloudflare.com/agents-on-cloudflare/
</footer>

---

# ペイロード記録の制御

<v-clicks>

- Think / Flue / AI SDKでは `storeMessages` / `storeTools` で制御可能
- 個人情報やシークレットなど機微なデータが含まれる場合は記録を無効化できる
- パフォーマンス面（所要時間・トークン数）のトレーシングは継続可能

</v-clicks>

---

# デバッグ手法②: トレースの確認

<v-clicks>

- Tracesタブ: 実行の**ウォーターフォール（滝グラフ）**を表示
- 時間がどこに割り当てられているかを把握
- エージェントの操作とWorkersインフラの結びつきを可視化

</v-clicks>

---
layout: image-right
image: https://blog.cloudflare.com/_image?href=https%3A%2F%2Fblog.cloudflare.com%2F_emdash%2Fapi%2Fmedia%2Ffile%2F01KZ68BX4H0PZP1A0W8T7JD3GW.png&w=715&h=426&f=webp&fit=cover&position=center
---

# トレース例: TravelPlanner → itinerary_builder

<div class="text-sm">

- `invoke_agent TravelPlanner`: 親エージェント、2.72分
- `invoke_agent itinerary_builder`: サブエージェント、1.83分
- `chat @cf/zai-org/glm-4.7-flash`: 各階層のモデル呼び出し
- `execute_tool` / `cloudflare-d1` / `cloudflare-kv`: ツールとインフラの実行

</div>

<footer class="text-xs opacity-50 mt-4">
出典: Cloudflare Blog https://blog.cloudflare.com/agents-on-cloudflare/
</footer>

---

# 有効化の手順①: 設定

```json
{
  "observability": {
    "traces": {
      "enabled": true
    }
  }
}
```

<v-click>

`wrangler.jsonc` にこの設定を追加するだけでWorkersトレーシングが有効化される

</v-click>

---

# 有効化の手順②: フレームワーク別セットアップ

| スタック | 設定方法 |
|---------|---------|
| Think / Flue | トレーシング統合を通じて自動送信 |
| AI SDK | `wrapAISDK()` アダプターでラップ |
| 独自ハーネス | カスタムスパンAPI + OTel Gen AI規約 |

<br>

<v-click>

将来的にはWorkers内で直接OpenTelemetry APIをサポート予定

</v-click>

---

# OpenTelemetryでのエクスポート

<v-clicks>

- トレースはCloudflareに閉じない
- Wranglerの設定でエクスポート先を指定し、任意のOTLP互換プロバイダーへ送信可能
- 構造化されたトレースデータは評価・分析・トークン使用量レポートの基盤になる

</v-clicks>

<br>

<v-click>

「エージェントの品質・パフォーマンス・コストを改善するフィードバックループ」

</v-click>

---
layout: image-right
image: https://blog.cloudflare.com/_image?href=https%3A%2F%2Fblog.cloudflare.com%2F_emdash%2Fapi%2Fmedia%2Ffile%2F01KZ4WGXX79HX11A7GKFY8M06B.png&w=715&h=131&f=webp&fit=cover&position=center
---

# 料金

<v-clicks>

- 現在はベータにつき**無料**
- 2026年10月1日からWorkers Observability料金に統合

</v-clicks>

| プラン | イベント数 | 保持期間 |
|--------|-----------|----------|
| Free | 1日20万件 | 3日間 |
| Paid | 月2,000万件込み+$0.60/百万件 | 7日間 |

<footer class="text-xs opacity-50 mt-4">
出典: Cloudflare Blog https://blog.cloudflare.com/agents-on-cloudflare/
</footer>

---
class: text-center
---

# ユースケース

---

# ユースケース①: マルチエージェントのデバッグ

<v-clicks>

- `TravelPlanner`（親）が `itinerary_builder`（サブ）に処理を委譲する構成
- Messagesタブの応答確認 + Tracesタブの時間分析を組み合わせる
- 「なぜこの旅程になったか」「どこで時間がかかっているか」を特定

</v-clicks>

---

# ユースケース②: ツール選択ミスの検出・機密情報対応

<v-clicks>

- HTTPレベルの監視では検知できない「実質失敗」をトレースで特定
- リトライループによるトークン浪費を可視化
- `storeMessages` / `storeTools` 無効化で機密データを記録せずトレーシング継続
- 既存のOTLP互換の可観測性基盤へエクスポートして分析パイプラインに統合

</v-clicks>

---

# まとめ

<v-clicks>

- Cloudflare Agentsは、既存インフラ（AI Gateway/Durable Objects/Workflows/R2）の上に
  エージェント運用の可視化を積み上げるプラットフォーム
- 第一弾はエージェントトレーシング: モデル・ツール・トークンを1画面で計測
- Messagesタブでのリプレイと、Tracesタブでのウォーターフォール分析の2軸でデバッグ
- Workersトレーシングとシームレスに統合され、`wrangler.jsonc` 1行で有効化可能
- OpenTelemetry標準に沿っており、外部基盤へのエクスポートも可能

</v-clicks>

---

<div class="text-center">

# 参考リンク

</div>

- 原文: [Introducing: Cloudflare Agents](https://blog.cloudflare.com/agents-on-cloudflare/)
- [Agentトレーシング ドキュメント](http://developers.cloudflare.com/agents/runtime/operations/observability/tracing/)
- [Thinkフレームワーク](https://developers.cloudflare.com/agents/harnesses/think/)
- [Flueフレームワーク](https://flueframework.com/docs/ecosystem/deploy/cloudflare/)
- [AI SDK](https://ai-sdk.dev/)
- [エージェント開発ライフサイクル ▶ 解説スライド](../agent-development-lifecycle/)
- [Workersトレーシング（開発者ドキュメント）](https://developers.cloudflare.com/workers/observability/traces/)
- [Workers サンプル（examples/agents-on-cloudflare/）](https://github.com/syumai/cloudflare-blog-summaries/tree/main/examples/agents-on-cloudflare)

<div class="pt-8 text-sm opacity-50">
Wiki: docs/articles/2026-08-04-agents-on-cloudflare.md
</div>
