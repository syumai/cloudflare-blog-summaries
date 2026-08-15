/**
 * kitesurf サンプル: Browser Run の Kitesurf バックエンドでスクリーンショットを撮る
 *
 * 元記事「Kitesurfのご紹介 — Cloudflare Workers上で動く、エージェントファーストのブラウザ」
 * (https://blog.cloudflare.com/kitesurf/) の Kitesurf 自体は Cloudflare がホストする
 * ブラウザエンジンで、自分の Worker としてデプロイするものではなく、
 * Browser Run 経由で `browser=kitesurf` パラメータを付けて呼び出すサービスです。
 *
 * このサンプルは、記事内のコード例（「例2: Browser Run Quick Actionsでスクリーンショットを
 * 取得する」節の curl コマンド）を、そのまま Worker からのプロキシとして実装したものです。
 * `GET /screenshot?url=https://example.com` にアクセスすると、Worker が Browser Run の
 * Quick Actions API (`browser=kitesurf`) を呼び出し、取得した PNG をそのまま返します。
 *
 * CF_ACCOUNT_ID / CF_API_TOKEN が未設定でも Worker 自体は起動する。実際にスクリーンショット
 * を取得する際にのみこれらの値が必要になる（README参照）。
 */

interface Env {
  CF_ACCOUNT_ID?: string;
  CF_API_TOKEN?: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/") {
      return new Response(
        "kitesurf example worker.\n" +
          "GET /screenshot?url=<target-url> to capture a screenshot via " +
          "Browser Run's Kitesurf backend.\n" +
          "Requires CF_ACCOUNT_ID / CF_API_TOKEN secrets. See README.md.\n",
        { headers: { "content-type": "text/plain; charset=utf-8" } },
      );
    }

    if (url.pathname === "/screenshot") {
      const target = url.searchParams.get("url");
      if (!target) {
        return new Response("Missing ?url= query parameter", { status: 400 });
      }

      if (!env.CF_ACCOUNT_ID || !env.CF_API_TOKEN) {
        return new Response(
          "CF_ACCOUNT_ID / CF_API_TOKEN secrets are not configured. " +
            "See README.md for how to set them with `wrangler secret put`.",
          { status: 500 },
        );
      }

      // 記事の「例2」の curl コマンドと同じリクエストを Worker から送る。
      const apiUrl =
        `https://api.cloudflare.com/client/v4/accounts/${env.CF_ACCOUNT_ID}` +
        `/browser-run/screenshot?browser=kitesurf`;

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.CF_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: target }),
      });

      if (!response.ok) {
        const detail = await response.text();
        return new Response(
          `Browser Run request failed (${response.status}): ${detail}`,
          { status: 502 },
        );
      }

      return new Response(response.body, {
        headers: { "content-type": "image/png" },
      });
    }

    return new Response("Not Found", { status: 404 });
  },
} satisfies ExportedHandler<Env>;
