import guncellemeJson from '@/data/guncelleme.json'

/**
 * Her sayfa ailesinin verisinin en son ne zaman değiştiği (YYYY-MM-DD).
 *
 * `scripts/guncelleme-yaz.mjs` git geçmişinden üretir; elle yazılmaz.
 * JSON-LD'de `dateModified` olarak yayımlanır.
 *
 * Tarihin DOĞRU olması, olmasından daha önemlidir: Google tutarlı ve
 * doğrulanabilir olmayan tazelik sinyallerini dikkate almayı bırakır. Bu yüzden
 * `new Date()` kullanılmaz — her deploy'da 306 sayfanın hepsine bugünü
 * damgalamak, tarihi hiç vermemekten kötüdür.
 */
export type Aile = keyof typeof guncellemeJson
export const GUNCELLEME = guncellemeJson as Record<Aile, string>

/** JSON-LD `dateModified` alanı; tarih yoksa alan hiç basılmaz. */
export function tarihAlani(aile: Aile): { dateModified: string } | Record<string, never> {
  const t = GUNCELLEME[aile]
  return t ? { dateModified: t } : {}
}
