import { prisma } from '@/lib/prisma'
import { adminPageScope } from '@/lib/scope'

export default async function LaporanPage({
  searchParams,
}: {
  searchParams: Promise<{ satker?: string }>
}) {
  const ctx = await adminPageScope((await searchParams).satker)

  const [counts, withFoto, satkerList] = await Promise.all([
    prisma.asetBmn.groupBy({ by: ['kondisi'], where: ctx.where, _count: { _all: true } }),
    prisma.asetBmn.count({ where: { ...ctx.where, fotoUrl: { not: null } } }),
    prisma.satker.findMany({ orderBy: { urutan: 'asc' }, select: { id: true, nama: true } }),
  ])

  const total = counts.reduce((s, c) => s + c._count._all, 0)

  // A BMN report is filed per satker, so the download always names one rather
  // than silently combining every satker into a single official document.
  const scope = ctx.scope
  const targets =
    scope.kind === 'one'
      ? satkerList.filter((s) => s.id === scope.satkerId)
      : satkerList

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold" style={{ color: 'var(--pkp-teal)', fontFamily: 'var(--font-poppins)' }}>
          Export Laporan
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">Download laporan inventarisasi BMN dalam format Excel</p>
      </div>

      <div className="max-w-xl space-y-4">
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Ringkasan Data</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Total aset</span>
              <span className="font-medium">{total}</span>
            </div>
            <div className="flex justify-between">
              <span>Aset dengan foto</span>
              <span className="font-medium text-green-600">{withFoto}</span>
            </div>
            <div className="flex justify-between">
              <span>Aset tanpa foto</span>
              <span className="font-medium text-orange-500">{total - withFoto}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Download Excel</h3>
          <p className="text-xs text-gray-500 mb-4">
            File Excel akan berisi 7 sheet: Laporan ringkasan + 6 sheet per kondisi.
            Selisih administrasi vs inventarisasi dihitung otomatis.
            Laporan dibuat per satker.
          </p>
          <div className="space-y-2">
            {targets.map((s) => (
              <a
                key={s.id}
                href={`/api/export?satker=${s.id}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-white text-sm font-medium"
                style={{ background: 'var(--pkp-teal)' }}
              >
                📥 Download Laporan {s.nama}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
