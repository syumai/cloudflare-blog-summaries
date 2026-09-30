---
routerMode: hash
theme: default
title: "エージェント向けブラウザへの道: Kitesurf アップデート"
info: |
  Kitesurf アップデートの解説スライド。
  原文: https://blog.cloudflare.com/kitesurf-update/
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

# エージェント向けブラウザへの道
# Kitesurf アップデート

Birthday Week 2026

<div class="pt-4 text-sm opacity-70">
原文: https://blog.cloudflare.com/kitesurf-update/<br>
公開日: 2026-09-28
</div>

---

# TL;DR

- Kitesurf が <strong>WebMCP</strong> に対応し、エージェントが `searchFlights()` のような関数を直接呼べる
- WPTで<strong>73万件超</strong>のサブテストを通過（ローンチ時より50万件以上増）
- Boa JSとDOMの境界越え削減などの効率化。性能はローンチ時の水準を維持
- Browser Run API全面対応（CDP / Playwright / Puppeteer / MCP）
- ターミナルで動く `kitesurf` CLI（Kittyグラフィックス／ANSIテキスト）

---

# アジェンダ

- 前編のおさらいと本記事の位置づけ
- WebMCP対応
- 新しいAPIとWPTカバレッジ
- 効率化とアーキテクチャ
- Browser Run API統合（コード例）
- ターミナルレンダリング
- ユースケース・今後の方向性

---

# 背景: 前編からの進捗報告

- 前編: 人間向けの機能を削ぎ落とした、Workers上のエージェント向けブラウザとして登場（▶ [前編の解説スライド](../kitesurf/)）
- ローンチ後の課題は、実在サイトをより多く扱える互換性と、エージェントが使いやすい操作手段
- 本記事は WebMCP・標準対応・効率化・API統合・ターミナル対応の進捗をまとめたもの

<div class="text-xs opacity-60 pt-4">出典: Cloudflare Blog https://blog.cloudflare.com/kitesurf-update/</div>

---

# WebMCP対応

- クリックの模倣ではなく、サイトが公開する関数（例: `searchFlights()`）を直接呼ぶ
- Playgroundで Cloudflare Radar を使ったデモ
- 公開ツールの例: `navigate-to`、`set-location`
- ▶ [WebMCPの解説スライド](../webmcp/)

<img src="https://blog.cloudflare.com/_emdash/api/media/file/01M3D849S1CS7E3KJZ2C2XX5YM.png" style="max-height: 230px; margin: 1rem auto 0;" />

<div class="text-xs opacity-60 pt-1">出典: Cloudflare Blog https://blog.cloudflare.com/kitesurf-update/</div>

---

# WebMCPの操作デモ

<img src="https://blog.cloudflare.com/_emdash/api/media/file/01M3J6EAP7FM2KTAK6XNR46KAG.01M3J6EB95VY59A2DQXVR47C3X.gif" style="max-height: 380px; margin: 0.5rem auto 0;" />

<div class="text-xs opacity-60 pt-2">出典: Cloudflare Blog https://blog.cloudflare.com/kitesurf-update/</div>

---

# 新しいAPIとWPTカバレッジ

- 対応拡大: WebMCP / CSS Layout / CSSOM / CSS Typed OM / Custom Elements
- 加えて: URLベースのモジュール解決 / JSON modules / import maps / iframeの挙動
- <strong>730,000件超</strong>のWPTサブテストを通過（前編は21万5,000件超）

<img src="https://blog.cloudflare.com/_emdash/api/media/file/01M3J60VJ30CEM3CTHM9VNGES3.01M3J60WDK0QQH8PZ3JP564V8A.png" style="max-height: 260px; margin: 0.5rem auto 0;" />

<div class="text-xs opacity-60 pt-1">出典: Cloudflare Blog https://blog.cloudflare.com/kitesurf-update/</div>

---

# 効率化

- Boa JSエンジンとDOMの境界越え（boundary crossing）の削減
- タイマーとスクリプト読み込みの効率化
- フォント読み込みの最適化（必要な文字に限定して取得）
- 負荷の高いページのメモリ管理の改善
- 機能拡大後も、性能はローンチ時のベンチマークと同水準

---

# 性能ベンチマーク

<img src="https://blog.cloudflare.com/_emdash/api/media/file/01M3D84CB4SABP5PQS2S03D0VQ.png" style="max-height: 400px; margin: 0.5rem auto 0;" />

