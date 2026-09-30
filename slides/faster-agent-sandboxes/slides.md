---
routerMode: hash
theme: default
title: "Cloudflare Containers を作り直し、エージェントのサンドボックスをスケールさせる"
info: |
  Cloudflare Containers, rebuilt to scale agent sandboxes の解説スライド。
  原文: https://blog.cloudflare.com/faster-agent-sandboxes/
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

# Containers を作り直し、<br>エージェントのサンドボックスをスケールさせる

durable_object スケジューリングポリシー・6 倍速い起動・スナップショット

Birthday Week 2026

<div class="pt-4 text-sm opacity-70">
原文: https://blog.cloudflare.com/faster-agent-sandboxes/<br>
公開日: 2026-09-30
</div>

---

# TL;DR

- サンドボックスの<strong>イメージとインスタンスタイプをコードから実行時に選べる</strong> `durable_object` スケジューリングポリシー
- Containers の起動が <strong>6 倍以上高速</strong>に。ComputeSDK ベンチマークの中央値は <strong>4.049 秒 → 648 ミリ秒</strong>
- <strong>ファイルシステムのスナップショット</strong>（パブリックベータ）と、準備済みイメージ <code>cloudflare/debian-trixie</code>
- 新機能は Durable Object の <code>ctx.container</code> だけで提供。旧 <code>Container</code> / <code>Sandbox</code> クラスは <strong>2026-12-31</strong> まで維持
- Sandbox SDK 1.0 は基底クラスではなく<strong>ユーティリティ集</strong>になる

---

# アジェンダ

- 背景: エージェントのワークスペースは「オンデマンド」
- イメージとインスタンスをコードで選ぶ
- ロールアウトは「ただのコード」
- 起動が速くなった理由とベンチマーク
- 準備済みイメージ・スナップショット
- Durable Object × Container の 3 パターン
- Container クラスと Sandbox SDK の変更
- コード例・ユースケース・まとめ

---

# 背景: アプリ単位の設計とエージェントの使い方

<div class="grid grid-cols-2 gap-6 pt-4 text-left">
<div class="p-4 border rounded">

<strong>これまでの Containers</strong>

- デプロイ時にイメージと計算リソースを決める
- アプリケーション全体へロールアウト
- 単位は「アプリケーション」

</div>
<div class="p-4 border rounded">

<strong>エージェントのワークスペース</strong>

- 作業中にオンデマンドで作られる
- イメージ・リソース・ツール・初期ファイルはタスクごと
- 数分で終わる / 眠る / 数日後に復元される
- 起動の 1 秒ごとにユーザーが待つ

</div>
</div>

---

# 背景: ワークロードごとの要件

- <strong>コーディングエージェント</strong>: リポジトリ、パッケージマネージャー、コンパイラ、テストランナー、開発サーバー
- <strong>eval</strong>: 既知の状態から始まるサンドボックス
- <strong>強化学習</strong>: 大量の環境を作成・採点・リセット
- <strong>長時間タスク</strong>: 成果物のファイルを保存して後で続ける

同じパターンを Base44、Kilo Code、Cursor Cloud Agents、Devin Outposts、OpenAI Agents API、Claude Managed Agents との連携で見てきた、と記事は述べる

---

# 課題: 組み合わせごとに別アプリケーション

<div class="pt-4 text-left">

Node.js の小さなサンドボックスと、Python の大きなビルド用サンドボックスが欲しい場合、従来は次が必要だった。

</div>

| 必要なもの | 従来 |
|---|---|
| Containers アプリケーション | 2 つ（イメージ × インスタンスの組み合わせごと） |
| Durable Object 名前空間 | 2 つ |
| ルーティング | Worker でタスクごとに振り分け |
| 新しい環境の追加 | `wrangler deploy` を伴う別デプロイ |

---

# 新機能: コードからイメージとインスタンスを選ぶ

`wrangler.jsonc`（オプトインと、選べるイメージの宣言）

```jsonc
{
  "containers": [{
    "class_name": "AgentSandbox",
    "scheduling_policy": "durable_object",
    "images": {
      "node": { "dockerfile": "./images/node/Dockerfile" },
      "python": { "dockerfile": "./images/python/Dockerfile" }
    }
  }],
  "durable_objects": {
    "bindings": [{ "name": "SANDBOX", "class_name": "AgentSandbox" }]
  }
}
```

