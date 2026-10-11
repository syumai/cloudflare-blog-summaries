---
routerMode: hash
theme: default
title: "Streamline: Cloudflare Stream と Workers でつくるカスタム動画パイプライン"
info: |
  Streamline: custom video pipelines with Cloudflare Stream and Workers の解説スライド。
  原文: https://blog.cloudflare.com/streamline/
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

# Streamline

Cloudflare Stream と Workers でつくるカスタム動画パイプライン

Birthday Week 2026 / Containers / Durable Objects / Stream

<div class="pt-4 text-sm opacity-70">
原文: https://blog.cloudflare.com/streamline/<br>
公開日: 2026-10-02
</div>

---

# TL;DR

- <strong>Streamline</strong> は、動画を加工してそのまま Live 配信・新しいホスト動画にする仕組みを Cloudflare 上で組む<strong>開発者向けプレイグラウンド</strong>（OSS + 公開デモ）
- 構成は <strong>Media Engine</strong>（Container 内: Go の Controller + FFmpeg）と <strong>Application</strong>（Workers + Durable Object）
- 入力は RTMPS / HLS / ウェブカメラ。出力は RTMPS または WebSocket プレビュー。処理は JSON 設定で定義
- セッションは <strong>Worker の接続と独立</strong>に動き続け、最大継続時間で必ず終了する
- 現状は Container の CPU 処理で、高画質・高フレームレートがボトルネック

---

# アジェンダ

- 背景: カスタム動画パイプラインに必要な実行環境
- アーキテクチャ: Media Engine と Application
- Container のライフサイクルとセッション管理
- API・パイプライン設定・各種入出力のコード例
- セキュリティ、プレイグラウンド、これから
- ユースケース、まとめ

---

# 背景: 「そのまま動く」を超えたいとき

<div class="text-left text-sm pt-2">

- Cloudflare Stream は多くの顧客にとって「そのまま動く」放送プラットフォーム
- ただし次のような要件では<strong>カスタムの動画処理パイプライン</strong>が必要
  - ライブ配信に動的な注釈を重ねたい
  - ホスト動画から、字幕を焼き込んだ別バージョンを作りたい

<div class="mt-6 p-4 border rounded">

動画ストリームは数分〜数時間続く。メディア処理は、開始したリクエストとは<strong>独立したライフサイクル</strong>を持つ必要がある。

</div>

</div>

---

# 実行環境に求められる条件とプリミティブ

<div class="text-left text-sm pt-2">

- 専用のコンパイル済みコードを動かせる、長時間動く環境で、メモリと CPU が予測可能
- アプリが、1 本のリクエストを開きっぱなしにせず、開始・入力送信・確認・停止をできる

| 役割 | 使うもの |
|---|---|
| メディア処理 | <strong>Containers</strong>（長時間動くランタイム） |
| オーケストレーション | <strong>Durable Objects</strong> |
| 制御・監視 | <strong>Workers</strong> |

</div>

---

# デモ画面: Webcam Picture-in-Picture

<div class="text-center">
<img src="https://blog.cloudflare.com/_emdash/api/media/file/01M3XKBENJCAB7M1N0K384578G.png" style="max-height: 320px; margin: 0 auto;" />
</div>

<div class="text-left text-sm pt-2">

- 左がウェブカメラの Local Preview、右が山道の車載映像にウェブカメラを重ねた Stream Output
- 上部のナビゲーション: Pass-Through / Overlay / Annotation / Picture-in-Picture / Filters / Subtitles / Probe

</div>

<div class="text-xs opacity-60 pt-1">出典: Cloudflare Blog https://blog.cloudflare.com/streamline/（キャプションは原文になく、画像内の文字からの記述）</div>

---

# アーキテクチャの全体像

<div class="text-center">
<img src="https://blog.cloudflare.com/_emdash/api/media/file/01M3XKBFY5MZA5TEY754FQWWJ4.png" style="max-height: 300px; margin: 0 auto;" />
</div>

