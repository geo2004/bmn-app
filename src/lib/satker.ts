/**
 * Satker (work unit) constants.
 *
 * Deliberately free of server-only imports so this module is safe to pull into
 * client components (the login page and the admin satker switcher both use it).
 */

export type Role = 'admin' | 'editor'

export const SATKER_IDS = ['BALAI', 'JATENG', 'DIY'] as const
export type SatkerId = (typeof SATKER_IDS)[number]

export function isSatkerId(value: unknown): value is SatkerId {
  return typeof value === 'string' && (SATKER_IDS as readonly string[]).includes(value)
}

/** Options offered in the login dropdown. Legacy accounts are not listed here. */
export const LOGIN_OPTIONS: { username: string; label: string }[] = [
  { username: 'admin', label: 'Admin (semua satker)' },
  { username: 'editor-balai', label: 'Editor — Balai' },
  { username: 'editor-jateng', label: 'Editor — PKP Jawa Tengah' },
  { username: 'editor-diy', label: 'Editor — PKP D.I. Yogyakarta' },
]

/**
 * The satker a session is allowed to touch.
 *
 * `satkerId: null` means every satker and is only ever produced for an admin.
 * An editor whose token carries no valid satkerId is rejected outright rather
 * than being silently treated as "all" — see resolveScope().
 */
export type Scope =
  | { kind: 'all' }
  | { kind: 'one'; satkerId: SatkerId }
  | { kind: 'invalid' }

/**
 * Decide what a session may see.
 *
 * Fails closed for editors. NextAuth JWTs are stateless, so at cutover every
 * already-issued editor token carries `role: 'editor'` with no satkerId at all.
 * Treating that as "no filter" would turn every live editor session into a
 * global editor at the exact moment two more satker appear — so an editor
 * without a recognised satkerId gets `invalid` and is sent back to login.
 */
export function resolveScope(
  role: Role | undefined,
  satkerId: unknown,
  /** Admin-only: the satker an admin has selected in the UI, if any. */
  requested?: unknown,
): Scope {
  if (role === 'admin') {
    // An admin may narrow to one satker; anything unrecognised means "all".
    if (isSatkerId(requested)) return { kind: 'one', satkerId: requested }
    return { kind: 'all' }
  }
  if (role === 'editor' && isSatkerId(satkerId)) {
    // `requested` is ignored entirely for non-admins. Honouring it would just
    // move the leak from a cookie to a query string.
    return { kind: 'one', satkerId }
  }
  return { kind: 'invalid' }
}

/** Prisma `where` fragment for a scope. Never call this with an invalid scope. */
export function scopeWhere(scope: Scope): { satkerId?: SatkerId } {
  if (scope.kind === 'one') return { satkerId: scope.satkerId }
  return {}
}
