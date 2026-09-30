// examples/real-time-issue-detection/src/index.ts
//
// 記事「Detect and send production issues straight to your agent」（Issues）に対応する最小サンプル。
//
// - GET /ok     : 正常に 200 を返す
// - GET /boom   : 未処理の例外を投げる（Issues が「同じバグ」として1つの issue にまとめる対象）
// - GET /broken : 壊れた JSON を parse して失敗する（記事のスクリーンショットにある
//                 "Unexpected end of JSON input" に相当する例外）
//
// どのリクエストでも、記事のコード例と同じ方法で tracing.getActiveSpan() に
// user.id / account.id / session.id を付与する。これらは issue の各 occurrence の
// Context に表示される。

import { tracing } from "cloudflare:workers";

// 実際のアプリでは認証情報から取得する。ここでは固定値・ヘッダーで代用する。
function getAuthDetails(request: Request) {
  return {
    userId: request.headers.get("x-user-id") ?? "usr_demo",
    accountId: "acct_demo",
    sessionId: request.headers.get("x-session-id") ?? "sess_demo",
  };
}

export default {
  async fetch(request: Request): Promise<Response> {
    const { userId, accountId, sessionId } = getAuthDetails(request);
    const span = tracing.getActiveSpan();
    span?.setAttribute("user.id", userId);
    span?.setAttribute("account.id", accountId);
    span?.setAttribute("session.id", sessionId);

    const { pathname } = new URL(request.url);

    if (pathname === "/boom") {
      throw new Error("Checkout failed: inventory record is missing");
    }
    if (pathname === "/broken") {
      JSON.parse('{"items": ['); // SyntaxError: Unexpected end of JSON input
    }
    return new Response("ok\n");
  },
} satisfies ExportedHandler;