<div class="text-left text-sm pt-2">

- <strong>Application</strong>（UI・Orchestrator）が、<strong>Media Engine</strong>（Controller・Processor）を制御
- 入力: ウェブカメラ、Stream の Live（RTMPS Pull）、ホスト動画（HLS）
- 出力: Stream Live へ RTMPS Push、または Durable Object への WebSocket プレビュー

</div>

<div class="text-xs opacity-60 pt-1">出典: Cloudflare Blog https://blog.cloudflare.com/streamline/（キャプションは原文になく、図中の文字からの記述）</div>

---

# Media Engine

<div class="text-left text-sm pt-2">

Container にホストされ、メディアの入出力と加工をすべて担う。

- <strong>Controller</strong>: Go 製の制御ハーネス。HTTP サーバーでリクエストを受け、操作に変換
- <strong>Processor</strong>: 実際のメディア処理。現在は FFmpeg だが、内部の実装詳細で API の一部ではない

| 方向 | 経路 |
|---|---|
| 入力 | Stream Live Input から RTMPS / ホスト動画の HLS / アプリ供給の映像 |
| 出力 | 別の Stream Live Input へ RTMPS / Durable Object へ WebSocket |

</div>

---

# Application

<div class="text-left text-sm pt-2">

Workers で作る。フルスタックのブラウザアプリ、エージェント、組み込みシステムのいずれもあり得る。

- <strong>UI</strong>: クライアントのロジック、ID・アクセスポリシー
- <strong>Orchestrator</strong>: セッション、Container のライフサイクル、プレビューのリレーを調整。<strong>Durable Object</strong> で実装

| 環境 | 構成 |
|---|---|
| ローカル開発 | Container はローカルの Docker。Durable Object なし。認可不要、WebSocket に直接接続 |
| Cloudflare にデプロイ | 認可されたユーザー/エージェントがセッションを開始。Container を必要に応じ起動し、入出力を Stream とやり取り |

</div>

---

# Container のライフサイクル

<div class="text-left text-sm pt-2">

- セッション開始後は、アプリが切断・再接続しても Container は<strong>停止されるまで処理を続ける</strong>
- <strong>最大継続時間</strong>を設け、外部の制御がなくても必ず終了する
- 処理中の Container インスタンスは、他のアプリからは使えない

<div class="mt-4 p-4 border rounded">

問題: Container は、一定間隔リクエストが無いと自動でスリープする。パイプライン実行中はリクエストが来なくても動き続ける必要がある。

</div>

</div>

---

# コード例: onActivityExpired() でスリープを防ぐ

```ts {all|3|4-7|8}
async onActivityExpired() {
  await this.withControlLock(async () => {
    const session = await this.getRelaySessionLocked()
    if (session?.expiresAt) {
      this.renewActivityTimeout()
      return
    }
    await this.destroy()
  })
}
```

<div class="text-sm pt-2">

- コールバックをオーバーライドし、<code>expiresAt</code> に達していなければ<strong>活動期限を更新</strong>
- 達していれば <code>destroy()</code> で Container を破棄する

</div>

---

# API: 2 つのパッケージと 8 つのメソッド

<div class="text-left text-sm pt-2">

| パッケージ（原文表記） | 内容 |
|---|---|
| <code>@cloudflare/streamline/client</code> | 高レベルのセッションベース API |
| <code>@cloudflare/streamline/</code> | Container に結びつく Durable Object の基底クラス（ルーティング・プレビューのリレー・セキュリティのフック） |

| メソッド | 機能 |
|---|---|
| <code>createStreamline()</code> / <code>sessions.create()</code> / <code>sessions.resume(id)</code> | インスタンス作成 / セッション作成 / 再接続 |
| <code>session.start(config)</code> / <code>session.stop()</code> | パイプラインの開始 / 停止 |
| <code>session.ingest(chunk)</code> / <code>session.annotation(png)</code> | 映像チャンク送信 / 透過オーバーレイ更新 |
| <code>session.metrics()</code> | メトリクス取得 |

