# Cloudflare Agentsの紹介

- 原文: [https://blog.cloudflare.com/agents-on-cloudflare/](https://blog.cloudflare.com/agents-on-cloudflare/)（日本語版なし）
- 公開日: 2026-08-04
- 関連: [Agents Week 2026 まとめ](./2026-08-13-agents-week-review.md) / [Cloudflareにエージェント開発ライフサイクルの時代が到来](./2026-08-04-agent-development-lifecycle.md) / [ローカルトレースでWorkersをデバッグ](./2026-08-04-local-tracing.md)

![記事ヘッダー画像](https://blog.cloudflare.com/_image?href=https%3A%2F%2Fblog.cloudflare.com%2F_emdash%2Fapi%2Fmedia%2Ffile%2F01KZ4WGXSXP7S27P8VKV4F0D2N.png&w=1999&h=1125&f=webp&fit=cover&position=center)
*図: 記事ヘッダー画像（出典: Cloudflare Blog https://blog.cloudflare.com/agents-on-cloudflare/）*

## TL;DR

- Cloudflareは、デプロイしたエージェントを一元管理するための統合プラットフォーム **Cloudflare Agents** を発表した。AI Gateway（モデルアクセス）・Durable Objects（永続ランタイム）・Workflows（オーケストレーション）・サンドボックス実行・R2（永続ストレージ）という、9年かけて構築してきた既存インフラの上に成り立つ。
- その第一弾機能として、エージェントの挙動を可視化する**エージェントトレーシング**が公開された。すべてのモデル呼び出し・ツール実行・トークン消費を計測し、1つの統合されたインターフェースに表示する。
- Think・Flue・AI SDKといったOpenTelemetry互換のハーネス（エージェントフレームワーク）に対応しており、他フレームワークへの対応も順次拡大予定。
- ダッシュボードでは「セッションの再生（リプレイ）」と「トレースの確認」という2つのデバッグ手法が提供され、既存のWorkersトレーシング（fetch呼び出し・KV読み取り・D1クエリなど）とシームレスに統合される。
- 有効化は `wrangler.jsonc` での `observability.traces.enabled` 設定と、フレームワークごとの統合（Think/Flueの組み込み、AI SDKの `wrapAISDK()`）のみで完了する。ベータ期間中は無料、2026年10月1日からWorkers Observability料金体系に統合される。

## 背景・課題

エージェントは「HTTP 200を返しながら実際には失敗している」ということが起こり得る。誤ったツールを選んでしまう、サブエージェントに古いコンテキストを渡してしまう、リトライループでトークンを浪費してしまう——こうした失敗は、従来のインフラ監視（レイテンシやエラー率）だけでは検知できない。

エージェントのテレメトリが答えるべき問いとして、記事は次のような項目を挙げている。

- 時間がどこ（モデル・ツール・インフラ）で消費されているか
- ターン（やり取りの1単位）が承認待ちで一時停止していないか
- どのモデルが呼び出され、ターンごとのトークン使用量はどれくらいか
- エージェントが正しいツールを選択できたか
- 外部API呼び出しが成功したか、あるいはタイムアウトしたか
- どのサブエージェントが作業を行い、それが最終的な応答にどう影響したか

こうした「エージェント固有の失敗モード」を可視化する仕組みが不足していることが、Cloudflare Agents（とりわけエージェントトレーシング機能）を発表する背景となっている。

## 発表内容 / アーキテクチャ

### 統合プラットフォームとしてのCloudflare Agents

Cloudflare Agentsは、デプロイしたエージェントのセッションをすべて1つの体験に集約し、エージェントが大規模に稼働する際の重要な情報とインサイトを可視化することを目指すプラットフォームである。既存インフラの再利用という点が特徴的で、モデルアクセスはAI Gateway、永続的なランタイムはDurable Objects、オーケストレーションはWorkflows、サンドボックス実行環境、永続ストレージはR2という、Cloudflareがこれまで構築してきた基盤の上に位置づけられている。将来的には「エージェントをデプロイ・観測・継続的に改善するための単一の場所」を目指すとされている。

### 第一弾: エージェントトレーシング

最初にリリースされたのがエージェントトレーシングである。すべてのモデル呼び出し・ツール実行・トークン消費を計測し、単一のインターフェースに表示する。OpenTelemetry互換のハーネスとして、Think・Flue・AI SDKに対応しており、今後さらに多くのフレームワークへの対応が予定されている。

### 既存のWorkersトレーシングとの統合

Workersトレーシングはすでに、fetch呼び出し・KVの読み取り・D1クエリといったインフラレベルの動作を計測している。エージェントトレーシングはこれに加えて、エージェントの呼び出し・モデル呼び出し・ツール実行・承認イベント・サブエージェント呼び出しといったスパンをWorkersのデータと並べて表示する。メタデータにはモデル名やトークン使用量の情報も含まれる。

### ダッシュボード: エージェント専用ビュー

Cloudflareダッシュボードには専用の「Agents」ビューが用意され、観測されたエージェント・トレース・実行（run）・セッション・インスタンス・トークン使用量が一覧できる。

![ダッシュボードのAgentsビュー](https://blog.cloudflare.com/_image?href=https%3A%2F%2Fblog.cloudflare.com%2F_emdash%2Fapi%2Fmedia%2Ffile%2F01KZ4WGY4GARDCD8QBXHMJXZ7W.png&w=715&h=445&f=webp&fit=cover&position=center)
*図: ダッシュボードのAgentsビュー（出典: Cloudflare Blog https://blog.cloudflare.com/agents-on-cloudflare/）*

### デバッグ手法①: セッションの再生（リプレイ）

Messagesタブでは、システム指示・ユーザーメッセージ・モデルの思考過程・引数と結果を含むツール呼び出し・最終応答という会話の全コンテキストが表示される。これは「記録済みデータの再生であり、エージェントの再実行ではない」という点が明記されている。

不正な形式のツール引数を発見したり、ツール選択時にどのようなコンテキストが利用可能だったかを確認したり、サブエージェントへの引き継ぎを理解したり、前のターンが後のターンの結果にどう影響したかを特定したりする用途に使える。

記事で示されている例では、ユーザーが「リスボンへの2日間の旅行を計画して」と依頼したケースで、モデルの推論過程、`destination_researcher` への2回の呼び出し（1回のリトライを含む）、ツールの結果、旅程を組み立てる際の思考過程が表示される様子が紹介されている。

![Messagesタブ（セッション再生）](https://blog.cloudflare.com/_image?href=https%3A%2F%2Fblog.cloudflare.com%2F_emdash%2Fapi%2Fmedia%2Ffile%2F01KZ4WGY3V7MFS80WYSPV8SFS9.png&w=715&h=462&f=webp&fit=cover&position=center)
*図: Messagesタブでのセッション再生画面（出典: Cloudflare Blog https://blog.cloudflare.com/agents-on-cloudflare/）*

なお、Think・Flue・AI SDKでは `storeMessages` と `storeTools` という設定によって、メッセージやツールのペイロードを記録するかどうかを制御できる。個人情報やシークレットなど機微なデータが含まれる場合は、ペイロードの記録自体を無効化できる。

### デバッグ手法②: トレースの確認

Tracesタブでは実行のウォーターフォール（滝グラフ）が表示され、時間がどこに割り当てられているか、エージェントの操作がWorkersのインフラとどう結びついているかを把握できる。

記事で紹介されている詳細な例では、`Travel_Planner` というエージェントが `itinerary_builder` というサブエージェントに処理を委譲し、そのサブエージェントがモデルを呼び出し、ツールを実行し、D1にアクセスし、KVに書き込む——という一連の流れが、1つのウォーターフォールとして可視化される。

- `invoke_agent TravelPlanner`: 親エージェントの呼び出し。合計2.72分。エージェントクラス・会話・Durable Objectの識別子を含み、トレース間の相関付けに使える。
- `invoke_agent itinerary_builder`: 親の下にネストされたサブエージェントの呼び出し。1.83分。
- `chat @cf/zai-org/glm-4.7-flash`: 各階層でのモデル呼び出し。所要時間とプロバイダー側のトークン使用量を含む。最初の呼び出し（17.59秒）は親のルーティング判断で、その下でサブエージェントがさらに呼び出しを行っている。
- `execute_tool record_itinerary_builder_execution`: ツール実行、104ミリ秒。
- `cloudflare-d1 run d1_run`: そのツールから発生したD1クエリ、同じく104ミリ秒。
- `execute_tool record_respond_ready`: ツール実行、232ミリ秒。
- `cloudflare-kv put kv_put`: 後続のツールから発生したKV書き込み、232ミリ秒。

Workersトレーシングは、KV・D1・Durable Object・サービスバインディング・fetch呼び出しといったバインディングを計測しているため、ツールが利用したCloudflareインフラは、それを呼び出したエージェントの操作の下に自動的に表示される。子の処理がアクティブなトレースコンテキスト内で実行される場合、サブエージェント呼び出しは親の下にネストされる。

![トレースのウォーターフォール表示](https://blog.cloudflare.com/_image?href=https%3A%2F%2Fblog.cloudflare.com%2F_emdash%2Fapi%2Fmedia%2Ffile%2F01KZ68BX4H0PZP1A0W8T7JD3GW.png&w=715&h=426&f=webp&fit=cover&position=center)
*図: `Travel_Planner` エージェントの委譲構造を示すトレースのウォーターフォール（出典: Cloudflare Blog https://blog.cloudflare.com/agents-on-cloudflare/）*

### 有効化の手順

**ステップ1: 設定を有効化**

`wrangler.jsonc` でトレーシングを有効にする。

```json
{
  "observability": {
    "traces": {
      "enabled": true
    }
  }
}
```

**ステップ2: フレームワークごとのセットアップ**

| スタック | エージェントトレーシングの設定方法 |
|---------|-----------------------------------|
| Think / Flue | トレーシング統合を通じて、エージェント・会話・ターン・モデル・ツールのテレメトリを自動送信 |
| AI SDK | Cloudflareの `wrapAISDK()` アダプターでSDKをラップ |
| 独自ハーネス | カスタムスパンAPIを利用し、OpenTelemetryのGenerative AIセマンティック規約に従う |

将来的には、Workers内で直接OpenTelemetry APIをサポートすることが計画されている。OpenTelemetryのGenerative AIセマンティック規約に沿ったスパンを発行するフレームワークであれば、Cloudflare固有のアダプターを待たずに可視化できるようになる。標準のエージェント・会話識別子を持つスパンであれば、組み込み統合と同様にAgentsビューがエージェントやセッションへグルーピングできる。

### OpenTelemetryでのエクスポート

エージェントのテレメトリはCloudflareに閉じたものではなく、Wranglerの設定でエクスポート先を指定することで、任意のOTLP互換プロバイダーへトレースをエクスポートできる。構造化されたトレースデータは、評価・分析・トークン使用量レポートの基盤となり、「エージェントの品質・パフォーマンス・コストを改善するためのフィードバックループ」として機能する。

### 料金

現在、トレーシング機能はベータ期間中につき無料で利用できる。2026年10月1日からは、既存のWorkers Observability料金体系に組み込まれる。

| プラン | イベント数 | 保持期間 |
|--------|-----------|----------|
| Workers Free | 1日あたり20万件 | 3日間 |
| Workers Paid | 月間2,000万件込み。追加100万件あたり0.60ドル | 7日間 |

注意点として、Agentsビューに表示されるスパンだけでなく、すべてのスパンが可観測性イベントとしてカウントされる。Worker全体のトレースには、SDK内部やWorkerレベルのその他の操作からの追加スパンが含まれる場合がある。

![料金・トレース詳細画面へのリンク](https://blog.cloudflare.com/_image?href=https%3A%2F%2Fblog.cloudflare.com%2F_emdash%2Fapi%2Fmedia%2Ffile%2F01KZ4WGXX79HX11A7GKFY8M06B.png&w=715&h=131&f=webp&fit=cover&position=center)
*図: Observabilityダッシュボードで全トレースを表示するリンク（出典: Cloudflare Blog https://blog.cloudflare.com/agents-on-cloudflare/）*

## コード例

記事には完結したコードブロックは掲載されていないが、有効化に必要な設定は次の通り示されている。

```json
{
  "observability": {
    "traces": {
      "enabled": true
    }
  }
}
```

**解説**: `wrangler.jsonc`（またはそれに準ずる設定ファイル）の `observability.traces.enabled` を `true` にするだけで、Workerの実行に対してOpenTelemetry互換のトレース計測が有効になる。この設定はWorkersトレーシング全般の有効化であり、その上にThink/Flue/AI SDKなど各フレームワークの統合を追加することでエージェント固有のスパン（モデル呼び出し・ツール実行など）が加わる、という2段階構成になっている点がポイントである。

## ユースケース

### 旅行プランニングエージェントのデバッグ

記事全体を通して例示されている「2日間のリスボン旅行プランを立てる」エージェントは、`TravelPlanner`（親エージェント）が `itinerary_builder`（サブエージェント）に処理を委譲する典型的なマルチエージェント構成である。Messagesタブでの応答内容の確認とTracesタブでの時間分析を組み合わせることで、「なぜこの旅程になったか」「どこで時間がかかっているか」を突き止められる。

### ツール選択ミスの検出

エージェントが誤ったツールを選んでしまうケースや、リトライループでトークンを浪費してしまうケースは、HTTPレベルの監視では検知できない。トレースのウォーターフォールとMessagesタブのリプレイを併用することで、こうした「HTTP 200だが実質失敗」のケースを事後的に特定できる。

### 機密情報を含むエージェントの運用

`storeMessages` / `storeTools` を無効化することで、個人情報やシークレットを含むやり取りをトレースに残さずに、パフォーマンス面のトレーシング（所要時間・トークン数など）だけを継続できる。

### 外部OTLP基盤との統合

すでに社内でOpenTelemetryベースの可観測性基盤を運用している組織であれば、Cloudflareのダッシュボードに閉じずに、既存のOTLP互換プロバイダーへエージェントのトレースをエクスポートし、既存の分析・評価パイプラインに統合できる。

## 所感・ポイント

- 「HTTP 200を返しながら実際には失敗している」というエージェント特有の障害モードの言語化は的確で、従来のAPMやインフラ監視だけでは不十分である理由を端的に示している。
- Workersトレーシング（インフラレベル）とエージェントトレーシング（モデル・ツール・サブエージェントレベル）を1つのウォーターフォールに統合できる点は、`@cloudflare/computer` や `@cloudflare/ci` など他のAgents Week発表と同様、「既存のCloudflareインフラの上にエージェント向け機能を積み上げる」という一貫した設計思想を感じさせる。
- `storeMessages` / `storeTools` によるペイロード記録のON/OFF制御は、エージェントの可観測性と個人情報・機密情報保護の両立という、実運用で必ず直面する課題に対する現実的な回答になっている。
- 現時点ではThink・Flue・AI SDKへの対応にとどまるが、OpenTelemetryのGenerative AIセマンティック規約に準拠するアプローチを取っているため、将来的に対応フレームワークが広がってもダッシュボード側の仕組みを大きく変えずに済む設計になっている点は評価できる。

> **Workers サンプル**: [examples/agents-on-cloudflare/](../../examples/agents-on-cloudflare/) — `observability.traces.enabled` を有効化し、Workers AI 呼び出しをトレース対象にする最小 Worker

## 関連リンク

- [AI Gateway（開発者ドキュメント）](https://developers.cloudflare.com/ai-gateway/)
- [Durable Objects（開発者ドキュメント）](https://developers.cloudflare.com/durable-objects/)
- [Workflows（開発者ドキュメント）](https://developers.cloudflare.com/workflows/)
- [サンドボックス実行（開発者ドキュメント）](https://developers.cloudflare.com/sandbox/)
- [R2（開発者ドキュメント）](https://developers.cloudflare.com/r2/)
- [Agentトレーシング ドキュメント](http://developers.cloudflare.com/agents/runtime/operations/observability/tracing/)
- [Thinkフレームワーク](https://developers.cloudflare.com/agents/harnesses/think/)
- [Flueフレームワーク](https://flueframework.com/docs/ecosystem/deploy/cloudflare/)
- [AI SDK](https://ai-sdk.dev/)
- [エージェント開発ライフサイクル（本リポジトリのWiki）](./2026-08-04-agent-development-lifecycle.md)
- [Workersトレーシング（開発者ドキュメント）](https://developers.cloudflare.com/workers/observability/traces/)
- [OpenTelemetry互換エクスポート先の設定](https://developers.cloudflare.com/workers/observability/exporting-opentelemetry-data/)
- [OpenTelemetry Generative AIセマンティック規約](https://opentelemetry.io/docs/specs/semconv/registry/attributes/gen-ai/)
- [カスタムスパンAPI](https://developers.cloudflare.com/workers/observability/traces/custom-spans/)
- [Agentsダッシュボード](https://dash.cloudflare.com/?to=/:account/agents)
