# 1年後のソブリンAIと「選択」をめぐる戦い: 欧州の2つのオープンモデルを Workers AI に、AI防御ワークショップも開始

- 原文: [https://blog.cloudflare.com/sovereign-ai-choice-one-year-later/](https://blog.cloudflare.com/sovereign-ai-choice-one-year-later/)（原題: One year later: Sovereign AI and the fight for choice）
- 日本語版の出どころ: Cloudflare公式の日本語版（`https://blog.cloudflare.com/ja-jp/sovereign-ai-choice-one-year-later/`）は確認時点で存在しなかった（404）ため、英語版（en-us）から日本語化して要約している。タイトルも筆者による訳。公開日は英語原文の datePublished（2026-10-01T13:04:19Z）に従う。
- 公開日: 2026-10-01
- 著者: Carly Ramsey、Smrithi Ramesh、Petra Arts
- 位置づけ: Birthday Week 2026 の記事（読了目安は原文表記で 7 分）。前年（2025年9月）の「ソブリンAIと選択」記事（[Sovereign AI and choice](https://blog.cloudflare.com/sovereign-ai-and-choice/)）の続報。タグは AI / Birthday Week / Open Source / Policy & Legal / Security
- 関連: [Cloudflare OS のフルマネージド版](./2026-10-01-managed-cloudflare-os.md)（同日のAI関連の発表）、[AI Search の一般提供](./2026-10-01-ai-search-ga.md)（同日の Workers AI 周辺の発表）、[Workers AI と AI Gateway の統合](./2026-08-07-workers-ai-gateway-unification.md)（Workers AI のモデル提供の枠組み）、[より小さく、より速く、より安全に: Kimi と GLM を大規模に実行](./2026-08-03-smaller-faster-safer-models.md)（Workers AI でのオープンモデル運用）、[AI 時代の適応型アプリケーションセキュリティ](./2026-09-29-ai-era-framework.md) / [フロンティア AI モデルで自社の WAF をテストしてみた](./2026-09-29-adaptive-ai-waf-testing.md)（記事が参照する脆弱性ハーネス・フロンティアモデルの取り組みに触れた記事）
- GitHub: [docs/articles/2026-10-01-sovereign-ai-choice-one-year-later.md](https://github.com/syumai/cloudflare-blog-summaries/blob/main/docs/articles/2026-10-01-sovereign-ai-choice-one-year-later.md)

![ヘッダー画像: 発光する地球儀と、それを囲む小さな水晶玉のイラスト](https://blog.cloudflare.com/_emdash/api/media/file/01M3TES95GDNHB8645HHYQHR1G.png)
*図: 記事ヘッダー画像（出典: Cloudflare Blog https://blog.cloudflare.com/sovereign-ai-choice-one-year-later/）。装飾的なイラストで、技術的な図ではない。原文にキャプションは付いておらず、上記の説明は画像を見た筆者による記述。*

## TL;DR

- Birthday Week の「プレゼント」として、欧州発の 2 つのオープンモデル **EuroLLM**（EU 公用語 24 言語を含む 35 言語）と **Apertus**（スイスの完全オープンな多言語モデル、1,500 以上の言語）を **Workers AI** に追加予定。アクセス申請は今日から可能。
- 前年の主張「ソブリンAIの答えは**選択**（適切な道具を選び、必要なら乗り換える自由）」の続報。この1年で、アジア太平洋の開発者が国産モデル（インド・日本・シンガポール）を使って実用的なツールを作ったことを紹介している。
- 防御面では、複数モデルを並列に使う**ハーネス**（脆弱性の探索・検証・優先度付けを担うオーケストレーション層）を社内で構築・公開済み。1 つのモデルが使えなくなっても防御が止まらない。
- 政府のサイバー機関や重要インフラ事業者向けの**ハンズオンワークショップ**を開始。初回は 10 月のシンガポール（Singapore International Cyber Week）。
- 結論は「選択は AI ソブリンティへの道であり、AI セキュリティへの道でもある」。

## 背景・課題

1年前、各国の首都では AI へのアクセスと主権をめぐる議論が渦巻いており、Cloudflare は「選択」を答えとして示した。その後、議論は硬直化したと記事は述べる。攻撃者がフロンティアモデルを使ってサイバー攻撃を行った。一部のフロンティアモデルへのアクセスは所在地に左右されるようになった。オープンモデルを制限しようという声も強まっている。これらを合わせると、「他国が握るモデルは頼れないのだから、壁を築くのが安全だ」という**ゼロサム**の結論に傾きやすい。

記事はこの結論に反論する。この1年は「壁」ではなく「選択肢を増やす」方向の事例を示している、という立場である。Cloudflare 自身も「どの国も 1 社の AI に依存すべきではない。それは Cloudflare も含む」と述べ、ベンダーロックインを防ぐオープン標準、無料で始められる製品、335 以上の都市・125 以上の国と地域にあるネットワーク（うち 230 以上の都市に AI 推論用 GPU）を根拠に挙げている。

## 発表内容 / アーキテクチャ

記事は大きく 3 つのパートから成る。

### 1. 欧州の 2 つのオープンモデルを Workers AI へ

2 月に Matthew Prince が India AI Impact Summit 2026（ニューデリー）で、分散型で手頃な AI アクセスは「国家のレジリエンス」の問題だと述べた。その数か月前に追加したインド・日本・シンガポールのモデルが最初の裏付けだった、とされている。このサミットシリーズは 2027 年 6 月にジュネーブへ移る（掲げる使命は「prosperity and progress for all」）。

| モデル | 概要 | 開発体制・学習環境 |
| --- | --- | --- |
| **EuroLLM** | 35 言語対応。EU 公用語 24 言語すべてを含み、既存のオープンモデルでは手薄な言語を重視。コンソーシアムによれば、同規模のモデルを EU 多言語ベンチマークと機械翻訳で上回る | Horizon Europe・欧州研究評議会・EuroHPC の支援。Instituto Superior Técnico、エディンバラ大学、Instituto de Telecomunicações、パリ=サクレー大学、Unbabel、ソルボンヌ大学、Naver Labs、アムステルダム大学などのコンソーシアム。MareNostrum 5 で学習 |
| **Apertus**（ラテン語で「開かれた」） | スイス初の大規模・完全オープン・多言語モデル。15 兆トークン超、1,500 以上の言語、学習データの 40% が英語以外。アーキテクチャ・重み・学習データ・手法をすべて公開。EU AI Act と GDPR を意識した設計（学習時のオプトアウト尊重、個人データ除去、記憶化の防止）。開発者によれば、ロマンシュ語やスイスドイツ語、アジア・アフリカの低リソース言語などで主要なクローズド／オープンモデルを大きく上回る | ETH Zurich、EPFL、スイス国立スーパーコンピューティングセンター（CSCS）による Swiss AI Initiative。CSCS の Alps（10,000 基超の GH200 GPU）で学習 |

どちらも公的な大学・研究機関が開発したモデルで、Workers AI へのアクセスは申請ベース（EuroLLM は `eurollm-9b-it`、Apertus は `apertus-v1.5-8b` のドキュメントから申請）。

### 2. 昨年のモデルで人々が作ったもの

昨年追加した各国モデルは、Workers AI に載って以降、アジア太平洋の学生・スタートアップ・中小企業・公務員数百人が利用した（現地パートナーと開催したビルダソンも多い）。記事は 3 例を挙げる。

- **Form Mitra（インド）**: 英語で書かれた給付申請書類は、地方在住・低識字・視覚障害のある人々を閉め出しがち。IIT デリーの学生が CyberPeace とのビルダソンで、22 のインド言語で音声ガイドしながら書類記入を支援するアシスタントを作った。AI4Bharat の IndicTrans2 モデルを使用。
- **MedBridge（シンガポール）**: 高齢患者のケアに当たる看護師の多くは東南アジア各地の出身で、現地の方言が通じず重要な臨床情報が失われうる。MedBridge は福建語・広東語を含む 14 言語で患者との健康に関する会話を支援する。
- **Anshin Concierge（日本）**: 高齢者や障がいのある人、デジタルに不慣れな人が、困ったときにどの公共サービスに連絡すべきか迷う問題。ハッカソンのプロトタイプで、「膝が痛い」「スマホに変な画面が出た」といった自分の言葉で伝えると、東京都の適切な支援窓口へ電話またはウェブページでワンタップで案内する。

### 3. 1 つのモデルに依存しない AI 防御

政府は重要サービスや国家インフラの防御に AI を使いたい。脆弱性を大規模に見つけられるフロンティアモデルは、防御側にも使える。ただし 1 つのモデルに基づく防御は、そのモデルへのアクセスの確かさに左右される。政府は重要モデルへのアクセスが予告なしに制限される事態を目にしてきた。

Cloudflare のセキュリティチームは、社内の各チームと協力して「特定のモデルに依存しない AI 防御」を構築した。中核は**ハーネス**、つまり複数の AI モデルを並列に動かして、脆弱性の探索・発見の検証・脅威の優先度付けを調整するオーケストレーション層である。次のブログ記事が公開済みと記されている。

- フロンティアモデルとオープンモデルを併用して得た知見（[cyber-frontier-models](https://blog.cloudflare.com/cyber-frontier-models/)）
- 任意のモデルで動かせるハーネスのオープンソース化（[build-your-own-vulnerability-harness](https://blog.cloudflare.com/build-your-own-vulnerability-harness/)）
- 攻撃者がフロンティアモデルで脆弱性を見つけること自体を防ぐ多層アーキテクチャ（[frontier-model-defense](https://blog.cloudflare.com/frontier-model-defense/)）

ハーネスはクローズド／オープンを問わず任意のモデルで動くため、1 つのプロバイダーを失っても防御は止まらない。政府に説明した際の最も多い反応は「安心した」で、続いて「自分たちの環境で、自分たちのルールで、どう立ち上げるか」という実務的な質問が来て、ブリーフィングはやがて実践的なトレーニングの要望に変わった。

そこで、政府のサイバーセキュリティ機関と重要インフラ事業者向けの**ハンズオンワークショップ**を開始する。参加者は自分たちの AI セキュリティハーネスと多層防御を構築し、組織に合わせて調整する方法を持ち帰る。モジュールはプラグアンドプレイで、各国の AI スキリングやサイバーレジリエンスのプログラムに組み込める設計。初回は今年 10 月にシンガポールの Singapore International Cyber Week で開催される。

### 締め

パートナーとして CyberPeace（インド）や Code for Japan が、オープンモデルを実用ツールにする手助けをしたと謝辞がある。国の AI プログラム、サイバー機関、重要インフラの担当者で、現状より多くの選択肢が欲しい人は policy-team@cloudflare.com へ連絡できる。EuroLLM と Apertus へのアクセス申請、またはハーネスから始めることを勧めている。

## コード例

本記事にコード例は掲載されていない。政策・エコシステム寄りの発表記事で、モデルの利用方法（呼び出しコード）は記事内に示されていない（モデルページへのリンクのみ）。代わりに、上の「発表内容 / アーキテクチャ」でモデルごとの位置づけと各事例を整理した。

## ユースケース

- **多言語の公共サービス**: 低識字・視覚障害・地方在住の人向けに、22 のインド言語で音声ガイドするフォーム記入支援（Form Mitra）。
- **医療・ケア現場の言語の壁**: 14 言語（福建語・広東語を含む）で、患者と看護師の会話を支援（MedBridge）。
- **行政窓口の案内**: 自分の言葉で困りごとを伝えると、東京都の適切な支援窓口に 1 タップでつなぐ（Anshin Concierge）。
- **EU 域内の多言語処理**: EU 公用語 24 言語を含む EuroLLM での翻訳・多言語タスク（記事が挙げる EuroLLM の位置づけに基づく想定）。
- **サイバー防御**: 複数モデル併用のハーネスで脆弱性を探索・検証・優先度付けし、特定モデルへの依存を避ける。

## 所感・ポイント

- 前年の「選択」という主張を、「モデルの選択（EuroLLM・Apertus・各国モデル）」と「防御の選択（モデル非依存のハーネス）」の 2 つに具体化した続報として読める。ソブリンティ＝囲い込みではなく、「乗り換えられること」という定義が一貫している。
- 発表の実体は、2 つのモデルの**アクセス申請の受付開始**であり、一般提供の宣言ではない。記事は "coming to Workers AI, and you can request access today" と述べている。利用可能なモデル・料金・提供リージョンなどの詳細は、記事内には書かれていない。
- 「ソブリンAI」の話に「サイバー防御」を接続している点が特徴的で、ハーネスの詳細は別記事（本リポジトリでは [AI 時代の適応型アプリケーションセキュリティ](./2026-09-29-ai-era-framework.md) や [WAFテストの記事](./2026-09-29-adaptive-ai-waf-testing.md) が関連）に委ねられている。
- Cloudflare 自身を「どの国も 1 社に依存すべきでない」の対象に含めると明言している点は、記事の主張として注目に値する。一方で、モデルの提供基盤は自社の Workers AI であり、販売上の立場がある点は読み手が踏まえておくとよい。
- 数値（335 都市・125 以上の国と地域・230 以上の都市の GPU など）は記事が掲載時点のものとして述べているもので、本Wikiでは原文のとおり転記している。
- 画像キャプション: ヘッダー画像は装飾的なイラストで、原文にキャプションがなく、本Wikiの説明は筆者による記述。
- **サンプルについて**: 本記事の中心は、アクセス申請制の 2 モデル追加と政策・ワークショップの発表であり、一般利用可能で最小実装により再現できる機能ではない。デプロイ可能なサンプルは作成していない（サンプル対象外）。

## 関連リンク

- 原文（en-us）: [https://blog.cloudflare.com/sovereign-ai-choice-one-year-later/](https://blog.cloudflare.com/sovereign-ai-choice-one-year-later/)
- 前年の記事: [Sovereign AI and choice](https://blog.cloudflare.com/sovereign-ai-and-choice/)（本リポジトリには未収録）
- 本リポジトリ内の関連記事: [Cloudflare OS のフルマネージド版](./2026-10-01-managed-cloudflare-os.md) / [AI Search の一般提供](./2026-10-01-ai-search-ga.md) / [Workers AI と AI Gateway の統合](./2026-08-07-workers-ai-gateway-unification.md) / [Kimi と GLM を大規模に実行](./2026-08-03-smaller-faster-safer-models.md) / [AI 時代の適応型アプリケーションセキュリティ](./2026-09-29-ai-era-framework.md) / [フロンティア AI モデルで自社の WAF をテストしてみた](./2026-09-29-adaptive-ai-waf-testing.md)
- 記事内から張られているリンク:
  - [EuroLLM](http://eurollm.io/) / [Workers AI: eurollm-9b-it](https://developers.cloudflare.com/workers-ai/models/eurollm-9b-it/)
  - [Apertus](https://apertus-ai.org/) / [Workers AI: apertus-v1.5-8b](https://developers.cloudflare.com/workers-ai/models/apertus-v1.5-8b) / [Swiss AI Initiative](https://www.swiss-ai.org/)
  - [Form Mitra](https://pdf-form-filler.devansh-654.workers.dev/) / [AI4Bharat IndicTrans2（Workers AI）](https://developers.cloudflare.com/workers-ai/models/indictrans2-en-indic-1B/) / [CyberPeace](https://cyberpeace.org/)
  - [MedBridge（LinkedIn 投稿）](https://www.linkedin.com/posts/ajith-sreelekshmi_aiops-agenticai-healthtech-ugcPost-7464567178646941696-Wi9f/) / [Code for Japan](https://www.code4japan.org/en)
  - [Vulnerability Discovery and Remediation](https://blog.cloudflare.com/vulnerability-discovery-remediation/) / [cyber-frontier-models](https://blog.cloudflare.com/cyber-frontier-models/) / [build-your-own-vulnerability-harness](https://blog.cloudflare.com/build-your-own-vulnerability-harness/) / [frontier-model-defense](https://blog.cloudflare.com/frontier-model-defense/)
  - [AI Impact Summit のジュネーブ開催（2027年6月）](https://genevaaisummit.swiss/) / [ベンダーロックインとは](https://www.cloudflare.com/learning/cloud/what-is-vendor-lock-in/) / [Cloudflare ネットワーク](https://www.cloudflare.com/network/)
