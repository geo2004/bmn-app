import { prisma } from '@/lib/prisma'
import DashboardStats from '@/components/dashboard/DashboardStats'
import { adminPageScope } from '@/lib/scope'
import { Kondisi } from '@prisma/client'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ satker?: string }>
}) {
  const params = await searchParams
  const ctx = await adminPageScope(params.satker)

  const kondisiList: Kondisi[] = ['BAIK', 'RUSAK_RINGAN', 'RUSAK_BERAT', 'BERLEBIH', 'TIDAK_DITEMUKAN', 'SENGKETA']

  const [counts, recent, satker] = await Promise.all([
    prisma.asetBmn.groupBy({
      by: ['kondisi'],
      where: ctx.where,
      _count: { _all: true },
    }),
    prisma.asetBmn.findMany({
      where: ctx.where,
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
    ctx.scope.kind === 'one'
      ? prisma.satker.findUnique({ where: { id: ctx.scope.satkerId }, select: { nama: true } })
      : Promise.resolve(null),
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
        <p className="text-sm text-gray-500 mt-0.5">
          Ringkasan inventarisasi BMN {satker?.nama ?? 'semua satker'}
        </p>
      </div>
      <DashboardStats stats={stats} total={total} recent={recentSerialized} />
    </div>
  )
}
