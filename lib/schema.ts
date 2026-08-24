import { FIRMA, SITE_URL, ANA_SITE } from './site'
import { urunAdiDuzelt } from './veri'
import type { Kategori, Urun } from './veri'
import { satirUreticiKodu } from './uretici-kod'
import { tarihAlani } from './guncelleme'
import { METIN } from './metin'
import type { Dil } from './site'

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
    ...tarihAlani('kategori'),

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
          // ⚠ HAM `u.ad` DEĞİL. Ürün adının içine iç stok kodu gömülü olabiliyor
          // (kod göçü ERP'de adı da güncellemişti) ve JSON-LD'deki `name`/
          // `description` tam da sayfada görünmeyen ama yayımlanan yüzeydir.
          // Görünen tabloyu temizleyip burayı unutmak, sızıntıyı gizli hâle
          // getirir — 24.08.2026'da tam olarak bu oldu.
          name: urunAdiDuzelt(u.ad),
          // description ZORUNLU DEĞİL ama Google Merchant listings istiyor ve
          // eksikliğini Search Console raporluyor (02.08.2026). Metin uydurulmaz;
          // elimizdeki gerçek alanlardan kurulur ve sayfanın dilinde yazılır.
          description: METIN[lang as Dil].urunAciklama({
            ad: urunAdiDuzelt(u.ad),
            kategori: k.ad,
            marka: u.marka,
            olcu: u.model,
            ureticiKodu: satirUreticiKodu(u.kod) ?? undefined,
          }),
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
          // offers YOK — BİLİNÇLİ. `Product` üzerinde `offers` görünce Google
          // sayfayı SATIN ALINABİLİR ürün sayfası (Merchant listing) sayıyor ve
          // fiyat, görsel, kargo/iade bilgisi bekliyor. Katalog fiyat yayımlamaz
          // ve yayımlamayacak; o beklentileri hiçbir zaman karşılayamayacağımız
          // için sürekli uyarı üretiyordu (Search Console, 02.08.2026) ve
          // uyarılardan biri kritikleşirse zengin sonuç kaybedilebilirdi.
          // offers olmadan sayfa "ürün bilgisi" (product snippet) olarak
          // sınıflanır — bizim gerçekten olduğumuz şey budur.
          //
          // Kaybedilen tek şey `availability: InStock` sinyaliydi; onun yerine
          // stokta olduğu `description` metninde düz cümleyle söyleniyor.
          // İşletme bağlantısı da kaybolmuyor: sayfa düzeyindeki `about` ve
          // `provider` alanları zaten aynı LocalBusiness'a işaret ediyor.
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
/**
 * JSON-LD `itemListElement` üst sınırı.
 *
 * Ölçü listeleri tam listeye çıkarıldığında (24.08.2026) K21 sayfası 1.223
 * ölçü taşımaya başladı ve her ölçü için bir `Product` düğümü basılıyordu —
 * her birinde tam cümlelik `description` ile birlikte. Ölçüldü: sayfanın
 * JSON-LD'si 560 KB, GÖRÜNEN tablo ise yalnız 103 KB. Yani yapılandırılmış
 * veri, tarif ettiği içeriğin beş katı yer kaplıyordu.
 *
 * Sınır İÇERİK KAYBETTİRMEZ: ölçülerin tamamı sayfada, tabloda, düz metin
 * olarak duruyor — tarayıcının da dil modelinin de okuduğu yer orası.
 * `numberOfItems` gerçek toplamı söylemeye devam eder; schema.org'da ItemList'in
 * kısmi olması geçerlidir, sayı alanı tam da bunun için vardır.
 *
 * Şişik yapılandırılmış veri ters teper: sayfa ağırlığı Core Web Vitals'ı
 * düşürür ve bazı tarayıcılar büyük belgeleri budar — yani her ölçüyü JSON-LD'ye
 * basmak, tam da korumak istediğin kuyruğu kaybettirebilir.
 */
const ITEMLIST_SINIR = 50

