---
routerMode: hash
theme: default
title: "フロンティア AI モデルで自社の WAF をテストしてみた"
info: |
  フロンティア AI モデルで自社の WAF をテストしてみた: 分かったことの解説スライド。
  原文: https://blog.cloudflare.com/adaptive-ai-waf-testing/
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

# フロンティア AI モデルで自社の WAF をテストしてみた

<div class="text-xl pt-2">適応型の変異テストで分かったこと</div>

Birthday Week 2026

<div class="pt-4 text-sm opacity-70">
原文: https://blog.cloudflare.com/adaptive-ai-waf-testing/<br>
公開日: 2026-09-29
</div>

---

# TL;DR

- LLM に<strong>ハッカー役</strong>をさせ、WAF の内部情報なしで、レスポンスだけを頼りにペイロードを変異させ続けるテストを実施
- 6 カテゴリ・45 シナリオ・<strong>1,107 回</strong>の試行。ブロック 558 件、人間レビュー後の所見は <strong>49 件</strong>（48 件が CMDi と SSRF）
- ブロックされなかった要求は「確定した脆弱性」ではなく、人間が確認する<strong>手がかり</strong>
- 所見から Managed Ruleset に <strong>SSRF 系の 3 件の改善</strong>
- 顧客向けの指針は多層防御とパッチ適用

---

# アジェンダ

- 背景: LLM は「変異」が得意
- 適応ループの仕組み
- テスト範囲と WAF 設定
- SSRF セッションの実例
- 結果と所見の数え方
- 所見から検知へ / 学んだこと
- コード例の有無・ユースケース・顧客ができること

---

# 背景: LLM が得意なこと

- 攻撃で LLM が得意なのは、ペイロードを<strong>人間より速く反復・変異</strong>させること
- 応答を見て、別のエンコード、別の送信位置、次の脆弱性へと切り替える
- 従来のテスト: 静的（コードを実行せず解析）と動的（動作中のアプリを探る）
- 今回は<strong>動的</strong>: LLM を攻撃者として動かし、WAF が役目を果たすかを評価
- LLM から見えるのは選んだ HTTP レスポンスのみ（ソースコードも WAF ルールも見えない）

---

# 適応ループ（1）: 2 回のモデル呼び出し

- 1 シナリオ = 攻撃カテゴリ 1 つ + 入力位置 + ブロック済みの開始リクエスト + 固定回数の試行
- <strong>提案呼び出し</strong>: 開始リクエスト・文脈・直近の履歴から次の変異案を出し、コードが組み立てて送信
- <strong>レビュー呼び出し</strong>: ステータス・選択ヘッダー・本文を見て評価
- どちらも <strong>WAF の内部情報は受け取らない</strong>（ルール式、ルール ID、Attack Score の詳細、動作した層）
- 実装は Python（既存のペンテストツールは包まず、リプレイ・状態追跡・結果収集を自作）

---

# 適応ループ（2）: 図

<img src="https://blog.cloudflare.com/_emdash/api/media/file/01M3MTARY7NXCSXH1S1T8ZXEC9.01M3MTAT52J8VRYRBJEAC625K3.png" style="max-height: 400px; margin: 0 auto;" />

<div class="text-xs opacity-60 pt-2">出典: Cloudflare Blog https://blog.cloudflare.com/adaptive-ai-waf-testing/</div>

---

# 適応ループ（3）: 安全面の設計

- モデルは直接リクエストを送らない。<strong>各ステップはコードが制御</strong>
- 送信前: ホスト名の許可リスト検査、リダイレクト無効化、試行の記録、上限の強制
- 送信後: レスポンスを記録し、レビュー結果から次の<strong>あらかじめ定義されたステップ</strong>を選ぶ
- レスポンスの文章は後のプロンプトに入りうるので<strong>信頼できない入力</strong>として扱う
- モデルはルールのデプロイも適用設定の変更もできない

---

# テスト範囲と WAF 設定

- 対象: 顧客の承認を得たステージング環境（テスト用 User-Agent を許可リストに入れた）
- 45 シナリオ。うち 44 が次の 6 カテゴリ、1 つがログ・インジェクション（別扱い）

