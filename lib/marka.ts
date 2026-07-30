import markalarJson from '@/data/markalar.json'
import type { Dil } from './site'

/**
 * Marka sayfaları.
 *
 * NEDEN? Sanayide arama çoğu zaman "gates hidrolik hortum", "kastaş keçe",
 * "pakkens manometre" biçimindedir — yani marka + ürün cinsi. Kategori sayfası
 * markayı yalnız bir etiket olarak gösteriyor; markanın ne kapsadığını,
 * hangi gruplarda bulunduğunu ve kod okumasının nasıl yapıldığını anlatan
 * ayrı bir sayfa bu aramaların doğal karşılığıdır.
 *
 * Marka bilgisi veritabanında bir sütun DEĞİLDİR; stok kodunun önekinde durur
 * (KASTAS., PEM., GATES. gibi). `adet` değerleri bu öneklerle ölçülmüştür.
 *
 * TEDARİKÇİ ADI MARKA DEĞİLDİR: bazı ürünleri tedarik ettiğimiz firmaların adı
 * hiçbir sayfada geçmez. Burada yalnız ürünün üzerindeki marka yayımlanır.
 */
export type MarkaOrnek = { kod: string; ad: string }
type CokDilli = Record<Dil, string>

export type Marka = {
  slug: string
  ad: string
  /** Stoktaki aktif kalem sayısı (kod önekinden ölçüldü). */
  adet: number
  /** Bu markanın bulunduğu kategori slug'ları. */
  kategoriler: string[]
  /** Kastaş'a özel: profil kodu sayfalarına yönlendirme yapılsın mı? */
  profilLink?: boolean
  ornekler: MarkaOrnek[]
  ozet: CokDilli
  giris: CokDilli
}

export const MARKALAR = markalarJson as Marka[]

export function markaBul(slug: string): Marka | undefined {
  return MARKALAR.find((m) => m.slug === slug)
}
