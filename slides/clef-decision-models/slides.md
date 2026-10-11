---
routerMode: hash
theme: default
title: "Clef のご紹介: オープンソースの decision model と RL ファインチューニング基盤"
info: |
  Introducing Clef: our open-source decision models, and new RL fine-tuning platform の解説スライド。
  原文: https://blog.cloudflare.com/clef-decision-models/
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

# Clef のご紹介

オープンソースの decision model と、新しい RL ファインチューニング基盤

Birthday Week 2026

<div class="pt-4 text-sm opacity-70">
原文: https://blog.cloudflare.com/clef-decision-models/<br>
公開日: 2026-10-01
</div>

---

# TL;DR

- Cloudflare 自社学習の decision model <strong>Clef</strong>（高精度）と <strong>Clef-flash</strong>（低レイテンシ）を Workers AI で公開。Hugging Face で Apache 2.0 のウェイトも公開
- 状態と型付きの質問を渡すと、<strong>確率つきの構造化された答え</strong>を返す。Jev API 互換
- vision encoder と 64k コンテキストが特徴。Jev Decision Index で Clef は 61.2
- Qwen をバックボーンにした prefill-only の非自己回帰方式で高速
- Clef を調整する <strong>RL ファインチューニング</strong>を、まず FDE チームのハンズオンで提供

---

# アジェンダ

- decision model とは
- Clef の特徴とベンチマーク
- API の使い方（コード例）
- 学習方法
- ファインチューニングと RL サービス
- ユースケース、まとめ

---

# 背景: 「有限の選択肢から素早く選ぶ」判断

<div class="grid grid-cols-2 gap-6 pt-4 text-left text-sm">
<div class="p-4 border rounded">

<strong>LLM</strong>

- 非決定的だが、推論・テキスト・ツール呼び出しの生成に向く
- 判断のたびに自由記述を生成するとコストと遅延がかさむ

</div>
<div class="p-4 border rounded">

<strong>decision model（Jev が提示した概念）</strong>

- 境界のある構造化出力を、安価・高速・一貫して返す
- 新しい分類カテゴリのたびに再学習しなくても、任意の入力で動く
- ワークフローの「判断が要る箇所」に差し込む

</div>
</div>

---

# decision model の入出力

<div class="text-sm text-left">

状態（問い合わせ文）と質問・カテゴリを渡すと、全質問を並列に評価して確率を返す。

</div>

<img src="https://blog.cloudflare.com/_emdash/api/media/file/01M3TJPNG3PJHDJ88KJZJ7Q29T.png" style="max-height: 340px; margin: 0.5rem auto 0;" />

<div class="text-xs opacity-70 pt-1">出典: Cloudflare Blog https://blog.cloudflare.com/clef-decision-models/</div>

---

# Clef の特徴

<div class="text-left pt-2">

1. <strong>vision encoder</strong> を持ち、画像を入力して分類できる（Jev は現状テキストのみ）
2. <strong>64k コンテキスト</strong>（Jev は 32k）
3. 各種ベンチマークで他の decision model と競合する精度

</div>

<div class="grid grid-cols-2 gap-4 pt-4 text-left text-sm">
<div class="p-3 border rounded">

<strong>Clef</strong>: 精度重視の大きいモデル

</div>
<div class="p-3 border rounded">

<strong>Clef-flash</strong>: レイテンシ重視の判断向け

</div>
</div>

<div class="text-sm pt-3 text-left">

Cloudflare はリクエスト／レスポンスを読み取らず、保存せず、学習にも使わないとしている（ファインチューニング製品を使う場合を除く）。

</div>

---

# 精度とレイテンシ

<img src="https://blog.cloudflare.com/_emdash/api/media/file/01M3W09VBACVT4420YA2SDXZE8.01M3W09YK4NRJQNV2S8HMMCQF0.png" style="max-height: 360px; margin: 0.5rem auto 0;" />

<div class="text-sm pt-2 text-left">

縦軸: Decision Index 0.2.1（上ほど良い）、横軸: 中央値レイテンシ。Clef 61.2 と Clef-flash 57.1 が efficient frontier 上。自己報告の値。

</div>

<div class="text-xs opacity-70 pt-1">出典: Cloudflare Blog https://blog.cloudflare.com/clef-decision-models/</div>

---

# レイテンシの比較

