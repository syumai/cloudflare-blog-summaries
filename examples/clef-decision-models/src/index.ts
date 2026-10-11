// Clef（Workers AI 上の decision model）に、サポート問い合わせを分類させる最小サンプル。
// リクエスト形式は記事および Workers AI のモデルページ（@cf/cloudflare/clef）の記載に従う。
// 型定義（Ai.run のモデル名の型）に Clef が含まれない場合に備えて、呼び出しは緩く型付けしている。

interface Env {
  AI: Ai;
}

const DEFAULT_STATE = "Checkout has been failing for every customer for the last hour.";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    // ?state=... で分類対象のテキスト（問い合わせ文）を差し替えられる。
    const state = url.searchParams.get("state") ?? DEFAULT_STATE;

    const ai = env.AI as unknown as {
      run(model: string, input: unknown): Promise<unknown>;
    };

    const result = await ai.run("@cf/cloudflare/clef", {
      model: "clef",
      state,
      questions: {
        urgent: { type: "noul", instructions: "Is this support request urgent?" },
        team: {
          type: "choice",
          instructions: "Which team should handle this request?",
          criteria: {
            billing: "Payments, invoices, and refunds",
            technical: "Outages, errors, and configuration",
            sales: "Plans and upgrades",
          },
        },
        severity: {
          type: "score",
          instructions: "How severe is the customer impact?",
          criteria: ["No impact", "Minor", "Major", "Critical"],
        },
      },
    });

    // 応答には各質問の answers が含まれる（urgent: 確率 / team: 各選択肢の確率 / severity: 確率加重スコア）。
    return Response.json({ state, result });
  },
} satisfies ExportedHandler<Env>;
