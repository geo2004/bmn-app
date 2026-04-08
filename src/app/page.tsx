import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function RootPage() {
  const session = await getServerSession(authOptions)
  const role = (session?.user as { role?: string })?.role

  if (!session) redirect('/login')
  if (role === 'admin') redirect('/dashboard')
  if (role === 'editor') redirect('/update')
  redirect('/login')
}
