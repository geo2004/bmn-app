import { prisma } from '@/lib/prisma'
import LokasiManager from '@/components/lokasi/LokasiManager'
import { adminPageScope } from '@/lib/scope'

export default async function LokasiPage({
  searchParams,
}: {
  searchParams: Promise<{ satker?: string }>
}) {
  const ctx = await adminPageScope((await searchParams).satker)

  const [rows, satkerList] = await Promise.all([
    prisma.lokasi.findMany({
      where: ctx.where,
      orderBy: [{ satkerId: 'asc' }, { urutan: 'asc' }, { nama: 'asc' }],
      select: { id: true, nama: true, satkerId: true },
    }),
    prisma.satker.findMany({ orderBy: { urutan: 'asc' }, select: { id: true, nama: true } }),
  ])

  // How many assets sit in each room, so the UI can warn before a rename and
  // explain why a delete is refused.
  const usage = await prisma.asetBmn.groupBy({
    by: ['satkerId', 'lokasi'],
    where: ctx.where,
    _count: { _all: true },
  })
  const usageMap: Record<string, number> = {}
  for (const u of usage) {
    if (u.lokasi) usageMap[`${u.satkerId}::${u.lokasi}`] = u._count._all
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold" style={{ color: 'var(--pkp-teal)', fontFamily: 'var(--font-poppins)' }}>
          Daftar Lokasi
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Ruangan yang dapat dipilih petugas lapangan, per satker
        </p>
      </div>
      <LokasiManager
        rows={rows.map((r) => ({ ...r, jumlahAset: usageMap[`${r.satkerId}::${r.nama}`] ?? 0 }))}
        satkerList={satkerList}
        activeSatker={ctx.scope.kind === 'one' ? ctx.scope.satkerId : null}
      />
    </div>
  )
}
