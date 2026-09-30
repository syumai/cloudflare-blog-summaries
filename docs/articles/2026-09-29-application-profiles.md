# Cloudflare Application Profiles でポジティブセキュリティを実現する

- 原文: [https://blog.cloudflare.com/application-profiles/](https://blog.cloudflare.com/application-profiles/)
- 日本語版の出どころ: Cloudflare公式の日本語版（`https://blog.cloudflare.com/ja-jp/application-profiles/`）は確認時点で存在しなかった（404）ため、英語版（en-us）から日本語化して要約している。公開日は英語原文の datePublished（2026-09-29）に従う。
- 公開日: 2026-09-29
- 位置づけ: Birthday Week 2026 の記事
- 著者: Daniele Molteni、Zhiyuan Zheng
- 関連: [フロンティア AI モデルで自社の WAF をテストしてみた](./2026-09-29-adaptive-ai-waf-testing.md)（多層防御の例としてポジティブセキュリティに言及）。同じ Birthday Week 2026 の記事に [cf のご紹介](./2026-09-28-cloudflare-cf-cli-launch.md) などがあるが、内容上の直接の関連は薄い（本リポジトリ内に WAF / API Shield / Schema Validation を扱う既存記事は現時点でない）
- GitHub: [docs/articles/2026-09-29-application-profiles.md](https://github.com/syumai/cloudflare-blog-summaries/blob/main/docs/articles/2026-09-29-application-profiles.md)

![ヘッダー画像（装飾イラスト）](https://blog.cloudflare.com/_emdash/api/media/file/01M3B09CMJMHVJCVMPMCFARRCT.01M3B09DCPG1A08FA7FTWA6PR9.png)
*図: 記事冒頭のヘッダー画像。ブラウザ画面とブロックを描いた装飾的なイラストで、技術的な図ではない（出典: Cloudflare Blog https://blog.cloudflare.com/application-profiles/。原文に alt テキストやキャプションがなく、掲載位置から「ヘッダー画像」と筆者が補った）*

## TL;DR

- Application Profiles（記事中では Schema Profiles とも呼ぶ）は、トラフィックから「正常なリクエストの構造・形式」を学習し、そこから外れるリクエストを検知する**ポジティブセキュリティ**機能。
- 学習対象はパス変数・クエリ・ヘッダー・Cookie・JSON / フォームボディ。各フィールドの型（整数・文字列・UUID・enum など）と制約（範囲・長さ・文字クラス）を週次で学習する。
- 検証は常時オン。ただし検知は**メタデータとして付与されるだけ**で、ブロックはユーザーが Security Rules で明示的に作る（まず観測モード推奨）。Security Analytics に Profile Analysis タブが追加された。
- 将来は LLM で各オペレーションの意図を推定し、保護すべき重要フィールドの優先順位付けを行う予定。
- API Security の顧客は利用可能。それ以外の Enterprise 顧客には招待制のクローズドベータ。

## 背景・課題

フロンティア AI モデルを使った攻撃への対策は、セキュリティ担当者の最優先課題になっている。LLM は専門知識のない人でも 1 回のプロンプトで攻撃を開始できるようにし、悪意あるペイロードの生成、既知の手法の試行、アプリケーションや WAF からの反応を見た自律的な手口の変異まで行える。マネージド WAF ルールや機械学習ベースの検知は引き続き重要だが、「既知の攻撃に似たものを探す」方式は新しい亜種の登場に後れを取る。「もっと速くパッチを当てる」だけでは持続可能でなく、脆弱性を把握しきれていなければ機能しない。

そこで発想を逆にする。**攻撃らしいものを探す代わりに、期待どおりのリクエストだけを通す**。たとえば検索フィールドが特殊文字を想定していなければ英数字のみ受理するだけで、多くの既知攻撃を防げる。さらに構造が学べれば各オペレーションの目的まで推定でき、最優先で守るべき操作やフィールドを特定できる。

## 発表内容 / アーキテクチャ

Cloudflare は API 向けにすでに Schema Learning / Schema Validation でポジティブセキュリティを提供しており、今回それを Web アプリケーションへ拡張した。アプリケーションをオンボードすると、Cloudflare がプロファイルを学習し、常時オンの検知が非準拠を見つける。

### 学習と検証の流れ

プロファイルは観測されたトラフィックから期待される構造を定期的に学習する。プロファイルが使えるようになると、常時オンの検証レイヤーがライブトラフィックに自動で展開される。各リクエストについて準拠 / 非準拠を評価し、結果を**メタデータとして付与**する。この信号自体は何のアクションも取らない。顧客は Security Analytics で過去のトラフィックを確認し、適切な箇所で Security Rules を作ってブロックする。プロファイルのないオペレーションへのリクエストは分類されない。

![リクエスト検証とメタデータ付与の図](https://blog.cloudflare.com/_emdash/api/media/file/01M3B09CFWMN5RMJ4P52K5QEEZ.01M3B09D3DE13C6NY19SCCGXQX.jpg)
*図: Request validation enriches the request with metadata that can be used in analytics or Security Rules to enforce blocking of non-conforming requests.（リクエスト検証がメタデータを付与し、分析や Security Rules でのブロックに使える）（出典: Cloudflare Blog https://blog.cloudflare.com/application-profiles/。キャプションは原文の英語を日本語化）*

Managed Rules と違い、検証失敗に既知の攻撃シグネチャへの一致は不要。想定範囲外の値、未知の enum 値、不正な UUID、想定外の文字など、学習したプロファイルと違うものはすべて検出できる。ただし**非準拠は必ずしも悪意を意味しない**。アプリのリリース、新しいクライアント、珍しいが正当なリクエストでも差は出るので、まず観測モードで影響を確認することを推奨している。

### 具体例

次のオペレーションを考える。

```
www.example.com/shop/2dbda2e7-cfc9-448d-9465-799d2e6ff363/inventory?product_id=938062541
```

十分なトラフィックを観測すると、パスは UUID 変数を期待し、`product_id` は整数でその範囲がどこまでかを学習する。`product_id` に文字列が入れば違反として検知される。不正な UUID も同様に見つけられ、顧客が強制を有効にすれば、UUID でない入力は該当ハンドラーに届かなくなる。こうした単純なフィルターが、SQL インジェクション、XSS、RCE など多くの典型的な攻撃経路を絞り込む。

### 期待される構造の学習

プロファイルには、トラフィックに応じて次が含まれうる。

- パス変数
- クエリパラメータ
- ヘッダーと Cookie
- ボディ構造（JSON またはフォームエンコード）

各フィールドについて、データ型（整数・文字列・真偽値・配列・UUID・enum）と、数値範囲・短い列挙・文字列長・文字クラスといった制約を学習する。

学習は顧客がプロファイル対象に選んだオペレーションに対して行う。Web Assets では、HTTP メソッド・ホスト名パターン・パスパターンで識別されるものを「オペレーション」と呼ぶ。Web Assets > Operations には発見されたオペレーションが継続的に一覧され、手動追加もできる。発見されたオペレーションのプロファイリングは自動では始まらず、オーバーフローメニューから **Learn profile** を選ぶ必要がある。手動作成したオペレーションは作成時にプロファイリングが始まる。

![Learn profile の操作](https://blog.cloudflare.com/_emdash/api/media/file/01M3B09CFRQWTP4W5S1BCN07X2.01M3B09DWCC8TJAYNP51SB3ENS.png)
*図: To enable profiling for a discovered operation, a customer can select "Learn profile" in the overflow menu of an operation. When learning is active, "Learning profile" will be displayed.（発見されたオペレーションのメニューから「Learn profile」を選ぶ。学習中は「Learning profile」と表示される）（出典: Cloudflare Blog https://blog.cloudflare.com/application-profiles/。キャプションは原文の英語を日本語化）*

有効化すると、Cloudflare は対象トラフィックを集め、**ゾーンごとに週 1 回**、直近の成功トラフィックで自動学習する。フィールドの学習には過去 7 日間で 2xx を返したリクエストが最低 **1,000 件**、データ境界の学習には最低 **10,000 件**必要。成功リクエストにはボットやスキャナーも含まれうるため、強制前にプロファイルを確認すべきとされる。ロードマップには、学習のオンデマンド実行と自動化トラフィックの除外が含まれる。

学習済みのプロファイルは、オペレーションの View details の Security overview パネルで確認でき、OpenAPI v3 スキーマとしてエクスポートもできる。

![学習済みスキーマの確認](https://blog.cloudflare.com/_emdash/api/media/file/01M3B09EY75HGTKJ084869Z1FF.01M3B09G3R8J7APCEQMP5H1E6J.png)
*図: Learned schema can be reviewed directly in the dashboard and downloaded in OpenAPI format.（学習済みスキーマはダッシュボードで確認でき、OpenAPI 形式でダウンロードできる）（出典: Cloudflare Blog https://blog.cloudflare.com/application-profiles/。キャプションは原文の英語を日本語化）*

プロファイルは毎週更新され、新しいフィールドは追加され、観測されなくなったものは削除される。固定したい場合は、学習済みスキーマをダウンロードして Schema Validation にアップロードすることで固定できる。

### ブロック前に確認する: Profile Analysis

Security Analytics に新しい **Profile Analysis** タブが加わった。検証プロファイルを選ぶと、過去 7 日間に学習プロファイルへ非準拠だったリクエスト数などの傾向を見られる。準拠 / 非準拠のトラフィックを確認し、サンプルログから違反の場所・影響したフィールド・失敗理由まで掘り下げられる。違反は型の不一致・学習範囲外の値・不正な形式など **10 種類の理由**に分類される。

![Security Analytics の Profile Analysis](https://blog.cloudflare.com/_emdash/api/media/file/01M3B09F8Z0TBJ67BMHRQTA9K3.01M3B09GMCWVTKENJ3VM6G0HEJ.png)
*図: Security Analytics shows the outcome of the profile validation on your live traffic. You get visibility without affecting traffic. Blocking invalid requests depends on deploying a rule.（ライブトラフィックへの検証結果を、トラフィックに影響せず確認できる。ブロックにはルールのデプロイが必要）（出典: Cloudflare Blog https://blog.cloudflare.com/application-profiles/。キャプションは原文の英語を日本語化）*

![違反詳細の例](https://blog.cloudflare.com/_emdash/api/media/file/01M3B09FY7NMQHSG9V987FX95H.01M3B09HSZMSQJNSAVK54BKMW3.png)
*図: A string is used in a path variable instead of an expected integer. Profile validation detects it and provides details on the violation.（パス変数に整数の代わりに文字列が使われた例。違反の詳細が表示される）（出典: Cloudflare Blog https://blog.cloudflare.com/application-profiles/。キャプションは原文の英語を日本語化）*

### Security Rules による強制

従来の WAF の学習モードは詳細なポジティブセキュリティポリシーを作れるが、提案の確認・変更のステージング・ポリシー実体の維持が必要になりがちだった。Schema Profiles は検証結果をリクエストフィールド `cf.schema_validation.learned.violated` として公開するので、Bot Score や Attack Score など他の信号と 1 つの Security Rule で組み合わせられる。ルールはアプリ全体にも、特定のパス・オペレーション・フィールドにも限定して適用できる。

![非準拠リクエストをブロックするルール作成](https://blog.cloudflare.com/_emdash/api/media/file/01M3B09JH896EEFN63XD2BYFMM.01M3B09KNR0W4AKRJ2P0T68WAV.png)
*図: Create a rule to block requests that do not conform with the learned schema profile.（学習したスキーマプロファイルに準拠しないリクエストをブロックするルールを作成する）（出典: Cloudflare Blog https://blog.cloudflare.com/application-profiles/。キャプションは原文の英語を日本語化）*

より細かいルール用に、さらに 2 種類のフィールドがある。

| 用途 | フィールド | location の値 | 例 |
| --- | --- | --- | --- |
| 違反がリクエストのどこで起きたかを特定（最大 20 要素の配列） | `cf.schema_validation.learned.[location].violated_parameters` | query, path, headers, cookies, body | `cf.schema_validation.learned.query.violated_parameters = ["product_id"]` |
| プロファイルにない（未宣言の）パラメータの検出（最大 20 要素の配列） | `cf.schema_validation.learned.[location].undeclared_parameters` | query | `cf.schema_validation.learned.query.undeclared_parameters = ["adminMode", "utm"]` |

前者により、特定フィールドだけポジティブセキュリティを強制したり、逆に除外したりできる。後者は新バージョンのデプロイ時に新パラメータを扱いたい場合や、過去に観測・定義されていないパラメータをすべて弾いてさらに厳しくしたい場合に有用。なお原文本文には `cf.schema_validation.uploaded.query.violated_parameters` という表記もあるが、表や他の箇所に合わせて `learned` のことと解釈している（原文の誤記の可能性）。

### 今後: Critical Field Analysis

大規模なアプリには数千のオペレーションと数万のフィールドがありうるが、リスクは均一ではない。そこで LLM で学習済みプロファイルに文脈を与える。パスやフィールド名は通常意味が分かりやすいので、Workers AI 上のモデルを 4 つのランダムなアプリのプロファイルに適用した試験では、同一システムの 2 アプリにまたがる `clientId` と `account_number` の関連や、ワンタイムパスワード（OTP）を使う共通の依存関係を識別できた。こうした文脈から、アカウントを狙うブルートフォースへのレート制限ルールの設定といった対策の優先順位付けができる。これらの洞察は Web Assets のオペレーションごとにダッシュボードで提供される予定で、ワンクリックのデプロイ前に、過去トラフィックによる緩和シミュレーション付きでルール推奨を評価できる。

![LLM による重要フィールドの特定](https://blog.cloudflare.com/_emdash/api/media/file/01M3B09JMC84K6WW8TAWM92HSB.01M3B09KVXR0XGE9Y8WRT653AH.png)
*図: Running an LLM on the learned profile provides insights on the intent of each operation and helps identify critical fields that require protection.（学習済みプロファイルに LLM を適用し、各オペレーションの意図と保護が必要な重要フィールドを示す）（出典: Cloudflare Blog https://blog.cloudflare.com/application-profiles/。キャプションは原文の英語を日本語化）*

さらに履歴トラフィックの傾向から、次の指標でオペレーションの優先順位付けを開発中。

- **データ流出**: 異常なデータ転送量の増加傾向
- **偵察活動**: 未知パラメータの多さ
- **ビジネス上の重要度**: 一意のセッション ID に紐づくトラフィック総量

### 提供状況

- API Security の顧客: Schema Learning / Validation の拡張なので、すでに利用可能。
- それ以外の Enterprise 顧客: 招待制のクローズドベータ。本番トラフィックで試し、プロファイルの精度・分析・強制制御へのフィードバックを行う。将来のプラン提供を約束するものではない。希望者はアカウントチームへ。
- 対応: パス・クエリ・ヘッダー・Cookie・JSON ボディ・フォームエンコードボディ。検証可能な型は整数・文字列・UUID・配列・最大 3 値の enum。
- 非対応・制限: multipart フォーム、GraphQL、XML は未対応。パラメータ名が繰り返される場合は全値を検証するが、一意性は強制しない。必須パラメータの学習・強制や、新パラメータを含むだけでのブロックは行わない。

将来は ASN や JA4 など、アプリケーションが期待する他の特性も同じ流れで学習し、逸脱を説明する構想で、「Proactive Security」ワークフローとしてゼロデイ対策につなげるとしている。

## コード例

記事に実行可能なコードやサンプルはない。代わりに、設定・運用で重要となる式（Security Rules のフィールド）を上記の表と次の例で示す。

```
# 学習プロファイルに非準拠のリクエスト
cf.schema_validation.learned.violated

# クエリの product_id が違反
cf.schema_validation.learned.query.violated_parameters = ["product_id"]

# 未宣言のクエリパラメータが含まれる
cf.schema_validation.learned.query.undeclared_parameters = ["adminMode", "utm"]
```

1 行目は概念的な例（記事は「フィールドとして公開される」と説明）、2・3 行目は記事の表にある例そのまま。実際のルール式の書き方（演算子や他条件との組み合わせ）は公式ドキュメントを参照。

## ユースケース

- **SQL インジェクション・XSS の入口を絞る**: 整数と学習した `product_id` に文字列が来たら違反として検知・ブロックする。
- **不正な UUID のパス変数を除外**: UUID でない入力をハンドラーに届けない。
- **新バージョンのデプロイ時の移行**: `undeclared_parameters` で新パラメータを一時的に許可・観測し、安定後に厳格化する。
- **管理用パラメータの不正利用検知**: `adminMode` のような未宣言パラメータを検出して弾く。
- **強制前の影響確認**: Profile Analysis で 7 日間の非準拠割合と違反内容を見てからルール化する。
- **重要フィールドの優先保護（将来）**: LLM で特定した `account_number` / OTP 周りにレート制限を優先して設定する。

## 所感・ポイント

- 「攻撃を探す」から「正常を定義して外れを探す」への転換だが、検知と強制を分離しており（信号 + Security Rules）、誤検知リスクを観測モードで確かめてから段階的に導入できる設計になっている。
- 学習データには 2xx のボットやスキャナーのトラフィックも混ざりうる点が注意。学習結果を OpenAPI としてエクスポートして確認・固定できるのは運用上ありがたい。
- 「必須パラメータを強制しない」「新パラメータだけではブロックしない」など現時点の制限が明記されている。ポジティブセキュリティの完全版ではなく、型・形式の検証が中心と理解するとよい。
- LLM による重要フィールド分析は現時点では予告段階（パイロットの結果のみ）。
- 画像 8 点のキャプションのうち、冒頭のヘッダー画像は原文にキャプションがなく筆者が補った。その他 7 点は原文のキャプションを日本語化したもの。
- **サンプル対象外**: 本記事の中心機能は Enterprise 向けの WAF / API Security の機能で、API Security 顧客または招待制クローズドベータに限られるため、Workers 上でデプロイして再現できるサンプルは作成していません。

## 関連リンク

- 原文（en-us）: https://blog.cloudflare.com/application-profiles/
- Application Profiles ドキュメント: https://developers.cloudflare.com/waf/detections/application-profiles/
- 違反詳細の見方: https://developers.cloudflare.com/waf/detections/application-profiles/analyze-profile-detections/#understand-violation-details
- Web Assets: https://developers.cloudflare.com/security/web-assets/
- セッション識別子（API Shield）: https://developers.cloudflare.com/api-shield/management-and-monitoring/session-identifiers/
- リスクラベル（API Shield）: https://developers.cloudflare.com/api-shield/management-and-monitoring/endpoint-labels/#risk-labels
- JA4 シグナル: https://blog.cloudflare.com/ja4-signals/
