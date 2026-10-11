# Protected Quick Tunnels: アカウント不要で、次の開発プロジェクトにシンプルな認証を

- 原文: [https://blog.cloudflare.com/protected-quick-tunnels/](https://blog.cloudflare.com/protected-quick-tunnels/)
- 日本語版の出どころ: Cloudflare公式の日本語版（ja-jp）は確認時点で存在しなかった（404）ため、英語版（en-us）から日本語化して要約している。公開日は英語原文の datePublished（2026-10-02）に従う。
- 公開日: 2026-10-02
- 位置づけ: Birthday Week 2026 の記事（Cloudflare Tunnel / Cloudflare Access / インターン企画）
- 著者: Nikita Cano、Hugo Vicente、Alessandro Frigerio
- 関連: [エージェントアクセスモデル（The Agent Access Model）](./2026-08-05-the-agent-access-model.md)（エージェントに与える権限を小さくする、というアクセス制御の考え方）、[次世代のMCP — ステートレスなプロトコルへ生まれ変わったModel Context Protocol](./2026-08-06-mcp-v2.md)（記事が挙げる「ノートPC上の MCP サーバーを公開する」場面の背景）、[エージェントがローカルトレースでWorkersをデバッグ可能に](./2026-08-04-local-tracing.md)（コーディングエージェントがローカル開発環境で動く流れ）、[読み取り、発見、呼び出し、決済が可能なオープンなエージェンティックインターネットの構築](./2026-08-06-the-agentic-internet.md)
- GitHub: [docs/articles/2026-10-02-protected-quick-tunnels.md](https://github.com/syumai/cloudflare-blog-summaries/blob/main/docs/articles/2026-10-02-protected-quick-tunnels.md)

![4ステップのフロー図](https://blog.cloudflare.com/_emdash/api/media/file/01M3WEQPPSBFQSKRNK84673MEC.png)
*図: 保護された Quick Tunnel の4ステップのフロー。訪問者がリンクを開く → Cloudflare Access がワンタイム PIN でメールアドレスを検証 → 手元の cloudflared が許可リストと照合 → 招待された訪問者だけがアプリに到達する（出典: Cloudflare Blog https://blog.cloudflare.com/protected-quick-tunnels/ 。キャプションは画像の alt テキストに基づく。画像内には「Visitor / Cloudflare / Your machine」の3区分と、「Opens your link」「Verifies email」「Checks the list」「Your app」の4ステップが描かれている）*

## TL;DR

- Quick Tunnels は、アカウント・ドメイン・費用なしでローカルのサービスを `trycloudflare.com` のランダムな URL で公開する機能（2021年に提供開始）。コーディングエージェントが使う場面が増え、リンクを知っていれば誰でも開けることが課題になっていた。
- **cloudflared 2026.9.3** 以降、`--allowed-mail` フラグで、許可するメールアドレスやドメインを指定できる。訪問者は Cloudflare Access のワンタイム PIN で自分のメールアドレスを証明する。**トンネルを作る側も訪問者側も Cloudflare アカウントは不要**。
- 設計の核は認証と認可の分離。メールの所有確認は Cloudflare Access が行い、許可リストとの照合は**手元の cloudflared がメモリ上で**行う。招待者リストはマシンの外に出ない。
- Workers 上の小さな認証ブローカー（ステートレス）が、Access で検証した ID を短命の署名付き assertion に変換して cloudflared に渡す。
- 機能は Quick Tunnels と同じく無料。Wrangler からも `wrangler tunnel quick-start` で同様に使える。2人のインターンが製品要件からブローカー、cloudflared のリリースまで担当した。

## 背景・課題

Quick Tunnels は2021年に、ローカル開発環境で動かしているサービスやプロジェクトを手軽に共有するために提供が始まった。cloudflared（Cloudflare の軽量コネクタ）が、ローカルのポートをランダムな URL として公開する。アカウント登録もドメインも不要なので、人間にとっても、サインアップフォームで詰まらないエージェントにとっても、ローカルポートから URL を得る最短経路になっている。

記事は、エージェントの普及で利用が増えた場面を3つ挙げる。

- コードを書くエージェントが、結果をユーザーに見せる場所が要る。
- 自宅の Mac mini で動くエージェントに、スマートフォンから到達したい。
- ノートPC上の MCP サーバーを、ホスト型アシスタントから呼ぶために公開エンドポイントが要る。

`--output json` を付ければログが1行ずつ JSON になるので、エージェントはテキストをスクレイピングせずに URL を取り出せる。記事によれば、エージェントの普及以降 Cloudflare Tunnel と Quick Tunnels の利用は指数関数的に伸びている。2026年9月18日には Quick Tunnels のページへのリンクが Hacker News のトップに載り、800 ポイント超・300 コメント超を集めた。

ただし、昔からの問題は変わらない。**リンクを知っていれば誰でも開ける**。Hacker News のコメントには「誰かのエージェントが、最も機微で私的な情報や、安全でない開発中アプリを世界に公開するトンネルを作るまで、どれくらいかかるか」という問いがあり、本記事はこれへの回答として位置づけられている。

## 発表内容 / アーキテクチャ

### `--allowed-mail` による制限

cloudflared 2026.9.3 から、Quick Tunnel に `--allowed-mail` を指定できる。指定した場合、許可されたメールアドレス・ドメインの訪問者だけが入れる。

- 訪問者は URL を開き、メールアドレスを入力し、受信箱に届いたコードを入力すると、アプリに到達する。それ以外の人は、リクエストが1つもマシンに届く前に止められる。
- DNS レコードの作成、設定ファイル、ダッシュボードの操作は引き続き不要。
- フラグを繰り返し指定する、または `*@example.com` のようにドメイン全体を許可することで、人数を増やせる。
- `--allowed-mail` を付けなければ従来どおりの公開 Quick Tunnel のまま。
- 許可者を変えるには、cloudflared を止めて新しいトンネルを開始する。プロセスが終了した時点で、全員のアクセスが終わる。
- 固定のホスト名や IdP グループのような豊富なルールが必要な場合は Cloudflare Tunnel + Cloudflare Access、自宅のエージェントに公開 URL なしで自分のデバイスから双方向に到達したい場合は Cloudflare Mesh を使う、と記事は案内している。

### エージェントの既定にする

保護がフラグ1つなので、エージェントにも指示しやすい。AGENTS.md のようなエージェントの指示ファイルに「Quick Tunnel を起動するときは必ず `--allowed-mail me@example.com` を付ける」と書けば、以後エージェントが共有するプレビューは自分だけが開ける。ただしエージェントが指示に従わないこともあるため、実行内容を確認すること。cloudflared は、トンネルがメール認証を使っているか、ルールがいくつあるかを表示する（アドレス自体は表示しない）。

### Wrangler からの起動

Workers で開発している場合は、最新の wrangler から同種のトンネルを起動できる。Wrangler は、フラグの繰り返し・カンマ区切り・ワイルドカードドメインに対応し、デバッグログからは `--allowed-mail` の値を取り除く。

### 認証と認可を分ける設計

フローは次の2つの問いに分解される。

1. この人はこのメールアドレスを所有しているか（認証）→ Cloudflare Access のワンタイム PIN が答える。
2. その人を入れてよいか（認可）→ 手元の cloudflared が、検証済みのアドレスと入力したルールを比較して決める。

Cloudflare の他の製品では、認可のルールはすべて Cloudflare アカウントに置かれる。Quick Tunnel にはアカウントがないので、「招待者リストをどこに置くか」が難所だった。要件は次の4つだった。

- Quick Tunnels をアカウント不要のまま保つ（サインアップ手順があるとワンコマンドの意味がなくなる）。
- 公開 Quick Tunnels のリクエスト経路を変えない。
- サインイン後のリクエストごとに、中央のポリシー参照を行わない。
- 開発者が端末に打ち込んだメールアドレスのプライバシーを守る。

検討された2案と、採用された設計は次のとおり。

| 案 | 内容 | 結果 |
|---|---|---|
| 案1 | すべての Quick Tunnel ホスト名の前に Cloudflare Access アプリケーションを置く | 数十万のトンネルが同時に動き、数分で消えるものも多い。それぞれにアプリとポリシーが要り、所有するアカウントもないため、新しい名前空間と動的ルーティングを発明する必要があり不採用 |
| 案2 | cloudflared がルールを持ち、Tunnel サービスがコードの送信と検証も行う | 「各コネクタが自分のリストを確認する」認可側は良い。しかしメール配信、悪用対策、安全なチャレンジ、セッション管理、アクセシブルで多言語のサインインページなどの運用は重く、Access が既に解決済みなので認証側は不採用 |
| 採用 | Access が所有確認、Workers 上のステートレスな認証ブローカーが署名付きハンドオフを発行、cloudflared が認可 | 招待者リストがマシンの外に出ない |

ブローカーは設計上ステートレスで、トンネルのポリシー、訪問者のセッション、ID レコードを保存せず、トンネルの許可リストも見ない。Cloudflare が知るのは「このトンネルはメール認証を必要とする」ことだけで、誰を招待したかは知らない。

### リクエストの流れ

保護付きトンネルの作成は公開トンネルと同じくアカウント不要で、cloudflared が余分に送るのは認証モードだけ（ルールは送らない）。サービスがそのモードを確認できなければ、cloudflared は誤って公開 URL を渡さないよう、起動を拒否する。

訪問者が初めて URL を開くと、次の順に進む。

1. cloudflared がセッションのないリクエストを検知し、ブラウザごとに紐づく、ランダムで単回使用の state（有効10分）を付けて `login.trycloudflare.com` にリダイレクトする。
2. Cloudflare Access が訪問者のメールにワンタイム PIN を送り、検証する。
3. ブローカーが Access の ID を確認し、トンネルのホスト名と state に紐づく短命の署名付き assertion を返す。assertion は form POST で渡されるため、URL・ブラウザ履歴・ログには残らない。
4. cloudflared が assertion を検証して state を使い切り、メールをルールと照合する。一致すればローカルのセッションを作り、訪問者を元のページへ送る。一致しなければ、リストについて何も明かさない汎用の応答を返す。
5. 以降のリクエストは、最長4時間（Access のサインインがそれより早く切れる場合はそれまで）、または cloudflared を止めるまで、そのセッションを使う。中央の参照もポリシーサービスもない。

セッション Cookie に入るのはランダム値と有効期限だけで、訪問者が誰かは含まれない。cloudflared は転送前に認証用の資格情報を取り除くので、アプリはそれを見ることがなく、ログインフローを実装する必要もない。どこかの確認が失敗すればリクエストはローカルサービスに届かず、保護付きトンネルが公開モードにフォールバックすることはない。

### インターンによる開発

Protected Quick Tunnels は、製品面を Hugo Vicente、エンジニアリングを Alessandro Frigerio の2人のインターンが担当し、製品要件から認証ブローカー、cloudflared のリリースまでを進めた。

## コード例

記事に掲載されているコマンドを引用する（出力例は記事にない）。

### 基本の起動

```
cloudflared tunnel --url http://localhost:5173
```

記事冒頭の、保護なしの Quick Tunnel の例。コーディングエージェントがこのコマンドを実行してリンクを返す場面が想定されている。

### 1アドレスのみ許可

```
cloudflared tunnel --url http://localhost:8080 \
  --allowed-mail alice@example.com
```

`--allowed-mail` で `alice@example.com` だけを許可する。Alice は URL を開き、メールアドレスと受信箱のコードを入力してアプリに到達する。

### 複数アドレス・ドメイン全体の許可

```
cloudflared tunnel --url http://localhost:8080 \
  --allowed-mail alice@example.com \
  --allowed-mail bob@example.com \
  --allowed-mail '*@example.com'
```

フラグを繰り返し指定できる。`'*@example.com'` はドメイン全体を許可する指定で、シェルによる展開を避けるためにクォートされている。

### エージェントの指示ファイル（AGENTS.md の例）

```
When you start a Quick Tunnel, always add --allowed-mail me@example.com.
```

エージェントが読む指示ファイルに1行足すだけで、既定を保護付きにできる。

### Wrangler から起動

```
npx wrangler tunnel quick-start http://localhost:8080 \
  --allowed-mail alice@example.com
```

最新の wrangler で、同じ種類のトンネルを起動する。

### まとめの例

```
cloudflared tunnel --url http://localhost:8080 --allowed-mail you@example.com
```

## ユースケース

- **エージェントが作ったプレビューを自分のスマホで確認する**: dev サーバーを公開しつつ、自分のメールアドレスだけを許可する。
- **ローカルのプロトタイプを特定の同僚・顧客に見せる**: 相手のアドレスや `*@example.com` を指定して、アカウント作成なしで限定共有する。
- **ノートPC上の MCP サーバーを一時的に公開する**: ホスト型アシスタントから呼ぶ場合の、未保護の公開エンドポイントを避ける。ただし、記事が保護対象として想定するのは、ブラウザでサインインする人間の訪問者である（「Email sign-in is built for people using a browser」と書かれている）。MCP クライアントなど非ブラウザのクライアントからの利用は、記事では説明されていない。
- **エージェントの既定の挙動に組み込む**: 指示ファイルに1行足し、エージェントが毎回フラグを付けるようにする。

## 所感・ポイント

- 「認証は Access に任せ、認可は端末側で行う」という分担が分かりやすい。ブローカーに状態を持たせないことで、数十万のトンネルが短命でもスケールし、許可リストも外に出ない。アカウントがない製品で、アクセス制御をどこに置くかという設計上の判断の例として読める。
- 失敗時は公開モードにフォールバックしない（起動を拒否する）という方針は、「保護するつもりが公開になっていた」という最悪の事故を防ぐための設計として押さえておきたい。
- 保護はあくまで「ブラウザでメール所有を証明できる人」向け。Access のグループ、固定ホスト名、サービストークンなどが必要なら、記事が案内するとおり Cloudflare Tunnel + Access に移る。
- 個別のメールアドレスは cloudflared の表示・Wrangler のデバッグログにも出さない、という扱いも配慮されている。
- 起動した URL は引き続きランダムな `trycloudflare.com` のもので、プロセスの終了とともにアクセスが終わる。長期運用の入口ではなく、短命な共有のための機能と読むのがよい。
- 画像は記事中でフロー図1点のみで、キャプションは画像の alt テキストをもとにしている。
- **サンプル対象外**: 中心機能は cloudflared（ローカルで動くコネクタ）のフラグであり、Workers 上にデプロイして要点を体験できる最小実装にはならないため、`examples/` のサンプルは作成していない。

## 関連リンク

- 原文: https://blog.cloudflare.com/protected-quick-tunnels/
- Quick Tunnels ドキュメント: https://developers.cloudflare.com/tunnel/get-started/quick-tunnels/
- Cloudflare Tunnel をはじめる: https://developers.cloudflare.com/tunnel/get-started/
- cloudflared のダウンロード: https://developers.cloudflare.com/tunnel/downloads/
- `--output` オプション（run parameters）: https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/configure-tunnels/run-parameters/#output
- Quick Tunnels の紹介（2021年）: https://blog.cloudflare.com/quick-tunnels-anytime-anywhere/
- Cloudflare Mesh: https://blog.cloudflare.com/mesh/
- Cloudflare Access: https://www.cloudflare.com/sase/products/access/
- インターンプログラム（記事内リンク）: https://blog.cloudflare.com/cloudflare-1111-intern-program/
- Hacker News のスレッド（記事内リンク）: https://news.ycombinator.com/item?id=49754785 / https://news.ycombinator.com/item?id=49756881