<div class="text-sm pt-2">

- `scheduling_policy: "durable_object"` でオプトイン。宣言したイメージは `this.ctx.container.images.<name>` で参照（記事のコードを一部整形）

</div>

---

# コード例: タスクごとに選んで起動

```js
import { DurableObject } from "cloudflare:workers";

export class AgentSandbox extends DurableObject {
  async startWorkspace(workspace) {
    if (this.ctx.container.running) return;

    const image = workspace.toolchain === "python"
      ? this.ctx.container.images.python
      : this.ctx.container.images.node;

    const instance = workspace.workload === "build"
      ? "standard-2"
      : "standard-1";

    this.ctx.container.start({
      image,
      instance,
      enableInternet: true,
    });
  }
}
```

<div class="text-sm pt-1">

`extends Container` ではなく <code>extends DurableObject</code>。「別アプリケーション + 別デプロイ」が <strong>if 文</strong>に（記事のコードを一部整形）

</div>

---

# ロールアウトは「ただのコード」

<div class="grid grid-cols-2 gap-4 text-left">
<div class="p-3 border rounded text-sm">

<strong>従来</strong>

- 猶予期間、段階的な割合、API での反映
- 作業中でも、どのインスタンスをいつ置き換えるかはプラットフォームが決める

</div>
<div class="p-3 border rounded text-sm">

<strong>durable_object ポリシー</strong>

- ロールアウト設定そのものがない
- Container は止めるまで起動時のイメージ
- 次の起動で、コードが選んだイメージを使う

</div>
</div>

```js
const image =
  (await this.ctx.storage.get("pinned-image")) ??
  (isCanary(this.ctx.id)
    ? this.ctx.container.images.nodeV2
    : this.ctx.container.images.node);
```

<div class="text-sm">

ピン留め → カナリア（`isCanary` は利用者側で定義する関数）の順に判定。記事のコードを引用

</div>

---

# ロールアウトの戦略例

- <strong>カナリア</strong>: Durable Object の ID をハッシュして、新しいサンドボックスの 5% に新ツールチェーンを適用
- <strong>ピン留め</strong>: 進行中のプロジェクトは現在のイメージに固定し、タスク中に環境が入れ替わらないようにする
- <strong>区切りで移行</strong>: 次のセッションやスナップショット後など、自然なチェックポイントで移行
- <strong>ロールバック</strong>: 以降の起動で選ぶイメージを変えるだけ。設定の反映もドレインの待機も不要

ポリシーは Durable Object のコードの隣に置け、単純にも高度にもできる

---

# 起動が速くなった理由（1）: 配置

<div class="grid grid-cols-2 gap-6 pt-2 text-left">
<div class="p-4 border rounded">

<strong>従来</strong>

グローバルなコントロールプレーンが、アプリケーション設定の解決 → 空き容量の探索 → 配置の調整を行っていた

</div>
<div class="p-4 border rounded">

<strong>新ポリシー</strong>

- 需要は Durable Object から始まる
- まず同じマシンで空きを探し、なければ同じロケーション内へ拡大
- イメージやスナップショットがローカルにあるホストを優先（ダウンロード不要）

</div>
</div>

---

# 起動が速くなった理由（2）: ホスト上の処理

- 仮想マシンを一から起動する代わりに、<strong>まだ割り当てられていない準備済みの仮想マシンを復元</strong>
- ネットワークとファイルシステムの設定を再利用
- 繰り返される操作をまとめる
- 最初のコマンドに不要なサービスを待たない

→ 「サンドボックスの作成」から「コマンドの実行」までの時間が大きく短縮

---

# ベンチマーク結果

ComputeSDK の Burst TTI Benchmark（100 個を同時起動し、クライアントから time-to-interactive を測定）

| 指標 | 従来 | 新ポリシー | 改善 |
|---|---|---|---|
| 中央値 | 4.049 秒 | 648 ミリ秒 | 6.2 倍 |
| 95 パーセンタイル | 5.839 秒 | 910 ミリ秒 | 6.4 倍 |
| 99 パーセンタイル | 6.717 秒 | 1129 ミリ秒 | 5.9 倍 |

<div class="pt-4 text-sm">

Cloudflare 自身の予備的なバースト試験: 1 アカウントが <strong>6 か所で 100,000 個</strong>の Container を <strong>5.387 秒</strong>で起動

