import { prisma } from '@/lib/prisma'
import AsetTable from '@/components/aset/AsetTable'
import Link from 'next/link'
import { Kondisi } from '@prisma/client'

export default async function AsetPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; kondisi?: string }>
}) {
  const params = await searchParams
  const page = Math.max(1, parseInt(params.page ?? '1'))
  const limit = 20
  const search = params.search ?? ''
  const kondisiFilter = params.kondisi ?? ''

  const where = {
    ...(search ? {
      OR: [
        { namaBarang: { contains: search, mode: 'insensitive' as const } },
        { kodeBarang: { contains: search, mode: 'insensitive' as const } },
        { nup: { contains: search, mode: 'insensitive' as const } },
      ],
    } : {}),
    ...(kondisiFilter ? { kondisi: kondisiFilter as Kondisi } : {}),
  }

  const [rawData, total] = await Promise.all([
    prisma.asetBmn.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: [{ kondisi: 'asc' }, { namaBarang: 'asc' }],
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
        search={search}
        kondisiFilter={kondisiFilter}
      />
    </div>
  )
}
