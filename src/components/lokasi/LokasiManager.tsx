'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface LokasiRow {
  id: string
  nama: string
  satkerId: string
  jumlahAset: number
}

export default function LokasiManager({
  rows,
  satkerList,
  activeSatker,
}: {
  rows: LokasiRow[]
  satkerList: { id: string; nama: string }[]
  activeSatker: string | null
}) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [newNama, setNewNama] = useState('')
  const [newSatker, setNewSatker] = useState(activeSatker ?? satkerList[0]?.id ?? '')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editNama, setEditNama] = useState('')

  const satkerName = (id: string) => satkerList.find((s) => s.id === id)?.nama ?? id

  async function send(url: string, method: string, body?: unknown) {
    setBusy(true)
    setError('')
    try {
      const res = await fetch(url, {
        method,
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error ?? 'Gagal menyimpan')
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
      return null
    } finally {
      setBusy(false)
    }
  }

  async function handleAdd() {
    if (!newNama.trim()) return
    const ok = await send('/api/lokasi', 'POST', { nama: newNama.trim(), satkerId: newSatker })
    if (ok) {
      setNewNama('')
      router.refresh()
    }
  }

  async function handleRename(row: LokasiRow) {
    const nama = editNama.trim()
    if (!nama || nama === row.nama) {
      setEditingId(null)
      return
    }
    if (
      row.jumlahAset > 0 &&
      !confirm(`${row.jumlahAset} aset memakai "${row.nama}". Semuanya akan ikut diubah menjadi "${nama}". Lanjutkan?`)
    ) return

    const ok = await send(`/api/lokasi/${row.id}`, 'PUT', { nama })
    if (ok) {
      setEditingId(null)
      router.refresh()
    }
  }

  async function handleDelete(row: LokasiRow) {
    if (!confirm(`Hapus lokasi "${row.nama}"?`)) return
    const ok = await send(`/api/lokasi/${row.id}`, 'DELETE')
    if (ok) router.refresh()
  }

  const grouped = satkerList
    .map((s) => ({ satker: s, items: rows.filter((r) => r.satkerId === s.id) }))
    .filter((g) => g.items.length > 0 || g.satker.id === newSatker)

  return (
    <div className="max-w-2xl space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-sm text-red-600">{error}</div>
      )}

      <div className="bg-white rounded-xl p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Tambah Lokasi</h3>
        <div className="flex flex-wrap gap-2">
          <select
            value={newSatker}
            onChange={(e) => setNewSatker(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
          >
            {satkerList.map((s) => (
              <option key={s.id} value={s.id}>{s.nama}</option>
            ))}
          </select>
          <input
            type="text"
            value={newNama}
            onChange={(e) => setNewNama(e.target.value)}
            placeholder="Nama ruangan"
            className="flex-1 min-w-40 border border-gray-200 rounded-lg px-3 py-2 text-sm"
          />
          <button
            onClick={handleAdd}
            disabled={busy || !newNama.trim()}
            className="px-4 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-50"
            style={{ background: 'var(--pkp-teal)' }}
          >
            Tambah
          </button>
        </div>
      </div>

      {grouped.map(({ satker, items }) => (
        <div key={satker.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">{satkerName(satker.id)}</h3>
            <span className="text-xs text-gray-400">{items.length} lokasi</span>
          </div>
          {items.length === 0 && (
            <div className="px-4 py-6 text-center text-sm text-gray-400">Belum ada lokasi</div>
          )}
          <div className="divide-y divide-gray-50">
            {items.map((row) => (
              <div key={row.id} className="px-4 py-2.5 flex items-center gap-2">
                {editingId === row.id ? (
                  <>
                    <input
                      type="text"
                      value={editNama}
                      onChange={(e) => setEditNama(e.target.value)}
                      className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm"
                      autoFocus
                    />
                    <button
                      onClick={() => handleRename(row)}
                      disabled={busy}
                      className="text-sm font-medium disabled:opacity-50"
                      style={{ color: 'var(--pkp-teal)' }}
                    >
                      Simpan
                    </button>
                    <button onClick={() => setEditingId(null)} className="text-sm text-gray-400">
                      Batal
                    </button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-sm text-gray-800">{row.nama}</span>
                    <span className="text-xs text-gray-400">{row.jumlahAset} aset</span>
                    <button
                      onClick={() => { setEditingId(row.id); setEditNama(row.nama) }}
                      className="text-sm"
                      style={{ color: 'var(--pkp-teal)' }}
                    >
                      Ubah
                    </button>
                    <button
                      onClick={() => handleDelete(row)}
                      disabled={busy || row.jumlahAset > 0}
                      title={row.jumlahAset > 0 ? 'Masih dipakai aset' : 'Hapus'}
                      className="text-sm text-red-500 disabled:text-gray-300"
                    >
                      Hapus
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
