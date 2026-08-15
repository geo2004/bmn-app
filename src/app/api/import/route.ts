import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parseExcelFile } from '@/lib/importExcel'
import { upsertAsetRows } from '@/lib/importUpsert'
import { adminApiScope, resolveWriteSatker } from '@/lib/scope'

// A 1000-row import will not finish inside the default serverless wall clock.
export const maxDuration = 300

export async function POST(req: NextRequest) {
  const auth = await adminApiScope(req.nextUrl.searchParams.get('satker'))
  if (!auth.ok) return auth.res

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const previewOnly = formData.get('preview') === 'true'

  if (!file) return NextResponse.json({ error: 'File tidak ditemukan' }, { status: 400 })

  // The target satker comes from the request body, never from the URL or a
  // cookie: this is the one operation that rewrites a whole satker at once.
  const satkerId = resolveWriteSatker(auth.ctx, formData.get('satkerId'))
  if (!satkerId) {
    return NextResponse.json({ error: 'Pilih satker tujuan import' }, { status: 400 })
  }

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  let results
  try {
    results = parseExcelFile(buffer)
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Gagal membaca file' },
      { status: 400 },
    )
  }

  const rows = results.flatMap((r) => r.rows)
  const preview = results.map((r) => ({
    sheetName: r.sheetName,
    kondisi: r.kondisi,
    count: r.rows.length,
    skipped: r.skipped,
  }))

  if (previewOnly) {
    const existing = await prisma.asetBmn.count({ where: { satkerId } })
    return NextResponse.json({ preview, totalRows: rows.length, satkerId, existing })
  }

  const before = await prisma.asetBmn.count({ where: { satkerId } })

  const outcome = await prisma.$transaction(
    (tx) => upsertAsetRows(tx, rows, satkerId),
    // The default interactive-transaction timeout is 5s, which a multi-chunk
    // import blows through immediately.
    { timeout: 120_000, maxWait: 20_000 },
  )

  const after = await prisma.asetBmn.count({ where: { satkerId } })
  const inserted = after - before

  return NextResponse.json({
    success: true,
    satkerId,
    inserted,
    updated: outcome.processed - inserted,
    unkeyed: outcome.unkeyed,
    preview,
  })
}
