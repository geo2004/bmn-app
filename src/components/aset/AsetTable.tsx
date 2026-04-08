'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { KONDISI_LABELS } from '@/lib/constants'

interface Aset {
  id: string
  namaBarang: string
  kodeBarang: string | null
  nup: string | null
  tahunPerolehan: number | null
  kondisi: string
  lokasi: string | null
  fotoUrl: string | null
}

interface Props {
  data: Aset[]
  total: number
  page: number
  totalPages: number
  search: string
  kondisiFilter: string
  sort: string
  order: string
}

export default function AsetTable({ data, total, page, totalPages, search, kondisiFilter, sort, order }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    if (key !== 'page') params.delete('page')
    router.push(`/aset?${params.toString()}`)
  }

  function handleSort(col: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('sort', col)
    params.set('order', sort === col && order === 'asc' ? 'desc' : 'asc')
    params.delete('page')
    router.push(`/aset?${params.toString()}`)
  }

  function SortIcon({ col }: { col: string }) {
    if (sort !== col) return <span className="text-gray-300 ml-1">↕</span>
    return <span className="ml-1" style={{ color: 'var(--pkp-teal)' }}>{order === 'asc' ? '↑' : '↓'}</span>
  }

  const kondisiList = ['', 'BAIK', 'RUSAK_RINGAN', 'RUSAK_BERAT', 'BERLEBIH', 'TIDAK_DITEMUKAN', 'SENGKETA']

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <input
          type="search"
          defaultValue={search}
          placeholder="Cari nama / kode barang..."
          className="flex-1 min-w-48 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2"
          onChange={(e) => updateParam('search', e.target.value)}
        />
        <select
          value={kondisiFilter}
          onChange={(e) => updateParam('kondisi', e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
        >
          {kondisiList.map((k) => (
            <option key={k} value={k}>
              {k ? (KONDISI_LABELS[k] ?? k) : 'Semua Kondisi'}
            </option>
          ))}
        </select>
        <Link
          href="/aset/baru"
          className="px-4 py-2 rounded-lg text-white text-sm font-medium"
          style={{ background: 'var(--pkp-teal)' }}
        >
          + Tambah Aset
        </Link>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 text-xs text-gray-500">
          {total} aset ditemukan
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">No</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 cursor-pointer hover:text-gray-700 select-none" onClick={() => handleSort('namaBarang')}>Nama Barang<SortIcon col="namaBarang" /></th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">Kode</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap cursor-pointer hover:text-gray-700 select-none" onClick={() => handleSort('nup')}>NUP<SortIcon col="nup" /></th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap cursor-pointer hover:text-gray-700 select-none" onClick={() => handleSort('tahunPerolehan')}>Tahun<SortIcon col="tahunPerolehan" /></th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 cursor-pointer hover:text-gray-700 select-none" onClick={() => handleSort('kondisi')}>Kondisi<SortIcon col="kondisi" /></th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 cursor-pointer hover:text-gray-700 select-none" onClick={() => handleSort('lokasi')}>Lokasi<SortIcon col="lokasi" /></th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">Foto</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-400">
                    Tidak ada data
                  </td>
                </tr>
              )}
              {data.map((aset, idx) => (
                <tr key={aset.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-gray-400 text-xs">{(page - 1) * 20 + idx + 1}</td>
                  <td className="px-4 py-3 font-medium text-gray-800 max-w-xs">
                    <div className="truncate">{aset.namaBarang}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{aset.kodeBarang ?? '-'}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{aset.nup ?? '-'}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{aset.tahunPerolehan ?? '-'}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium badge-${aset.kondisi}`}>
                      {KONDISI_LABELS[aset.kondisi]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs max-w-32">
                    <div className="truncate">{aset.lokasi ?? '-'}</div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {aset.fotoUrl ? (
                      <span className="text-green-500 text-sm">✓</span>
                    ) : (
                      <span className="text-gray-300 text-sm">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/aset/${aset.id}`}
                      className="text-xs px-2 py-1 rounded border border-gray-200 hover:border-gray-300 text-gray-600"
                    >
                      Detail
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between text-sm">
            <span className="text-gray-500 text-xs">
              Halaman {page} dari {totalPages}
            </span>
            <div className="flex gap-1">
              {page > 1 && (
                <button
                  onClick={() => updateParam('page', String(page - 1))}
                  className="px-3 py-1 border border-gray-200 rounded text-xs hover:bg-gray-50"
                >
                  ← Prev
                </button>
              )}
              {page < totalPages && (
                <button
                  onClick={() => updateParam('page', String(page + 1))}
                  className="px-3 py-1 border border-gray-200 rounded text-xs hover:bg-gray-50"
                >
                  Next →
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
