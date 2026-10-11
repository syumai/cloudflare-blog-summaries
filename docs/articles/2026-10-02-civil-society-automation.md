# 社会のために作る: 市民社会組織は Cloudflare で何を自動化しているか

- 原文: [https://blog.cloudflare.com/civil-society-automation/](https://blog.cloudflare.com/civil-society-automation/)
- 日本語版の出どころ: Cloudflare公式の日本語版（ja-jp）は確認時点で存在しなかった（404）ため、英語版（en-us）から日本語化して要約している。公開日は英語原文の datePublished（2026-10-02）に従う。
- 公開日: 2026-10-02
- 位置づけ: Birthday Week 2026 の記事（Impact / Project Galileo）
- 著者: Allie Funk、Jocelyn Woolbright
- 関連: [Cloudflare Impact が寄付1億ドルに到達](./2026-09-30-100-million-donations.md)（Impact プログラムの総論。本記事で紹介する「非営利スタートアップ」「人権団体向け自動化ツール」の予告元）、[Cloudflare 2026年度創業者レター](./2026-09-27-cloudflares-2026-annual-founders-letter.md)（同じ Birthday Week 2026 の総論）、[The Cold Start](./2026-09-28-introducing-the-cold-start.md)（同じ週のスタートアップ向け企画）、[Cloudflare Ambassadors、Community Engineers を発表](./2026-08-07-community-program-refresh.md)（コミュニティ・オープンソースへの投資）
- GitHub: [docs/articles/2026-10-02-civil-society-automation.md](https://github.com/syumai/cloudflare-blog-summaries/blob/main/docs/articles/2026-10-02-civil-society-automation.md)

![記事ヘッダー画像](https://blog.cloudflare.com/_emdash/api/media/file/01M3W896Z08YJWZG5GH6T03D67.png)
*図: 望遠鏡・建物・本・ラバランプ・医療物資のパラシュート・拡声器・歯車やブロックの箱などが並ぶ装飾イラスト。内容を説明する図ではない（出典: Cloudflare Blog https://blog.cloudflare.com/civil-society-automation/）*

## TL;DR

- Cloudflare は、市民社会組織が Cloudflare の開発者サービスで作ったツールを紹介している。提供したクレジットは合計 **750万ドル超**で、数十の組織が対象になっている。
- 組織のニーズは「既存アプリを守る」から「新しいアプリを作る」へ広がっている。Project Galileo は 120 か国超・**3,400 ドメイン超**を保護している。
- 昨年の Birthday Week で非営利にも開放したスタートアップ向けプログラム（1組織あたり最大 25 万ドルのクレジット）で、**最初の非営利コホート 30 組織**を選んだ。事例として LebTown、Kaya Guides、The Snorkelling Society を紹介している。
- 大規模な人権団体とは、Cloudflare のボランティアエンジニアが一緒にツールを開発している。Freedom House（越境弾圧の追跡）、Global Network Initiative（政策動向の把握）、Article One（人権リスク評価）の3件で、いずれも「人が判断に関与する」設計が強調されている。
- 本日から**第2コホートの募集**を開始した。申込フォームで「non-profit」にチェックを入れる。

## 背景・課題

Cloudflare は創業以来、セキュリティサービスを誰でも使えるようにし、公益のために活動する個人・組織が強い側によってオフラインに追い込まれないようにすることをミッションの一部としてきた。Project Galileo はその代表で、市民社会組織に無料でサイバーセキュリティを提供している。

参加組織との対話で、ニーズが変化していることが見えてきた。既存のアプリを守るだけでなく、AI を使って自分たちの業務に合わせた新しいツールを作りたい、という要望である。非技術系のチームでも、AI によってツールを設計・構築・拡張できるようになってきた。

一方で、この分野には厳しい事情がある。

- **資金面**: 政府資金の大幅な削減でレイオフやプログラム閉鎖が起きており、「少ない資源でより多くをこなす」ために AI を使う動きがあるが、導入は場当たり的にとどまる。CIVICUS の調査では、回答者の半数超がプライバシーの懸念を導入の障壁と見ており、**48%** が資金面の制約を挙げた。
- **機微なデータ**: 活動家の所在地や匿名の情報源の身元など、機微なデータを扱う。Cloudflare 自身のデータでも、これらの組織はサイバー攻撃を不均衡に多く受ける。
- **コスト**: 複雑な自動化ワークフローを構築・運用するコストが負担になる。

## 発表内容 / アーキテクチャ

### 開発者サービスが答える点

記事は、Cloudflare の開発者サービスが上記の懸念に次のように対応すると説明している。

| 懸念 | 記事での説明 |
| --- | --- |
| セキュリティ・プライバシー | 開発者サービスは最初からセキュリティとプライバシーの保護を組み込んでいる。グローバルネットワーク上で動くため、DDoS 攻撃や内部システムへの不正アクセスの試みから自動的に保護される |
| コスト | 軽量なサーバーレス構成で、需要に応じてスケールする。アイドル状態のインフラを用意・支払いする必要がない |
| GPU 運用 | Workers AI により、専用の GPU インフラを運用する必要がない |
| AI 利用の制御 | AI Gateway が、レート制限、AI の使われ方の可視化、不要なモデル呼び出しを減らすインテリジェントなモデルルーティングを提供する |

### 第1の非営利スタートアップ・コホートと事例

昨年の Birthday Week で、Cloudflare for Startups を非営利・公益組織にも広げ、各組織に開発者サービスのクレジット（最大 25 万ドル）を提供することにした。最初のコホートには30組織が選ばれ、気候科学、人道支援、メンタルヘルス、市民参加、教育といった領域のツールが形になりつつある。合計の提供額は 750 万ドル超とされる。記事は次の3つを紹介している。

**LebTown（ローカルニュースの自動化）**: ペンシルベニア州レバノン郡の独立系非営利ニュースルーム。これまで2つの Google ドキュメント、Google カレンダー、Discord、Gmail で運用していたものを、企画（ピッチ）から公開までを追うカスタム編集管理システムに置き換えている。読者リーチの追跡、記者がアプリや Discord からコミュニティへの影響を記録する機能、郡の不動産移転記録を PDF から構造化データに変換するツール、WordPress と連携するリアルタイムの校正（コピーエディター）エージェントも作った。

![LebTown の編集管理システムの Analytics 画面](https://blog.cloudflare.com/_emdash/api/media/file/01M3W891ZKRSSFHMCYYBVMXZEY.png)
*図: LebTown の Analytics 画面。「Pulse」タブにリアルタイムの読者数（71）、前日のページビュー（20,534）、直近24時間の読者数グラフ、アクティブな記事の一覧が表示されている（出典: Cloudflare Blog https://blog.cloudflare.com/civil-society-automation/。記事に画像キャプションはなく、説明は画面の内容から推定したもの）*

**Kaya Guides（メンタルヘルス支援の拡大）**: インドでうつ症状のある人を、訓練を受けた一般のカウンセラーと結びつける WhatsApp ベースのアプリを作った。2026年9月時点で 10,439 人を支援し、2,325 人が現在登録中。ケアマネジメントシステムを Cloudflare に移行し、月に約 50 万件の WhatsApp メッセージを処理している。カウンセリング通話を聞き取り、カウンセラーにリアルタイムでフィードバックするライブ AI システムも構築した。Kaya によれば、これらのツールで、規模が大きくなってもプログラムが一貫し、自己修正的になり、追加コストや複雑さも大きく増えていない。

**The Snorkelling Society（シュノーケリング地点のマッピング）**: 英国の非営利団体で、世界のシュノーケリング愛好家向けの Web・モバイルアプリ「SnorkelMap」を作っている。場所の発見、場所ごとの情報の確認、利用者による体験の投稿ができる。ボランティアが開発・保守するため、Cloudflare を使って、コミュニティの投稿や画像のアップロードのための安全なストレージを確保し、サイバー攻撃からも守っている。

![SnorkelMap の画面（Starney Bay の写真と英国周辺の地図）](https://blog.cloudflare.com/_emdash/api/media/file/01M3W894JG702AN8NK0PB0A044.png)
*図: SnorkelMap の画面。左に「Starney Bay（Eyemouth, Scotland）」の写真、右に英国・アイルランド周辺の地図が表示されている（出典: Cloudflare Blog https://blog.cloudflare.com/civil-society-automation/。記事に画像キャプションはなく、説明は画面の内容から推定したもの）*

### 人権団体と一緒に作る自動化ツール

大規模な市民社会組織からは、複雑なワークフローを作りたい、エンジニアリングの支援も歓迎する、という声があった。共通する課題は、手作業で集めた分散した情報を統合・レビュー・構造化して初めて分析できる、という点である。扱うデータは人権侵害の被害者の名前など機微なもので、不正アクセス、データ漏えい、出力のハルシネーションが重大な結果につながりうる。

Cloudflare は開発者サービスの無償提供に加えて、製品の専門家、フロントエンドデザイナー、バックエンド開発者、セキュリティアドバイザーからなるボランティアのエンジニアチームを組み、ツールの設計・構築を支援している。探っている問いは、どこで自動化が役立つか、どのモデルがタスクに合うか、どんなセキュリティ制御が必要か、どこで人が関与し続けるべきか、である。

**Freedom House（越境弾圧の追跡）**: 1941年設立で、民主主義と自由の推進に取り組む。政府が国境を越えて、ディアスポラや亡命コミュニティの異論を封じる「越境弾圧（transnational repression）」の、世界で最も包括的なデータベースを維持している。数千件の候補事例を手作業で特定・コード化する作業は負担が大きい。そこで、公開報道から潜在的な事例を取り込み、構造化し、フラグを立てる対話型ダッシュボードを作っている。ツールは同団体の方法論でファインチューニングされ、全工程に Freedom House が関与する。セキュリティとデータ最小化を設計判断の優先事項にしている。

![Freedom House のツールのプロトタイプ（Review queue 画面）](https://customer-eq7kiuol0tk9chox.cloudflarestream.com/2356cc9ad90cf36722b1e6410fedee8c/thumbnails/thumbnail.jpg?height=600)
*図: 「Prototype of Freedom House's tool tracking transnational repression」の動画のサムネイル。Review queue に、報道記事由来の候補事例（種別: Unlawful deportation など、国名、AI confidence の値）が並ぶ（出典: Cloudflare Blog https://blog.cloudflare.com/civil-society-automation/。原文では自動再生の動画で、ここでは動画のサムネイル画像を引用している）*

**Global Network Initiative（表現の自由とプライバシーの保護）**: 市民社会、学術、投資家、テック企業（Cloudflare を含む）が参加するメンバー組織。EU のオンライン透明性要件から、アジア太平洋のデータローカライゼーション義務まで、数十の法域の規制案・政策・法的動向を追っている。GNI の使命と過去の活動に基づいて、提言（アドボカシー）の機会を特定し推奨するダッシュボードを作っている。関連するニュース、意見公募、立法の動きを抽出・説明・分類し、各機会の内部レビューの進捗の追跡や、期限が近づいたときのスタッフへの通知も行う。

![GNI のダッシュボードのプロトタイプ（Engagement pipeline 画面）](https://customer-eq7kiuol0tk9chox.cloudflarestream.com/f43514ec54547cf2194580dd710474c8/thumbnails/thumbnail.jpg?height=600)
*図: 「Prototype of GNI's dashboard that tracks the status of engagement opportunities」の動画のサムネイル。Engagement pipeline が「Drafting」「Under GNI staff review」「Under GNI member review」「Preparing for submission」の列に分かれ、EU・英国・ブラジルの案件カードが並ぶ（動画の進行により列や案件が変わる）（出典: Cloudflare Blog https://blog.cloudflare.com/civil-society-automation/。原文では自動再生の動画で、ここでは動画のサムネイル画像を引用している）*

**Article One（人権リスクの評価）**: 企業が自社の方針・製品・事業の人権への影響を理解し軽減するのを助ける、戦略・マネジメントのコンサルティング会社。工場監査から国別の状況レポートまで、大量の文書を読んで要約する仕事がある。これを処理・構造化し、重要な人権リスクを特定し、スタッフがレビュー・修正するための推奨案のドラフトを生成するリスク評価ツールを作っている。「AI は情報の構造化を助けるが、判断はすべて Article One が行う」と明記されている。

### 次のステップ

記事は、市民社会組織が AI 時代に仕事の進め方を進化させているのを見て、Cloudflare が「小さな役割」を担えることを喜んでいる、としている。組織と一緒に取り組むことは、各組織のミッションを前進させるだけでなく、リスクの高い環境でのセキュリティとプライバシーの考え方を深め、同様のプログラムを今後広げる方法を考える材料にもなる、と述べる。本日から、非営利組織向けスタートアッププログラムの**第2コホートの募集を正式に開始**した。申込はスタートアッププログラムのページで「non-profit」のチェックボックスを選ぶ。

## コード例

本記事にコード例はない。事例紹介と、プログラム（クレジット提供・ボランティアエンジニアによる支援・第2コホート募集）の発表が中心の記事であるため、上の「発表内容 / アーキテクチャ」で各事例の構成と設計方針を詳しく整理した。

## ユースケース

- **ローカルニュースルームの業務基盤（LebTown）**: 分散したツール（ドキュメント・カレンダー・チャット・メール）を、企画から公開・読者分析までを通す1つのシステムにまとめる。PDF の公的記録を構造化データにする処理や、リアルタイムの校正エージェントも含む。
- **メンタルヘルス支援の規模拡大（Kaya Guides）**: WhatsApp 上でカウンセラーと利用者をつなぎ、通話中のカウンセラーに AI がリアルタイムでフィードバックする。月約 50 万メッセージを処理する。
- **ボランティア運営のコミュニティアプリ（The Snorkelling Society）**: 投稿・画像アップロードのためのストレージを確保しつつ、攻撃から守る。
- **人権データの一次選別（Freedom House）**: 公開報道から候補事例を取り込み・構造化・フラグ付けし、研究者が深い分析に集中できるようにする。
- **政策動向のモニタリングと提言管理（GNI）**: 数十の法域の動きを拾い、提言の機会を分類し、社内レビューと期限を管理する。
- **人権リスク評価の下書き作成（Article One）**: 大量の監査文書・状況レポートを構造化し、リスクと推奨案のドラフトを作る。判断は人が行う。

## 所感・ポイント

- 記事の力点は「AI を使う」ことそのものではなく、**機微なデータを扱う組織が安全かつ低コストに AI を使える土台**にある。Project Galileo で守ってきた組織が、守られる側から作る側へ移る、という流れが示されている。
- 3つの人権団体の事例に共通しているのは、AI の役割が「情報の取り込み・構造化・下書き」に限られ、最終判断は人が行う点である。Freedom House は全工程に関与し、Article One は判断をすべて行うと明記している。
- 750 万ドルや 3,400 ドメイン、10,439 人といった数値は、Cloudflare または各組織の自己報告である。
- 使われている具体的な製品名は、記事中では Workers AI と AI Gateway が挙げられている程度で、各ツールの実装詳細（どのモデルを使い、どう構成したか）は書かれていない。Freedom House のファインチューニングの詳細なども同様。
- 画像のうち、Freedom House と GNI のプロトタイプは原文では動画（Cloudflare Stream の自動再生）で、本ページではそのサムネイルを引用している。LebTown と SnorkelMap の画像には原文にキャプションがないため、説明文は画面の内容から推定したもの。
- サンプル対象外の理由: 本記事は事例紹介とプログラム発表であり、再現できる単一の機能・コードが示されていないため、`examples/` のデプロイ可能なサンプルは作成していない。

## 関連リンク

- [Project Galileo](https://www.cloudflare.com/galileo/)
- [非営利向けスタートアッププログラムの拡大](https://blog.cloudflare.com/expanding-startups-for-nonprofits/)
- [Cloudflare for Startups（第2コホートへの申込。non-profit にチェック）](https://www.cloudflare.com/startups/)
- [Workers AI](https://www.cloudflare.com/products/workers-ai/) / [AI Gateway](https://www.cloudflare.com/products/ai-gateway/) / [DDoS 防御](https://www.cloudflare.com/products/ddos/)
- [Freedom House: Transnational Repression](https://freedomhouse.org/report/transnational-repression) / [Global Network Initiative](https://globalnetworkinitiative.org/) / [Article One](https://articleoneadvisors.com/)
- [LebTown](https://lebtown.com/) / [Kaya Guides](https://kayaguides.com/) / [The Snorkelling Society](https://snorkellingsociety.org/) / [SnorkelMap](https://snorkelmap.com/)
- 本リポジトリ内の関連Wiki: [Cloudflare Impact が寄付1億ドルに到達](./2026-09-30-100-million-donations.md)
