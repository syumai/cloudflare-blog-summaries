# webmcp サンプル

元記事: [あらゆるWebサイトにWebMCPインターフェースを付与する](https://blog.cloudflare.com/webmcp/)（[Wiki](../../docs/articles/2026-08-06-webmcp.md)）

## これは何か

WebMCP は Chrome 146 で実験的に提供されるブラウザ標準で、ページが `document.modelContext.registerTool()` を通じて自分自身の「ツール」をAIエージェントに公開できる仕組みです。Cloudflare の実装の要点は、**オリジンのHTML・コードを一切変更せず、エッジで配信時に1行の `<script>` タグを注入するだけ**で既存サイトを WebMCP 対応にできる点にあります。

このサンプルは、Worker が生成する簡易 Todo アプリを「オリジンのHTML」に見立て、`HTMLRewriter`（Cloudflare Workers の標準API）で `</body>` の直前にブリッジスクリプトタグを注入します。ブリッジスクリプト自体は `/.webmcp/bridge.js` として同一オリジンから配信され、記事のコード例とほぼ同じ形で `add-todo` ツールを登録します。ブラウザが WebMCP に未対応（`document.modelContext` が存在しない）の場合は何もせず終了するため、既存サイトへの導入リスクは低く抑えられています。

## セットアップ

```bash
npm install
npx wrangler dev
```

`http://localhost:8787/` をブラウザで開くと、Todoアプリの HTML に `<script type="module" src="/.webmcp/bridge.js" ...>` が注入されていることを「ページのソースを表示」で確認できます。

エッジ注入の確認（記事内のコマンド例と同じ）:

```bash
curl -s http://localhost:8787/ | grep webmcp
```

WebMCP 対応ブラウザ（Chrome 146 以降で該当フラグが有効な環境）で開いた場合は、DevTools コンソールで `document.modelContext` からツール一覧を確認できます。非対応ブラウザでは `bridge.js` は何もせず終了するため、通常のTodoアプリとして問題なく表示されます。

## デプロイ

```bash
npx wrangler deploy
```

Cloudflare アカウントへのログイン (`npx wrangler login`) が必要です。追加の binding や環境変数は不要です。

## 参考

- [Wiki: webmcp](../../docs/articles/2026-08-06-webmcp.md)
- [BrowserRun WebMCP ドキュメント](https://developers.cloudflare.com/browser-run/features/webmcp/)
- [C2PA（Content Authenticity and Provenance Association）](https://c2pa.org/)
