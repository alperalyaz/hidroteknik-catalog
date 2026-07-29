import type { MetadataRoute } from 'next'
import { DILLER, SITE_URL } from '@/lib/site'
import { KATEGORILER } from '@/lib/veri'

export default function sitemap(): MetadataRoute.Sitemap {
  const bugun = new Date()
  const girisler: MetadataRoute.Sitemap = []
  for (const lang of DILLER) {
    girisler.push({ url: `${SITE_URL}/${lang}`, lastModified: bugun, changeFrequency: 'weekly', priority: 1 })
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
