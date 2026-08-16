import { requireAllowedAccess } from "../../shared/access";

export interface Env {
  CLOUDFLARE_ACCOUNT_ID: string;
  COST_ALERT_THRESHOLD_USD: string;
  // Set via: wrangler secret put CLOUDFLARE_API_TOKEN
  CLOUDFLARE_API_TOKEN?: string;
}

interface BillableUsageRow {
  ServiceName: string;
  ServiceFamilyName: string;
  ContractedCost: number;
  ConsumedUnit: string;
  ChargePeriodStart: string;
  ChargePeriodEnd: string;
}

interface BillableUsageResponse {
  result: BillableUsageRow[];
  success: boolean;
  errors: unknown[];
}

async function fetchBillableUsage(env: Env): Promise<BillableUsageResponse> {
  const url = `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/billable-usage`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
    },
  });
  if (!res.ok) {
    throw new Error(`Billable Usage API error: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

function summarizeByService(rows: BillableUsageRow[]): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const row of rows) {
    totals[row.ServiceName] = (totals[row.ServiceName] ?? 0) + row.ContractedCost;
  }
  return totals;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Cloudflare Access (https://developers.cloudflare.com/workers/configuration/cloudflare-access/)
    // で保護されたエンドポイント。syumai@gmail.com 以外は 403 になる。
    // CLOUDFLARE_API_TOKEN secret 設定後に請求情報が未認証で見えてしまわないよう、
    // 全パスをガードする。
    const denied = await requireAllowedAccess(ctx);
    if (denied) return denied;

    if (!env.CLOUDFLARE_API_TOKEN) {
      return Response.json(
        {
          error:
            "CLOUDFLARE_API_TOKEN is not set. Run `wrangler secret put CLOUDFLARE_API_TOKEN` " +
            "with a token that has Billing Read permission to try this endpoint.",
        },
        { status: 501 },
      );
    }

    const url = new URL(request.url);
    if (url.pathname !== "/usage") {
      return new Response("Not found. Try GET /usage", { status: 404 });
    }

    try {
      const usage = await fetchBillableUsage(env);
      const totalsByService = summarizeByService(usage.result);
      const total = Object.values(totalsByService).reduce((a, b) => a + b, 0);
      return Response.json({ total, totalsByService, raw: usage.result });
    } catch (err) {
      return Response.json({ error: (err as Error).message }, { status: 502 });
    }
  },

  // Runs on the configured cron schedule (see wrangler.jsonc `triggers.crons`).
  // In production, replace the console.log below with a webhook call
  // (e.g. Slack incoming webhook) to actually page someone.
  async scheduled(_controller: ScheduledController, env: Env): Promise<void> {
    if (!env.CLOUDFLARE_API_TOKEN) {
      console.log("Skipping billable-usage check: CLOUDFLARE_API_TOKEN not set.");
      return;
    }

    const usage = await fetchBillableUsage(env);
    const total = usage.result.reduce((sum, row) => sum + row.ContractedCost, 0);
    const threshold = Number(env.COST_ALERT_THRESHOLD_USD);

    if (total > threshold) {
      console.log(
        `[ALERT] Billable usage $${total.toFixed(2)} exceeded threshold $${threshold.toFixed(2)}`,
      );
    } else {
      console.log(`Billable usage $${total.toFixed(2)} is within threshold $${threshold.toFixed(2)}`);
    }
  },
} satisfies ExportedHandler<Env>;
