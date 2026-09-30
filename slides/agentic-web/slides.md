---
routerMode: hash
theme: default
title: "インターネットには「第二の読者」がいる: エージェントを迎え入れ、対価を得るためのレール"
info: |
  インターネットには「第二の読者」がいる（The Internet has a second audience）の解説スライド。
  原文: https://blog.cloudflare.com/agentic-web/
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

# インターネットには<br>「第二の読者」がいる

エージェントを迎え入れ、対価を得るためのレール

Birthday Week 2026

<div class="pt-4 text-sm opacity-70">
原文: https://blog.cloudflare.com/agentic-web/<br>
公開日: 2026-09-30
</div>

---

# TL;DR

- 今年初めて、インターネットのトラフィックの<strong>半分以上が人間ではなくなった</strong>。AI エージェント由来の日次リクエストは過去 1 年で <strong>1,700% 以上</strong>増加
- エージェントは人間でも従来のボットでもない「第二の読者」。受け入れ方しだいで収益源にも、コストの押し付けにもなる
- 4 つの柱: <strong>見る</strong> → <strong>条件を決める</strong> → <strong>対価を得る</strong> → <strong>コストを下げる</strong>
- 対価を得る仕組みが <strong>Pay Per Use</strong> と <strong>Monetization Gateway</strong>（どちらもベータ）
- x402・Web Bot Auth などのオープン標準の上に作り、Cloudflare は「選択肢の 1 つ」という立場

---

# アジェンダ

- 背景: 増えるトラフィックと減る収益
- エージェントは「顧客」でもある
- 柱 1: 誰が来ているかを見る
- 柱 2: 条件を決める
- 柱 3: 対価を得る（Pay Per Use / Monetization Gateway）
- 柱 4: リクエストを安くする
- なぜオープン標準か
- コード例について・ユースケース・まとめ

---

# 背景: 第二の読者の到来

<div class="grid grid-cols-3 gap-4 text-center pt-4">
<div class="p-4 border rounded">
<div class="text-3xl font-bold">63M → 115M</div>
<div class="text-sm pt-2">Cloudflare の平均 HTTP リクエスト/秒<br>（2024 年末 → 現在。ピークは 150M 超）</div>
</div>
<div class="p-4 border rounded">
<div class="text-3xl font-bold">+1,700%</div>
<div class="text-sm pt-2">AI エージェント由来の<br>日次リクエスト（過去 1 年）</div>
</div>
<div class="p-4 border rounded">
<div class="text-3xl font-bold">半分超</div>
<div class="text-sm pt-2">人間ではないトラフィック<br>（今年初めて）</div>
</div>
</div>

<div class="pt-6 text-left">

- 人間のウェブが縮んだのではなく、<strong>エージェント</strong>という第二の読者が並んで現れた
- 背後には用事を抱えた人がいる。広告には反応しない

</div>

---

# 背景: 取り決めの崩れ

- 30 年続いた取り決め: クロールさせる → 訪問者が来る → 収益化。<strong>「見つかる」と「稼ぐ」が同じ意味</strong>だった
- 回答エンジンはページを読んで<strong>要約を返す</strong> → 帯域のコストはかかるが、広告や決済の発生する人間の訪問は来ない
- クロールの多い業種（小売、ソフトウェア、IT サービス、金融サービス）では、1 年足らずで人間のトラフィックが最大 <strong>40%</strong> 減
- 結果: <strong>1 リクエストあたりの収益が下がり、コストは上がる</strong>

---

# 背景: 「全部ブロック」では粗すぎる

<div class="grid grid-cols-2 gap-6 pt-4">
<div class="p-4 border rounded text-center">
<div class="text-sm opacity-70">AI 学習目的のクローラー要求の割合</div>
<div class="text-2xl font-bold pt-2">22%（2025 年春）</div>
<div class="text-2xl font-bold">→ 52%（2026 年 6 月）</div>
<div class="text-xs opacity-60 pt-2">クローラーの自己申告する目的ベース</div>
</div>
<div class="text-left">

