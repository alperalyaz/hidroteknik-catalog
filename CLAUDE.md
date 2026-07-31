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
TR (varsayılan) / EN / RU üç dilde yayında, ~257 statik sayfa.

**Beş sayfa ailesi var, beşi de aynı desende: veri JSON'da, şablon tek dosyada.**

| Aile | Veri | Şablon | Adet |
|---|---|---|---|
| Kategori | `data/kategoriler{,.en,.ru}.json` | `app/[lang]/[slug]/` | 28 × 3 |
| Profil kodu | `data/profiller.json` | `app/[lang]/profil/[kod]/` | 33 × 3 |
| Marka | `data/markalar.json` | `app/[lang]/marka/[slug]/` | 17 × 3 |
| Teknik rehber | `data/rehberler.json` | `app/[lang]/rehber/[slug]/` | 4 × 3 |
| Silindir parça | `data/silindir-parcalari.json` | `app/[lang]/silindir-parca/[slug]/` | 8 × 3 |

- `data/urunler.json` — Supabase'den alınmış **snapshot**: kalem sayıları ve
  sayfada gösterilen örnek ürünler. Build sırasında veritabanına bağlanılmaz.
- `lib/veri.ts` · `lib/profil.ts` · `lib/marka.ts` · `lib/rehber.ts` — JSON'ları
  tipler; kategori ve profil çevirileri ayrı dosyada, marka ve rehber çevirileri
  kaydın içinde (az sayıda kayıt olduğu için senkron tutmak daha kolay).
- `lib/metin.ts` — arayüz etiketleri (üç dil). Sayfa içeriği burada DEĞİL.
- `app/sitemap.ts` ve `app/llms.txt/route.ts` — dört aileyi de kapsar; yeni bir
  aile eklenirse ikisine de yazılmalı.

Yeni sayfa ailesi eklerken sırayla: veri JSON → `lib/` tipi → `lib/metin.ts`
etiketleri (3 dil) → `lib/schema.ts` JSON-LD üreticisi → rota → sitemap → llms.txt
→ ana sayfadan iç link.

### Kategori eşleştirme

Ürünler kategorilere regex ile bağlanır: ad üzerinden `eslesme`/`haric`, stok kodu
üzerinden `eslesmeKod`/`haricKod`. Kod bazlı eşleştirme sızdırmazlık grubu için
şart — orada ürün adı `k21-040/11 ( 40 x 50 x 8 )` biçimindedir, ne olduğunu
söyleyen kelime geçmez.

**Türkçe i/ı tuzağı — iki yarısı var, ikisi de ısırır.**

Birinci yarısı bilinen kısım: veride hem `SİLİNDİR` hem `SILINDIR` yazımı var, o
yüzden eşleştirme düz `ILIKE` ile değil regex (`~*` / `imatch`) ile yapılır.

İkinci yarısı regex'in kendisiyle ilgili: Postgres `~*` yalnız Unicode'un tanıdığı
katlamayı yapar ve Türkçe'nin **I → ı katlaması Unicode'da yoktur**. Yani desendeki
çıplak `I` küçük `ı` harfini görmez. Ölçüldü (30.07.2026):

```
TAKIM          →  45 kayıt
TAK[İIiı]M     →  92 kayıt      ← iki katı
TE BAĞLANTI    → pnömatik rakor 341 kalem
TE BAĞLANT[İIiı] → 379 kalem    ← 38 kalem sessizce kayıptı
```

Bu yüzden her i-türevi harf **dört yazımı da** kapsayan `[İIiı]` sınıfıyla yazılır.
`scripts/turkce-regex.mjs` bunu otomatik yapar ve etkisizdir (idempotent), o yüzden
`veri-cek.mjs` sorgu anında da uygular. Elle regex yazarken sınıfı eksik bırakmak
serbest — script düzeltir — ama dosyaya sert hâlini yazmak diff'i okunur tutar.

### Kategori kod desenine dayanmamalı

Kategoriler ürün ADINDAN tanınır. Stok kodu önekine dayanan bir kategori iki
şekilde yalan söyler ve ikisini de hiçbir otomatik kontrol görmez.

