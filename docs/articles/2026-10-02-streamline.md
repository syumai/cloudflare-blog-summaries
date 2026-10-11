# Streamline: Cloudflare Stream と Workers でつくるカスタム動画パイプライン

- 原文: [https://blog.cloudflare.com/streamline/](https://blog.cloudflare.com/streamline/)（原題: Streamline: custom video pipelines with Cloudflare Stream and Workers）
- 日本語版の出どころ: Cloudflare公式の日本語版（`https://blog.cloudflare.com/ja-jp/streamline/`）は確認時点で存在しなかった（404）ため、英語版（en-us）から日本語化して要約している。タイトルも筆者による訳。公開日は英語原文の datePublished（2026-10-02T16:13:45Z）に従う。
- 公開日: 2026-10-02
- 著者: Willi Geiger、Taylor Smith
- 位置づけ: Birthday Week 2026 の記事（読了目安は原文表記で 12 分）。Cloudflare Stream の入出力と、Containers・Durable Objects・Workers を組み合わせて、動画をリアルタイムに加工して再配信する仕組みを示す開発者向けプレイグラウンド「Streamline」の発表（オープンソース + 公開デモ）
- 関連: [Cloudflare Containers を作り直し、エージェントのサンドボックスをスケールさせる](./2026-09-30-faster-agent-sandboxes.md)（本記事の media engine が動く Containers と Durable Object の制御の土台。本記事の「コンテナの送信側 Worker が Access のサービストークンを注入し、コンテナのメモリに入れない」という設計は、同記事の Outbound Request Handler による資格情報の注入と同じ考え方）/ [Cloudflare Workers と Containers がインバウンド TCP 接続と gRPC をサポート](./2026-08-03-grpc-workers.md)（Containers への通信経路の拡張。本記事は WebSocket と RTMPS を使う）/ [AIエージェントに必要なのはコンテナではなくコンピューター —「@cloudflare/computer」のご紹介](./2026-08-03-cloudflare-computer.md)（Containers を長時間動く環境として使う別の例）
- GitHub: [docs/articles/2026-10-02-streamline.md](https://github.com/syumai/cloudflare-blog-summaries/blob/main/docs/articles/2026-10-02-streamline.md)

![記事ヘッダー画像](https://blog.cloudflare.com/_emdash/api/media/file/01M3XKCAN8X5Q5KQ1Q5EW20NBG.01M3XKCB43AH4EZPQE0QQ7MNND.png)
*図: 記事ヘッダー画像。ブラウザ風ウィンドウの中をレーシングカーが走り、下にシークバーとカーソル、左右に音声波形のような縦線が並ぶオレンジ基調の装飾イラスト（出典: Cloudflare Blog https://blog.cloudflare.com/streamline/。原文にキャプションはなく、説明は見た目からの筆者の記述。装飾のため、図としては扱わない）*

## TL;DR

- **Streamline** は、Cloudflare の Developer Platform 上で「動画を加工して、そのまま Live 配信または新しいホスト動画として公開する」システムを組むための**開発者向けプレイグラウンド**。オープンソースで公開され、公開デモも用意された。
- 構成は 2 つ。メディア処理（入出力と加工）を担う **Media Engine**（Container 内。Go 製の Controller + FFmpeg を使う Processor）と、セッションを作成・設定・観測・停止する **Application**（Workers + Durable Object のオーケストレーター）。
- 入力は Stream Live Input からの RTMPS、Stream のホスト動画の HLS、アプリが渡すウェブカメラ映像。出力は別の Stream Live Input への RTMPS 配信、または WebSocket 経由のプレビュー。処理は JSON の設定（Input / Operations / Output）で定義する。
- セッションは Worker の接続とは独立して Container 内で動き続ける。`onActivityExpired()` をオーバーライドして Container のスリープを防ぎ、最大継続時間で必ず終了させる。
- 現時点の制約として、メディア処理に Container の CPU を使うため、高画質・高フレームレートではボトルネックになる。WebRTC・MoQ、ハードウェアアクセラレーション、Workers ネイティブの動画エンコード/デコードのプリミティブなどが今後の方向性として挙げられている。

## 背景・課題

Cloudflare Stream は、多くの顧客にとって「そのまま動く」放送プラットフォームである。しかし、ライブ配信にリアルタイムで注釈（アノテーション）を重ねたい、ホスト動画から字幕を焼き込んだ別バージョンを作りたい、といった要件では、**カスタムの動画処理パイプライン**を自分で動かす必要がある。

記事は、そうしたパイプラインの実行環境に求められる条件を次のように整理している。

- コンパイル済みの専用コードを動かせる、長時間動く耐久的な環境で、メモリと CPU が予測可能であること。
- 動画ストリームは数分から数時間続くため、**メディア処理のライフサイクルを、それを開始したリクエストから独立**させられること。
- アプリケーションが、パイプラインの開始・入力送信・状態確認・停止を、1 本のリクエストを開きっぱなしにせずにできること。

これに対して Cloudflare のプリミティブを次のように割り当てる。

| 役割 | 使うもの | 理由（記事の説明） |
|---|---|---|
| メディア処理 | Containers | 長時間動くランタイムで、メディア処理に向く |
| オーケストレーション | Durable Objects | セッション・Container のライフサイクル・プレビューの中継を調整する |
| 制御・監視 | Workers | 制御シグナルの送信と監視に向く |

## 発表内容 / アーキテクチャ

### 全体像

Streamline では、Container 内の **media engine** がメディア処理をリアルタイムに行い、それを **Worker** が制御する。Worker は、エージェントやユーザーに対して制御・プレビュー・テストの口を公開する。**Worker が切断されても処理は継続する**。また、media engine は将来、専用のエンコード製品に置き換えられるよう、モジュール構成で設計されている。

![Streamline Demo の「Webcam Picture-in-Picture」画面。左がウェブカメラのローカルプレビュー、右が合成後の Stream Output](https://blog.cloudflare.com/_emdash/api/media/file/01M3XKBENJCAB7M1N0K384578G.png)
*図: Streamline Demo の「Webcam Picture-in-Picture」ページ。上部のナビゲーションに Pass-Through / Overlay / Annotation / Picture-in-Picture / Filters / Subtitles / Probe / Settings が並ぶ。左の「Local Preview」にウェブカメラ映像（Start Streaming / Stop Streaming ボタンと「Streaming to the configured RTMP destination.」の表示）、右の「Stream Output」に山道を走る車載映像の右上へウェブカメラ映像が小さく重なった合成結果が表示されている（出典: Cloudflare Blog https://blog.cloudflare.com/streamline/。原文にキャプションはなく、画像の掲載位置と画像内の文字からの筆者の記述）*

### 2 つのコンポーネント

Streamline のデプロイは **Media Engine** と、それを制御する **Application** からなる。

![Application（UI・Orchestrator）、Media Engine（Controller・Processor）、Stream 側のソース（Live via RTMPS Pull / On-Demand via HLS）、出力（Stream Live への RTMPS Push / Durable Object への WebSocket プレビュー）の関係図](https://blog.cloudflare.com/_emdash/api/media/file/01M3XKBFY5MZA5TEY754FQWWJ4.png)
*図: Streamline のアーキテクチャ図。左に「Webcam Input」。「Application」枠の中の「UI」が「Orchestrator」へ流れ、Orchestrator から「Media Engine」枠の「Controller」へ、Controller から「Processor」へ矢印が伸びる。「Sources from Stream」枠の「Live via RTMPS Pull」と「On-Demand via HLS」は Processor へ入力され、Webcam Input は Orchestrator 経由で入力される。Processor からは「Output to Stream Live via RTMPS Push」と「Preview Output via WebSocket to Durable Object」へ出力される（出典: Cloudflare Blog https://blog.cloudflare.com/streamline/。原文にキャプションはなく、説明は図中の文字と矢印からの筆者の記述）*

#### Media Engine

Media Engine は Container にホストされ、メディアの入出力と加工をすべて担う。2 つの部品からなる。

- **Controller**: Go で書かれた制御ハーネス。HTTP サーバーを実装し、受けたリクエストを media engine が実行できる操作に変換する。
- **Processor**: 実際のメディア処理を行う部分。現在の実装は **FFmpeg** を使うが、これは内部の実装詳細であって、利用者向け API の一部ではない。

入出力の経路は次のとおり。

| 方向 | 経路 |
|---|---|
| 入力 | Stream Live Input からネットワーク越しに **RTMPS** で取得 |
| 入力 | Stream のホスト動画の **HLS マニフェストとセグメント**を取得 |
| 入力 | 制御アプリが供給する映像（例: ウェブカメラ）を受け付ける |
| 出力 | 別の Stream Live Input へ **RTMPS** で発行（Live 配信・録画） |
| 出力 | **アウトバウンドの WebSocket** で Durable Object のリレーにプレビュー映像を発行。アプリは自分の WebSocket でそのリレーに接続する |

#### Application

Application は Workers で作られ、フルスタックのブラウザアプリ、エージェント、組み込みシステムのいずれにもなり得る。

- **UI**: クライアントのロジック、ID とアクセスポリシー。記事ではブラウザアプリを具体例にしているため、ブラウザのインターフェースも含む。
- **Orchestrator**: セッション、Container のライフサイクル、プレビューのリレーを調整する。**Durable Object** として実装される。

ローカル開発では、Container は単なるローカルの Docker インスタンスで、Durable Object は使わない。単一ユーザーで、ローカルアクセスに認可は不要、プレビューはローカルホストの WebSocket に直接接続できる。

Cloudflare にデプロイすると、認可されたユーザーやエージェントが Worker を訪れてセッションを開始できる。必要なら新しい Streamline の Container を起動し、ライフサイクルを自動で管理し、動画操作の API を公開し、入力を Stream から取り込み、出力を Stream へ戻す。

### Container のライフサイクルとセッション管理

制御 Worker は、長時間動くメディア処理のセッションを開始する。開始後は、アプリが安全に切断・再接続でき、Container は制御アプリが停止するまで処理を続ける。ただし、無期限に動き続けないよう**最大継続時間**を設ける。処理中の Container インスタンスは、他のアプリからは使えない。

Cloudflare Containers は、一定間隔のあいだリクエストを受けないと自動でスリープする。しかしパイプラインが動いている間は、制御アプリが切断されてリクエストが来なくても処理を続ける必要がある。そこで Container の `onActivityExpired()` コールバックをオーバーライドし、期限に達していなければ活動期限を更新、達していれば Container を破棄する。

### API

Go ハーネスの HTTP サーバーと、Container に結びつく Durable Object が低レベルのインターフェースを定義する。その上に、制御主体やバックエンドの実装詳細に依存しにくい抽象を載せるため、2 つのパッケージが公開される。

| パッケージ（原文の表記） | 内容 |
|---|---|
| `@cloudflare/streamline/client` | 高レベルのセッションベース API |
| `@cloudflare/streamline/` | Container に結びつく Durable Object の基底クラス。API リクエストのルーティング、プレビューのリレーサーバー、セキュリティ・アクセスポリシーのフックを提供 |

リモートのデプロイでは、制御 Worker が基底クラスを継承した具体的なサブクラスを定義し、アプリ固有のロジックとストレージを持たせる。ローカルモードでは、Durable Object がない代わりにフロントエンドが薄いアダプター層を持ち、アクセス制御なしでローカルの Docker に直接つなぐ。

クライアントの API は次の 8 つ。

| クライアントメソッド | 機能 |
|---|---|
| `createStreamline()` | 新しい Streamline インスタンスを作る |
| `streamline.sessions.create()` | 新しい処理セッションを作る |
| `streamline.sessions.resume(id)` | 既存のセッションに再接続する |
| `session.start(config)` | 新しい処理パイプラインを開始する |
| `session.ingest(chunk)` | 「webcam」モードで動画データのチャンクを送る |
| `session.annotation(png)` | 透過のアノテーションオーバーレイを更新する |
| `session.metrics()` | 現在のセッションのメトリクスを受け取る |
| `session.stop()` | 現在のセッションの処理を停止する |

### パイプラインの定義と実行

`session.start()` は処理パイプラインを構築して実行する。引数は、処理を定義する 1 つの JSON 設定オブジェクトで、**Input(s) / Operations / Output** からなる。

サポートされている操作（`pipeline` の `op`）は次の 4 種類。

| 操作名 | 機能 |
|---|---|
| `filter` | blur、saturation などのフィルター処理を適用 |
| `overlay` | URL で参照する画像、または `annotation()` で別途渡した PNG をオーバーレイ |
| `subtitle` | 字幕を焼き込む |
| `encode` | 出力のエンコードパラメーターを指定 |

なお、操作の適用順は現在**エンジン側で固定**されており、配列に書いた順序は意味を持たない。

### 動画の入力と出力のパターン

記事は 4 つのパターンをコードで示している（詳細は次節）。

1. **ライブ入力 + オーバーレイ**: Stream Live Input の RTMP 配信を入力に、透過画像を重ねて別の RTMP 先へ出力する。ライブ配信の加工版をリアルタイムに作れる。
2. **オンデマンド入力（HLS）+ 字幕焼き込み**: Stream のホスト動画の HLS を入力に、埋め込みクローズドキャプションをテキストとして映像に描画し、RTMP で出力する。
3. **ウェブカメラ入力 + フィルター + アノテーション + プレビュー**: `session.ingest()` で映像を送り、WebSocket でプレビューを受ける。エージェントや組み込み機器から、工場のカメラ映像を AI 分析に送る、複数カメラ映像を合成する、といった用途も想定している。
4. **アニメーションするオーバーレイ**: `session.annotation()` で PNG を更新し続ける。更新レートは実際には PNG のサイズ、帯域、処理能力で制限され得る。

### プレビュー映像の受信

`output: { mode: 'websocket' }` を指定すると、Streamline はプレビュー映像を出力する。低遅延で制御アプリへ返すために WebSocket を使い、Container が **fMP4 フラグメント**を Durable Object へ発行し、Durable Object がアプリのオリジン相対の `/relay/view` にある出力リレーへ転送する。アプリはこの URL に WebSocket を接続しておくと、映像データが届くたびに受け取る。

実装上の注意として、記事は次の点を挙げている。

- **`session.start()` の前に**リレーへ接続する。さもないと、リレーが発行側（publisher）を拒否する。
- 本番の MediaSource プレーヤーは、`SourceBuffer.updating` が true の間はフラグメントをキューに入れる必要がある。
- ローカル開発では、ブラウザなどがローカルの Container の WebSocket に直接接続する。

### セキュリティ

記事は、セキュリティを後付けでなく設計の一部にしたと述べ、次の要件を挙げる。

- 認可されたユーザーだけがセッションを作成・制御でき、セッションは互いに隔離される。
- Stream の RTMPS 入出力キーは秘密情報として扱い、制御アプリに漏らさない。
- リソース使用量に上限を設ける。

具体策は次のとおり。

| 項目 | 内容 |
|---|---|
| オーナーのデプロイの非公開化 | Workers の **Access 連携**で非公開にする。Worker は制御リクエストを受ける前に Access のセッションを検証し、アクティブなセッションを検証済みの主体（principal）に結びつける。同時に動かせるセッションは 1 つで、別の主体は停止も置き換えもできない |
| Stream Live Input のキー | Worker のシークレット、または Durable Object ストレージの書き込み専用の共有オーバーライドに保存し、設定 API の返り値やブラウザのストレージには決して含めない。制御アプリは名前付きプロファイルで入出力を指定し、Worker が Container に接触する前にプロファイルを解決する |
| プレビュー配信の認証情報 | 目的の異なる 2 つ。(1) Cloudflare Access の**サービストークン**が Container ワークロードを発行側エンドポイントに対して認証する。(2) ランダムな**セッションごとの capability** が、現在アクティブなリレーへの発行のみを認可する |
| サービストークンの扱い | Container の**アウトバウンド Worker** が注入し、Container のメモリには入らない |
| 初期デプロイの暫定措置 | パスを限定した一時的な Access Bypass を使いつつ、セッションごとの capability は有効なまま。デプロイとスモークテスト後に Bypass を Service Auth に置き換える |

記事は、「オーナーのデプロイは意図的に非公開かつシングルトンにルーティングされており、**公開のマルチユーザーサービスのためのセキュリティモデルではない**」と明記している。

### プレイグラウンドとオープンソース

記事の公開と同時に、システムをオープンソース化し、公開プレイグラウンドをデプロイした。

- Streamline の Container は、ローカル実行も、自分のアカウントへのデプロイもできる。制御アプリが使う Worker API をエクスポートする。
- 例のアプリは、Astro の Web フロントエンドを持つ Worker アプリで、オーバーレイ、字幕デコード、フィルター、ピクチャー・イン・ピクチャーなどの一般的な用途を示す。パフォーマンスメトリクスとシステムトレースを取る **probe** 機能もあり、新機能の開発時のデバッグに使える。ローカルの Astro サーバーで動かすことも、Cloudflare Access の背後にデプロイすることもできる。
- 公開プレイグラウンドは独自の Access 設定を持ち、**検証済みユーザーごとに 1 つの Container ID、ユーザーごとに 1 つのアクティブセッション**、グローバルな受け入れ制御、同時実行・メディア・セッションの上限を設け、他のユーザーのセッションを置き換えることはできない。

### これから

Streamline は、Stream のような既存のマネージドサービスと低レベルのプリミティブを組み合わせて、高度にカスタマイズ可能なメディアパイプラインを作る一つの方法を示す。現状の制約と展望は次のとおり。

- 現状はメディア処理に **Container の CPU** を使うため、高画質・高フレームレートではボトルネックになる。
- 今後の拡張として、コンピュータービジョンのパイプライン、ハードウェアアクセラレーションされたメディア処理、WebRTC や **MoQ** のような次世代プロトコルを使ったリアルタイム体験、そして最終的には Workers ネイティブの動画エンコード/デコードのプリミティブ、を挙げている。

## コード例

記事には 8 つのコード断片がある（日本語の注釈は筆者による）。

### Container をスリープさせずに活動期限を更新する（`onActivityExpired()`）

```ts
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

セッションに有効期限（`expiresAt`）が設定されていれば活動期限を更新して Container を生かし続け、そうでなければ Container を破棄する。これがリクエストが来なくてもパイプラインが走り続ける仕組みの要である。

### セッションを作成して開始する

```ts
const streamline = createStreamline({ baseUrl: 'https://media.example' })
const session = await streamline.sessions.create()
const result = await session.start(config)
// At this point the pipeline is running, unless failure occurred.
console.log(result)
```

`config` はパイプラインを定義する JSON オブジェクトで、次の例のとおり。

### ライブ入力（RTMP）にオーバーレイを重ねて RTMP へ出力

```ts
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

`profile` は名前付きのプロファイルで、実際の RTMPS の URL やキーは Worker 側で解決される（前節「セキュリティ」参照）。

### ホスト動画（HLS）から字幕を焼き込む

```ts
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
        codec: 'h264',
        preset: 'fast',
        bitrate: '1500k',
        resolution: '1280x720',
        fps: 30,
      },
    },
  ],
  output: { mode: 'rtmp', profile: 'default' },
})
```

### ウェブカメラ入力（フィルター + アノテーション + WebSocket プレビュー）

```ts
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
        codec: 'h264',
        preset: 'veryfast',
        bitrate: '1500k',
        resolution: '1280x720',
        fps: 30,
        gop: 60,
      },
    },
  ],
  output: { mode: 'websocket', format: 'fmp4' },
})
```

この断片はパイプラインを開始するだけで、映像はまだ送っていない。ブラウザからは次のように `MediaRecorder` のチャンクを `session.ingest()` で送る。

```ts
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

250 ms ごとのチャンクを、`uploadTail` の Promise チェーンで順序を保ちながら送る。

### アニメーションするオーバーレイ（`session.annotation()`）

```ts
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

### プレビュー映像の受信（`openViewer()` とフラグメントの追記）

```ts
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
const sessionId = session.id
if (!sessionId) throw new Error('Session creation returned no session ID')
// Connect before session.start(), or the relay rejects the publisher.
const viewer = await openViewer('https://media.example', sessionId)
viewer.addEventListener('message', (event) => {
  if (typeof event.data === 'string') {
    if (event.data === '{"type":"eos"}') mediaSource.endOfStream()
    return
  }
  sourceBuffer.appendBuffer(new Uint8Array(event.data as ArrayBuffer))
})
```

文字列メッセージ `{"type":"eos"}` はストリーム終了の合図で、バイナリメッセージ（fMP4 フラグメント）は `sourceBuffer` に追記される。`mediaSource` と `sourceBuffer` の初期化は原文の断片に含まれていない。

## ユースケース

記事が挙げている例と、その構成上の対応は次のとおり。

- **ライブ配信にロゴ・注釈を重ねる**: Stream Live Input の RTMP を入力に `overlay` を適用し、別の Live Input へ出力する。`annotation()` を使えば、アニメーションするグラフィックも更新できる。
- **ホスト動画の字幕焼き込み版を作る**: Stream の動画を HLS で取り込み、埋め込みクローズドキャプションを映像に描画して、録画または配信する。
- **ウェブカメラのピクチャー・イン・ピクチャー**: デモ画面のように、ブラウザのウェブカメラを別の配信映像に小さく重ねて出力する。
- **フィルターで映像を整える**: 明るさ調整や反転などのプリセットを適用し、WebSocket でプレビューを確認する。
- **エージェントや組み込み機器からの映像処理**: 工場のカメラ映像を AI 分析に送る、複数のカメラ映像を合成した表示を作る、といった用途を記事は想定している。

## 所感・ポイント

- 中心にあるのは新しいエンコード製品ではなく、「Stream は入出力の受け皿として使い、間の加工だけを Container でカスタムにする」という**組み合わせ方**である。記事自身が「media engine は将来、専用のエンコード製品に置き換えられるよう設計した」と述べており、API は FFmpeg を意識させない形になっている。
- **処理の寿命を Worker から切り離す**点が設計上の肝である。`onActivityExpired()` の更新と最大継続時間の組み合わせは、長時間タスクを Containers で動かすときの定石として他のワークロードにも応用できる。Containers のスケジューリングや Durable Object からの制御は [Containers の再設計](./2026-09-30-faster-agent-sandboxes.md) の記事と合わせて読むと分かりやすい。
- セキュリティの記述が具体的である。キーは名前付きプロファイルで間接参照し、サービストークンは Container の外側（アウトバウンド Worker）で注入する。「公開のマルチユーザーサービス向けではない」と範囲を明示している点も重要で、プレイグラウンドを自分のサービスに流用する際は、認可・隔離・上限設計を別に用意する必要がある。
- 現状は CPU 処理のため、高画質・高フレームレートには向かない。記事は性能数値（遅延・同時セッション数・料金）を示していない。実際の遅延やコストは公開デモとリポジトリで確認する必要がある。
- 原文のパッケージ表記には揺れがある（`@cloudflare/streamline/client`、`@cloudflare/streamline/`、およびリモートデプロイの説明中の `@streamline/cloudflare`）。筆者の確認では、npm に `@cloudflare/streamline`（0.1.1）は存在し、`@streamline/cloudflare` は存在しなかった。実際に使うパッケージ名はリポジトリの README で確認するのがよい。
- 原文の `onActivityExpired()` の断片は、Container 側のコールバックをオーバーライドする形で書かれている（どのクラスを継承するかは断片に示されていない）。Containers の API は [Containers の再設計](./2026-09-30-faster-agent-sandboxes.md) の記事で述べられているとおり再整理が進んでいるため、新しい API との対応は公式ドキュメントで確認が必要。
- 画像の注記: ヘッダー画像は装飾イラスト。ウェブカメラのデモ画面と構成図の説明は、いずれも原文にキャプションがなく、画像内の文字と掲載位置からの筆者の記述である。
- **サンプル対象外の理由**: 本記事の要点（Stream Live Input との RTMPS 入出力、FFmpeg を含む Container イメージ、Access による保護）を体験するには、Stream のアカウント設定と Container イメージのビルドが必要で、100 行前後の最小実装では再現できない。公式のオープンソースリポジトリ（下記）が、そのままデプロイ可能な実装として提供されているため、`examples/` のサンプルは作成していない。

## 関連リンク

- 原文（en-us）: https://blog.cloudflare.com/streamline/
- Streamline（メディアエンジンとアプリ向けのパッケージ。GitHub）: https://github.com/cloudflare/streamline
- Streamline デモ（例の Worker アプリ・Astro フロントエンド・デプロイプロファイル・Access のツール。GitHub）: https://github.com/cloudflare/streamline-demo
- 公開プレイグラウンド: https://playground.streamline-video.workers.dev
- Cloudflare Stream: https://www.cloudflare.com/products/stream/
- Workers の Access 連携: https://developers.cloudflare.com/workers/configuration/cloudflare-access/
- 本リポジトリ: [Containers の再設計（エージェントのサンドボックス）](./2026-09-30-faster-agent-sandboxes.md) / [Workers と Containers のインバウンド TCP と gRPC](./2026-08-03-grpc-workers.md) / [@cloudflare/computer](./2026-08-03-cloudflare-computer.md)
- Workers サンプル: 対象外（理由は「所感・ポイント」を参照）
