/**
 * data/uretici-kodlari.json üretir — üretici katalog kodu blokları.
 *
 *   node scripts/uretici-kod-uret.mjs            # kuru çalıştırma
 *   node scripts/uretici-kod-uret.mjs --uygula   # dosyayı yaz
 *
 * KAYNAK: `scripts/uretici-kod-veri.mjs` — tedarikçi kaynak havuzundan (fiyat
 * listesi CSV/PDF'leri) çıkarılmış kod + ad çiftleri.
 *
 * ── YAYIMLANAN VE YAYIMLANMAYAN ────────────────────────────────────────────
 * YAYIMLANIR: üreticinin katalog KODU, ürün ADI ve addan türetilen teknik
 * öznitelikler (güç, devir, çap, strok...). Bunlar üreticinin kendi kataloğunda
 * zaten kamuya açıktır ve sahada gerçekten aranan şeydir.
 *
 * YAYIMLANMAZ: fiyat, iskonto, para birimi, liste tarihi ve TEDARİKÇİ ADI.
 * Bu script fiyat alanına hiç dokunmaz — veri dosyasına fiyat girmez.
 *
 * ── HER LİSTE KULLANILAMAZ ────────────────────────────────────────────────
 * 22 kaynak listesinin yalnız ÜRETİCİNİN KENDİ listesi olanları kullanılır.
 * Tedarikçi (toptancı) listelerinin kodu o firmanın iç numarasıdır: dışarıda
 * karşılığı yoktur, kimse aramaz ve listenin kendisi kimden aldığımızı ele
 * verir. Ölçüldü (02.08.2026): 51.268 kalemin 29.085'i üretici listesinden,
 * 15.845'i tedarikçi listesinden geliyor.
 *
 * Üretici listesi olması da yetmez, KOD SÜTUNU GÜVENİLİR olmalı. Ölçüldü:
 *   Pemaks   PK-063-SA-0020        ✓ gerçek katalog kodu
 *   Gamak    AGM2E 63 M 2a         ✓
 *   Pakkens  PAKKENS-MG-63-...-032 ✗ marka+seri+ölçü+satır no'dan ÜRETİLMİŞ
 *                                    sentetik anahtar; gerçek kod 0401000108
 * Sentetik anahtar yayımlamak, yanlış kod yayımlamaktır — hiç yayımlamamaktan
 * kötüdür, çünkü arayan kişi bulamadığında kataloğa güvenmeyi bırakır.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { GRUPLAR } from './uretici-kod-veri.mjs'

const UYGULA = process.argv.includes('--uygula')

/**
 * Kodun serisi.
 *
 * Basit ayraç (boşluk/tire) her markada işe yaramıyor: Ferro `BV2G112N` ve Hema
 * `05P008AB3` hiç ayraç taşımıyor, seri baştaki harf/rakam öbeğidir. Tire ile
 * ayırmaya kalkışınca her kod kendi "serisi" oldu ve 1.627 Ferro kodu 8'erlik
 * parçalara dağıldı. O yüzden grup kendi `seriCikar` fonksiyonunu verebilir.
 */
function seriAdi(kod, g) {
  const s = String(kod).trim()
  if (g.seriCikar) return String(g.seriCikar(s) || '').toUpperCase()
  const i = g.ayrac === 'bosluk' ? s.indexOf(' ') : s.indexOf('-')
  return (i > 0 ? s.slice(0, i) : s).toUpperCase()
}

/**
 * Ürün adından sayısal bir özniteliği toplar: "3 kW" → 3
 *
 * Diş ölçüleri veride iki yazımla geçiyor: "1-1/2" ve "1 1/2". Normalleştirmezsek
 * aynı ölçü listede iki kez görünür ve sayfa özensiz durur. Tire kesirli
 * ifadenin İÇİNDE ayraçtır, tek başına eksi değildir — o yüzden yalnız
 * "rakam-rakam/rakam" kalıbında boşluğa çevrilir.
 */
function normalizeDeger(v) {
  return String(v)
    .replace(',', '.')
    .replace(/^(\d+)-(\d+\/\d+)$/, '$1 $2')
    .trim()
}

