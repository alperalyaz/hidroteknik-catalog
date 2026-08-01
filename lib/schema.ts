import { FIRMA, SITE_URL, ANA_SITE } from './site'
import type { Kategori, Urun } from './veri'
import { satirUreticiKodu } from './uretici-kod'

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
          // sku YOK: Hidroteknik stok kodu iç bir referanstır, kimse onu aramaz
          // ve sık değişir. Yapılandırılmış veriyi kısa ömürlü bir değere
          // bağlamamak için yayımlanmaz.
          category: k.ad,
          // Marka bilinen kalemlerde gerçek markayı beyan et: marka + model
          // aramalarında (ör. "gates 2sc hortum") eşleşmeyi sağlayan alan budur.
          brand: { '@type': 'Brand', name: u.marka || FIRMA.ad },
          // mpn = ÜRETİCİNİN parça numarası. Eskiden buraya `model` yazılıyordu
          // ama model bir ÖLÇÜDÜR ("M18x1,5 12L"), parça numarası değil; ölçünün
          // doğru yeri `size`. Gerçek mpn stok kodunun önekinden arındırılmış
          // hâlidir: HF.H.HD106 → HD106 (HansaFlex'in kendi katalog kodu).
          ...(satirUreticiKodu(u.kod) ? { mpn: satirUreticiKodu(u.kod)! } : {}),
          ...(u.model ? { size: u.model } : {}),
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

/**
 * Profil kodu sayfası. Kategori şemasından farkı: her satır bir ÜRÜN DEĞİL, bir
 * ölçüdür — ItemList içinde Product olarak beyan edilir ki "k21 40x50x8" gibi
 * ölçü aramalarında sayfa somut bir kaleme bağlanabilsin.
 */
export function profilSchema(
  p: { kod: string; ad: string; adet: number; olculer: { kod: string; olcu: string }[] },
  url: string,
  lang: string,
  baslik: string,
  ozet: string,
  katalogAdi: string
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${url}#sayfa`,
    url,
    name: baslik,
    description: ozet,
    inLanguage: lang,
    isPartOf: { '@type': 'WebSite', '@id': `${SITE_URL}/#site`, name: `${FIRMA.ad} ${katalogAdi}` },
    about: { '@id': ISLETME_ID },
    provider: { '@id': ISLETME_ID },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: p.olculer.length,
      itemListElement: p.olculer.map((o, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: {
          '@type': 'Product',
          name: o.olcu ? `Kastaş ${o.kod} — ${o.olcu} mm` : `Kastaş ${o.kod}`,
          // Önek atılır: "KASTAS." Hidroteknik'in iç öneki, "K21-040/11" ise
          // Kastaş'ın kendi katalog kodu — aranan ve kalıcı olan bu. Üreticinin
          // parça numarası olduğu için doğru alan `mpn`, `sku` değil.
          mpn: o.kod,
          ...(o.olcu ? { size: o.olcu } : {}),
          ...(p.ad ? { category: p.ad } : {}),
          brand: { '@type': 'Brand', name: 'Kastaş' },
          offers: {
            '@type': 'Offer',
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

/**
 * Marka sayfası. Brand varlığını açıkça beyan eder ki "marka + ürün cinsi"
 * aramalarında (ör. "gates hidrolik hortum") sayfa markayla ilişkilendirilsin.
 */
export function markaSchema(
  marka: { ad: string; adet: number; ornekler: { kod: string; ad: string }[] },
  url: string,
  lang: string,
  baslik: string,
  katalogAdi: string
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${url}#sayfa`,
    url,
    name: baslik,
    inLanguage: lang,
    isPartOf: { '@type': 'WebSite', '@id': `${SITE_URL}/#site`, name: `${FIRMA.ad} ${katalogAdi}` },
    about: { '@type': 'Brand', name: marka.ad },
    provider: { '@id': ISLETME_ID },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: marka.ornekler.length,
      itemListElement: marka.ornekler.map((o, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: {
          '@type': 'Product',
          name: `${marka.ad} ${o.ad}`,
          // sku YOK — bkz. kategoriSchema'daki gerekçe (iç kod, sık değişir).
          // mpn ise üreticinin kendi kodudur; çıkarılabildiği kadarıyla yayımlanır.
          ...(satirUreticiKodu(o.kod) ? { mpn: satirUreticiKodu(o.kod)! } : {}),
          brand: { '@type': 'Brand', name: marka.ad },
          offers: {
            '@type': 'Offer',
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

/**
 * Teknik rehber sayfası. CollectionPage değil Article — sayfa ürün listesi
 * değil, açıklayıcı metin. Yazar olarak işletme beyan edilir.
 */
export function rehberSchema(
  i: { ad: string; h1: string; ozet: string },
  url: string,
  lang: string,
  katalogAdi: string
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    '@id': `${url}#makale`,
    url,
    headline: i.h1,
    name: i.ad,
    description: i.ozet,
    inLanguage: lang,
    isPartOf: { '@type': 'WebSite', '@id': `${SITE_URL}/#site`, name: `${FIRMA.ad} ${katalogAdi}` },
    author: { '@id': ISLETME_ID },
    publisher: { '@id': ISLETME_ID },
  }
}

/**
 * Silindir yedek parça sayfası — ProductGroup.
 *
 * Product yerine ProductGroup: sayfa tek bir kalemi değil, ölçüye göre değişen bir
 * VARYANT AİLESİNİ anlatıyor (Ø32–250 arası 183 boğaz kepi ölçüsü gibi). Ayırt edici
 * eksen `variesBy` ile bildirilir. Fiyat/stok alanı YOK — katalog fiyat göstermiyor,
 * uydurma offer yazmak yapılandırılmış veriyi yalancı yapardı.
 */
export function parcaSchema(
  i: { ad: string; h1: string; ozet: string; eksen: 'capMil' | 'capDis'; olculer: string[] },
  url: string,
  lang: string,
  katalogAdi: string
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ProductGroup',
    '@id': `${url}#urungrubu`,
    url,
    name: i.h1,
    description: i.ozet,
    inLanguage: lang,
    category: i.ad,
    productGroupID: url.split('/').pop(),
    variesBy: i.eksen === 'capMil' ? ['width', 'depth'] : ['width'],
    hasVariant: i.olculer.map((o) => ({
      '@type': 'Product',
      name: `${i.ad} ${o}`,
      sku: o,
    })),
    isPartOf: { '@type': 'WebSite', '@id': `${SITE_URL}/#site`, name: `${FIRMA.ad} ${katalogAdi}` },
    brand: { '@id': ISLETME_ID },
    manufacturer: { '@id': ISLETME_ID },
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
