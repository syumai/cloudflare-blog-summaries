# 「全員が使える」誓約のアップデート: Enterprise 専用だった機能は今どこまで開放されたか

- 原文: [https://blog.cloudflare.com/enterprise-for-all-update/](https://blog.cloudflare.com/enterprise-for-all-update/)（原題: Updates on our pledge to make Cloudflare features accessible to everyone）
- 日本語版の出どころ: Cloudflare公式の日本語版（`https://blog.cloudflare.com/ja-jp/enterprise-for-all-update/`）は確認時点で存在しなかった（404）ため、英語版（en-us）から日本語化して要約している。公開日は英語原文の datePublished（2026-10-02）に従う。
- 公開日: 2026-10-02
- 位置づけ: Birthday Week 2026 の記事（Birthday Week / Developers / Product News / Terraform タグ）
- 著者: Oliver Roup、Justin Hutchings、Chase Catelli
- 関連: [Billable Usage API](./2026-08-03-billable-usage-api.md)（本記事の「Billable Usage ダッシュボードと API」の詳細）、[あなたのドメインはポスト量子暗号を使っているか](./2026-09-29-post-quantum-visibility.md)（Logpush に追加されたデータセットの1つ「ゾーン単位のポスト量子可視性」）、[糸をたどる: アカウント不正を調査するための新しいダッシュボード](./2026-10-02-account-abuse-protection-dashboard.md)（Logpush の権限設計に触れる同日公開の記事）。前年の発表「enterprise-grade-features-for-all」（2025-09-25）はこのリポジトリには未収録のため、外部リンクのみ（[原文](https://blog.cloudflare.com/enterprise-grade-features-for-all/)）
- GitHub: [docs/articles/2026-10-02-enterprise-for-all-update.md](https://github.com/syumai/cloudflare-blog-summaries/blob/main/docs/articles/2026-10-02-enterprise-for-all-update.md)

![ヘッダー画像（開いた箱から光が差し込む等角図）](https://blog.cloudflare.com/_emdash/api/media/file/01M3XD0DHYHB54G3RT6GBMY2W5.png)
*図: 記事ヘッダーの装飾イラスト（出典: Cloudflare Blog https://blog.cloudflare.com/enterprise-for-all-update/ 。原文に alt テキストやキャプションがないため、画像の内容から筆者が説明を補った。仕組みを示す図ではなく装飾である）*

## TL;DR

- 1年前に CTO の Dane Knecht が表明した「すべての Cloudflare 機能を全員に提供する」誓約の進捗報告。今週発表された GA 機能で Enterprise プランにあるものは、Pay-as-you-go でも使え、多くは無料枠でも使える。**プラン間の違いは「何を使えるか」ではなく「どれだけ使えるか」**という方針。
- 今回 Enterprise 専用から全員向けになった機能: **Logpush**（Free / Pro / Business にセルフサービス・従量課金で提供）、**Logpush Transformers**（全顧客向けに GA）、**Custom Dashboards**。
- 大規模運用の道具として、**RBAC の拡大**（Workers も個別リソース単位のロールに対応）、ダッシュボードの **New Account ボタン**による複数アカウント作成、**Organizations**（Enterprise でベータ、10月に GA、無料アカウントへは2027年初頭）、**Terraform**、**Resource Tagging** を紹介。
- 「Code Orange: Fail Small」の一環として、**今後 Enterprise 専用の新機能は導入しない**ことを約束（Cloudflare for Government のように本質的に Enterprise 向けのものは例外）。
- 無料・従量課金向けの進捗として、Billable Usage ダッシュボードと API、予算アラート、Workers / Containers / Workflows / Browser Run / Vectorize などの上限引き上げを列挙。

## 背景・課題

Cloudflare は、請求書払いや個別契約、専用サポートといった「クレジットカード以外の購入手段」を求める大企業向けに、Enterprise 階層を用意してきた。ところが時間とともに、先進的で強力な機能の一部が Enterprise にしか提供されない「二層構造」ができてしまった。1年前の発表はこの差を埋めることを目標にしていた。

記事は、根底にある考え方を次のように述べる。最も要求の厳しい顧客に向けた製品を作り、その能力を全員に提供する。大企業でも小規模事業者でも、サポートに電話をしなくて済むほうがよい。買いやすく、設定しやすく、使いやすい製品は、使われる製品を増やし、より良いインターネットに近づく。

記事は目標が未達であることも明記している。「全機能を全員に」はまだ達成していないが、この1年で大きく前進した、という立場である。

## 発表内容 / アーキテクチャ

### 方針: 違いは「使える量」であって「使える機能」ではない

- 今週ローンチした GA 機能のうち Enterprise プランで使えるものは、Pay-as-you-go でも使える。多くは無料枠でも使える。
- プランの違いは使用量（how much）であり、機能（what）ではない、という整理。

### Logpush と Transformers、Custom Dashboards

| 機能 | 内容 | 提供範囲 |
|---|---|---|
| Logpush | Cloudflare のログをストレージ・セキュリティ・分析の送信先に配信する | 従来は Enterprise のみ。**Free / Pro / Business にセルフサービス・従量課金**で提供 |
| Logpush Transformers | SQL でレコードの絞り込み、機微情報の伏字化、イベントの付加情報追加、ログの整形を配信前に行う（別途 ETL パイプライン不要） | **全顧客向けに GA** |
| Custom Dashboards | 重視する指標を並べた個人向けビュー | **全顧客**（2026-04-22 の changelog） |

Logpush のデータセットも拡大しており、アカウント単位の firewall events、WebSocket analytics、ゾーン単位のポスト量子可視性が最近追加された。

### 大規模運用のための新しい道具

#### RBAC の拡大

この1年で RBAC（ロールベースアクセス制御）は全製品・全顧客に大きく広がった。現在はほぼすべての製品でアカウント単位・ゾーン単位のロールがあり、最近は Workers も、R2 と Access に続いて**個別リソース単位**のロールに対応した。管理者は、チームの誰がどの Worker にアクセスできるかを個別に決められる。

#### 複数アカウント

細かい RBAC はアカウントの一部を管理する手段だが、少数のスーパー管理者が「誰に何を許すか」を決める構造は、管理対象が増えると組織のボトルネックになる。ゾーン・Worker・ストレージ製品が数百〜数千に及ぶ顧客には、単一アカウントモデルは窮屈になる。そこで複数アカウントの管理機能を拡充している、というのが記事の説明である。

- **New Account ボタン**: 先月（2026年8月）、ダッシュボードに静かに追加された。追加のアカウントを直接作成できる初めての機能で、毎週数千の顧客が別アカウントに分けているという。作られるのは新しい無料の Cloudflare アカウントで、OSS プロジェクトの分離や、組織内の複数チームの分離に使える。各アカウントは**独立して請求される**ため、コストセンターごとに支出を分けられる。不正・悪用を防ぐ安全策も入っている。
- **Enterprise 向け**: ボタンは全員向けだが、当面 Enterprise 顧客はアカウントチームに依頼してアカウントを払い出してもらうことを推奨している。既存の Enterprise 契約とサブスクリプションをすべてのアカウントで再利用できるため。アカウント数に事前の上限はなく、今後セルフサービス化する機能を追加する予定。

![Create an Account ダイアログ（Account name 入力欄、Cancel と Create Account ボタン）](https://blog.cloudflare.com/_emdash/api/media/file/01M3XD0G82WC9FV8GAF2Y6GBKQ.png)
*図: 「Create an Account」ダイアログのスクリーンショット（出典: Cloudflare Blog https://blog.cloudflare.com/enterprise-for-all-update/ 。原文に alt テキストやキャプションはなく、New Account ボタンの説明の直後に置かれた画像から筆者が説明を補った）*

#### Organizations

複数アカウントを作った後の整理・追跡の仕組みが [Organizations](https://blog.cloudflare.com/organizations-beta/) である。アカウントをまとめ、単一の分析画面と共有設定の面を持つ。

- 提供状況: Enterprise 顧客向けにベータ中、**10月に GA**、無料アカウントへは**2027年初頭**。
- 共有管理者、統合された分析と監査ログ、共有の **WAF・Gateway・Access IdP 設定**を提供する。
- Enterprise は**ちょうど1つ**の Organization を持てる。会社の資産を1か所で見渡せるようにし、CISO や CTO などの経営層に統合された可視性を与えるため。
- 設定方法: 少なくとも1つのアカウントのスーパー管理者で、まだ誰も組織を作っていなければ直接作成できる。既に作られている場合は、社内の他の管理者に自分のアカウントの追加を依頼する。この手順により、新しい管理面を重ねても権限昇格が起きないようにしている。

![Organization が複数の Account（Team A/B/C）を束ね、共有管理者・統合分析・共有 WAF/Gateway/Access IdP 設定を提供し、各アカウント内で Account/Zone/Resource RBAC を適用する構成図](https://blog.cloudflare.com/_emdash/api/media/file/01M3XD0HAXDB7XP7H1SY1K9JZX.png)
*図: Organization 配下のアカウントとリソース、RBAC の適用範囲を示す構成図。上段の Organization には Shared administrators・Unified analytics・Shared WAF config・Gateway config・Access IdP config が並び、下段の Team A / B / C の各アカウントに Zone（例: shop.example.com）、Worker（例: checkout-api）、Access App（例: admin-portal）が入り、Account RBAC・Zone RBAC・Resource RBAC のバッジが付く（出典: Cloudflare Blog https://blog.cloudflare.com/enterprise-for-all-update/ 。原文にキャプションはなく、画像内のラベルに基づいて筆者が説明を補った。本文では「How we use it all at Cloudflare」節の中に置かれている）*

#### Terraform と Tags

複数アカウント・組織・RBAC を整えたら、それを監査可能で再現可能な形で管理する必要がある。Terraform（Infrastructure as Code）はそのための手段で、この1年で Cloudflare は **API から機械的に生成される Terraform provider** を作り、常に最新の Cloudflare API に追随できるようにした。Terraform も他の機能と同様に、Enterprise かどうかを問わず全顧客が使える。

また [Resource Tagging](https://developers.cloudflare.com/changelog/product/resource-tagging/) により、アカウントと Organization 内の幅広いリソースにキー・バリューのタグを付けられる。現時点ではダッシュボードまたは API で付与でき、ダッシュボード内での整理に役立つ。将来は課金やアクセス制御でもタグを使えるようにし、Terraform からも管理できるようにする意向。

### Cloudflare 社内での使い方

- チームまたはサービスの性質に応じて、チームごと・サービスごとにアカウントを作る。
- Terraform でアカウントのアクセスと本番設定を管理し、ピアレビューされた監査可能な変更経路にする。
- アカウントのスコープが狭いので、そのアカウントを担当するエンジニアに広い権限を与えつつ、影響範囲（blast radius）を抑えられる。中央の管理者がボトルネックにならず、オンコール対応も速く安全になる。
- すべてのアカウントは Cloudflare の Organization に属し、セキュリティチームがすべてのアカウントへの管理アクセス、分析、ポリシー管理、共有設定を持つ。
- Resource Tagging は社内で有効化済みで、WAF ルールや R2 バケットなどを見つけやすくするためにチームが展開し始めている（記事は「まだ初期段階」としている）。

### さらに全員向けになった機能

- SCIM 関連: Authentik identity provider のサポート、SCIM 監査ログ、SCIM 2.0 Group Sync（いずれもかつては何らかの形で Enterprise 専用だった）
- **MCP Server Portals** が GA
- ネットワーク管理のセルフサービス化: **Network Overview ページ**と **Unified Routing** が全員向けに利用可能に

### 無料から始める: Code Orange: Fail Small

今年の [Code Orange: Fail Small](https://blog.cloudflare.com/code-orange-fail-small-complete/) の一環として、新しいコードを**トラフィックのコホート単位で、無料顧客から順に**ロールアウトする方針を発表した。その結果、**新たな Enterprise 専用機能は導入しない**ことを約束している。ただし [Cloudflare for Government](https://blog.cloudflare.com/fedramp-class-d-certification/) のように本質的に Enterprise 志向のものは例外になる。

### 無料・Pay-as-you-go 向けのその他の進捗

#### Billable Usage ダッシュボードと API

8月に導入した [Billable Usage ダッシュボードと API](https://blog.cloudflare.com/billable-usage-api/)（[Wiki](./2026-08-03-billable-usage-api.md)）により、Enterprise 以外の顧客は支出額を確認し、消費データを Vantage などのサードパーティツールやオフラインで利用できる。予期しない請求を避ける**予算アラート**は既定で有効。**ハードな支出上限**は試作中で、2026年第4四半期に早期提供予定。Enterprise 顧客は契約条件や支払い方法の差が大きいため、この体験はまだ提供されておらず、2027年に発表を見込んでいる。

#### 全顧客に適用される上限引き上げ

| 製品 | 引き上げ内容（旧 → 新） |
|---|---|
| Workers | 起動時間 400 ms → 1 秒、WebSocket メッセージ 1 MiB → 32 MiB、リクエストあたりサブリクエスト 1,000 → 100万、Worker サイズ（非圧縮）10 MB → 64 MiB、同時接続数制限を緩和 |
| Dynamic Workers | 有料 Workers アカウントで利用可能（以前は先行アクセス限定）。Durable Object あたり in-flight リクエストを持つ Dynamic Workers を 4 → 10 |
| Containers | メモリ 400 GiB → 6 TiB、vCPU 100 → 1,500、ディスク 2 TB → 30 TB。全 Containers アカウントでカスタムインスタンスサイズ作成可（以前は一部 Enterprise のみ）。ディスクは任意のメモリサイズで最大 20 GB（以前はメモリ 1 GiB あたり 2 GB） |
| Workflows | 同時インスタンス 4,500 → 50,000、作成 10 → 300 インスタンス/秒、Workflow あたりキュー 100万 → 200万、1 インスタンスの最大ステップ数 1,024 → 25,000、ストリーム出力は 1 MiB → インスタンスストレージ上限まで |
| Browser Run | 同時ブラウザ 30 → 200、起動 30/分 → 3/秒、Quick Actions 10 → 30/秒、REST API 3 → 10 リクエスト/秒、セッションあたり同時クライアント 1 → 複数 |
| Vectorize | 1 インデックスあたり 500万 → 2,000万ベクトル、topK 20 → 50 |
| Pages | 静的アセット 20,000 → 100,000 |
| AI Search | ベクトルあたりのメタデータ 500 文字（テキスト項目ごと）→ 10 KiB |
| HTTP ヘッダー | 32 KB → 128 KB |
| Rules Engine | `concat()` の引数 16 → 32 |
| API Shield | ゾーンあたり JWT 検証設定 4 設定×4 鍵 → 32 設定×16 鍵 |
| Durable Objects | アクティブな外向き接続がある間は最大 15 分生存可（以前は受信トラフィックなしで 70〜140 秒後に退避対象）、検索 API の名前長 20 → 128 文字 |
| Security Insights | セキュリティスキャンを Free で7日ごと、Pro / Business で3日ごと、Enterprise で毎日。オンデマンドスキャンは全プランで可能 |

### 今後と、試せること

記事は、Dane の誓約はまだ道半ばだが、そこに到達するつもりだとまとめている。読者への呼びかけは次のとおり。

1. 追加のアカウントを作り、組織の関心事を分割する。
2. RBAC でゾーン・アカウント単位のセキュリティポリシーを定義する。
3. Enterprise 顧客は Organization を作成してアカウントを取り込む（それ以外の顧客は2027年初頭）。
4. Terraform で組織全体の状態を管理する。
5. 翌月開催の [Cloudflare Connect](https://www.cloudflare.com/connect/) に参加する。

## コード例

記事に本文中のコードブロックはない。ただし Terraform の節に、provider の初期化を示すコード画像（`provider.tf`）が1点掲載されている。画像の内容を書き起こすと次のとおり。

```hcl
# This code block pulls the binary from the HashiCorp registry and
# initializes the Terraform workspace.
terraform {
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "5.25.0"
    }
  }
  required_version = ">= 1.5"
}
```

![provider.tf のスクリーンショット](https://blog.cloudflare.com/_emdash/api/media/file/01M3XD0F3420DHNPRGD2TNRGCH.png)
*図: Terraform provider の宣言（`provider.tf`）の画像（出典: Cloudflare Blog https://blog.cloudflare.com/enterprise-for-all-update/ 。原文にキャプションはなく、画像内のコードと直前の本文に基づいて筆者が説明を補った）*

`required_providers` で `cloudflare/cloudflare` を `5.25.0` に固定し、Terraform 本体は `>= 1.5` を要求している。HashiCorp のレジストリから provider バイナリを取得し、ワークスペースを初期化するための最小構成である。

## ユースケース

- **ログを外部の分析基盤へ送りたい小規模チーム**: Logpush が Free / Pro / Business でも従量課金で使えるため、契約なしで SIEM やストレージにログを流せる。Transformers で不要なレコードの除外や機微情報の伏字化を配信前に行える。
- **複数チームのコストを分けたい組織**: New Account ボタンでチームごとにアカウントを作ると、各アカウントが独立して請求され、コストセンター別に支出を分けられる。
- **OSS プロジェクトを複数持つ個人・コミュニティ**: プロジェクトごとにアカウントを分離できる。
- **Enterprise のセキュリティ・経営層の可視化**: 1つの Organization に全アカウントを集め、共有の WAF・Gateway・Access IdP 設定と統合された分析・監査ログで、CISO や CTO に単一の視点を提供する。
- **変更を監査可能にしたい運用チーム**: アカウントを細かく分け、Terraform でアクセスと本番設定をコード化し、ピアレビューを経て変更する（Cloudflare 社内の運用と同じ形）。
- **大規模なエージェント・ワークロード**: Workflows、Containers、Browser Run などの上限引き上げにより、契約の変更なしにより大きなスケールを試せる。

## 所感・ポイント

- 記事は「全機能を全員に」を**達成済みとは言っていない**。「進捗報告」であり、Organizations は GA が10月、無料アカウントへは2027年初頭、ハードな支出上限は2026年第4四半期に早期提供、Enterprise 向け Billable Usage は2027年と、まだ予定のものが多い。日付付きの約束として読むとよい。
- 「Enterprise 専用の新機能は作らない」という約束は、機能の出し方（無料顧客から順に展開する Code Orange: Fail Small）とセットで語られている点が特徴。機能の可用性だけでなく、リリースプロセスの話でもある。
- 複数アカウント + Organization + RBAC + Terraform という構成は、Cloudflare 社内の運用をそのまま製品化した形として説明されている。自社の運用を設計する際の参照モデルとして使いやすい。
- 上限引き上げの一覧は量が多いが、各項目は changelog への個別リンクで裏づけられている。自分のワークロードに関係する製品だけ、旧上限と新上限を確認するのが現実的。
- 画像は4点: ヘッダーの装飾イラスト、New Account のダイアログ、Terraform の `provider.tf`、Organization の構成図。いずれも原文にキャプションがないため、筆者が説明を補った（図中の文言は画像から転記）。
- 中心は料金プランや機能開放の方針とダッシュボード・設定の話で、Workers 上で最小実装として体験できる単一の機能ではないため、`examples/` のサンプルは作成していない（サンプル対象外）。

## 関連リンク

- 原文: https://blog.cloudflare.com/enterprise-for-all-update/
- 前年の発表（Dane Knecht、2025年）: https://blog.cloudflare.com/enterprise-grade-features-for-all/
- Logpush: https://developers.cloudflare.com/logs/logpush/
- Logpush Transformers: https://developers.cloudflare.com/logs/logpush/transformers/
- Custom Dashboards GA: https://developers.cloudflare.com/changelog/post/2026-04-22-custom-dashboards-ga/
- New Account ボタン: https://developers.cloudflare.com/changelog/post/2026-08-04-free-dashboard-button/
- Organizations（ベータ）: https://blog.cloudflare.com/organizations-beta/
- Enterprise 向け Organization の設定: https://developers.cloudflare.com/fundamentals/organizations/for-enterprise/#set-up-your-organization
- Resource Tagging: https://developers.cloudflare.com/changelog/product/resource-tagging/
- MCP Server Portals GA: https://developers.cloudflare.com/changelog/post/2026-09-24-mcp-portals-ga/
- Network Overview: https://developers.cloudflare.com/changelog/post/2026-04-21-network-overview-page/
- Unified Routing GA: https://developers.cloudflare.com/changelog/post/2026-09-18-unified-routing-ga/
- Code Orange: Fail Small: https://blog.cloudflare.com/code-orange-fail-small-complete/
- Cloudflare for Government（FedRAMP）: https://blog.cloudflare.com/fedramp-class-d-certification/
- Billable Usage API: https://blog.cloudflare.com/billable-usage-api/（[Wiki](./2026-08-03-billable-usage-api.md)）
- Cloudflare Connect: https://www.cloudflare.com/connect/
