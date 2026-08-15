import { prisma } from '@/lib/prisma'
import ImportForm from '@/components/import/ImportForm'
import { adminPageScope } from '@/lib/scope'

export default async function ImportPage({
  searchParams,
}: {
  searchParams: Promise<{ satker?: string }>
}) {
  const ctx = await adminPageScope((await searchParams).satker)

  const satkerList = await prisma.satker.findMany({
    orderBy: { urutan: 'asc' },
    select: { id: true, nama: true },
  })

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold" style={{ color: 'var(--pkp-teal)', fontFamily: 'var(--font-poppins)' }}>
          Import Excel
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">Import data aset dari file Laporan BMN</p>
      </div>
      <ImportForm
        satkerList={satkerList}
        activeSatker={ctx.scope.kind === 'one' ? ctx.scope.satkerId : null}
      />
    </div>
  )
}