- 昨年は新規ドメインでの学習クローラーのブロックを推奨
- しかし一律の「No」は、今つくられている経済には粗い
- 正しく受け入れれば新しいビジネスモデルの先頭に立てる。逆は、検索アルゴリズム変更で不利になったサイトと同じ結果

</div>
</div>

---

# エージェントは「顧客」でもある

- テーブルを予約する、保険の見積もりを比べる、データセットを購入する。<strong>人間ではない顧客</strong>
- 自動化トラフィックで最も伸びているのはクローラーではなく<strong>エージェント</strong>。チャットボットへの質問をきっかけに、人の代わりにページを取得する
- 週単位のリズムがあり、夏休みには減る（人間と同じ）→ 追い返すと、送り出した人を追い返すことになりうる

| | 学習クローラー | エージェント |
|---|---|---|
| 動き | ページを集めてモデルを作る | 質問のたびに戻ってくる |
| 増え方 | 公開した量に依存 | 人々が尋ねる質問の量に依存 |

---

# 商売に必要な 4 つのこと

<div class="pt-6">

「見えない・区別できない・条件を設定できない・課金できない」相手とは商売ができない

</div>

| 柱 | 解消すること | 主な手段 |
|---|---|---|
| 1. 見る | 見えない / 区別できない | AI Crawl Control、Business Insights、BotBase、Web Bot Auth |
| 2. 条件を決める | 条件を設定できない | Search / Agent / Training 制御、Disallow AI Training |
| 3. 対価を得る | 課金できない | Pay Per Use、Monetization Gateway |
| 4. コストを下げる | 無駄なリクエスト | Markdown for Agents、WebMCP |

---

# 柱 1: 誰が来ているかを見る

- 「AI ボット」という括りは意味を失った。重要なのは<strong>何をするか</strong>
- <strong>AI Crawl Control</strong> / <strong>Business Insights</strong> / <strong>BotBase</strong>: 誰がクロールし、何を持ち出し、何が返ってくるか、どの URL が狙われているかを示す
- <strong>Web Bot Auth</strong>: OpenAI・Google・AWS などの運営者がリクエストに暗号署名
  - IP や user-agent の推測なしに、本物と偽装を区別できる
  - 検証済みボットのリクエストは毎週 <strong>5,000 億件超</strong>

---

# 柱 2: 条件を決める（1/2）

- 7 月: 「AI ボットをブロック」の単一スイッチを、<strong>Search / Agent / Training</strong> の個別制御に置き換え（Free を含む全プラン）

<div class="grid grid-cols-2 gap-6 pt-4 text-center">
<div class="p-4 border rounded">
<div class="text-3xl font-bold">1% 未満</div>
<div class="text-sm pt-2">検索クローラーをブロックするサイト</div>
</div>
<div class="p-4 border rounded">
<div class="text-3xl font-bold">17%</div>
<div class="text-sm pt-2">学習クローラーをブロックするサイト</div>
</div>
</div>

<div class="pt-4">

- サイト運営者は隠れたいのではなく、<strong>「見つけてもらいたいが、搾取はされたくない」</strong>

</div>

---

# 柱 2: 条件を決める（2/2）

- 検索と学習を兼ねる<strong>混在用途クローラー</strong>では、片方を断るともう片方も断ることになる
- 9 月 15 日: <strong>Disallow AI Training</strong>
  - 検索のインデックスは維持したまま、クローラー固有の仕組みで「学習には使うな」と運営者に伝える
  - Apple・Google・Microsoft が順守を約束。Cloudflare Radar が挙動を公開追跡
- 新規ドメインには、<strong>収益の得方</strong>に基づく推奨設定を表示
  - 例: 広告型サイトは学習を禁止し、広告のあるページではエージェントをブロック（広告は人が見て初めて支払われる）
  - 設定はいつでも変更可

---

# 柱 3: 対価を得る

- 8 月に示した「読める・見つかる・呼べる・<strong>支払える</strong>」の最後が、オープンウェブが自力で資金を得られるかを決める
- 必要なのは二択の yes/no ではなく、<strong>「yes, if you pay」</strong>
- ライセンス市場: 2023 年以降に出版社と AI 企業の契約は <strong>50 件超</strong>。ほぼすべてが個別の二者間契約で、ウェブの大半にも大半の買い手にも届かない
- 売り方は資産で変わる

