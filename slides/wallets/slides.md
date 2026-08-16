---
routerMode: hash
theme: default
title: Cloudflare Walletsを発表
themeConfig:
  primary: '#f6821f'
info: |
  Cloudflare Blog記事「Cloudflare Walletsを発表：エージェント型インターネットのためのプログラム可能なウォレット」の解説スライド。
  原文: https://blog.cloudflare.com/ja-jp/wallets/
class: text-center
highlighter: shiki
drawings:
  persist: false
transition: slide-left
mdc: true
lineNumbers: true
---

# Cloudflare Walletsを発表

エージェント型インターネットのためのプログラム可能なウォレット

<div class="pt-4 text-sm opacity-70">
原文: https://blog.cloudflare.com/ja-jp/wallets/<br>
公開日: 2026-08-04
</div>

---

# TL;DR

- AIエージェントは人間向けに設計されたログインページの操作を強いられがちで、<strong>「安定したID」</strong>と<strong>「ネイティブな決済手段」</strong>の両方を持たないことが普及の妨げに
- Cloudflareは**Cloudflare Wallets**を発表。`cloudflare.pay`で一意のハンドルを取得し、ステーブルコインの保管・サービス購入・Web全体での資金受け取りが可能に
- 各アカウントは、予算・許可する販売先・1回あたりの上限額などを設定できる**Virtual Wallets**を作成し、エージェントに安全な範囲で資金を利用させられる
- 決済だけでなく、`research.example.cloudflare.pay`のような人間が読めるエージェント識別子を通じて「誰の代理として動いているか」を検証可能にするデジタルアイデンティティの側面も持つ
- <strong>Monetization Gateway</strong>（販売側の決済受け取り）・Wallets（購入側の決済）・Identity（本人確認）の3要素で<strong>「ヘッドレスマーケットプレイス」</strong>の実現を目指す

---

# アジェンダ


- 背景: エージェントがAPI利用時に直面する2つの壁
- Cloudflare Walletsの概要
- Account Wallet と Virtual Wallet
- 自由な試行と予算管理
- 決済だけでなくデジタルアイデンティティも
- エージェントコマースの未来


---

# 背景: エージェントが直面する2つの壁

多くの場合、AIエージェントは
**人間向けに設計されたログインページ**を操作しなければならない


- APIを利用開始するための**安定したID**を持っていない
- APIの利用料金を支払う**ネイティブな決済手段**を持っていない


<br>


→ エージェントはソフトウェアの利用開始（オンボーディング）につまずき、
エージェントによる商取引の普及が妨げられている


---

# Cloudflare Walletsの概要


- `cloudflare.pay` で一意のハンドルを取得
- マーチャントとのやり取りで使える一意のユーザー名として機能
- 先月発表の **Monetization Gateway** と連携
- Monetization Gateway: x402プロトコルによるHTTPマイクロペイメントに対応


---

# 機能詳細

Cloudflare Walletsは以下を可能にする仕組み


- ステーブルコインの保存
- サービスの購入
- Web全体での資金の受け取り


<br>


各アカウントは **Virtual Wallets** を作成し、
API・MCPツール・コンテンツなどを購入できる


---
layout: image-right
image: https://blog.cloudflare.com/_image?href=https%3A%2F%2Fblog.cloudflare.com%2F_emdash%2Fapi%2Fmedia%2Ffile%2F01KZ517G703TJNQB9WCE3VG3BY.png&w=715&h=557&f=webp&fit=cover&position=center
---

# 2種類のウォレット

### Account Wallet
人間（アカウント所有者）向け
入出金・Virtual Walletへの資金割り当て

### Virtual Wallet
エージェント向け、APIキーで操作
Account Walletの上限内でのみ利用可能

<footer class="text-xs opacity-50 mt-4">
出典: Cloudflare Blog https://blog.cloudflare.com/ja-jp/wallets/
</footer>

---

# Virtual Walletの利用条件

エージェントによる資金利用を安全に保つための設定


- 利用可能な予算
- 利用を許可する販売先のリスト
- 1回あたりの最大利用金額


<br>


リスクを適切に管理しながら、多数のAPIを手軽に試せる


---

# 自由な試行


Virtual Walletの大きな魅力は、エージェントが得意とする
「**数十から数百のサービスを試し、最適なものを見つける**」ことの実現



- 利用上限を事前設定することで、安全な支出範囲を維持
- 人間はエージェントに自律的な判断を任せられる


---

# 例: 従業員向けAI利用予算の設定


> 従業員全員にAI推論用として週100ドルまで利用できる
> 予算を設定したい場合は、必要な残高を設定した
> Account Walletを用意し、そのルールを適用した
> Virtual Walletを各従業員向けに作成するだけです


