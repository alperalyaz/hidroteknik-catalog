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
export type UreticiSeri = {
  seri: string
  /** Bu seride kaç aktif stok kartımız var. */
  stokAdet: number
  tipler: UreticiTip[]
  caplar: number[]
  stroklar: number[]
  /** true ise çap×strok×tip kombinasyonlarının tamamı üretiliyor (sayı ile doğrulandı). */
  tamMatris: boolean
  kodlar: string[]
  aciklama: CokDilli
}
export type UreticiKodGrubu = {
  /** Bu kod grubunun gösterileceği kategori slug'ı. */
  kategori: string
  marka: string
  markaSlug: string
  kodDeseni: string
  kodOrnek: string
  seriler: UreticiSeri[]
}

export const URETICI_KODLARI = kodlarJson as UreticiKodGrubu[]

/** Bir kategori sayfasında gösterilecek üretici kod grupları. */
export function kodGruplariIcin(kategoriSlug: string): UreticiKodGrubu[] {
  return URETICI_KODLARI.filter((g) => g.kategori === kategoriSlug)
}
