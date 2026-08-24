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
TR (varsayılan) / EN / RU üç dilde yayında, ~306 statik sayfa.

**Beş sayfa ailesi var, beşi de aynı desende: veri JSON'da, şablon tek dosyada.**

| Aile | Veri | Şablon | Adet |
|---|---|---|---|
| Kategori | `data/kategoriler{,.en,.ru}.json` | `app/[lang]/[slug]/` | 28 × 3 |
| Profil kodu | `data/profiller.json` | `app/[lang]/profil/[kod]/` | 43 × 3 |
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

Üç kategori koda MECBUR ve bunlar bilinçli istisnadır — sızdırmazlıkta ürün
adı `k21-040/11 ( 40 x 50 x 8 )` biçimindedir, ne olduğunu söyleyen kelime
geçmez: `hidrolik-silindir` (`^CNC\.`), `o-ring-sizdirmazlik`
(`^KASTAS\.(KO|KX|KSO)`) ve `hidrolik-kece-nutring` (`^KASTAS\.` eksi o-ring).
`scripts/kod-gocur.mjs` her koşumda bunları ekrana basar.

`krom-mil-boru` eskiden dördüncüsüydü (`^A\.`) ve kod göçünde tam da yukarıda
anlatılan şekilde patladı: yeni düzende `A.` öneki kalmadı (183 → 3 kayıt).
Ada çevrildi, bugün 180 kalem tutuyor.

`hidrolik-silindir` de aynı hastalığın hafif hâlini yaşadı: kod şeması `CNC.` →
`CNC-PV-T-` diye genişledi ve `^CNC\.` deseni 8 çelik pistonu tutmaz oldu.
Bir süre fark edilmedi çünkü ters eğik çizgi hatası deseni `^CNC.` yapıp onları
kazara yakalıyordu — iki hata birbirini örtmüş. Desen `^CNC[.-]` oldu.

Bu 8 piston adında "keçeli" geçtiği için `hidrolik-kece-nutring`'e de düşüyordu;
keçe arayana çelik piston göstermemek için oraya `haricKod: ^CNC-` eklendi.

### Yayımlanan kod ÜRETİCİNİNDİR, bizimki değil

Stok kodumuz iki parçadır: **bizim önekimiz + üreticinin katalog kodu.**

```
HF.H.HD106        →  HansaFlex  HD106
HF.PN10AOL90      →  HansaFlex  PN10AOL90
PAK.0401000108    →  Pakkens    0401000108
KASTAS.K21-040/11 →  Kastaş     K21-040/11
```

