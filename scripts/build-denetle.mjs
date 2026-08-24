/**
 * Build çıktısı denetimi — `npm run build` sonrası çalıştırılır.
 *
 *   node scripts/build-denetle.mjs
 *
 * Yedi şeyi arar; yedisi de sessizce bozulabilen, elle fark edilmeyen şeylerdir:
 *   1. Kırık iç link   — 15.000'in üzerinde href var, elle bakılamaz
 *   2. Tedarikçi adı sızıntısı — yalnız ürünün üzerindeki marka yayımlanır
 *   3. Yinelenen <title> — aynı başlık iki sayfada varsa biri diğerini yer
 *   4. İç stok kodu sızıntısı — yalnız ÜRETİCİNİN kodu yayımlanır, bizimki asla
 *   5. Kanonik bütünlüğü — kökün 308'i, kendini gösteren canonical, x-default
 *   6. Rusça sayı çekimi — "1 223 размеров" değil "размера"
 *   7. Sayı biçimi — ru/en sayfasında Türkçe binlik ayracı (5.297)
 *
 * ⚠ RSC YÜKÜ AYIKLANIR (önemli): Next.js sayfanın sonuna `self.__next_f.push`
 * çağrılarıyla akış yükünü gömer ve uzun dizeleri RASTGELE yerlerden böler.
 * "hidroteknik.com.tr" bir chunk sınırında "hidrotek" + "nik.com.tr" diye
 * ikiye ayrılabiliyor; ham HTML'de arama yapan bir denetçi bunu tedarikçi adı
 * sızıntısı sanıp yanlış alarm veriyor (ölçüldü: 30.07.2026, iki rehber sayfası).
 * Bölünme build'den build'e yer değiştirdiği için alarm da kararsızdır.
 * Yalan söyleyen denetçi görmezden gelinir; o yüzden yükü ayıklıyoruz ve
 * yalnız KULLANICIYA GÖRÜNEN HTML'de arıyoruz.
 *
 * TEK İSTİSNA 4. denetim: iç stok kodu HAM html'de aranır. Orada tehlike ters
 * yönde — kod sayfada görünmediği hâlde RSC yükünde durabiliyor (React `key`
 * bunu yapıyordu). Kodlar kısa ve tirelidir, chunk sınırında bölünse bile
 * yanlış alarm değil EKSİK alarm üretir; yani ham arama burada güvenli taraftır.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, sep } from 'node:path'

const KOK = '.next/server/app'

/**
 * TEDARİKÇİ ADLARI — hiçbiri hiçbir sayfada geçemez.
 *
 * Bunlar ürünü aldığımız toptancılar; MARKA DEĞİLLER ve adları ticari sırdır.
 * Yalnız ürünün üzerindeki gerçek marka yayımlanır (HansaFlex, Kastaş, Pemaks…
 * bunlar marka, listede yok). Ürün ADLARI ve KODLARI yayımlanabilir — ürün
 * adlarında tedarikçi adı geçmiyor (ölçüldü: 6.973 + 3.480 + 3.756 kalemde 0).
 *
 * TEK İSTİSNA GDC: 1.086 kalemin HEPSİNİN kodu "GDC-" ile başlıyor, yani o
 * kodlar tedarikçi adını kendi içinde taşıyor. Bu yüzden GDC kodları — ürün
 * adları serbest olsa da — yayımlanamaz; desen burada onu da tutar.
 */
const YASAK = [
  { ad: 'Adem Kardeşler', re: /adem\s*karde/i },
  { ad: 'Hidrotek (tedarikçi)', re: /\bhidrotek\b(?!nik)/i },
  { ad: 'Arıca', re: /\bar[ıi]ca\b/i },
  { ad: 'Teksan', re: /\bteksan\b/i },
  { ad: 'GDC', re: /\bgdc\b/i },
]

function htmlDosyalari(dizin, biriken = []) {
  for (const ad of readdirSync(dizin)) {
    const yol = join(dizin, ad)
    if (statSync(yol).isDirectory()) htmlDosyalari(yol, biriken)
    else if (ad.endsWith('.html')) biriken.push(yol)
  }
  return biriken
}

/** RSC akış yükünü ve JSON-LD'yi çıkarır — geriye görünen işaretleme kalır. */
function gorunenHtml(h) {
  return h.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
}

const dosyalar = htmlDosyalari(KOK)
const yollar = new Set(dosyalar.map((f) => '/' + f.slice(KOK.length + 1).replace(/\.html$/, '')))

