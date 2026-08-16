---
routerMode: hash
theme: default
title: Workers AIとAI Gatewayを単一のAIコントロールプレーンへ統合
info: |
  Cloudflare Blog記事「Workers AIとAI Gatewayを単一のAIコントロールプレーンへ統合」の解説スライド。
  原文: https://blog.cloudflare.com/ja-jp/workers-ai-gateway-unification/
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

# Workers AIとAI Gatewayを
# 単一のAIコントロールプレーンへ統合

<div class="pt-4 text-sm opacity-70">
原文: https://blog.cloudflare.com/ja-jp/workers-ai-gateway-unification/<br>
公開日: 2026-08-07
</div>

---

# TL;DR

- Cloudflareは、これまで別プロダクトだった<strong>AI Gateway</strong>（任意のモデルプロバイダーへのプロキシ・可観測性レイヤー）と<strong>Workers AI</strong>（Cloudflare自身がホストするマネージドGPU推論）を、単一の「AIコントロールプレーン」へ統合
- WorkersバインディングとREST APIの両方が同じ経路を通るようになり、ゲートウェイIDに`default`を指定するだけで、事前にゲートウェイを作成しなくても自動的にロギング・可観測性が有効に
- AI Gatewayのクレジット（ウォレット課金）がWorkers AIにも使えるようになり、統合請求を使うとWorkers AIモデルのレート制限が緩和される
- 近い将来、プロバイダーではなくモデル名を指定するだけで自動的にフェイルオーバー・負荷分散される「モデルファーストルーティング」と、プロンプト内容から最適なモデルを自動選択する「スマートルーティング」が投入予定（現在は内部パイロット段階）

---

# アジェンダ


- 背景: なぜAI GatewayとWorkers AIは別々だったのか
- 課題: セットアップの摩擦とプロバイダー依存の脆さ
- 発表内容: バインディング/APIの統合
- `default` ゲートウェイによる自動可観測性
- AI Gatewayクレジットの統合課金
- コード例で見る移行パス
- 今後: モデルファーストルーティング／スマートルーティング
- ユースケース


---

# 背景: 分かれていた2つのプロダクト

<div class="grid grid-cols-2 gap-4">
<div>

### AI Gateway
任意のモデルプロバイダーへの
プロキシ・可観測性レイヤー

### Workers AI
Cloudflare自身がホストする
マネージドGPU推論サービス

</div>
<div>

![統合されたAIコントロールプレーン](https://blog.cloudflare.com/_emdash/api/media/file/01KZA5VCX2R70YMT8M56D89B37.png)

</div>
</div>


これまでバインディングもAPIエンドポイントも別々で、連携には明示的なセットアップが必要だった


<footer class="text-xs opacity-50 mt-4">
出典: Cloudflare Blog https://blog.cloudflare.com/ja-jp/workers-ai-gateway-unification/
</footer>

---

# 課題①: 可観測性の断絶


- Workers AIを単体で使う限り、リクエストログ・トークン使用量・コストの内訳を見る仕組みが標準にはない
- 可観測性を得るには、事前にダッシュボードでAI Gatewayを手動作成し、呼び出しを紐づける必要があった
- 新規ユーザーにとっては、始める前に余分なセットアップ手順が挟まる


---

# 課題②: 課金とプロバイダー依存の脆さ


- AI Gatewayのクレジット（ウォレット課金）は外部プロバイダー向けのみで、Workers AIには適用されなかった
- 開発者は常に「どのプロバイダーがそのモデルをホストしているか」を意識してコードを書く必要があった
- そのプロバイダーで障害やレート制限が発生すると、アプリケーションがそのまま止まってしまう構造的な脆さがあった


---

# 発表: バインディングとAPIの統合


- WorkersバインディングとREST APIの両方が共通の経路を通るように統合
- 「AI Gateway用」「Workers AI用」というバインディングの区別は廃止
- REST APIも `/ai/` 配下の単一のエンドポイント体系に統合


---

# コード例① Workersバインディング: 見どころ


- 次のコードは既存のWorkersバインディング呼び出しに、AI Gatewayの観測機能を足す例
- 注目すべきは12〜16行目の第3引数 `{ gateway: { id: 'default' } }` の1点だけ
- バインディング自体（`env.AI.run`）を差し替える必要がなく、既存コードへの侵襲性が非常に低い
- これだけで、この呼び出しがAI Gatewayの観測対象になる

---

# コード例① Workersバインディング

```javascript {1-3|4-11|12-16|all}
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

---

# コード例② 統合REST API

```bash {1|2-5|all}
curl "https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/run/@cf/zai-org/glm-5.2" \
  -H "Authorization: Bearer {api_token}" \
  -H "Content-Type: application/json" \
  -H "cf-aig-gateway-id: default" \
  -d '{
    "messages": [{"role": "user", "content": "What is the capital of France?"}],
  }'