</div>

---

# コード例: セッションを作って開始する

```ts {all|1|2|3|4-5}
const streamline = createStreamline({ baseUrl: 'https://media.example' })
const session = await streamline.sessions.create()
const result = await session.start(config)
// At this point the pipeline is running, unless failure occurred.
console.log(result)
```

<div class="text-sm pt-2">

- <code>config</code> は、<strong>Input(s) / Operations / Output</strong> を定義する JSON オブジェクト
- <code>start()</code> が返った時点でパイプラインは動いている（失敗時を除く）
- 操作は <code>filter</code> / <code>overlay</code> / <code>subtitle</code> / <code>encode</code> の 4 種類。適用順はエンジン側で固定で、配列の順序は意味を持たない

</div>

---

# コード例: ライブ入力にロゴを重ねて RTMP へ

```ts {all|3|4-9|10-18|20}
const session = await streamline.sessions.create()
const result = await session.start({
  input: { type: 'rtmp', profile: 'primary-input' },
  pipeline: [
    {
      op: 'overlay',
      params: { image: '/app/assets/cf-logo.png', position: 'top-right' },
    },
    {
      op: 'encode',
      params: {
        codec: 'h264',
        preset: 'fast',
        bitrate: '1500k',
        resolution: '1280x720',
        fps: 30,
      },
    },
  ],
  output: { mode: 'rtmp', profile: 'primary-output' },
})
```

<div class="text-sm pt-1">Stream Live Input の配信にロゴを重ね、別の Live Input へ。<code>profile</code> は名前付きで、URL とキーは Worker が解決する。</div>

---

# コード例: ホスト動画に字幕を焼き込む（HLS）

