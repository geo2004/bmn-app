import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { pageScope } from '@/lib/scope'

export default async function EditorLayout({ children }: { children: React.ReactNode }) {
  // pageScope fails closed: an editor token carrying no valid satkerId (every
  // token issued before the satker rollout) is sent back to /login rather than
  // being treated as having access to everything.
  const ctx = await pageScope()
  if (ctx.role !== 'editor') redirect('/login')
  if (ctx.scope.kind !== 'one') redirect('/login')

  const satker = await prisma.satker.findUnique({
    where: { id: ctx.scope.satkerId },
    select: { nama: true },
  })
  if (!satker) redirect('/login')

  return (
    <div className="min-h-screen" style={{ background: 'var(--pkp-bg)' }}>
      <header
        className="sticky top-0 z-40 px-4 py-3 flex items-center justify-between"
        style={{ background: 'var(--pkp-teal)', color: 'white' }}
      >
        <div>
          <div className="text-xs opacity-70">Inventarisasi BMN</div>
          {/* Must name the editor's own satker — a field officer seeing the
              wrong unit here would file assets against the wrong satker. */}
          <div className="font-bold text-sm">{satker.nama}</div>
        </div>
        <div className="text-xs opacity-70">Editor</div>
      </header>
      <main className="p-4">{children}</main>
    </div>
  )
}
