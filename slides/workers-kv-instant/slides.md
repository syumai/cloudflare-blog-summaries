---
routerMode: hash
theme: default
title: "Workers KV Instant のご紹介: Quicksilver で動く KV の新モード"
info: |
  Introducing Workers KV Instant — powered by Quicksilver の解説スライド。
  原文: https://blog.cloudflare.com/workers-kv-instant/
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

# Workers KV Instant の<br>ご紹介

Quicksilver で動く、即時反映・低レイテンシの KV モード（プライベートベータ）

Birthday Week 2026

<div class="pt-4 text-sm opacity-70">
原文: https://blog.cloudflare.com/workers-kv-instant/<br>
公開日: 2026-10-01
</div>

---

# TL;DR

- <strong>Workers KV Instant</strong> は、変更を即時にグローバル反映し、コールドリードのペナルティがない Workers KV の新モード（<strong>プライベートベータ</strong>）
- 裏側は Cloudflare 社内の KV ストア <strong>Quicksilver（v2）</strong>。API は Workers KV と同じ
- 読み取りは <strong>100 倍以上高速</strong>（p99 1.62 ms）。書き込みは 99% が約 250 ms で全エッジへ複製
- 向くのは<strong>更新が少なく読み取りが多い小さな設定データ</strong>。1 MB・1 万キーまで
- 読み取りは classic より <strong>60% 安い</strong>が、storage と Class A 操作は大幅に高い

---

# アジェンダ

- 背景: Workers KV と Quicksilver
- 性能: 読み取りと書き込みの複製
- API と classic モードとの 3 つの差異
- 料金と制限
- コード例、ユースケース、まとめ

---

# 背景: 2 つのキーバリューストア

<div class="grid grid-cols-2 gap-6 pt-4 text-left">
<div class="p-4 border rounded">

<strong>Workers KV（2018 年〜）</strong>

- 静的アセットやユーザー設定など、たまに書き頻繁に読むデータ向け
- Cloudflare の多くの製品でも利用
- TTL 経過までの古い値、コールドリードが弱点

</div>
<div class="p-4 border rounded">

<strong>Quicksilver（2020 年〜ブログで紹介）</strong>

- 高速なグローバル複製と低レイテンシのアクセス
- Cloudflare へのほぼすべてのリクエストが 1 つ以上のキーを引く
- 顧客には提供されていなかった

</div>
</div>

<div class="text-sm pt-4 text-left">

→ KV Instant は、Quicksilver を Workers KV の API の裏側で使えるようにしたモード。

</div>

---

# 100 倍以上速い読み取り

<div class="text-sm pt-2">

| モード | p99 読み取り（全体） | 書き込み複製 中央値 | p95 | p99 |
| --- | --- | --- | --- | --- |
| Instant | <strong>1.62 ms</strong> | 107 ms | 181 ms | 256 ms |
| Classic | 287 ms（キャッシュ済みで 160 ms） | &lt; 1 s | &lt; 1 s | 4.38 s |

</div>

<div class="text-sm pt-2 text-left">

- Instant の複製時間は「すべてのエッジロケーション（300 以上）に届くまで」
- Classic は「必要なすべてのストレージバックエンドに届くまで」。1 秒未満の粒度では計測できていない
- 本文では p95 の読み取りは「マイクロ秒単位」とされている

</div>

---

# API: 同じ get / put / list / delete

<div class="text-sm text-left">

classic の Workers KV と互換。差異は次の <strong>3 点</strong>のみ。

</div>

<div class="grid grid-cols-3 gap-4 pt-4 text-left text-sm">
<div class="p-3 border rounded">

<strong>1. モード指定</strong>

namespace 作成時に <code>"mode": "instant"</code> を指定する

</div>
<div class="p-3 border rounded">

<strong>2. メタデータなし</strong>

<code>getWithMetadata</code> は常に <code>null</code>。<code>put</code> でメタデータも渡せない

</div>
<div class="p-3 border rounded">

<strong>3. list は全件</strong>

一致するキーをすべて返す。ページネーションなし

</div>
</div>

---

# コード例 1: ローンチフラグを毎リクエストで読む

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

<div class="text-sm text-left">

<code>APP_CONFIG</code> は KV Instant namespace のバインディング。値が <code>"true"</code> になった瞬間から、全ロケーションでトップページが切り替わる。（<code>Response</code> の引数は原文の省略記法）

