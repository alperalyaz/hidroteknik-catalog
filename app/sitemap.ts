import type { MetadataRoute } from 'next'
import { DILLER, SITE_URL } from '@/lib/site'
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

export default function sitemap(): MetadataRoute.Sitemap {
  const bugun = new Date()
  const girisler: MetadataRoute.Sitemap = []
  for (const lang of DILLER) {
    girisler.push({ url: `${SITE_URL}/${lang}`, lastModified: bugun, changeFrequency: 'weekly', priority: 1 })
    if (lang === 'tr') {
      for (const slug of ELLE_SAYFALAR) {
        girisler.push({
          url: `${SITE_URL}/${lang}/${slug}`,
          lastModified: bugun,
          changeFrequency: 'monthly',
          priority: 0.9,
        })
      }
    }
    for (const k of KATEGORILER) {
      girisler.push({
        url: `${SITE_URL}/${lang}/${k.slug}`,
        lastModified: bugun,
        changeFrequency: 'weekly',
        priority: 0.8,
      })
    }
    // Profil kodu sayfaları: kategori sayfalarından daha dar ama daha yüksek
    // niyetli aramaları karşılar («k21 40x50x8»), o yüzden ihmal edilmez.
    for (const p of PROFILLER) {
      girisler.push({
        url: `${SITE_URL}/${lang}/profil/${profilSlug(p.kod)}`,
        lastModified: bugun,
        changeFrequency: 'monthly',
        priority: 0.7,
      })
    }
    // Marka sayfaları: "marka + ürün cinsi" aramalarının karşılığı.
    for (const marka of MARKALAR) {
      girisler.push({
        url: `${SITE_URL}/${lang}/marka/${marka.slug}`,
        lastModified: bugun,
        changeFrequency: 'monthly',
        priority: 0.7,
      })
    }
    // Teknik rehberler: satın alma niyetinin bir adım öncesindeki aramalar.
    for (const r of REHBERLER) {
      girisler.push({
        url: `${SITE_URL}/${lang}/rehber/${r.slug}`,
        lastModified: bugun,
        changeFrequency: 'monthly',
        priority: 0.6,
      })
    }
    // Silindir yedek parçaları: ölçüyle aranan kalemler («boğaz kepi 100x50»).
    for (const parca of SILINDIR_PARCALARI) {
      girisler.push({
        url: `${SITE_URL}/${lang}/silindir-parca/${parca.slug}`,
        lastModified: bugun,
        changeFrequency: 'monthly',
        priority: 0.7,
      })
    }
  }
  return girisler
}
