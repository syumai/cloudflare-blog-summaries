---
routerMode: hash
theme: default
title: "Cloudflare K2 のご紹介: サーバーレスなイベントストリーム"
info: |
  Announcing Cloudflare K2: serverless event streams の解説スライド。
  原文: https://blog.cloudflare.com/cloudflare-k2-streams/
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

# Cloudflare K2 の<br>ご紹介

サーバーレスなイベントストリーム（パブリックベータ）

Birthday Week 2026

<div class="pt-4 text-sm opacity-70">
原文: https://blog.cloudflare.com/cloudflare-k2-streams/<br>
公開日: 2026-10-01
</div>

---

# TL;DR

- <strong>Cloudflare K2</strong> は Developer Platform 上の永続的なイベントストリーミングのプリミティブ。<strong>パブリックベータ</strong>
- 内部は <strong>R2 の上に作ったパーティション化された永続ログ</strong>。複製と合意はストレージ層に任せる
- 代償は produce のレイテンシ。初期リリースで<strong>p99 約 1 秒</strong>
- 書き込みは HTTP API / Worker バインディング。読み出しはサブスクリプションを作って <code>consume</code> → <code>ack</code> / <code>nack</code> / リース延長
- 使い分け: <strong>Queues</strong>（作業項目の追跡）/ <strong>Basin Pipelines</strong>（R2・Iceberg へ）/ <strong>K2</strong>（データ移動・長期保持・ファンアウト）

---

# アジェンダ

- 背景: プロデューサーとコンシューマーの疎結合化
- K2 とは、エッジ上で R2 を使う理由
- オブジェクトストレージ上でログを作る方法
- Streams / Queues / Pipelines の使い分け
- コード例: ストリーム作成・produce・consume・ack
- ユースケース、料金・制限、今後の予定

---

# 背景: 歩調を合わせる必要がある RPC

<div class="grid grid-cols-2 gap-6 pt-4 text-left">
<div class="p-4 border rounded">

<strong>従来の RPC 型の課題</strong>

- プロデューサーとコンシューマーが<strong>スケールと時間</strong>を合わせる必要がある
- 送信量が処理能力を超える、または下流が停止するとイベントが落ちる
- 独立に処理したい複数のコンシューマーがいると悪化する

</div>
<div class="p-4 border rounded">

<strong>解決: 間にサービスを置く</strong>

- 書き込みを吸収する
- 独立した読み手が自分のペースで消費する
- 例: EC の取引完了イベントを、分析システムと不正検知サービスが別々に読む

</div>
</div>

---

# K2 とは

<div class="text-left pt-2">

- イベントをストリームに送ると、<strong>順序付きのログ</strong>として保存される
- 読み方は複数: 作業を分割する、全員に全メッセージを配る、など
- 完全にサーバーレス、大量データにスケール、<strong>長期保持</strong>に対応
- コンシューマーが長時間停止してもデータを失わない
- 実装は <strong>R2 上のパーティション化された永続ログ</strong>

</div>

---

# エッジ上のストリーム: なぜ R2 か

<div class="text-sm text-left">

- <strong>きっかけ</strong>: Basin Pipelines の取り込み層となる、エッジ上の永続バッファが必要だった
- <strong>Kafka を使わない</strong>: 335 以上の都市に広がるエッジでは、従来型の分散システムをそのまま動かせないことが多い
- <strong>エッジの制約</strong>: 機械の小さな一部しか使えない / 機械が短命 / ネットワークはパブリックなインターネット
- <strong>強み</strong>: ユーザーに近く、水平スケールの能力が高い

</div>

<div class="text-sm pt-4 text-left">

→ 既にある状態管理のプリミティブ <strong>R2</strong>（11 ナインの耐久性・強い一貫性の API）に複製と合意を任せ、アプリケーション層を単純・低コスト・高性能にする。コンピュートとストレージを独立にスケールでき、過去データも低コストで保持できる。

</div>

---

# オブジェクトストレージ上でログを作る

<div class="text-sm text-left">

R2 などのオブジェクトストアは<strong>追記（append）に非対応</strong>。完全なファイル（<strong>セグメント</strong>）を書く必要がある。

</div>

<div class="grid grid-cols-3 gap-4 pt-4 text-left text-sm">
<div class="p-3 border rounded">

<strong>1. 蓄積</strong>

エッジのサービス上で、書き込みをまずメモリに溜める

</div>
<div class="p-3 border rounded">

