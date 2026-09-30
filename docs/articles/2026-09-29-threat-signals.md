# Threat Signals のご紹介: オープンソース脅威インテリジェンスのためのエージェント型スキル（全 Cloudflare アカウントで無料）

- 原文: [https://blog.cloudflare.com/threat-signals/](https://blog.cloudflare.com/threat-signals/)
- 日本語版の出どころ: Cloudflare公式の日本語版（`https://blog.cloudflare.com/ja-jp/threat-signals/`）は確認時点で存在しなかった（404）ため、英語版（en-us）から日本語化して要約している。公開日は英語原文の datePublished（2026-09-29）に従う。
- 公開日: 2026-09-29
- 位置づけ: Birthday Week 2026 の記事
- 著者: Emilia Yoffie、Victor Niño、Brian Seel、Jacob Crisp
- 関連: 本記事を含む同日の発表を束ねる枠組み記事 [AI 時代の適応型アプリケーションセキュリティ](./2026-09-29-ai-era-framework.md)、同じ Birthday Week のセキュリティ系記事として [Cloudflare Application Profiles でポジティブセキュリティを実現する](./2026-09-29-application-profiles.md)。エージェント向けスキルの文脈では [EmDash プラグインレジストリ](./2026-09-28-emdash-cms-plugin-registry.md)（EmDash Agent Skills に言及）も参照。
- GitHub: [docs/articles/2026-09-29-threat-signals.md](https://github.com/syumai/cloudflare-blog-summaries/blob/main/docs/articles/2026-09-29-threat-signals.md)

## TL;DR

- Cloudflare は **Threat Signals** を提供開始した。ユーザーが選んだオープンソースの脅威レポート（RSS フィード）を、エージェント型スキル（AI skills）で要約・タグ付けし、侵害指標（IOC）を抽出・正規化する。
- 結果は、アカウント専用の非公開 Threat Intelligence データセットに **Threat Event** として保存され、そのまま WAF ポリシーで使える。
- Cloudforce One の **Threat Events Platform** が全 Cloudflare アカウントで無料になった。フィード 1 本、最長 30 日のデータ保持、API とダッシュボードが含まれる。Enterprise（Essentials / Advantage / Elite）はフィード数の拡張、独自データセット、カスタムスキル、カスタム WAF ルールなどを追加できる。
- 設計上の学び: タグはアカウントの既存タグカタログに限定する、自動／手動の別を記録する、イベントと元レポートのリンクが最も重視された。
- ダッシュボードの Application Security → Threat Intelligence → Threat Signals から RSS フィードを追加して使い始められる。

## 背景・課題

脅威インテリジェンスのアナリストやネットワーク防御担当者は、構造化された脅威フィードの取り込みを自動化して SIEM や WAF を強化してきた。難しいのは、非構造化のレポートである。研究ブログの記事から、ツールが使える指標へ変換しつつ、「なぜその指標が重要か」という文脈を保つ作業は人手に頼ってきた。

1 本のレポートごとに、次の作業が必要になる。

1. レポートを読んで要約する
2. 関連する指標を見つける
3. 指標の値を統一形式に変換する
4. 社内の分類体系でタグを付ける
5. 脅威インテリジェンスプラットフォーム（TIP）に登録する
6. 元のソースへのリンクを残す
7. セキュリティチームに共有する

これを多数のソースに対して繰り返すのは時間がかかり、ほとんどの工程が人の判断に依存する。結果として文脈が失われ、数週間後にドメインがブロックリストに追加されても、誰も理由を分からない状態が起きる。また、既存のプラットフォームは 100 本程度の RSS フィードのポーリングが上限で、スケールしないという声が顧客から寄せられていた。

## 発表内容 / アーキテクチャ

### スキルとは

記事は、スキルを「経験豊富なアナリストがある作業をどう進めるかを記した、詳細な指示のまとまり」と説明する。どのレポートでも同じ手順で実行される点が特徴である（記事は Cloudflare 開発者ドキュメントの Agent Skills の解説にリンクしている）。Threat Signals は、この手順を大規模に実行する仕組みである。

### 全アカウント向けの提供内容

Threat Events Platform は Cloudforce One の中核の脅威インテリジェンス製品で、全 Cloudflare アカウントに無料で開放された。各アカウントには次が含まれる。

- Threat Signals への API・ダッシュボードアクセスと、RSS フィード 1 本の選択
- その RSS フィードから作られる、要件に合わせた非公開データセット（最長 30 日保存）
- データセットに関連するイベント・指標・タグを調べるための Threat Events Platform への API・ダッシュボードアクセス

Enterprise の Essentials / Advantage / Elite の顧客は、RSS フィード数の拡張、Cloudforce One 独自の脅威インテリジェンスデータセットへのアクセス、カスタムスキルの生成、Threat Signals が生成する要約データの保存容量の拡大、オープンソース／独自の脅威イベントに対するカスタム WAF ルールの作成が可能になる。

![Threat Signals の RSS フィード一覧画面](https://blog.cloudflare.com/_emdash/api/media/file/01M3MS5RVRQZQJ39ZA0TQNAJKX.01M3MS5TFC9QGR4PM3QNQM2VRJ.png)
*図: Threat Signals の Feeds & Articles タブ。左に Cloudflare Blog / Dark Reading / Hacker News / News Hacks / Security Affairs などのフィードとタグ一覧、右に記事（Unread / Read の状態、AI SUMMARY、自動付与されたタグ）が並ぶ（出典: Cloudflare Blog https://blog.cloudflare.com/threat-signals/。原文の説明は "A view of Threat Signals displaying collected RSS feeds" のみで、画面内の詳細な記述は画像の内容から筆者が書き起こした）*

### 仕組み

1. **フィード登録**: RSS フィードに名前とカテゴリを付け、新着確認の頻度を設定する。RSS 2.0、Atom、RSS 1.0/RDF の 3 形式に対応する。
2. **Workflow でポーリング**: 選択した各フィードは Cloudflare Workflows の Workflow に入り、定期的に新着記事を確認する。
3. **本文取得**: Browser Run の Markdown クイックアクションで記事本文を取得して読みやすい Markdown に整形し、R2 に保存する。
4. **スキルによる処理**: 本文を IOC 抽出器と、Cloudforce One が定義した既定のスキル群に渡す。スキルは内容を要約し、アカウントの設定に基づいてタグを付け、IOC ごとに文脈（コンテキスト）を付加する。
5. **出力**: 簡潔な要約とキーポイント（何が起きたか、誰が影響を受けたか、なぜ重要か）が得られ、すべて検索可能でタグ付けされる。
6. **Threat Event との結びつき**: 抽出された各指標は、アカウント専用の非公開 Threat Signals データセット内の脅威イベントに裏付けられる。イベント、指標、タグ、元のレポートは互いにつながったままで、アナリストは情報の出どころと理由をたどれる。
7. **WAF への適用**: これらの指標から、脅威イベントをもとに WAF ルールを作成してアプリケーションやインフラを保護できる。

![要約とキーポイント、文脈付き指標が表示された記事画面](https://blog.cloudflare.com/_emdash/api/media/file/01M3MS5RVCKAZSECM8B8ZNZPTW.01M3MS5SPC5G9T6W74C1SSVNM3.png)
*図: MikroTik RouterOS の攻撃チェーンに関する記事の詳細画面。タグ（VPN GATEWAY、AUTHENTICATION BYPASS、CVE 番号など）、AI Summary、Key Points（What happened / Who is affected / Impact）、IOC context（例: 指標 82.192.72.4、Role: Command and control、Confidence: High、根拠の説明）が表示されている（出典: Cloudflare Blog https://blog.cloudflare.com/threat-signals/。原文の説明は "Threat Signal article summarized with key points and contextualized indicators" のみで、画面内の詳細な記述は画像の内容から筆者が書き起こした）*

### 設計上の学び

最初の版は、あるアナリストが 1 週間で作った社内プロトタイプだった。RSS を取得して正規表現で IP を抜くスクリプトは簡単に書ける。難しかったのは、アナリストが信頼して使える出力にすることだった。

- **語彙の一貫性**: AI に自由にタグを作らせると、既存の語彙と新しい語彙の 2 つを突き合わせる手間が生じる。そこで AI のタグ付けを、各アカウントの既存タグカタログに限定した。
- **付与元の透明性**: タグが自動で付いたのか、アナリストが付けたのかの記録は地味だが必須だった。どのタグが自動で付いたかを見られると、自動タグ付けへの信頼が高まった。
- **イベントと元レポートのリンク**: 要約は最初に目に入るが、初期テストでアナリストが繰り返し戻ってきたのは、イベントと元レポートをつなぐリンクだった。調査を進める中で、各指標がなぜ重要だったかを追う助けになった。

### 今後

RSS 以外にも、さまざまな形式・パイプラインの脅威情報を取り込めるよう、データ取り込みパイプラインを増やす予定。

## コード例

記事本文にコードブロックやスキル定義（SKILL.md など）の引用は含まれていない。そのため、コードの代わりに上記「仕組み」で処理の流れ（RSS → Workflow → Browser Run の Markdown 取得 → R2 保存 → IOC 抽出器とスキル → Threat Event → WAF ルール）を整理した。API の詳細は記事がリンクする Cloudflare API ドキュメント（threat_signals）を参照。

## ユースケース

- **オープンソースレポートの自動トリアージ**: 研究者のブログやニュースの RSS を登録し、要約・タグ・IOC を自動で得る。
- **指標の WAF への適用**: 抽出した IOC（例: コマンド＆コントロールの IP アドレス）を、脅威イベントから WAF ルール化して保護する。
- **調査時の出どころ追跡**: イベント・指標から元レポートをたどり、ブロックリスト上のエントリがなぜ存在するかを後から確認する。
- **自社タクソノミーに沿ったタグ付け**: 既存タグカタログだけを使った自動タグ付けで、社内の分類と揃える。
- **Enterprise でのカスタム化**: 独自スキルの生成、複数フィード、独自データセットの活用。

## 所感・ポイント

- 「スキル」を人手の専門知識の再現可能な形（手順書）として使い、Workflows・Browser Run・R2 といった Cloudflare のプリミティブの上で回す構成が、エージェント型スキルの実運用例として読める。
- 自動化の成否を分けたのは AI の精度そのものより、語彙の制限、付与元の記録、元レポートとのリンクといった「信頼できる出力にするための設計」だったという学びが印象的。
- 無料枠は RSS 1 本・30 日保存なので、まず小さく試す用途になる。複数フィードやカスタムスキル、カスタム WAF ルールは Enterprise の機能。
- **サンプル対象外**: 本記事の中心は Cloudforce One 定義のスキルと IOC 抽出器を含む Cloudflare 提供のマネージド機能（ダッシュボード・API）であり、Workers 上で 100 行程度で要点を再現できる最小実装ではないため、デプロイ可能な `examples/` は作成していません。
- 画像のキャプションは原文に短い説明文しかないため、画面内の詳細は画像の内容から筆者が補った（各図の注記を参照）。記事のヘッダー画像はタイトルを載せた装飾画像のため掲載していない。

## 関連リンク

- Agent Skills（Cloudflare 開発者ドキュメント）: https://developers.cloudflare.com/docs-for-agents/#agent-skills
- Threat Events（Cloudforce One）: https://developers.cloudflare.com/security-center/cloudforce-one/#analyze-threat-events
- Cloudflare WAF: https://www.cloudflare.com/products/waf/
- Threat Events Platform（ブログ）: https://blog.cloudflare.com/cloudflare-threat-intelligence-platform/
- Workflows: https://www.cloudflare.com/products/workflows/
- Browser Run: https://developers.cloudflare.com/browser-run/
- R2: https://www.cloudflare.com/products/r2/
- 脅威イベントから WAF ルールを作成（changelog）: https://developers.cloudflare.com/changelog/post/2026-06-08-create-waf-rules-from-threat-events/
- Threat Signals API ドキュメント: https://developers.cloudflare.com/api/resources/cloudforce_one/subresources/threat_signals/
- Cloudforce One の脅威インテリジェンス調査: https://www.cloudflare.com/cloudforce-one/research/
- 本リポジトリ内の関連記事: [Application Profiles](./2026-09-29-application-profiles.md) / [EmDash プラグインレジストリ](./2026-09-28-emdash-cms-plugin-registry.md)
- 本リポジトリ内の枠組み記事: [AI 時代の適応型アプリケーションセキュリティ](./2026-09-29-ai-era-framework.md)