export function profilSchema(
  p: {
    kod: string
    /** Üç dilli; JSON-LD sayfanın diliyle aynı dilde olmalı. */
    ad: Record<string, string>
    adet: number
    olculer: { kod: string; olcu: string }[]
  },
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
    ...tarihAlani('profil'),

    isPartOf: { '@type': 'WebSite', '@id': `${SITE_URL}/#site`, name: `${FIRMA.ad} ${katalogAdi}` },
    about: { '@id': ISLETME_ID },
    provider: { '@id': ISLETME_ID },
    mainEntity: {
      '@type': 'ItemList',
      // GERÇEK toplam burada durur; liste bir ÖRNEKLEMDİR (bkz. ITEMLIST_SINIR).
      numberOfItems: p.olculer.length,
      itemListElement: p.olculer.slice(0, ITEMLIST_SINIR).map((o, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: {
          '@type': 'Product',
          name: o.olcu ? `Kastaş ${o.kod} — ${o.olcu} mm` : `Kastaş ${o.kod}`,
          description: METIN[lang as Dil].urunAciklama({
            ad: `Kastaş ${o.kod}`,
            kategori: p.ad[lang] || `Kastaş ${p.kod}`,
            marka: 'Kastaş',
            olcu: o.olcu ? `${o.olcu} mm` : undefined,
            ureticiKodu: o.kod,
          }),
          // Önek atılır: "KASTAS." Hidroteknik'in iç öneki, "K21-040/11" ise
          // Kastaş'ın kendi katalog kodu — aranan ve kalıcı olan bu. Üreticinin
          // parça numarası olduğu için doğru alan `mpn`, `sku` değil.
          mpn: o.kod,
          ...(o.olcu ? { size: o.olcu } : {}),
          ...(p.ad[lang] ? { category: p.ad[lang] } : {}),
          brand: { '@type': 'Brand', name: 'Kastaş' },
          // offers YOK — BİLİNÇLİ. `Product` üzerinde `offers` görünce Google
          // sayfayı SATIN ALINABİLİR ürün sayfası (Merchant listing) sayıyor ve
          // fiyat, görsel, kargo/iade bilgisi bekliyor. Katalog fiyat yayımlamaz
          // ve yayımlamayacak; o beklentileri hiçbir zaman karşılayamayacağımız
          // için sürekli uyarı üretiyordu (Search Console, 02.08.2026) ve
          // uyarılardan biri kritikleşirse zengin sonuç kaybedilebilirdi.
          // offers olmadan sayfa "ürün bilgisi" (product snippet) olarak
          // sınıflanır — bizim gerçekten olduğumuz şey budur.
          //
          // Kaybedilen tek şey `availability: InStock` sinyaliydi; onun yerine
          // stokta olduğu `description` metninde düz cümleyle söyleniyor.
          // İşletme bağlantısı da kaybolmuyor: sayfa düzeyindeki `about` ve
          // `provider` alanları zaten aynı LocalBusiness'a işaret ediyor.
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
    ...tarihAlani('marka'),

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
          description: METIN[lang as Dil].urunAciklama({
            ad: o.ad,
            kategori: marka.ad,
            marka: marka.ad,
            ureticiKodu: satirUreticiKodu(o.kod) ?? undefined,
          }),
          // sku YOK — bkz. kategoriSchema'daki gerekçe (iç kod, sık değişir).
          // mpn ise üreticinin kendi kodudur; çıkarılabildiği kadarıyla yayımlanır.
          ...(satirUreticiKodu(o.kod) ? { mpn: satirUreticiKodu(o.kod)! } : {}),
          brand: { '@type': 'Brand', name: marka.ad },
          // offers YOK — BİLİNÇLİ. `Product` üzerinde `offers` görünce Google
          // sayfayı SATIN ALINABİLİR ürün sayfası (Merchant listing) sayıyor ve
          // fiyat, görsel, kargo/iade bilgisi bekliyor. Katalog fiyat yayımlamaz
          // ve yayımlamayacak; o beklentileri hiçbir zaman karşılayamayacağımız
          // için sürekli uyarı üretiyordu (Search Console, 02.08.2026) ve
          // uyarılardan biri kritikleşirse zengin sonuç kaybedilebilirdi.
          // offers olmadan sayfa "ürün bilgisi" (product snippet) olarak
          // sınıflanır — bizim gerçekten olduğumuz şey budur.
          //
          // Kaybedilen tek şey `availability: InStock` sinyaliydi; onun yerine
          // stokta olduğu `description` metninde düz cümleyle söyleniyor.
          // İşletme bağlantısı da kaybolmuyor: sayfa düzeyindeki `about` ve
          // `provider` alanları zaten aynı LocalBusiness'a işaret ediyor.
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
    ...tarihAlani('rehber'),

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
    ...tarihAlani('silindirParca'),

    category: i.ad,
    productGroupID: url.split('/').pop(),
    variesBy: i.eksen === 'capMil' ? ['width', 'depth'] : ['width'],
    hasVariant: i.olculer.map((o) => ({
      '@type': 'Product',
      name: `${i.ad} ${o}`,
      // `sku: o` YANLIŞTI — `o` bir ÖLÇÜDÜR ("32x16"), stok kodu değil. Aynı
      // hata kategoriSchema'da `mpn: model` olarak da vardı. Bu parçaların kodu
      // zaten yayımlanmıyor (tedarikçi adını ele veriyor), o yüzden yalnız ölçü.
      size: o,
      description: METIN[lang as Dil].urunAciklama({
        ad: `${i.ad} ${o}`,
        kategori: i.ad,
        olcu: o,
      }),
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

/**
 * Dil ana sayfası (`/tr`, `/en`, `/ru`).
 *
 * Bu sayfalarda SAYFA DÜZEYİNDE hiç yapılandırılmış veri yoktu: yalnız
 * yerleşimden gelen LocalBusiness düğümü vardı. Yani sitenin en önemli sayfası
 * makineye NE OLDUĞUNU söylemiyordu — ne katalog olduğunu, ne neyi kapsadığını.
 *
 * `ItemList` burada ürün değil GRUP listeler; bir dil modeline "bu katalogda ne
 * var" sorusunun tek isteğe cevabı budur. Kalem sayısı her grubun kendi
 * `description`ında geçer, uydurulmaz — hepsi veriden gelir.
 */
export function anaSayfaSchema(
  url: string,
  lang: string,
  baslik: string,
  aciklama: string,
  katalogAdi: string,
  gruplar: { ad: string; url: string; ozet: string }[]
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${url}#sayfa`,
    url,
    name: baslik,
    description: aciklama,
    inLanguage: lang,
    ...tarihAlani('kategori'),
    isPartOf: { '@type': 'WebSite', '@id': `${SITE_URL}/#site`, name: `${FIRMA.ad} ${katalogAdi}` },
    about: { '@id': ISLETME_ID },
    provider: { '@id': ISLETME_ID },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: gruplar.length,
      itemListElement: gruplar.map((g, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: g.ad,
        url: g.url,
        item: {
          '@type': 'CollectionPage',
          '@id': `${g.url}#sayfa`,
          name: g.ad,
          description: g.ozet,
          url: g.url,
        },
      })),
    },
  }
}
