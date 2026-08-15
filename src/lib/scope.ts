import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from './auth'
import { resolveScope, scopeWhere, type Role, type SatkerId, type Scope } from './satker'

/**
 * Server-side satker resolution. Every query in the app funnels through this
 * so there is exactly one place that decides who may see what.
 *
 * Do NOT call this inside a cached scope (`unstable_cache` / `use cache`):
 * it reads the request session, and Next forbids uncached sources there.
 */

export interface Ctx {
  role: Role
  isAdmin: boolean
  scope: Scope
  /** Prisma `where` fragment: `{satkerId}` for one satker, `{}` for all. */
  where: { satkerId?: SatkerId }
  /**
   * Satker to stamp onto newly created rows. Null only for an admin who has
   * not narrowed to a single satker — such a request must supply one explicitly.
   */
  writeSatkerId: SatkerId | null
}

async function build(requested?: unknown): Promise<Ctx | null> {
  const session = await getServerSession(authOptions)
  if (!session?.user) return null

  const role = session.user.role
  const scope = resolveScope(role, session.user.satkerId, requested)
  if (scope.kind === 'invalid' || !role) return null

  return {
    role,
    isAdmin: role === 'admin',
    scope,
    where: scopeWhere(scope),
    writeSatkerId: scope.kind === 'one' ? scope.satkerId : null,
  }
}

/** For server components. Redirects to /login when there is no usable session. */
export async function pageScope(requested?: unknown): Promise<Ctx> {
  const ctx = await build(requested)
  if (!ctx) redirect('/login')
  return ctx
}

/** For admin-only server components. */
export async function adminPageScope(requested?: unknown): Promise<Ctx> {
  const ctx = await pageScope(requested)
  if (!ctx.isAdmin) redirect('/login')
  return ctx
}

type ApiResult = { ok: true; ctx: Ctx } | { ok: false; res: NextResponse }

/**
 * For route handlers. A rejected session yields 401 rather than throwing, so
 * a stale editor token gets a clean "log in again" instead of a 500.
 */
export async function apiScope(requested?: unknown): Promise<ApiResult> {
  const ctx = await build(requested)
  if (!ctx) {
    return {
      ok: false,
      res: NextResponse.json(
        { error: 'Sesi tidak valid, silakan login ulang' },
        { status: 401 },
      ),
    }
  }
  return { ok: true, ctx }
}

export async function adminApiScope(requested?: unknown): Promise<ApiResult> {
  const result = await apiScope(requested)
  if (!result.ok) return result
  if (!result.ctx.isAdmin) {
    return {
      ok: false,
      res: NextResponse.json({ error: 'Hanya admin' }, { status: 403 }),
    }
  }
  return result
}

/**
 * Validate a satker supplied in a request body (import, create).
 *
 * Destructive and row-creating operations take their satker from the body
 * rather than from the URL, and a non-admin may only ever name their own.
 */
export function resolveWriteSatker(ctx: Ctx, requested: unknown): SatkerId | null {
  if (!ctx.isAdmin) {
    // An editor's own satker wins; a mismatched explicit value is rejected.
    if (requested != null && requested !== ctx.writeSatkerId) return null
    return ctx.writeSatkerId
  }
  if (requested == null) return ctx.writeSatkerId
  const scope = resolveScope('admin', null, requested)
  return scope.kind === 'one' ? scope.satkerId : null
}
