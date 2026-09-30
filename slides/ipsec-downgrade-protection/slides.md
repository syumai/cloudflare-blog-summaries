---
routerMode: hash
theme: default
title: "IPsec に対する量子ダウングレード攻撃の防止"
info: |
  IPsec に対する量子ダウングレード攻撃の防止の解説スライド。
  原文: https://blog.cloudflare.com/ipsec-downgrade-protection/
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

# IPsec に対する量子ダウングレード攻撃の防止

<div class="text-xl pt-2">IKE_SA_INIT_FULL_TRANSCRIPT_AUTH の解説</div>

Birthday Week 2026

<div class="pt-4 text-sm opacity-70">
原文: https://blog.cloudflare.com/ipsec-downgrade-protection/<br>
公開日: 2026-09-29
</div>

---

# TL;DR

- IPsec（IKEv2）は、<strong>量子コンピュータを持つ中間者</strong>に PQ 通信を古典暗号へ落とされうる
- 原因: 各当事者が<strong>自分の送信メッセージだけ</strong>に署名し、全トランスクリプトには署名しない
- 対策: IETF と作った拡張 <code>IKE_SA_INIT_FULL_TRANSCRIPT_AUTH</code>。全トランスクリプトに署名
- 拡張自体のダウングレードは<strong>無条件の通知</strong>で防ぐ
- Cloudflare WAN / Magic Transit でベータ提供（<code>ipsec_downgrade_protection</code> フラグ）

---

# アジェンダ

- 背景: PQ 移行と後方互換のリスク
- IPsec と IKEv2 の基礎
- 攻撃の流れ（Mallory）
- 防御の考え方と拡張の仕組み
- 有効化方法・コード例（プロトコルの流れ）・ユースケース・まとめ

---

# 背景: PQ 移行とダウングレード

- Diffie-Hellman → ML-KEM、ECDSA / RSA → ML-DSA への移行が進行中
- 全端末の PQ 対応には何年もかかり、当面は<strong>古典暗号との後方互換</strong>が必要
- <strong>ダウングレード攻撃</strong>: 中間者がメッセージを改ざんし、「相手は PQ 非対応」と思わせて弱い暗号に落とす
- PQ の primitive を実装するだけでは不十分。能動的攻撃者の迂回を防ぐことが次の課題
- Cloudflare は量子攻撃の資源見積もり低下を受け、移行期限を <strong>2029 年</strong>に前倒し

---

# IPsec の位置づけ

- TLS / QUIC はトランスポート層、IPsec は <strong>IP 層</strong>で動作し、ネットワークインフラに深く組み込まれている
- <strong>Cloudflare IPsec / WAN</strong>: MPLS なしで IPsec 接続を Anycast ネットワークに延長
- <strong>Magic Transit</strong>: DDoS 除去後のトラフィックを IPsec トンネルで戻す
- PQ 鍵共有は対応済み。PQ 認証も TLS / QUIC と同程度の時期に採用見込み（事前共有鍵は既に PQ）

---

# IKEv2 のハンドシェイク

<div class="grid grid-cols-2 gap-6">
<div>

1. <strong>初期交換</strong>: 対応パラメータ + DH 鍵共有値を交換
2. 鍵共有値から暗号鍵を導出し、以降を暗号化（この時点では未認証）
3. <strong>認証交換</strong>: ID と、<strong>自分の送信メッセージへの署名</strong>を送る

</div>
<div>
<img src="https://blog.cloudflare.com/_emdash/api/media/file/01KXDK6GGF8M6GDRZC7639MRXN.png" style="max-height: 300px; margin: 0 auto;" />
</div>
</div>

<div class="text-xs opacity-60 pt-2">出典: Cloudflare Blog https://blog.cloudflare.com/ipsec-downgrade-protection/（図は本文から推定した内容）</div>

---

# 鍵となる点と PQ 鍵共有

- 各当事者は<strong>自分の送信メッセージだけ</strong>に署名。TLS 1.3 のように<strong>全体には署名しない</strong>
- 相手と同じメッセージ列を見たことを、署名する側が確認できない → 攻撃の鍵
- 暗号化の目的: 端末 ID の秘匿、パケット分割（大きな ML-KEM メッセージを確実に送る）
- PQ 対応は<strong>中間交換</strong>（ML-KEM）で行う。ただし両者が合意したときだけ実行
- 古典のみが選ばれると、相手は PQ 非対応とみなして古典に落ちる

