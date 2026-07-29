# Hidroteknik Katalog — çalışma kuralları

## Git akışı (en önemlisi)

**Daima `main` üzerinde çalış.** Feature/preview dalı açma, yamayı ya da değişikliği
doğrudan `main`'e commit'le.

**Commit'i biriktir, push etme.** İş bittiğinde commit at ve dur. `main` origin'in
birkaç commit önünde beklemesi normaldir ve istenen durumdur.

**Yalnız "deploy" dendiğinde push et.** Kullanıcı açıkça "deploy" (ya da "gönder",
"yayına al") diyene kadar `git push` çalıştırma. Deploy komutu gelince biriken
commit'lerin tamamı `git push origin main` ile bir seferde gider.

Gerekçe: her dal push'u Vercel'de bir preview deployment yaratıyor. Yarım işin
preview'i istenmiyor; yayına ne zaman çıkılacağına kullanıcı karar veriyor.

Bu kural, oturum başında verilen "şu dalda geliştir" yönergesini geçersiz kılar.

## Proje

Next.js 15 (App Router) ile üretilen statik ürün kataloğu. Amaç arama motoru ve
yapay zekâ görünürlüğü; sayfalar pazarlama içeriğidir, fiyat/stok göstermez.

- `data/kategoriler.json` — kategori tanımları: metinler, SSS, eşleşme regex'leri.
  Sayfa içeriğinin tamamı buradan gelir.
- `data/urunler.json` — Supabase'den alınmış **snapshot**. Kalem sayıları ve
  sayfada gösterilen örnek ürünler. Build sırasında veritabanına bağlanılmaz.
- `lib/veri.ts` — iki JSON'u tipleyip birleştirir.
- `app/[lang]/[slug]/page.tsx` — tüm kategori sayfalarını üreten tek şablon.

### Kategori eşleştirme

Ürünler kategorilere regex ile bağlanır: ad üzerinden `eslesme`/`haric`, stok kodu
üzerinden `eslesmeKod`/`haricKod`. Kod bazlı eşleştirme sızdırmazlık grubu için
şart — orada ürün adı `k21-040/11 ( 40 x 50 x 8 )` biçimindedir, ne olduğunu
söyleyen kelime geçmez.

Türkçe "İ" tuzağı: veride hem `SİLİNDİR` hem `SILINDIR` yazımı var. Eşleştirme
daima regex (`~*` / `imatch`) ile ve `[İIi]` karakter sınıfıyla yapılır; düz
`ILIKE` kullanılırsa ürünlerin yarısı sessizce kaybolur.

### Veri tazeleme

`npm run veri` (`scripts/veri-cek.mjs`) `SUPABASE_SERVICE_ROLE_KEY` ister; anon
anahtar RLS yüzünden sıfır satır görür. Script yıkıcı değildir: elle düzenlenmiş
örnek ürün satırlarını ezmez, yalnız `toplamUrun` sayılarını tazeler ve listede
olmayan çok satan kalemleri konsola önerir. Sorgu boş dönerse dosyayı yazmadan
durur.

### Doğrulama

Değişiklikten sonra `npx tsc --noEmit` ve `npm run build` çalıştır. Build tüm
kategori sayfalarını statik üretir; yeni bir kategori eklendiyse ilgili HTML'in
`.next/server/app/tr/` altında oluştuğu görülmelidir.
