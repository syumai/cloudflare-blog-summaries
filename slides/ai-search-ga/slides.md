---
routerMode: hash
theme: default
title: "AI Search が一般提供（GA）に: マルチモーダル埋め込み・大容量ファイル・OCR・課金開始"
info: |
  AI Search is now generally available の解説スライド。
  原文: https://blog.cloudflare.com/ai-search-ga/
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

# AI Search が<br>一般提供（GA）に

マルチモーダル埋め込み・大容量ファイル・OCR・課金開始

Birthday Week 2026

<div class="pt-4 text-sm opacity-70">
原文: https://blog.cloudflare.com/ai-search-ga/<br>
公開日: 2026-10-01
</div>

---

# TL;DR

- AI Search（Workers AI・Vectorize・R2・Browser Run によるフルマネージドの索引・検索パイプライン）が<strong>一般提供（GA）</strong>に
- <strong>ネイティブ画像埋め込み</strong>を追加。キャプション方式と併用し、Qwen3-VL-Embedding で利用できる
- ファイル上限が <strong>4 MiB → 10 MiB</strong>。スキャン PDF 向けの <strong>OCR</strong> が全アカウントで利用可能
- <strong>課金は 2026-11-01 開始</strong>。無料枠のクエリが「共有 2,000」から「セマンティック 1,000 ＋ フルテキスト 1,000」に変更
- 今後はビデオ・音声、キーワード検索エンジンの再構成、既存サイト向けの簡単な有効化手段を予定

---

# アジェンダ

- 背景: 画像検索と文書取り込みの課題
- マルチモーダル埋め込みと検索
- クエリの流れ
- 大きなファイルと OCR
- 課金と料金体系
- コード例（記事には無い旨）・ユースケース
- 今後の予定とまとめ

---

# 背景: 検索から漏れていたもの

<div class="grid grid-cols-2 gap-6 pt-4 text-left">
<div class="p-4 border rounded">

<strong>画像</strong>

- 従来は物体検出 → キャプション → テキスト埋め込み
- キャプションに書かれない質感・画面の状態・グラフの関係・レイアウトが失われる

</div>
<div class="p-4 border rounded">

<strong>文書</strong>

- スキャン PDF は実体が画像で、テキストを取り出せない
- 4 MiB を超えるファイルは取り込みにくい

</div>
</div>

<div class="text-sm pt-4 text-left">

加えて、料金は Agents Week 時点ではプレビューのままだった。前身の記事: <a href="../ai-search-easier/">AI Search: エージェントにデータのための検索エンジンを</a>

</div>

---

# マルチモーダル埋め込み: 2 種類の表現

<div class="text-sm pt-2">

| | 従来 | 現在 |
| --- | --- | --- |
| 方式 | 物体検出 → キャプション → テキスト埋め込み | キャプション理解 ＋ ネイティブ画像検索の両方 |
| 画像のピクセル | 使われない | 直接埋め込む |
| 検索できる内容 | キャプションに書かれた情報のみ | キャプションに無い細部も一致できる |

</div>

- 効率化に <strong>Matryoshka Representation Learning（MRL）</strong>を活用。小さな埋め込みでも有用な情報を保てる
- ネイティブ検索は <strong>Qwen3-VL-Embedding</strong> モデルで利用可能

---

# クエリ時の動き: 画像で検索する

<div class="grid grid-cols-2 gap-6 pt-2 text-left text-sm">
<div class="p-4 border rounded">

<strong>画像対応の埋め込みモデル</strong>

- クエリ画像をモデルで直接埋め込む
- インデックス済みの画像・テキストと同じベクトル空間で検索
- 視覚的な情報をフルに使える

</div>
<div class="p-4 border rounded">

<strong>テキスト専用の埋め込みモデル</strong>

- クエリ画像を ToMarkdown でキャプション化
- そのテキストで検索
- すべてのモデルに基本的なマルチモーダル対応

</div>
</div>

<div class="text-sm pt-4 text-left">

AI Search はクエリ時に、インスタンスの埋め込みモデルが画像に対応しているかを確認して自動で切り替える。

</div>

---

# 例: 「似た模様の鳥」を探す

- 記事の例は Wikimedia Commons（joelfotos、CC0）の鳥の写真
- キャプション: 「黒と白の模様の小さな鳥が、黄金色の果実と緑の葉の間に止まっている」
- ネイティブ画像検索はキャプションに無い細部にも一致できる
  - 白い眉斑の形、黄緑色の羽毛
  - 滑らかな果実と傷んだ果実の混在
  - 葉の深い筋の質感、暖かい色調、浅い被写界深度の構図
- 言葉・画像・その組み合わせで検索できる

---
layout: image-right
image: https://blog.cloudflare.com/_emdash/api/media/file/01M3SPF4DQJEF4XQTBF8H37P47.png
backgroundSize: contain
---

# クエリの流れ

<div class="text-sm">

1. クエリを（任意で）書き換え → 埋め込み
2. ベクトル検索とキーワード検索（BM25）を並列実行
3. 結果を融合（fusion）、任意で再ランキング
4. 上位チャンクを返す、または生成モデルで回答を作成

</div>

<div class="text-xs opacity-60 pt-4">
右図: The life of an AI Search query<br>
出典: Cloudflare Blog https://blog.cloudflare.com/ai-search-ga/
</div>

---

# 大きなファイルと OCR

<div class="grid grid-cols-2 gap-6 pt-4 text-left">
<div class="p-4 border rounded">

<strong>ファイル上限 4 → 10 MiB</strong>

- テキスト系（Markdown・HTML・CSV・JSON など）と PDF が対象

</div>
<div class="p-4 border rounded">

<strong>OCR（スキャン PDF）</strong>

