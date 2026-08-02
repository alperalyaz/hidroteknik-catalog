/**
 * Örnek ürün satırlarını KENDİ kategorilerinin filtresine karşı sınar.
 *
 *   node scripts/ornek-denetle.mjs
 *
 * NEDEN GEREKLİ: örnek satırlar veri tazelemede otomatik seçiliyor ama elle de
 * düzenlenebiliyor (veri-cek.mjs onları bilerek ezmiyor). İkisinin arasında bir
 * satır kategoriye ait olmayan bir ürüne kayabiliyor ve bunu hiçbir şey yakalamıyor:
 * tsc göremez, build göremez, denetle (kırık link/sızıntı arar) göremez. Tek belirti
 * sayfada alakasız bir ürünün görünmesi — yani müşteri fark edene kadar sessiz.
 *
 * Ölçülen örnek (31.07.2026): hidrolik-hortum sayfasında 16 satırın 9'u hortum
 * DEĞİLDİ — hortum eki, hortum te'si, hortum kanalı (hepsinin evi hortum-ucu-koruma)
 * ve iki muhtelif tezgâh kartı.
 *
 * Kural, veri-cek.mjs'in sorgusuyla AYNI olmalı: (eslesme VEYA eslesmeKod) EKSİ
 * (haric VEYA haricKod VEYA GENEL_HARIC). Buradaki tek fark JS regex kullanması;
 * Postgres ~* yerine 'iu' bayrağı, aynı sonucu verir çünkü desenler zaten
 * sertleştirilmiş ([İIiı] sınıfı) ve harf katlamasına bel bağlamıyorlar.
 */
import { readFileSync } from 'node:fs'
import { sertlestir } from './turkce-regex.mjs'
import { GENEL_HARIC } from './genel-haric.mjs'


/**
 * Postgres deseni → JS deseni.
 *
 * `\m` (kelime başı) ve `\M` (kelime sonu) Postgres kaçışlarıdır; JS tanımaz ve
 * 'u' bayrağıyla "Invalid escape" diye patlar.
 *
 * ⚠ `\b` ile ÇEVİRMEK YANLIŞ — sessizce eksik rapor eder. JS'te `\b`, `\w` yani
 * [A-Za-z0-9_] üzerinden tanımlıdır ve Türkçe İ/Ş/Ğ/Ü/Ö/Ç harflerini kelime
 * harfi SAYMAZ. Sonuç: "HORTUM EKİ 5/16" satırında `\bEKİ\b` deseni tutmaz,
 * çünkü "İ" ile sonraki boşluk arasında JS'e göre sınır yoktur (ikisi de
 * kelime-dışı). Denetçi bu satırları temiz sanıyordu — ilk koşumda tam da
 * kullanıcının şikâyet ettiği "HORTUM EKİ" satırları raporda çıkmadı.
 *
 * Doğrusu Unicode harf sınıfıyla elle yazılmış bakışlardır: \p{L} Türkçe
 * harfleri de kapsar.
 */
const re = (d) =>
  new RegExp(
    sertlestir(d)
      .replace(/\\m/g, '(?<![\\p{L}\\p{N}_])')
      .replace(/\\M/g, '(?![\\p{L}\\p{N}_])'),
    'iu'
  )

const kategoriler = JSON.parse(readFileSync('data/kategoriler.json', 'utf8'))
const urunler = JSON.parse(readFileSync('data/urunler.json', 'utf8'))

const sorunlu = []
let denetlenen = 0

for (const k of kategoriler) {
  const kayit = urunler.kategoriler[k.slug]
  if (!kayit) { sorunlu.push({ slug: k.slug, kod: '—', ad: '(kategoride hiç veri yok)', sebep: 'veri eksik' }); continue }

  for (const u of kayit.urunler) {
    denetlenen++
    const ad = u.ad || ''
    const kod = u.kod || ''
    const neden = []

    // 1) Eşleşme: ad VEYA kod desenlerinden en az biri tutmalı.
    const adTutar = k.eslesme ? re(k.eslesme).test(ad) : false
    const kodTutar = k.eslesmeKod ? re(k.eslesmeKod).test(kod) : false
    if (!adTutar && !kodTutar) neden.push('eşleşme yok')

    // 2) Hariç: hiçbiri tutmamalı.
    if (k.haric && re(k.haric).test(ad)) neden.push('haric tutuyor')
    if (k.haricKod && re(k.haricKod).test(kod)) neden.push('haricKod tutuyor')
    if (re(GENEL_HARIC).test(ad)) neden.push('muhtelif tezgâh kartı')

    if (neden.length) sorunlu.push({ slug: k.slug, kod, ad, sebep: neden.join(' + ') })
  }
}

console.log(`denetlenen örnek satır: ${denetlenen}`)
console.log(`kategorisine uymayan  : ${sorunlu.length}\n`)

const grupla = new Map()
for (const s of sorunlu) {
  if (!grupla.has(s.slug)) grupla.set(s.slug, [])
  grupla.get(s.slug).push(s)
}
for (const [slug, liste] of [...grupla].sort((a, b) => b[1].length - a[1].length)) {
  console.log(`── ${slug}  (${liste.length})`)
  for (const s of liste) console.log(`     ${s.kod.padEnd(20)} ${s.ad.slice(0, 46).padEnd(48)} ${s.sebep}`)
}

process.exit(sorunlu.length === 0 ? 0 : 1)
