'use client'

import { useState } from 'react'

interface PreviewItem {
  sheetName: string
  kondisi: string
  count: number
  skipped: number
}

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null)
  const [mode, setMode] = useState<'append' | 'replace'>('append')
  const [preview, setPreview] = useState<PreviewItem[] | null>(null)
  const [totalRows, setTotalRows] = useState(0)
  const [status, setStatus] = useState<'idle' | 'previewing' | 'importing' | 'done' | 'error'>('idle')
  const [result, setResult] = useState<{ inserted: number; duplicates: number } | null>(null)
  const [error, setError] = useState('')

  async function handlePreview() {
    if (!file) return
    setStatus('previewing')
    setError('')

    const fd = new FormData()
    fd.append('file', file)
    fd.append('preview', 'true')

    try {
      const res = await fetch('/api/import', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Gagal preview')
      setPreview(data.preview)
      setTotalRows(data.totalRows)
      setStatus('idle')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal preview')
      setStatus('error')
    }
  }

  async function handleImport() {
    if (!file) return
    if (!confirm(`Import ${totalRows} baris data? Mode: ${mode === 'replace' ? 'GANTI SEMUA (data lama akan dihapus)' : 'Tambah'}`)) return

    setStatus('importing')
    setError('')

    const fd = new FormData()
    fd.append('file', file)
    fd.append('mode', mode)

    try {
      const res = await fetch('/api/import', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Gagal import')
      setResult({ inserted: data.inserted, duplicates: data.duplicates })
      setStatus('done')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal import')
      setStatus('error')
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold" style={{ color: 'var(--pkp-teal)', fontFamily: 'var(--font-poppins)' }}>
          Import Excel
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">Import data dari file Excel inventarisasi BMN</p>
      </div>

      <div className="max-w-2xl space-y-4">
        {/* Upload */}
        <div className="bg-white rounded-xl p-5 shadow-sm space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">File Excel (.xlsx)</label>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => {
                setFile(e.target.files?.[0] ?? null)
                setPreview(null)
                setResult(null)
                setStatus('idle')
              }}
              className="block text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:text-white hover:file:opacity-90 cursor-pointer"
              style={{ '--file-bg': 'var(--pkp-teal)' } as React.CSSProperties}
            />
            <p className="text-xs text-gray-400 mt-1">
              File harus memiliki sheet bernama "Laporan" (format Laporan Hasil Inventarisasi BMN standar)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Mode Import</label>
            <div className="flex gap-3">
              {(['append', 'replace'] as const).map((m) => (
                <label key={m} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value={m}
                    checked={mode === m}
                    onChange={() => setMode(m)}
                    className="text-blue-600"
                  />
                  <span className="text-sm">
                    {m === 'append' ? 'Tambah (skip duplikat)' : 'Ganti Semua (hapus data lama)'}
                  </span>
                </label>
              ))}
            </div>
            {mode === 'replace' && (
              <p className="text-xs text-red-600 mt-1">⚠ Mode ini akan menghapus semua data yang ada sebelum import</p>
            )}
          </div>

          <button
            onClick={handlePreview}
            disabled={!file || status === 'previewing' || status === 'importing'}
            className="px-4 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-50"
            style={{ background: 'var(--pkp-teal-mid)' }}
          >
            {status === 'previewing' ? 'Memeriksa...' : 'Preview Data'}
          </button>
        </div>

        {/* Preview result */}
        {preview && (
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-semibold mb-3 text-gray-700">Preview: {totalRows} baris siap diimport</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-gray-100">
                  <th className="pb-2 text-xs font-semibold text-gray-500">Sheet</th>
                  <th className="pb-2 text-xs font-semibold text-gray-500 text-right">Baris data</th>
                  <th className="pb-2 text-xs font-semibold text-gray-500 text-right">Dilewati</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {preview.map((p) => (
                  <tr key={p.sheetName}>
                    <td className="py-2">{p.sheetName}</td>
                    <td className="py-2 text-right font-medium">{p.count}</td>
                    <td className="py-2 text-right text-gray-400">{p.skipped}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <button
              onClick={handleImport}
              disabled={status === 'importing'}
              className="mt-4 px-6 py-2.5 rounded-lg text-white text-sm font-medium disabled:opacity-50"
              style={{ background: 'var(--pkp-teal)' }}
            >
              {status === 'importing' ? 'Mengimport... mohon tunggu' : `Mulai Import ${totalRows} Baris`}
            </button>
          </div>
        )}

        {/* Done */}
        {status === 'done' && result && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-5">
            <div className="text-green-700 font-semibold mb-1">Import berhasil!</div>
            <div className="text-sm text-green-600">
              {result.inserted} aset berhasil ditambahkan.
              {result.duplicates > 0 && ` ${result.duplicates} dilewati (duplikat).`}
            </div>
            <a href="/aset" className="mt-3 inline-block text-sm font-medium underline text-green-700">
              Lihat Daftar Aset →
            </a>
          </div>
        )}

        {/* Error */}
        {(status === 'error' || error) && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
            {error || 'Terjadi kesalahan'}
          </div>
        )}
      </div>
    </div>
  )
}
