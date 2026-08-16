// examples/shared/access.ts
//
// examples/ 配下のリスクあり Worker（課金が発生しうる AI / 外部API呼び出しを
// 含むもの）を Cloudflare Access で保護するための共通ガード。
//
// 参考:
// - https://blog.cloudflare.com/workers-protected-by-access/
// - https://developers.cloudflare.com/workers/configuration/cloudflare-access/
//
// 許可メールアドレスの単一ソースは同ディレクトリの allowed-emails.json。
// Access 側（Zero Trust ダッシュボードの Access アプリケーション）のポリシー
// もこのファイルの内容と一致させること。
import allowedEmails from "./allowed-emails.json";

const ALLOWED_EMAILS = new Set<string>(allowedEmails.allowedEmails);

/**
 * Cloudflare Access 経由で、allowed-emails.json に列挙されたメールアドレスの
 * ユーザーだけがリクエストを続行できるようにするガード。
 *
 * - `ctx.access` が存在しない場合（= この Worker に Cloudflare Access
 *   アプリケーションが設定されていない、または何らかの理由で Access を
 *   経由していない場合）は 403 を返す。
 *   これにより、Access のダッシュボード設定がまだ行われていない／外れて
 *   しまった場合でも、Worker 自体が fail closed で保護され、未認証アクセス
 *   による課金悪用が構造的に発生しない。
 * - Access を経由していても、`ctx.access.getIdentity()` が返す email が
 *   allowedEmails に含まれていなければ 403 を返す。
 * - 許可される場合は `null` を返す。呼び出し側はそのまま処理を継続してよい。
 *
 * 使い方:
 * ```ts
 * export default {
 *   async fetch(request, env, ctx): Promise<Response> {
 *     const denied = await requireAllowedAccess(ctx);
 *     if (denied) return denied;
 *     // ...本来の処理...
 *   },
 * } satisfies ExportedHandler<Env>;
 * ```
 */
export async function requireAllowedAccess(
  ctx: Pick<ExecutionContext, "access">,
): Promise<Response | null> {
  if (!ctx.access) {
    return new Response(
      "Forbidden: this Worker is only reachable through Cloudflare Access.\n",
      { status: 403 },
    );
  }

  const identity = await ctx.access.getIdentity();
  const email = identity?.email;

  if (!email || !ALLOWED_EMAILS.has(email)) {
    return new Response(
      "Forbidden: this Cloudflare Access identity is not allowed to use this Worker.\n",
      { status: 403 },
    );
  }

  return null;
}
