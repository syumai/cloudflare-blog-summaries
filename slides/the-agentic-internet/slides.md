---
routerMode: hash
theme: default
title: 読み取り、発見、呼び出し、決済が可能なオープンなエージェンティックインターネットの構築
info: |
  Cloudflare Blog記事「読み取り、発見、呼び出し、決済が可能なオープンなエージェンティックインターネットの構築」の解説スライド。
  原文: https://blog.cloudflare.com/ja-jp/the-agentic-internet/
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

# 読み取り、発見、呼び出し、決済が可能な
# オープンなエージェンティックインターネットの構築

<div class="pt-4 text-sm opacity-70">
原文: https://blog.cloudflare.com/ja-jp/the-agentic-internet/<br>
公開日: 2026-08-10
</div>

---

# TL;DR

- Cloudflareの観測データでは、良性ボットの大量トラフィックの多くが**前回のクロール以降変わっていないページ**を再取得しており、計算資源が成果を生まないまま消費されている
- 背景にあるのは、Webの新しい訪問者層「エージェント」の台頭。エージェントは新種のソフトウェアではなく、新種のサイト訪問者
- Cloudflareは、サイトを<strong>「読み取り可能」「発見可能」「呼び出し可能」「決済可能」</strong>にすることで、オープンな「エージェンティックインターネット」を構築しようとしている
- 4つのプリミティブはx402・MCP・Web Bot Auth・PACTなどのオープン標準に基づき、自社スタックへの囲い込みではなく中立的な基盤を志向
- Markdown for Agents・Kitesurf・AI Search・AEO・WebMCP・Code Mode・Wallets・Monetization Gatewayなど一群のツール・仕様を紹介

---

# アジェンダ


- 背景: 無駄になっているボットトラフィック
- エージェントという新しい訪問者
- エージェンティックインターネットの経済的な分かれ目
- 4つのプリミティブ: Readable / Discoverable / Callable / Payable
- コード例: WebMCPによるツール公開
- ユースケース
- Cloudflareの立場とまとめ


---

# 背景: 成果を生まないボットトラフィック


> 良性ボットからのトラフィックの多くが、
> 前回のクロール以降**変更されていないページ**を再取得している



- 数十億件に及ぶリクエスト
- 膨大な計算処理
- それが何ら成果を生まない


<br>


Webは長らく「人間がブラウザで見る」ことを前提に設計されてきたが、
現実にはすでにそうなっていない


---
layout: image-right
image: https://blog.cloudflare.com/_emdash/api/media/file/01KZA0FN16ARXEBX3WSM9XNTM9.png
backgroundSize: contain
---

# 変わらないページの再取得

色が付いた部分は、前回のクロール以降
変わっていないコンテンツを再取得するボット

ドメイン所有者の配信コストと
エージェントの取得コストが、
どちらにも成果をもたらさず無駄になっている

<footer class="text-xs opacity-50 mt-4">
出典: Cloudflare Blog https://blog.cloudflare.com/ja-jp/the-agentic-internet/
</footer>

---

# エージェントという新しい訪問者


- 従来、ブラウザは User-Agent ヘッダーで自身の身元を伝えていた
- いまや「ユーザーエージェント」は文字通り**ユーザーの代理人**として機能
- 人に代わってWeb上の情報を取得・操作するプログラムが日常的に稼働
- 最も成熟した例は**コーディングエージェント**
  - コードを読み書きし、ドキュメントを取得し、ページを解読する


<br>


> エージェントはCSSをレンダリングしたり、
> ヒーローイメージを見たりしません。広告をクリックすることもありません。
> しかし、エージェントの向こうには**お金を支払う人間**がいます。


---

# エージェンティックインターネットの分かれ目

現行のWebのビジネスモデルは、エージェントによる大量アクセスを
ほとんど想定していない

<div class="grid grid-cols-2 gap-4 pt-4">
<div>

### 悲観的シナリオ
発見・認証・決済の仕組みを
少数のスタックが独占し、
他は仲介を通じてしかアクセスできない

</div>
<div>

### 楽観的シナリオ
標準ベースで実装可能な
プリミティブ・公開コード・
中立的な基盤インフラが整う

