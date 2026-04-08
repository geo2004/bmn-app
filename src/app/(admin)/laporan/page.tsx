import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export default async function LaporanPage() {
  const counts = await prisma.asetBmn.groupBy({
    by: ['kondisi'],
    _count: { _all: true },
  })

  const total = counts.reduce((s, c) => s + c._count._all, 0)
  const withFoto = await prisma.asetBmn.count({ where: { fotoUrl: { not: null } } })

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
          </p>
          <a
            href="/api/export"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-white text-sm font-medium"
            style={{ background: 'var(--pkp-teal)' }}
          >
            📥 Download Laporan Excel
          </a>
        </div>
      </div>
    </div>
  )
}
