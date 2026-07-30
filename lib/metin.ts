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
  tabloStokKodu: string
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
    tabloStokKodu: 'Stok kodu',
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
    tabloStokKodu: 'Item code',
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
    tabloStokKodu: 'Артикул',
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
  },
}
