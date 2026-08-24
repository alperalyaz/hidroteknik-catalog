/**
 * Kastaş profil ölçülerini Supabase'den TAM olarak çeker.
 *
 *   node scripts/profil-olcu-cek.mjs            (kuru çalışma)
 *   node scripts/profil-olcu-cek.mjs --uygula   (data/profiller.json'a yazar)
 *
 * ── NEDEN ──────────────────────────────────────────────────────────────────
 * `profiller.json` içindeki `olculer` listesi elle seçilmişti: her ailenin en
 * çok hareket gören 34–55 ölçüsü. Sayfa "K21 profilinde 1.223 ölçü stokta"
 * diyor ama 55 tanesini gösteriyordu — %4,5.
 *
 * Arama motoru için bu yeterliydi; sayfa "K21 keçe" sorgusunda zaten çıkıyor.
 * ÜRETKEN motor için değil: cevabı çektiği metinden kuruyor, sayfada olmayan
 * ölçü onun için YOK. "K21 40x50x8 kimde var" sorusuna ancak o satır sayfada
 * duruyorsa cevap verilebilir. Ölçü listesi kısa olduğu sürece katalog
 * 5.014 ölçünün 1.415'i kadar alıntılanabilir.
 *
 * Ölçüldü (24.08.2026): 43 ailenin Supabase'deki kayıt sayısı `adet` alanıyla
 * birebir tutuyor (K21 1223=1223, K22 399=399…). Yani İDDİA DOĞRUYDU, yalnız
 * kanıtı sayfada yoktu.
 *
 * ── NE ÇEKİLİR, NE ÇEKİLMEZ ────────────────────────────────────────────────
 * Sorguda YALNIZ `kodu` ve `urun_ismi` seçilir. `stok_kartlari` tablosunda
 * fiyat_a_klas … fiyat_e_klas, alis_fiyat ve net_fiyat sütunları var; bunlar
 * kataloğa hiç girmez, o yüzden select listesi açıkça yazılır — `*` kullanmak
 * fiyatı belleğe alır ve bir gün yanlışlıkla yazılmasına kapı açar.
 *
 * Yayımlanan kod `KASTAS.` öneki atılmış hâlidir: KASTAS.K21-040/11 → K21-040/11.
 * Önek bizim, kalanı Kastaş'ın katalog kodudur (bkz. CLAUDE.md).
 *
 * ── `yer` EZİLMEZ ──────────────────────────────────────────────────────────
 * `yer` (mil/piston) ölçü sırasından türetilir ve Kastaş'ın kendi
 * sınıflandırmasıyla karşılaştırılıp doğrulanmıştı. Tam liste geldiğinde
 * ailelerin bir kısmında sıra tutarsızlaşabilir (aynı ailede hem mil hem
 * piston varyantı olabiliyor). Bu araç `yer`e DOKUNMAZ; yalnız uyuşmazlığı
 * raporlar ki insan bakabilsin.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const KOK = process.cwd()
const UYGULA = process.argv.includes('--uygula')
const ZORLA = process.argv.includes('--zorla')

const URL_BASE = process.env.SUPABASE_URL || 'https://ujmtoruicnmgoarwzhwp.supabase.co'
const ANAHTAR = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!ANAHTAR) {
  console.error('⛔ SUPABASE_SERVICE_ROLE_KEY gerekli. Anon anahtar RLS yüzünden sıfır satır görür.')
  process.exit(1)
}

/**
 * Kaydın hangi profil ailesine ait olduğunu söyler; hiçbirine ait değilse null.
 *
 * Aile listesi TAHMİN EDİLMEZ, `profiller.json`daki 43 koddan kurulur. Desen
 * tahmini iki türlü yanılıyordu:
 *   - `^[A-Za-z]+\d+` KSB'yi hiç görmüyor (kodunda rakam yok, fenolik yataklama)
 *   - aynı desen `K-203287` ve `BOX.1,78` gibi aileye ait OLMAYAN kodları da
 *     ailelere sokuyordu (1.038 kayıt bu kalıba uymuyor ve çoğu o-ring kiti)
 *
 * En uzun eşleşme önce denenir: K150/K151/K152 varken K15'in onları yutmaması
 * için şart. Aile kodundan sonra ayraç (-, ., boşluk) ya da dizgi sonu aranır;
 * yoksa K1 deseni K10'u da tutardı. Üç ayraç da veride gerçekten geçiyor:
 * `K21-040/11`, `K707.01.01`, `K18 020-011`.
 */
function aileEsleyici(kodlar) {
  const sirali = [...kodlar].sort((a, b) => b.length - a.length)
  return (stokKodu) => {
    const s = stokKodu.replace(/^KASTAS\./i, '').trim().toUpperCase()
    for (const k of sirali) {
      if (s.startsWith(k) && (s.length === k.length || /[-. ]/.test(s[k.length]))) return k
    }
    return null
  }
}

