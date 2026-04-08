'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { KONDISI_LABELS, KONDISI_COLORS } from '@/lib/constants'

interface Stats {
  kondisi: string
  count: number
}

interface RecentAset {
  id: string
  namaBarang: string
  kondisi: string
  lokasi: string | null
  fotoUrl: string | null
  updatedAt: string
}

export default function DashboardStats({
  stats,
  total,
  recent,
}: {
  stats: Stats[]
  total: number
  recent: RecentAset[]
}) {
  const chartData = stats.map((s) => ({
    name: KONDISI_LABELS[s.kondisi] ?? s.kondisi,
    jumlah: s.count,
    kondisi: s.kondisi,
  }))

  return (
    <div className="space-y-6">
      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {stats.map((s) => (
          <div key={s.kondisi} className="bg-white rounded-xl p-4 shadow-sm">
            <div
              className="text-2xl font-bold"
              style={{ color: KONDISI_COLORS[s.kondisi] ?? '#374151' }}
            >
              {s.count}
            </div>
            <div className="text-xs text-gray-500 mt-1">{KONDISI_LABELS[s.kondisi]}</div>
          </div>
        ))}
        <div className="bg-white rounded-xl p-4 shadow-sm border-2" style={{ borderColor: 'var(--pkp-teal)' }}>
          <div className="text-2xl font-bold" style={{ color: 'var(--pkp-teal)' }}>{total}</div>
          <div className="text-xs text-gray-500 mt-1">Total Aset</div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white rounded-xl p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Distribusi Kondisi Aset</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} margin={{ top: 0, right: 10, bottom: 0, left: 0 }}>
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip
              formatter={(value: number) => [value, 'Jumlah Aset']}
              contentStyle={{ fontSize: 12, borderRadius: 8 }}
            />
            <Bar dataKey="jumlah" radius={[4, 4, 0, 0]}>
              {chartData.map((entry) => (
                <Cell key={entry.kondisi} fill={KONDISI_COLORS[entry.kondisi] ?? '#94a3b8'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recent updates */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700">Aset Terbaru Diupdate</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {recent.length === 0 && (
            <div className="px-5 py-8 text-center text-sm text-gray-400">Belum ada data</div>
          )}
          {recent.map((aset) => (
            <div key={aset.id} className="px-5 py-3 flex items-center gap-3">
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: KONDISI_COLORS[aset.kondisi] ?? '#94a3b8' }}
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-800 truncate">{aset.namaBarang}</div>
                <div className="text-xs text-gray-400">{aset.lokasi ?? '-'}</div>
              </div>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium badge-${aset.kondisi}`}
              >
                {KONDISI_LABELS[aset.kondisi]}
              </span>
              {aset.fotoUrl && <span className="text-xs text-green-600">📷</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
