import { Workspace, type DurableObjectStorageLike } from "@cloudflare/computer";

export interface Env {
  WORKSPACE: DurableObjectNamespace;
}

/**
 * A Durable Object that owns a `@cloudflare/computer` Workspace: a
 * SQLite-backed virtual filesystem, using the isolate backend only
 * (no Containers, no AI model). This is the piece the article calls
 * the "hands" of an agent, minus the agent itself.
 */
export class WorkspaceDO implements DurableObject {
  private workspace: Workspace;

  constructor(state: DurableObjectState, _env: Env) {
    // `DurableObjectStorage` and `DurableObjectStorageLike` describe the
    // same SQLite-backed storage API with slightly different generic
    // signatures for `sql.exec(...)`; the cast is safe at runtime.
    this.workspace = new Workspace({
      storage: state.storage as unknown as DurableObjectStorageLike,
    });
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    try {
      if (request.method === "POST" && url.pathname === "/write") {
        const { path, content } = await request.json<{ path: string; content: string }>();
        if (!path || content === undefined) {
          return new Response("body must be { path, content }", { status: 400 });
        }
        const dir = path.slice(0, path.lastIndexOf("/")) || "/";
        await this.workspace.fs.mkdir(dir, { recursive: true });
        await this.workspace.fs.writeFile(path, content);
        return Response.json({ ok: true, path });
      }

      if (request.method === "GET" && url.pathname === "/read") {
        const path = url.searchParams.get("path");
        if (!path) return new Response("?path= is required", { status: 400 });
        const content = await this.workspace.fs.readFile(path, { encoding: "utf8" });
        return new Response(content as string, {
          headers: { "content-type": "text/plain; charset=utf-8" },
        });
      }

      if (request.method === "GET" && url.pathname === "/ls") {
        const dir = url.searchParams.get("path") ?? "/";
        const entries = await this.workspace.fs.readdir(dir);
        return Response.json(entries);
      }

      return new Response("Not found. Try POST /write, GET /read?path=, GET /ls?path=", {
        status: 404,
      });
    } catch (err) {
      return new Response(`Error: ${(err as Error).message}`, { status: 500 });
    }
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // A single named Workspace shared by every request in this demo.
    // In a real agent, you would key this by session/user/issue id.
    const id = env.WORKSPACE.idFromName("demo-workspace");
    const stub = env.WORKSPACE.get(id);
    return stub.fetch(request);
  },
} satisfies ExportedHandler<Env>;
