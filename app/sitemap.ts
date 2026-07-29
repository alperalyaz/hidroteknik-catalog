import type { MetadataRoute } from 'next'
import { DILLER, SITE_URL } from '@/lib/site'
import { KATEGORILER } from '@/lib/veri'

/** Kategori dışı, elle yazılmış sayfalar. Yeni eklenince buraya da yazılmalı. */
const ELLE_SAYFALAR = ['denizli-hidrolik']

export default function sitemap(): MetadataRoute.Sitemap {
  const bugun = new Date()
  const girisler: MetadataRoute.Sitemap = []
  for (const lang of DILLER) {
    girisler.push({ url: `${SITE_URL}/${lang}`, lastModified: bugun, changeFrequency: 'weekly', priority: 1 })
    // Elle yazılmış sayfalar (kategori şablonundan üretilmeyenler)
    for (const slug of ELLE_SAYFALAR) {
      girisler.push({
        url: `${SITE_URL}/${lang}/${slug}`,
        lastModified: bugun,
        changeFrequency: 'monthly',
        priority: 0.9,
      })
    }
    for (const k of KATEGORILER) {
      girisler.push({
        url: `${SITE_URL}/${lang}/${k.slug}`,
        lastModified: bugun,
        changeFrequency: 'weekly',
        priority: 0.8,
      })
    }
  }
  return girisler
}