```


`cf-aig-gateway-id: default` ヘッダーを付けるだけで、REST API経由でも同じ挙動になる


---

# コード例③ Before / After

<div class="grid grid-cols-1 gap-2">

**統合前:**

```javascript
const response = await env.AI.run('@cf/zai-org/glm-5.2', {
  messages: [{ role: 'user', content: 'Hello!' }],
});
```

**統合後:**

```javascript {4}
const response = await env.AI.run(
  '@cf/zai-org/glm-5.2',
  { messages: [{ role: 'user', content: 'Hello!' }] },
  { gateway: { id: 'default' } } // Auto-creates the gateway on first use
);
```

</div>


差分はオプション引数1つだけ。移行パスの侵襲性の低さが際立つ


---

# `default` ゲートウェイによる自動可観測性


- ゲートウェイIDに `default` を指定するだけで、初回の認証済みリクエスト時に自動作成
- 事前セットアップなしで、リクエスト単位の完全なペイロードログを取得
- モデルごとのトークン使用量、コスト帰属（コストアトリビューション）も自動で得られる
- 要件が増えたら、キャッシュルールやトラフィック分割を設定できる名前付きゲートウェイへ後から切り替え可能


<br>


ダッシュボードでは、レイテンシ内訳・トークン使用量・エラー率・実際のプロンプトとレスポンスまで確認できる


---

# AI Gatewayクレジットの統合課金


- これまでAI Gatewayのクレジット（ウォレット課金）は外部プロバイダー向けのみ
- 今回の統合で、同じウォレットの残高をWorkers AIの呼び出しにも充当できるように
- 外部プロバイダーとWorkers AIをまたいだ一元的なコスト管理が可能に
- 統合課金でWorkers AIを利用する場合、レート制限が緩和される特典も


---
class: text-center
---

# 今後の展開:
# モデルファーストルーティング / スマートルーティング

---

# Coming soon: モデルファーストルーティング


> どのプロバイダーが目的のモデルをホストしているかを意識せず、
> モデル名だけを指定すればよくなる



- Workers AI側に空きキャパシティがあればそちらへルーティング
- 逼迫していれば別の検証済みプロバイダーへ、ゲートウェイ側が透過的に負荷分散
- 品質・ゼロデータ保持（ZDR）などの要件は、選定済みプロバイダーとの関係を通じて維持


---

# コード例④ モデルファーストAPI

```bash {5-6|all}
curl -X POST "https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/v1/chat/completions" \
  -H "Authorization: Bearer {api_token}" \
  -H "cf-aig-gateway-id: my-gateway" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "kimi-k2.7-code",
    "messages": [{"role": "user", "content": "Review this function"}]
  }'
```


`model` フィールドにモデル名を渡すだけで、プロバイダーの選択はゲートウェイ側に委ねられる。
エンドポイントも `/ai/v1/chat/completions` というOpenAI互換に近い形式


---

# Next: スマートルーティング


- Workers AI上で動くクラシファイアがプロンプトを解析
- タスク種別（コーディング・リサーチ・要約・一般Q&Aなど）・複雑さ・必要なコンテキスト量を推定
- ヒューリスティックなスコアラーが、最適なモデルへマッピング
- モデルを明示指定したいチームはそのまま制御を維持できる
- 現時点では社内パイロット段階


---
class: text-center
---

# ユースケース

---

# ユースケース①: 既存Workers AIユーザーの可観測性強化


- すでに本番でWorkers AIを使っているアプリケーションが対象
- コード差分はオプション引数1つの追加のみ
- リクエストログ・トークン使用量・コスト帰属を追加のインフラ構築なしに取得


---

# ユースケース②: AI Gateway利用者のコスト一元管理


- 既にAI Gatewayで外部プロバイダー（OpenAI、Anthropicなど）を使っているチームが対象
- 同じウォレット・同じダッシュボードでWorkers AIモデルも扱えるように
- プロバイダー横断でのコスト管理・比較がしやすくなる


---

# ユースケース③: 高可用性を要するAIバックエンド設計


- モデルファーストルーティングを使うことで、プロバイダー障害時のフェイルオーバーをゲートウェイ側に委譲
- アプリケーションコードを変更せずに、別プロバイダーへ自動的に切り替わる構成を組める
- 単一プロバイダーへの依存によるアプリケーション停止リスクを低減


---

# ユースケース④: ルーティングロジックの自前実装を避けたい場合


- スマートルーティングが正式提供された後を見据えたユースケース
- プロンプト内容に応じたモデル選定ロジックを自前でメンテナンスせずに済む
- ゲートウェイ側に判断を委ねる構成を選べるようになる見込み


---

# まとめ


- 今回の統合の本質は「新機能追加」というより、2プロダクト間にあった**セットアップの摩擦**を取り除いたこと
- `gateway: { id: 'default' }` だけで既存呼び出しがそのまま可観測になる、侵襲性の低い移行パス
- AI Gatewayクレジットの統合課金により、外部プロバイダーとWorkers AIをまたいだコスト管理が一元化
- 今後は「モデルファーストルーティング」「スマートルーティング」により、プロバイダー選択・モデル選定自体もゲートウェイ側に委ねられる方向へ


---

<div class="text-center">

# 参考リンク

</div>

- 原文（日本語）: [Workers AIとAI Gatewayを単一のAIコントロールプレーンへ統合](https://blog.cloudflare.com/ja-jp/workers-ai-gateway-unification/)
- 英語版: [Unifying Workers AI and AI Gateway into a single AI control plane](https://blog.cloudflare.com/workers-ai-gateway-unification/)
- [Set up your first gateway](https://developers.cloudflare.com/ai-gateway/get-started/)
- [Workers AI model catalog](https://developers.cloudflare.com/workers-ai/models/)
- [Unified billing developer docs](https://developers.cloudflare.com/changelog/post/2026-08-07-workers-ai-unified-billing/)
- Workers サンプル: [github.com/syumai/cloudflare-blog-summaries/tree/main/examples/workers-ai-gateway-unification](https://github.com/syumai/cloudflare-blog-summaries/tree/main/examples/workers-ai-gateway-unification)

<div class="pt-8 text-sm opacity-50">
Wiki: docs/articles/2026-08-07-workers-ai-gateway-unification.md
</div>
