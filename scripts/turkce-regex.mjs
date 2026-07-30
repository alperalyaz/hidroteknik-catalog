/**
 * Türkçe "ı" tuzağı — kategori regex'lerini sertleştirir.
 *
 * CLAUDE.md'deki "İ tuzağı" notunun ikinci yarısı. Bilinen kısım şuydu:
 * veride hem `SİLİNDİR` hem `SILINDIR` yazımı var, o yüzden düz ILIKE değil
 * regex kullanılır. Eksik olan kısım, regex'in KENDİSİNİN de aynı tuzağa
 * düşmesiydi.
 *
 * Postgres `~*` yalnız Unicode'un tanıdığı katlamayı yapar. Türkçe'nin
 * I → ı katlaması Unicode'da YOKTUR:
 *   desendeki `I` küçük `i` ile eşleşir  ✓
 *   desendeki `I` küçük `ı` ile eşleşmez ✗   ← kaçak buradan
 *
 * Ölçüldü (30.07.2026, 15.357 aktif kart):
 *   TAKIM         →  45 kayıt
 *   TAK[İIiı]M    →  92 kayıt      ← iki katı
 *   TE BAĞLANTI   → pnömatik rakor 341 kalem
 *   TE BAĞLANT[İIiı] → 379 kalem   ← 38 kalem geri geldi
 *
 * Çözüm: her i-türevi harf dört yazımı da kapsayan sınıfa çevrilir.
 * Fonksiyon etkisizdir (idempotent) — sertleştirilmiş regex'i tekrar
 * sertleştirmek aynı sonucu verir, o yüzden hem dosyaya yazarken hem de
 * sorgu anında güvenle uygulanabilir.
 */

const I_SINIFI = '[İIiı]'

/** Köşeli parantez derinliğini takip ederek sınıf İÇİ/DIŞI ayrımı yapar. */
export function sertlestir(re) {
  if (!re) return re
  let cikti = ''
  let sinifIcinde = false
  let sinifBaslangic = -1
  for (let i = 0; i < re.length; i++) {
    const c = re[i]
    if (c === '\\') {
      // \m \M gibi kaçışlar (kelime sınırı) olduğu gibi geçer.
      cikti += c + (re[i + 1] ?? '')
      i++
      continue
    }
    if (!sinifIcinde && c === '[') {
      sinifIcinde = true
      sinifBaslangic = cikti.length
      cikti += c
      continue
    }
    if (sinifIcinde && c === ']') {
      sinifIcinde = false
      // Herhangi bir i-türevi içeren sınıf dördünü de içermeli.
      // Veride [İI] gibi eksik sınıflar vardı; küçük harfli satırları kaçırıyorlardı.
      let govde = cikti.slice(sinifBaslangic + 1)
      if (/[İIiı]/.test(govde)) govde = govde.replace(/[İIiı]/g, '') + 'İIiı'
      cikti = cikti.slice(0, sinifBaslangic + 1) + govde + ']'
      continue
    }
    if (!sinifIcinde && /[İIiı]/.test(c)) {
      cikti += I_SINIFI
      continue
    }
    cikti += c
  }
  return cikti
}
