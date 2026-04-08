import type { Metadata } from 'next'
import { Inter, Poppins } from 'next/font/google'
import './globals.css'
import SessionProvider from '@/components/layout/SessionProvider'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const poppins = Poppins({ subsets: ['latin'], weight: ['400', '600', '700'], variable: '--font-poppins' })

export const metadata: Metadata = {
  title: 'Inventarisasi BMN - BP3KP Jawa III',
  description: 'Aplikasi Inventarisasi Barang Milik Negara',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  return (
    <html lang="id" className={`${inter.variable} ${poppins.variable} h-full`}>
      <body className="min-h-full">
        <SessionProvider session={session}>{children}</SessionProvider>
      </body>
    </html>
  )
}