</div>
</div>

<br>


Cloudflareはオープンインターネットの価値を信じ、
この未来構築に貢献する立場を取る


---

# 基礎となるオープン標準


- **x402** — エージェント向け決済プロトコル
- **MCP** — モデルとツールを繋ぐプロトコル
- **Web Bot Auth** — ボットの身元を証明する仕組み
- **PACT** — プライベートアクセスコントロールトークン


<br>


ドメイン所有者は、自身のアイデンティティプロバイダー・決済処理業者・
エージェントパートナーを自由に選択できる



Cloudflareも特権的な経路や早期アクセスAPIを持たず、
顧客と同じ基盤を使う<strong>「カスタマー・ゼロ」</strong>として自らを検証する


---
class: text-center
---

# 4つのプリミティブ

Readable / Discoverable / Callable / Payable

---

# 1. 読み取り可能（Readable）


- エージェントがコンテンツをネイティブに読み取れることが前提
- 人間向けの装飾的なHTMLタグはエージェントには不要
  - 計算資源の無駄
  - コンテキストウィンドウの汚染につながる


<div class="grid grid-cols-2 gap-4 pt-4">
<div>

### Markdown for Agents
サーバーサイドでコンテンツを
エージェント向けMarkdownに変換
帯域幅・トークン消費を削減

</div>
<div>

### Kitesurf
Workers上で動く軽量ブラウザ
リクエストごとに起動・破棄
エージェント必要機能のみ提供

</div>
</div>

---

# 2. 発見可能（Discoverable）

エージェンティックインターネットにおける**経済活動の起点**


- エージェントがリソースの存在を知らなければ、読み取りも呼び出しも決済も成立しない
- 検索インターフェースはキーワードボックスだけでは不十分
- **AI Search**: 公開サイトをエージェントが検索可能な状態にする
- **Agent Engine Optimization（AEO）**: コンテンツがエージェントからどの程度
  「見えている」かを測定する考え方


<br>


顧客が利用するエージェントから測定可能なレベルで見えていないサイトは、
実質的に**オフラインと同じ**


---

# 3. 呼び出し可能（Callable）

エージェントがサイトの「機能」を実行できること
（レストラン予約、サブスクリプション更新、レポート作成 など）


### 従来のアプローチの限界

HTML解析 → ボタン位置を推測 → クリック操作を合成 → DOM変化のたびに壊れる



### WebMCP

サイト側がブラウザを通じて自らの操作を、エージェントへの
**明示的なツール**として公開する仕組み


---

# WebMCPの利点


- 明示的なツール契約（HTML解析が不要）
- フォームフィールドの推測が不要
- ページ内で完結するため、ユーザーの既存セッション・状態をそのまま再利用できる


<br>


### Code Mode

エージェントは自然文よりも**コードとして思考**し、
コードとしてツールを呼び出す方が高速かつ正確

HTMLスクレイピングではなく、明示的なエンドポイント呼び出しで操作する


---

# コード例: WebMCPによるツール登録

```js {1-2|3-11|12-14|all}
document.modelContext.registerTool({
  name: "add-todo",
  description: "Add a new item to the user's active todo list",
  inputSchema: {
    type: "object",
    properties: {
      text: { type: "string", description: "The todo item text" }
    },
    required: ["text"]
  },
  async execute({ text }) {
    await addTodoItemToCollection(text);
    return { content: [{ type: "text", text: `Added: "${text}"` }] };
  }
});
```

`document.modelContext.registerTool()` はページ自身が「自分にできる操作」をエージェントに宣言するAPI。
`inputSchema`で入力の型・必須項目を、`execute`で実処理を定義する——不安定なDOM操作の推測を挟まず、**サイト側が最初から処理を公開**するアプローチ。


---

# 4. 決済可能（Payable）

エージェンティックインターネット未来像の**核**


- 広告モデルはエージェントが広告を見ない・クリックしない前提では機能しない
- シート課金モデルはプログラムから呼び出されるユーザーに馴染まない
- ページビュー依存の出版社は、広告非表示時に活動資金の確保が困難


<br>


