---
routerMode: hash
theme: default
title: エージェントがローカルトレースでWorkersをデバッグ可能に
themeConfig:
  primary: '#f6821f'
info: |
  Cloudflare Blog記事「エージェントがローカルトレースでWorkersをデバッグ可能に（Your agent can now debug Workers with local tracing）」の解説スライド。
  原文: https://blog.cloudflare.com/local-tracing/
class: text-center
highlighter: shiki
drawings:
  persist: false
transition: slide-left
mdc: true
lineNumbers: true
---

# エージェントが
# ローカルトレースでWorkersを
# デバッグ可能に

`wrangler dev` / `vite dev` に組み込まれた自動トレース生成

<div class="pt-4 text-sm opacity-70">
原文: https://blog.cloudflare.com/local-tracing/<br>
公開日: 2026-08-04
</div>

---

# TL;DR


- `wrangler dev`と`vite dev`が、ローカルでのWorker呼び出しに対し自動で**OpenTelemetryトレース**を生成するように
- コーディングエージェントのセッションを検出すると、SDKインストールや明示的な言及なしに**Local Explorer API**へ自動誘導
- 狙いは、エージェントがデプロイ前にローカルで失敗を特定し、修正を検証できるようにすること
- Local Explorerはブラウザ向けUIとREST APIを提供し、D1・KV・R2・Durable Objects等の閲覧・編集や可観測性データへのSQLクエリが可能


---

# アジェンダ


- 背景: エラーは分かるが原因が分からない
- エージェントがLocal Explorer APIを自動発見する仕組み
- 具体例: `POST /api/orders` の500エラーを追う
- Local Explorerでのトレース・ログ閲覧
- 仕組みの内側（workerd / Miniflare）
- 使い始める
- ユースケース


---

# 背景: エラーは分かるが原因が分からない


- 500エラーが返ってきても、どの処理で失敗したか分からない
- エージェントは手動でログを追加 → リクエスト再実行 → 出力確認、を繰り返す
- 時間とトークンを消費しながらテキストベースでリクエストを再構成


<br>


Miniflareの導入・Wrangler 3のローカルファースト化の延長線上にある取り組み


---

# 新機能: ローカル開発サーバーの自動トレース生成


`wrangler dev` と `vite dev` が、ローカルでのWorker呼び出しに対して
**自動的にOpenTelemetryトレースを生成**



- SDKのインストール・設定・プロンプトへの明示的な言及は不要
- コーディングエージェントのセッションを検出して自動誘導
- 目的: デプロイ前にローカルで失敗を特定・修正を検証


---

# エージェントがLocal Explorer APIを自動発見

```text
This dev session is running in an AI agent.

The Local Explorer API is available at
http://localhost:8787/cdn-cgi/explorer/api

Debug with traces:
POST /cdn-cgi/explorer/api/local/observability/query -- query traces and logs with SQL
```


開発サーバーがこのヒントを自動出力し、
エージェントはドキュメントを読まずにAPIを発見できる


---

# Local Explorerとは


- ブラウザ向けUIと**REST API**の両方として機能
- ローカルリソース（D1・KV・R2・Durable Objects・Workflows）の閲覧・編集
- 可観測性データへの**SQLクエリ**
- APIルートはOpenAPIスキーマを提供 → エージェントが実行時にエンドポイントを発見


---
class: text-center
---

# 具体例: `POST /api/orders` の500エラー

KVからカート取得 → D1にチェックアウト保存 → キューに送信

スキーマ変更後、500エラーが発生

---

# トレースがない場合


- 500レスポンスからはどの処理が失敗したか分からない
- KV・D1・キューの各処理の周りに手動でログを追加
- リクエストを再実行し、出力を確認し、それを繰り返す
- 時間とトークンを消費する


---

# トレースがある場合


- 読み取り専用の可観測性エンドポイントにクエリ
- KV読み取り: 成功
- D1挿入: `no such column: delivery_window` で失敗
- キュー: 一度も呼び出されなかった

---

# トレースがある場合の画面

<img src="https://blog.cloudflare.com/_image?href=https%3A%2F%2Fblog.cloudflare.com%2F_emdash%2Fapi%2Fmedia%2Ffile%2F01KZ4VE2DX8FKHW5QXQB829PGY.png&w=715&h=394&f=webp&fit=cover&position=center" class="mx-auto rounded" style="max-height: 420px;" />

<footer class="text-xs opacity-50 mt-4">
出典: Cloudflare Blog https://blog.cloudflare.com/local-tracing/
</footer>

---

# 原因特定 → 修正 → 検証


