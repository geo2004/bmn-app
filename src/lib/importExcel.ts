import * as XLSX from 'xlsx'
import { getKlasifikasi } from './constants'

export interface AsetRow {
  no?: number
  kodeBarang?: string
  namaBarang: string
  nup?: string
  tahunPerolehan?: number
  merkType?: string
  satuan?: string
  kuantitas?: number
  nilaiPerolehan?: number
  menurutAdministrasi?: number
  menurutInventarisasi?: number
  kondisi: string
  klasifikasi?: string
  lokasi?: string
  alamat?: string
  koordinat?: string
  fotoUrl?: string
  ket?: string
}

function parseNum(val: unknown): number | undefined {
  if (val === null || val === undefined || val === '') return undefined
  const n = Number(val)
  return isNaN(n) ? undefined : n
}

function parseStr(val: unknown): string | undefined {
  if (val === null || val === undefined) return undefined
  const s = String(val).trim()
  return s === '' ? undefined : s
}

function mapKondisi(val: unknown): string {
  const s = String(val ?? '').trim().toLowerCase()
  if (s === 'baik' || s === 'b') return 'BAIK'
  if (s === 'rusak ringan' || s === 'rr') return 'RUSAK_RINGAN'
  if (s === 'rusak berat' || s === 'rb') return 'RUSAK_BERAT'
  if (s === 'tidak ditemukan' || s === 'td') return 'TIDAK_DITEMUKAN'
  if (s === 'berlebih' || s === 'be') return 'BERLEBIH'
  if (s === 'sengketa' || s === 's') return 'SENGKETA'
  return 'BAIK'
}

// Laporan sheet columns (0-indexed):
// 0=No, 1=Kode Barang, 2=Nama Barang, 3=NUP, 4=Tahun Perolehan,
// 5=Merk, 6=Type/Spesifikasi, 7=Satuan,
// 8=Kuantitas ADM, 9=Nilai Perolehan ADM, 10=Kondisi ADM,
// 11=Kuantitas INV, 12=Nilai Perolehan INV, 13=Kondisi INV,
// 14=Selisih Kuantitas (skip), 15=Selisih Harga (skip),
// 16=Alamat, 17=Koordinat, 18=Link Foto, 19=Ket

function parseRow(row: unknown[]): AsetRow | null {
  const namaBarang = parseStr(row[2])
  if (!namaBarang) return null

  // Skip column-index rows (e.g. row with 1, 2, 3... as column numbers)
  if (/^\d+$/.test(namaBarang)) return null

  // Skip header/footer rows: No. must be a positive integer
  const noVal = parseNum(row[0])
  if (!noVal || noVal <= 0 || !Number.isInteger(noVal)) return null

  const merk = parseStr(row[5])
  const type = parseStr(row[6])
  const merkType = merk && type ? `${merk} ${type}` : merk ?? type

  const kondisiRaw = row[13] ?? row[10]
  const kondisi = mapKondisi(kondisiRaw)

  return {
    no: noVal,
    kodeBarang: parseStr(row[1]),
    namaBarang,
    nup: parseStr(row[3]),
    tahunPerolehan: parseNum(row[4]),
    merkType,
    satuan: parseStr(row[7]),
    kuantitas: parseNum(row[8]),
    nilaiPerolehan: parseNum(row[9]),
    menurutAdministrasi: parseNum(row[8]),
    menurutInventarisasi: parseNum(row[11]),
    kondisi,
    klasifikasi: getKlasifikasi(kondisi),
    alamat: parseStr(row[16]),
    koordinat: parseStr(row[17]),
    fotoUrl: parseStr(row[18]),
    ket: parseStr(row[19]),
  }
}

export interface ImportResult {
  kondisi: string
  sheetName: string
  rows: AsetRow[]
  skipped: number
}

export function parseExcelFile(buffer: Buffer): ImportResult[] {
  const workbook = XLSX.read(buffer, { type: 'buffer' })

  const sheetName = 'Laporan'
  if (!workbook.SheetNames.includes(sheetName)) {
    throw new Error(`Sheet "Laporan" tidak ditemukan. Sheet yang tersedia: ${workbook.SheetNames.join(', ')}`)
  }

  const sheet = workbook.Sheets[sheetName]
  const rawRows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: null,
    blankrows: false,
  })

  const rows: AsetRow[] = []
  let skipped = 0

  for (const raw of rawRows) {
    const row = raw as unknown[]
    const parsed = parseRow(row)
    if (parsed) {
      rows.push(parsed)
    } else {
      skipped++
    }
  }

  return [{ kondisi: 'ALL', sheetName, rows, skipped }]
}
