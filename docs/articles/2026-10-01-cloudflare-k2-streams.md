# Cloudflare K2 のご紹介: サーバーレスなイベントストリーム

- 原文: [https://blog.cloudflare.com/cloudflare-k2-streams/](https://blog.cloudflare.com/cloudflare-k2-streams/)（原題: Announcing Cloudflare K2: serverless event streams）
- 日本語版の出どころ: Cloudflare公式の日本語版（`https://blog.cloudflare.com/ja-jp/cloudflare-k2-streams/`）は確認時点で存在しなかった（404）ため、英語版（en-us）から日本語化して要約している。タイトルも筆者による訳。公開日は英語原文の datePublished（2026-10-01T13:00:00Z）に従う。
- 公開日: 2026-10-01
- 著者: Micah Wylde, Marc Selwan
- 位置づけ: Birthday Week 2026 の記事（読了目安は原文表記で 7 分）。Developer Platform 上の永続的なイベントストリーミングのプリミティブ「Cloudflare K2」のパブリックベータを扱う
- 関連: [Cloudflare Basin のご紹介: オープンなサーバーレスデータプラットフォームが一般提供に](./2026-10-01-cloudflare-basin.md)（K2 は Basin Pipelines の取り込み層として作られた。Pipelines と K2 の使い分けも本記事で説明される）、[cf のご紹介: Cloudflare API 全体を扱えるエージェント向け CLI](./2026-09-28-cloudflare-cf-cli-launch.md)（ストリーム作成に `cf k2 streams create` を使う）
- GitHub: [docs/articles/2026-10-01-cloudflare-k2-streams.md](https://github.com/syumai/cloudflare-blog-summaries/blob/main/docs/articles/2026-10-01-cloudflare-k2-streams.md)

![記事ヘッダー画像](https://blog.cloudflare.com/_emdash/api/media/file/01M3SXWMA7TC0H6D9G217A3327.png)
*図: 記事ヘッダー画像。虫眼鏡の中に雪山（K2 峰を連想させる）が描かれ、左右に旗・ロープ・カラビナや点線が並ぶ装飾イラスト（出典: Cloudflare Blog https://blog.cloudflare.com/cloudflare-k2-streams/。原文にキャプションはなく、説明は見た目からの筆者の推定。装飾のため、図としては扱わない）*

## TL;DR

- **Cloudflare K2** は、Developer Platform 上の**永続的なイベントストリーミングのプリミティブ**。イベントを K2 のストリームに送ると、順序付きのログとして保存され、複数のコンシューマーが自分のペースで読める。**パブリックベータ**として公開された。
- 内部は **R2 オブジェクトストレージの上に作った、パーティション化された永続ログ**。レプリケーションと合意をストレージ層に任せることで、アプリケーション層を単純・低コスト・高性能にしている。
- 代償として produce のレイテンシが大きく、初期リリースでは **99 パーセンタイルで約 1 秒**。
- 書き込みは HTTP API または Worker バインディング、読み出しは「サブスクリプション」を作り、`consume` で取得して `ack` / `nack` / リース延長する。読み出しは作業分割（各コンシューマーが一部を受け取る）、全員に全メッセージを配る pub/sub、またはその混在が可能。
- 使い分けは、**Queues**（個々の作業項目の追跡・リトライ・デッドレターキュー）、**Basin Pipelines**（R2 や Iceberg への書き込みが最終目的）、**K2**（高スケールのデータ移動・長期保持・ファンアウト・カスタム処理）。

## 背景・課題

従来の RPC 型のアーキテクチャでは、プロデューサーとコンシューマーが**スケールと時間の両面で歩調を合わせる**必要がある。プロデューサーの送るデータ量がコンシューマーの処理能力を超えたり、コンシューマーや下流のサービスが利用できなくなったりすると、イベントが落ちる。独立に処理したいコンシューマーが複数いる場合は、問題がさらに大きくなる。記事の例では、EC のバックエンドが取引完了時にイベントを出し、それを分析システムと不正検知サービスの両方が読む。

解決策は、プロデューサーとコンシューマーの間にサービスを置いて、書き込みを吸収しつつ、独立した読み手が自分のペースで消費できるようにすること（疎結合化）で、K2 はこの役割を担う。

## 発表内容 / アーキテクチャ

### K2 とは

K2 は、Developer Platform 上の永続的なイベントストリーミングのプリミティブ。ストリームにイベントを送ると、順序付きのログとして保存される。完全にサーバーレスで、大量のデータにスケールし、長期保持に対応するため、コンシューマーが長時間停止してもデータを失わない。内部では、R2 の上にパーティション化された永続ログを実装しており、大量のストレージにスケールできる。

### エッジ上のストリーム: なぜ R2 の上に作ったか

- **きっかけ**: K2 はもともと、**Basin Pipelines の取り込み層**となるエッジ上の永続バッファとして必要になり、作られた。Pipelines は、プル型で動作する [Arroyo](https://www.arroyo.dev) のストリーム処理エンジンで動いている。イベントは「読む・変換する・R2 に書く」の前にどこかに保管されている必要があり、Pipelines のストリームがイベントを受け付けたら落とさないと約束している以上、その保管先は長期間でも失われない永続性を持たなければならない。
- **Kafka を使わない理由**: 多くの企業はここで Apache Kafka を導入するが、Pipelines は **335 以上の都市**に広がる Cloudflare のエッジで動く。独自のアーキテクチャのため、Kafka のような従来型の分散システムのソフトウェアをそのまま動かせないことが多く、作り方・運用の仕方から考え直す必要があった。
- **エッジ上でステートフルなサービスを作る難しさ**: 機械の小さな一部しか使えない、機械が比較的短命、ネットワークが多くの場合パブリックなインターネット経由。一方で、世界中のユーザーの近くにあり、水平にスケールする能力が非常に高いという強みがある。
- **R2 を使う設計判断**: 既にある強力な状態管理のプリミティブである R2 を使う。オブジェクトストレージは、極めて高い耐久性（[11 ナイン](https://developers.cloudflare.com/r2/reference/durability/)）と、強い一貫性を持つ API を兼ね備える。レプリケーションと合意をストレージ層に任せることで、アプリケーション層（K2）を極めて単純・低コスト・高性能にできる。さらに、コンピュートとストレージが分離されるため、それぞれを独立にスケールでき、大量の過去データを低コストで保持できる。

### オブジェクトストレージ上でログを作る方法

R2 を含むオブジェクトストアは、ログの標準的な操作である**追記（append）に対応していない**。そのため、完全なファイル（**セグメント**）を書く必要があり、各セグメントは書き込み・読み出しのコストを回収できる大きさでなければならない。K2 は次のように作る。

1. エッジのサービス上で、書き込みをまずメモリに蓄積する。
2. データが集まるまで少し待ってから、すべてのイベントを 1 つのセグメントファイルとして書く。
3. 順序付けと、単調に増えるオフセットは、**R2 のアトミックな操作**で実現する。別途の調整サービスは不要。

トレードオフとして、**produce のレイテンシが大きくなる**。オブジェクトストレージへの書き込みはローカルディスクより遅く、ローカルのバッチが溜まるのも待つため、初期リリースでは 99 パーセンタイルで約 1 秒になる。設計の詳細は、後日の技術的な深掘り記事で共有される予定とのこと。

### Streams, Queues, Pipelines の使い分け

| 製品 | 設計の中心 | 向いている用途 |
| --- | --- | --- |
| Queues | 高コスト・長時間の作業を、1 項目ずつ追跡して非同期に完了させる | 画像処理のリクエストのように、作業単位のリトライ・遅延・失敗時のデッドレターキューが必要な処理 |
| Basin Pipelines | サーバーレスの取り込みサービス。JSON イベントを変換して R2 または Basin Catalog に書く | 最終的に**オブジェクトストレージや Iceberg テーブルへ書く**場合 |
| K2 | 高スケールのデータ移動、長期保持、ファンアウト消費 | **カスタム処理や、他の宛先への書き込み**をする場合 |

K2 のメッセージはバッチ単位で produce・consume される。効率的に処理できる反面、メッセージ単位のリトライはできない。バッチ化は Queues より高い produce レイテンシの原因にもなる。

### 始め方: ストリーム・サブスクリプション・消費

記事は、プロダクト分析イベントの収集・処理を例に、次の流れを示す。

1. **ストリームの作成**: アカウント内に、用途やイベントの種類ごとに複数のストリームを作れる。作成は cf、Wrangler、ダッシュボード、API から行える。
2. **イベントの書き込み（produce）**: HTTP API または Worker バインディングから送る。K2 はデータをバイト列として扱うため、アプリケーションに合う形式・エンコードを使える。
3. **サブスクリプションの作成**: サブスクリプションは、コンシューマー間で作業を分割し、読み出しの並列性（1 台のサーバーで扱える量を超える負荷を複数の読み手に分散すること）を実現する。`start_at` で読み出しの開始位置（記事の例では `earliest`）を指定する。
4. **消費（consume）**: 各コンシューマーが `worker_id` を付けてポーリングする。取得したバッチには**リースが 5 分間**付き、コンシューマーは次の 3 つのどれかを行える。
   - **ack**: バッチを処理済みにし、再配信されないことを保証する。
   - **nack**（negative ack）: 処理に失敗したので再配信してほしい、と伝える。
   - **リースの延長**: 処理に時間が必要な場合。

読み出しの方式は 3 通りある。(1) 1 つのサブスクリプションを複数のコンシューマーで分け合い、各コンシューマーがデータの一部を受け取る。(2) コンシューマーごとに別のサブスクリプションを作り（pub/sub パターン）、各コンシューマーがすべてのメッセージを見る。(3) 両者を組み合わせ、独立した複数のコンシューマープールを持つ。

### 料金と提供状況

K2 は、Workers Paid プランのアカウント向けに**パブリックベータ**として提供され、次の上限がある。

| 項目 | ベータ中の上限 |
| --- | --- |
| 保存量 | 最大 10GB |
| produce 速度 | 1 ストリームあたり 30 MB/s |

上限の引き上げは Discord または上限引き上げのフォームで依頼できる。**ベータ期間中は課金されない**。課金開始後は次の料金を想定している。

| 項目 | 想定料金 |
| --- | --- |
| Data Produced | $0.04 / GB |
| Data Consumed | $0.04 / GB |
| Data Retained | $0.02 / GB / 月 |

### 今後の予定

- 書き込みの並列性の向上（複数 GB/s のストリームまで）
- メッセージキーと、キーに基づく順序保証
- プッシュ型の Worker コンシューマー
- produce とエンドツーエンドのレイテンシを下げる Express ティア
- Apache Kafka クライアントのドロップイン対応

## コード例

記事のコード例は 4 つ。いずれも原文のまま転記する（3 つ目の `consume` の例には、原文時点でバックスラッシュ付きの引用符（`\"https://...`）とエンドポイントの ID が他の例と異なる箇所があり、原文どおりに載せている）。

### 1. cf でストリームを作成する

```bash
$ cf k2 streams create --name app_events --http-enabled
{
  "id": "d78b09ee1f50430e9ec92a8af92b0231",
  "name": "app_events",
  "retention_seconds": 604800,
  "endpoint": "https://d78b09ee1f50430e9ec92a8af92b0231.k2.cloudflarestorage.com",
  "http": {
    "enabled": true,
    "authentication": false
  },
  "worker_binding": {
    "enabled": true
  },
  "created_at": "2026-09-28T15:14:39.053Z",
  "modified_at": "2026-09-28T15:14:39.053Z"
}
```

`--http-enabled` で HTTP による produce を有効にしたストリームを作る。レスポンスから、保持期間が `retention_seconds: 604800`（7 日）であること、ストリーム固有のエンドポイントが発行されること、Worker バインディングが有効であることが分かる。

### 2. Worker バインディングから produce する

```ts
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

`send` はレコードの配列を受け取り、`content` はバイト列（`TextEncoder` で JSON 文字列を変換）、`headers` はメタデータ。結果の `success` を確認し、失敗時は `error.retryable` で 503（再試行可能）と 500 を使い分けている。記事では「Worker バインディングを設定したうえで」と書かれており、バインディングの設定ファイルの書き方は原文に載っていない（詳細は [Produce from a Worker](https://developers.cloudflare.com/k2/features/produce/#produce-from-a-worker) を参照）。

### 3. サブスクリプションの作成と consume

```bash
$ curl -X POST "https://d78b09ee1f50430e9ec92a8af92b0231.k2.cloudflarestorage.com/subscriptions" \
    -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
    -H "Content-Type: application/json" \
    --data '{
      "name": "analytics_processor",
      "start_at": { "type": "earliest" }
    }'
{
  "result": { "id": "ee13f761783d3823a447a47b572ebf76" },
  "success": true,
  "errors": [],
  "messages": []
}
```

```bash
$ curl -X POST \"https://4d8f5394e3e733debdeca9c65c5b7439.k2.cloudflarestorage.com/subscriptions/ee13f761783d3823a447a47b572ebf76/consume" \
    -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
    -H "Content-Type: application/json" \
    --data '{
      "worker_id": "analytics-1",
      "max_records": 100
    }'
{
  "result": {
    "batch_id": "b7e4c9210a3f468d95c2e1068fdb734a",
    "leased_until_ms": 1790633929437,
    "records": [
      {
        "timestamp_ms": 1790633629168,
        "content": "eyJldmVudCI6InBhZ2VfdmlldyJ9",
        "headers": {
          "content-type": "application/json"
        }
      },
      ...
    ]
  },
  "success": true,
  "errors": [],
  "messages": []
}
```

サブスクリプションの作成で `start_at` に `earliest`（先頭から）を指定し、返された ID を使って `consume` を呼ぶ。`worker_id` はコンシューマーの識別子で、`max_records` で 1 回に受け取る最大レコード数を指定する。応答の `leased_until_ms` がリースの期限（取得から 5 分後）で、`content` は base64 エンコードされたバイト列（`eyJldmVudCI6InBhZ2VfdmlldyJ9` は `{"event":"page_view"}` にデコードされる）。

### 4. バッチの ack

```bash
$ curl -X POST "https://d78b09ee1f50430e9ec92a8af92b0231.k2.cloudflarestorage.com/subscriptions/ee13f761783d3823a447a47b572ebf76/batches/b7e4c9210a3f468d95c2e1068fdb734a/ack" \
  -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
  -H "Content-Type: application/json" \
  --data '{ "worker_id": "analytics-1" }'
```

`batches/<batch_id>/ack` に、consume と同じ `worker_id` を付けて POST することで、バッチを処理済みにする。

## ユースケース

- **EC のバックエンド**: 取引完了のイベントをストリームに書き、分析システムと不正検知サービスが、それぞれ別のサブスクリプションで同じイベントをすべて受け取る（記事の例）。
- **プロダクト分析のイベント収集**: Worker から `page_view` などのイベントを書き、コンシューマー群がサブスクリプションで作業を分け合って処理する（記事の例）。
- **ストリーム処理の取り込みバッファ**: Basin Pipelines の取り込み層として、受け付けたイベントを落とさず保持する（K2 が作られた経緯）。
- **コンシューマーが長時間止まる構成**: 長期保持により、コンシューマーのダウンタイム中もデータを失わず、復旧後に続きを読める。
- **R2 や Iceberg 以外への配送・カスタム処理**: 最終的な宛先が R2 や Iceberg テーブルなら Pipelines、それ以外の宛先やカスタム処理なら K2、という使い分け（記事の推奨）。

## 所感・ポイント

- 「追記できないオブジェクトストレージの上にログを作る」という発想がこの記事の中心。メモリでの蓄積→セグメント書き込み→R2 のアトミック操作による順序付け、という流れで、別の調整サービスを持たない代わりに、produce の p99 が約 1 秒というコストを受け入れている。低レイテンシが必要な用途には現時点では向かず、記事も Express ティア（低レイテンシ）を今後の予定に挙げている。
- Queues との違いは「作業項目の追跡（リトライ・遅延・DLQ）」か「データの移動・保持・ファンアウト」か。K2 はメッセージ単位のリトライをしないため、失敗の扱いはバッチ単位の ack / nack / リース延長になる。
- 記事の課金額は「課金開始後に想定される料金」であり、確定ではない。ベータ中の上限（10GB・30 MB/s）も合わせて確認が必要。
- 設計の詳細（セグメントの管理、オフセットの割り当てなど）は後日の技術記事で説明される予定で、本記事では概要のみ。
- 画像キャプション: ヘッダー画像は原文のキャプションが確認できず、説明は見た目からの筆者の推定。
- **サンプルについて**: K2 はパブリックベータで、Worker バインディングの設定方法など再現に必要な情報が記事内にそろっておらず、記事の中心機能が一般提供ではないため、デプロイ可能なサンプルは作成していない（サンプル対象外）。

## 関連リンク

- 原文（en-us）: [https://blog.cloudflare.com/cloudflare-k2-streams/](https://blog.cloudflare.com/cloudflare-k2-streams/)
- 本リポジトリ内の関連記事: [Cloudflare Basin のご紹介](./2026-10-01-cloudflare-basin.md) / [cf のご紹介](./2026-09-28-cloudflare-cf-cli-launch.md)
- 記事内から張られているリンク:
  - [K2 ドキュメント](https://developers.cloudflare.com/k2/) / [Get started](https://developers.cloudflare.com/k2/get-started/) / [Produce from a Worker](https://developers.cloudflare.com/k2/features/produce/#produce-from-a-worker)
  - [Basin Pipelines](https://developers.cloudflare.com/pipelines/) / [Queues](https://developers.cloudflare.com/queues/)
  - [R2 の耐久性](https://developers.cloudflare.com/r2/reference/durability/) / [Arroyo](https://www.arroyo.dev)
  - [cf CLI の発表](https://blog.cloudflare.com/cloudflare-cf-cli-launch/)
  - [Cloudflare Discord](https://discord.com/invite/cloudflaredev) / [上限引き上げのフォーム](https://docs.google.com/forms/d/e/1FAIpQLSf1_eGOxXFGsh4O72fqdvDbYBjzpV3Q6Vf5X3fqpoTHObGFIA/viewform)
