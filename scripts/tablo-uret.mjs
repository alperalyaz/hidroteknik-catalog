/**
 * Kategori sayfalarına gömülen TEKNİK TABLOLARI üretir.
 *
 *   npm run tablo            kuru çalıştırma
 *   npm run tablo -- --uygula
 *
 * ── NEDEN SCRIPT, NEDEN ELLE YAZILMIYOR ────────────────────────────────────
 * Tablodaki sayılar HESAPLANMIŞ değerlerdir, görüş değil. Elle yazılırsa üç dil
 * dosyasında üç ayrı kopya olur ve biri düzeltilip diğeri unutulur — bu projede
 * daha önce tam olarak bu oldu (bkz. CLAUDE.md "Desen TEK KOPYA olmak zorunda").
 * Burada tek kaynak fizik, üç dil ondan türetilir.
 *
 * Yanlış sayı taşıyan teknik tablo, tablo olmamasından kötüdür: okuyan kişi
 * ona göre silindir seçer.
 *
 * ── BİNLİK AYRACI ──────────────────────────────────────────────────────────
 * TR 1.180 · EN 1,180 · RU 1 180 (kırılmaz boşluk). Üç dosyaya AYRI biçimde
 * yazılır; tek biçim kopyalansa `npm run denetle`nin yedinci adımı yakalar.
 */
import { readFileSync, writeFileSync } from 'node:fs'

const UYGULA = process.argv.includes('--uygula')
const DOSYA = { tr: 'data/kategoriler.json', en: 'data/kategoriler.en.json', ru: 'data/kategoriler.ru.json' }
const BICIM = { tr: 'tr-TR', en: 'en-US', ru: 'ru-RU' }

/** Şebeke basıncı. 6 bar = 0,6 N/mm² — atölyede tipik değer. */
const BAR = 6
const P = BAR / 10 // N/mm²

/**
 * Stokta gerçekten bulunan çaplar (data/urunler.json örnek satırlarından
 * ölçüldü: 25, 32, 40, 63, 80, 100 geçiyor; 50 Pemaks DMC-A ISO 50X100'de var).
 * Mil çapları standardın kendisinden: ISO 6432 mini, ISO 15552 profil silindir.
 */
const SILINDIR = [
  { cap: 25, mil: 10, std: 'ISO 6432' },
  { cap: 32, mil: 12, std: 'ISO 15552' },
  { cap: 40, mil: 16, std: 'ISO 15552' },
  { cap: 50, mil: 20, std: 'ISO 15552' },
  { cap: 63, mil: 20, std: 'ISO 15552' },
  { cap: 80, mil: 25, std: 'ISO 15552' },
  { cap: 100, mil: 25, std: 'ISO 15552' },
]


/**
 * Stoktaki pnömatik hortum ölçüleri (urunler.json örnek satırlarından ölçüldü:
 * 4x2,5 · 6x4 · 8x5,5 · 8x6 · 10x6,5). 8x5,5 ile 8x6 bilerek yan yana:
 * aynı rakora girerler ama iç kesitleri farklıdır — tablonun asıl anlattığı bu.
 */
const HORTUM = [
  { d: 4, i: 2.5 },
  { d: 6, i: 4 },
  { d: 8, i: 5.5 },
  { d: 8, i: 6 },
  { d: 10, i: 6.5 },
]

/**
 * Valf gösterimi. Uydurma değil, standart adlandırmanın açılımı: ilk sayı yol,
 * ikinci sayı konum. Son sütun asıl işe yarayan kısım — kataloglarda nadiren
 * yazar ama devreyi tasarlayanın bilmesi gereken tek şey odur.
 */
const VALF = [
  ['3/2 NC', '3', '2', 'tekEtkili', 'yayGeri'],
  ['5/2 tek bobin', '5', '2', 'ciftEtkili', 'yayKonum'],
  ['5/2 çift bobin', '5', '2', 'ciftEtkili', 'sonKonum'],
  ['5/3 kapalı merkez', '5', '3', 'ciftEtkiliAra', 'yerindeDurur'],
  ['5/3 açık merkez', '5', '3', 'ciftEtkiliAra', 'serbest'],
]