</div>

---

# コード例 2: 複数キーの取得と課金

<div class="grid grid-cols-2 gap-4 text-left">
<div>

```js
// 3 回の get → Class B 3 操作
let routeAPAC = await APP_CONFIG.get("route_APAC");
let routeEUR = await APP_CONFIG.get("route_EUR");
let routeNAMER =
  await APP_CONFIG.get("route_NAMER");

// 1 回の get に 3 キー → 同じく Class B 3 操作
let routes = await APP_CONFIG.get([
  "route_APAC", "route_EUR", "route_NAMER",
]);
```

</div>
<div class="text-sm pt-2">

- 要求したキー 1 つにつき Class B 1 操作
- まとめて取得してもキー数が課金単位
- ラウンドトリップは減らせるが、読み取りの課金は減らない

</div>
</div>

---

# 料金（classic との比較）

<div class="text-sm pt-2">

| | Class B（読み取り） | Class A（put/delete/list） | Storage |
| --- | --- | --- | --- |
| KV Instant | $0.20 / 100 万 | $0.10 / 操作 | $100 / MB / 月 |
| Workers KV | $0.50 / 100 万 | $5.00 / 100 万 | $0.50 / GB / 月 |

</div>

<div class="text-sm pt-2 text-left">

- 読み取りは 60% 安い。storage と Class A は大幅に高い
- 大量データ、または頻繁な更新なら Workers KV が引き続き適する
- <code>list</code> は 1 リクエストで 1 Class A 操作（返るキー数によらない）

</div>

---

# 制限

<div class="grid grid-cols-2 gap-4 pt-4 text-left text-sm">
<div class="p-3 border rounded">

<strong>サイズ</strong>

- キーは最大 300 バイト
- 値は namespace 合計が 1 MB を超えない範囲
- 1 namespace に最大 1 万キーバリューペア

</div>
<div class="p-3 border rounded">

<strong>書き込み頻度</strong>

- <strong>1 namespace あたり 1 秒に 1 回</strong>
- すべての書き込みが単一のシステムオブレコードを通るため
- 更新順序を考えやすくなる（classic は 1 キーあたり 1 秒に 1 回）

</div>
</div>

---

# ユースケース 1: ローンチ時の切り替え

<div class="text-left pt-2">

- キーノートの壇上で製品を紹介する瞬間（記事の例では 10:13 AM）に、トップページを切り替える
- 要件: 読み取りの遅延がほぼゼロ、リクエストごとに読める、変更が即座に反映される
- TTL の期限切れを待たずに全ロケーションで新しい値が見える

</div>

---

# ユースケース 2: ホットパスの設定・ルーティング

<div class="text-left pt-2">

- フィーチャーフラグやアプリケーション設定を、全リクエストで読む
- リージョン別の経路設定（<code>route_APAC</code> / <code>route_EUR</code> / <code>route_NAMER</code>）をまとめて取得
- Cloudflare 自身が Quicksilver を使っている用途と同じ「更新が少ない設定データ」

</div>

<div class="text-sm pt-4 text-left">

向かない用途: 大量データの保存、頻繁な更新 → Workers KV を使う。

</div>

---

# まとめ

<div class="text-left pt-2">

- API はそのまま、裏側を Quicksilver に差し替えるモード。読み取りと書き込み反映が大幅に速い
- 制約は強い: <strong>1 MB / 1 万キー / 書き込み 1 秒 1 回 / メタデータなし</strong>
- 料金は読み取りだけ安く、storage と Class A は高い。小さな設定データ専用と捉える
- プライベートベータのため、記事のコードを試せる状態ではない（サンプルは作成していない）

</div>

---

# 参考リンク

<div class="text-sm text-left">

- 原文: https://blog.cloudflare.com/workers-kv-instant/
- Workers KV ドキュメント: https://developers.cloudflare.com/kv/
- Quicksilver v2: https://blog.cloudflare.com/quicksilver-v2-evolution-of-a-globally-distributed-key-value-store-part-1/
- ベータ申し込み: https://www.cloudflare.com/resource/workers-kv-instant-beta/
- 関連スライド: <a href="../cloudflare-k2-streams/">▶ Cloudflare K2</a> / <a href="../cloudflare-basin/">▶ Cloudflare Basin</a>

</div>
