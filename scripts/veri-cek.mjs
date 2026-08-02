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
import { GENEL_HARIC } from './genel-haric.mjs'

const KOK = join(dirname(fileURLToPath(import.meta.url)), '..')
const ZORLA = process.argv.includes('--zorla')
const URL_BASE = process.env.SUPABASE_URL || 'https://ujmtoruicnmgoarwzhwp.supabase.co'
const ANAHTAR = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
if (!ANAHTAR) {
  console.error('SUPABASE_SERVICE_ROLE_KEY tanımlı değil — RLS yüzünden anon anahtar boş döner.')
  process.exit(1)
}

const ONERI_LIMIT = 25 // konsolda önerilecek "listede yok ama çok satıyor" kalem sayısı


/**
 * PostgREST değer kaçışı: regex'te virgül/parantez var, tırnak içine alınmalı.
 *
 * ⚠ TERS EĞİK ÇİZGİ ÖNCE İKİYE KATLANIR — atlanırsa desen SESSİZCE BOZULUR.
 * PostgREST tırnaklı değerin içinde `\` karakterini kaçış işareti sayıp yutuyor:
 *
 *     yazılan          sunucunun gördüğü regex     sonuç
 *     ^(AK)\.          ^(AK).                      AKG. de tutuluyor (57 → 246)
 *     \mEK\M           mEKM                        hiçbir şey tutmuyor
 *
 * İkisi de hata VERMEZ; yalnız sayı yanlış çıkar. Ölçüldü (02.08.2026): yedi
 * kategorinin filtresi bu yüzden bozuk çalışıyordu — hortum-ucu-koruma'nın
 * kelime sınırları harfe dönüştüğü için 24 kalem eksik sayılıyordu,
 * hidrolik-silindir'in `^CNC\.` deseni ise `CNC-PV-T-040` gibi tire'li kodları
 * da yakalıyordu.
 *
 * Sıra önemli: önce `\`, sonra `"`. Ters sırada, tırnak için eklenen ters eğik
 * çizgi de ikiye katlanır ve bu kez fazladan kaçış üretilir.
 */
