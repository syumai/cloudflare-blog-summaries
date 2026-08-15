# Cloudflare Ambassadors、Community Engineers を発表 ― オープンソースへ2年間で追加100万ドルを投資

- 原文: [https://blog.cloudflare.com/community-program-refresh/](https://blog.cloudflare.com/community-program-refresh/)（日本語版なし）
- 公開日: 2026-08-07
- 関連: [Agents Week 2026 まとめ記事](./2026-08-13-agents-week-review.md)（金曜日「実装と現実」の発表の1つとして本記事が紹介されている）

![Cloudflare Ambassadors / Community Engineers 発表バナー](https://blog.cloudflare.com/_emdash/api/media/file/01KZCB5TGPAH6A73FHJ2QHFR7T.png)
*図: 本記事のヘッダーバナー画像（出典: Cloudflare Blog, https://blog.cloudflare.com/community-program-refresh/）*

## TL;DR

- Cloudflare は、開発者・OSSコミュニティ向けの支援体制を刷新し、新しいコミュニティプログラムを発表した。
- プログラムは大きく2つのトラックに分かれる。「Cloudflare Ambassadors」（自身のコミュニティに Cloudflare を広める人向け）と「Cloudflare Community Engineers」（インターネットを支えるオープンソースプロジェクトの貢献者向け）。
- Community Engineers トラックでは、オープンソースプロジェクトへの支援として今後2年間で新たに100万ドルを追加投資すると表明した（VoidZero買収に伴うVite向けの既存100万ドルとは別枠）。
- Ambassador の応募受付は本記事公開時点で開始しており、締切は9月6日、選出結果の通知は10月5日を予定している。
- あわせて、2020年の開設以来ユーザー数が約10万人に達した Cloudflare の Discord サーバーの運営体制も見直し、Ambassador とスタッフからなる新しい「Discord委員会」を設置する。

## 背景・課題

Cloudflare は自社を「インターネットを構築するためのプラットフォーム」と位置づけており、Workers・Discord・数多くのオープンソースプロジェクトを通じて、開発者たちが互いに協力し合うコミュニティが既に形成されている。しかし、こうしたコミュニティの熱量や貢献を、これまでの体制では十分に汲み取り切れていなかったという問題意識が本記事の出発点になっている。

具体的には、次の2種類のギャップが挙げられる。

- **草の根の伝道者への支援不足**: 各地域・大学・企業でCloudflareを紹介し、勉強会やハッカソンを主催する個人（いわゆるアンバサダー的な役割の人々）に対して、リソースや可視性を体系的に提供する仕組みが整っていなかった。
- **OSSメンテナーへの直接支援の不足**: Cloudflare の開発者プラットフォームは、`workerd` や `quiche` のように自らオープンソースとして公開しているもの、あるいはオープンソースの上に構築されているものが多い。にもかかわらず、その基盤を支える個々のメンテナーや貢献者を直接支援する仕組みが限定的だった。

これらのギャップを埋めるために、既存の取り組み（例: TanStackへのスポンサーシップ、VoidZero買収に伴うVite支援)を土台にしつつ、より制度化された2トラックのプログラムとして再構成したのが今回の発表である。

## 発表内容 / アーキテクチャ

記事全体は、大きく分けて「Ambassadors」「Community Engineers」「Discordの改善」という3本柱と、応募方法をまとめた締めのセクションで構成されている。

### Cloudflare Ambassadors

- 年1回の応募プロセスを経て選出され、任期は最大2年間。
- 役割は、地元でのミートアップ開催、大学での学生グループの主導、学習スペースの創出、チュートリアル記事の執筆など、自身のコミュニティにCloudflareの知見を広める活動全般。
- Cloudflare側はクレジット（利用枠）、マーケティング素材、技術リソースなどの支援を提供するほか、Discordなどのオンラインコミュニティスペースで目立つ役割（バッジ的な立場）を付与する。
- 応募スケジュール: 受付開始は本記事公開と同時、締切は**9月6日**、選出結果の通知は**10月5日**を予定。
- 記事内では、ミシガン大学でコンピュータサイエンスを専攻し、Cloudflareで採用オペレーションズのインターンも務める Sruthi Pereddy さんのコメントが、Ambassador的な活動の一例として紹介されている。

### Cloudflare Community Engineers

- 対象は、Cloudflareの開発者プラットフォームが依拠している、またはCloudflare自身が公開しているオープンソースプロジェクト（`workerd`、`quiche` など）の周辺で活動する貢献者・メンテナー。
- 先行事例として、TanStack（Tanner Linsley氏がCEOを務めるOSSプロジェクト）へのスポンサーシップが挙げられている。
- 資金面では、VoidZero買収に伴いすでにコミットしていたVite向け100万ドルの支援に加えて、**新たに2年間で100万ドルを追加投資**する。適格と認められたCommunity Engineersはこの基金から助成金を受け取れる。
- Ambassadorsとは異なり最大在任期間の上限を設けていない。これはオープンソース活動特有の、定期的とは限らない不規則な貢献サイクルに合わせた設計である。
- 初期段階では、Astro、Agents SDK、EmDash、Hono、Vinext など、Cloudflareのオープンソースの活動範囲（“orbit”）にあるプロジェクトを重点的に対象とする。
- Discordなどでの特別な役職付与も予定されている。応募受付の開始時期は本記事公開時点では未定（「後日開始」とのみ案内）。

### Discordコミュニティの改善

- Cloudflareの公式Discordサーバーは2020年の開設以来、約10万人のユーザーが参加する規模に成長し、質問対応・プロジェクト共有・フィードバック収集の主要な場になっている。
- 規模拡大に伴い、健全性を維持する運営体制の強化が課題になっていた。
- 対策として、Cloudflare AmbassadorsとCloudflareスタッフから成る新しい「Discord委員会」を設置する。
- 委員会の役割はモデレーションや管理業務そのものではなく（スパムや悪質なリンクへの防御は自動化ツールで対応する）、コンテンツのキュレーションや機会の提供、社内チームやビルダーとの橋渡しに重点を置く。
- スパム・悪質リンクを自動でブロックする新しい防御機能も開発中であり、将来的にはこれらのツールをオープンソースとして公開・共有する計画も示されている。

### まとめ（Ready, Set, Go!）

記事末尾では、詳細情報が `cloudflare.com/community` に集約されていること、Ambassador応募の締切が9月6日であること、Discordへの参加窓口（`discord.cloudflare.com`）が改めて案内されている。

## コード例について

この記事はコミュニティプログラムの制度設計・運営体制に関する発表であり、**コード例は含まれていない**。技術的なAPIやSDKの紹介記事ではなく、Cloudflareの開発者コミュニティ・OSSエコシステムへの支援施策を伝えることが主目的となっている。

そのため、ここでは記事全体の位置づけをもう少し補足する。本記事は、2026年8月3日〜7日に行われた「Agents Week 2026」の最終日（金曜日、テーマは「実装と現実」）に発表された4本の記事の1つとして公開された。同じ金曜日には、AIエージェントの振る舞いを継続的に評価する取り組みや、Workers AI と AI Gateway の統合、Radar Researcher（自然言語でインターネットデータを分析するAIツール）の紹介などが発表されている。技術寄りの発表が並ぶ中で、本記事はやや毛色が異なり、「エージェント経済・開発者エコシステムを支える人とコミュニティへの投資」という文脈に位置づけられている。この並びからも、Cloudflareが技術基盤の整備と同時に、それを使う・支える人々のコミュニティ育成を重視していることがうかがえる。

## ユースケース

- **大学の学生団体がCloudflareのハンズオンイベントを主催する**: Ambassadorとして選出された学生が、大学のコンピュータサイエンス系サークルでWorkersのハンズオンワークショップを開催し、Cloudflareから提供されるクレジットや技術資料を活用して教材を作る。
- **地域の技術コミュニティがミートアップを継続開催する**: 地元の開発者コミュニティを主宰するAmbassadorが、Cloudflareのマーケティング素材や登壇者リソースの支援を受けながら、定期的な勉強会・ハッカソンを企画・運営する。
- **OSSメンテナーがCommunity Engineersとして継続的な支援を受ける**: Astro や Hono など、Cloudflareのオープンソースの活動範囲にあるプロジェクトのメンテナーが、Community Engineersプログラムの助成金を受け取り、不規則な貢献サイクルの中でもプロジェクトの保守を続けられるようにする。
- **Discord上でコミュニティの質問対応・情報整理が円滑になる**: 新設のDiscord委員会が、自動化されたスパム対策ツールと合わせて、有益な議論や機会（イベント告知、コラボレーションの機会など）を積極的にキュレーションし、約10万人規模のコミュニティの中で情報が埋もれにくくする。

## 所感・ポイント

- この発表の特徴は、「技術者個人への支援」を制度化した点にある。Ambassadors（コミュニティを広める人）とCommunity Engineers（コードを書く人）という2つのトラックに明確に分けることで、支援したい活動の性質に応じて異なる支援メニュー（マーケティング素材寄り／資金提供寄り）を用意している設計になっている。
- Community Engineersの「最大在任期間の上限を設けない」という設計判断は興味深い。OSSの貢献は燃え尽きや活動休止期間を挟むことも多く、企業側の一律なプログラム期間の縛りがメンテナーの実態と合わないケースへの配慮と読める。
- 資金規模としては、VoidZero買収に伴う既存のVite向け100万ドルと合わせて、2つの100万ドル規模の投資が並走する形になる。金額の大小以上に、「オープンソースの持続可能性は個々の企業のスポンサーシップの積み重ねで支えられている」という現在のOSSエコシステムの構造がよく表れている発表だと言える。
- Discordの運営方針として「モデレーションではなくキュレーションに重点を置く」という記述は、コミュニティ運営における役割分担（自動化ツールで防御・人間はコンテンツと機会の提供に集中）の考え方として、他のコミュニティ運営者にも参考になりそうである。
- 本記事は技術記事ではないため、SDKや新機能の詳細を期待して読むと肩透かしを受ける可能性がある。あくまで「Cloudflareの開発者・OSSコミュニティ支援施策のアップデート」として読むのが適切である。

> **Workers サンプル**: 対象外（コミュニティ支援プログラムの発表であり、技術記事ではないため）。

## 関連リンク

- 原文: https://blog.cloudflare.com/community-program-refresh/
- Cloudflare Community（プログラム詳細・応募ページ）: https://www.cloudflare.com/community
- Ambassador応募フォーム: https://www.cloudflare.com/community/#community-application
- workerd（Cloudflareのオープンソースランタイム）: https://github.com/cloudflare/workerd
- quiche（CloudflareのオープンソースQUIC実装）: https://github.com/cloudflare/quiche
- TanStack: https://tanstack.com/
- 過去のTanStackスポンサーシップ発表記事: https://blog.cloudflare.com/cloudflare-astro-tanstack/
- VoidZero買収発表記事: https://blog.cloudflare.com/voidzero-joins-cloudflare/
- Cloudflare Discord: https://discord.cloudflare.com/
- Agents Week 2026 まとめ記事（本記事はその中の1発表として紹介されている）: [docs/articles/2026-08-13-agents-week-review.md](./2026-08-13-agents-week-review.md)
