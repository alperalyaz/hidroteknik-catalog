import kategorilerJson from '@/data/kategoriler.json'
import urunlerJson from '@/data/urunler.json'

export type Sss = { s: string; c: string }
export type Kategori = {
  slug: string
  ad: string
  h1: string
  ozet: string
  giris: string
  eslesme: string
  eslesme2?: string
  haric: string
  sss: Sss[]
  /** Bu grupta stokta bulunan markalar. Marka araması yapan kullanıcı için. */
  markalar?: string[]
  /** Grubun uyduğu standartlar / tipler. */
  standartlar?: string[]
}
export type Urun = { kod: string; ad: string; marka?: string; model?: string }

const urunler = urunlerJson.kategoriler as Record<
  string,
  { toplamUrun: number; urunler: Urun[] } | undefined
>

export const KATEGORILER = kategorilerJson as Kategori[]

export function kategoriBul(slug: string): Kategori | undefined {
  return KATEGORILER.find((k) => k.slug === slug)
}

/**
 * Kategorinin ürünleri + toplam adedi.
 * Veri anlık görüntüden (data/urunler.json) gelir — çalışma anında veritabanı
 * bağlantısı YOKTUR. Tazeleme: `npm run veri` (bkz. scripts/veri-cek.mjs).
 */
export function kategoriUrunleri(slug: string): { toplam: number; liste: Urun[] } {
  const k = urunler[slug]
  return { toplam: k?.toplamUrun ?? 0, liste: k?.urunler ?? [] }
}

/** Ürün adlarındaki ERP yazım tutarsızlıklarını gösterim için düzeltir (veriyi değiştirmez). */
export function urunAdiDuzelt(ad: string): string {
  const t = ad.trim().replace(/\s+/g, ' ')
  // Tamamı küçük harf girilmiş kayıtları başlık düzenine çevir; karışık olanlara dokunma.
  if (t === t.toLocaleLowerCase('tr')) {
    return t.replace(/(^|\s|\()([\p{L}])/gu, (_, ö, h) => ö + h.toLocaleUpperCase('tr'))
  }
  return t
}
