// examples/agents-on-cloudflare/src/index.ts
//
// 記事「Cloudflare Agentsの紹介」で発表されたエージェントトレーシング機能の
// 有効化方法（wrangler.jsonc の observability.traces.enabled）を体験するための
// 最小サンプル。Workers AI バインディングでモデルを1回呼び出すだけの
// シンプルな "エージェント" だが、トレーシングを有効化した状態でデプロイすると、
// このモデル呼び出しが Cloudflare ダッシュボードの Agents / Traces ビューに
// スパンとして記録される。
//
// 記事本文で紹介されている Think / Flue / AI SDK（wrapAISDK()）との統合は含まない。
// これらのフレームワークを使うと、エージェント・会話・ツール実行単位のスパンが
// 自動収集されるが、ここでは Workers AI バインディングを直接呼び出す最小構成にとどめる。

export interface Env {
  AI: Ai;
}

const DEFAULT_MODEL = "@cf/meta/llama-3.1-8b-instruct";

async function handleChat(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const question =
    url.searchParams.get("q") ??
    "2日間のリスボン旅行の見どころを1つだけ教えて";

  // このモデル呼び出しが Workers Observability のトレースとして記録される。
  // wrangler.jsonc で observability.traces.enabled: true にしていることが前提。
  const result = await env.AI.run(DEFAULT_MODEL, {
    messages: [
      {
        role: "system",
        content: "あなたは旅行プランを簡潔に提案するアシスタントです。",
      },
      { role: "user", content: question },
    ],
  });

  return Response.json({
    model: DEFAULT_MODEL,
    question,
    answer: result,
    note: "この呼び出しは Cloudflare ダッシュボードの Agents / Traces ビューで確認できます（observability.traces.enabled が有効な場合）。",
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/") {
      return handleChat(request, env);
    }

    return new Response("Not Found", { status: 404 });
  },
} satisfies ExportedHandler<Env>;
