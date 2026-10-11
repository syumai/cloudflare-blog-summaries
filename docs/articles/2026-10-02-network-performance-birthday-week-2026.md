# 2026 Birthday Week: ネットワーク性能アップデート

- 原文: [https://blog.cloudflare.com/network-performance-birthday-week-2026/](https://blog.cloudflare.com/network-performance-birthday-week-2026/)
- 日本語版の出どころ: Cloudflare公式の日本語版（ja-jp）は確認時点で存在しなかった（404）ため、英語版（en-us）から日本語化して要約している。公開日は英語原文の datePublished（2026-10-02）に従う。
- 公開日: 2026-10-02
- 位置づけ: Birthday Week 2026 の記事（Network Performance Update シリーズ）
- 著者: Lai Yi Ohlsen
- 関連: [Webはどれくらい速いのか: BEACON](./2026-09-28-how-fast-is-the-web.md)（同じく実ユーザー計測に基づくパフォーマンス記事。こちらはブラウザの体験指標、本記事はネットワーク到達までの接続時間）/ [Radar Researcher の紹介](./2026-08-07-introducing-radar-researcher.md)（Cloudflare Radar のデータ基盤）
- GitHub: [docs/articles/2026-10-02-network-performance-birthday-week-2026.md](https://github.com/syumai/cloudflare-blog-summaries/blob/main/docs/articles/2026-10-02-network-performance-birthday-week-2026.md)

## TL;DR

- Cloudflare は、世界の上位1,000ネットワークのうち **74%** で最速のプロバイダーになった（2026年4月の Agents Week 時点は60%、+14ポイント）。
- 約150ネットワークで新たに最速となり、最速と判定された国は38か国増えた。測定は2026年8月のデータ。
- 測定指標は TCP ハンドシェイク完了までの**接続時間**で、プロバイダーの順位は 25/50/75 パーセンタイルの加重平均である**トリミアン**で決める。
- 従来の Cloudflare ブランドのエラーページに加え、**Challenge Pages**（Turnstile）でも、バックグラウンドで軽量ファイルを取得する計測を無料プランの一部に対して始めた。計測量と対象ネットワークが増え、僅差の順位が安定して判定できるようになった。

## 背景・課題

CDN などのネットワーク性能は「ユーザーの端末から最寄りの接続点までどれだけ速くつながるか」で決まる。Cloudflare は「ミリ秒単位の差がアプリ・API・Webサイトへの到達速度に影響する」として、プロバイダー間の比較を定期的に公開してきた（前回は4月の Agents Week）。

比較には課題もある。上位プロバイダー同士の差が1〜2msしかないネットワークが多く、日ごとの揺らぎで順位が入れ替わりやすい。測定サンプルが少ないと、本当に速いのか誤差なのか区別できない。今回の更新は、結果の報告と同時に「サンプルを増やして判定の精度を上げる」ための新しい測定手法の導入が柱になっている。

## 発表内容 / アーキテクチャ

### 結果: 上位ネットワークの74%で最速

2026年8月時点で、Cloudflare は上位1,000ネットワークの74%で最速プロバイダーだった。Agents Week（4月）の60%から14ポイントの改善で、約150ネットワークが新たに最速となり、最速になった国も38か国増えた。測定は「各国で最も多くのユーザーにサービスを提供しているネットワーク」における最速プロバイダーを見ている。

![2026年8月の国別の最速プロバイダー（Cloudflare 206 / CloudFront 10 / Google 7 / Fastly 5 / Akamai 3）](https://blog.cloudflare.com/_emdash/api/media/file/01M3T5GDZ75P9Q00E1F1JBMK29.png)
*図: 国別の最速プロバイダー。凡例は Cloudflare 206、CloudFront 10、Google 7、Fastly 5、Akamai 3（計231か国・地域）。Cloudflare Radar の CDN 性能測定に基づき、トリミアン遅延が小さいほど良い（出典: Cloudflare Blog https://blog.cloudflare.com/network-performance-birthday-week-2026/。図中の凡例テキストを転記）*

図では CloudFront はイランやソマリア周辺、Google はロシアなど、Fastly はペルーなどで最速と示されている（地図上の色を読み取った概要）。

Agents Week 以降に新たに最速となった国は、地図で次のように示されている。

![Agents Week 2026 以降に Cloudflare が最速を獲得した国の地図](https://blog.cloudflare.com/_emdash/api/media/file/01M3T5G6RW8ATGQ9ZMH0FTD9NF.png)
*図: 「Countries gained since Agents Week 2026」。オレンジ色が Cloudflare が新たに最速になった国（出典: Cloudflare Blog https://blog.cloudflare.com/network-performance-birthday-week-2026/）*

最速のネットワーク数は次のとおり増えた。

![最速となったネットワーク数: Agents Week 2026 が598、Birthday Week 2026 が746](https://blog.cloudflare.com/_emdash/api/media/file/01M3T5GGDNQN6NWB8ENN33P03N.png)
*図: 「Networks gained since Agents week 2026」の棒グラフ。Agents Week 2026 は 598、Birthday Week 2026 は 746（出典: Cloudflare Blog https://blog.cloudflare.com/network-performance-birthday-week-2026/）*

なお図の差分は 746 − 598 = 148 で、本文は「約150ネットワーク」と書いている（概数）。

### 測定方法

| 項目 | 内容 |
| --- | --- |
| 対象 | 推定ユーザー数で順位付けした世界の上位1,000ネットワーク（[APNIC](https://stats.labs.apnic.net/cgi-bin/aspopjson) のデータ） |
| 指標 | 接続時間（コンテンツを要求する際に端末が TCP ハンドシェイクを完了するまでの時間） |
| 順位付け | 接続時間の**トリミアン**（25・50・75 パーセンタイルの加重平均） |
| 比較対象 | Cloudflare、Amazon CloudFront、Google、Fastly、Akamai |
| 手法 | ユーザーのブラウザがバックグラウンドで各プロバイダーの軽量ファイルを取得し、その接続時間を記録 |

接続時間を使う理由は、距離・経路・混雑といった実環境の要因を反映しつつ、「速い体験」の感覚に近く、プロバイダー比較に十分具体的だからと説明されている。トリミアンは外れ値の影響を抑えながら、ユーザーの体験の幅を表せる。

測定は2021年から、Cloudflare ブランドのエラーページ経由で行われてきた。ユーザーがエラーページに到達したとき、ブラウザが各プロバイダーのファイルを取得して、そのユーザーのネットワーク・その時点での実測値を得る。

### 新しい測定: Challenge Pages

今回追加されたのが、Cloudflare Challenge Pages を使った計測。Challenge Pages は、WAF ルールなどで challenge が実行されたとき、サイト到達前に訪問者を検証する全画面の画面で、[Cloudflare Turnstile](https://www.cloudflare.com/products/turnstile/)（プライバシーを守るリスクベースの challenge）が提供する。

- 訪問者が Challenge Page にいる間、非対話の小さな計測がバックグラウンドで走る。
- 固定のエンドポイント群（Cloudflare・CloudFront・Google・Fastly・Akamai）から軽量ファイルを取得し、リクエストが完了したかと所要時間を記録する。
- 目に見える遅延を増やさないよう設計され、Turnstile のプライバシー重視の特性（従来の CAPTCHA との違い）を保つ。
- 現時点では、対象となる**無料プランの Challenge Pages のごく一部**でのみ実施し、エラーページからの収集も継続する。追加データが測定品質を高め、エンドユーザーの性能に影響しないと確認できた場合にのみサンプリング率を上げる。

### Challenge Pages の到達範囲が測定を拡張する

エラーページは品質の高い測定を得られるが、利用場面が限られる。Challenge Pages は、challenge が出る日常的な操作の中で同様の測定ができるため、より多くのネットワークから、ユーザーの追加操作なしに測定できる。ユーザー・ネットワーク・地域の多様性が増えるという点で、データ品質が一段上がるとしている。

### さらなる可能性と順位の安定化

- 上位1,000ネットワークを超える範囲、各ネットワークでのサンプル増が見込まれ、「人数で重み付けした性能」「国別・世界全体での集計」「測定ネットワークがユーザートラフィック全体のどれだけを占めるかの定量化」といった、ネットワーク数のランキングでは出せない見方も可能になる。
- 多くのネットワークで上位プロバイダーの差は1〜2ms（例: Cloudflare 50ms と Fastly 51ms）で、日々の揺らぎで順位が入れ替わる。測定量が増えるとトリミアンの信頼区間が狭まり、本当の優位とノイズを区別しやすくなる。
- 以前は1〜2msの差で2位だったネットワークでも、サンプル増により外れ値の影響が減り、順位が安定する。今回の改善は新しい計測手法の導入と同時に起きており、結果は「初期の結果」で、データが増えれば順位の変化が実際の性能変化をより反映するようになる、と記事は述べている。

## コード例

本記事にコード例はない。代わりに、測定の流れを概念的に整理する。

1. ユーザーが Cloudflare のエラーページまたは Challenge Page に到達する。
2. ブラウザが、Cloudflare・CloudFront・Google・Fastly・Akamai の固定エンドポイントから軽量ファイルを取得する。
3. 各リクエストの完了有無と接続時間を記録する。
4. ネットワーク（AS）ごとに接続時間のトリミアンを計算し、最も小さいプロバイダーをそのネットワークの最速とする。
5. 国ごとには、その国で最も多くのユーザーを持つネットワークを対象に最速のプロバイダーを決める。

## ユースケース

- **プロバイダー選定の材料**: 自社ユーザーの多い国・ネットワークで、どのプロバイダーが速いかを実測ベースで把握する。
- **性能改善の検証**: Cloudflare 自身が、どのネットワークで遅いかを把握し、改善後の効果を検証する（記事の「データを使って速くできる場所を探し、改善の影響を検証する」という方針）。
- **計測手法の設計参考**: 実ユーザーのブラウザから軽量リクエストを発行し、パーセンタイルの加重平均で外れ値に強い指標を作るという設計は、他の RUM 設計にも参考になる。
- **サイト運営者の参加**: 自社サイトに Challenge Pages を導入すると、その訪問者が（無料プランで、サンプリング対象になった場合に）この測定に寄与する。

## 所感・ポイント

- 数字の見方として、「74%」は**上位1,000ネットワークのうち最速となったネットワークの割合**であり、ユーザー数で重み付けした値ではない。記事自身も、人数で重み付けする見方は今後の可能性として述べている。
- 改善の一因が「手法の変更」である点が重要。記事は、サンプル増により「以前は1〜2ms差で2位と判定されていたネットワークが最速になる」ケースがあると説明している。実際の性能向上と測定精度の向上が混在した結果として読むのがよい。
- 図の詳細（キャプション）は原文に付いていない。図中のタイトル・凡例を元に、キャプションは本ページ側で付けている。
- 測定の主体は Cloudflare 自身で、比較は Cloudflare Radar の CDN 性能測定に基づく自己報告である点に注意する。
- 関連記事 [Webはどれくらい速いのか](./2026-09-28-how-fast-is-the-web.md) は、ブラウザの Core Web Vitals を扱うデータセット BEACON の記事で、こちらは「接続までの時間」を扱う。両者を合わせて見ると、ネットワーク層とアプリ層の体験指標がそれぞれ公開されていることが分かる。
- **サンプルについて**: 本記事の中心は Cloudflare 自身の計測手法と結果であり、利用者が Workers 上で再現できる機能の発表ではない。そのため Workers サンプルは作成していない（サンプル対象外）。

## 関連リンク

- 原文（en-us）: [https://blog.cloudflare.com/network-performance-birthday-week-2026/](https://blog.cloudflare.com/network-performance-birthday-week-2026/)
- 本リポジトリ内の関連記事: [Webはどれくらい速いのか: BEACON](./2026-09-28-how-fast-is-the-web.md) / [Radar Researcher の紹介](./2026-08-07-introducing-radar-researcher.md)
- 記事内から張られているリンク:
  - [前回の更新（Agents Week、2026年4月）](https://blog.cloudflare.com/network-performance-agents-week/)
  - [APNIC のネットワーク別ユーザー推定](https://stats.labs.apnic.net/cgi-bin/aspopjson)
  - [Cloudflare Radar: Internet Quality ページの紹介（トリミアンを選んだ理由）](https://blog.cloudflare.com/introducing-radar-internet-quality-page/)
  - [Cloudflare Turnstile](https://www.cloudflare.com/products/turnstile/)
  - [Cloudflare Challenge Pages のドキュメント](https://developers.cloudflare.com/cloudflare-challenges/challenge-types/challenge-pages/)
  - [Network Performance Update タグ](https://blog.cloudflare.com/tag/network-performance-update/)
