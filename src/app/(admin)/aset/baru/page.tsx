import AsetForm from '@/components/aset/AsetForm'

export default function TambahAsetPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold" style={{ color: 'var(--pkp-teal)', fontFamily: 'var(--font-poppins)' }}>
          Tambah Aset Baru
        </h1>
      </div>
      <AsetForm />
    </div>
  )
}
