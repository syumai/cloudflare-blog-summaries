/**
 * mcp-v2 サンプル: ステートレスな MCP サーバーを素の Cloudflare Workers 上で動かす
 *
 * 元記事「次世代のMCP — ステートレスなプロトコルへ生まれ変わったModel Context Protocol」
 * (https://blog.cloudflare.com/mcp-v2/) が説明する MCP 2026-07-28 仕様の核心は、
 * MCP がハンドシェイクやセッションIDを前提としない「ステートレスなプロトコル」に
 * 生まれ変わったことです。これにより、MCP サーバーを構築するのに Durable Object
 * ベースの `McpAgent` は必須ではなくなり、通常の Workers の `fetch` ハンドラーだけで
 * MCP サーバーを実装できるようになりました。
 *
 * このサンプルは、公式 MCP TypeScript SDK に正式採用された `createMcpHandler`
 * (`agents/mcp/server` からエクスポートされる、Cloudflare Agents SDK 版) を使い、
 * ツールを2つ持つ最小の MCP サーバーを実装したものです。Durable Object も
 * `Agent` クラスの継承も一切登場しません。
 */
import { McpServer } from "@modelcontextprotocol/server";
import { createMcpHandler } from "agents/mcp/server";
import { z } from "zod";

function createServer() {
  const server = new McpServer({
    name: "mcp-v2-example",
    version: "1.0.0",
  });

  // 記事内のコード例（「新しいSDK群」節）と同じ形の、最小のあいさつツール。
  server.registerTool(
    "hello",
    {
      description: "Return a greeting for the given name",
      inputSchema: { name: z.string().optional() },
    },
    async ({ name }) => ({
      content: [
        {
          type: "text" as const,
          text: `Hello, ${name ?? "World"}!`,
        },
      ],
    }),
  );

  // ステートレス化のポイントを体験するための2つ目のツール。
  // 呼び出しごとに完結する（前回の呼び出しの状態を一切参照しない）ことを
  // タイムスタンプの返却によって確認できる。
  server.registerTool(
    "current_time",
    {
      description:
        "Return the current server time. Each call is fully self-contained " +
        "and does not depend on any prior request (no session state).",
      inputSchema: {},
    },
    async () => ({
      content: [
        {
          type: "text" as const,
          text: new Date().toISOString(),
        },
      ],
    }),
  );

  return server;
}

// createMcpHandler は、通常の Workers fetch ハンドラーとしてそのまま
// 呼び出せる関数を返す。Durable Object のクラス定義は不要。
const mcpHandler = createMcpHandler(createServer, { route: "/mcp" });

export default {
  async fetch(request: Request, env: unknown, ctx: ExecutionContext) {
    const url = new URL(request.url);

    if (url.pathname === "/") {
      return new Response(
        "mcp-v2 example worker.\n" +
          "POST JSON-RPC requests (Content-Type: application/json) to /mcp.\n" +
          "See README.md for a curl example.\n",
        { headers: { "content-type": "text/plain; charset=utf-8" } },
      );
    }

    return mcpHandler(request, env, ctx);
  },
} satisfies ExportedHandler;
