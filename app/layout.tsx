import Providers from './providers'
import './globals.css'
export const metadata = { title: 'POS Web' }
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="da">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