/**
 * public/ altındaki statik varlıklar da geçerli hedeftir.
 *
 * Neden gerekli: React 19, fetchPriority="high" taşıyan bir <img>'i <head>'e
 * <link rel="preload" href="/logo.png"> olarak kaldırıyor. Bu bir SAYFA linki
 * değil ama denetçinin href taraması onu da görüyordu ve dosya .next/server/app
 * altında bulunmadığı için "kırık link" diye bağırıyordu. Varlık gerçekte var;
 * yalan söyleyen denetçi görmezden gelinir, o yüzden denetçi düzeltildi.
 */
for (const ad of readdirSync('public', { recursive: true })) {
  const yol = join('public', String(ad))
  if (statSync(yol).isFile()) yollar.add('/' + String(ad).split(sep).join('/'))
}

const kirik = new Map()
const basliklar = new Map()
const sizinti = []
const icKod = []
let toplamLink = 0

/**
 * İÇ STOK KODU SIZINTISI.
 *
 * Sayfalar üreticinin katalog kodunu yayımlar (HD106), bizim stok kodumuzu
 * (HF.H.HD106) ASLA. Kodlarımız sık değişiyor ve dışarıda karşılığı yok; bir
 * kez sızarsa arama motoru ölü bir değeri indeksliyor.
 *
 * Sessizce geri gelebilen bir hatadır: sütunu kaldırmak yetmez, React `key`
 * olarak verilen kod da RSC akış yüküne ["$","tr","HF.H.HD106",…] diye yazılır
 * ve sayfada görünmediği hâlde kaynakta durur. O yüzden burada GÖRÜNEN değil
 * HAM html taranır — tam tersi mantık, tedarikçi adı denetiminde geçerli olanın.
 */
const icKodlar = new Set()
for (const kat of Object.values(JSON.parse(readFileSync('data/urunler.json', 'utf8')).kategoriler))
  for (const u of kat.urunler) if (u.kod?.trim()) icKodlar.add(u.kod.trim())
for (const marka of JSON.parse(readFileSync('data/markalar.json', 'utf8')))
  for (const o of marka.ornekler || []) if (o.kod?.trim()) icKodlar.add(o.kod.trim())

