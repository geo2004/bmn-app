import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiScope, adminApiScope, resolveWriteSatker } from '@/lib/scope'

/** Room list for the caller's satker. Powers the editor's lokasi dropdown. */
export async function GET(req: NextRequest) {
  const auth = await apiScope(req.nextUrl.searchParams.get('satker'))
  if (!auth.ok) return auth.res

  const rows = await prisma.lokasi.findMany({
    where: auth.ctx.where,
    select: { id: true, nama: true, satkerId: true },
    orderBy: [{ urutan: 'asc' }, { nama: 'asc' }],
  })

  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const auth = await adminApiScope(req.nextUrl.searchParams.get('satker'))
  if (!auth.ok) return auth.res

  const body = await req.json()
  const nama = typeof body.nama === 'string' ? body.nama.trim() : ''
  if (!nama) return NextResponse.json({ error: 'Nama lokasi wajib diisi' }, { status: 400 })

  const satkerId = resolveWriteSatker(auth.ctx, body.satkerId)
  if (!satkerId) return NextResponse.json({ error: 'Pilih satker terlebih dahulu' }, { status: 400 })

  const existing = await prisma.lokasi.findFirst({ where: { satkerId, nama } })
  if (existing) return NextResponse.json({ error: 'Lokasi sudah ada' }, { status: 409 })

  const max = await prisma.lokasi.aggregate({ where: { satkerId }, _max: { urutan: true } })

  const lokasi = await prisma.lokasi.create({
    data: { satkerId, nama, urutan: (max._max.urutan ?? 0) + 1 },
  })

  return NextResponse.json(lokasi, { status: 201 })
}