- カテゴリ: <strong>XSS / SQLi / CMDi / SSRF / LFI（パストラバーサル） / Log4j</strong>

- WAF 設定: <strong>Attack Score 30 以下をブロック</strong> + Managed Ruleset すべて有効 + <strong>OWASP CRS Paranoia Level 3</strong>
- 指標は「ブロックされたか否か」。個々のルールではなく WAF 境界全体の結果

---

# SSRF の実例（1）: 状況

- クラウドのメタデータサービスは一時的な認証情報を返すことがある。SSRF があるとアプリが攻撃者の代わりに取得してしまう
- 同じメタデータアドレスを、整数・8 進・末尾ドットなどの表記で、リクエストの別位置に入れて試した
- 結果: <strong>1 つを除いてすべてブロック</strong>
- 18 回目の試行で、直前にブロックされたものと<strong>同じ構造</strong>のまま、ホストを末尾ドット形式に変更 → WAF のブロックではなく<strong>リダイレクト</strong>

---

# SSRF の実例（2）: 経過

| 段階 | 観測 | 次の手 |
|---|---|---|
| ベースライン | `169.254.169.254` は 403 | 10 進整数 `2852039166` |
| 試行 1 | ブロック | 8 進 `0251.0376.0251.0376` + フォーム本文へ |
| 試行 2 | ブロック | パスなしのホスト名表記へ |
| 試行 3〜16 | 省略 | 組み合わせを探索 |
| 試行 17 | ブロック | 末尾ドット `169.254.169.254.` に切替 |
| 試行 18 | リダイレクト（edge-pass として保持） | 人間のトリアージ・オリジン側検証へ |

<div class="text-xs opacity-60 pt-2">仮説の列は「モデルの説明の要約」で、正しさの証明ではない。メタデータ取得の証拠もない</div>

---

# 結果: 数字で見る

| 指標 | 値 |
|---|---|
| 記録された変異試行 | 1,107 |
| トリアージ後の結果セット | 607 |
| ブロックされたリクエスト | 558 |
| WAF 関連の所見 | 49 |

- XSS・LFI・SQLi・Log4j は<strong>ほぼ全面的にカバー</strong>
- 所見 49 件のうち <strong>48 件が CMDi と SSRF</strong>
- 残りは、使える要求を作れなかった、届かなかった、無害だった等で数えない（607 = 558 + 49）

---

# 所見として数える 5 つの問い

| 問い | 理由 |
|---|---|
| 有効なリクエストを実際に送ったか | 失敗・未到達では WAF について分からない |
| 明確にブロックされなかったか | 曖昧な応答は数えない |
| まだ悪意あるものか | すり抜けの過程で無害化することがある |
| WAF の責任範囲か | DNS やネットワーク経路の攻撃は WAF では止められない |
| 安全に再現できるか | 修正に安定したテストケースが必要 |

- 通らないものを除き、重複をまとめて、ルール・正規化・緩和の作業に渡した

---

# 所見から検知へ

- 所見ごとに、既存ルールの隙間か、正規化の問題か、別の制御の担当かを判断
- 関連所見を <strong>4 つの候補ルール群</strong>にまとめ、ライブトラフィックで検証してから適用

| 問題 | 次の手 |
|---|---|
| 検知がない / 範囲が狭い | 既存ルールのカバレッジを確認 |
| 同等入力が異なって解釈される | エンジン・正規化のレビュー |
| 誤検知リスクが高い | 候補を修正または却下 |

- 成果: <strong>SSRF - Obfuscated Host</strong>・<strong>SSRF - Restricted Protocol</strong>（7/21）、<strong>SSRF - Cloud</strong> の改善（8/4）

---

# 学んだこと

- <strong>モデルは一部にすぎない</strong>: 同系列の 2 バージョンで変異は違っても、根本的に同じ問題が出た。リプレイと証跡が一貫していたので比較できた
- <strong>回数を増やしても比例しない</strong>: 25 回の上限の終盤は同じ発想の繰り返し。開始リクエスト・カテゴリ・入力位置を増やすほうが広く見つかった
- <strong>重要かを決めたのは人間</strong>: レビューなしでは所見はゼロ