for (const f of dosyalar) {
  const yol = '/' + f.slice(KOK.length + 1).replace(/\.html$/, '')
  const ham = readFileSync(f, 'utf8')
  const gorunen = gorunenHtml(ham)

  for (const m of gorunen.matchAll(/href="(\/[^"#?]*)"/g)) {
    const hedef = m[1].replace(/\/$/, '') || '/'
    if (hedef.startsWith('/_next') || hedef === '/') continue
    toplamLink++
    if (!yollar.has(hedef)) {
      if (!kirik.has(hedef)) kirik.set(hedef, new Set())
      kirik.get(hedef).add(yol)
    }
  }

  for (const { ad, re } of YASAK) {
    const m = gorunen.match(re)
    if (m) sizinti.push({ yol, ad, eslesen: m[0] })
  }

  for (const kod of icKodlar) if (ham.includes(kod)) icKod.push({ yol, kod })

  const t = (ham.match(/<title>(.*?)<\/title>/s) || [])[1]
  if (t) {
    if (!basliklar.has(t)) basliklar.set(t, [])
    basliklar.get(t).push(yol)
  }
}

const yinelenen = [...basliklar].filter(([, v]) => v.length > 1)

/* ────────────────────────────────────────────────────────────────────────────
 * 5. KANONİK BÜTÜNLÜĞÜ
 *
 * Üçü de sessiz: hata vermezler, build'i kırmazlar, sayfa doğru görünür. Yalnız
 * Google başka bir adresi kanonik seçer ve bunu haftalar sonra Search Console'da
 * bir e-postayla öğrenirsiniz.
 *
 * a) KÖK 308 OLMALI. `redirect()` 307 (geçici) döndürür ve Google geçici
 *    yönlendirmede KAYNAĞI kanonik saymaya devam eder: `/` dizinde kalır, `/tr`
 *    onun kopyası sayılır, `/tr`nin kendi canonical'ı ile çelişir. Gerçekten
 *    yaşandı (24.08.2026) — `permanentRedirect()` ile 308'e çevrildi. Tek harflik
 *    bir geri dönüş (`permanentRedirect` → `redirect`) hatayı geri getirir.
 * b) Her sayfanın canonical'ı KENDİNİ göstermeli.
 * c) Çok dilli her sayfa x-default beyan etmeli — yoksa dili tutmayan aramada
 *    hangi sürümün gösterileceğine Google karar verir.
 */
const kanonik = []
{
  let kokMeta = null
  try {
    kokMeta = JSON.parse(readFileSync(join(KOK, 'index.meta'), 'utf8'))
  } catch {
    kanonik.push('kök (/) için index.meta okunamadı — yönlendirme üretilmemiş')
  }
  if (kokMeta && kokMeta.status !== 308) {
    kanonik.push(
      `kök (/) ${kokMeta.status} döndürüyor, 308 olmalı` +
        ` — 307/302'de Google '/' adresini kanonik tutar (bkz. app/page.tsx)`
    )
  }
}
for (const f of dosyalar) {
  const yol = '/' + f.slice(KOK.length + 1).replace(/\.html$/, '')
  // Kök yönlendirme sayfasının gövdesi yoktur; canonical'ı da olmaz.
  if (yol === '/index' || yol === '/_not-found') continue
  const ham = readFileSync(f, 'utf8')
  const c = (ham.match(/<link rel="canonical" href="([^"]*)"/) || [])[1]
  if (!c) kanonik.push(`${yol} — canonical yok`)
  else if (!c.endsWith(yol)) kanonik.push(`${yol} — canonical başkasını gösteriyor: ${c}`)
  // denizli-hidrolik tek dillidir (yalnız TR üretilir), alternatifi olmaz.
  if (yol.endsWith('/denizli-hidrolik')) continue
  if (!/hrefLang="x-default"/i.test(ham)) kanonik.push(`${yol} — x-default yok`)
}

/* ────────────────────────────────────────────────────────────────────────────
 * 6. RUSÇA SAYI ÇEKİMİ
 *
 * Rusça'da sayıdan sonraki isim sayıya göre çekilir: 1 размер · 2-4 размера ·
 * 5+ размеров; son iki hane 11–14 ise her zaman çoğul. Şablonda tek biçim sabit
 * yazılırsa sayıların çoğunda yanlış çıkar ve METİN MAKİNE ÇEVİRİSİ GİBİ görünür.
 *
 * Gerçekten yaşandı (24.08.2026): ölçü listeleri tam listeye çıkarılınca
 * `profilListeNotTam` 2 profil yerine 43'ünde tetiklendi ve K21 sayfasında
 * "все 1 223 размеров" yazdı — doğrusu "размера". Sabit yazılmış sekiz dize
 * vardı; hiçbiri tsc'den, build'den ya da göz taramasından geçerken görünmedi.
 *
 * Katalog Rusya'ya bilerek konumlandırıldı; orada bu hatanın maliyeti estetik
 * değil, güven.
 */
const RU_CEKIM = [
  ['размер', 'размера', 'размеров'],
  ['позиция', 'позиции', 'позиций'],
  ['код', 'кода', 'кодов'],
  ['типоразмер', 'типоразмера', 'типоразмеров'],
]
const ruDogru = (n, [tekil, ikiDort, cogul]) => {
  const yuz = n % 100
  if (yuz >= 11 && yuz <= 14) return cogul
  const on = n % 10
  if (on === 1) return tekil
  if (on >= 2 && on <= 4) return ikiDort
  return cogul
}
/**
 * Sayıdan ÖNCE bunlardan biri geliyorsa çekim kuralı UYGULANMAZ: bu edat ve
 * niceleyiciler ismi, sayı ne olursa olsun tamlayan çoğula sokar.
 *   «из 1223 размеров» · «свыше 5290 размеров» · «каждый из 3 диаметров»
 * Bunu bilmeyen bir denetçi DOĞRU Rusça'yı hata diye bildirir. Yalan söyleyen
 * denetçi görmezden gelinir, o yüzden istisna baştan yazılıdır.
 */
const RU_TAMLAYAN = /(из|свыше|более|около|порядка|до|от|менее)\s*$/i

const ruCekimHata = []
for (const f of dosyalar) {
  const yol = '/' + f.slice(KOK.length + 1).replace(/\.html$/, '')
  if (!yol.startsWith('/ru')) continue
  const gorunen = gorunenHtml(readFileSync(f, 'utf8'))
  for (const biçim of RU_CEKIM) {
    // Binlik ayracı üç türlü çıkabiliyor: ru-RU'nun kırılmaz boşluğu, dar
    // kırılmaz boşluk, ve (hatalı olarak veriye elle yazılmış) Türkçe noktası.
    // Üçü de tanınmalı — yoksa "1.223 размеров" sayı olarak 223 okunur ve
    // denetçi doğru sayıyı bilmeden rapor üretir.
    const sayi = '\\d{1,3}(?:[\\u00a0\\u202f .]\\d{3})*|\\d+'
    const re = new RegExp(`(${sayi})\\s(${biçim.join('|')})(?![\\p{L}])`, 'gu')
    for (const m of gorunen.matchAll(re)) {
      if (RU_TAMLAYAN.test(gorunen.slice(Math.max(0, m.index - 14), m.index))) continue
      const n = parseInt(m[1].replace(/\D/g, ''), 10)
      if (!Number.isFinite(n)) continue
      const d = ruDogru(n, biçim)
      if (m[2] !== d) ruCekimHata.push(`${yol} — "${m[1]} ${m[2]}" olmalıydı "${m[1]} ${d}"`)
    }
  }
}


/**
 * TÜRKÇE BİÇİMLİ SAYI, RUSÇA/İNGİLİZCE SAYFADA.
 *
 * Binlik ayracı dile göre değişir: Türkçe nokta (5.297), İngilizce virgül
 * (5,297), Rusça kırılmaz boşluk (5 297). Şablondaki sayılar `sayiFormat()`ten
 * geçtiği için doğru; tehlike VERİYE ELLE YAZILAN sayılarda.
 *
 * Ölçüldü (24.08.2026): `kategoriler.ru.json` içinde dört yerde "5.297 позиций"
 * yazıyordu. Rusça okuyan biri bunu "beş tam iki yüz doksan yedi" diye okur —
 * yani 5.297 kalemlik stok, 5 kalem gibi görünür. tsc, build ve link denetimi
 * bunu göremez; metin dilbilgisi olarak da kusursuzdur.
 */
const sayiBicim = []
for (const f of dosyalar) {
  const yol = '/' + f.slice(KOK.length + 1).replace(/\.html$/, '')
  const dil = yol.startsWith('/ru') ? 'ru' : yol.startsWith('/en') ? 'en' : null
  if (!dil) continue
  const gorunen = gorunenHtml(readFileSync(f, 'utf8'))
  // Nokta ayraçlı bin: Türkçe biçim. Ondalıktan ayırt etmek için tam üç hane
  // aranır — "1.5 mm" tutmaz, "5.297" tutar.
  for (const m of gorunen.matchAll(/(?<![\d.,])\d{1,3}\.\d{3}(?![\d.,])/g)) {
    sayiBicim.push(`${yol} — "${m[0]}" Türkçe binlik ayracı (${dil} sayfasında)`)
  }
}
console.log(`sayfa ${dosyalar.length} · iç link ${toplamLink}`)
console.log(`kırık link hedefi : ${kirik.size}`)
for (const [hedef, kaynak] of [...kirik].slice(0, 10)) {
  console.log(`   ✗ ${hedef}  ←  ${[...kaynak].slice(0, 2).join(', ')}`)
}
console.log(`tedarikçi sızıntısı: ${sizinti.length}`)
for (const s of sizinti.slice(0, 10)) console.log(`   ✗ ${s.yol} — ${s.ad} ("${s.eslesen}")`)
console.log(`yinelenen <title>  : ${yinelenen.length}`)
for (const [t, v] of yinelenen.slice(0, 10)) console.log(`   ✗ "${t.slice(0, 60)}" → ${v.join(', ')}`)
console.log(`iç stok kodu (${icKodlar.size} kod arandı): ${icKod.length}`)
for (const s of icKod.slice(0, 10)) console.log(`   ✗ ${s.yol} — ${s.kod}`)
console.log(`kanonik bütünlüğü  : ${kanonik.length}`)
for (const s of kanonik.slice(0, 10)) console.log(`   ✗ ${s}`)
console.log(`rusça sayı çekimi  : ${ruCekimHata.length}`)
for (const s of ruCekimHata.slice(0, 10)) console.log(`   ✗ ${s}`)
console.log(`sayı biçimi (dil)  : ${sayiBicim.length}`)
for (const s of sayiBicim.slice(0, 10)) console.log(`   ✗ ${s}`)

const hata =
  kirik.size + sizinti.length + yinelenen.length + icKod.length + kanonik.length + ruCekimHata.length + sayiBicim.length
console.log(hata === 0 ? '\n✅ temiz' : `\n⛔ ${hata} sorun`)
process.exit(hata === 0 ? 0 : 1)