Önek bizim: sık değişir (2026'nın yalnız temmuz ayında üç göç), dışarıda
karşılığı yoktur, kimse `SEL.FR2.SC.04` aramaz. **Yayımlanmaz.** Kalan kısım
üreticinindir: kalıcıdır, üreticinin kendi kataloğunda geçer, gerçekten aranır.
**Yayımlanır** — sayfada "Üretici kodu" sütunu ve JSON-LD'de `mpn` olarak.

Doğrulandı (01.08.2026), HansaFlex bu kodları kendi mağazasında birebir ürün
kimliği olarak kullanıyor: `shop.hansa-flex.us/…/p/HD106`, `/p/KP208`,
`/p/PN10AOL`, `/p/PN10AOL90`. Pakkens `0401000108` üçüncü taraf satıcılarda
aynen listeleniyor.

Çıkarımı `satirUreticiKodu` (`lib/uretici-kod.ts`) yapar. **Her önek uygun
değildir, üç sebeple:**

- **Tedarikçi gruplaması.** `AR.` altında markasız 52 + KDNT 4 + Oxim 4 kalem
  var; kalan kısım tedarikçinin sıra numarasıdır, kimsenin katalog kodu değil.
  Tek markaya oturan önekler (`HF`→HansaFlex 40/40, `HE`→Hema 33/33) veride
  net ayrışır.
- **Bizim ölçü kodumuz.** `GM.380.00,37` "380 V, 0,37 kW" demektir; Gamak'ın
  gerçek kodu (`AGM2EL 71 M 4B`) ürün ADINDA durur.
- **Bizim ölçü ekimiz.** `HARF.SAYI` kalıbı (68 kod) hep bizimdir:
  `ESM.DK.ÇD.14` = "DK 14 çelik dişlisi". `GATES.MXT.06` de buraya düşer —
  Gates'in kodu `6MXT`, `MXT.06` bizim yeniden dizmemiz. Üretici kodu ölçüyü
  nokta ile ayırmaz, içine gömer (`HD106`).

Kapsam: 15.258 aktif kaydın ~%65'i üretici kodu veriyor; sayfada görünen 686
örnek satırın 300'ü (%44). Kalanların hücresi boş kalır — uydurmaktansa boş
bırakılır (bkz. "Doğrulanamayan bilgi boş bırakılır").

Yeni önek eklerken ölçüt tek: **kodun kalan kısmını üreticinin kendi yayınında
bulabiliyor musunuz?** Bulamıyorsanız eklemeyin.

`scripts/uretici-kod-denetle.mjs` (npm run denetle'nin üçüncü adımı) 28 elle
doğrulanmış örneği sınar ve yayımlanan hiçbir kodda tedarikçi adı geçmediğini
kontrol eder.

**İç kod sızıntısının görünmez yolu: React `key`.** `<tr key={u.kod}>` yazmak
kodu RSC akış yüküne `["$","tr","HF.H.HD106",…]` diye yazar; sütunu kaldırsanız
bile sayfa kaynağında kalır ve arama motoru görür. Örnek tablolarda anahtar
olarak dizin kullanılır. `build-denetle.mjs` bunu artık HAM html'de arar (diğer
üç denetimin tersine — orada RSC yükü ayıklanır, burada tam da o yük taranır).

### Kod göçü

Stok kodları değiştiğinde `npm run kod-gocur -- eski-yeni.csv` kuru çalıştırma
yapar, `--uygula` ile yazar. Örnek satırların `kod` alanlarını çevirir; kategori
kod DESENLERİNİ çevirmez, yalnız raporlar — bir eşleme tablosu yeni kodların
hangi önekle başlayacağını bilemez, o karar insanındır.

Göç artık sayfa içeriğini büyük ölçüde ETKİLEMEZ: yayımlanan kod üreticinin
kodudur ve önek değişse de o kısım aynı kalır (`HANSA.HD106` → `HF.H.HD106`,
ikisinde de `HD106`). Göçün asıl riski hâlâ kategori kod desenleridir.

### Örnek satır denetimi

`npm run denetle` üç şey çalıştırır; ikincisi `scripts/ornek-denetle.mjs`, her
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
var ve biri aylık 362 hareketle örnek tablonun en üstüne çıkıyordu. `GENEL_HARIC`
(`scripts/genel-haric.mjs`) bunları tüm kategorilerden düşer.

**Desen TEK KOPYA olmak zorunda.** İki yerde kullanılıyor — `veri-cek.mjs` sayarken,
`ornek-denetle.mjs` örnek satırları sınarken. Kopyalar ayrışırsa denetim yalan
söyler: tazeleme bir kaydı eler, denetçi elemez, sonuç "kategorisine uymayan 0" der
ama sayfada o kayıt durur. 02.08.2026'da gerçekten ayrıştılar (denetçininkinde
`PNÖMATİK ` öneki yoktu) ve `MUHT.215` "PNÖMATİK SİLİNDİR" aylarca sayfada kaldı.

**Cins isminden sonra tek dolgu kelimesine izin var** (` SETİ`, ` BAĞLANTI`), çünkü
kart hep çıplak yazılmıyor: `MUHT.119` "HİDROLİK HORTUM SETİ", `MUHT.130` "NİPEL
BAĞLANTI", `MUHT.283` "DÖNER DİRSEK BAĞLANTI". Sondaki `$` çapası korunduğu için
ölçülü kardeşleri ("NİPEL BAĞLANTI 4", "DÖNER DİRSEK BAĞLANTI 1/4 x 6") etkilenmez —
desene dokunurken bu ölçüldü, 15.258 kayıtta tam 5 kart eleniyor, yan etki sıfır.

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
örnek ürün satırlarını ezmez, yalnız `toplamUrun` ve marka `adet` sayılarını
tazeler ve listede olmayan çok satan kalemleri konsola önerir. Sorgu boş dönerse
dosyayı yazmadan durur.

Yalnız AKTİF kartlar sayılır (`aktif=is.true`). 15.364 kaydın 106'sı pasif;
sayılırsa sayfa stokta olmayan ürünü stokta gösterir.

