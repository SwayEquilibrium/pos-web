import Providers from './providers'
import GlobalNavigation from '@/components/GlobalNavigation'
import './globals.css'

export const metadata = { 
  title: 'POS Web'
}

export const viewport = {
  width: 'device-width',
  initialScale: 1.0,
  maximumScale: 5.0,
  userScalable: 'yes'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="da" className="h-full">
      <body className="h-screen bg-background overflow-hidden">
        <Providers>
          <GlobalNavigation />
          <main className="content-area h-full overflow-auto">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  )
}
