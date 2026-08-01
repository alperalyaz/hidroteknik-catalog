import profillerJson from '@/data/profiller.json'
import type { Dil } from './site'

/**
 * Kastaş sızdırmazlık profil kodları.
 *
 * NEDEN AYRI SAYFA? Sızdırmazlıkta müşteri ürün adını aramaz, profil kodu ve
 * ölçüyü arar: «k21 40x50x8». Ürün adı zaten bunu söylemez — veride ad
 * "k21-040/11 ( 40 x 50 x 8 )" biçimindedir. Kategori sayfası tek başına bu
 * aramaların hepsini karşılayamaz; her profil kendi sayfasını hak eder.
 *
 * `yer` alanı ölçü sırasından TÜRETİLİR (iç→dış = mil, dış→iç = piston),
 * `ad` alanı yalnız Kastaş kataloğundan doğrulanabilen kodlarda doludur —
 * doğrulanamayan kodda boştur ve sayfada da boş görünür.
 *
 * `ad` ÜÇ DİLLİDİR. Önceden tek Türkçe dizeydi ve EN/RU sayfalarda cümlenin
 * ortasında Türkçe görünüyordu: "Polyurethane (PU) option available Nutring —
 * mil sızdırmazlık elemanı". İngilizce ve Rusça karşılıklar Kastaş'ın kendi
 * ürün sayfalarından alındı (bkz. scripts/profil-veri.mjs), uydurulmadı.
 *
 * Dosyayı `npm run profil` üretir — elle düzenlenebilir ama üretecin sınamaları
 * (yön tutarlılığı, Kiril denetimi, tedarikçi adı taraması) atlanmış olur.
 */
export type ProfilOlcu = { kod: string; olcu: string }
export type ProfilKodu = {
  kod: string
  /** İşlev, üç dilde. Kastaş kataloğundan doğrulanamayan kodlarda üçü de boş. */
  ad: Record<Dil, string>
  /** 'Mil' | 'Piston' | 'Mil ve piston' — ölçü sırasından türetilir. */
  yer: string
  /** Bu profilde stokta bulunan toplam kalem sayısı. */
  adet: number
  /** Listelenen ölçülerin en küçük/en büyük iç çapı. Ölçüsüz profillerde null. */
  capMin: number | null
  capMax: number | null
  /** Poliüretan (PU) varyantı stokta mı? */
  pu: boolean
  /** Sayfada listelenen ölçüler. `adet`ten az olabilir — en çok hareket görenler. */
  olculer: ProfilOlcu[]
}

export const PROFILLER = profillerJson as ProfilKodu[]

export function profilBul(kod: string): ProfilKodu | undefined {
  return PROFILLER.find((p) => p.kod.toLowerCase() === kod.toLowerCase())
}

/** URL parçası — kodlar zaten ASCII ve büyük harf, küçültmek yeterli. */
export function profilSlug(kod: string): string {
  return kod.toLowerCase()
}

/**
 * `yer` veride TÜRKÇE tutulur ('Mil' | 'Piston' | 'Mil ve piston') çünkü ölçüden
 * türetilen bir sınıflandırmadır, çeviri değil. Gösterimde dile çevrilir — ham
 * basılırsa İngilizce ve Rusça sayfalara Türkçe sızar.
 */
export function yerMetni(
  yer: string,
  m: { profilYerPiston: string; profilYerIkisi: string; profilYerMil: string }
): string {
  if (yer === 'Piston') return m.profilYerPiston
  if (yer === 'Mil ve piston') return m.profilYerIkisi
  return m.profilYerMil
}
