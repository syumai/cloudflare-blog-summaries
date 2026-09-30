---
routerMode: hash
theme: default
title: "人とエージェントのためにドメイン購入をシンプルに"
info: |
  Simplifying domains for people and agents の解説スライド。
  原文: https://blog.cloudflare.com/simplifying-domains/
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

# 人とエージェントのためにドメイン購入をシンプルに

新しいドメイン検索と Cloudflare Registrar

Birthday Week 2026

<div class="pt-4 text-sm opacity-70">
原文: https://blog.cloudflare.com/simplifying-domains/<br>
公開日: 2026-09-30
</div>

---

# TL;DR

- Cloudflare Registrar の<strong>新しいドメイン検索</strong>: 420 以上の拡張子すべてで、入力した語そのものを調べ、入力に合わせて結果が出る
- 並べ替え・絞り込み・価格表示がそろい、登録済みのドメインも表示される
- エージェントからは <strong>Registrar API・MCP・cf CLI</strong> で、検索・購入・移管ができる（サンドボックス・extensions エンドポイント・移管を追加）
- 裏側は Workers・Durable Objects・Workers KV・WebSocket。複数の「証拠」を集め、強い証拠だけが結果を更新する
- 初回登録価格と更新価格を全ドメインで表示。`.io`・`.dev`・`.app`・`.tech` などで初年度割引

---

# アジェンダ

1. 背景: 買う前に疲れるドメイン購入
2. エージェント向けの Registrar（API・MCP・cf CLI）とコード例
3. 新しい検索: 全拡張子を、入力に合わせて表示
4. 複雑な問いを簡単に見せる: 複数の「証拠」
5. 構成: Workers・Durable Objects・KV・WebSocket
6. 透明な価格と初年度割引
7. ユースケース・まとめ

---

# 背景: 買う前に疲れるドメイン購入

<div class="grid grid-cols-2 gap-6">
<div class="p-4 border rounded">

<strong>よくある体験</strong>

- 格安航空券のチェックアウトのように、オプションを次々に勧められる
- セキュリティは？ Web サイトは？ メールは？
- 最初の一歩が、数分で楽しくなくなる

</div>
<div class="p-4 border rounded">

<strong>Cloudflare Registrar の方針</strong>

- 10 年前の開始から、原価での販売・透明な価格・押し売りなし
- ただしシンプルさは、チェックアウトではなく<strong>探し始める瞬間</strong>から始まるべき
- 以前の検索は、一部の拡張子から約 20 件。語が書き換えられることも

</div>
</div>

---

# 今回の 2 本柱

- <strong>人</strong>: 新しいドメイン検索。全拡張子を、入力に合わせて、価格つきで
- <strong>エージェント</strong>: Registrar API・MCP・cf CLI で、検索・購入・移管を会話で頼める
- エージェントは「寄り道せず、目的地に集中する」のが得意、と記事は書く
- ゴールは同じ: アイデアを思いついてから形にするまでの摩擦を取り除く

<div class="pt-2 text-sm">

▶ <a href="../cloudflare-cf-cli-launch/" target="_blank">cf CLI の解説スライド</a>

</div>

---

# エージェント向けに拡張された Registrar

- 4 月に Registrar API のベータを公開（プログラムからドメインの検索・確認・登録）
- その後の拡張が 3 つ:

<div class="grid grid-cols-3 gap-4 pt-2">
<div class="p-3 border rounded">

<strong>サンドボックス</strong>

実際に買わず、実取引なしで登録のワークフローを試せる

</div>
<div class="p-3 border rounded">

<strong>extensions エンドポイント</strong>

420 以上の拡張子それぞれの情報を返し、レジストリごとの要件の違いを吸収しやすくする

</div>
<div class="p-3 border rounded">

<strong>移管（transfers）</strong>

他のレジストラのドメインを、プログラムから Cloudflare へ

</div>
</div>

<div class="pt-4 text-sm">

Registrar API は Cloudflare MCP 経由でも使え、別の統合なしにエージェントがアクセスできる。

</div>

---

# コード例: 会話をそのまま cf CLI に

<div class="text-[11px]">

```bash {all|1-2|4-5|7-10}
# 「example.com は取れますか？」
cf registrar registrations check example.com

# 「example.com を買って」
cf registrar registrations create example.com

# 「example.com を今のレジストラから移管して」
cf registrar registrations transfer-in example.com \
  --auth-code "$(echo -n 'YOUR_EPP_CODE' | base64)" \
  --auto-renew
```

