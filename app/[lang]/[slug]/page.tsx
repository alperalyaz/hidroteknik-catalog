import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { DILLER, SITE_URL, FIRMA } from '@/lib/site'
import { KATEGORILER, kategoriBul, kategoriUrunleri, urunAdiDuzelt } from '@/lib/veri'
import { kategoriSchema, sssSchema, kirintiSchema, jsonLd } from '@/lib/schema'

export function generateStaticParams() {
  return DILLER.flatMap((lang) => KATEGORILER.map((k) => ({ lang, slug: k.slug })))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>
}): Promise<Metadata> {
  const { lang, slug } = await params
  const k = kategoriBul(slug)
  if (!k) return {}
  const url = `${SITE_URL}/${lang}/${slug}`
  return {
    title: k.h1,
    description: k.ozet,
    alternates: { canonical: url },
    openGraph: { title: k.h1, description: k.ozet, url, type: 'website', locale: 'tr_TR' },
  }
}

export default async function KategoriSayfasi({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>
}) {
  const { lang, slug } = await params
  const k = kategoriBul(slug)
  if (!k) notFound()

  const { toplam, liste } = kategoriUrunleri(slug)
  const url = `${SITE_URL}/${lang}/${slug}`
  const digerleri = KATEGORILER.filter((x) => x.slug !== slug)

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(kategoriSchema(k, liste, url))} />
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(sssSchema(k.sss))} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLd(
          kirintiSchema([
            { ad: 'Katalog', url: `${SITE_URL}/${lang}` },
            { ad: k.ad, url },
          ])
        )}
      />

      <div className="hero">
        <div className="sarmal">
          <p className="kirinti">
            <Link href={`/${lang}`}>Katalog</Link> › {k.ad}
          </p>
          <h1>{k.h1}</h1>
          <p className="ozet">{k.ozet}</p>
          <div className="rozetler">
            <span className="rozet">{toplam.toLocaleString('tr-TR')} kalem stokta</span>
            <span className="rozet">Türkiye geneli sevkiyat</span>
            <span className="rozet pirinc">Teklif üzerine satış</span>
          </div>
        </div>
      </div>

      <div className="sarmal">
        <section>
          <div className="metin">
            {k.giris.split('\n\n').map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </section>

        <section>
          <h2>Stoktaki {k.ad.toLocaleLowerCase('tr')} çeşitlerinden örnekler</h2>
          <div className="tablo-kutu">
            <table>
              <thead>
                <tr>
                  <th>Ürün</th>
                  <th>Stok kodu</th>
                </tr>
              </thead>
              <tbody>
                {liste.map((u) => (
                  <tr key={u.kod}>
                    <td>{urunAdiDuzelt(u.ad)}</td>
                    <td className="kod">{u.kod}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="tablo-not">
            Yukarıdaki liste {toplam.toLocaleString('tr-TR')} kalemlik {k.ad.toLocaleLowerCase('tr')}{' '}
            stoğumuzdan bir örnektir. Aradığınız ölçü listede yoksa büyük olasılıkla stoğumuzda
            vardır — lütfen sorunuz.
          </p>
        </section>

        <section>
          <h2>Sık sorulan sorular</h2>
          <div className="sss">
            {k.sss.map((x, i) => (
              <details key={i} open={i === 0}>
                <summary>{x.s}</summary>
                <p className="cevap">{x.c}</p>
              </details>
            ))}
          </div>
        </section>

        <div className="teklif">
          <h2>{k.ad} için teklif alın</h2>
          <p>
            Ölçü ve adet bilgisini iletin, satış ekibimiz aynı gün içinde fiyat ve termin bilgisiyle
            dönüş yapsın. Emin olamadığınız ölçüde mevcut parçanızın fotoğrafını göndermeniz yeterli.
          </p>
          <div className="teklif-butonlar">
            <a className="btn btn-birincil" href={`tel:${FIRMA.telefonHam}`}>
              {FIRMA.telefon}
            </a>
            <a
              className="btn btn-ikincil"
              href={`mailto:${FIRMA.epostaSatis}?subject=${encodeURIComponent(k.ad + ' teklif talebi')}`}
            >
              E-posta ile teklif iste
            </a>
          </div>
        </div>

        <section>
          <h2>Diğer ürün grupları</h2>
          <div className="kartlar">
            {digerleri.map((d) => {
              const adet = kategoriUrunleri(d.slug).toplam
              return (
                <Link key={d.slug} href={`/${lang}/${d.slug}`} className="kart">
                  <b>{d.ad}</b>
                  <span>{d.ozet.split('.')[0]}.</span>
                  <em>{adet.toLocaleString('tr-TR')} kalem</em>
                </Link>
              )
            })}
          </div>
        </section>
      </div>
    </>
  )
}