- 有効にすると、チャンク化・埋め込みの前に各ページからテキストを読み取る
- 全アカウントで利用可能
- 課金は「画像処理の取り込みトークン」

</div>
</div>

---

# 課金: 3 つだけ払う

- 支払うのは<strong>取り込んだコンテンツ・保存データ・実行クエリ</strong>の 3 つ
- パース・チャンク化・Workers AI での埋め込み・キーワードインデックス・再ランキングは料金に含まれる
- インスタンス時間・キャパシティユニット・月額最低料金なし
- <strong>課金開始は 2026-11-01</strong>（事前にリマインダーメール）。全 Workers プランに無料枠あり
- 埋め込みモデルを変えても取り込み単価は同じ（画像処理は追加料金）

---

# 料金表

<div class="text-sm">

| 項目 | 料金 | 月間無料枠 |
| --- | --- | --- |
| Base Ingestion | $0.75 / 1M トークン | 5M トークン † |
| Image processing（追加） | +$0.50 / 1M トークン | 5M トークン † |
| Stored data | $2.00 / GB・月 | 10 GB |
| Semantic（hybrid・vector） | $0.75 / 1k クエリ | 1,000 クエリ |
| Full-text | $0.10 / 1k クエリ | 1,000 クエリ |
| Embedding / Reranking | 選択した Workers AI モデルは無料 | N/A |

</div>

<div class="text-xs opacity-60 pt-2">
† 取り込みトークンは、サポートされるすべてのファイル種別を対象とする月 5M の単一プール。サードパーティモデルは別請求。
</div>

---

# プレビュー価格からの変更点

<div class="grid grid-cols-2 gap-6 pt-4 text-left">
<div class="p-4 border rounded">

<strong>プレビュー（8 月）</strong>

- セマンティックとフルテキストで共有の 2,000 クエリ

</div>
<div class="p-4 border rounded">

<strong>GA（11 月 1 日〜）</strong>

- セマンティック 1,000 ＋ フルテキスト 1,000
- 単価・他の無料枠は同じ

</div>
</div>

---

# コード例について

<div class="text-sm">

この記事にはコードスニペットが掲載されていない（機能・料金の発表が中心）。設定上のポイントのみ記事から整理する。

</div>

- 画像検索: インスタンスの埋め込みモデルに <strong>Qwen3-VL-Embedding</strong> を選ぶ
- スキャン PDF: データソースの設定で <strong>OCR</strong> を有効にする
- Worker からの呼び出し（`ai_search_namespaces` と `search()`）は<a href="../ai-search-easier/">前身の記事</a>のコード例を参照

---

# ユースケース 1: 画像を含むコレクション

- 商品画像・スクリーンショット・チャート・図表を、言葉・画像・その組み合わせで検索
- 色・質感・構図・空間的な関係が重要なコレクションで有用
- テキスト専用モデルのままでも、画像クエリはキャプション化して利用できる

---

# ユースケース 2: スキャン文書と大きなファイル

- スキャンした PDF を OCR して索引化し、テキスト検索の対象にする
- 4 MiB を超える、10 MiB までの Markdown・HTML・CSV・JSON・PDF をそのまま取り込む
- OCR は画像処理の取り込みトークンとして課金される

---

# ユースケース 3: コスト見積もり

- 取り込み・ストレージ・クエリの 3 軸で、インデックス前に月額を見積もる
- 小規模なら月間無料枠（5M トークン・10 GB・各 1,000 クエリ）内で始められる
- 2026-11-01 の課金開始と、クエリ無料枠の分割を確認しておく

---

# 今後の予定

- <strong>ビデオ・音声</strong>の取り込みパイプライン（リッチメディアの検索）
- <strong>キーワード検索エンジン</strong>の再構成（大規模データストアでの限界に対応）
- Cloudflare 上の既存サイトで AI Search を<strong>簡単に有効化</strong>する手段（エージェントがコンテンツを発見・利用しやすく）

---

# まとめ

- GA は「検索から漏れていたもの（画像・スキャン PDF・大きなファイル）を拾う」改善と「料金の確定」の 2 本立て
- キャプション方式を残したままネイティブ画像埋め込みを併用する設計
- テキスト専用モデルでも画像クエリは使える。視覚情報のフル活用にはネイティブ対応モデルが必要
- 課金は 2026-11-01 から。クエリ無料枠の分割に注意

---

<div class="text-center">

# 参考リンク

</div>

- 原文: [AI Search is now generally available](https://blog.cloudflare.com/ai-search-ga/)
- 前身の記事: [AI Search: give your agents a search engine for your data](https://blog.cloudflare.com/ai-search-easier/)（▶ <a href="../ai-search-easier/">解説スライド</a>）
- [AI Search ドキュメント](https://developers.cloudflare.com/ai-search/)
- [対応する埋め込みモデル](https://developers.cloudflare.com/ai-search/configuration/models/supported-models/#embedding)
- [画像と OCR の設定](https://developers.cloudflare.com/ai-search/configuration/data-source/#images-and-optical-character-recognition)
- [料金と制限](https://developers.cloudflare.com/ai-search/platform/limits-pricing/)
- [Matryoshka Representation Learning](https://arxiv.org/abs/2205.13147)
- [Qwen3-VL-Embedding](https://github.com/QwenLM/Qwen3-VL-Embedding)
- Workers サンプル（前身記事）: [github.com/syumai/cloudflare-blog-summaries/tree/main/examples/ai-search-easier](https://github.com/syumai/cloudflare-blog-summaries/tree/main/examples/ai-search-easier)

<div class="pt-8 text-sm opacity-50">
Wiki: docs/articles/2026-10-01-ai-search-ga.md
</div>
