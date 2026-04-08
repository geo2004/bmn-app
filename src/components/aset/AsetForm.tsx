'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { KONDISI_LABELS, getKlasifikasi, LOKASI_OPTIONS } from '@/lib/constants'

interface AsetFormData {
  id?: string
  no?: number | null
  kodeBarang?: string | null
  namaBarang: string
  nup?: string | null
  tahunPerolehan?: number | null
  satuan?: string | null
  kuantitas?: number | null
  nilaiPerolehan?: number | null
  merkType?: string | null
  menurutAdministrasi?: number | null
  menurutInventarisasi?: number | null
  kondisi: string
  lokasi?: string | null
  alamat?: string | null
  koordinat?: string | null
  fotoUrl?: string | null
  ket?: string | null
}

export default function AsetForm({ initial }: { initial?: AsetFormData }) {
  const router = useRouter()
  const isEdit = !!initial?.id

  const [form, setForm] = useState<AsetFormData>({
    namaBarang: '',
    kondisi: 'BAIK',
    ...initial,
  })
  const [fotoFile, setFotoFile] = useState<File | null>(null)
  const [fotoPreview, setFotoPreview] = useState<string | null>(initial?.fotoUrl ?? null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const selisih =
    form.menurutInventarisasi != null && form.menurutAdministrasi != null
      ? form.menurutInventarisasi - form.menurutAdministrasi
      : null

  function handleChange(field: keyof AsetFormData, value: string | number | null) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleFotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFotoFile(file)
    setFotoPreview(URL.createObjectURL(file))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.namaBarang || !form.kondisi) {
      setError('Nama Barang dan Kondisi wajib diisi')
      return
    }
    setSaving(true)
    setError('')

    try {
      let fotoUrl = form.fotoUrl ?? null

      // Upload foto if new file selected
      if (fotoFile) {
        const fd = new FormData()
        fd.append('file', fotoFile)
        if (initial?.id) fd.append('asetId', initial.id)
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: fd })
        if (!uploadRes.ok) throw new Error('Gagal upload foto')
        const uploadData = await uploadRes.json()
        fotoUrl = uploadData.url
      }

      const payload = {
        ...form,
        klasifikasi: getKlasifikasi(form.kondisi),
        fotoUrl,
      }

      const url = isEdit ? `/api/aset/${initial!.id}` : '/api/aset'
      const method = isEdit ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Gagal menyimpan')
      }

      router.push('/aset')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!initial?.id) return
    if (!confirm('Hapus aset ini? Tindakan tidak bisa dibatalkan.')) return

    const res = await fetch(`/api/aset/${initial.id}`, { method: 'DELETE' })
    if (res.ok) {
      router.push('/aset')
      router.refresh()
    }
  }

  const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1'
  const readOnlyCls = 'w-full border border-gray-100 bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-500'
  const labelCls = 'block text-xs font-medium text-gray-600 mb-1'

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-3xl">
      {/* IDENTITAS BARANG */}
      <section className="bg-white rounded-xl p-5 shadow-sm">
        <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--pkp-teal)' }}>
          Identitas Barang
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Kode Barang</label>
            <input
              type="text"
              value={form.kodeBarang ?? ''}
              onChange={(e) => handleChange('kodeBarang', e.target.value || null)}
              className={inputCls}
              placeholder="Kode barang"
            />
          </div>
          <div>
            <label className={labelCls}>NUP</label>
            <input
              type="text"
              value={form.nup ?? ''}
              onChange={(e) => handleChange('nup', e.target.value || null)}
              className={inputCls}
              placeholder="Nomor Urut Perolehan"
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Nama Barang <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={form.namaBarang}
              onChange={(e) => handleChange('namaBarang', e.target.value)}
              className={inputCls}
              placeholder="Nama barang"
              required
            />
          </div>
          <div>
            <label className={labelCls}>Tahun Perolehan</label>
            <input
              type="number"
              value={form.tahunPerolehan ?? ''}
              onChange={(e) => handleChange('tahunPerolehan', e.target.value ? parseInt(e.target.value) : null)}
              className={inputCls}
              placeholder="2020"
              min={1970}
              max={2099}
            />
          </div>
          <div>
            <label className={labelCls}>Satuan</label>
            <input
              type="text"
              value={form.satuan ?? ''}
              onChange={(e) => handleChange('satuan', e.target.value || null)}
              className={inputCls}
              placeholder="Unit / M² / Buah"
            />
          </div>
          <div>
            <label className={labelCls}>Merk / Type <span className="text-blue-500 text-xs">(editable)</span></label>
            <input
              type="text"
              value={form.merkType ?? ''}
              onChange={(e) => handleChange('merkType', e.target.value || null)}
              className={inputCls}
              placeholder="Merk atau tipe"
            />
          </div>
          <div>
            <label className={labelCls}>Kuantitas</label>
            <input
              type="number"
              step="0.01"
              value={form.kuantitas ?? ''}
              onChange={(e) => handleChange('kuantitas', e.target.value ? parseFloat(e.target.value) : null)}
              className={inputCls}
              placeholder="0"
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Nilai Perolehan (Rp)</label>
            <input
              type="number"
              step="1"
              value={form.nilaiPerolehan ?? ''}
              onChange={(e) => handleChange('nilaiPerolehan', e.target.value ? parseFloat(e.target.value) : null)}
              className={inputCls}
              placeholder="0"
            />
          </div>
        </div>
      </section>

      {/* JUMLAH BARANG */}
      <section className="bg-white rounded-xl p-5 shadow-sm">
        <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--pkp-teal)' }}>
          Jumlah Barang
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className={labelCls}>Menurut Administrasi</label>
            <input
              type="number"
              step="0.01"
              value={form.menurutAdministrasi ?? ''}
              onChange={(e) => handleChange('menurutAdministrasi', e.target.value ? parseFloat(e.target.value) : null)}
              className={inputCls}
              placeholder="0"
            />
          </div>
          <div>
            <label className={labelCls}>Menurut Inventarisasi <span className="text-blue-500 text-xs">(editable)</span></label>
            <input
              type="number"
              step="0.01"
              value={form.menurutInventarisasi ?? ''}
              onChange={(e) => handleChange('menurutInventarisasi', e.target.value ? parseFloat(e.target.value) : null)}
              className={inputCls}
              placeholder="0"
            />
          </div>
          <div>
            <label className={labelCls}>Selisih (auto-hitung)</label>
            <div className={`${readOnlyCls} ${selisih != null && selisih < 0 ? 'text-red-500' : selisih != null && selisih > 0 ? 'text-green-600' : ''}`}>
              {selisih != null ? (selisih > 0 ? `+${selisih}` : selisih) : '-'}
            </div>
          </div>
        </div>
      </section>

      {/* KONDISI & LOKASI */}
      <section className="bg-white rounded-xl p-5 shadow-sm">
        <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--pkp-teal)' }}>
          Kondisi & Lokasi
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Kondisi <span className="text-red-500">*</span></label>
            <select
              value={form.kondisi}
              onChange={(e) => handleChange('kondisi', e.target.value)}
              className={inputCls}
              required
            >
              {Object.entries(KONDISI_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Klasifikasi (auto)</label>
            <div className={readOnlyCls}>{getKlasifikasi(form.kondisi)}</div>
          </div>
          <div>
            <label className={labelCls}>Lokasi / Ruangan</label>
            <select
              value={form.lokasi ?? ''}
              onChange={(e) => handleChange('lokasi', e.target.value || null)}
              className={inputCls}
            >
              <option value="">— Pilih lokasi —</option>
              {LOKASI_OPTIONS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Koordinat GPS</label>
            <input
              type="text"
              value={form.koordinat ?? ''}
              onChange={(e) => handleChange('koordinat', e.target.value || null)}
              className={inputCls}
              placeholder="-7.123, 110.456"
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Alamat Lengkap</label>
            <textarea
              value={form.alamat ?? ''}
              onChange={(e) => handleChange('alamat', e.target.value || null)}
              className={`${inputCls} resize-none`}
              rows={2}
              placeholder="Alamat lengkap lokasi aset"
            />
          </div>
        </div>
      </section>

      {/* DOKUMENTASI */}
      <section className="bg-white rounded-xl p-5 shadow-sm">
        <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--pkp-teal)' }}>
          Dokumentasi
        </h3>
        <div className="space-y-4">
          <div>
            <label className={labelCls}>Foto Aset</label>
            {fotoPreview && (
              <img
                src={fotoPreview}
                alt="Foto aset"
                className="w-40 h-28 object-cover rounded-lg mb-2 border border-gray-200"
              />
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleFotoChange}
              className="block text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
            />
          </div>
          <div>
            <label className={labelCls}>Keterangan</label>
            <textarea
              value={form.ket ?? ''}
              onChange={(e) => handleChange('ket', e.target.value || null)}
              className={`${inputCls} resize-none`}
              rows={3}
              placeholder="Catatan tambahan"
            />
          </div>
        </div>
      </section>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-3">{error}</div>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 rounded-lg text-white text-sm font-medium disabled:opacity-60 transition-opacity"
          style={{ background: 'var(--pkp-teal)' }}
        >
          {saving ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Tambah Aset'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2.5 rounded-lg text-sm text-gray-600 border border-gray-200 hover:bg-gray-50"
        >
          Batal
        </button>
        {isEdit && (
          <button
            type="button"
            onClick={handleDelete}
            className="ml-auto px-4 py-2.5 rounded-lg text-sm text-red-600 border border-red-200 hover:bg-red-50"
          >
            Hapus Aset
          </button>
        )}
      </div>
    </form>
  )
}
