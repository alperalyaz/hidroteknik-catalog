/**
 * IndexNow — Bing ve Yandex'e "şu adresler değişti" der.
 *
 *   npm run indexnow            kuru çalıştırma, hiçbir şey gönderilmez
 *   npm run indexnow -- --gonder
 *
 * ── NEDEN GOOGLE YOK ───────────────────────────────────────────────────────
 * Google IndexNow'a katılmıyor. Google'a sayfa bildirmenin genel bir API'si
 * YOK: Search Console'un "Request Indexing" düğmesinin arkasında herkese açık
 * uç yok, ayrı Indexing API ise yalnız iş ilanı ve canlı yayın kabul ediyor.
 * Bu script Google için bir şey yapmaz ve yapıyormuş gibi de görünmemeli.
 *
 * Asıl kazanç YANDEX: Rusya'da arama pazarının çoğunluğu orada ve katalog üç
 * dilde Rusça da yayımlıyor. Bing de aynı bildirimle kapsanıyor.
 *
 * ── ANAHTAR GİZLİ DEĞİL ────────────────────────────────────────────────────
 * Protokol sahipliği anahtarın ALAN ADINDA yayımlanmasıyla kanıtlıyor:
 * dosya public/ altında durur ve herkese açıktır. Depo açık olduğu için
 * commit'lenmesi ek bir sızıntı yaratmaz — zaten herkesin okuyabileceği bir
 * adreste durmak ZORUNDA. Bilen biri yalnız BİZİM alan adımıza ait adresleri
 * bildirebilir, başka bir şey yapamaz.
 *
 * ── SESSİZ BAŞARISIZLIK ────────────────────────────────────────────────────
 * Anahtar dosyası canlıda yoksa motor bildirimi reddeder; bazı uçlar buna yine
 * 200 döndürür. O yüzden gönderimden ÖNCE dosya indirilip içeriği anahtarla
 * karşılaştırılır. Bu denetim olmasa "gönderdim" diye rapor edip hiçbir şey
 * olmamış olabilirdi.
 */
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const ALAN = 'catalog.hidroteknik.com.tr'
const SITE = `https://${ALAN}`
const GONDER = process.argv.includes('--gonder')

/** IndexNow uçları. Protokol bildirimi katılımcılar arasında paylaştırıyor;
 *  Yandex'e ayrıca doğrudan gidiyoruz çünkü asıl hedef o ve maliyeti yok. */
const UCLAR = [
  ['genel (Bing + paylaşım)', 'https://api.indexnow.org/indexnow'],
  ['yandex', 'https://yandex.com/indexnow'],
]

function anahtariBul() {
  const adaylar = readdirSync('public').filter((a) => /^[0-9a-f]{8,128}\.txt$/i.test(a))
  if (adaylar.length !== 1) {
    console.error(`⛔ public/ altında tam olarak bir anahtar dosyası olmalı, ${adaylar.length} bulundu.`)
    process.exit(1)
  }
  const dosya = adaylar[0]
  const icerik = readFileSync(join('public', dosya), 'utf8').trim()
  const adDan = dosya.replace(/\.txt$/i, '')
  if (icerik !== adDan) {
    console.error(`⛔ Anahtar dosyasının ADI ile İÇERİĞİ farklı:\n   ad:     ${adDan}\n   içerik: ${icerik}`)
    process.exit(1)
  }
  return adDan
}

async function adresler() {
  const r = await fetch(`${SITE}/sitemap.xml`)
  if (!r.ok) {
    console.error(`⛔ sitemap.xml alınamadı (HTTP ${r.status}).`)
    process.exit(1)
  }
  const xml = await r.text()
  const liste = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])
  const yabanci = liste.filter((u) => !u.startsWith(`${SITE}/`))
  if (yabanci.length) {
    console.error(`⛔ Sitemap'te alan adımıza ait olmayan ${yabanci.length} adres var; IndexNow bunu reddeder.`)
    process.exit(1)
  }
  return liste
}

async function anahtarCanliMi(anahtar) {
  const adres = `${SITE}/${anahtar}.txt`
  try {
    const r = await fetch(adres)
    if (!r.ok) return { tamam: false, neden: `HTTP ${r.status}` }
    const govde = (await r.text()).trim()
    if (govde !== anahtar) return { tamam: false, neden: `içerik uyuşmuyor ("${govde.slice(0, 40)}")` }
    return { tamam: true }
  } catch (e) {
    return { tamam: false, neden: String(e.message ?? e) }
  }
}

const anahtar = anahtariBul()
const liste = await adresler()

console.log(`alan adı   : ${ALAN}`)
console.log(`anahtar    : ${anahtar}`)
console.log(`adres       : ${liste.length}`)
console.log(`örnek       : ${liste[0]}`)

const kontrol = await anahtarCanliMi(anahtar)
if (!kontrol.tamam) {
  console.error(`\n⛔ Anahtar dosyası canlıda okunamıyor: ${SITE}/${anahtar}.txt — ${kontrol.neden}`)
  console.error('   Deploy edilmeden gönderim anlamsız: motor bildirimi reddeder.')
  process.exit(1)
}
console.log(`anahtar canlı: ✓ ${SITE}/${anahtar}.txt`)

if (!GONDER) {
  console.log('\nKuru çalıştırma — hiçbir şey gönderilmedi. Göndermek için: npm run indexnow -- --gonder')
  process.exit(0)
}

const govde = JSON.stringify({
  host: ALAN,
  key: anahtar,
  keyLocation: `${SITE}/${anahtar}.txt`,
  urlList: liste,
})

let hata = 0
for (const [ad, uc] of UCLAR) {
  try {
    const r = await fetch(uc, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: govde,
    })
    // 200 kabul, 202 "anahtar doğrulanıyor" — ikisi de başarı sayılır.
    const iyi = r.status === 200 || r.status === 202
    console.log(`${iyi ? '✅' : '⛔'} ${ad.padEnd(24)} HTTP ${r.status}`)
    if (!iyi) {
      hata++
      console.log(`   ${(await r.text()).slice(0, 200)}`)
    }
  } catch (e) {
    hata++
    console.log(`⛔ ${ad.padEnd(24)} ${String(e.message ?? e)}`)
  }
}
process.exit(hata ? 1 : 0)