const tirnak = (v) => `"${String(v).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`

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
  // ⚠ HARİÇ FİLTRESİ and=() İÇİNDE OLMAK ZORUNDA — düz biçim SESSİZCE ÇALIŞMAZ.
  //
  // PostgREST'te `urun_ismi=not.imatch."DESEN"` yazıldığında tırnaklar desenin
  // PARÇASI sayılıyor: sunucu `"DESEN"` (tırnaklar dahil) diye bir dize arıyor,
  // hiçbir kayıtta bulamıyor, `not` da her şeyi geçiriyor. Yani filtre yok
  // sayılıyor ve HATA VERMİYOR. Tırnak atılamaz da: desenlerde virgül ve
  // parantez var ({0,20} gibi), tırnaksız değer onlarda bozulur.
  //
  // and=(...) içinde ise PostgREST tırnağı doğru ayrıştırıyor — or=() zaten
  // öyle çalıştığı için eşleşme tarafı doğruydu, yalnız hariç tarafı ölüydü.
  //
  // Ölçüldü (31.07.2026, hidrolik-hortum): düz biçim 1240, and=() biçimi 205,
  // doğrudan SQL 207 (aradaki 2 fark aktif=is.true'nun NULL satırları elemesi).
  // Bu hata sessiz olduğu için bugüne kadar yazılan TÜM toplamUrun sayıları
  // hariç desenleri hiç uygulanmadan hesaplanmış, yani şişikti.
  const ve = [`urun_ismi.not.imatch.${tirnak(haric)}`]
  if (k.haricKod) ve.push(`kodu.not.imatch.${tirnak(sertlestir(k.haricKod))}`)
  p.push(`and=(${ve.join(',')})`)
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
  // İkinci emniyet: sayı ANİDEN ŞİŞTİYSE de dur. Sıfırlanmak kadar tehlikeli
  // olan ters durum budur ve gözle fark edilmez — sayfa "1.240 kalem" der,
  // kimse yanlış olduğunu anlamaz.
  //
  // Somut senaryo (01.08.2026): stok kodları değiştirildi ve yeni kodlar
  // eskilerin ÜZERİNE YAZILMIYOR. Senkron yarım kalırsa Supabase'de hem
  // A.KM.010 hem TA.KM.010 durur; aynı ürün iki kez sayılır ve katalog iki
  // katı rakamla yayına çıkar.
  //
  // Eşik cömert (2 kat + 20 kalem tolerans): gerçek büyümeler (bir kategoriye
  // yeni ürün ailesi girmesi) engellenmesin, ama mükerrer kayıt kaçmasın.
  // Bilerek büyük bir sıçrama varsa --zorla ile geçilir.
  if (onceki?.toplamUrun && toplam > onceki.toplamUrun * 2 + 20 && !ZORLA) {
    console.error(`\n⛔ ${k.slug}: ${onceki.toplamUrun} → ${toplam} (${(toplam / onceki.toplamUrun).toFixed(1)}× artış)`)
    console.error('   Mükerrer stok kaydı olabilir (eski + yeni kod bir arada).')
    console.error('   Önce şunu doğrulayın: aynı ürün iki farklı kodla duruyor mu?')
    console.error('   Artış gerçekse: node scripts/veri-cek.mjs --zorla')
    console.error('   Dosya YAZILMADI.')
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

/* ────────────────────────────────────────────────────────────────────────────
 * MARKA KALEM SAYILARI
 *
 * `markalar.json` içindeki `adet`, marka sayfasında "X kalem" diye görünür ve
 * `toplamUrun` ile aynı hastalığa yakalanır: kod öneki değişince ya da yeni ürün
 * girince bayatlar, hiçbir denetim görmez. Eskiden elle ölçülüyordu —
 * `kod-gocur.mjs` her koşumda "bunları yeniden sayın" diye uyarıyordu ve bu
 * uyarı aylarca yapılmadı. Ölçüldü (02.08.2026): 9 markanın sayısı bayattı ve
 * bayatlık kod göçünden bağımsızdı; Pemaks 878 diyordu, aktif kalem 835'ti
 * (aradaki 43 pasif karttı — sayfa pasif ürünü stokta gibi gösteriyordu).
 *
 * ── ÖNEK SAYMAK HER MARKADA ÇALIŞMAZ ─────────────────────────────────────
 * Bazı önekler tek markaya oturur (HF→HansaFlex 1.454/1.454) ve önekten saymak
 * doğrudur. Bazıları ise TEDARİKÇİ gruplamasıdır: `AR.` altında 1.015 kalem var
 * ama bunların yalnız 7'sinde Oxim adı geçiyor, 75'i KDNT, 21'i Festo, 912'si
 * markasız. `AR.`i Oxim sayarsak marka sayfası 92 yerine 1.015 der — 11 kat yalan.
 *
 * Bu yüzden yalnız TEK MARKAYA OTURDUĞU DOĞRULANMIŞ önekler otomatik sayılır.
 * Çok markalı öneklerin `adet` değeri elle ölçülmüştür ve DOKUNULMAZ; script
 * onları "elle ölçüldü, atlandı" diye raporlar.
 */
const MARKA_ONEK = {
  Kastaş: ['KASTAS'], HansaFlex: ['HF'], Pemaks: ['PEM'], Ferro: ['FR'],
  'SMS Tork': ['SMS'], Pakkens: ['PAK'], Hydropack: ['HR'], Hema: ['HE'],
  Esmaksan: ['ESM'], Duravis: ['US'], Akon: ['AK'], Semakmatik: ['SM'],
  Gamak: ['GM'], Gates: ['GATES'], FMS: ['FM', 'FMS'],
}

const markaYolu = join(KOK, 'data/markalar.json')
const markalar = JSON.parse(readFileSync(markaYolu, 'utf8'))
const markaDegisen = []
const markaAtlanan = []

for (const marka of markalar) {
  const onekler = MARKA_ONEK[marka.ad]
  if (!onekler) { markaAtlanan.push(marka.ad); continue }
  // `kodu.like.ÖNEK.*` yerine regex: önek sonundaki noktanın gerçekten ayraç
  // olduğunu garantiler (AK. ile AKG. karışmasın).
  //
  // ⚠ and=() ŞART — düz `kodu=imatch."DESEN"` biçimi sessizce hiçbir şey tutmaz;
  // PostgREST tırnakları desenin parçası sayıyor (yukarıda kategori filtresinde
  // anlatılan aynı tuzak). İlk yazışımda bu hataya düştüm ve aşağıdaki sıfır
  // kontrolü yakaladı — kontrol olmasaydı bütün marka sayıları 0 yazılacaktı.
  const desen = `^(${onekler.join('|')})\\.`
  const { toplam } = await sorgula(
    `aktif=is.true&and=(kodu.imatch.${tirnak(desen)})&select=kodu&limit=1`
  )
  if (toplam === 0) {
    console.error(`⛔ ${marka.ad}: önek ${desen} hiçbir şey tutmuyor — markalar.json YAZILMADI.`)
    process.exit(1)
  }
  // İKİNCİ EMNİYET: sayı aniden şiştiyse de dur. Sıfır kontrolü tek başına
  // yetmiyor — ters eğik çizgi kaçışı bozukken `^(AK)\.` deseni `AKG.`yi de
  // tutup Akon'u 57'den 246'ya çıkarmıştı ve sıfır kontrolü bunu göremedi.
  // Marka kalem sayısı iki katına çıkıyorsa bu ürün girişi değil, desen hatasıdır.
  if (marka.adet && toplam > marka.adet * 2 + 20 && !ZORLA) {
    console.error(`\n⛔ ${marka.ad}: ${marka.adet} → ${toplam} (${(toplam / marka.adet).toFixed(1)}× artış)`)
    console.error(`   Desen ${desen} komşu bir öneki de tutuyor olabilir (AK. ↔ AKG. gibi).`)
    console.error('   markalar.json YAZILMADI. Artış gerçekse --zorla ekleyin.')
    process.exit(1)
  }
  if (toplam !== marka.adet) markaDegisen.push(`${marka.ad}: ${marka.adet} → ${toplam}`)
  marka.adet = toplam
}

writeFileSync(markaYolu, JSON.stringify(markalar, null, 1) + '\n')
console.log(`\n✅ data/markalar.json yazıldı — ${markaDegisen.length} markanın sayısı tazelendi.`)
for (const d of markaDegisen) console.log(`   ${d}`)
if (markaAtlanan.length) {
  console.log(`   atlandı (öneki çok markalı, elle ölçülmüş): ${markaAtlanan.join(', ')}`)
}
