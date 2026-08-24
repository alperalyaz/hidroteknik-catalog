import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { DILLER, SITE_URL, FIRMA, sayiFormat, dilAlternatifleri, type Dil } from '@/lib/site'
import { METIN } from '@/lib/metin'
import { MARKALAR, markaBul } from '@/lib/marka'
import { kategoriBul, kategoriUrunleri } from '@/lib/veri'
import { PROFILLER, profilSlug } from '@/lib/profil'
import { satirUreticiKodu } from '@/lib/uretici-kod'
import { markaSchema, kirintiSchema, jsonLd } from '@/lib/schema'

const OG_LOCALE: Record<Dil, string> = { tr: 'tr_TR', en: 'en_US', ru: 'ru_RU' }

export function generateStaticParams() {
  return DILLER.flatMap((lang) => MARKALAR.map((m) => ({ lang, slug: m.slug })))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>
}): Promise<Metadata> {
  const { lang: langHam, slug } = await params
  const lang = langHam as Dil
  const marka = markaBul(slug)
  if (!marka) return {}
  const m = METIN[lang]
  const url = `${SITE_URL}/${lang}/marka/${marka.slug}`
  return {
    title: m.markaSayfaBaslik(marka.ad),
    description: marka.ozet[lang],
    alternates: {
      canonical: url,
      languages: dilAlternatifleri(`/marka/${marka.slug}`),
    },
    openGraph: {
      title: m.markaSayfaBaslik(marka.ad),
      description: marka.ozet[lang],
      url,
      type: 'website',
      locale: OG_LOCALE[lang],
    },
  }
}

export default async function MarkaSayfasi({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>
}) {
  const { lang: langHam, slug } = await params
  const lang = langHam as Dil
  const m = METIN[lang]
  const marka = markaBul(slug)
  if (!marka) notFound()

  const url = `${SITE_URL}/${lang}/marka/${marka.slug}`
  // Kategori adları dile göre çözülür; slug'ı bulunamayan kategori sessizce atlanır.
  const gruplar = marka.kategoriler
    .map((s) => kategoriBul(s, lang))
    .filter((k): k is NonNullable<typeof k> => Boolean(k))
  const digerleri = MARKALAR.filter((x) => x.slug !== marka.slug)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLd(
          markaSchema(marka, url, lang, m.markaSayfaBaslik(marka.ad), m.urunKatalogu)
        )}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLd(
          kirintiSchema([
            { ad: m.kirintiKatalog, url: `${SITE_URL}/${lang}` },
            { ad: m.markaKirinti, url: `${SITE_URL}/${lang}` },
            { ad: marka.ad, url },
          ])
        )}
      />

      <div className="hero">
        <div className="sarmal">
          <p className="kirinti">
            <Link href={`/${lang}`}>{m.kirintiKatalog}</Link> › {m.markaKirinti} › {marka.ad}
          </p>
          <h1>{marka.ad}</h1>
          <p className="ozet">{marka.ozet[lang]}</p>
          <div className="rozetler">
            <span className="rozet">{m.markaRozetKalem(sayiFormat(marka.adet, lang))}</span>
            <span className="rozet">
              {m.markaRozetGrup(gruplar.length, sayiFormat(gruplar.length, lang))}
            </span>
            <span className="rozet pirinc">{m.rozetTeklifUzerine}</span>
          </div>
        </div>
      </div>

      <div className="sarmal">
        <section>
          <div className="metin">
            {marka.giris[lang].split('\n\n').map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </section>

        <section>
          <h2>{m.markaGruplarBaslik(marka.ad)}</h2>
          <div className="kartlar">
            {gruplar.map((k) => (
              <Link key={k.slug} href={`/${lang}/${k.slug}`} className="kart">
                <b>{k.ad}</b>
                <span>{k.ozet.split('.')[0]}.</span>
                <em>
                  {sayiFormat(kategoriUrunleri(k.slug).toplam, lang)} {m.kalem}
                </em>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <h2>{m.markaOrneklerBaslik(marka.ad)}</h2>
          <div className="tablo-kutu">
            <table>
              <thead>
                <tr>
                  <th>{m.tabloUrun}</th>
                  <th>{m.tabloUreticiKodu}</th>
                </tr>
              </thead>
              <tbody>
                {/* key olarak stok kodu kullanılmaz — bkz. kategori şablonu. */}
                {marka.ornekler.map((o, i) => (
                  <tr key={i}>
                    <td>{o.ad}</td>
                    <td className="kod">{satirUreticiKodu(o.kod) || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {marka.profilLink && (
          <section>
            <h2>{m.profilBaslik}</h2>
            <div className="etiketler">
              {PROFILLER.map((p) => (
                <Link
                  key={p.kod}
                  href={`/${lang}/profil/${profilSlug(p.kod)}`}
                  className="etiket etiket-marka"
                >
                  {p.kod}
                </Link>
              ))}
            </div>
            <p className="tablo-not">{m.markaProfilNotu}</p>
          </section>
        )}

        <div className="teklif">
          <h2>{m.teklifBaslik(marka.ad)}</h2>
          <p>{m.teklifMetin}</p>
          <div className="teklif-butonlar">
            <a className="btn btn-birincil" href={`tel:${FIRMA.telefonHam}`}>
              {FIRMA.telefon}
            </a>
            <a
              className="btn btn-ikincil"
              href={`mailto:${FIRMA.epostaSatis}?subject=${encodeURIComponent(
                m.teklifKonu(marka.ad)
              )}`}
            >
              {m.teklifEposta}
            </a>
          </div>
        </div>

        <section>
          <h2>{m.markaDigerBaslik}</h2>
          <div className="kartlar">
            {digerleri.map((d) => (
              <Link key={d.slug} href={`/${lang}/marka/${d.slug}`} className="kart">
                <b>{d.ad}</b>
                <span>{d.ozet[lang].split(':')[0]}.</span>
                <em>{m.markaRozetKalem(sayiFormat(d.adet, lang))}</em>
              </Link>
            ))}
          </div>
          <p className="tablo-not">
            <Link href={`/${lang}`}>{m.markaTumKatalog}</Link>
          </p>
        </section>
      </div>
    </>
  )
}
