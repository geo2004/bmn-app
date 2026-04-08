'use client'

import { useState, useEffect } from 'react'
import { KONDISI_LABELS, getKlasifikasi } from '@/lib/constants'
import { signOut } from 'next-auth/react'

interface NupOption {
  id: string
  nup: string | null
  lokasi: string | null
  kondisi: string
}

interface AsetDetail {
  id: string
  namaBarang: string
  kodeBarang: string | null
  nup: string | null
  tahunPerolehan: number | null
  merkType: string | null
  satuan: string | null
  lokasi: string | null
  alamat: string | null
  menurutAdministrasi: number | null
  menurutInventarisasi: number | null
  kondisi: string
  fotoUrl: string | null
  ket: string | null
  koordinat: string | null
}

export default function UpdatePage() {
  const [namaList, setNamaList] = useState<string[]>([])
  const [loadingNama, setLoadingNama] = useState(true)

  const [selectedNama, setSelectedNama] = useState('')
  const [nupOptions, setNupOptions] = useState<NupOption[]>([])
  const [selectedNup, setSelectedNup] = useState('')

  const [selectedAset, setSelectedAset] = useState<AsetDetail | null>(null)
  const [loadingAset, setLoadingAset] = useState(false)

  // Editable fields
  const [merkType, setMerkType] = useState('')
  const [menurutInventarisasi, setMenurutInventarisasi] = useState('')
  const [kondisi, setKondisi] = useState('BAIK')
  const [lokasi, setLokasi] = useState('')
  const [ket, setKet] = useState('')
  const [fotoFile, setFotoFile] = useState<File | null>(null)
  const [fotoPreview, setFotoPreview] = useState<string | null>(null)

  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  // Load distinct nama barang on mount
  useEffect(() => {
    fetch('/api/aset/cari?tipe=true')
      .then(r => r.json())
      .then(data => setNamaList(data))
      .finally(() => setLoadingNama(false))
  }, [])

  // Load NUPs when nama changes
  async function handleNamaChange(nama: string) {
    setSelectedNama(nama)
    setSelectedNup('')
    setNupOptions([])
    setSelectedAset(null)
    setSaved(false)
    setError('')
    if (!nama) return

    const res = await fetch(`/api/aset/cari?nama=${encodeURIComponent(nama)}`)
    const data: NupOption[] = await res.json()
    setNupOptions(data)

    // Auto-select if only one NUP
    if (data.length === 1) {
      setSelectedNup(data[0].nup ?? '')
      loadAset(data[0].id)
    }
  }

  async function handleNupChange(nup: string) {
    setSelectedNup(nup)
    setSelectedAset(null)
    setSaved(false)
    setError('')
    if (!nup) return

    const option = nupOptions.find(o => (o.nup ?? '') === nup)
    if (option) loadAset(option.id)
  }

  async function loadAset(id: string) {
    setLoadingAset(true)
    try {
      const res = await fetch(`/api/aset/cari?id=${id}`)
      const aset: AsetDetail = await res.json()
      setSelectedAset(aset)
      setMerkType(aset.merkType ?? '')
      setMenurutInventarisasi(aset.menurutInventarisasi != null ? String(aset.menurutInventarisasi) : '')
      setKondisi(aset.kondisi)
      setLokasi(aset.lokasi ?? '')
      setKet(aset.ket ?? '')
      setFotoFile(null)
      setFotoPreview(aset.fotoUrl ?? null)
    } finally {
      setLoadingAset(false)
    }
  }

  function handleFotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFotoFile(file)
    setFotoPreview(URL.createObjectURL(file))
  }

  async function handleSave() {
    if (!selectedAset) return
    setSaving(true)
    setError('')

    try {
      let fotoUrl = selectedAset.fotoUrl

      if (fotoFile) {
        const fd = new FormData()
        fd.append('file', fotoFile)
        fd.append('asetId', selectedAset.id)
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: fd })
        if (!uploadRes.ok) throw new Error('Gagal upload foto')
        const uploadData = await uploadRes.json()
        fotoUrl = uploadData.url
      }

      const inventarisasiNum = menurutInventarisasi !== '' ? parseFloat(menurutInventarisasi) : null

      const res = await fetch(`/api/aset/${selectedAset.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merkType: merkType || null,
          menurutInventarisasi: inventarisasiNum,
          kondisi,
          klasifikasi: getKlasifikasi(kondisi),
          lokasi: lokasi || null,
          ket: ket || null,
          fotoUrl,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Gagal menyimpan')
      }

      setSaved(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setSaving(false)
    }
  }

  function resetForm() {
    setSelectedNama('')
    setSelectedNup('')
    setNupOptions([])
    setSelectedAset(null)
    setFotoFile(null)
    setFotoPreview(null)
    setSaved(false)
    setError('')
  }

  const adminVal = selectedAset?.menurutAdministrasi ?? null
  const inventVal = menurutInventarisasi !== '' ? parseFloat(menurutInventarisasi) : null
  const selisih = inventVal != null && adminVal != null ? inventVal - adminVal : null

  const selectCls = 'w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 bg-white appearance-none'
  const inputCls = 'w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2'

  return (
    <div className="max-w-lg mx-auto space-y-4">

      {/* Step 1 & 2: Pilih Barang */}
      {!saved && (
        <div className="bg-white rounded-2xl p-4 shadow-sm space-y-4">
          <div className="text-xs font-semibold text-gray-400 uppercase">Pilih Aset</div>

          {/* Tipe Barang dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipe Barang</label>
            <select
              value={selectedNama}
              onChange={(e) => handleNamaChange(e.target.value)}
              disabled={loadingNama}
              className={selectCls}
            >
              <option value="">{loadingNama ? 'Memuat...' : '— Pilih tipe barang —'}</option>
              {namaList.map(nama => (
                <option key={nama} value={nama}>{nama}</option>
              ))}
            </select>
          </div>

          {/* NUP input */}
          {nupOptions.length > 1 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                NUP <span className="text-gray-400 font-normal">({nupOptions.length} item tersedia)</span>
              </label>
              <select
                value={selectedNup}
                onChange={(e) => handleNupChange(e.target.value)}
                className={selectCls}
              >
                <option value="">— Pilih NUP —</option>
                {nupOptions.map(o => (
                  <option key={o.id} value={o.nup ?? ''}>
                    NUP {o.nup ?? '-'}{o.lokasi ? ` · ${o.lokasi}` : ''} · {KONDISI_LABELS[o.kondisi] ?? o.kondisi}
                  </option>
                ))}
              </select>
            </div>
          )}

          {loadingAset && (
            <div className="text-sm text-gray-400 text-center py-2">Memuat data...</div>
          )}
        </div>
      )}

      {/* Aset detail + form */}
      {selectedAset && !saved && (
        <div className="space-y-4">
          {/* Read-only identity */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="text-xs font-semibold text-gray-400 uppercase mb-2">Identitas Barang</div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Nama</span>
                <span className="font-medium text-right max-w-48 text-gray-800">{selectedAset.namaBarang}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Kode</span>
                <span className="text-gray-700">{selectedAset.kodeBarang ?? '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">NUP</span>
                <span className="text-gray-700">{selectedAset.nup ?? '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Tahun</span>
                <span className="text-gray-700">{selectedAset.tahunPerolehan ?? '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Satuan</span>
                <span className="text-gray-700">{selectedAset.satuan ?? '-'}</span>
              </div>
            </div>
          </div>

          {/* Editable fields */}
          <div className="bg-white rounded-2xl p-4 shadow-sm space-y-4">
            <div className="text-xs font-semibold text-gray-400 uppercase">Update Data</div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Merk / Type</label>
              <input
                type="text"
                value={merkType}
                onChange={(e) => setMerkType(e.target.value)}
                className={inputCls}
                placeholder="Merk atau tipe"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Jumlah Menurut Inventarisasi
              </label>
              <div className="flex gap-3">
                <input
                  type="number"
                  step="0.01"
                  value={menurutInventarisasi}
                  onChange={(e) => setMenurutInventarisasi(e.target.value)}
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2"
                  placeholder="0"
                />
                <div className="flex-shrink-0 flex items-center px-3 rounded-xl border border-gray-100 bg-gray-50 text-sm text-gray-500">
                  Adm: {adminVal ?? '-'}
                </div>
              </div>
              {selisih != null && (
                <div className={`text-sm mt-1 font-medium ${selisih < 0 ? 'text-red-500' : selisih > 0 ? 'text-green-600' : 'text-gray-500'}`}>
                  Selisih: {selisih > 0 ? '+' : ''}{selisih}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Kondisi</label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(KONDISI_LABELS).map(([k, v]) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setKondisi(k)}
                    className="py-3 rounded-xl text-sm font-medium border-2 transition-all"
                    style={{
                      borderColor: kondisi === k ? 'var(--pkp-teal)' : '#e5e7eb',
                      background: kondisi === k ? 'var(--pkp-teal)' : 'white',
                      color: kondisi === k ? 'white' : '#374151',
                    }}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lokasi / Ruangan</label>
              <input
                type="text"
                value={lokasi}
                onChange={(e) => setLokasi(e.target.value)}
                className={inputCls}
                placeholder="Ruang / gedung"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Keterangan</label>
              <textarea
                value={ket}
                onChange={(e) => setKet(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none resize-none"
                rows={2}
                placeholder="Catatan kondisi, dll"
              />
            </div>
          </div>

          {/* Foto */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="text-xs font-semibold text-gray-400 uppercase mb-3">Foto Dokumentasi</div>
            {fotoPreview && (
              <img src={fotoPreview} alt="Foto aset" className="w-full h-48 object-cover rounded-xl mb-3" />
            )}
            <label className="block w-full">
              <div
                className="w-full py-4 rounded-xl border-2 border-dashed text-center text-sm cursor-pointer"
                style={{ borderColor: 'var(--pkp-teal)', color: 'var(--pkp-teal)' }}
              >
                📷 {fotoPreview ? 'Ganti Foto' : 'Ambil / Pilih Foto'}
              </div>
              <input type="file" accept="image/*" capture="environment" onChange={handleFotoChange} className="hidden" />
            </label>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-sm text-red-600">{error}</div>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-4 rounded-2xl text-white text-base font-bold disabled:opacity-50 transition-opacity"
            style={{ background: 'var(--pkp-teal)' }}
          >
            {saving ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      )}

      {/* Saved */}
      {saved && (
        <div className="bg-white rounded-2xl p-6 shadow-sm text-center space-y-4">
          <div className="text-4xl">✅</div>
          <div className="font-bold text-gray-800">Data tersimpan!</div>
          <div className="text-sm text-gray-500">{selectedAset?.namaBarang} · NUP {selectedAset?.nup ?? '-'}</div>
          <button
            onClick={resetForm}
            className="w-full py-4 rounded-2xl text-white text-base font-bold"
            style={{ background: 'var(--pkp-teal)' }}
          >
            Aset Berikutnya
          </button>
        </div>
      )}

      <div className="text-center pb-4">
        <button onClick={() => signOut({ callbackUrl: '/login' })} className="text-sm text-gray-400 underline">
          Keluar
        </button>
      </div>
    </div>
  )
}