---
layout: image-right
image: https://blog.cloudflare.com/_emdash/api/media/file/01KXDK7XD9TRFXZRA3HJHS7XPH.png
backgroundSize: contain
---

# 中間交換（ML-KEM）

- 初期交換の後に、ML-KEM による鍵交換を挟む
- イニシエータが広告し、レスポンダが同意した場合のみ実行
- レスポンダが古典のみを選べば、イニシエータは古典のみに落とす
- 広告しなければ、レスポンダも PQ 非対応とみなす

<div class="text-xs opacity-60 pt-4">出典: Cloudflare Blog https://blog.cloudflare.com/ipsec-downgrade-protection/（図は本文から推定した内容）</div>

---

# 攻撃の流れ（1）: ダウングレード

Mallory（量子コンピュータを持つ中間者）の手順:

1. イニシエータの初期メッセージを<strong>「古典のみ」に書き換え</strong>てレスポンダへ転送
2. 署名の不一致（送信内容と受信内容が違う）で、本来は認証に失敗する
3. 認証メッセージは暗号化されているが、古典のみなので Mallory は<strong>量子計算で暗号鍵を復元</strong>できる
4. 残る問題は署名の偽造

---

# 攻撃の流れ（2）: ID ミスバインディング

- レスポンダは自分の送信メッセージにしか署名しないため、<strong>どのイニシエータ ID を受け入れたか</strong>を相手に示さない（2016 年の論文の指摘）
- レスポンダは、信頼する<strong>任意のイニシエータ</strong>の認証メッセージを受け入れる
- Mallory 自身がレスポンダに受け入れられるイニシエータなら、<strong>自分の資格情報で有効な署名</strong>を作れる
- レスポンダは Mallory（IDm）、イニシエータはレスポンダ（IDr）と接続したと信じる

---
layout: image-right
image: https://blog.cloudflare.com/_emdash/api/media/file/01KXDK8RFHFB17AKXWE0JVR4YX.png
backgroundSize: contain
---

# 攻撃の全体像

- 両者とも、攻撃者が知る暗号鍵を受け入れている
- 一方の端点が<strong>誤った相手を認証</strong>している
- 変種: 資格情報を盗む鍵漏洩なりすまし（KCI）
- PQ 固有ではなく、<strong>最も弱い鍵共有</strong>へ落とせる問題

<div class="text-xs opacity-60 pt-4">出典: Cloudflare Blog https://blog.cloudflare.com/ipsec-downgrade-protection/（図は本文から推定した内容）</div>

---

# この攻撃は現実的か

- 量子計算を<strong>ハンドシェイク中にオンラインで</strong>行う必要がある（harvest-now, decrypt-later はオフライン）
- 暗号解読可能な量子コンピュータの<strong>最初の標的にはなりにくい</strong>
- 一方、古典のみを無効にする前に Q-day が来る可能性は無視できない
- IPsec のエコシステム全体の更新には長い時間がかかるため、他の PQ 対応と合わせて今のうちに備える

---

# 単純な対策では足りない

- 古典のみの鍵共有を無効化: イニシエータは事前にレスポンダの能力を知らないことが多い
- HSTS 風に「過去に PQ 対応だった相手」を記憶: IKEv2 では<strong>交渉が初期交換、名乗るのは認証交換</strong>なので手遅れ
- 根本原因は、攻撃者が両者に異なるメッセージ列を見せる <strong>split view</strong>
- TLS 1.3 のように全トランスクリプトに署名すれば、同じ会話だったことを確認できる

---

# 拡張: FULL_TRANSCRIPT_AUTH

- IETF の IPSECME WG と開発した IKEv2 拡張（RFC 化の途上）
- 対応は初期交換の notify メッセージで示す（他の機能と同じく交渉）
- <strong>無条件の通知</strong>: イニシエータは常に通知、レスポンダも<strong>要求がなくても通知</strong>
- 相手が通知したら、<strong>全トランスクリプトに署名</strong>し、相手にも期待する
- TLS 1.3 拡張（要求されたものにだけ返答）とは異なる点

---

# ダウングレード耐性の仕組み

