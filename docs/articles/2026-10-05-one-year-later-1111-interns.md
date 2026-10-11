# 1年後の振り返り: 1.1.1.1 人のインターンが生んだ力

- 原文: [https://blog.cloudflare.com/one-year-later-1111-interns/](https://blog.cloudflare.com/one-year-later-1111-interns/)（原題: One year later: the power of 1.1.1.1 interns）
- 日本語版の出どころ: Cloudflare公式の日本語版（`https://blog.cloudflare.com/ja-jp/one-year-later-1111-interns/`）は確認時点で存在しなかった（404）ため、英語版（en-us）から日本語化して要約している。タイトルも筆者による訳。公開日は英語原文の datePublished（2026-10-05T13:00:00Z）に従う。
- 公開日: 2026-10-05
- 著者: Kelly Russell、Allan Leinwand、Judy Cheong
- 位置づけ: Birthday Week 2026 の記事（読了目安は原文表記で 6 分）。2025 年に発表した「最大 1,111 人のインターンを 2026 年に採用する」という目標の 1 年後の経過報告
- 関連: [EmDash 1.0: 安全なプラグインレジストリを備えた安定版 CMS](./2026-09-28-emdash-cms-plugin-registry.md)（インターンの Noah が 2 人目のメンテナ）/ [AI でポスト量子移行の進路を描く: CryptoLabe](./2026-09-29-ai-driven-cryptography-discovery.md)・[あなたのドメインはポスト量子暗号を使っているか](./2026-09-29-post-quantum-visibility.md)（Tiago・Sophie の成果）/ [Protected Quick Tunnels](./2026-10-02-protected-quick-tunnels.md)・[Workers でネイティブ Rust を動かす](./2026-09-28-rust-workers-emscripten-target.md)・[Webはどれくらい速いのか: BEACON](./2026-09-28-how-fast-is-the-web.md)・[Cloudflare Containers を作り直し、エージェントのサンドボックスをスケールさせる](./2026-09-30-faster-agent-sandboxes.md)（インターンが関わった Birthday Week の発表）/ [Cloudflare Ambassadors、Community Engineers を発表](./2026-08-07-community-program-refresh.md)（若手・コミュニティへの投資という共通の流れ）/ [Cloudflare 2026年度創業者レター](./2026-09-27-cloudflares-2026-annual-founders-letter.md)（同じ Birthday Week 2026 の総論）
- GitHub: [docs/articles/2026-10-05-one-year-later-1111-interns.md](https://github.com/syumai/cloudflare-blog-summaries/blob/main/docs/articles/2026-10-05-one-year-later-1111-interns.md)

![記事ヘッダー画像](https://blog.cloudflare.com/_emdash/api/media/file/01M40BZTRXM8420FKPHKZ2HBJT.png)
*図: 記事ヘッダー画像。「+1,111」と書かれた吹き出しの下で、ヘッドホンと丸眼鏡の人物がノート PC に向かい、本・ラバーランプ・ペン立て・鉢植えが机に並ぶ装飾イラスト（出典: Cloudflare Blog https://blog.cloudflare.com/one-year-later-1111-interns/。原文にキャプションはなく、説明は見た目からの筆者の推定。装飾のため、図としては扱わない）*

## TL;DR

- 1 年前、多くの企業がインターンや新卒の採用を絞る中、Cloudflare は逆に「2026 年に最大 1,111 人のインターンを採用する」と宣言した（1.1.1.1 にちなんだ数字）。
- 賭けの前提は「AI によって、若手人材はより価値が高まり、より早く影響を出せる」こと。
- 1 年後の現在、目標の 1,111 に向けて進行中で、9 拠点・48 チームで 750 件のインターンシップを実施した。まだ採用も続けている。
- 今年は、インターン自身が記事を書いた。キャッシュ容量を増やす Cache Transcoding、EmDash の 2 人目のメンテナ、ポスト量子移行の可視化、BGP の ORIGIN 属性の計測などが成果として挙がる。
- 多くのインターンが、フルタイムとして Cloudflare に戻ってくる。

## 背景・課題

AI コーディングツールの普及を背景に、若手の採用を減らす動きが目立っていた（記事は、インターンや新卒の採用削減を報じる外部記事にリンクしている）。Cloudflare は、AI は学習を速め、試行を増やし、より難しい問題に取り組ませてくれるが、新しい人が持ち込む「エネルギー・好奇心・新鮮な視点」は AI が補ってくれない、という立場を取った。昨年の発表（[cloudflare-1111-intern-program](https://blog.cloudflare.com/cloudflare-1111-intern-program/)。本リポジトリには未収録）が、その賭けの出発点である。

本記事は、その賭けが 1 年後にどうなったかを、規模・仕事の範囲・AI の使い方・成果物・コミュニティ・今後の順に報告する。

## 発表内容

### 規模

![インターンと並ぶ Matthew Prince](https://blog.cloudflare.com/_emdash/api/media/file/01M40BZX7VK52DNB1P6CE9HGG5.jpg)
*図: Cloudflare CEO の Matthew Prince が、Austin オフィスでインターンたちと写る写真。吹き抜けの階段を囲む階上から、大勢が見下ろしている（出典: Cloudflare Blog https://blog.cloudflare.com/one-year-later-1111-interns/。キャプションは原文の alt テキストにもとづく）*

| 項目 | 数値・内容 |
|---|---|
| 目標 | 2026 年に最大 1,111 人（現在も目標に向けて進行中） |
| 実績 | 750 件のインターンシップ |
| チーム数 | 48 チーム |
| 拠点 | Austin、San Francisco、London、Lisbon、New York、Singapore、Bengaluru、Washington DC、Sydney の 9 拠点 |

記事は「1,111 に向けて作業中で、まだ採用も続けている」と述べている。

### 仕事の範囲

インターンは初日から稼働中のチームに入り、実際の問題に取り組む。全員に期待されたのは、何かを残すこと。製品の改善、より良いプロセス、新しいインフラ、チームの仕事の進め方を変える知見のいずれかである。

仕事はエンジニアリングにとどまらない。記事は次の例を挙げている。

- 内部監査のインターン: ISO のコンプライアンス統制のテストと文書化を自動化する、AI 支援のパイプラインを構築した。
- プロダクトマネージャーのインターン: Startup Program のクレジット管理を近代化するため、API・ダッシュボード・移行ツールに取り組んだ。
- People チームのソフトウェアエンジニアリングのインターン: 新入社員の身元確認（background verification）のワークフローを改善した。
- カスタマーサポートのインターン: ケースの説明から、AI でトラブルシューティングコマンドを起動する方法を探った。

### AI ネイティブなインターン

AI は今年のプログラム全体の主題だったが、学習や責任を省く近道ではなかった、と記事は強調する。インターンは AI を、次の用途に使った。

- 見慣れないコードベースやシステムを理解する
- 製品要件と実装を比べる
- アイデアをプロトタイプする
- 繰り返し作業を自動化する
- 問いから動く解決策までの道のりを縮める

マネージャーとメンターは、方向づけ、判断のレビュー、出荷物が Cloudflare の基準を満たすことの確認を担い続けた。多くのインターンにとって AI は「スタートラインを前に動かした」。新しいプロジェクトの全体像を数週間でなく数日でつかみ、動く足場をすぐ作り、「何を作るべきか」「誰が使うか」「正しいとどう分かるか」「本番に出るとどうなるか」といった難しい問いに時間を使えるようになった。あるインターンの言葉として「AI なしで、これまでのインターンは 12 週間でどうやって何かを出荷していたのか」が紹介されている。

### インターンが出荷したもの

昨年の発表には「Interns ship at Cloudflare」という節があった。今年は、インターン自身が記事を書いた。記事が挙げる成果は次のとおり。

| 領域 | インターン（原文表記） | 内容 |
|---|---|---|
| キャッシュ | Aashi | Cache Transcoding。適格なアセットを、主要プロキシ内で Zstandard により圧縮してからディスクへ書き込む。初期テストで、ディスク上のサイズを平均で元の 3 分の 1 に縮小。ペタバイト級の実効キャッシュ容量の増加と、データセンター間のデータ移動の削減につながる見込み。背景には、過去 1 年で RAM とディスクの価格が急上昇したことがある |
| CMS | Noah | インターンとして入社し、EmDash の 2 人目のメンテナに。メディアライブラリ、コンテンツエディタ、管理画面に変更を加えた。EmDash 1.0 は Birthday Week に出荷された。このブログも EmDash 上で動いている |
| ポスト量子 | Tiago、Sophie | Tiago は社内 AI ツール CryptoLabe（コードベース内の暗号利用と依存先を洗い出す）の構築を支援。Sophie は、Logpush、Log Explorer、HTTP Traffic Analytics に、接続ごとのポスト量子の可視化を持ち込む作業を支援。Cloudflare は 2029 年のポスト量子セキュリティを目標にしており、「見えないものは移行できない」という理由 |
| インターネットの基盤 | Iliana | ネットワークが引き込みたいトラフィックのために BGP の ORIGIN 属性を書き換える頻度を計測し、観測した経路の約 70% で見られたと報告。経路選択から ORIGIN を外すことを公に提唱した。RFC 9234（ルーターが経路リークを自分で拒否できるようにする）の採用状況も追跡した |

記事はさらに、今年の Birthday Week の発表のうち、インターンが執筆・実装に関わったものとして次の 7 件を挙げている。

1. [Protected Quick Tunnels](https://blog.cloudflare.com/protected-quick-tunnels/)（次の開発プロジェクト向けの、アカウント不要の簡単な認証）→ [本リポジトリのWiki](./2026-10-02-protected-quick-tunnels.md)
2. [Using AI to chart a course for our post-quantum migration](https://blog.cloudflare.com/ai-driven-cryptography-discovery/) → [Wiki](./2026-09-29-ai-driven-cryptography-discovery.md)
3. [Is your domain using post-quantum encryption?](https://blog.cloudflare.com/post-quantum-visibility/) → [Wiki](./2026-09-29-post-quantum-visibility.md)
4. [EmDash 1.0](https://blog.cloudflare.com/emdash-cms-plugin-registry/) → [Wiki](./2026-09-28-emdash-cms-plugin-registry.md)
5. [Supporting native Rust in Workers with the new Emscripten target for wasm-bindgen](https://blog.cloudflare.com/rust-workers-emscripten-target/) → [Wiki](./2026-09-28-rust-workers-emscripten-target.md)
6. [How fast is the web? (BEACON)](https://blog.cloudflare.com/how-fast-is-the-web/) → [Wiki](./2026-09-28-how-fast-is-the-web.md)
7. [Cloudflare Containers, rebuilt to scale agent sandboxes](https://blog.cloudflare.com/faster-agent-sandboxes/) → [Wiki](./2026-09-30-faster-agent-sandboxes.md)

Cache Transcoding の記事（`cache-transcoding`）と BGP 関連の 2 記事（`bgp-origin-attribute`、`rfc9234-bgp-role-model`）は、本リポジトリには未収録である（記事内のリンク先として外部リンクを示す）。

### コミュニティづくり

インターンシップは人と出会う場でもある。各オフィスで、インターンは食事を共にし、ボランティアに参加し、友人を作った。CEO の Matthew Prince は世界各地のオフィスでインターンとの夕食会を開き、取り組みや学びを直接聞いた。役員による Q&A セッションでは、会社・戦略・技術・キャリアについて率直な質問ができ、日々のマネージャーやメンターの支援を補った。

### これから

- 来年もプログラムを拡大する。新しいコホート、参加するチームの増加、「早期キャリアの人が AI と周囲の人と共に最も力を発揮する方法」についての学びを深める。
- 今年のインターンの多くが、フルタイムとして戻ってくる。目標は「良い夏」ではなく、キャリアと、より良いインターネットを築く新世代の人材。
- 学生・早期キャリアの技術者に向けて、インターンシップへの応募を呼びかけている。ポジションは 1 年を通して順次公開される。

## コード例

本記事にコード例（コードブロック）はない。インターンプログラムの経過報告であり、技術的な詳細は、各インターンの成果を扱う個別記事に委ねられている。そのため、このリポジトリの他の技術記事のような「コード例」は載せず、代わりに上の「インターンが出荷したもの」の表で、領域ごとの成果と該当記事を整理している。

## ユースケース

技術機能の記事ではないため、製品の利用場面は書かれていない。記事から読み取れる、プログラムの設計上の特徴を整理する。

- **実際のチームへの配属**: 初日から稼働中のチームに入り、実際の問題に取り組む。
- **「残すもの」の期待**: 全員が、出荷物・プロセス・インフラ・知見のいずれかを残す。
- **職種を問わない成果**: 内部監査、プロダクト管理、People、サポートなど、エンジニアリング以外でも AI を活用した自動化が行われた。
- **成果を公開する**: インターン自身が Birthday Week の記事を書いた。

## 所感・ポイント

- 本記事は技術解説というより、採用方針についての経過報告である。数値は「750 件・48 チーム・9 拠点」で、目標 1,111 には現時点で届いていない（記事自身が「進行中」と書いている）。
- 技術面の読みどころは、Cache Transcoding（Zstandard による事前圧縮でディスク上の容量を平均 3 分の 1 に）と、BGP の ORIGIN 属性の計測（観測経路の約 70%）。いずれも詳細は個別記事にあり、本記事は要約にとどまる。数値は「初期テスト」「観測した経路」という条件付きの値である点に注意。
- AI の位置づけは「責任や学習の省略ではなく、スタートラインを前に進めるもの」で、レビューする人（マネージャー・メンター）の役割が変わらず重要とされている。
- 画像キャプションのうち、ヘッダー画像の説明は原文になく、見た目からの筆者による記述（装飾）である。写真のキャプションは原文の alt テキストによる。
- 個人名は記事に登場する first name のみを記載している。
- **サンプル対象外**: 採用・プログラム報告であり、Workers 上で動かす機能の記事ではないため、デプロイ可能なサンプルは作成していない。

## 関連リンク

- 原文: https://blog.cloudflare.com/one-year-later-1111-interns/
- 昨年の発表（本リポジトリ未収録）: https://blog.cloudflare.com/cloudflare-1111-intern-program/
- Cache Transcoding（本リポジトリ未収録）: https://blog.cloudflare.com/cache-transcoding/
- BGP の ORIGIN 属性（本リポジトリ未収録）: https://blog.cloudflare.com/bgp-origin-attribute/
- RFC 9234 の採用状況（本リポジトリ未収録）: https://blog.cloudflare.com/rfc9234-bgp-role-model/
- Internship Experience タグ: https://blog.cloudflare.com/tag/internship-experience/
- Birthday Week: https://www.cloudflare.com/birthday-week/
- 早期キャリア向けの募集: https://www.cloudflare.com/careers/early-talent/
- [EmDash 1.0（本リポジトリのWiki）](./2026-09-28-emdash-cms-plugin-registry.md) / [解説スライド](../../slides/emdash-cms-plugin-registry/slides.md)
- [CryptoLabe（本リポジトリのWiki）](./2026-09-29-ai-driven-cryptography-discovery.md) / [ポスト量子の可視化（本リポジトリのWiki）](./2026-09-29-post-quantum-visibility.md)
- [Protected Quick Tunnels（本リポジトリのWiki）](./2026-10-02-protected-quick-tunnels.md) / [Workers の Rust（本リポジトリのWiki）](./2026-09-28-rust-workers-emscripten-target.md) / [BEACON（本リポジトリのWiki）](./2026-09-28-how-fast-is-the-web.md) / [Containers の再設計（本リポジトリのWiki）](./2026-09-30-faster-agent-sandboxes.md)
- [Cloudflare Ambassadors、Community Engineers（本リポジトリのWiki）](./2026-08-07-community-program-refresh.md) / [創業者レター（本リポジトリのWiki）](./2026-09-27-cloudflares-2026-annual-founders-letter.md)
