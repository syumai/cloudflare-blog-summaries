---
theme: default
title: "Cloudflare AI Search: エージェントにあなたのデータのための検索エンジンを"
info: |
  Cloudflare Blog記事「Cloudflare AI Search: give your agents a search engine for your data」の解説スライド。
  原文: https://blog.cloudflare.com/ai-search-easier/
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

# Cloudflare AI Search
# エージェントにあなたのデータのための検索エンジンを

<div class="pt-4 text-sm opacity-70">
原文: https://blog.cloudflare.com/ai-search-easier/<br>
公開日: 2026-08-06
</div>

---

# アジェンダ


- 背景: 検索/RAGパイプラインを自作する手間
- 新機能の全体像
- 実例: Cloudflare Dev Stack MCP（3ステップ）
- コード例で見る: インスタンス作成からMCP組み込みまで
- ブログ・Developer Docsでの実運用
- ボットポリシーの遵守
- 価格プレビュー
- ユースケース
- まとめ


---

# 背景: 検索/RAGパイプラインを自作する手間

これまでCloudflare上で検索やRAGを構築するには、
複数のプリミティブを自分で組み合わせる必要があった


- **Workers AI**: 埋め込み生成
- **AI Gateway**: モデル呼び出しの管理
- **Vectorize**: ベクトルの保存・検索
- **R2**: 元データの保管
- **Browser Rendering**: Webサイトのクロール・取り込み


<br>


> "AI Search makes search easier than ever, with no Cloudflare primitives to stitch together."


---

# 課題: つなぎ合わせるだけでは足りない

AI Search自体は以前から複数プリミティブをまとめる
マネージドサービスとして存在していた


- 複数のデータソースを1つの窓口から検索したい
- 外部・エージェント向けに安全に公開したい
- 既存のCMSにそのまま組み込みたい


<br>


今回のアップデートは、「作って終わり」ではなく
**「運用する」段階**で必要になるピースを埋める内容


---

# 新機能の全体像


- データのインデックス化（ファイル・Webサイトを指定するだけ）
- サイトマップ不要の **"Discover"** パース
- 複数インスタンスを横断する公開エンドポイント（`/search`・`/mcp`）
- カスタムドメイン対応と **Cloudflare Access**
- OSSのヘッドレスCMS **EmDash** への統合
- 予測しやすい新しい価格モデルのプレビュー公開


---
layout: image-right
image: https://blog.cloudflare.com/_emdash/api/media/file/01KZA4N9Q0TF9PKSV1ESVPJ9M1.png
backgroundSize: contain
---

# 記事冒頭のビジュアル

AI Searchのアップデート全体を象徴する
記事トップのイメージ

<footer class="text-xs opacity-50 mt-4">
出典: Cloudflare Blog https://blog.cloudflare.com/ai-search-easier/
</footer>

---
class: text-center
---

# 実例:
# Cloudflare Dev Stack MCP

---

# Dev Stack MCPとは


> "gives coding agents current, cited docs across the Cloudflare developer ecosystem,
> so they build on the latest features and fixes instead of stale training data"



コーディングエージェントに、Cloudflare開発者エコシステム全体にわたる
**最新かつ引用付きのドキュメント**を与えるための仕組み


<br>


構築は3つのステップで説明されている


---

# ステップ1: 各サーフェスのインデックス化

Cloudflareが所有・関係する **10個のサーフェス** を
それぞれ独立したAI Searchインスタンスとしてインデックス化


- Docs
- Blog
- API Docs
- Community
- Astro / Vite / Vitest / Hono / Replicate / OpenNext


<br>


コマンド1つで各インスタンスを作成できる


---

# ステップ2: 複数インスタンスの統合検索

統合検索の実現方法は2つ

<div class="grid grid-cols-2 gap-4 pt-4">
<div>

### Option A
Worker上でリモートMCPサーバーを
**自前で実装**

</div>
<div>

### Option B
コードを書かずに
**パブリックURLを有効化**（`/search`・`/mcp`）

</div>
</div>

<footer class="text-xs opacity-50 mt-4">
出典: Cloudflare Blog https://blog.cloudflare.com/ai-search-easier/
</footer>

---
layout: image-right
image: https://blog.cloudflare.com/_emdash/api/media/file/01KZA4N9C19KKHFFAPKSBVY6Q2.png
backgroundSize: contain
---

# パブリックエンドポイント機能

"Option B: flip on public endpoints (no code)" の
直後に掲載されているスクリーンショット

<footer class="text-xs opacity-50 mt-4">
出典: Cloudflare Blog https://blog.cloudflare.com/ai-search-easier/
</footer>

