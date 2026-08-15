/**
 * webmcp サンプル: HTMLRewriter によるエッジ注入で、既存サイトに WebMCP ツールを付与する
 *
 * 元記事「あらゆるWebサイトにWebMCPインターフェースを付与する」
 * (https://blog.cloudflare.com/webmcp/) の核心は、
 *   1. オリジンのHTML・コードには一切手を入れず、
 *   2. エッジ（Cloudflare の HTMLRewriter）が配信時に1行の <script> タグを注入し、
 *   3. そのブリッジスクリプトがブラウザの `document.modelContext.registerTool()`
 *      （WebMCP標準）を使って、AIエージェント向けの「ツール」をページに公開する
 * という3段構成です。
 *
 * このサンプルは、Worker が生成する簡易 Todo アプリを「オリジンのHTML」に見立て、
 * HTMLRewriter で `<body>` の直前にブリッジスクリプトタグを注入します。
 * ブリッジスクリプト自体は `/.webmcp/bridge.js` として同一オリジンから配信され、
 * ブラウザが WebMCP に対応していない場合は何もせず終了する（安全に無害化する）
 * よう実装しています。
 */

const ORIGIN_HTML = `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<title>WebMCP demo: Todo app</title>
</head>
<body>
<h1>Todo</h1>
<ul id="todo-list"></ul>
<script>
  // これが「オリジン側の既存コード」。WebMCP 対応のために一切変更していない。
  function addTodoItemToCollection(text) {
    const li = document.createElement("li");
    li.textContent = text;
    document.getElementById("todo-list").appendChild(li);
  }
</script>
</body>
</html>`;

// 記事内のコード例（「呼び出し可能（Callable）」節 / WebMCP紹介記事本体）とほぼ同じ、
// document.modelContext.registerTool() によるツール登録。
const BRIDGE_JS = `// Cloudflare が /.webmcp/bridge.js としてエッジから配信するブリッジスクリプト。
// WebMCP 非対応ブラウザでは document.modelContext が存在しないため、何もせず終了する。
if ("modelContext" in document) {
  document.modelContext.registerTool({
    name: "add-todo",
    description: "Add a new item to the user's active todo list",
    inputSchema: {
      type: "object",
      properties: {
        text: { type: "string", description: "The todo item text" }
      },
      required: ["text"]
    },
    async execute({ text }) {
      await addTodoItemToCollection(text);
      return { content: [{ type: "text", text: \`Added: "\${text}"\` }] };
    }
  });
}
`;

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/.webmcp/bridge.js") {
      return new Response(BRIDGE_JS, {
        headers: { "content-type": "application/javascript; charset=utf-8" },
      });
    }

    if (url.pathname === "/") {
      const originResponse = new Response(ORIGIN_HTML, {
        headers: { "content-type": "text/html; charset=utf-8" },
      });

      // エッジ注入: オリジンのHTMLはそのまま (ORIGIN_HTML) に、
      // </body> の直前に1行の <script> タグだけを差し込む。
      return new HTMLRewriter()
        .on("body", {
          element(element) {
            element.append(
              '<script type="module" src="/.webmcp/bridge.js" data-packs="todo"></script>',
              { html: true },
            );
          },
        })
        .transform(originResponse);
    }

    return new Response("Not Found", { status: 404 });
  },
} satisfies ExportedHandler;
