import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateExcelLaporan } from '@/lib/exportExcel'
import { Kondisi } from '@prisma/client'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const role = (session?.user as { role?: string })?.role
  if (!session || role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const allAset = await prisma.asetBmn.findMany({
    orderBy: [{ kondisi: 'asc' }, { no: 'asc' }],
  })

  const kondisiList: Kondisi[] = ['BAIK', 'RUSAK_RINGAN', 'RUSAK_BERAT', 'BERLEBIH', 'TIDAK_DITEMUKAN', 'SENGKETA']
  const asetByKondisi: Record<string, {
    no: number | null
    kodeBarang: string | null
    namaBarang: string
    nup: string | null
    tahunPerolehan: number | null
    merkType: string | null
    satuan: string | null
    kuantitas: number | null
    nilaiPerolehan: number | null
    menurutAdministrasi: number | null
    menurutInventarisasi: number | null
    kondisi: string
    klasifikasi: string | null
    lokasi: string | null
    alamat: string | null
    koordinat: string | null
    fotoUrl: string | null
    ket: string | null
  }[]> = {}

  for (const k of kondisiList) {
    asetByKondisi[k] = allAset.filter(a => a.kondisi === k).map((a, idx) => ({
      no: a.no ?? idx + 1,
      kodeBarang: a.kodeBarang,
      namaBarang: a.namaBarang,
      nup: a.nup,
      tahunPerolehan: a.tahunPerolehan,
      merkType: a.merkType,
      satuan: a.satuan,
      kuantitas: a.kuantitas ? Number(a.kuantitas) : null,
      nilaiPerolehan: a.nilaiPerolehan ? Number(a.nilaiPerolehan) : null,
      menurutAdministrasi: a.menurutAdministrasi ? Number(a.menurutAdministrasi) : null,
      menurutInventarisasi: a.menurutInventarisasi ? Number(a.menurutInventarisasi) : null,
      kondisi: a.kondisi,
      klasifikasi: a.klasifikasi,
      lokasi: a.lokasi,
      alamat: a.alamat,
      koordinat: a.koordinat,
      fotoUrl: a.fotoUrl,
      ket: a.ket,
    }))
  }

  const buffer = await generateExcelLaporan(asetByKondisi)
  const filename = `Laporan_BMN_${new Date().toISOString().split('T')[0]}.xlsx`

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
