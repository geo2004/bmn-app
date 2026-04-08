import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function EditorLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  const role = (session?.user as { role?: string })?.role

  if (!session || role !== 'editor') {
    redirect('/login')
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--pkp-bg)' }}>
      <header
        className="sticky top-0 z-40 px-4 py-3 flex items-center justify-between"
        style={{ background: 'var(--pkp-teal)', color: 'white' }}
      >
        <div>
          <div className="text-xs opacity-70">Inventarisasi BMN</div>
          <div className="font-bold text-sm">BP3KP Jawa III</div>
        </div>
        <div className="text-xs opacity-70">Editor</div>
      </header>
      <main className="p-4">{children}</main>
    </div>
  )
}
