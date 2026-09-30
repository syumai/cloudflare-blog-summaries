---
routerMode: hash
theme: default
title: "Pay Per Use: AI があなたの作品を使うなら、対価を受け取るべき"
info: |
  Pay Per Use: when AI uses your work, you should get paid の解説スライド。
  原文: https://blog.cloudflare.com/pay-per-use/
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

# Pay Per Use

AI があなたの作品を使うなら、対価を受け取るべき

Birthday Week 2026

<div class="pt-4 text-sm opacity-70">
原文: https://blog.cloudflare.com/pay-per-use/<br>
公開日: 2026-09-30
</div>

---

# TL;DR

- <strong>Pay Per Use</strong> がベータで公開。買い手（AI 企業）が「特定の使われ方」に価格を提示し、出版社が承諾を選ぶ
- 課金の単位は「クロール」ではなく<strong>「使用」</strong>。買い手が使うたびに報告し、Cloudflare が請求・支払いを担う
- 買い手は Verified bots として識別され、出版社ごとの個別契約・統合は不要
- 買い手の報告は 1 件 1 行の JSON を送る<strong>単一の API</strong>。出版社はダッシュボードで使用回数と収益を確認
- リクエストごとが「使用」になる API・ツール・データは、同日ベータの <strong>Monetization Gateway（x402）</strong>で売る

---

# アジェンダ

1. 背景: 要約が訪問を置き換える
2. 使用に払う、クロールには払わない
3. 仕組み: 4 つのステップと全体の流れ
4. コード例: 使用の報告 API
5. ダッシュボードと「支払いは半分」
6. これから・Monetization Gateway との使い分け
7. ユースケース・まとめ

---

# 背景: 要約が訪問を置き換える

- AI の回答エンジンは出版社のページを読み、読者に<strong>要約</strong>を返す
- 訪問も、それに伴う収益も発生しない
- 多くの出版社は、自作品を使う AI 企業とライセンス契約を結べない
- 数百万のサイトと個別に交渉できる企業もない

<div class="pt-6 text-xl">

ウェブには<strong>「yes, if you pay」</strong>と言う手段が必要

</div>

---

# クロールへの課金の限界

<div class="grid grid-cols-2 gap-6 pt-2 text-left">
<div class="p-4 border rounded">

<strong>クロールに払う</strong>

- AI 製品は使う量よりずっと多く取得する（検索エンジンは表示しないページもインデックス）
- 買い手は何が必要か分からないうちに払うことになり、多くは払わない

</div>
<div class="p-4 border rounded">

<strong>使用に払う</strong>

- 価格が、買い手の実際に得る価値に結びつく
- 買い手も、出版社の収益も増えると期待
- 出版社は Pay Per Crawl と使い分けられる

</div>
</div>

<div class="pt-4 text-sm">

Pay Per Crawl（2025 年に開始）は「アクセス」に課金する。Pay Per Use は「その後に起きたこと」に対価を払う。

</div>

---

# 買い手と出版社にとっての意味

<div class="grid grid-cols-2 gap-6 pt-2 text-left">
<div class="p-4 border rounded">

<strong>買い手（AI 企業）</strong>

- ブロック・ペイウォールの裏の、最も変化の速い内容（ニュース・研究・専門誌）にオファーを出せる
- 実際に使った分だけ払う
- 検証済みの買い手として全出版社に識別される
- 1 つの API で、yes と言ったすべてのサイトにつながる

</div>
<div class="p-4 border rounded">

<strong>出版社</strong>

- 承諾するオファーを自分で選ぶ
- クローラーのアクセスと下流の使い方の制御権を保つ
- 使用回数と収益を確認できる
- 条件が合わなくなれば参加をやめられる

</div>
</div>

<div class="pt-4 text-sm">

Cloudflare が登録・使用記録・請求・支払いを担う。数千の統合や個別交渉の契約は不要。

</div>

---

# コンテンツは後から、いろいろな体験を支える

- AI 検索の<strong>引用回答</strong>
- リサーチエージェントのレポートに<strong>引用された一節</strong>
- ショッピングエージェントが比較する<strong>製品レビュー</strong>
- 料理アシスタントが改変する<strong>レシピ</strong>

<div class="pt-4 text-sm">

AI 企業は Verified bots としてクロールを識別し、出版社の制御が許す範囲でアクセス・インデックスする。使用の定義は買い手が提案し、Cloudflare は報告と支払いの基盤を提供する。

</div>

---

# 全体の流れ

