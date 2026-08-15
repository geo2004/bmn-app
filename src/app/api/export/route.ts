import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateExcelLaporan } from '@/lib/exportExcel'
import { adminApiScope } from '@/lib/scope'
import { Kondisi } from '@prisma/client'

export async function GET(req: NextRequest) {
  const auth = await adminApiScope(req.nextUrl.searchParams.get('satker'))
  if (!auth.ok) return auth.res

  // A BMN report belongs to exactly one satker — refuse to emit a combined
  // file that would look official but reconcile against nothing.
  if (auth.ctx.scope.kind !== 'one') {
    return NextResponse.json(
      { error: 'Pilih satker terlebih dahulu — laporan dibuat per satker' },
      { status: 400 },
    )
  }
  const satkerId = auth.ctx.scope.satkerId

  const satker = await prisma.satker.findUnique({ where: { id: satkerId } })
  if (!satker) return NextResponse.json({ error: 'Satker tidak ditemukan' }, { status: 404 })

  const allAset = await prisma.asetBmn.findMany({
    where: { satkerId },
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

  // The caller used to omit this argument entirely, so the hardcoded
  // 'BP3KP Jawa III' default always won — every satker's report would have
  // carried the Balai's name in cell A2.
  const buffer = await generateExcelLaporan(asetByKondisi, satker.namaLaporan)
  const filename = `Laporan_BMN_${satkerId}_${new Date().toISOString().split('T')[0]}.xlsx`

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
