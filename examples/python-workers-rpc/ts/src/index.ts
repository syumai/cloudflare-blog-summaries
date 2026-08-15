// examples/python-workers-rpc/ts/src/index.ts
//
// 記事「Workers RPC が Python と JavaScript 間で利用可能に」のコード例1に対応する
// RPC エントリポイント。WorkerEntrypoint を継承した RpcService に add メソッドを
// 実装するだけで、他の Worker（本サンプルでは ../py の Python Worker）から
// RPC 経由で呼び出せるようになる。

import { WorkerEntrypoint } from "cloudflare:workers";

export class RpcService extends WorkerEntrypoint {
  async add(a: number, b: number): Promise<number> {
    return a + b;
  }
}

// このサービス自体に直接 HTTP アクセスした場合の簡易な案内。
export default {
  async fetch(): Promise<Response> {
    return new Response(
      "This worker exposes RpcService.add(a, b) via Workers RPC. " +
        "Call it from ../py (Python Worker) via a service binding.",
    );
  },
} satisfies ExportedHandler;
