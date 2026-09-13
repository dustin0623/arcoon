import type { Metadata } from 'next'
import { Inter, Philosopher } from 'next/font/google'
import { AuthProvider, AudioProvider, GameProvider } from '@/context'
import { Toaster } from 'sonner'
import Maintenance from '@/components/Maintenance'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

const philosopher = Philosopher({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['400', '700'],
})

export const metadata: Metadata = {
  title: 'Idle Raiders | Heroic Dungeon Battles & PvP Arena',
  description:
    'Assemble your team of heroes, raid dungeons, clash with other players, and take down massive world bosses in this idle RPG adventure.',
  keywords: [
    'idle RPG',
    'dungeon game',
    'PvP arena',
    'world bosses',
    'hero deployment game',
    'fantasy RPG',
    'Idle Raiders',
  ],
  openGraph: {
    title: 'Idle Raiders | Heroic Dungeon Battles & PvP Arena',
    description:
      'Assemble your team of heroes, raid dungeons, clash with other players, and take down massive world bosses in this idle RPG adventure.',
    url: 'https://www.idleraiders.site',
    siteName: 'Idle Raiders',
    images: [
      {
        url: 'https://www.idleraiders.site/opengraph.png',
        width: 1200,
        height: 630,
        alt: 'Idle Raiders Logo',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-32x32.png',
    apple: '/apple-touch-icon.png',
  },
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
      'max-snippet': -1,
    },
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Global maintenance kill-switch.
  // When NEXT_PUBLIC_IS_MAINTENANCE === 'true', the Maintenance page replaces
  // the entire app — no providers, no routes, no API calls from the client.
  // Toggle by updating the env var and redeploying.
  const isMaintenance = process.env.NEXT_PUBLIC_IS_MAINTENANCE === 'true'

  return (
    <html lang="en" className={`${inter.variable} ${philosopher.variable}`}>
      <body className="antialiased bg-background">
        {isMaintenance ? (
          <Maintenance />
        ) : (
          <AuthProvider>
            <AudioProvider>
              <GameProvider>
                {children}
                <Toaster position="top-right" richColors />
              </GameProvider>
            </AudioProvider>
          </AuthProvider>
        )}
      </body>
    </html>
  )
}
