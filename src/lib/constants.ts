export const KONDISI_LABELS: Record<string, string> = {
  BAIK: 'Baik',
  RUSAK_RINGAN: 'Rusak Ringan',
  RUSAK_BERAT: 'Rusak Berat',
  TIDAK_DITEMUKAN: 'Tidak Ditemukan',
  BERLEBIH: 'Berlebih',
  SENGKETA: 'Sengketa',
}

export const KONDISI_COLORS: Record<string, string> = {
  BAIK: '#16a34a',
  RUSAK_RINGAN: '#d97706',
  RUSAK_BERAT: '#dc2626',
  TIDAK_DITEMUKAN: '#6b7280',
  BERLEBIH: '#2563eb',
  SENGKETA: '#7c3aed',
}

export const KONDISI_BG: Record<string, string> = {
  BAIK: '#dcfce7',
  RUSAK_RINGAN: '#fef3c7',
  RUSAK_BERAT: '#fee2e2',
  TIDAK_DITEMUKAN: '#f3f4f6',
  BERLEBIH: '#dbeafe',
  SENGKETA: '#ede9fe',
}

export function getKlasifikasi(kondisi: string): string {
  switch (kondisi) {
    case 'BAIK': return 'B'
    case 'RUSAK_RINGAN': return 'RR'
    case 'RUSAK_BERAT': return 'RB'
    case 'TIDAK_DITEMUKAN': return 'TD'
    case 'BERLEBIH': return 'Lebih'
    case 'SENGKETA': return 'Sengketa'
    default: return '-'
  }
}

export const SHEET_TO_KONDISI: Record<string, string> = {
  'Kondisi Baik': 'BAIK',
  'Kondisi Rusak Ringan': 'RUSAK_RINGAN',
  'Kondisi Rusak Berat': 'RUSAK_BERAT',
  'Barang Berlebih': 'BERLEBIH',
  'Barang Tidak Ditemukan': 'TIDAK_DITEMUKAN',
  'Barang Sengketa': 'SENGKETA',
}
