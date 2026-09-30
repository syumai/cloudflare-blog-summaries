# あなたのドメインはポスト量子暗号を使っているか: 自分で確認できるようになりました

- 原文: [https://blog.cloudflare.com/post-quantum-visibility/](https://blog.cloudflare.com/post-quantum-visibility/)
- 日本語版の出どころ: Cloudflare公式の日本語版（`https://blog.cloudflare.com/ja-jp/post-quantum-visibility/`）は確認時点で存在しなかった（404）ため、英語版（en-us）から日本語化して要約している。公開日は英語原文の datePublished（2026-09-29）に従う。
- 公開日: 2026-09-29
- 位置づけ: Birthday Week 2026 の記事
- 著者・謝辞: Luke Valenta、Ollie Hsieh、Alex Krivit（記事末尾の謝辞より）
- 関連: 同じポスト量子（PQ）移行の話題として [IPsec に対する量子ダウングレード攻撃の防止](./2026-09-29-ipsec-downgrade-protection.md)（IPsec 側の PQ 対応とダウングレード対策。本記事は TLS 側の可視化）
- GitHub: [docs/articles/2026-09-29-post-quantum-visibility.md](https://github.com/syumai/cloudflare-blog-summaries/blob/main/docs/articles/2026-09-29-post-quantum-visibility.md)

![ヘッダー画像](https://blog.cloudflare.com/_emdash/api/media/file/01M3N38FH3Y8R31B3T0EBK7WEH.01M3N38GADPYXX9327HCSMAVQM.png)
*図: 記事ヘッダー画像（出典: Cloudflare Blog https://blog.cloudflare.com/post-quantum-visibility/。原文に alt テキストやキャプションがないため、掲載位置から「ヘッダー画像」と筆者が補った）*

## TL;DR

- Cloudflare は、ドメイン単位で**ポスト量子（PQ）暗号の利用状況**を見られるようにした。HTTP Traffic Analytics、Logpush、Log Explorer で確認できる。
- 従来は Cloudflare Radar のインターネット全体の集計（ブラウザ通信の約 70%、オリジン接続の約 15% が PQ）しか見えず、「自分のドメインの何割が PQ か」は分からなかった。
- 訪問者から Cloudflare への接続は `ClientTLSKeyExchangeGroup`、Cloudflare からオリジンへの接続は `OriginTLSKeyExchangeGroup` というログフィールドで確認できる。ダッシュボードには TLS Key Exchange カードが加わった。
- TLS 1.3 を有効にしておけば、訪問者が対応していれば X25519MLKEM768 が自動で交渉される。古いオリジンは Cloudflare Tunnel の背後に置けば、オリジン側の改修なしで PQ 化できる。

## 背景・課題

NIST は 2024 年に、RSA と楕円曲線暗号（ECC）を 2030 年までに非推奨にすべきだとした。多くの政府・規制当局もこの期限を支持している。Cloudflare の多くの製品は、すでにハイブリッド ML-KEM による鍵共有で PQ 暗号化されている。PQ 暗号化は、今データを収集しておき将来の量子コンピュータで解読する **harvest-now-decrypt-later 攻撃**を防ぐために、今すぐ必要とされる。3〜10 年後に解読されても価値のあるデータ（公共、防衛、金融、通信、医療など）を扱う組織は、早めの保護を検討すべきだと記事は述べる。

課題は「見えないこと」だった。Radar では、訪問者から Cloudflare への接続と、Cloudflare からオリジンへの接続の両方について、インターネット全体の PQ 統計が公開されている。また、オリジンが対応している暗号アルゴリズムを調べる Automatic Key Exchange も最近提供された。しかしどちらも全体像を見るための集計値である。TLS バージョン（1.3 / 1.2 など）はドメイン単位で以前から見えたが、その上で使われた**暗号アルゴリズム**はドメイン単位では見えなかった。そのため「www.example.com への通信のうち PQ 暗号化されている割合は」という問いに答えられなかった。この情報は、規制への準拠、PQ 移行のトラブルシューティング、将来の量子攻撃者にさらされる通信量の把握に役立つ。

![訪問者・Cloudflare・オリジンの構成図（推定）](https://blog.cloudflare.com/_emdash/api/media/file/01M3MRVDEE1XHHY6P8G9B8TBEC.png)
*図: 訪問者（Visitor）、Cloudflare、オリジンサーバーを双方向矢印でつないだ図。「訪問者から Cloudflare」と「Cloudflare からオリジン」の 2 つの接続を示す（出典: Cloudflare Blog https://blog.cloudflare.com/post-quantum-visibility/。原文にキャプションがなく、Radar が両接続の統計を追跡しているという直前の本文から筆者がキャプションを推定した）*

## 発表内容 / アーキテクチャ

### TLS におけるポスト量子暗号の整理

- TLS 1.3 で PQ 暗号化に推奨される鍵交換グループは **X25519MLKEM768** のみ。主要ブラウザの多くが優先して使う。PQ 暗号化は TLS 1.2 以前では使えない。
- クライアントとサーバーは、X25519 による楕円曲線 Diffie-Hellman（ECDHE）と、ポスト量子の ML-KEM の**両方**を実行する。2 つの共有秘密を TLS が組み合わせて通信を暗号化する。**どちらか一方が安全なら全体も安全**という「ベルトとサスペンダー」方式である。
- TLS 1.3 には X25519、P-256、P-384 といった古典的な ECDHE のグループもあり、Web ではまだ広く使われている。TLS 1.2 以前には RSA ベースの鍵共有もあるが、量子に脆弱で古典的な問題も多く、使用は減っている。
- PQ 暗号化に続く第 2 の課題が PQ 認証（証明書と署名を ML-DSA などへ移行）。最近、オリジンが ML-DSA-44 証明書で Cloudflare に接続できるようになり、当日には Merkle Tree Certificates に対応する認証局の開始も発表された。ただし現時点では、PQ 暗号化の方が PQ 認証より広く展開されている。

Chrome なら、ページ上で右クリックの「検証」から Security タブを開くと、使用中の鍵共有アルゴリズムを確認できる。

![Chrome DevTools の Security タブ](https://blog.cloudflare.com/_emdash/api/media/file/01M3MRV83YB5G0D61BV95JEG31.png)
*図: Chrome DevTools の Security タブ。"encrypted and authenticated using TLS 1.3, X25519MLKEM768, and AES_128_GCM" の部分が赤丸で囲まれている（出典: Cloudflare Blog https://blog.cloudflare.com/post-quantum-visibility/。原文にキャプションはなく、画像内容と直前の本文から筆者が説明を補った）*

### 訪問者から Cloudflare への接続の可視化

HTTP Traffic Analytics ダッシュボード、Logpush、Log Explorer で、任意のドメインについて PQ 鍵共有の利用状況を確認できる。ダッシュボードでは Analytics の HTTP Traffic を開くと、下の方に **TLS Key Exchange グループ**の専用カードがある。

![TLS Key Exchange カード](https://blog.cloudflare.com/_emdash/api/media/file/01M3MRVBESXRRZ46JM51ZP60AS.png)
*図: テストドメインの「Client key exchange mechanism」カード。X25519MLKEM768（27.14k）、X25519（9.76k）、None（5.4k）、P-256（144）、X25519Kyber768Draft00（29）の件数が棒グラフで並ぶ（出典: Cloudflare Blog https://blog.cloudflare.com/post-quantum-visibility/。キャプションは画像の内容から筆者が書き起こした）*

読み方は次のとおり。

- X25519MLKEM768: PQ 暗号化（TLS 1.3）。
- X25519、P-256 など: 古典的な ECDHE（TLS 1.3 以下）。
- **None**: RSA 鍵共有（TLS 1.2 以下）、または TLS なし。
- X25519Kyber768Draft00: IETF で X25519MLKEM768 が標準化される前に実装した旧アルゴリズム。これを唯一の PQ 手段としているクライアントを後退させないため、観測される接続が極めて少なくなるまで削除を待っている。

PQ 化のためのヒントとして、X25519MLKEM768 がまったく見えない場合はまず TLS 1.3 が有効かを確認する。ダッシュボードで SSL/TLS > Edge Certificates を開き、TLS 1.3 を On にする。PQ 専用の設定はなく、TLS 1.3 が有効で訪問者が対応していれば Cloudflare が自動で交渉する。古典的な鍵共有や None が大半を占める場合は、訪問者の多くが X25519MLKEM768 や TLS 1.3 に対応しないブラウザ以外のクライアントである可能性がある。

鍵交換グループは HTTP Traffic ダッシュボードの**フィルタ条件**としても使える。例えば「Client TLS key exchange group が X25519MLKEM768 と等しくない」通信だけを抽出できる。

![フィルタを適用した HTTP Traffic](https://blog.cloudflare.com/_emdash/api/media/file/01M3MRV94FNTJRTWC4MCDFN5RE.png)
*図: フィルタ「Client TLS key exchange group does not equal X25519MLKEM768」を適用した HTTP Traffic 画面。24 時間のリクエスト数（合計 104k）と国別のリクエスト量が表示されている（出典: Cloudflare Blog https://blog.cloudflare.com/post-quantum-visibility/。キャプションは画像の内容から筆者が書き起こした）*

集計だけでなく個別のログ行でも見たい場合は、HTTP Requests データセットの TLS カテゴリにある新フィールド **ClientTLSKeyExchangeGroup** を有効化する。Log Explorer と Logpush のログで、リクエスト単位の PQ 鍵交換を確認できる。

![ログフィールドの選択画面](https://blog.cloudflare.com/_emdash/api/media/file/01M3MRVAAP0736RGJ3D10D5SNT.png)
*図: HTTP Requests データセットのフィールド選択画面。TLS カテゴリの ClientTLSKeyExchangeGroup にチェックが入っている（説明文: クライアントと Cloudflare の間の TLS 鍵交換グループ。'UNK' は判定不能、'NONE' は TLS 未使用）（出典: Cloudflare Blog https://blog.cloudflare.com/post-quantum-visibility/。キャプションは画像の内容から筆者が書き起こした）*

### オリジンへの接続とその先

今回の鍵交換グループの統計は、Cloudflare の「暗号の可視化（cryptographic visibility）」構想の最初のマイルストーンと位置づけられている。テレメトリのパイプラインは、TLS ハンドシェイクから追加の暗号パラメータを取り込めるようスケーラブルに設計されているという。

- Cloudflare からオリジンへの接続の鍵交換グループも、Logpush の **OriginTLSKeyExchangeGroup** として出力される。これで訪問者からオリジンまでのエンドツーエンドの可視性が得られる。このグループは同じドメインへのどの訪問者接続でも同じになるため、HTTP Traffic Analytics ダッシュボードには表示されない。
- PQ 暗号化に対応しにくい古いオリジンサーバーは、**Cloudflare Tunnel** の背後に置くとよい。オリジンをアップグレードせずに、オリジンから Cloudflare までの通信を TLS 1.3 と X25519MLKEM768 でトンネルできる。
- 将来、PQ 認証（証明書や署名で使われるアルゴリズム。Merkle Tree Certificates を含む）の展開が広がった段階で、それも可視化する予定。

![Cloudflare Tunnel を使う構成図](https://blog.cloudflare.com/_emdash/api/media/file/01M3MRVEF8KS1WD417688VR9XM.png)
*図: 訪問者、Cloudflare、データセンターまたはパブリッククラウド内の cloudflared とオリジンサーバーを並べた構成図（出典: Cloudflare Blog https://blog.cloudflare.com/post-quantum-visibility/。キャプションは画像の内容と直前の本文から筆者が書き起こした）*

## コード例

記事中のコード例は、Logpush の HTTP Requests ログに新フィールドが出力された例のみ。

```json
{
  "EdgeResponseStatus":200,
  "EdgeStartTimestamp":"2026-09-20T00:08:24Z",
  "RayID":"...",
  "ClientTLSKeyExchangeGroup":"X25519MLKEM768"
}
```

- `EdgeResponseStatus` / `EdgeStartTimestamp` / `RayID` は従来からあるフィールドで、ここに `ClientTLSKeyExchangeGroup` が並ぶ。値が `X25519MLKEM768` なら、そのリクエストの接続は PQ 暗号化されていたことが分かる。
- 値には `X25519`、`P-256`、`P-384` などの古典的グループも入る。`NONE` は TLS 未使用、`UNK` は判定不能（フィールド説明より）。
- Cloudflare からオリジンへの接続を見るには、同様に `OriginTLSKeyExchangeGroup` を有効にする。

## ユースケース

- **規制・コンプライアンス対応**: PQ 暗号化を求める規制への準拠状況を、ドメイン単位の数値で確認する。
- **PQ 移行のトラブルシューティング**: PQ を期待しているのに X25519 や None が多い場合に、TLS 1.3 の設定やクライアント種別（非ブラウザ）を疑う。フィルタで PQ でない通信だけを抜き出して調べる。
- **量子攻撃者にさらされる通信量の把握**: PQ でない通信の比率を見て、harvest-now-decrypt-later のリスクにさらされている割合を見積もる。
- **古いオリジンの PQ 化**: `OriginTLSKeyExchangeGroup` で Cloudflare-オリジン間が古典暗号であることを確認し、Cloudflare Tunnel の導入で改善する。

## 所感・ポイント

- 「PQ 暗号の提供」から「PQ 暗号の利用状況の可視化」へ進んだ発表である。有効化が自動（TLS 1.3 を On にするだけ）なので、まず現状を数字で知ることが運用上の出発点になる。
- 見えるのは鍵交換（暗号化）であり、PQ 認証（証明書・署名）はまだ対象外。PQ は「鍵共有」と「認証」の 2 本立てで、今回は前者のみという整理が重要。
- None は「TLS なし」と「RSA 鍵共有」が混ざった区分なので、数字を読むときは注意する。
- 同日公開の [IPsec の記事](./2026-09-29-ipsec-downgrade-protection.md) では、IPsec 側でも PQ 鍵共有に加えてダウングレード攻撃への備えが扱われている。TLS では X25519MLKEM768 が自動で交渉されるのに対し、IPsec は別プロトコルとして別の対処が要る、という対比で読むと分かりやすい。
- **サンプル対象外**: 本記事の中心はダッシュボードと Logpush のフィールド追加であり、Workers 上で動くコードや 100 行程度で再現できる最小実装がないため、デプロイ可能な `examples/` は作成していません。
- 画像のキャプションは原文にないため、画像の内容と前後の本文から筆者が補った（各図の注記を参照）。

## 関連リンク

- Logpush: https://developers.cloudflare.com/logs/logpush/
- Log Explorer: https://developers.cloudflare.com/log-explorer/log-search/
- HTTP Requests データセット: https://developers.cloudflare.com/logs/logpush/logpush-job/datasets/zone/http_requests/
- Cloudflare Radar（ポスト量子）: https://radar.cloudflare.com/post-quantum
- Automatic Key Exchange for Origins: https://blog.cloudflare.com/automatic-key-exchange-for-origins/
- Cloudflare 製品の PQ 対応: https://developers.cloudflare.com/ssl/post-quantum-cryptography/pqc-cloudflare-products/
- PQ 対応の主要ブラウザ: https://developers.cloudflare.com/ssl/post-quantum-cryptography/pqc-support/
- オリジンへの PQ（Cloudflare Tunnel）: https://developers.cloudflare.com/ssl/post-quantum-cryptography/pqc-to-origin/
- TLS 1.3 の設定: https://developers.cloudflare.com/ssl/edge-certificates/additional-options/tls-13/
- RFC 10024（X25519MLKEM768）: https://www.rfc-editor.org/rfc/rfc10024.html
- NIST IR 8547（RSA / ECC の非推奨化）: https://nvlpubs.nist.gov/nistpubs/ir/2024/NIST.IR.8547.ipd.pdf
- PQ 認証（オリジン向け ML-DSA-44）: https://blog.cloudflare.com/post-quantum-authentication-to-origins/
- Merkle Tree Certificates 対応の認証局: http://blog.cloudflare.com/cloudflare-certificate-authority/
- 本リポジトリ内の関連記事: [IPsec に対する量子ダウングレード攻撃の防止](./2026-09-29-ipsec-downgrade-protection.md)
