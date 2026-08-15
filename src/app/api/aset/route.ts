import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getKlasifikasi } from '@/lib/constants'
import { apiScope, adminApiScope, resolveWriteSatker } from '@/lib/scope'
import { Kondisi } from '@prisma/client'

/** Fields a client may set. satkerId is deliberately absent — it is forced from the session. */
const CREATABLE = [
  'kodeBarang', 'namaBarang', 'nup', 'tahunPerolehan', 'satuan',
  'kuantitas', 'nilaiPerolehan', 'merkType',
  'menurutAdministrasi', 'menurutInventarisasi',
  'kondisi', 'lokasi', 'alamat', 'koordinat', 'fotoUrl', 'ket', 'no',
] as const

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const auth = await apiScope(searchParams.get('satker'))
  if (!auth.ok) return auth.res
  // Previously session-only, so any editor could page through the whole table.
  if (!auth.ctx.isAdmin) return NextResponse.json({ error: 'Hanya admin' }, { status: 403 })

  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const limit = 20
  const search = searchParams.get('search') ?? ''
  const kondisi = searchParams.get('kondisi') ?? ''

  const where = {
    ...auth.ctx.where,
    ...(search ? {
      OR: [
        { namaBarang: { contains: search, mode: 'insensitive' as const } },
        { kodeBarang: { contains: search, mode: 'insensitive' as const } },
        { nup: { contains: search, mode: 'insensitive' as const } },
      ],
    } : {}),
    ...(kondisi ? { kondisi: kondisi as Kondisi } : {}),
  }

  const [data, total] = await Promise.all([
    prisma.asetBmn.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: [{ kondisi: 'asc' }, { namaBarang: 'asc' }],
    }),
    prisma.asetBmn.count({ where }),
  ])

  return NextResponse.json({ data, total, page, totalPages: Math.ceil(total / limit) })
}

export async function POST(req: NextRequest) {
  const auth = await adminApiScope(req.nextUrl.searchParams.get('satker'))
  if (!auth.ok) return auth.res

  const body = await req.json()
  const { namaBarang, kondisi } = body

  if (!namaBarang || !kondisi) {
    return NextResponse.json({ error: 'namaBarang dan kondisi wajib diisi' }, { status: 400 })
  }

  // An admin viewing "Semua Satker" has no implicit target, so the row must
  // name the satker it belongs to rather than landing somewhere arbitrary.
  const satkerId = resolveWriteSatker(auth.ctx, body.satkerId)
  if (!satkerId) {
    return NextResponse.json({ error: 'Pilih satker terlebih dahulu' }, { status: 400 })
  }

  const data: Record<string, unknown> = {}
  for (const key of CREATABLE) {
    if (key in body) data[key] = body[key]
  }

  const aset = await prisma.asetBmn.create({
    data: {
      ...data,
      namaBarang,
      kondisi: kondisi as Kondisi,
      klasifikasi: getKlasifikasi(kondisi),
      satkerId,
    } as never,
  })

  return NextResponse.json(aset, { status: 201 })
}
