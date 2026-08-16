---
routerMode: hash
theme: default
themeConfig:
  primary: '#f6821f'
title: Cloudflare Workers と Containers がインバウンド TCP 接続と gRPC をサポート
info: |
  Cloudflare Blog記事「Cloudflare Workers と Containers がインバウンド TCP 接続と gRPC をサポート」の解説スライド。
  原文: https://blog.cloudflare.com/grpc-workers/
class: text-center
highlighter: shiki
drawings:
  persist: false
transition: slide-left
mdc: true
lineNumbers: true
---

# Cloudflare Workers と Containers が
# インバウンド TCP 接続と gRPC をサポート

<div class="pt-4 text-sm opacity-70">
原文: https://blog.cloudflare.com/grpc-workers/<br>
公開日: 2026-08-03
</div>

---

# TL;DR


- Cloudflare WorkersとContainersが、インバウンドの**TCP接続**と**gRPC**をサポート（プライベートベータ）
- 3つの柱: `connect(socket)`ハンドラー・Container上gRPCサーバーへの双方向ストリーミング転送・WorkerのgRPC⇄gRPC-web変換
- 背景には、低レイテンシな音声AIの多くがgRPCで実装されているという課題意識がある
- 内部はCap'n Protoを使いつつ、外部にはgRPCを含む既存エコシステムをそのまま提供。**330拠点以上**を活かした低レイテンシ通信基盤


---

# アジェンダ


- 背景: 音声AIとgRPCという課題
- 3つの発表
- `connect(socket)`: Durable Objects・Containersへの転送
- Containersからの双方向gRPC
- WorkerをそのままgRPCサーバー／クライアントに
- コード例
- ユースケース
- 今後の展望


---

# 背景: 音声AIと低レイテンシ通信


- AIが人とコンピューターのやり取りを変えつつあり、**音声**（voice）の重要性が増している
- リアルタイム音声アシスタントには**低レイテンシな通信**が不可欠
- 多くの開発者はそのために **gRPC**（HTTP/2・TCPを基盤とするRPCフレームワーク）を利用



Workersはこれまで**アウトバウンド**のTCP接続には対応していたが、
**インバウンド**のTCP接続を直接受け付ける手段がなかった


---

# 3つの発表


1. **`connect(socket)` ハンドラー**: Spectrum経由でインバウンドTCPソケットを受け付ける新しいランタイムハンドラー
2. **Containersからのフルデュプレックスな gRPC**: Container上のgRPCサーバーへソケットを転送し双方向ストリーミング
3. **gRPC ⇄ gRPC-web 変換**: Containerなしで Worker 自身がgRPCサーバー／クライアントに



Cloudflareの **330拠点以上**のネットワークを活かした低レイテンシ通信


---
class: text-center
---

# `connect(socket)`
# Durable Objects・Containersへの転送

---

# コード例① 最小のソケットハンドラー

```ts {1-2|3-4|5|all}
export default {
	async connect(socket): Promise<void> {
		const writer = socket.writable.getWriter();
		await writer.write(new TextEncoder().encode("Hello, world!\n"));
		await writer.close();
	},
} satisfies ExportedHandler;
```


新しい `connect(socket)` ハンドラーが、Spectrum経由のインバウンドTCPソケットをWorkerに渡す。
`socket.writable.getWriter()` で直接読み書きできる


---

# コード例② Durable Object 経由のルーティング

```ts {1-6|9-17|all} {maxHeight:'380px'}
import { DurableObject } from "cloudflare:workers";

export class SocketDurableObject extends DurableObject<Env> {
	async connect(socket: Socket): Promise<void> {
		await socket.readable.pipeTo(socket.writable);
	}
}

export default {
	async connect(socket, env): Promise<void> {
		const stub = env.SOCKET_DO.getByName("my-server");
		const durableObjectSocket = stub.connect("host:port");

		await Promise.all([
			socket.readable.pipeTo(durableObjectSocket.writable),
			durableObjectSocket.readable.pipeTo(socket.writable),
		]);
	},
} satisfies ExportedHandler<Env>;
```

<div class="text-sm opacity-70 pt-2">
外部ソケットとDurable Object側のソケットを双方向に pipeTo で接続
</div>

---

# コード例③ Container へのソケット転送

外部ソケットをContainer内のサービスへ橋渡しする実装。
次のコードの `start()` ・ `getTcpPort` ・ `pipeTo` に注目

