import { prisma } from '@/lib/prisma'
import { unstable_cache } from 'next/cache'
import AsetTable from '@/components/aset/AsetTable'
import { Kondisi } from '@prisma/client'

// Distinct values change infrequently — cache for 60 seconds to avoid
// re-querying the full table on every filter navigation.
const getDistinctValues = unstable_cache(
  async () => {
    const [tahunRows, namaRows, nupRows] = await Promise.all([
      prisma.asetBmn.findMany({
        select: { tahunPerolehan: true },
        distinct: ['tahunPerolehan'],
        where: { tahunPerolehan: { not: null } },
        orderBy: { tahunPerolehan: 'desc' },
      }),
      prisma.asetBmn.findMany({
        select: { namaBarang: true },
        distinct: ['namaBarang'],
        orderBy: { namaBarang: 'asc' },
      }),
      prisma.asetBmn.findMany({
        select: { nup: true },
        distinct: ['nup'],
        where: { nup: { not: null } },
        orderBy: { nup: 'asc' },
      }),
    ])
    return {
      distinctTahun: tahunRows.map((r) => r.tahunPerolehan as number),
      distinctNama: namaRows.map((r) => r.namaBarang),
      distinctNup: nupRows.map((r) => r.nup as string),
    }
  },
  ['aset-distinct-values'],
  { revalidate: 60 },
)

export default async function AsetPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string; search?: string; kondisi?: string; sort?: string; order?: string
    tahun?: string; lokasi?: string; foto?: string; nama?: string; nup?: string; limit?: string
  }>
}) {
  const params = await searchParams
  const limitRaw = parseInt(params.limit ?? '20')
  const limit = [20, 50, 100].includes(limitRaw) ? limitRaw : 20
  const page = Math.max(1, parseInt(params.page ?? '1'))
  const search = params.search ?? ''
  const kondisiFilter = params.kondisi ?? ''
  const tahunFilter = params.tahun ?? ''
  const lokasiFilter = params.lokasi ?? ''
  const fotoFilter = params.foto ?? ''
  const namaFilter = params.nama ?? ''
  const nupFilter = params.nup ?? ''
  const sort = params.sort ?? 'namaBarang'
  const order = params.order === 'desc' ? 'desc' : 'asc'

  const kondisiArr = kondisiFilter ? kondisiFilter.split(',').filter(Boolean) as Kondisi[] : []
  const tahunArr = tahunFilter ? tahunFilter.split(',').map(Number).filter(Boolean) : []
  const lokasiArr = lokasiFilter ? lokasiFilter.split(',').filter(Boolean) : []
  const namaArr = namaFilter ? namaFilter.split(',').filter(Boolean) : []
  const nupArr = nupFilter ? nupFilter.split(',').filter(Boolean) : []

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
    ...(namaArr.length > 0 ? { namaBarang: { in: namaArr } } : {}),
    ...(nupArr.length > 0 ? { nup: { in: nupArr } } : {}),
  }

  const [rawData, total, { distinctTahun, distinctNama, distinctNup }] = await Promise.all([
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
    getDistinctValues(),
  ])

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
        limit={limit}
        search={search}
        kondisiFilter={kondisiFilter}
        tahunFilter={tahunFilter}
        lokasiFilter={lokasiFilter}
        fotoFilter={fotoFilter}
        namaFilter={namaFilter}
        nupFilter={nupFilter}
        sort={sort}
        order={order}
        distinctTahun={distinctTahun}
        distinctNama={distinctNama}
        distinctNup={distinctNup}
      />
    </div>
  )
}