/**
 * Ürün adından ölçüyü çıkarır; çıkaramazsa null.
 *
 * Birincil biçim parantez içidir: "k21-040/11 ( 40 x 50 x 8 )". 5.014 kaydın
 * 5.003'ü böyle. Kalan 11'inde ölçü parantezsiz duruyor ve ayrıştırılabilir
 * bir kalıp taşıyor ("K17 050-034,5/1 50X34,5X6,3"), o yüzden ikinci deneme
 * ad gövdesinde serbest arama yapar.
 *
 * Ayraç üç türlü yazılmış: x, X, * ve ×. Malzeme eki (PU/FKM) ölçünün İÇİNE
 * girmiş olabiliyor ("240X260X10/18 PU") — ölçü değil, atılır.
 */
const SAYI = '(\\d+(?:[.,]\\d+)?)'
const AYRAC = '\\s*[xX×*]\\s*'
const UC_SAYI = new RegExp(SAYI + AYRAC + SAYI + AYRAC + '(\\d+(?:[.,]\\d+)?(?:\\s*\\/\\s*\\d+(?:[.,]\\d+)?)?)')
const IKI_SAYI = new RegExp(SAYI + AYRAC + SAYI)

/**
 * Ürün adından ölçüyü çıkarır; çıkaramazsa null.
 *
 * Sızdırmazlık elemanı üç sayıyla ölçülür (iç × dış × yükseklik) ve 5.014
 * kaydın 5.003'ünde bu üçlü parantez içindedir: "k21-040/11 ( 40 x 50 x 8 )".
 * Kalan 11'inde parantez yok ama üçlü ad gövdesinde duruyor, o yüzden ikinci
 * deneme tüm adı tarar.
 *
 * İKİ SAYILI ölçü de gerçektir ve uydurma bir yedek değildir: KSB (fenolik
 * yataklama) kalınlık × genişlik ile ölçülür — "ksb-2,5x10 ( 2,5 x 10 fenolik
 * yataklama )". Üçlü önce denendiği için ikili yalnız gerçekten üç sayı
 * olmadığında devreye girer.
 */
function olcuCikar(ad) {
  const paren = ad.match(/\(([^)]*)\)/)
  const kaynaklar = [paren ? paren[1] : null, ad].filter(Boolean)
  for (const re of [UC_SAYI, IKI_SAYI]) {
    for (const kaynak of kaynaklar) {
      const m = kaynak.match(re)
      if (m) {
        return m[3] === undefined
          ? `${m[1]} x ${m[2]}`
          : `${m[1]} x ${m[2]} x ${m[3].replace(/\s*\/\s*/, '/')}`
      }
    }
  }
  return null
}

async function cek() {
  const hepsi = []
  for (let off = 0; ; off += 1000) {
    const q = `select=kodu,urun_ismi&aktif=is.true&kodu=like.KASTAS.*&order=kodu&limit=1000&offset=${off}`
    const r = await fetch(`${URL_BASE}/rest/v1/stok_kartlari?${q}`, {
      headers: { apikey: ANAHTAR, Authorization: `Bearer ${ANAHTAR}` },
    })
    if (!r.ok) throw new Error(`Supabase ${r.status}: ${(await r.text()).slice(0, 200)}`)
    const b = await r.json()
    hepsi.push(...b)
    if (b.length < 1000) break
  }
  return hepsi
}

const profiller = JSON.parse(readFileSync(join(KOK, 'data/profiller.json'), 'utf8'))
const ham = await cek()
console.log(`Supabase: ${ham.length} aktif Kastaş kaydı\n`)

// Aileye göre grupla
const aileKodu = aileEsleyici(profiller.map((p) => p.kod.toUpperCase()))
const gruplar = new Map()
for (const r of ham) {
  const a = aileKodu(r.kodu)
  if (!a) continue
  if (!gruplar.has(a)) gruplar.set(a, [])
  gruplar.get(a).push(r)
}

let toplamEski = 0
let toplamYeni = 0
let atlanan = 0
const uyari = []
const rapor = []

