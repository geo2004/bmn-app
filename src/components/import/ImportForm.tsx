'use client'

import { useState } from 'react'

interface PreviewItem {
  sheetName: string
  kondisi: string
  count: number
  skipped: number
}

interface ImportResult {
  inserted: number
  updated: number
  unkeyed: number
}

export default function ImportForm({
  satkerList,
  activeSatker,
}: {
  satkerList: { id: string; nama: string }[]
  activeSatker: string | null
}) {
  const [file, setFile] = useState<File | null>(null)
  const [satkerId, setSatkerId] = useState(activeSatker ?? satkerList[0]?.id ?? '')
  const [preview, setPreview] = useState<PreviewItem[] | null>(null)
  const [totalRows, setTotalRows] = useState(0)
  const [existing, setExisting] = useState(0)
  const [status, setStatus] = useState<'idle' | 'previewing' | 'importing' | 'done' | 'error'>('idle')
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState('')

  const satkerNama = satkerList.find((s) => s.id === satkerId)?.nama ?? satkerId

  function resetOutcome() {
    setPreview(null)
    setResult(null)
    setStatus('idle')
    setError('')
  }

  async function handlePreview() {
    if (!file) return
    setStatus('previewing')
    setError('')

    const fd = new FormData()
    fd.append('file', file)
    fd.append('preview', 'true')
    fd.append('satkerId', satkerId)

    try {
      const res = await fetch('/api/import', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Gagal preview')
      setPreview(data.preview)
      setTotalRows(data.totalRows)
      setExisting(data.existing ?? 0)
      setStatus('idle')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal preview')
      setStatus('error')
    }
  }

  async function handleImport() {
    if (!file) return
    if (!confirm(
      `Import ${totalRows} baris ke ${satkerNama}?\n\n` +
      `Aset yang sudah ada (kode barang + NUP sama) akan diperbarui, ` +
      `aset baru akan ditambahkan. Tidak ada data yang dihapus, ` +
      `dan foto yang sudah diambil tetap tersimpan.`,
    )) return

    setStatus('importing')
    setError('')

    const fd = new FormData()
    fd.append('file', file)
    fd.append('satkerId', satkerId)

    try {
      const res = await fetch('/api/import', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Gagal import')
      setResult({ inserted: data.inserted, updated: data.updated, unkeyed: data.unkeyed })
      setStatus('done')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal import')
      setStatus('error')
    }
  }

  const busy = status === 'previewing' || status === 'importing'

  return (
    <div className="max-w-2xl space-y-4">
      <div className="bg-white rounded-xl p-5 shadow-sm space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Satker Tujuan</label>
          <select
            value={satkerId}
            onChange={(e) => { setSatkerId(e.target.value); resetOutcome() }}
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
          >
            {satkerList.map((s) => (
              <option key={s.id} value={s.id}>{s.nama}</option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Data hanya akan masuk ke satker ini. Satker lain tidak terpengaruh.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">File Excel</label>
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={(e) => { setFile(e.target.files?.[0] ?? null); resetOutcome() }}
            className="block w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:text-white"
            style={{ ['--file-bg' as string]: 'var(--pkp-teal)' }}
          />
          <p className="text-xs text-gray-500 mt-1">
            File harus memiliki sheet bernama &quot;Laporan&quot;.
          </p>
        </div>

        <div className="bg-gray-50 border border-gray-100 rounded-lg p-3">
          <div className="text-xs font-semibold text-gray-600 mb-1">Cara kerja import</div>
          <ul className="text-xs text-gray-500 space-y-0.5 list-disc list-inside">
            <li>Aset dicocokkan berdasarkan <strong>Kode Barang + NUP</strong>.</li>
            <li>Sudah ada → diperbarui. Belum ada → ditambahkan.</li>
            <li><strong>Tidak ada data yang dihapus.</strong></li>
            <li>
              Kolom hasil lapangan (kondisi, lokasi, foto, keterangan) hanya
              ditimpa bila terisi di file — sel kosong tidak menghapus data.
            </li>
          </ul>
        </div>

        <button
          onClick={handlePreview}
          disabled={!file || !satkerId || busy}
          className="px-4 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-50"
          style={{ background: 'var(--pkp-teal-mid)' }}
        >
          {status === 'previewing' ? 'Memeriksa...' : 'Preview Data'}
        </button>
      </div>

      {preview && status !== 'done' && (
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            Preview: {totalRows} baris siap diimport ke {satkerNama}
          </h3>
          <p className="text-xs text-gray-500 mb-3">
            Satker ini saat ini memiliki {existing} aset.
          </p>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 border-b">
                <th className="py-2">Sheet</th>
                <th className="py-2">Baris data</th>
                <th className="py-2">Dilewati</th>
              </tr>
            </thead>
            <tbody>
              {preview.map((p) => (
                <tr key={p.sheetName} className="border-b border-gray-50">
                  <td className="py-2">{p.sheetName}</td>
                  <td className="py-2">{p.count}</td>
                  <td className="py-2 text-gray-400">{p.skipped}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <button
            onClick={handleImport}
            disabled={busy}
            className="mt-4 px-4 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-50"
            style={{ background: 'var(--pkp-teal)' }}
          >
            {status === 'importing' ? 'Mengimport...' : `Mulai Import ${totalRows} Baris`}
          </button>
        </div>
      )}

      {status === 'done' && result && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-5">
          <div className="text-green-700 font-semibold mb-1">Import berhasil!</div>
          <div className="text-sm text-green-600">
            {result.inserted} aset baru ditambahkan, {result.updated} aset diperbarui
            {' '}pada {satkerNama}.
            {result.unkeyed > 0 && (
              <> {result.unkeyed} baris dilewati karena tidak punya Kode Barang atau NUP.</>
            )}
          </div>
          <a href="/aset" className="mt-3 inline-block text-sm font-medium underline text-green-700">
            Lihat Daftar Aset →
          </a>
        </div>
      )}

      {(status === 'error' || error) && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          {error || 'Terjadi kesalahan'}
        </div>
      )}
    </div>
  )
}
