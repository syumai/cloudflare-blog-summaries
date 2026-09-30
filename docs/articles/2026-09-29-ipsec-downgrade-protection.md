# IPsec に対する量子ダウングレード攻撃の防止

- 原文: [https://blog.cloudflare.com/ipsec-downgrade-protection/](https://blog.cloudflare.com/ipsec-downgrade-protection/)
- 日本語版の出どころ: Cloudflare公式の日本語版（`https://blog.cloudflare.com/ja-jp/ipsec-downgrade-protection/`）は確認時点で存在しなかった（404）ため、英語版（en-us）から日本語化して要約している。公開日は英語原文の datePublished（2026-09-29）に従う。
- 公開日: 2026-09-29
- 位置づけ: Birthday Week 2026 の記事
- 著者: Christopher Patton、Amos Paul、Lina Baquero
- 関連: 同じ Birthday Week 2026 の記事として [cf のご紹介](./2026-09-28-cloudflare-cf-cli-launch.md) などがあるが、内容上の直接の関連は薄い（本リポジトリ内にポスト量子暗号・IPsec を扱う既存記事は現時点でない）
- GitHub: [docs/articles/2026-09-29-ipsec-downgrade-protection.md](https://github.com/syumai/cloudflare-blog-summaries/blob/main/docs/articles/2026-09-29-ipsec-downgrade-protection.md)

![ヘッダー画像](https://blog.cloudflare.com/_emdash/api/media/file/01M3PBXV6RMBDAPYBPS4CSKCS9.01M3PBXVX4E5746D4FX9F3R8V5.png)
*図: 記事ヘッダー画像（出典: Cloudflare Blog https://blog.cloudflare.com/ipsec-downgrade-protection/。原文に alt テキストやキャプションがないため、掲載位置から「ヘッダー画像」と筆者が補った）*

## TL;DR

- IPsec（IKEv2）には、ポスト量子（PQ）対応の端末同士の通信を、量子コンピュータを持つ中間者が**古典暗号へダウングレード**して解読できる設計上の欠陥がある。
- 原因は、各当事者が**自分が送ったメッセージだけ**に署名し、ハンドシェイク全体（トランスクリプト）には署名しないこと。TLS 1.3 のような新しいプロトコルとは異なる。
- Cloudflare は IETF の IPSECME WG と協力し、拡張 `IKE_SA_INIT_FULL_TRANSCRIPT_AUTH` を作った。全トランスクリプトに署名させ、さらに「無条件の通知」でこの拡張自体のダウングレードも防ぐ。
- Cloudflare WAN と Magic Transit でベータ提供中。アカウントチームに依頼して `ipsec_downgrade_protection` フラグを有効にする。十分なベータ後に全アカウントへ展開する予定。

## 背景・課題

量子コンピュータは現在の暗号を破る可能性があり、Diffie-Hellman は ML-KEM のような PQ 鍵共有へ、ECDSA / RSA は ML-DSA のような PQ 署名へ置き換える必要がある。Cloudflare は PQ 暗号の既定化、暗号の棚卸しツールの一部公開、PQ の可視化機能などで移行を進め、記事時点では、量子攻撃の資源見積もりが大きく下がったことを受けて**移行期限を 2029 年に前倒し**している。

ただし、インターネット上の全クライアントとサーバーが PQ に対応するには何年もかかり、その間は古典暗号との後方互換が必要になる。この互換性が新しいリスクを生む。**ダウングレード攻撃**では、通信路上の攻撃者がメッセージを改ざんし、片方に「相手は PQ 非対応」と思い込ませて、弱い暗号へ落とす。PQ の primitive を実装するだけでは足りず、能動的な攻撃者が PQ を迂回できないようにすることが次の課題になる。

記事は特に IPsec を扱う。IPsec は Cloudflare IPsec、Cloudflare WAN、Magic Transit の中核にある。数か月前に Cloudflare は、認証方式によらず成立する、より巧妙な攻撃につながる設計上の欠陥を見つけた（実際には 2016 年の論文で指摘済みのものの再発見）。

## 発表内容 / アーキテクチャ

### IPsec の位置づけ

TLS / QUIC がトランスポート層（TCP / UDP 上）で Web 通信を守るのに対し、IPsec は **IP 層**で動作する。ネットワークスタックのより低い層にあるため、現在のネットワークインフラに深く組み込まれている。Cloudflare IPsec は MPLS のような高価な接続なしで、組織の IPsec 接続を Cloudflare のグローバル Anycast ネットワークへ延長できる。Magic Transit は組織の IP 範囲の前段に Cloudflare が立って DDoS などを除去し、きれいにした通信を IPsec トンネルで戻す。IPsec は近年 PQ 鍵共有も加わり、PQ 認証も TLS / QUIC と同程度の時期に採用される見込みだ（事前共有鍵認証は、すでに完全に PQ とされる）。

### IKEv2 のハンドシェイク

暗号化の前に、IKEv2 で認証付き鍵共有を行う。典型的には 2 つの交換（exchange）がある。

1. **初期交換**: イニシエータが、対応パラメータと Diffie-Hellman の鍵共有値を送る。レスポンダが選んだパラメータと自分の鍵共有値を返す。
2. **認証交換**: 両者は鍵共有値から暗号鍵を導出し、以降の交換を暗号化する。ただしこの時点では鍵共有値は未認証なので、認証交換でイニシエータが自分の ID を示し、自分の鍵共有値と広告したパラメータへの署名を送る。レスポンダは ID から資格情報を引いて署名を検証する。レスポンダも返信の認証メッセージで同じことを行う。

![IKEv2 のハンドシェイク（推定）](https://blog.cloudflare.com/_emdash/api/media/file/01KXDK6GGF8M6GDRZC7639MRXN.png)
*図: IKEv2 の初期交換と認証交換の図と思われる（出典: Cloudflare Blog https://blog.cloudflare.com/ipsec-downgrade-protection/。原文に alt テキストやキャプションがなく、画像の直前直後の本文から筆者がキャプションを推定した）*

重要な点は、**各当事者は自分の送信メッセージだけに署名し、TLS 1.3 のようにハンドシェイク全体には署名しない**こと。このため、署名する側は「自分と相手が同じメッセージ列を見ている」ことを確認できない。これが攻撃の鍵になる。

ハンドシェイクの暗号化には 2 つの目的がある。端末の ID をネットワークから隠すこと（TLS / QUIC では Encrypted Client Hello で同等のことができる）と、IPsec のパケット分割機構を使えるようにして、長いメッセージ（ML-KEM の大きな鍵交換メッセージなど）を確実に送れるようにすることだ。

### PQ 鍵共有と後方互換

古典 Diffie-Hellman だけでは、量子攻撃者が将来、鍵共有値から暗号鍵を導出できる。そこで IKEv2 には、初期交換の後に ML-KEM を使う**中間交換（intermediate exchange）**を挟むオプションがある。

![ML-KEM を使う中間交換（推定）](https://blog.cloudflare.com/_emdash/api/media/file/01KXDK7XD9TRFXZRA3HJHS7XPH.png)
*図: 初期交換の後に ML-KEM の中間交換を挟む IKEv2 の図と思われる（出典: Cloudflare Blog https://blog.cloudflare.com/ipsec-downgrade-protection/。原文に alt テキストやキャプションがなく、掲載位置の本文から筆者がキャプションを推定した）*

この交換は、イニシエータが初期交換で対応を広告し、レスポンダが使用に同意した場合にのみ行われる。レスポンダが古典のみの鍵共有を選べば、イニシエータは「相手は PQ 非対応」とみなして古典のみに落とす。逆にイニシエータが PQ を広告しなければ、レスポンダは相手が PQ 非対応とみなす。この**パラメータ交渉の挙動が攻撃の足がかりになる**。

### 「Hello my name is Mallory」: 攻撃の流れ

量子コンピュータを持つ中間者 Mallory を考える。

1. Mallory はイニシエータの初期交換メッセージを横取りし、「古典のみ」と広告するよう書き換えてレスポンダへ転送する。
2. そのままでは、イニシエータは自分が送ったメッセージに署名し、レスポンダは受け取った（書き換え後の）メッセージを検証するため、署名検証が失敗する。Mallory が署名を偽造できれば別だが、通常はできない。
3. IKEv2 では認証メッセージが暗号化されているため、Mallory は暗号鍵も計算しなければならない。しかしダウングレードが成功していれば両者は古典のみなので、Mallory は量子コンピュータで Diffie-Hellman の鍵共有値から暗号鍵を復元できる。
4. 署名偽造の問題は、2016 年の論文が指摘した点で回避できる。レスポンダは自分の送信メッセージにしか署名しないため、**どのイニシエータ ID を受け入れたかを相手に確認させない**。つまりレスポンダは、自分が信頼する任意のイニシエータからの認証メッセージを受け入れる。Mallory 自身が、レスポンダに受け入れられる資格情報を持つイニシエータであれば、自分の資格情報で有効な署名を作れる。

結果として、レスポンダは相手を Mallory（IDm）と思って接続を完了し、イニシエータ（IDi）は相手をレスポンダ（IDr）と思って接続を完了する。両者とも攻撃者が知る暗号鍵を受け入れている。これは**アイデンティティ・ミスバインディング**攻撃の一種だ。

![アイデンティティ・ミスバインディング攻撃（推定）](https://blog.cloudflare.com/_emdash/api/media/file/01KXDK8RFHFB17AKXWE0JVR4YX.png)
*図: Mallory が間に入り、IDm・IDi・IDr が登場するミスバインディング攻撃の図と思われる（出典: Cloudflare Blog https://blog.cloudflare.com/ipsec-downgrade-protection/。原文に alt テキストやキャプションがなく、本文中の記述（IDm / IDi / IDr）から筆者がキャプションを推定した）*

変種として、Mallory がイニシエータの資格情報を盗んでなりすます**鍵漏洩なりすまし（KCI）**攻撃もある。これはミスバインディングを必要としないが、レスポンダが盗まれた資格情報を失効するまで盗聴できる。また、これらは PQ 固有ではなく、両者がサポートする最も弱い鍵共有方式へ落とせるという問題だ。

### この攻撃は現実的か

量子版の難しさは、量子計算が**オンライン**であること、つまりハンドシェイクが完了する前に攻撃中に計算を終える必要がある点だ。これは harvest-now, decrypt-later のようなオフライン計算とは異なる。そのため、ダウングレード攻撃が暗号解読に関係する量子コンピュータの最初の標的になる可能性は低い。一方で、IPsec エコシステム全体で古典のみを無効にする前に Q-day が来る可能性は無視できず、他の PQ 対応が進んでいる今のうちに手を打つのがよい、と記事は述べる。

### 防御: なぜトランスクリプト全体に署名するのか

最も単純な対策は、古典のみの鍵共有（初期 DH の後に PQ 鍵交換がない構成）を無効にすることだが、イニシエータは事前にレスポンダの能力を知らないことが多く、簡単ではない。HSTS のように、過去に PQ に対応していたピアを記憶して以降の古典のみを拒否する方式も考えられるが、IKEv2 では交渉が初期交換で行われ、ピアが名乗るのは認証交換なので、そのときには手遅れになる。

根本的な問題は、各自が自分の送信メッセージにしか署名しないため、攻撃者がイニシエータとレスポンダに異なるメッセージ列を見せる「split view」を作れることだ。TLS 1.3 のように、認証する側が受信メッセージを含むハンドシェイク全体に署名すれば、同じ会話をしたことを確認でき、split view は成立しない。Cloudflare はこの原理的な方法を選んだ。

### `IKE_SA_INIT_FULL_TRANSCRIPT_AUTH` 拡張

IPSECME WG と開発した IKEv2 の拡張（近く RFC になる見込み）で、拡張の使用は他の機能と同様に交渉で決まる。したがって拡張自体もダウングレードされうるが、巧妙な仕組みでこれを防ぐ。

1. **無条件の通知**: 拡張のサポートは、初期交換の notify メッセージで示す。イニシエータは常に通知し、レスポンダも**イニシエータが通知しなくても通知する**。TLS 1.3 では、サーバーがクライアントの要求した拡張にだけ返答する点と異なる。
2. **全トランスクリプトの署名**: 相手が通知すれば、自分の送信メッセージだけでなく全トランスクリプトに署名し、相手にも全トランスクリプトへの署名を期待する。
3. **ダウングレード耐性**: Mallory がイニシエータ側の通知だけを消すと、レスポンダは古い認証ロジック、イニシエータは新しいロジックを使うため、署名対象のバイト列が食い違い、`AUTHENTICATION_FAILURE` になる。レスポンダ側の通知だけを消しても同様になる。

両方の通知を消した場合は、両者が古いロジックに戻り、ダウングレードと暗号鍵の計算は可能になる。しかしその場合、Mallory はイニシエータだけでなく**レスポンダの署名も偽造**しなければならない。ミスバインディングを試みるなら、イニシエータが接続したかったレスポンダとは別の ID を提示する必要がある。example.com に接続したかったのに cloudflare.com の証明書を見せられるようなもので、イニシエータが極端に誤設定されていない限り認証は失敗する。双方の資格情報を侵害すれば KCI は可能だが、その場合 Mallory にはもっと簡単な攻撃手段がある。なお、IKE の交渉では Cloudflare は常にレスポンダとして動作する。

### 有効化方法と提供状況

機能はアカウント単位のフィーチャーフラグ `ipsec_downgrade_protection` で制御され、利用したい顧客はアカウントチームに依頼して有効化してもらう。有効なアカウントでは、`IKE_SA_INIT` のレスポンスに `IKE_SA_INIT_FULL_TRANSCRIPT_AUTH` 通知が含まれる。十分なベータテストの後、全アカウントで有効にする予定。フラグを設けたのは、顧客側の IKEv2 イニシエータが新しい通知を誤って処理する、まれなケースに備えるためだ。

### 今後

この拡張は RFC 化へ向かっている。共著者の Valery Smyslov がドキュメントの取りまとめを主導し、ダウングレード耐性を生む仕組みも彼が見つけたという。IPsec の設計上の欠陥は少なくとも 10 年は知られていたもので、量子時代に意味が再浮上する潜在的なバグを抱えたプロトコルが他にもあるかもしれない、と記事は述べる。Cloudflare は実装を opt-in で提供しており、顧客にはアカウントマネージャー経由でのテストを、IPsec エコシステム全体には実装の検討を呼びかけている。

## コード例

本記事には実行可能なコード例はない（プロトコル設計の記事）。代わりに、拡張が生成する通知と失敗時の挙動を、記事の記述に基づいて整理する。以下は擬似的な流れで、記事のコードではない。

```text
[通常]  Initiator --IKE_SA_INIT(+FULL_TRANSCRIPT_AUTH)--> Responder
        Initiator <--IKE_SA_INIT(+FULL_TRANSCRIPT_AUTH)-- Responder
        => 両者とも全トランスクリプトに署名・検証して接続成立

[片方の通知だけ Mallory が削除]
        => 一方は新ロジック、他方は旧ロジックで署名対象が食い違う
        => AUTHENTICATION_FAILURE

[両方の通知を削除]
        => 両者とも旧ロジック。ただし Mallory は両者の署名を偽造する必要がある
```

## ユースケース

- **拠点・データセンターの IPsec 接続**: Cloudflare IPsec / Cloudflare WAN で、MPLS の代わりに IPsec トンネルを Cloudflare のネットワークに接続している組織が、PQ 鍵共有と合わせてダウングレード対策を有効にする。
- **Magic Transit の利用者**: DDoS 除去後のトラフィックを IPsec トンネルで受け取る組織が、戻りトンネルのダウングレード攻撃に備える。
- **IPsec 実装ベンダー・運用者**: 自社のイニシエータ / レスポンダにこの拡張を実装し、ドラフトの進行に合わせて相互運用をテストする。
- **プロトコル設計者**: 「ダウングレード耐性のある交渉」の設計例（無条件通知）として参照する。

## 所感・ポイント

- 鍵となる発想は「交渉内容ではなく、会話全体に署名して split view をなくす」こと。TLS 1.3 がすでに取っている設計を IKEv2 に後付けする形になる。
- 「レスポンダも、要求されなくても通知する」という一見小さな違いが、拡張自体のダウングレードを防ぐ。TLS 拡張の慣習とは逆なので、設計の勘所として覚えておくとよい。
- 攻撃にはリアルタイムの量子計算が必要で、差し迫った脅威ではないが、エコシステムの更新に時間がかかるため今から備える、という立場である。
- 両者が対応して初めて効果が出る。Cloudflare 側だけでなく顧客側の IKEv2 実装の対応も必要になる点に注意。
- **サンプル対象外**: 本記事の中心は IPsec プロトコルの設計とネットワーク製品のフィーチャーフラグ（アカウントチーム経由のベータ）であり、Workers 上で再現できる内容ではないため、`examples/` のサンプルは作成していません。
- 画像 3 点のキャプションは、原文に説明がないため本文から推定している。

## 関連リンク

- 原文（en-us）: https://blog.cloudflare.com/ipsec-downgrade-protection/
- IETF ドラフト（IKEv2 Downgrade Prevention）: https://datatracker.ietf.org/doc/draft-ietf-ipsecme-ikev2-downgrade-prevention/
- RFC 7296（IKEv2）: https://datatracker.ietf.org/doc/rfc7296/
- RFC 9242（IKEv2 の中間交換）: https://datatracker.ietf.org/doc/rfc9242/
- RFC 9849（Encrypted Client Hello）: https://datatracker.ietf.org/doc/rfc9849/
- RFC 6797（HSTS）: https://datatracker.ietf.org/doc/html/rfc6797
- 2016 年の論文: https://eprint.iacr.org/2016/072
- Magic Transit: https://developers.cloudflare.com/magic-transit/
- Cloudflare の PQ 対応製品一覧: https://developers.cloudflare.com/ssl/post-quantum-cryptography/pqc-cloudflare-products/
- 移行期限の前倒し: https://blog.cloudflare.com/post-quantum-roadmap/
- IPsec の PQ 鍵共有: https://blog.cloudflare.com/post-quantum-ipsec/
- 暗号の棚卸しツール: http://blog.cloudflare.com/ai-driven-cryptography-discovery
- PQ の可視化機能: http://blog.cloudflare.com/post-quantum-visibility
