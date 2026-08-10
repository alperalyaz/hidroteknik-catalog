import type { Dil } from './site'

/**
 * Arayüz metinleri (chrome) — kategori içeriği değil, her sayfada tekrar eden
 * sabit etiketler. Kategori metinleri (ad/h1/ozet/giris/sss) data/kategoriler*.json
 * dosyalarından gelir; bkz. lib/veri.ts.
 */
export type Metin = {
  urunKatalogu: string
  iletisim: string
  haftaIci: string
  cumartesi: string
  urunGruplari: string
  kurumsal: string
  denizliHidrolik: string
  hidrolikHesaplayici: string
  anaSiteLinkEtiketi: string
  footerAlt: (kurulus: string) => string
  anaSayfaBaslik: string
  anaSayfaOzet: (kurulus: string, toplam: string) => string
  rozetKurulus: (kurulus: string) => string
  rozetPreslemeYerinde: string
  rozetAyniGunTeklif: string
  nedenBaslik: string
  nedenP1: string
  nedenP2: string
  nedenP3: (anaSite: string, hesapla: string) => string
  bulamadinizBaslik: string
  bulamadinizMetin: string
  kalem: string
  kirintiKatalog: string
  rozetStokta: (toplam: string) => string
  rozetSevkiyat: string
  rozetTeklifUzerine: string
  markalarStandartlarBaslik: string
  markaAramaNotu: (adKucuk: string) => string
  profilBaslik: string
  profilTabloProfil: string
  profilTabloYer: string
  profilTabloOlcu: string
  profilTabloOrnek: string
  profilOlcuBirimi: string
  ornekBaslik: (ad: string) => string
  tabloUrun: string
  tabloMarka: string
  tabloModel: string
  tabloUreticiKodu: string
  /**
   * JSON-LD `Product.description`. Google Merchant listings bu alanı istiyor ve
   * eksikliğini Search Console "Missing field description" diye raporluyor
   * (02.08.2026). Metin UYDURULMAZ — yalnız elimizdeki gerçek alanlardan
   * (kategori, marka, ölçü, üretici kodu) kurulur; olmayan alan cümleye hiç
   * girmez. Fiyat yazılmaz, "teklif üzerine" denir; katalog fiyat yayımlamaz.
   */
  urunAciklama: (p: {
    ad: string
    kategori: string
    marka?: string
    olcu?: string
    ureticiKodu?: string
  }) => string
  ornekAltNot: (toplam: string, adKucuk: string) => string
  sssBaslik: string
  teklifBaslik: (ad: string) => string
  teklifMetin: string
  teklifEposta: string
  teklifKonu: (ad: string) => string
  digerGruplarBaslik: string
  // — Profil kodu sayfası (/[lang]/profil/[kod]) —
  profilKirinti: string
  profilSayfaH1: (kod: string) => string
  profilSayfaBaslik: (kod: string) => string
  profilSayfaOzet: (kod: string, adet: string, yer: string) => string
  profilRozetOlcu: (adet: string) => string
  profilRozetYer: (yer: string) => string
  profilRozetPu: string
  profilIslevBilinmiyor: string
  profilNasilOkunurBaslik: string
  profilNasilOkunur: string
  profilCapAraligi: (min: string, max: string) => string
  profilOlcuTabloBaslik: (kod: string) => string
  profilTabloKod: string
  profilTabloOlcuBasligi: string
  profilTabloMalzeme: string
  profilListeNotTam: (adet: string) => string
  profilListeNotKismi: (gosterilen: string, adet: string) => string
  profilOlcuYok: string
  profilDigerBaslik: string
  profilKategoriDon: string
  profilYerMil: string
  profilYerPiston: string
  profilYerIkisi: string
  // — Marka sayfası (/[lang]/marka/[slug]) —
  markaKirinti: string
  markaSayfaBaslik: (ad: string) => string
  markaRozetKalem: (adet: string) => string
  /** n: ham sayı (çoğul eki için), gosterim: dile göre biçimlenmiş hâli. */
  markaRozetGrup: (n: number, gosterim: string) => string
  markaGruplarBaslik: (ad: string) => string
  markaOrneklerBaslik: (ad: string) => string
  markaProfilNotu: string
  markaDigerBaslik: string
  markaTumKatalog: string
  // — Teknik rehber sayfası (/[lang]/rehber/[slug]) —
  rehberKirinti: string
  rehberRozet: string
  rehberIlgiliBaslik: string
  rehberDigerBaslik: string
  rehberSssBaslik: string
  rehberlerBaslik: string
  // — Üretici kod listesi (kategori sayfasında bölüm) —
  kodBaslik: (marka: string) => string
  kodGiris: (marka: string, desen: string, ornek: string) => string
  kodSeriBaslik: (marka: string, seri: string) => string
  kodStokNotu: (adet: string) => string
  kodTamMatris: (cap: string, strok: string) => string
  kodSeyrekMatris: (adet: string) => string
  kodTipBaslik: string
  kodCapBaslik: string
  kodStrokBaslik: string
  kodListeBaslik: (adet: string) => string
  kodAltNot: string
  // — Silindir yedek parça sayfası (/[lang]/silindir-parca/[slug]) —
  parcaKirinti: string
  parcaH1: (ad: string) => string
  parcaOzet: (ad: string, adet: string, capMin: string, capMax: string) => string
  parcaRozetOlcu: (adet: string) => string
  parcaRozetCap: (min: string, max: string) => string
  parcaOlcuBaslik: string
  parcaTabloCap: string
  parcaTabloMil: string
  parcaTabloDis: string
  parcaEksenNotu: (eksen: 'capMil' | 'capDis') => string
  parcaContaBaslik: string
  parcaContaMetin: string
  parcaDigerBaslik: string
  parcaListeBaslik: string
  parcaListeOzet: string
  parcaKodNotu: string
  parcaSilindirLink: string
  // — Landing yeniden düzeni (aile başlıkları, sayaç şeridi, yaklaşım hücreleri) —
  aileHat: string
  aileGuc: string
  aileSilindir: string
  ailePnomatik: string
  heroTeklifBtn: string
  heroGruplarBtn: string
  seritGrup: string
  seritSilindir: string
  seritProfil: string
  seritMarka: string
  notGruplar: string
  notSilindir: string
  notProfil: string
  notRehber: string
  notMarka: string
  basYaklasim: string
  yaklasim1Bas: string
  yaklasim1Metin: string
  yaklasim2Bas: string
  yaklasim2Metin: string
  yaklasim3Bas: string
  yaklasim3Metin: string
  yaklasim3Etiket: string
  ftKunye: string
}

