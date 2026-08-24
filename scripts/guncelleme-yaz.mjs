/**
 * `data/guncelleme.json` üretir: her veri ailesinin EN SON ne zaman değiştiği.
 *
 *   npm run guncelleme
 *
 * ── NEDEN DOSYAYA YAZILIYOR, BUILD'DE HESAPLANMIYOR ────────────────────────
 * Tarih git'ten geliyor (`git log -1 --format=%cs -- <dosya>`) çünkü tek dürüst
 * kayıt orada: dosya gerçekten ne zaman değişti. Ama Vercel SIĞ KLON yapıyor;
 * build sırasında `git log` çoğu dosya için boş döner ve tarih sessizce bugüne
 * ya da hiçliğe düşer. O yüzden tarih burada, tam geçmişin bulunduğu yerde
 * hesaplanıp dosyaya yazılır ve commit'lenir.
 *
 * ── NEDEN `new Date()` DEĞİL ───────────────────────────────────────────────
 * Her build'de bugünü damgalamak `dateModified`i yalancı yapar: 306 sayfanın
 * hepsi her deploy'da "bugün değişti" der. Google, tutarlı ve doğrulanabilir
 * olmayan tarih sinyallerini dikkate almayı bırakır — yani yalan söyleyen
 * tarih, hiç tarih olmamasından kötüdür. `app/sitemap.ts` hâlâ bu hatayı
 * yapıyor (lastModified: new Date()); ayrı bir iş olarak duruyor.
 */
import { execFileSync } from 'node:child_process'
import { writeFileSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const KOK = process.cwd()

/** Sayfa ailesi → o aileyi besleyen veri dosyaları. En yenisi kazanır. */
const AILE_DOSYALARI = {
  kategori: ['data/kategoriler.json', 'data/kategoriler.en.json', 'data/kategoriler.ru.json', 'data/urunler.json'],
  profil: ['data/profiller.json'],
  marka: ['data/markalar.json'],
  rehber: ['data/rehberler.json'],
  silindirParca: ['data/silindir-parcalari.json'],
  ureticiKod: ['data/uretici-kodlari.json'],
}

function sonDegisim(dosya) {
  try {
    const t = execFileSync('git', ['log', '-1', '--format=%cs', '--', dosya], {
      cwd: KOK,
      encoding: 'utf8',
    }).trim()
    return t || null
  } catch {
    return null
  }
}

const cikti = {}
let eksik = 0
for (const [aile, dosyalar] of Object.entries(AILE_DOSYALARI)) {
  const tarihler = dosyalar.map(sonDegisim).filter(Boolean)
  if (!tarihler.length) {
    console.error(`⛔ ${aile}: hiçbir dosyanın git tarihi okunamadı (sığ klon mu?)`)
    eksik++
    continue
  }
  cikti[aile] = tarihler.sort().at(-1)
}

if (eksik) {
  console.error('\nDosya YAZILMADI. Tam geçmişi olan bir klonda çalıştırın.')
  process.exit(1)
}

// Kategori ailesi ürün sayısı da taşıdığı için urunler.json'un kendi damgası
// varsa onu da dikkate al — dosya git'e girmeden önce tazelenmiş olabilir.
try {
  const u = JSON.parse(readFileSync(join(KOK, 'data/urunler.json'), 'utf8'))
  if (u.uretim && u.uretim > cikti.kategori) cikti.kategori = u.uretim
} catch {}

writeFileSync(join(KOK, 'data/guncelleme.json'), JSON.stringify(cikti, null, 1) + '\n')
console.log('✅ data/guncelleme.json yazıldı:')
for (const [a, t] of Object.entries(cikti)) console.log(`   ${a.padEnd(14)} ${t}`)
