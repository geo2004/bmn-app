import { prisma } from '@/lib/prisma'
import DashboardStats from '@/components/dashboard/DashboardStats'
import { Kondisi } from '@prisma/client'

export default async function DashboardPage() {
  const kondisiList: Kondisi[] = ['BAIK', 'RUSAK_RINGAN', 'RUSAK_BERAT', 'BERLEBIH', 'TIDAK_DITEMUKAN', 'SENGKETA']

  const [counts, recent] = await Promise.all([
    prisma.asetBmn.groupBy({
      by: ['kondisi'],
      _count: { _all: true },
    }),
    prisma.asetBmn.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 10,
      select: {
        id: true,
        namaBarang: true,
        kondisi: true,
        lokasi: true,
        fotoUrl: true,
        updatedAt: true,
      },
    }),
  ])

  const statsMap = Object.fromEntries(counts.map((c) => [c.kondisi, c._count._all]))
  const stats = kondisiList.map((k) => ({ kondisi: k, count: statsMap[k] ?? 0 }))
  const total = stats.reduce((s, c) => s + c.count, 0)

  const recentSerialized = recent.map((a) => ({
    ...a,
    updatedAt: a.updatedAt.toISOString(),
  }))

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold" style={{ color: 'var(--pkp-teal)', fontFamily: 'var(--font-poppins)' }}>
          Dashboard
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">Ringkasan inventarisasi BMN BP3KP Jawa III</p>
      </div>
      <DashboardStats stats={stats} total={total} recent={recentSerialized} />
    </div>
  )
}