/** Kesirli diş ölçüsünü sayıya çevirir: "1 1/2" → 1.5 (sıralama için). */
function sayisalDeger(v) {
  const m = String(v).match(/^(\d+)\s+(\d+)\/(\d+)$/)
  if (m) return Number(m[1]) + Number(m[2]) / Number(m[3])
  const k = String(v).match(/^(\d+)\/(\d+)$/)
  if (k) return Number(k[1]) / Number(k[2])
  return parseFloat(v)
}

function ozellikTopla(satirlar, re) {
  const kume = new Set()
  for (const [, ad] of satirlar) {
    const m = String(ad).match(re)
    if (m) kume.add(normalizeDeger(m[1]))
  }
  return [...kume].sort((a, b) => sayisalDeger(a) - sayisalDeger(b))
}

// Elle kurulmuş gruplar KORUNUR. Pemaks silindir bloğu silindire özel bir
// yapıda (çap × strok matrisi, tamMatris doğrulaması) ve elle doğrulanmış;
// üreteç onu yeniden kuramaz, olduğu gibi taşır.
/**
 * BİLEREK KALDIRILAN MARKALAR.
 *
 * Koruma mantığı "yeniden üretilmeyeni koru" olduğu için, bir markayı veri
 * dosyasından silmek onu yayından KALDIRMIYOR — üreteç elle kurulmuş sanıp
 * taşıyor. Kaldırma açık bir karar olmalı ve gerekçesi kayıtta durmalı.
 *
 * SMS Tork: liste 3.389 satır ama ürün ADLARI tarif değil, iç grup kodu —
 * `S4011` grubunun adı "KVNSLNKSS-V (Yakıt Grubu)". Ölçüldü: yayımladığım 10
 * grubun 5'inde ürün türü %100 belirsiz, kalanlarda %49-75. Bu adlarla
 * "SMS Tork proses vanası" demek, veriden çıkarılamayan bir iddiadır.
 * Kaynak liste düzeltilirse geri alınabilir.
 */
const KALDIRILAN = new Set(['SMS Tork'])

const oncekiler = JSON.parse(readFileSync('data/uretici-kodlari.json', 'utf8'))
const uretilenAnahtar = new Set(GRUPLAR.map((g) => `${g.kategori}|${g.marka}`))
const korunan = oncekiler.filter(
  (g) => !uretilenAnahtar.has(`${g.kategori}|${g.marka}`) && !KALDIRILAN.has(g.marka)
)
const dusurulen = oncekiler.filter((g) => KALDIRILAN.has(g.marka))
for (const g of dusurulen) {
  console.log(`⊘ kaldırıldı: ${g.marka} → ${g.kategori} (${g.seriler.reduce((a, s) => a + s.kodlar.length, 0)} kod)`)
}

const cikti = [...korunan]
const rapor = []