</div>

---

# 準備済みシステムイメージ

<code>cloudflare/debian-trixie</code>: Debian Trixie Slim + Node.js 24.20.0 LTS

```js
this.ctx.container.start({
  image: "cloudflare/debian-trixie",
  instance: "standard-2",
  enableInternet: true,
  entrypoint: ["/bin/sleep", "infinity"]
});
```

<div class="text-sm">

- Dockerfile の作成・イメージのビルド・push が不要
- 起動後に `exec()` でクローン、インストール、環境設定
- Cloudflare 管理のイメージなので、リクエスト前に対象ホストへ配布・準備できる
- `entrypoint` の `sleep infinity` で Container を起動したままにする

</div>

---

# スナップショット（パブリックベータ）

<div class="text-left">

- セットアップ（クローン、依存関係、ツールチェーン）は、起動より長くかかることがある
- 作業が止まるときにワークスペースを保存し、再開時に復元
- スナップショットは<strong>不変</strong>で再利用可能

</div>

| パターン | 内容 |
|---|---|
| 1 つのワークスペースを続ける | 終了時に保存、翌日に復元。リポジトリ・依存関係・キャッシュ・編集内容がそのまま |
| 共通のチェックポイント | 同じ準備済み環境から複数の Container が独立に起動し、それぞれ変更 |

---

# コード例: スナップショットの保存と復元

```js
async saveWorkspace() {
  const snapshot = await this.ctx.container.snapshotContainer({
    name: "project-ready",
  });
  await this.ctx.storage.put("workspace-snapshot", snapshot);
}

async restoreWorkspace() {
  const snapshot = await this.ctx.storage.get("workspace-snapshot");
  if (!snapshot) {
    throw new Error("No workspace snapshot found");
  }
  this.ctx.container.start({
    containerSnapshot: snapshot,
    instance: "standard-2",
    enableInternet: true,
  });
}
```

<div class="text-sm">

保存: `snapshotContainer()` の結果を Durable Object のストレージへ。復元: `start()` に `containerSnapshot` で渡す（記事のコードを一部整形）

</div>

---

# 準備済みイメージ × スナップショット

1. `cloudflare/debian-trixie` から起動
2. `exec()` でリポジトリのクローン・依存関係のインストール・ツールチェーンの設定
3. 結果をスナップショットとして保存
4. 以降のサンドボックスは、<strong>準備済みの状態から</strong>開始

<div class="pt-4 text-sm">

eval では、システムプロンプト・スキル・モデル・エージェントのバージョンだけを変え、同じベースラインから多数の隔離環境を起動できる。環境のずれが結果に影響するのを防ぐ

</div>

---

# Durable Object が Container を直接制御する

<div class="text-left text-base">

- すべての Container は、隣で動く<strong>ステートフルな Durable Object</strong> に紐づく
- 新ポリシーでは<strong>ラッパークラスなし</strong>で Durable Object が Container を制御
- `exec()`、アウトバウンドリクエストの傍受、実行時のイメージ・インスタンス選択、スナップショットがすべて <code>ctx.container</code> にある
- ストレージ・アラーム・WebSocket・RPC と組み合わせられる

</div>

<div class="pt-2 text-sm">

Linux 環境 = Container／ID・状態・ポリシー・ライフサイクル = Durable Object。Dynamic Workers を足せばタスクごとに実行環境を選べる

</div>

---

# Durable Object × Container の 3 パターン

<div class="text-center">
<img src="https://blog.cloudflare.com/_emdash/api/media/file/01M3RZHX4W63MBJM5R8X7VVE2G.01M3RZHXT3X1AAZRW96ZVHJNB2.png" style="max-height: 330px; margin: 0 auto;" />
</div>

<div class="text-xs opacity-60 pt-2">出典: Cloudflare Blog https://blog.cloudflare.com/faster-agent-sandboxes/</div>

---

# ユースケース 1: エージェントセッション

- エージェントループを <strong>Durable Object</strong> で動かす（セッション状態、WebSocket でのユーザー通信、モデル呼び出し）
- シェル・コンパイラ・開発サーバーが必要なときだけ Container を起こす
- ユーザーやモデルを待つ間は Container を止める → <strong>アイドル中の Linux コンピュートには課金されない</strong>
- Container が眠っていてもエージェントは利用可能なまま

---