- `this.ctx.container!.start()` でコンテナを起動
- `getTcpPort(8080).connect(...)` でコンテナの8080番ポートへ接続
- `containerSocket.opened` で接続確立を待機
- 外部ソケットとコンテナ側ソケットを双方向に `pipeTo` で接続

---

# Container へのソケット転送（コード例）

```ts {1-3|8-16|all} {maxHeight:'380px'}
import { DurableObject } from "cloudflare:workers";

export class SocketContainer extends DurableObject<Env> {
	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);
		this.ctx.container!.start();
	}

	async connect(socket: Socket): Promise<void> {
		const containerSocket = this.ctx.container!
			.getTcpPort(8080)
			.connect("10.0.0.1:8080");

		await containerSocket.opened;

		await Promise.all([
			socket.readable.pipeTo(containerSocket.writable),
			containerSocket.readable.pipeTo(socket.writable),
		]);
	}
}
```

---

# コンテナ側: Python製エコーサーバー

```python
# server.py
import socketserver

class Handler(socketserver.BaseRequestHandler):
    def handle(self):
        while data := self.request.recv(64 * 1024):
            self.request.sendall(b"Echo: " + data)

class Server(socketserver.ThreadingTCPServer):
    allow_reuse_address = True
    daemon_threads = True

with Server(("0.0.0.0", 8080), Handler) as server:
    server.serve_forever()
```


前ページの `getTcpPort(8080)` が接続する相手。`recv` したデータの先頭に
`Echo: ` を付けて `sendall` で送り返すだけの最小TCPエコーサーバー


---
class: text-center
---

# Containersからの
# 双方向 gRPC

---

# gRPCサービス定義（Protocol Buffers）

```protobuf
syntax = "proto3";

package hello;

service Greeter {
  rpc SayHello (HelloRequest) returns (HelloReply);
}

message HelloRequest {
  string name = 1;
}

message HelloReply {
  string message = 1;
}
```

---

# コード例④ Go による双方向ストリーミングgRPCサーバー

標準の `google.golang.org/grpc` を使う一般的な実装で**Cloudflare固有のコードは無い**。
任意の言語・既存のgRPCエコシステムをそのまま使えることを示す例

次の3枚のコードでは以下に注目

- **1/3**: 接続直後に `stream.Send` で `"connected\n"` を送信
- **2/3**: `stream.Recv()` のループ。`io.EOF` なら `"goodbye\n"` を送って終了、それ以外は `"echo: "` を付けて送り返す
- **3/3**: ポート50051で待ち受け（例③のコンテナ内サービスに相当）

---

# コード例④ Go による双方向ストリーミングgRPCサーバー（1/3: セットアップと接続）

```go
package main

import (
	"io"
	"log"
	"net"

	pb "example/proto"
	"google.golang.org/grpc"
)

type server struct {
	pb.UnimplementedByteStreamServer
}

func (server) Chat(stream pb.ByteStream_ChatServer) error {
	if err := stream.Send(&pb.ByteChunk{
		Payload: []byte("connected\n"),
	}); err != nil {
		return err
	}
```

---

# コード例④ Go による双方向ストリーミングgRPCサーバー（2/3: 受信ループ）

```go
	for {
		message, err := stream.Recv()

		if err == io.EOF {
			return stream.Send(&pb.ByteChunk{
				Payload: []byte("goodbye\n"),
			})
		}
		if err != nil {
			return err
		}

		if err := stream.Send(&pb.ByteChunk{
			Payload: append([]byte("echo: "), message.Payload...),
		}); err != nil {
			return err
		}
	}
}
```

---

# コード例④ Go による双方向ストリーミングgRPCサーバー（3/3: サーバー起動）

```go
func main() {
	listener, err := net.Listen("tcp", ":50051")
	if err != nil {
		log.Fatal(err)
	}

	grpcServer := grpc.NewServer()
	pb.RegisterByteStreamServer(grpcServer, &server{})

	log.Fatal(grpcServer.Serve(listener))
}
```

---
class: text-center
---

# Workerを
# gRPCサーバー／クライアントに

---

# なぜ gRPC-web が必要か


> Webブラウザーは、gRPCが必要とする
> 低レベルのHTTP/2機能を公開していない



プラットフォームが **gRPC ⇄ gRPC-web** の変換を自動的に行う


