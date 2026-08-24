import { permanentRedirect } from 'next/navigation'
import { VARSAYILAN_DIL } from '@/lib/site'

/**
 * Kök adres varsayılan dile gider — ve bunu KALICI (308) yapmak zorundadır.
 *
 * Burası bir zamanlar `redirect()` çağırıyordu. `redirect()` 307 döndürür, yani
 * GEÇİCİ yönlendirme, ve Google geçici yönlendirmede kaynağı kanonik saymaya
 * devam eder — kendi dokümanının sözleriyle 302/307'de "yönlendirmeyi, hedefin
 * kanonik olması gerektiğine dair bir işaret olarak KULLANMAZ". Sonuç: Google
 * `/` adresini dizinde tuttu ve `/tr` sayfasını onun kopyası saydı; `/tr` ise
 * kendi kanoniğini `/tr` diye beyan ediyordu. Search Console'un
 * "Duplicate, Google chose different canonical than user" uyarısı tam olarak bu
 * çelişkiydi (24.08.2026).
 *
 * `permanentRedirect()` 308 döndürür; 301/308'de Google yönlendirmeyi hedefin
 * kanonik olduğuna dair işaret sayar ve `/` dizinden düşer.
 *
 * Bu sayfanın DÖNDÜĞÜ durum kodu sessizce bozulabilecek türden bir şeydir —
 * `npm run denetle` artık üretilen `index.meta` dosyasında 308 olduğunu sınar.
 */
export default function Kok() {
  permanentRedirect(`/${VARSAYILAN_DIL}`)
}