---
layout: image-right
image: https://blog.cloudflare.com/_emdash/api/media/file/01KZA4N9XV4EAC6SEBKG5WH0JG.png
backgroundSize: contain
---

# ステップ3: ブランディングと保護


- カスタムドメインでエンドポイントを自社ブランド化
- **Cloudflare Access** で認証をかけ、アクセスを制限


<footer class="text-xs opacity-50 mt-4">
出典: Cloudflare Blog https://blog.cloudflare.com/ai-search-easier/
</footer>

---
layout: image-right
image: https://blog.cloudflare.com/_emdash/api/media/file/01KZA4N9XD3VNB63VGZ3AFE6TR.png
backgroundSize: contain
---

# 実際に試す: AI Playground


- AI Playground上でDev Stack MCPを試用可能
- MCP設定ファイルにURLをドロップするだけで組み込める



> "replaces the usual fallback (web search then fetching full pages),
> which is slow, token-heavy"


<footer class="text-xs opacity-50 mt-4">
出典: Cloudflare Blog https://blog.cloudflare.com/ai-search-easier/
</footer>

---
class: text-center
---

# コード例で見る:
# インスタンス作成からMCP組み込みまで

記事に掲載されている5つのコード例を
構築手順の順番に見ていく

---

# コード例① インスタンス作成（サイトマップ不要）

```bash {1|2-3|4|5|all}
npx wrangler ai-search create cloudflare-community \
  --namespace dev-stack \
  --source https://community.cloudflare.com \
  --type web-crawler \
  --parse-type discover
```


- `wrangler ai-search create` コマンド1つでインスタンスを作成
- `--type web-crawler` でWebクローラー型のソースを指定
- `--parse-type discover` でサイトマップ不要のクロールを有効化


---

# コード例② Worker側のバインディング設定

```json {2-3|all}
{
  "ai_search_namespaces": [
    { "binding": "AI_SEARCH", "namespace": "cloudflare-stack" }
  ]
}
```


- `wrangler.jsonc` に `ai_search_namespaces` を追加
- Worker内から `env.AI_SEARCH` としてインスタンスを呼び出せるようになる


---

# コード例③ 複数インスタンスを横断検索するツール

```ts {1-6|9-16|17|all} {maxHeight:'400px'}
context.registerTool(
  'search_dev_stack',
  {
    description: 'Search current docs across the Cloudflare stack.',
    inputSchema: z.object({ query: z.string() }),
  },
  async ({ query }) => {
    const res = await context.env.AI_SEARCH.search({
      query,
      ai_search_options: {
        instance_ids: ['developers-cloudflare-com', 'astro', /* ...every surface */],
        retrieval: { max_num_results: 10 },
        reranking: { enabled: true },
      },
    })
    return { content: [{ type: 'text', text: format(res.chunks) }] }
  }
)
```

---

# コード例③ 解説


- `registerTool` でMCPツール `search_dev_stack` を定義
- `env.AI_SEARCH.search()` を呼び出して検索を実行
- `instance_ids` に複数のインスタンスIDを渡すことで**1回のクエリで横断検索**
- `retrieval.max_num_results` / `reranking.enabled` で取得件数・再ランキングを制御
- Option A（Worker上でMCPサーバーを自前実装）に相当する実装例


---

# コード例④ MCPクライアント側の設定

```json {2|all}
{
  "mcpServers": {
    "dev-stack": { "url": "https://stack.mcp.cloudflare.com/mcp" }
  }
}
```


MCP設定ファイルにエンドポイントURLを1行追加するだけで、
コーディングエージェントが横断検索ツールを利用できるようになる


---

# コード例⑤ 自分のサイトで使い始める

```bash {4|all}
npx wrangler ai-search create my-search \
  --namespace my-namespace \
  --source https://my-website.com \
  --type web-crawler \
  --hybrid-search
```


> "Point it at your site, turn on hybrid search for both semantic and keyword matching,
> and you have a search engine for your own data, ready for your agents."


---

# ブログ・Developer Docs・Cloudflare.comでの実運用


- CloudflareブログはOSSのCMS **EmDash** 上で構築されている
- "our new EmDash AI Search integration is what powers that search now"
- 検索方式は **ハイブリッド検索**（セマンティック＋キーワードを1クエリで同時実行）


<br>


曖昧な自然文の質問にも、正確なキーワード一致にも対応できる


---

# ボットポリシーの遵守

AI Searchのクロールは裏側で Browser Rendering の `/crawl` を利用


