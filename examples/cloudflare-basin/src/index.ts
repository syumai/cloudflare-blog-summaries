// Pipelines（Basin Pipelines）のストリームにイベントを送る最小の Worker。
// POST /events で受け取った JSON を、Workers バインディング経由でストリームへ書き込む。
// ストリーム → シンク（Iceberg テーブル）→ クエリ の部分は Pipelines の SQL と
// Basin Catalog / Basin SQL 側で設定する（README を参照）。

import type { Pipeline } from "cloudflare:pipelines";

interface Env {
  EVENTS: Pipeline<EventRecord>;
}

// ストリームのスキーマに合わせたレコード型。
interface EventRecord extends Record<string, unknown> {
  account_id: string;
  user_id: string;
  event_type: string;
  event_time: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (request.method !== "POST" || url.pathname !== "/events") {
      return new Response("POST /events with {account_id, user_id, event_type}", { status: 404 });
    }

    const body = (await request.json()) as Partial<EventRecord>;
    if (!body.account_id || !body.user_id || !body.event_type) {
      return Response.json({ error: "account_id, user_id, event_type are required" }, { status: 400 });
    }

    const record: EventRecord = {
      account_id: body.account_id,
      user_id: body.user_id,
      event_type: body.event_type,
      event_time: new Date().toISOString(),
    };

    // バインディングの send() にはレコードの配列を渡す。
    await env.EVENTS.send([record]);
    return Response.json({ accepted: 1, record });
  },
} satisfies ExportedHandler<Env>;
