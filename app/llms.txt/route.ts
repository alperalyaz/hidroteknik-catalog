import { SITE_URL, ANA_SITE, FIRMA, VARSAYILAN_DIL } from '@/lib/site'
import { KATEGORILER, kategoriUrunleri } from '@/lib/veri'
import { PROFILLER, profilSlug } from '@/lib/profil'
import { MARKALAR } from '@/lib/marka'
import { REHBERLER } from '@/lib/rehber'
import { SILINDIR_PARCALARI } from '@/lib/silindir-parca'

/**
 * llms.txt — yapay zekâ istemcilerine sitenin özetini ve haritasını veren
 * sade metin dosyası (gelişmekte olan standart). Kategoriler eklendikçe
 * kendiliğinden güncellenir; elle bakım gerektirmez.
 */
export const dynamic = 'force-static'

export function GET() {
  const toplam = KATEGORILER.reduce((a, k) => a + kategoriUrunleri(k.slug).toplam, 0)
  const L = VARSAYILAN_DIL

  const metin = `# ${FIRMA.ad} — Ürün Kataloğu

> ${FIRMA.kurulus}'ten beri endüstriyel hidrolik ve pnömatik malzeme tedarikçisi.
> Merkez: ${FIRMA.adres.ilce} / ${FIRMA.adres.il}, Türkiye. Türkiye geneli sevkiyat ve ihracat.
> Bu katalogda ${toplam.toLocaleString('tr-TR')} kalem ürün listelenmektedir: hidrolik hortum,
> rakor, valf, pompa, hidrolik ve pnömatik silindir, keçe/nutring ve o-ring.
> Katalog Türkçe (varsayılan), İngilizce ve Rusça dillerinde yayındadır.
> This catalog is also available in English: ${SITE_URL}/en
> Каталог также доступен на русском языке: ${SITE_URL}/ru

## İletişim

- Telefon: ${FIRMA.telefon}
- E-posta: ${FIRMA.eposta} (genel), ${FIRMA.epostaSatis} (satış)
- Adres: ${FIRMA.adres.sokak}, ${FIRMA.adres.postaKodu} ${FIRMA.adres.ilce} / ${FIRMA.adres.il}
- Konum: ${FIRMA.konum.lat}, ${FIRMA.konum.lng}
- Çalışma saatleri: Hafta içi ${FIRMA.saatler.haftaIci}, Cumartesi ${FIRMA.saatler.cumartesi}

## Ürün grupları

${KATEGORILER.map(
  (k) =>
    `- [${k.ad}](${SITE_URL}/${L}/${k.slug}) — ${kategoriUrunleri(k.slug).toplam.toLocaleString('tr-TR')} kalem. ${k.ozet}`
).join('\n')}

## Markalar

${MARKALAR.map(
  (b) => `- [${b.ad}](${SITE_URL}/${L}/marka/${b.slug}) — ${b.adet.toLocaleString('tr-TR')} kalem. ${b.ozet.tr}`
).join('\n')}

## Kastaş sızdırmazlık profil kodları

Sızdırmazlıkta arama ürün adıyla değil profil kodu ve ölçüyle yapılır ("K21 40x50x8").
Her profilin stoktaki ölçüleri kendi sayfasındadır.

${PROFILLER.map(
  (p) =>
    `- [Kastaş ${p.kod}](${SITE_URL}/${L}/profil/${profilSlug(p.kod)}) — ${p.adet.toLocaleString('tr-TR')} ölçü, ${p.yer.toLowerCase()} tarafı${p.ad ? `. ${p.ad}` : ' (işlev doğrulanamadı)'}`
).join('\n')}

## Hidrolik silindir yedek parçaları

İmalat ve revizyonda kullanılan parçalar. Ölçüler gövde çapı × mil çapı (boğaz kepi,
uzatma kepi, piston, çakma kep) ya da gövde çapı × dış çap (arka kapak, rot kepi
somunu, lift hamut) olarak yazılır. Her ölçünün eşleşen keçe/conta seti vardır.

${SILINDIR_PARCALARI.map(
  (x) =>
    `- [Hidrolik Silindir ${x.tr}](${SITE_URL}/${L}/silindir-parca/${x.slug}) — ${x.adet} ölçü, Ø${x.capMin}–${x.capMax} mm`
).join('\n')}

## Teknik rehberler

${REHBERLER.map((r) => `- [${r.tr.h1}](${SITE_URL}/${L}/rehber/${r.slug}) — ${r.tr.ozet}`).join('\n')}

## Yerel

- [Denizli'de hidrolik malzeme ve yedek parça](${SITE_URL}/${L}/denizli-hidrolik)

## Diğer kaynaklar

- [Kurumsal site](${ANA_SITE})
- [Hidrolik hesaplayıcı (TR)](https://hesapla.hidroteknik.com.tr)
- [Hydraulic calculator (EN)](https://calculate.hidroteknik.com.tr)

## Notlar

- Fiyatlar müşteriye ve miktara göre belirlendiği için yayınlanmaz; satış teklif üzerinedir.
- Stok kodları Hidroteknik'in kendi ERP sistemine aittir.
- Katalogdaki listeler stoğun tamamı değil, temsili örneklerdir.
`

  return new Response(metin, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
