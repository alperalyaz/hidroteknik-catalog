import type { MetadataRoute } from 'next'
import { FIRMA } from '@/lib/site'

/**
 * Web app manifest — ana ekrana eklenince doğru ad ve ikonla görünsün.
 *
 * Katalog bir uygulama değil, o yüzden display 'browser': sahte bir uygulama
 * kabuğu açmak yerine normal tarayıcı sekmesinde kalır. Manifest'in buradaki
 * asıl işi ikon ve ad beyanı.
 *
 * theme_color logodan gelen lacivert (#05396b) — globals.css'teki değerle aynı
 * olmalı; ikisi ayrışırsa Android'de sekme rengi siteyle uyumsuz görünür.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${FIRMA.ad} — Ürün Kataloğu`,
    short_name: 'Hidroteknik',
    description:
      'Endüstriyel hidrolik ve pnömatik malzeme kataloğu: hortum, rakor, silindir, pompa, valf, keçe ve o-ring.',
    start_url: '/tr',
    display: 'browser',
    background_color: '#ffffff',
    theme_color: '#05396b',
    icons: [
      { src: '/icon.png', sizes: '512x512', type: 'image/png' },
      { src: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  }
}
