# Cloudflare AI Search: エージェントにあなたのデータのための検索エンジンを

- 原文: [https://blog.cloudflare.com/ai-search-easier/](https://blog.cloudflare.com/ai-search-easier/)（日本語版なし）
- 公開日: 2026-08-06
- GitHub: [docs/articles/2026-08-06-ai-search-easier.md](https://github.com/syumai/cloudflare-blog-summaries/blob/main/docs/articles/2026-08-06-ai-search-easier.md)

## TL;DR

- Cloudflare AI Search が大幅にアップデートされ、これまで Workers AI・AI Gateway・Vectorize・R2・Browser Rendering などを個別に組み合わせて自作していた検索/RAGパイプラインを、単一のマネージドサービスとして自動構築できるようになった。
- 新機能として、サイトマップ不要のクロール（Discover）、複数インスタンスを横断検索できる公開エンドポイント（`/search`・`/mcp`）、カスタムドメイン + Cloudflare Access によるアクセス制御、OSSのCMSである EmDash との統合が追加された。
- 実例として、Cloudflareの開発者向けドキュメント群を横断検索できる「Cloudflare Dev Stack MCP」を構築・公開したことが紹介されている。
- Cloudflareブログ自身の検索も、この新しいAI Searchを使ったハイブリッド検索（セマンティック＋キーワード）に刷新された。
- 予測しやすい新しい価格体系がプレビュー公開され、デフォルトのWorkers AIモデルを使う埋め込み・再ランキングは無料。

## 背景・課題

Cloudflare上で社内ドキュメント検索やRAG（検索拡張生成）を組もうとすると、これまでは複数のプリミティブを自分で組み合わせる必要があった。埋め込み生成にWorkers AI、モデル呼び出しの管理にAI Gateway、ベクトルの保存・検索にVectorize、元データの保管にR2、Webサイトのクロールや取り込みにBrowser Renderingといった具合に、それぞれを個別に選定・接続・運用しなければならず、構築の手間もインフラの管理コストも小さくなかった。

Cloudflare AI Search（旧AutoRAGの発展形）はこれらを1つのマネージドサービスにまとめる方向で提供されてきたが、今回のアップデートはさらに一歩進み、「複数のデータソースを1つの窓口から検索できるようにする」「外部・エージェント向けに安全に公開する」「既存のCMSにそのまま組み込む」といった、実運用でつまずきやすい部分を埋める内容になっている。記事のリード文は "AI Search makes search easier than ever, with no Cloudflare primitives to stitch together." （AI Searchは、Cloudflareのプリミティブをつなぎ合わせる必要なく、これまで以上に簡単に検索を実現します）と要約している。

## 発表内容 / アーキテクチャ

![Cloudflare AI Search 記事冒頭のビジュアル](https://blog.cloudflare.com/_emdash/api/media/file/01KZA4N9Q0TF9PKSV1ESVPJ9M1.png)
*図: 記事冒頭に掲載されているビジュアル（出典: Cloudflare Blog https://blog.cloudflare.com/ai-search-easier/）*

### 新機能の全体像

記事では、今回のアップデートの柱として以下が挙げられている。

- **データのインデックス化**: ファイルやWebサイトを指定するだけで自動的にインデックスを作成できる。
- **サイトマップ不要の "Discover" パース**: サイトマップが存在しないサイトでも、クロールしながらページを自動発見してインデックス化できる。
- **複数インスタンスを横断する公開エンドポイント**: `/search` と `/mcp` という単一のパブリックエンドポイントから、複数のAI Searchインスタンスをまとめて検索できる。
- **カスタムドメイン対応と Cloudflare Access**: 独自ドメインでエンドポイントをブランド化しつつ、Cloudflare Accessによる認証でアクセスを制限できる。
- **EmDash への統合**: OSSのヘッドレスCMSである EmDash に、AI Search用のプラグインとして直接組み込まれた。
- **新しい価格モデルのプレビュー公開**: 予測しやすい従量課金体系が公開された（詳細は後述）。

### 実例: Cloudflare Dev Stack MCP

記事は、上記の機能を実際に組み合わせた具体例として「Cloudflare Dev Stack MCP」を紹介している。その狙いは、"gives coding agents current, cited docs across the Cloudflare developer ecosystem, so they build on the latest features and fixes instead of stale training data"（コーディングエージェントに、Cloudflare開発者エコシステム全体にわたる最新かつ引用付きのドキュメントを与え、古い学習データではなく最新の機能・修正に基づいて実装させる）ことにある。構築は次の3ステップで説明されている。

1. **各サーフェスのインデックス化**: Docs・Blog・API Docs・Community・Astro・Vite・Vitest・Hono・Replicate・OpenNext という、Cloudflareが所有・関係する10個のサーフェスそれぞれに対して、独立したAI Searchインスタンスを作成する（コマンド1つで実行可能）。
2. **複数インスタンスの統合検索**: 統合検索の実現方法は2つ用意されている。1つはWorker上でリモートMCPサーバーを自前で実装する方法、もう1つはコードを書かずにパブリックURL（`/search`・`/mcp`）を有効化するだけで済ませる方法（記事内の "Option B: flip on public endpoints (no code)" に該当）。

![パブリックエンドポイント機能に関するスクリーンショット](https://blog.cloudflare.com/_emdash/api/media/file/01KZA4N9C19KKHFFAPKSBVY6Q2.png)
*図: "Option B: flip on public endpoints (no code)" の直後に掲載されているスクリーンショット（出典: Cloudflare Blog https://blog.cloudflare.com/ai-search-easier/）*

3. **ブランディングと保護**: カスタムドメインを被せてエンドポイントを自社ブランドのURLとして公開しつつ、必要に応じて Cloudflare Access で認証をかけ、アクセスを制限する。

![カスタムドメインとCloudflare Accessに関するスクリーンショット](https://blog.cloudflare.com/_emdash/api/media/file/01KZA4N9XV4EAC6SEBKG5WH0JG.png)
*図: 「3. Brand it and lock it down」の直後に掲載されているスクリーンショット（出典: Cloudflare Blog https://blog.cloudflare.com/ai-search-easier/）*

記事ではこの後、AI Playground上でDev Stack MCPを実際に試すことを勧める "Try it yourself: use the Dev Stack MCP" というセクションが続く。MCP設定ファイルにURLをドロップするだけでエージェントに組み込める手軽さが強調されており、"replaces the usual fallback (web search then fetching full pages), which is slow, token-heavy"（Web検索とページ全文取得を繰り返す従来のフォールバックを置き換える、と説明されている）。

![AI PlaygroundでのDev Stack MCP利用例に関するスクリーンショット](https://blog.cloudflare.com/_emdash/api/media/file/01KZA4N9XD3VNB63VGZ3AFE6TR.png)
*図: "Try it yourself: use the Dev Stack MCP" の直後に掲載されているスクリーンショット（出典: Cloudflare Blog https://blog.cloudflare.com/ai-search-easier/）*

### ブログ・Developer Docs・Cloudflare.comでの実運用

この新しいAI Searchは、Cloudflare自身のサービスにもすでに使われている。記事によれば、CloudflareブログはOSSのCMSである EmDash 上で構築されており、"our new EmDash AI Search integration is what powers that search now"（新しいEmDash AI Search統合が、いまブログの検索を支えている）とのこと。検索方式には**ハイブリッド検索**（セマンティック検索とキーワード検索を1回のクエリで同時に実行する方式）が採用されており、"uses hybrid search, semantic and keyword together in one query" と説明されている。これにより、曖昧な自然文の質問と、製品名やAPI名などの正確なキーワード一致の両方に強い検索を実現している。

### ボットポリシーの遵守

AI Searchによるクロールは、裏側では Browser Rendering の `/crawl` 機能を利用している。ただし単にクロールするだけでなく、`Cloudflare-AI-Search` という固有のbot識別子を名乗り、"follows robots.txt, identifies itself with an immutable, public user agent"（robots.txtに従い、変更されない公開のUser-Agentで自己を識別する）と明記されている。クロール対象サイトの運営者から見ても、何のbotがアクセスしているかを判別しやすい設計になっている。

### 価格プレビュー: 予測しやすい料金体系

記事では新しい料金体系がプレビューとして公開されている。

| 項目 | 価格 | 月間無料枠 |
| --- | --- | --- |
| データ取り込み（Base Ingestion） | $0.75 / 1M トークン | 5M トークン |
| 画像処理（Image processing） | 追加で $0.50 / 1M トークン | 5M トークン |
| ストレージ（Stored data） | $2.00 / GB・月 | 10 GB |
| セマンティック検索 | $0.75 / 1,000 クエリ | 2,000 クエリ |
| フルテキスト検索 | $0.10 / 1,000 クエリ | 2,000 クエリ |
| 埋め込み・再ランキング | デフォルトのWorkers AIモデルを使う場合は無料 | - |

記事内の試算例では、20,000ドキュメント（約20Mトークン相当）のインスタンスに対して月30,000セマンティッククエリを実行した場合、初月はインデックス作成コストを含めて概算で「約$35」程度になるとされている。また、"Indexing is largely a one-time cost, so later months are mostly queries, closer to $21."（インデックス作成はほぼ一度きりのコストなので、翌月以降はクエリ課金が中心となり、$21程度に近づく）とも述べられており、初期コストと運用コストが分離して考えられる設計であることが分かる。

## コード例

記事には5つのコード例が掲載されている。いずれも短いスニペットだが、Dev Stack MCPの構築手順に沿って並んでいる。

### ① AI Searchインスタンスの作成（サイトマップ不要のクロール）

```bash
npx wrangler ai-search create cloudflare-community \
  --namespace dev-stack \
  --source https://community.cloudflare.com \
  --type web-crawler \
  --parse-type discover
```

`wrangler ai-search create` コマンド1つで、Cloudflare Communityフォーラムを対象としたAI Searchインスタンスを作成している。`--type web-crawler` でWebクローラー型のソースを指定し、`--parse-type discover` を付けることでサイトマップが無いサイトでもクロールしながらページを自動発見できる（記事内で紹介される「Discover」パース機能に対応）。

### ② Worker側でのバインディング設定

```json
{
  "ai_search_namespaces": [
    { "binding": "AI_SEARCH", "namespace": "cloudflare-stack" }
  ]
}
```

`wrangler.jsonc` に `ai_search_namespaces` を追加することで、Worker内から `env.AI_SEARCH` としてAI Searchインスタンス（名前空間 `cloudflare-stack`）を呼び出せるようにしている。

### ③ 複数インスタンスを横断検索するツールの実装

```typescript
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

`registerTool` でMCPツール `search_dev_stack` を定義し、内部で `env.AI_SEARCH.search()` を呼び出している。`ai_search_options.instance_ids` に複数のインスタンスID（Docs、Astro など、①でインデックス化した各サーフェス）を配列で渡すことで、1回のクエリで複数のAI Searchインスタンスを横断検索できる。`retrieval.max_num_results` で取得件数を、`reranking.enabled` で再ランキングの有無を制御している。これが、記事本文で「Worker経由でリモートMCPサーバーを自作する」方法に相当する実装例である。

### ④ MCPクライアント側の設定

```json
{
  "mcpServers": {
    "dev-stack": { "url": "https://stack.mcp.cloudflare.com/mcp" }
  }
}
```

エージェント側のMCP設定ファイルに、Dev Stack MCPのエンドポイントURLを1行追加するだけで、コーディングエージェントが横断検索ツールを利用できるようになる。記事では、この設定ファイルへのURLの追加だけで済む手軽さが強調されている。

### ⑤ 基本的な使い始め方（ハイブリッド検索を有効化）

```bash
npx wrangler ai-search create my-search \
  --namespace my-namespace \
  --source https://my-website.com \
  --type web-crawler \
  --hybrid-search
```

自分のサイトを対象に、`--hybrid-search` フラグを付けてAI Searchインスタンスを作成する例。記事の結びの一文 "Point it at your site, turn on hybrid search for both semantic and keyword matching, and you have a search engine for your own data, ready for your agents."（自分のサイトを指定し、セマンティック検索とキーワード検索の両方に対応するハイブリッド検索を有効にするだけで、エージェント向けの検索エンジンが手に入る）に対応する、最小構成のコマンド例になっている。

## ユースケース

- **社内外向けドキュメント検索の内製をやめる**: 埋め込み生成・ベクトル検索・再ランキングなどを個別に組み合わせずに、AI Searchだけでドキュメント検索機能を構築できる。
- **複数の異なるサイトを1つの検索窓口に統合する**: 自社の製品ドキュメント、ブログ、コミュニティフォーラムなど、ドメインの異なる複数サイトを個別のインスタンスとしてインデックス化した上で、1つのエンドポイントから横断検索する（Dev Stack MCPが実例）。
- **コーディングエージェント向けのドキュメント検索MCPサーバーとして活用する**: エージェントがWeb検索とページ取得を繰り返す代わりに、引用付きの最新ドキュメントを直接参照できるようにする。
- **既存サイトの検索機能をハイブリッド検索に置き換える**: セマンティック検索とキーワード検索を両立させ、曖昧な質問にも正確な用語一致にも対応できる検索へ刷新する（Cloudflareブログ自身がこの例）。
- **社内限定ドキュメントの検索を安全に公開する**: カスタムドメインとCloudflare Accessを組み合わせ、認証済みユーザーやエージェントだけに検索エンドポイントを公開する。

## 所感・ポイント

- 今回のアップデートは、AI Search単体の機能追加というより「複数インスタンスをまたいだ検索」「外部公開のための認証・ブランディング」「既存CMSへの統合」など、RAGを"作って終わり"ではなく"運用する"段階で必要になるピースを埋めるものだと捉えると理解しやすい。
- Dev Stack MCPの実例は、MCPサーバーの実装をWorker側で自作するか、コード不要のパブリックエンドポイントで済ませるかを選べる点が特徴的で、既存のCloudflareプロダクトへの組み込みやすさを重視した設計がうかがえる。
- ボットポリシー（`Cloudflare-AI-Search` という固有のUser-Agentでの自己識別、robots.txt遵守）が明記されている点は、AI系クローラーに対する透明性への配慮として押さえておきたいポイント。
- 価格体系は「取り込み（一度きりに近いコスト）」と「クエリ（継続的なコスト）」を分けて考える設計になっており、記事中の試算例（初月約$35→翌月以降約$21）はコスト見積もりの参考になる。
- デフォルトのWorkers AIモデルを使う場合、埋め込みと再ランキングが無料という点は、小〜中規模のドキュメント検索を試す際の心理的なハードルを下げている。

> **Workers サンプル**: [examples/ai-search-easier/](../../examples/ai-search-easier/) — `ai_search_namespaces` バインディングで単一・複数インスタンス横断検索エンドポイントを実装した最小Worker。

## 関連リンク

- [Cloudflare AI Search ドキュメント](https://developers.cloudflare.com/ai-search/)
- [EmDash（OSSのヘッドレスCMS）](https://github.com/emdash-cms/emdash)
- [EmDash AI Search統合のドキュメント](https://docs.emdashcms.com/deployment/cloudflare/#cloudflare-ai-search)
- [AI Playground（Dev Stack MCPを含むAI Searchの動作を試せる）](https://playground.ai.cloudflare.com)
- [Cloudflare MCP Server（GitHubリポジトリ）](https://github.com/cloudflare/mcp-server-cloudflare)
