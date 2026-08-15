# examples/python-workers-rpc/py/src/entry.py
#
# 記事「Workers RPC が Python と JavaScript 間で利用可能に」のコード例2に対応する。
# env.RPC 経由で ../ts の TypeScript Worker（RpcService.add）を、
# あたかもローカルの Python 関数のように呼び出す。

from workers import Response, WorkerEntrypoint


class Default(WorkerEntrypoint):
    async def fetch(self, request):
        # Get the RPC stub from the TypeScript Worker.
        rpc = self.env.RPC

        # Call the TypeScript RPC method.
        result = await rpc.add(42, 144)

        return Response.json({"result": result})
