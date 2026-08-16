---
routerMode: hash
theme: default
title: Kitesurfのご紹介
info: |
  Cloudflare Blog記事「Kitesurfのご紹介」の解説スライド。
  原文: https://blog.cloudflare.com/kitesurf/
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

# Kitesurfのご紹介

Cloudflare Workersのアイソレート上で動く、
エージェントファーストのブラウザ

<div class="pt-4 text-sm opacity-70">
原文: https://blog.cloudflare.com/kitesurf/<br>
公開日: 2026-08-06
</div>

---

# TL;DR


- Cloudflareは、AIエージェント専用ブラウザ「Kitesurf」を発表。Chromiumなど既存エンジンを使わず**Workers上で完全動作**する点が最大の特徴
- タブ・拡張機能などの人間向け機能を削ぎ落とし、トークン数・コンテキストウィンドウ・コストなどエージェントに重要な観点へ最適化
- 内部はRust実装をWebAssemblyにコンパイルし、HTML/CSSパースに`Blitz`と`Stylo`、eval実行に`Boa JS`を利用
- スクリーンショット取得等の典型タスクで、Chromiumに比べCPU・メモリ消費が**3〜7倍**少ない。WPTを**21万5,000件以上**通過


---

# アジェンダ


- 背景: ブラウザは「人間向け」に作られてきた
- Kitesurfを発表: エージェント専用ブラウザ
- 開発の経緯と設計上の意思決定
- アーキテクチャ: Engine / PageScript / PageRenderer / SandboxOutbound
- WPTテストと性能ベンチマーク
- Browser Runでの使い始め方（コード例）
- ユースケースとできないこと
- まとめ・所感


---

# 背景: 高性能なAIエージェントに共通するもの

ブラウザは「インターネットのOS」とも言える、
最も重要なソフトウェアの1つ


しかし、AI エージェントの普及によって前提が変わった



- ChromiumのようなブラウザエンジンはGUIを持つ**人間**向けに設計されている
- タブ・テーマ・拡張機能・デバイス間同期は、AIエージェントには一切不要
- それでもメモリと計算資源を大きく消費する


---

# AIエージェントが本当に必要としているもの

<div class="grid grid-cols-2 gap-4">
<div>

### 人間が気にすること
- タブ
- テーマ
- 拡張機能
- デバイス間同期
- 60fpsの滑らかなスクロール

</div>
<div>

### AIエージェントが気にすること
- トークン数
- コンテキストウィンドウ
- スケーラビリティ
- パフォーマンス
- コスト

</div>
</div>


脅威モデルも異なる: **プロンプトインジェクション**やツールの安全性が最優先事項に


---

<div class="text-center">

# Kitesurfを発表

<div class="pt-8">

AIエージェント専用に設計された、
**Cloudflare Workers上で完全に動作する**新しいブラウザ

</div>

</div>


- Chromiumなど既存のブラウザエンジンを使わない
- Browser Runで**無料ベータ**として提供開始
- スクリーンショット・HTML抽出でChromiumよりCPU・メモリ効率が3〜7倍良い


---

# 開発の経緯


