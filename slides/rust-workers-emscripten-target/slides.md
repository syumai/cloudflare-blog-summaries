---
routerMode: hash
theme: default
title: "Workers でネイティブ Rust を動かす: wasm-bindgen の新 Emscripten ターゲット"
info: |
  Workers でネイティブ Rust を動かす: wasm-bindgen の新 Emscripten ターゲットの解説スライド。
  原文: https://blog.cloudflare.com/rust-workers-emscripten-target/
class: text-center
highlighter: shiki
drawings:
  persist: false
transition: slide-left
mdc: true
lineNumbers: true
themeConfig:
  primary: '#f6821f'
---

# Workers でネイティブ Rust を動かす
# wasm-bindgen の新 Emscripten ターゲット

Birthday Week 2026

<div class="pt-4 text-sm opacity-70">
原文: https://blog.cloudflare.com/rust-workers-emscripten-target/（英語版）<br>
公開日: 2026-09-28
</div>

---

# TL;DR

- wasm-bindgen と Rust Workers が <code>wasm32-unknown-emscripten</code> ターゲットを<strong>実験プレビュー</strong>として初サポート
- Emscripten がビルドを主導し、wasm-bindgen は軽量な JS バインディングを出力（<code>-sWASM_BINDGEN</code>）
- 最大の課題は Tokio。<strong>JSPI</strong> と <strong>LocalEventLoop</strong> の2方式で単一スレッドの JS イベントループに適合
- Emscripten に 40 本超の PR を送り、<code>-sNODERAWSOCKETS</code> で epoll・TCP・UDP を <code>node:net</code> 経由で提供
- 実証として Rust 製 Minecraft サーバー Pumpkin を Durable Object 上で稼働

---

# アジェンダ

- 背景: なぜ Emscripten ターゲットか
- wasm-bindgen と Emscripten の協調
- Rust ライブラリのサポート
- Tokio: JSPI と LocalEventLoop
- ソケットと epoll
- コード例
- 実証: Minecraft サーバー
- ユースケース・まとめ

---

# 背景・課題

- Workers の Rust は wasm-bindgen が支えているが、ネイティブ Rust のままの互換性には限界があった
- 低レベルライブラリ（<code>libc</code>・<code>socket2</code>・<code>Mio</code>）や Tokio が壁
- Google 社内: Emscripten（C++）と wasm-bindgen（Rust⇄JS）の両方が必要だが、どちらも「JS の出力は自分が管理する」前提で衝突

<div class="mt-6">
記事の狙い: <strong>ネイティブ Rust、さらには Tokio アプリも Workers でそのまま動かす</strong>
</div>

---

# wasm-bindgen と Emscripten の協調

| 役割 | 担当 |
|------|------|
| ビルド主導・Wasm ロード・補助 JS | Emscripten |
| Emscripten ライブラリ機構に入る可搬版 JS バインディング | wasm-bindgen |

- Google Portable Toolchains チームの Mitch Foley と Yifan Yang が設計
- 両プロジェクトのメンテナが相互の統合テストを保守することに合意
- <code>-sWASM_BINDGEN</code> で C++ ⇄ Rust の双方向のビルドが可能に

---

# Rust ライブラリのサポート

- Emscripten は <code>target_family = unix</code> を既にサポートしているため、多くのライブラリがそのまま動く
- <code>libc</code>・<code>socket2</code>・Mio は既存のプラットフォーム分岐に <code>target_os = "emscripten"</code> を加える程度のパッチで対応
- メンテナの反応も好意的だった
- 例外的に大掛かりだったのが <strong>Tokio</strong>（最初の対象パッチは上流に取り込み済み、残りはレビュー中）

---

# Tokio の課題

- Workers は単一スレッドで、JS イベントループの中にある
- Tokio は「待つ = スレッドを park」という前提
- 保留中のソケット読み取りや epoll wait で共有イベントループを止められない

<div class="mt-6">

**2つの解決策**

1. <strong>JSPI</strong>: Wasm スタックを停止して JS に制御を返す
2. <strong>LocalEventLoop</strong>: 待機をホストへの通知に置き換える

</div>

---

# アプローチ1: JSPI

- JSPI は同期的なブロッキング Wasm 呼び出しでスタックを停止 → Tokio の park と意味が一致
- 問題: Tokio のランタイムコンテキストはスレッドローカル。JSPI のスタック切替はスレッド切替ではない
- 停止中のスタックと新しいスタックが同じコンテキストを共有し、「既に enter 済み」で panic
- 対策: JSPI の enter / exit / suspend / resume ごとにスレッドローカルのコンテキストを入れ替える（協調的な時分割スレッド）
- 上流化は Tokio・Emscripten チームと進行中

---

# アプローチ2: LocalEventLoop の考え方

Tokio のランタイムは「(1) ready なタスクを poll → (2) 待つ」の繰り返し

- (1) → 1バッチ実行して戻る明示的な <code>drive()</code>
- (2) → ホストが所有する <code>Waker</code> による通知（wake）

<div class="mt-4">

- Waker は <code>Send + Sync</code> で、wake は作業を積むだけ。再入しない
- 唯一できないのは待つこと。<code>block_on</code> は park する場面で panic
- GTK・Win32・Cocoa にも組み込め、複数ランタイムが共存できる

</div>

---

# 通常の Tokio: スレッドが park する

<img src="https://blog.cloudflare.com/_emdash/api/media/file/01M3AJHGMPHKMEVGVE0Z21PS1B.01M3AJHJV8Y7S8Q7TZSZW8JV8A.png" class="mx-auto rounded mt-2" style="max-height: 330px;" />

