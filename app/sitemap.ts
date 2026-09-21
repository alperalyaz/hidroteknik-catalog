import type { MetadataRoute } from 'next'
import { DILLER, SITE_URL } from '@/lib/site'
import { GUNCELLEME, type Aile } from '@/lib/guncelleme'
import { KATEGORILER } from '@/lib/veri'
import { PROFILLER, profilSlug } from '@/lib/profil'
import { MARKALAR } from '@/lib/marka'
import { REHBERLER } from '@/lib/rehber'
import { SILINDIR_PARCALARI } from '@/lib/silindir-parca'

/**
 * Kategori dışı, elle yazılmış sayfalar. Yeni eklenince buraya da yazılmalı.
 * Bunlar yalnız TR için üretilir (bkz. sayfanın kendi generateStaticParams'ı) —
 * kategori sayfalarının aksine DILLER genelinde çoğaltılmaz.
 */
const ELLE_SAYFALAR = ['denizli-hidrolik']

/**
 * `lastModified` git geçmişinden gelir, `new Date()`ten DEĞİL.
 *
 * 21.09.2026'ya kadar her deploy'da 316 URL'nin hepsine o anki zaman damgası
 * basılıyordu — yani bütün site her yayında "bugün değişti" diyordu. Ölçüldü:
 * canlı sitemap'te 316 URL, benzersiz lastmod sayısı 1. Google tutarlı ve
 * doğrulanabilir olmayan tazelik sinyallerini dikkate almayı bırakır; yalan
 * söyleyen tarih, hiç tarih olmamasından kötüdür.
 *
 * Kaynak `data/guncelleme.json` — JSON-LD'deki `dateModified` ile AYNI dosya.
 * Aynı olması şart: sitemap "bugün" derken JSON-LD "24 Ağustos" derse iki
 * sinyal çelişir ve çelişki, sinyalsizlikten kötüdür.
 *
 * Gün hassasiyeti (YYYY-MM-DD) kasıtlıdır ve sitemap şemasında geçerlidir;
 * saat/salise uydurmak elimizde olmayan bir kesinlik iddia etmek olurdu.
 */
function tarih(aile: Aile): string | undefined {
  return GUNCELLEME[aile]
}

export default function sitemap(): MetadataRoute.Sitemap {
  const girisler: MetadataRoute.Sitemap = []
  for (const lang of DILLER) {
    // Ana sayfa kategori listesini gösterir; ailesi de odur (bkz. anaSayfaSchema).
    girisler.push({
      url: `${SITE_URL}/${lang}`,
      lastModified: tarih('kategori'),
      changeFrequency: 'weekly',
      priority: 1,
    })
    if (lang === 'tr') {
      for (const slug of ELLE_SAYFALAR) {
        girisler.push({
          url: `${SITE_URL}/${lang}/${slug}`,
          lastModified: tarih('denizliHidrolik'),
          changeFrequency: 'monthly',
          priority: 0.9,
        })
      }
    }
    for (const k of KATEGORILER) {
      girisler.push({
        url: `${SITE_URL}/${lang}/${k.slug}`,
        lastModified: tarih('kategori'),
        changeFrequency: 'weekly',
        priority: 0.8,
      })
    }
    // Profil kodu sayfaları: kategori sayfalarından daha dar ama daha yüksek
    // niyetli aramaları karşılar («k21 40x50x8»), o yüzden ihmal edilmez.
    for (const p of PROFILLER) {
      girisler.push({
        url: `${SITE_URL}/${lang}/profil/${profilSlug(p.kod)}`,
        lastModified: tarih('profil'),
        changeFrequency: 'monthly',
        priority: 0.7,
      })
    }
    // Marka sayfaları: "marka + ürün cinsi" aramalarının karşılığı.
    for (const marka of MARKALAR) {
      girisler.push({
        url: `${SITE_URL}/${lang}/marka/${marka.slug}`,
        lastModified: tarih('marka'),
        changeFrequency: 'monthly',
        priority: 0.7,
      })
    }
    // Teknik rehberler: satın alma niyetinin bir adım öncesindeki aramalar.
    for (const r of REHBERLER) {
      girisler.push({
        url: `${SITE_URL}/${lang}/rehber/${r.slug}`,
        lastModified: tarih('rehber'),
        changeFrequency: 'monthly',
        priority: 0.6,
      })
    }
    // Silindir yedek parçaları: ölçüyle aranan kalemler («boğaz kepi 100x50»).
    for (const parca of SILINDIR_PARCALARI) {
      girisler.push({
        url: `${SITE_URL}/${lang}/silindir-parca/${parca.slug}`,
        lastModified: tarih('silindirParca'),
        changeFrequency: 'monthly',
        priority: 0.7,
      })
    }
  }
  return girisler
}
