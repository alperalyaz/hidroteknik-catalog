/**
 * data/profiller.json üretir.
 *
 *   node scripts/profil-uret.mjs            # kuru çalıştırma, farkı gösterir
 *   node scripts/profil-uret.mjs --uygula   # dosyayı yaz
 *
 * İki iş yapar:
 *   1. Yeni profil ailelerini ekler (scripts/profil-veri.mjs → YENI)
 *   2. Her profilin `ad` alanını ÜÇ DİLLİ hâline getirir (→ AD)
 *
 * ── `yer` ELLE YAZILMAZ, ÖLÇÜDEN TÜRETİLİR ────────────────────────────────
 * Sızdırmazlık elemanının mil tarafına mı piston tarafına mı takıldığı ölçü
 * SIRASINDAN okunur:
 *
 *     14 x 24 x 7      artan  → önce iç çap, sonra dış çap → MİL
 *     50 x 44,4 x 6,2  azalan → önce dış çap, sonra iç çap → PİSTON
 *
 * Kural Kastaş'ın kendi sınıflandırmasıyla karşılaştırıldı ve ONUNLA BİREBİR
 * TUTTU (01.08.2026): türetim K40 ve K54 için "Piston" dedi, Kastaş da onlara
 * "Piston Keçesi" / "Pnömatik Piston Keçesi" diyor; K12/K29/K30/K51/K52 için
 * "Mil" dedi, Kastaş da "Toz/Boğaz Keçesi" diyor. Yani türetim uydurma değil,
 * bağımsız olarak doğrulanmış bir okuma.
 *
 * Bir ailenin ölçüleri aynı yönü göstermiyorsa üretim DURUR. Sessizce yanlış
 * etiket basmaktansa çuvallamak yeğdir — sayfada "mil tarafına takılır" yazan
 * bir piston keçesi, müşteriye yanlış parça sattırır.
 *
 * ── MEVCUT KAYITLARIN ÖRNEK ÖLÇÜLERİ KORUNUR ──────────────────────────────
 * Var olan 33 profilin `olculer` listesi elle seçilmiş (her ailenin en çok
 * hareket gören ölçüleri). Bu araç onlara DOKUNMAZ; yalnız `ad` alanını üç
 * dilliye çevirir. Yeni ailelerde ise ailenin TAMAMI listelenir.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { AD, KAYNAK, YENI } from './profil-veri.mjs'

const UYGULA = process.argv.includes('--uygula')

/** "40 x 50 x 8" → [40, 50, 8]. Türkçe ondalık virgülü noktaya çevrilir. */
function sayilar(olcu) {
  return olcu
    .split(/\s*x\s*/i)
    .map((p) => parseFloat(p.split('/')[0].replace(',', '.')))
    .filter((n) => Number.isFinite(n))
}

/**
 * Ailenin ölçülerinden `yer` türetir. Tutarsızsa hata fırlatır.
 * Üçüncü sayı yüksekliktir, yön kararında kullanılmaz.
 */
function yerTuret(kod, olculer) {
  let artan = 0
  let azalan = 0
  const kararsiz = []
  for (const o of olculer) {
    const s = sayilar(o)
    if (s.length < 2) { kararsiz.push(o); continue }
    if (s[1] > s[0]) artan++
    else if (s[1] < s[0]) azalan++
    else kararsiz.push(o)
  }
  if (artan && azalan) {
    throw new Error(
      `${kod}: ölçü yönü tutarsız (${artan} artan / ${azalan} azalan) — elle bakılmalı`
    )
  }
  if (!artan && !azalan) throw new Error(`${kod}: hiçbir ölçüden yön okunamadı`)
  return { yer: artan ? 'Mil' : 'Piston', kararsiz }
}

// ── 1) Mevcut kayıtlar: ad alanını üç dilliye çevir ───────────────────────
const mevcut = JSON.parse(readFileSync('data/profiller.json', 'utf8'))
const cevrilen = []
const adsiz = []

for (const p of mevcut) {
  const eski = typeof p.ad === 'string' ? p.ad : p.ad?.tr
  if (AD[p.kod]) {
    // TÜRKÇE ELLE YAZILMIŞ HÂLİYLE KALIR. Kastaş'ın adı resmîdir ama kısadır
    // ("Kompakt Set"); bizimki neyin ne işe yaradığını söylüyor ("Kompakt piston
    // keçesi") ve Türkçe aramada karşılığı olan terimleri taşıyor. Eksik olan
    // İngilizce/Rusça idi — sayfada Türkçe metin görünüyordu, düzeltilen o.
    p.ad = { tr: eski || AD[p.kod].tr, en: AD[p.kod].en, ru: AD[p.kod].ru }
    if (eski && eski !== AD[p.kod].tr) cevrilen.push(`${p.kod}: "${eski}"  ·  Kastaş: "${AD[p.kod].tr}"`)
  } else {
    // Kastaş kataloğunda karşılığı doğrulanamayan kod: üç dilde de boş kalır.
    p.ad = { tr: '', en: '', ru: '' }
    adsiz.push(p.kod)
  }
}