---

# コード例の有無

- 記事本文にコードブロックやルール式の引用は<strong>含まれていない</strong>
- 代わりに、実例で使われた宛先アドレスの表記を示す

```text {all}
169.254.169.254            # 直接のメタデータアドレス（ブロック）
2852039166                 # 10 進整数（ブロック）
0251.0376.0251.0376        # 8 進（フォーム本文でもブロック）
169.254.169.254.           # 末尾ドット（試行 18: リダイレクト）
```

- 表記が違っても同じ宛先を指す。WAF がどれも同じ宛先と読めるかが焦点

---

# ユースケース1: WAF の検証の自動化

- ブロックされる既知の攻撃を種に、エンコード・送信位置・表記を LLM で変異
- 検知の隙間の「手がかり」を機械的に大量に得る

---

# ユースケース2: ルール開発サイクル

- 所見 → リプレイ → 候補ルール → ライブトラフィックで影響確認 → Managed Ruleset
- 記事は、これが WAF 開発ライフサイクルの基盤になりつつあるとしている

---

# ユースケース3: 自社ステージングでの検証

- 既にアプリのセキュリティテストをしているなら、本番と同じ Cloudflare の制御で保護された<strong>ステージング用ホスト名</strong>に対して実行
- 実験そのものの再現は不要

---

# ユースケース4: ルールの安全な展開

- Managed Rules をまず<strong>ログ</strong>で動かす
- Security Events で一致したリクエストを確認
- 正当なトラフィックに影響がないのを確かめてから<strong>ブロック</strong>へ

---

# 顧客ができること: 多層防御

<img src="https://blog.cloudflare.com/_emdash/api/media/file/01M3MTAS0ZN1PNNBWH3S61D881.01M3MTAT26V9K26W3PATRB6Y1P.png" style="max-height: 330px; margin: 0 auto;" />

- Managed Rules と Attack Score を正しく設定し、API Security・Bot 対策・Threat Intelligence も併用
- <strong>ポジティブセキュリティ</strong>は期待する要求の形を定義して外れを検出

<div class="text-xs opacity-60">出典: Cloudflare Blog https://blog.cloudflare.com/adaptive-ai-waf-testing/</div>

---

# まとめ・所感

- 「LLM が突破した」ではなく、<strong>LLM の手がかりを人間がトリアージして検知に変えた</strong>話
- モデルを WAF 内部から隔離し、送信・上限・許可リストをコードで管理する設計が安全面の要
- 1,107 回の試行から有意な所見は 49 件。数える基準が明確
- WAF をすり抜けても、脆弱なアプリがなければ攻撃は成立しない。<strong>パッチ適用</strong>が最強の防御の 1 つ
- 次回予告: モデルが脆弱性と WAF ルールの両方を知る<strong>ホワイトボックス</strong>テスト
- デプロイ可能なサンプルは対象外（社内の WAF テスト手法が中心のため）

---

# 参考リンク

- 原文（en-us）: https://blog.cloudflare.com/adaptive-ai-waf-testing/
- 独自の脆弱性ハーネスの作り方: https://blog.cloudflare.com/build-your-own-vulnerability-harness/
- WAF Attack Score: https://developers.cloudflare.com/waf/detections/attack-score/
- WAF の変更履歴: https://developers.cloudflare.com/waf/change-log/changelog/
- Attack Signature Detection: https://blog.cloudflare.com/attack-signature-detection/
- 関連スライド: [Application Profiles](../application-profiles/)
- 枠組み記事のスライド: [AI 時代の適応型アプリケーションセキュリティ](../ai-era-framework/)
- Wiki: [docs/articles/2026-09-29-adaptive-ai-waf-testing.md](https://github.com/syumai/cloudflare-blog-summaries/blob/main/docs/articles/2026-09-29-adaptive-ai-waf-testing.md)
