---
routerMode: hash
theme: default
title: "AI でポスト量子移行の進路を描く: 社内ツール CryptoLabe による暗号利用の発見"
info: |
  AI でポスト量子移行の進路を描く（CryptoLabe）の解説スライド。
  原文: https://blog.cloudflare.com/ai-driven-cryptography-discovery/
class: text-center
highlighter: shiki
drawings:
  persist: false
transition: slide-left
mdc: true
lineNumbers: true
themeConfig:
  primary: '#f6821f'
---

# AI でポスト量子移行の<br>進路を描く

社内ツール CryptoLabe による暗号利用の発見

Birthday Week 2026

<div class="pt-4 text-sm opacity-70">
原文: https://blog.cloudflare.com/ai-driven-cryptography-discovery/<br>
公開日: 2026-09-29
</div>

---

# TL;DR

- 2029 年の完全な PQ 対応に向け、コードベースから暗号の利用を洗い出す AI ツール <strong>CryptoLabe</strong> を開発
- <strong>発見</strong>→<strong>深い分析</strong>の 2 段階スキャン。根拠が足りなければ推測せず <strong>More evidence needed / External dependency / Unknown</strong>
- Workers・Durable Objects・Workflows・R2・Sandbox・D1・AI Gateway・Workers AI 上で動作
- 単独チームでは解決できない<strong>前提条件</strong>と、PQ 対応が乏しい<strong>難しいケース</strong>を早期に発見する
- すべての発見結果は担当エンジニアの確認が必要。選んだプロンプトは GitHub で公開

---

# アジェンダ

- 背景: PQ 移行の 3 つの目標と、問題の規模
- なぜ grep では足りないのか
- CryptoLabe の 2 段階スキャンと分類
- Cloudflare 上のアーキテクチャ
- 前提条件と難しいケース
- プロンプトの公開と、自組織での進め方
- コード例について・ユースケース・まとめ

---

# 背景: 2029 年に向けた「PQ everything」

- Cloudflare は 2029 年の完全な PQ 対応を目標にしている
- 多くの製品は TLS 1.3 で <strong>PQ 暗号化</strong>に対応済みだが、<strong>PQ 認証（署名）</strong>はまだ初期
- 顧客に「Cloudflare を使えば通信が量子攻撃者に対しても将来にわたり安全」という安心を届ける方針
- 課題: 暗号は製品・プロトコルの土台で、組織の規模が大きいほど移行は難しい

---

# 移行の 3 つの目標

| # | 目標 |
|---|---|
| 1 | 製品・エンジニアリングチームが、暗号の使われ方と更新方法を理解できるようにする（PQ 暗号化と PQ 認証の両方） |
| 2 | 移行の<strong>進捗指標</strong>を出す（リポジトリ別・製品別の古典／PQ の利用数） |
| 3 | PQ の移行計画がないプロトコルなどの<strong>前提条件を早期に表面化</strong>する |

- 3 は、標準が未成立・ライブラリ未対応などを 2029 年までに関係者と解消するため

---

# 問題の規模: 暗号は素直に姿を現さない

- ソースは 1 つの集中型ソース管理プラットフォームにあるが、<strong>多数のリポジトリ</strong>に分かれている
- 暗号が隠れる場所:
  - import されるが実際に呼ぶとは限らない<strong>共有ライブラリ</strong>
  - 古典の X25519 を交渉する TLS 1.3 リスナーなど、<strong>上流・プロトコルの既定値</strong>
  - 別リポジトリの YAML でアルゴリズムが固定される<strong>設定ファイル</strong>
  - デッドコード・テスト専用・廃止途中のコード

---

# grep では足りない理由

- <strong>過大に数える</strong>: "RSA" や "X25519" の grep は、使われていないコードも拾う
- <strong>過小に数える</strong>: 既定値や、依存・設定経由の間接利用を見逃す
- <strong>使われ方が分からない</strong>: ECDSA 署名が JWT・IPsec・TLS・SSH のどれかで移行経路が違う
- <strong>相手側にも依存</strong>: TLS サーバーが PQ と古典の両方に対応していても、どちらになるかはクライアント次第

→ モデルなら、複数ファイルをたどり、ドキュメントやチケットで補強し、使われ方まで説明できる