<div class="flex justify-center pt-2">
<img src="https://blog.cloudflare.com/_emdash/api/media/file/01M3Q8WE3A560CVNARSER4DEZR.png" style="max-height: 330px" />
</div>

<div class="text-sm pt-2 text-left">

Enroll → Access through Cloudflare → Usage（買い手が課金対象イベントを報告）→ Settlement

</div>

<div class="absolute bottom-3 text-xs opacity-50">出典: Cloudflare Blog https://blog.cloudflare.com/pay-per-use/</div>

---

# ステップ 1・2: 定義と参加

<div class="grid grid-cols-2 gap-6 pt-2 text-left text-sm">
<div class="p-4 border rounded">

<strong>1. 何を有償の使用とするか</strong>

- AI 企業がクローラーを識別し、払う使用を定義し、価格を決め、支払いアカウントを接続
- 例 A: 検索サービスが登録ページの抜粋を顧客に返したとき
- 例 B: ショッピングエージェントが登録済みレビューで推奨を形づくったとき（買い物客がレビューを読まなくても支払いが発生）
- 出版社は使い方ごとに別のオファーを受けられる

</div>
<div class="p-4 border rounded">

<strong>2. 出版社が参加を選ぶ</strong>

- ダッシュボードの Monetize → Pay Per Use でオファーを確認（AI 企業・使用の種類・提示価格）
- 承諾するか決められ、やめることもできる
- オリジンの変更も AI 企業ごとの統合も不要
- プログラムの条件に、コンテンツでしてよいこと（学習の制限を含む）も定められる

</div>
</div>

---

# ステップ 3・4: 報告と精算

<div class="grid grid-cols-2 gap-6 pt-2 text-left text-sm">
<div class="p-4 border rounded">

<strong>3. 買い手が使用を報告する</strong>

- 承諾したドメインの一覧を取得
- 使用ごとに 1 行の JSON（発生時刻・元 URL・イベント ID）を送る
- 使用は<strong>自己申告</strong>。条件が完全な報告を求め、Cloudflare は報告が登録済みの出版社に対応するかを確認

</div>
<div class="p-4 border rounded">

<strong>4. Cloudflare が双方を精算する</strong>

- 報告を集計し、買い手に請求
- 出版社へ<strong>月次</strong>で、接続した支払いアカウントに支払い
- 買い手は統合 1 つ、出版社は確認する場所 1 つ

</div>
</div>

---

# コード例: 使用を報告する

記事中の唯一のコード例。買い手が 1 件の使用を報告する `curl`（原文のまま）。

<div class="text-sm">

```bash {all|1|2-3|4-5|all}
curl -X POST "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/pay-per-use/usage-reports" \
 -H "Authorization: Bearer $API_TOKEN" \
 -H "Content-Type: application/jsonl" \
 --data-binary @- <<'EOF'
{"used_at":"2026-09-15T13:42:04Z","url":"https://example.com/article/1","id":"request-001"}
EOF
```

- 1 行目: <code>pay-per-use/usage-reports</code> への POST。2 行目の API トークンで認証
- 3 行目: <code>application/jsonl</code>。1 行が 1 件の使用
- 5 行目: <code>used_at</code>（発生時刻）・<code>url</code>（コンテンツ元）・<code>id</code>（イベント ID）

</div>

---

# ダッシュボード: 収益と報告された使用

<div class="flex justify-center pt-2">
<img src="https://blog.cloudflare.com/_emdash/api/media/file/01M3Q8W932QHJNGQVCPES0QK2D.png" style="max-height: 300px" />
</div>

<div class="text-sm pt-2 text-left">

Estimated earnings $1,125.76（+8.5%）、Reported uses 53,533。買い手別・ドメイン別・時系列で確認（画面はデモ用の値と見られる）

</div>

<div class="absolute bottom-3 text-xs opacity-50">出典: Cloudflare Blog https://blog.cloudflare.com/pay-per-use/</div>

---

# 支払いは製品の半分にすぎない

- <strong>Business Insights</strong>: どのクローラーが来て、何を取っているか
- <strong>Pay Per Use</strong>: その後に、実際に使われたか・何回か・いくら稼いだか
- <strong>AEO ツール</strong>: アシスタントが作品についてどう答えるか
- 3 つで、コンテンツがどう見つかり、使われ、いくら払われるかがつながる

<div class="pt-4 text-sm">

判断は 2 種類: 商業（何が稼ぐか・参加を続けるか）と編集（何を書き・更新し・エージェントに見つけやすくするか）。今後は、引用につながったキーワードやトピックなどの文脈も、個人データなしで報告する方向。

