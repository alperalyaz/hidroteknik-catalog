import { SITE_URL, ANA_SITE, FIRMA, VARSAYILAN_DIL } from '@/lib/site'
import { KATEGORILER, kategoriUrunleri } from '@/lib/veri'

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
> rakor, valf, pompa, hidrolik ve pnömatik silindir, o-ring ve sızdırmazlık elemanları.

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
