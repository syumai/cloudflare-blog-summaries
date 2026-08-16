# Workers AIとAI Gatewayを単一のAIコントロールプレーンへ統合

- 原文: [https://blog.cloudflare.com/workers-ai-gateway-unification/](https://blog.cloudflare.com/workers-ai-gateway-unification/)（日本語版なし）
- 公開日: 2026-08-07
- GitHub: [docs/articles/2026-08-07-workers-ai-gateway-unification.md](https://github.com/syumai/cloudflare-blog-summaries/blob/main/docs/articles/2026-08-07-workers-ai-gateway-unification.md)

![記事ヘッダー画像](https://blog.cloudflare.com/_emdash/api/media/file/01KZA5VCX2R70YMT8M56D89B37.png)
*図: 統合されたAIコントロールプレーンのイメージ（出典: Cloudflare Blog https://blog.cloudflare.com/ja-jp/workers-ai-gateway-unification/）*

## TL;DR

- Cloudflareは、これまで別プロダクトだった **AI Gateway**（任意のモデルプロバイダーへのプロキシ・可観測性レイヤー）と **Workers AI**（Cloudflare自身がホストするマネージドGPU推論）を、単一の「AIコントロールプレーン」へ統合する。
- WorkersバインディングとREST APIの両方が同じ経路を通るようになり、ゲートウェイIDに `default` を指定するだけで、事前にゲートウェイを作成しなくても自動的にロギング・可観測性が有効になる。
- AI Gatewayのクレジット（ウォレット課金）がWorkers AIにも使えるようになり、統合請求を使うとWorkers AIモデルのレート制限が緩和される。
- 近い将来、プロバイダーではなくモデル名を指定するだけで自動的にフェイルオーバー・負荷分散される「モデルファーストルーティング」と、プロンプト内容から最適なモデルを自動選択する「スマートルーティング」が投入される予定（現在は内部パイロット段階）。

## 背景・課題

これまでAI GatewayとWorkers AIは、それぞれ独立したセットアップと運用フローを持つ別々のプロダクトだった。AI Gatewayは、OpenAIやAnthropicなど任意のモデルプロバイダーへのリクエストを中継し、ログ収集やキャッシュ、トラフィック制御などを提供する「プロキシ層」である。一方Workers AIは、Cloudflare自身のGPUインフラ上でモデルをホストする「マネージド推論サービス」であり、両者はバインディングもAPIエンドポイントも別で、連携するには開発者側で明示的にAI Gatewayを作成し、Workers AI呼び出しに紐づける必要があった。

この分断は具体的に2つの問題を生んでいた。1つは可観測性の断絶で、Workers AIを単体で使っている限り、リクエストのログやトークン使用量、コストの内訳を確認する仕組みが標準では用意されておらず、それを得るには追加のセットアップ作業が必要だった。もう1つは課金・信頼性の面で、AI Gatewayのクレジット（ウォレット課金）は外部プロバイダー向けの機能に限られ、Workers AIには適用されなかった。加えて、開発者は常に「どのプロバイダーがそのモデルをホストしているか」を意識してコードを書く必要があり、そのプロバイダーで障害やレート制限が発生すると、アプリケーションがそのまま止まってしまうという構造的な脆さも抱えていた。

## 発表内容 / アーキテクチャ

### バインディングとAPIの統合

WorkersバインディングとREST APIの両方が、共通の経路を通るように統合された。もはや「AI Gateway用のバインディング」と「Workers AI用のバインディング」という区別は存在せず、`env.AI.run()` の第3引数（オプション）に `gateway: { id: 'default' }` を渡すだけで、両プロダクトの機能を横断的に利用できる。REST APIも `/ai/` 配下の単一のエンドポイント体系に統合されている。

### `default` ゲートウェイによる自動可観測性

これまでWorkers AIの呼び出しを可視化するには、事前にダッシュボード上でAI Gatewayを手動作成しておく必要があった。統合後は、ゲートウェイIDとして `default` を指定するだけで、初回の認証済みリクエスト時に自動的にゲートウェイが作成される仕組みになった。これにより、新規ユーザーは何のセットアップもなしにリクエスト単位の完全なペイロードログ、モデルごとのトークン使用量、コスト帰属（コストアトリビューション）を得られる。要件が増えた段階で、キャッシュルールやトラフィック分割などを設定できる名前付きゲートウェイへ後から切り替えることも可能とされている。ダッシュボードでは、レイテンシの内訳、トークン使用量、エラー率、実際のプロンプトとレスポンスまで確認できる。

### AI Gatewayクレジットの統合課金

これまでAI Gatewayのクレジット機能（ウォレットに事前チャージして使う課金モデル）は、OpenAIやAnthropicといった外部プロバイダー向けにしか使えなかった。今回の統合により、同じウォレットの残高をWorkers AIの呼び出しにも充当できるようになり、外部プロバイダーとWorkers AIをまたいだ一元的なコスト管理が可能になった。さらに、この統合課金でWorkers AIモデルを利用する場合には、レート制限が緩和される特典も用意されている。

### 近日公開: モデルファーストルーティング

現状、開発者は「どのプロバイダーが目的のモデルをホストしているか」を把握し、そのプロバイダーで障害が起きた場合の代替手段を自前で用意する必要がある。これから提供される「モデルファーストルーティング」では、開発者はモデル名（例: `kimi-k2.7-code`）だけを指定すればよく、それが実際にWorkers AI由来なのか、モデル提供元（Moonshotなど）のAPI由来なのか、同じ重みをホストする別のプロバイダー由来なのかを意識する必要がなくなる。Workers AI側に空きキャパシティがあればそちらへ、逼迫していれば別の検証済みプロバイダーへと、ゲートウェイ側が透過的に負荷分散する。品質やゼロデータ保持（ZDR）といった要件は、あらかじめ選定されたプロバイダーとの関係を通じて維持される、としている。

### 次のステップ: スマートルーティング

さらにその先の構想として、リクエスト内容に応じてモデル自体を自動選択する「スマートルーティング」が挙げられている。Workers AI上で動くクラシファイアがプロンプトを解析し、タスクの種類（コーディング、リサーチ、要約、一般的な質問応答など）・複雑さ・必要なコンテキスト量を推定する。そのうえでヒューリスティックなスコアラーが、あらかじめ用意されたモデル群の中から最適なものへマッピングする。モデルを明示的に指定したいチームはそのままの制御を維持でき、そうでないチームはコード側で独自のルーティングロジックを保守することなく、コストとパフォーマンスの両面で恩恵を受けられる、という位置づけである。現時点では社内パイロットの段階で、今後数週間かけてテストと改善を進めるとされている。

### 今すぐ始める

既存のWorkers AIユーザーは、呼び出しを `default` ゲートウェイ経由にするだけで、即座にリクエストロギング・トークン追跡・コスト帰属を得られる。既存のAI GatewayユーザーはWorkers AIのモデルを呼び出すコードを追加するだけで、統合課金とレート制限緩和の恩恵を受けられる。

## コード例

### Workersバインディングの例

```javascript
export default {
  async fetch(request, env) {
    const response = await env.AI.run(
      '@cf/zai-org/glm-5.2',
      {
        messages: [
          { role: 'user', content: 'What is the capital of France?' },
        ]
      },
      {
        gateway: {
          id: 'default', // Use 'default' for the built-in gateway
        },
      }
    );

    return new Response(JSON.stringify(response), {
      headers: { 'Content-Type': 'application/json' },
    });
  },
};
```

`env.AI.run()` の第3引数に `gateway: { id: 'default' }` を渡すだけで、既存のWorkers AI呼び出しがそのままAI Gatewayの観測対象になる。バインディング自体を差し替える必要がない点がポイントである。

### 統合REST APIの例

```bash
curl "https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/run/@cf/zai-org/glm-5.2" \
  -H "Authorization: Bearer {api_token}" \
  -H "Content-Type: application/json" \
  -H "cf-aig-gateway-id: default" \
  -d '{
    "messages": [{"role": "user", "content": "What is the capital of France?"}],
  }'
```

REST API経由の場合も、`cf-aig-gateway-id` ヘッダーに `default` を指定するだけで同様の挙動になる。エンドポイントが `/ai/run/` 配下に統合されているため、AI GatewayとWorkers AIそれぞれに別のエンドポイント体系を覚える必要がない。

### Before / After比較

統合前（AI Gatewayを経由しない、素のWorkers AI呼び出し）:

```javascript
const response = await env.AI.run('@cf/zai-org/glm-5.2', {
  messages: [{ role: 'user', content: 'Hello!' }],
});
```

統合後（`gateway.id: 'default'` を追加するだけ）:

```javascript
const response = await env.AI.run(
  '@cf/zai-org/glm-5.2',
  { messages: [{ role: 'user', content: 'Hello!' }] },
  { gateway: { id: 'default' } } // Auto-creates the gateway on first use
);
```

差分はオプション引数1つだけであり、既存コードへの侵襲性が非常に低い形で可観測性を追加できるように設計されていることがわかる。

### モデルファーストルーティングのAPI例

```bash
curl -X POST "https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/v1/chat/completions" \
  -H "Authorization: Bearer {api_token}" \
  -H "cf-aig-gateway-id: my-gateway" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "kimi-k2.7-code",
    "messages": [{"role": "user", "content": "Review this function"}]
  }'
```

`model` フィールドにモデル名を渡すだけで、どのプロバイダーがそのモデルを提供しているかをリクエスト側が意識しなくてよい形になっている。エンドポイントも `/ai/v1/chat/completions` という、OpenAI互換に近い形式が使われている点が特徴である。

## ユースケース

- **既存Workers AIユーザーの可観測性強化**: すでにWorkers AIを本番で使っているアプリケーションに対し、コードの差分をほぼ増やさずに（オプション引数1つの追加のみで）リクエストログ・トークン使用量・コスト帰属を得られる。
- **AI Gateway利用者のコスト一元管理**: 既にAI Gatewayを使って外部プロバイダー（OpenAI、Anthropicなど）を利用しているチームが、同じウォレット・同じダッシュボードでWorkers AIモデルも扱えるようになり、プロバイダー横断でのコスト管理・比較がしやすくなる。
- **高可用性を要するAIバックエンド設計**: モデルファーストルーティングを使うことで、特定プロバイダーの障害やレート制限が発生した際に、アプリケーションコードを変更せずゲートウェイ側で自動的に別プロバイダーへフェイルオーバーする構成を組める。
- **ルーティングロジックを自前実装したくない場合**: スマートルーティングが正式提供された後は、プロンプトの内容に応じたモデル選定ロジックを自前でメンテナンスすることなく、ゲートウェイ側に判断を委ねる構成が選べるようになる見込みである。

## 所感・ポイント

- 今回の統合の本質は「新機能の追加」というより、これまで別々だった2つのプロダクトの間にあった**セットアップの摩擦**（ゲートウェイの事前作成、バインディングの使い分け、課金経路の違い）を取り除いたことにあると感じる。特に `gateway: { id: 'default' }` だけで既存呼び出しがそのまま可観測になる設計は、既存コードへの影響を最小化する移行パスとしてよく考えられている。
- 「モデルファースト」への転換は、プロバイダーロックインの懸念を減らしつつ可用性を高める発想として理にかなっている。ただし記事中でも述べられている通り現時点ではまだ「Coming soon」であり、実際にどこまで透過的にフェイルオーバーできるか、コスト面でどう変わるかは今後の公開情報を追う必要がありそうである。
- スマートルーティングは「Workers AI上で動くクラシファイアがプロンプトからタスク種別・複雑さを推定する」という説明にとどまり、具体的な精度や対応モデル範囲は開示されていない。内部パイロット段階とのことなので、正式リリース時のドキュメントで詳細を確認したい。

> **Workers サンプル**: [examples/workers-ai-gateway-unification/](../../examples/workers-ai-gateway-unification/) — `env.AI.run()` に `gateway: { id: "default" }` を渡すだけで可観測性が有効になる様子を体験できる最小Worker。

## 関連リンク

- [Set up your first gateway](https://developers.cloudflare.com/ai-gateway/get-started/)
- [Workers AI model catalog](https://developers.cloudflare.com/workers-ai/models/)
- [Unified billing developer docs（レート制限・統合課金）](https://developers.cloudflare.com/changelog/post/2026-08-07-workers-ai-unified-billing/)
- [英語版原文](https://blog.cloudflare.com/workers-ai-gateway-unification/)