| 資産 | 必要なもの | 製品 |
|---|---|---|
| 高価値コンテンツ・データセット | 買い手が識別され、使い方を報告する信頼ネットワーク | Pay Per Use |
| API・MCP ツール（リクエスト＝利用） | リクエストごとの課金 | Monetization Gateway |

---

# Pay Per Use

- 個別ライセンスが届かないサイトに届く<strong>橋渡し</strong>。クロールには課金せず、<strong>実際に使われたとき</strong>に支払う
- 買い手は全員が<strong>検証済みクローラー</strong>。「使用」の定義と価格は買い手ごと

<div class="grid grid-cols-4 gap-2 pt-6 text-center text-sm">
<div class="p-3 border rounded">出版社がオファーを見て<br>オプトイン</div>
<div class="p-3 border rounded">買い手が<br>利用を報告</div>
<div class="p-3 border rounded">Cloudflare が報告を検証し、<br>買い手に請求</div>
<div class="p-3 border rounded">出版社に支払い<br>（いつでもオプトアウト可）</div>
</div>

<div class="pt-4 text-sm">

- 出版社は、何がいつ使われ、いくら稼いだか、（報告があれば）どんな質問で使われたかが見える → 何を書き・更新するかのフィードバックループ

</div>

---

# Pay Per Use: 使用の定義は 1 つではない

- 検索エンジンの引用、リサーチエージェントの引用、ショッピングエージェントの購入完了は、生む価値が違う
- 買い手は<strong>同じレール</strong>の上で複数のビジネスモデルに参加できる。出版社側に新たな統合は不要
- 例: 購読者数千人の海洋エンジニア向け業界誌。個別の AI ライセンス契約は望めなくても、参加する AI 企業が使うたびに対価を得られる

---

# Monetization Gateway

- 既存のアカウント・API キー・購読は、「初めて使うサービスから 1 回だけ参照したいエージェント」には向かない
- <strong>クローズドベータ</strong>（対象は米国の該当する Cloudflare 顧客）。使い慣れた <strong>Rules 言語</strong>で、通過するものに価格を付ける
- ルールに一致 → オープンな <strong>x402</strong> で <strong>HTTP 402 Payment Required</strong> を返す → エージェントが売り手に直接支払う

<div class="pt-4">

- 課金単位: リクエスト / クエリ / トークン（固定価格または上限付き）
- 例: 広告型のスポーツ統計サイトが、「アシスト数のリーグ首位は？」の問い合わせごとに 1 セントの何分の一かを課金
- 発表時に数千の売り手がウェイトリストに参加。最多の要望は「人間ではなくエージェントに課金したい」
- Cloudflare 自身が最初の顧客（AI Gateway でエージェントが推論に支払う）

</div>

---

# 2 つの製品は同じ土台の上にある

- 共通のプリミティブ: <strong>ID・計量・価格設定・決済・分析</strong>
- 1 つのダッシュボードで組み合わせられる: 学習は禁止、検索は許可、AI の回答で稼ぎ、エージェントには記事ごとに課金
- 買い手にとってもブロックページより良い: 安定したアクセスと、多数のサイトへ届く経路。支払いごとに<strong>レシート</strong>が残る
- 記事自身が「価格設定と発見はまだ解決されていない」とし、両方をベータで提供

---

# 柱 4: リクエストを安くする

- 収益減への答えが支払いで、コスト増は別の問題。多くは<strong>無駄</strong>
  - 数段落のテキストのために、人間向けのページを繰り返しダウンロード
  - 変更のないサイトを再クロール
- ダッシュボードで運営者ごとの帯域消費が見える
- 7 月発表の <strong>OpenAI との共同研究</strong>: ネットワークの知見で AI 検索エンジンの発見・インデックスを効率化。初期結果は数週間以内に共有予定
- 顧客向け: <strong>Markdown for Agents</strong>（装飾なしで読める）、<strong>WebMCP</strong>（サイトがアクションを直接公開）

---

# なぜオープン標準か