</div>

---

# これから: ベータで確かめること

- 問いは「<strong>双方が続けたいか</strong>」。買い手は価格に見合うコンテンツ、出版社は対価・信頼できる報告・期日通りの支払いを求める
- 新しい買い手が自分の製品・支払いモデルでオンボードでき、出版社ごとに作り直さない
- 出版社は 1 か所でオファーの承諾・拒否、価格の提案し返し、使い方ごとの価格設定ができる状態を目指す
- 例: 先週のレポートは、10 年前のアーカイブページより AI 製品にとって価値があるかもしれない

---

# Pay Per Use と Monetization Gateway

<div class="grid grid-cols-2 gap-6 pt-2 text-left text-sm">
<div class="p-4 border rounded">

<strong>Pay Per Use</strong>

- 高価値のコンテンツ
- 使い方を報告する、検証済みの買い手のネットワーク
- 買い手が提案した「使用」の定義で精算

</div>
<div class="p-4 border rounded">

<strong>Monetization Gateway（同日ベータ）</strong>

- API・ツール・データ（リクエストごとが使用）
- オープンな x402 で、エージェントにリクエスト単位で課金

</div>
</div>

<div class="pt-4 text-sm">

2 つは ID・計測・価格設定・分析という同じ基盤で動く。総論は <a href="../agentic-web/" target="_blank">▶ 解説スライド（総論）</a>、エージェント側の支払い手段は <a href="../wallets/" target="_blank">▶ Wallets</a>。

</div>

---

# ユースケース 1: ライセンス契約が届かない出版社

- 購読者数千人の専門業界誌など、個別の AI ライセンス契約は望めない
- オファーを承諾するだけで、参加する AI 企業が使うたびに対価を得られる
- オリジンの変更や AI 企業ごとの統合は不要
- 使用回数と収益をダッシュボードで確認し、参加を続けるか判断

---

# ユースケース 2: AI 検索・ショッピングエージェント

<div class="grid grid-cols-2 gap-6 pt-2 text-left text-sm">
<div class="p-4 border rounded">

<strong>AI 検索・回答エンジン</strong>

- 登録ページの抜粋を返したときに払うオファー
- ペイウォール・ブロックの裏のニュース・研究を正規のルートで使う

</div>
<div class="p-4 border rounded">

<strong>ショッピングエージェント</strong>

- 登録済みレビューが推奨を形づくったときに払う
- 買い物客がレビューを読まなくても支払いが発生

</div>
</div>

---

# ユースケース 3: 編集・商業判断に使う

- どのコンテンツが稼ぎ、どの使い方に価値があるか
- 何を書き、何を更新し、エージェントに見つけやすくするには何をするか
- AEO ツールの「どう答えられているか」と Pay Per Use の「何が使われ、何を稼いだか」を合わせて見る
- 詳しい分担は <a href="../aeo/" target="_blank">▶ AEO の解説スライド</a>

---

# まとめ・所感

- 「クロールに払う」から「<strong>使用に払う</strong>」へ。払うタイミングを、買い手が価値を得たときに移した
- 使用の定義は買い手が提案し、報告は<strong>自己申告</strong>。Cloudflare は報告が登録済みの出版社に対応するかの確認と、精算の基盤を担う
- カウンター価格・使い方ごとの価格差・新規買い手の自己オンボードは「今後」の話で、ベータにはまだない
- 中心はダッシュボードと精算の仕組みで、参加に個別の手続きが必要なベータのため、Workers サンプルは対象外

---

<div class="text-center">

# 参考リンク

</div>

- 原文: [Pay Per Use: when AI uses your work, you should get paid](https://blog.cloudflare.com/pay-per-use/)（日本語版なし）
- 関連解説スライド: [総論（第二の読者）](../agentic-web/) / [エージェンティックインターネット](../the-agentic-internet/) / [Wallets](../wallets/) / [AEO](../aeo/)
- [Pay Per Crawl](https://blog.cloudflare.com/introducing-pay-per-crawl/)
- [Verified bots](https://developers.cloudflare.com/bots/concepts/bot/verified-bots/)
- [Business Insights](https://developers.cloudflare.com/bots/business-insights/)
- [Monetization Gateway（ベータ）](https://blog.cloudflare.com/monetization-gateway-beta)

<div class="pt-8 text-sm opacity-50">
Wiki: docs/articles/2026-09-30-pay-per-use.md
</div>