/**
 * BSP (ISO 228) dişlerin GERÇEK dış çapı. "1/4 diş" 6,35 mm değil 13,2 mm'dir;
 * kesir inç cinsinden boru İÇ çapının tarihsel adıdır, dişin ölçüsü değil.
 * Ölçüp kafası karışan kişi için tablonun en çok işe yarayan satırı budur.
 */
const DIS = [
  ['1/8"', 9.7, 14, '4–6 mm'],
  ['1/4"', 13.2, 17, '6–8 mm'],
  ['3/8"', 16.7, 19, '8–10 mm'],
  ['1/2"', 21.0, 24, '10–12 mm'],
]


/**
 * GERÇEKTEN ÜRETİLMİŞ silindir ölçüleri. Uydurma değil: onaylanmış ve TESLİM
 * EDİLMİŞ bir imalat partisinin ürün listesinden alındı: 13 kalem, 8 ayrı
 * çap/mil kombinasyonu, strok 100–740 mm. Tek etkili, çöp kamyonu (мусоровоз)
 * hidroliği.
 *
 * 369 ve 590 gibi tek sayılar UYDURMA DEĞİL; ölçüye göre imalat yapıldığının
 * kanıtı ve tam da bu yüzden tabloda duruyor — yuvarlanmış bir listeden çok
 * daha inandırıcı. 80x40 satırı aslında (200+200) çift kademelidir, toplam
 * strok 400 olarak yazıldı; kademe ayrıntısı metinde anlatılıyor. Kuvvetler iki basınçta veriliyor çünkü mobil hidrolikte
 * 160 bar, sabit tesiste 250 bar tipiktir ve seçim buna göre değişir.
 */
const SILINDIR_IMALAT = [
  { cap: 50, mil: 30, strok: '160' },
  { cap: 50, mil: 32, strok: '100–400' },
  { cap: 63, mil: 35, strok: '369' },
  { cap: 63, mil: 40, strok: '320–630' },
  { cap: 80, mil: 40, strok: '400' },
  { cap: 90, mil: 50, strok: '590' },
  { cap: 90, mil: 60, strok: '430–740' },
  { cap: 100, mil: 50, strok: '500' },
]

const alan = (d) => (Math.PI * d * d) / 4
/** 5 N'a yuvarlanır: sürtünme payı zaten bu hassasiyeti anlamsız kılıyor. */
const kuvvet = (mm2) => Math.round((P * mm2) / 5) * 5

const METIN = {
  tr: {
    baslik: `ISO silindirlerde ${BAR} bar'da elde edilen kuvvet`,
    sutunlar: ['Çap (mm)', 'Standart', 'Mil çapı (mm)', 'İtme kuvveti (N)', 'Çekme kuvveti (N)'],
    not:
      `Kuvvet = basınç × piston alanı. Çekme yönünde mil kesiti alandan düştüğü için ` +
      `kuvvet daima daha küçüktür. Değerler ${BAR} bar şebeke basıncı içindir; 7 bar'da ` +
      `yaklaşık %17 artar. Sızdırmazlık sürtünmesi gerçekte %3–10 daha götürür — ` +
      `seçimde pay bırakın.`,
  },
  en: {
    baslik: `Force from ISO cylinders at ${BAR} bar`,
    sutunlar: ['Bore (mm)', 'Standard', 'Rod (mm)', 'Push force (N)', 'Pull force (N)'],
    not:
      `Force = pressure × piston area. On the pull stroke the rod cross-section is ` +
      `subtracted from the area, so pull force is always lower. Values are for ${BAR} bar ` +
      `line pressure; at 7 bar they rise by roughly 17%. Seal friction costs a further ` +
      `3–10% in practice — leave margin when selecting.`,
  },
  ru: {
    baslik: `Усилие цилиндров ISO при ${BAR} бар`,
    sutunlar: ['Диаметр (мм)', 'Стандарт', 'Шток (мм)', 'Усилие толкания (Н)', 'Усилие втягивания (Н)'],
    not:
      `Усилие = давление × площадь поршня. При втягивании из площади вычитается сечение ` +
      `штока, поэтому усилие всегда меньше. Значения приведены для ${BAR} бар; при 7 бар ` +
      `они возрастают примерно на 17 %. Трение уплотнений отнимает ещё 3–10 % — ` +
      `при подборе оставляйте запас.`,
  },
}

