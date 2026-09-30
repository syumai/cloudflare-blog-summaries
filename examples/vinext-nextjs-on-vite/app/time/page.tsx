import { headers } from "next/headers";

// リクエストごとにサーバー側でレンダリングする（SSR）
export const dynamic = "force-dynamic";

export default async function TimePage() {
  const h = await headers();
  return (
    <main>
      <h1>SSR ページ</h1>
      <p>レンダリング時刻: {new Date().toISOString()}</p>
      <p>User-Agent: {h.get("user-agent")}</p>
    </main>
  );
}
