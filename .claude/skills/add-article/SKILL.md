---
name: add-article
description: Cloudflareブログ記事のURLを渡して、日本語のWiki・Slidevスライド・理解度クイズの3点セットをこのリポジトリに追加するときに使う。
---

# add-article: Cloudflareブログ記事の追加ワークフロー

このSkillは、Cloudflareブログの記事1本から「Wiki（詳細サマリ）」「スライド（Slidev）」「理解度テスト（クイズ）」の3点セットを作成し、一覧ページに登録するまでを一貫して行うワークフローです。

呼び出し例:

```
/add-article https://blog.cloudflare.com/ja-jp/some-article/
```

引数として渡されるのはブログ記事のURL。`ja-jp` 版を優先して取得し、存在しない場合は `en-us` 版を取得したうえで日本語で書く（サマリ・スライド・クイズすべて日本語。コード例・技術用語は原文のまま）。

**重要な方針**: このリポジトリ内のどのファイル（README・Wiki・スライド・クイズ）にも、成果物の利用目的・利用場面への言及を一切書かないこと。スライドはあくまで「記事解説用の資料」として、内容そのものに関する記述に留め、中立に作成する。

commit は行わない。ユーザーから明示的な指示があるまで、生成物はワーキングツリーに置いたままにする。ユーザーから commit の指示があった場合も、後述の「スライドの表示確認」が完了してから commit する。

## 参照例（few-shot）

作業を始める前に、既存の2記事を実例として読むこと。文体・粒度・構成の基準になる。

- `docs/articles/2026-08-13-agents-week-review.md`
- `docs/articles/2026-08-05-cloudflare-computer.md`
- `slides/agents-week-review/slides.md`
- `slides/cloudflare-computer/slides.md`
- `quizzes/agents-week-review.yaml`（クイズYAMLスキーマの参照実装）
- `quizzes/cloudflare-computer.yaml`（同上。設問の粒度・解説の書き方の基準として特に参照すること）

## 手順

### 1. 記事の取得

WebFetch で対象URLを取得する。`ja-jp` のURLが与えられなかった場合や404の場合は `en-us` 版を取得する。

抽出する情報:

- タイトル（日本語。en-us取得の場合は自分で日本語訳する）
- 公開日（YYYY-MM-DD）。**ja-jp（翻訳）版を取得した場合でも、公開日は必ず英語原文（`https://blog.cloudflare.com/<slug>/`）の `datePublished` を使う**（ja-jp 版の日付は翻訳公開日でずれていることがある）。英語版から取得できない場合のみ他の情報源（まとめ記事の曜日区分など）で補う
- セクション構成（見出しとその要約）
- 画像URL（`blog.cloudflare.com` 配下、`_emdash/api/media/...` 形式など）とその説明・掲載箇所
- コード例（言語・全文・文脈）
- 記事内からリンクされている関連記事・ドキュメントのURL

### 2. slug の決定

URL末尾のパスセグメントを slug とする（例: `https://blog.cloudflare.com/ja-jp/cloudflare-computer/` → `cloudflare-computer`）。

- `docs/articles/`、`slides/`、`quizzes/` を確認し、同じ slug が既に存在しないか確認する。
- 重複する場合は日付を付与するなどして一意な slug にする。
- 公開日と組み合わせた Wiki ファイル名は `docs/articles/YYYY-MM-DD-<slug>.md`。

### 3. Wiki 生成: `docs/articles/YYYY-MM-DD-<slug>.md`

以下のテンプレートに沿って作成する。

```markdown
# <記事タイトル（日本語）>

- 原文: <ja-jp URL>（英語版: <en-us URL>）
- 公開日: YYYY-MM-DD
- 関連: [[他記事への相対リンク]]

## TL;DR
3〜5 行の要約。

## 背景・課題
記事が解決しようとしている問題。

## 発表内容 / アーキテクチャ
セクションごとの詳細サマリ。ブログ内の図を URL 直接参照で引用:
![説明](https://blog.cloudflare.com/_emdash/api/media/file/....png)
*図: 説明（出典: Cloudflare Blog）*

## コード例
記事内のコード例を引用し、日本語で解説を付ける。

## ユースケース
具体的なユースケースを列挙・解説。

## 所感・ポイント
読者（日本語話者の開発者）向けの補足。

## 関連リンク
記事内から張られている関連記事・ドキュメント。
```

注意点:

- 画像はすべて `blog.cloudflare.com` の URL を直接参照する（ダウンロード・再ホストしない）。キャプションに `出典: Cloudflare Blog` を明記する。
- 「背景・課題」「発表内容 / アーキテクチャ」「所感・ポイント」は自分の言葉で書き、原文の丸写しにしない。
- コード例がある記事では必ず「コード例」セクションを含める。コード例がない記事（週まとめ記事など）では、代わりに全体の構成・位置づけを詳しく書く。
- 記事が他の記事（このリポジトリ内の既存Wiki）に言及している場合は「関連」欄・「関連リンク」に相対リンクを張る。

