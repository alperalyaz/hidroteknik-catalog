/**
 * data/silindir-parcalari.json üretir.
 *
 *   node scripts/silindir-parca-uret.mjs
 *
 * KAYNAK: ss reposundaki tedarikci_kaynak_kalem (tedarikçi fiyat listesi CSV'leri).
 * YAYIMLANAN: yalnız parça ADI + ÖLÇÜ. Kod, fiyat, tedarikçi adı yayımlanmaz.
 *
 * KOD NEDEN YOK: bu kalemlerin 1.086'sının da kodu tedarikçi adının kısaltmasıyla
 * başlıyor, yani kodun kendisi tedarikçiyi ele veriyor. Ürün ADLARINDA ise tedarikçi
 * adı hiç geçmiyor (ölçüldü: 1.086 kalemde 0). O yüzden adlar ve ölçüler yayımlanır,
 * kodlar yayımlanmaz. Denetim (scripts/build-denetle.mjs) kodun kaçak girmesini
 * ayrıca yakalar.
 *
 * ÖLÇÜ EKSENİ İKİ TÜRLÜ — karıştırmak sayfayı yalancı yapar:
 *   AxB'de B < A  →  A = gövde (silindir) çapı, B = MİL çapı
 *                    (boğaz kepi, uzatma kepi, piston, çakma tip kep)
 *   AxB'de B > A  →  A = gövde çapı,           B = kapağın DIŞ çapı
 *                    (arka kapak, rot kepi somunu, lift hamut bağlantısı)
 * Eksen elle yazılmaz, ölçülerden TÜRETİLİR ve bir ailenin tüm ölçüleri aynı yönü
 * göstermiyorsa üretim durur — sessizce yanlış etiket basmaktansa çuvallamak yeğdir.
 */
import { writeFileSync } from 'node:fs'

