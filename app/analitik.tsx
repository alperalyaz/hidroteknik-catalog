'use client'

import { Analytics } from '@vercel/analytics/next'

/**
 * Vercel Web Analytics — işyeri trafiği elenerek.
 *
 * Eleme neden BURADA: middleware yalnız bir çerez basabiliyor (sayfalar statik,
 * bkz. middleware.ts). Kararı tarayıcı veriyor; `beforeSend` null dönerse olay
 * hiç gönderilmez, yani veri Vercel'e ulaşmadan kesilir.
 *
 * Vercel Web Analytics'in KENDİSİ çerezsizdir; buradaki tek çerez bizim
 * ht_ic damgamızdır ve yalnız işyeri IP'sine basılır.
 */
export function Analitik() {
  return (
    <Analytics
      beforeSend={(olay) =>
        document.cookie.split('; ').includes(`ht_ic=1`) ? null : olay
      }
    />
  )
}
