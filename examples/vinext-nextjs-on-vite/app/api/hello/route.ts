// Route Handler: Next.js と同じ書き方で Workers 上の API を定義できる
export function GET() {
  return Response.json({
    message: "Hello from vinext on Cloudflare Workers",
    runtime: "workerd",
  });
}