// ── 2) Yeni aileler ───────────────────────────────────────────────────────
const yeniKayitlar = []
for (const [kod, satirlar] of Object.entries(YENI)) {
  if (mevcut.some((p) => p.kod.toUpperCase() === kod)) {
    throw new Error(`${kod} zaten profiller.json içinde — YENI listesinden çıkarın`)
  }
  if (!AD[kod]) throw new Error(`${kod} için doğrulanmış ad yok (profil-veri.mjs → AD)`)

  const olculer = satirlar.map(([k, o]) => ({ kod: k, olcu: o }))
  const { yer, kararsiz } = yerTuret(kod, olculer.map((x) => x.olcu))
  const icCaplar = olculer.map((x) => sayilar(x.olcu)[0]).filter(Number.isFinite)
  // Piston elemanında ilk sayı DIŞ çaptır; capMin/capMax alanı sayfada
  // "Ø… – Ø…" diye gösterildiği için her iki hâlde de ilk sayı doğru eksendir.

  yeniKayitlar.push({
    kod,
    ad: AD[kod],
    yer,
    adet: olculer.length,
    capMin: Math.min(...icCaplar),
    capMax: Math.max(...icCaplar),
    pu: olculer.some((x) => /\bPU\b/i.test(x.kod)),
    olculer,
    _kararsiz: kararsiz.length,
  })
}

// ── Doğrulamalar ──────────────────────────────────────────────────────────
for (const [kod, v] of Object.entries(AD)) {
  if (!v.tr || !v.en || !v.ru) throw new Error(`${kod}: üç dilden biri boş`)
  // Kastaş'ın ru sayfalarının bir kısmında İspanyolca/Çince metin duruyor.
  if (!/[Ѐ-ӿ]/.test(v.ru)) throw new Error(`${kod}: ru alanı Kiril değil — "${v.ru}"`)
  if (/[Ѐ-ӿ]/.test(v.en)) throw new Error(`${kod}: en alanında Kiril var`)
}

const tumu = [...mevcut, ...yeniKayitlar].sort((a, b) => b.adet - a.adet)
const kodlar = new Set(tumu.map((p) => p.kod.toUpperCase()))
if (kodlar.size !== tumu.length) throw new Error('profil kodu yinelemesi var')

const govde = JSON.stringify(tumu)
for (const yasak of [/\bgdc\b/i, /\bar[ıi]ca\b/i, /\bteksan\b/i, /adem\s*karde/i, /hidrotek(?!nik)/i]) {
  if (yasak.test(govde)) throw new Error(`çıktıda tedarikçi adı var: ${yasak}`)
}
if (/KASTAS\./i.test(govde)) throw new Error('çıktıda iç stok kodu öneki (KASTAS.) var')

// ── Rapor ─────────────────────────────────────────────────────────────────
console.log(`mevcut profil: ${mevcut.length} · eklenen: ${yeniKayitlar.length} · toplam: ${tumu.length}`)
console.log(`adı doğrulanan: ${tumu.length - adsiz.length} · doğrulanamayan (boş kalır): ${adsiz.length}`)

console.log('\n── EKLENEN AİLELER')
for (const p of yeniKayitlar) {
  console.log(
    `   ${p.kod.padEnd(6)}${String(p.adet).padStart(3)} ölçü · ${p.yer.padEnd(7)}· Ø${p.capMin}–${p.capMax}` +
      `${p.pu ? ' · PU' : ''}  ${p.ad.tr}`
  )
  if (p._kararsiz) console.log(`         ⚠ ${p._kararsiz} ölçüden yön okunamadı (yön kalanlardan belirlendi)`)
  delete p._kararsiz
}

if (cevrilen.length) {
  console.log('\n── TÜRKÇE ADI KASTAŞ YAZIMINDAN FARKLI OLANLAR (bizimki korundu)')
  for (const c of cevrilen) console.log('   ' + c)
}
console.log(`\nadı doğrulanamayan ${adsiz.length} kod: ${adsiz.join(' ')}`)
console.log(`ad kaynağı: ${Object.keys(KAYNAK).length} Kastaş ürün sayfası`)

if (UYGULA) {
  writeFileSync('data/profiller.json', JSON.stringify(tumu, null, 1) + '\n')
  console.log('\n✅ data/profiller.json yazıldı')
} else {
  console.log('\nKURU ÇALIŞTIRMA — dosya yazılmadı. Uygulamak için --uygula ekleyin.')
}
