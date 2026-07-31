/**
 * Stok kodu göçü — eski kod → yeni kod eşlemesini katalog verisine uygular.
 *
 *   node scripts/kod-gocur.mjs eski-yeni.csv          # önce KURU ÇALIŞTIRMA
 *   node scripts/kod-gocur.mjs eski-yeni.csv --uygula # dosyaları gerçekten yaz
 *
 * CSV biçimi: başlık satırı serbest, ilk iki sütun `eski,yeni` olarak okunur.
 * Ayraç virgül ya da noktalı virgül olabilir; tırnaklı alanlar desteklenir.
 *
 * ── NEDEN AYRI BİR ARAÇ ───────────────────────────────────────────────────
 * Kodlar iki ayrı yerde yaşıyor ve ikisi FARKLI davranıyor:
 *
 *   1. data/urunler.json → örnek ürün satırlarının `kod` alanı.
 *      Düz değer. Eşlemede varsa değişir, yoksa olduğu gibi kalır.
 *
 *   2. data/kategoriler.json → `eslesmeKod` / `haricKod` REGEX'leri.
 *      Bunlar tek tek kod değil DESEN tutar (`^KASTAS\.`, `^CNC\.`). Bir
 *      eşleme tablosu bunları çeviremez: yeni kodların hangi önekle
 *      başlayacağını ancak insan bilir. Araç bu yüzden onları DEĞİŞTİRMEZ,
 *      yalnız RAPORLAR — kod göçünden sonra elle gözden geçirilmeleri şart.
 *
 * ── SESSİZ BOZULMA TEHLİKESİ ──────────────────────────────────────────────
 * Bir kategori kod desenine dayanıyorsa ve desen yeni kodlarda hiçbir şeyi
 * tutmuyorsa, kategori SIFIR ürünle çalışmaya devam eder: tsc geçer, build
 * geçer, link denetimi geçer, sayfa yayına çıkar ve boş görünür. Bu yüzden
 * araç kod desenine dayanan kategorileri her koşumda ekrana basar ve
 * `--uygula` sonrası çıkış kodunu 2 yapar (0 değil) — böylece bir CI adımı
 * "insan bakması gerek" durumunu fark eder.
 */
import { readFileSync, writeFileSync } from 'node:fs'

const [, , csvYolu, ...bayraklar] = process.argv
const UYGULA = bayraklar.includes('--uygula')

if (!csvYolu) {
  console.error('kullanım: node scripts/kod-gocur.mjs <eski-yeni.csv> [--uygula]')
  process.exit(1)
}

/** Basit ama tırnak-farkında CSV satırı çözümleyici. */
function satiriAyir(satir) {
  const alan = []
  let simdi = ''
  let tirnakta = false
  for (let i = 0; i < satir.length; i++) {
    const c = satir[i]
    if (c === '"') {
      if (tirnakta && satir[i + 1] === '"') { simdi += '"'; i++ } else tirnakta = !tirnakta
    } else if ((c === ',' || c === ';') && !tirnakta) {
      alan.push(simdi); simdi = ''
    } else simdi += c
  }
  alan.push(simdi)
  return alan.map((a) => a.trim())
}

const satirlar = readFileSync(csvYolu, 'utf8').split(/\r?\n/).filter((s) => s.trim())
const esleme = new Map()
let atlanan = 0

for (const [i, satir] of satirlar.entries()) {
  const [eski, yeni] = satiriAyir(satir)
  if (!eski || !yeni) { atlanan++; continue }
  // Başlık satırını sez: "eski"/"old"/"kod" gibi bir şey yazıyorsa geç.
  if (i === 0 && /^(eski|old|kod|code)/i.test(eski)) continue
  if (esleme.has(eski) && esleme.get(eski) !== yeni) {
    throw new Error(`çelişkili eşleme: ${eski} → ${esleme.get(eski)} ve ${yeni}`)
  }
  esleme.set(eski, yeni)
}

console.log(`eşleme okundu: ${esleme.size} kod${atlanan ? ` (${atlanan} boş satır atlandı)` : ''}`)

// ── 1) urunler.json: örnek satırların kodları ────────────────────────────
const u = JSON.parse(readFileSync('data/urunler.json', 'utf8'))
const degisen = []
const bulunamayan = []

for (const [slug, kat] of Object.entries(u.kategoriler)) {
  for (const p of kat.urunler) {
    if (esleme.has(p.kod)) {
      degisen.push({ slug, eski: p.kod, yeni: esleme.get(p.kod) })
      p.kod = esleme.get(p.kod)
    } else {
      bulunamayan.push({ slug, kod: p.kod })
    }
  }
}

console.log(`\nörnek ürün kodu — değişen: ${degisen.length} · eşlemede olmayan: ${bulunamayan.length}`)
for (const d of degisen.slice(0, 12)) console.log(`   ${d.eski.padEnd(22)} → ${d.yeni}`)
if (degisen.length > 12) console.log(`   … ${degisen.length - 12} satır daha`)

if (bulunamayan.length) {
  console.log('\n⚠ eşlemede karşılığı OLMAYAN kodlar (bu satırlar ölü koda işaret ediyor olabilir):')
  const grup = new Map()
  for (const b of bulunamayan) {
    if (!grup.has(b.slug)) grup.set(b.slug, [])
    grup.get(b.slug).push(b.kod)
  }
  for (const [slug, kodlar] of grup) {
    console.log(`   ${slug.padEnd(22)} ${kodlar.length}  ${kodlar.slice(0, 4).join(', ')}${kodlar.length > 4 ? ' …' : ''}`)
  }
}

// ── 2) kategoriler.json: kod DESENLERİ — değiştirilmez, raporlanır ───────
const k = JSON.parse(readFileSync('data/kategoriler.json', 'utf8'))
const desenli = k.filter((c) => c.eslesmeKod || c.haricKod)

console.log(`\n${'═'.repeat(70)}`)
console.log(`ELLE BAKILMASI GEREKEN: kod desenine dayanan ${desenli.length} kategori`)
console.log('Bu desenler tek tek kod değil ÖNEK tutar; eşleme tablosu çeviremez.')
console.log(`${'═'.repeat(70)}`)
for (const c of desenli) {
  console.log(`   ${c.slug.padEnd(24)} eslesmeKod=${c.eslesmeKod || '—'}   haricKod=${c.haricKod || '—'}`)
}
console.log('\nBu kategoriler yeni kod düzeninde hiçbir şey tutmazsa SIFIR ürünle')
console.log('sessizce yayına çıkar. Göçten sonra `npm run veri` ile sayıları')
console.log('tazeleyip her birinin toplamının 0 olmadığını doğrulayın.')

// ── yaz ───────────────────────────────────────────────────────────────────
if (UYGULA) {
  writeFileSync('data/urunler.json', JSON.stringify(u, null, 1) + '\n')
  console.log(`\n✅ data/urunler.json yazıldı (${degisen.length} kod değişti)`)
  console.log('⚠ Kategori kod desenleri DEĞİŞTİRİLMEDİ — yukarıdaki listeyi elden geçirin.')
  process.exit(desenli.length ? 2 : 0)
} else {
  console.log('\nKURU ÇALIŞTIRMA — hiçbir dosya yazılmadı. Uygulamak için --uygula ekleyin.')
}
