import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'

/**
 * Yapay zekâ tarayıcılarına AÇIK izin — alıntılanabilmek için gerekli.
 * NOT: Google AI Overviews ayrı bot kullanmaz, normal Googlebot ile çalışır;
 * bu yüzden Googlebot asla engellenmez.
 */
const AI_BOTLARI = [
  'GPTBot', 'OAI-SearchBot', 'ChatGPT-User',
  'ClaudeBot', 'Claude-SearchBot',
  'PerplexityBot', 'Google-Extended',
  'Applebot', 'Applebot-Extended', 'CCBot',
]

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/' },
      ...AI_BOTLARI.map((ua) => ({ userAgent: ua, allow: '/' })),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
