import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getKlasifikasi } from '@/lib/constants'
import { Kondisi } from '@prisma/client'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = req.nextUrl
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const limit = 20
  const search = searchParams.get('search') ?? ''
  const kondisi = searchParams.get('kondisi') ?? ''

  const where = {
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
  const session = await getServerSession(authOptions)
  const role = (session?.user as { role?: string })?.role
  if (!session || role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { namaBarang, kondisi } = body

  if (!namaBarang || !kondisi) {
    return NextResponse.json({ error: 'namaBarang dan kondisi wajib diisi' }, { status: 400 })
  }

  const aset = await prisma.asetBmn.create({
    data: {
      ...body,
      kondisi: kondisi as Kondisi,
      klasifikasi: getKlasifikasi(kondisi),
    },
  })

  return NextResponse.json(aset, { status: 201 })
}
