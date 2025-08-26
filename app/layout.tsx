import Providers from './providers'
import GlobalNavigation from '@/components/GlobalNavigation'
import './globals.css'

export const metadata = { title: 'POS Web' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="da">
      <body>
        <Providers>
          <GlobalNavigation />
          {children}
        </Providers>
      </body>
    </html>
  )
}
