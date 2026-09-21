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
- `app/sitemap.ts`, `app/llms.txt/route.ts` ve `app/llms-full.txt/route.ts` —
  aileleri kapsar; yeni bir aile eklenirse ÜÇÜNE de yazılmalı.
- İkonlar `app/` altında: `icon.png` (512), `apple-icon.png` (180, opak),
  `favicon.ico` (16/32/48). Kaynak `public/logo.png`'nin sol 108 pikseli — HT
  monogramı; kelime markası favicon'da okunmaz. Ana sitenin faviconuyla aynı
  görünüm (kare beyaz zemin, yuvarlatma yok) çünkü iki mülkün aynı ikonu
  taşıması marka tutarlılığıdır; fark yalnız çözünürlükte (onlarınki 40x40
  kaynak). Yeni bir HTML OLMAYAN rota eklenirse `build-denetle.mjs` içindeki
  `HTML_OLMAYAN_ROTALAR` listesine de yazılmalı, yoksa link denetimi onu
  "kırık" sanar.

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

### Teknik tablolar: sayılar HESAPLANIR, elle yazılmaz

Kategori sayfalarına `tablolar` alanıyla teknik tablo gömülür (`lib/veri.ts` →
`Tablo`). Şablonda girişin hemen altında, marka çiplerinden önce render edilir.

**Sayılar `npm run tablo` ile üretilir** (`scripts/tablo-uret.mjs`), kuru çalışır,
`--uygula` ile yazar. Elle yazılsaydı üç dil dosyasında üç ayrı kopya olurdu ve
biri düzeltilip diğeri unutulurdu — bu projede tam olarak bu hata yaşandı
(bkz. "Desen TEK KOPYA olmak zorunda"). Burada tek kaynak fizik, üç dil ondan
türetilir.

**Yanlış sayı taşıyan teknik tablo, tablo olmamasından kötüdür:** okuyan kişi
ona göre silindir seçer.

