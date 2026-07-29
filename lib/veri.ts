import kategorilerJson from '@/data/kategoriler.json'
import urunlerJson from '@/data/urunler.json'

export type Sss = { s: string; c: string }
/**
 * Profil ailesi satırı (ör. Kastaş K21). Sızdırmazlıkta müşteri ürün adını değil
 * PROFİL KODUNU arar ("k21 40x50x8"), bu yüzden kodlar tabloyla yayımlanır.
 */
export type Profil = {
  kod: string
  /** Veriyle adlandırabildiğimiz profillerde ne olduğu; adı geçmiyorsa boş. */
  ad?: string
  /** 'mil' | 'piston' — ölçü sırasından türetilir (bkz. kategoriler.json notu). */
  yer: string
  adet: number
  ornek: string
}
export type Kategori = {
  slug: string
  ad: string
  h1: string
  ozet: string
  giris: string
  /** Ürün ADINDA aranan regex. Kodla eşleşen gruplarda boş olabilir. */
  eslesme: string
  eslesme2?: string
  haric: string
  /**
   * Stok KODUNDA aranan regex. Ürün adı ne olduğunu söylemediğinde tek
   * dayanak budur (ör. sızdırmazlıkta "k21-040/11", imalatta "CNC-AK-63X75").
   */
  eslesmeKod?: string
  /** Stok kodu üzerinden hariç tutma. */
  haricKod?: string
  sss: Sss[]
  /** Bu grupta stokta bulunan markalar. Marka araması yapan kullanıcı için. */
  markalar?: string[]
  /** Grubun uyduğu standartlar / tipler. */
  standartlar?: string[]
  /** Profil/kod aileleri tablosu. Yalnız kodla aranan gruplarda doldurulur. */
  profiller?: Profil[]
  /** Profil tablosunun altına yazılacak açıklama. */
  profilNot?: string
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
