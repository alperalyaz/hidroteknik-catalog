import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { DILLER, SITE_URL, FIRMA, sayiFormat, dilAlternatifleri, type Dil } from '@/lib/site'
import { METIN, type Metin } from '@/lib/metin'
import { PROFILLER, profilBul, profilSlug, yerMetni, type ProfilKodu } from '@/lib/profil'
import { profilSchema, kirintiSchema, jsonLd } from '@/lib/schema'

const KECE_SLUG = 'hidrolik-kece-nutring'
const OG_LOCALE: Record<Dil, string> = { tr: 'tr_TR', en: 'en_US', ru: 'ru_RU' }

/** Sayı gösterimi: veride ondalık ayracı nokta, TR/RU'da virgül beklenir. */
function capMetni(n: number, lang: Dil): string {
  return sayiFormat(n, lang)
}

export function generateStaticParams() {
  return DILLER.flatMap((lang) => PROFILLER.map((p) => ({ lang, kod: profilSlug(p.kod) })))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; kod: string }>
}): Promise<Metadata> {
  const { lang: langHam, kod } = await params
  const lang = langHam as Dil
  const p = profilBul(kod)
  if (!p) return {}
  const m = METIN[lang]
  const url = `${SITE_URL}/${lang}/profil/${profilSlug(p.kod)}`
  const ozet = m.profilSayfaOzet(p.kod, sayiFormat(p.adet, lang), yerMetni(p.yer, m))
  return {
    title: m.profilSayfaBaslik(p.kod),
    description: ozet,
    alternates: {
      canonical: url,
      languages: dilAlternatifleri(`/profil/${profilSlug(p.kod)}`),
    },
    openGraph: {
      title: m.profilSayfaBaslik(p.kod),
      description: ozet,
      url,
      type: 'website',
      locale: OG_LOCALE[lang],
    },
  }
}

export default async function ProfilSayfasi({
  params,
}: {
  params: Promise<{ lang: string; kod: string }>
}) {
  const { lang: langHam, kod } = await params
  const lang = langHam as Dil
  const m = METIN[lang]
  const p = profilBul(kod)
  if (!p) notFound()

  const url = `${SITE_URL}/${lang}/profil/${profilSlug(p.kod)}`
  const yer = yerMetni(p.yer, m)
  const ozet = m.profilSayfaOzet(p.kod, sayiFormat(p.adet, lang), yer)
  const tamListe = p.olculer.length >= p.adet
  const digerleri: ProfilKodu[] = PROFILLER.filter((x) => x.kod !== p.kod)
  const olculuSatirVar = p.olculer.some((o) => o.olcu)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLd(
          profilSchema(p, url, lang, m.profilSayfaBaslik(p.kod), ozet, m.urunKatalogu)
        )}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLd(
          kirintiSchema([
            { ad: m.kirintiKatalog, url: `${SITE_URL}/${lang}` },
            { ad: m.profilKirinti, url: `${SITE_URL}/${lang}/${KECE_SLUG}` },
            { ad: p.kod, url },
          ])
        )}
      />

      <div className="hero">
        <div className="sarmal">
          <p className="kirinti">
            <Link href={`/${lang}`}>{m.kirintiKatalog}</Link> ›{' '}
            <Link href={`/${lang}/${KECE_SLUG}`}>{m.profilKirinti}</Link> › {p.kod}
          </p>
          <h1>{m.profilSayfaH1(p.kod)}</h1>
          <p className="ozet">{ozet}</p>
          <div className="rozetler">
            <span className="rozet">{m.profilRozetOlcu(sayiFormat(p.adet, lang))}</span>
            <span className="rozet">{m.profilRozetYer(yer)}</span>
            {p.pu && <span className="rozet pirinc">{m.profilRozetPu}</span>}
          </div>
        </div>
      </div>

      <div className="sarmal">
        <section>
          <div className="metin">
            {p.ad[lang] ? <p>{p.ad[lang]}.</p> : <p>{m.profilIslevBilinmiyor}</p>}
            {p.capMin != null && p.capMax != null && (
              <p>{m.profilCapAraligi(capMetni(p.capMin, lang), capMetni(p.capMax, lang))}</p>
            )}
          </div>
        </section>

        <section>
          <h2>{m.profilNasilOkunurBaslik}</h2>
          <div className="metin">
            <p>{m.profilNasilOkunur}</p>
          </div>
        </section>

        <section>
          <h2>{m.profilOlcuTabloBaslik(p.kod)}</h2>
          <div className="tablo-kutu">
            <table>
              <thead>
                <tr>
                  <th>{m.profilTabloKod}</th>
                  <th>{olculuSatirVar ? m.profilTabloOlcuBasligi : m.profilTabloMalzeme}</th>
                  <th>{m.profilTabloMalzeme}</th>
                </tr>
              </thead>
              <tbody>
                {p.olculer.map((o) => (
                  <tr key={o.kod}>
                    <td className="kod">{o.kod}</td>
                    <td className="model">{o.olcu || '—'}</td>
                    <td>{/ PU$/.test(o.kod) ? 'PU' : / FKM$/.test(o.kod) ? 'FKM' : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="tablo-not">
            {olculuSatirVar ? '' : `${m.profilOlcuYok} `}
            {tamListe
              ? m.profilListeNotTam(sayiFormat(p.adet, lang))
              : m.profilListeNotKismi(
                  sayiFormat(p.olculer.length, lang),
                  sayiFormat(p.adet, lang)
                )}
          </p>
        </section>

        <div className="teklif">
          <h2>{m.teklifBaslik(`Kastaş ${p.kod}`)}</h2>
          <p>{m.teklifMetin}</p>
          <div className="teklif-butonlar">
            <a className="btn btn-birincil" href={`tel:${FIRMA.telefonHam}`}>
              {FIRMA.telefon}
            </a>
            <a
              className="btn btn-ikincil"
              href={`mailto:${FIRMA.epostaSatis}?subject=${encodeURIComponent(
                m.teklifKonu(`Kastaş ${p.kod}`)
              )}`}
            >
              {m.teklifEposta}
            </a>
          </div>
        </div>

        <section>
          <h2>{m.profilDigerBaslik}</h2>
          <div className="kartlar">
            {digerleri.map((d) => (
              <Link key={d.kod} href={`/${lang}/profil/${profilSlug(d.kod)}`} className="kart">
                <b>Kastaş {d.kod}</b>
                <span>{d.ad[lang] || yerMetni(d.yer, m)}</span>
                <em>{m.profilRozetOlcu(sayiFormat(d.adet, lang))}</em>
              </Link>
            ))}
          </div>
          <p className="tablo-not">
            <Link href={`/${lang}/${KECE_SLUG}`}>{m.profilKategoriDon}</Link>
          </p>
        </section>
      </div>
    </>
  )
}