---

# CryptoLabe の 2 段階スキャン

<img src="https://blog.cloudflare.com/_emdash/api/media/file/01M3NESS5M04DZSXCZCVK7CC8Y.png" style="max-height: 290px; margin: 0 auto;" />

<div class="text-xs opacity-60 pt-2">出典: Cloudflare Blog https://blog.cloudflare.com/ai-driven-cryptography-discovery/（Repository → Scanning agent → Deep analysis agents → Final report。説明は図中ラベルから筆者が補った）</div>

---

# 発見と分析の中身

- <strong>発見段階</strong>: リポジトリを把握し、ソース・設定・マニフェスト・ロックファイル・スクリプト・テスト・ドキュメントから暗号を探す → 「生の観測」
- <strong>分析段階</strong>（観測ごとに実行）:
  - ソースで再確認 → 実行時の使われ方、リポジトリの役割、依存する相手を調べる
  - 必要なら他リポジトリも確認
  - 最後に自分の結論を見直す（設定の上書き、テスト専用コード、実行時挙動の誤った想定）
- 証拠が足りないときは推測せず、<strong>More evidence needed / External dependency / Unknown</strong>

---

# 分類（現時点）

| 分類 | 内容 |
|---|---|
| Classical encryption | ECDHE（X25519・P-256・P-384）、RSA 鍵共有、HPKE など。Shor で破られる |
| Classical signature | RSA / ECDSA 署名（証明書・TLS ハンドシェイクなど） |
| Classical token | RS256 / ES256 の JWT。置き換えは ML-DSA（RFC 9964） |
| PQ-ready hybrid key exchange | TLS 1.3 の X25519MLKEM768。最も普及した PQ 利用 |
| PQ-ready | 上記以外の PQ 暗号（ML-DSA など） |

- 「何でも受ける」分類で、今後細分化される見込み（例: encryption を鍵共有と HPKE に分ける）

---

# レポートの例

<img src="https://blog.cloudflare.com/_emdash/api/media/file/01M3NESR0TET6ZRYP60MWHEK7W.png" style="max-height: 250px; margin: 0 auto;" />

<div class="text-xs opacity-60 pt-2">出典: Cloudflare Blog https://blog.cloudflare.com/ai-driven-cryptography-discovery/（Access JWT の RS256 署名検証の例。Hard case / Blocked のタグ付き。説明は画像から筆者が補った）</div>

- 読者は製品マネージャー（影響）とエンジニア（実行の詳細）の 2 種類
- 正解データセットはまだなく、担当エンジニアとのレビューで改善している

---

# アーキテクチャ: 2 つの Workers

<img src="https://blog.cloudflare.com/_emdash/api/media/file/01M3NESPT874M5F4BP58M87WXB.png" style="max-height: 330px; margin: 0 auto;" />

<div class="text-xs opacity-60 pt-2">出典: Cloudflare Blog https://blog.cloudflare.com/ai-driven-cryptography-discovery/（図中ラベルから筆者が説明を補った。図の Dashboard Worker は本文の inventory Worker に相当すると推定）</div>

---

# スキャナ Worker とインベントリ Worker

- <strong>スキャナ Worker</strong>: スキャンを実行する
- <strong>インベントリ Worker</strong>: ダッシュボードと API を提供し、結果を <strong>D1</strong> に保存する
- 両者は <strong>Service Bindings</strong> で通信
- スキャンはダッシュボードから依頼され、インベントリ Worker がスキャナに渡す

---

# スキャンのオーケストレーション

- <strong>Agents SDK</strong>: リポジトリごとに Durable Object ベースの永続的なコーディネーター。前段の有界キューで同時実行数を制限
- コーディネーターは進行・キャンセル・再試行・復旧を管理し、分析自体は <strong>Workflows</strong> に任せる
- 4 つのステージ:
  1. discovery Workflow（生の観測を出す）
  2. deep analysis Workflow（観測ごと）
  3. merge Workflow（重複・類似の発見を統合）
  4. publish workflow（結果をインベントリ Worker に返す）

---

# コードの隔離と再現性

