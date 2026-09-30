import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "vinext on Cloudflare Workers",
  description: "Minimal App Router app running on Vite via vinext",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body style={{ fontFamily: "sans-serif", maxWidth: 640, margin: "2rem auto" }}>{children}</body>
    </html>
  );
}
