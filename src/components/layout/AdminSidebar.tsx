'use client'

import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { signOut } from 'next-auth/react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/aset', label: 'Daftar Aset', icon: '📋' },
  { href: '/import', label: 'Import Excel', icon: '📥' },
  { href: '/laporan', label: 'Export Laporan', icon: '📤' },
  { href: '/lokasi', label: 'Daftar Lokasi', icon: '🏢' },
]

export default function AdminSidebar({
  satkerList,
}: {
  satkerList: { id: string; nama: string }[]
}) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeSatker = searchParams.get('satker') ?? ''

  /**
   * The active satker lives in the URL rather than a cookie. A cookie would
   * survive browser back/forward and be shared across tabs, so an admin
   * comparing two satker side by side could act on whichever was switched
   * last — and write to the wrong one.
   */
  function switchSatker(id: string) {
    // Filters are dropped on purpose: a nama/NUP filter from one satker matches
    // nothing in another, which reads as data loss. This also resets paging.
    const params = new URLSearchParams()
    if (id) params.set('satker', id)
    const qs = params.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname)
  }

  /** Keep the active satker on every nav link. */
  function withSatker(href: string) {
    return activeSatker ? `${href}?satker=${activeSatker}` : href
  }

  const satkerLabel =
    satkerList.find((s) => s.id === activeSatker)?.nama ?? 'Semua Satker'

  const switcher = (
    <select
      value={activeSatker}
      onChange={(e) => switchSatker(e.target.value)}
      className="w-full rounded-lg px-2 py-1.5 text-xs bg-white/15 text-white border border-white/25 focus:outline-none"
      aria-label="Pilih satker"
    >
      <option value="" className="text-gray-900">Semua Satker</option>
      {satkerList.map((s) => (
        <option key={s.id} value={s.id} className="text-gray-900">{s.nama}</option>
      ))}
    </select>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex flex-col w-60 min-h-screen fixed left-0 top-0"
        style={{ background: 'var(--pkp-teal)', color: 'white' }}
      >
        <div className="p-5 border-b border-white/20">
          <div className="text-xs uppercase tracking-widest opacity-60 mb-1">Kementerian PKP</div>
          <div className="font-bold text-lg leading-tight" style={{ fontFamily: 'var(--font-poppins)' }}>
            Inventarisasi BMN
          </div>
          <div className="mt-3">{switcher}</div>
        </div>

        <nav className="flex-1 py-4 px-3">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={withSatker(item.href)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 text-sm transition-all"
                style={{
                  background: active ? 'rgba(255,255,255,0.15)' : 'transparent',
                  color: active ? 'var(--pkp-gold)' : 'rgba(255,255,255,0.85)',
                  fontWeight: active ? '600' : '400',
                }}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-white/20">
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="w-full text-left px-3 py-2 rounded text-sm opacity-70 hover:opacity-100 transition-opacity"
          >
            Keluar
          </button>
        </div>
      </aside>

      {/* Mobile: satker switcher sits above the content */}
      <div
        className="md:hidden fixed top-0 left-0 right-0 z-40 px-3 py-2 flex items-center gap-2"
        style={{ background: 'var(--pkp-teal)' }}
      >
        <span className="text-xs text-white/70 shrink-0">Satker</span>
        <div className="flex-1">{switcher}</div>
      </div>
      <div className="md:hidden h-11" aria-hidden />
      <span className="sr-only">Satker aktif: {satkerLabel}</span>

      {/* Mobile bottom nav */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex border-t"
        style={{ background: 'var(--pkp-teal)' }}
      >
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={withSatker(item.href)}
              className="flex-1 flex flex-col items-center py-2 text-xs gap-1"
              style={{ color: active ? 'var(--pkp-gold)' : 'rgba(255,255,255,0.7)' }}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="leading-none">{item.label.split(' ')[0]}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
