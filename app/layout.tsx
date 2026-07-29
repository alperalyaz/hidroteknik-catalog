import type { Metadata } from 'next'
import './globals.css'
import { SITE_URL, FIRMA } from '@/lib/site'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${FIRMA.ad} Ürün Kataloğu`,
    template: `%s | ${FIRMA.ad}`,
  },
  description:
    'Denizli merkezli endüstriyel hidrolik ve pnömatik malzeme tedarikçisi. Hidrolik hortum, rakor, silindir, o-ring ve sızdırmazlık elemanları.',
  robots: { index: true, follow: true },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  )
}