/** Ham kayıtlar: ad kökü + ölçü listesi (veritabanından birebir alındı, 30.07.2026). */
const HAM = [
  {
    slug: 'bogaz-kepi',
    kaynakAd: 'HİDROLİK SİLİNDİR BOĞAZ KEPLERİ',
    tr: 'Boğaz Kepi', en: 'Gland Cap', ru: 'Направляющая крышка',
    olculer:
      '32x16,32x18,32x20,32x22,35x20,35x22,40x20,40x22,40x25,40x28,45x20,45x25,45x28,45x30,50x20,50x22,50x25,50x28,50x30,50x32,50x35,50x36,55x25,55x30,55x35,60x25,60x30,60x35,60x40,60x45,63x30,63x35,63x36,63x40,63x45,63x50,65x30,65x35,65x40,65x45,70x25,70x30,70x35,70x40,70x45,70x50,70x55,75x30,75x35,75x40,75x45,75x50,75x55,80x30,80x35,80x40,80x45,80x50,80x55,80x56,80x60,85x35,85x40,85x45,85x50,85x55,85x60,90x35,90x40,90x45,90x50,90x55,90x60,90x65,100x35,100x40,100x45,100x50,100x55,100x56,100x60,100x65,100x70,100x75,100x80,110x50,110x55,110x56,110x60,110x65,110x70,110x75,110x80,110x90,115x50,115x55,115x60,115x65,115x70,115x75,115x80,120x45,120x50,120x55,120x60,120x65,120x70,120x75,120x80,120x85,120x90,125x50,125x55,125x60,125x65,125x70,125x75,125x80,125x85,125x90,125x100,130x60,130x70,130x80,130x90,130x100,140x60,140x65,140x70,140x75,140x80,140x85,140x90,140x100,140x110,150x60,150x70,150x80,150x90,150x100,150x110,160x60,160x70,160x80,160x90,160x100,160x110,160x120,170x80,170x90,170x100,170x110,170x120,180x70,180x80,180x90,180x100,180x110,180x120,180x130,180x140,200x80,200x90,200x100,200x110,200x120,200x130,200x140,220x100,220x110,220x120,220x130,220x140,220x150,220x160,230x150,250x100,250x110,250x120,250x130,250x140,250x150,250x160',
    aciklama: {
      tr: 'Silindirin mil tarafındaki ön kapağı. Mili yataklar, keçe ve sıyırıcıyı taşır; revizyonda en sık değişen parçadır.',
      en: 'The front cap on the rod side of the cylinder. It guides the rod and carries the seal and wiper — the part most often replaced during a rebuild.',
      ru: 'Передняя крышка со стороны штока. Направляет шток и несёт манжету и грязесъёмник — деталь, которую при ремонте меняют чаще всего.',
    },
  },
  {
    slug: 'uzatma-kepi',
    kaynakAd: 'HİDROLİK SİLİNDİR UZATMA KEPLERİ',
    tr: 'Uzatma Kepi', en: 'Extension Cap', ru: 'Удлинительная крышка',
    olculer:
      '50x30,63x40,63x45,70x40,70x45,70x50,70x55,80x40,80x45,80x50,80x55,80x60,90x40,90x45,90x50,90x55,90x60,90x65,90x70,100x50,100x55,100x60,100x65,100x70,100x75,100x80,110x50,110x55,110x60,110x65,110x70,110x75,110x80,110x85,115x60,115x65,115x70,115x75,115x80,120x60,120x65,120x70,120x75,120x80,120x85,120x90,125x70,125x75,125x80,125x90,125x100,130x70,130x75,130x80,130x85,130x90,130x95,130x100,140x60,140x70,140x80,140x85,140x90,140x95,140x100,140x110,150x90,150x100,150x110,150x120',
    aciklama: {
      tr: 'Boğaz kepinin uzun gövdeli hâli. Mil yatak boyunu artırarak yan yüke ve eğilmeye karşı daha kararlı çalışma sağlar.',
      en: 'A longer-bodied version of the gland cap. It increases rod bearing length, giving steadier running against side load and bending.',
      ru: 'Удлинённый вариант направляющей крышки. Увеличивает длину опоры штока, обеспечивая устойчивость к боковой нагрузке и изгибу.',
    },
  },
  {
    slug: 'piston',
    kaynakAd: 'HİDROLİK SİLİNDİR PİSTON',
    tr: 'Piston', en: 'Piston', ru: 'Поршень',
    olculer:
      '32x15,35x16,40x16,45x20,50x16,50x20,50x30,55x20,60x20,63x20,63x25,65x25,70x25,70x30,75x32,80x27,80x30,85x32,90x30,100x40,110x40,115x40,120x40,125x40,130x40,140x40,150x40,170x50,180x50,190x50,200x55,220x70,230x70,250x80',
    aciklama: {
      tr: 'Basıncı kuvvete çeviren parça. Kuvvet doğrudan piston alanıyla orantılıdır; itmede tam alan, çekmede mil kesiti düşülmüş alan çalışır.',
      en: 'The part that turns pressure into force. Force is proportional to piston area: the full area works on extension, the area minus the rod section on retraction.',
      ru: 'Деталь, преобразующая давление в усилие. Усилие пропорционально площади поршня: при выдвижении работает полная площадь, при втягивании — за вычетом сечения штока.',
    },
  },
  {
    slug: 'cakma-tip-kep',
    kaynakAd: 'HİDROLİK SİLİNDİR ÇAKMA TİP KEPLER',
    tr: 'Çakma Tip Kep', en: 'Press-fit Cap', ru: 'Запрессовываемая крышка',
    olculer:
      '140x80,160x90,160x100,160x110,170x110,180x90,180x95,180x100,180x110,180x120,200x90,200x100,200x110,200x120,200x140,220x100,220x110,220x120,220x125,230x110,230x120,230x130,230x140,250x110,250x120,250x130,250x140,250x150,250x160',
    aciklama: {
      tr: 'Vidalı yerine boruya çakılarak geçen kep. Büyük çaplarda tercih edilir; stoktaki ölçüler Ø140 ve üzerinde yoğunlaşır.',
      en: 'A cap pressed into the tube instead of being threaded. Preferred at large bores; the sizes we carry are concentrated at Ø140 and above.',
      ru: 'Крышка, запрессовываемая в трубу вместо резьбового соединения. Применяется на больших диаметрах; наши размеры сосредоточены от Ø140 и выше.',
    },
  },
  {
    slug: 'arka-kapak',
    kaynakAd: 'HİDROLİK SİLİNDİR ARKA KAPAK BASİT TİP',
    tr: 'Arka Kapak (Basit Tip)', en: 'Rear Cap, Plain Type', ru: 'Задняя крышка, простой тип',
    olculer:
      '32x40,35x45,40x50,45x55,50x60,50x65,55x65,60x70,60x80,63x75,70x85,75x90,80x95,80x100,85x100,90x105,90x110,100x115,100x120,110x130,115x130,120x140,125x145,125x150,130x150,150x170,160x190,170x190,180x210,200x245,220x270,230x280,250x300',
    aciklama: {
      tr: 'Silindirin mil olmayan tarafını kapatan taban. Yağ girişi bulunmayan sade tip; bağlantı ayrı bir eleman (kulak, mafsal, flanş) ile yapılır.',
      en: 'The base closing the blind end of the cylinder. The plain type has no oil port; mounting is made with a separate element (clevis, joint or flange).',
      ru: 'Основание, закрывающее глухой конец цилиндра. Простой тип без маслоподвода; крепление выполняется отдельным элементом (проушина, шарнир, фланец).',
    },
  },
  {
    slug: 'arka-kapak-yag-girisli',
    kaynakAd: 'HİDROLİK SİLİNDİR ARKA KAPAK YAĞ GİRİŞLİ',
    tr: 'Arka Kapak (Yağ Girişli)', en: 'Rear Cap with Oil Port', ru: 'Задняя крышка с маслоподводом',
    olculer:
      '40x50,50x60,60x70,63x75,65x80,70x85,75x90,80x95,80x100,90x105,90x110,100x115,100x120,110x130,115x130,120x140,125x145,130x150,150x170,160x180,180x200,200x220,250x300',
    aciklama: {
      tr: 'Taban kapağın yağ delikli hâli. Hattı doğrudan kapaktan almak, borunun yan yüzeyine giriş açmaya göre daha derli toplu bir montaj verir.',
      en: 'The base cap with an oil port. Taking the line straight from the cap gives a tidier installation than opening a port in the side of the tube.',
      ru: 'Донная крышка с масляным отверстием. Подвод прямо через крышку даёт более компактный монтаж, чем врезка в боковую стенку трубы.',
    },
  },
  {
    slug: 'rot-kepi-somunu',
    kaynakAd: 'HİDROLİK SİLİNDİR ROT KEPİ SOMUNLARI',
    tr: 'Rot Kepi Somunu', en: 'Tie-rod Cap Nut', ru: 'Гайка стяжной крышки',
    olculer:
      '50x60,63x75,70x85,80x95,80x100,90x105,90x110,100x115,100x120,110x130,115x130,120x140,125x145,125x150,130x150,140x160,150x170,150x180,160x190,180x210',
    aciklama: {
      tr: 'Rot (germe çubuğu) tipli silindirlerde kapağı gövdeye bastıran somun. Sıkma momenti doğru verilmezse kapak sızdırır.',
      en: 'The nut that clamps the cap onto the body on tie-rod type cylinders. If the tightening torque is not right, the cap leaks.',
      ru: 'Гайка, прижимающая крышку к корпусу в цилиндрах со стяжными шпильками. При неверном моменте затяжки крышка течёт.',
    },
  },
  {
    slug: 'lift-hamut-baglanti',
    kaynakAd: 'HİDROLİK SİLİNDİR LİFT HAMUT BAĞLANTI',
    tr: 'Lift Hamut Bağlantısı', en: 'Lift Clamp Mount', ru: 'Крепление хомута подъёмника',
    olculer:
      '63x75,70x85,80x95,80x100,90x105,90x110,100x115,100x120,110x130,115x130,120x140,125x145,130x150',
    aciklama: {
      tr: 'Silindiri gövdesinden kavrayarak bağlayan hamut. Kapaktan bağlantının yapılamadığı yerleşimlerde kullanılır.',
      en: 'A clamp that mounts the cylinder by gripping its body. Used where mounting from the cap is not possible.',
      ru: 'Хомут, крепящий цилиндр за корпус. Применяется там, где крепление через крышку невозможно.',
    },
  },
]

