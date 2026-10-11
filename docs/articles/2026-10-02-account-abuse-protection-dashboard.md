# 糸をたどる: アカウント不正を調査するための新しいダッシュボード（Account Abuse Protection）

- 原文: [https://blog.cloudflare.com/account-abuse-protection-dashboard/](https://blog.cloudflare.com/account-abuse-protection-dashboard/)（原題: Follow the thread: a new dashboard to investigate account abuse）
- 日本語版の出どころ: Cloudflare公式の日本語版（`https://blog.cloudflare.com/ja-jp/account-abuse-protection-dashboard/`）は確認時点で存在しなかった（404）ため、英語版（en-us）から日本語化して要約している。公開日は英語原文の datePublished（2026-10-02）に従う。
- 公開日: 2026-10-02
- 位置づけ: Birthday Week 2026 の記事（Application Security / Bot Management / 製品ニュース）
- 著者: Nicole Justus
- 関連: 同じ Birthday Week のセキュリティ系記事として、枠組み記事 [AI 時代の適応型アプリケーションセキュリティ](./2026-09-29-ai-era-framework.md)（Account Abuse Protection のドキュメントに言及）、[Cloudflare Application Profiles でポジティブセキュリティを実現する](./2026-09-29-application-profiles.md)、[Threat Signals のご紹介](./2026-09-29-threat-signals.md)、[適応型 AI WAF テスト](./2026-09-29-adaptive-ai-waf-testing.md)
- GitHub: [docs/articles/2026-10-02-account-abuse-protection-dashboard.md](https://github.com/syumai/cloudflare-blog-summaries/blob/main/docs/articles/2026-10-02-account-abuse-protection-dashboard.md)

## TL;DR

- AI の普及で、漏えいした認証情報と合成メディアを組み合わせた「それらしい本人」の偽装が容易になり、ログイン時などの「一時点の本人確認」だけでは信頼できなくなった。記事は、アカウントの過去の振る舞いと照らす**ステートフルな信頼モデル**への移行を主張する。
- Cloudflare の Account Abuse Protection（AAP）は、ログイン/サインアップで使う識別子（メールアドレス・ユーザー名・電話番号）を暗号学的にハッシュ化した**ドメインごとの Hashed User ID** をアカウントの代理とし、エッジで観測したネットワーク・デバイスのシグナルを履歴として蓄積する。
- 新しい**不正（fraud）ダッシュボード**で、母集団の概観から個別アカウントの調査までを「調査の漏斗」として辿れる。Early Access 顧客向けに先行提供。
- 調査の流れは「異常の発見 → フィルタで絞り込み → アカウントの調査 → 対応の判断（Hashed User ID を使った WAF ルールで Challenge / Block）」の4段階。
- PII の露出を抑えるため、新ロール「Account Abuse Protection」と「Account Abuse Protection PII」が追加された。

## 背景・課題

従来の不正対策は、正しいパスワードの入力、生体認証、liveness チェックといった**一時点の本人確認**に頼ってきた。これを破るには、実在ユーザーから認証情報などを盗む必要があり、実行も拡大も難しかった。しかし AI が広く使えるようになった現在、不正者は漏えい済みの認証情報と、本人確認をすり抜けるよう作られた合成メディアを組み合わせ、正当な ID を偽造・模倣できる。

記事の要点は次のとおり。

- 1回の確認を通過しても、アカウント自体が信頼できるとは限らない。
- 1回の説得力あるやり取りは偽造できても、**正当な振る舞いが一貫して続くパターン**を作り出すのははるかに難しい。
- 従来の本人確認は「今この人はチェックを通過できるか」を問う。ステートフルなアプローチはそれに加えて「このアカウントについて知っていること・確立された振る舞いと合っているか」を問う。Cloudflare では、やり取りごとに過去の振る舞い・ネットワーク・デバイスのパターンと照らして信頼を継続的に評価し直す。

## 発表内容 / アーキテクチャ

### Account Abuse Protection の仕組み

AAP は、ログインとサインアップの活動をまたいで不正を検知・調査するための、ステートフルなアカウント概観を作る。

1. 顧客が、既存のログイン/サインアップのフローから識別子（メールアドレス、ユーザー名、電話番号など）を設定する。
2. Cloudflare がその値を暗号学的にハッシュ化し、プライバシーを保つドメインごとの **Hashed User ID** を作る。AAP では Hashed User ID が1つのアカウントを表し、その活動の軸になる。
3. ログイン/サインアップのたびに、イベントと、Cloudflare のエッジで観測したネットワーク・デバイスのシグナルが追加される。
4. 履歴が溜まることで、そのアカウントの「普段の振る舞い」という文脈ができ、逸脱を見つけやすくなる。不正対策チーム（セキュリティインテリジェンス、調査、Trust & Safety、リスク/コンプライアンスの担当者）の調査の土台になる。

今回の発表は、これらのアカウント概観を1つの作業場にまとめた**不正ダッシュボード**（Early Access 顧客に先行提供）。分析担当者は、ユーザー母集団全体を見て、疑わしい傾向を見つけ、集計パターンから個別アカウントの調査へ移れる。

### ダッシュボードの概観: 母集団から個別アカウントへ

ダッシュボードは「調査の漏斗」として設計されている。疑わしいイベントが見つかったら、個々のアカウントを全部調べなくても、アカウント母集団の概観で疑わしいパターンの規模と形を把握できる。

- ログイン/サインアップの総量、それらを生成したアカウント数、観測されたユニークな IP アドレス数とデバイス数を確認できる。
- 国別・ASN 別の内訳で、活動がどこで観測されたかの文脈が得られる。
- 概観が答えを出す問いの例: ログイン/サインアップの量が想定外に変化したか。失敗したログインや漏えい済み認証情報の一致が増えているか。ログイン失敗率が最も高いアカウントはどれか。イベントが特定の国・ASN・時間帯に集中していないか。サインアップの急増に共通する特徴はあるか。攻撃の影響を受けた可能性のあるアカウントはどれか。
- そこから、キャンペーンの範囲を見極め、手動レビューの優先順位を付け、アカウント内で何が起きたかを再構成し、対応を決める。

![アカウント不正対策ダッシュボードの概観画面](https://blog.cloudflare.com/_emdash/api/media/file/01M3WNK39S63QAFS763E1VMJST.png)
*図: ダッシュボードの概観画面。上部に Total events（3.2K）・Unique accounts（824）・Unique IPs（939）・Unique devices（758）、中央に時間別のイベント数（Login 2.7K・Sign up 524）の積み上げ棒グラフ（午後に急増）、下部に Top countries と Top ASNs の内訳（出典: Cloudflare Blog https://blog.cloudflare.com/account-abuse-protection-dashboard/ 。画像に alt テキストはなく、キャプションは画像の内容から推定した）*

### AAP の実践: クレデンシャルスタッフィング攻撃の調査

記事は、不正対策/セキュリティのアナリストチームが、不審なログイン活動を調べる想定でダッシュボードの使い方を示す。

**1. 異常の発見。** アカウント母集団の概観で、疑わしい活動が単発か広範なキャンペーンかを判断する。失敗ログインの増加を受けて、ログインイベントの「Leaked credential check」の結果を確認する。記事の例では、約 2.4K のイベントが漏えいしたユーザー名またはパスワードの結果を示し、認証情報が clean と分類されたイベントは 11.7K だった。記事は、これは**調査の手がかりであり、該当アカウントすべてが侵害された確認ではない**と明記している。次に、複数アカウントが同じ IP や ASN に結び付いていないか、個別アカウントが異常に多くの IP から現れていないかを見て、攻撃の範囲を推定する。

![Leaked credential checks の内訳](https://blog.cloudflare.com/_emdash/api/media/file/01M3WNK1EHNXCC357WF8PAB5V6.png)
*図: Leaked credential checks の内訳（Total: 14K）。Username & Password 0（0%）、Username leaked 1.3K（9.2%）、Password Leaked 1.1K（7.6%）、Clean 11.7K（83.1%）（出典: Cloudflare Blog https://blog.cloudflare.com/account-abuse-protection-dashboard/ 。キャプションは画像の内容から推定した。なお本文の「約 2.4K」は Username leaked と Password Leaked の合計に相当する）*

**2. 調査範囲の絞り込み。** フィルタで、最も懸念される信号の組み合わせを持つアカウントに絞る。記事の例は「失敗ログイン 3 回以上」「漏えい認証情報イベント 3 件以上」「ユニーク IP 5 件以上」。絞り込んだ集団から、直近の活動が最も緊急なアカウントの Hashed User ID を選ぶ。

![フィルタの設定画面](https://blog.cloudflare.com/_emdash/api/media/file/01M3WNK5FS707J1AZ32WDR9RPP.png)
*図: フィルタの設定。Failed logins ≥ 3、Leaked credential events ≥ 3、Unique IPs = 5 を AND で結合し、期間は Last 7 days（出典: Cloudflare Blog https://blog.cloudflare.com/account-abuse-protection-dashboard/ 。キャプションは画像の内容から推定した）*

![絞り込み結果のアカウント一覧](https://blog.cloudflare.com/_emdash/api/media/file/01M3WNJXRX8MVSPKDVSA27HF99.png)
*図: 絞り込み後のアカウント一覧。User ID（Hashed User ID）ごとに Events・Failed logins・Leaked credential events・Unique IPs・Top country・Top IP が表示される（出典: Cloudflare Blog https://blog.cloudflare.com/account-abuse-protection-dashboard/ 。キャプションは画像の内容から推定した）*

**3. アカウントの調査。** ログイン試行を確認し、新しいデバイスや場所を特定し、活動がどう展開したかを再構成する。イベントテーブルで、以前の clear なイベントと後の不審な活動を比べ、パターンがいつ始まったか、単発か反復した試行かを判断する。各イベントには **Ray ID** があり、Security Events で関連情報を引ける。

![アカウントのイベントログ](https://blog.cloudflare.com/_emdash/api/media/file/01M3WNJSEMWP2MDJSTG4YTJVM5.png)
*図: 個別アカウントのイベントテーブル。Timestamp・Ray ID・Event type・LCC Result・Location・Bot Score・Device Type・OS の列を持つ。画像では、サンパウロ（BR）からの Login が `username_leaked` で連続する一方、それ以前の San Francisco（US）からの Login / Sign Up は Clear（出典: Cloudflare Blog https://blog.cloudflare.com/account-abuse-protection-dashboard/ 。キャプションは画像の内容から推定した）*

**4. 対応の判断。** 調査でアカウントの侵害が確認されれば、確立された復旧プロセスを開始する。また **Hashed User ID を WAF ルールで使い**、以後その ID に紐づくリクエストを Challenge または Block できる。

![Hashed User ID を使った WAF ルールの作成画面](https://blog.cloudflare.com/_emdash/api/media/file/01M3WNK783VJGV0A4RT6B4XWEG.png)
*図: WAF のカスタムルール作成画面。ルール名「Mitigate by UserIDs」、式は `upper(cf.fraud.user_profile.id) in {...}`、アクションは Managed Challenge（出典: Cloudflare Blog https://blog.cloudflare.com/account-abuse-protection-dashboard/ 。キャプションは画像の内容から推定した）*

### 個別アカウントの詳細ビュー

個別アカウントのビューは、そのアカウントのログイン/サインアップ活動を要約する。ログイン成功率、漏えい認証情報の一致、よく関連付くネットワーク・場所・デバイスなどが表示され、その下で個々のイベント（タイムスタンプ、Ray ID、適用された緩和策）を確認できる。記事が挙げる、この要約とログで答えられる問いは次のとおり。

- 単発のログインか、反復した試行の一部か。
- そのログインで新しい国・ネットワーク・IP・デバイスが現れたか。
- その後のユーザーの振る舞いが変わったか。
- 不審なイベントの前後で何が起きたか。
- サインアップの直後に集中したログイン活動が続いたか。
- サインアップとその後のログインで、ネットワークやデバイスの特徴が異なっていたか。

これらを合わせて、アカウントに復旧・アクセス制限・その他の対応が必要かを、顧客の扱い方針に応じて判断する。十分な証拠があれば、Hashed User ID を WAF ルールに使える。

![個別アカウントの詳細ビュー](https://blog.cloudflare.com/_emdash/api/media/file/01M3WNJZJ0KP9AQPATSVJAFWQ4.png)
*図: 個別アカウントのビュー（Account #7B975…3130F activity）。Account details に Total Events（21: Login 20 / Sign up 1）、Leaked credential check match、Login success rate 95% / failure rate 5%、Custom rule（Rule applied）、Unique IPs・Top ASNs・Top Countries・Top Cities・Devices Seen・Top User Agents などが並び、下に活動イベントのテーブルがある。右上に「Mitigate account」ボタン（出典: Cloudflare Blog https://blog.cloudflare.com/account-abuse-protection-dashboard/ 。キャプションは画像の内容から推定した）*

### 不要なデータ露出を抑える設計

AAP はアカウントレベルの文脈を提供しつつ、誰がアカウント情報にアクセスできるかを顧客が制御できるようにしている。今回、2つの新ロールが追加された。

| ロール | 制御する対象 |
|---|---|
| Account Abuse Protection | ダッシュボードへのアクセス |
| Account Abuse Protection PII | 追加のアカウントレベルの PII（例: メールアドレス）へのアクセス |

- 顧客管理者には、各メンバーの調査に必要な範囲に応じて、必要最小限（need-to-know）でロールを割り当てることが推奨されている。
- PII を含む Logpush ジョブを作成・更新するにも Account Abuse Protection PII ロールが必要。これにより、ダッシュボードとデータエクスポートの両方で最小権限を適用できる。

### 提供状況

新ダッシュボードは、まず Account Abuse Protection の Early Access 顧客に提供される。Bot Management Enterprise の顧客は Early Access にサインアップでき、新規の Bot Management Enterprise 検討顧客も同じフォームから連絡できる。ボット検知は「自動化された活動か」を理解する助けになり、AAP は「ログイン/サインアップが正当で一貫した利用に見えるか」を不正対策チームが調べるためのアカウントレベルの概観を加える。両者を合わせ、アカウント作成とログインにまたがる自動化・人手による不正の双方に対処できる、と記事は述べる。

## コード例

記事本文にコードブロックはない。唯一のコードに相当するものは、WAF ルール作成画面のスクリーンショット内に表示された式で、`cf.fraud.user_profile.id`（Hashed User ID）を使ってリクエストを照合し、アクションに Managed Challenge を選んでいる。画像から読み取れる式は次のとおり（ID の値は画面上のサンプル。画像の文字を転記しており、記事本文のテキストではない）。

```
upper(cf.fraud.user_profile.id) in {"9F1A2B7C4D1E5068A1B2C3D4E5F60711" "9F3A2B7C4D1E5068A1B2C3D4E3F50718" "9F3A2B7C4D1E5068A1B2C3D4E5F60712" "9F3A2B7C4D1E5068A1B2C3D4E5F60710" "9F3A2B7C4D1E5068A1B2C3D4E5F60719"}
```

- ルール名は「Mitigate by UserIDs」。画面の説明は「特定の ID をプロファイルに持つユーザーからのリクエストに一致し、Managed Challenge を発動して本人確認を行う」旨。
- `in {...}` は WAF の式言語の集合演算で、複数の Hashed User ID を1つのルールにまとめて指定できる。
- 式は 213 / 4000 文字と表示されている。

## ユースケース

- **クレデンシャルスタッフィングの被害範囲の把握**: 失敗ログインや漏えい認証情報の一致の増加から、影響を受けたアカウントを絞り込み、優先順位を付ける。
- **アカウントの乗っ取り調査**: 過去の clear なイベントと後の不審なログイン（新しい国・IP・デバイス）を時系列で比べ、パターンの開始時点を特定する。
- **サインアップ不正の分析**: サインアップの急増に共通する国・ASN・デバイスの特徴を確認し、サインアップ後のログイン活動と突き合わせる。
- **緩和策の適用**: 調査結果を Hashed User ID に基づく WAF ルール（Challenge / Block）に反映し、同じアカウントへの以後のリクエストを制御する。
- **最小権限での運用**: 不正対策チームだけがダッシュボードにアクセスし、PII の閲覧はさらに限定されたメンバーだけに許可する。

## 所感・ポイント

- 「一時点のチェック」から「アカウントの履歴と照らす」へ、という考え方は、同じ Birthday Week の [AI 時代の適応型アプリケーションセキュリティ](./2026-09-29-ai-era-framework.md) が示す、静的な防御から適応型の防御へという流れとも合う。
- 本記事の中心はダッシュボード（調査用の UI）で、Hashed User ID・ロール・Logpush の権限分離といった、データの扱い方の設計が実務上のポイントになる。
- 画面例の数値（2.4K / 11.7K など）は説明用の例であり、実際の攻撃規模や Cloudflare 全体の統計を示すものではない。
- Early Access 向けであり、一般利用可能ではない。
- サンプル対象外: 本記事の中心はプライベートな Early Access のダッシュボード機能で、Workers 上で再現できる最小実装がないため、デプロイ可能なサンプルは作成していません。

## 関連リンク

- Account Abuse Protection ドキュメント: https://developers.cloudflare.com/bots/account-abuse-protection/
- Early Access の申し込み: https://www.cloudflare.com/lp/account-abuse-protection/
- 原文: https://blog.cloudflare.com/account-abuse-protection-dashboard/
- 関連 Wiki: [AI 時代の適応型アプリケーションセキュリティ](./2026-09-29-ai-era-framework.md) / [Cloudflare Application Profiles](./2026-09-29-application-profiles.md) / [Threat Signals](./2026-09-29-threat-signals.md) / [適応型 AI WAF テスト](./2026-09-29-adaptive-ai-waf-testing.md)
