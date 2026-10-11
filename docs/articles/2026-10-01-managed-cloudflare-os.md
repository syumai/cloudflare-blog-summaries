# Cloudflare OS: 会社のエージェントワークスペースを、マネージドで提供

- 原文: [https://blog.cloudflare.com/managed-cloudflare-os/](https://blog.cloudflare.com/managed-cloudflare-os/)（原題: Cloudflare OS: your company's agent workspace, managed for you）
- 日本語版の出どころ: Cloudflare公式の日本語版（`https://blog.cloudflare.com/ja-jp/managed-cloudflare-os/`）は確認時点で存在しなかった（404）ため、英語版（en-us）から日本語化して要約している。タイトルも筆者による訳。公開日は英語原文の datePublished（2026-10-01T13:00:00Z）に従う。
- 公開日: 2026-10-01
- 著者: Phillip Jones
- 位置づけ: Birthday Week 2026 の記事（読了目安は原文表記で 4 分）。8 月に公開されたオープンソースの「Cloudflare OS」について、フルマネージド版のウェイトリスト開始と、その後 1 か月の機能追加（Git リポジトリのマウント、Google Workspace 連携、エクスポート形式）を伝える
- 関連: [Cloudflare OS：エージェント、アプリ、作業のためのオープンプラットフォーム](2026-08-05-cloudflare-os.md)（前身となる製品発表記事）、[Cloudflare OSで、Cloudflareの働き方を再構築する](2026-08-05-how-we-use-ai-with-cloudflare-os.md)（CIO 視点の社内導入記事）、[エージェントアクセスモデル（The Agent Access Model）](2026-08-05-the-agent-access-model.md)（エージェントへのアクセス権限の考え方）、[ID情報に基づく分析で、不正なAIの利用を検出](2026-08-05-identity-aware-ai-gateway.md)（AI Gateway の関連記事）、[WriteGuard: MCPサーバーのためのきめ細かな制御機能](2026-08-05-mcp-portal-writeguard-private-beta.md)
- GitHub: [docs/articles/2026-10-01-managed-cloudflare-os.md](https://github.com/syumai/cloudflare-blog-summaries/blob/main/docs/articles/2026-10-01-managed-cloudflare-os.md)

![記事ヘッダー画像](https://blog.cloudflare.com/_emdash/api/media/file/01M3T6WYAVKCKFV4H283DB38WS.png)
*図: 記事ヘッダー画像。ノート PC の画面にサイドバーと入力欄が描かれ、左右にアザラシの置物・スピーカー・ラバランプ、ペン立て・ロケット・多面体・デスクライトが並ぶ机の上の装飾イラスト（出典: Cloudflare Blog https://blog.cloudflare.com/managed-cloudflare-os/。原文にキャプションはなく、説明は見た目からの筆者の推定。装飾のため、図としては扱わない）*

## TL;DR

- Cloudflare OS（組織の全員が使える、会社のやり方とデータ・システムを知っているエージェントワークスペース）の**フルマネージド版のウェイトリスト**が始まった。
- ダッシュボードで数回クリックして、**カスタムドメイン**、適用する **Cloudflare Access ポリシー**、接続する **AI Gateway** を指定すれば、残りは Cloudflare が担当する。
- 8 月の発表以来、**数千の組織**がデータの活用、ドキュメント・スライドの作成、チーム向けツールの構築、エージェントによる業務自動化に使い始めている。
- この 1 か月の追加機能は 3 つ: **既存の GitHub リポジトリのマウント**（コードの探索・修正・PR 作成）、**Google Workspace 連携の強化**（Gmail の読み取り・下書き・送信、Drive の接続）、**多様な形式へのエクスポート**（xlsx / CSV / PDF / Markdown / HTML）。
- オープンソース版は引き続き利用でき、自分の Cloudflare アカウントにデプロイできる。

## 背景・課題

記事は、重要な顧客ミーティングの準備を例に挙げる。社内の進め方を調べ、CRM のアカウントを確認し、サポートチケットや製品の利用状況を見て、短いプレゼンにまとめる。この作業を月に 100 回繰り返すとしたら、という問いかけである。どのチームにも、このような「情報を集めて形にする」作業がある。

Cloudflare OS では、こうした作業をエージェントに任せることも、チーム向けのツールとして作ることも、状況に応じて行き来することもできる。ただし、オープンソース版を自分の Cloudflare アカウントにデプロイする場合は、**誰かがデプロイの設定・運用・更新を担当する必要がある**。この運用負荷が、マネージド版を出す動機になっている。

## 発表内容 / アーキテクチャ

### フルマネージド版（ウェイトリスト）

オープンソースのリポジトリからデプロイすれば完全な制御権を持てるが、設定・運用・更新を自分で行う必要がある。マネージド版では次のように役割が分かれる。

| 項目 | 利用者が決めること | Cloudflare が担当すること |
| --- | --- | --- |
| アクセス | 誰が Cloudflare OS を使えるか（Cloudflare Access ポリシー） | 残りの構成・運用・更新 |
| ドメイン | 使用するカスタムドメイン | 同上 |
| スキルとコンテキスト | どの組織固有のスキル・コンテキストを使えるか | 同上 |
| 接続先 | どのシステムに到達できるか、どの AI Gateway を接続するか | 同上 |

記事の表現では、ダッシュボードで数回クリックするだけで組織専用のエージェントワークスペースを立ち上げられるようになる（「you'll be able to」と未来形で書かれており、現時点ではウェイトリスト段階）。希望する組織は Cloudflare のウェイトリストに登録すると、連絡が来る。

### この 1 か月の機能追加

#### Git リポジトリのマウントとコードの操作

当初の Cloudflare OS は、ドキュメントやスライドの作成、タスクの自動化、共同作業ツールの構築といった、ソフトウェア開発以外の作業に焦点を当てていた。エージェントはアプリのコードを書けたが、既存の Git リポジトリのコードは扱えなかった。

今回、既存の GitHub リポジトリを Cloudflare OS に接続できるようになった。エージェントに依頼すると、コードベースの探索、バグ修正、機能追加、プルリクエストの作成ができる。ファイルの検索・編集、変更内容のレビュー、コミットの作成、GitHub への push も可能。

#### Google Workspace をまたいだ作業

多くの組織では、判断はメールのスレッド、文脈は Google Drive、分析は Sheets、調整は Calendar で行われる。エージェントもこれらをまたいで作業する必要がある、というのが背景。

Google Workspace の **Gatekeeper**（Cloudflare OS と外部サービスの間に入る、サービス固有の Worker。仕組みは[前身の記事](2026-08-05-cloudflare-os.md)を参照）を大きく改善した。Cloudflare OS は次のことができるようになった。

- Gmail のスレッドを**読んで調査**する
- 下書きを**作成**する
- メールを**送信**する
- Google Drive 全体、特定のフォルダ、個別のドキュメントやシートを**接続**する

#### 使い慣れた形式へのエクスポート

財務部門が Excel のスプレッドシートを必要とする、顧客に送る前にレポートを PDF にする、といった形式変換の需要に対応する。組み込みのドキュメント・プレゼンテーション・スプレッドシートの機能が、作成物に応じて次の形式へエクスポートできる。

| 形式 | 状況 |
| --- | --- |
| Microsoft Excel (.xlsx) | 利用可能 |
| CSV | 利用可能 |
| PDF | 利用可能 |
| Markdown | 利用可能 |
| HTML | 利用可能 |
| Microsoft Word (.docx) | 近日対応予定 |
| Microsoft PowerPoint (.pptx) | 近日対応予定 |

さらに、エージェントが作るツール自身が、独自のエクスポート形式を定義できる。記事の例では、「このスケジュールをカレンダーファイル（.ics）としてダウンロードできるようにして」とエージェントに伝えると、そのツールのエクスポートメニューに選択肢が追加される。

## コード例

本記事にはコード例は掲載されていない（製品発表・機能追加の紹介記事）。代わりに、上記「発表内容」の項で、マネージド版で利用者が指定する項目（カスタムドメイン・Access ポリシー・AI Gateway）と、追加された 3 機能の動作の流れを整理している。

## ユースケース

- **顧客ミーティングの準備**（記事の例）: 社内の進め方、CRM のアカウント、サポートチケット、製品の利用状況を集め、短いプレゼンにまとめる。
- **既存コードベースの修正**: GitHub リポジトリをマウントし、バグ修正や機能追加を依頼して、コミット・push・PR 作成まで任せる。
- **メール起点の調査と返信**: Gmail のスレッドを読んで調べ、下書きを作る。確認のうえ送信する。
- **経理・顧客向けの成果物の受け渡し**: 分析結果を .xlsx や CSV、PDF で書き出し、既存の業務フローにそのまま渡す。
- **運用負荷をかけずに全社展開する**: ドメイン・アクセス権・AI Gateway だけを決め、構成や更新はマネージド版に任せる。

## 所感・ポイント

- 本記事は新しい仕組みの解説ではなく、「運用を任せたい」という要望に応えるマネージド提供の予告と、機能追加のダイジェストという性格が強い。Gatekeeper や Dynamic Worker などの設計は[前身の記事](2026-08-05-cloudflare-os.md)側にある。
- マネージド版で利用者に残る判断は、**誰が使えるか（Access）・どの組織文脈を使うか・どこに到達できるか・どのモデル経路（AI Gateway）を使うか** の 4 点で、いずれもガバナンスに関わる部分。運用作業をベンダーに寄せつつ、統制の決定権は組織側に残す整理になっている。
- 現時点ではウェイトリスト段階で、提供時期・料金・対応リージョンなどは記事に書かれていない。
- コードのマウントや Gmail の送信は、前身記事で説明される Gatekeeper による制御（エージェントの参照した情報に基づく共有・外部送信の制御）と合わせて理解するとよい。具体的な権限モデルは[エージェントアクセスモデル](2026-08-05-the-agent-access-model.md)も参考になる。
- Word / PowerPoint のエクスポートは「近日対応予定」であり、現時点では未提供。
- 画像キャプション: ヘッダー画像は原文のキャプションが確認できず、説明は見た目からの筆者の推定。
- **サンプルについて**: 記事の中心はフルマネージド版（ウェイトリスト）とオープンソース版の機能追加の紹介で、記事内にデプロイ可能な最小実装を示せる情報（コードや設定）がなく、マネージド版は再現不能なため、デプロイ可能なサンプルは作成していない（サンプル対象外）。オープンソース版を試す場合は公式リポジトリを参照のこと。

## 関連リンク

- 原文（en-us）: [https://blog.cloudflare.com/managed-cloudflare-os/](https://blog.cloudflare.com/managed-cloudflare-os/)
- 本リポジトリ内の関連記事: [Cloudflare OS：エージェント、アプリ、作業のためのオープンプラットフォーム](2026-08-05-cloudflare-os.md) / [Cloudflare OSで、Cloudflareの働き方を再構築する](2026-08-05-how-we-use-ai-with-cloudflare-os.md) / [エージェントアクセスモデル](2026-08-05-the-agent-access-model.md) / [ID情報に基づく分析で、不正なAIの利用を検出](2026-08-05-identity-aware-ai-gateway.md) / [WriteGuard: MCPサーバーのためのきめ細かな制御機能](2026-08-05-mcp-portal-writeguard-private-beta.md)
- 記事内から張られているリンク:
  - [Cloudflare OS（ホーム）](https://os.cloudflare.app/)
  - [マネージド版 Cloudflare OS のウェイトリスト](http://cloudflare.com/resource/cloudflare-os-managed/)
  - [cloudflare-os（GitHub）](https://github.com/cloudflare/cloudflare-os)
  - [Cloudflare Access ポリシー](https://developers.cloudflare.com/cloudflare-one/access-controls/policies/)
  - [AI Gateway](https://www.cloudflare.com/products/ai-gateway/)
  - [Cloudflare Workers ドキュメント](https://developers.cloudflare.com/workers/)
  - [Cloudflare OS 発表記事（原文）](https://blog.cloudflare.com/cloudflare-os/)