エージェント側は、人間があらかじめ設定した**財布（ウォレット）と予算**の範囲内で活動する


---

# 決済可能な未来のイメージ


- レシピサイト: 広告収益化に失敗しても、取得1回あたり1セント未満で採算化
- 地方紙: 長期のライセンス契約やログインなしで、閲覧の都度一時ライセンスを許諾
- すべての有料取引で**領収書**を発行
  - 出版社: どのエージェントがどのページを取得したか証明できる
  - エージェント: 対価を支払ったことを証明できる


<br>


### Wallets / Monetization Gateway

エージェントが利用料を簡単に支払える仕組みと、
ドメイン所有者が数クリックで課金設定できる仕組み


---
class: text-center
---

# ユースケース

---

# ユースケース①: 無駄な再取得の削減


- 良性ボットが変更されていないページを繰り返し取得している現状
- Markdown for Agents / AI Search / AEO で「読み取り可能」「発見可能」にする
- エージェントが本当に必要な情報だけを効率よく取得できるようにする
- ドメイン所有者・エージェント双方の無駄な計算コストを削減


---

# ユースケース②: 操作の代行


- Todoリストへの項目追加（コード例のシナリオ）
- レストランの予約、サブスクリプションの更新、レポート作成
- 人間が9往復のやり取りをしていた作業を、エージェントが1回で完結


<br>


ユーザーから見た評価軸は「使い勝手が良くなったかどうか」


---

# ユースケース③: 少額課金によるマネタイズ


- Wallets と Monetization Gateway を組み合わせる
- 1回の取得あたり1セント未満といった小口決済でコンテンツを収益化
- 広告収益化が難しいレシピサイトのようなコンテンツに有効
- 長期契約・ログインを前提にできない地方紙のような媒体にも有効


---

# ユースケース④: エージェント向け一時ライセンス


- 記事閲覧のたびに、その場で一時的なライセンスをエージェントに許諾
- 長期の契約交渉やアカウント発行を前提としない
- 取引の都度、透明性のある領収書を発行
- 出版社・エージェント双方が取引の正当性を証明できる状態を作る


---

# Cloudflareの立場


- 元来、数十億の人間とその訪問先サイトの間に立ち、
  保護・通信高速化・可用性維持を担ってきた
- トラフィックの主体が人間からエージェントへシフトしても、
  「信頼される中立的なレイヤー」であり続けるという役割は変わらない
- 出版社、加盟店、エージェントビルダー、エンドユーザーの
  いずれとも競合しない中立的な高性能レイヤーを目指す


---

# まとめ


- 良性ボットの大量トラフィックの多くが成果を生まないまま消費されている現状が出発点
- エージェントは新種のソフトウェアではなく、新種のサイト訪問者
- Webサイトを Readable / Discoverable / Callable / Payable にすることが鍵
- 4つのプリミティブはいずれもオープン標準（x402、MCP、Web Bot Auth、PACT）に基づく
- Cloudflareはスタックの独占ではなく、中立的な基盤としての立場を取る
- 供給側（パブリッシャー）と需要側（エージェント）双方の多様性が、
  オープンなインターネットの維持に不可欠


---

<div class="text-center">

# 参考リンク

</div>

- 原文: [読み取り、発見、呼び出し、決済が可能なオープンなエージェンティックインターネットの構築](https://blog.cloudflare.com/ja-jp/the-agentic-internet/)
- 英語版: [The Agentic Internet](https://blog.cloudflare.com/the-agentic-internet/)
- [Markdown for Agents（Cloudflare Developers）](https://developers.cloudflare.com/fundamentals/reference/markdown-for-agents/)
- [WebMCP（Cloudflare Blog）](https://blog.cloudflare.com/webmcp/)
- [Code Mode（Cloudflare Blog）](https://blog.cloudflare.com/code-mode/)
- [Wallets（Cloudflare Blog）](https://blog.cloudflare.com/wallets/)
- [Monetization Gateway（Cloudflare Blog）](https://blog.cloudflare.com/monetization-gateway/)
- [x402](https://x402.org/)

<div class="pt-8 text-sm opacity-50">
Wiki: docs/articles/2026-08-06-the-agentic-internet.md
</div>
