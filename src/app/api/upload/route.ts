import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { uploadFoto } from '@/lib/cloudinary'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json(
      { error: 'Sesi berakhir, silakan login ulang' },
      { status: 401 },
    )
  }

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const asetId = formData.get('asetId') as string | null

  if (!file) {
    return NextResponse.json({ error: 'File tidak ditemukan' }, { status: 400 })
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
