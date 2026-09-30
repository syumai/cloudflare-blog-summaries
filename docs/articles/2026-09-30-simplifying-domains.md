# 人とエージェントのためにドメイン購入をシンプルに: 新しいドメイン検索と Registrar

- 原文: [https://blog.cloudflare.com/simplifying-domains/](https://blog.cloudflare.com/simplifying-domains/)（原題: Simplifying domains for people and agents）
- 日本語版の出どころ: Cloudflare公式の日本語版（`https://blog.cloudflare.com/ja-jp/simplifying-domains/`）は確認時点で存在しなかった（404）ため、英語版（en-us）から日本語化して要約している。タイトルも筆者による訳。公開日は英語原文の datePublished（2026-09-30T13:00:00Z）に従う。
- 公開日: 2026-09-30
- 著者: Ankit Shah, Carlos Armada
- 位置づけ: Birthday Week 2026 の記事（読了目安は原文表記で 8 分）。Cloudflare Registrar の新しいドメイン検索と、エージェント向け Registrar API・MCP・cf CLI の拡充、価格の見せ方の変更を扱う
- 関連: [cf のご紹介: Cloudflare API 全体を扱えるエージェント向け CLI](./2026-09-28-cloudflare-cf-cli-launch.md)（本記事で `cf registrar` コマンドを使う CLI。記事中で「newly launched cf CLI」として紹介）/ [Forge のご紹介](./2026-09-28-forge-open-source-generation-pipeline.md)（本記事の謝辞に Forge チームが出てくる。cf の元になる生成基盤）/ [インターネットには「第二の読者」がいる](./2026-09-30-agentic-web.md)（Birthday Week 2026 の総論。エージェントが人に代わって動くインターネット）/ [Cloudflare Walletsを発表](./2026-08-04-wallets.md)（エージェントの支払い手段。ドメイン購入の支払いについて本記事は触れていないため、同じ「エージェントによる購入」という文脈での筆者の関連づけ）/ [読み取り、発見、呼び出し、決済が可能なオープンなエージェンティックインターネットの構築](./2026-08-06-the-agentic-internet.md)
- GitHub: [docs/articles/2026-09-30-simplifying-domains.md](https://github.com/syumai/cloudflare-blog-summaries/blob/main/docs/articles/2026-09-30-simplifying-domains.md)

![記事ヘッダー画像](https://blog.cloudflare.com/_emdash/api/media/file/01M3QWWAQS5RKCSF1JT6MBMQG6.01M3QWWBPVJCX08X6W7V85Z8JA.png)
*図: 記事ヘッダー画像。ブラウザのアドレスバーに「www.」と入力中の画面の周りに、ロボットたちが配置された装飾イラスト（出典: Cloudflare Blog https://blog.cloudflare.com/simplifying-domains/。記事のソーシャル用画像（og:image）で、原文にキャプションはなく、説明は見た目からの筆者の推定。装飾のため、図としては扱わない）*

## TL;DR

- Cloudflare Registrar の**新しいドメイン検索**が登場。対応する 420 以上の拡張子すべてで、入力した語そのものを調べ、入力に合わせて結果が出て、スクロールで続きが読み込まれる。並べ替え・絞り込み・価格表示もそろう。
- エージェントからも自然に使える。**Registrar API**・**MCP**・新しい **cf CLI** で、ドメインの検索・購入・移管（transfer-in）を依頼できる。API には**サンドボックス**、拡張子ごとの情報を返す **extensions エンドポイント**、**移管**が加わった。
- 検索の裏側は、Workers（入口と証拠収集）・Durable Objects（検索 1 回につき 1 つの調整役）・Workers KV（事前に用意したデータ）・WebSocket（スナップショットと差分）で作られている。
- 価格は、新規登録価格と更新価格の両方を全ドメインで表示。Birthday Week から、`.io`・`.dev`・`.app`・`.tech` など一部の拡張子で初年度の割引がある。

## 背景・課題

記事は、ドメイン購入の体験を「格安航空券のチェックアウトで次々にオプションを勧められる」ようなものにたとえる（セキュリティは？ Web サイトは？ メールは？）。アイデアを思いついた最初の一歩が、数分で楽しくなくなってしまう。

Cloudflare Registrar は 10 年前の開始以来、原価での販売、透明な価格、不要な押し売りなしという方針をとってきた。ただ、シンプルさは購入の画面から始まるのではなく、ドメインを探し始める瞬間から始まるべきだ、というのが記事の出発点である。また、以前の検索ページは、一部の拡張子から約 20 件の購入可能な候補を示し、ときには検索語を書き換えて関連候補を出していたため、ある名前を全拡張子で見比べることができなかった。

## 発表内容 / アーキテクチャ

### エージェント向けに拡張された Registrar

- 4 月に Registrar API のベータを公開し、開発者とエージェントが、プログラムからドメインの検索・確認・登録をできるようにした。その後の拡張が次の 3 つ。
  - **サンドボックス**: 実際にドメインを買わず、実取引も起こさずに、登録のワークフローを試せる。
  - **extensions エンドポイント**: 対応する 420 以上の拡張子それぞれについて、関連情報を返す。レジストリごとに要件が異なる点を吸収しやすくする。
  - **移管（transfers）**: 他のレジストラのドメインを Cloudflare へプログラムで移せる。
- Registrar API は Cloudflare MCP 経由でも使え、エージェントは別の統合を用意せずにアクセスできる。
- 同じ機能は、今週発表した **cf CLI**（[cf のご紹介](./2026-09-28-cloudflare-cf-cli-launch.md)）でもターミナルから使える。ドメインに関する依頼は会話の形と相性がよい、と記事は書く。

### 検索のシンプル化

- 以前: 一部の拡張子から約 20 件の購入可能な結果。検索語が書き換えられることもあった。
- 今回: **入力した語そのものを、対応するすべての拡張子で**示す。入力に合わせて結果が現れ、スクロールで続きが読み込まれるので、検索し直さずに数百件を見られる。
- すでに登録済みのドメインも含めて表示し、全体像をつかみやすくする。購入可能なものだけが欲しければ、他を絞り込みで外せる。
- 並べ替えと絞り込みがあり、ログインの有無、スマートフォンかデスクかによらず、体験は同じ。

### 複雑な問いを簡単に見せる仕組み

Registrar は 420 以上の拡張子に対応するため、1 回の検索が 420 以上の空き状況の問いになる。各拡張子はレジストリが運営し、そこが登録情報の公式な記録と、空き・価格についての権威ある答えを持つ。

全レジストリに毎回問い合わせると、遅く、無駄が多い。レジストリは応答速度が異なり、リクエストの上限もあるうえ、利用者が見ない結果のための作業が多くなるためである。そこで新しい検索は、複数の情報源から「証拠」を集める。

1. 用意しておいた空き状況のデータセット（ゾーンファイルなど）と、キャッシュ済みの答え
2. DNS の答え
3. レジストリへのライブ照会

各情報源の性質の違いが、設計のポイントになる。

- データセットや DNS に**ヒットする**と、そのドメインがすでに使われているとわかる。ただし**ヒットしない**ことは、空いている証拠にならない（DNS 未設定で登録されているか、ブロック対象の場合があるため）。
- レジストリから得た最近の答えは強い証拠だが、時間とともに古くなる。
- ライブ照会は最も新しく権威があるが、時間がかかり、レジストリ側の限られた処理能力を使う。

新しい検索は、速度・鮮度・確実さのバランスを結果ごとに取りながら、これらの情報源を段階的に当たる。より良い情報が届くと、影響を受ける結果だけを動的に更新する。

### 速さと規模のための構成

新しい検索は、顧客向けと同じ Cloudflare の開発者プラットフォーム上で作られている。

- **Workers**: 公開の検索入口と、空き状況の証拠を集めるサービスを動かす。
- **Durable Objects**: アクティブな検索 1 回につき 1 つの「調整役」。
- **Workers KV**: 検索をまたいで再利用できる、用意済みのデータを保持する。

この組み合わせで、ユーザー数と 420 以上の拡張子の両方にスケールさせつつ、運用コストを低く保てる、と記事は書く。

![新しいドメイン検索のアーキテクチャ図](https://blog.cloudflare.com/_emdash/api/media/file/01M3QWRHFH4XBTXDVXGW3RQC3W.png)
*図: 検索の構成図。上の「Before you search（検索の前）」の枠に、Zone files and bulk sources → ETL pipeline（Compact datasets）→ Workers KV（Prepared evidence）の流れ。下の「While you search（検索の最中）」の枠に、Browser（Type, sort, scroll）が WebSocket（Search + viewport を送り、Snapshot + deltas を受け取る）で Search entry（Worker: Validate + route）につながり、Search session（Durable Object: Prioritize visible results / Combine evidence）、Availability resolver（Worker: Gather evidence）へと続く。Availability resolver は 1.1.1.1（DNS evidence）と Registrar（Live registry checks）に問い合わせる。Workers KV と Search session の間は「Read prepared datasets」の矢印で結ばれている（出典: Cloudflare Blog https://blog.cloudflare.com/simplifying-domains/。原文にキャプションは確認できず、説明は図の内容に基づく筆者の整理・推定）*

記事本文に沿った、各部の役割は次のとおり。

- **事前準備**: 専用のパイプラインが、レジストリのゾーンファイルなどの大量データを、コンパクトな空き状況のデータセットに変換して Workers KV に入れる。大きなデータセットは小さく分割され、あるドメインを調べるときに必要な分だけ取得できる。これらの速い確認で、多くの問いに、新しいライブ照会なしで答えられる。
- **検索セッション**（Durable Object）: 検索 1 回のやり取りを調整する。クエリ・並べ替え・絞り込みから、ネットワーク照会を待たずに結果の順序を決め、ドメインごとに受け取った最良の証拠を覚え、どの結果が画面に見えているかを追って、照会の作業が人の注目に沿うようにする。
- **WebSocket**: ブラウザとの双方向の接続。その上に独自のアプリケーションプロトコルを設計した。最初のスナップショットで順序付きのリストを作り、以降の**デルタ**メッセージは変わった項目だけを運ぶ。ブラウザは結果全体をダウンロードし直さず、1 件のドメインだけ更新できる。デルタを送る前に、Durable Object が新しい証拠と現在の答えを比べ、**強い証拠は置き換えられるが、弱い証拠は置き換えられない**。
- **別の Worker による証拠収集**: Cloudflare の 1.1.1.1 リゾルバーで DNS を引く、Registrar のライブ照会を行う、最近のキャッシュを再利用する、のいずれか。新しい答えを再利用して上流への重複リクエストを避ける。空いているドメインはいつでも登録されうるため、「空いている」という答えのキャッシュの有効期間は、「すでに取られている」という証拠より短い。

### 透明な価格と値下げ

Cloudflare Registrar は最初から原価でドメインを提供している。新しい検索と新しい価格ページは、全ドメインについて**初回登録価格と更新価格**の両方を表示する。割引中のドメインは、元の原価の登録価格に取り消し線を引き、プロモーション価格を並べて示す。

Birthday Week（今週）から、`.io`・`.dev`・`.app`・`.tech` など一部の拡張子で初年度の登録割引がある。割引対象の拡張子は、検索ページと、新しい価格ページ（pricing.registrar.cloudflare.com）から確認できる。

### 始め方

- ブラウザで検索する: cloudflare.com/domains で、すべての拡張子から探す。
- お気に入りのエージェントに頼む: cf CLI をインストールし、エージェントにドメインの検索・登録・移管を頼む。
- API で組み込む: Registrar API で、ドメイン検索と登録を自分のアプリやワークフローに組み込む。

## コード例

記事中のコード例は、cf CLI の 3 つのコマンドで、それぞれ会話の依頼文に対応している（原文のまま転記）。

```bash
# 「example.com は取れますか？」（Is example.com available?）
cf registrar registrations check example.com

# 「example.com を買って」（Buy example.com.）
cf registrar registrations create example.com

# 「example.com を今のレジストラから移管して」（Transfer example.com from my current registrar.）
cf registrar registrations transfer-in example.com \
  --auth-code "$(echo -n 'YOUR_EPP_CODE' | base64)" \
  --auto-renew
```

- 1 つ目の `check` は空き状況の確認、2 つ目の `create` は登録（購入）、3 つ目の `transfer-in` は他のレジストラからの移管。
- 移管では、`--auth-code` に EPP コード（ドメイン移管用の認証コード）を **Base64 でエンコードして**渡す。コード例では `echo -n 'YOUR_EPP_CODE' | base64` の結果を埋め込んでいる（`-n` は末尾の改行を付けないための指定）。`--auto-renew` は、移管後の自動更新を有効にするオプションと読めるが、記事は詳しく説明していない。
- 上の 3 行の見出し代わりの日本語コメントは、原文の依頼文（引用符付きの英文）を筆者が訳して添えたもの。
- 記事は、それぞれの依頼を「エージェントに話しかける形」で示している。実際にエージェントがどのコマンドを選ぶかは、cf CLI 側の仕組みである（[cf のご紹介](./2026-09-28-cloudflare-cf-cli-launch.md)の `cf cli search` なども参照）。

## ユースケース

- **ドメイン探しの効率化**: 一語を入力すると、全拡張子の空き状況と価格が並ぶ。登録済みの名前も見えるので、「この語は `.com` は取られているが `.dev` は空いている」といった比較が 1 画面でできる。
- **エージェントへのドメイン購入の委任**: 「example.com は空いている？」「買って」と頼み、エージェントが cf CLI・MCP・API で確認から登録まで行う。
- **他社からの移管**: 「今のレジストラから移して」と頼み、EPP コードを渡して `transfer-in` を実行する。
- **レジストラ機能の自前の組み込み**: Registrar API とサンドボックスで、実取引なしに登録フローを検証し、自分のアプリやワークフローにドメイン検索・登録を組み込む。
- **初年度割引の活用**: `.io`・`.dev`・`.app`・`.tech` など、割引対象の拡張子を、価格ページや検索結果で比べる。

## 所感・ポイント

- 見どころは「何百もの問いを 1 つの自然な検索に見せる」設計である。権威ある答えを出すレジストリは遅く、上限もあるため、データセット・DNS・キャッシュ・ライブ照会という強さの違う証拠を集め、より強い証拠が来たときだけ結果を更新する、という考え方になっている。「ヒットは確かな証拠、ミスは証拠にならない」という非対称を、設計にそのまま反映している点が読みどころ。
- WebSocket のスナップショット＋デルタと、Durable Object が「強い証拠だけが弱い証拠を置き換える」ように比較してから送る、という手順は、リアルタイム UI を作る際の設計の参考になる。検索 1 回につき 1 つの Durable Object という割り当ても、Durable Objects の典型的な使い方と言える。
- 「空き」のキャッシュを「取られている」より短くするのは、状態が変わる方向の非対称性を反映した判断。
- エージェント側は、Registrar API・MCP・cf CLI の 3 つの入口があり、同じ機能を使い分けられる。本記事は支払い手段（ウォレットなど）には触れておらず、購入時の課金や承認の扱いは記事からは読み取れない。
- 画像キャプションは、ヘッダー画像と構成図のいずれも、取得した本文から原文のキャプションを確認できなかったため、説明は図の内容に基づく筆者の整理・推定。
- **サンプル対象外**: 本記事の中心は Cloudflare Registrar の検索体験と API で、ドメインの登録はレジストリとの実取引を伴うため、第三者が再現できる最小の Workers サンプルとして成立しません（検索の内部実装は社内サービスで、公開された SDK やテンプレートもありません）。Workers・Durable Objects・KV・WebSocket を使う構成自体は一般的ですが、記事の要点である「ゾーンファイル由来のデータセットと複数の証拠の統合」を 100 行前後で再現することはできないため、`examples/` は作成していません。

## 関連リンク

- 原文（en-us）: [https://blog.cloudflare.com/simplifying-domains/](https://blog.cloudflare.com/simplifying-domains/)
- 本リポジトリ内の関連記事: [cf のご紹介](./2026-09-28-cloudflare-cf-cli-launch.md) / [Forge のご紹介](./2026-09-28-forge-open-source-generation-pipeline.md) / [インターネットには「第二の読者」がいる](./2026-09-30-agentic-web.md) / [Cloudflare Walletsを発表](./2026-08-04-wallets.md) / [読み取り、発見、呼び出し、決済が可能なオープンなエージェンティックインターネットの構築](./2026-08-06-the-agentic-internet.md)
- 記事内から張られているリンク:
  - [Cloudflare Registrar の開始（10 年前）](https://blog.cloudflare.com/introducing-cloudflare-registrar/) / [ドメインレジストラとは（Learning Center）](https://www.cloudflare.com/learning/dns/glossary/what-is-a-domain-name-registrar/)
  - [トップレベルドメインとは](https://www.cloudflare.com/learning/dns/top-level-domain/) / [対応拡張子の価格ページ](https://pricing.registrar.cloudflare.com/)
  - [Registrar API（開発者ドキュメント）](https://developers.cloudflare.com/api/resources/registrar/) / [Registrar API の開発者ガイド](https://developers.cloudflare.com/registrar/registrar-api/)
  - [Cloudflare MCP サーバー](https://developers.cloudflare.com/agents/model-context-protocol/cloudflare/servers-for-cloudflare/)
  - [cf CLI の発表記事](https://blog.cloudflare.com/cloudflare-cf-cli-launch/)
  - [Registrar API ベータの発表（4 月）](https://blog.cloudflare.com/registrar-api-beta/)
  - [Registrar サンドボックス API](https://developers.cloudflare.com/api/resources/registrar_sandbox/) / [extensions エンドポイント](https://developers.cloudflare.com/api/resources/registrar/subresources/extensions/) / [transfer-in（移管）API](https://developers.cloudflare.com/api/resources/registrar/subresources/transfer_in/methods/create/)
  - [Workers](https://developers.cloudflare.com/workers/) / [Durable Objects](https://developers.cloudflare.com/durable-objects/) / [Workers KV](https://developers.cloudflare.com/kv/) / [Workers の WebSocket](https://developers.cloudflare.com/workers/runtime-apis/websockets/) / [1.1.1.1](https://developers.cloudflare.com/1.1.1.1/)
  - [ドメイン検索ページ](https://www.cloudflare.com/domains/)
