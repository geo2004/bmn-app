import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { parseExcelFile } from '@/lib/importExcel'
import { Kondisi } from '@prisma/client'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const role = (session?.user as { role?: string })?.role
  if (!session || role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const mode = (formData.get('mode') as string) ?? 'append' // 'append' | 'replace'
  const previewOnly = formData.get('preview') === 'true'

  if (!file) return NextResponse.json({ error: 'File tidak ditemukan' }, { status: 400 })

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const results = parseExcelFile(buffer)
  const preview = results.map(r => ({
    sheetName: r.sheetName,
    kondisi: r.kondisi,
    count: r.rows.length,
    skipped: r.skipped,
  }))
  const totalRows = results.reduce((s, r) => s + r.rows.length, 0)

  if (previewOnly) {
    return NextResponse.json({ preview, totalRows })
  }

  // Execute import
  if (mode === 'replace') {
    await prisma.asetBmn.deleteMany()
  }

  let inserted = 0
  let duplicates = 0

  for (const result of results) {
    for (const row of result.rows) {
      // Check duplicate
      if (row.kodeBarang && row.nup) {
        const existing = await prisma.asetBmn.findFirst({
          where: { kodeBarang: row.kodeBarang, nup: row.nup },
        })
        if (existing && mode === 'append') {
          duplicates++
          continue
        }
      }

      await prisma.asetBmn.create({
        data: {
          no: row.no,
          kodeBarang: row.kodeBarang,
          namaBarang: row.namaBarang,
          nup: row.nup,
          tahunPerolehan: row.tahunPerolehan,
          merkType: row.merkType,
          satuan: row.satuan,
          kuantitas: row.kuantitas,
          nilaiPerolehan: row.nilaiPerolehan,
          menurutAdministrasi: row.menurutAdministrasi,
          menurutInventarisasi: row.menurutInventarisasi,
          kondisi: row.kondisi as Kondisi,
          klasifikasi: row.klasifikasi,
          lokasi: row.lokasi,
          alamat: row.alamat,
          koordinat: row.koordinat,
          fotoUrl: row.fotoUrl,
          ket: row.ket,
        },
      })
      inserted++
    }
  }

  return NextResponse.json({ success: true, inserted, duplicates, preview })
}
