import type { DefaultSession } from 'next-auth'
import type { Role, SatkerId } from '@/lib/satker'

/**
 * Without this augmentation, `role` has to be reached through an inline
 * `(session?.user as { role?: string })?.role` cast at every call site — the
 * app had eight of them. Adding satkerId on top of that would have doubled it.
 *
 * Both fields are optional on purpose: JWTs issued before this change carry
 * neither, and pretending otherwise would hide the case that matters.
 */

declare module 'next-auth' {
  interface Session {
    user: {
      role?: Role
      satkerId?: SatkerId | null
    } & DefaultSession['user']
  }

  interface User {
    role: Role
    satkerId: SatkerId | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: Role
    satkerId?: SatkerId | null
  }
}