Birincisi ürünü yanlış yere koyar. `hidrolik-hortum` bir zamanlar `haricKod:
^SEL\.` taşıyordu; SEL kodlu 84 kalem gerçekten hidrolik hortum olduğu hâlde
hidrolik hortum sayfasında görünmüyordu, çünkü eleme ada değil koda bakıyordu.
`sel-hortum` da yalnız `eslesmeKod: ^SEL\.` idi — yani ürün grubu değil kod
önekiydi; içinde hidrolik hortumun yanında yıkama, buhar ve emiş hortumu vardı.

İkincisi kod değişiminde sessizce patlar: desen hiçbir şeyi tutmaz, kategori
SIFIR ürünle yayına çıkar. tsc geçer, build geçer, link denetimi geçer.

Dört kategori koda MECBUR ve bunlar bilinçli istisnadır — sızdırmazlıkta ürün
adı `k21-040/11 ( 40 x 50 x 8 )` biçimindedir, ne olduğunu söyleyen kelime
geçmez: `hidrolik-silindir` (`^CNC\.`), `krom-mil-boru` (`^A\.`),
`o-ring-sizdirmazlik` ve `hidrolik-kece-nutring` (`^KASTAS\.`).
`scripts/kod-gocur.mjs` her koşumda bu dördünü ekrana basar.

### Kod göçü

Stok kodları değiştiğinde `npm run kod-gocur -- eski-yeni.csv` kuru çalıştırma
yapar, `--uygula` ile yazar. Örnek satırların `kod` alanlarını çevirir; kategori
kod DESENLERİNİ çevirmez, yalnız raporlar — bir eşleme tablosu yeni kodların
hangi önekle başlayacağını bilemez, o karar insanındır.

### Örnek satır denetimi

`npm run denetle` iki şey çalıştırır; ikincisi `scripts/ornek-denetle.mjs`, her
örnek ürün satırını KENDİ kategorisinin filtresine karşı sınar. Satır kategorinin
`haric` desenine takılıyorsa ya da hiçbir eşleşmeye uymuyorsa oraya ait değildir.
Ölçüldü (31.07.2026): hidrolik hortum sayfasındaki 16 satırın 9'u hortum değildi
— hortum eki, hortum te'si, hortum kanalı ve iki tezgâh kartı.

