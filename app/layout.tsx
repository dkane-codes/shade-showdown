import type { Metadata } from 'next'
import { Inter, Outfit } from 'next/font/google'
import './globals.css'
import Layout from '../components/layout'
import { BackgroundProvider } from '../lib/background-context'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

// Outfit is very similar to Cal Sans - modern, clean, rounded
const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-cal-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Shade Showdown',
  description: 'Vote on colors using the Keep, Trade, Cut system',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${outfit.variable} ${outfit.className}`}>
        <BackgroundProvider>
          <Layout>{children}</Layout>
        </BackgroundProvider>
      </body>
    </html>
  )
}