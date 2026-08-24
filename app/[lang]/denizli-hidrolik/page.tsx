import type { Metadata } from 'next'
import Link from 'next/link'
import { SITE_URL, FIRMA, ANA_SITE } from '@/lib/site'
import { KATEGORILER, kategoriUrunleri } from '@/lib/veri'
import { sssSchema, kirintiSchema, anaSayfaSchema, jsonLd } from '@/lib/schema'

/**
 * YEREL SAYFA — "Denizli'de hidrolikçi" hedefinin doğrudan karşılığı.
 *
 * ⚠ Bu sayfa BİLEREK elle yazıldı, kategori şablonundan üretilmedi.
 * Şehir sayfalarını şablondan çoğaltmak (aynı metin, değişen şehir adı) Google
 * tarafından "doorway page" sayılır ve cezalandırılır. Yeni bir şehir sayfası
 * açılacaksa, o şehre GERÇEKTEN özgü içerik yazılmalıdır; yazılamıyorsa sayfa
 * açılmamalıdır.
 *
 * ⚠ YALNIZ TR: Bu, "Denizli'de hidrolikçi" arayan Türkçe kullanıcı için yerel
 * SEO sayfasıdır — İngilizce/Rusça arayan bir ihracat müşterisinin arama
 * niyeti farklıdır (yerel değil, "Türkiye'den tedarik" arar). DILLER genelinde
 * çoğaltmak yerine bilerek yalnız 'tr' için üretiliyor.
 */

export function generateStaticParams() {
  return [{ lang: 'tr' }]
}

const SSS = [
  {
    s: 'Denizli’de hidrolik hortum presleme aynı gün yapılıyor mu?',
    c: 'Evet. Presleme işlemi Merkezefendi’deki kendi tesisimizde yapılır, dışarıya gönderilmez. Standart ölçü ve rakor kombinasyonlarında genellikle aynı gün teslim edilir. Duran bir makine için hortumu numunesiyle getirmeniz yeterlidir.',
  },
  {
    s: 'Elimdeki parçanın ölçüsünü bilmiyorum, ne yapmalıyım?',
    c: 'Parçayı yanınızda getirin veya fotoğrafını gönderin. Rakorlarda metrik, BSP, BSPT ve ORFS dişler gözle birbirine çok benzer; kumpas ve diş tarağıyla ölçmek gerekir. Satış ekibimiz muadili belirler.',
  },
  {
    s: 'Denizli dışına sevkiyat yapıyor musunuz?',
    c: `Evet. ${FIRMA.hizmetBolgesi.filter((x) => x !== 'Denizli').join(', ')} başta olmak üzere Türkiye geneline kargo ve nakliye ile gönderim yapıyoruz. Aynı gün kargoya verilmesi için siparişin mesai saatleri içinde netleşmesi gerekir.`,
  },
  {
    s: 'Stokta olmayan bir ürün için ne kadar beklerim?',
    c: 'Tedarikçi listelerimizde bulunan kalemlerde termin genellikle birkaç iş günüdür. İthal veya özel imalat gerektiren kalemlerde süre değişir; teklif aşamasında net termin bilgisi verilir.',
  },
  {
    s: 'Hafta sonu açık mısınız?',
    c: `Cumartesi ${FIRMA.saatler.cumartesi} saatleri arasında açığız. Hafta içi çalışma saatlerimiz ${FIRMA.saatler.haftaIci}. Pazar günü kapalıyız.`,
  },
]

export const metadata: Metadata = {
  title: 'Denizli Hidrolik Malzeme ve Yedek Parça',
  description:
    'Denizli’de hidrolik hortum, rakor, silindir, pompa ve sızdırmazlık malzemeleri. 1984’ten beri Merkezefendi’de; hortum presleme yerinde, aynı gün.',
  alternates: { canonical: `${SITE_URL}/tr/denizli-hidrolik` },
}

