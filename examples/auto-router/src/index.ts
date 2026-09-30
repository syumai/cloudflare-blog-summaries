// AI Gateway の Auto Router（モデルに cloudflare/auto を指定）を呼ぶ最小の Worker。
// GET /?q=... で質問を送り、Auto Router が選んだモデルと理由をレスポンスで返す。
// 呼び出し形式・レスポンスヘッダーは Auto Router のドキュメントに従う:
// https://developers.cloudflare.com/ai-gateway/features/auto-router/

interface Env {
  CLOUDFLARE_ACCOUNT_ID: string;
  CLOUDFLARE_GATEWAY_ID: string;
  CLOUDFLARE_API_TOKEN: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const q = new URL(request.url).searchParams.get("q") ?? "hello";

    const res = await fetch(
      `https://gateway.ai.cloudflare.com/v1/${env.CLOUDFLARE_ACCOUNT_ID}/${env.CLOUDFLARE_GATEWAY_ID}/compat/chat/completions`,
      {
        method: "POST",
        headers: {
          "cf-aig-authorization": `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
          "Content-Type": "application/json",
          // マルチターンのセッションでは同じ ID を送ると、ターン内で同じモデルが使われる
          "cf-aig-session-id": "demo-session",
        },
        body: JSON.stringify({
          model: "cloudflare/auto",
          messages: [{ role: "user", content: q }],
        }),
      },
    );

    const body = await res.json<{
      choices?: { message?: { content?: string } }[];
    }>();

    return Response.json(
      {
        // Auto Router が選んだモデルと理由（レスポンスヘッダー）
        routedModel: res.headers.get("cf-aig-routed-model"),
        routingReason: res.headers.get("cf-aig-routing-reason"),
        routingDecisionId: res.headers.get("cf-aig-routing-decision-id"),
        answer: body.choices?.[0]?.message?.content ?? body,
      },
      { status: res.status },
    );
  },
} satisfies ExportedHandler<Env>;