<strong>2. セグメント書き込み</strong>

少し待ってから、全イベントを 1 つのセグメントファイルとして R2 に書く

</div>
<div class="p-3 border rounded">

<strong>3. 順序付け</strong>

R2 のアトミックな操作で、順序と単調増加のオフセットを実現。別の調整サービスは不要

</div>
</div>

<div class="text-sm pt-4 text-left">

トレードオフ: produce のレイテンシが増える。初期リリースで <strong>99 パーセンタイルが約 1 秒</strong>。設計の詳細は後日の技術記事で説明予定。

</div>

---

# Streams / Queues / Pipelines の使い分け

<div class="text-sm pt-2">

| 製品 | 設計の中心 | 向いている用途 |
| --- | --- | --- |
| Queues | 作業項目の追跡（リトライ・遅延・DLQ） | 画像処理の依頼など、項目単位の非同期処理 |
| Basin Pipelines | JSON を変換して R2 / Catalog へ | 最終的に R2 や Iceberg に書く場合 |
| K2 | 高スケールのデータ移動・長期保持・ファンアウト | カスタム処理や他の宛先への書き込み |

</div>

<div class="text-sm pt-2 text-left">

K2 はバッチ単位で produce / consume する。効率的だが<strong>メッセージ単位のリトライはなく</strong>、produce レイテンシも Queues より大きい。

</div>

---

# コード例 1: ストリームの作成

<div class="text-sm text-left">

アカウント内に用途別の複数ストリームを作れる。cf・Wrangler・ダッシュボード・API から作成可能。

</div>

```bash
$ cf k2 streams create --name app_events --http-enabled
{
  "id": "d78b09ee1f50430e9ec92a8af92b0231",
  "name": "app_events",
  "retention_seconds": 604800,
  "endpoint": "https://d78b09ee1f50430e9ec92a8af92b0231.k2.cloudflarestorage.com",
  "http": { "enabled": true, "authentication": false },
  "worker_binding": { "enabled": true },
  ...
}
```

<div class="text-sm text-left">

<code>--http-enabled</code> で HTTP produce を有効化。保持期間は 604800 秒（7 日）、ストリーム固有のエンドポイントが発行される。

</div>

---

# コード例 2: Worker バインディングから produce

```ts {1-9|10-15}
const result = await env.EVENTS.send([
  {
    content: new TextEncoder().encode(
      JSON.stringify({
        event: "page_view",
        path: new URL(request.url).pathname,
        timestamp: Date.now(),
      }),
    ),
    headers: { "content-type": "application/json" },
  },
]);
if (!result.success) {
  console.error(`Produce failed: ${result.error.message}`);
  return new Response("Failed to record event", {
    status: result.error.retryable ? 503 : 500,
  });
}
```

<div class="text-sm text-left">

K2 はデータを<strong>バイト列</strong>として扱う（形式は自由）。失敗時は <code>error.retryable</code> で 503 / 500 を使い分ける。

</div>

---

# コード例 3: サブスクリプションの作成

<div class="text-sm text-left">

サブスクリプションはコンシューマー間で作業を分割し、<strong>読み出しの並列性</strong>を実現する。

</div>

```bash
$ curl -X POST ".../subscriptions" \
    -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
    -H "Content-Type: application/json" \
    --data '{
      "name": "analytics_processor",
      "start_at": { "type": "earliest" }
    }'
{
  "result": { "id": "ee13f761783d3823a447a47b572ebf76" },
  "success": true
}
```

<div class="text-sm text-left">

<code>start_at</code> で読み出し開始位置を指定（例は <code>earliest</code>）。返った ID を consume に使う。（URL とレスポンスの一部は省略）

</div>

---

# コード例 4: consume でバッチを取得

```bash
$ curl -X POST ".../subscriptions/ee13.../consume" \
    -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
    --data '{
      "worker_id": "analytics-1",
      "max_records": 100
    }'
{
  "result": {
    "batch_id": "b7e4c9210a3f468d95c2e1068fdb734a",
    "leased_until_ms": 1790633929437,
    "records": [{
      "timestamp_ms": 1790633629168,
      "content": "eyJldmVudCI6InBhZ2VfdmlldyJ9",
      "headers": { "content-type": "application/json" }
    }, ...]
  }
}
```

<div class="text-sm text-left">

<code>content</code> は base64 エンコードされたバイト列（デコードすると JSON 文字列）。バッチには 5 分間のリースが付く。（ヘッダー・応答の一部は省略）

