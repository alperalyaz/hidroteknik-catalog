/**
 * Build çıktısı denetimi — `npm run build` sonrası çalıştırılır.
 *
 *   node scripts/build-denetle.mjs
 *
 * Üç şeyi arar; üçü de sessizce bozulabilen, elle fark edilmeyen şeylerdir:
 *   1. Kırık iç link   — 15.000'in üzerinde href var, elle bakılamaz
 *   2. Tedarikçi adı sızıntısı — yalnız ürünün üzerindeki marka yayımlanır
 *   3. Yinelenen <title> — aynı başlık iki sayfada varsa biri diğerini yer
 *
 * ⚠ RSC YÜKÜ AYIKLANIR (önemli): Next.js sayfanın sonuna `self.__next_f.push`
 * çağrılarıyla akış yükünü gömer ve uzun dizeleri RASTGELE yerlerden böler.
 * "hidroteknik.com.tr" bir chunk sınırında "hidrotek" + "nik.com.tr" diye
 * ikiye ayrılabiliyor; ham HTML'de arama yapan bir denetçi bunu tedarikçi adı
 * sızıntısı sanıp yanlış alarm veriyor (ölçüldü: 30.07.2026, iki rehber sayfası).
 * Bölünme build'den build'e yer değiştirdiği için alarm da kararsızdır.
 * Yalan söyleyen denetçi görmezden gelinir; o yüzden yükü ayıklıyoruz ve
 * yalnız KULLANICIYA GÖRÜNEN HTML'de arıyoruz.
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
let toplamLink = 0

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

  const t = (ham.match(/<title>(.*?)<\/title>/s) || [])[1]
  if (t) {
    if (!basliklar.has(t)) basliklar.set(t, [])
    basliklar.get(t).push(yol)
  }
}

const yinelenen = [...basliklar].filter(([, v]) => v.length > 1)

console.log(`sayfa ${dosyalar.length} · iç link ${toplamLink}`)
console.log(`kırık link hedefi : ${kirik.size}`)
for (const [hedef, kaynak] of [...kirik].slice(0, 10)) {
  console.log(`   ✗ ${hedef}  ←  ${[...kaynak].slice(0, 2).join(', ')}`)
}
console.log(`tedarikçi sızıntısı: ${sizinti.length}`)
for (const s of sizinti.slice(0, 10)) console.log(`   ✗ ${s.yol} — ${s.ad} ("${s.eslesen}")`)
console.log(`yinelenen <title>  : ${yinelenen.length}`)
for (const [t, v] of yinelenen.slice(0, 10)) console.log(`   ✗ "${t.slice(0, 60)}" → ${v.join(', ')}`)

const hata = kirik.size + sizinti.length + yinelenen.length
console.log(hata === 0 ? '\n✅ temiz' : `\n⛔ ${hata} sorun`)
process.exit(hata === 0 ? 0 : 1)
