import React from "react"
import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'

import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { SidebarWrapper } from '@/components/sidebar-wrapper'

import { Geist_Mono, Exo_2 as V0_Font_Exo_2, Geist_Mono as V0_Font_Geist_Mono } from 'next/font/google'

// Initialize fonts
const _exo_2 = V0_Font_Exo_2({ subsets: ['latin'], weight: ["100","200","300","400","500","600","700","800","900"] })
const _geistMono = V0_Font_Geist_Mono({ subsets: ['latin'], weight: ["100","200","300","400","500","600","700","800","900"] })

export const metadata: Metadata = {
  title: 'QuoteReality - Freelance Time & Earnings Tracker',
  description: 'Track your freelance project time and understand how well your fixed-price quotes perform by calculating effective hourly earnings.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className="dark">
        <body className="font-sans antialiased">
          <SidebarWrapper>{children}</SidebarWrapper>
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  )
}