| 指標 (ms) | Clef | Clef-flash | Jev | DiffusionGemma Jev | Kev-9B | Laya |
| --- | --- | --- | --- | --- | --- | --- |
| Median | 209.3 | 38.8 | 524.1 | 84.4 | 51.4 | 5.8 |
| p95 | 238.6 | 122.4 | 536.0 | 211.2 | 187.9 | 222.5 |

<div class="text-sm pt-4 text-left">

- 43 の評価ベンチマークでの値。Laya は非常に速いが品質を犠牲にしている
- Workers AI のエッジ GPU により、ネットワークレイテンシも低い
- エージェントのホットパスに置き、実行は Workers AI の LLM と組み合わせられる

</div>

---

# 品質ベンチマーク（抜粋）

| ベンチマーク | Clef | Clef-flash | Jev |
| --- | --- | --- | --- |
| BFCL · case exact | 98.47 | 98.76 | 95.75 |
| API-Bank · accuracy | 91.93 | 93.11 | 88.19 |
| Home appliances · case exact | 82.95 | 97.73 | 52.27 |
| BANKING77 · macro-F1 | 94.20 | 90.93 | 79.74 |
| When2Call · accuracy | 72.37 | 65.58 | 80.97 |
| BRIGHT · nDCG@10 | 45.91 | 39.26 | 47.52 |

<div class="text-sm pt-3 text-left">

Clef が下回る項目もある（When2Call・BRIGHT など）。Typesafe の eval スイートでは 4 領域中 3 領域で Jev を上回る。

</div>

---

# コード例: Clef を呼び出す

```bash {1-4|5|6-7|8-15|16-20|all}
curl https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/ai/run/@cf/cloudflare/clef \
  -X POST \
  -H "Authorization: Bearer $CLOUDFLARE_AUTH_TOKEN" \
  -d '{
    "model": "clef",
    "state": "Checkout has been failing for every customer for the last hour.",
    "questions": {
      "urgent": { "type": "noul", "instructions": "Is this support request urgent?" },
      "team": {
        "type": "choice",
        "instructions": "Which team should handle this request?",
        "criteria": { "billing": "...", "technical": "...", "sales": "..." }
      },
      "severity": {
        "type": "score",
        "instructions": "How severe is the customer impact?",
        "criteria": ["No impact", "Minor", "Major", "Critical"]
      }
    }
  }'
```

<div class="text-sm text-left">

<code>state</code> に入力、<code>questions</code> に型付きの質問。<code>choice</code> は選択肢、<code>score</code> は順序つきの段階（<code>criteria</code> の説明文は省略表記）。

</div>

---

# コード例: Workers から呼ぶ

```ts
const result = await env.AI.run("@cf/cloudflare/clef", {
  model: "clef",
  state,
  questions: { /* 上と同じスキーマ */ },
});
```

<div class="text-sm text-left pt-2">

- Workers AI の binding からも同じ入力で呼べる（モデルページの Usage に基づく）
- 返り値は質問ごとの確率。<code>urgent</code> は確率、<code>team</code> は選択肢ごとの確率、<code>severity</code> は確率加重スコア
- 最小サンプル: <code>examples/clef-decision-models/</code>
- 応答の厳密な JSON 構造は記事には載っていない

</div>

---

# 学習方法: prefill-only の非自己回帰

<div class="text-left text-sm pt-2">

- ベース: Qwen（Clef は Qwen3.8-27B、Clef-flash は Qwen3.5-9B。原文表記）
- 推論: prefill-only の 1 パスで、有効な選択肢を<strong>並列にスコアリング</strong>。中間テキストを生成しない
- 選択肢ごとに文脈を抽出し、フィールド間と元のペイロードへ cross-attend する二段階の attention ルーティング
- 学習: バックボーンを凍結し、ルーティングヘッドと rank-256 の低ランクアダプタを同時最適化
- 損失: label-smoothed cross-entropy と、確率較正のための Brier loss
- データ: フィールド順序・プロンプト・スキーマ構造を入れ替えた社内の合成データ

</div>

---

# RLCD: 較正された判断のための強化学習

<div class="text-left pt-2">

- <strong>R</strong>einforcement <strong>L</strong>earning for <strong>C</strong>alibrated <strong>D</strong>ecisions
- 隣接する順序選択肢に部分点を与える
- 完全に正確なレコード出力に報酬を与える
- 参照ペナルティで分布シフトを防ぐ

