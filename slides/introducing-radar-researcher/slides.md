---
theme: default
title: 平易な言葉でインターネットデータを探索するAIツール「Radar Researcher」のご紹介
info: |
  Cloudflare Blog記事「Radar Researcherの紹介」の解説スライド。
  原文: https://blog.cloudflare.com/ja-jp/introducing-radar-researcher/
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

# 平易な言葉で
# インターネットデータを探索するAIツール

「Radar Researcher」のご紹介

<div class="pt-4 text-sm opacity-70">
原文: https://blog.cloudflare.com/ja-jp/introducing-radar-researcher/<br>
公開日: 2026-08-07
</div>

---

# アジェンダ


- 背景: Cloudflare Radarとその利用者
- 課題: データへアクセスする際の専門知識の壁
- Radar Researcherを発表
- 内部アーキテクチャ
- コード例で見る: Markdownから実際のRadarチャートへ
- ユースケース
- まとめ


---

# 背景: Cloudflare Radarとは

Cloudflareのネットワークを流れる膨大なトラフィックをもとに、
**インターネットの利用状況・障害・攻撃傾向**などを可視化して2020年から無償公開


- 人権活動家
- ジャーナリスト
- 研究者
- ネットワーク運用者
- 統計に不慣れな一般の関心層


<br>


この6年間、複雑なデータセットを**明確かつ信頼できる形**で可視化する取り組みを続けてきた


---

# 課題: 専門知識という壁


Radarのデータセットは複雑で、知りたいことに答えるには
**「どのAPIをどう組み合わせるか」という専門知識**が要求される



- 専門家でなければ、適切なエンドポイント・パラメータを選べない
- 結果として専門家が「ゲートキーパー」の役割を担ってしまう
- AIツールはこの専門知識の障壁を引き下げ、
  専門家を「協力者」に変えうる、というのが記事の視点


---
layout: image-right
image: https://blog.cloudflare.com/_emdash/api/media/file/01KZCGV8CGKHH0H5K32A9HXB9C.png
backgroundSize: contain
---

# Radar Researcherを発表

Radar APIを土台に構築された、
**自然言語でインターネットデータへアクセスする**AIチャットツール


Radarダッシュボードの「Researcher」ボタンから起動できる


<footer class="text-xs opacity-50 mt-4">
出典: Cloudflare Blog https://blog.cloudflare.com/ja-jp/introducing-radar-researcher/
</footer>

---

# 主な機能


- 平文の回答 ＋ 実データに基づく**インタラクティブなチャート**
- 回答の深さを選択（簡潔な要約 / 詳細なレポート）
- 会話の流れに応じた**関連質問の提案**
- 会話履歴の**検索・共有**
- LLMの推論プロセスを**後から監査**できる


---

# UIデモ

<div class="pt-4">

