import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getKlasifikasi } from '@/lib/constants'
import { Kondisi } from '@prisma/client'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const aset = await prisma.asetBmn.findUnique({ where: { id } })
  if (!aset) return NextResponse.json({ error: 'Tidak ditemukan' }, { status: 404 })

  return NextResponse.json(aset)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  if (body.kondisi) {
    body.klasifikasi = getKlasifikasi(body.kondisi)
    body.kondisi = body.kondisi as Kondisi
  }

  const aset = await prisma.asetBmn.update({
    where: { id },
    data: body,
  })

  return NextResponse.json(aset)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  const role = (session?.user as { role?: string })?.role
  if (!session || role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  await prisma.asetBmn.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