</div>

<div class="text-sm pt-2">

- <code>check</code> = 空き確認、<code>create</code> = 登録（購入）、<code>transfer-in</code> = 他社からの移管
- 移管の <code>--auth-code</code> には EPP コードを <strong>Base64 でエンコード</strong>して渡す。<code>--auto-renew</code> は自動更新の指定と読めるが、記事は詳しく説明していない
- 日本語のコメントは原文の依頼文を訳して添えたもの

</div>

---

# 新しい検索: 全拡張子を、入力に合わせて

<div class="grid grid-cols-2 gap-6">
<div class="p-4 border rounded">

<strong>以前</strong>

- 一部の拡張子から、購入可能な約 20 件
- 検索語を書き換えて関連候補を提案
- 同じ名前を全拡張子で見比べられない

</div>
<div class="p-4 border rounded">

<strong>今回</strong>

- 入力した語そのものを、<strong>対応する全拡張子</strong>で表示
- 入力に合わせて結果が出て、スクロールで続きを読み込み
- <strong>登録済みのドメイン</strong>も表示（購入可能なものだけに絞ることも可能）
- 並べ替え・絞り込み。ログインの有無・端末によらず同じ体験

</div>
</div>

---

# 複雑な問いを簡単に見せる

- 1 回の検索が、420 以上の「空いていますか？」の問いになる
- 各拡張子は<strong>レジストリ</strong>が運営し、空き・価格の権威ある答えを持つ
- 全レジストリに毎回聞くと、遅く無駄が多い
  - 応答速度が違い、リクエストの上限もある
  - 利用者が見ない結果のための作業も発生する
- そこで、複数の情報源から<strong>証拠</strong>を集める

---

# 3 種類の証拠

<div class="grid grid-cols-3 gap-4">
<div class="p-3 border rounded">

<strong>1. データセット・キャッシュ</strong>

ゾーンファイルなどから用意した空き状況のデータと、キャッシュ済みの答え

</div>
<div class="p-3 border rounded">

<strong>2. DNS の答え</strong>

1.1.1.1 リゾルバーで引く

</div>
<div class="p-3 border rounded">

<strong>3. ライブ照会</strong>

レジストリへの直接の問い合わせ。最新で権威があるが、遅く、上流の処理能力を使う

</div>
</div>

<div class="pt-4 text-sm">

- データセットや DNS への<strong>ヒット</strong>は「すでに使われている」証拠。ただし<strong>ミス</strong>は「空き」の証拠にならない（DNS 未設定の登録済み・ブロック対象がありうる）
- レジストリ由来の最近の答えは強いが、時間とともに古くなる
- 速度・鮮度・確実さのバランスを結果ごとに取り、より良い情報が来たら<strong>影響を受ける結果だけ</strong>更新

</div>

---

# 構成: Workers・Durable Objects・KV

- <strong>Workers</strong>: 公開の検索入口と、証拠を集めるサービス
- <strong>Durable Objects</strong>: アクティブな検索 1 回につき 1 つの調整役
- <strong>Workers KV</strong>: 検索をまたいで再利用できる、用意済みのデータ
- <strong>WebSocket</strong>: ブラウザとの双方向の接続。その上に独自のアプリケーションプロトコル
- 顧客が使うのと同じ開発者プラットフォーム。ユーザー数と 420 以上の拡張子にスケールしつつ、運用コストを低く保つ

---

# アーキテクチャ図

<div class="flex justify-center">
<img src="https://blog.cloudflare.com/_emdash/api/media/file/01M3QWRHFH4XBTXDVXGW3RQC3W.png" style="max-height: 400px" />
</div>

<div class="absolute bottom-3 text-xs opacity-50">出典: Cloudflare Blog https://blog.cloudflare.com/simplifying-domains/</div>

---

# 図の読み方: 検索の前と最中

<div class="grid grid-cols-2 gap-6 text-sm">
<div class="p-4 border rounded">

<strong>Before you search（事前準備）</strong>

1. ゾーンファイルなどの大量データ
2. ETL パイプラインでコンパクトなデータセットに変換
3. Workers KV に「用意した証拠」として保存
4. 大きなデータは分割。必要な分だけ取得

→ 多くの問いに、ライブ照会なしで答えられる

</div>
<div class="p-4 border rounded">

<strong>While you search（検索の最中）</strong>