function tablo(dil) {
  const f = new Intl.NumberFormat(BICIM[dil])
  const m = METIN[dil]
  return {
    baslik: m.baslik,
    sutunlar: m.sutunlar,
    satirlar: SILINDIR.map((s) => [
      String(s.cap),
      s.std,
      String(s.mil),
      f.format(kuvvet(alan(s.cap))),
      f.format(kuvvet(alan(s.cap) - alan(s.mil))),
    ]),
    not: m.not,
  }
}


const METIN_HORTUM = {
  tr: {
    baslik: 'Stoktaki hortum ölçüleri ve hava geçirgenliği',
    sutunlar: ['Ölçü (dış × iç)', 'Et kalınlığı (mm)', 'Takılacak rakor', 'İç kesit (mm²)', 'Debi (4×2,5 = 1)'],
    not:
      'Ölçü daima dış × iç çaptır. Takmatik rakor DIŞ çapa göre seçilir, iç çap ' +
      'havanın ne kadar geçeceğini belirler. 8×5,5 ile 8×6 aynı rakora girer ama ' +
      'iç kesiti %19 farklıdır: ince etli olan daha çok hava geçirir, kalın etli olan ' +
      'ezilmeye ve dış darbeye daha dayanıklıdır. Debi sütunu iç kesitlerin oranıdır ' +
      '(kesit = π × iç çap² ÷ 4), basınç kaybı hesabı değildir.',
  },
  en: {
    baslik: 'Hose sizes in stock and air capacity',
    sutunlar: ['Size (OD × ID)', 'Wall (mm)', 'Fitting size', 'Bore area (mm²)', 'Flow (4×2.5 = 1)'],
    not:
      'Sizes are always outside × inside diameter. A push-in fitting is chosen by the ' +
      'OUTSIDE diameter, while the bore sets how much air passes. 8×5.5 and 8×6 take the ' +
      'same fitting but differ by 19% in bore area: the thin-wall version flows more, the ' +
      'thick-wall version resists crushing and impact better. The flow column is the ratio ' +
      'of bore areas (area = π × ID² ÷ 4), not a pressure-drop calculation.',
  },
  ru: {
    baslik: 'Типоразмеры рукавов на складе и пропускная способность',
    sutunlar: ['Размер (нар. × внутр.)', 'Стенка (мм)', 'Размер фитинга', 'Сечение (мм²)', 'Расход (4×2,5 = 1)'],
    not:
      'Размер всегда указывается как наружный × внутренний диаметр. Цанговый фитинг ' +
      'подбирают по НАРУЖНОМУ диаметру, а внутренний определяет, сколько воздуха пройдёт. ' +
      '8×5,5 и 8×6 входят в один и тот же фитинг, но сечение отличается на 19 %: ' +
      'тонкостенный пропускает больше, толстостенный лучше держит смятие и удар. ' +
      'Столбец расхода — это отношение сечений (площадь = π × внутр.² ÷ 4), ' +
      'а не расчёт потери давления.',
  },
}