# ユースケース 2: 信頼されたアクセス

- Durable Object が、ユーザーが許可したサービス・リポジトリ・操作を覚えておく
- Container の <strong>Outbound Request Handler</strong> を更新する
  - 新しく許可された資格情報を注入
  - ポリシーを強制
  - 追加のアクティビティを記録
- Cloudflare OS の <strong>Gatekeeper パターン</strong>を、エージェントごとのコンピューターに適用したもの

---

# ユースケース 3: 評価と強化学習

1. コーディネーターがベースのワークスペースを<strong>スナップショット</strong>
2. N 個の試行へ<strong>フォーク</strong>（各試行に専用の Durable Object と Container）
3. 各 Durable Object が試行を監視し、Container がクラッシュしても結果を保持
4. コーディネーターが採点し、<strong>最良のものをスナップショット</strong>して、再びフォーク

---

# ユースケース 4: 他のエージェント基盤との連携

- Base44: アプリごとの隔離された開発環境（コマンド実行、依存関係のインストール、ライブプレビュー）
- Kilo Code: クラウドエージェントの<strong>セッションごとのワークスペース</strong>
- 連携先: Cursor Cloud Agents、Devin Outposts、OpenAI Agents API、Claude Managed Agents
- 高レベルの環境が欲しいときは <code>@cloudflare/computer</code>（Dynamic Workers + Containers + 同期されるファイルシステム）

---

# Container クラスと Sandbox SDK の変更

| 項目 | 内容 |
|---|---|
| 新機能 | `durable_object` ポリシー、高速起動、実行時のイメージ・インスタンス選択、スナップショットは <strong>`ctx.container` のみ</strong> |
| 旧クラス | `Container` と旧 `Sandbox` は <strong>2026-12-31</strong> まで維持。以降も既存のデプロイは動くが更新なし |
| Sandbox SDK 1.0 | 基底クラスではなく<strong>ユーティリティ集</strong>。自分の Durable Object の中で `ctx.container` と並べて使う |
| 移行 | 多くは `extends Container` → `extends DurableObject`、`this.ctx.container` を直接呼ぶ |

---

# なぜ Durable Object を表に出したのか

- 当初は、ほかのプラットフォームに近い使い心地にするため Durable Object を <code>Container</code> クラスの裏に隠した
- Sandbox SDK は、ランタイムにまだなかった<strong>コマンド実行・アウトバウンド傍受・スナップショット</strong>をユーザー空間で補っていた
- しかしエージェントのワークスペースが主要なワークロードになり、抽象化のコストが明らかに
- 多くのチームが独自のスリープポリシー、資格情報の扱い、eval の追跡方法を必要とした

---

# まとめ・所感

- 要点は「<strong>インフラをリクエスト時に実行されるコードにする</strong>」。イメージ・インスタンス・ロールアウトがコードに
- 速度は 2 段構え: Durable Object を起点にした配置 + 準備済み仮想マシンの復元
- 状態の分担: Linux 環境は Container、ID・状態・ポリシー・ライフサイクルは Durable Object
- ポリシー・スナップショットはパブリックベータ。既存利用者は 2026-12-31 までに `ctx.container` への移行を検討
- ベンチマークは ComputeSDK の独立測定。100,000 個 / 5.387 秒は Cloudflare 自身の予備的な試験
- Workers サンプル対象外（中心機能がパブリックベータで、公式デモが案内されているため）

---

# 参考リンク

- 原文（en-us）: https://blog.cloudflare.com/faster-agent-sandboxes/
- スケジューリングポリシー API: https://developers.cloudflare.com/containers/api/durable-object-container/
- スナップショットのガイド: https://developers.cloudflare.com/containers/guides/snapshots/
- 移行ガイド: https://developers.cloudflare.com/containers/guides/migrate-to-durable-object-container-api/
- デモ: https://github.com/cloudflare/containers-demos/tree/main/sandbox
- 関連スライド: [@cloudflare/computer](../cloudflare-computer/)、[Project Think](../project-think/)、[Cloudflare Agents](../agents-on-cloudflare/)、[Cloudflare OS](../cloudflare-os/)
- Wiki: [docs/articles/2026-09-30-faster-agent-sandboxes.md](https://github.com/syumai/cloudflare-blog-summaries/blob/main/docs/articles/2026-09-30-faster-agent-sandboxes.md)
