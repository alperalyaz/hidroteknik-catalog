import kodlarJson from '@/data/uretici-kodlari.json'
import type { Dil } from './site'

/**
 * Üretici katalog kodları.
 *
 * NEDEN? Sanayide ürün BİZİM stok kodumuzla değil, ÜRETİCİNİN katalog koduyla
 * aranır: "PAG-100-SN-0320", "PV1E-52-14V1". Bizim kodumuzu (PEM.S.PAG.100.320)
 * dışarıda kimse aramaz. Üretici kodunu yayımlamak, o aramaların karşılığını
 * kataloğa getirir.
 *
 * KAYNAK: ss projesindeki tedarikçi kaynak havuzu (fiyat listesi CSV'leri).
 * YAYIMLANAN yalnız KOD ve ÖLÇÜ EKSENİDİR. Fiyat, iskonto, maliyet ve tedarikçi
 * adı bu dosyaya HİÇ girmez — katalog fiyat yayımlamaz ve tedarikçi adı hiçbir
 * sayfada geçmez.
 *
 * DÜRÜSTLÜK: burada yalnız GERÇEKTEN STOKLADIĞIMIZ seriler bulunur. `stokAdet`
 * o seride kaç aktif stok kartımız olduğunu söyler; `tamMatris` ise "bu serinin
 * her çap×strok kombinasyonu üretilir" iddiasının aritmetikle doğrulandığını.
 * Seyrek matrisli serilerde (tamMatris=false) kodlar tek tek listelenir.
 */
type CokDilli = Record<Dil, string>

export type UreticiTip = { kod: string } & CokDilli
/**
 * Ürün adından toplanan teknik değer kümesi: "kW" → ["0.09", "0.12", …]
 *
 * Etiket ÜÇ DİLLİ. İlk sürümde tek dizeydi ve Rusça sayfada da "kW" yazıyordu;
 * Rusça'da birim `кВт`, "kutup" ise `полюсов`. Katalogda daha önce iki kez
 * yaşanan hatanın (profil `ad`ı, `yer` alanı) aynısıydı — veride tek dilli
 * tutulan bir alan üç dilde birden basılıyor.
 */
export type UreticiOzellik = { etiket: Record<Dil, string>; degerler: string[] }

/**
 * İki farklı seri yapısı var ve ikisi de geçerli:
 *
 * SİLİNDİR YAPISI (elle kurulmuş, Pemaks) — çap × strok matrisi. `tamMatris`
 * o serinin her çap×strok kombinasyonunun üretildiğinin aritmetikle
 * doğrulandığını söyler.
 *
 * GENEL YAPI (üreteçten, Gamak vb.) — motor/valf/pompada çap×strok diye bir
 * şey yok; onun yerine ürün ADINDAN toplanan öznitelikler (kW, kutup, d/dk)
 * taşınır. Aranan şey zaten bunlardır: "5.5 kw 1500 devir elektrik motoru".
 */
export type UreticiSeri = {
  seri: string
  kodlar: string[]
  aciklama: CokDilli
  /** Bu seride kaç aktif stok kartımız var. Yalnız silindir yapısında. */
  stokAdet?: number
  tipler?: UreticiTip[]
  caplar?: number[]
  stroklar?: number[]
  /** true ise çap×strok×tip kombinasyonlarının tamamı üretiliyor. */
  tamMatris?: boolean
  /**
   * Seri adı ÜRETİCİNİN mi, bizim kod önekinden çıkarımımız mı?
   *
   * false ise sayfada "X serisi" DENMEZ — üreticinin kullanmadığı bir terimi
   * ona atfetmek olurdu. Kodlar yine yayımlanır (gerçek ve aranan şey onlar),
   * yalnız başlık ürün TÜRÜNÜ söyler.
   */
  seriAdiUreticinin?: boolean
  /** Üreticinin kataloğunda bu seride kaç kod var. Yalnız genel yapıda. */
  katalogAdet?: number
  ozellikler?: UreticiOzellik[]
}
export type UreticiKodGrubu = {
  /** Bu kod grubunun gösterileceği kategori slug'ı. */
  kategori: string
  /**
   * Marka — İSTEĞE BAĞLI.
   *
   * Kodların bir kısmı jenerik endüstri bileşenlerine ait ve üzerlerinde marka
   * YOK: aynı rakor onlarca üreticiden aynı kodla çıkıyor. Böyle bir gruba
   * marka atfetmek uydurma olurdu — `seriAdiUreticinin: false` ile aynı
   * disiplin. Marka yoksa sayfa başlığı ürün TÜRÜNÜ söyler, marka adını değil.
   */
  marka?: string
  markaSlug?: string
  kodDeseni: string
  kodOrnek: string
  seriler: UreticiSeri[]
}

