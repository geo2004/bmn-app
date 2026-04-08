import ExcelJS from 'exceljs'
import { KONDISI_LABELS } from './constants'

interface AsetData {
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
}

const HEADERS = [
  'No.',
  'Kode Barang',
  'Nama Barang',
  'NUP',
  'Tahun Perolehan',
  'Merk/Type',
  'Satuan',
  'Kuantitas',
  'Nilai Perolehan',
  'Lokasi',
  'Ket',
  'Menurut Administrasi',
  'Menurut Inventarisasi',
  'Selisih',
  'Kondisi',
  'Klasifikasi',
  'Alamat',
  'Koordinat',
  'Link Foto',
]

function addDataSheet(
  workbook: ExcelJS.Workbook,
  sheetName: string,
  data: AsetData[],
  unitName: string
) {
  const sheet = workbook.addWorksheet(sheetName)

  // Title rows
  sheet.mergeCells('A1:S1')
  sheet.getCell('A1').value = 'LAPORAN HASIL INVENTARISASI BARANG MILIK NEGARA'
  sheet.getCell('A1').font = { bold: true, size: 13 }
  sheet.getCell('A1').alignment = { horizontal: 'center' }

  sheet.mergeCells('A2:S2')
  sheet.getCell('A2').value = unitName
  sheet.getCell('A2').alignment = { horizontal: 'center' }

  sheet.mergeCells('A3:S3')
  sheet.getCell('A3').value = `Kondisi: ${sheetName}`
  sheet.getCell('A3').alignment = { horizontal: 'center' }

  // Header row
  const headerRow = sheet.getRow(5)
  HEADERS.forEach((h, i) => {
    const cell = headerRow.getCell(i + 1)
    cell.value = h
    cell.font = { bold: true }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF113F51' } }
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    cell.alignment = { horizontal: 'center', wrapText: true }
    cell.border = {
      top: { style: 'thin' },
      bottom: { style: 'thin' },
      left: { style: 'thin' },
      right: { style: 'thin' },
    }
  })
  headerRow.height = 30

  // Data rows
  data.forEach((aset, idx) => {
    const selisih =
      aset.menurutInventarisasi != null && aset.menurutAdministrasi != null
        ? aset.menurutInventarisasi - aset.menurutAdministrasi
        : null

    const row = sheet.getRow(idx + 6)
    const values = [
      aset.no ?? idx + 1,
      aset.kodeBarang ?? '',
      aset.namaBarang,
      aset.nup ?? '',
      aset.tahunPerolehan ?? '',
      aset.merkType ?? '',
      aset.satuan ?? '',
      aset.kuantitas ?? '',
      aset.nilaiPerolehan ?? '',
      aset.lokasi ?? '',
      aset.ket ?? '',
      aset.menurutAdministrasi ?? '',
      aset.menurutInventarisasi ?? '',
      selisih ?? '',
      KONDISI_LABELS[aset.kondisi] ?? aset.kondisi,
      aset.klasifikasi ?? '',
      aset.alamat ?? '',
      aset.koordinat ?? '',
      aset.fotoUrl ?? '',
    ]
    values.forEach((v, i) => {
      const cell = row.getCell(i + 1)
      cell.value = v
      cell.border = {
        top: { style: 'thin' },
        bottom: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' },
      }
    })
  })

  // Column widths
  const widths = [6, 16, 40, 10, 12, 20, 10, 12, 18, 20, 20, 16, 16, 10, 16, 12, 40, 20, 30]
  widths.forEach((w, i) => {
    sheet.getColumn(i + 1).width = w
  })
}

function addSummarySheet(workbook: ExcelJS.Workbook, stats: Record<string, number>, unitName: string) {
  const sheet = workbook.addWorksheet('Laporan', { properties: { tabColor: { argb: 'FF113F51' } } })

  sheet.mergeCells('A1:C1')
  sheet.getCell('A1').value = 'REKAPITULASI INVENTARISASI BMN'
  sheet.getCell('A1').font = { bold: true, size: 14 }
  sheet.getCell('A1').alignment = { horizontal: 'center' }

  sheet.mergeCells('A2:C2')
  sheet.getCell('A2').value = unitName
  sheet.getCell('A2').alignment = { horizontal: 'center' }

  const headers = ['Kondisi', 'Jumlah Aset', 'Persentase']
  const hRow = sheet.getRow(4)
  headers.forEach((h, i) => {
    hRow.getCell(i + 1).value = h
    hRow.getCell(i + 1).font = { bold: true }
    hRow.getCell(i + 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF113F51' } }
    hRow.getCell(i + 1).font = { bold: true, color: { argb: 'FFFFFFFF' } }
    hRow.getCell(i + 1).alignment = { horizontal: 'center' }
  })

  const total = Object.values(stats).reduce((a, b) => a + b, 0)
  let rowIdx = 5
  for (const [kondisi, count] of Object.entries(stats)) {
    const r = sheet.getRow(rowIdx++)
    r.getCell(1).value = KONDISI_LABELS[kondisi] ?? kondisi
    r.getCell(2).value = count
    r.getCell(3).value = total > 0 ? `${((count / total) * 100).toFixed(1)}%` : '0%'
  }

  const totalRow = sheet.getRow(rowIdx)
  totalRow.getCell(1).value = 'TOTAL'
  totalRow.getCell(1).font = { bold: true }
  totalRow.getCell(2).value = total
  totalRow.getCell(2).font = { bold: true }

  sheet.getColumn(1).width = 25
  sheet.getColumn(2).width = 15
  sheet.getColumn(3).width = 15
}

export async function generateExcelLaporan(
  asetByKondisi: Record<string, AsetData[]>,
  unitName = 'BP3KP Jawa III'
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'BMN App'
  workbook.created = new Date()

  const stats: Record<string, number> = {}
  for (const [kondisi, data] of Object.entries(asetByKondisi)) {
    stats[kondisi] = data.length
  }

  addSummarySheet(workbook, stats, unitName)

  const sheetOrder = ['BAIK', 'RUSAK_RINGAN', 'RUSAK_BERAT', 'BERLEBIH', 'TIDAK_DITEMUKAN', 'SENGKETA']
  const sheetNames: Record<string, string> = {
    BAIK: 'Kondisi Baik',
    RUSAK_RINGAN: 'Kondisi Rusak Ringan',
    RUSAK_BERAT: 'Kondisi Rusak Berat',
    BERLEBIH: 'Barang Berlebih',
    TIDAK_DITEMUKAN: 'Barang Tidak Ditemukan',
    SENGKETA: 'Barang Sengketa',
  }

  for (const kondisi of sheetOrder) {
    const data = asetByKondisi[kondisi] ?? []
    addDataSheet(workbook, sheetNames[kondisi], data, unitName)
  }

  const arrayBuffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(arrayBuffer)
}
