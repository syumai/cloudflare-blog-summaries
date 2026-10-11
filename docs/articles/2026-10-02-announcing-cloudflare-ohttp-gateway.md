# Cloudflare OHTTP Gateway の発表: Cloudflare のプライバシー保護インフラを利用しやすく

- 原文: [https://blog.cloudflare.com/announcing-cloudflare-ohttp-gateway/](https://blog.cloudflare.com/announcing-cloudflare-ohttp-gateway/)
- 日本語版の出どころ: Cloudflare公式の日本語版（`https://blog.cloudflare.com/ja-jp/announcing-cloudflare-ohttp-gateway/`）は確認時点で存在しなかった（404）ため、英語版（en-us）から日本語化して要約している。公開日は英語原文の datePublished（2026-10-02）に従う。
- 公開日: 2026-10-02
- 位置づけ: Birthday Week 2026 の記事（Privacy / Protocols / Standards タグ）
- 著者: Lara Schull、Akshat Mahajan
- 関連: [AI でポスト量子移行の進路を描く（AI 駆動の暗号資産の洗い出し）](./2026-09-29-ai-driven-cryptography-discovery.md)（OHTTP が使う HPKE を「Classical encryption」に分類する議論）、[あなたのドメインはポスト量子暗号を使っているか](./2026-09-29-post-quantum-visibility.md)（暗号の利用状況の可視化）、[Merkle Tree Certificates によるポスト量子認証局の構築](./2026-09-29-pq-ca-with-mtcs.md)（同じ Birthday Week の暗号・プライバシー基盤の話題）、[Protected Quick Tunnels](./2026-10-02-protected-quick-tunnels.md)（同じ日に公開された、Cloudflare Access を前段に使う記事）
- GitHub: [docs/articles/2026-10-02-announcing-cloudflare-ohttp-gateway.md](https://github.com/syumai/cloudflare-blog-summaries/blob/main/docs/articles/2026-10-02-announcing-cloudflare-ohttp-gateway.md)

![ヘッダー画像（鍵の載ったサーバー、錠前付き封筒、平文のドキュメント）](https://blog.cloudflare.com/_emdash/api/media/file/01M3WRXEHESBYZBGWPN9T2Z19C.png)
*図: 記事ヘッダーの装飾イラスト（出典: Cloudflare Blog https://blog.cloudflare.com/announcing-cloudflare-ohttp-gateway/ 。原文に alt テキストやキャプションがないため、画像の内容から筆者が説明を補った。仕組みを示す図ではなく装飾である）*

## TL;DR

- Oblivious HTTP（OHTTP、RFC 9458）は、アプリのバックエンドがユーザーの IP アドレスを見ずに HTTP リクエストを受け取れるようにする IETF 標準。**relay**（クライアント識別子を隠して転送）と **gateway**（暗号を処理して通常の HTTP としてアプリに渡す）の2つの独立した主体を経由する。
- Cloudflare は2022年に relay 製品「Privacy Gateway」を出していた。今回、**自己サーブ型の「Cloudflare OHTTP Gateway」をクローズドベータで開始**し、既存の Privacy Gateway は **「Cloudflare OHTTP Relay」に改称**した。
- 新 Gateway は、ゾーンの有料アドオンとして有効化し、`https://your-zone.com/.well-known/ohttp-gateway` で OHTTP を受け付ける。鍵管理は Cloudflare が行い、Cloudflare Access で relay を認証できる。
- すでにアプリを Cloudflare の背後に置いている場合や、サードパーティの relay（Apple の LiveCallerID など）から OHTTP を受ける場合は、Relay ではなく Gateway が適する。
- 提供は「この秋」。waitlist（登録フォーム）で受け付けている段階。

## 背景・課題

記事は冒頭で、オンラインのプライバシーの負担が今はエンドユーザーに寄りすぎていると述べる。ユーザーは VPN を使う、Cookie を無効にする、広告ブロッカーを入れるといった対策を求められる。一方、アプリ開発者の側も、必要以上にユーザーのことを知ってしまう。典型的なクライアントとサーバーのやり取りは、クライアントの IP アドレスや TLS フィンガープリントといったユーザーデータの痕跡を残すからだ。この可視性は、開発者にとっても負担になりうる。

Cloudflare は、開発者がプライバシーをアプリに組み込めるインフラを作ってきた。OHTTP はその1つで、アプリのバックエンドに IP アドレスを見せずに HTTP リクエストを届けるための標準である。

### OHTTP の2つの役割

OHTTP のリクエストは、独立して運用される2つのホップを通る。

- **relay**: 暗号化されたリクエストを盲目的に転送する。アプリサーバーからクライアント識別子を隠す役割。
- **gateway**: 暗号処理（リクエストのデカプセル化、レスポンスのカプセル化）を行い、アプリサーバーが OHTTP リクエストを通常の HTTP として扱えるようにする。

relay と gateway の間の信頼の分離が重要で、これにより「クライアント識別子とリクエスト内容の両方を同時に見る主体」が存在しなくなる。

## 発表内容 / アーキテクチャ

### OHTTP 製品群の拡張

2022年に Cloudflare は relay 製品 Privacy Gateway を発表した。記事は利用例として、Flo Health のアプリの Anonymous Mode と、Apple の Private Cloud Compute（AI 推論リクエストをユーザー ID から切り離すために OHTTP を使う）を挙げている。

ただし、すでにサーバーを Cloudflare の背後に置いている顧客は、Cloudflare が運用する relay を使えない（後述の信頼モデルに反するため）。そうした顧客には gateway が必要だった。

![既存の Cloudflare OHTTP Relay の構成図](https://blog.cloudflare.com/_emdash/api/media/file/01M3WRXFEZBBFT4FFM6BR1MJ6J.png)
*図: エンドユーザー → Cloudflare OHTTP Relay（旧 Privacy Gateway）→ 顧客の OHTTP Gateway とアプリサーバー、という流れ。既存の Relay を使う場合は、顧客が自前の Gateway を用意して信頼の分離を保つ必要がある（出典: Cloudflare Blog https://blog.cloudflare.com/announcing-cloudflare-ohttp-gateway/ 。キャプションは画像の直後の本文（「With the existing Cloudflare OHTTP Relay, customers must bring their own Gateway…」）と画像内のラベルに基づく）*

そこで今回、次の2つが発表された。

- **Cloudflare OHTTP Gateway**（自己サーブ、クローズドベータ）の提供開始。
- **Privacy Gateway の「Cloudflare OHTTP Relay」への改称**。2つの製品を区別しやすくするため。

OHTTP の構成を取りたい顧客の選択肢は次の2つ。

| 選択肢 | 向いているケース |
|---|---|
| Cloudflare OHTTP Relay（旧 Privacy Gateway）+ 自前の gateway | アプリサーバーが Cloudflare の外にあり、自分で OHTTP gateway を運用できる |
| Cloudflare OHTTP Gateway + サードパーティの relay | アプリサーバーがすでに Cloudflare の背後（CDN や Workers）にある、サードパーティ（Apple の LiveCallerID など）から OHTTP を受ける、マネージドな gateway で遅延と運用負荷を減らしたい |

### なぜ Gateway を作ったか

relay を運用してきた経験から、Cloudflare は次の3点を挙げる。

1. **使いやすいプライバシーインフラへの需要**: プライバシー重視のアプリ開発者は、ネットワークのプライバシーを既定で組み込みたいが、まだ簡単ではない。
2. **gateway の構築・運用の難しさ**: プロキシ構成は経路が増えて遅延が出る上、リクエストの復号とレスポンスの暗号化のコストが加わる。自前の OHTTP 構成では遅延の影響が大きくなりうる。Cloudflare は 1.1.1.1 や iCloud Private Relay のような高速で信頼できるプライバシーインフラを動かす部品を持っており、Gateway はアニーキャスト方式でグローバルエッジの全サーバーで動く。relay から gateway までの遅延を最小化でき、CDN を使っていれば、復号と origin への解決を同じ Cloudflare の拠点内で完結できる（gateway から origin への遅延を節約）。
3. **信頼モデルの要件**: OHTTP のプライバシーモデルは、relay とアプリサーバーが互いに共謀しない別の主体によって運用されることを求める（RFC 9458 §6）。従来、Cloudflare の背後にサーバーを置く開発者は Cloudflare の Relay を使えなかった。Cloudflare が「クライアントのメタデータ」と「復号されたリクエスト内容」の両方を見て、モデルを破ってしまうためである。Gateway によって、アーキテクチャに合う方を選べるようになった。

### OHTTP の基本（記事の入門パート）

通常のクライアント・サーバー間のやり取りでは、アプリサーバーはクライアントの IP アドレス（各パケットの送信元 IP）を知る。TLS バージョンや暗号スイートなどからクライアントを「フィンガープリント」することもでき、複数のリクエストを同じユーザーに結び付けられる。

OHTTP は、リクエストとレスポンスを転送する relay というプロキシを挟む。relay は IP アドレスや TLS フィンガープリントを見るが、転送前に取り除く。これにより、アプリサーバーは複数のリクエストを同じユーザーに結び付けられず、リクエスト内容を IP アドレスと紐付けられない。

通常の転送プロキシとの違いは、クライアントとアプリサーバーの間のデータが暗号化されることである。リクエストとレスポンスは Hybrid Public Key Encryption（HPKE、RFC 9180）でカプセル化され、平文を見られるのはクライアントとアプリサーバー側だけで、relay には暗号文の塊しか見えない。relay とアプリサーバーの間に置かれる gateway が暗号処理をすべて担当し、アプリサーバーは通常の HTTP だけを扱う。この結果、relay はクライアント識別子だけを、gateway とアプリサーバーはリクエスト内容だけを見る「二重盲検（double-blind）」のモデルになり、どの主体も両方を同時に見ない。

![OHTTP Gateway 経由のリクエストの流れ](https://blog.cloudflare.com/_emdash/api/media/file/01M3WRXG4Z9RE4A337TVG6WY5T.png)
*図: エンドユーザー → サードパーティの OHTTP Relay → Cloudflare（Cloudflare Access → OHTTP Gateway）→ アプリサーバー。下部に各区間の見え方を示す（ユーザー → relay: source IP は user・content は encrypted、relay → Cloudflare: source IP は relay・content は encrypted、gateway → アプリサーバー: source IP は relay・content は plaintext）。アプリサーバーは Cloudflare の背後に置くかどうかを選べる（出典: Cloudflare Blog https://blog.cloudflare.com/announcing-cloudflare-ohttp-gateway/ 。キャプションは原文のキャプション「A diagram showing how requests flow from end users through the OHTTP Gateway to app servers…」に基づく）*

### Gateway の作りと設計上の配慮

「ゾーンに数クリックで有効化し、`https://your-zone.com/.well-known/ohttp-gateway` に OHTTP を送り始める」ことを目標にした、グローバルネットワーク上の柔軟なサービスである。容量は自動でスケールする。relay を運用する顧客が自前 gateway で困っていた点をもとに、次の4点を設計した。

1. **OHTTP の複雑さの抽象化**: Gateway はゾーンの機能であり、クライアントは `/.well-known/ohttp-gateway` に整形式の OHTTP リクエスト（IANA 登録のメディアタイプ）を送る。標準の OHTTP と、チャンク化 OHTTP（chunked OHTTP、IETF ドラフト）の両方に対応し、リクエストを段階的に処理できるためチャンク化を推奨している。Gateway はリクエストを受けて復号し、アプリサーバーへサブリクエストを発行し、暗号化したレスポンスをクライアントへ返す。OHTTP 以外のリクエストは Gateway を呼ばずにそのままサーバーへ届くので、通常の HTTP も並行して受けられる。また、Gateway をゾーンに結び付けることで悪用も防ぐ。`example.com` 宛てのクライアントは `foo.example.com` や `bar.example.com` には送れるが、`wikipedia.com` には送れない。ゾーンが他のドメインを狙うための踏み台に使われない。
2. **鍵管理の自動化**: gateway は公開 HPKE 鍵構成を維持する必要があるが、安全な管理は難しい。Gateway はすべての鍵を管理し、`/.well-known/ohttp-gateway` への GET で公開鍵を返す。より強いプライバシーのために、クライアントは、gateway へリクエストを送る IP とは別の IP から鍵を取得できる。
3. **relay の認証**: Gateway はクライアントについて意図的にほとんど知らないので、クライアントの認証と責任ある転送を relay に委ねる。どの relay だけが Gateway にトラフィックを送れるようにするか、が課題になる。Gateway は復号の前に Cloudflare Access（ゼロトラストネットワークアクセス製品）を実行し、Access の標準ポリシーで受信トラフィックを認証できる。選択肢は mutual TLS、静的なサービス資格情報、外部の独自ロジックなど。
4. **誤設定の防止**: relay と gateway の両方を Cloudflare 上に置いてしまうミスに備え、「Cloudflare がクライアントの身元と復号済みの内側のリクエストの両方を見ない」ようにする。Gateway は、**Cloudflare Workers、または Cloudflare 上のプロキシされたホストから送られたリクエストの復号を拒否する**。

### Gateway と Relay の選び方

- アプリサーバーを Cloudflare の CDN の背後や Workers 上に置きたいなら、OHTTP のプライバシーモデルを守るために Gateway が適する。
- サードパーティのクライアント・relay からの OHTTP を受けたい（Apple の LiveCallerID SDK を使う場合など）なら、Gateway が適しやすい。

### はじめ方

1. 機能リクエストや提供開始の通知のために、waitlist（`https://www.cloudflare.com/lp/privacy-edge/`）に登録する。
2. OHTTP クライアントを実装する。ohttp.info や Cloudflare のサンプルクライアントライブラリ（`cloudflare/privacy-gateway-client-library`）が参考になる。**OHTTP が提供するのはネットワークレベルのプライバシーで、内側のリクエストボディには手を加えない**。ユーザーを識別できる情報（メールアドレスやユーザー名など）をボディに入れないのは開発者の責任。
3. 自前の relay を用意する（任意のインフラ提供者上で動かせ、サンプルコードあり）。専用の relay 事業者を使う価値は、クライアント識別子を含むログを調べないことを、ユーザーに検証可能な形で約束できる点にある。そうでないと、relay 上のクライアントと、アプリサーバーで復号されたリクエストを突き合わせられてしまう。
4. 本番運用後のテスト・デバッグには、Cloudflare のオープンソースのクライアント `pvcli` が使える。

## コード例

記事にはプログラムコードのスニペットは掲載されていない。代わりに、リクエストの見え方を比較する2つのメタデータ一覧と、エンドポイントの形が示されている。

通常のクライアント・サーバー間のやり取りでアプリサーバーに見える情報（記事の例。コメントも原文のもの）:

```
ipAddress: 192.0.2.33        # the client's IP address
ASN: 7922
tlsCipher: AEAD-CHACHA20-POLY1305-SHA256   # potentially unique
tlsVersion: TLSv1.3
Country: US
Region: California           # the client's location
City: Campbell
```

OHTTP relay を経由した場合にアプリサーバーに見える情報（relay の情報のみ）:

```
ipAddress: 128.62.37.13      # the relay's IP address & fingerprint
ASN: 18
tlsCipher: AEAD-AES-128-GCM-SHA256
tlsVersion: TLSv1.3
Country: US
Region: Texas                # the relay's location
City: Austin
```

Gateway のエンドポイント:

```
https://your-zone.com/.well-known/ohttp-gateway
  POST: OHTTP リクエストを受け付ける
  GET : 公開 HPKE 鍵構成を返す
```

（上の `POST` / `GET` の注記は、本文の「clients send well-formatted OHTTP requests to a /.well-known/ohttp-gateway endpoint」「serve public keys as responses to GET requests to /.well-known/ohttp-gateway」を筆者が整理したもの。）

## ユースケース

- **プライバシー重視のアプリのバックエンドを Cloudflare の背後に置く**: すでに CDN や Workers でアプリを運用している場合に、OHTTP を受けるために gateway を自前で運用せずに済む。
- **サードパーティ SDK からの OHTTP を受ける**: 記事は Apple の LiveCallerID（通話相手の識別を、プライバシーを守って行う仕組み）を例に、サードパーティの client と relay からの OHTTP を受け取る構成を挙げる。
- **AI 推論や健康情報など、リクエストをユーザー ID から切り離したい用途**: 記事が Relay 側の例として挙げる Flo Health の Anonymous Mode や Apple の Private Cloud Compute と同じ発想を、Gateway 側で実現する。
- **遅延と運用負荷の低減**: マネージドな gateway により、復号・暗号化のコストと、gateway から origin への経路の長さを減らす。

## 所感・ポイント

- 製品の違いは「誰が relay / gateway を運用するか」だけだが、**信頼の分離のため、同じ会社が両方を運用してはいけない**という制約から、Relay と Gateway が別製品として必要になったと読める。Gateway が Workers やプロキシ済みホストからの復号を拒否するのも、同じ理由である。
- OHTTP が隠すのはネットワークレベルの識別子（IP・TLS フィンガープリント）だけで、ボディに入れた識別情報は守られない。記事もクライアント実装時の注意として明記している。
- 提供状況は「closed beta」「this fall」「waitlist」と書かれており、一般提供（GA）ではない。料金の詳細は記事にはなく、ゾーンの「有料アドオン」とのみ書かれている。
- 同じ Birthday Week に公開された暗号関連の記事（ポスト量子系）は HPKE を「Classical encryption」として扱っている。OHTTP も HPKE を使うため、ポスト量子移行の対象に含まれうる、という文脈で読むと位置づけが分かりやすい（記事自体は OHTTP の PQ 対応には触れていない）。
- 画像は3点。ヘッダーは装飾イラスト、残り2点が構成図。2点目のキャプションは本文の記述と画像内のラベルから、3点目は原文のキャプションに基づく。ヘッダー画像の説明は画像内容からの筆者の補足。
- **サンプル対象外**: 本記事の中心機能（OHTTP Gateway）は、現時点でクローズドベータ／waitlist で一般利用できない。また Gateway は Workers からのリクエストの復号を拒否する設計で、Workers だけで要点を体験できる最小実装にもならない。そのため `examples/` のサンプルは作成していない。

## 関連リンク

- 原文: https://blog.cloudflare.com/announcing-cloudflare-ohttp-gateway/
- RFC 9458 Oblivious HTTP: https://www.rfc-editor.org/rfc/rfc9458.html
- RFC 9458 §6（プライバシーモデルの要件）: https://www.rfc-editor.org/rfc/rfc9458.html#section-6-8
- RFC 9180 HPKE: https://datatracker.ietf.org/doc/html/rfc9180
- Chunked OHTTP（IETF ドラフト）: https://www.ietf.org/archive/id/draft-ietf-ohai-chunked-ohttp-08.html
- waitlist: https://www.cloudflare.com/lp/privacy-edge/
- Privacy Gateway の発表（2022年）: https://blog.cloudflare.com/building-privacy-into-internet-standards-and-how-to-make-your-app-more-private-today/
- 1.1.1.1 のプライバシー検証（2026年）: https://blog.cloudflare.com/1111-privacy-examination-2026/
- iCloud Private Relay: https://blog.cloudflare.com/icloud-private-relay/
- pvcli（オープンソースのプライバシープロキシ CLI）: https://blog.cloudflare.com/open-sourcing-our-privacy-proxy-cli/
- Cloudflare Access: https://www.cloudflare.com/sase/products/access/
- Access のポリシーセレクター: https://developers.cloudflare.com/cloudflare-one/access-controls/policies/#cloudflare-access-selectors
- Apple LiveCallerID のプライバシー: https://developer.apple.com/documentation/identitylookup/understanding-how-live-caller-id-lookup-preserves-privacy
- Apple Private Cloud Compute のリクエストフロー: https://security.apple.com/documentation/private-cloud-compute/requestflow#Network-transport
- Flo Health Anonymous Mode: https://flo.health/product-tour/anonymous-mode
- OHTTP の情報: http://ohttp.info
- サンプルクライアントライブラリ: https://github.com/cloudflare/privacy-gateway-client-library
- サンプル relay: https://github.com/thibmeu/ohttp-relay
