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

/** slug → o kategoriye yazılacak tablolar (dile göre). */
const HEDEF = { 'pnomatik-silindir': (dil) => [tablo(dil)] }

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
