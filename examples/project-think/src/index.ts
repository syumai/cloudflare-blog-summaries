// examples/project-think/src/index.ts
//
// 記事「Project Think：Cloudflareで次世代のAIエージェント構築」で発表された
// `@cloudflare/think`（Thinkベースクラス）の最小サンプル。
//
// 記事の「利用開始」セクションで示されている
//   export class MyAgent extends Think<Env> { getModel() { ... } }
// をベースに、記事内でハイライトされている以下の2機能を追加している。
//
//   1. 永続的なメモリ（`configureSession()` の `soul` / `memory` コンテキストブロック）
//      — モデルが `set_context` ツールで書き込み、DOのハイバネーションを越えて
//        SQLiteに永続化される「MEMORY」セクション。
//   2. 独自ツールの統合（`getTools()`）
//      — 記事の「フレームワークでなくビルディングブロック」節にある通り、
//        Thinkは組み込みのワークスペースツール・セッションツールに加えて
//        `getTools()` で返した独自ツールをエージェントループへマージする。
//
// Thinkは Durable Objects 上に構築されており、`Think` を継承したクラスは
// それ自体がDurable Objectとして動作する（`agents` パッケージの
// `routeAgentRequest()` がWebSocketチャットプロトコルへのルーティングを行う）。
// ファイバー（`runFiber`）・サブエージェント・実行ラダー（Dynamic Workers /
// Sandbox / Browser Run）・自己承認型拡張機能は、いずれも追加のバインディングや
// 外部リソースを要するため、本サンプルの対象外としている
// （Wikiの「サンプル対象外」注記を参照）。

import { Think } from "@cloudflare/think";
import type { Session } from "@cloudflare/think";
import { routeAgentRequest } from "agents";
import { tool, type ToolSet } from "ai";
import { z } from "zod";

export interface Env {
  AI: Ai;
  MyAgent: DurableObjectNamespace;
}

export class MyAgent extends Think<Env> {
  // getModel() が文字列を返す場合、Thinkに内蔵された workers-ai-provider が
  // `AI` バインディング経由でその文字列をWorkers AIのモデルIDとして解決する。
  // 記事の「利用開始」コード例と同じモデルID。
  getModel() {
    return "@cf/moonshotai/kimi-k2.5";
  }

  getSystemPrompt() {
    return (
      "あなたはCloudflare Workersについて答える技術アシスタントです。" +
      "簡潔かつ正確に回答してください。"
    );
  }

  // 記事「永続的なメモリと長い会話」節のコード例に対応。
  // "soul" は読み取り専用でシステムプロンプトの一部として常に先頭に置かれ、
  // "memory" はモデルが `set_context` ツールで書き込める可変ブロック。
  // ここに書かれた内容はDOのハイバネーションを越えてSQLiteに永続化される。
  configureSession(session: Session) {
    return session
      .withContext("soul", {
        provider: {
          get: async () =>
            "あなたはCloudflare Workersについて答える技術アシスタントです。",
        },
      })
      .withContext("memory", {
        description: "会話中に学んだ、ユーザーに関する重要な事実。",
        maxTokens: 2000,
      })
      .withCachedPrompt();
  }

  // 記事「フレームワークでなくビルディングブロック」節に対応。
  // 独自ツールは組み込みのワークスペースツール・セッションツールと自動的に
  // マージされ、同名の場合は独自ツールが優先される。
  getTools(): ToolSet {
    return {
      getWorkersLimits: tool({
        description:
          "Cloudflare Workersの無料プランにおける、リクエストあたりのCPU時間上限を返す",
        inputSchema: z.object({}),
        execute: async () => {
          return {
            plan: "free",
            cpuTimeMsPerRequest: 10,
            note: "有料プランでは上限を引き上げ可能。",
          };
        },
      }),
    };
  }
}

export default {
  async fetch(request: Request, env: Env) {
    return (
      (await routeAgentRequest(request, env)) ||
      new Response(
        "Not found. Think agent is routed by `agents`'s routeAgentRequest() " +
          "(e.g. WebSocket at /agents/my-agent/:name).",
        { status: 404 },
      )
    );
  },
} satisfies ExportedHandler<Env>;