for (const g of GRUPLAR) {
  const seriler = new Map()
  let atlanan = 0

  for (const [kod, ad] of g.satirlar) {
    const k = String(kod).trim()
    // Kod sütununa ölçü/birim metni ya da saf sıra numarası düşmüş satırlar.
    // Bunlar OCR/ayrıştırma artığıdır, ürün kodu değildir.
    if (!k || /^\d+$/.test(k) || /^\d+[:.]\d+$/.test(k) || /\.{2,}/.test(k)) { atlanan++; continue }
    if (/\b(bar|mbar|m3|°C|V DC|V AC|lt\/dk)\b/i.test(k)) { atlanan++; continue }
    const s = seriAdi(k, g)
    if (!s) { atlanan++; continue }
    if (!seriler.has(s)) seriler.set(s, [])
    seriler.get(s).push([k, String(ad || '').trim()])
  }

  // Tek kodluk "seri"ler gerçek seri değil, ayrıştırma gürültüsüdür.
  const gecerli = [...seriler].filter(([, r]) => r.length >= g.enAzKod).sort((a, b) => b[1].length - a[1].length)
  const dusen = [...seriler].filter(([, r]) => r.length < g.enAzKod).reduce((a, [, r]) => a + r.length, 0)

  /**
   * SERİ ADI GERÇEK Mİ, BENİM ÇIKARIMIM MI?
   *
   * Kodu harf öbeğinden kesince elde edilen şey bir SERİ ADI değil, bir kod
   * önekidir. "Ferro QCAFFMPG serisi" diye bir şey yok — QCAFFMPG benim
   * QCAFFMPG12MN kodundan kestiğim parça. Bunu seri diye yayımlamak, üreticinin
   * kullanmadığı bir terimi ona atfetmektir; Pakkens'in sentetik anahtarını
   * reddederken kullandığım ölçütün aynısı.
   *
   * Ölçüt: ürün ADI "X SERİSİ" diyorsa seri adı ÜRETİCİNİNDİR. Demiyorsa grup
   * yine yayımlanır (kodlar gerçek ve aranan şey onlar) ama başlıkta seri
   * iddiası kurulmaz — ürün TÜRÜ yazılır.
   */
  for (const s of []) void s
  const seriDogrula = (seri, satirlar) => {
    const re = new RegExp(`\\b${seri.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*(SER[İI]S[İI]|SERIES)`, 'i')
    return satirlar.some(([, ad]) => re.test(String(ad)))
  }

  /**
   * ELLE KURULMUŞ SERİLER SERİ DÜZEYİNDE KORUNUR.
   *
   * Koruma önce grup düzeyindeydi ve sessiz bir kayıp verdi: Pemaks'ın elle
   * kurulmuş bloğu (PAG/DMC/PM) aynı `kategori|marka` anahtarını taşıdığı için
   * üretilmiş grup tarafından bütünüyle ezildi. Kaybedilenler PAG serisinin
   * kendisi, `stokAdet` (gerçek stok kartı sayısı — "üreticinin kataloğunda N
   * kod var"dan daha güçlü bir iddia), `tipler` (üç dilli varyant açıklaması)
   * ve `tamMatris` doğrulamasıydı.
   *
   * Artık üretilmiş seri, aynı adı taşıyan elle kurulmuş seriyi EZMEZ; elle
   * kurulanlar olduğu gibi taşınır ve üretilmiş olanlar yanına eklenir.
   */
  const eskiGrup = oncekiler.find((x) => x.kategori === g.kategori && x.marka === g.marka)
  const elleSeriler = (eskiGrup?.seriler ?? []).filter((s) => s.stokAdet != null)
  const elleAdlar = new Set(elleSeriler.map((s) => s.seri.toUpperCase()))
  if (elleSeriler.length) {
    console.log(`   ↻ ${g.marka}: elle kurulmuş ${elleSeriler.length} seri korundu (${elleSeriler.map((s) => s.seri).join(', ')})`)
  }

  cikti.push({
    kategori: g.kategori,
    marka: g.marka,
    markaSlug: g.markaSlug,
    kodDeseni: g.kodDeseni,
    kodOrnek: g.kodOrnek,
    seriler: [...elleSeriler, ...gecerli.filter(([seri]) => !elleAdlar.has(seri)).slice(0, g.enFazlaSeri).map(([seri, satirlar]) => ({
      seri,
      seriAdiUreticinin: seriDogrula(seri, satirlar),
      katalogAdet: satirlar.length,
      ozellikler: g.ozellikler.map((o) => ({
        // Etiket üç dilli: Rusça sayfada "kW" değil "кВт" yazmalı.
        etiket: o.etiket,
        degerler: ozellikTopla(satirlar, o.re).slice(0, 40),
      })).filter((o) => o.degerler.length > 1),
      kodlar: satirlar.map(([k]) => k).sort(),
      aciklama: g.seriAciklama(seri, satirlar, seriDogrula(seri, satirlar)),
    }))],
  })

  rapor.push({
    marka: g.marka,
    ham: g.satirlar.length,
    atlanan,
    dusen,
    seri: gecerli.length,
    yayimlanan:
      elleSeriler.reduce((a, s) => a + s.kodlar.length, 0) +
      gecerli.filter(([seri]) => !elleAdlar.has(seri)).slice(0, g.enFazlaSeri).reduce((a, [, r]) => a + r.length, 0),
  })
}