### 4. Workers サンプル生成: `examples/<slug>/`（該当する場合）

Wiki 生成後、記事が Cloudflare Workers に関するものかどうかを判定する。

判定基準（両方を満たす場合のみサンプルを作る）:

- (a) 記事の中心技術が Workers 上で動作し、かつ現在一般利用可能であること（プライベートベータ等ではない）。
- (b) 100行前後の最小実装で記事の要点を体験できること。

いずれかを満たさない場合、またはプライベートベータ等で再現不能な場合はサンプルを作らず、Wiki の「関連リンク」または「所感・ポイント」に「サンプル対象外」の理由を一言書く（例: 「本記事の中心機能はプライベートベータのため、デプロイ可能なサンプルは作成していません」）。

該当する場合は `examples/<slug>/` を作成する:

- `package.json`: `wrangler` をバージョン固定で devDependency に指定する。
- `wrangler.jsonc`: Worker の設定ファイル。
- `src/index.ts`（記事の内容に応じて別言語でもよい）: 記事の要点を再現する最小実装。
- `README.md`: 記事との対応、`npm install && npx wrangler deploy` によるデプロイ手順、必要な binding や前提条件。

ルール:

- 使用する npm パッケージは `npm view <pkg> version` で実在とバージョンを確認してから使う。記事にしか登場しない未公開SDKは使わない（素の Workers API で概念を再現できる場合はそちらで代替し、できない場合はサンプル対象外として扱う）。
- 検証として `npx wrangler deploy --dry-run` を実行し、通ることを確認する（実際のデプロイは行わない）。型チェックがあれば合わせて実行する。
- Wiki ページ（「関連リンク」など）とスライド（末尾の参考リンクのスライド）の末尾に、`examples/<slug>/` への参照リンクを追加する。

### 5. スライド生成: `slides/<slug>/slides.md`

Slidev 形式で作成する。frontmatter の例:

```yaml
---
theme: default
title: <記事タイトル>
info: |
  <記事タイトル>の解説スライド。
  原文: <URL>
drawings:
  persist: false
transition: slide-left
mdc: true
---
```

共通構成（内容に応じて枚数は可変。目安: 深掘り記事20〜30枚、週まとめ記事15〜20枚）:

1. タイトル（記事名・原文URL・公開日）
2. アジェンダ
3. 背景・課題（1〜3枚）
4. 本編: 発表内容／アーキテクチャ（図をURL直接参照で引用）
5. **コード例**（Slidevのコードハイライト機能・行フォーカス `{1-3|5|all}` などを活用。必須）
6. **ユースケース**（具体例を1ユースケース1枚程度。必須）
7. まとめ・所感
8. 参考リンク

ルール:

- 図を引用するスライドには脚注で `出典: Cloudflare Blog <URL>` を入れる。
- コード例とユースケースは必ず含める（記事にコード例が無い場合は、代表的なAPI利用イメージやアーキテクチャ図の読み解きで代替してもよいが、その旨を分かりやすく示す）。
- スライド内容・frontmatter・speaker notes を含め、どこにも利用目的・利用場面への言及を書かない。あくまで「記事解説資料」として、内容そのものに関する記述に留め、中立に書く。
- スライド区切りは Slidev の `---` を使う。
- 追加する記事が、既存の概要・まとめ記事（例: Agents Week 2026 まとめ）のスライドで紹介されている場合、そのまとめスライド側の該当発表の箇所に、新しく作ったデッキへのリンク「▶ 解説スライド」を追記する。リンクは相対パス `../<slug>/` で書く（ビルド後のサイトで `BASE_PATH` に依存せず解決されるため。`slidev dev` 単体ではデッキ間リンクは動作しないので、確認は `site/` をローカル配信して行う）。
- 逆に、まとめ記事を新規追加する場合は、その中で紹介している記事のデッキが既にリポジトリにあれば、同様に `../<slug>/` リンクを張る。
- 全デッキ共通の Cloudflare 風配色テーマ `slides/theme/cloudflare.css` を使う。新しいデッキを作る際は `slides/<slug>/style.css` を作成し、内容を `@import '../theme/cloudflare.css';` の1行にする（Slidev がエントリと同じディレクトリの `style.css` をグローバル CSS として自動読込する）。frontmatter には `themeConfig: { primary: '#f6821f' }` を設定する。配色の調整が必要な場合は各デッキ側ではなく `theme/cloudflare.css` を直す。

### 6. クイズ生成: `quizzes/<slug>.yaml`

