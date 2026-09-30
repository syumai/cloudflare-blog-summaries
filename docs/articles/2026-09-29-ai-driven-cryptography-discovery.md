# AI でポスト量子移行の進路を描く: 社内ツール CryptoLabe による暗号利用の発見

- 原文: [https://blog.cloudflare.com/ai-driven-cryptography-discovery/](https://blog.cloudflare.com/ai-driven-cryptography-discovery/)（原題: Using AI to chart a course for our post-quantum migration）
- 日本語版の出どころ: Cloudflare公式の日本語版（`https://blog.cloudflare.com/ja-jp/ai-driven-cryptography-discovery/`）は確認時点で存在しなかった（404）ため、英語版（en-us）から日本語化して要約している。公開日は英語原文の datePublished（2026-09-29）に従う。
- 公開日: 2026-09-29
- 位置づけ: Birthday Week 2026 の記事
- 著者: Sharon Goldberg、Tiago Silva
- 関連: 同じポスト量子（PQ）移行の話題として、[IPsec に対する量子ダウングレード攻撃の防止](./2026-09-29-ipsec-downgrade-protection.md)（IPsec 側の PQ 対応）、[あなたのドメインはポスト量子暗号を使っているか](./2026-09-29-post-quantum-visibility.md)（TLS の PQ 鍵交換の可視化。本記事でも「新しい PQ 可視化機能」として紹介されている）、[Merkle Tree Certificates によるポスト量子認証局の構築](./2026-09-29-pq-ca-with-mtcs.md)（PQ 認証の側。本記事では「PQ 認証の導入はまだ初期」と位置づけられ、同記事にリンクしている）、[Cloudflare が「インターネット全体のための認証局」を作る](./2026-09-29-cloudflare-certificate-authority.md)（CA 参入の発表）
- GitHub: [docs/articles/2026-09-29-ai-driven-cryptography-discovery.md](https://github.com/syumai/cloudflare-blog-summaries/blob/main/docs/articles/2026-09-29-ai-driven-cryptography-discovery.md)

![ヘッダー画像](https://blog.cloudflare.com/_emdash/api/media/file/01M3NF5CE1NWTNNCSR9EKXSF87.01M3NF5CZVBP4EQSN6G4FQQC3S.png)
*図: 記事ヘッダー画像。アストロラーベ（天体観測の航海用計器）に虫眼鏡を重ねた装飾イラスト（出典: Cloudflare Blog https://blog.cloudflare.com/ai-driven-cryptography-discovery/。原文にキャプションはなく、「ヘッダー画像」という呼称は掲載位置からの筆者の推定。装飾のため、図としては扱わない）*

## TL;DR

- Cloudflare は **2029 年**の完全なポスト量子（PQ）対応を目標に、PQ 暗号化（鍵交換）だけでなく PQ 認証（署名）も含めて「PQ everything」の方針で移行を進めている。そのために、社内のコードベースから暗号の利用を洗い出す AI ツール **CryptoLabe** を開発した。
- CryptoLabe は 2 段階でスキャンする。まず「発見」で生の観測結果を集め、次に「深い分析」で観測ごとにコード・設定・他リポジトリを調べ直し、**5 つの分類**（古典暗号化／古典署名／古典トークン／PQ 対応のハイブリッド鍵交換／PQ 対応）のいずれかを付ける。根拠が足りないときは推測せず、More evidence needed / External dependency / Unknown にする。
- 実装は Cloudflare の開発者プラットフォーム上にあり、**2 つの Workers**（スキャナとインベントリ）、リポジトリごとの Durable Object（Agents SDK）、**Workflows**、**R2**、**Sandbox**、**D1**、**AI Gateway** 経由の **Workers AI** のオープンウェイトモデルで構成される。
- 単独のチームでは解決できない「前提条件（prerequisites）」や、PQ 標準・対応が乏しい「難しいケース（hard cases）」を早期に洗い出すのも目的。リポジトリ別のスキャンと、全リポジトリに対する専用プロンプトのスキャンでは見つかるものが違い、**すべての発見結果は担当エンジニアの確認が必要**としている。
- CryptoLabe 自体は社内固有なので顧客には提供しないが、選んだプロンプトは `cloudflare/crypto-discovery-prompts` として GitHub で公開。一般の組織には「全リポジトリの網羅的な棚卸しから始めるのは資源の無駄。まず重要なシステムを 1 つ選び、優先順位をつけて進める」ことを勧めている。

## 背景・課題

量子コンピュータの実用化に向けた競争が進む中、Cloudflare は 2029 年を完全な PQ 対応の目標にしている。すでに多くの製品は TLS 1.3 で PQ 暗号化に対応済みだが、PQ 認証（署名）の対応はまだこれからである。インフラ事業者として「Cloudflare を使えば量子攻撃者に対しても通信が将来にわたり安全」という安心を顧客に与えたいため、記事は自社の方針を maximalist（「PQ everything!」）と表現している。

移行を進めるための目標は 3 つある。

1. **製品・エンジニアリングチームが、暗号がどう使われているか、どう更新すべきかを理解できるようにする**。PQ 暗号化と PQ 認証の両方が対象で、TLS 接続の「ロングテール」や、TLS 以外の公開鍵暗号の利用も含む。
2. **移行の進捗指標を出す**。リポジトリ別・製品別に、古典暗号と PQ 暗号の利用数を数える。
3. **前提条件を早期に表面化する**。PQ の移行計画がまだないプロトコル（PQ 版が未検討、標準が未成立または合意がない、ライブラリなど周辺の対応がない）に製品が依存しているなら、2029 年に間に合わせるために、関係者や標準化団体・エコシステムと早く動く必要がある。

### 問題の規模

Cloudflare の製品のソフトウェアは 1 つの集中型ソース管理プラットフォームに置かれているため、コードを調べれば大半の暗号利用が見つかる。それでも規模に由来する難しさが 3 つある。

- コードが**多数のリポジトリ**に分かれている。
- 暗号は素直に姿を現さない。隠れ場所として、リポジトリが import するが実際に呼ぶとは限らない**共有ライブラリ**、TLS 1.3 リスナーが PQ の X25519MLKEM768 ではなく古典の X25519 を交渉するといった**上流やプロトコルの既定値**、別リポジトリの YAML でアルゴリズムが固定されている**設定ファイル**、デッドコード・テスト専用・廃止途中のコードが挙げられている。
- 暗号の発見は**単なるパターンマッチではない**。"RSA" や "X25519" を grep すると、使われていないコードを拾って過大に数え、既定値や依存・設定経由の間接利用を見逃して過小にも数える。何より**どう使われているか**が分からない。たとえば古典の ECDSA 署名が JWT、IPsec、TLS、SSH のどれに使われているかで移行経路がまったく違う。TLS サーバーが PQ と古典の鍵交換の両方に対応していても、どちらになるかはクライアント次第という相手側の事情もある。

## 発表内容 / アーキテクチャ

### AI を使う理由

モデルはコードベースを検索し、複数のファイルにまたがる根拠をたどり、構造化された分析を返せる。社内ドキュメントやチケットシステムなど他の情報源で結果を補強でき、暗号がどう使われ、どう更新すべきかの説明まで生成できる。記事はこの考えを CryptoLabe で検証しているとしている。

### 2 段階のスキャン

![CryptoLabe のスキャンの流れ](https://blog.cloudflare.com/_emdash/api/media/file/01M3NESS5M04DZSXCZCVK7CC8Y.png)
*図: Repository（Start scan）から Scanning agent（Finding all cryptography usage）を経て、複数の Deep analysis agents（Gather all the context from a single finding and then classify it according to its vulnerability）に分岐し、それぞれが Final report（Explain what is happening, where in the code it is happening, the possible attack vectors and recommend actions）を出す流れ（出典: Cloudflare Blog https://blog.cloudflare.com/ai-driven-cryptography-discovery/。原文にキャプションはなく、図中のラベルから筆者が説明を補った。掲載位置は本文の「2 段階のスキャン」直後）*

- **発見（discovery）段階**: まずリポジトリの構造を把握し、ソース・設定・マニフェスト・ロックファイル・スクリプト・テスト・ドキュメントから暗号の利用を探す。対象は鍵共有、署名、非対称暗号化、PKI、トークン、認証情報、HSM 連携などである。結果は「生の観測（raw observations）」の集合。
- **分析（analysis）段階**: 観測ごとに走る。まずソースコードで再確認し、その暗号操作が実行時にどう使われるか、リポジトリの役割、依存する内部・外部の相手を調べる。必要なら他リポジトリの関連コードも確認する。最後に自分の結論を見直し、設定による上書き、テスト専用コード、実行時挙動の誤った想定といった、欠けた証拠や矛盾する証拠を探す。
- モデルは発見ごとに分類を付ける。証拠が足りないときは推測せず、**More evidence needed**、**External dependency**、**Unknown** のいずれかにする。
- 最後に、**製品マネージャー**（自分の製品にとって移行が何を意味するか）と**エンジニア**（移行を実行するのに足りる詳細）の 2 種類の読者向けにレポートを作る。

### 分類（現時点）

記事の表は、今後の移行を通じて精緻化されるであろう「何でも受ける」分類を含むとしている（たとえば「encryption」を鍵共有と HPKE に分ける、など）。

| 分類 | 内容 |
|---|---|
| Classical encryption | 包括的な分類。楕円曲線 Diffie-Hellman 鍵交換（ECDHE: X25519、P-256、P-384 など）、RSA 鍵共有、その他の公開鍵暗号（HPKE など）。Shor のアルゴリズムで破られるため、harvest-now-decrypt-later 攻撃のリスクがある |
| Classical signature | 包括的な分類。証明書・TLS ハンドシェイク・その他のプロトコルハンドシェイクなどでの RSA 署名や ECDSA 署名。Shor のアルゴリズムで破られる |
| Classical token | RS256 や ES256 の JWT が多数見つかったため、専用に設けた分類。古典の RSA・ECDSA 署名を使う JWT。ML-DSA を使う PQ の置き換えを RFC 9964 が定義している |
| PQ-ready hybrid key exchange | TLS 1.3 のハイブリッド PQ 鍵交換（X25519MLKEM768）。コードベースで最も普及している PQ 暗号化の利用 |
| PQ-ready | TLS 1.3 の X25519MLKEM768 以外の PQ 暗号の利用（ML-DSA など） |

### レポートの例

![CryptoLabe のレポート画面（切り抜き）](https://blog.cloudflare.com/_emdash/api/media/file/01M3NESR0TET6ZRYP60MWHEK7W.png)
*図: 切り抜かれたレポートの画面。上部に「Quantum Vulnerable · Signature」「Hard case」「main feature」「Blocked」のタグ、タイトル「Cloudflare Access JWT RS256 signature verification」、説明、ID・COMPONENT（dashboard/backend/src/index.ts authentication boundary）・CONFIDENCE（High）。下に Deep report / Evidence / Review / History / Blockers のタブがあり、Summary には、ダッシュボードのバックエンドが Cf-Access-Jwt-Assertion ヘッダーの JWT を RS256（RSASSA-PKCS1-v1_5 with SHA-256）で検証しており、検証のみの認証境界が量子に脆弱で、将来の量子攻撃者がアサーションを偽造して権限のある操作者になりすませる、と書かれている（出典: Cloudflare Blog https://blog.cloudflare.com/ai-driven-cryptography-discovery/。原文にキャプションはなく、掲載位置は本文「Here’s a (cropped) view of one of our reports」直後。説明は画像の内容から筆者が補った）*

なお、Cloudflare は発見結果をソースコードと照らし、関係するエンジニアとレビューして反復しているが、プロンプトの版を再現可能な形で比べるための**正解データセットはまだない**と述べている。

### Cloudflare の開発者プラットフォーム上の構成

![CryptoLabe のアーキテクチャ](https://blog.cloudflare.com/_emdash/api/media/file/01M3NESPT874M5F4BP58M87WXB.png)
*図: ダッシュボード用 Worker（Dashboard Worker）が D1 に結果を読み書きし、「start scan」で Coordinator Durable Object を起動。Coordinator が「orchestration / monitoring」として Discovery Workflow → Deep Analysis Workflow → Merge Workflow を順に動かし、各 Workflow の成果物は R2 Artifacts に保存される。Discovery/Deep Analysis の Workflow は Cloudflare Sandbox でソースを読み（Sandbox は Source Control Management Platform から git clone）、モデルへのリクエストは AI Gateway 経由で Workers AI が推論する。Merge Workflow が結果をダッシュボードに publish する（出典: Cloudflare Blog https://blog.cloudflare.com/ai-driven-cryptography-discovery/。原文にキャプションはなく、図中のラベルから筆者が説明を補った。図では「Dashboard Worker」、本文では「inventory Worker」と呼ばれていると読める。対応関係は筆者の推定）*

CryptoLabe は 2 つの Workers で動く。

- **スキャナ Worker**: スキャンを実行する。
- **インベントリ Worker**: ダッシュボードを提供し、API を公開し、すべてを **D1** データベースに保存する。

両者は **Service Bindings** で通信する。スキャンはダッシュボードから依頼され、インベントリ Worker がスキャナに渡す。

### スキャンのオーケストレーション

独自のジョブ管理基盤を作らずに、スキャンを最後まで維持して進める方法として **Agents SDK** を使う。

- リポジトリごとに **Durable Object** (DO) ベースの永続的な**コーディネーター**を持つ。コーディネーターの前段に、同時に走るスキャン数を制限する有界キューがある。順番が来るとコーディネーターが進行、キャンセル、再試行、復旧を管理する。
- 分析そのものはコーディネーターではなく **Cloudflare Workflows** に任せる。進捗を永続化し、失敗したステップを自動で再試行できるため。コーディネーターは各リポジトリを 4 つのステージで進める。
  1. **discovery Workflow**（最初のスキャン。生の観測を出す）
  2. **deep analysis Workflow**（2 段階目。生の観測ごとに実行）
  3. **merge Workflow**（リポジトリごとの発見一覧を作り、重複や類似の発見を統合）
  4. **publish workflow**（結果をインベントリ Worker に返す）
- 最初の 2 つはモデルがリポジトリのコードにアクセスする必要がある。コードベースを壊すリスクを避けるため隔離する。スキャン開始時にリポジトリを**正確なコミット**で 1 度だけダウンロードし、そのスナップショットを **R2** に保存する。各 Workflow は、それを新しい短命の **Cloudflare Sandbox**（隔離されたコンテナ）に復元し、モデルは小さな**読み取り専用ツール**群だけでイミュータブルなスナップショットを扱う。スキャン中にコードベースが変わっても影響しない。

### 大規模なモデル呼び出し

すべてのリポジトリをスキャンするには、コストと容量の両方を考える必要がある。

- **コスト**: モデルのループは **AI Gateway** 経由で、**Workers AI** 上のコスト効率のよい**オープンウェイトモデル**にリクエストする。AI Gateway を挟むことで、より良い、または安いモデルが出たときの切り替えも容易になる。
- **容量**: 多数のリポジトリを同時にスキャンし始めると、リクエストの集中で AI Gateway から HTTP 429（レート制限）が返り始め、各スキャンが独立に再試行するとバーストがさらに悪化した。そこで、再試行を含むすべてのスキャンのモデルリクエストの間隔を調整する、**単一のグローバル Durable Object** を導入した。どれかのスキャンがレート制限に当たるとクールダウンが共有され、全スキャンが一斉に待つため、同時実行のスキャンが容量を奪い合わず分け合える。

## 前提条件と難しいケース

3 つ目の目標、前提条件と難しいケースの早期把握について。PQ 移行は孤立しては進まず、BoringSSL などのライブラリや、クライアント・ブラウザ・オリジン・クラウドプロキシ・認証局といったエコシステム全体の対応が必要になる。標準の状態も重要な指標だが、ドラフトのままでも展開は止まらない。例として、Cloudflare は X25519MLKEM768 を IETF でまだドラフトだった 2022 年に TLS 1.3 へ展開しており、RFC 10024 として確定したのは 2026 年である。

### 前提条件（prerequisites）

CryptoLabe は、1 つの製品チームだけでは直ちに解消できない発見を「前提条件」として強調する。たとえば「PQ の JWT への移行がブロックされている」。PQ の JWT には標準（RFC 9964）があるが、自社のライブラリが PQ の JWT 検証に対応していなかったり、トークン発行者が PQ の JWT を発行できなかったりすれば、全社の製品チームに PQ 化を依頼できない。CryptoLabe は、同じ前提条件を持つ（と思われる）発見をまとめられ、前提条件の解消の優先順位づけにも役立つ。

![PQ SAML を前提条件とする発見の一覧](https://blog.cloudflare.com/_emdash/api/media/file/01M3NEST48TEP90AW1RRDTS5H5.png)
*図: 前提条件の項目の画面。種別 EXTERNAL、タイトル「No standardized PQ SAML/XML Signature algorithm」、状態 Blocking、「Mark resolved」「Edit」などのボタンがあり、説明に、XML Signature と SAML の標準エコシステムが、展開可能な PQ 署名アルゴリズム識別子と相互運用プロファイルを公開し、IdP と検証ライブラリが対応してから、標準互換の PQ 署名された SAML レスポンスとアサーションを発行・検証できる、と書かれている。下部は「8 findings」と 8 件の ID が並ぶ（出典: Cloudflare Blog https://blog.cloudflare.com/ai-driven-cryptography-discovery/。原文にキャプションはなく、掲載位置は本文の SAML の例の直後。説明は画像の内容から筆者が補った。なお本文は「6 件の発見」と書いているが、画像下部には「8 findings」と表示されており、数が異なる。原文の記述のまま併記する）*

### 難しいケース（hard cases）

PQ エコシステムの基本的な対応すらない暗号利用を「hard cases」と呼んでいる。見つけるために、通常の用途（社内システム間の普通の TLS など）を無視する**別のプロンプト**を書いた。探す対象は次のとおり。

- 独自の暗号プロトコル、鍵、署名（特にサイズに制約のあるフィールドで使われるもの）
- ハードウェアに組み込まれた暗号
- ブラインド署名のような特殊な暗号構成
- PQ の標準がないプロトコル
- PQ に未対応の外部の相手への依存

このプロンプトは CryptoLabe のものより短くシンプルで、定性的な評価では、社内のチケットシステムとドキュメントの文脈を取り込みながら**全リポジトリに対して一括で**走らせたほうが良い結果になった。

難しいケースの例は「HTTP ヘッダーで運ばれる証明書」。PQ の証明書と署名は古典のものより大きいため、ヘッダー（または中継や処理側のアプリ）が証明書のサイズを想定していると、署名アルゴリズムを変えたときに壊れる可能性がある。次の手順は、このコードが長期的に使われ続けるかの判断で、続くなら関連するサイズ上限を測り、より大きな証明書をどう収めるかを決める。

**教訓**: 1 回のスキャンですべてが見つかるわけではない。リポジトリ別のスキャンは一般的な暗号利用の発見に有効で、対象を絞ったスキャンは、よく知られた暗号を無視し、製品や依存関係の文脈を多く持つぶん「難しいケース」に向く。手法ごとに見つかるものが違い、いずれの発見も、システムの実際の動作を知るエンジニアの確認が必要である。

## プロンプトの公開

プロンプトの書き方は数か月試行錯誤しているが、プロンプト同士の性能を比べる正解データセットはなく、コードベースの暗号利用を 100% 網羅している確信もない。そのため、スキャンを走らせ、リポジトリの保守担当エンジニアと発見をレビューし、レビューで出た見逃しを調べてプロンプトを改訂する、という反復を続けている。それでも [cloudflare/crypto-discovery-prompts](https://github.com/cloudflare/crypto-discovery-prompts/) で**選んだプロンプトを公開**している。これらは出発点であって CryptoLabe そのものではなく、結果の質はモデル・ツール・文脈・エンジニアのレビューに左右されるとしている。

## 自組織の PQ 移行をどう考えるか

Cloudflare が「PQ everything」を掲げるのは、顧客やインターネット全体への PQ 暗号の提供者だからだ。多くの組織は、すべての製品のすべてのリポジトリの暗号を洗い出すことから始める必要はなく、むしろ現時点では貴重な資源の無駄だと記事は述べる。

- スキャン前に、できる限り**通信をまとめて保護**する。Cloudflare 経由のサイトは、すでに転送中のデータが PQ 暗号で保護されている（[PQ 可視化機能](./2026-09-29-post-quantum-visibility.md)で確認できる）。SASE プラットフォームの Cloudflare One もプライベートネットワークトラフィックに PQ 暗号化を提供する。追加費用なし、オリジンサーバーや社内アプリの更新も不要で、自社システム内部の暗号の発見・理解を進める間の補完的な統制（compensating control）になる。
- 網羅的な暗号の棚卸しは行動の前提条件ではない。まず侵害されたときの影響が大きいシステムを特定し、暗号の利用を発見し、優先順に PQ 化する。始め方は次の 4 ステップ。
  1. **リポジトリを 1 つ選ぶ**: 機微または長期保持のデータを扱う、ユーザーやソフトウェアを認証する、公開インターネットに晒されている、のいずれかのシステムから。
  2. **暗号の発見を実行する**: CryptoLabe の説明が参考になるとしている。
  3. **結果を検証する**: システムの担当チームに結果を確認してもらい、その暗号が長期的に必要か、PQ へのアップグレードが必要かを確認する。別の補完的な統制があれば、すぐ PQ 化する必要はないかもしれない。
  4. **行動の優先順位をつける**: 今できるアップグレードとブロックされているものを分け、ライブラリ・ベンダー・標準化団体・社内の別部署の助けが要る共通の前提条件を記録し、影響の大きいシステムと前提条件から計画を立てる。

謝辞には、Davide Marquês、Peter Wu、Phil Schmieder、JP Aumasson、Andrew Galloni、Christopher Patton、Luke Valenta、Mari Galicer、Vânia Gonçalves と、ツールのレポートをレビューした Client、Tunnel、Gateway の各チームが挙がっている。

## コード例

本記事には**コードブロックやコマンドなどのコード例は含まれない**。代わりに、上記の「発表内容 / アーキテクチャ」でスキャンの流れ・分類・Workers/Durable Objects/Workflows/R2/Sandbox/D1/AI Gateway/Workers AI の構成図を整理している。記事中にあるコード的な文字列は、アルゴリズム名（X25519、X25519MLKEM768、RS256、ES256、ML-DSA など）や RFC 番号（RFC 9964、RFC 10024）、`Cf-Access-Jwt-Assertion` ヘッダー名（レポート例の画像内）にとどまる。

## ユースケース

- **暗号利用の棚卸しと進捗の可視化**: リポジトリ別・製品別に、古典暗号と PQ 暗号の利用数を数えて移行の進捗指標にする。
- **製品チームへの移行ガイド**: レポートを製品マネージャー向けの影響説明とエンジニア向けの実行用詳細に分けて、何をどう更新するかを示す。
- **共通の前提条件の発見と優先順位づけ**: 例として PQ の SAML（標準のアルゴリズム識別子やライブラリ対応が未整備）のように、個別チームでは解決できないものをまとめて、標準化団体やエコシステムに働きかける優先度を決める。
- **難しいケースの早期発見**: HTTP ヘッダーで運ばれる証明書のような、PQ 署名のサイズ増で壊れうる箇所を前倒しで見つける。
- **自組織の段階的な PQ 移行**: まず重要なシステム 1 つを選び、スキャン、担当チームの検証、優先順位づけを回す。

## 所感・ポイント

- 「grep では足りない」という動機が具体的で、過大に数える（未使用コード）、過小に数える（既定値・設定・依存経由）、用途が分からない（JWT か IPsec か TLS か SSH か）の 3 点に整理されている。暗号の発見に限らず、コードの横断調査全般に通じる話である。
- 証拠が足りないとき推測させず、**More evidence needed / External dependency / Unknown** を用意しているのは、AI 分析の信頼性を保つ設計として分かりやすい。さらに自分の結論を見直す工程を置いている。
- 分析を Workflows の段階に分け、隔離された Sandbox と読み取り専用ツール、コミット固定の R2 スナップショットで動かす構成は、AI エージェントにコードを読ませる場合の安全性と再現性の例として参考になる。レート制限の共有クールダウン（グローバル Durable Object）も、同時実行する AI 呼び出しの実用的な対策である。
- 記事自身が、正解データセットがないこと、網羅性に確信がないこと、手法によって見つかるものが違うことを明記している。結果は「エンジニアによる確認が前提」の補助ツールとして読むのが適切。
- CryptoLabe は顧客に提供されず、リポジトリ上で入手できるのはプロンプトのみ。製品として使えるものではない。
- PQ 認証側の進捗（Merkle Tree Certificates や CA）は別記事に詳しく、本記事は「自社コードの暗号を見つけて移行を計画する」という組織内の進め方の側にある。
- **サンプル対象外**: CryptoLabe は社内向けのツールで顧客には提供されず、中心機能（社内リポジトリのスキャン）は第三者が再現できる一般利用可能な機能ではない。構成要素（Workers、Durable Objects、Workflows、R2、Sandbox、D1、AI Gateway、Workers AI）は個別に別記事で扱われており、100 行前後で記事の要点を体験できる最小実装にならないため、`examples/` は作成していません。
- 画像は 5 枚（ヘッダーの装飾イラスト 1 枚と、本文の図 4 枚）。いずれも原文にキャプションがなく、図の説明は図中のラベルと掲載位置から筆者が補った。

## 関連リンク

- 原文（en-us）: https://blog.cloudflare.com/ai-driven-cryptography-discovery/
- 公開されたプロンプト: https://github.com/cloudflare/crypto-discovery-prompts/
- 2029 年の PQ 目標（ロードマップ）: https://blog.cloudflare.com/post-quantum-roadmap/
- 量子の脅威の背景: https://blog.cloudflare.com/the-quantum-menace/
- ML-DSA と PQ 認証: https://blog.cloudflare.com/ml-dsa-will-have-to-do/
- オリジンへの PQ 認証: https://blog.cloudflare.com/post-quantum-authentication-to-origins/
- 製品別の PQ 対応状況: https://developers.cloudflare.com/ssl/post-quantum-cryptography/pqc-cloudflare-products/
- PQ 暗号の無料提供: https://blog.cloudflare.com/post-quantum-crypto-should-be-free/
- Cloudflare One の PQ 対応: https://blog.cloudflare.com/post-quantum-sase/
- 「多くの組織は全リポジトリの棚卸しから始める必要はない」の箇所でリンクされている記事（記事スラッグは post-quantum-eo-2026。内容は未確認）: https://blog.cloudflare.com/post-quantum-eo-2026/
- RFC 9964（PQ JWT）: https://www.rfc-editor.org/info/rfc9964
- RFC 10024（X25519MLKEM768）: https://www.rfc-editor.org/info/rfc10024/
- FIPS 204（ML-DSA）: https://csrc.nist.gov/pubs/fips/204/final
- 使われている Cloudflare の技術: [Agents SDK](https://developers.cloudflare.com/agents/)、[Durable Objects](https://developers.cloudflare.com/durable-objects/)、[Workflows](https://developers.cloudflare.com/workflows/)、[R2](https://developers.cloudflare.com/r2/)、[Sandbox](https://developers.cloudflare.com/sandbox/)、[D1](https://developers.cloudflare.com/d1/)、[AI Gateway](https://developers.cloudflare.com/ai-gateway/)、[Workers AI](https://developers.cloudflare.com/workers-ai/)、[Service Bindings](https://developers.cloudflare.com/workers/runtime-apis/service-bindings/)
- 本リポジトリ内の関連記事: [Cloudflare が「インターネット全体のための認証局」を作る](./2026-09-29-cloudflare-certificate-authority.md)、[Merkle Tree Certificates によるポスト量子認証局の構築](./2026-09-29-pq-ca-with-mtcs.md)、[あなたのドメインはポスト量子暗号を使っているか](./2026-09-29-post-quantum-visibility.md)、[IPsec に対する量子ダウングレード攻撃の防止](./2026-09-29-ipsec-downgrade-protection.md)
