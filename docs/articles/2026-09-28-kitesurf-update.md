# エージェント向けブラウザへの道: Kitesurf アップデート

- 原文: [https://blog.cloudflare.com/kitesurf-update/](https://blog.cloudflare.com/kitesurf-update/)
- 日本語版の出どころ: Cloudflare公式の日本語版（ja-jp）は確認時点で存在しなかった（404）ため、英語版（en-us）から日本語化して要約している。公開日は英語原文の datePublished に従う。
- 公開日: 2026-09-28
- 位置づけ: Birthday Week 2026 の記事
- 関連: [Kitesurfのご紹介](./2026-08-06-kitesurf.md)（本記事の前編にあたる発表）、[WebMCP](./2026-08-06-webmcp.md)（WebMCPの解説）、[examples/kitesurf/](../../examples/kitesurf/)（Quick Actions を `browser=kitesurf` で呼ぶサンプル）
- GitHub: [docs/articles/2026-09-28-kitesurf-update.md](https://github.com/syumai/cloudflare-blog-summaries/blob/main/docs/articles/2026-09-28-kitesurf-update.md)

![ヘッダー画像](https://blog.cloudflare.com/_emdash/api/media/file/01M3D845N2B9HNGCKKYKJZN8G3.png)
*図: 記事ヘッダー画像（出典: Cloudflare Blog https://blog.cloudflare.com/kitesurf-update/）*

## TL;DR

- Workers上で動くエージェント向けブラウザ Kitesurf が **WebMCP** に対応し、エージェントが `searchFlights()` のような関数を直接呼べるようになった。
- 対応Web APIが拡大し、Web Platform Tests（WPT）で **73万件超のサブテスト**を通過（ローンチ時より50万件以上増）。
- Boa JSエンジンとDOMの境界越えの削減、タイマー・スクリプト読み込み・フォント読み込みの効率化など、エージェント用途向けの最適化を実施。性能はローンチ時の水準を維持。
- Browser Run APIを全面カバー（CDP・Playwright・Puppeteer・MCP）。ターミナルで動かせる `kitesurf` CLIも登場（Kittyグラフィックスプロトコル／ANSIテキスト）。
- 引き続き「Workers上で他の顧客アプリと同じ公開機能だけで動く」設計を保ち、オープンソース化も予告されている。

## 背景・課題

[前編](./2026-08-06-kitesurf.md)で発表されたKitesurfは、人間向けに作られたChromium系ブラウザの代わりに、エージェントに必要な機能へ絞ったブラウザとして登場した。ローンチ後の課題は、実在するWebサイトをより多く正しく扱えるようにする互換性（標準への準拠）と、エージェントが操作しやすい手段の提供にある。本記事はその進捗報告として、WebMCP対応、WPTカバレッジ、効率化、API統合、ターミナル対応をまとめている。

## 発表内容 / アーキテクチャ

### WebMCP 対応

[WebMCP](./2026-08-06-webmcp.md) に対応し、エージェントはクリックの模倣ではなく、サイトが公開する関数（例: `searchFlights()`）を直接呼び出せる。Kitesurf Playgroundでは Cloudflare Radar を使ったデモがあり、`navigate-to` や `set-location` といったツールが公開されている。

![WebMCPをDevToolsで確認する様子](https://blog.cloudflare.com/_emdash/api/media/file/01M3D849S1CS7E3KJZ2C2XX5YM.png)
*図: DevToolsでのWebMCPの確認（出典: Cloudflare Blog https://blog.cloudflare.com/kitesurf-update/）*

![WebMCP操作のアニメーション](https://blog.cloudflare.com/_emdash/api/media/file/01M3J6EAP7FM2KTAK6XNR46KAG.01M3J6EB95VY59A2DQXVR47C3X.gif)
*図: WebMCPの操作デモ（出典: Cloudflare Blog https://blog.cloudflare.com/kitesurf-update/）*

### 新しいAPIとWPTカバレッジ

対応が広がった領域は、WebMCP、CSS Layout、CSSOM、CSS Typed OM、Custom Elements、URLベースのモジュール解決、JSON modules、import maps、iframeの挙動など。結果として **730,000件超のWPTサブテスト**を通過し、ローンチ時より約50万件増えた。

![WPTテスト通過数の推移](https://blog.cloudflare.com/_emdash/api/media/file/01M3J60VJ30CEM3CTHM9VNGES3.01M3J60WDK0QQH8PZ3JP564V8A.png)
*図: WPT通過数の伸び（出典: Cloudflare Blog https://blog.cloudflare.com/kitesurf-update/）*

### 効率化

- Boa JavaScriptエンジンとDOMの間の境界越え（boundary crossing）の削減
- タイマーとスクリプト読み込みの効率化
- フォント読み込みの最適化（必要な文字に限定して取得）
- 負荷の高いページでのメモリ管理の改善

機能が増えても、性能指標はローンチ時のベンチマークと同水準を保っているという。

![性能ベンチマーク](https://blog.cloudflare.com/_emdash/api/media/file/01M3D84CB4SABP5PQS2S03D0VQ.png)
*図: 性能ベンチマーク（出典: Cloudflare Blog https://blog.cloudflare.com/kitesurf-update/）*

![Life of a Kitesurf request](https://blog.cloudflare.com/_emdash/api/media/file/01M3D84F63JBTNZCF9MWPYFF2W.png)
*図: 「Life of a Kitesurf request」のアーキテクチャ図（出典: Cloudflare Blog https://blog.cloudflare.com/kitesurf-update/）*

### Browser Run API との統合

Browser Run APIを全面的にカバーし、Chrome DevTools Protocol（CDP）、Playwright、Puppeteer、MCPのいずれからも利用できる。

### ターミナルでのレンダリング

Kittyグラフィックスプロトコル、または純粋なANSIテキストモードで、ターミナル内にページを描画できる。キーボード操作、スクロール、マウスイベントに対応する。

![ターミナルでのレンダリング](https://blog.cloudflare.com/_emdash/api/media/file/01M3J6ENQ2GCERAFE0Q0JY4TR5.01M3J6EPB731KZ184K20VGH0NZ.gif)
*図: ターミナルレンダリングのデモ（出典: Cloudflare Blog https://blog.cloudflare.com/kitesurf-update/）*

![ターミナルで動くDoom](https://blog.cloudflare.com/_emdash/api/media/file/01M3J6EWZSQTCSWE5G9P1M1ECM.01M3J6EXYM6012J21JZHSSFXNN.gif)
*図: ターミナルのKitesurfで動くDoom（出典: Cloudflare Blog https://blog.cloudflare.com/kitesurf-update/）*

### 今後の方向性

継続的な性能改善、Web標準サポートの拡大、オープンソース公開（近日予定）、PageRendererを切り離した構成の検討、ベンチマークとWPT結果の公開が挙げられている。

## コード例

**1. WebMCPを使うためのMCPクライアント設定**（chrome-devtools-mcp 経由でKitesurfに接続）

```json
{
  "mcp": {
    "kitesurf": {
      "type": "local",
      "command": [
        "npx",
        "-y",
        "chrome-devtools-mcp@latest",
        "--wsEndpoint=wss://api.cloudflare.com/client/v4/accounts/<ACCOUNT_ID>/browser-run/devtools/browser?browser=kitesurf",
        "--wsHeaders={\"Authorization\":\"Bearer <BEARER_TOKEN>\"}",
        "--category-experimental-webmcp"
      ],
      "enabled": true
    }
  }
}
```

`browser=kitesurf` でエンジンをKitesurfに切り替え、`--category-experimental-webmcp` でWebMCPツールを有効にしている。

**2. Quick Actions APIでスクリーンショットを取得**

```ts
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

**3. ターミナルからの利用**

```sh
brew install cloudflare/cloudflare/kitesurf
kitesurf https://blog.cloudflare.com
kitesurf --help
```

## ユースケース

- **WebMCP対応サイトの操作**: フライト検索のようなフォーム操作を、クリックの再現ではなく関数呼び出しで行う。
- **既存の自動化の切り替え**: Playwright/Puppeteer/CDPのコードで `browser=kitesurf` を指定して、エージェント向けエンジンに乗せ換える。
- **Workersからのスクリーンショット取得**: Quick Actions APIをWorkerのBindingから呼ぶ。
- **ターミナル内でのWeb閲覧・確認**: `kitesurf` CLIでKittyグラフィックスやANSIテキストにより確認する。

## 所感・ポイント

- 「73万件超のWPTサブテスト」は、前編の21万5,000件超からの大きな伸びで、互換性の改善が数字で示されている。
- WebMCPへの対応で、DOM操作の模倣から「サイトが公開する関数の呼び出し」へ、エージェントのWeb操作の粒度が変わる。
- 記事は「Workers上で他の顧客アプリと同じ公開機能だけで動く」という当初の設計方針を維持していると強調している。
- 画像の説明文は原文のキャプションが取得できなかった図について、掲載位置から筆者が補ったもの。
- **サンプル**: 既存の [examples/kitesurf/](../../examples/kitesurf/) が本記事のQuick Actionsの例に相当するため、新規サンプルは作成していない。

## 関連リンク

- [Kitesurfのご紹介（本リポジトリ）](./2026-08-06-kitesurf.md)
- [WebMCP（本リポジトリ）](./2026-08-06-webmcp.md)
- [examples/kitesurf/](../../examples/kitesurf/)
- Kitesurf Playground: https://kitesurf.cloudflare.app
- Kitesurf: https://kitesurf.dev/
- WPT結果: https://kitesurf.dev/wpt
- ベンチマーク: https://kitesurf.dev/benchmarks
- Browser Run ドキュメント: https://developers.cloudflare.com/browser-run/
- WebMCP ガイド: https://developers.cloudflare.com/browser-run/features/webmcp/
- Browser Run 変更履歴: https://developers.cloudflare.com/browser-run/changelog/
- Discord: https://discord.com/invite/cloudflaredev
