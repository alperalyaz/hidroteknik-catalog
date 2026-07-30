import rehberlerJson from '@/data/rehberler.json'
import type { Dil } from './site'
import type { Sss } from './veri'

/**
 * Teknik rehberler.
 *
 * NEDEN? Kategori sayfası "ne satıyoruz" sorusuna cevap verir; rehberler
 * "hangisini seçmeliyim / neden bozuldu" sorusuna. Bu ikinci grup aramalar
 * (ör. «bsp mi metrik mi», «silindir neden kaçırıyor») satın alma niyetinin
 * bir adım öncesindedir ve kategori sayfalarına doğal iç link üretir.
 *
 * Kategorilerin aksine çeviriler AYRI DOSYADA DEĞİL, aynı kaydın içinde
 * durur: rehber sayısı az olduğu için üç dili bir arada tutmak, üç dosyayı
 * senkron tutmaya çalışmaktan daha az hata üretir.
 */
export type RehberIcerik = { ad: string; h1: string; ozet: string; giris: string; sss: Sss[] }
export type Rehber = {
  slug: string
  /** İç link verilecek kategori slug'ları. */
  kategoriler: string[]
} & Record<Dil, RehberIcerik>

export const REHBERLER = rehberlerJson as Rehber[]

export function rehberBul(slug: string): Rehber | undefined {
  return REHBERLER.find((r) => r.slug === slug)
}
