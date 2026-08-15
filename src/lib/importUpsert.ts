import { randomUUID } from 'crypto'
import { Prisma, type PrismaClient } from '@prisma/client'
import type { AsetRow } from './importExcel'

/**
 * Bulk upsert of parsed spreadsheet rows into one satker.
 *
 * Matched on (satkerId, kodeBarang, nup). Existing rows are UPDATEd in place so
 * they keep their id — which matters because Cloudinary addresses each photo by
 * `aset_<id>`. The previous delete-then-insert gave every row a fresh uuid and
 * silently orphaned all 1,095 photos.
 *
 * Kept out of the route handler so it can be exercised directly in tests
 * without standing up an authenticated request.
 */

/** Administrative facts: the spreadsheet is authoritative, so these overwrite. */
const ADMIN_COLS = [
  'namaBarang', 'tahunPerolehan', 'satuan', 'kuantitas',
  'nilaiPerolehan', 'merkType', 'menurutAdministrasi', 'alamat', 'no',
] as const

/**
 * Field-collected values: COALESCEd so a blank cell never erases what an editor
 * recorded. fotoUrl is the one that would hurt most — the source file's photo
 * column is empty for every asset photographed in the app.
 */
const FIELD_COLS = [
  'kondisi', 'klasifikasi', 'lokasi', 'menurutInventarisasi', 'koordinat', 'fotoUrl', 'ket',
] as const

const ALL_COLS = [
  'id', 'no', 'kodeBarang', 'namaBarang', 'nup', 'tahunPerolehan', 'satuan',
  'kuantitas', 'nilaiPerolehan', 'merkType', 'menurutAdministrasi',
  'menurutInventarisasi', 'kondisi', 'klasifikasi', 'lokasi', 'alamat',
  'koordinat', 'fotoUrl', 'ket', 'satkerId',
] as const

const colList = Prisma.raw(ALL_COLS.map((c) => `"${c}"`).join(', '))

const setClause = Prisma.raw([
  ...ADMIN_COLS.map((c) => `"${c}" = v."${c}"`),
  ...FIELD_COLS.map((c) => `"${c}" = COALESCE(v."${c}", a."${c}")`),
  `"updatedAt" = NOW()`,
].join(', '))

/** kondisi is NOT NULL, so a row the sheet gave no condition for defaults here. */
const insertSelect = Prisma.raw(
  ALL_COLS.map((c) => {
    if (c === 'kondisi') return `COALESCE(v."kondisi", 'BAIK'::"Kondisi")`
    if (c === 'klasifikasi') return `COALESCE(v."klasifikasi", 'B')`
    return `v."${c}"`
  }).join(', '),
)

/**
 * One VALUES tuple. Every placeholder is explicitly cast — Postgres cannot infer
 * a type for a bare parameter inside a VALUES list and raises
 * "could not determine data type of parameter" without these.
 */
function rowTuple(r: AsetRow, satkerId: string) {
  return Prisma.sql`(
    ${randomUUID()}::text,
    ${r.no ?? null}::integer,
    ${r.kodeBarang ?? null}::text,
    ${r.namaBarang}::text,
    ${r.nup ?? null}::text,
    ${r.tahunPerolehan ?? null}::integer,
    ${r.satuan ?? null}::text,
    ${r.kuantitas ?? null}::numeric,
    ${r.nilaiPerolehan ?? null}::numeric,
    ${r.merkType ?? null}::text,
    ${r.menurutAdministrasi ?? null}::numeric,
    ${r.menurutInventarisasi ?? null}::numeric,
    ${r.kondisi ?? null}::"Kondisi",
    ${r.klasifikasi ?? null}::text,
    ${r.lokasi ?? null}::text,
    ${r.alamat ?? null}::text,
    ${r.koordinat ?? null}::text,
    ${r.fotoUrl ?? null}::text,
    ${r.ket ?? null}::text,
    ${satkerId}::text
  )`
}

/** Rows per statement. 200 x 20 params stays far below Postgres' 65535 limit. */
const CHUNK = 200

export interface UpsertOutcome {
  /** Rows that could not take part in the upsert key. */
  unkeyed: number
  /** Rows presented to the database (deduplicated by key). */
  processed: number
}

export async function upsertAsetRows(
  db: Pick<PrismaClient, '$executeRaw'>,
  rows: AsetRow[],
  satkerId: string,
): Promise<UpsertOutcome> {
  const usable = rows.filter((r) => r.kodeBarang && r.nup)

  // A key repeated inside one file would make UPDATE ... FROM pick a row
  // arbitrarily; last occurrence wins, matching how a spreadsheet reads.
  const byKey = new Map<string, AsetRow>()
  for (const r of usable) byKey.set(`${r.kodeBarang}\u0000${r.nup}`, r)
  const deduped = [...byKey.values()]

  for (let i = 0; i < deduped.length; i += CHUNK) {
    const tuples = deduped.slice(i, i + CHUNK).map((r) => rowTuple(r, satkerId))

    await db.$executeRaw`
      UPDATE "AsetBmn" AS a
      SET ${setClause}
      FROM (VALUES ${Prisma.join(tuples)}) AS v(${colList})
      WHERE a."satkerId" = v."satkerId"
        AND a."kodeBarang" = v."kodeBarang"
        AND a."nup" = v."nup"
    `

    await db.$executeRaw`
      INSERT INTO "AsetBmn" (${colList}, "createdAt", "updatedAt")
      SELECT ${insertSelect}, NOW(), NOW()
      FROM (VALUES ${Prisma.join(tuples)}) AS v(${colList})
      ON CONFLICT ("satkerId", "kodeBarang", "nup") DO NOTHING
    `
  }

  return { unkeyed: rows.length - usable.length, processed: deduped.length }
}
