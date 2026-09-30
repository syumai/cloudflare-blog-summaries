# real-time-issue-detection サンプル

記事「[本番の問題を検知してエージェントへ直接送る: Workers の Issues](https://blog.cloudflare.com/real-time-issue-detection/)」（[Wiki](../../docs/articles/2026-09-30-real-time-issue-detection.md)）に対応する、デプロイ可能な最小 Worker サンプルです。

## 記事との対応

- `wrangler.jsonc` の `observability.issues.enabled: true`: 記事の「Get started」にある、Issues を有効にする1行の設定（オープンベータ）。`wrangler` は 4.145.0 でこのフィールドを認識することを `wrangler deploy --dry-run` で確認しています（4.123.0 では「Unexpected fields」の警告が出ます）。
- `src/index.ts`:
  - `tracing.getActiveSpan()` と `setAttribute` で `user.id` / `account.id` / `session.id` を付与（記事の「Contextualizing errors for your agent」のコード例と同じ形）。
  - `GET /boom`（未処理の例外）と `GET /broken`（`Unexpected end of JSON input`）で、Issues がまとめる対象のエラーを意図的に発生させる。

## セットアップ

```bash
npm install
npx wrangler deploy
```

前提: Cloudflare アカウントと `wrangler login`。binding は不要です。

## 体験手順

1. デプロイ後、`/ok`、`/boom`、`/broken` を何度か呼ぶ（例: `curl -H 'x-user-id: usr_1' https://<your-worker>.workers.dev/boom`）。
2. ダッシュボードの Worker の「Issues」タブで、同じ原因の失敗が1つの issue にまとまり、件数・初回発生・推移・Context（user.id など）が表示されることを確認する。
3. Automations で送り先（Claude Code・Cursor・Devin・Webhook・チャットなど）を設定すると、閾値を超えた issue がその送り先へ送られる。

Issues の検出・Automations は Cloudflare 側の機能で、このサンプルは「Issues が拾うエラーの発生源」と「Context の付与」のみを再現します。エージェントへの送信は含みません。