const METIN_VALF = {
  tr: {
    baslik: 'Valf gösterimi ne anlatır',
    sutunlar: ['Gösterim', 'Yol', 'Konum', 'Ne sürer', 'Enerji kesilince'],
    hucre: {
      tekEtkili: 'Tek etkili silindir, hava kesme',
      ciftEtkili: 'Çift etkili silindir',
      ciftEtkiliAra: 'Çift etkili, ara konumda durdurma',
      yayGeri: 'Yay geri iter, çıkış boşalır',
      yayKonum: 'Yay başlangıç konumuna döndürür',
      sonKonum: 'Son konumda kalır (hafızalı)',
      yerindeDurur: 'Silindir bulunduğu yerde kilitlenir',
      serbest: 'Silindir serbest kalır, elle itilebilir',
    },
    not:
      'İlk sayı yol (port) sayısı, ikinci sayı konum sayısıdır. Son sütun devreyi ' +
      'tasarlarken asıl belirleyici olandır ve kataloglarda nadiren yazar: elektrik ' +
      'kesildiğinde ya da acil stopta silindirin ne yapacağını valf tipi belirler. ' +
      'Yük asılı kalıyorsa çift bobin ya da kapalı merkez seçmek güvenlik kararıdır.',
  },
  en: {
    baslik: 'What the valve designation tells you',
    sutunlar: ['Designation', 'Ports', 'Positions', 'What it drives', 'On loss of power'],
    hucre: {
      tekEtkili: 'Single-acting cylinder, air shut-off',
      ciftEtkili: 'Double-acting cylinder',
      ciftEtkiliAra: 'Double-acting, stop at mid position',
      yayGeri: 'Spring returns it, outlet vents',
      yayKonum: 'Spring returns to initial position',
      sonKonum: 'Stays in last position (memory)',
      yerindeDurur: 'Cylinder locks where it stands',
      serbest: 'Cylinder goes free, can be pushed by hand',
    },
    not:
      'The first number is the port count, the second the number of positions. The last ' +
      'column is what actually decides the circuit and is rarely printed in catalogues: ' +
      'the valve type determines what the cylinder does when power fails or E-stop is hit. ' +
      'If a load hangs on the rod, choosing double-coil or closed-centre is a safety decision.',
  },
  ru: {
    baslik: 'Что означает обозначение распределителя',
    sutunlar: ['Обозначение', 'Линии', 'Позиции', 'Чем управляет', 'При снятии питания'],
    hucre: {
      tekEtkili: 'Цилиндр одностороннего действия, отсечка воздуха',
      ciftEtkili: 'Цилиндр двустороннего действия',
      ciftEtkiliAra: 'Двустороннего действия, останов в средней позиции',
      yayGeri: 'Пружина возвращает, выход сбрасывается',
      yayKonum: 'Пружина возвращает в исходную позицию',
      sonKonum: 'Остаётся в последней позиции (с памятью)',
      yerindeDurur: 'Цилиндр фиксируется на месте',
      serbest: 'Цилиндр освобождается, его можно двигать рукой',
    },
    not:
      'Первая цифра — число линий, вторая — число позиций. Последний столбец и определяет ' +
      'схему, но в каталогах его пишут редко: именно тип распределителя задаёт поведение ' +
      'цилиндра при пропадании питания или аварийном останове. Если на штоке висит груз, ' +
      'выбор исполнения с двумя катушками или закрытым центром — это решение по безопасности.',
  },
}

const METIN_DIS = {
  tr: {
    baslik: 'BSP diş ölçüleri — ölçtüğünüz çap hangi diş?',
    sutunlar: ['Diş', 'Gerçek dış çap (mm)', 'Anahtar ağzı (mm)', 'Tipik hortum'],
    not:
      'Dişin adındaki kesir inç DEĞİL: "1/4 diş" 6,35 mm değil, dış çapı 13,2 mm olan ' +
      'diştir. Kesir, standardın doğduğu dönemde o dişe takılan borunun İÇ çapının ' +
      'tarihsel adıdır. Kumpasla ölçtüğünüz değeri bu sütunla karşılaştırın. ' +
      'Ölçüler ISO 228 (BSP paralel) içindir; konik BSPT dişte çap boyunca değişir, ' +
      'ölçüm diş başlangıcından alınır.',
  },
  en: {
    baslik: 'BSP thread sizes — which thread is the diameter you measured?',
    sutunlar: ['Thread', 'Actual OD (mm)', 'Spanner (mm)', 'Typical hose'],
    not:
      'The fraction in the name is NOT inches: a "1/4 thread" is not 6.35 mm, it is a ' +
      'thread whose outside diameter is 13.2 mm. The fraction is the historical name for ' +
      'the INSIDE diameter of the pipe that took the thread when the standard was written. ' +
      'Compare what you measure with callipers against this column. Figures are for ISO 228 ' +
      '(BSP parallel); on tapered BSPT the diameter varies along the thread, so measure at its start.',
  },
  ru: {
    baslik: 'Размеры резьбы BSP — какой резьбе соответствует измеренный диаметр?',
    sutunlar: ['Резьба', 'Фактический нар. диаметр (мм)', 'Ключ (мм)', 'Типичный рукав'],
    not:
      'Дробь в названии — это НЕ дюймы: «резьба 1/4» имеет наружный диаметр не 6,35 мм, ' +
      'а 13,2 мм. Дробь — историческое название ВНУТРЕННЕГО диаметра трубы, на которую ' +
      'нарезалась эта резьба во времена создания стандарта. Сравнивайте измеренное ' +
      'штангенциркулем значение с этим столбцом. Значения приведены для ISO 228 ' +
      '(цилиндрическая BSP); у конической BSPT диаметр меняется по длине, измеряют у начала резьбы.',
  },
}

