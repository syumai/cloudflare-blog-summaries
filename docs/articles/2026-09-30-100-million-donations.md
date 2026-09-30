# Cloudflare Impact が寄付（提供サービス）1億ドルに到達

- 原文: [https://blog.cloudflare.com/100-million-donations/](https://blog.cloudflare.com/100-million-donations/)（日本語版なし。ja-jp URL は 404 のため、en-us 版から日本語化した）
- 公開日: 2026-09-30（Birthday Week 2026。英語原文の datePublished は 2026-09-30T13:01:55Z）
- 位置づけ: Birthday Week 2026 の記事。タグは Birthday Week / Impact / Project Galileo
- 関連: [Cloudflare 2026年度創業者レター](./2026-09-27-cloudflares-2026-annual-founders-letter.md)（同じ Birthday Week 2026 の総論）、[The Cold Start](./2026-09-28-introducing-the-cold-start.md)（同じ週のスタートアップ向け企画）、[Cloudflare Ambassadors、Community Engineers を発表](./2026-08-07-community-program-refresh.md)（コミュニティ・オープンソースへの投資）
- GitHub: [docs/articles/2026-09-30-100-million-donations.md](https://github.com/syumai/cloudflare-blog-summaries/blob/main/docs/articles/2026-09-30-100-million-donations.md)

![記事ヘッダー画像](https://blog.cloudflare.com/_emdash/api/media/file/01M3RZ3WTX78RCB7KKEB1T8J44.01M3RZ3XRZSENAMJGQMGNWZDHZ.png)
*図: 「100M」の文字のまわりに望遠鏡・建物・本と芽・文書とペン・拡声器が並ぶ装飾イラスト。内容を説明する図ではない（出典: Cloudflare Blog https://blog.cloudflare.com/100-million-donations/）*

## TL;DR

- Cloudflare の Impact プログラムが、今週（Birthday Week）で**提供サービス換算 1 億ドル**の寄付に到達する。ジャーナリズム、市民社会、州・地方政府、選挙管理機関、公立学校など、数千の組織をサイバー攻撃から守っているという。
- 記事の主張は「Impact は慈善ではなく、事業とミッションの根幹」。Cloudflare は無料サービスから始まり、無料顧客の中に重要な活動をしつつ大規模な攻撃も受ける組織がいると気づいて、Project Galileo（2014 年）などへ発展した。
- Project Galileo は 120 か国超・3,500 ドメイン超。2025 年に 385 億件超の攻撃（1 日あたり約 1 億 540 万件）をブロック。2026 年に初の市民社会向け攻撃レポートを公開し、Galileo 参加者は脆弱性悪用の試行を平均の 7 倍超の割合で受けていた。
- 今後は防御にとどまらず、AI 時代に適応するための支援へ広げる。9 月にバルセロナでジャーナリスト向けハッカソンを共催し、AI クローラー対策、非営利スタートアップ向けクレジット、人権団体向け自動化ツールなどを挙げている。

## 背景・課題

Cloudflare はもともと「基本機能を開発者や小規模事業者に無料で提供し、攻撃に関するデータをもとに有償の高度な製品を作る」という発想で始まった。ところが無料顧客の中に、アフリカの汚職やクリミアをめぐるロシアの侵攻を報じるなど、重要な活動をしながら、ネットワーク上でも最大級の攻撃を受けている組織がいることが分かった。

この気づきが、無料提供を続けるだけでなく、「公共のために活動するがゆえに強力な攻撃者に狙われる組織」へさらに手厚い支援をする、という方針につながった。本記事は、16 回目の Birthday Week にあわせて、その歩みと現在の広がりを振り返る位置づけである。

## 発表内容 / 記事の構成

本記事は技術発表ではなく、プログラムの節目を振り返る記事である。構成は次のとおり。

### 1. Free → Impact（プログラムの成り立ち）

- **Project Galileo（2014）**: ジャーナリスト、人権擁護者、市民社会団体など、重要だが脆弱なオンラインの人・組織に高度なセキュリティを提供する。現在は 120 か国超で 3,500 ドメイン超。2025 年には DDoS・Web 脆弱性・メールフィッシングなどの攻撃を 385 億件超ブロックした（1 日あたり約 1 億 540 万件）。
- **Athenian Project（2017）**: 民主的な選挙を運営する州・地方政府向け。米国 33 州の 440 超のサイトを保護。のちに米国外へ拡大し、カナダ、北マケドニア、ジョージア、モルドバなど 8 か国の選挙管理機関を保護している。
- **Cloudflare for Campaigns（2020）**: Defending Digital Campaigns と提携し、公職候補者に無料のセキュリティを提供。米国で 530 超のサイト。
- **重要インフラ向けの拡張**: 公立学校（CyberSafe Schools）、COVID-19 対応、ウクライナ政府、公衆衛生クリニック、コミュニティネットワーク、その他の必須サービス。

### 2. 市民社会への攻撃レポート

2026 年、Cloudflare は初の年次レポート「市民社会に対するサイバー攻撃」を公開した。市民社会の組織は他の Cloudflare 顧客よりも頻繁かつ激しく狙われており、Project Galileo 参加者が受けた Web サイトの脆弱性悪用の試行は、平均的なユーザーの 7 倍超の割合だった。Galileo への申込数も、前年の 2 倍を超えるペースだという。

*図（画像引用なし）: 画像は記事中にインライン埋め込み（data URI）されており、`blog.cloudflare.com` 上の個別の画像URLを取得できなかったため、画像としては引用せず内容のみ記す。原文の代替テキストは「Breakdown of website vulnerability exploit attempts against Project Galileo participants by organization type. Source: 2026 Cloudflare report on cyberattacks against civil society」。グラフ内の見出しは「Average probes for security weaknesses, per organization」（組織あたりの平均探索回数）で、Media 4.49M、Environmental 2.70M、Human Rights 2.13M、Social Welfare 1.65M と、メディア組織が最も多い（出典: Cloudflare Blog）*

### 3. これから: 防御から「AI 時代に適応する支援」へ

- **バルセロナのハッカソン**: 2026 年 9 月初旬の雨の日、Cloudflare は Media Party（メディア革新を扱う非営利団体）の 3 日間のカンファレンスの一部として、ジャーナリスト向けのハッカソンを共催した（会場は BIT Habitat、写真のキャプションでの日付は 9 月 9 日）。ジャーナリスト向けのイベントは初めて。AI 主導で「検索後」の情報環境に報道機関が適応するにはどうするか、という課題に対し、ワークフロー自動化、エージェント型ジャーナリズム、合成コンテンツの検証、情報の完全性の 4 テーマで取り組んだ。各チームは Cloudflare の開発者プラットフォームの無料アクセスとボランティアのエンジニアの支援を受けた。4 チームが決勝に進み、優勝は **AIdas**。同じ質問に複数の LLM がどう答えるかを比較し、応答をオープンデータとして記録することで、政治的に争点となるテーマでの AI のバイアスを研究者・ジャーナリストが調べられるツールである。
- **ハッカソン写真と AIdas の画面**: ハッカソン会場の写真はノートPCで作業する参加者を写したもの。AIdas の画面（インライン埋め込み）は、「AIdas: AI Drift & Alignment Scanner」という見出しで、最大 4 つのモデルを選び、「Russian Invasion of Ukraine」のような題材についてのプロンプトで比較する UI だった。画像キャプションは原文記載（「AIdas compares bias among AI models on politically contested topics and records them as public data.」）に基づく。

![Media Party ハッカソンの会場（バルセロナ）](https://blog.cloudflare.com/_emdash/api/media/file/01M3RVY4DRY4XEPDWN5Q698E2C.01M3RVY5A72360N6872TCA9TR9.jpeg)
*図: Media Party ハッカソン（Cloudflare 共催、BIT Habitat、バルセロナ、2026-09-09）。原文には同一キャプション「Media Party hackathon co-hosted by Cloudflare at the BIT Habitat in Barcelona」の写真が 3 枚あり、ここでは 1 枚のみ引用（出典: Cloudflare Blog）*

- **拡大中の取り組み**:
  - **ローカルニュースを AI クローラーから守る**: 前年、Project Galileo 参加者（750 超のジャーナリスト・独立系報道機関・報道支援の非営利団体を含む）に Bot Management と AI Crawl Control を無償提供。コンテンツへの AI クローラーのアクセスを把握・制御できる。
  - **非営利スタートアップ**: 前年の Birthday Week で、25 万ドル超の Cloudflare クレジットを提供するスタートアッププログラムを非営利組織にも開放。今週、最初に採択された 30 組織と、開発者プラットフォーム上で作ったツールを紹介する予定。
  - **人権団体向けの自動化ツール**: 今週、Cloudflare のエンジニアが開発者プラットフォームで作った 3 つのプロジェクトを発表する。対象は主要な人権団体 3 つで、国境を越えた弾圧の追跡、デジタル権利に関する法制度・政策の策定、企業の人権デューデリジェンスを扱う。

### 4. Join Us

筆者は、バルセロナでボランティアに参加した 2 人のエンジニアと話し、2 人とも「Project Galileo が入社理由の 1 つ」と語ったと述べる。Impact プログラムとミッションは、過去の実績ではなく、そこで働くことを選ぶ人々を通じて Cloudflare のアイデンティティを形づくり続けている、という締めくくりで、採用ページ（careers）へ誘導している。

## コード例

本記事は事業・社会貢献プログラムの節目を振り返る記事で、コード例・API・設定例は含まれない。代わりに、上記「発表内容」で各プログラムの対象・開始年・規模を整理した。

## ユースケース

コードの利用例ではなく、プログラムの対象（支援の受け手）を整理する。

- **報道機関・ジャーナリスト**: Project Galileo による防御、Bot Management / AI Crawl Control での AI クローラー制御、ハッカソンでの AI ツール開発支援。
- **人権団体・市民社会**: Galileo の防御、人権団体向け自動化ツール（移民・弾圧の追跡、法制度・政策、デューデリジェンス）。
- **選挙関係**: Athenian Project（州・地方政府・選挙管理機関）と Cloudflare for Campaigns（候補者）。
- **公立学校・クリニック・コミュニティネットワークなど**: 重要インフラ向けの拡張プログラム。
- **非営利スタートアップ**: 25 万ドル超のクレジットで開発者プラットフォーム上にツールを構築。

## 所感・ポイント

- 「1 億ドル」は現金の寄付ではなく、**提供したサービスの価値の累計**（donated services）という点に注意。本文でも "$100 million in donated services" と表現されている。
- 記事の主張は、Impact は慈善ではなく事業の根幹だという点にある。無料提供が攻撃データを集める土台になり、最大級の攻撃にさらされる組織の保護が製品の品質を高める、という Cloudflare の成り立ちの話と整合する。
- 攻撃の件数や 7 倍という比率は、Cloudflare 自身のデータに基づく記述で、詳細は別途の PDF レポートに依拠している。
- 同じ Birthday Week では、創業者レターが会社のミッションを、Cold Start が若い起業家への投資を語っており、本記事は「公共の利益のための提供」という側面を担う。
- サンプル対象外: 本記事は技術発表ではなく、Workers 上で動かす機能がないため、`examples/` のサンプルは作成していない。
- 画像について: 棒グラフと AIdas の画面は原文でインライン埋め込みのため、URL 参照ができず本文中で内容を文章で記した。ここに書いたグラフの数値は、埋め込み画像から読み取った値である。

## 関連リンク

- [Project Galileo](https://www.cloudflare.com/galileo/) / [Athenian Project](https://www.cloudflare.com/athenian/) / [Cloudflare for Campaigns](https://www.cloudflare.com/campaigns/) / [Defending Digital Campaigns](https://defendcampaigns.org/)
- [CyberSafe Schools](https://www.cloudflare.com/lp/cybersafe-schools/) / [Project Pangea（コミュニティネットワーク）](https://www.cloudflare.com/pangea/) / [Project Safekeeping](https://blog.cloudflare.com/project-safekeeping/)
- [Protecting Local News from AI Crawlers](https://blog.cloudflare.com/ai-crawl-control-for-project-galileo/) / [非営利向けスタートアッププログラム](https://blog.cloudflare.com/expanding-startups-for-nonprofits/)
- [Media Party ハッカソンのレポート](https://mediaparty.org/2026/09/09/inside-the-media-party-barcelona-hackathon-building-the-newsroom-tools-of-tomorrow/) / [AIdas](https://aidas-test.gazzetta.workers.dev/)
- [Cloudflare 採用情報](https://www.cloudflare.com/careers/)
- リポジトリ内: [Cloudflare 2026年度創業者レター](./2026-09-27-cloudflares-2026-annual-founders-letter.md) / [The Cold Start](./2026-09-28-introducing-the-cold-start.md) / [Cloudflare Ambassadors、Community Engineers](./2026-08-07-community-program-refresh.md)
- Workers サンプル: 技術発表ではないため対象外
