import Link from "next/link";

// Server Component（サーバー側でレンダリングされる）
export default function Home() {
  return (
    <main>
      <h1>Next.js on Vite (vinext 1.0)</h1>
      <p>この App Router アプリは vinext により Vite でビルドされ、Cloudflare Workers 上で動きます。</p>
      <ul>
        <li><Link href="/time">SSR ページ（リクエストごとにレンダリング）</Link></li>
        <li><a href="/api/hello">Route Handler（/api/hello）</a></li>
      </ul>
    </main>
  );
}