### PostgREST'in iki sessiz tuzağı

İkisi de HATA VERMEZ, yalnız yanlış sayı üretir. İkisi de aylarca fark edilmedi.

**1. Tırnak — hariç filtresi `and=()` içinde olmak zorunda.** Düz
`urun_ismi=not.imatch."DESEN"` yazıldığında PostgREST tırnakları desenin PARÇASI
sayıyor, hiçbir kayıt tutmuyor, `not` da her şeyi geçiriyor. Ölçüldü
(31.07.2026, hidrolik-hortum): düz biçim 1.240, `and=()` biçimi 205.

**2. Ters eğik çizgi — `tirnak()` içinde İKİYE KATLANMALI.** PostgREST tırnaklı
değerin içinde `\` karakterini kaçış işareti sayıp yutuyor:

```
yazılan     sunucunun gördüğü     sonuç
^(AK)\.     ^(AK).                AKG. de tutuluyor  → Akon 57 yerine 246
\mEK\M      mEKM                  hiçbir şey tutmuyor → 24 kalem eksik
```

Ölçüldü (02.08.2026): yedi kategorinin filtresi bu yüzden bozuk çalışıyordu.
`hortum-ucu-koruma` 57 diyordu, gerçek 81; `hidrolik-silindir`in `^CNC\.` deseni
`CNC-PV-T-040` gibi tireli kodları da yakalıyordu.

**Bu sınıf hatayı yakalamanın tek güvenilir yolu ikinci bir motordur.** Aynı
filtreleri bağımsız bir JS regex motoruyla yerel anlık görüntüye uygulayıp
Postgres'in sonucuyla karşılaştırmak, iki tuzağı da anında görünür kıldı; 28
kategoride 10'u sapıyordu. Sayı kontrolleri (sıfır mı, iki katına mı çıktı)
gerekli ama yeterli değil — Akon'un 57→246 sıçraması sıfır kontrolünden geçmişti.

### Sayı korumaları

`veri-cek.mjs` üç eşikte durur ve dosyayı YAZMAZ:
- kategori 0 döndü ama dosyada sayı var → yetki ya da desen bozuk
- kategori sayısı 2 katından fazla arttı → mükerrer kayıt olabilir
- marka sayısı 2 katından fazla arttı → desen komşu öneki tutuyor (AK. ↔ AKG.)

Bilerek büyük sıçrama varsa `--zorla`.

### Marka kalem sayısı

`markalar.json` içindeki `adet` de `toplamUrun` gibi bayatlar. Artık `npm run veri`
tazeliyor ama **yalnız tek markaya oturduğu doğrulanmış önekler için**. `AR.`
altında 1.015 kalem var ve bunların yalnız 7'sinde Oxim adı geçiyor (75 KDNT,
21 Festo, 912 markasız) — önekten saymak marka sayfasını 92 yerine 1.015 dedirtir.
Oxim ve Oleostar bu yüzden elle ölçülmüştür ve script onlara dokunmaz, atladığını
raporlar.

### Doğrulama

Değişiklikten sonra `npx tsc --noEmit` ve `npm run build` çalıştır. Build tüm
sayfaları statik üretir; yeni bir sayfa eklendiyse ilgili HTML'in
`.next/server/app/tr/` altında oluştuğu görülmelidir.

Sonra `npm run denetle` (`scripts/build-denetle.mjs`). Sekiz şeyi arar, sekizi de
sessizce bozulabilen şeylerdir; sorun bulursa çıkış kodu 1 döner:

- **Kırık iç link.** Üretilen HTML'deki her `href="/..."` bir dosyaya karşılık
  gelmeli. 15.000'in üzerinde iç link var; elle bakılamaz.
- **Tedarikçi adı sızıntısı.** Ürünleri aldığımız firmaların adı hiçbir sayfada
  geçmemeli — yalnız ürünün üzerindeki marka yayımlanır.
- **Yinelenen `<title>`.** Aynı başlık iki sayfada varsa biri diğerini yer.
  Aynı `<h1>`ın üç dilde tekrarlaması normaldir (marka adları çevrilmez), o
  yüzden h1 denetlenmez.
- **İç stok kodu sızıntısı.** Yalnız üreticinin kodu yayımlanır; bizimki asla.
  Bu tek denetim HAM html'de arar (bkz. React `key` tuzağı).
- **Kanonik bütünlüğü.** Kök 308 mü, her sayfanın canonical'ı kendini gösteriyor
  mu, çok dilli her sayfa x-default beyan ediyor mu (bkz. bir alttaki bölüm).
- **Rusça sayı çekimi.** 1 размер · 2-4 размера · 5+ размеров; son iki hane
  11-14 ise her zaman çoğul (bkz. "Rusça sayı çekimi" bölümü).
- **Sayı biçimi.** ru/en sayfasında Türkçe binlik ayracı (`5.297`) aranır.
- **Güncelleme damgası.** `data/guncelleme.json` git ile tutuyor mu (bkz. bir
  alttaki bölüm). Sığ klonda atlanır.

**Denetim ham HTML'de arama YAPMAZ, `<script>` bloklarını ayıklar.** Next.js
sayfa sonuna `self.__next_f.push` ile akış yükünü gömüyor ve uzun dizeleri
rastgele yerlerden bölüyor: `hidroteknik.com.tr` bir chunk sınırında
`hidrotek` + `nik.com.tr` diye ikiye ayrılabiliyor ve ham metinde arayan bir
denetçi bunu tedarikçi adı sızıntısı sanıyor. Bölünme her build'de yer
değiştirdiği için alarm da kararsız. Yalan söyleyen denetçi görmezden gelinir —
bu yüzden yalnız kullanıcıya görünen işaretleme taranır.

### Kanonik: kök 308 olmak ZORUNDA

Search Console 24.08.2026'da "Duplicate, Google chose different canonical than
user" dedi. Sebebi tek satırlıktı: `app/page.tsx` `redirect()` çağırıyordu ve
Next.js'in `redirect()`i **307** döndürür — yani GEÇİCİ yönlendirme.

Google'ın kendi dokümanı ayrımı açıkça koyar: 301/308'de "yönlendirmeyi, hedefin
kanonik olması gerektiğine dair bir işaret" sayar; 302/307'de **saymaz**, kaynağı
dizinde tutmaya devam eder. Yani Google `/` adresini kanonik kabul edip `/tr`
sayfasını onun kopyası saydı, `/tr` ise kendi kanoniğini `/tr` diye beyan
ediyordu. Uyarı tam olarak bu çelişkidir.

Çözüm `permanentRedirect()` (308). Canlıda ölçüldü: `/` 307 → 308,
`/tr/` ve diğer eğik çizgili adresler zaten 308'di (`trailingSlash: false`).

**x-default de eklendi** ve aynı ailedendir. Üç dil beyan edip hiçbirine
"varsayılan" demezsek, dili tutmayan bir arama için hangi sürümün gösterileceğine
Google karar verir — bu, yinelenen bir kümede kanonik seçmekle aynı işlemdir.
`dilAlternatifleri()` (`lib/site.ts`) altı şablonun da `alternates.languages`
haritasını üretir ve x-default'u TR'ye bağlar. Google üç yöntemi (HTML etiketi,
HTTP başlığı, sitemap) eşdeğer sayıp birinin seçilmesini istiyor; biz HTML
etiketini kullanıyoruz, o yüzden sitemap'e `xhtml:link` eklenmez.

Denetimin beşinci adımı üçünü de sınar ve regresyon testi yapıldı: `index.meta`
elle 307'ye çevrilip bir sayfadan x-default silindiğinde denetçi ikisini de
yakaladı, geri alınınca temiz döndü.

**Ölçüldü, sorun DEĞİL:** dil sürümleri birbirinin kopyası değil. Görünen metnin
5'li pencere benzerliği TR~EN ortalama %13. Yalnız kod ağırlıklı üç sayfa
yüksek (`kuresel-vana` %59, `pnomatik-silindir` %42, `elektrik-motoru` %41)
çünkü sayfanın %74'ü çevrilmeyen üretici kodu. Orada bile 1.400 kelime çevrilmiş
metin var. Google'ın ölçütü şudur: "yerelleştirilmiş sürümler yalnız ANA İÇERİK
çevrilmemişse kopya sayılır." Ayrıca 305 sayfanın `<title>`, `description` ve
`canonical` alanlarının hepsi tekil.

### dateModified: tarih DOĞRU olmalı, yoksa hiç olmasın

JSON-LD'de beş şablonun da `dateModified` alanı var ve tarih `new Date()`ten
DEĞİL, git geçmişinden geliyor (`npm run guncelleme` → `data/guncelleme.json`).

Sebebi: her build'de bugünü damgalamak 306 sayfanın hepsine "bugün değişti"
dedirtir. Google tutarlı ve doğrulanabilir olmayan tazelik sinyallerini dikkate
almayı bırakır — yani yalan söyleyen tarih, hiç tarih olmamasından kötüdür.

Tarih neden dosyaya YAZILIYOR: Vercel sığ klon yapıyor, build sırasında
`git log` çoğu dosya için boş döner. Hesap tam geçmişin bulunduğu yerde yapılıp
commit'lenir. Veri dosyasına dokunduysan `npm run guncelleme` çalıştır —
denetimin sekizinci adımı damganın bayatladığını yakalar.

**`app/sitemap.ts` hâlâ `new Date()` kullanıyor** ve 304 URL'nin hepsine her
deploy'da bugünü basıyor. Aynı hastalık, ayrı iş olarak duruyor.

Ana sayfalarda (`/tr`, `/en`, `/ru`) sayfa düzeyinde hiç yapılandırılmış veri
YOKTU — yalnız yerleşimden gelen LocalBusiness vardı. `anaSayfaSchema()`
eklendi: `CollectionPage` + 28 grubu listeleyen `ItemList`. Bir dil modeline
"bu katalogda ne var" sorusunun tek isteğe cevabı budur.

### Rusça sayı çekimi

Rusça'da sayıdan sonraki isim sayıya göre çekilir ve bu, şablona sabit yazılan
her Rusça dizede sessiz bir hatadır:

```
1 размер   ·   2-4 размера   ·   5+ размеров
son iki hane 11-14 ise HER ZAMAN çoğul:  11 размеров, 112 размеров
```

Ölçüldü (24.08.2026): sekiz dizede tek biçim sabit yazılmıştı. Ölçü listeleri
tam listeye çıkarılınca `profilListeNotTam` 2 profil yerine 43'ünde tetiklendi
ve K21 sayfası "все 1 223 размеров" dedi — doğrusu **размера** (sonu 3).
`kodListeBaslik` de "52 кодов" diyordu; doğrusu **кода**.

`ruCekim()` (`lib/metin.ts`) ve dört kısayolu (`ruOlcu`, `ruPoz`, `ruKod`,
`ruTipo`) bunu tek yerde çözer. Sayı fonksiyonlara BİÇİMLENDİRİLMİŞ dize olarak
geliyor ("1 223"), o yüzden rakam dışı atılıp tam sayıya dönülür.

**Her sayı çekim istemez.** `из / свыше / более / около / до / от / менее`
edatlarından sonra isim, sayı ne olursa olsun tamlayan çoğuldur — «из 1223
размеров» DOĞRUDUR. Denetim bu istisnayı tanır; tanımayan bir denetçi doğru
Rusça'yı hata diye bildirir.

**Binlik ayracı da dile göre değişir:** Türkçe nokta (5.297), İngilizce virgül
(5,297), Rusça kırılmaz boşluk (5 297). Şablon sayıları `sayiFormat()`ten
geçtiği için doğru; tehlike VERİYE ELLE yazılan sayıda. `kategoriler.ru.json`
içinde dört yerde "5.297 позиций" yazıyordu — Rusça okuyan biri bunu "beş tam
iki yüz doksan yedi" diye okur, yani 5.297 kalemlik stok 5 kalem gibi görünür.

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

### Profil sayfaları

`npm run profil` (`scripts/profil-uret.mjs`) `data/profiller.json` üretir; kuru
çalışır, `--uygula` ile yazar. Doğrulanmış sabitler ayrı dosyada
(`scripts/profil-veri.mjs`): işlev adları ve kaynak URL'ler.

**`yer` elle yazılmaz, ölçü SIRASINDAN türetilir.** `14 x 24 x 7` artıyor → önce
iç sonra dış çap → **Mil**. `50 x 44,4 x 6,2` azalıyor → önce dış → **Piston**.
Kural Kastaş'ın kendi sınıflandırmasıyla karşılaştırıldı ve birebir tuttu
(01.08.2026): türetim K40/K54 için "Piston" dedi, Kastaş da onlara "Piston
Keçesi" diyor; K12/K29/K30/K51/K52 için "Mil" dedi, Kastaş da "Toz/Boğaz
Keçesi" diyor. Bir ailenin ölçüleri aynı yönü göstermezse **üretim durur** —
sayfada "mil tarafına takılır" yazan bir piston keçesi yanlış parça sattırır.

**Aile ayracı üç türlü:** `K21-040/11`, `K707.01.01`, `K18 020-011`. Yalnız
`[-.]` arayan bir tarama K18'in 166 kalemini görmez.

**`ad` üç dillidir.** Önceden tek Türkçe dizeydi ve EN/RU sayfalarda cümlenin
ortasında Türkçe görünüyordu: *"Polyurethane (PU) option available Nutring — mil
sızdırmazlık elemanı"*. Aynı hata ana sayfa çiplerinde `yer` için de vardı
(`>Mil<` üç dilde de basılıyordu); `yerMetni` artık `lib/profil.ts`'te ve iki
sayfa da onu kullanıyor.

EN/RU karşılıklar Kastaş'ın KENDİ ürün sayfalarından alındı, çevrilmedi. Kastaş'ın
sitesinde üç hata var ve üçü de `profil-veri.mjs`'te işaretli: `ru/k14-anillo-en-v`
altında İspanyolca metin duruyor, `ru/k152-…` bir varyantta İngilizce, ve K12'nin
Türkçesi "Saclı" yazılmış. Üreteç her `ru` dizgisinin Kiril olduğunu ayrıca sınar.

**Türkçe ad elle yazılmış hâliyle korunur.** Kastaş'ın resmî adı kısadır
("Kompakt Set"); bizimki ne işe yaradığını söyler ("Kompakt piston keçesi") ve
Türkçe aramada karşılığı olan terimleri taşır. Üreteç farkı raporlar, ezmez.

### JSON-LD: Product var, Offer YOK

Katalog `Product` yayımlar ama `offers` yayımlamaz ve bu bilinçli bir karardır.

Google, `Product` üzerinde `offers` görünce sayfayı **satın alınabilir ürün
sayfası** (Merchant listing) sayar ve fiyat, görsel, kargo/iade bilgisi bekler.
Katalog fiyat yayımlamaz — o beklentiler hiçbir zaman karşılanamaz, dolayısıyla
Search Console sürekli uyarı üretir (02.08.2026: "Missing field description") ve
uyarılardan biri kritikleşirse zengin sonuç kaybedilebilir. `offers` olmadan
sayfa "ürün bilgisi" (product snippet) olarak sınıflanır — gerçekten olduğumuz
şey budur.

Stokta olma bilgisi kaybolmaz, `description` metninde düz cümleyle söylenir.
İşletme bağlantısı da kaybolmaz: sayfa düzeyindeki `about` ve `provider` aynı
LocalBusiness'a işaret eder.

**`description` üç dilde `lib/metin.ts` → `urunAciklama` ile kurulur ve
UYDURULMAZ**; yalnız eldeki gerçek alanlardan (kategori, marka, ölçü, üretici
kodu) oluşur, olmayan alan cümleye hiç girmez.

**Kimlik alanına ölçü yazma.** Bu hata iki kez yapıldı: `mpn: u.model`
("M18x1,5 12L" bir ölçüdür) ve `sku: o` ("32x16" bir ölçüdür). Ölçünün alanı
`size`; `mpn` üreticinin parça numarasıdır, `sku` satıcının stok kodudur.

### Doğrulanamayan bilgi boş bırakılır

Kastaş profil kodlarının işlevi (`ad` alanı) yalnız Kastaş kataloğundan
doğrulanabilen kodlarda doludur; 43 profilin 18'inde boştur ve sayfada bunun neden
boş olduğu yazar. Aynı disiplin marka metinlerinde de geçerli: markanın kurumsal
geçmişi hakkında doğrulanamayan iddia yazılmaz, yalnız **bizde gerçekten stokta
olan üründen** yola çıkılır.

Buna karşılık veriden TÜRETİLEBİLEN bilgi türetilir: profilin mil mi piston mu
tarafına takıldığı, ölçü sırasından okunur (iç→dış = mil, dış→iç = piston). Bu
kural Kastaş kataloğuyla karşılaştırılıp doğrulandı.