![Radar RechercherのUIデモ](https://blog.cloudflare.com/_emdash/api/media/file/01KZCGV8V7BER6V3SV5M412R6R.png){style="max-height:420px"}

</div>

<footer class="text-xs opacity-50 mt-4">
出典: Cloudflare Blog https://blog.cloudflare.com/ja-jp/introducing-radar-researcher/
</footer>

---

# 既存のチャートを会話に変える

各チャートの **「Explain with AI」** アクションから会話を開始できる


- チャートのスクリーンショット
- APIから取得した生データ
- 現在表示中のビューのパラメータ（国・期間など）



この3種類の情報を同時にモデルへ渡すことで、
**いま見ている画面そのもの**を踏まえた説明ができる


---
layout: image-right
image: https://blog.cloudflare.com/_emdash/api/media/file/01KZCGV8C36Q2QXHDPGR9ZP8HT.png
backgroundSize: contain
---

# Explain with AI

チャートからワンアクションで
AIとの対話を開始する導線

<footer class="text-xs opacity-50 mt-4">
出典: Cloudflare Blog https://blog.cloudflare.com/ja-jp/introducing-radar-researcher/
</footer>

---

# チャート説明の応答例

<div class="pt-4">

![チャート説明の例](https://blog.cloudflare.com/_emdash/api/media/file/01KZCGV8R46TFB08XZ4T2PG0QM.png){style="max-height:420px"}

</div>

<footer class="text-xs opacity-50 mt-4">
出典: Cloudflare Blog https://blog.cloudflare.com/ja-jp/introducing-radar-researcher/
</footer>

---

# 内部アーキテクチャ


- **コア**: Cloudflare Agents SDK を実行する Cloudflare Worker
- **状態管理**: Durable Objects（SQLiteに会話履歴を保存）
- **推論エンジン**: Workers AI 上のオープンモデル（Kimi K2.7 など）
- **フォールバック**: モデルファミリー間のカスケード切り替え
- **ルーティング**: AI Gateway でロギング・コスト追跡・安全性を担保


---
layout: image-right
image: https://blog.cloudflare.com/_emdash/api/media/file/01KZCGV8QFJNCYQPD2FV56JEB6.png
backgroundSize: contain
---

# アーキテクチャ図

Worker・Durable Objects・Workers AI・
AI Gateway・MCP serverの連携

<footer class="text-xs opacity-50 mt-4">
出典: Cloudflare Blog https://blog.cloudflare.com/ja-jp/introducing-radar-researcher/
</footer>

---

# データ取得の仕組み: MCP + Code Mode


- データアクセスには **Cloudflare MCP server** と **Code Mode** を利用
- Radar APIの **OpenAPI仕様** から、質問内容に応じた
  適切なエンドポイントを自動的に検索・選択
- ユーザーはAPIのエンドポイント名やパラメータを意識しなくてよい


---

# 細かい工夫


- 会話タイトル・関連質問候補の生成には**小型・高速なモデル**を使用
- 現在の日時や接続情報をコンテキストとしてモデルへ渡す
- 会話の共有機能は **R2** を使って保存


<br>


## エージェント時代への対応



- **WebMCP** 標準に対応し、ブラウザエージェントがRadarを直接操作可能に
- 命令的API（JavaScriptでのツール登録）と宣言的API（HTML構造の解釈）の両方をサポート
- Radarを「エージェントが使いやすいサイト」にする Agent-ready の取り組みの一環


---
class: text-center
---

# コード例で見る:
# Markdownから実際のRadarチャートへ

言語モデルはMarkdownで応答するが、
数値そのものではなく**APIパスを参照するチャート仕様**を発行する

---

# radar-chart ブロックの例

モデルが応答内に発行するチャート仕様（コードフェンス）

```json
{
  "type": "speedFlower",
  "title": "Internet speed quality — Portugal",
  "dataFrom": "/radar/quality/speed/summary?location=PT"
}
```

(フェンスの言語タグは実際には `radar-chart`)


フロントエンドがこのブロックを検出すると、
`dataFrom` のAPIパスに実際にリクエストを送り、
その場でインタラクティブなチャートとして描画する


---

# なぜこの設計なのか


- モデルが数値を「記憶」や「推測」で書き出すことによる
  **ハルシネーションを避けられる**（数値は常に実データから取得）
- `type` や `title` はモデルが文脈に応じて選ぶが、
  データ取得自体はAPI呼び出しに委ねられるため**常に最新の値**を反映
- 結果として得られるのは静的な画像ではなく、
  Radar本体の他のチャートと同様に**操作可能なチャート**


---
class: text-center
---

# ユースケース

---
layout: image-right
image: https://blog.cloudflare.com/_emdash/api/media/file/01KZCGV8FHJFVTRA14X5JTMK6R.png
backgroundSize: contain
---

# ユースケース①
# ポルトガルのインターネット品質


- 「ポルトガルのインターネット品質は？」と平文で質問
- 対応するインターネット品質APIを自動的に照会
- インタラクティブなチャートとともに回答


<footer class="text-xs opacity-50 mt-4">
出典: Cloudflare Blog https://blog.cloudflare.com/ja-jp/introducing-radar-researcher/
</footer>

---
layout: image-right
image: https://blog.cloudflare.com/_emdash/api/media/file/01KZCGV8H47VKY4CQSX6RVK88Q.png
backgroundSize: contain
---

# ユースケース②
# インターネット遮断の調査


- 2026年初頭のイラン政府によるインターネット遮断を題材にした例
- 「遮断中に何が起きたか」という質問に対応
- 複数のデータビューを自動集約し、時系列で説明
- 単一のAPI呼び出しでは終わらない横断調査に対応


<footer class="text-xs opacity-50 mt-4">
出典: Cloudflare Blog https://blog.cloudflare.com/ja-jp/introducing-radar-researcher/
</footer>

---

# ユースケース③
# 既存チャートを深掘りする対話の起点に


- 普段Radar上でチェックしているチャートについて
  「なぜこの形なのか」「他地域と比べてどうか」を深掘りしたい場合
- ゼロから質問を書く代わりに「Explain with AI」から会話を開始
- スクリーンショット・生データ・表示条件がまとめてモデルへ渡される
- いま見ている画面そのものを踏まえた説明・追加の掘り下げが可能


---

# まとめ


- Cloudflare Radarのデータには、これまで専門知識という「アクセスの壁」があった
- Radar Researcherは自然言語での問い合わせと実データによる
  インタラクティブなチャートで、この壁を引き下げる
- Agents SDK・Durable Objects・Workers AI・AI Gateway・MCP・Code Modeを
  組み合わせて構築されている
- モデルはAPIパスを参照する `radar-chart` 仕様を発行し、
  フロントエンドが実データで描画することでハルシネーションを避ける
- WebMCP対応により、Radar自体を人間だけでなくエージェントが
  直接操作できるサイトへと広げている


---

<div class="text-center">

# 参考リンク

</div>

- 原文: [Introducing Radar Researcher](https://blog.cloudflare.com/introducing-radar-researcher/)
- [Cloudflare Radar](https://radar.cloudflare.com)
- [Radar Researcher（ライブ版）](https://radar.cloudflare.com/?showResearcher=true)
- [Radar API ドキュメント](https://developers.cloudflare.com/api/resources/radar)
- [Cloudflare Agents SDK](https://agents.cloudflare.com/)
- [Cloudflare MCP server（GitHub）](https://github.com/cloudflare/mcp)
- [Code Mode MCP](https://blog.cloudflare.com/code-mode-mcp)
- [WebMCP](https://webmachinelearning.github.io/webmcp/)
- [Agent-ready の取り組みについて](https://blog.cloudflare.com/agent-readiness/)
- Workers サンプル: [github.com/syumai/cloudflare-blog-summaries/tree/main/examples/introducing-radar-researcher](https://github.com/syumai/cloudflare-blog-summaries/tree/main/examples/introducing-radar-researcher)

<div class="pt-8 text-sm opacity-50">
Wiki: docs/articles/2026-08-07-introducing-radar-researcher.md
</div>
