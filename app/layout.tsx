import Providers from './providers'
import GlobalNavigation from '@/components/GlobalNavigation'
import './globals.css'

export const metadata = { 
  title: 'POS Web',
  viewport: 'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="da" className="h-full">
      <body className="min-h-screen bg-background">
        <Providers>
          <GlobalNavigation />
          <main className="content-area">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  )
}