export const URETICI_KODLARI = kodlarJson as UreticiKodGrubu[]

/** Bir kategori sayfasında gösterilecek üretici kod grupları. */
export function kodGruplariIcin(kategoriSlug: string): UreticiKodGrubu[] {
  return URETICI_KODLARI.filter((g) => g.kategori === kategoriSlug)
}

/* ────────────────────────────────────────────────────────────────────────────
 * SATIR BAZINDA ÜRETİCİ KODU
 *
 * Stok kodumuz iki parçadan oluşur: BİZİM önekimiz + ÜRETİCİNİN katalog kodu.
 *
 *     HF.H.HD106     →  HansaFlex  HD106
 *     HF.PN10AOL90   →  HansaFlex  PN10AOL90
 *     PAK.0401000108 →  Pakkens    0401000108
 *     KASTAS.K21-040/11 → Kastaş   K21-040/11
 *
 * Önek bizim; sık değişiyor ve dışarıda kimsenin işine yaramıyor. Kalan kısım
 * ÜRETİCİNİNDİR: kalıcıdır, üreticinin kendi kataloğunda geçer ve gerçekten
 * aranır. Doğrulandı (01.08.2026) — HansaFlex kendi mağazasında bu kodları
 * birebir ürün kimliği olarak kullanıyor:
 *
 *     shop.hansa-flex.us/…/p/HD106      shop.hansa-flex.us/…/p/KP208
 *     shop.hansa-flex.us/…/p/PN10AOL    shop.hansa-flex.us/…/p/PN10AOL90
 *
 * Pakkens 0401000108 üçüncü taraf satıcılarda aynen listeleniyor; Pemaks PAG
 * serisi bayilerin kataloglarında geçiyor; Kastaş profil kodları zaten Kastaş
 * kataloğundan doğrulanmıştı.
 *
 * ── NEDEN HERKES DEĞİL ─────────────────────────────────────────────────────
 * Öneklerin bir kısmı üretici değil TEDARİKÇİ gruplamasıdır: altında birden çok
 * marka toplanır ve kodun kalan kısmı tedarikçinin kendi sıra numarasıdır.
 * Ölçüldü — tek markaya oturan önekler (HF→HansaFlex 40/40, HE→Hema 33/33)
 * ile çok markalı önekler (AR→markasız 52 + KDNT 4 + Oxim 4) veride net
 * ayrışıyor. İkincilerin kalanı yayımlanmaz: ne aranır, ne bize aittir.
 *
 * Kalanı bizim numaramız olan önekler de dışarıda: GM.380.00,37 "380 V, 0,37 kW"
 * demektir, Gamak'ın katalog kodu değil (o, ürün ADINDA duruyor: AGM2EL 71 M 4B).
 *
 * Bu liste bilinçli olarak KISA tutulur. Yeni bir önek eklerken ölçüt tek:
 * kodun kalan kısmını üreticinin kendi yayınında bulabiliyor musunuz?
 */
