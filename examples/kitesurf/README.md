# kitesurf サンプル

元記事: [Kitesurfのご紹介 — Cloudflare Workers上で動く、エージェントファーストのブラウザ](https://blog.cloudflare.com/kitesurf/)（[Wiki](../../docs/articles/2026-08-06-kitesurf.md)）

## これは何か

Kitesurf 自体は Cloudflare がホストする、AIエージェント専用に設計されたブラウザです（Chromium を使わず Cloudflare Workers 上で完全に動作します）。自分の Worker としてデプロイするものではなく、**Browser Run** というサービスを通じて `browser=kitesurf` パラメータを指定して呼び出します（今日から無料ベータとして利用可能）。

このサンプルは、記事内のコード例（「例2: Browser Run Quick Actionsでスクリーンショットを取得する」）をそのまま Worker のプロキシエンドポイントとして実装したものです。`GET /screenshot?url=<対象URL>` にアクセスすると、Worker が Browser Run の Quick Actions API (`browser=kitesurf`) を呼び出し、取得した PNG 画像をそのまま返します。

`CF_ACCOUNT_ID` / `CF_API_TOKEN` が未設定でも Worker 自体は正常に起動・デプロイできます（実際にスクリーンショットを取得しようとした時にのみ、これらの値が必要になります）。

## セットアップ

```bash
npm install
```

Browser Run を呼び出すには、Cloudflare のアカウントID と、`Browser Rendering` 権限を持つ APIトークンが必要です。

```bash
npx wrangler secret put CF_ACCOUNT_ID
npx wrangler secret put CF_API_TOKEN
```

ローカル開発時は `.dev.vars` に以下のように書いても構いません（Gitにコミットしないこと）。

```
CF_ACCOUNT_ID=xxxxxxxx
CF_API_TOKEN=xxxxxxxx
```

```bash
npx wrangler dev
```

### 動作確認

```bash
curl -s "http://localhost:8787/screenshot?url=https://example.com" --output screenshot.png
```

## デプロイ

```bash
npx wrangler deploy
```

Cloudflare アカウントへのログイン (`npx wrangler login`) が必要です。

## 参考

- [Wiki: kitesurf](../../docs/articles/2026-08-06-kitesurf.md)
- [Browser Run ドキュメント](https://developers.cloudflare.com/browser-run/)
- [Browser Run Quick Actions](https://developers.cloudflare.com/browser-run/quick-actions/)
- [Kitesurf Playground](https://kitesurf.cloudflare.app/)