// ── Güvenlik denetimleri ──────────────────────────────────────────────────
const govde = JSON.stringify(cikti)
for (const yasak of [/\bgdc\b/i, /\bar[ıi]ca\b/i, /\bteksan\b/i, /adem\s*karde/i, /hidrotek(?!nik)/i]) {
  if (yasak.test(govde)) throw new Error(`çıktıda tedarikçi adı var: ${yasak}`)
}
for (const alan of ['fiyat', 'price', 'iskonto', 'para_birimi', 'birim_fiyat']) {
  if (govde.toLowerCase().includes(`"${alan}"`)) throw new Error(`çıktıda fiyat alanı var: ${alan}`)
}
// Sayı + para birimi kalıbı (ör. "102.97 USD") hiçbir metinde geçmemeli.
const fiyatIzi = govde.match(/\d+[.,]\d{2}\s*(USD|EUR|TL|TRY|₺|\$|€)/i)
if (fiyatIzi) throw new Error(`çıktıda fiyat izi var: ${fiyatIzi[0]}`)

for (const g of cikti) {
  for (const s of g.seriler) {
    for (const o of s.ozellikler ?? []) {
      if (!o.etiket?.tr || !o.etiket?.en || !o.etiket?.ru) {
        throw new Error(`${g.marka}/${s.seri}: öznitelik etiketinin üç dili dolu değil`)
      }
      if (!/[Ѐ-ӿ]/.test(o.etiket.ru) && /[A-Za-z]/.test(o.etiket.ru) && o.etiket.ru === o.etiket.en) {
        // Birim kısaltmaları (mm, bar) üç dilde aynı olabilir; uyarı değil.
      }
    }
  }
}

const kategoriler = JSON.parse(readFileSync('data/kategoriler.json', 'utf8')).map((k) => k.slug)
for (const g of cikti) {
  if (!kategoriler.includes(g.kategori)) throw new Error(`${g.marka}: "${g.kategori}" diye bir kategori yok`)
}

// ── Rapor ─────────────────────────────────────────────────────────────────
console.log('marka'.padEnd(12) + 'ham'.padStart(6) + 'atlanan'.padStart(9) + 'seri dışı'.padStart(11) + 'seri'.padStart(6) + 'yayımlanan'.padStart(12))
for (const r of rapor) {
  console.log(
    r.marka.padEnd(12) + String(r.ham).padStart(6) + String(r.atlanan).padStart(9) +
    String(r.dusen).padStart(11) + String(r.seri).padStart(6) + String(r.yayimlanan).padStart(12)
  )
}
console.log('\nkorunan elle kurulmuş grup: ' + korunan.length + ' (' + korunan.map((g) => g.marka).join(', ') + ')')
console.log('grup: ' + cikti.length + ' · yeni yayımlanan kod: ' + rapor.reduce((a, r) => a + r.yayimlanan, 0))
for (const g of cikti) {
  console.log(`\n── ${g.marka} → ${g.kategori}  (${g.seriler.length} seri)`)
  for (const s of g.seriler.slice(0, 8)) {
    // Korunan Pemaks grubu eski (silindire özel) yapıda: caplar/stroklar taşır,
    // ozellikler taşımaz. Rapor iki yapıyı da basabilmeli.
    const oz = s.ozellikler
      ? s.ozellikler.map((o) => `${o.etiket.tr} ${o.degerler.length}`).join(' · ')
      : `çap ${s.caplar?.length ?? 0} · strok ${s.stroklar?.length ?? 0}`
    const adet = s.katalogAdet ?? s.kodlar.length
    const isaret = s.seriAdiUreticinin === false ? ' ⚠ seri adı bizim çıkarımımız' : ''
    console.log(`   ${s.seri.padEnd(12)}${String(adet).padStart(4)} kod   ${oz}${isaret}`)
  }
  if (g.seriler.length > 8) console.log(`   … ${g.seriler.length - 8} seri daha`)
}

if (UYGULA) {
  writeFileSync('data/uretici-kodlari.json', JSON.stringify(cikti, null, 1) + '\n')
  console.log('\n✅ data/uretici-kodlari.json yazıldı')
} else {
  console.log('\nKURU ÇALIŞTIRMA — dosya yazılmadı. Uygulamak için --uygula ekleyin.')
}
