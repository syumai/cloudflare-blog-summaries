# Cloudflare Workers と Containers がインバウンド TCP 接続と gRPC をサポート

- 原文: [https://blog.cloudflare.com/grpc-workers/](https://blog.cloudflare.com/grpc-workers/)（日本語版なし）
- 公開日: 2026-08-03
- 関連: [Agents Week 2026 まとめ](./2026-08-10-agents-week-review.md)（月曜日: 実行環境とインフラ）
- GitHub: [docs/articles/2026-08-03-grpc-workers.md](https://github.com/syumai/cloudflare-blog-summaries/blob/main/docs/articles/2026-08-03-grpc-workers.md)

![ヘッダー画像](https://blog.cloudflare.com/_emdash/api/media/file/01KZ21KXM2RY4NVVZ0GX7EFB2N.png)
*図: 記事ヘッダー画像（出典: Cloudflare Blog https://blog.cloudflare.com/grpc-workers/）*

## TL;DR

- Cloudflare Workers と Containers が、**インバウンドの TCP 接続**と **gRPC** をサポートするようになった（プライベートベータ）。
- 3つの発表が柱になっている: ① Worker が Spectrum 経由でインバウンドの TCP ソケットを受け付けられる **`connect(socket)` ハンドラー**、② Container 上で動く gRPC サーバーへソケットを転送し**双方向ストリーミング**を実現する仕組み、③ Worker 自身が Container を使わずに **gRPC サーバー／クライアント**として振る舞える **gRPC ⇄ gRPC-web 変換**。
- 背景には「AIによって人とコンピューターのやり取りが変わりつつあり、その中で音声（voice）の重要性が増している」という文脈があり、低レイテンシなリアルタイム音声アシスタントの多くが gRPC（HTTP/2・TCPを基盤とするRPCフレームワーク）で実装されている、という課題意識がある。
- 内部的には Cap'n Proto を使いながらも、外部に対しては gRPC を含む任意の言語・既存エコシステムをそのままサポートする設計。
- Cloudflareの**330以上の拠点**を活かした低レイテンシな通信基盤として位置づけられている。

## 背景・課題

記事は「AIが人とコンピューターのやり取りを変えつつあり、音声（voice）がその変化の中でますます重要な役割を担うようになっている」という文脈から始まる。リアルタイムの音声アシスタントを実現するには低レイテンシな通信が不可欠であり、多くの開発者はそのために **gRPC**（HTTP/2 と TCP を基盤とする Remote Procedure Call フレームワーク）を利用している。

一方、Cloudflare Workers はこれまでアウトバウンドの TCP 接続には対応していたものの、外部からのインバウンドの TCP 接続を直接受け付ける手段を持っていなかった。gRPC のような TCP ベースのプロトコルをネイティブに話すサーバーを Workers/Containers 上に構築するには、この「インバウンド TCP を受け付けられない」という制約が障壁になっていた。本記事は、この制約を解消する3つの新機能をまとめて発表するものである。

## 発表内容 / アーキテクチャ

### 3つの主要発表

1. **`connect(socket)` ハンドラー**: Worker が Spectrum（Cloudflareの非HTTPトラフィック用プロキシ）経由でインバウンドの TCP ソケットを受け付けられる新しいランタイムハンドラー。Worker コード内で直接ソケットの読み書きができる。
2. **Containers からのフルデュプレックス gRPC**: Worker がソケットを Container 上で動く gRPC サーバーに転送でき、クライアント・サーバー間の双方向ストリーミングを実現する。Cloudflareの**330拠点以上のネットワーク**を活かした低レイテンシ通信が可能になる。
3. **gRPC ⇄ gRPC-web 変換**: Worker は Container をデプロイしなくても gRPC サーバーやクライアントとして動作できる。プラットフォームが gRPC と gRPC-web の間を自動的に変換するため、（モバイルアプリなどの）ネイティブな gRPC クライアントが、Worker ベースのバックエンドと直接通信できる。

### `connect(socket)`: Durable Objects・Containers への転送

この節では、ソケット転送の使い方を段階的な3つの例で説明している。

1. Workerが直接ソケットを受け取り、テキストを書き込むだけの最小例
2. Durable Object 経由でコネクションをルーティングし、双方向にパイプする例
3. Durable Object からコンテナ化されたサービスへソケットを転送する例（コンテナ側はポート8080で待ち受けるPython製エコーサーバー）

### Cloudflare Containers からの双方向 gRPC

この節では、gRPCがリアルタイム音声AIアプリケーションにとってなぜ重要かを説明した上で、Goで実装した双方向ストリーミングのgRPCサーバー例を示している。サーバーはポート50051で待ち受け、クライアントから受け取ったメッセージをそのままエコーバックする `ByteStream` サービスを実装する。

### Worker を gRPC サーバー／クライアントにする: gRPC ⇄ gRPC-web 変換

この節ではまず、なぜ gRPC-web が必要なのかを説明する——「Webブラウザーは、gRPCが必要とする低レベルのHTTP/2機能を公開していない」ためである。Cloudflareのプラットフォームはこの2つのプロトコル間の変換を自動的に行う。続けて2つのコード例が示される。

1. `@connectrpc/connect` を使って、Worker を単項（unary）gRPCサーバーとして動作させる例
2. Worker から外部のgRPCサーバーへアウトバウンドのgRPCリクエストを送る例

### 今後の展望

これらの機能は現在プライベートベータであり、サインアップフォームから参加登録できる。今後はより広いプロトコルサポート（UDPベースのプロトコルなどが将来の方向性として言及されている）を計画しており、開発者からのフィードバックを募っている。

## コード例

記事では、単純なソケットのやり取りから、Durable Objects・Containers経由の転送、Goによる本格的なgRPCサーバー、Worker自身をgRPCサーバー／クライアントにする例まで、段階的に多数のコードが示されている。

### 例1: 最小のソケットハンドラー

```javascript
export default {
	async connect(socket): Promise<void> {
		const writer = socket.writable.getWriter();
		await writer.write(new TextEncoder().encode("Hello, world!\n"));
		await writer.close();
	},
} satisfies ExportedHandler;
```

**解説**: 新しい `connect(socket)` ハンドラーは、Spectrum経由で受け付けたインバウンドのTCPソケットをWorkerに渡す。`socket.writable.getWriter()` で書き込み用のWriterを取得し、テキストをエンコードして書き込んでいるだけの最小構成。

### 例2: Durable Object 経由でのソケットルーティング

```javascript
import { DurableObject } from "cloudflare:workers";

export class SocketDurableObject extends DurableObject<Env> {
	async connect(socket: Socket): Promise<void> {
		// Echo bytes from inside the Durable Object
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

**解説**: エントリポイントの `connect` ハンドラーは、受け取ったソケットを直接処理せず、`env.SOCKET_DO.getByName("my-server")` で取得した Durable Object のスタブに `connect("host:port")` して新たなソケットを開き、外部からのソケットとDurable Object側のソケットを双方向に `pipeTo` で接続している。Durable Object 内の `connect` メソッドでは、単純に読み取ったバイトをそのまま書き込み側にパイプしてエコーしている。

### 例3: Durable Object から Container へのソケット転送

```javascript
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

コンテナ側で待ち受けるPython製のエコーサーバー:

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

**解説**: `SocketContainer` は Durable Object のコンストラクタで `this.ctx.container!.start()` を呼びコンテナを起動する。`connect` メソッドでは `this.ctx.container!.getTcpPort(8080).connect(...)` によってコンテナのポート8080へのTCPソケットを開き、外部からのソケットとコンテナ側のソケットを双方向にパイプしている。コンテナ側はPythonの標準ライブラリ `socketserver` によるシンプルなエコーサーバーで、受信したバイト列の先頭に `"Echo: "` を付けて送り返す。

### 例4: gRPCサービス定義（Protocol Buffers）

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

### 例5: Go による双方向ストリーミング gRPC サーバー（コード読解）

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

func main() {
	listener, err := net.Listen("tcp", ":50051")
	if err != nil {
		log.Fatal(err)
	}

	grpcServer := grpc.NewServer()
	pb.RegisterByteStreamServer(grpcServer, &server{})

	log.Println("gRPC server listening on :50051")
	log.Fatal(grpcServer.Serve(listener))
}
```

**解説**: `Chat` メソッドは `pb.ByteStream_ChatServer` という双方向ストリームを受け取り、まず `"connected\n"` を送信してから、無限ループで `stream.Recv()` によりクライアントからのメッセージを受信し続ける。ストリームの終端（`io.EOF`）を検出すると `"goodbye\n"` を送って正常終了し、それ以外の受信では `"echo: "` を先頭に付けてそのまま送り返す。サーバーは `net.Listen("tcp", ":50051")` でポート50051を待ち受け、これが例3のコンテナ内で動作するサービスに相当する。この gRPC サーバー自体は標準の `google.golang.org/grpc` パッケージで書かれた一般的な実装であり、Cloudflare 固有のコードは含まれていない点がポイントである——**任意の言語・既存のgRPCエコシステムをそのまま使える**ことを示す例になっている。

### 例6: Worker を gRPC サーバーにする（gRPC-web変換）

```javascript
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

**解説**: `@connectrpc/connect` を使い、Container を一切使わずに、通常の Worker の `fetch` ハンドラーの中で gRPC サービス（例4で定義した `Greeter.sayHello`）を実装している。プラットフォーム側が gRPC-web ⇄ gRPC の変換を担うため、ネイティブな gRPC クライアント（モバイルアプリなど）からもこの Worker に直接アクセスできる。

### 例7: Worker から外部の gRPC サーバーを呼ぶ（クライアント）

```javascript
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

**解説**: `createGrpcWebTransport` に外部のgRPCサーバーの `baseUrl` を指定し、Worker組み込みの `fetch` を使ってトランスポート層を構成することで、Worker自身がgRPCクライアントとして外部サービスを呼び出せる。`redirect: "manual"` の指定は、Worker環境の `fetch` の挙動に合わせた設定である。

## ユースケース

### リアルタイム音声AIアプリケーション

記事の導入部で明示的に言及されている中心的なユースケース。低レイテンシが要求される音声アシスタントのバックエンドを、gRPCの双方向ストリーミングとCloudflareの330拠点以上のネットワークを活かして構築できる。

### モバイルアプリのバックエンド（gRPC-web変換経由）

ネイティブなgRPCクライアントを実装したモバイルアプリから、Containerのデプロイなしに、Worker側のgRPCサーバーへ直接アクセスできる。ブラウザが対応していない低レベルのHTTP/2機能を、プラットフォーム側のgRPC-web変換で吸収する。

### 既存言語・既存gRPCエコシステムを使ったバックエンドの構築

例5のGoサーバーのように、Cloudflare固有のSDKを使わない標準的なgRPC実装をContainer上でそのまま動かし、Workerからソケットを転送する形で統合できる。特定の言語やフレームワークに縛られずにgRPCサービスを構築できる点が強みとして示されている。

## 所感・ポイント

- 「Workerがインバウンドのソケットを受け付けられない」という長年の制約を、`connect(socket)` ハンドラーという単一のシンプルなAPIで解消しつつ、Durable Objects・Containersへの転送という既存の仕組みと自然に組み合わせられるよう設計されている点が印象的である。
- gRPCサポートを「Containerで完全なgRPCサーバーを動かす」パターンと「Worker自身がgRPC-web変換を介して軽量にgRPCを話す」パターンの2段構えで用意しており、用途に応じてコンテナの起動コストをかけるかどうかを選べる設計になっている。
- Go言語での標準的なgRPC実装がそのまま例として使われている点からも、Cloudflare固有の書き方を強制せず、既存のgRPCエコシステム・ツールチェーンをそのまま持ち込める設計思想がうかがえる。

> **Workers サンプル**: 対象外（本記事の中心機能であるインバウンドTCP接続・gRPCサポートは現時点でプライベートベータのため）

## 関連リンク

- [Handlers API ドキュメント](https://developers.cloudflare.com/workers/runtime-apis/handlers/)
- [Spectrum](https://developers.cloudflare.com/spectrum/)
- [Durable Objects](https://developers.cloudflare.com/durable-objects/)
- [Durable Objects Container API](https://developers.cloudflare.com/durable-objects/api/container/)
- [gRPC-web ドキュメント](https://grpc.io/docs/platforms/web/)
- [Connect RPC](https://connectrpc.com/)
- [Workers の発表（2017年）](https://blog.cloudflare.com/introducing-cloudflare-workers/)
- [アウトバウンドTCP接続のサポート](https://blog.cloudflare.com/workers-tcp-socket-api-connect-databases/)
- [Road to gRPC](https://blog.cloudflare.com/road-to-grpc/#converting-to-http11)
- [Workers での WebSockets サポート](https://blog.cloudflare.com/introducing-websockets-in-workers/)
- [Cap'n Web](https://blog.cloudflare.com/capnweb-javascript-rpc-library/)
- [JavaScript-native RPC](https://blog.cloudflare.com/javascript-native-rpc/)
- [gRPC 公式サイト](https://grpc.io/)
- [Cap'n Proto](https://capnproto.org/)
- [プライベートベータ サインアップフォーム](https://forms.gle/Q2SoJLUKjBFGxBgW6)
