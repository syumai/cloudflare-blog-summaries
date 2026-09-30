# vinext サンプル（Next.js アプリを Vite でビルドして Workers で動かす）

元記事: [Next.js applications, powered by Vite: introducing Vinext 1.0](https://blog.cloudflare.com/vinext-nextjs-on-vite/)（[Wiki](../../docs/articles/2026-09-28-vinext-nextjs-on-vite.md)）

## これは何か

`create-vinext-app`（vinext 1.0.0）の生成物をベースに、記事の要点を最小構成で確認できるようにした App Router アプリです。`next build` ではなく Vite（`vite build`）でビルドされ、Cloudflare Workers（workerd）上で動きます。

| パス | 内容 |
| --- | --- |
| `/` | Server Component のトップページ（`next/link` を使用） |
| `/time` | `dynamic = "force-dynamic"` と `next/headers` を使った SSR ページ |
| `/api/hello` | Route Handler（Next.js と同じ `GET` エクスポート） |

設定ファイルは `vite.config.ts`（`vinext()` と `@cloudflare/vite-plugin`）と `cloudflare.config.ts`（Worker 設定。エントリポイントは `vinext/server/fetch-handler`）です。

## セットアップ

```bash
npm install
npm run dev      # 開発サーバー（vite dev）
npm run build    # 本番ビルド
npm run start    # ビルド済み Worker をローカルでプレビュー（vite preview）
```

## デプロイ

```bash
npx vinext-cloudflare deploy --dry-run   # 設定の検証のみ（ビルド・デプロイはしない）
npm run deploy                           # ビルドして Workers にデプロイ
```

デプロイには `cf login` 等による Cloudflare アカウントの認証が必要です。

## キャッシュウォーミングについて

記事で紹介されている `--warm-cache`（`npm run deploy:warm`）は、ISR やキャッシュを使うアプリ向けの機能です。このサンプルは ISR を使っていないため、通常の `npm run deploy` で十分です。ISR / `"use cache"` を使う場合は、`vinext()` に `kvDataAdapter()` などのキャッシュアダプタを設定し、`cloudflare.config.ts` に `VINEXT_KV_CACHE` のバインディングを追加する必要があります（`vinext-cloudflare deploy --dry-run` が案内を表示します）。

## 既存の Next.js プロジェクトを移行する場合

```bash
npx vinext check   # 互換性チェック
npx vinext init    # Vite とデプロイ設定を追加（既存のプロジェクト構造は維持）
```
