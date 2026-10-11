# Workers KV Instant のご紹介: Quicksilver で動く、即時反映・低レイテンシの KV モード

- 原文: [https://blog.cloudflare.com/workers-kv-instant/](https://blog.cloudflare.com/workers-kv-instant/)（原題: Introducing Workers KV Instant — powered by Quicksilver）
- 日本語版の出どころ: Cloudflare公式の日本語版（`https://blog.cloudflare.com/ja-jp/workers-kv-instant/`）は確認時点で存在しなかった（404）ため、英語版（en-us）から日本語化して要約している。タイトルも筆者による訳。公開日は英語原文の datePublished（2026-10-01T13:00:00Z）に従う。
- 公開日: 2026-10-01
- 著者: Rob Sutter
- 位置づけ: Birthday Week 2026 の記事（読了目安は原文表記で 5 分）。Workers KV の新しいモード「KV Instant」のプライベートベータを扱う
- 関連: [Cloudflare K2 のご紹介: サーバーレスなイベントストリーム](./2026-10-01-cloudflare-k2-streams.md)（同じ日に発表された Developer Platform のストレージ系の記事）、[Cloudflare Basin のご紹介](./2026-10-01-cloudflare-basin.md)（同日のデータ基盤の記事）、[人とエージェントのためにドメイン購入をシンプルに: 新しいドメイン検索と Registrar](./2026-09-30-simplifying-domains.md)（Workers KV を「事前に用意したデータ」の置き場として使う例）
- GitHub: [docs/articles/2026-10-01-workers-kv-instant.md](https://github.com/syumai/cloudflare-blog-summaries/blob/main/docs/articles/2026-10-01-workers-kv-instant.md)

*注記: 本記事には、本文中に掲載された図やスクリーンショットはない（本文に画像要素がなく、記事ヘッダーの画像も確認できなかった）。そのため本Wikiに図は載せていない。*

## TL;DR

- **Workers KV Instant** は、Workers KV の新しいモード。変更をグローバルに即時反映し、コールドリードのペナルティがない。**プライベートベータ**として提供開始。
- 内部は、Cloudflare が社内で使ってきたキーバリューストア **Quicksilver**（v2）。Workers KV と**同じ API**（`get()` / `put()` / `list()` / `delete()`）で使える。
- 読み取りは classic モードの **100 倍以上高速**（p99 で 1.62 ms）。書き込みは約 20 倍以上速く、**99% が約 250 ms 以内**に全エッジへ複製される。
- 向いているのは「**更新が少なく、読み取りが多い、小さな設定データ**」。**1 MB・1 万キー**までという制約があり、storage と Class A 操作は classic より大幅に高い（読み取りだけ 60% 安い）。
- 主な差異は、モード指定（`"mode": "instant"`）が必要・メタデータ非対応・`list` はページネーションなしで全件返す・書き込みは **1 namespace あたり 1 秒に 1 回**まで。

## 背景・課題

Workers KV は 2018 年の Birthday Week に登場し、静的アセットやユーザー設定のような「たまに書き、頻繁に読む」データを素早く取り出すために、Developer Platform の中でも特に人気のあるサービスの 1 つになった。Cloudflare 自身も多くの製品で使っている。

一方、Cloudflare にはもう 1 つのキーバリューストア **Quicksilver** がある。2020 年の導入以来、何度もブログで取り上げてきたもので、グローバルな高速複製と低レイテンシのアクセスを目的に設計されている。Cloudflare へのほぼすべてのリクエストが、少なくとも 1 つのキーを Quicksilver から引いている。顧客から長年要望があったにもかかわらず、Quicksilver は顧客向けには提供されてこなかった。

KV Instant は、この Quicksilver を Workers KV の API の裏側で使えるようにするもの。「古い値が残る時間（TTL の期限切れを待つ必要がある）」と「キャッシュにないキーを初めて読むときの遅さ（コールドリード）」という、classic モードの弱点を取り除く。

## 発表内容 / アーキテクチャ

### Workers KV Instant とは

KV Instant は、Workers KV と同じ API を提供しつつ、実体を Quicksilver で動かすモード。記事の表現では、p99 の読み取りが 100 倍速く、更新は即時に反映され、TTL の期限切れを待つ必要がない。**頻繁には更新されないアプリケーション設定データ**（Cloudflare が Quicksilver を使っている用途と同じ）で真価を発揮する、とされている。すべての種類のデータに向くわけではない。

### 読み取りは 100 倍以上速く、書き込みは約 250 ms で複製

記事の比較表は次のとおり。

| モード | p99 読み取り（キャッシュ済み） | p99 読み取り（全体） | 書き込み複製の中央値 | 書き込み複製 p95 | 書き込み複製 p99 |
| --- | --- | --- | --- | --- | --- |
| Instant | N/A | 1.62 ms | 107 ms (1) | 181 ms (1) | 256 ms (1) |
| Classic | 160 ms | 287 ms | < 1 s (2, 3) | < 1 s (2, 3) | 4.38 s (2) |

表の注記（原文どおり）:

1. すべてのエッジロケーション（掲載時点で 300 以上）に複製されるまでの時間
2. 必要なすべてのストレージバックエンドに複製されるまでの時間
3. classic モードでは、1 秒未満の粒度でレプリケーションの遅延を計測できていない

本文では、Instant の読み取りは「p99 で 2 ミリ秒未満、p95 はマイクロ秒単位」、書き込みは「99% が約 250 ms で複製される」と述べている。KV Instant は **Quicksilver v2**（Cloudflare が社内で開発した、惑星規模の高速複製と低レイテンシアクセスのためのキーバリューストア）で動く。ホットパス上で読む設定値、特に「書いた直後にほぼ即座にグローバルで見えてほしいフラグや設定」に向く。

### API: これまでと同じ get / put / list / delete

記事では、製品発表のキーノートで、壇上での紹介と同時に（10:13 AM ちょうどに）トップページを切り替えたい、という例を挙げている。読み取りが限りなく低レイテンシで、リクエストごとに読めて、変更したら即座に反映されるキーがほしい、というユースケースである。

Workers KV の classic 版との差異は次の 3 点。それ以外のバインディング操作は、classic と互換とされている。

1. KV namespace を作るときに **KV Instant モードを指定**する必要がある（`"mode": "instant"` 属性を渡す）。
2. **メタデータは非対応**。`getWithMetadata` は常に `null` を返し、`put` でメタデータを渡すこともできない。
3. `list` は namespace 内の一致するキーを**すべて返す**。ページネーションはない。

### 料金: 読み取りは classic より 60% 安い

KV Instant は、読み取りが多く、データが小さいワークロードに合わせた価格設定。データを Cloudflare のすべてのロケーションに伝搬し、全リクエストのホットパスで長年運用してきた Quicksilver を使うため、読み取りの料金を Workers KV より 60% 下げられ、他のグローバルな設定管理製品よりもはるかに安いとしている。逆に、**storage と Class A 操作は Workers KV よりかなり高い**。大量のデータを置く、または頻繁に更新する場合は、Workers KV が引き続き適している。

| | Class B（読み取り） | Class A（put, delete, list） | Storage |
| --- | --- | --- | --- |
| Workers KV Instant | $0.20 / 100 万 | $0.10 / 操作 | $100 / MB / 月 |
| Workers KV | $0.50 / 100 万 | $5.00 / 100 万 | $0.50 / GB / 月 |

- **Storage**: $100 / MB / 月。キーは最大 300 バイト。値は、namespace の合計が 1 MB を超えない範囲で任意のサイズ。1 つの KV Instant namespace には**最大 1 万のキーバリューペア**を置ける。
- **Class A 操作**（put / delete / list）: 1 操作あたり $0.10。書いた・削除した各キーが 1 操作。`list` はリクエスト 1 回が 1 操作で、返るキー数によらない。1 回の `list` で namespace 内の全ペアを 1 ページで返せる。
- **書き込み頻度の制限**: すべての書き込みが単一のシステムオブレコード（system of record）を通るため、**1 namespace あたり 1 秒に 1 回**に制限される。classic Workers KV の「1 キーあたり 1 秒に 1 回」と似ており、更新順序を考えやすくなる。
- **Class B 操作**（get）: 要求したキー 1 つにつき $0.20 / 100 万。1 回の `get` に複数キーを渡した場合も、キーごとに 1 操作と数えられる。

### 提供状況

KV Instant は**プライベートベータ**として提供開始。記事は、試したい顧客と協力して徐々に広げたいとして、サインアップを呼びかけている（ベータのページは [Workers KV Instant beta](https://www.cloudflare.com/resource/workers-kv-instant-beta/)）。

## コード例

記事のコード例は 2 つ。いずれも原文のまま転記する。

### 1. リクエストごとにローンチフラグを読む

```js
async fetch(request, env, ctx) {
  // Read the launch flag from KV Instant on every request
  const launched = (await env.APP_CONFIG.get("new-product-launched")) === "true";

  if (launched) {
    // Serve the launch homepage
    return new Response({...});
  }

  return new Response({...});
},
```

`env.APP_CONFIG` は KV Instant の namespace を指すバインディング。`get` の呼び出しは classic の Workers KV と同じで、`new-product-launched` の値が `"true"` かどうかでトップページを切り替える。記事のコードは断片であり、`new Response({...})` は省略記法（そのままでは動かない）、バインディング名 `APP_CONFIG` の設定方法やモード指定の具体的な書き方（`"mode": "instant"` をどこに書くか）は原文に載っていない。

### 2. 複数キーの取得と Class B 操作

```js
// Requesting keys via three individual get operations 
// incurs three Class B operations.
let routeAPAC = await APP_CONFIG.get("route_APAC");
let routeEUR = await APP_CONFIG.get("route_EUR");
let routeNAMER = await APP_CONFIG.get("route_NAMER");

// Requesting three keys in a single get operation 
// also incurs three Class B operations.
let routes = await APP_CONFIG.get(["route_APAC", "route_EUR", "route_NAMER"]);
```

3 回に分けて `get` しても、キーの配列を 1 回の `get` に渡しても、課金上は同じく 3 回の Class B 操作になる。まとめて取得することでラウンドトリップは減らせても、読み取りの課金は減らない、という点がポイント。

## ユースケース

- **フィーチャーフラグ・ローンチフラグ**: 発表の瞬間にトップページを切り替える、といった「書いたら即座に全世界で効いてほしい」フラグ（記事の例）。
- **アプリケーション設定**: リクエストごとのホットパスで読む設定値。Cloudflare 自身が Quicksilver を使っている用途と同じ。
- **ルーティング設定**: リージョンごとの経路（`route_APAC` / `route_EUR` / `route_NAMER`）を複数キーでまとめて読む（記事の例）。
- **向かない用途**: 大量のデータの保存、頻繁な更新（記事が明示。この場合は Workers KV が適する）。

## 所感・ポイント

- 「同じ API で、裏側のストアを Quicksilver に差し替える」という設計が要点。コードはほぼそのまま、namespace の作成時にモードを選ぶだけで、読み取りの性質が大きく変わる。
- 制約が強い点に注意。**1 namespace は 1 MB・1 万キーまで、キーは 300 バイトまで、書き込みは namespace あたり 1 秒に 1 回、メタデータなし**。classic KV の用途をそのまま置き換えるものではなく、小さな設定専用のモードとして読むのがよい。
- 料金は逆転している。読み取りは classic の 40%（60% 安い）だが、storage は $100 / MB / 月で classic の $0.50 / GB / 月と大きく異なり、Class A 操作は $0.10 / 操作（classic は $5.00 / 100 万操作）。単純に「安い」とは言えず、読み取りが書き込みを圧倒する小さなデータでだけ得になる。
- classic の表で、書き込みの p99 が 4.38 s と、中央値・p95（< 1 s）から大きく離れている点も、「即時反映」を求める用途で Instant を選ぶ理由として読める（注記 3 のとおり classic は 1 秒未満の粒度で計測できていない）。
- 本文は「書き込みは 20 倍以上速く」と述べるが、表の p99 同士（4.38 s と 256 ms）では約 17 倍にとどまる。比較の取り方（注記 2・3 を含む）が異なると考えられ、本Wikiでは原文の数値をそのまま記載している。
- 画像キャプション: 本記事に図は無く、キャプションの推定は行っていない。
- **サンプルについて**: KV Instant はプライベートベータで、利用にはサインアップが必要であり、モード指定の設定方法も記事に示されていない。第三者が再現できる状態にないため、デプロイ可能なサンプルは作成していない（サンプル対象外）。classic の Workers KV で同じ API を試すことは可能。

## 関連リンク

- 原文（en-us）: [https://blog.cloudflare.com/workers-kv-instant/](https://blog.cloudflare.com/workers-kv-instant/)
- 本リポジトリ内の関連記事: [Cloudflare K2 のご紹介](./2026-10-01-cloudflare-k2-streams.md) / [Cloudflare Basin のご紹介](./2026-10-01-cloudflare-basin.md) / [人とエージェントのためにドメイン購入をシンプルに](./2026-09-30-simplifying-domains.md)
- 記事内から張られているリンク:
  - [Workers KV ドキュメント](https://developers.cloudflare.com/kv/) / [Workers KV API](https://developers.cloudflare.com/kv/api/) / [Read key-value pairs](https://developers.cloudflare.com/kv/api/read-key-value-pairs/)
  - [Introducing Workers KV（2018）](https://blog.cloudflare.com/introducing-workers-kv/)
  - [Introducing Quicksilver: Configuration Distribution at Internet Scale](https://blog.cloudflare.com/introducing-quicksilver-configuration-distribution-at-internet-scale/)
  - [Quicksilver v2: evolution of a globally distributed key-value store (Part 1)](https://blog.cloudflare.com/quicksilver-v2-evolution-of-a-globally-distributed-key-value-store-part-1/)
  - [Workers KV Instant のプライベートベータ申し込み](https://www.cloudflare.com/resource/workers-kv-instant-beta/)