<div class="grid grid-cols-2 gap-6 pt-2">
<div class="p-4 border rounded">
<div class="font-bold pb-2">Cloudflare のネットワーク上の位置</div>

- ウェブの <strong>20% 超</strong>が背後にある
- 主要 AI 企業の<strong>約 80%</strong> も
- 市場の両側を見て、レールを作る

</div>
<div class="p-4 border rounded">
<div class="font-bold pb-2">記事の主張</div>

- 一握りの企業が発見・本人証明・支払いを握る世界より、誰でも実装できるオープン標準を選ぶ
- x402・Web Bot Auth の上に構築
- ID プロバイダー・決済事業者・エージェントのパートナーは所有者が選ぶ。Cloudflare は「選択肢の 1 つ」

</div>
</div>

---

# コード例について

- 本記事には<strong>コードブロックやコマンドなどのコード例は含まれない</strong>（各機能の詳細は個別記事に任せる総論）
- 代わりに、4 つの柱と Pay Per Use・Monetization Gateway の課金フローを読み解く（前述のスライド）
- 記事中にあるコード的な記述:
  - ステータスコード: `402 Payment Required`
  - プロトコル・機能名: x402 / Web Bot Auth / Disallow AI Training

---

# ユースケース 1: 広告で運営するニュースサイト

- 学習を禁止（Disallow AI Training）し、検索クローラーは許可
- 広告を載せたページではエージェントをブロック。広告は人が見て初めて支払われるため

---

# ユースケース 2: 小規模な業界誌

- 個別の AI ライセンス契約は望めない
- Pay Per Use に参加し、参加する AI 企業が使うたびに対価を得る
- どんな質問で使われたかを把握し、何を書くか・更新するかの判断に使う

---

# ユースケース 3: データ・API を持つサイト

- Monetization Gateway で、エージェントの 1 回の参照ごとに少額を課金
- x402 と HTTP 402 で、アカウントも API キーもない初対面のエージェントから支払いを受ける

---

# ユースケース 4: AI 企業・エージェントの運営者

- Web Bot Auth でリクエストに署名し、本物のエージェントとして識別される
- 検証済みクローラーとして Pay Per Use の買い手になり、ブロックされずに多数のサイトへ正規のルートでアクセス

---

# ユースケース 5: 自サイトを最適化したい運営者

- Markdown for Agents で、人間向けの装飾なしにページを提供
- WebMCP でサイトの操作を直接公開し、エージェントがボタンを推測する無駄を減らす
- ダッシュボードで運営者ごとの帯域消費を確認

---

# まとめ・所感

- 具体的な新機能の発表というより、Birthday Week の各発表を 1 本の物語にまとめた<strong>導入・総論</strong>の記事
- 「ブロックか許可か」の二択から、<strong>「yes, if you pay」</strong>という第三の選択肢へ
- 数字はすべて Cloudflare 自身の観測。定義や期間の前提は原文で確認したい
- Pay Per Use と Monetization Gateway はベータ。価格設定と発見は未解決と記事自身が述べている
- Workers サンプル対象外（ベータ機能中心で、コード例もない総論記事）

---

# 参考リンク

- 原文（en-us）: https://blog.cloudflare.com/agentic-web/
- Search / Agent / Training: https://blog.cloudflare.com/content-independence-day-ai-options/
- Disallow AI Training: https://blog.cloudflare.com/accountable-mixed-use-ai-crawlers/
- Pay Per Use: http://blog.cloudflare.com/pay-per-use
- Monetization Gateway: https://blog.cloudflare.com/monetization-gateway-beta
- Markdown for Agents: https://blog.cloudflare.com/markdown-for-agents/
- 関連スライド: [エージェンティックインターネット](../the-agentic-internet/)、[WebMCP](../webmcp/)、[Agents Week 2026 まとめ](../agents-week-review/)、[創業者レター](../cloudflares-2026-annual-founders-letter/)
- Wiki: [docs/articles/2026-09-30-agentic-web.md](https://github.com/syumai/cloudflare-blog-summaries/blob/main/docs/articles/2026-09-30-agentic-web.md)