Pnömatik silindir tablosu (21.09.2026): kuvvet = basınç × piston alanı, 6 bar,
5 N'a yuvarlanmış. Çaplar UYDURULMADI — `data/urunler.json` örnek satırlarında
gerçekten geçen ölçüler alındı (25, 32, 40, 63, 80, 100 + Pemaks DMC-A'daki 50).
Mil çapları standardın kendisinden: 25 mm ISO 6432, kalanı ISO 15552.

**Binlik ayracı üç dosyaya AYRI biçimde yazılır** (TR 1.180 · EN 1,180 ·
RU 1 180, kırılmaz boşluk). `Intl.NumberFormat` üretim anında uygular. Tek biçim
kopyalansaydı denetimin yedinci adımı yakalardı; doğrulandı, EN/RU sayfasında
Türkçe ayraç 0 geçiş.

Hücreler sayı değil DİZGİDİR: hücrede "1.180 N (120 kgf)" gibi karma metin
olabildiği için şablonda `sayiFormat()`'tan geçirmek işe yaramazdı.

### "Dolu sayfa" ölçütü

Dört pnömatik sayfası 21.09.2026'da bu desende dolduruldu:

```
                     giriş          SSS      tablo
pnomatik-silindir    71 → 315      3 → 10      1
pnomatik-hortum     146 → 285      3 →  9      1
pnomatik-valf       128 → 311      3 →  9      1
pnomatik-rakor      112 → 260      3 →  9      1
```

Ölçüt şu dört madde:

1. **Giriş 300+ kelime ve SEÇİM MANTIĞI anlatır**, ürünü tanıtmaz. Çap nasıl
   seçilir, strok neden çaptan bağımsız değildir, hangi tip ne zaman. Önceki
   hâli 71 kelimeydi ve "pnömatik silindir havayı harekete çevirir" diyordu —
   bunu bilen zaten arıyor, bilmeyen müşteri değil.
2. **En az bir hesaplanmış tablo** (bkz. bir üstteki bölüm).
3. **10 civarı SSS**, gerçek sorulardan. Üçü azdı.
4. **Her iddia ya veriden türetilir ya standarttan gelir.** Markanın kurumsal
   geçmişi hakkında doğrulanamayan cümle yazılmaz (bkz. "Doğrulanamayan bilgi
   boş bırakılır"). Pemaks için yazılabilen şey şuydu: stoktaki ürün ailesi
   devrenin dört halkasını da kapsıyor — bu veriden görülüyor, iddia değil.

**Görünen kelime sayısı yanıltıcıdır.** Sayfanın büyük kısmı üretici kod
tablolarıdır; `/tr/pnomatik-silindir` 5.060 kelime görünüyor ama bunun yalnız
~700'ü okunacak metin. Ölçmek istediğiniz şey giriş + SSS uzunluğudur.

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

### Kod ada gömülünce denetim kör kalır

24.08.2026'da canlıda iç stok kodu bulundu: `CNC-AK-63X75`, üç sayfada ve
`llms-full.txt`'te, üstelik JSON-LD'de hem `name` hem `description` alanında.
`npm run denetle` aylardır temiz diyordu. Sebebi üç katmanlıydı:

**1. Denetim yanlış alana bakıyordu.** İç kod kümesini `u.kod` alanından
kuruyordu. Ama kod göçünde yeni kod ERP'de ürün ADINA da yazılmıştı ve iki alan
AYRI şemadaydı:

```
kod = "CNC.04.01.063X75"                    ← denetimin aradığı, canlıda YOK
ad  = "ARKA KAPAK BASİT TİP CNC-AK-63X75"   ← YAYIMLANAN, canlıda VAR
```

Denetim aradığını bulamadı ve temiz dedi. **Veri alanına bakan denetim, aynı
bilginin BAŞKA bir alana sızmasını asla göremez.** Artık önek DESENİ aranıyor.

**2. Ayraç değişmişti.** Eski şema `CNC.`, yenisi `CNC-PV-T-`. Yalnız noktayı
arayan bir desen göçten sonraki hiçbir kodu görmez; desen `[.-]` olmalı.

**3. Temizlik yarım kaldı.** `urunAdiDuzelt()` görünen tabloyu temizliyordu ama
JSON-LD ham `u.ad`'ı kullanıyordu. Görünen yüzeyi temizleyip yapılandırılmış
veriyi unutmak sızıntıyı GİZLİ hâle getirir — gözle bakınca temiz görünür.

Kod tamamen silinmez, **kuyruğu ölçüdür ve korunur**: `CNC-AK-63X75` → `63X75`.
Atılan kısım önek ve grup harfleridir (AK = arka kapak, PV = piston vidalı) ve
ikisi de adın Türkçesinde zaten yazıyor, yani bilgi kaybı yok.

**Süs denetim, denetim olmamasından kötüdür.** Deseni ilk yazışımda gövdede
ayraca izin vermemiştim; `CNC-AK-63X75` kodunda rakamdan önce bir tire daha var
ve desen hiçbir şey tutmuyordu. Regresyon testi olmasa "düzelttim" diye
raporlayacaktım. Her denetim adımı, kasten bozulup yakaladığı görülerek
eklenmelidir.

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

Sonra `npm run denetle` (`scripts/build-denetle.mjs`). On bir şeyi arar, onu da
sessizce bozulabilen şeylerdir; sorun bulursa çıkış kodu 1 döner:

- **Kırık iç link.** Üretilen HTML'deki her `href="/..."` bir dosyaya karşılık
  gelmeli. 15.000'in üzerinde iç link var; elle bakılamaz.
- **Tedarikçi adı sızıntısı.** Ürünleri aldığımız firmaların adı hiçbir sayfada
  geçmemeli — yalnız ürünün üzerindeki marka yayımlanır.
- **Yinelenen `<title>`.** Aynı başlık iki sayfada varsa biri diğerini yer.
  Aynı `<h1>`ın üç dilde tekrarlaması normaldir (marka adları çevrilmez), o
  yüzden h1 denetlenmez.
- **İç stok kodu sızıntısı.** Yalnız üreticinin kodu yayımlanır; bizimki asla.
  Bu tek denetim HAM html'de arar (bkz. React `key` tuzağı) ve LİTERAL kod
  değil ÖNEK DESENİ arar (bkz. "Kod ada gömülünce" bölümü).
- **Kanonik bütünlüğü.** Kök 308 mü, her sayfanın canonical'ı kendini gösteriyor
  mu, çok dilli her sayfa x-default beyan ediyor mu (bkz. bir alttaki bölüm).
- **Rusça sayı çekimi.** 1 размер · 2-4 размера · 5+ размеров; son iki hane
  11-14 ise her zaman çoğul (bkz. "Rusça sayı çekimi" bölümü).
- **Sayı biçimi.** ru/en sayfasında Türkçe binlik ayracı (`5.297`) aranır.
- **Güncelleme damgası.** `data/guncelleme.json` git ile tutuyor mu (bkz. bir
  alttaki bölüm). Sığ klonda atlanır.
- **Düz metin çıktıları.** `llms.txt` ve `llms-full.txt` HTML olmadığı için
  yukarıdaki denetimlerin kapsamında değiller; ayrıca taranırlar.
- **Rehber görselleri.** Dosya `public/` altında var mı, alt metin üç dilde de
  dolu mu, `ru` gerçekten Kiril mi (bkz. bir alttaki bölüm).
- **Yabancı yazı sistemi.** Katalog TR/EN/RU yayımlıyor; latin ve kiril dışında
  bir yazı sistemi sayfada bulunmamalı. GERÇEK vakayla eklendi (21.09.2026):
  elle yazılan Rusça SSS'ye `масел и高 температуры` diye bir CJK karakteri
  karışmıştı — gözle fark edilmiyor, tsc görmüyor, build geçiyor. Beyaz liste
  tutulmuyor; meşru işaretler (â, ş, İ, π, Ø, ³) zaten latin/yunan bloklarında,
  yalnız katalogda hiçbir gerekçesi olmayan bloklar aranıyor.

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

### Olmayan adres 404 vermeli — 500 DEĞİL

21.09.2026'da ölçüldü: dil segmentine girmeyen her adres **500** dönüyordu.

```
/tr/boyle-bir-kategori-yok   404   ← doğru
/tr/profil/k999              404   ← doğru
/boyle-bir-sayfa-yok         500   ← YANLIŞ
/de                          500   ← YANLIŞ
/olmayan.txt                 500   ← YANLIŞ
```

**Neden 500 zararlı:** Google 5xx'i "sunucu bozuk, sonra gel" diye okur ve
adresi dizin kuyruğunda TUTAR; 404 "bunu sil" der. Dahası yaygın 5xx,
Googlebot'un tüm siteyi tarama hızını kısar — bu sitenin zaten en büyük sorunu
Google'ın taramayı bırakmış olması, yani hata tam da kanamanın olduğu yerdeydi.

**Sebep `as Dil` castıydı.** Alt segmentlerin HEPSİ kendi parametresini
sınıyordu (`if (!k) notFound()`), yalnız dilin kendisi sınanmıyordu:

```ts
const lang = langHam as Dil        // cast yalandır: tsc susar, çalışma anında
                                   // hiçbir şey doğrulanmaz
```

`/de` adresi `[lang]` ile eşleşip `lang="de"` oluyor, `METIN[lang]` undefined
dönüyor, sayfa `.find` üzerinde çöküyordu. tsc temiz, build temiz, denetim
temiz — hiçbiri göremez, çünkü hata TİP DÜZEYİNDE değil çalışma anındadır.

**Layout'a denetim koymak YETMEZ.** Layout ile page bağımsız render ediliyor;
layout `notFound()` atsa bile page bileşeni yine çağrılıyor ve yine çöküyor.
Ölçüldü: yalnız layout denetimiyle `/de` hâlâ 500 veriyordu.

**Asıl kapı `dynamicParams = false`** (`app/[lang]/layout.tsx`). Next.js,
`generateStaticParams`'ın döndürmediği bir `lang` için sayfayı hiç çalıştırmaz.
Her sayfaya tek tek denetim koymak kırılgandır — yeni aile eklenince unutulur.
Alt segmentler etkilenmez, onlar kendi `notFound()`larını çağırmaya devam eder.

**Kök 404 sayfası `<html>` ve `<body>`yi KENDİ açar** (`app/not-found.tsx`),
çünkü `app/layout.tsx` yalnız `children` döndürür — gerçek kök gövde
`app/[lang]/layout.tsx`'tedir. Dil TR sabittir (varsayılan ve x-default hedefi)
ama üç dilin girişi de listelenir; kök seviyesinde adres bize dil söylemiyor.

Regresyon olarak on yol sınandı: beş 404 hâli, dört çalışan aile ve kökün
hâlâ 308 verdiği. Sunucu günlüğünde sıfır hata.

### Rehber görselleri

Yedi teknik rehberin her birinde bir sahne görseli var (`public/rehber/*.webp`).
Görseller **OpenAI `gpt-image-2` ile üretildi**; katalogda başka görsel yok.

**Alt metin süs değil, üç ayrı işi birden yapıyor:** görme engelli okuyucunun
sayfadan aldığı tek şey, Google Görseller'in sayfayı sınıflandırdığı yer, ve
görsel yüklenmediğinde kalan metin. Bu yüzden `gorselAlt` üç dilde ZORUNLU ve
denetimin onuncu adımı `ru` alanının gerçekten Kiril olduğunu ayrıca sınar —
projede iki kez Türkçe metin EN/RU sayfada kalmıştı.

**Boyut:** üretilen PNG'ler ~2,4 MB. WebP'ye çevrilince 115–178 KB'a düşüyor
(%94). Yedi görselin toplamı 1,1 MB. `next/image` ile `priority` veriliyor
çünkü görsel ilk ekranda ve LCP öğesi o; `aspect-ratio` CSS'te sabit, yoksa
görsel yüklenirken metin aşağı zıplar.

**JSON-LD `image` MUTLAK adresle verilir** — yapay zekâ cevap arayüzlerinin ve
Google'ın kaynak görselini aldığı alan orası, göreli yol işe yaramaz.

**Denenip vazgeçilen yol:** gerçek logoyu üretilen sahneye perspektifle
yerleştirmek. Marka işareti birebir doğru oluyordu ama plakayı yeniden boyamak
önündeki kişiyi de kapatıyordu (teknisyenin kafasının üstü kesildi) ve her
görselde ön plan maskesi çıkarmak gerekiyordu. Modelin kendi bastığı logo
yeterince yakın; yerleştirme bırakıldı.

### Üretilen görselde BAŞKA firmanın markası olmamalı

Ana sayfada beş banner var (`public/banner/*.webp`), yedi rehberde birer sahne
görseli; hepsi OpenAI `gpt-image-2` ile üretildi.

**Model, istenmediği hâlde gerçek marka basıyor.** "Güç ve kontrol" banner'ının
ilk sürümünde valf bloklarının üstünde **Rexroth** yazıyordu ve gövdede
"return filter RF-10-3 MADE IN EUROPE" etiketi vardı. Rexroth bizim
markalarımızdan biri DEĞİL — `markalar.json`da hiç geçmiyor. Böyle bir görsel
iki şeyi birden yapar: satmadığımız bir markayı satıyormuş gibi gösterir ve
başka firmanın tescilli işaretinin yaklaşık kopyasını bizim ticari sayfamıza
koyar. Banner markasız yeniden üretildi; istem açıkça "gövdeler işaretsiz,
okunabilir marka ve ürün etiketi YOK" diyor.

**Kastaş istisnası bilinçlidir.** Profil kodları banner'ında ambalajda "KASTAS"
yazıyor ve bu meşru: Kastaş ürünün ÜZERİNDEKİ markadır, bayisiyiz ve o bölüm
tümüyle Kastaş grubuyla ilgili. Bu, tedarikçi adı yasağıyla karıştırılmamalı —
yasak olan ürünü ALDIĞIMIZ firmanın adıdır, ürünün markası değil.

**Kontrol edilecek şey:** yeni bir görsel üretildiğinde okunabilir yazıları
gözle tara. Denetim bunu otomatik yakalayamaz; görseldeki metin HTML'de yok.

### llms.txt içindekiler, llms-full.txt içeriktir

İkisi ayrı iş yapar ve karıştırılmamalı:

- **`llms.txt`** bir İÇİNDEKİLER'dir: ne olduğumuzu, hangi sayfaların
  bulunduğunu ve her grupta kaç kalem olduğunu söyler. ~155 satır.
- **`llms-full.txt`** İÇERİĞİN KENDİSİDİR: 5.030 sızdırmazlık ölçüsü, 9.335
  üretici katalog kodu, 574 örnek ürün satırı, dört rehberin tam metni.
  ~16.800 satır, 459 KB.

Gerekçe: üretken bir motor cevabını ÇEKTİĞİ METİNDEN kurar. 306 sayfayı tek tek
gezmek zorunda kalan bir istemci pratikte birkaçını okuyup kalanını hiç görmez.
Tek dosya, "K21 40x50x8 kimde var" sorusunun cevabını bir istek uzağa indirir.

**Yeni bilgi yayımlamaz**, var olanı tek yerde toplar — sayfalarda olmayan
hiçbir şey buraya girmez. Fiyat, tedarikçi adı ve bizim stok kodumuz burada da
yasaktır ve denetimin dokuzuncu adımı üçünü de arar. Bu ayrı bir adım olmak
zorunda: dosya HTML olmadığı için diğer denetimlerin `dosyalar` kümesinde yok
ve sızıntı için EN GENİŞ yüzey burası.

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

**`app/sitemap.ts` de artık aynı dosyayı okuyor** (21.09.2026). Öncesinde
`new Date()` kullanıyordu ve her deploy'da 316 URL'nin HEPSİNE o anki zaman
damgasını basıyordu; canlıda ölçüldü, benzersiz `lastmod` sayısı **1**'di.
Onarımdan sonra 2: 292 URL 2026-08-24, 24 URL 2026-07-30 (silindir parça
ailesi o gün değişmiş). Az sayıda farklı tarih olması normaldir — veri
dosyalarının çoğu gerçekten aynı gün değişti.

**İki sinyal AYNI kaynaktan gelmek zorunda.** Sitemap "bugün değişti" derken
JSON-LD "24 Ağustos" derse bu çelişkidir ve çelişki, hiç tarih vermemekten
kötüdür. İkisi de `data/guncelleme.json` okur.

Gün hassasiyeti (`YYYY-MM-DD`) kasıtlıdır ve sitemap şemasında geçerlidir;
saat/salise uydurmak elimizde olmayan bir kesinlik iddia etmek olurdu.

Elle yazılmış `denizli-hidrolik` sayfasının besleyen JSON'u yok, o yüzden
`guncelleme-yaz.mjs` içinde ailesi sayfanın KENDİ dosyasına bağlandı.

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

### Ziyaretçi ölçümü: iki parçalı ve ayara BAĞIMLI

Vercel Web Analytics açık. Ölçüm iki dosyaya bölünmüştür ve bölünme zorunludur:

- `middleware.ts` — ziyaretçinin IP'sine bakar, işyerinden geliyorsa `ht_ic`
  çerezi basar. Elemeyi YAPMAZ.
- `app/analitik.tsx` — tarayıcıda çerezi okur, varsa `beforeSend` null döner ve
  olay Vercel'e hiç gitmez.

**Neden sunucuda elenmiyor:** 306 sayfanın tamamı statik üretiliyor. Sunucuda
"bu ziyaretçi içeriden mi" diye karar verip `<Analitik/>` render etmemek sayfayı
isteğe bağımlı yani DİNAMİK hâle getirir ve statik üretim çöker. Çerez basmak
sayfa gövdesine dokunmaz.

**IP kaynağa yazılmaz.** Depo herkese açıktır; işyeri IP'si commit'lenirse git
geçmişinde kalıcı olarak yayımlanır. Değer Vercel ortam değişkenindedir:
`IC_IPLER`, virgülle ayrılmış liste. Dışarıdan gelen ziyaretçi hiç çerez almaz —
çerez yalnız IP tutarsa yazılır.

**`IC_IPLER` tanımsızsa eleme sessizce KAPALIDIR** ve işyeri trafiği veriyi
kirletir. Rakamlara bakan kişi bunu göremez. Bu yüzden middleware modül
yüklenirken konsola uyarı basar; Vercel çalışma günlüğünde görünür.

**Çerez tek yönlü olamaz.** Yalnız yazan bir kural, ofis dizüstüsü eve
gittiğinde çerezi üzerinde taşır ve o kişi sonsuza dek sayılmaz. Middleware IP
tutmuyorsa damgayı SİLER. Beş senaryo da elle sınandı (ofis IP'si, yabancı IP,
vekil zinciri `x-forwarded-for: ofis, 10.0.0.1`, ofis dışına çıkan damgalı
cihaz, ayar tanımsız).

**IP STATİKTİR** (doğrulandı 21.09.2026, kullanıcı beyanı) — filtre bu yüzden
güvenilir. Dinamik olsaydı sessizce çürürdü: IP'nin değiştiği gün eleme durur ve
o IP'yi devralan yabancı biri elenmeye başlar; ne build ne denetim bunu görür.
Bağlantı değişirse (hat taşınması, yeni ofis, ikinci şube) `IC_IPLER` ELLE
güncellenmelidir; liste virgülle çoğaltılabilir.

### IndexNow: Yandex ve Bing'e bildirim — Google'a DEĞİL

`npm run indexnow` kuru çalışır, `-- --gonder` ile bildirir.

**Google bu yoldan kapsanmaz ve script öyleymiş gibi davranmaz.** Google
IndexNow'a katılmıyor; ayrıca Google'a sayfa bildirmenin genel bir API'si
YOK: Search Console'un "Request Indexing" düğmesinin arkasında herkese açık
bir uç bulunmuyor, ayrı Indexing API ise yalnız iş ilanı ve canlı yayın
kabul ediyor. Google için elde kalan tek otomatik yol sitemap göndermek ve
Google sitemap'i zaten kendisi indiriyor.

**Asıl kazanç Yandex.** Rusya'da arama pazarının çoğunluğu orada, katalog da
Rusça yayımlıyor. Ölçüldü (21.09.2026): dört ayda Rusya'dan 13 gösterim,
0 tık; tüm BDT 33 gösterim, 0 tık. Bing aynı bildirimle kapsanıyor.

**Anahtar gizli değil, olamaz.** Protokol sahipliği anahtarın alan adında
YAYIMLANMASIYLA kanıtlıyor; dosya `public/` altında ve herkese açık olmak
ZORUNDA. Depo açık olduğu için commit'lenmesi ek sızıntı yaratmaz. Anahtarı
bilen biri yalnız bizim alan adımıza ait adresleri bildirebilir.

**Sessiz başarısızlığın yolu:** anahtar dosyası canlıda yoksa motor bildirimi
reddeder, ama bazı uçlar buna yine 200 döner — yani "gönderdim" diye rapor
edip hiçbir şey olmamış olabilir. Script bu yüzden gönderimden ÖNCE dosyayı
indirip içeriğini anahtarla karşılaştırır ve tutmuyorsa durur. Denetim kasten
bozulup sınandı: anahtar henüz deploy edilmemişken script HTTP 500 görüp
gönderimi durdurdu.

**Sıra önemli: önce deploy, sonra bildirim.** Anahtar dosyası yayında
olmadan gönderim anlamsızdır.

### Rusça: ders kitabı değil TİCARET Rusçası

21.09.2026'da ölçüldü — katalog dört ayda Rusya'dan 13 gösterim, 0 tık almıştı.
Sebebin bir kısmı bulundu: Rusça metin DOĞRU ama sanayinin kullandığı kelimeleri
taşımıyordu. Gerçek bir Rus alıcının kendi yazdığı teklif listesiyle karşılaştırıldı:

```
РВД                   ✗ katalogda 0 geçiş   ← en kritiği
штуцер                ✗ 0
гидрораспределитель   ✗ 0
обратный клапан       ✗ 0
переборочный          ✗ 0
```

**`РВД` = рукава высокого давления.** Rusça'da hidrolik hortumun standart
kısaltmasıdır ve arayan kişi `гидравлический рукав` değil `РВД` yazar. Alıcı
belgede küçük harfle, laf arasında kullanmıştı (`спираль для рвд`) — o kadar
sıradan bir kelime.

Terimler ANAHTAR KELİME OLARAK DEĞİL, metnin içinde gerçek karşılık olarak
yerleştirildi: «Фитинг, или штуцер, —», «Распределители — их также называют
гидрораспределителями —». SSS'ye de karşılık soruları eklendi
(«Чем штуцер отличается от фитинга?»).

**Bu çeviriyle çözülemezdi.** Doğru çeviri ders kitabı kelimesini verir; ticaret
kelimesini ancak o ticareti yapan birinin yazdığı metin verir.

### Müşteri belgesinden ne alınır, ne alınmaz

Katalog içeriğinin bir kısmı gerçek müşteri belgelerinden türetildi (teklif
listeleri, onaylanmış imalat çizimleri, sözleşme ekleri). Ayrım nettir:

**ALINIR:** ürünün teknik tanımı — ölçü, strok, çap/mil kombinasyonu, tek/çift
etkili oluşu, kullanım alanı (çöp kamyonu / мусоровоз), ve karşı tarafın
kullandığı SEKTÖR terimleri. Bunlar sektörün ortak malıdır.

**ALINMAZ:** firma adı, kişi adı, fiyat, toplam tutar, ödeme koşulu, IBAN/SWIFT,
vergi numarası, e-posta, ve **proje çizim kodu**.

Çizim kodu hakkında önce yanlış sonuç çıkarıldı ve düzeltildi. Sözleşme ekinde
13 kalemin yalnız birinde kod görünüyordu, buradan "şema sistematik değil"
denmişti. Çizimler PNG'ye çevrilip GÖRSEL olarak okununca şema net çıktı:

```
HCD.1.50.32.100.000      HCD  = tek kademeli
HCD.1.63.40.630.000      HC2X = çift kademeli
HCD.1.100.50.500.000            │  │  │   │
HC2X.1.80.40.400.000           tip çap mil strok
```

Yani sistematik. Yine de yayımlanmaz — sebebi gizlilik değil FAYDASIZLIK:
bu bir proje çizim numarasıdır, kimse `HCD.1.63.40.630.000` aramaz.

**Ders: metin katmanı olmayan PDF'ten "veri yok" sonucu çıkarma.** Sekiz
çizimden metin çıkarma denendi ve yalnız pdfFactory filigranı döndü; bundan
"çıkarılacak bir şey yok" sonucu çıkarıldı. Oysa çizimler PNG'ye çevrilip
görsel okununca hem kod şeması hem de tüm çalışma değerleri (200/250 bar,
−30…+80 °C, 0,5 m/s, G3/8 ve G1/2 bağlantı, göz delik çapları) oradaydı.

**Yuvarlak olmayan ölçü, en ikna edici veridir.** Teslim listesindeki 369 mm ve
590 mm stroklar uydurulamaz; ölçüye göre imalat yapıldığının kanıtı ve
yuvarlanmış bir katalog aralığından çok daha inandırıcı. Bu yüzden tabloya
olduğu gibi girdiler.

Build sonrası doğrulandı: `LRT` · `ЛРТ` · `Анисимова` · `HCD.1` · `HC2X` ·
IBAN · SWIFT · hesap no · vergi no · tutar — üretilen 318 sayfanın hiçbirinde
geçmiyor.

**Çizimde bir hata bulundu ve DURUYOR.** `HCD.1.63.40.630.000` çiziminde çekme
kuvveti 41,4 kN yazıyor; π(63²−40²)/4 × 20 N/mm² = **37,2 kN** verir (%10 sapma).
Aynı çizimin itme kuvveti (62,3) ve diğer üç çizimin hem itmesi hem çekmesi
hesapla birebir tutuyor — yani hata tek rakamda. `tablo-uret.mjs` içindeki
`CIZIM_DOGRULAMA` bunu her koşumda raporlar. Tablo HESAPLANAN değeri yayımlar:
fizik doğrulanabilir, çizimdeki rakam değil. Çizimin kendisi müşteriye gitmiş
durumda ve kontrol edilmeli.

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
