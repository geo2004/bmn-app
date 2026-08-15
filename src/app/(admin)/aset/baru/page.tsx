import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import AsetForm from '@/components/aset/AsetForm'
import { adminPageScope } from '@/lib/scope'

export default async function AsetBaruPage({
  searchParams,
}: {
  searchParams: Promise<{ satker?: string }>
}) {
  const ctx = await adminPageScope((await searchParams).satker)

  // A new row has to belong somewhere. Rather than defaulting it to an
  // arbitrary satker, an admin viewing "Semua Satker" is asked to pick one.
  if (ctx.scope.kind !== 'one') {
    const satkerList = await prisma.satker.findMany({
      orderBy: { urutan: 'asc' },
      select: { id: true, nama: true },
    })
    return (
      <div className="max-w-lg">
        <h1 className="text-xl font-bold mb-2" style={{ color: 'var(--pkp-teal)', fontFamily: 'var(--font-poppins)' }}>
          Tambah Aset Baru
        </h1>
        <p className="text-sm text-gray-500 mb-5">
          Pilih satker terlebih dahulu — aset baru akan dicatat pada satker tersebut.
        </p>
        <div className="space-y-2">
          {satkerList.map((s) => (
            <Link
              key={s.id}
              href={`/aset/baru?satker=${s.id}`}
              className="block bg-white rounded-xl px-4 py-3 shadow-sm text-sm font-medium hover:bg-gray-50"
              style={{ color: 'var(--pkp-teal)' }}
            >
              {s.nama}
            </Link>
          ))}
        </div>
      </div>
    )
  }

  const [satker, lokasiRows] = await Promise.all([
    prisma.satker.findUnique({ where: { id: ctx.scope.satkerId }, select: { nama: true } }),
    prisma.lokasi.findMany({
      where: { satkerId: ctx.scope.satkerId },
      select: { nama: true },
      orderBy: [{ urutan: 'asc' }, { nama: 'asc' }],
    }),
  ])

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold" style={{ color: 'var(--pkp-teal)', fontFamily: 'var(--font-poppins)' }}>
          Tambah Aset Baru
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">{satker?.nama}</p>
      </div>
      <AsetForm satkerId={ctx.scope.satkerId} lokasiOptions={lokasiRows.map((r) => r.nama)} />
    </div>
  )
}
