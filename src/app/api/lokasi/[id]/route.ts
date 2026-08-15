import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { adminApiScope } from '@/lib/scope'

/**
 * Rename a room.
 *
 * `AsetBmn.lokasi` is free text, so a rename that does not cascade would leave
 * existing assets holding a value that is no longer in the dropdown — and a
 * <select> whose value is absent from its options falls back to the first one,
 * silently rewriting the asset's location the next time anyone saves it.
 * Rename and cascade therefore happen in one transaction.
 */
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await adminApiScope(req.nextUrl.searchParams.get('satker'))
  if (!auth.ok) return auth.res

  const { id } = await params
  const body = await req.json()
  const nama = typeof body.nama === 'string' ? body.nama.trim() : ''
  if (!nama) return NextResponse.json({ error: 'Nama lokasi wajib diisi' }, { status: 400 })

  const lokasi = await prisma.lokasi.findFirst({ where: { id, ...auth.ctx.where } })
  if (!lokasi) return NextResponse.json({ error: 'Tidak ditemukan' }, { status: 404 })
  if (lokasi.nama === nama) return NextResponse.json(lokasi)

  const clash = await prisma.lokasi.findFirst({
    where: { satkerId: lokasi.satkerId, nama, id: { not: id } },
  })
  if (clash) return NextResponse.json({ error: 'Nama lokasi sudah dipakai' }, { status: 409 })

  const [updated, moved] = await prisma.$transaction([
    prisma.lokasi.update({ where: { id }, data: { nama } }),
    prisma.asetBmn.updateMany({
      where: { satkerId: lokasi.satkerId, lokasi: lokasi.nama },
      data: { lokasi: nama },
    }),
  ])

  return NextResponse.json({ ...updated, asetDiperbarui: moved.count })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await adminApiScope(req.nextUrl.searchParams.get('satker'))
  if (!auth.ok) return auth.res

  const { id } = await params
  const lokasi = await prisma.lokasi.findFirst({ where: { id, ...auth.ctx.where } })
  if (!lokasi) return NextResponse.json({ error: 'Tidak ditemukan' }, { status: 404 })

  // Blocked rather than cascaded: deleting the room would strand every asset
  // that still points at it, with no obvious value to move them to.
  const inUse = await prisma.asetBmn.count({
    where: { satkerId: lokasi.satkerId, lokasi: lokasi.nama },
  })
  if (inUse > 0) {
    return NextResponse.json(
      { error: `${inUse} aset masih memakai lokasi ini. Pindahkan atau ganti nama dulu.` },
      { status: 409 },
    )
  }

  await prisma.lokasi.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