</div>

<div class="text-sm pt-4 text-left">

結果として、分類精度の向上、確率のみの出力、Jev やベースの Qwen より高速な推論を実現したと述べている。

</div>

---

# なぜファインチューニングか

<div class="grid grid-cols-2 gap-6 pt-4 text-left text-sm">
<div class="p-4 border rounded">

<strong>社内の専用分類器ニーズ</strong>

- Trust & Safety の申告の評価
- Cloudflare サポートのトリアージ
- Bot 製品での良い／悪いクローラの判定

</div>
<div class="p-4 border rounded">

<strong>考え方</strong>

- 汎用性能の一部と引き換えに、特定領域の精度を上げる
- 15 年以上のネットワークデータとラベル付きの意思決定履歴
- 汎用 Clef より精度・速度ともに高められる

</div>
</div>

---

# RL サービスの構成要素

| 役割 | プロダクト |
| --- | --- |
| リクエストのデータセット化 | AI Gateway |
| ロールアウト生成 | Workers AI（ベースの Clef） |
| スコアリング・リプレイの RL サンドボックス | Containers |
| 重みの更新 | <strong>Trainer</strong>（新規コンポーネント） |
| 再デプロイ | Workers AI + BYO Model（Cog） |

<div class="text-sm pt-3 text-left">

まず FDE チームのハンズオンで提供し、のちにセルフサーブ基盤にする計画。

</div>

---

# RL の学習フロー

<img src="https://blog.cloudflare.com/_emdash/api/media/file/01M3TJPQEG983EA9PS20PQZS6R.png" style="max-height: 390px; margin: 0.5rem auto 0;" />

<div class="text-sm pt-2 text-left">

Capture → Prepare → Generate → Execute + Score → Update weights → Deploy → 新しい本番トラフィックが Capture に戻る。

</div>

<div class="text-xs opacity-70 pt-1">出典: Cloudflare Blog https://blog.cloudflare.com/clef-decision-models/</div>

---

# ユースケース 1: サポートチケットの振り分け

<div class="text-left pt-2">

- チーム選択・緊急度・深刻度を 1 回の呼び出しで並列に判定
- 結果の確率で、ルーティング・エスカレーション・人への引き継ぎを決める
- Clef-flash なら、応答の前段のホットパスでも遅延を抑えられる

</div>

---

# ユースケース 2: ドメインの分類（Threat Intelligence）

<div class="text-left pt-2">

- Browser Run でページを取得・レンダリングし、Clef に分類させる
- 例: ファッション 95%、EC 85%、フィッシング 1% 未満
- 社内テストで 2.2 秒。同じワークフローの gpt-oss-120b は 4.7 秒で、返せた分類は 2 つだけ

</div>

---

# ユースケース 3: 画像の分類と専用分類器

<div class="text-left pt-2">

- vision encoder により、画像コンテンツの分類にも使える
- 自社データでの RL ファインチューニングにより、領域特化の分類器を作る
- AI Gateway のログから、自社のリクエストデータで学習を回せる

</div>

---

# まとめ

<div class="text-left pt-2">

- decision model は、判断を確率つきの構造化出力として安価・高速に返すモデル
- Clef は Cloudflare 初の自社学習モデル。Workers AI で利用でき、重みは Apache 2.0 で公開
- ベンチマークは自己報告で、項目により首位でないものもある
- RL サービスは FDE 経由のハンズオン提供から開始。セルフサーブは今後
- 設計パートナーを募集中（Cloudflare 製品の既存顧客向け）

</div>

---

# 参考リンク

<div class="text-sm text-left">

- 原文: https://blog.cloudflare.com/clef-decision-models/
- モデルページ: https://developers.cloudflare.com/workers-ai/models/clef
- Hugging Face: https://huggingface.co/Cloudflare/clef
- Jev Decision Index: https://huggingface.co/spaces/multimodalart/jev-decision-index
- サンプル: examples/clef-decision-models/
- 関連スライド: <a href="../workers-ai-gateway-unification/">▶ Workers AI と AI Gateway の統合</a> / <a href="../smaller-faster-safer-models/">▶ Kimi と GLM を大規模に実行</a> / <a href="../sovereign-ai-choice-one-year-later/">▶ ソブリンAIと選択</a> / <a href="../auto-router/">▶ Auto Router</a>

</div>