> "AI Search is powered by Browser Run `/crawl` in the background, but goes a step
> further to identify itself with its own bot identity: `Cloudflare-AI-Search`"



- 固有のbot識別子 `Cloudflare-AI-Search` を名乗る
- robots.txtに従う
- 変更されない公開のUser-Agentで自己を識別する


---

# 価格プレビュー: 予測しやすい料金体系

| 項目 | 価格 | 月間無料枠 |
| --- | --- | --- |
| データ取り込み | $0.75 / 1M トークン | 5M トークン |
| 画像処理 | +$0.50 / 1M トークン | 5M トークン |
| ストレージ | $2.00 / GB・月 | 10 GB |
| セマンティック検索 | $0.75 / 1,000 クエリ | 2,000 クエリ |
| フルテキスト検索 | $0.10 / 1,000 クエリ | 2,000 クエリ |
| 埋め込み・再ランキング | デフォルトモデル利用時は無料 | - |

---

# 価格試算例


20,000ドキュメント（約20Mトークン）のインスタンスで
月30,000セマンティッククエリを実行した場合



- 初月: インデックス作成コストを含めて概算 **約$35**
- 翌月以降: インデックス作成はほぼ一度きりのコストのため、
  クエリ課金が中心となり **約$21** に近づく


<br>


"Indexing is largely a one-time cost, so later months are mostly queries, closer to $21."


---
class: text-center
---

# ユースケース

---

# ユースケース①: ドキュメント検索の内製をやめる


- 埋め込み生成・ベクトル検索・再ランキングを個別に組み合わせない
- AI Searchだけでドキュメント検索機能を構築できる
- 社内外向けのFAQ・ヘルプセンター検索などに応用しやすい


---

# ユースケース②: 複数サイトを1つの窓口に統合


- 製品ドキュメント、ブログ、コミュニティフォーラムなど
  ドメインの異なる複数サイトを個別インスタンスとしてインデックス化
- `instance_ids` を束ねて1つのエンドポイントから横断検索
- Dev Stack MCPがまさにこの構成の実例


---

# ユースケース③: コーディングエージェント向けMCPサーバー


- エージェントがWeb検索とページ取得を繰り返す代わりに
  引用付きの最新ドキュメントを直接参照できる
- 学習データの陳腐化（stale training data）を補う手段になる
- MCP設定ファイルへのURL追加だけで組み込み可能


---

# ユースケース④: 既存サイト検索のハイブリッド化


- セマンティック検索とキーワード検索を1クエリで両立
- 曖昧な自然文の質問にも、正確な用語一致にも対応
- Cloudflareブログ自身がこの構成に刷新された実例


---

# ユースケース⑤: 社内限定ドキュメントの安全な公開


- カスタムドメインでエンドポイントをブランド化
- Cloudflare Accessで認証をかけ、アクセスを制限
- 認証済みユーザー・エージェントだけに検索を公開できる


---

# まとめ


- AI Searchは、Workers AI・Vectorize・R2などを個別に組み合わせる
  手間を無くし、検索/RAGパイプラインを単一サービスとして提供
- 新機能の柱は「サイトマップ不要のクロール」「複数インスタンス横断検索」
  「カスタムドメイン＋Access」「EmDash統合」
- 実例のDev Stack MCPは、3ステップ（インデックス化→統合検索→
  ブランディング・保護）で構築されている
- ボットポリシーの透明性（固有User-Agent・robots.txt遵守）にも言及
- 価格は「取り込み」と「クエリ」を分けて考える予測しやすい設計


---

<div class="text-center">

# 参考リンク

</div>

- 原文: [Cloudflare AI Search: give your agents a search engine for your data](https://blog.cloudflare.com/ai-search-easier/)
- [Cloudflare AI Search ドキュメント](https://developers.cloudflare.com/ai-search/)
- [EmDash（OSSのヘッドレスCMS）](https://github.com/emdash-cms/emdash)
- [EmDash AI Search統合のドキュメント](https://docs.emdashcms.com/deployment/cloudflare/#cloudflare-ai-search)
- [AI Playground](https://playground.ai.cloudflare.com)
- [Cloudflare MCP Server（GitHubリポジトリ）](https://github.com/cloudflare/mcp-server-cloudflare)
- Workers サンプル: [github.com/syumai/cloudflare-blog-summaries/tree/main/examples/ai-search-easier](https://github.com/syumai/cloudflare-blog-summaries/tree/main/examples/ai-search-easier)

<div class="pt-8 text-sm opacity-50">
Wiki: docs/articles/2026-08-06-ai-search-easier.md
</div>