function tabloHortum(dil) {
  // Ölçü sütunu tam sayıyı tam gösterir (8, 10), et ve kesit sütunları HEP bir
  // ondalık taşır — "1" ile "0,8" yan yana gelince sütun hizasız okunuyor.
  const f = new Intl.NumberFormat(BICIM[dil], { maximumFractionDigits: 1 })
  const f1 = new Intl.NumberFormat(BICIM[dil], { minimumFractionDigits: 1, maximumFractionDigits: 1 })
  const f2 = new Intl.NumberFormat(BICIM[dil], { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const m = METIN_HORTUM[dil]
  const enKucuk = alan(HORTUM[0].i)
  return {
    baslik: m.baslik,
    sutunlar: m.sutunlar,
    satirlar: HORTUM.map((h) => [
      `${f.format(h.d)} × ${f.format(h.i)}`,
      f1.format(Math.round(((h.d - h.i) / 2) * 100) / 100),
      `${f.format(h.d)} mm`,
      f1.format(Math.round(alan(h.i) * 10) / 10),
      f2.format(Math.round((alan(h.i) / enKucuk) * 100) / 100),
    ]),
    not: m.not,
  }
}

function tabloValf(dil) {
  const m = METIN_VALF[dil]
  return {
    baslik: m.baslik,
    sutunlar: m.sutunlar,
    satirlar: VALF.map((v) => [v[0], v[1], v[2], m.hucre[v[3]], m.hucre[v[4]]]),
    not: m.not,
  }
}

function tabloDis(dil) {
  const f = new Intl.NumberFormat(BICIM[dil], { minimumFractionDigits: 1, maximumFractionDigits: 1 })
  const m = METIN_DIS[dil]
  return {
    baslik: m.baslik,
    sutunlar: m.sutunlar,
    satirlar: DIS.map((d) => [d[0], f.format(d[1]), String(d[2]), d[3]]),
    not: m.not,
  }
}


const METIN_IMALAT = {
  tr: {
    baslik: 'İmal ettiğimiz silindir ölçüleri ve verdikleri kuvvet',
    sutunlar: ['Çap × mil (mm)', 'Strok (mm)', 'İtme 160 bar (kN)', 'İtme 250 bar (kN)', 'Çekme 250 bar (kN)'],
    not:
      'Tablodaki ölçüler onaylanmış imalat çizimlerinden alınmıştır — katalog ölçüsü ' +
      'değil, gerçekten ürettiğimiz kombinasyonlar. Strok sütunu bugüne kadar yapılan ' +
      'aralıktır, sınır değildir; ölçüye göre imalat yapıldığı için ara ve üst değerler ' +
      'de mümkündür. Kuvvet = basınç × alan; çekmede mil kesiti alandan düşer. ' +
      '160 bar mobil hidrolikte, 250 bar sabit tesiste tipik çalışma basıncıdır.',
  },
  en: {
    baslik: 'Cylinder sizes we manufacture and the force they deliver',
    sutunlar: ['Bore × rod (mm)', 'Stroke (mm)', 'Push 160 bar (kN)', 'Push 250 bar (kN)', 'Pull 250 bar (kN)'],
    not:
      'These sizes come from approved manufacturing drawings — not a catalogue range but ' +
      'combinations actually built. The stroke column is the span produced so far, not a ' +
      'limit; since everything is made to measure, intermediate and longer strokes are ' +
      'possible. Force = pressure × area; on the pull stroke the rod section is subtracted. ' +
      '160 bar is typical in mobile hydraulics, 250 bar in fixed installations.',
  },
  ru: {
    baslik: 'Типоразмеры изготавливаемых цилиндров и развиваемое усилие',
    sutunlar: ['Гильза × шток (мм)', 'Ход (мм)', 'Толкание 160 бар (кН)', 'Толкание 250 бар (кН)', 'Втягивание 250 бар (кН)'],
    not:
      'Размеры взяты из согласованных производственных чертежей — это не каталожный ряд, ' +
      'а фактически изготовленные сочетания. Столбец хода отражает выполненный диапазон, ' +
      'а не предел: изготовление ведётся по индивидуальным размерам, поэтому возможны ' +
      'промежуточные и большие значения хода. Усилие = давление × площадь; при втягивании ' +
      'из площади вычитается сечение штока. 160 бар типичны для мобильной гидравлики, ' +
      '250 бар — для стационарных установок.',
  },
}

function tabloImalat(dil) {
  const f = new Intl.NumberFormat(BICIM[dil], { minimumFractionDigits: 1, maximumFractionDigits: 1 })
  const m = METIN_IMALAT[dil]
  const kN = (mm2, bar) => f.format(Math.round((mm2 * (bar / 10)) / 100) / 10)
  return {
    baslik: m.baslik,
    sutunlar: m.sutunlar,
    satirlar: SILINDIR_IMALAT.map((c) => [
      `${c.cap} × ${c.mil}`,
      c.strok,
      kN(alan(c.cap), 160),
      kN(alan(c.cap), 250),
      kN(alan(c.cap) - alan(c.mil), 250),
    ]),
    not: m.not,
  }
}

/** slug → o kategoriye yazılacak tablolar (dile göre). */
const HEDEF = {
  'pnomatik-silindir': (dil) => [tablo(dil)],
  'pnomatik-hortum': (dil) => [tabloHortum(dil)],
  'pnomatik-valf': (dil) => [tabloValf(dil)],
  'pnomatik-rakor': (dil) => [tabloDis(dil)],
  'hidrolik-silindir': (dil) => [tabloImalat(dil)],
}

let degisen = 0
for (const [dil, yol] of Object.entries(DOSYA)) {
  const veri = JSON.parse(readFileSync(yol, 'utf8'))
  for (const [slug, uret] of Object.entries(HEDEF)) {
    const kayit = veri.find((k) => k.slug === slug)
    if (!kayit) {
      console.error(`⛔ ${yol}: "${slug}" bulunamadı`)
      process.exit(1)
    }
    const yeni = uret(dil)
    const onceki = JSON.stringify(kayit.tablolar ?? null)
    if (onceki === JSON.stringify(yeni)) continue
    kayit.tablolar = yeni
    degisen++
    console.log(`${dil}/${slug}: ${yeni.length} tablo, ${yeni[0].satirlar.length} satır`)
    if (dil === 'tr') {
      console.log(`   ${yeni[0].sutunlar.join(' | ')}`)
      for (const r of yeni[0].satirlar) console.log(`   ${r.join(' | ')}`)
    }
  }
  if (UYGULA) writeFileSync(yol, JSON.stringify(veri, null, 1) + '\n')
}

console.log()
if (!degisen) console.log('değişiklik yok')
else if (UYGULA) console.log(`✅ ${degisen} kayıt yazıldı`)
else console.log(`${degisen} kayıt değişecek — yazmak için: npm run tablo -- --uygula`)
