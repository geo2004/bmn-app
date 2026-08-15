import { prisma } from '@/lib/prisma'
import AdminSidebar from '@/components/layout/AdminSidebar'
import { adminPageScope } from '@/lib/scope'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Redirects to /login when the session is missing, non-admin, or unusable.
  await adminPageScope()

  const satkerList = await prisma.satker.findMany({
    orderBy: { urutan: 'asc' },
    select: { id: true, nama: true },
  })

  return (
    <div className="flex min-h-screen">
      <AdminSidebar satkerList={satkerList} />
      <main className="flex-1 md:ml-60 p-4 md:p-6 pb-20 md:pb-6">
        {children}
      </main>
    </div>
  )
}