/** "32x16" → {a, b}. */
const ayir = (s) => {
  const [a, b] = s.split('x').map(Number)
  if (!Number.isFinite(a) || !Number.isFinite(b)) throw new Error(`ölçü çözülemedi: ${s}`)
  return { a, b }
}

const cikti = HAM.map((p) => {
  // Yinelenenleri at (aynı ölçü farklı varyantlarda tekrar ediyor), sonra sırala.
  const benzersiz = [...new Set(p.olculer.split(',').map((s) => s.trim()).filter(Boolean))]
  const cift = benzersiz.map(ayir).sort((x, y) => x.a - y.a || x.b - y.b)

  // EKSEN TÜRETME + DOĞRULAMA: aile içindeki tüm ölçüler aynı yönü göstermeli.
  const kucuk = cift.filter((c) => c.b < c.a).length
  const buyuk = cift.filter((c) => c.b > c.a).length
  if (kucuk && buyuk) {
    throw new Error(`${p.slug}: ölçü ekseni tutarsız (${kucuk} mil-yönlü, ${buyuk} dış-yönlü) — elle bakılmalı`)
  }
  if (!kucuk && !buyuk) throw new Error(`${p.slug}: hiçbir ölçüde A≠B yok`)
  const eksen = kucuk ? 'capMil' : 'capDis'

  const capSet = [...new Set(cift.map((c) => c.a))].sort((x, y) => x - y)
  const ikinci = [...new Set(cift.map((c) => c.b))].sort((x, y) => x - y)

  return {
    slug: p.slug,
    kaynakAd: p.kaynakAd,
    eksen,
    adet: cift.length,
    capMin: capSet[0],
    capMax: capSet[capSet.length - 1],
    capSayisi: capSet.length,
    ikinciMin: ikinci[0],
    ikinciMax: ikinci[ikinci.length - 1],
    olculer: cift.map((c) => `${c.a}x${c.b}`),
    tr: p.tr, en: p.en, ru: p.ru,
    aciklama: p.aciklama,
  }
})

// Son kontroller: slug tekil, kod sızmamış.
const sluglar = new Set(cikti.map((p) => p.slug))
if (sluglar.size !== cikti.length) throw new Error('slug yinelemesi var')
const govde = JSON.stringify(cikti)
for (const yasak of [/\bgdc\b/i, /\bar[ıi]ca\b/i, /\bteksan\b/i, /adem\s*karde/i]) {
  if (yasak.test(govde)) throw new Error(`çıktıda tedarikçi adı var: ${yasak}`)
}

writeFileSync('data/silindir-parcalari.json', JSON.stringify(cikti, null, 1) + '\n')

const toplam = cikti.reduce((a, p) => a + p.adet, 0)
console.log(`${cikti.length} parça ailesi · ${toplam} ölçü`)
for (const p of cikti) {
  const eks = p.eksen === 'capMil' ? 'çap×mil' : 'çap×dış'
  console.log(
    `  ${p.slug.padEnd(24)} ${String(p.adet).padStart(3)} ölçü · ${eks} · Ø${p.capMin}–${p.capMax}`
  )
}
