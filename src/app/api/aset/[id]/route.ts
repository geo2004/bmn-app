import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getKlasifikasi } from '@/lib/constants'
import { apiScope } from '@/lib/scope'
import { Kondisi } from '@prisma/client'

/**
 * Fields a client is allowed to set. The route used to spread the raw request
 * body into Prisma, which now would let a caller move a row to another satker
 * simply by including satkerId in the JSON. satkerId is never accepted here.
 */
const EDITABLE = [
  'kodeBarang', 'namaBarang', 'nup', 'tahunPerolehan', 'satuan',
  'kuantitas', 'nilaiPerolehan', 'merkType',
  'menurutAdministrasi', 'menurutInventarisasi',
  'kondisi', 'lokasi', 'alamat', 'koordinat', 'fotoUrl', 'ket', 'no',
] as const

function pickEditable(body: Record<string, unknown>) {
  const data: Record<string, unknown> = {}
  for (const key of EDITABLE) {
    if (key in body) data[key] = body[key]
  }
  if (typeof data.kondisi === 'string') {
    data.klasifikasi = getKlasifikasi(data.kondisi)
    data.kondisi = data.kondisi as Kondisi
  }
  return data
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await apiScope(req.nextUrl.searchParams.get('satker'))
  if (!auth.ok) return auth.res

  const { id } = await params
  const aset = await prisma.asetBmn.findFirst({ where: { id, ...auth.ctx.where } })
  if (!aset) return NextResponse.json({ error: 'Tidak ditemukan' }, { status: 404 })

  return NextResponse.json(aset)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await apiScope(req.nextUrl.searchParams.get('satker'))
  if (!auth.ok) return auth.res

  const { id } = await params
  const body = await req.json()
  const data = pickEditable(body)

  const result = await prisma.asetBmn.updateMany({
    where: { id, ...auth.ctx.where },
    data,
  })

  // updateMany reports count, not existence. Without this the UI would show
  // "Data tersimpan!" for a cross-satker write that changed nothing, and a
  // field officer would walk away believing the update landed.
  if (result.count === 0) {
    return NextResponse.json({ error: 'Aset tidak ditemukan pada satker ini' }, { status: 404 })
  }

  const aset = await prisma.asetBmn.findFirst({ where: { id, ...auth.ctx.where } })
  return NextResponse.json(aset)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await apiScope(req.nextUrl.searchParams.get('satker'))
  if (!auth.ok) return auth.res
  if (!auth.ctx.isAdmin) return NextResponse.json({ error: 'Hanya admin' }, { status: 403 })

  const { id } = await params
  const result = await prisma.asetBmn.deleteMany({ where: { id, ...auth.ctx.where } })
  if (result.count === 0) {
    return NextResponse.json({ error: 'Aset tidak ditemukan pada satker ini' }, { status: 404 })
  }

  return NextResponse.json({ success: true })
}
