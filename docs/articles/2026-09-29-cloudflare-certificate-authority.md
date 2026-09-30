# Cloudflare が「インターネット全体のための認証局」を作る

- 原文: [https://blog.cloudflare.com/cloudflare-certificate-authority/](https://blog.cloudflare.com/cloudflare-certificate-authority/)（原題: Building a certificate authority for the whole Internet）
- 日本語版の出どころ: Cloudflare公式の日本語版（`https://blog.cloudflare.com/ja-jp/cloudflare-certificate-authority/`）は確認時点で存在しなかった（404）ため、英語版（en-us）から日本語化して要約している。公開日は英語原文の datePublished（2026-09-29）に従う。
- 公開日: 2026-09-29
- 位置づけ: Birthday Week 2026 の記事（Cloudflare が公開認証局になる意向表明）
- 関連: [Merkle Tree Certificates によるポスト量子認証局の構築](./2026-09-29-pq-ca-with-mtcs.md)（本記事の「ポスト量子」章から参照されている技術詳細の記事。MTC の仕組みと Chrome との実験はそちら）、[あなたのドメインはポスト量子暗号を使っているか](./2026-09-29-post-quantum-visibility.md)（同日の TLS の PQ 鍵交換の可視化。同記事でも本 CA の発表に言及している）
- GitHub: [docs/articles/2026-09-29-cloudflare-certificate-authority.md](https://github.com/syumai/cloudflare-blog-summaries/blob/main/docs/articles/2026-09-29-cloudflare-certificate-authority.md)

## TL;DR

- Cloudflare は、2014 年の Universal SSL 以来「公開証明書の巨大な利用者」であり続けたが、初めて自ら公開認証局（CA）になる意向を発表した。
- 最初の節目として、Chrome・Apple・Microsoft・Mozilla のルートプログラムに収録申請を行い、GlobalSign の確立されたルートを取得する最終合意に署名した。古い端末への到達性（既存ルート）と将来のポリシーへの適合（新ルート）の両方を狙う。
- 方針は ACME ファースト（ディレクトリ URL の変更だけで移行可能）、ACME Renewal Information（ARI、RFC 9773）の対応を発行の条件にすること、発行基盤の透明性（再現可能ビルド・HSM の証明・公開ダッシュボード）である。
- 2027 年第 1 四半期に、本番の Merkle Tree Certificates（MTC）を初めて発行する計画で、従来型証明書と MTC を 1 つの CA でまとめて扱う。現時点では証明書は発行しておらず、発行開始までには時間がかかる。

## 背景・課題

記事は 2014 年の Birthday Week の Universal SSL から始まる。あのとき、Cloudflare の背後にあるすべてのサイトに無料の TLS を提供し、暗号化は「高価で手間のかかるもの」から「既定」に変わった。それから 12 年が経ち、Cloudflare は公開証明書の最大級の利用者の 1 つでありながら、自分で 1 枚も発行したことがなかった。

記事が挙げる課題は次のとおり。

- **新規ルートだけでは数年間役に立たない**: ルートプログラムに受け入れられても、OS・ブラウザ・デバイスに配布されるまで時間がかかり、更新の止まった古い端末には永久に届かない。世界のトラフィックの多くはそうした古いクライアントから来る。
- **無料・自動化された発行の集中**: 無料で自動化された証明書モデルは暗号化された Web の大部分を担うが、その多くを 1 つの運用者（Let's Encrypt）が担っている。Let's Encrypt は 1 日あたり約 1,000 万枚の証明書を発行し、5 億を超えるサイトにサービスを提供し、2025 年にアクティブな証明書が 40 億枚を超えたとされる。記事はこれを「この 20 年のインターネットで最良の出来事の 1 つ」と評価しつつ、最大手が不調になった週には Web の大半が代替手段を持たないという、システミックなリスクを指摘する。
- **証明書の需要は急増する**: 証明書の最大有効期間の短縮（CA/Browser Forum の ballot SC-081v3）、エージェントによる活動の増加、PQ 証明書の主流化により、Cloudflare が 1 年に必要とする証明書の数は急速に増えると見ており、証明書の供給元を増やす必要があるという主張である。

## 発表内容 / アーキテクチャ

### 信頼への 2 つの道

- すでに受け入れられている **GlobalSign のルート**は 2012 年から各種ブラウザ・OS・デバイスで信頼されており、古いクライアントにも届く。Cloudflare はこのルートを取得する最終合意に署名した。
- **新しいルート**は、ルートの「年齢」に上限を設けるなど、これから強まるルートプログラムのポリシーに合わせて設計し、収録申請を行う。
- 記事は「既存ルートは過去のデバイスへの到達性を、新ルートは将来のポリシーの下での立場を与える」と整理している。

### 無料証明書の新しい供給元（ACME ファースト）

- 証明書の発行と更新は ACME（Automated Certificate Management Environment）で行うことが前提で、既存の無料 CA を使っている利用者は「ディレクトリ URL を変えるだけ」で移行でき、新しいツールも再設計も不要と説明されている。
- Cloudflare の Universal SSL の証明書にはすでにバックアップ証明書（別の鍵で包み、別の認証局から発行）が付属しており、公開 CA はその考え方を「インターネット全体の規模」に広げるものと位置づけられている。

![公開 TLS 証明書の発行は集中している（棒グラフ）](https://blog.cloudflare.com/_emdash/api/media/file/01M3NDPRKC82G6V4NTDZEF5NPP.png)
*図: 未失効のプレ証明書を CCADB の所有者別に集計した発行シェア（出典: Cloudflare Blog https://blog.cloudflare.com/cloudflare-certificate-authority/。図中の出典表記は crt.sh / CCADB、2026 年 6 月。最大の発行者 Let's Encrypt (ISRG) が 39.2%、上位 3 社で 68.8%、上位 5 社で 89.4%。内訳は Google Trust Services 18.5%、Sectigo 11.1%、GoDaddy 11.0%、Amazon Trust Services 9.6%、Microsoft 4.6%、DigiCert 3.9%、その他の現役 CA 2.1%。図が本文のどこに挿入されているかは HTML から見た位置で、原文に文章のキャプションはない）*

### 回復力のための設計（透明性と「小さく失敗する」）

- Cloudflare の他の製品と同様に、問題の影響を限定する「fail small」を目標とし、障害が起きる前に回復を設計・テストする。
- **更新の自動化を発行の条件にする**: RFC 9773 の ACME Renewal Information（ARI）に対応するクライアントにのみ発行する。加入者は、CA が公開する更新エンドポイントをポーリングし、公開された更新ウィンドウに従い、置き換える対象の証明書を識別する自動化を維持しなければならない。
- 失効が必要になったとき（コンプライアンス上の問題やセキュリティインシデント）、影響を受ける証明書の更新ウィンドウを前倒しして置き換えを分散させ、置き換えの発行状況を追跡できる。これにより、失効の期限とサイトの稼働維持との間で CA が板挟みになる状況を避けたい考えである。
- **透明性**: 発行基盤と運用を公開し、証明書に署名するソフトウェアの再現可能ビルドを公開し、鍵を保持する HSM（ハードウェアセキュリティモジュール）を証明（attest）し、発行の健全性とインシデントの公開ダッシュボードを運営する。監査は時点ごとの確認にすぎず、「平凡な火曜日にどう動いているか」は分からないため、監査と監査の間の運用を外部が見られるようにするという考え方である。

![CA が更新ウィンドウを公開し、ACME クライアントが継続的にポーリングしてフリート全体が無停止で更新される図](https://blog.cloudflare.com/_emdash/api/media/file/01M3NDPPYQ33SWKYEFT2W6D6RM.png)
*図: 更新ウィンドウの公開と ACME クライアントのポーリング（出典: Cloudflare Blog https://blog.cloudflare.com/cloudflare-certificate-authority/。図中の文言は「Certificate authority: publishes a renewal window」→ 3 つの「ACME client: polls continuously」→「Fleet-wide rotation on demand: move the window once, the whole fleet follows, with no downtime」。原文にキャプションはなく、挿入位置は「回復力」章の内容に基づく筆者の推定）*

### ポスト量子インターネットのための CA

- 本番の **Merkle Tree Certificates（MTC）** を発行する最初の CA の 1 つになり、最初の証明書は **2027 年第 1 四半期**に発行する計画。
- MTC は、従来の証明書チェーンが PQ 時代に大きくなって TLS ハンドシェイクを圧迫する問題に対する、はるかにコンパクトな公開証明書の届け方。Cloudflare は IETF で標準ベースの MTC 提案を推進しており、今年 Chrome が MTC をポスト量子認証の推奨パスとして示した。詳細は [Merkle Tree Certificates によるポスト量子認証局の構築](./2026-09-29-pq-ca-with-mtcs.md)にまとまっている。
- 移行は突然ではなく、古典的な証明書と既存の WebPKI が長く使われ続ける。そのため**古典証明書と MTC を 1 つの CA・1 つのライフサイクル・1 組の保証で扱い**、利用者が自分のペースで採用でき、ハードなカットオーバーを避けられるようにする。

### Customer Zero

Cloudflare は Universal SSL の証明書パックの提供に加え、自社システム・社内運用のために多数の CA から証明書を調達している。新 CA とその証明書（WebPKI と MTC の両方）の最初の利用者（Customer Zero）となり、新しいシステムとプロセスが社内基準を満たすか、CA の基盤が Cloudflare の規模で検証されるかを確認する。

### 今後

- 各ルートプログラムの申請・承認プロセスを進めており、それらは公開の場で進むため、随時更新を共有する。最初の MTC は 2027 年初頭。
- 更新の通知への登録フォーム（cloudflare.com/resource/certificate-authority）があり、採用も行っている。
- 長年頼ってきたパートナーの公開 CA（記事によれば 16 社）とも引き続き協力する。

## コード例

本記事は CA 事業への参入と設計方針を述べる**意向表明の記事で、コード例は含まれない**。そのため、代わりに上記の「発表内容」で方針と対応する技術要素（ACME、ARI、MTC）を整理している。ACME クライアント側の変更は「ディレクトリ URL の変更」のみと説明されているが、具体的な URL や設定例は記事にない（現時点では証明書を発行していない）。

## ユースケース

- **既存の無料 CA からの乗り換え・併用**: ACME クライアントのディレクトリ URL を変えるだけで、2 社目の供給元を確保できる。
- **CA 障害・失効への備え**: 単一の発行元に依存せず、複数の CA から証明書を取得する冗長化の選択肢が増える。ARI 対応により、失効時の一斉更新を分散して実行できる。
- **古い端末を含む幅広い到達性**: GlobalSign の既存ルートにより、新規ルートでは届かない更新の止まったデバイスにも証明書が信頼される。
- **ポスト量子への段階移行**: 古典証明書から MTC へ、同じ CA・同じライフサイクルのまま移る。
- **CA の運用状況の外部確認**: 再現可能ビルド・HSM の証明・公開ダッシュボードにより、研究者やルートプログラム、サイト運営者が監査と監査の間の運用を観察できる。

## 所感・ポイント

- 証明書を**まだ発行していない**段階の意向表明であり、ルートプログラムの承認、GlobalSign ルートの取得完了、価格・提供条件（無料の範囲など）は今後の話である。「無料の証明書」という表現は記事の題として使われているが、提供条件の詳細は記事にない。
- 「更新自動化を発行の条件にする（ARI 必須）」は導入側に自動化の要件を課す方針で、導入側は ACME クライアントが ARI に対応しているかを確認する必要がある。
- 発行の集中（上位 5 社で 89.4%）を示すグラフは、あくまで記事中の出典（crt.sh / CCADB、2026 年 6 月）に基づく数値である。
- PQ 関連の技術詳細は [MTC の記事](./2026-09-29-pq-ca-with-mtcs.md)に任せ、本記事は「なぜ CA になるのか」「どう信頼され、どう運用するのか」を扱う役割分担になっている。
- **サンプル対象外**: 本記事の中心は CA 事業の方針表明であり、Workers 上で動かせる一般利用可能な機能ではなく、CA はまだ証明書を発行していないため、デプロイ可能な `examples/` は作成していません。
- 画像は 3 枚（ヘッダーの装飾イラストと、上の 2 つの図）。ヘッダーのイラストは図ではなく装飾のため、Wiki・スライドでは図として扱っていない。

## 関連リンク

- 原文（en-us）: https://blog.cloudflare.com/cloudflare-certificate-authority/
- Universal SSL の発表（2014 年）: https://blog.cloudflare.com/introducing-universal-ssl/
- Chrome の Quantum-resistant Root Program: https://blog.google/security/cultivating-a-robust-and-efficient-quantum-safe-https/
- ACME（GlobalSign の解説）: https://www.globalsign.com/en/acme-automated-certificate-management
- CA/Browser Forum ballot SC-081v3（最大有効期間の短縮）: https://cabforum.org/2025/04/11/ballot-sc081v3-introduce-schedule-of-reducing-validity-and-data-reuse-periods/#ballot-contents
- RFC 9773（ACME Renewal Information）: https://www.rfc-editor.org/info/rfc9773/
- IETF の MTC ドラフト: https://datatracker.ietf.org/doc/draft-ietf-plants-merkle-tree-certs/
- Customer Zero: https://www.cloudflare.com/the-net/top-of-mind-security/customer-zero/
- 更新情報への登録: http://cloudflare.com/resource/certificate-authority
- 本リポジトリ内の関連記事: [Merkle Tree Certificates によるポスト量子認証局の構築](./2026-09-29-pq-ca-with-mtcs.md)、[あなたのドメインはポスト量子暗号を使っているか](./2026-09-29-post-quantum-visibility.md)