const URETICI_ONEK: Record<string, string> = {
  HF: 'HansaFlex',
  KASTAS: 'Kastaş',
  PAK: 'Pakkens',
  PEM: 'Pemaks',
  HE: 'Hema',
  FR: 'Ferro',
  ESM: 'Esmaksan',
  HR: 'Hydropack',
  SMS: 'SMS Tork',
  GATES: 'Gates',
  AK: 'Akon',
  LMC: 'LMC',
  SM: 'Semakmatik',
}

/**
 * Önekten sonra gelen ama hâlâ BİZE ait olan ara gruplayıcılar. Türkçe kısaltma
 * ya da işlev adıdırlar (H=hortum, S=silindir, RAK=rakor, YEDEK=yedek parça),
 * üreticinin kodunun parçası değildirler ve atılmaları gerekir:
 * HF.H.HD106 → HD106,  PEM.HH.FRL-S1-14-M → FRL-S1-14-M.
 */
const GRUPLAYICI = new Set([
  'H', 'K', 'S', 'Y', 'MUH', 'MUHT', 'RAK', 'VALF', 'HORTUM', 'MOTOR',
  'PUMP', 'POMPA', 'HPP', 'HH', 'YEDEK', 'BOX', 'DK', 'SAE', 'PEX', 'PED',
  'SPC', 'KIT', 'TAKIM', 'SET', 'BOB', 'PU', 'EU', 'FOX', 'EMS', 'PLEYT',
])

/**
 * Stok kodundan üreticinin katalog kodunu çıkarır; çıkaramazsa null döner.
 *
 * null dönmesi normaldir ve gizlenecek bir şey değildir: kalemlerin bir kısmının
 * üzerinde gerçekten yayımlanabilir bir üretici kodu yoktur. Sayfada o hücre boş
 * kalır — uydurma kod yazmaktansa boş bırakmak doğrudur (bkz. CLAUDE.md,
 * "Doğrulanamayan bilgi boş bırakılır").
 */
export function satirUreticiKodu(stokKodu: string | undefined): string | null {
  if (!stokKodu) return null
  // Veride 275 kodun başında/sonunda boşluk var; kırpılmazsa önek eşleşmez.
  const parca = stokKodu.trim().split('.')
  if (!URETICI_ONEK[parca[0]]) return null

  let kalan = parca.slice(1)
  while (kalan.length > 1 && GRUPLAYICI.has(kalan[0].toUpperCase())) kalan = kalan.slice(1)
  if (kalan.length === 1 && GRUPLAYICI.has(kalan[0].toUpperCase())) return null

  const kod = kalan.join('.').trim()
  if (kod.length < 3) return null

  // Rakamsız kalan bir SERİ adıdır (MR.TT = "MR hidromotor tamir takımı"),
  // tekil ürün kodu değil.
  if (!/[0-9]/.test(kod)) return null
  // Saf sayı + tire: yalnız uzun olanlar üreticinindir (Pakkens 0401000108,
  // Gates 4657-9923). Kısa olanlar bizim sıra numaramızdır: HR.K.YEDEK.013 → 013.
  if (!/[A-Za-zÇĞİÖŞÜçğıöşü]/.test(kod) && (kod.replace(/\D/g, '').length < 6)) return null
  // "HARF.SAYI" bizim ölçü ekimizdir, üreticinin kodu değil. Ölçüldü: 68 kod bu
  // kalıba uyuyor ve hepsi Türkçe kısaltma — ESM.DK.ÇD.14 "DK 14 çelik dişlisi",
  // GATES.MXT.06 ise Gates'in kodu olan "6MXT"in bizim tarafımızdan yeniden
  // dizilmiş hâli. Üretici kodu ölçüyü nokta ile ayırmaz, içine gömer (HD106).
  if (/^[A-Za-zÇĞİÖŞÜçğıöşü]+\.\d{1,2}$/.test(kod)) return null

  return kod
}
