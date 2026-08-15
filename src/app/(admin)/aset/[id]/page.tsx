import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import AsetForm from '@/components/aset/AsetForm'
import { adminPageScope } from '@/lib/scope'

export default async function EditAsetPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ satker?: string }>
}) {
  const { id } = await params
  const ctx = await adminPageScope((await searchParams).satker)

  // findFirst rather than findUnique so the satker filter can apply — otherwise
  // knowing an ID is enough to open any satker's asset.
  const aset = await prisma.asetBmn.findFirst({ where: { id, ...ctx.where } })
  if (!aset) notFound()

  const lokasiRows = await prisma.lokasi.findMany({
    where: { satkerId: aset.satkerId },
    select: { nama: true },
    orderBy: [{ urutan: 'asc' }, { nama: 'asc' }],
  })

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
      <AsetForm
        initial={initial}
        satkerId={aset.satkerId}
        lokasiOptions={lokasiRows.map((r) => r.nama)}
      />
    </div>
  )
}
