import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = req.nextUrl
  const id = searchParams.get('id')
  const tipe = searchParams.get('tipe')
  const nama = searchParams.get('nama')
  const nup = searchParams.get('nup')
  const q = searchParams.get('q') ?? ''

  // Return single aset by id
  if (id) {
    const aset = await prisma.asetBmn.findUnique({ where: { id } })
    return NextResponse.json(aset)
  }

  // Return distinct namaBarang list for dropdown
  if (tipe === 'true') {
    const rows = await prisma.asetBmn.findMany({
      select: { namaBarang: true },
      distinct: ['namaBarang'],
      orderBy: { namaBarang: 'asc' },
    })
    return NextResponse.json(rows.map(r => r.namaBarang))
  }

  // Find by namaBarang + NUP (exact)
  if (nama && nup) {
    const aset = await prisma.asetBmn.findFirst({
      where: { namaBarang: nama, nup },
    })
    return NextResponse.json(aset ?? null)
  }

  // Return NUPs for a given namaBarang
  if (nama) {
    const rows = await prisma.asetBmn.findMany({
      where: { namaBarang: nama },
      select: { id: true, nup: true, lokasi: true, kondisi: true },
      orderBy: { nup: 'asc' },
    })
    return NextResponse.json(rows)
  }

  // Text search fallback
  if (!q || q.length < 2) return NextResponse.json([])

  const results = await prisma.asetBmn.findMany({
    where: { namaBarang: { contains: q, mode: 'insensitive' } },
    select: { id: true, namaBarang: true, nup: true, kodeBarang: true, kondisi: true, lokasi: true },
    orderBy: { namaBarang: 'asc' },
    take: 20,
  })

  return NextResponse.json(results)
}
