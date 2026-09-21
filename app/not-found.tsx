import type { Metadata } from 'next'
import Link from 'next/link'
import { DILLER, DIL_ADI, VARSAYILAN_DIL, FIRMA } from '@/lib/site'

/**
 * KÖK seviyesindeki 404. `<html>` ve `<body>` BURADA açılır.
 *
 * Neden gerekli: `app/layout.tsx` yalnız `children` döndürür — gerçek kök gövde
 * `app/[lang]/layout.tsx`'tedir, çünkü `<html lang>` ancak dil segmentini gören
 * yerde doğru ayarlanabilir. Dolayısıyla dil segmentine GİRMEYEN bir adres
 * (`/olmayan-sayfa`) geldiğinde Next.js 404 sayfasını saracak bir gövde
 * bulamıyordu ve sayfa hata veriyordu.
 *
 * Ölçüldü (21.09.2026), onarımdan önce:
 *
 *   /tr/boyle-bir-kategori-yok   404   ← dil içi, doğru
 *   /boyle-bir-sayfa-yok         500   ← kök, YANLIŞ
 *   /olmayan.txt                 500   ← kök, YANLIŞ
 *
 * Neden 500 zararlı: Google 5xx'i "sunucu bozuk, sonra gel" diye okur ve adresi
 * kuyrukta tutar; 404 "bunu sil" der. Dahası yaygın 5xx, Googlebot'un tüm siteyi
 * tarama hızını kısmasına yol açar — bu sitenin zaten en büyük sorunu Google'ın
 * taramayı bırakmış olması, yani hata tam da kanamanın olduğu yerdeydi.
 *
 * Dil TR sabittir: kök seviyesinde adres bize hangi dili istediğini söylemiyor
 * ve TR hem varsayılan hem x-default hedefi. Ziyaretçi yabancıysa diye üç dilin
 * de girişi listeleniyor.
 */
export const metadata: Metadata = {
  title: 'Sayfa bulunamadı',
  // 404 zaten dizine girmez; beyan etmek ikinci bir güvence.
  robots: { index: false, follow: true },
}

export default function BulunamadiKok() {
  return (
    <html lang={VARSAYILAN_DIL}>
      <body>
        <main className="sarmal" style={{ padding: '64px 20px' }}>
          <p style={{ fontWeight: 650, letterSpacing: '0.04em', opacity: 0.7 }}>404</p>
          <h1>Sayfa bulunamadı</h1>
          <p className="metin">
            Aradığınız adres yok ya da taşınmış olabilir. {FIRMA.ad} ürün kataloğuna
            aşağıdaki dillerden biriyle girebilirsiniz.
          </p>
          <div className="kartlar" style={{ marginTop: 28 }}>
            {DILLER.map((d) => (
              <Link key={d} href={`/${d}`} className="kart">
                <b>{DIL_ADI[d]}</b>
                <span>catalog.hidroteknik.com.tr/{d}</span>
              </Link>
            ))}
          </div>
        </main>
      </body>
    </html>
  )
}