```ts {all|1-2|4-7|9|10-15|17}
const streamVideoId = 'your-cloudflare-stream-video-id'
const session = await streamline.sessions.create()
await session.start({
  input: {
    type: 'hls',
    url: `https://videodelivery.net/${streamVideoId}/manifest/video.m3u8`,
  },
  pipeline: [
    { op: 'subtitle', params: { source: 'auto' } },
    {
      op: 'encode',
      params: {
        codec: 'h264', preset: 'fast', bitrate: '1500k',
        resolution: '1280x720', fps: 30,
      },
    },
  ],
  output: { mode: 'rtmp', profile: 'default' },
})
```

<div class="text-sm pt-1">Stream のホスト動画を HLS で取り込み、埋め込み字幕を映像に描画。RTMP で録画・配信用の Live Input へ。</div>

---

# コード例: ウェブカメラ入力とプレビュー

```ts {all|1-4|6|8-10|11-17|19}
const session = await streamline.sessions.create()
const sessionId = session.id
if (!sessionId) throw new Error('Session creation returned no session ID')
const viewer = await openViewer('https://media.example', sessionId)
await session.start({
  input: { type: 'webcam' },
  pipeline: [
    { op: 'filter', params: { preset: 'brightness', amount: 0.1 } },
    { op: 'filter', params: { preset: 'flip' } },
    { op: 'overlay', params: { image: 'annotation', position: 'full' } },
    {
      op: 'encode',
      params: {
        codec: 'h264', preset: 'veryfast', bitrate: '1500k',
        resolution: '1280x720', fps: 30, gop: 60,
      },
    },
  ],
  output: { mode: 'websocket', format: 'fmp4' },
})
```

<div class="text-sm pt-1">先に <code>openViewer()</code> でリレーへ接続してから <code>start()</code>。<code>annotation</code> は更新できる PNG オーバーレイ。</div>

---

# コード例: ブラウザから映像を送る（ingest）

```ts {all|1-2|3|4-9|10}
const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp8,opus' })
let uploadTail = Promise.resolve()
recorder.addEventListener('dataavailable', (event) => {
  if (event.data.size === 0) return
  uploadTail = uploadTail
    .then(() => session.ingest(event.data))
    .catch((error) => reportUploadFailure(error))
})
recorder.start(250)
```

<div class="text-sm pt-2">

- <code>MediaRecorder</code> が 250 ms ごとにチャンクを出し、<code>session.ingest()</code> で Streamline へ
- <code>uploadTail</code> の Promise チェーンで、送信順序を保つ

</div>

---

# コード例: アニメーションするオーバーレイ

```ts {all|1-7|8-9}
function canvasPng(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('Canvas could not produce a PNG'))
    }, 'image/png')
  })
}
const png = await canvasPng(overlayCanvas)
await session.annotation(png)
```

<div class="text-sm pt-2">

- キャンバスを PNG にして <code>session.annotation()</code> へ。アニメーションループで繰り返せる
- 更新レートは、PNG のサイズ・帯域・処理能力で制限され得る

</div>

---

# プレビュー映像の受信

<div class="text-left text-sm pt-2">

- <code>output.mode</code> に <code>'websocket'</code> を指定すると、Container が <strong>fMP4 フラグメント</strong>を Durable Object へ発行
- Durable Object が、アプリのオリジン相対 <code>/relay/view</code> のリレーへ転送
- アプリはその URL に WebSocket を接続しておくと、映像を受け取る

<div class="mt-4 p-4 border rounded">

注意: <code>session.start()</code> の<strong>前</strong>にリレーへ接続する。さもないと、リレーが発行側を拒否する。本番の MediaSource プレーヤーは <code>SourceBuffer.updating</code> の間、フラグメントをキューに入れる。

</div>

</div>

---

# コード例: openViewer() とフラグメントの追記

```ts {all|1-4|5-9|12-18}
function openViewer(origin: string, sessionId: string): Promise<WebSocket> {
  const url = new URL('/relay/view', origin)
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
  url.searchParams.set('session_id', sessionId)
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(url)
    socket.binaryType = 'arraybuffer'
    socket.addEventListener('open', () => resolve(socket), { once: true })
    socket.addEventListener('error', () => reject(new Error('Preview relay failed')), { once: true })
  })
}
viewer.addEventListener('message', (event) => {
  if (typeof event.data === 'string') {
    if (event.data === '{"type":"eos"}') mediaSource.endOfStream()
    return
  }
  sourceBuffer.appendBuffer(new Uint8Array(event.data as ArrayBuffer))
})
```

<div class="text-sm pt-1">文字列 <code>&#123;"type":"eos"&#125;</code> は終了の合図。バイナリは <code>sourceBuffer</code> へ追記（<code>mediaSource</code> の初期化は原文の断片に無い）。</div>

---

# セキュリティ設計（1）: アクセスとキー

<div class="text-left text-sm pt-2">

| 項目 | 内容 |
|---|---|
| 非公開化 | Workers の <strong>Access 連携</strong>。制御リクエストの前に Access のセッションを検証し、アクティブなセッションを検証済み主体に結びつける |
| 同時実行 | 同時に動くセッションは 1 つ。別の主体は停止も置き換えもできない |
| Stream のキー | Worker のシークレット、または Durable Object ストレージの書き込み専用の共有オーバーライド。設定 API やブラウザのストレージには出さない |
| 参照方法 | 制御アプリは<strong>名前付きプロファイル</strong>で指定。Worker が Container に接触する前に解決 |

</div>

---

# セキュリティ設計（2）: プレビューの認証情報

<div class="text-left text-sm pt-2">

| 認証情報 | 役割 |
|---|---|
| Access の<strong>サービストークン</strong> | Container ワークロードを、発行側エンドポイントに対して認証 |
| セッションごとの<strong>ランダムな capability</strong> | 現在アクティブなリレーへの発行のみを認可 |

- サービストークンは、Container の<strong>アウトバウンド Worker</strong> が注入し、Container のメモリには入らない
- 初期デプロイは、パス限定の一時的な Access Bypass + capability。スモークテスト後に Service Auth へ置き換え

<div class="mt-4 p-4 border rounded">

オーナーのデプロイは意図的に非公開・シングルトン。<strong>公開のマルチユーザーサービス向けのセキュリティモデルではない。</strong>

</div>

</div>

---

# プレイグラウンドとオープンソース

<div class="text-left text-sm pt-2">

- <code>cloudflare/streamline</code>: Media Engine とアプリ向けパッケージ
- <code>cloudflare/streamline-demo</code>: 例の Worker アプリ、Astro フロントエンド、デプロイプロファイル、Access のツール
- デモには、オーバーレイ・字幕・フィルター・ピクチャー・イン・ピクチャーと、メトリクスとトレースを取る <strong>probe</strong> 機能
- 公開プレイグラウンドの制限: 検証済みユーザーごとに 1 Container ID・1 アクティブセッション、グローバルな受け入れ制御、同時実行・メディア・セッションの上限

</div>

---

# ユースケース 1: ライブ配信への注釈・ロゴ

<div class="text-left text-sm pt-2">

- Stream Live Input の RTMP を入力に <code>overlay</code> を適用し、別の Live Input へ出力
- <code>annotation()</code> で PNG を更新し続ければ、アニメーションするグラフィックも重ねられる
- Worker が切断されても処理は続くため、長時間の配信にも向く

</div>

---

# ユースケース 2: ホスト動画の字幕焼き込み版

<div class="text-left text-sm pt-2">

- Stream のホスト動画を HLS で取り込み、埋め込みクローズドキャプションを映像に描画
- 出力を Live Input に流して、<strong>別バージョンとして録画・配信</strong>する
- 字幕入りの別バージョンを、ホスト動画の入力から作れる

</div>

---

# ユースケース 3: ウェブカメラ・複数カメラの合成

<div class="text-left text-sm pt-2">

- ブラウザのウェブカメラを別の映像に重ねるピクチャー・イン・ピクチャー
- エージェントや組み込み機器から、工場のカメラ映像を AI 分析に送る
- 複数のカメラ映像を合成した表示を作る
- WebSocket のプレビューで、配信前に結果を確認できる

</div>

---

# まとめ・所感

<div class="text-left text-sm pt-2">

- 新しいエンコード製品ではなく、<strong>Stream を入出力の受け皿にして、間の加工だけをカスタムにする</strong>組み合わせ方が主題
- 処理の寿命を Worker から切り離す設計（<code>onActivityExpired()</code> + 最大継続時間）は、長時間タスク全般の参考になる
- 現状は CPU 処理。遅延・同時セッション数・料金は記事に数値がなく、デモとリポジトリで確認が必要
- 今後: コンピュータービジョン、ハードウェアアクセラレーション、WebRTC / MoQ、Workers ネイティブのエンコード/デコード
- サンプル対象外: Stream Live Input と FFmpeg 入り Container イメージが必要で、最小実装では再現できない（公式リポジトリが実装そのもの）

</div>

---

# 参考リンク

- 原文: https://blog.cloudflare.com/streamline/
- Streamline: https://github.com/cloudflare/streamline
- Streamline デモ: https://github.com/cloudflare/streamline-demo
- 公開プレイグラウンド: https://playground.streamline-video.workers.dev
- Workers の Access 連携: https://developers.cloudflare.com/workers/configuration/cloudflare-access/
- Containers の再設計: ▶ <a href="../faster-agent-sandboxes/" target="_blank">解説スライド</a>
- Containers のインバウンド TCP と gRPC: ▶ <a href="../grpc-workers/" target="_blank">解説スライド</a>
- @cloudflare/computer: ▶ <a href="../cloudflare-computer/" target="_blank">解説スライド</a>

<div class="pt-8 text-sm opacity-50">
Wiki: docs/articles/2026-10-02-streamline.md
</div>
