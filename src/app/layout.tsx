import type { Metadata } from 'next'
import { Cinzel, Inter } from 'next/font/google'
import './globals.css'

const cinzel = Cinzel({ subsets: ['latin'], variable: '--font-cinzel' })
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'D&D Session Planner',
  description: 'Coordinate session scheduling for your D&D group',
}

/* eslint-disable @next/next/no-sync-scripts */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${cinzel.variable} ${inter.variable}`}>
<body className="text-gray-100 relative" suppressHydrationWarning>
        <div
          className="pointer-events-none fixed inset-0 opacity-30 bg-cover bg-center"
          style={{ backgroundImage: "url('/bg-swirl.png')" }}
          aria-hidden="true"
        />
        <div className="relative">{children}</div>
      </body>
    </html>
  )
}
