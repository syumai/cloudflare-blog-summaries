/**
 * introducing-radar-researcher サンプル: LLMに「チャート仕様」を発行させ、実データで解決する
 *
 * 元記事「平易な言葉でインターネットデータを探索するAIツール『Radar Researcher』のご紹介」
 * (https://blog.cloudflare.com/introducing-radar-researcher/) の Radar Researcher 本体は、
 * Agents SDK・Durable Objects・複数モデルのフォールバック・Cloudflare MCP server・
 * Code Mode を組み合わせた大規模なアプリケーションで、100行のサンプルでは再現できません。
 *
 * このサンプルは、記事が示す最も重要な設計上のポイント――**言語モデルに数値そのものを
 * 出力させず、Radar APIのエンドポイントを参照する「チャート仕様」を発行させ、実データは
 * 常にAPI呼び出しで取得する**、というハルシネーション対策の核心部分だけを最小構成で
 * 再現したものです。
 *
 * `POST /ask` に質問を送ると、
 *   1. Workers AI が質問に応じて `radar-chart` ブロック（記事と同じ形式）を含む
 *      短い説明文を生成する（具体的な数値は書かせない）
 *   2. Worker が実際に Cloudflare Radar API から実データを取得し、
 *      レスポンスに埋め込んで返す
 * という2段構成で、モデルの出力と実データを分離する設計を体験できます。
 *
 * RADAR_API_TOKEN が未設定でも Worker は起動する（実データ取得だけ省略される）。
 */

import { requireAllowedAccess } from "../../shared/access";

interface Env {
  AI: Ai;
  RADAR_API_TOKEN?: string;
}

// 記事のコード例（「コード例」節）と同じ、ポルトガルのインターネット速度品質サマリー。
const DEFAULT_RADAR_PATH = "/radar/quality/speed/summary?location=PT";

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Cloudflare Access (https://developers.cloudflare.com/workers/configuration/cloudflare-access/)
    // で保護されたエンドポイント。syumai@gmail.com 以外は 403 になる。
    const denied = await requireAllowedAccess(ctx);
    if (denied) return denied;

    const url = new URL(request.url);

    if (url.pathname === "/" && request.method === "GET") {
      return new Response(
        "introducing-radar-researcher example worker.\n" +
          'POST { "question": "...", "radarPath": "/radar/quality/speed/summary?location=PT" } to /ask.\n' +
          "See README.md for details.\n",
        { headers: { "content-type": "text/plain; charset=utf-8" } },
      );
    }

    if (url.pathname === "/ask" && request.method === "POST") {
      const body = await request
        .json<{ question?: string; radarPath?: string }>()
        .catch(() => ({}) as { question?: string; radarPath?: string });
      const question = body.question ?? "ポルトガルのインターネット品質はどうなっていますか？";
      const radarPath = body.radarPath ?? DEFAULT_RADAR_PATH;

      // 1. モデルには「radar-chart ブロックを発行するだけ」の役割を与える。
      //    数値そのものは書かせない（実データはAPIから取得する）。
      const aiResponse = await env.AI.run(
        "@cf/meta/llama-3.1-8b-instruct",
        {
          messages: [
            {
              role: "system",
              content:
                "You answer questions about Cloudflare Radar internet data. " +
                "Never invent specific numbers. After a short one-sentence " +
                "answer, always emit a fenced ```radar-chart block containing " +
                'JSON like {"type":"speedFlower","title":"...","dataFrom":"' +
                radarPath +
                '"}. Real numeric data is fetched separately from the API path ' +
                "in dataFrom, not from you.",
            },
            { role: "user", content: question },
          ],
        },
        { gateway: { id: "default" } },
      );

      // 2. 実データは常に Radar API から取得する（モデルの出力とは独立）。
      let radarData: unknown = null;
      let radarError: string | null = null;
      if (env.RADAR_API_TOKEN) {
        const apiResponse = await fetch(
          `https://api.cloudflare.com/client/v4${radarPath}`,
          { headers: { Authorization: `Bearer ${env.RADAR_API_TOKEN}` } },
        );
        if (apiResponse.ok) {
          radarData = await apiResponse.json();
        } else {
          radarError = `Radar API request failed: ${apiResponse.status}`;
        }
      } else {
        radarError = "RADAR_API_TOKEN is not configured; skipped fetching real data.";
      }

      return Response.json({
        modelOutput: aiResponse,
        radarPath,
        radarData,
        radarError,
      });
    }

    return new Response("Not Found", { status: 404 });
  },
} satisfies ExportedHandler<Env>;