- インスピレーション元は [obscura](https://github.com/h4ckf0r0day/obscura) — "no Chrome, no Node.js, no dependencies" を掲げるRust製ヘッドレスエンジン
- AIエージェントの力を借りてCloudflare Workersへの移植を試みる
- 最初はうまく動かなかったが、**明確な計画と成功の定義**を与えたところ動作するプロトタイプが誕生
- このプロトタイプに手応えを得て、チームとして本格的に開発を開始


---

# 設計上の意思決定①: テスト、テスト、テスト


- AIによる開発を加速しつつ品質を担保する手段として **Web Platform Tests（WPT）** を採用
- WPTはW3C標準への準拠を測る大規模なテストスイート — AIエージェントに明確な達成目標を与えられる
- ただしWPTは実サイトの描画・操作能力までは測れない
- そこでPuppeteerによる**統合テスト・ビジュアルリグレッションテスト**を実装し、Chromiumとの出力差分を毎ステップ比較


---

# 設計上の意思決定②〜⑤

<div class="grid grid-cols-2 gap-4 text-sm">
<div>

### 🦀 Rustを可能な限り使う
不要なエミュレーション層を避け、
`wasm-bindgen` でRustを直接Wasmへ

### 🛡️ 例外処理を徹底する
どんな失敗も空白フレームへの劣化にとどめ、
セッションを絶対に殺さない

</div>
<div>

### 🔒 分離（Isolation）を徹底する
すべてのページロードは信頼できない入力、
すべてのセッションはゼロから始まる

### ♻️ 可能な限りステートレスに
状態を持たなければ使い捨てにでき、
バースト負荷への対応がしやすい

</div>
</div>

---
layout: image-right
image: https://blog.cloudflare.com/_emdash/api/media/file/01KZ9Z8A7NX68CP9DHW93JAHJX.png
backgroundSize: contain
---

# リクエストのライフサイクル

Kitesurfは1件のページ描画リクエストを
**4つのコンポーネント**で処理する


- SandboxOutbound（origin取得の唯一の窓口）
- Engine（唯一の外部公開コンポーネント）
- PageScript（DOM・JS実行）
- PageRenderer（ピクセル生成）


<footer class="text-xs opacity-50 mt-4">
出典: Cloudflare Blog https://blog.cloudflare.com/kitesurf/
</footer>

---
layout: image-right
image: https://blog.cloudflare.com/_emdash/api/media/file/01KZ9Z8AAR723T5KJCNQ547FAV.png
backgroundSize: contain
---

# SandboxOutbound

信頼できないページから任意のアセットを
取得するのは、ブラウザで最も危険な操作の1つ


- ネットワークに直接触れるコンポーネントを**1つに限定**（Dynamic Workersで強制）
- CORSの強制・ヘッダー付与・レスポンスのフィルタリング
- ページごとにクッキーを個別の「jar」で隔離
- ポリシー違反は**403で拒否**


<footer class="text-xs opacity-50 mt-4">
出典: Cloudflare Blog https://blog.cloudflare.com/kitesurf/
</footer>

---
layout: image-right
image: https://blog.cloudflare.com/_emdash/api/media/file/01KZ9Z8AHPEVW2VZK1VM59SZHW.png
backgroundSize: contain
---

# Engine

Kitesurfで**唯一、外部に公開される**コンポーネント


- CDP（Chrome DevTools Protocol）のWebSocket/HTTP REST APIを処理
- 各セッションの状態を保持（他コンポーネントはすべてステートレス）
- CDP採用によりPuppeteer・Playwright・chrome-remote-interfaceが**そのまま動作**


<footer class="text-xs opacity-50 mt-4">
出典: Cloudflare Blog https://blog.cloudflare.com/kitesurf/
</footer>

---
layout: image-right
image: https://blog.cloudflare.com/_emdash/api/media/file/01KZ9Z8A7714HEP695P6HKY8GD.png
backgroundSize: contain
---

# PageScript

**Dynamic Workers**の威力を示す好例
— この機能なしにはKitesurfは実現できなかった


- ページ／OOPIFごとに長寿命のアイソレートを起動
- クリーンな `globalThis` とDOMドキュメントを持つ
- HTML/CSSパースは Rust製の `Blitz` と `Stylo`
- `<script>` / `.wasm` は同じアイソレート内で実行


<footer class="text-xs opacity-50 mt-4">
出典: Cloudflare Blog https://blog.cloudflare.com/kitesurf/
</footer>

---

# PageScript: evalへの対応


> セキュリティ上の理由から、Workersはネイティブの `eval` をまだサポートしていない



- 別のアイソレートを起動しても `globalThis` にアクセスできず解決にならない
- 解決策: Rust製ECMAScriptエンジン **Boa JS** をコンパイルしてWorkers上で実行
- 「ランタイムの上でランタイムを動かす」— 最適ではないが実用上は十分機能する
- Workersにネイティブ `eval` が実装され次第、Boaから移行予定


---
layout: image-right
image: https://blog.cloudflare.com/_emdash/api/media/file/01KZ9Z8AR04KBNA79NHBQYG562.png
backgroundSize: contain
---

# PageRenderer

計算済みのページオブジェクトから
**実際のピクセルを生成**する


- PageScriptから "scene"（ページオブジェクト）を取得
- Static Assetsから内部フォント・画像を取得
- `blitz-paint` と `Parley` でラスタライズ
- JPEG/PNG/PDFとしてEngineへ返す


<footer class="text-xs opacity-50 mt-4">
出典: Cloudflare Blog https://blog.cloudflare.com/kitesurf/
</footer>

---

# Workers組み込みRPCによる連携


- EngineとPageRendererは Cloudflare Workers の**組み込みRPC**で通信
- API仕様・型・認証を意識せず `remoteFunction(...params)` を呼ぶだけ
- Engineは `renderFrame()` を1回のRPC呼び出しで叩き、PNGを受け取る
- PageRendererは状態を持たないため、Engineは失敗時に**いつでも安全に再起動**できる


<br>


レンダリング要求は自己完結・再試行可能・アイソレートは使い捨て可能


---
layout: image-right
image: https://blog.cloudflare.com/_emdash/api/media/file/01KZ9Z8A1TZBWVWDT3XZQR7AB1.png
backgroundSize: contain
---

# WPT 21万5,000件突破


- Web Platform Tests（WPT）を**215,000件以上**通過
- 毎週数百件のペースで通過数を伸ばしている
- CSS・DOM・HTML・selection・SVG・XHRなど、エージェントに重要な領域はすでに手厚くカバー


<footer class="text-xs opacity-50 mt-4">
出典: Cloudflare Blog https://blog.cloudflare.com/kitesurf/
</footer>

---
layout: image-right
image: https://blog.cloudflare.com/_emdash/api/media/file/01KZ9Z8AF7AB8HWYJJ0DZCRK5X.png
backgroundSize: contain
---

# カテゴリ別テストカバレッジ


streamsのように、エージェント用途では優先度が
低そうな領域でも十分なサポートが実現されている


<footer class="text-xs opacity-50 mt-4">
出典: Cloudflare Blog https://blog.cloudflare.com/kitesurf/
</footer>

---

# 性能ベンチマーク（対 Chromium）

| 指標 | Kitesurf | Chromium | 相対値 |
| --- | --- | --- | --- |
| CPU: スクリーンショット | 380 ms | 1,173 ms | **3.1倍**少ないCPU |
| CPU: HTML抽出 | 229 ms | 877 ms | **3.8倍**少ない |
| メモリ: スクリーンショット | 57.8 MiB | 271.0 MiB | **4.7倍**少ない |
| メモリ: HTML抽出 | 39.4 MiB | 273.7 MiB | **7.0倍**少ない |
| 壁時計: スクリーンショット | 1,148 ms | 637 ms | 1.8倍遅い |
| 壁時計: HTML抽出 | 820 ms | 472 ms | 1.7倍遅い |


壁時計時間はChromiumが優位（JITの恩恵）だが、
**課金対象となるCPU・メモリではKitesurfが3〜7倍効率的**


---

# 使い始める: Browser Run


- Browser Run経由で**今日から無料ベータ**として利用可能（アカウントごとの利用制限あり）
- 既存のPuppeteer/Playwright/chrome-remote-interface/MCPクライアントが
  `browser=kitesurf` パラメータを付けるだけでそのまま動作
- DevTools内蔵の **Kitesurf Playground** で任意URLの描画結果を確認可能
- Memoryパネルで各アイソレートのWasmフットプリントを確認できる


---
class: text-center
---

# コード例で見る:
# Kitesurfへの接続方法

---

# コード例① MCPクライアントからの接続（CDP）

<div style="--slidev-code-font-size: 10px; --slidev-code-line-height: 15px;">

```json {1-2|7-9|8|all}
{
  "mcp": {
    "kitesurf": {
      "type": "local",
      "command": [
        "npx",
        "-y",
        "chrome-devtools-mcp@latest",
        "--wsEndpoint=wss://api.cloudflare.com/client/v4/accounts/<ACCOUNT_ID>/browser-run/devtools/browser?browser=kitesurf",
        "--wsHeaders={\"Authorization\":\"Bearer <API_TOKEN>\"}"
      ],
      "enabled": true
    }
  }
}
```

</div>

---

# コード例① 解説


- MCPクライアント（例: Opencode）の設定に `chrome-devtools-mcp` をローカルコマンドとして登録
- `--wsEndpoint` のクエリパラメータに `browser=kitesurf` を付けるだけで接続先を切り替え
- 認証は `--wsHeaders` の `Authorization: Bearer <API_TOKEN>` ヘッダーで実施
- 既存のCDP対応ツールをそのまま流用できることを体現する設定例


---

# コード例② Quick Actionsでスクリーンショット取得

```bash {1|3-5|all}
curl -X POST 'https://api.cloudflare.com/client/v4/accounts/<accountId>/browser-run/screenshot?browser=kitesurf' \
  -H 'Authorization: Bearer <apiToken>' \
  -H 'Content-Type: application/json' \
  -d '{
    "url": "https://example.com"
  }' \
  --output "screenshot.png"
```


CDPセッションを自前で組み立てる必要がなく、
URLをJSONボディに指定するだけでスクリーンショットPNGを取得できる


---
class: text-center
---

# ユースケース

---

# ユースケース①: エージェントによるページ描画・情報抽出


- 完全機能・ピクセルパーフェクトなChromiumのトレードオフを許容できる場面に適する
- 対応例: TodoMVC（vanilla/React/Vue/Angular/Preact）、Wikipedia、Hacker News、Cloudflareブログ、Cloudflareダッシュボードの大部分


---

# ユースケース②: 一発完結タスク（Quick Actions）


- スクリーンショット取得・PDF生成・コンテンツ抽出などの単発API呼び出し
- タスクの実行時間だけ存在する、一時的で完全に分離されたステートレスなエンジン
- バースト的でAI駆動のワークロードによくスケールする


---

# 現時点では対応していない領域


- 動画再生
- WebGLレンダリング
- 実TLSフィンガープリントを使ったボットチャレンジの突破
- 永続的な状態を要する長時間の認証済みセッション


<br>


これらが必要な場合は、Chromiumで動くBrowser Runの通常構成を利用する


---

# まとめ


- Kitesurfは、AIエージェント専用に設計され、**Cloudflare Workers上で完全に動作**するブラウザ
- Rust実装をWasmへコンパイル（Blitz・Stylo・Boa JS）し、CDP互換で既存ツールをそのまま活用できる
- Engine / PageScript / PageRenderer / SandboxOutbound の4コンポーネントが役割分担
- WPTを215,000件以上通過、CPU・メモリはChromiumの3〜7倍効率的
- Browser Runで**無料ベータ**として今日から利用可能


---

<div class="text-center">

# 参考リンク

</div>

- 原文（英語版）: [Introducing Kitesurf](https://blog.cloudflare.com/kitesurf/)
- [Kitesurf Playground](https://kitesurf.cloudflare.app/)
- [obscura（インスピレーション元）](https://github.com/h4ckf0r0day/obscura)
- [Blitz（レンダリングエンジン）](https://github.com/DioxusLabs/blitz)
- [Boa JS（Rust製ECMAScriptエンジン）](https://boajs.dev/)
- [Browser Run ドキュメント](https://developers.cloudflare.com/browser-run/)
- [Dynamic Workers ドキュメント](https://developers.cloudflare.com/dynamic-workers/)
- Workers サンプル: [github.com/syumai/cloudflare-blog-summaries/tree/main/examples/kitesurf](https://github.com/syumai/cloudflare-blog-summaries/tree/main/examples/kitesurf)

<div class="pt-8 text-sm opacity-50">
Wiki: docs/articles/2026-08-06-kitesurf.md
</div>