---

# 入出金の仕組み


- 対応地域では法定通貨からの入金・出金（オンランプ／オフランプ）を提供予定
- 対象ユーザー向けにはステーブルコインによる直接の資金投入にも対応


---
class: text-center
---

# 決済だけにとどまらない仕組み

デジタルアイデンティティとしてのCloudflare Wallets

---

# 誰の代理として動いているのか


エージェントがマーチャントとやり取りする際、
そのエージェントが誰の代理として動いているのかは
**必ずしも明確ではない**



- `cloudflare.pay` の識別子でエージェントは必要に応じ自身のIDを提示可能
- 例: 調査用エージェントが `research.example.cloudflare.pay` を持つ
- IDの公開は完全に**任意**。既知エージェントの優遇も企業側の判断


---

# 人間が読めるエージェント識別子


- エージェント対応は「VPNへの対応方法」と似たものになっていく
- 既存の取り組み: Turnstile、Bot Management、Web Bot Auth
- Web Bot Auth: エージェントが鍵ペアで自身のIDを登録済み
- Cloudflare Walletの識別子は、その鍵ペアを**人間が読める形**で表現


<br>


「DNSにおけるURLとIPアドレスの関係」に似た比喩


---
class: text-center
---

# エージェントコマースの未来

3つの基盤要素が組み合わさり、ヘッドレスマーケットプレイスを実現

---

# 3つの構成要素


- **Monetization Gateway**: 販売者が決済インフラ不要でサービス・コンテンツの対価を受け取れる
- **Wallets**: エージェントを介した購入者が人手を介さず支払える
- **Identity**: マーチャントが身元を明らかにした購入者とやり取り・本人確認できる


---

# 設定イメージ（記事にはコード例なし）


記事にはAPI呼び出しのコード例は含まれていない。
Virtual Walletの権限設定の考え方を図式化すると:


```text {1|2-3|4-7|all}
Account Wallet（人間の所有者）
  └─ 残高: 週次で補充される予算（例: 週100ドル）
      └─ Virtual Wallet（エージェント用、APIキーで操作）
           - 利用可能な予算: Account Walletの上限内
           - 許可する販売先のリスト
           - 1回あたりの最大利用金額
```


実装の詳細は開発者ドキュメント（x402互換エンドポイント）を参照


---
class: text-center
---

# ユースケース

---

# ユースケース①②

<div class="grid grid-cols-2 gap-4">
<div>

### APIの試用・比較
x402のマイクロペイメントで
アカウント作成不要で
多数のAPIを気軽に比較

</div>
<div>

### 従業員向け予算管理
Account Wallet + Virtual Wallet
で組織内のAI利用コストを
ウォレット単位で分配・管理

</div>
</div>

---

# ユースケース③④

<div class="grid grid-cols-2 gap-4">
<div>

### エージェントIDの公開
`research.example.cloudflare.pay`
のような識別子で
所属組織を明示

</div>
<div>

### 異常検知と対応
支出速度の異常を人間が確認し、
意図した利用なら上限引き上げや
追加資金投入で対応

</div>
</div>

---

# まとめ


- エージェントには「安定したID」と「決済手段」の両方が欠けていた
- Cloudflare Walletsは `cloudflare.pay` ハンドルでこの2つを同時に提供
- Account Wallet（人間）とVirtual Wallet（エージェント）の分離で安全に権限委譲
- 人間可読な識別子はWeb Bot Authの鍵ペアを表現する仕組み
- Monetization Gateway・Wallets・Identityの3要素でヘッドレスマーケットプレイスを目指す


---

<div class="text-center">

# 参考リンク

</div>

- 原文: [Cloudflare Walletsを発表](https://blog.cloudflare.com/ja-jp/wallets/)
- 英語版: [Introducing Cloudflare Wallets](https://blog.cloudflare.com/wallets/)
- [Cloudflare Walletハンドルの取得](https://cloudflare.pay)
- [Monetization Gateway（発表記事）](https://blog.cloudflare.com/monetization-gateway/)
- [x402プロトコル](https://www.x402.org/)
- [x402互換のエンドポイント（開発者ドキュメント）](https://developers.cloudflare.com/agents/tools/payments/x402/)
- [Web Bot Auth（開発者ドキュメント）](https://developers.cloudflare.com/bots/reference/bot-verification/web-bot-auth/)
- [エージェント開発ライフサイクル ▶ 解説スライド](../agent-development-lifecycle/)

<div class="pt-8 text-sm opacity-50">
Wiki: docs/articles/2026-08-04-wallets.md
</div>