export default async function DenizliHidrolik({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  const url = `${SITE_URL}/${lang}/denizli-hidrolik`
  const toplamKalem = KATEGORILER.reduce((a, k) => a + kategoriUrunleri(k.slug).toplam, 0)

  return (
    <>
      {/* Sayfa düzeyi düğüm: bu sayfanın NE olduğunu ve verisinin ne zaman
          değiştiğini söyler. Elle yazılmış tek sayfa olduğu için kategori
          şablonundan gelmiyordu; eksikliği dateModified denetiminde çıktı. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLd(
          anaSayfaSchema(
            url,
            'tr',
            'Denizli Hidrolik Malzeme ve Yedek Parça',
            metadata.description as string,
            'Ürün Kataloğu',
            KATEGORILER.map((k) => ({
              ad: k.h1,
              url: `${SITE_URL}/${lang}/${k.slug}`,
              ozet: k.ozet,
            }))
          )
        )}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(sssSchema(SSS, 'tr'))} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLd(
          kirintiSchema([
            { ad: 'Katalog', url: `${SITE_URL}/${lang}` },
            { ad: 'Denizli Hidrolik', url },
          ])
        )}
      />

      <div className="hero">
        <div className="sarmal">
          <p className="kirinti">
            <Link href={`/${lang}`}>Katalog</Link> › Denizli Hidrolik
          </p>
          <h1>Denizli’de hidrolik malzeme ve yedek parça</h1>
          <p className="ozet">
            {FIRMA.kurulus}’ten beri Merkezefendi’deyiz. Hidrolik hortum, rakor, silindir, pompa ve
            sızdırmazlık elemanlarında {toplamKalem.toLocaleString('tr-TR')} kalem stok; hortum
            presleme kendi tesisimizde.
          </p>
          <div className="rozetler">
            <span className="rozet">Merkezefendi / Denizli</span>
            <span className="rozet">Hafta içi {FIRMA.saatler.haftaIci}</span>
            <span className="rozet pirinc">Presleme aynı gün</span>
          </div>
        </div>
      </div>

      <div className="sarmal">
        <section>
          <h2>Duran makine bekleyemez</h2>
          <div className="metin">
            <p>
              Hidrolik malzemede aciliyet, çoğu sektörden farklı çalışır. Patlayan bir hortum ya da
              sızdıran bir rakor, çoğu zaman tek başına küçük bir parçadır ama arkasında duran bir
              üretim hattı vardır. Bu yüzden Denizli’de en çok sorulan soru fiyat değil, “bugün
              hazır olur mu?” sorusudur.
            </p>
            <p>
              Presleme işlemini dışarıya vermeyip kendi tesisimizde yaptığımız için standart ölçü ve
              rakor kombinasyonlarında genellikle aynı gün teslim edebiliyoruz. Numunesini getirin,
              ölçüsünü bilmenize gerek yok.
            </p>
          </div>
        </section>

        <section>
          <h2>Denizli sanayisinde nerelerde kullanılıyor</h2>
          <div className="metin">
            <p>
              Denizli’nin üretim profili hidrolik ihtiyacını da belirliyor. Tekstil ve konfeksiyon
              tesislerinde pres ve kalender hatları, kablo ve tel çekme tesislerinde makara ve
              gerdirme sistemleri, mermer–travertin işletmelerinde katrak ve kesim makineleri, gıda
              tesislerinde dolum ve paketleme hatları hidrolik ve pnömatik devrelere dayanıyor.
            </p>
            <p>
              Bunların yanında tarım makineleri, iş makinesi bakımı ve OSB’deki metal işleme
              atölyeleri düzenli olarak hortum, rakor ve silindir yeniliyor. Katalogdaki ürün
              grupları bu ihtiyaçlara göre şekillendi.
            </p>
          </div>
        </section>

        <section>
          <h2>Ürün grupları</h2>
          <div className="kartlar">
            {KATEGORILER.map((k) => (
              <Link key={k.slug} href={`/${lang}/${k.slug}`} className="kart">
                <b>{k.ad}</b>
                <span>{k.ozet.split('.')[0]}.</span>
                <em>{kategoriUrunleri(k.slug).toplam.toLocaleString('tr-TR')} kalem</em>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <h2>Nerede ve ne zaman</h2>
          <div className="tablo-kutu">
            <table>
              <tbody>
                <tr>
                  <th style={{ width: '34%' }}>Adres</th>
                  <td>
                    {FIRMA.adres.sokak}
                    <br />
                    {FIRMA.adres.postaKodu} {FIRMA.adres.ilce} / {FIRMA.adres.il}
                  </td>
                </tr>
                <tr>
                  <th>Telefon</th>
                  <td>
                    <a href={`tel:${FIRMA.telefonHam}`}>{FIRMA.telefon}</a>
                  </td>
                </tr>
                <tr>
                  <th>E-posta</th>
                  <td>
                    <a href={`mailto:${FIRMA.epostaSatis}`}>{FIRMA.epostaSatis}</a>
                  </td>
                </tr>
                <tr>
                  <th>Çalışma saatleri</th>
                  <td>
                    Hafta içi {FIRMA.saatler.haftaIci} · Cumartesi {FIRMA.saatler.cumartesi}
                  </td>
                </tr>
                <tr>
                  <th>Hizmet bölgesi</th>
                  <td>{FIRMA.hizmetBolgesi.join(', ')} ve Türkiye geneli sevkiyat</td>
                </tr>
                <tr>
                  <th>Konum</th>
                  <td>
                    <a
                      href={`https://maps.google.com/?q=${FIRMA.konum.lat},${FIRMA.konum.lng}`}
                      rel="noopener"
                    >
                      Haritada aç
                    </a>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2>Sık sorulan sorular</h2>
          <div className="sss">
            {SSS.map((x, i) => (
              <details key={i} open={i === 0}>
                <summary>{x.s}</summary>
                <p className="cevap">{x.c}</p>
              </details>
            ))}
          </div>
        </section>

        <div className="teklif">
          <h2>Bugün lazım olan bir parça mı var?</h2>
          <p>
            Telefonla arayın ya da parçanın fotoğrafını gönderin. Ölçüsünü bilmeseniz de olur; doğru
            muadili biz belirleyelim.
          </p>
          <div className="teklif-butonlar">
            <a className="btn btn-birincil" href={`tel:${FIRMA.telefonHam}`}>
              {FIRMA.telefon}
            </a>
            <a className="btn btn-ikincil" href={`mailto:${FIRMA.epostaSatis}`}>
              {FIRMA.epostaSatis}
            </a>
          </div>
        </div>

        <section>
          <div className="metin">
            <p style={{ fontSize: '0.92rem', color: 'var(--murekkep-3)' }}>
              Kurumsal bilgiler, referanslar ve üç boyutlu çizimler için{' '}
              <a href={ANA_SITE}>hidroteknik.com.tr</a> · Hidrolik hesaplamalar için{' '}
              <a href="https://hesapla.hidroteknik.com.tr">hesapla.hidroteknik.com.tr</a>
            </p>
          </div>
        </section>
      </div>
    </>
  )
}
