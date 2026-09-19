import React from "react"
import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'

import { Analytics } from '@vercel/analytics/next'
import './globals.css'

import { Exo_2, Geist_Mono } from 'next/font/google'

const exo2 = Exo_2({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-exo-2',
  display: 'swap',
})

const geistMono = Geist_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-geist-mono',
  display: 'swap',
})

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
    <ClerkProvider
      signInForceRedirectUrl="/dashboard"
      signUpForceRedirectUrl="/dashboard"
      signInFallbackRedirectUrl="/dashboard"
      signUpFallbackRedirectUrl="/dashboard"
    >
      <html lang="en" className={`dark scroll-smooth ${exo2.variable} ${geistMono.variable}`}>
        <body className="font-sans antialiased">
          {children}
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  )
}