1. ブラウザが WebSocket で検索語と表示範囲を送る
2. Search entry（Worker）が検証・ルーティング
3. Search session（Durable Object）が順序決定と証拠の統合
4. Availability resolver（Worker）が 1.1.1.1 と Registrar に照会

→ スナップショットと差分がブラウザへ戻る

</div>
</div>

---

# 検索セッションと差分更新

- <strong>検索セッション（Durable Object）</strong>
  - クエリ・並べ替え・絞り込みから、ネットワーク照会を待たずに結果の順序を決める
  - ドメインごとに最良の証拠を覚え、画面に見えている結果に照会の作業を集中させる
- <strong>WebSocket のプロトコル</strong>
  - 最初に<strong>スナップショット</strong>で順序付きのリストを作り、以降は変わった項目だけの<strong>デルタ</strong>
  - ブラウザは 1 件のドメインだけを更新できる
- 送る前に証拠を比較: <strong>強い証拠は置き換えられるが、弱い証拠は置き換えられない</strong>

---

# 証拠収集とキャッシュの工夫

- 別の Worker が、1.1.1.1 での DNS、Registrar のライブ照会、最近のキャッシュの再利用のいずれかを行う
- 新しい答えを再利用して、上流への重複リクエストを避ける
- 「空いている」はいつでも登録されうるため、<strong>キャッシュの有効期間は短め</strong>。「すでに取られている」という証拠より早く古くなる
- 数百の独立した空き確認と調整を、1 つの一貫した検索体験にまとめる

---

# 透明な価格と初年度割引

- 新しい検索と新しい価格ページは、全ドメインで<strong>初回登録価格</strong>と<strong>更新価格</strong>の両方を表示
- 割引中は、元の原価の登録価格に<strong>取り消し線</strong>を引き、プロモーション価格を並べて表示
- Birthday Week から、<code>.io</code>・<code>.dev</code>・<code>.app</code>・<code>.tech</code> など一部の拡張子で<strong>初年度の登録割引</strong>
- 割引対象は、検索ページと価格ページ（pricing.registrar.cloudflare.com）で確認できる

---

# ユースケース

<div class="grid grid-cols-2 gap-6 text-sm">
<div class="p-4 border rounded">

<strong>ドメイン探し</strong>

1 語を入れると全拡張子の空き・価格が並ぶ。`.com` は取られていても `.dev` は空き、といった比較が 1 画面で

</div>
<div class="p-4 border rounded">

<strong>購入の委任</strong>

「空いている？」「買って」とエージェントに頼み、cf CLI・MCP・API で確認から登録まで

</div>
<div class="p-4 border rounded">

<strong>他社からの移管</strong>

EPP コードを渡して `transfer-in`。プログラムから移せる

</div>
<div class="p-4 border rounded">

<strong>自前アプリへの組み込み</strong>

Registrar API とサンドボックスで、実取引なしに登録フローを検証して組み込む

</div>
</div>

---

# まとめ・所感

- 見どころは「何百もの問いを 1 つの自然な検索に見せる」設計。権威ある答えは遅く上限もあるため、強さの違う証拠を集め、強い証拠だけが結果を更新する
- 「ヒットは確かな証拠、ミスは証拠にならない」という非対称を、設計に反映している
- スナップショット＋デルタと、Durable Object での証拠の比較は、リアルタイム UI の設計の参考になる
- エージェント側は API・MCP・cf CLI の 3 つの入口。支払い手段や購入時の承認の扱いは、記事からは読み取れない

---

# 参考リンク

- 原文: https://blog.cloudflare.com/simplifying-domains/
- Registrar API: https://developers.cloudflare.com/registrar/registrar-api/
- 価格ページ: https://pricing.registrar.cloudflare.com/
- ドメイン検索: https://www.cloudflare.com/domains/
- cf CLI: https://blog.cloudflare.com/cloudflare-cf-cli-launch/（▶ <a href="../cloudflare-cf-cli-launch/" target="_blank">解説スライド</a>）
- Forge: ▶ <a href="../forge-open-source-generation-pipeline/" target="_blank">解説スライド</a>
- Birthday Week 総論: ▶ <a href="../agentic-web/" target="_blank">解説スライド</a>
- Cloudflare Wallets: ▶ <a href="../wallets/" target="_blank">解説スライド</a>
- サンプル: 本記事の中心は Registrar の検索体験と API（実取引を伴う）のため、`examples/` は作成していません