export const METIN: Record<Dil, Metin> = {
  tr: {
    urunKatalogu: 'Ürün Kataloğu',
    iletisim: 'İletişim',
    haftaIci: 'Hafta içi',
    cumartesi: 'Cumartesi',
    urunGruplari: 'Ürün grupları',
    kurumsal: 'Kurumsal',
    denizliHidrolik: 'Denizli hidrolik',
    hidrolikHesaplayici: 'Hidrolik hesaplayıcı',
    anaSiteLinkEtiketi: 'hidroteknik.com.tr',
    footerAlt: (kurulus) =>
      `${kurulus}’ten beri endüstriyel hidrolik ve pnömatik malzeme tedariki · Türkiye geneli sevkiyat ve ihracat`,
    anaSayfaBaslik: 'Hidrolik ve pnömatik ürün kataloğu',
    anaSayfaOzet: (kurulus, toplam) =>
      `${kurulus}’ten beri endüstriyel hidrolik ve pnömatik malzeme tedarik ediyoruz. Aşağıdaki ürün gruplarında toplam ${toplam} kalem stok; Türkiye geneline sevkiyat ve ihracat.`,
    rozetKurulus: (kurulus) => `${kurulus}’ten beri`,
    rozetPreslemeYerinde: 'Hortum presleme yerinde',
    rozetAyniGunTeklif: 'Aynı gün teklif',
    nedenBaslik: 'Neden Hidroteknik?',
    nedenP1:
      'Endüstriyel hidrolikte doğru parçayı bulmak, çoğu zaman kataloğu taramaktan değil, ölçüyü ve diş tipini doğru okumaktan geçer. Metrik, BSP, BSPT ve ORFS dişler gözle birbirine benzer; yanlış eşleştirilen bağlantı ilk basınçta sızdırır.',
    nedenP2:
      'Bu yüzden satış ekibimiz yalnızca stok kodu okumaz: elinizdeki parçanın fotoğrafından veya ölçüsünden doğru muadili belirler. Hortum presleme işlemi kendi tesisimizde yapıldığı için standart ölçülerde teslim genellikle aynı gün gerçekleşir.',
    nedenP3: (anaSite, hesapla) =>
      `Hidrolik hesaplamalarınız için <a href="${hesapla}">ücretsiz hesaplayıcımızı</a> ve kurumsal bilgiler için <a href="${anaSite}">hidroteknik.com.tr</a> adresini kullanabilirsiniz.`,
    bulamadinizBaslik: 'Aradığınız ürünü bulamadınız mı?',
    bulamadinizMetin:
      'Katalogda görünen kalemler stoğumuzun bir bölümüdür. İhtiyacınızı iletin; stokta yoksa tedarik süresiyle birlikte bilgi verelim.',
    kalem: 'kalem',
    kirintiKatalog: 'Katalog',
    rozetStokta: (toplam) => `${toplam} kalem stokta`,
    rozetSevkiyat: 'Türkiye geneli sevkiyat',
    rozetTeklifUzerine: 'Teklif üzerine satış',
    markalarStandartlarBaslik: 'Stoktaki markalar ve standartlar',
    markaAramaNotu: (adKucuk) =>
      `Listede olmayan bir marka soruyorsanız da arayın: ${adKucuk} grubunda ürünler standarda göre üretilir, aynı standardı taşıyan farklı markalar birbirinin muadilidir.`,
    profilBaslik: 'Stoktaki profil kodları',
    profilTabloProfil: 'Profil',
    profilTabloYer: 'Takıldığı yer',
    profilTabloOlcu: 'Stoktaki ölçü',
    profilTabloOrnek: 'Örnek kalem',
    profilOlcuBirimi: 'ölçü',
    ornekBaslik: (ad) => `Stoktaki ${ad.toLocaleLowerCase('tr')} çeşitlerinden örnekler`,
    tabloUrun: 'Ürün',
    tabloMarka: 'Marka',
    tabloModel: 'Model / ölçü',
    tabloUreticiKodu: 'Üretici kodu',
    urunAciklama: ({ ad, kategori, marka, olcu, ureticiKodu }) =>
      [
        `${kategori} grubunda ${ad}.`,
        marka ? `Marka: ${marka}.` : '',
        olcu ? `Ölçü/model: ${olcu}.` : '',
        ureticiKodu ? `Üretici kodu: ${ureticiKodu}.` : '',
        'Hidroteknik Denizli stoğundan tedarik edilir; fiyat teklif üzerine verilir.',
      ]
        .filter(Boolean)
        .join(' '),
    ornekAltNot: (toplam, adKucuk) =>
      `Liste, en çok hareket gören kalemlere göre sıralanmıştır ve ${toplam} kalemlik ${adKucuk} stoğumuzun tamamı değildir. Aradığınız ölçü listede yoksa büyük olasılıkla stoğumuzda vardır — lütfen sorunuz.`,
    sssBaslik: 'Sık sorulan sorular',
    teklifBaslik: (ad) => `${ad} için teklif alın`,
    teklifMetin:
      'Ölçü ve adet bilgisini iletin, satış ekibimiz aynı gün içinde fiyat ve termin bilgisiyle dönüş yapsın. Emin olamadığınız ölçüde mevcut parçanızın fotoğrafını göndermeniz yeterli.',
    teklifEposta: 'E-posta ile teklif iste',
    teklifKonu: (ad) => `${ad} teklif talebi`,
    digerGruplarBaslik: 'Diğer ürün grupları',
    profilKirinti: 'Profil kodları',
    profilSayfaH1: (kod) => `Kastaş ${kod} Keçe Ölçüleri`,
    profilSayfaBaslik: (kod) => `Kastaş ${kod} — stoktaki ölçüler ve muadil arama`,
    profilSayfaOzet: (kod, adet, yer) =>
      `Kastaş ${kod} profilinde ${adet} ölçü stokta. ${yer} tarafına takılır. Aradığınız ölçü listede yoksa da sorun — Kastaş kataloğundaki diğer ölçüleri temin ediyoruz.`,
    profilRozetOlcu: (adet) => `${adet} ölçü stokta`,
    profilRozetYer: (yer) => `${yer} tarafı`,
    profilRozetPu: 'Poliüretan (PU) seçeneği var',
    profilIslevBilinmiyor:
      'Bu profilin işlevi Kastaş kataloğundan doğrulanamadı, o yüzden boş bırakıldı. Takıldığı yer aşağıdaki ölçü sırasından okunmuştur.',
    profilNasilOkunurBaslik: 'Ölçü nasıl okunur?',
    profilNasilOkunur:
      'Sızdırmazlık elemanının ölçüsü üç sayıyla verilir. Mil tarafına takılan elemanlarda sıra iç çap × dış çap × yükseklik, piston tarafına takılanlarda dış çap × iç çap × yükseklik biçimindedir — yani sayı sırası elemanın nereye oturduğunu da söyler. 7/5 gibi bölmeli üçüncü sayı, çift dudaklı sıyırıcılarda iki dudağın yüksekliğidir.',
    profilCapAraligi: (min, max) => `Stoktaki ölçüler Ø${min} ile Ø${max} arasındadır.`,
    profilOlcuTabloBaslik: (kod) => `${kod} ölçü listesi`,
    profilTabloKod: 'Stok kodu',
    profilTabloOlcuBasligi: 'Ölçü (mm)',
    profilTabloMalzeme: 'Malzeme',
    profilListeNotTam: (adet) => `Bu profildeki ${adet} ölçünün tamamı listelenmiştir.`,
    profilListeNotKismi: (gosterilen, adet) =>
      `Bu profilde toplam ${adet} ölçü stokta; en çok hareket gören ${gosterilen} tanesi listelenmiştir. Aradığınız ölçü listede yoksa sorun — büyük olasılıkla stokta ya da kısa sürede temin edilebilir.`,
    profilOlcuYok: 'Bu profil ölçüyle değil, mil çapı ve tip harfiyle anılır.',
    profilDigerBaslik: 'Diğer profil kodları',
    profilKategoriDon: 'Tüm keçe, nutring ve sıyırıcılar',
    profilYerMil: 'Mil',
    profilYerPiston: 'Piston',
    profilYerIkisi: 'Mil ve piston',
    markaKirinti: 'Markalar',
    markaSayfaBaslik: (ad) => `${ad} — stoktaki ürünler ve ölçüler`,
    markaRozetKalem: (adet) => `${adet} kalem stokta`,
    markaRozetGrup: (_n, g) => `${g} ürün grubunda`,
    markaGruplarBaslik: (ad) => `${ad} hangi gruplarda var?`,
    markaOrneklerBaslik: (ad) => `Stoktan ${ad} örnekleri`,
    markaProfilNotu: 'Her profilin stoktaki ölçü listesi kendi sayfasındadır.',
    markaDigerBaslik: 'Diğer markalar',
    markaTumKatalog: 'Tüm ürün grupları',
    rehberKirinti: 'Teknik rehber',
    rehberRozet: 'Teknik rehber',
    rehberIlgiliBaslik: 'İlgili ürün grupları',
    rehberDigerBaslik: 'Diğer teknik rehberler',
    rehberSssBaslik: 'Sık sorulan sorular',
    rehberlerBaslik: 'Teknik rehberler',
    kodBaslik: (marka) => `${marka} üretici katalog kodları`,
    kodGiris: (marka, desen, ornek) =>
      `${marka} ürünleri sahada bizim stok kodumuzla değil, üreticinin katalog koduyla aranır. Kod şu düzendedir: ${desen} — örneğin ${ornek}. Aşağıdaki seriler stoğumuzda gerçekten bulunan serilerdir; listelenen her ölçü temin edilebilir.`,
    kodSeriBaslik: (marka, seri) => `${marka} ${seri} serisi`,
    kodStokNotu: (adet) => `Bu seride ${adet} kalem stok kartımız var.`,
    kodTamMatris: (cap, strok) =>
      `${cap} çapın her biri ${strok} strok kademesinde üretilir; aşağıdaki listede kombinasyonların tamamı vardır.`,
    kodSeyrekMatris: (adet) =>
      `Bu seride her çap her tipte ve her strokta üretilmez. Aşağıdaki ${adet} kod, gerçekten var olan ölçülerdir.`,
    kodTipBaslik: 'Tip kodları',
    kodCapBaslik: 'Çaplar (mm)',
    kodStrokBaslik: 'Stroklar (mm)',
    kodListeBaslik: (adet) => `${adet} kod`,
    kodAltNot:
      'Listedeki kodlar üreticinin katalog kodudur. Stokta olmayan ölçüler için temin süresini sorunuz — seri stoğumuzda olduğu için tedarik hızlıdır. Fiyat, teklif üzerine verilir.',
    parcaKirinti: 'Silindir yedek parça',
    parcaH1: (ad) => `Hidrolik Silindir ${ad}`,
    parcaOzet: (ad, adet, capMin, capMax) =>
      `Hidrolik silindir ${ad.toLocaleLowerCase('tr')}, Ø${capMin}–${capMax} mm gövde çapı aralığında ${adet} ölçüde. İmalat ve revizyonda kullanılır.`,
    parcaRozetOlcu: (adet) => `${adet} ölçü`,
    parcaRozetCap: (min, max) => `Ø${min}–${max} mm`,
    parcaOlcuBaslik: 'Ölçü listesi',
    parcaTabloCap: 'Gövde çapı (mm)',
    parcaTabloMil: 'Mil çapı (mm)',
    parcaTabloDis: 'Dış çap (mm)',
    parcaEksenNotu: (eksen) =>
      eksen === 'capMil'
        ? 'Ölçüler gövde çapı × mil çapı olarak yazılır: 100x50, Ø100 mm gövdede Ø50 mm mil demektir.'
        : 'Ölçüler gövde çapı × dış çap olarak yazılır: 100x115, Ø100 mm gövdeye oturan Ø115 mm dış çaplı parça demektir.',
    parcaContaBaslik: 'Keçe ve conta seti',
    parcaContaMetin:
      'Listedeki her ölçünün eşleşen keçe/conta seti vardır. Revizyonda parçanın kendisi sağlamsa çoğu zaman yalnız set değişir; ölçüyü verirseniz uygun seti çıkarırız.',
    parcaDigerBaslik: 'Diğer silindir parçaları',
    parcaListeBaslik: 'Hidrolik Silindir Yedek Parçaları',
    parcaListeOzet:
      'Silindir imalatı ve revizyonunda kullanılan parçalar, ölçü listeleriyle.',
    parcaKodNotu:
      'Ölçüsünü bilmiyorsanız parçayı getirin, tezgâhta ölçeriz. Fiyat teklif üzerine verilir.',
    parcaSilindirLink: 'Hidrolik silindir imalatı ve revizyonu',
    aileHat: 'Hat ve bağlantı',
    aileGuc: 'Güç ve kontrol',
    aileSilindir: 'Silindir ve sızdırmazlık',
    ailePnomatik: 'Pnömatik',
    heroTeklifBtn: 'Teklif isteyin',
    heroGruplarBtn: 'Ürün gruplarına gidin',
    seritGrup: 'Ürün grubu',
    seritSilindir: 'Silindir yedek parçası',
    seritProfil: 'Kastaş profil kodu',
    seritMarka: 'Marka',
    notGruplar: 'Kategoriler dört aileye ayrılmıştır: hat ve bağlantı, güç ve kontrol, silindir ve sızdırmazlık, pnömatik.',
    notSilindir: 'Silindir onarımında değişen parçalar, ölçüleriyle listelenmiştir.',
    notProfil: 'Kodu bilmiyorsanız ölçüden gidin: ölçü sırası parçanın mil tarafına mı piston tarafına mı ait olduğunu gösterir.',
    notRehber: 'Seçim ve ölçü alma üzerine kısa rehberler.',
    notMarka: 'Ürünün üzerinde yazan markalar.',
    basYaklasim: 'Bu katalog nasıl hazırlanıyor',
    yaklasim1Bas: 'Sayfalar kendi kalem listemizden üretilir',
    yaklasim1Metin:
      'Her ürün grubunun sayfasındaki örnekler, stok kayıtlarımızda bulunan kalemlerden seçilir. Fiyat ve güncel bulunurluk katalogda yer almaz.',
    yaklasim2Bas: 'Tarif değil, ölçü yayımlarız',
    yaklasim2Metin:
      'Sayfalarda parçanın ölçüsü yazar; ölçü sırasından parçanın mil tarafına mı piston tarafına mı ait olduğu okunur.',
    yaklasim3Bas: 'Doğrulayamadığımızı boş bırakırız',
    yaklasim3Metin:
      'Bir profil kodunun işlevini üretici kataloğundan doğrulayamadıysak alanı boş bırakır, nedenini sayfada yazarız.',
    yaklasim3Etiket: 'İşlev alanı boş bırakılan profil kodu',
    ftKunye: 'Ürün kataloğu · fiyat ve stok bilgisi içermez',
  },
  en: {
    urunKatalogu: 'Product Catalog',
    iletisim: 'Contact',
    haftaIci: 'Weekdays',
    cumartesi: 'Saturday',
    urunGruplari: 'Product groups',
    kurumsal: 'Company',
    denizliHidrolik: 'Denizli hydraulics',
    hidrolikHesaplayici: 'Hydraulic calculator',
    anaSiteLinkEtiketi: 'hidroteknik.com.tr',
    footerAlt: (kurulus) =>
      `Since ${kurulus}, supplying industrial hydraulic and pneumatic parts from Denizli, Turkey. We ship worldwide by air cargo — fast, reliable export to any country.`,
    anaSayfaBaslik: 'Hydraulic & pneumatic product catalog',
    anaSayfaOzet: (kurulus, toplam) =>
      `We've been supplying industrial hydraulic and pneumatic parts since ${kurulus}. The product groups below hold ${toplam} items in stock, shipped worldwide by air cargo.`,
    rozetKurulus: (kurulus) => `Since ${kurulus}`,
    rozetPreslemeYerinde: 'In-house hose crimping',
    rozetAyniGunTeklif: 'Same-day quotes',
    nedenBaslik: 'Why Hidroteknik?',
    nedenP1:
      'Finding the right part in industrial hydraulics usually comes down to reading the size and thread type correctly, not just browsing a catalog. Metric, BSP, BSPT and ORFS threads look nearly identical to the eye; the wrong match leaks the moment pressure hits it.',
    nedenP2:
      "That's why our sales team doesn't just read stock codes: we identify the correct equivalent from a photo or a measurement of the part you have. Hose crimping is done in-house, so standard sizes usually ship the same day.",
    nedenP3: (anaSite, hesapla) =>
      `Use our <a href="${hesapla}">free calculator</a> for hydraulic calculations, and <a href="${anaSite}">hidroteknik.com.tr</a> for company information.`,
    bulamadinizBaslik: "Can't find what you're looking for?",
    bulamadinizMetin:
      "The items shown in the catalog are a portion of our stock. Tell us what you need — if it's not in stock, we'll let you know the lead time.",
    kalem: 'items',
    kirintiKatalog: 'Catalog',
    rozetStokta: (toplam) => `${toplam} items in stock`,
    rozetSevkiyat: 'Worldwide shipping by air cargo',
    rozetTeklifUzerine: 'Quote-based pricing',
    markalarStandartlarBaslik: 'Brands and standards in stock',
    markaAramaNotu: (adKucuk) =>
      `Don't see the brand you're after? Ask anyway — ${adKucuk} products are made to standard, so different brands carrying the same standard are equivalents.`,
    profilBaslik: 'Profile codes in stock',
    profilTabloProfil: 'Profile',
    profilTabloYer: 'Fits on',
    profilTabloOlcu: 'Sizes in stock',
    profilTabloOrnek: 'Example item',
    profilOlcuBirimi: 'sizes',
    ornekBaslik: (ad) => `${ad} in stock — examples`,
    tabloUrun: 'Product',
    tabloMarka: 'Brand',
    tabloModel: 'Model / size',
    tabloUreticiKodu: 'Manufacturer code',
    urunAciklama: ({ ad, kategori, marka, olcu, ureticiKodu }) =>
      [
        `${ad}, in the ${kategori} group.`,
        marka ? `Brand: ${marka}.` : '',
        olcu ? `Size/model: ${olcu}.` : '',
        ureticiKodu ? `Manufacturer code: ${ureticiKodu}.` : '',
        'Supplied from Hidroteknik stock in Denizli, Türkiye; price on request.',
      ]
        .filter(Boolean)
        .join(' '),
    ornekAltNot: (toplam, adKucuk) =>
      `This list is sorted by our highest-moving items and isn't the whole of our ${toplam}-item ${adKucuk} stock. If the size you need isn't listed, we very likely have it — just ask.`,
    sssBaslik: 'Frequently asked questions',
    teklifBaslik: (ad) => `Get a quote for ${ad}`,
    teklifMetin:
      "Send us the size and quantity you need and our sales team will get back to you the same day with pricing and lead time. If you're not sure of the size, a photo of the part you have is enough.",
    teklifEposta: 'Request a quote by email',
    teklifKonu: (ad) => `Quote request: ${ad}`,
    digerGruplarBaslik: 'Other product groups',
    profilKirinti: 'Profile codes',
    profilSayfaH1: (kod) => `Kastaş ${kod} Seal Sizes`,
    profilSayfaBaslik: (kod) => `Kastaş ${kod} — sizes in stock and cross-reference`,
    profilSayfaOzet: (kod, adet, yer) =>
      `${adet} sizes of the Kastaş ${kod} profile are in stock. It fits on the ${yer} side. If the size you need is not listed, ask anyway — we supply the other sizes in the Kastaş catalogue.`,
    profilRozetOlcu: (adet) => `${adet} sizes in stock`,
    profilRozetYer: (yer) => `${yer} side`,
    profilRozetPu: 'Polyurethane (PU) option available',
    profilIslevBilinmiyor:
      'The function of this profile could not be verified against the Kastaş catalogue, so it has been left blank. The mounting side below is read from the order of the dimensions.',
    profilNasilOkunurBaslik: 'How to read the size',
    profilNasilOkunur:
      'A seal size is given as three numbers. On elements fitted to the rod the order is inner diameter × outer diameter × height; on elements fitted to the piston it is outer diameter × inner diameter × height — so the order of the numbers itself tells you where the element sits. A divided third number such as 7/5 gives the heights of the two lips on double-lip wipers.',
    profilCapAraligi: (min, max) => `Sizes in stock range from Ø${min} to Ø${max}.`,
    profilOlcuTabloBaslik: (kod) => `${kod} size list`,
    profilTabloKod: 'Stock code',
    profilTabloOlcuBasligi: 'Size (mm)',
    profilTabloMalzeme: 'Material',
    profilListeNotTam: (adet) => `All ${adet} sizes in this profile are listed.`,
    profilListeNotKismi: (gosterilen, adet) =>
      `${adet} sizes of this profile are in stock in total; the ${gosterilen} most frequently supplied are listed. If the size you need is not shown, ask — it is most likely in stock or available at short notice.`,
    profilOlcuYok: 'This profile is identified by rod diameter and type letter rather than by a size triplet.',
    profilDigerBaslik: 'Other profile codes',
    profilKategoriDon: 'All seals, nutrings and wipers',
    profilYerMil: 'rod',
    profilYerPiston: 'piston',
    profilYerIkisi: 'rod and piston',
    markaKirinti: 'Brands',
    markaSayfaBaslik: (ad) => `${ad} — products and sizes in stock`,
    markaRozetKalem: (adet) => `${adet} items in stock`,
    markaRozetGrup: (n, g) => (n === 1 ? `in ${g} product group` : `across ${g} product groups`),
    markaGruplarBaslik: (ad) => `Which groups carry ${ad}?`,
    markaOrneklerBaslik: (ad) => `${ad} examples from stock`,
    markaProfilNotu: 'Each profile has its own page listing the sizes in stock.',
    markaDigerBaslik: 'Other brands',
    markaTumKatalog: 'All product groups',
    rehberKirinti: 'Technical guides',
    rehberRozet: 'Technical guide',
    rehberIlgiliBaslik: 'Related product groups',
    rehberDigerBaslik: 'Other technical guides',
    rehberSssBaslik: 'Frequently asked questions',
    rehberlerBaslik: 'Technical guides',
    kodBaslik: (marka) => `${marka} manufacturer part numbers`,
    kodGiris: (marka, desen, ornek) =>
      `${marka} products are searched for in the field by the manufacturer's part number, not by our stock code. The code follows this pattern: ${desen} — for example ${ornek}. The series below are ones we genuinely hold in stock; every size listed can be supplied.`,
    kodSeriBaslik: (marka, seri) => `${marka} ${seri} series`,
    kodStokNotu: (adet) => `We hold ${adet} stock items in this series.`,
    kodTamMatris: (cap, strok) =>
      `Each of the ${cap} bores is produced in ${strok} stroke steps; the list below contains every combination.`,
    kodSeyrekMatris: (adet) =>
      `In this series not every bore is produced in every type and stroke. The ${adet} codes below are the sizes that actually exist.`,
    kodTipBaslik: 'Type codes',
    kodCapBaslik: 'Bores (mm)',
    kodStrokBaslik: 'Strokes (mm)',
    kodListeBaslik: (adet) => `${adet} codes`,
    kodAltNot:
      "The codes listed are the manufacturer's own part numbers. For sizes not held in stock, ask for the lead time — supply is quick because we carry the series. Prices are given on quotation.",
    parcaKirinti: 'Cylinder spare parts',
    parcaH1: (ad) => `Hydraulic Cylinder ${ad}`,
    parcaOzet: (ad, adet, capMin, capMax) =>
      `Hydraulic cylinder ${ad.toLowerCase()}, in ${adet} sizes across a Ø${capMin}–${capMax} mm bore range. Used in manufacturing and rebuilds.`,
    parcaRozetOlcu: (adet) => `${adet} sizes`,
    parcaRozetCap: (min, max) => `Ø${min}–${max} mm`,
    parcaOlcuBaslik: 'Size list',
    parcaTabloCap: 'Bore (mm)',
    parcaTabloMil: 'Rod dia. (mm)',
    parcaTabloDis: 'Outer dia. (mm)',
    parcaEksenNotu: (eksen) =>
      eksen === 'capMil'
        ? 'Sizes are written as bore × rod diameter: 100x50 means a Ø50 mm rod in a Ø100 mm bore.'
        : 'Sizes are written as bore × outer diameter: 100x115 means a part of Ø115 mm outer diameter seating on a Ø100 mm bore.',
    parcaContaBaslik: 'Seal and gasket set',
    parcaContaMetin:
      'Every size on the list has a matching seal/gasket set. In a rebuild, if the part itself is sound, usually only the set is replaced — give us the size and we will pull the right one.',
    parcaDigerBaslik: 'Other cylinder parts',
    parcaListeBaslik: 'Hydraulic Cylinder Spare Parts',
    parcaListeOzet:
      'Parts used in cylinder manufacturing and rebuilds, with their size lists.',
    parcaKodNotu:
      'If you do not know the size, bring the part in and we will measure it. Prices are given on quotation.',
    parcaSilindirLink: 'Hydraulic cylinder manufacturing and rebuilds',
    aileHat: 'Lines and fittings',
    aileGuc: 'Power and control',
    aileSilindir: 'Cylinders and sealing',
    ailePnomatik: 'Pneumatics',
    heroTeklifBtn: 'Request a quote',
    heroGruplarBtn: 'Browse product groups',
    seritGrup: 'Product groups',
    seritSilindir: 'Cylinder spare parts',
    seritProfil: 'Kastaş profile codes',
    seritMarka: 'Brands',
    notGruplar: 'The categories are split into four families: lines and fittings, power and control, cylinders and sealing, pneumatics.',
    notSilindir: 'The parts replaced when a cylinder is overhauled, listed with their dimensions.',
    notProfil: "If you don't know the code, work from the dimensions: their order shows whether the part belongs on the rod side or the piston side.",
    notRehber: 'Short guides on selection and taking measurements.',
    notMarka: 'The brands printed on the products themselves.',
    basYaklasim: 'How this catalogue is put together',
    yaklasim1Bas: 'Pages are generated from our own item list',
    yaklasim1Metin:
      'The examples on each product-group page are drawn from items in our stock records. Prices and current availability are not published in the catalogue.',
    yaklasim2Bas: 'We publish dimensions, not descriptions',
    yaklasim2Metin:
      "Pages carry the part's dimensions; the order of those dimensions shows whether it belongs on the rod side or the piston side.",
    yaklasim3Bas: 'What we cannot verify, we leave blank',
    yaklasim3Metin:
      "If we cannot confirm a profile code's function against the manufacturer's catalogue, we leave the field empty and say so on the page.",
    yaklasim3Etiket: 'Profile codes with an empty function field',
    ftKunye: 'Product catalogue · contains no prices or stock levels',
  },
  ru: {
    urunKatalogu: 'Каталог продукции',
    iletisim: 'Контакты',
    haftaIci: 'Будни',
    cumartesi: 'Суббота',
    urunGruplari: 'Группы товаров',
    kurumsal: 'О компании',
    denizliHidrolik: 'Denizli — гидравлика',
    hidrolikHesaplayici: 'Гидравлический калькулятор',
    anaSiteLinkEtiketi: 'hidroteknik.com.tr',
    footerAlt: (kurulus) =>
      `С ${kurulus} года поставляем промышленные гидравлические и пневматические комплектующие из Denizli, Турция. Отправляем заказы по всему миру авиакарго — быстрая и надёжная доставка в любую страну.`,
    anaSayfaBaslik: 'Каталог гидравлической и пневматической продукции',
    anaSayfaOzet: (kurulus, toplam) =>
      `Поставляем промышленные гидравлические и пневматические комплектующие с ${kurulus} года. В группах товаров ниже — ${toplam} позиций на складе, доставка по всему миру авиакарго.`,
    rozetKurulus: (kurulus) => `С ${kurulus} года`,
    rozetPreslemeYerinde: 'Опрессовка рукавов на месте',
    rozetAyniGunTeklif: 'Предложение в тот же день',
    nedenBaslik: 'Почему Hidroteknik?',
    nedenP1:
      'В промышленной гидравлике найти нужную деталь — это чаще всего вопрос правильного определения размера и типа резьбы, а не просто поиска по каталогу. Метрическая, BSP, BSPT и ORFS резьбы визуально похожи; неверно подобранное соединение потечёт при первом же давлении.',
      nedenP2:
      'Поэтому наш отдел продаж не просто считывает артикул: мы определяем правильный аналог по фотографии или размеру детали, которая у вас есть. Опрессовка рукавов выполняется на нашем собственном оборудовании, поэтому стандартные размеры обычно отгружаются в тот же день.',
    nedenP3: (anaSite, hesapla) =>
      `Для гидравлических расчётов используйте наш <a href="${hesapla}">бесплатный калькулятор</a>, а для информации о компании — <a href="${anaSite}">hidroteknik.com.tr</a>.`,
    bulamadinizBaslik: 'Не нашли то, что искали?',
    bulamadinizMetin:
      'Товары, показанные в каталоге, — лишь часть нашего склада. Сообщите, что вам нужно; если позиции нет в наличии, мы сообщим срок поставки.',
    kalem: 'позиций',
    kirintiKatalog: 'Каталог',
    rozetStokta: (toplam) => `${toplam} поз. в наличии`,
    rozetSevkiyat: 'Доставка по всему миру авиакарго',
    rozetTeklifUzerine: 'Цена по запросу',
    markalarStandartlarBaslik: 'Бренды и стандарты в наличии',
    markaAramaNotu: (adKucuk) =>
      `Не нашли нужный бренд в списке? Всё равно спросите: товары группы «${adKucuk}» изготавливаются по стандарту, поэтому разные бренды, соответствующие одному стандарту, взаимозаменяемы.`,
    profilBaslik: 'Коды профилей в наличии',
    profilTabloProfil: 'Профиль',
    profilTabloYer: 'Место установки',
    profilTabloOlcu: 'Размеров в наличии',
    profilTabloOrnek: 'Пример позиции',
    profilOlcuBirimi: 'размеров',
    ornekBaslik: (ad) => `Примеры товаров «${ad}» в наличии`,
    tabloUrun: 'Товар',
    tabloMarka: 'Бренд',
    tabloModel: 'Модель / размер',
    tabloUreticiKodu: 'Код производителя',
    urunAciklama: ({ ad, kategori, marka, olcu, ureticiKodu }) =>
      [
        `${ad} — группа «${kategori}».`,
        marka ? `Бренд: ${marka}.` : '',
        olcu ? `Размер/модель: ${olcu}.` : '',
        ureticiKodu ? `Код производителя: ${ureticiKodu}.` : '',
        'Поставляется со склада Hidroteknik в Денизли (Турция); цена по запросу.',
      ]
        .filter(Boolean)
        .join(' '),
    ornekAltNot: (toplam, adKucuk) =>
      `Список отсортирован по наиболее ходовым позициям и не отражает весь наш ассортимент «${adKucuk}» — ${toplam} позиций. Если нужного размера нет в списке, он, скорее всего, есть на складе — просто спросите.`,
    sssBaslik: 'Часто задаваемые вопросы',
    teklifBaslik: (ad) => `Запросить предложение: ${ad}`,
    teklifMetin:
      'Сообщите размер и количество — наш отдел продаж ответит в тот же день с ценой и сроком поставки. Если не уверены в размере, достаточно фотографии имеющейся детали.',
    teklifEposta: 'Запросить предложение по e-mail',
    teklifKonu: (ad) => `Запрос предложения: ${ad}`,
    digerGruplarBaslik: 'Другие группы товаров',
    profilKirinti: 'Коды профилей',
    profilSayfaH1: (kod) => `Размеры уплотнений Kastaş ${kod}`,
    profilSayfaBaslik: (kod) => `Kastaş ${kod} — размеры в наличии и подбор аналогов`,
    profilSayfaOzet: (kod, adet, yer) =>
      `В наличии ${adet} размеров профиля Kastaş ${kod}. Устанавливается со стороны: ${yer}. Если нужного размера нет в списке, всё равно спросите — мы поставляем и остальные размеры из каталога Kastaş.`,
    profilRozetOlcu: (adet) => `${adet} размеров в наличии`,
    profilRozetYer: (yer) => `сторона: ${yer}`,
    profilRozetPu: 'Есть вариант из полиуретана (PU)',
    profilIslevBilinmiyor:
      'Назначение этого профиля не удалось подтвердить по каталогу Kastaş, поэтому поле оставлено пустым. Сторона установки ниже определена по порядку размеров.',
    profilNasilOkunurBaslik: 'Как читается размер',
    profilNasilOkunur:
      'Размер уплотнения задаётся тремя числами. У элементов, устанавливаемых на шток, порядок такой: внутренний диаметр × наружный диаметр × высота; у элементов на поршень — наружный диаметр × внутренний диаметр × высота. То есть сам порядок чисел говорит, куда садится элемент. Третье число с дробью, например 7/5, у двухкромочных грязесъёмников означает высоты двух кромок.',
    profilCapAraligi: (min, max) => `Размеры в наличии — от Ø${min} до Ø${max}.`,
    profilOlcuTabloBaslik: (kod) => `Список размеров ${kod}`,
    profilTabloKod: 'Складской код',
    profilTabloOlcuBasligi: 'Размер (мм)',
    profilTabloMalzeme: 'Материал',
    profilListeNotTam: (adet) => `Перечислены все ${adet} размеров этого профиля.`,
    profilListeNotKismi: (gosterilen, adet) =>
      `Всего в наличии ${adet} размеров этого профиля; перечислены ${gosterilen} наиболее востребованных. Если нужного размера нет в списке, спросите — скорее всего он есть на складе или доступен в короткий срок.`,
    profilOlcuYok: 'Этот профиль обозначается диаметром штока и буквой типа, а не тройкой размеров.',
    profilDigerBaslik: 'Другие коды профилей',
    profilKategoriDon: 'Все уплотнения, нутринги и грязесъёмники',
    profilYerMil: 'шток',
    profilYerPiston: 'поршень',
    profilYerIkisi: 'шток и поршень',
    markaKirinti: 'Бренды',
    markaSayfaBaslik: (ad) => `${ad} — товары и размеры в наличии`,
    markaRozetKalem: (adet) => `${adet} позиций в наличии`,
    markaRozetGrup: (n, g) => (n === 1 ? `в ${g} группе товаров` : `в ${g} группах товаров`),
    markaGruplarBaslik: (ad) => `В каких группах есть ${ad}?`,
    markaOrneklerBaslik: (ad) => `Примеры ${ad} со склада`,
    markaProfilNotu: 'Список размеров каждого профиля — на его отдельной странице.',
    markaDigerBaslik: 'Другие бренды',
    markaTumKatalog: 'Все группы товаров',
    rehberKirinti: 'Технические руководства',
    rehberRozet: 'Техническое руководство',
    rehberIlgiliBaslik: 'Связанные группы товаров',
    rehberDigerBaslik: 'Другие технические руководства',
    rehberSssBaslik: 'Часто задаваемые вопросы',
    rehberlerBaslik: 'Технические руководства',
    kodBaslik: (marka) => `Каталожные коды производителя ${marka}`,
    kodGiris: (marka, desen, ornek) =>
      `Продукцию ${marka} на практике ищут не по нашему складскому коду, а по каталожному коду производителя. Код построен так: ${desen} — например, ${ornek}. Перечисленные ниже серии мы действительно держим на складе; любой указанный размер может быть поставлен.`,
    kodSeriBaslik: (marka, seri) => `${marka}, серия ${seri}`,
    kodStokNotu: (adet) => `По этой серии у нас ${adet} складских позиций.`,
    kodTamMatris: (cap, strok) =>
      `Каждый из ${cap} диаметров выпускается в ${strok} ступенях хода; в списке ниже приведены все комбинации.`,
    kodSeyrekMatris: (adet) =>
      `В этой серии не каждый диаметр выпускается в каждом типе и ходе. Приведённые ниже ${adet} кодов — реально существующие размеры.`,
    kodTipBaslik: 'Коды типов',
    kodCapBaslik: 'Диаметры (мм)',
    kodStrokBaslik: 'Ходы (мм)',
    kodListeBaslik: (adet) => `${adet} кодов`,
    kodAltNot:
      'Приведённые коды — каталожные номера самого производителя. По размерам, которых нет на складе, уточняйте срок поставки: серия у нас есть, поэтому поставка быстрая. Цена — по запросу.',
    parcaKirinti: 'Запчасти для цилиндров',
    parcaH1: (ad) => `${ad} гидроцилиндра`,
    parcaOzet: (ad, adet, capMin, capMax) =>
      `${ad} гидроцилиндра — ${adet} типоразмеров в диапазоне диаметров Ø${capMin}–${capMax} мм. Применяется при изготовлении и ремонте.`,
    parcaRozetOlcu: (adet) => `${adet} типоразмеров`,
    parcaRozetCap: (min, max) => `Ø${min}–${max} мм`,
    parcaOlcuBaslik: 'Список типоразмеров',
    parcaTabloCap: 'Диаметр корпуса (мм)',
    parcaTabloMil: 'Диаметр штока (мм)',
    parcaTabloDis: 'Наружный диаметр (мм)',
    parcaEksenNotu: (eksen) =>
      eksen === 'capMil'
        ? 'Размеры указываются как диаметр корпуса × диаметр штока: 100x50 — шток Ø50 мм в корпусе Ø100 мм.'
        : 'Размеры указываются как диаметр корпуса × наружный диаметр: 100x115 — деталь наружным диаметром Ø115 мм на корпус Ø100 мм.',
    parcaContaBaslik: 'Комплект манжет и уплотнений',
    parcaContaMetin:
      'Для каждого размера из списка есть соответствующий комплект манжет/уплотнений. При ремонте, если сама деталь цела, обычно меняют только комплект — сообщите размер, и мы подберём нужный.',
    parcaDigerBaslik: 'Другие детали цилиндра',
    parcaListeBaslik: 'Запасные части гидроцилиндров',
    parcaListeOzet:
      'Детали, применяемые при изготовлении и ремонте цилиндров, со списками типоразмеров.',
    parcaKodNotu:
      'Если размер неизвестен — привезите деталь, мы обмерим её на станке. Цена по запросу.',
    parcaSilindirLink: 'Изготовление и ремонт гидроцилиндров',
    aileHat: 'Магистрали и соединения',
    aileGuc: 'Привод и управление',
    aileSilindir: 'Цилиндры и уплотнения',
    ailePnomatik: 'Пневматика',
    heroTeklifBtn: 'Запросить предложение',
    heroGruplarBtn: 'К товарным группам',
    seritGrup: 'Товарные группы',
    seritSilindir: 'Запчасти для гидроцилиндров',
    seritProfil: 'Коды профилей Kastaş',
    seritMarka: 'Бренды',
    notGruplar: 'Категории разделены на четыре группы: магистрали и соединения, привод и управление, цилиндры и уплотнения, пневматика.',
    notSilindir: 'Детали, заменяемые при ремонте гидроцилиндра, приведены с размерами.',
    notProfil: 'Если код неизвестен, ориентируйтесь по размерам: их порядок показывает, относится деталь к стороне штока или поршня.',
    notRehber: 'Краткие руководства по подбору и снятию размеров.',
    notMarka: 'Бренды, нанесённые на саму продукцию.',
    basYaklasim: 'Как составлен этот каталог',
    yaklasim1Bas: 'Страницы формируются из нашего перечня позиций',
    yaklasim1Metin:
      'Примеры на странице каждой товарной группы взяты из позиций нашего складского учёта. Цены и текущее наличие в каталоге не публикуются.',
    yaklasim2Bas: 'Мы публикуем размеры, а не описания',
    yaklasim2Metin:
      'На страницах указаны размеры детали; по их порядку видно, относится она к стороне штока или поршня.',
    yaklasim3Bas: 'Чего не можем подтвердить — оставляем пустым',
    yaklasim3Metin:
      'Если назначение кода профиля не удаётся подтвердить по каталогу производителя, поле остаётся пустым, и на странице указано почему.',
    yaklasim3Etiket: 'Коды профилей с незаполненным полем назначения',
    ftKunye: 'Каталог продукции · не содержит цен и сведений о наличии',
  },
}