**Denetçideki Türkçe tuzağı, ı tuzağının üçüncü yüzü.** Desenler Postgres için
yazılı ve kelime sınırı olarak `\m`/`\M` kullanıyor. Bunları JS'te `\b` ile
çevirmek YANLIŞ: JS'te `\b`, `\w` yani `[A-Za-z0-9_]` üzerinden tanımlıdır ve
Türkçe İ/Ş/Ğ/Ü/Ö/Ç harflerini kelime harfi saymaz. "HORTUM EKİ 5/16" satırında
`\bEKİ\b` tutmaz (İ ile boşluk arasında JS'e göre sınır yoktur) ama "EKİPMAN"da
yanlış alarm verir. Doğrusu Unicode bakışıdır: `(?<![\p{L}\p{N}_])`.

### Muhtelif tezgâh kartları

Adı tek bir cins ismi olan, ölçüsüz kayıtlar (`MUH.MUH.26` = "HORTUM") gerçek ürün
değil; listede olmayan bir kalemi hızlı satmak için açılmış tezgâh kartları. 16 tane
var ve biri aylık 362 hareketle örnek tablonun en üstüne çıkıyordu. `veri-cek.mjs`
içindeki `GENEL_HARIC` bunları tüm kategorilerden düşer.

### Filtre değişirse sayı bayatlar

`toplamUrun` bir SNAPSHOT'tır; sayfada "133 kalem stok" diye görünür. Bir
kategorinin `eslesme`/`haric`/`eslesmeKod`/`haricKod` alanlarından biri
değiştirildiğinde bu sayı OTOMATİK güncellenmez ve sayfa yanlış sayıyla yayına
çıkar. Ne tsc, ne build, ne `npm run denetle` bunu görür — denetim sayının
doğruluğunu değil sayfanın tutarlılığını sınar.

Ölçüldü (31.07.2026): SEL kod bağımlılığı kaldırıldıktan sonra dört kategori
canlıda yanlış sayı gösteriyordu — hidrolik-hortum 133 diyordu, gerçek 298;
pnomatik-hortum 35 diyordu, gerçek 73.

**Kural: kategori filtresine dokunduysan `npm run veri` çalıştır.** Servis
anahtarın yoksa en azından değişen kategorilerin sayısını Supabase'den ölçüp
`toplamUrun` alanlarını elle güncelle.

### Veri tazeleme

`npm run veri` (`scripts/veri-cek.mjs`) `SUPABASE_SERVICE_ROLE_KEY` ister; anon
anahtar RLS yüzünden sıfır satır görür. Script yıkıcı değildir: elle düzenlenmiş
örnek ürün satırlarını ezmez, yalnız `toplamUrun` sayılarını tazeler ve listede
olmayan çok satan kalemleri konsola önerir. Sorgu boş dönerse dosyayı yazmadan
durur.

### Doğrulama

Değişiklikten sonra `npx tsc --noEmit` ve `npm run build` çalıştır. Build tüm
sayfaları statik üretir; yeni bir sayfa eklendiyse ilgili HTML'in
`.next/server/app/tr/` altında oluştuğu görülmelidir.

Sonra `npm run denetle` (`scripts/build-denetle.mjs`). Üç şeyi arar, üçü de
sessizce bozulabilen şeylerdir; sorun bulursa çıkış kodu 1 döner:

- **Kırık iç link.** Üretilen HTML'deki her `href="/..."` bir dosyaya karşılık
  gelmeli. 15.000'in üzerinde iç link var; elle bakılamaz.
- **Tedarikçi adı sızıntısı.** Ürünleri aldığımız firmaların adı hiçbir sayfada
  geçmemeli — yalnız ürünün üzerindeki marka yayımlanır.
- **Yinelenen `<title>`.** Aynı başlık iki sayfada varsa biri diğerini yer.
  Aynı `<h1>`ın üç dilde tekrarlaması normaldir (marka adları çevrilmez), o
  yüzden h1 denetlenmez.

**Denetim ham HTML'de arama YAPMAZ, `<script>` bloklarını ayıklar.** Next.js
sayfa sonuna `self.__next_f.push` ile akış yükünü gömüyor ve uzun dizeleri
rastgele yerlerden bölüyor: `hidroteknik.com.tr` bir chunk sınırında
`hidrotek` + `nik.com.tr` diye ikiye ayrılabiliyor ve ham metinde arayan bir
denetçi bunu tedarikçi adı sızıntısı sanıyor. Bölünme her build'de yer
değiştirdiği için alarm da kararsız. Yalan söyleyen denetçi görmezden gelinir —
bu yüzden yalnız kullanıcıya görünen işaretleme taranır.

### Tedarikçi adı hiçbir yerde geçmez

Ürünü aldığımız toptancılar **marka değildir** ve adları ticari sırdır: Adem Kardeşler,
Arıca, Teksan, GDC, Hidrotek (bu sonuncusu "Hidroteknik" değil, ayrı bir firma).
Yalnız ürünün ÜZERİNDEKİ marka yayımlanır — HansaFlex, Kastaş, Pemaks vb. gerçek
markadır, serbesttir.

Ürün **adları ve kodları serbesttir**; adlarda tedarikçi adı geçmiyor (ölçüldü
30.07.2026: Arıca 6.973, Teksan 3.480, Adem Kardeşler 3.756 kalemde 0 geçiş).

**Tek istisna GDC:** 1.086 kalemin HEPSİNİN kodu `GDC-` ile başlıyor, yani kodun
kendisi tedarikçiyi ele veriyor. GDC'de adlar yayımlanır, kodlar yayımlanmaz —
`silindir-parcalari.json` bu yüzden ölçü taşır, kod taşımaz.

`scripts/build-denetle.mjs` beşini de arar. Desenler sınır koşullu yazılır: `arıca`
sınırsız yazılsaydı "ayrıca" 18 sayfada yanlış alarm verirdi.

### Doğrulanamayan bilgi boş bırakılır

Kastaş profil kodlarının işlevi (`ad` alanı) yalnız Kastaş kataloğundan
doğrulanabilen kodlarda doludur; 33 profilin 18'inde boştur ve sayfada bunun neden
boş olduğu yazar. Aynı disiplin marka metinlerinde de geçerli: markanın kurumsal
geçmişi hakkında doğrulanamayan iddia yazılmaz, yalnız **bizde gerçekten stokta
olan üründen** yola çıkılır.

Buna karşılık veriden TÜRETİLEBİLEN bilgi türetilir: profilin mil mi piston mu
tarafına takıldığı, ölçü sırasından okunur (iç→dış = mil, dış→iç = piston). Bu
kural Kastaş kataloğuyla karşılaştırılıp doğrulandı.
