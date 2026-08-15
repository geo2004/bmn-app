import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { uploadFoto } from '@/lib/cloudinary'
import { apiScope } from '@/lib/scope'

/**
 * Photo upload.
 *
 * Cloudinary is addressed by a deterministic `public_id` of `aset_<asetId>`
 * with `overwrite: true`, and this route used to accept any asetId from any
 * authenticated user with no check at all. That let one satker's editor
 * overwrite another satker's photo: fotoUrl in the database is untouched, so
 * the URL still resolves — it just serves the wrong picture, and no row backup
 * can detect or repair it. Ownership is therefore verified before Cloudinary
 * is touched at all.
 */
export async function POST(req: NextRequest) {
  const auth = await apiScope(req.nextUrl.searchParams.get('satker'))
  if (!auth.ok) return auth.res

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const asetId = formData.get('asetId') as string | null

  if (!file) {
    return NextResponse.json({ error: 'File tidak ditemukan' }, { status: 400 })
  }

  if (asetId) {
    const owned = await prisma.asetBmn.findFirst({
      where: { id: asetId, ...auth.ctx.where },
      select: { id: true },
    })
    if (!owned) {
      return NextResponse.json(
        { error: 'Aset tidak ditemukan pada satker ini' },
        { status: 403 },
      )
    }
  }

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const filename = asetId
    ? `aset_${asetId}`
    : `aset_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`

  try {
    const url = await uploadFoto(buffer, filename)
    return NextResponse.json({ url })
  } catch (err) {
    console.error('[upload] Cloudinary error:', err)
    return NextResponse.json(
      { error: 'Gagal mengirim foto ke server penyimpanan, coba lagi' },
      { status: 502 },
    )
  }
}
