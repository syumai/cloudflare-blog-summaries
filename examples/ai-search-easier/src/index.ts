/**
 * ai-search-easier サンプル: AI Search 名前空間バインディングで横断検索エンドポイントを作る
 *
 * 元記事「Cloudflare AI Search: エージェントにあなたのデータのための検索エンジンを」
 * (https://blog.cloudflare.com/ai-search-easier/) の核心は、Workers AI・Vectorize・
 * R2・Browser Rendering を自分でつなぎ合わせる代わりに、単一の `ai_search_namespaces`
 * バインディングと `env.AI_SEARCH.search()` だけで検索/RAGエンドポイントを作れることです。
 *
 * このサンプルは、記事内のコード例（②Workerバインディング設定 / ③複数インスタンス
 * 横断検索ツールの実装）をそのまま最小の HTTP エンドポイントとして実装したものです。
 * `GET /search?instance=<id>&q=<query>` で単一インスタンス検索、
 * `GET /search?instance=<id1>&instance=<id2>&q=<query>` で複数インスタンスの
 * 横断検索を行います。
 *
 * 実際に結果を得るには、事前に `npx wrangler ai-search create` で対象インスタンスを
 * 作成し、wrangler.jsonc の namespace 名を合わせておく必要があります（README参照）。
 * インスタンスが存在しない状態でも Worker 自体のデプロイ・起動には影響しません。
 */

interface Env {
  AI_SEARCH: AiSearchNamespace;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/") {
      return new Response(
        "ai-search-easier example worker.\n" +
          "GET /search?instance=<id>&q=<query> to search a single AI Search instance.\n" +
          "GET /search?instance=<id1>&instance=<id2>&q=<query> for a cross-instance search.\n" +
          "See README.md for how to create an instance first.\n",
        { headers: { "content-type": "text/plain; charset=utf-8" } },
      );
    }

    if (url.pathname === "/search") {
      const instanceIds = url.searchParams.getAll("instance");
      const query = url.searchParams.get("q");

      if (instanceIds.length === 0 || !query) {
        return new Response(
          "Missing required query params: instance=<id> (repeatable) and q=<query>",
          { status: 400 },
        );
      }

      try {
        if (instanceIds.length === 1) {
          // 記事②の設定と同じ単一インスタンスへの検索。
          const instance = env.AI_SEARCH.get(instanceIds[0]);
          const result = await instance.search({
            query,
            ai_search_options: {
              retrieval: { max_num_results: 5 },
            },
          });
          return Response.json(result);
        }

        // 記事③のコード例と同じ、複数インスタンスを横断する検索。
        const result = await env.AI_SEARCH.search({
          query,
          ai_search_options: {
            instance_ids: instanceIds,
            retrieval: { max_num_results: 5 },
            reranking: { enabled: true },
          },
        });
        return Response.json(result);
      } catch (err) {
        return new Response(
          `AI Search request failed: ${err instanceof Error ? err.message : String(err)}\n` +
            "Has the instance been created with `npx wrangler ai-search create`?",
          { status: 502 },
        );
      }
    }

    return new Response("Not Found", { status: 404 });
  },
} satisfies ExportedHandler<Env>;
