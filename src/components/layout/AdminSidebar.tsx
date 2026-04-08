'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/aset', label: 'Daftar Aset', icon: '📋' },
  { href: '/import', label: 'Import Excel', icon: '📥' },
  { href: '/laporan', label: 'Export Laporan', icon: '📤' },
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()

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
          <div className="text-xs opacity-70 mt-1">BP3KP Jawa III</div>
        </div>

        <nav className="flex-1 py-4 px-3">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
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
              href={item.href}
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