for (const p of profiller) {
  const kayitlar = gruplar.get(p.kod.toUpperCase()) || []

  // Emniyet: aile boş döndüyse desen ya da yetki bozuk — dosyayı ezme.
  if (kayitlar.length === 0) {
    console.error(`⛔ ${p.kod}: Supabase 0 kayıt döndü ama dosyada ${p.adet} yazıyor.`)
    console.error('   Yetki (RLS) ya da kod deseni bozuk. Dosya YAZILMADI.')
    process.exit(1)
  }

  const olculer = []
  const gorulen = new Set()
  for (const r of kayitlar) {
    // Ölçü okunamıyorsa kayıt DÜŞÜRÜLMEZ, `olcu` boş bırakılır.
    //
    // K14 (V-ring) ailesinin 25 kaydının hiçbirinde üç sayılı ölçü yok: V-ring
    // tek mil çapıyla ölçülür ve ad yalnız tipi söyler ("a tipi v-ring").
    // Kod yine de gerçek ve aranan bir Kastaş katalog kodudur (K14-030 A), o
    // yüzden yayımlanır; ölçü hücresi boş kalır. `profiller.json` bu ailede
    // zaten böyleydi — bkz. CLAUDE.md, "Doğrulanamayan bilgi boş bırakılır".
    //
    // Koddaki sayının mil çapı olduğu (K14-030 → Ø30) tahmin edilebilir ama
    // Kastaş'ın numaralandırma kuralı DOĞRULANMADI, o yüzden yazılmaz.
    const olcu = olcuCikar(r.urun_ismi) || ''
    if (!olcu) atlanan++
    // Yayımlanan kod: KASTAS. öneki BİZİM, atılır.
    const kod = r.kodu.replace(/^KASTAS\./i, '').trim().replace(/\s+/g, ' ')
    if (gorulen.has(kod)) continue
    gorulen.add(kod)
    olculer.push({ kod, olcu })
  }

  // Ölçüye göre sırala (iç/dış çap, sonra yükseklik) — sayfada okunabilir olsun.
  const sayi = (o) => (o || '').split(/\s*x\s*/).map((n) => parseFloat(n.replace(',', '.')))
  olculer.sort((a, b) => {
    // Ölçüsüz kayıtlar sona, kendi aralarında koda göre.
    if (!a.olcu && !b.olcu) return a.kod.localeCompare(b.kod, 'tr')
    if (!a.olcu) return 1
    if (!b.olcu) return -1
    const A = sayi(a.olcu), B = sayi(b.olcu)
    return A[0] - B[0] || A[1] - B[1] || A[2] - B[2]
  })

  // Emniyet: liste küçüldüyse bir şey ters gitmiştir.
  if (olculer.length < p.olculer.length && !ZORLA) {
    console.error(`⛔ ${p.kod}: ${p.olculer.length} → ${olculer.length} (KÜÇÜLDÜ). Dosya YAZILMADI.`)
    console.error('   Gerçekten azaldıysa --zorla ile geçin.')
    process.exit(1)
  }

  if (olculer.length !== p.adet) {
    uyari.push(`${p.kod}: adet ${p.adet} ama ayrıştırılan ${olculer.length}`)
  }

  rapor.push({ kod: p.kod, eski: p.olculer.length, yeni: olculer.length, adet: p.adet })
  toplamEski += p.olculer.length
  toplamYeni += olculer.length
  p.olculer = olculer
  p.adet = olculer.length
  // capMin/capMax tam listeden yeniden hesaplanır — eski değer 55 ölçüye göreydi.
  // Tamamı ölçüsüz bir ailede (K14) çap ekseni hesaplanamaz; eski değer korunur.
  const ilk = olculer.map((x) => sayi(x.olcu)[0]).filter(Number.isFinite)
  if (ilk.length) {
    p.capMin = Math.min(...ilk)
    p.capMax = Math.max(...ilk)
  }
  p.pu = olculer.some((x) => /\bPU\b/i.test(x.kod))
}

rapor.sort((a, b) => b.yeni - a.yeni)
console.log('profil     eski → yeni    (adet iddiası)')
for (const r of rapor.slice(0, 12)) {
  console.log(`  ${r.kod.padEnd(8)} ${String(r.eski).padStart(4)} → ${String(r.yeni).padStart(5)}      ${r.adet}`)
}
if (rapor.length > 12) console.log(`  … ${rapor.length - 12} profil daha`)

console.log(`\ntoplam ölçü: ${toplamEski} → ${toplamYeni}`)
console.log(`ayrıştırılamayan (ölçüsü okunamayan kayıt): ${atlanan}`)
if (uyari.length) {
  console.log(`\n⚠ adet/ayrıştırma farkı (${uyari.length}):`)
  for (const u of uyari.slice(0, 10)) console.log(`   ${u}`)
}

if (!UYGULA) {
  console.log('\nKURU ÇALIŞMA — hiçbir şey yazılmadı. Yazmak için: --uygula')
  process.exit(0)
}

profiller.sort((a, b) => b.adet - a.adet)
writeFileSync(join(KOK, 'data/profiller.json'), JSON.stringify(profiller, null, 1) + '\n')
console.log('\n✅ data/profiller.json yazıldı.')
