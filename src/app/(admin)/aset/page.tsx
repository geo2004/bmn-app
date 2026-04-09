import { prisma } from '@/lib/prisma'
import AsetTable from '@/components/aset/AsetTable'
import { Kondisi } from '@prisma/client'

export default async function AsetPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; kondisi?: string; sort?: string; order?: string; tahun?: string; lokasi?: string; foto?: string }>
}) {
  const params = await searchParams
  const page = Math.max(1, parseInt(params.page ?? '1'))
  const limit = 20
  const search = params.search ?? ''
  const kondisiFilter = params.kondisi ?? ''
  const tahunFilter = params.tahun ?? ''
  const lokasiFilter = params.lokasi ?? ''
  const fotoFilter = params.foto ?? ''
  const sort = params.sort ?? 'namaBarang'
  const order = params.order === 'desc' ? 'desc' : 'asc'

  // Parse multi-select filters from comma-separated strings
  const kondisiArr = kondisiFilter ? kondisiFilter.split(',').filter(Boolean) as Kondisi[] : []
  const tahunArr = tahunFilter ? tahunFilter.split(',').map(Number).filter(Boolean) : []
  const lokasiArr = lokasiFilter ? lokasiFilter.split(',').filter(Boolean) : []

  const where = {
    ...(search ? {
      OR: [
        { namaBarang: { contains: search, mode: 'insensitive' as const } },
        { kodeBarang: { contains: search, mode: 'insensitive' as const } },
        { nup: { contains: search, mode: 'insensitive' as const } },
      ],
    } : {}),
    ...(kondisiArr.length > 0 ? { kondisi: { in: kondisiArr } } : {}),
    ...(tahunArr.length > 0 ? { tahunPerolehan: { in: tahunArr } } : {}),
    ...(lokasiArr.length > 0 ? { lokasi: { in: lokasiArr } } : {}),
    ...(fotoFilter === 'ada' ? { fotoUrl: { not: null } } : {}),
    ...(fotoFilter === 'tidak' ? { fotoUrl: null } : {}),
  }

  const [rawData, total, distinctTahunRows] = await Promise.all([
    prisma.asetBmn.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: [{ [sort]: order }],
      select: {
        id: true,
        namaBarang: true,
        kodeBarang: true,
        nup: true,
        tahunPerolehan: true,
        kondisi: true,
        lokasi: true,
        fotoUrl: true,
      },
    }),
    prisma.asetBmn.count({ where }),
    prisma.asetBmn.findMany({
      select: { tahunPerolehan: true },
      distinct: ['tahunPerolehan'],
      where: { tahunPerolehan: { not: null } },
      orderBy: { tahunPerolehan: 'desc' },
    }),
  ])

  const distinctTahun = distinctTahunRows
    .map((r) => r.tahunPerolehan as number)
    .filter(Boolean)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--pkp-teal)', fontFamily: 'var(--font-poppins)' }}>
            Daftar Aset BMN
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Kelola semua data aset inventarisasi</p>
        </div>
        <a
          href="/api/export"
          className="px-4 py-2 rounded-lg text-sm font-medium border"
          style={{ color: 'var(--pkp-teal)', borderColor: 'var(--pkp-teal)' }}
        >
          Export Excel
        </a>
      </div>
      <AsetTable
        data={rawData}
        total={total}
        page={page}
        totalPages={Math.ceil(total / limit)}
        search={search}
        kondisiFilter={kondisiFilter}
        tahunFilter={tahunFilter}
        lokasiFilter={lokasiFilter}
        fotoFilter={fotoFilter}
        sort={sort}
        order={order}
        distinctTahun={distinctTahun}
      />
    </div>
  )
}
