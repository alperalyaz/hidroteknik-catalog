import kategorilerJson from '@/data/kategoriler.json'
import kategorilerEnJson from '@/data/kategoriler.en.json'
import kategorilerRuJson from '@/data/kategoriler.ru.json'
import urunlerJson from '@/data/urunler.json'
import type { Dil } from './site'

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
  /**
   * Ürün ADINDA aranan regex. Kodla eşleşen gruplarda boş olabilir.
   * Türkçe i/ı için daima [İIiı] sınıfı kullanılır — bkz. scripts/turkce-regex.mjs.
   */
  eslesme: string
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

/**
 * Çeviri dosyalarının (kategoriler.en.json / kategoriler.ru.json) şekli.
 * Yalnız KULLANICIYA GÖRÜNEN alanları taşır — eşleştirme regex'leri (eslesme,
 * haric, eslesmeKod...) TR verisine özgüdür, çeviriye girmez.
 */
type ProfilCeviri = { kod: string; ad?: string; yer: string }
type KategoriCeviri = {
  slug: string
  ad: string
  h1: string
  ozet: string
  giris: string
  sss: Sss[]
  standartlar?: string[]
  profiller?: ProfilCeviri[]
  profilNot?: string
}

const CEVIRILER: Record<Dil, KategoriCeviri[]> = {
  tr: [],
  en: kategorilerEnJson as KategoriCeviri[],
  ru: kategorilerRuJson as KategoriCeviri[],
}

const urunler = urunlerJson.kategoriler as Record<
  string,
  { toplamUrun: number; urunler: Urun[] } | undefined
>

/** TR temel veri — dil-bağımsız alanlar (eşleştirme, markalar, profil kod/adet/örnek) buradan gelir. */
export const KATEGORILER = kategorilerJson as Kategori[]

/**
 * Bir kategoriyi istenen dilde döndürür. Çeviri dosyasında slug bulunamazsa
 * veya tr isteniyorsa TR içerik aynen döner — eksik çeviri sayfayı boş
 * bırakmaz, sessizce TR'ye düşer.
 */
export function kategoriIcerik(k: Kategori, lang: Dil): Kategori {
  if (lang === 'tr') return k
  const c = CEVIRILER[lang].find((x) => x.slug === k.slug)
  if (!c) return k
  return {
    ...k,
    ad: c.ad ?? k.ad,
    h1: c.h1 ?? k.h1,
    ozet: c.ozet ?? k.ozet,
    giris: c.giris ?? k.giris,
    sss: c.sss ?? k.sss,
    standartlar: c.standartlar ?? k.standartlar,
    profiller: k.profiller?.map((p) => {
      const pc = c.profiller?.find((x) => x.kod === p.kod)
      return pc ? { ...p, ad: pc.ad ?? p.ad, yer: pc.yer ?? p.yer } : p
    }),
    profilNot: c.profilNot ?? k.profilNot,
  }
}

export function kategoriBul(slug: string, lang: Dil = 'tr'): Kategori | undefined {
  const k = KATEGORILER.find((k) => k.slug === slug)
  return k ? kategoriIcerik(k, lang) : undefined
}

/** Nav/kart listeleri için tüm kategoriler, istenen dilde. */
export function kategorilerIcin(lang: Dil): Kategori[] {
  return lang === 'tr' ? KATEGORILER : KATEGORILER.map((k) => kategoriIcerik(k, lang))
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
