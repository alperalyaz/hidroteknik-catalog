import { FIRMA, SITE_URL, ANA_SITE } from './site'
import type { Kategori, Urun } from './veri'

/**
 * JSON-LD üreticileri.
 *
 * @id ve sameAs kullanımı önemlidir: ana sitedeki LocalBusiness ile AYNI @id
 * verilerek Google ve yapay zekâ motorlarına "bu iki site aynı işletmeye ait"
 * denir. Böylece katalog sayfaları ana sitenin kurumsal kimliğinden faydalanır.
 */

const ISLETME_ID = `${ANA_SITE}/#hidroteknik`

export function isletmeSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': ['LocalBusiness', 'Organization'],
    '@id': ISLETME_ID,
    name: FIRMA.ad,
    legalName: FIRMA.resmiUnvan,
    url: ANA_SITE,
    logo: FIRMA.logo,
    telephone: FIRMA.telefonHam,
    email: FIRMA.eposta,
    foundingDate: FIRMA.kurulus,
    address: {
      '@type': 'PostalAddress',
      streetAddress: FIRMA.adres.sokak,
      addressLocality: FIRMA.adres.ilce,
      addressRegion: FIRMA.adres.il,
      postalCode: FIRMA.adres.postaKodu,
      addressCountry: FIRMA.adres.ulke,
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: FIRMA.konum.lat,
      longitude: FIRMA.konum.lng,
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '08:00',
        closes: '18:00',
      },
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: 'Saturday',
        opens: '09:00',
        closes: '13:00',
      },
    ],
    areaServed: FIRMA.hizmetBolgesi.map((ad) => ({ '@type': 'City', name: ad })),
    sameAs: [...FIRMA.sosyal],
  }
}

/** Kategori sayfası: ürün listesi. Fiyat YAYINLANMAZ (B2B, müşteriye göre değişir). */
export function kategoriSchema(k: Kategori, urunler: Urun[], url: string, lang: string, katalogAdi: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${url}#sayfa`,
    url,
    name: k.h1,
    description: k.ozet,
    inLanguage: lang,
    isPartOf: { '@type': 'WebSite', '@id': `${SITE_URL}/#site`, name: `${FIRMA.ad} ${katalogAdi}` },
    about: { '@id': ISLETME_ID },
    provider: { '@id': ISLETME_ID },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: urunler.length,
      itemListElement: urunler.map((u, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: {
          '@type': 'Product',
          name: u.ad,
          sku: u.kod,
          category: k.ad,
          // Marka bilinen kalemlerde gerçek markayı beyan et: marka + model
          // aramalarında (ör. "gates 2sc hortum") eşleşmeyi sağlayan alan budur.
          brand: { '@type': 'Brand', name: u.marka || FIRMA.ad },
          ...(u.model ? { mpn: u.model } : {}),
          offers: {
            '@type': 'Offer',
            // Fiyat müşteriye/miktara göre belirlendiği için sayı yayınlanmaz;
            // teklif üzerine satış olduğunu bildiren doğru gösterim budur.
            availability: 'https://schema.org/InStock',
            priceSpecification: {
              '@type': 'PriceSpecification',
              priceCurrency: 'TRY',
              valueAddedTaxIncluded: false,
            },
            seller: { '@id': ISLETME_ID },
          },
        },
      })),
    },
  }
}

export function sssSchema(sss: { s: string; c: string }[], lang?: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    ...(lang ? { inLanguage: lang } : {}),
    mainEntity: sss.map((x) => ({
      '@type': 'Question',
      name: x.s,
      acceptedAnswer: { '@type': 'Answer', text: x.c },
    })),
  }
}

export function kirintiSchema(parcalar: { ad: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: parcalar.map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: p.ad,
      item: p.url,
    })),
  }
}

/** JSON-LD'yi güvenle gömer (</script> kaçışı XSS'i önler). */
export function jsonLd(veri: unknown) {
  return { __html: JSON.stringify(veri).replace(/</g, '\\u003c') }
}