</div>

---

# リースと ack / nack

<div class="grid grid-cols-3 gap-4 pt-4 text-left text-sm">
<div class="p-3 border rounded">

<strong>ack</strong>

バッチを処理済みにする。再配信されないことが保証される

</div>
<div class="p-3 border rounded">

<strong>nack</strong>

処理に失敗したので、再配信を求める

</div>
<div class="p-3 border rounded">

<strong>リース延長</strong>

処理に時間がかかる場合に、5 分のリースを延ばす

</div>
</div>

<div class="pt-4"></div>

```bash
$ curl -X POST ".../subscriptions/ee13.../batches/b7e4.../ack" \
  -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
  --data '{ "worker_id": "analytics-1" }'
```

---

# 読み出しの 3 つの方式

<div class="grid grid-cols-3 gap-4 pt-4 text-left text-sm">
<div class="p-3 border rounded">

<strong>作業分割</strong>

1 つのサブスクリプションを複数のコンシューマーで分け合い、各自がデータの一部を受け取る

</div>
<div class="p-3 border rounded">

<strong>pub/sub</strong>

コンシューマーごとに別のサブスクリプションを作り、各自がすべてのメッセージを見る

</div>
<div class="p-3 border rounded">

<strong>混在</strong>

独立した複数のコンシューマープールを持つ

</div>
</div>

---

# ユースケース

<div class="text-sm text-left">

- <strong>EC のバックエンド</strong>: 取引完了イベントを、分析システムと不正検知サービスが別のサブスクリプションで読む
- <strong>プロダクト分析</strong>: Worker から <code>page_view</code> を書き、コンシューマー群が作業を分け合う
- <strong>ストリーム処理の取り込みバッファ</strong>: Basin Pipelines の取り込み層（K2 が生まれた経緯）
- <strong>長時間停止するコンシューマー</strong>: 長期保持により、復旧後に続きから読める
- <strong>R2・Iceberg 以外への配送やカスタム処理</strong>: 宛先が R2 / Iceberg なら Pipelines、それ以外なら K2

</div>

---

# 料金と制限（パブリックベータ）

<div class="grid grid-cols-2 gap-6 pt-2 text-left text-sm">
<div>

<strong>ベータ中の上限（Workers Paid）</strong>

| 項目 | 上限 |
| --- | --- |
| 保存量 | 最大 10GB |
| produce | 1 ストリーム 30 MB/s |

ベータ期間中は<strong>課金されない</strong>。

</div>
<div>

<strong>課金開始後の想定料金</strong>

| 項目 | 料金 |
| --- | --- |
| Data Produced | $0.04 / GB |
| Data Consumed | $0.04 / GB |
| Data Retained | $0.02 / GB / 月 |

</div>
</div>

---

# 今後の予定

<div class="text-left pt-2">

- 書き込みの並列性の向上（複数 GB/s のストリームまで）
- メッセージキーと、キーに基づく順序保証
- プッシュ型の Worker コンシューマー
- produce とエンドツーエンドのレイテンシを下げる Express ティア
- Apache Kafka クライアントのドロップイン対応

</div>

---

# まとめ・所感

- 「追記できないオブジェクトストレージの上にログを作る」ことが中心。R2 に複製と合意を任せ、別の調整サービスを持たない
- 代償は produce の p99 約 1 秒。低レイテンシ用途は今後の Express ティアを待つ形
- Queues は作業項目の追跡、K2 はデータ移動・保持・ファンアウトという違い
- 料金は「課金開始後の想定」であり、ベータ中の上限も確認が必要
- 本記事の機能はパブリックベータのため、Workers サンプルは作成していない

---

<div class="text-center">

# 参考リンク

</div>

- 原文: [Announcing Cloudflare K2: serverless event streams](https://blog.cloudflare.com/cloudflare-k2-streams/)（日本語版なし）
- [K2 ドキュメント](https://developers.cloudflare.com/k2/) / [Get started](https://developers.cloudflare.com/k2/get-started/)
- [Produce from a Worker](https://developers.cloudflare.com/k2/features/produce/#produce-from-a-worker)
- 関連解説スライド: [Cloudflare Basin のご紹介](../cloudflare-basin/) / [cf のご紹介](../cloudflare-cf-cli-launch/)

<div class="pt-8 text-sm opacity-50">
Wiki: docs/articles/2026-10-01-cloudflare-k2-streams.md
</div>
