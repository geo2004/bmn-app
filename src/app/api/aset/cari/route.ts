import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiScope } from '@/lib/scope'

/**
 * Lookup endpoint powering the editor UI.
 *
 * Every branch is satker-scoped. The `?nama=` branch is the important one: it
 * returns row IDs that the editor page feeds straight into PUT /api/aset/[id].
 * Unscoped, an editor picking a generic item name ("Kursi Kerja" — 77 names are
 * shared across satker) would be handed another satker's IDs and overwrite its
 * data through completely ordinary UI use.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const auth = await apiScope(searchParams.get('satker'))
  if (!auth.ok) return auth.res
  const { where } = auth.ctx

  const id = searchParams.get('id')
  const tipe = searchParams.get('tipe')
  const nama = searchParams.get('nama')
  const nup = searchParams.get('nup')
  const q = searchParams.get('q') ?? ''

  // Single aset by id — findFirst, not findUnique, so satkerId can be applied.
  if (id) {
    const aset = await prisma.asetBmn.findFirst({ where: { id, ...where } })
    if (!aset) return NextResponse.json({ error: 'Tidak ditemukan' }, { status: 404 })
    return NextResponse.json(aset)
  }

  // Distinct namaBarang for the autocomplete.
  if (tipe === 'true') {
    const rows = await prisma.asetBmn.findMany({
      where,
      select: { namaBarang: true },
      distinct: ['namaBarang'],
      orderBy: { namaBarang: 'asc' },
    })
    return NextResponse.json(rows.map((r) => r.namaBarang))
  }

  // Exact match on namaBarang + NUP.
  if (nama && nup) {
    const aset = await prisma.asetBmn.findFirst({ where: { namaBarang: nama, nup, ...where } })
    return NextResponse.json(aset ?? null)
  }

  // NUPs available for a given namaBarang.
  if (nama) {
    const rows = await prisma.asetBmn.findMany({
      where: { namaBarang: nama, ...where },
      select: { id: true, nup: true, lokasi: true, kondisi: true },
      orderBy: { nup: 'asc' },
    })
    return NextResponse.json(rows)
  }

  // Text search fallback.
  if (!q || q.length < 2) return NextResponse.json([])

  const results = await prisma.asetBmn.findMany({
    where: { namaBarang: { contains: q, mode: 'insensitive' }, ...where },
    select: { id: true, namaBarang: true, nup: true, kodeBarang: true, kondisi: true, lokasi: true },
    orderBy: { namaBarang: 'asc' },
    take: 20,
  })

  return NextResponse.json(results)
}
