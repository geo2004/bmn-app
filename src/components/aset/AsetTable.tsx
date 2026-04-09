'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { KONDISI_LABELS, LOKASI_OPTIONS } from '@/lib/constants'
import ColumnFilter from './ColumnFilter'

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
  tahunFilter: string
  lokasiFilter: string
  fotoFilter: string
  sort: string
  order: string
  distinctTahun: number[]
}

export default function AsetTable({
  data, total, page, totalPages,
  search, kondisiFilter, tahunFilter, lokasiFilter, fotoFilter,
  sort, order, distinctTahun,
}: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    if (key !== 'page') params.delete('page')
    router.push(`/aset?${params.toString()}`)
  }

  function updateMultiParam(key: string, values: string[]) {
    const params = new URLSearchParams(searchParams.toString())
    if (values.length > 0) params.set(key, values.join(','))
    else params.delete(key)
    params.delete('page')
    router.push(`/aset?${params.toString()}`)
  }

  function handleSort(col: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('sort', col)
    params.set('order', sort === col && order === 'asc' ? 'desc' : 'asc')
    params.delete('page')
    router.push(`/aset?${params.toString()}`)
  }

  function clearAllFilters() {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (sort !== 'namaBarang') params.set('sort', sort)
    if (order !== 'asc') params.set('order', order)
    router.push(`/aset?${params.toString()}`)
  }

  function SortIcon({ col }: { col: string }) {
    if (sort !== col) return <span className="text-gray-300 ml-1">↕</span>
    return <span className="ml-1" style={{ color: 'var(--pkp-teal)' }}>{order === 'asc' ? '↑' : '↓'}</span>
  }

  // Parse filter strings into arrays for ColumnFilter selected prop
  const kondisiSelected = kondisiFilter ? kondisiFilter.split(',').filter(Boolean) : []
  const tahunSelected = tahunFilter ? tahunFilter.split(',').filter(Boolean) : []
  const lokasiSelected = lokasiFilter ? lokasiFilter.split(',').filter(Boolean) : []
  const fotoSelected = fotoFilter ? [fotoFilter] : []

  // Option lists for each column
  const kondisiOptions = Object.entries(KONDISI_LABELS).map(([k, v]) => ({ value: k, label: v }))
  const tahunOptions = distinctTahun.map((y) => ({ value: String(y), label: String(y) }))
  const lokasiOptions = LOKASI_OPTIONS.map((l) => ({ value: l, label: l }))
  const fotoOptions = [
    { value: 'ada', label: 'Ada Foto' },
    { value: 'tidak', label: 'Tidak Ada Foto' },
  ]

  // Active filter chips for summary bar
  const activeFilters: { key: string; label: string; value: string }[] = []
  if (kondisiSelected.length > 0) activeFilters.push({ key: 'kondisi', label: 'Kondisi', value: kondisiSelected.map((k) => KONDISI_LABELS[k] ?? k).join(', ') })
  if (tahunSelected.length > 0) activeFilters.push({ key: 'tahun', label: 'Tahun', value: tahunSelected.join(', ') })
  if (lokasiSelected.length > 0) activeFilters.push({ key: 'lokasi', label: 'Lokasi', value: lokasiSelected.join(', ') })
  if (fotoSelected.length > 0) activeFilters.push({ key: 'foto', label: 'Foto', value: fotoSelected[0] === 'ada' ? 'Ada Foto' : 'Tidak Ada Foto' })

  return (
    <div className="space-y-3">
      {/* Search + action bar */}
      <div className="flex flex-wrap gap-2">
        <input
          type="search"
          defaultValue={search}
          placeholder="Cari nama / kode barang..."
          className="flex-1 min-w-48 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2"
          onChange={(e) => updateParam('search', e.target.value)}
        />
        <Link
          href="/aset/baru"
          className="px-4 py-2 rounded-lg text-white text-sm font-medium"
          style={{ background: 'var(--pkp-teal)' }}
        >
          + Tambah Aset
        </Link>
      </div>

      {/* Active filter chips */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-gray-400">Filter aktif:</span>
          {activeFilters.map((f) => (
            <span
              key={f.key}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs border"
              style={{ borderColor: 'var(--pkp-teal)', color: 'var(--pkp-teal)', background: '#f0f7fa' }}
            >
              <strong>{f.label}:</strong> {f.value}
              <button
                type="button"
                onClick={() => updateMultiParam(f.key, [])}
                className="ml-0.5 hover:opacity-70 font-bold"
                title={`Hapus filter ${f.label}`}
              >
                ×
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={clearAllFilters}
            className="text-xs text-red-400 hover:text-red-600 underline"
          >
            Hapus Semua
          </button>
        </div>
      )}

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
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 cursor-pointer hover:text-gray-700 select-none" onClick={() => handleSort('namaBarang')}>
                  Nama Barang<SortIcon col="namaBarang" />
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">Kode</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap cursor-pointer hover:text-gray-700 select-none" onClick={() => handleSort('nup')}>
                  NUP<SortIcon col="nup" />
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap relative">
                  <div className="flex items-center gap-1">
                    <span className="cursor-pointer hover:text-gray-700 select-none" onClick={() => handleSort('tahunPerolehan')}>
                      Tahun<SortIcon col="tahunPerolehan" />
                    </span>
                    <ColumnFilter
                      options={tahunOptions}
                      selected={tahunSelected}
                      onChange={(vals) => updateMultiParam('tahun', vals)}
                    />
                  </div>
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 relative">
                  <div className="flex items-center gap-1">
                    <span className="cursor-pointer hover:text-gray-700 select-none" onClick={() => handleSort('kondisi')}>
                      Kondisi<SortIcon col="kondisi" />
                    </span>
                    <ColumnFilter
                      options={kondisiOptions}
                      selected={kondisiSelected}
                      onChange={(vals) => updateMultiParam('kondisi', vals)}
                    />
                  </div>
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 relative">
                  <div className="flex items-center gap-1">
                    <span className="cursor-pointer hover:text-gray-700 select-none" onClick={() => handleSort('lokasi')}>
                      Lokasi<SortIcon col="lokasi" />
                    </span>
                    <ColumnFilter
                      options={lokasiOptions}
                      selected={lokasiSelected}
                      onChange={(vals) => updateMultiParam('lokasi', vals)}
                    />
                  </div>
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap relative">
                  <div className="flex items-center gap-1">
                    Foto
                    <ColumnFilter
                      options={fotoOptions}
                      selected={fotoSelected}
                      onChange={(vals) => updateMultiParam('foto', vals.length > 0 ? [vals[vals.length - 1]] : [])}
                      align="right"
                    />
                  </div>
                </th>
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
