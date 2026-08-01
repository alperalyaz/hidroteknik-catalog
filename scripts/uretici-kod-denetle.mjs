/**
 * Üretici kodu çıkarımını sınar.
 *
 *   node scripts/uretici-kod-denetle.mjs
 *
 * NEDEN GEREKLİ: `satirUreticiKodu` bir HEURİSTİKTİR — stok kodunun neresi bize,
 * neresi üreticiye ait, bunu kalıplardan çıkarıyor. Yanlışı iki yönlü ve ikisi de
 * sessiz:
 *
 *   YANLIŞ POZİTİF — bizim iç numaramızı üretici kodu diye yayımlamak. Kimse
 *   aramaz, kod değiştiğinde ölür. (GATES.MXT.06 → "MXT.06" böyle bir hataydı;
 *   Gates'in kodu "6MXT", bu bizim yeniden dizmemiz.)
 *
 *   YANLIŞ NEGATİF — gerçek üretici kodunu boş bırakmak. Sayfa aranan bilgiyi
 *   yayımlamamış olur; hiçbir denetim fark etmez çünkü boş hücre "veri yok" gibi
 *   görünür.
 *
 * Aşağıdaki tablo elle doğrulanmış örneklerdir. HansaFlex satırları üreticinin
 * kendi mağazasından birebir teyit edildi (01.08.2026):
 *   shop.hansa-flex.us/…/p/HD106 · /p/KP208 · /p/PN10AOL · /p/PN10AOL90
 */
import { readFileSync } from 'node:fs'

// lib/uretici-kod.ts TypeScript; kuralları burada tekrar etmemek için kaynaktan
// okunup fonksiyon gövdesi çıkarılıyor. Kural tek yerde kalsın diye böyle.
const kaynak = readFileSync('lib/uretici-kod.ts', 'utf8')
const govde = kaynak.slice(kaynak.indexOf('const URETICI_ONEK'))
const jsGovde = govde
  .replace(/export function satirUreticiKodu\([^)]*\): string \| null/, 'function satirUreticiKodu(stokKodu)')
  .replace(/const URETICI_ONEK: Record<string, string>/, 'const URETICI_ONEK')
const satirUreticiKodu = new Function(`${jsGovde}\nreturn satirUreticiKodu`)()

/** [stok kodu, beklenen üretici kodu | null, gerekçe] */
const ORNEKLER = [
  // ── yayımlanmalı: üreticinin kendi katalog kodu ──────────────────────────
  ['HF.H.HD106', 'HD106', 'HansaFlex — mağazasında /p/HD106'],
  ['HF.H.KP208', 'KP208', 'HansaFlex — mağazasında /p/KP208'],
  ['HF.PN10AOL', 'PN10AOL', 'HansaFlex — mağazasında /p/PN10AOL'],
  ['HF.PN10AOL90', 'PN10AOL90', 'HansaFlex — mağazasında /p/PN10AOL90'],
  ['HF.XVRNW20HL1/2ED', 'XVRNW20HL1/2ED', 'HansaFlex nipel kodu'],
  ['KASTAS.K21-040/11', 'K21-040/11', 'Kastaş profil kodu'],
  ['KASTAS.K01-008           ', 'K01-008', 'baştaki/sondaki boşluk kırpılmalı (veride 275 tane var)'],
  ['PAK.0401000108', '0401000108', 'Pakkens — üçüncü taraf satıcılarda aynen listeleniyor'],
  ['PEM.HH.FRL-S1-14-M', 'FRL-S1-14-M', 'Pemaks — HH bizim ara gruplayıcımız'],
  ['HE.1PN.250.CGSY', '1PN.250.CGSY', 'Hema — ürün adında da parantez içinde geçiyor'],
  ['FR.TCM162G14N', 'TCM162G14N', 'Ferro — ürün adında da geçiyor'],
  ['ESM.EDZA.430', 'EDZA.430', 'Esmaksan EDZA serisi'],
  ['GATES.12PRO1T', '12PRO1T', 'Gates PRO-1T'],
  ['SM.SME3214KK', 'SME3214KK', 'Semakmatik'],

  // ── yayımlanmamalı: bizim numaramız ya da tedarikçi gruplaması ───────────
  ['SEL.FR2.SC.04', null, 'SEL bizim önekimiz — kullanıcının şikâyet ettiği kod'],
  ['AR.100M', null, 'AR çok markalı tedarikçi gruplaması'],
  ['AD.0106-MBS-LL', null, 'AD çok markalı tedarikçi gruplaması'],
  ['GM.380.00,37', null, 'bizim ölçü kodumuz (380 V, 0,37 kW) — Gamak kodu ürün ADINDA'],
  ['CNC.01.01.032X16K', null, 'kendi imalatımız'],
  ['MUHT.001', null, 'muhtelif tezgâh kartı'],
  ['HR.K.YEDEK.013', null, 'sıra numaramız (013)'],
  ['AK.Y.044', null, 'sıra numaramız (044)'],
  ['HE.MUH.003', null, 'sıra numaramız — gerçek Hema kodu ürün ADINDA'],
  ['ESM.DK.ÇD.14', null, 'Türkçe kısaltmamız: "DK 14 çelik dişlisi"'],
  ['GATES.MXT.06', null, 'Gates kodu "6MXT" — bu bizim yeniden dizmemiz'],
  ['HR.MOTOR.MR.TT', null, 'rakamsız: seri + "tamir takımı", tekil kod değil'],
  ['', null, 'boş kod'],
  [undefined, null, 'kod alanı yok'],
]

// Tedarikçi adı yayımlanan hiçbir kodun içinde geçmemeli.
const TEDARIKCI = [/adem/i, /ar[ıi]ca/i, /teksan/i, /\bgdc\b/i, /hidrotek(?!nik)/i]

let hata = 0
for (const [stok, beklenen, gerekce] of ORNEKLER) {
  const cikan = satirUreticiKodu(stok)
  if (cikan !== beklenen) {
    hata++
    console.log(`   ✗ ${String(stok).padEnd(26)} beklenen ${String(beklenen)} · çıkan ${String(cikan)}  (${gerekce})`)
  }
}
console.log(`elle doğrulanmış örnek: ${ORNEKLER.length} · uymayan: ${hata}`)

// Gerçek veriden çıkan tüm kodları tedarikçi adına karşı süz.
const kodlar = new Set()
for (const kat of Object.values(JSON.parse(readFileSync('data/urunler.json', 'utf8')).kategoriler))
  for (const u of kat.urunler) { const c = satirUreticiKodu(u.kod); if (c) kodlar.add(c) }
for (const marka of JSON.parse(readFileSync('data/markalar.json', 'utf8')))
  for (const o of marka.ornekler || []) { const c = satirUreticiKodu(o.kod); if (c) kodlar.add(c) }

const kirli = [...kodlar].filter((k) => TEDARIKCI.some((re) => re.test(k)))
console.log(`yayımlanan üretici kodu: ${kodlar.size} · tedarikçi adı geçen: ${kirli.length}`)
for (const k of kirli) console.log(`   ✗ ${k}`)

hata += kirli.length
console.log(hata === 0 ? '\n✅ üretici kodu çıkarımı doğru' : `\n⛔ ${hata} sorun`)
process.exit(hata === 0 ? 0 : 1)
