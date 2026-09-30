# Workers でネイティブ Rust を動かす: wasm-bindgen の新 Emscripten ターゲット

- 原文: [https://blog.cloudflare.com/rust-workers-emscripten-target/](https://blog.cloudflare.com/rust-workers-emscripten-target/)（公式の日本語版なし。英語版から日本語化）
- 公開日: 2026-09-28
- 関連: [Cloudflare 2026年度創業者レター](./2026-09-27-cloudflares-2026-annual-founders-letter.md)（同じ Birthday Week 2026 の記事）、[Workers と Containers がインバウンド TCP 接続と gRPC をサポート](./2026-08-03-grpc-workers.md)（`connect(socket)` によるインバウンド TCP）、[EmDash 1.0](./2026-09-28-emdash-cms-plugin-registry.md)（同じ Birthday Week 2026 の記事）
- GitHub: [docs/articles/2026-09-28-rust-workers-emscripten-target.md](https://github.com/syumai/cloudflare-blog-summaries/blob/main/docs/articles/2026-09-28-rust-workers-emscripten-target.md)

![ヘッダー画像](https://blog.cloudflare.com/_emdash/api/media/file/01M3AJHGRFR0ZE6MB7TYYXX16K.01M3AJHKNFWTPGSZVRX4VC9KM0.png)
*図: 記事ヘッダー画像（出典: Cloudflare Blog https://blog.cloudflare.com/rust-workers-emscripten-target/）*

## TL;DR

- wasm-bindgen と Rust Workers が、Rust の **`wasm32-unknown-emscripten` ターゲット**を初めて公開実験プレビューとしてサポートした。Tokio ベースを含むネイティブ Rust コードを Workers 上でそのまま動かせる。
- Google の Portable Toolchains チームが1年以上前に始めた取り組みが土台。Emscripten がビルドを主導し、wasm-bindgen は Emscripten のライブラリ機構に組み込める軽量な JS バインディングを出力する（`-sWASM_BINDGEN`）。
- 最大の課題は Tokio。単一スレッドの JS イベントループ上で動かすため、**JSPI**（スタック停止）と **LocalEventLoop**（`drive()` と Waker による協調型ランタイム）の2方式を実装した。
- Emscripten に 40 本超の PR を送り、`-sNODERAWSOCKETS` で epoll・TCP・UDP・Unix ソケットを Workers の `node:net` 経由で利用可能にした。
- 実証として、Rust 製 Minecraft サーバー Pumpkin を Durable Object 上で動かした。

## 背景・課題

Workers の V8 ベースのランタイムで動く Rust アプリは wasm-bindgen が支えている。しかし、`libc`・`socket2`・`Mio` のような低レベルのシステムライブラリや、スレッドとブロッキング I/O を前提とする Tokio ベースのアプリを、ネイティブ Rust のまま動かすのは難しかった（記事は「ライブラリ互換性の大幅な向上」が今回の狙いだと述べている）。

一方 Google 社内では、C++ 資産をつなぐ Emscripten と、Rust と JS をつなぐ wasm-bindgen の両方を使いたい需要があった。両者とも「自分が JS の読み込みと最終出力を管理する」前提で作られていたため衝突し、どちらか一方しか選べなかった。この衝突の解消が、Workers 側の互換性向上にもつながった。

## 発表内容 / アーキテクチャ

### wasm-bindgen の `wasm32-unknown-emscripten` ターゲット

Google の Mitch Foley と Yifan Yang が設計した分担は次のとおり。

- **Emscripten**: ビルドを主導し、Wasm モジュールのロードと補助 JS を提供する。
- **wasm-bindgen**: Emscripten のライブラリ機構にそのまま取り込める、小さな可搬版 JS バインディングを出力する。

両プロジェクトのメンテナが、相手に依存する統合テストを保守することに合意した上で変更が入った。結果として `-sWASM_BINDGEN` 設定により、(1) Emscripten が駆動する C++ コードを静的な wasm-bindgen Rust コードとビルドでき、(2) Rust コンパイラが駆動する wasm-bindgen アプリを Emscripten ターゲット向けにビルドでき、それぞれ両方のバインディング層が使える。

### Rust ライブラリのサポート

Emscripten は Rust の `target_family = unix` を既にサポートしているため、多くのライブラリがそのまま動いた。Emscripten を知らない一部（`libc`、`socket2`、Mio）は、既存のプラットフォーム分岐に `target_os = "emscripten"` を加える程度の軽微なパッチで済み、メンテナの反応も好意的だったという。例外的に大掛かりだったのが Tokio。

### Tokio のサポート: 2つのアプローチ

Workers は単一スレッドで JS イベントループの中にあるが、Tokio はスレッドの park（ブロック）を前提にしている。保留中のソケット読み取りや epoll wait で共有イベントループを止めることはできない。そこで次の2方式を実装した（`wasm32-unknown-emscripten` の最初のパッチは Tokio 本体に取り込み済みで、残りは上流でレビュー中）。

**1. JSPI（WebAssembly JavaScript Promise Integration）**

JSPI は同期的なブロッキング Wasm 呼び出しで Wasm スタックを停止し、制御を JS イベントループに戻せる。これは Tokio の park と意味が一致する。ただし Rust はスタックが入れ替わったことを知らず、Tokio のランタイムコンテキストはスレッドローカルで管理されている。JSPI のスタック切替はスレッド切替ではないため、停止中のスタックと新しいスタックが同じコンテキストを共有し、「既に enter 済み」で panic する。そこで JSPI の enter / exit / suspend / resume ごとにスレッドローカルのコンテキストを入れ替える（協調的な時分割スレッドのようなもの）。

**2. LocalEventLoop**

Tokio のランタイムは「(1) 準備完了のタスクを poll し切る → (2) 待つ」を繰り返す。ホストが自前のイベントループを持つ場合、(2) の待機がホストを止めてしまう。そこでループを2つに分ける。

- (1) は、ready なタスクを1バッチ実行して戻る明示的な `drive()` 操作にする。
- (2) は待機ではなく通知（wake）にする。ホストが所有する `std::task::Waker` を使い、「ランタイム自体を drive してほしい」とホストに知らせる。

Waker は `Send + Sync` で実行の意味を持たないため、別スレッドやホストのコールバック、`drive` 中の wake も「作業を積む」だけで再入せず、安全になる。唯一できないのは待つことで、`LocalEventLoop::block_on` は park する場面で panic する。同じ構造は GTK・Win32・Cocoa のループにも組み込め、複数のランタイムが共存できる。

![通常の Tokio ランタイムのソケット読み取りの呼び出し図](https://blog.cloudflare.com/_emdash/api/media/file/01M3AJHGMPHKMEVGVE0Z21PS1B.01M3AJHJV8Y7S8Q7TZSZW8JV8A.png)
*図: 通常の Tokio ランタイムでのソケット読み取り。スレッドが epoll_wait で park する（出典: Cloudflare Blog https://blog.cloudflare.com/rust-workers-emscripten-target/）*

![LocalEventLoop のソケット読み取りの呼び出し図](https://blog.cloudflare.com/_emdash/api/media/file/01M3HS8EF13M0YNPTD7AN9E51G.01M3HS8FGHK4FHG67Q9EFVQM60.png)
*図: LocalEventLoop の流れ。待機中はホストに制御を返し、準備完了で Waker がホストに知らせて drive される（出典: Cloudflare Blog https://blog.cloudflare.com/rust-workers-emscripten-target/）*

### ソケットと epoll のサポート

2方式で Tokio テストスイートの大半は通ったが、`net` 機能（TCP・UDP・Unix ソケット）が残った。Emscripten は `poll()` と WebSocket エミュレーションしか持たず、Tokio の I/O ドライバ（mio 経由）が使う `epoll_wait()` がなかったためである。

Cloudflare は、Workers が既に Node.js 互換レイヤーで `node:net` を提供していることに着目した。Emscripten には Node.js の FS API に橋渡しする `-sNODERAWFS` があり、同じ発想でソケットの橋渡しができる。この作業は 40 本超の PR として Emscripten に取り込まれ、**`-sNODERAWSOCKETS`** オプションになった。Workers も同じ `node:net` を実装するため、そのまま動く。

- JSPI 下では、Emscripten の `epoll_wait()` が準備完了までスタックを停止するだけなので、Tokio の I/O ドライバはネイティブ同様に動く。
- LocalEventLoop では、JS コールバックから Waker に準備完了を伝える必要がある。そこで epoll の ready イベントにコールバックを結びつける `emscripten_epoll_add_listener` API を提案した。次の `drive()` がゼロタイムアウトの `epoll_wait()` でイベントを回収するので、既存の I/O ドライバを変更せず使える。

### 実証: Durable Object で Minecraft サーバー

Dan Lapid 氏が、Rust 製の Pumpkin（[rust-workers-minecraft](https://github.com/danlapid/rust-workers-minecraft)）を週末で Durable Object 上に載せた。

- **スレッド**: Pumpkin はマルチコア前提で、ワールド生成のスレッドプール、ゲーム tick、チャンクスケジューラが別スレッドで動く。Durable Object のスレッドは1つなので、tick とスケジューラは async タスクに、Rayon のジョブは Tokio タスクにして、イベントループ上で協調動作させた。
- **永続化**: Pumpkin は通常の `std::fs` でワールドを保存する。`-sNODERAWFS` で FS 呼び出しが `node:fs` 互換レイヤーに転送され、[worker-fs-mount](https://github.com/danlapid/worker-fs-mount) の durable-object-fs バックエンドが、ファイルを Durable Object の SQLite の行として保存する。
- **ネットワーク**: プレイヤーの接続は Workers の TCP ingress から Worker の `connect()` ハンドラーに届き、Durable Object へ転送される。そこで `cloudflare:node` の `handleAsNodeConnection()` が、内部の `net.Server` にソケットを渡す。`-sNODERAWSOCKETS` が `TcpListener` を `net.Server` の上に実装しているため、Linux と同じようにプレイヤーを受け付けられる。

## コード例

記事に載っている主なコードは、通常の Tokio ランタイムと LocalEventLoop の対比である。

通常の Tokio（`block_on` 内でスレッドが `epoll_wait` に park する）:

```rust
let rt = Builder::new_current_thread().enable_all().build()?;
rt.block_on(async {
    let mut stream = TcpStream::connect(addr).await?;
    let mut buf = [0u8; 1024];
    // thread parks in epoll_wait here
    let n = stream.read(&mut buf).await?;
    Ok::<_, io::Error>(())
})?;
```

LocalEventLoop（`spawn_local` は即座に戻り、ホストが `el.drive()` で進める）:

```rust
let el = Builder::new_current_thread()
    .enable_all()
    .build_local_event_loop(Default::default(), host_waker)?;

el.spawn_local(async {
    let mut stream = TcpStream::connect(addr).await?;
    let mut buf = [0u8; 1024];
    // control flow returns to the host while waiting
    let n = stream.read(&mut buf).await?;
    Ok::<_, io::Error>(())
});
```

ポイントは、非同期タスクの本体はほぼ同じで、違いは「誰が待つか」である点。前者は Tokio が park して待つが、後者は待機をホストに委ねる。`build_local_event_loop` はホストの Waker を受け取る。なお、LocalEventLoop は提案段階の設計で、記事のコードは概念を示すものである。

## ユースケース

- **既存の Tokio ベースのネイティブ Rust アプリを Workers へ移植**: async I/O を前提とする Rust アプリを、大きく書き換えずに載せる。
- **低レベルライブラリを含む Rust の資産の再利用**: `libc`・`socket2`・Mio など、従来 Wasm では使いにくかったクレートに依存するコード。
- **TCP サーバー（ゲームサーバー等）を Durable Object で動かす**: Minecraft サーバーのように、状態を持つ長時間接続のサーバーを Workers TCP ingress と組み合わせる。
- **C++ と Rust の混在プロジェクト**: `-sWASM_BINDGEN` により、Emscripten の C++ コードと wasm-bindgen の Rust コードを同一ビルドで扱う。
- **GUI などホストのイベントループとの統合**: LocalEventLoop は、Workers 以外（GTK・Win32・Cocoa）にも同じ構造を組み込める。

## 所感・ポイント

- 今回は**実験的なプレビュー**で、Tokio 対応の多くは上流に取り込み前（例のアプリでは、パッチ適用済みのものを直接使う必要がある）。本番利用を前提に考える段階ではない。
- Tokio の問題を「スレッドを park できない環境で、待機をどうホストに返すか」と捉えると分かりやすい。JSPI は Wasm スタックを止めることで、LocalEventLoop は待機そのものを wake 通知に置き換えることで解いている。
- 既存の Node.js 互換レイヤー（`node:net`・`node:fs`）を橋渡しに使うことで、Emscripten 側にも Workers 側にも専用 API を増やさずに済ませた点が設計上の要点。
- 本記事の機能は、実験用パッチセットと Emscripten・Rust のツールチェーン一式が前提の実験プレビューで、100行程度の最小構成で再現できないため、デプロイ可能なサンプル（`examples/`）は作成していません。公式の例は [workers-rs/examples](https://github.com/cloudflare/workers-rs/tree/main/examples/emscripten) を参照してください。
- 記事の LocalEventLoop の設計・API 名（`build_local_event_loop`、`emscripten_epoll_add_listener` など）は提案・ドラフト段階で、正式版で変わる可能性があるため要確認。

## 関連リンク

- [Building Emscripten Rust Workers](https://github.com/cloudflare/workers-rs/tree/main/examples/emscripten)
- [Running the Tokio async runtime in a Worker](https://github.com/cloudflare/workers-rs/tree/main/examples/emscripten-tokio)
- [TCP Sockets on Workers with Emscripten and Tokio](https://github.com/cloudflare/workers-rs/tree/main/examples/emscripten-tcp)
- [wasm-bindgen Emscripten ドキュメント](https://wasm-bindgen.github.io/wasm-bindgen/reference/emscripten.html)
- [Emscripten `-sNODERAWSOCKETS`](https://emscripten.org/docs/tools_reference/settings_reference.html#noderawsockets)
- [Pumpkin（Rust 製 Minecraft サーバー）](https://pumpkinmc.org/) / [rust-workers-minecraft](https://github.com/danlapid/rust-workers-minecraft) / [worker-fs-mount](https://github.com/danlapid/worker-fs-mount)
- サンプル対象外: 実験的パッチセットと専用ツールチェーンが必要なため、本リポジトリの `examples/` は作成していません
