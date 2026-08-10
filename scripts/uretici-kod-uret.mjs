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

/** Kodun serisi: ilk boşluk/tire öncesi parça. */
function seriAdi(kod, ayrac) {
  const s = String(kod).trim()
  const i = ayrac === 'bosluk' ? s.indexOf(' ') : s.indexOf('-')
  return (i > 0 ? s.slice(0, i) : s).toUpperCase()
}

/** Ürün adından sayısal bir özniteliği toplar: "3 kW" → 3 */
function ozellikTopla(satirlar, re) {
  const kume = new Set()
  for (const [, ad] of satirlar) {
    const m = String(ad).match(re)
    if (m) kume.add(m[1].replace(',', '.'))
  }
  return [...kume].sort((a, b) => parseFloat(a) - parseFloat(b))
}

// Elle kurulmuş gruplar KORUNUR. Pemaks silindir bloğu silindire özel bir
// yapıda (çap × strok matrisi, tamMatris doğrulaması) ve elle doğrulanmış;
// üreteç onu yeniden kuramaz, olduğu gibi taşır.
const oncekiler = JSON.parse(readFileSync('data/uretici-kodlari.json', 'utf8'))
const uretilenAnahtar = new Set(GRUPLAR.map((g) => `${g.kategori}|${g.marka}`))
const korunan = oncekiler.filter((g) => !uretilenAnahtar.has(`${g.kategori}|${g.marka}`))

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
    const s = seriAdi(k, g.ayrac)
    if (!seriler.has(s)) seriler.set(s, [])
    seriler.get(s).push([k, String(ad || '').trim()])
  }

  // Tek kodluk "seri"ler gerçek seri değil, ayrıştırma gürültüsüdür.
  const gecerli = [...seriler].filter(([, r]) => r.length >= g.enAzKod).sort((a, b) => b[1].length - a[1].length)
  const dusen = [...seriler].filter(([, r]) => r.length < g.enAzKod).reduce((a, [, r]) => a + r.length, 0)

  cikti.push({
    kategori: g.kategori,
    marka: g.marka,
    markaSlug: g.markaSlug,
    kodDeseni: g.kodDeseni,
    kodOrnek: g.kodOrnek,
    seriler: gecerli.slice(0, g.enFazlaSeri).map(([seri, satirlar]) => ({
      seri,
      katalogAdet: satirlar.length,
      ozellikler: g.ozellikler.map((o) => ({
        etiket: o.etiket,
        degerler: ozellikTopla(satirlar, o.re).slice(0, 40),
      })).filter((o) => o.degerler.length > 1),
      kodlar: satirlar.map(([k]) => k).sort(),
      aciklama: g.seriAciklama(seri, satirlar),
    })),
  })

  rapor.push({
    marka: g.marka,
    ham: g.satirlar.length,
    atlanan,
    dusen,
    seri: gecerli.length,
    yayimlanan: gecerli.slice(0, g.enFazlaSeri).reduce((a, [, r]) => a + r.length, 0),
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
      ? s.ozellikler.map((o) => `${o.etiket} ${o.degerler.length}`).join(' · ')
      : `çap ${s.caplar?.length ?? 0} · strok ${s.stroklar?.length ?? 0}`
    const adet = s.katalogAdet ?? s.kodlar.length
    console.log(`   ${s.seri.padEnd(12)}${String(adet).padStart(4)} kod   ${oz}`)
  }
  if (g.seriler.length > 8) console.log(`   … ${g.seriler.length - 8} seri daha`)
}

if (UYGULA) {
  writeFileSync('data/uretici-kodlari.json', JSON.stringify(cikti, null, 1) + '\n')
  console.log('\n✅ data/uretici-kodlari.json yazıldı')
} else {
  console.log('\nKURU ÇALIŞTIRMA — dosya yazılmadı. Uygulamak için --uygula ekleyin.')
}
