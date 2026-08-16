// examples/local-tracing/src/index.ts
//
// 記事「エージェントがローカルトレースでWorkersをデバッグ可能に」で紹介されている
// シナリオ（KVからカートを取得し、D1にチェックアウト内容を保存する POST /api/orders が
// スキーマ変更後に500エラーを返すようになる）を再現した最小サンプル。
//
// wrangler.jsonc で observability.traces.enabled が有効なため、`wrangler dev` は
// このエンドポイントの呼び出しを自動的にOpenTelemetryトレースとして記録する。
// migrations/0002_add_delivery_window.sql を適用する前に POST すると、
// D1への挿入が "no such column: delivery_window" で失敗する様子と、
// Local Explorer API でその原因を特定する手順をREADMEで案内している。

import { requireAllowedAccess } from "../../shared/access";

export interface Env {
  CARTS: KVNamespace;
  DB: D1Database;
}

async function seedCart(env: Env, cartId: string): Promise<void> {
  await env.CARTS.put(
    cartId,
    JSON.stringify({ items: ["sku-1", "sku-2"] }),
  );
}

async function handleCreateOrder(request: Request, env: Env): Promise<Response> {
  const cartId = "demo-cart";

  // 事前準備: デモ用にカートを1件用意しておく（本来はチェックアウト前に別フローで作成される）。
  await seedCart(env, cartId);

  // 1. KVからアクティブなカートを取得する。
  const cartJson = await env.CARTS.get(cartId);
  if (!cartJson) {
    return new Response("Cart not found", { status: 404 });
  }
  const cart = JSON.parse(cartJson) as { items: string[] };

  // 2. D1にチェックアウト内容を保存する。
  //    migrations/0002_add_delivery_window.sql が未適用だと、
  //    delivery_window カラムが存在せず失敗する。
  const result = await env.DB.prepare(
    "INSERT INTO orders (cart_id, items_json, delivery_window) VALUES (?, ?, ?)",
  )
    .bind(cartId, JSON.stringify(cart.items), "morning")
    .run();

  return Response.json({ orderId: result.meta.last_row_id, cart });
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Cloudflare Access (https://developers.cloudflare.com/workers/configuration/cloudflare-access/)
    // で保護されたエンドポイント。syumai@gmail.com 以外は 403 になる。
    const denied = await requireAllowedAccess(ctx);
    if (denied) return denied;

    const url = new URL(request.url);

    if (url.pathname === "/api/orders" && request.method === "POST") {
      return handleCreateOrder(request, env);
    }

    return new Response(
      "POST /api/orders to reproduce the local-tracing scenario from the article.",
    );
  },
} satisfies ExportedHandler<Env>;
