/**
 * Firma ve site sabitleri — TEK doğruluk kaynağı.
 * Künye verisi hidroteknik.com.tr/İletişim-1 sayfasından alınmıştır (29.07.2026).
 * Ana sitedeki LocalBusiness şemasıyla BİREBİR aynı olmalı; tutarsız künye
 * (NAP) arama motorlarında ve yapay zekâ cevaplarında güven kaybettirir.
 */
export const SITE_URL = 'https://catalog.hidroteknik.com.tr'
export const ANA_SITE = 'https://www.hidroteknik.com.tr'

export const FIRMA = {
  ad: 'Hidroteknik A.Ş.',
  resmiUnvan: 'Hidroteknik Fabrika Malzemeleri Ticaret ve Sanayi A.Ş.',
  kurulus: '1984',
  telefon: '+90 258 251 40 60',
  telefonHam: '+902582514060',
  eposta: 'info@hidroteknik.com.tr',
  epostaSatis: 'all.satis@hidroteknik.com.tr',
  adres: {
    sokak: 'Sümer 2296 No:21 Alyaz İş Merkezi No:1',
    ilce: 'Merkezefendi',
    il: 'Denizli',
    postaKodu: '20175',
    ulke: 'TR',
  },
  konum: { lat: 37.793376, lng: 29.098947 },
  saatler: { haftaIci: '08:00–18:00', cumartesi: '09:00–13:00' },
  hizmetBolgesi: ['Denizli', 'Aydın', 'Uşak', 'Muğla', 'Afyonkarahisar'],
  sosyal: [
    'https://www.facebook.com/hidroteknik',
    'https://www.instagram.com/ht.hidroteknik/',
    'https://www.linkedin.com/company/42467431',
    'https://www.youtube.com/channel/UCS97u6nNz_PQTBBxDYzjlLA',
  ],
  logo: 'https://files.cdn-files-a.com/uploads/5644137/400_6865986816fbc.png',
} as const

/** Desteklenen diller. */
export const DILLER = ['tr', 'en', 'ru'] as const
export type Dil = (typeof DILLER)[number]
export const VARSAYILAN_DIL: Dil = 'tr'

/** Dil değiştirici ve <html lang> için görünen ad. */
export const DIL_ADI: Record<Dil, string> = { tr: 'Türkçe', en: 'English', ru: 'Русский' }

/**
 * Hidrolik hesaplayıcının dile göre adresi. İngilizcesi ayrı alan adında yayında;
 * Rusça sürüm yok, TR'ye düşer (araç sayısal olduğu için dil engeli düşük).
 */
export const HESAPLA_URL: Record<Dil, string> = {
  tr: 'https://hesapla.hidroteknik.com.tr',
  en: 'https://calculate.hidroteknik.com.tr',
  ru: 'https://hesapla.hidroteknik.com.tr',
}

/** Sayı formatlama, dile göre binlik ayracı. */
export function sayiFormat(n: number, lang: Dil): string {
  const locale = { tr: 'tr-TR', en: 'en-US', ru: 'ru-RU' }[lang]
  return n.toLocaleString(locale)
}

/**
 * Bir sayfanın dil sürümleri — `alternates.languages` için hazır harita.
 * `yol` dil segmentinden SONRAKİ kısımdır: '' (ana sayfa), '/hidrolik-hortum',
 * '/marka/kastas' gibi.
 *
 * ── NEDEN x-default ────────────────────────────────────────────────────────
 * Üç dil beyan edip hiçbirine "varsayılan" demezsek, dili tutmayan bir arama
 * için hangisinin gösterileceğine Google kendi karar verir. O karar, yinelenen
 * bir kümede kanonik seçmekle AYNI işlemdir; seçtiği bizim beyan ettiğimizden
 * başkası olduğunda Search Console "Duplicate, Google chose different canonical
 * than user" der. x-default kararı bize geri alır: eşleşmeyen her dil TR'ye.
 *
 * Google'ın dokümanı x-default'u "yedek sayfayı belirtmek için önerilir" diye
 * geçirir ve üç yöntemi (HTML etiketi, HTTP başlığı, sitemap) eşdeğer sayıp
 * BİRİNİN seçilmesini ister — biz HTML etiketini kullanıyoruz, o yüzden
 * sitemap'e xhtml:link eklenmez.
 */
export function dilAlternatifleri(yol: string): Record<string, string> {
  const harita: Record<string, string> = Object.fromEntries(
    DILLER.map((d) => [d, `${SITE_URL}/${d}${yol}`])
  )
  harita['x-default'] = `${SITE_URL}/${VARSAYILAN_DIL}${yol}`
  return harita
}