クイズは HTML ではなく、**YAML データファイル**として作成する。HTML は書かない。`npm run build` 実行時に、`quizzes/template/` 配下の共通テンプレートが `quizzes/*.yaml` を読み込み、`site/quizzes/<slug>.html` を生成する。既存の `quizzes/agents-week-review.yaml` / `quizzes/cloudflare-computer.yaml` を実装の参照例（few-shot）として、スキーマ・設問の粒度を踏襲すること。ゼロから独自の構造を考えず、既存2本のいずれかをベースに複製・改変するのが基本方針。

#### YAML スキーマ

```yaml
title: <記事タイトル>
slug: <slug>
sourceUrl: <原文URL>
wiki: ../docs/articles/YYYY-MM-DD-<slug>.md
questions:
  - q: <問題文>
    code: |
      <整形表示したいコード（コード読解問題の場合のみ）>
    codeLang: <コードの言語（code を指定する場合のみ）>
    choices:
      - <選択肢A>
      - <選択肢B>
      - <選択肢C>
      - <選択肢D>
    answer: 0
    explanation: <解説文>
```

- `wiki` はリポジトリ内で有効な `.md` への相対パス（`<a href="../docs/articles/YYYY-MM-DD-<slug>.md">` の形と同じ書き方）で指定する。`.html` への書き換えはテンプレート側で行われるため、YAML 側は `.md` のままでよい。
- `code` / `codeLang` は該当設問にのみ付与する任意フィールド（コード読解問題以外では省略する）。
- `answer` は `choices` 配列に対する **0始まりの index** で正解を指す。

#### 必須要件

- **設問数**: 1記事あたり **8〜10問**（`questions` の要素数）。
- **出題形式**: 各設問は `choices` を4つ（4択）用意する。
- **コード問題**: コード例のある記事では、`code` / `codeLang` を使って読ませるコード読解問題を最低1問含める。
- **難易度順**: 「基本（用語・概要）→ 応用（アーキテクチャの理由・トレードオフ）」の順に `questions` を並べる。
- **解説の質**: 各設問の `explanation` は Wiki ページの該当セクション名に言及し、根拠を示す。

採点ボタンの挙動や解説の表示切り替えなど、生成される HTML の体裁・インタラクションはテンプレート側の責務であり、SKILL.md では扱わない。デザインや採点ロジックの変更が必要な場合は、個別の `<slug>.yaml` ではなく `quizzes/template/` および `scripts/build-site.mjs` を直す。

#### 実装の進め方

1. 既存の `quizzes/cloudflare-computer.yaml`（または `agents-week-review.yaml`）を参考に `quizzes/<slug>.yaml` を新規作成する。
2. `title` / `slug` / `sourceUrl` / `wiki` を対象記事の内容に置き換える。
3. `questions` を対象記事の内容に基づいてすべて書き換える（上記の必須要件をすべて満たすこと）。
4. `npm run build` を実行し、生成された `site/quizzes/<slug>.html` をブラウザで開いて、ラジオボタン選択→採点ボタン→正誤・解説表示が正しく動作するか確認する。

### 7. インデックス更新

- `docs/index.md` のテーブルに、公開日順（新しい記事が上）で1行追加する。列は「公開日 / タイトル / Wiki / スライド / クイズ / 原文リンク」。クイズ列のリンクは `quizzes/<slug>.html`（`docs/` からの相対パスなら `../quizzes/<slug>.html`）と、拡張子 `.html` にする。
- `README.md` の記事一覧テーブルにも同じ内容の行を追加する（相対リンクのベースパスが `docs/index.md` とは異なる点に注意。README はリポジトリルートからの相対パス `quizzes/<slug>.html`、`docs/index.md` は `docs/` からの相対パス `../quizzes/<slug>.html` になる）。

### 8. 検証

