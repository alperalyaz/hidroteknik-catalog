/**
 * Jenerik pnömatik/vakum/hidrolik kodlarını `data/uretici-kodlari.json`'a işler.
 *
 *   node scripts/pnomatik-kod-uret.mjs            (kuru çalışma)
 *   node scripts/pnomatik-kod-uret.mjs --uygula
 *
 * ELLE KURULMUŞ GRUPLAR KORUNUR. Üreteç yalnız MARKASIZ grupları yönetir;
 * markalı gruplara (Gamak, Pemaks, Ferro…) dokunmaz. Daha önce bir üreteç
 * elle kurulmuş Pemaks bloğunu sessizce ezmişti — o yüzden burada sahiplik
 * açıkça `marka` alanının yokluğuyla belirlenir.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { PNOMATIK_KOD } from './pnomatik-kod-veri.mjs'

const KOK = process.cwd()
const UYGULA = process.argv.includes('--uygula')
const YOL = join(KOK, 'data/uretici-kodlari.json')

const mevcut = JSON.parse(readFileSync(YOL, 'utf8'))
const markali = mevcut.filter((g) => g.marka)
const markasizEski = mevcut.filter((g) => !g.marka)

const kategoriler = JSON.parse(readFileSync(join(KOK, 'data/kategoriler.json'), 'utf8'))
const gecerli = new Set(kategoriler.map((k) => k.slug))

const yeni = []
const atlanan = []
for (const g of PNOMATIK_KOD) {
  // Kategorisi olmayan grup ATLANIR ve RAPORLANIR — sessizce düşürülmez.
  // Sessiz atlama, kodların yayına çıktığını sanmanıza yol açar.
  if (!gecerli.has(g.kategori)) {
    atlanan.push({ kategori: g.kategori, kod: g.seriler.reduce((a, s) => a + s.kodlar.length, 0) })
    continue
  }
  const tumKod = g.seriler.flatMap((s) => s.kodlar)
  yeni.push({
    kategori: g.kategori,
    // marka YOK — jenerik bileşen, uydurulmaz.
    kodDeseni: 'TİP + HORTUM ÖLÇÜSÜ + DİŞ',
    kodOrnek: tumKod[0],
    seriler: g.seriler.map((s) => ({
      seri: s.ad.tr,
      seriAdiUreticinin: false,
      aciklama: {
        tr: `${s.ad.tr}${s.malzeme ? ` — ${s.malzeme}` : ''}. Listedeki kodların tamamı temin edilebilir.`,
        en: `${s.ad.en}. Every code listed can be supplied.`,
        ru: `${s.ad.ru}. Любой код из списка может быть поставлен.`,
      },
      katalogAdet: s.kodlar.length,
      kodlar: s.kodlar,
    })),
  })
}

// Seri adları üç dilde de dolu ve ru gerçekten Kiril mi?
for (const g of yeni)
  for (const s of g.seriler) {
    for (const d of ['tr', 'en', 'ru'])
      if (!s.aciklama[d]) throw new Error(`${g.kategori}/${s.seri}: ${d} boş`)
    if (!/[Ѐ-ӿ]/.test(s.aciklama.ru)) throw new Error(`${g.kategori}/${s.seri}: ru Kiril değil`)
  }

const cikti = [...markali, ...yeni]
const kod = (l) => l.reduce((a, g) => a + g.seriler.reduce((b, s) => b + s.kodlar.length, 0), 0)
console.log(`markalı grup   : ${markali.length}  (${kod(markali).toLocaleString('tr-TR')} kod) — DOKUNULMADI`)
console.log(`markasız grup  : ${markasizEski.length} → ${yeni.length}  (${kod(yeni).toLocaleString('tr-TR')} kod)`)
console.log(`toplam         : ${cikti.length} grup, ${kod(cikti).toLocaleString('tr-TR')} kod`)
for (const g of yeni) console.log(`   ${g.kategori.padEnd(22)} ${g.seriler.length} seri, ${kod([g])} kod`)

if (atlanan.length) {
  console.log('\n⚠ kategorisi olmadığı için ATLANAN:')
  for (const a of atlanan) console.log(`   ${a.kategori.padEnd(22)} ${a.kod} kod — önce data/kategoriler.json'a eklenmeli`)
}

if (!UYGULA) {
  console.log('\nKURU ÇALIŞMA — yazılmadı. Yazmak için: --uygula')
  process.exit(0)
}
writeFileSync(YOL, JSON.stringify(cikti, null, 1) + '\n')
console.log('\n✅ data/uretici-kodlari.json yazıldı.')