- スキャン開始時にリポジトリを<strong>正確なコミット</strong>で 1 度だけ取得し、スナップショットを <strong>R2</strong> に保存
- 各 Workflow は、それを新しい短命の <strong>Cloudflare Sandbox</strong>（隔離コンテナ）に復元
- モデルは<strong>読み取り専用ツール</strong>の小さな集合で、イミュータブルなスナップショットを扱う
- スキャン中にコードベースが変わっても、コードベースを壊すリスクはなく、結果への影響もない

---

# 大規模なモデル呼び出し

- <strong>コスト</strong>: AI Gateway 経由で、Workers AI 上のコスト効率のよい<strong>オープンウェイトモデル</strong>を利用。モデルの切り替えも容易
- <strong>容量</strong>: 同時スキャンで HTTP 429 が増え、各スキャンの独立した再試行がバーストを悪化させた
- 対策: 再試行を含む全スキャンのモデルリクエストの間隔を調整する<strong>単一のグローバル Durable Object</strong>
- 1 つが制限に当たるとクールダウンを共有し、全スキャンが一斉に待つ → 容量を奪い合わず分け合う

---

# 前提条件（prerequisites）

- 1 つの製品チームだけでは直ちに解消できない発見
- 例: 「PQ の JWT への移行がブロックされている」
  - 標準（RFC 9964）はあるが、ライブラリが PQ JWT の検証に未対応、トークン発行者が未対応だと、全社に PQ 化を依頼できない
- CryptoLabe は、同じ前提条件を持つ発見をまとめ、解消の優先順位づけに使える
- ドラフトのままでも展開は止まらない例: X25519MLKEM768 は 2022 年に展開、RFC 10024 の確定は 2026 年

---

# 例: PQ SAML が前提条件

<img src="https://blog.cloudflare.com/_emdash/api/media/file/01M3NEST48TEP90AW1RRDTS5H5.png" style="max-height: 200px; margin: 0 auto;" />

<div class="text-xs opacity-60 pt-2">出典: Cloudflare Blog https://blog.cloudflare.com/ai-driven-cryptography-discovery/（前提条件の項目の画面。説明は画像から筆者が補った）</div>

- XML Signature / SAML の標準が PQ 署名アルゴリズム識別子と相互運用プロファイルを公開し、IdP とライブラリが対応するまで、PQ 署名の SAML は扱えない
- 本文は「6 件の発見」と記すが、画像下部には「8 findings」と表示されている（原文のまま）

---

# 難しいケース（hard cases）

- PQ エコシステムの基本的な対応すらない暗号利用。通常の用途を無視する<strong>別のプロンプト</strong>で探す
- 探す対象: 独自の暗号プロトコル・鍵・署名（サイズ制約のあるフィールド）、ハードウェア組み込みの暗号、ブラインド署名などの特殊な構成、PQ 標準のないプロトコル、PQ 未対応の外部への依存
- 社内のチケットとドキュメントの文脈を取り込み、<strong>全リポジトリに一括</strong>で走らせたほうが良い結果になった
- 例: HTTP ヘッダーで運ばれる証明書。PQ 署名は大きいので、サイズを想定しているとアルゴリズム変更で壊れうる

---

# 教訓: 1 回のスキャンでは見つけきれない

- リポジトリ別のスキャン → 一般的な暗号利用の発見に有効
- 対象を絞ったスキャン → 難しいケースに有効（よく知られた暗号を無視し、製品・依存の文脈が多い）
- 手法ごとに見つかるものが違う
- すべての発見は、システムの実際の動作を知る<strong>エンジニアの確認</strong>が必要

---

# プロンプトの公開

- プロンプトの書き方は数か月試行錯誤。プロンプト同士を比べる<strong>正解データセットはない</strong>
- 網羅率 100% の確信もない。反復は: スキャン → 担当エンジニアとレビュー → 見逃しの調査 → 改訂
- 選んだプロンプトを <strong>cloudflare/crypto-discovery-prompts</strong> として公開
- 出発点であり CryptoLabe そのものではない。結果はモデル・ツール・文脈・エンジニアのレビュー次第
- CryptoLabe 自体は社内固有なので顧客には提供されない

---

# 自組織の PQ 移行: 始め方

