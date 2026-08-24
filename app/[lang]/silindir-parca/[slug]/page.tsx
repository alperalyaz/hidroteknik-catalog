import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { DILLER, SITE_URL, FIRMA, sayiFormat, dilAlternatifleri, type Dil } from '@/lib/site'
import { METIN } from '@/lib/metin'
import { SILINDIR_PARCALARI, parcaBul, parcaAdi } from '@/lib/silindir-parca'
import { parcaSchema, kirintiSchema, jsonLd } from '@/lib/schema'

const OG_LOCALE: Record<Dil, string> = { tr: 'tr_TR', en: 'en_US', ru: 'ru_RU' }

export function generateStaticParams() {
  return DILLER.flatMap((lang) => SILINDIR_PARCALARI.map((p) => ({ lang, slug: p.slug })))
}

/** Sayfa başlığı/özeti üç yerde de aynı olsun diye tek yerden kurulur. */
function icerik(slug: string, lang: Dil) {
  const p = parcaBul(slug)
  if (!p) return null
  const m = METIN[lang]
  const ad = parcaAdi(p, lang)
  return {
    p,
    m,
    ad,
    h1: m.parcaH1(ad),
    ozet: m.parcaOzet(ad, sayiFormat(p.adet, lang), String(p.capMin), String(p.capMax)),
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>
}): Promise<Metadata> {
  const { lang: langHam, slug } = await params
  const lang = langHam as Dil
  const i = icerik(slug, lang)
  if (!i) return {}
  const url = `${SITE_URL}/${lang}/silindir-parca/${slug}`
  return {
    title: i.h1,
    description: i.ozet,
    alternates: {
      canonical: url,
      languages: dilAlternatifleri(`/silindir-parca/${slug}`),
    },
    openGraph: { title: i.h1, description: i.ozet, url, type: 'website', locale: OG_LOCALE[lang] },
  }
}

export default async function ParcaSayfasi({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>
}) {
  const { lang: langHam, slug } = await params
  const lang = langHam as Dil
  const i = icerik(slug, lang)
  if (!i) notFound()
  const { p, m, ad } = i
  const url = `${SITE_URL}/${lang}/silindir-parca/${slug}`
  const digerleri = SILINDIR_PARCALARI.filter((x) => x.slug !== slug)

  // Ölçüleri gövde çapına göre grupla: "100x50, 100x55, 100x60" yerine tek satırda
  // Ø100 → 50, 55, 60. 183 ölçülük listede fark okunabilirlikte kapanıyor.
  const gruplar = new Map<number, number[]>()
  for (const o of p.olculer) {
    const [a, b] = o.split('x').map(Number)
    if (!gruplar.has(a)) gruplar.set(a, [])
    gruplar.get(a)!.push(b)
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLd(
          parcaSchema(
            { ad, h1: i.h1, ozet: i.ozet, eksen: p.eksen, olculer: p.olculer },
            url,
            lang,
            m.urunKatalogu
          )
        )}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLd(
          kirintiSchema([
            { ad: m.kirintiKatalog, url: `${SITE_URL}/${lang}` },
            { ad: m.parcaKirinti, url: `${SITE_URL}/${lang}/hidrolik-silindir` },
            { ad: i.h1, url },
          ])
        )}
      />

      <div className="hero">
        <div className="sarmal">
          <p className="kirinti">
            <Link href={`/${lang}`}>{m.kirintiKatalog}</Link> ›{' '}
            <Link href={`/${lang}/hidrolik-silindir`}>{m.parcaKirinti}</Link> › {ad}
          </p>
          <h1>{i.h1}</h1>
          <p className="ozet">{i.ozet}</p>
          <div className="rozetler">
            <span className="rozet">{m.parcaRozetOlcu(sayiFormat(p.adet, lang))}</span>
            <span className="rozet">{m.parcaRozetCap(String(p.capMin), String(p.capMax))}</span>
            <span className="rozet pirinc">{m.rozetTeklifUzerine}</span>
          </div>
        </div>
      </div>

      <div className="sarmal">
        <section>
          <div className="metin">
            <p>{p.aciklama[lang]}</p>
            <p>{m.parcaEksenNotu(p.eksen)}</p>
          </div>
        </section>

        <section>
          <h2>{m.parcaOlcuBaslik}</h2>
          <div className="tablo-kutu">
            <table>
              <thead>
                <tr>
                  <th>{m.parcaTabloCap}</th>
                  <th>{p.eksen === 'capMil' ? m.parcaTabloMil : m.parcaTabloDis}</th>
                </tr>
              </thead>
              <tbody>
                {[...gruplar].map(([cap, ikinciler]) => (
                  <tr key={cap}>
                    <td>
                      <b className="profil-kod">Ø{cap}</b>
                    </td>
                    <td className="model">{ikinciler.join(', ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="tablo-not">{m.parcaKodNotu}</p>
        </section>

        <section>
          <h2>{m.parcaContaBaslik}</h2>
          <div className="metin">
            <p>{m.parcaContaMetin}</p>
          </div>
        </section>

        <div className="teklif">
          <h2>{m.teklifBaslik(i.h1)}</h2>
          <p>{m.teklifMetin}</p>
          <div className="teklif-butonlar">
            <a className="btn btn-birincil" href={`tel:${FIRMA.telefonHam}`}>
              {FIRMA.telefon}
            </a>
            <a
              className="btn btn-ikincil"
              href={`mailto:${FIRMA.epostaSatis}?subject=${encodeURIComponent(m.teklifKonu(i.h1))}`}
            >
              {m.teklifEposta}
            </a>
          </div>
        </div>

        <section>
          <h2>{m.parcaDigerBaslik}</h2>
          <div className="kartlar">
            {digerleri.map((d) => (
              <Link
                key={d.slug}
                href={`/${lang}/silindir-parca/${d.slug}`}
                className="kart"
              >
                <b>{parcaAdi(d, lang)}</b>
                <span>{d.aciklama[lang].split('.')[0]}.</span>
                <em>{m.parcaRozetOlcu(sayiFormat(d.adet, lang))}</em>
              </Link>
            ))}
            <Link href={`/${lang}/hidrolik-silindir`} className="kart">
              <b>{m.parcaSilindirLink}</b>
              <span>{m.parcaListeOzet}</span>
            </Link>
          </div>
        </section>
      </div>
    </>
  )
}