- 抽出した画像URLすべてに対して `curl -sI <URL>` を実行し、ステータスが `200` であることを確認する。200以外のものがあれば報告する。
- 可能であれば `cd slides && npm install && npm run dev -- <slug>/slides.md` でビルド・表示確認を行う（時間がかかる、またはネットワーク制約で実行できない場合は省略し、その旨を報告に含める）。
- `npm run build` 後、生成された `site/quizzes/<slug>.html` をブラウザで開き、採点ボタンの動作（正誤判定・解説の表示切り替え）を確認する。
- Wiki・スライド・クイズ・index間の相互リンクが正しいパスになっているか確認する。
- Workers サンプルを作成した場合は `cd examples/<slug> && npm install && npx wrangler deploy --dry-run` が通ることを確認する（実デプロイはしない）。対象外と判断した場合は、Wiki にその理由が書かれているか確認する。
- リポジトリルートで `npm run build` を実行し、サイト全体（Wiki・スライド・クイズ・ポータル）が新しい記事を含めて正しくビルドできることを確認する。ビルドは `docs/articles/*.md` と `slides/`・`quizzes/` の中身を自動的に拾うため、追加した記事のファイルが正しい命名規則（`docs/articles/YYYY-MM-DD-<slug>.md`、`slides/<slug>/slides.md`、`quizzes/<slug>.html`）に従っていれば、`scripts/build-site.mjs` 側の変更は不要である。ビルドが失敗する場合は原因（Markdown内リンクの記法崩れ、Slidev frontmatterの誤りなど）を特定して修正する。
- **commit 前に、スライドの表示をローカルで確認する（必須）**: `BASE_PATH=/ npm run build` でサイトをビルドし、生成された `site/` ディレクトリを `python3 -m http.server 4173 --directory site` などでローカル配信する。その上でブラウザ（claude-in-chrome ツール等）で `http://localhost:4173/slides/<slug>/1` を開き、右矢印キーで**全スライド**を1枚ずつ最後まで送って表示を確認する。ブラウザ操作が使えない場合の代替として、`npx slidev export <slug>/slides.md --format png`（`playwright-chromium` が必要）で全スライドをPNG出力し、Readツールで各画像を確認する。チェック観点は、テキスト/コード/テーブルのはみ出し・見切れ、画像の読み込み失敗、詰め込みすぎによる極小文字、レイアウト崩れ。問題が見つかった場合は `slides.md` を修正し（詰め込みすぎの場合はスライドを分割するなど、内容の意味は変えない）、再ビルド→再確認を、問題がなくなるまで繰り返す。既知の注意点: (1) 長いコードブロックはスライド分割で対応する（`{maxHeight:...}` はエクスポート/ビルドでは効かない）。(2) `**太字**` の直前直後に全角括弧・句読点が隣接すると CommonMark の仕様でリテラル表示になるため、`<strong>` タグにするか記号を太字の外に出す。(3) `layout: image-right` では `backgroundSize: contain` を指定しないと図がトリミングされる。(4) frontmatter の `title` に「: 」を含む場合は必ずクォートする。

### 9. 報告

作業完了後、以下を報告する。

- 生成したファイルのパス一覧（Wiki / スライド / クイズ / index更新）
- 画像URL疎通確認の結果（NGがあれば具体的にどのURLか）
- `npm run build` の実行結果（成功したか、失敗した場合は原因と対応）
- 内容が薄い・不明瞭で人手確認が必要な箇所（原文から十分な情報が取れなかった部分、専門的すぎて要確認な技術的記述など）
- スライドのローカル表示確認の結果（確認方法・確認したスライド枚数、問題があり修正した場合はその内容）
- Workers サンプルの生成有無（作成した場合は `examples/<slug>/` のパスと `wrangler deploy --dry-run` の結果、対象外とした場合はその判定理由）
- commit は行っていない旨（ユーザーの指示があるまで行わない。指示があった場合もスライドの表示確認が完了してから行う）

## 品質チェックリスト

生成物を報告する前に、以下をすべて満たしているか確認する。

- [ ] Wiki内のすべての図に出典（`出典: Cloudflare Blog`）が明記されている
- [ ] Wikiに「コード例」セクションがある（記事にコード例がある場合は必須。無い場合はその旨を明記した代替セクションがある）
- [ ] スライドに「コード例」スライドと「ユースケース」スライドが含まれている
- [ ] `quizzes/<slug>.yaml` が新スキーマ（`title` / `slug` / `sourceUrl` / `wiki` / `questions`）に準拠している
- [ ] `questions` が8〜10問あり、各設問の `answer` の index が意図した正解の選択肢と一致している
- [ ] コード例のある記事では、`code` / `codeLang` を使ったコード読解問題を最低1問含んでいる
- [ ] `npm run build` 後、生成された `site/quizzes/<slug>.html` で採点ボタンの動作（正誤判定・解説の表示切り替え）を確認している
- [ ] `docs/index.md` が更新済み（クイズ列は `.html` リンク）
- [ ] `README.md` の記事一覧が更新済み（クイズ列は `.html` リンク）
- [ ] Wiki・スライド・クイズ・READMEのどこにも、成果物の利用目的・利用場面への言及がない
- [ ] 画像URLの疎通確認（`curl -sI`）を行い、結果を報告している
- [ ] `npm run build` でサイトがビルドできることを確認している
- [ ] 全スライドをローカルで表示確認し、はみ出し・画像切れ・レイアウト崩れがないことを確認した
- [ ] 関連するまとめスライドとの相互リンクを確認した
- [ ] `style.css` で共通テーマを import し、`themeConfig.primary` を設定した
- [ ] Workers 関連記事の場合、`examples/<slug>/` を作成し dry-run が通ることを確認した（対象外の場合は理由を Wiki に記載した）
- [ ] commit していない
