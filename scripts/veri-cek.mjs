/**
 * Ürün verisi tazeleme script'i — Supabase `stok_kartlari` → data/urunler.json
 *
 * ÇALIŞTIRMA:  SUPABASE_SERVICE_ROLE_KEY=... node scripts/veri-cek.mjs
 *
 * NEDEN SNAPSHOT? Katalog sayfaları pazarlama içeriğidir; fiyat/stok göstermez.
 * Verinin canlı olması gerekmez. Snapshot ile: build hızlı, çalışma anında
 * veritabanı bağımlılığı yok, ERP'ye açılan yüzey yok. Ürün listesi değiştikçe
 * bu script yeniden çalıştırılıp çıktı commit'lenir.
 *
 * ⚠ ANON ANAHTAR YETMEZ: `stok_kartlari` üzerinde RLS var, anon rolü SIFIR satır
 * görür (ölçüldü, 29.07.2026). Servis anahtarı olmadan çalıştırırsanız script
 * veriyi boşaltmaz, hata verip durur (aşağıdaki güvenlik kontrolü).
 *
 * ⚠ YIKICI DEĞİLDİR: tablodaki örnek satırlar elle düzenlenmiştir (temiz ad,
 * gerçek marka, model/ölçü). Script bunları EZMEZ; yalnız
 *   • `toplamUrun` sayılarını tazeler,
 *   • listede olmayan ama çok satan kalemleri konsola "eklenebilir" diye yazar,
 *   • hiç satırı olmayan yeni kategoriyi ilk kez doldurur.
 * Yani çıktı, insanın verdiği kararları korur.
 *
 * ⚠ TÜRKÇE "İ" TUZAĞI (ölçüldü, 29.07.2026):
 *   ILIKE '%SİLİNDİR%' → 230 kayıt
 *   ILIKE '%SILINDIR%' → 215 kayıt
 *   regex  S[İIi]L[İIi]ND[İIi]R → 445 kayıt  ← ikisinin birleşimi
 * Veride her iki yazım da mevcut. Bu yüzden eşleştirme DAİMA regex (~*) ile
 * yapılır; düz ILIKE kullanılırsa ürünlerin yarısı sessizce kaybolur.
 *
 * ⚠ KOD İLE EŞLEŞTİRME: sızdırmazlık grubunda ürün adı "k21-040/11 ( 40 x 50 x 8 )"
 * biçimindedir — ne olduğunu söyleyen tek kelime yoktur. O yüzden kategoriler
 * `eslesmeKod` / `haricKod` alanlarıyla stok KODU üzerinden de eşleşebilir.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { sertlestir } from './turkce-regex.mjs'

const KOK = join(dirname(fileURLToPath(import.meta.url)), '..')
const URL_BASE = process.env.SUPABASE_URL || 'https://ujmtoruicnmgoarwzhwp.supabase.co'
const ANAHTAR = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
if (!ANAHTAR) {
  console.error('SUPABASE_SERVICE_ROLE_KEY tanımlı değil — RLS yüzünden anon anahtar boş döner.')
  process.exit(1)
}

const ONERI_LIMIT = 25 // konsolda önerilecek "listede yok ama çok satıyor" kalem sayısı

/**
 * "Muhtelif" tezgâh kartları — adı tek bir cins ismi olan, ölçüsü/modeli
 * olmayan kayıtlar (MUH.MUH.26 "HORTUM", MUH.MUH.40 "REKOR" gibi). Listede
 * olmayan bir kalemi hızlıca satmak için açılmışlar; gerçek ürün değiller.
 * Sayıyı şişiriyor ve örnek tabloda "Hortum" diye bir satır olarak görünüyorlar.
 * Ölçüldü (30.07.2026): 16 kart, biri aylık 362 hareketle en üstte çıkıyordu.
 */
const GENEL_HARIC = [
  '^ *(HORTUM|RAKOR|REKOR|N[İIiı]PEL|TAPA|VALF|POMPA|VANA|KELEPÇE|KEÇE|CONTA',
  '|S[İIiı]L[İIiı]ND[İIiı]R|NUTR[İIiı]NG|SOKET|ADAPT[ÖO]R|MANOMETRE|BOB[İIiı]N',
  '|F[İIiı]LTRE|SOĞUTUCU|H[İIiı]DROMOTOR|ELEKTR[İIiı]K MOTORU',
  '|TAM[İIiı]R TAK[İIiı]M[İIiı]|KEÇE TAK[İIiı]M[İIiı]|KROM M[İIiı]L)( *\\(.{0,20}\\))? *$',
].join('')

