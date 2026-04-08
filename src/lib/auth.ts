import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

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

        if (username === 'admin' && password === process.env.ADMIN_PASSWORD) {
          return { id: 'admin', name: 'Admin', role: 'admin' }
        }
        if (username === 'editor' && password === process.env.EDITOR_PASSWORD) {
          return { id: 'editor', name: 'Editor', role: 'editor' }
        }
        return null
      },
    }),
  ],
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.role = (user as unknown as { role: string }).role
      return token
    },
    async session({ session, token }) {
      if (session.user) (session.user as { role: string }).role = token.role as string
      return session
    },
  },
}
