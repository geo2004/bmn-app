import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import AsetForm from '@/components/aset/AsetForm'

export default async function EditAsetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const aset = await prisma.asetBmn.findUnique({ where: { id } })
  if (!aset) notFound()

  const initial = {
    id: aset.id,
    no: aset.no,
    kodeBarang: aset.kodeBarang,
    namaBarang: aset.namaBarang,
    nup: aset.nup,
    tahunPerolehan: aset.tahunPerolehan,
    satuan: aset.satuan,
    kuantitas: aset.kuantitas ? Number(aset.kuantitas) : null,
    nilaiPerolehan: aset.nilaiPerolehan ? Number(aset.nilaiPerolehan) : null,
    merkType: aset.merkType,
    menurutAdministrasi: aset.menurutAdministrasi ? Number(aset.menurutAdministrasi) : null,
    menurutInventarisasi: aset.menurutInventarisasi ? Number(aset.menurutInventarisasi) : null,
    kondisi: aset.kondisi,
    lokasi: aset.lokasi,
    alamat: aset.alamat,
    koordinat: aset.koordinat,
    fotoUrl: aset.fotoUrl,
    ket: aset.ket,
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold" style={{ color: 'var(--pkp-teal)', fontFamily: 'var(--font-poppins)' }}>
          Edit Aset
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">{aset.namaBarang}</p>
      </div>
      <AsetForm initial={initial} />
    </div>
  )
}
