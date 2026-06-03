import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'AstroCeleb',
    template: '%s — AstroCeleb',
  },
  description: 'Celebrity Vedic sidereal birth charts. Lahiri ayanamsa, whole sign houses.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-stone-50 text-stone-900 antialiased">
        {children}
      </body>
    </html>
  )
}