---

# コード例⑤ WorkerをそのままgRPCサーバーに（1/2）

```ts
import { createConnectRouter } from "@connectrpc/connect";
import {
  universalServerRequestFromFetch,
  universalServerResponseToFetch,
} from "@connectrpc/connect/protocol";
import { Greeter } from "./gen/hello_pb";

const router = createConnectRouter();

router.service(Greeter, {
  sayHello: ({ name }) => ({ message: `Hello, ${name}!` }),
});
```

<div class="text-sm opacity-70 pt-2">
Connect RPCのルーターに gRPC サービス定義とハンドラー実装を登録する
</div>

---

# コード例⑤ WorkerをそのままgRPCサーバーに（2/2）

```ts
const handlers = new Map(
  router.handlers.map((handler) => [handler.requestPath, handler]),
);

export default {
  async fetch(request: Request): Promise<Response> {
    const handler = handlers.get(new URL(request.url).pathname);
    return universalServerResponseToFetch(
      await handler(universalServerRequestFromFetch(request, {})),
    );
  },
} satisfies ExportedHandler;
```

<div class="text-sm opacity-70 pt-2">
Containerなしで通常の fetch ハンドラー内にgRPCサービスを実装
</div>

---

# コード例⑥ Workerからの外部gRPC呼び出し

```ts {1-3|5-12|14-19|all} {maxHeight:'380px'}
import { createClient } from "@connectrpc/connect";
import { createGrpcWebTransport } from "@connectrpc/connect-web";
import { Greeter } from "./gen/hello_pb";

const client = createClient(
  Greeter,
  createGrpcWebTransport({
    baseUrl: "https://grpc.example.com",
    fetch: (input, init) =>
      fetch(input, { ...init, redirect: "manual" }),
  }),
);

export default {
  async fetch(): Promise<Response> {
    const reply = await client.sayHello({ name: "Workers" });
    return Response.json(reply);
  },
} satisfies ExportedHandler;
```

<div class="text-sm opacity-70 pt-2">
Worker組み込みの fetch をトランスポートに使い、gRPCクライアントとして外部サービスを呼ぶ
</div>

---
class: text-center
---

# ユースケース

---

# ユースケース①: リアルタイム音声AI


- 記事の導入部で明示された中心的なユースケース
- 低レイテンシが要求される音声アシスタントのバックエンドを構築
- gRPCの双方向ストリーミング × 330拠点以上のネットワーク


---

# ユースケース②: モバイルアプリのバックエンド


- ネイティブなgRPCクライアントを実装したモバイルアプリから、Containerデプロイなしに直接アクセス
- ブラウザが対応していない低レベルHTTP/2機能を、gRPC-web変換で吸収


---

# ユースケース③: 既存gRPCエコシステムの活用


- Goサーバーの例のように、標準的なgRPC実装をそのままContainer上で動かせる
- 特定の言語・フレームワークに縛られずgRPCサービスを構築できる


---

# 今後の展望


- 現在は**プライベートベータ**（サインアップフォームから参加登録可能）
- より広いプロトコルサポートを計画（UDPベースのプロトコルなど）
- 開発者からのフィードバックを募集中


---

# まとめ


- `connect(socket)` によりWorkerが**インバウンドTCP**を受け付けられるように
- Durable Objects・Containersへのソケット転送と自然に組み合わせられる設計
- Container上の**フルgRPCサーバー**と、Worker自身の**軽量なgRPC-web変換**の2段構え
- 内部はCap'n Protoを使いつつ、外部には任意の言語・既存gRPCエコシステムをそのまま提供


---

<div class="text-center">

# 参考リンク

</div>

- 原文: [Cloudflare Workers and Containers now support inbound TCP connections and gRPC](https://blog.cloudflare.com/grpc-workers/)
- [Spectrum](https://developers.cloudflare.com/spectrum/)
- [Durable Objects Container API](https://developers.cloudflare.com/durable-objects/api/container/)
- [Connect RPC](https://connectrpc.com/)
- [gRPC-web ドキュメント](https://grpc.io/docs/platforms/web/)
- [プライベートベータ サインアップフォーム](https://forms.gle/Q2SoJLUKjBFGxBgW6)

<div class="pt-8 text-sm opacity-50">
Wiki: docs/articles/2026-08-03-grpc-workers.md
</div>