1. D1のスキーマをAPI経由で検査
2. `delivery_window` を追加するマイグレーションが**未適用**と判明
3. マイグレーションを適用
4. リクエストを再送信し、新しいトレースをクエリ


<br>


デプロイや一時的なログ追加なしに、**すべてローカルで完結**


---

# Local Explorerでの閲覧（人間向け）


- ローカル開発サーバーに組み込まれたブラウザUI
- スパン・タイミング・属性・エラー、相関付けられたログを表示
- Wranglerで `e` キー、または `/cdn-cgi/explorer` にアクセス
- Cloudflareダッシュボードではなく**localhost上で動作**

---

# Local Explorerの画面

<img src="https://blog.cloudflare.com/_image?href=https%3A%2F%2Fblog.cloudflare.com%2F_emdash%2Fapi%2Fmedia%2Ffile%2F01KZ4VE2E11BF2S4PHMXV262T1.png&w=715&h=352&f=webp&fit=cover&position=center" class="mx-auto rounded" style="max-height: 420px;" />

<footer class="text-xs opacity-50 mt-4">
出典: Cloudflare Blog https://blog.cloudflare.com/local-tracing/
</footer>

---

# 仕組みの内側①: workerdへの組み込み計測

Workers Tracingは **workerd**（OSSのWorkersランタイム）に直接組み込み


- **fetch呼び出し**: すべてのアウトバウンドHTTPリクエスト
- **バインディング呼び出し**: KV・R2・D1・Durable Objects・Queuesなど
- **ハンドラー呼び出し**: `fetch` / `scheduled` / キューハンドラー等の全ライフサイクル


<br>


SDKやコード変更は不要。カスタムスパンも自動生成スパンと並んで表示


---

# 仕組みの内側②: Miniflareの役割


- WranglerとCloudflare ViteプラグインはMiniflareでWorkerをローカル実行
- 本番と**同じランタイム**上で動くため、計測もそのまま利用可能
- Miniflareがイベント・コンソール出力を収集し、OpenTelemetryトレースへ組み立て
- ローカルのトレースストア = 内部のSQLiteバックエンドDurable Object
- Local Explorer APIがこのデータを開発サーバー経由で公開


---

# 使い始める

```bash
# Wrangler
npm install --save-dev wrangler@latest

# Cloudflare Vite plugin
npm install --save-dev @cloudflare/vite-plugin@latest
```


最新版に更新するだけで、追加のSDKインストールや設定変更なしに
ローカルトレースが有効化される


---
class: text-center
---

# ユースケース

---

# ユースケース①: スキーマ変更後の500エラー調査


- KV読み取り・D1書き込み・キュー送信から成るエンドポイントの障害切り分け
- SQLクエリ1回で失敗箇所（D1挿入のスキーマ不一致）まで即座に特定
- 「キューが一度も呼ばれていない」ことも同時に判明


---

# ユースケース②: マイグレーション未適用の検出・デプロイ前検証


- ローカルと本番のスキーマのズレをエージェント自身が発見・修正
- 失敗特定 → 環境修正 → 結果検証のサイクルをローカルだけで完結
- デプロイやCI/CD実行前の「セルフチェック」として組み込みやすい


---

# まとめ


- `wrangler dev` / `vite dev` がOpenTelemetryトレースを自動生成
- エージェントはSDKレスでLocal Explorer APIを自動発見してデバッグできる
- 本番と同じ計測（workerd組み込み）をMiniflare経由でローカルにも提供
- デプロイ前にエージェントが自律的に「失敗特定→修正→検証」を完結できる


---

<div class="text-center">

# 参考リンク

</div>

- 原文: [Your agent can now debug Workers with local tracing](https://blog.cloudflare.com/local-tracing/)
- [Local Explorer APIドキュメント（AIコーディングエージェントとの利用）](https://developers.cloudflare.com/workers/local-development/local-explorer/#use-with-ai-coding-agents)
- [Miniflareのブログ記事](https://blog.cloudflare.com/miniflare/)
- [Workers Tracingオープンベータ](https://blog.cloudflare.com/workers-tracing-now-in-open-beta/)
- [workerd（OSSリポジトリ）](https://github.com/cloudflare/workerd)
- [エージェント開発ライフサイクル ▶ 解説スライド](../agent-development-lifecycle/)
- [Cloudflare Agentsの紹介 ▶ 解説スライド](../agents-on-cloudflare/)
- [Workers サンプル（examples/local-tracing/）](https://github.com/syumai/cloudflare-blog-summaries/tree/main/examples/local-tracing)

<div class="pt-8 text-sm opacity-50">
Wiki: docs/articles/2026-08-04-local-tracing.md
</div>
