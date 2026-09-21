import { NextResponse, type NextRequest } from 'next/server'

/**
 * İç trafiği (işyeri) analitikten düşmek için ÇEREZ basar — eleme burada
 * YAPILMAZ, tarayıcıda yapılır (bkz. app/analitik.tsx).
 *
 * Neden ikiye bölündü: 306 sayfanın tamamı statik üretiliyor. Sunucuda
 * "bu ziyaretçi içeriden mi" diye karar verip <Analytics/> render etmemek,
 * sayfayı isteğe bağımlı yani DİNAMİK hâle getirirdi ve statik üretim çökerdi.
 * Çerez basmak sayfa gövdesine dokunmaz, statiklik korunur.
 *
 * IP KAYNAĞA YAZILMAZ. Depo herkese açık (github.com/alperalyaz/hidroteknik-catalog);
 * işyeri IP'si commit'lenirse git geçmişinde kalıcı olarak yayımlanmış olur.
 * Değer Vercel ortam değişkeninde durur: IC_IPLER, virgülle ayrılmış liste.
 *
 * Dışarıdan gelen ziyaretçi HİÇBİR çerez almaz — çerez yalnız IP tutarsa yazılır.
 */

const CEREZ = 'ht_ic'

/** Virgülle ayrılmış IP listesi. Tanımsızsa eleme yapılmaz, herkes sayılır. */
const IC_IPLER = (process.env.IC_IPLER ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)

// Değişken tanımsızsa eleme YAPILMAZ ve işyeri trafiği veriyi kirletir. Sessiz
// kalmak bu projede yasak: kurulmamış bir filtre, filtre olmamasından kötüdür —
// rakamlara güvenilir sanılır. Uyarı Vercel çalışma günlüğüne düşer.
if (IC_IPLER.length === 0) {
  console.warn('[analitik] IC_IPLER tanımsız — işyeri trafiği de sayılıyor.')
}

export function middleware(istek: NextRequest) {
  const cevap = NextResponse.next()

  // Vercel gerçek istemci IP'sini x-forwarded-for'un İLK öğesine yazar;
  // sonraki öğeler ara vekillerdir ve bize ait değildir.
  const ip = (istek.headers.get('x-forwarded-for') ?? '').split(',')[0]?.trim() ?? ''
  const icerden = ip !== '' && IC_IPLER.includes(ip)
  const damgali = istek.cookies.get(CEREZ)?.value === '1'

  // İki yön de gerekli. Yalnız yazan bir kural, ofis dizüstüsü eve gittiğinde
  // çerezi üzerinde taşır ve o kişi SONSUZA DEK sayılmaz — sessiz veri kaybı.
  if (icerden && !damgali) {
    cevap.cookies.set(CEREZ, '1', {
      path: '/',
      maxAge: 60 * 60 * 24 * 180,
      sameSite: 'lax',
    })
  } else if (!icerden && damgali) {
    cevap.cookies.delete(CEREZ)
  }

  return cevap
}

/**
 * Yalnız sayfa istekleri. Nokta içeren yollar (.webp, .ico, .txt, .xml) ve
 * _next varlıkları dışarıda: onlarda çerezin işi yok, boşuna çalışma olur.
 */
export const config = {
  matcher: ['/((?!_next/|.*\\.).*)'],
}