<div class="text-xs opacity-70 mt-2">
ソケット読み取りで <code>epoll_wait</code> にスレッドが park する。出典: Cloudflare Blog https://blog.cloudflare.com/rust-workers-emscripten-target/
</div>

---

# LocalEventLoop: 制御をホストに返す

<img src="https://blog.cloudflare.com/_emdash/api/media/file/01M3HS8EF13M0YNPTD7AN9E51G.01M3HS8FGHK4FHG67Q9EFVQM60.png" class="mx-auto rounded" style="max-height: 360px;" />

<div class="text-xs opacity-70 mt-2">
待機中はホストに戻り、準備完了で Waker が通知 → <code>drive()</code>。出典: Cloudflare Blog https://blog.cloudflare.com/rust-workers-emscripten-target/
</div>

---
layout: two-cols
---

# コード例① 通常の Tokio

```rust
let rt = Builder::new_current_thread()
    .enable_all().build()?;
rt.block_on(async {
    let mut stream =
        TcpStream::connect(addr).await?;
    let mut buf = [0u8; 1024];
    // thread parks in epoll_wait
    let n = stream.read(&mut buf).await?;
    Ok::<_, io::Error>(())
})?;
```

::right::

<div class="mt-16 pl-4">

- <code>block_on</code> が完了まで現在のスレッドを占有
- <code>read</code> で未着データがあると、スレッドが <code>epoll_wait</code> で park
- Workers ではこの park が JS イベントループを止めてしまう

</div>

---
layout: two-cols
---

# コード例② LocalEventLoop

```rust
let el = Builder::new_current_thread()
    .enable_all()
    .build_local_event_loop(
        Default::default(), host_waker)?;

el.spawn_local(async {
    let mut stream =
        TcpStream::connect(addr).await?;
    let mut buf = [0u8; 1024];
    // control returns to the host
    let n = stream.read(&mut buf).await?;
    Ok::<_, io::Error>(())
});
```

::right::

<div class="mt-16 pl-4">

- <code>host_waker</code> はホストが所有する Waker
- <code>spawn_local</code> は即座に戻る
- 待機中はホストに制御が戻り、準備完了で Waker が通知 → ホストが <code>el.drive()</code>
- 提案段階の設計（API 名は変わる可能性あり）

</div>

---

# ソケットと epoll

- Emscripten は <code>poll()</code> と WebSocket エミュレーションのみ。Tokio の I/O ドライバが使う <code>epoll_wait()</code> がなかった
- 着眼点: Workers は既に Node.js 互換の <code>node:net</code> を提供している
- Emscripten の <code>-sNODERAWFS</code> と同じ発想でソケットを橋渡し
- 40 本超の PR で <strong><code>-sNODERAWSOCKETS</code></strong> が実現（epoll・TCP・UDP・Unix ソケット）
- JSPI: <code>epoll_wait()</code> がスタックを停止するだけ
- LocalEventLoop: <code>emscripten_epoll_add_listener</code>（提案）で Waker に通知し、次の <code>drive()</code> がゼロタイムアウトで回収

---

# 実証: Durable Object で Minecraft サーバー

Dan Lapid 氏が Rust 製 Pumpkin を週末で Durable Object 上に載せた

| 課題 | 解決 |
|------|------|
| マルチスレッド | tick・チャンク管理は async タスク、Rayon ジョブは Tokio タスク化 |
| ワールド永続化 | <code>std::fs</code> → <code>-sNODERAWFS</code> → worker-fs-mount → DO の SQLite |
| プレイヤー接続 | TCP ingress → <code>connect()</code> → <code>handleAsNodeConnection()</code> → <code>net.Server</code> |

---

# ユースケース

| 場面 | 内容 |
|------|------|
| Tokio ベースの Rust アプリ移植 | async I/O 前提のアプリを大きく書き換えず Workers へ |
| 低レベルクレートに依存する資産 | <code>libc</code>・<code>socket2</code>・Mio 依存のコードの再利用 |
| ゲームサーバー等の TCP サーバー | Durable Object と TCP ingress で状態を持つサーバーを稼働 |
| C++ と Rust の混在ビルド | <code>-sWASM_BINDGEN</code> で双方向に統合 |
| ホストイベントループとの統合 | GTK・Win32・Cocoa にも同じ構造を組み込める |

---

# まとめ・所感

- 実験的プレビュー。Tokio 対応の多くは上流の取り込み前
- Tokio の問題は「park できない環境で、待機をどうホストに返すか」。JSPI はスタック停止、LocalEventLoop は待機の通知化で解決
- <code>node:net</code>・<code>node:fs</code> を橋渡しに使い、専用 API を増やさなかった点が設計の要点
- 実験用パッチセットと専用ツールチェーンが前提のため、デプロイ可能なサンプルは作成していない

---

# 参考リンク

- 原文（en-us、日本語版なし）: https://blog.cloudflare.com/rust-workers-emscripten-target/
- Building Emscripten Rust Workers: https://github.com/cloudflare/workers-rs/tree/main/examples/emscripten
- Tokio in a Worker: https://github.com/cloudflare/workers-rs/tree/main/examples/emscripten-tokio
- TCP Sockets with Emscripten and Tokio: https://github.com/cloudflare/workers-rs/tree/main/examples/emscripten-tcp
- rust-workers-minecraft: https://github.com/danlapid/rust-workers-minecraft
- Wiki: [docs/articles/2026-09-28-rust-workers-emscripten-target.md](https://github.com/syumai/cloudflare-blog-summaries/blob/main/docs/articles/2026-09-28-rust-workers-emscripten-target.md)