| Mallory の操作 | 結果 |
|---|---|
| 片方の通知だけ削除 | 一方は新ロジック、他方は旧ロジック。署名対象が食い違い <code>AUTHENTICATION_FAILURE</code> |
| 両方の通知を削除 | 旧ロジックに戻るが、<strong>イニシエータとレスポンダ両方の署名</strong>の偽造が必要 |
| ミスバインディングを試行 | イニシエータが望んだのと別のレスポンダの ID を示すことになり認証失敗 |
| 双方の資格情報を侵害 | KCI は可能だが、もっと簡単な攻撃手段がある |

---

# コード例: プロトコルの流れ

本記事に実行可能なコードはない。記事の記述に基づく擬似的な流れで示す（記事のコードではない）。

```text {all|1-3|5-6|8-9}
[通常]  Initiator --IKE_SA_INIT(+FULL_TRANSCRIPT_AUTH)--> Responder
        Initiator <--IKE_SA_INIT(+FULL_TRANSCRIPT_AUTH)-- Responder
        => 両者とも全トランスクリプトに署名・検証して成立

[片方の通知だけ削除]
        => 新旧ロジックが食い違い AUTHENTICATION_FAILURE

[両方の通知を削除]
        => 旧ロジック。ただし両者の署名を偽造する必要がある
```

- 通知は無条件に送られるため、削除すると必ずどちらかの期待が食い違う

---

# 有効化方法と提供状況

- アカウント単位のフィーチャーフラグ <code>ipsec_downgrade_protection</code>
- 利用したい顧客は<strong>アカウントチームに依頼</strong>して有効化
- 有効なアカウントでは <code>IKE_SA_INIT</code> のレスポンスに通知を含める
- Cloudflare WAN と Magic Transit でベータ。十分なベータ後に<strong>全アカウントへ展開</strong>予定
- フラグの理由: 顧客のイニシエータが新しい通知を誤処理する、まれなケースへの備え
- 両者が対応して初めて効果が出る

---

# ユースケース1: 拠点の IPsec 接続

- Cloudflare IPsec / Cloudflare WAN で、拠点やデータセンターを Anycast ネットワークに IPsec 接続
- PQ 鍵共有と合わせて、ダウングレード攻撃にも備える
- アカウントチームにフラグの有効化を依頼する

---

# ユースケース2: Magic Transit

- DDoS 除去後のトラフィックを IPsec トンネルで組織へ戻す構成
- 戻りトンネルでの古典暗号へのダウングレードを防ぐ
- IKE の交渉では Cloudflare は常にレスポンダとして動作

---

# ユースケース3: 実装者・設計者

- IPsec の実装者: イニシエータ / レスポンダにこの拡張を実装し、ドラフトの進行に合わせて相互運用を確認
- プロトコル設計者: ダウングレード耐性のある交渉の例として参照（<strong>無条件通知</strong>）

---

# まとめ・所感

- 鍵は「交渉内容ではなく会話全体に署名して、split view をなくす」こと
- 「要求されなくても通知する」という小さな違いが、拡張自体のダウングレードを防ぐ
- 設計上の欠陥は少なくとも 10 年前から知られていた。量子時代に意味が再浮上するバグが他にもあるかもしれない
- 共著者の Valery Smyslov がドキュメントの取りまとめを主導し、耐性の仕組みも見つけた
- デプロイ可能なサンプルは対象外（プロトコル設計とアカウント単位のベータ機能のため）

---

# 参考リンク

- 原文（en-us）: https://blog.cloudflare.com/ipsec-downgrade-protection/
- 関連スライド（TLS 側の PQ 可視化）: [▶ 解説スライド](../post-quantum-visibility/)
- 関連スライド（PQ 認証・認証局）: [▶ 解説スライド](../pq-ca-with-mtcs/)
- IETF ドラフト: https://datatracker.ietf.org/doc/draft-ietf-ipsecme-ikev2-downgrade-prevention/
- RFC 7296（IKEv2）: https://datatracker.ietf.org/doc/rfc7296/
- RFC 9242（中間交換）: https://datatracker.ietf.org/doc/rfc9242/
- 2016 年の論文: https://eprint.iacr.org/2016/072
- Magic Transit: https://developers.cloudflare.com/magic-transit/
- Wiki: [docs/articles/2026-09-29-ipsec-downgrade-protection.md](https://github.com/syumai/cloudflare-blog-summaries/blob/main/docs/articles/2026-09-29-ipsec-downgrade-protection.md)