<div class="text-xs opacity-60 pt-2">出典: Cloudflare Blog https://blog.cloudflare.com/kitesurf-update/</div>

---

# アーキテクチャ: Life of a Kitesurf request

<img src="https://blog.cloudflare.com/_emdash/api/media/file/01M3D84F63JBTNZCF9MWPYFF2W.png" style="max-height: 400px; margin: 0.5rem auto 0;" />

<div class="text-xs opacity-60 pt-2">出典: Cloudflare Blog https://blog.cloudflare.com/kitesurf-update/</div>

---

# コード例 1: WebMCP用のMCPクライアント設定

```json {1-3|6-9|10-11|all}
{
  "mcp": {
    "kitesurf": {
      "type": "local",
      "command": [
        "npx", "-y", "chrome-devtools-mcp@latest",
        "--wsEndpoint=wss://api.cloudflare.com/.../devtools/browser?browser=kitesurf",
        "--wsHeaders={\"Authorization\":\"Bearer <BEARER_TOKEN>\"}",
        "--category-experimental-webmcp"
      ],
      "enabled": true
    }
  }
}
```

- `browser=kitesurf` でエンジンを切り替え、`--category-experimental-webmcp` でWebMCPを有効化（URL中の `...` は `client/v4/accounts/<ACCOUNT_ID>/browser-run` の省略）

---

# コード例 2: Quick Actions API

```ts {1-3|5-11|8-9|all}
interface Env {
	BROWSER: BrowserRun;
}

export default {
	async fetch(request, env): Promise<Response> {
		return await env.BROWSER.quickAction("screenshot", {
			url: "https://example.com",
			browser: "kitesurf"
		});
	},
} satisfies ExportedHandler<Env>;
```

- `browser: "kitesurf"` の指定だけでエンジンが切り替わる（▶ サンプル: examples/kitesurf/）

---

# コード例 3: ターミナルで使う

```sh
brew install cloudflare/cloudflare/kitesurf
kitesurf https://blog.cloudflare.com
kitesurf --help
```

- Kittyグラフィックスプロトコル、または純粋なANSIテキストモードで描画
- キーボード操作・スクロール・マウスイベントに対応

---

# ターミナルレンダリング

<div class="grid grid-cols-2 gap-4">
<img src="https://blog.cloudflare.com/_emdash/api/media/file/01M3J6ENQ2GCERAFE0Q0JY4TR5.01M3J6EPB731KZ184K20VGH0NZ.gif" style="max-height: 300px; margin: 0 auto;" />
<img src="https://blog.cloudflare.com/_emdash/api/media/file/01M3J6EWZSQTCSWE5G9P1M1ECM.01M3J6EXYM6012J21JZHSSFXNN.gif" style="max-height: 300px; margin: 0 auto;" />
</div>

<div class="text-xs opacity-60 pt-2">左: ターミナルレンダリング / 右: Doom を動かす様子。出典: Cloudflare Blog https://blog.cloudflare.com/kitesurf-update/</div>

---

# ユースケース

| 場面 | 内容 |
|------|------|
| WebMCP対応サイトの操作 | フォーム操作を関数呼び出しで行う |
| 既存自動化の切り替え | Playwright / Puppeteer / CDP で `browser=kitesurf` を指定 |
| Workersからのスクリーンショット | Quick Actions APIをBinding経由で呼ぶ |
| ターミナルでのWeb確認 | `kitesurf` CLIで描画 |

---

# 今後の方向性・まとめ

- 性能改善の継続、Web標準サポートの拡大
- オープンソース公開（近日予定）、PageRendererを切り離した構成の検討
- ベンチマークとWPT結果の公開
- 設計方針は不変: Workers上で、公開機能のみで動く

---

# 参考リンク

- 原文（en-us）: https://blog.cloudflare.com/kitesurf-update/
- Kitesurf: https://kitesurf.dev/ / WPT: https://kitesurf.dev/wpt / Benchmarks: https://kitesurf.dev/benchmarks
- Browser Run: https://developers.cloudflare.com/browser-run/
- WebMCP ガイド: https://developers.cloudflare.com/browser-run/features/webmcp/
- サンプル: [examples/kitesurf/](https://github.com/syumai/cloudflare-blog-summaries/tree/main/examples/kitesurf)
- Wiki: [docs/articles/2026-09-28-kitesurf-update.md](https://github.com/syumai/cloudflare-blog-summaries/blob/main/docs/articles/2026-09-28-kitesurf-update.md)
