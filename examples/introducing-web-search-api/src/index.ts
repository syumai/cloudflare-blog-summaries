/**
 * introducing-web-search-api サンプル: Workers バインディングで Web Search API を呼ぶ
 *
 * 元記事「Introducing Web Search API via AI Gateway」
 * (https://blog.cloudflare.com/introducing-web-search-api/) の「Workers Bindings」
 * のコード例（`env.AI.websearch()`）を、そのまま動く Worker にしたものです。
 *
 * - GET  /search?q=...&provider=exa&limit=5 : 検索結果の JSON をそのまま返す
 * - POST /ask {"prompt": "..."}             : 記事の「Server tools」の例と同じ流れで、
 *   モデルが web_search ツールを呼んだら env.AI.websearch() を実行し、結果をモデルへ返す
 *
 * `env.AI.websearch` は記事のコード例に従って呼び出しています。型定義
 * (@cloudflare/workers-types) にまだ含まれていない可能性があるため、ここでは
 * 最小限のインターフェースを自前で宣言しています。
 */

import { requireAllowedAccess } from "../../shared/access";

type SearchOptions = {
  gatewayId: string;
  query: string;
  provider?: string;
  limit?: number;
};

interface Env {
  AI: Ai & { websearch(options: SearchOptions): Promise<Response> };
}

const MODEL = "@cf/google/gemma-4-26b-a4b-it";
const GATEWAY_ID = "default";

const tools = [
  {
    type: "function",
    function: {
      name: "web_search",
      description: "Search the web for current information.",
      parameters: {
        type: "object",
        properties: { query: { type: "string" } },
        required: ["query"],
      },
    },
  },
];

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Cloudflare Access で保護されたエンドポイント。許可メール以外は 403 になる。
    const denied = await requireAllowedAccess(ctx);
    if (denied) return denied;

    const url = new URL(request.url);

    if (url.pathname === "/" && request.method === "GET") {
      return new Response(
        "introducing-web-search-api example worker.\n" +
          "GET  /search?q=...&provider=exa&limit=5\n" +
          'POST /ask {"prompt": "..."}\n' +
          "See README.md for details.\n",
        { headers: { "content-type": "text/plain; charset=utf-8" } },
      );
    }

    // 記事の「Workers Bindings」と同じ呼び出し
    if (url.pathname === "/search" && request.method === "GET") {
      const query = url.searchParams.get("q");
      if (!query) return new Response("missing q", { status: 400 });
      const provider = url.searchParams.get("provider") ?? "exa";
      const limit = Number(url.searchParams.get("limit") ?? "5");

      const response = await env.AI.websearch({
        gatewayId: GATEWAY_ID,
        query,
        provider,
        limit,
      });
      const results = await response.json();
      return Response.json(results);
    }

    // 記事の「Coming soon: Server tools」のコード例に沿った、web_search をツールとして使う流れ
    if (url.pathname === "/ask" && request.method === "POST") {
      const body = await request.json<{ prompt?: string }>().catch(() => ({}) as { prompt?: string });
      const prompt = body.prompt ?? "What happened in the last Cloudflare Birthday Week in 2025?";
      const messages: unknown[] = [{ role: "user", content: prompt }];

      // AI の run() は実行時のモデル名に応じた入力型を要求するため、ここでは緩く扱う
      const ai = env.AI as unknown as {
        run(model: string, input: unknown, options: unknown): Promise<any>;
      };
      const options = { gateway: { id: GATEWAY_ID } };

      const completion = await ai.run(MODEL, { messages, tools }, options);
      const toolCall = completion.tool_calls?.[0];

      if (toolCall?.name !== "web_search") {
        return Response.json({ answer: completion.response, searched: false });
      }

      const response = await env.AI.websearch({
        gatewayId: GATEWAY_ID,
        query: toolCall.arguments.query,
        limit: 5,
      });
      const searchResults = await response.json();

      const finalResponse = await ai.run(
        MODEL,
        {
          messages: [
            ...messages,
            { role: "tool", name: "web_search", content: JSON.stringify(searchResults) },
          ],
        },
        options,
      );
      return Response.json({
        answer: finalResponse.response,
        searched: true,
        query: toolCall.arguments.query,
      });
    }

    return new Response("Not Found", { status: 404 });
  },
} satisfies ExportedHandler<Env>;
