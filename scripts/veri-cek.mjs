/**
 * Ürün verisi çekme script'i — Supabase `stok_kartlari` → data/urunler.json
 *
 * ÇALIŞTIRMA:  node scripts/veri-cek.mjs
 *
 * NEDEN SNAPSHOT? Katalog sayfaları pazarlama içeriğidir; fiyat/stok göstermez.
 * Verinin canlı olması gerekmez. Snapshot ile: build hızlı, çalışma anında
 * veritabanı bağımlılığı yok, ERP'ye açılan yüzey yok. Ürün listesi değiştikçe
 * bu script yeniden çalıştırılıp çıktı commit'lenir.
 *
 * ⚠ TÜRKÇE "İ" TUZAĞI (ölçüldü, 29.07.2026):
 *   ILIKE '%SİLİNDİR%' → 230 kayıt
 *   ILIKE '%SILINDIR%' → 215 kayıt
 *   regex  S[İIi]L[İIi]ND[İIi]R → 445 kayıt  ← ikisinin birleşimi
 * Veride her iki yazım da mevcut. Bu yüzden eşleştirme DAİMA regex (~*) ile
 * yapılır; düz ILIKE kullanılırsa ürünlerin yarısı sessizce kaybolur.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const KOK = join(dirname(fileURLToPath(import.meta.url)), '..')
const URL_BASE = process.env.SUPABASE_URL || 'https://ujmtoruicnmgoarwzhwp.supabase.co'
const ANON = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqbXRvcnVpY25tZ29hcnd6aHdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3NTAwMzIsImV4cCI6MjA4MzMyNjAzMn0.2aQnxfImdDve5UbAdhxrp6zAOVriSKyDhDbVEB3P39I'

const KALEM_LIMIT = 60   // sayfada gösterilecek örnek ürün sayısı

async function sorgula(params) {
  const u = `${URL_BASE}/rest/v1/stok_kartlari?${params}`
  const r = await fetch(u, {
    headers: { apikey: ANON, Authorization: `Bearer ${ANON}`, Prefer: 'count=exact' },
  })
  if (!r.ok) throw new Error(`Supabase ${r.status}: ${(await r.text()).slice(0, 200)}`)
  const toplam = Number((r.headers.get('content-range') || '').split('/')[1]) || 0
  return { satirlar: await r.json(), toplam }
}

const kategoriler = JSON.parse(readFileSync(join(KOK, 'data/kategoriler.json'), 'utf8'))
const cikti = { uretim: new Date().toISOString(), kategoriler: {} }

for (const k of kategoriler) {
  // PostgREST regex operatörü: ~* (büyük/küçük harf duyarsız POSIX regex)
  let f = `aktif=is.true&urun_ismi=imatch.${encodeURIComponent(k.eslesme)}`
  if (k.haric) f += `&urun_ismi=not.imatch.${encodeURIComponent(k.haric)}`
  const sec = 'select=kodu,urun_ismi&order=urun_ismi.asc'

  const { satirlar, toplam } = await sorgula(`${f}&${sec}&limit=${KALEM_LIMIT}`)
  cikti.kategoriler[k.slug] = {
    toplamUrun: toplam,
    urunler: satirlar.map((s) => ({ kod: s.kodu, ad: s.urun_ismi })),
  }
  console.log(`  ${k.slug.padEnd(24)} ${String(toplam).padStart(5)} ürün  (örnek: ${satirlar.length})`)
}

mkdirSync(join(KOK, 'data'), { recursive: true })
writeFileSync(join(KOK, 'data/urunler.json'), JSON.stringify(cikti, null, 2) + '\n')
const top = Object.values(cikti.kategoriler).reduce((a, b) => a + b.toplamUrun, 0)
console.log(`\n✅ data/urunler.json yazıldı — ${Object.keys(cikti.kategoriler).length} kategori, ${top} ürün eşleşti.`)
