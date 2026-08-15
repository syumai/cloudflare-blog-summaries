/**
 * workers-ai-gateway-unification サンプル: `env.AI.run()` を "default" ゲートウェイ経由で呼ぶ
 *
 * 元記事「Workers AIとAI Gatewayを単一のAIコントロールプレーンへ統合」
 * (https://blog.cloudflare.com/workers-ai-gateway-unification/) の核心は、
 * `env.AI.run()` の第3引数に `{ gateway: { id: "default" } }` を渡すだけで、
 * 事前にダッシュボードで AI Gateway を作成しなくても自動的にロギング・
 * 可観測性（トークン使用量・コスト帰属・エラー率など）が有効になる、という
 * 「オプション引数1つの追加だけで既存コードに可観測性を足せる」体験です。
 *
 * このサンプルは、記事のコード例をほぼそのまま Worker として動かせる形に
 * したものです。
 */

interface Env {
  AI: Ai;
}

const MODEL = "@cf/meta/llama-3.1-8b-instruct" as const;

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/" && request.method === "GET") {
      return new Response(
        "workers-ai-gateway-unification example worker.\n" +
          'POST { "prompt": "..." } to /chat to run an inference request ' +
          'through the "default" AI Gateway.\n' +
          "See README.md for a curl example.\n",
        { headers: { "content-type": "text/plain; charset=utf-8" } },
      );
    }

    if (url.pathname === "/chat" && request.method === "POST") {
      const body = await request
        .json<{ prompt?: string }>()
        .catch(() => ({}) as { prompt?: string });
      const prompt = body.prompt ?? "What is the capital of France?";

      // 記事のコード例と同じ形: 第3引数に gateway.id: "default" を渡すだけで、
      // このリクエストが自動的に AI Gateway (default ゲートウェイ) を経由し、
      // ダッシュボードの Logs / Analytics で確認できるようになる。
      // ゲートウェイは初回リクエスト時に自動的に作成されるため、事前の
      // ダッシュボード操作は不要。
      const response = await env.AI.run(
        MODEL,
        {
          messages: [{ role: "user", content: prompt }],
        },
        {
          gateway: {
            id: "default",
          },
        },
      );

      return new Response(JSON.stringify(response), {
        headers: { "content-type": "application/json" },
      });
    }

    return new Response("Not Found", { status: 404 });
  },
} satisfies ExportedHandler<Env>;
