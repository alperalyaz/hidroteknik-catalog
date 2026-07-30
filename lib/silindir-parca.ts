import parcalarJson from '@/data/silindir-parcalari.json'
import type { Dil } from './site'

/**
 * Hidrolik silindir yedek parçaları.
 *
 * NEDEN AYRI BİR AİLE? `hidrolik-silindir` kategorisi "arka kapak, çelik kep,
 * piston, boğaz takozu kendi tezgâhlarımızda işlenir" diyordu ama HANGİ ÖLÇÜLERDE
 * olduğunu hiç söylemiyordu. Oysa bu parçalar ölçüsüyle aranır: «boğaz kepi 100x50»
 * arayan biri kategori sayfasında değil, o ölçünün listelendiği sayfada karşılığını
 * bulur. 8 aile × 3 dil = 24 sayfa, 405 ölçü.
 *
 * Rehber ve markalarda olduğu gibi çeviriler kaydın İÇİNDE durur — kayıt sayısı az.
 *
 * ÖLÇÜ EKSENİ: `eksen` elle yazılmaz, scripts/silindir-parca-uret.mjs ölçülerden
 * türetir ve bir ailenin ölçüleri iki farklı yön gösteriyorsa üretimi durdurur.
 *   capMil → AxB'de B mil çapıdır (boğaz kepi, piston…)
 *   capDis → AxB'de B kapağın dış çapıdır (arka kapak, rot kepi somunu…)
 * İkisini karıştırmak sayfayı sessizce yalancı yapar, o yüzden etiket veriden gelir.
 *
 * KOD YOK: bu kalemlerin tedarikçi kodları tedarikçi adının kısaltmasıyla başlıyor,
 * yani kod yayımlamak tedarikçiyi ele verirdi. Adlar ve ölçüler serbesttir.
 */
export type Eksen = 'capMil' | 'capDis'

export type SilindirParca = {
  slug: string
  /** Kaynak listedeki ham ad — yalnız izlenebilirlik için, sayfada gösterilmez. */
  kaynakAd: string
  eksen: Eksen
  adet: number
  capMin: number
  capMax: number
  capSayisi: number
  ikinciMin: number
  ikinciMax: number
  olculer: string[]
  aciklama: Record<Dil, string>
} & Record<Dil, string>

export const SILINDIR_PARCALARI = parcalarJson as SilindirParca[]

export function parcaBul(slug: string): SilindirParca | undefined {
  return SILINDIR_PARCALARI.find((p) => p.slug === slug)
}

/** Sayfada gösterilecek ad — dile göre. */
export function parcaAdi(p: SilindirParca, dil: Dil): string {
  return p[dil]
}