/** PostgREST değer kaçışı: regex'te virgül/parantez var, tırnak içine alınmalı. */
const tirnak = (v) => `"${String(v).replace(/"/g, '\\"')}"`

async function sorgula(params) {
  const r = await fetch(`${URL_BASE}/rest/v1/stok_kartlari?${params}`, {
    headers: { apikey: ANAHTAR, Authorization: `Bearer ${ANAHTAR}`, Prefer: 'count=exact' },
  })
  if (!r.ok) throw new Error(`Supabase ${r.status}: ${(await r.text()).slice(0, 200)}`)
  const toplam = Number((r.headers.get('content-range') || '').split('/')[1]) || 0
  return { satirlar: await r.json(), toplam }
}

/**
 * Kategorinin filtre dizesi: (ad VEYA kod eşleşmesi) EKSİ (ad VEYA kod hariçleri).
 * Tüm regex'ler sorgu anında sertleştirilir (Türkçe ı tuzağı). Fonksiyon
 * etkisiz olduğu için dosyadaki regex zaten sertse hiçbir şey değişmez.
 */
function filtre(k) {
  const p = ['aktif=is.true']
  const esle = []
  if (k.eslesme) esle.push(`urun_ismi.imatch.${tirnak(sertlestir(k.eslesme))}`)
  if (k.eslesmeKod) esle.push(`kodu.imatch.${tirnak(sertlestir(k.eslesmeKod))}`)
  if (!esle.length) throw new Error(`${k.slug}: eslesme veya eslesmeKod gerekli`)
  p.push(`or=(${esle.join(',')})`) // tek koşulda da geçerli sözdizim
  const haric = k.haric ? `${sertlestir(k.haric)}|${GENEL_HARIC}` : GENEL_HARIC
  p.push(`urun_ismi=not.imatch.${tirnak(haric)}`)
  if (k.haricKod) p.push(`kodu=not.imatch.${tirnak(sertlestir(k.haricKod))}`)
  return p.join('&')
}

const kategoriler = JSON.parse(readFileSync(join(KOK, 'data/kategoriler.json'), 'utf8'))
const mevcut = JSON.parse(readFileSync(join(KOK, 'data/urunler.json'), 'utf8'))
const cikti = { ...mevcut, uretim: new Date().toISOString().slice(0, 10), kategoriler: {} }

for (const k of kategoriler) {
  const f = filtre(k)
  const sec = 'select=kodu,urun_ismi,sa_aylik_tuketim&order=sa_aylik_tuketim.desc.nullslast'
  const { satirlar, toplam } = await sorgula(`${f}&${sec}&limit=${ONERI_LIMIT}`)

  // Güvenlik kontrolü: eskiden dolu olan kategori boşaldıysa filtre veya yetki
  // bozulmuştur. Bu durumda veriyi ezmek, sayfayı sessizce boşaltmak demektir.
  const onceki = mevcut.kategoriler?.[k.slug]
  if (toplam === 0 && onceki?.toplamUrun) {
    console.error(`\n⛔ ${k.slug}: sorgu 0 döndü ama dosyada ${onceki.toplamUrun} yazıyor.`)
    console.error('   Yetki (RLS) veya eşleşme regex\'i bozuk. Dosya YAZILMADI.')
    process.exit(1)
  }

  const elle = onceki?.urunler ?? []
  cikti.kategoriler[k.slug] = {
    toplamUrun: toplam,
    // Elle düzenlenmiş satırlar korunur; yalnız hiç satırı olmayan kategori doldurulur.
    urunler: elle.length ? elle : satirlar.map((s) => ({ kod: s.kodu, ad: s.urun_ismi })),
  }

  const varOlan = new Set(elle.map((u) => u.kod))
  const yeni = satirlar.filter((s) => !varOlan.has(s.kodu) && Number(s.sa_aylik_tuketim) > 0)
  console.log(`  ${k.slug.padEnd(24)} ${String(toplam).padStart(5)} kalem`)
  for (const s of yeni.slice(0, 5)) {
    console.log(`      + listede yok: ${s.kodu}  (aylık ${s.sa_aylik_tuketim})  ${s.urun_ismi}`)
  }
}

mkdirSync(join(KOK, 'data'), { recursive: true })
writeFileSync(join(KOK, 'data/urunler.json'), JSON.stringify(cikti, null, 1) + '\n')
const top = Object.values(cikti.kategoriler).reduce((a, b) => a + b.toplamUrun, 0)
console.log(`\n✅ data/urunler.json yazıldı — ${kategoriler.length} kategori, ${top} kalem.`)
console.log('   Yukarıdaki "listede yok" satırlarını tabloya eklemek İNSAN kararıdır.')
