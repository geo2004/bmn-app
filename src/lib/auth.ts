import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import type { Role, SatkerId } from './satker'

interface Account {
  username: string
  role: Role
  /** null means every satker, and is only ever used for admin. */
  satkerId: SatkerId | null
  /** Env var holding this account's password. Absent/empty ⇒ account disabled. */
  envVar: string
  displayName: string
}

/**
 * Accounts are env-driven rather than stored in a user table (a deliberate
 * choice — see the plan). An account whose env var is unset simply does not
 * exist, which is what lets the legacy `editor` login disappear the moment
 * EDITOR_PASSWORD is removed from Vercel.
 */
const ACCOUNTS: Account[] = [
  { username: 'admin', role: 'admin', satkerId: null, envVar: 'ADMIN_PASSWORD', displayName: 'Admin' },
  { username: 'editor-balai', role: 'editor', satkerId: 'BALAI', envVar: 'EDITOR_BALAI_PASSWORD', displayName: 'Editor Balai' },
  { username: 'editor-jateng', role: 'editor', satkerId: 'JATENG', envVar: 'EDITOR_JATENG_PASSWORD', displayName: 'Editor PKP Jawa Tengah' },
  { username: 'editor-diy', role: 'editor', satkerId: 'DIY', envVar: 'EDITOR_DIY_PASSWORD', displayName: 'Editor PKP D.I. Yogyakarta' },
  // Legacy pre-satker editor account, scoped to Balai so it can never act
  // across satker. Kept only so the existing password keeps working through
  // the cutover; delete EDITOR_PASSWORD from Vercel to retire it.
  { username: 'editor', role: 'editor', satkerId: 'BALAI', envVar: 'EDITOR_PASSWORD', displayName: 'Editor Balai' },
]

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null

        const { username, password } = credentials
        const account = ACCOUNTS.find((a) => a.username === username)
        if (!account) return null

        // A missing env var must not become a blank password that anyone can
        // guess — require the expected secret to actually be configured.
        const expected = process.env[account.envVar]
        if (!expected || password !== expected) return null

        return {
          id: account.username,
          name: account.displayName,
          role: account.role,
          satkerId: account.satkerId,
        }
      },
    }),
  ],
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.satkerId = user.satkerId
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role
        // Assigned directly, NOT via `?? undefined`: null (admin, all satker)
        // and undefined (pre-satker token) must stay distinguishable.
        session.user.satkerId = token.satkerId
      }
      return session
    },
  },
}