- 多くの組織は、全リポジトリの棚卸しから始める必要はない（現時点では資源の無駄）
- まず<strong>通信をまとめて保護</strong>: Cloudflare 経由のサイトは PQ 暗号化済み。Cloudflare One も追加費用なしで PQ 暗号化を提供 → 補完的な統制になる
- 4 ステップ:
  1. 重要なシステムのリポジトリを 1 つ選ぶ
  2. 暗号の発見を実行する
  3. 担当チームが結果を検証する（長期的に必要か、即時の PQ 化が必要か）
  4. 今できる更新とブロックを分け、共通の前提条件を記録して優先順位をつける

---

# コード例について

- 本記事には<strong>コードブロックやコマンドなどのコード例は含まれない</strong>
- 代わりに、スキャンの流れ・分類・構成図を読み解く（前述のスライド）
- 記事中にあるコード的な文字列:
  - アルゴリズム名: X25519 / X25519MLKEM768 / RS256 / ES256 / ML-DSA
  - RFC 番号: RFC 9964（PQ JWT）/ RFC 10024（X25519MLKEM768）
  - レポート例の画像内のヘッダー名: `Cf-Access-Jwt-Assertion`
- プロンプトの実物は GitHub の cloudflare/crypto-discovery-prompts にある

---

# ユースケース 1: 進捗の可視化

- リポジトリ別・製品別に、古典暗号と PQ 暗号の利用数を数える
- 分類（Classical encryption / Classical signature / Classical token / PQ-ready）ごとの件数が、移行の進捗指標になる

---

# ユースケース 2: 製品チームへの移行ガイド

- レポートを 2 種類の読者向けに生成
  - 製品マネージャー: 自分の製品にとって移行が何を意味するか
  - エンジニア: 移行を実行するのに足りる詳細
- 根拠が足りない発見は推測せず、分類を留保する

---

# ユースケース 3: 前提条件の優先順位づけ

- 同じ前提条件を持つ発見をまとめる（例: PQ SAML に関する発見）
- 標準化団体・ライブラリ・ベンダーに働きかける優先度を決める
- 2029 年の目標に間に合わせるため、ブロックを早く見つける

---

# ユースケース 4: 難しいケースの早期発見

- HTTP ヘッダーで運ばれる証明書のように、PQ 署名のサイズ増で壊れうる箇所を見つける
- 長期的に使われるか判断 → 使われるなら、サイズ上限を測り、より大きな証明書をどう収めるか決める

---

# まとめ・所感

- 「grep では足りない」の動機が具体的（過大・過小・使われ方が不明）
- 推測させず分類を留保し、自分の結論を見直す工程を置くのは、AI 分析の信頼性を保つ設計
- Workflows の段階分割、Sandbox と読み取り専用ツール、コミット固定のスナップショット、429 を共有クールダウンで抑える構成は、AI エージェントにコードを読ませる際の参考になる
- 正解データセットがないこと、手法ごとに見つかるものが違うことが明記されている。結果はエンジニアの確認が前提
- CryptoLabe は顧客に提供されず、デプロイ可能なサンプルは対象外

---

# 参考リンク

- 原文（en-us）: https://blog.cloudflare.com/ai-driven-cryptography-discovery/
- プロンプト: https://github.com/cloudflare/crypto-discovery-prompts/
- PQ ロードマップ: https://blog.cloudflare.com/post-quantum-roadmap/
- RFC 9964（PQ JWT）: https://www.rfc-editor.org/info/rfc9964
- RFC 10024（X25519MLKEM768）: https://www.rfc-editor.org/info/rfc10024/
- 製品別の PQ 対応状況: https://developers.cloudflare.com/ssl/post-quantum-cryptography/pqc-cloudflare-products/
- 関連スライド: [CA 参入の発表](../cloudflare-certificate-authority/)、[MTC によるポスト量子認証局](../pq-ca-with-mtcs/)、[PQ 暗号の可視化](../post-quantum-visibility/)、[IPsec 量子ダウングレード攻撃の防止](../ipsec-downgrade-protection/)
- Wiki: [docs/articles/2026-09-29-ai-driven-cryptography-discovery.md](https://github.com/syumai/cloudflare-blog-summaries/blob/main/docs/articles/2026-09-29-ai-driven-cryptography-discovery.md)
