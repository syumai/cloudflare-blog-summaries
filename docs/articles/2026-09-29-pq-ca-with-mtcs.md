# Merkle Tree Certificates によるポスト量子認証局の構築

- 原文: [https://blog.cloudflare.com/pq-ca-with-mtcs/](https://blog.cloudflare.com/pq-ca-with-mtcs/)（原題: Building a post-quantum certificate authority with Merkle Tree Certificates）
- 日本語版の出どころ: Cloudflare公式の日本語版（`https://blog.cloudflare.com/ja-jp/pq-ca-with-mtcs/`）は確認時点で存在しなかった（404）ため、英語版（en-us）から日本語化して要約している。公開日は英語原文の datePublished（2026-09-29）に従う。
- 公開日: 2026-09-29
- 位置づけ: Birthday Week 2026 の記事
- 関連: 同じポスト量子（PQ）移行の話題として、[IPsec に対する量子ダウングレード攻撃の防止](./2026-09-29-ipsec-downgrade-protection.md)（IPsec 側の PQ 対応とダウングレード対策）と [あなたのドメインはポスト量子暗号を使っているか](./2026-09-29-post-quantum-visibility.md)（TLS の PQ 鍵交換の可視化。本記事は PQ「認証」側で、同記事の末尾でも将来の可視化対象として言及されている）
- GitHub: [docs/articles/2026-09-29-pq-ca-with-mtcs.md](https://github.com/syumai/cloudflare-blog-summaries/blob/main/docs/articles/2026-09-29-pq-ca-with-mtcs.md)

![ヘッダー画像（OGP 画像）](https://blog.cloudflare.com/_emdash/api/media/file/01M3P82XV6Q7JZSJTM9RG8N1YH.01M3P82YSA93VNX0A7361ZGKTX.png)
*図: 記事タイトルと鍵のイラストが入った OGP 用画像（出典: Cloudflare Blog https://blog.cloudflare.com/pq-ca-with-mtcs/。記事本文中ではなくページのメタデータで指定されている画像で、原文にキャプションはないため「ヘッダー画像」と筆者が補った）*

## TL;DR

- Cloudflare は、認証局（CA）を立ち上げる発表に合わせて、この CA が **Merkle Tree Certificates（MTC）** の発行に対応することを明らかにした。Chrome が新たに始めた Quantum-resistant Root Store への 2027 年初頭の収録を目標とし、標準的な MTC の発行は**無料**で提供する。
- PQ 署名は古典的な署名の約 40 倍大きく、証明書にそのまま PQ 署名を入れると TLS ハンドシェイクや Certificate Transparency（CT）ログの負荷が許容できないほど増える。MTC は証明書を追記専用の Merkle ツリーにまとめ、CA がツリーのルートに署名し、クライアントは短い**包含証明**で検証する。
- MTC は「発行したものをログに載せる」のではなく「ログに載せることで発行する」設計で、透明性が後付けではなく前提になる。
- Chrome との実験（Chrome Beta 146 の 50% に配信、数十億枚の MTC を提供）では、landmark 方式の MTC が従来の証明書チェーンより中央値で約 9% 高速だった。PQ 署名ではさらに差が広がると見込んでいる。

## 背景・課題

Web PKI は「いま接続しているのが本物のサイトか」を信頼できるようにする、ポリシー・プロトコル・運用者からなる分散した仕組みである。ここ数十年で大きく変化し、すべての証明書を公開の CT ログに記録することが必須になった。そこに量子コンピュータの到来という課題が加わり、2029 年までに PQ 暗号へ移行することを目指している。

しかし、証明書に PQ 署名をそのまま差し替えると、インターネット規模では性能が許容できないほど落ちる。

- **現在の信頼エコシステム**: ブラウザ（TLS クライアント）はルートプログラムで CA が守るべきポリシーを定め、CA はドメインの所有確認と「ドメイン名と公開鍵の結び付け」の証明を行う。CA が規則を守っているかを確かめるのが CT で、CA は証明書を少なくとも 2 つの公開ログに提出しなければならない。Cloudflare は 2016 年から Nimbus ログを運用しており、今後は新しい静的 CT ログ群 Raio を始める。
- **CT の課題**: 透明性は「後付け」だったため拡張性に問題がある。証明書は複数のログに異なる形式で何度も記録され、監視者は見落としを避けるためにすべてのログをダウンロードして処理しなければならない。これは高コストで、多様なログ運用者を増やしにくい。Cloudflare の見積もりでは、PQ 署名によって CT ログが保存するデータ量は 40 倍に膨らむ。
- **PQ のスケーリング問題**: WebPKI は約 10 億台の TLS サーバーを、各サーバーの公開鍵を全クライアントに事前配布せずに認証する必要がある。従来は証明書チェーンで信頼を配っていたが、失効確認や CT のために鍵と署名が増え、典型的な TLS ハンドシェイクには**署名 5 つと鍵 2 つ**が含まれる。PQ 署名は約 40 倍大きいため、クライアント・CA・ログ・監視者のいずれにも大きな負担になる。
- CT 監視は PQ 移行後にさらに重要になる。PQ 認証へ移行したドメインの所有者は、予期せず発行された従来型の証明書がないか CT ログを監視し、悪意あるダウングレード経路へのフォールバックを防ぐ必要がある。

![現在の CA・CT ログ・監視者・TLS クライアントの関係図](https://blog.cloudflare.com/_emdash/api/media/file/01M3MX1T4PS2NJAV9AH8SENV1T.png)
*図: 現在の信頼エコシステムの構成図。CA が証明書を発行して TLS サーバーへ渡し、CT ログに証明書を提出して SCT を受け取り、監視者が CT ログを見て異常を確認する（出典: Cloudflare Blog https://blog.cloudflare.com/pq-ca-with-mtcs/。原文にキャプションはなく、図中のラベルと直前の本文から筆者が説明を補った）*

## 発表内容 / アーキテクチャ

### MTC の基本アイデア

MTC は IETF の PLANTS ワーキンググループのドラフト仕様で、コンパクトで効率的な PQ 証明書のアーキテクチャを定める。

- 証明書を**追記専用（append-only）の Merkle ツリー**にまとめ、CA は個々の証明書ではなく**ツリーのルートに署名**する。
- クライアントは、署名済みのツリーヘッド（tree head）に対して、ハッシュの並びである**包含証明（inclusion proof）**で証明書を検証する。証明書ごとに署名を検証する必要がない。
- 鍵となる考え方は "don't log what you issue, issue by logging"。発行とログ記録を一体にすることで、透明性が運用の必須条件になる。

### 再設計された PKI における CA の役割

Cloudflare は、MTC の発行機能を Cloudflare CA の構築の一部として作っている。PQ ルートプログラムの新しい要件を追いつつ、発行とミラーリングのソフトウェアスタックを、従来型 CA の設備・運用・コンプライアンス機能と並行して整備するという大きな作業である。新しい PQ PKI の要件とアーキテクチャを最初から優先できる点を利点としている。

CA の責務（ドメインの管理権限の確認、公開鍵との結び付け、証明書の発行）は従来とほぼ同じだが、次の点が変わる。

- CA は証明書に直接署名してからログへ載せるのではなく、Merkle ツリーに裏付けられた**透明性ログ**を自ら保持する。証明書がツリーに含まれることを示す包含証明が**信頼の起点（トラストアンカー）**になる。
- CA と並んで**ミラーリング・コサイナー（Mirroring cosigner）**が動く。発行ログの写しを保存し、追記のみであることの整合性を検証し、エコシステム全体に対してログの透明性と可用性を担保する。

![MTC エコシステムの構成図](https://blog.cloudflare.com/_emdash/api/media/file/01M3MX1H8EDNF1CP2D784KW8FR.png)
*図: MTC 版の構成図。CA が自身のツリーを保持し、ミラーへ提出して cosignature を受け取る。TLS サーバーには鍵と「offpath」の包含証明付き証明書を渡し、監視者はミラーのログを見て異常を確認する。凡例は Hashed SPKI / CA signature / CoSig / Incl. proof（出典: Cloudflare Blog https://blog.cloudflare.com/pq-ca-with-mtcs/。原文にキャプションはなく、図中のラベルと本文から筆者が説明を補った）*

### MTC の 2 つの形式

どちらも現在のクライアントが認識できる X.509 証明書の形式で符号化でき、「風変わりな」署名アルゴリズムを使うだけの違いである。

| 形式 | 署名値に入るもの | 特徴 |
|---|---|---|
| **standalone（単独）** | 発行ログの cosigned tree head と、証明書がログに含まれることを示す包含証明 | 単独で完結するが、大きな PQ 署名が TLS ハンドシェイクで送られる |
| **landmark-relative** | 軽量な包含証明のみ（重い PQ 署名なし） | クライアントが cosigned tree head を帯域外（例: ブラウザの更新機構）で入手できる場合に使える |

### standalone 証明書の発行フロー

1. **ドメイン確認**: サイトが ACME（Automatic Certificate Management Environment）で CA に証明書を要求する。CA の ACME サーバーがドメインの管理権限を確認する。Cloudflare の ACME 基盤は、Let's Encrypt が使う ACME ソフトウェア **Boulder** のフォークになる。Let's Encrypt が Boulder の MTC 対応を開発しており、その変更を取り込みつつ Cloudflare 固有の改修を加え、可能なものは upstream に還元する方針。
2. **ログへの追記**: 確認が通れば、CA がデータをシリアライズして追記専用ログに追加する。

   ![CA が追記専用ログにエントリを追加する図](https://blog.cloudflare.com/_emdash/api/media/file/01M3MX1PSVH1CJ1PY7H7PKPQX4.png)
   *図: 「MTC CA」が「Append-only log of certificates」に "Adds entry" する様子（出典: Cloudflare Blog https://blog.cloudflare.com/pq-ca-with-mtcs/。キャプションは図中のラベルから筆者が書き起こした）*
3. **チェックポイントの署名**: CA は更新後のログ状態を計算し、その状態に対するチェックポイントに署名する。これは、その時点までのツリーの全エントリを CA が発行したことの証明になる。
4. **コサイナーの検証**: CA は更新後のログ状態と新しいチェックポイントを信頼できるコサイナーに送る。コサイナーは発行ログの写しを永続的に保存し、新しい状態が追記のみで、前のツリーと整合し、正しい形式であることを確認する。この cosignature により、CA がエコシステムの別々の場所に異なる発行の見え方を示していない（スプリットビューがない）という確信が得られ、CA の発行ログが利用できなくなっても発行済み証明書を監視できる。

   ![CA とミラーリング・コサイナーがログ状態に署名する図](https://blog.cloudflare.com/_emdash/api/media/file/01M3MX1R818H67HP9AJS1QNAND.png)
   *図: ① MTC CA が現在のログ状態に署名、② Mirroring Cosigner がログが整合・正しい形式・追記のみであることを確認、③ コサイナーが現在のログ状態に署名。中央に Merkle ツリーが描かれている（出典: Cloudflare Blog https://blog.cloudflare.com/pq-ca-with-mtcs/。図中のラベルをそのまま日本語にした）*
5. **MTC の構築**: コサイナーから cosignature を受け取った後、CA は cosignature、サーバーの公開鍵、包含証明を含む MTC を組み立てて、サーバーに送る。サーバーはこれを以降の TLS に使う。

   ![CA が MTC を TLS サーバーへ渡す図](https://blog.cloudflare.com/_emdash/api/media/file/01M3MX1JGCC0G09MSD9VCKBWV9.png)
   *図: MTC CA から、包含証明・ハッシュ化した SPKI・CoSig・CA 署名を束ねた MTC を経て TLS サーバーへ渡る流れ（出典: Cloudflare Blog https://blog.cloudflare.com/pq-ca-with-mtcs/。キャプションは図の内容から筆者が書き起こした）*

**コサイナーの要件**: Chrome の Quantum-resistant Root Program のドラフトポリシーは、少なくとも 2 つの cosignature を求める。1 つは別組織が運用する Chrome 認定のミラーリング・コサイナー、もう 1 つは発行する MTC CA 自身。そのため Cloudflare は他のパイロット CA 向けのミラーも運用し、自社発行の証明書には少なくとも 1 つの独立した cosignature を要求する。Cloudflare は自社のミラーリング・コサイナーを、オープンソースの Rust 製透明性ログ **Azul** で実装し、相互運用性のため c2sp の **tlog mirror プロトコル**に対応する。

### landmark 最適化: PQ 署名を効率よく届ける

standalone でも機能はするが、TLS ハンドシェイクで大きな PQ 署名を送るため効率が限られる。MTC の性能上の本命は **landmark-relative 証明書**である。

- CA は、ログ内のすべての有効な証明書を覆うサブツリーの並びを **landmark** として指定し、認証用データとともに帯域外の更新サービスでクライアントへ配布する。
- TLS ハンドシェイクでは、ブラウザがサーバーの証明書データ（ドメイン名と公開鍵を含む）が CA のログの信頼できるサブツリーに含まれることを確認する。包含証明が cosigned な landmark につながり、公開鍵の所有がハンドシェイクで証明されれば、クライアントは正しいサーバーと通信していると判断できる。
- 少数の MTC バッチ署名を定期的にクライアントへ送るだけで、ある CA が発行する数十億枚の証明書を効率よく覆える。
- ただし、新規インストールやオフライン、landmark の更新が未適用のクライアントがありうるため、landmark は standalone を不要にしない。**サーバーは standalone 証明書をフォールバックとして保持しておく必要がある**。

![landmark を使う MTC の構成図](https://blog.cloudflare.com/_emdash/api/media/file/01M3MX1M0Z4J12THF1PT2M52CZ.png)
*図: MTC の構成図に landmark（ピン型のアイコン）が加わったもの。監視者 / 更新チャネルからクライアントへ landmark を送り、クライアントは「I know（既知の landmark）」をサーバーに伝えて、サーバーが対応する包含証明付き証明書を返す（出典: Cloudflare Blog https://blog.cloudflare.com/pq-ca-with-mtcs/。原文にキャプションはなく、図中のラベルと本文から筆者が説明を補った）*

### Chrome との実験結果

Cloudflare は今年、クライアントとサーバー間での MTC の実現可能性を Chrome と実験した。

- 発行パイプラインを模した「bootstrap CA」（偽の CA）を運用し、従来の証明書チェーンで裏付けた MTC を、Cloudflare の free プランの一部ドメインについて Chrome Beta 146 の **50%** に配信した。実験全体で**数十億枚**の MTC を提供した。
- TLS 側: landmark-relative 証明書では、ハンドシェイクで送るのは**公開鍵 1 つ、署名 1 つ、1kB 未満の包含証明 1 つ**で済む。クライアントと landmark-relative 証明書を交渉できなかった場合は、standalone ではなく従来の証明書チェーンにフォールバックした。
- CT 側: ログが持つのは公開鍵のハッシュのみで、エントリごとの署名はなく、ツリーヘッドの署名がログ全体を覆う。CA の発行ログがその CA が発行するすべての証明書の「唯一の正」になるため**証明書の爆発**を防げ、ログの利用者は各証明書のコピーを 1 つ取得すれば足りる。
- 性能: 中央値で、従来の署名チェーンに対して landmark MTC は**約 9% 高速**。ただし記事自身が、この利点の大半は中間証明書の省略（intermediate elision）によると認めている。実験では古典的な署名を使ったので、PQ 署名ではさらに大きな差が出ると見込む。実験は 2026 年 8 月に終了に向けて縮小した。

![ハンドシェイク時間の累積分布（CDF）](https://blog.cloudflare.com/_emdash/api/media/file/01M3MX1NGZQ01K3ZP2SSRNVK9A.png)
*図: QUIC/TLS ハンドシェイク時間の累積分布（CDF）。Control（n=44,396）と MTC（n=40,601）を比較し、P50 は約 9% 高速（105ms 対 116ms）、P90 は約 8% 高速（348ms 対 380ms）、"Expect an even wider performance gap with PQ!" と注記（出典: Cloudflare Blog https://blog.cloudflare.com/pq-ca-with-mtcs/。数値は図の内容を読み取ったもの。キャプションは筆者が書き起こした）*

### 今後の課題とスケジュール

- **2027 年初頭**: Chrome の Quantum-resistant Root Store への収録を目標とする。そのためには申請と厳格な審査が必要で、Cloudflare は他の CA と同じ高い水準で評価されることを歓迎している。
- 実環境で答えを出すべき問い: 独立した監視者が本番規模で MTC の発行ログを取り込み検証できるか。耐障害性のために複数の CA とコサイナーが現れるか。landmark による高速化と、最新の landmark を持たないクライアント向けのフォールバック経路を、ブラウザはどう両立するか。
- MTC は PQ 認証の有力な設計として浮上しているが、本番規模での実証には、ルートプログラム、ブラウザベンダー、CA、ミラー、監視者、コミュニティの幅広い参加が必要とされる。
- 他の CA が MTC に対応し、MTC を展開したいブラウザと協力したいとしている。

## コード例

本記事にはコード例（コードブロックや設定ファイルの例）はない。代わりに、MTC の仕組みは上記の図と発行フローで説明されている。要点を疑似的に整理すると次のとおり（記事中のコードではなく、フローの筆者による要約）。

```
ACME 要求 -> ドメイン確認 -> 追記専用ログにエントリ追加
  -> CA がチェックポイントに署名 -> コサイナーが整合性検証＋cosignature
  -> CA が MTC（cosignature + 公開鍵 + 包含証明）を構築 -> サーバーへ
```

## ユースケース

- **PQ 認証への移行**: サーバー運用者が、従来の証明書と MTC の両方を発行できる CA を使い、利用可能な最も安全な認証方式へ自然に移行する。標準的な MTC の発行は無料とされている。
- **TLS ハンドシェイクの軽量化**: landmark-relative 証明書を使い、PQ 署名を送らずに 1kB 未満の包含証明だけで認証する。
- **CT 監視とダウングレード対策**: PQ 認証へ移行したドメインの所有者が、ログを監視して予期しない従来型証明書の発行を検知する。
- **ミラー・監視者の運用**: 他のパイロット CA のミラーを運用する、独立した監視者が単一の発行ログを取り込んで検証する。

## 所感・ポイント

- 本記事は「PQ 署名は大きい」という問題を、署名を小さくするのではなく**署名の数を減らす（ツリーのルートだけに署名する）**ことで解く設計の解説として読むと分かりやすい。TLS の鍵交換（暗号化）側の PQ 化は[ポスト量子暗号の可視化の記事](./2026-09-29-post-quantum-visibility.md)で扱われており、本記事はもう一方の柱である PQ 認証（証明書）にあたる。
- 発行とログを一体にすることで、CT が後付けの仕組みでなくなる点が設計上の核心。ただし、ミラーの独立性（別組織の cosignature が必須）に信頼が依存するため、複数の CA とコサイナーが現れるかどうかが重要な課題として挙げられている。
- 実験の「約 9% 高速」は、記事自身も述べているとおり中間証明書の省略による部分が大きく、PQ 署名を使った場合の数字ではない。数値の読み方に注意が必要。
- 目標は 2027 年初頭の Chrome Quantum-resistant Root Store への収録であり、現時点では Cloudflare の MTC CA は審査前の計画段階。同日の [IPsec の記事](./2026-09-29-ipsec-downgrade-protection.md)と合わせて、PQ 移行が複数の層で同時に進んでいることが分かる。
- **サンプル対象外**: 本記事の中心は、認証局の構築と MTC の仕様・実験結果の解説であり、Workers 上で動かせる一般利用可能な機能ではなく、100 行程度で再現できる最小実装もない（Azul や Boulder のフォークも記事時点では発行基盤の設計段階）ため、デプロイ可能な `examples/` は作成していません。
- 画像のキャプションは原文にないため、画像の内容と前後の本文から筆者が補った（各図の注記を参照）。

## 関連リンク

- Merkle Tree Certificates（IETF ドラフト）: https://datatracker.ietf.org/doc/draft-ietf-plants-merkle-tree-certs/
- IETF PLANTS ワーキンググループ: https://datatracker.ietf.org/group/plants/about/
- Chrome Root Program: https://googlechrome.github.io/chromerootprogram/index.html
- Chrome Quantum-resistant Root Program のドラフトポリシー: https://googlechrome.github.io/chromerootprogram/cqrp/draft-policy/
- Azul（Cloudflare の CT ログ実装）: https://github.com/cloudflare/azul
- Azul の解説記事: https://blog.cloudflare.com/azul-certificate-transparency-log/
- c2sp tlog mirror プロトコル: http://c2sp.org/tlog-mirror
- Bootstrap MTC の記事: https://blog.cloudflare.com/bootstrap-mtc/
- Certificate Transparency Monitoring（一般提供）: https://blog.cloudflare.com/certificate-transparency-monitoring-ga/
- Radar の Certificate Transparency ページ: https://radar.cloudflare.com/certificate-transparency
- ポスト量子暗号は無料であるべき: https://blog.cloudflare.com/post-quantum-crypto-should-be-free/
- ポスト量子ロードマップ: https://blog.cloudflare.com/post-quantum-roadmap/
- 本リポジトリ内の関連記事: [IPsec に対する量子ダウングレード攻撃の防止](./2026-09-29-ipsec-downgrade-protection.md)、[あなたのドメインはポスト量子暗号を使っているか](./2026-09-29-post-quantum-visibility.md)
