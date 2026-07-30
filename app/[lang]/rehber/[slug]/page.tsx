import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { DILLER, SITE_URL, FIRMA, sayiFormat, type Dil } from '@/lib/site'
import { METIN } from '@/lib/metin'
import { REHBERLER, rehberBul } from '@/lib/rehber'
import { kategoriBul, kategoriUrunleri } from '@/lib/veri'
import { rehberSchema, sssSchema, kirintiSchema, jsonLd } from '@/lib/schema'

const OG_LOCALE: Record<Dil, string> = { tr: 'tr_TR', en: 'en_US', ru: 'ru_RU' }

export function generateStaticParams() {
  return DILLER.flatMap((lang) => REHBERLER.map((r) => ({ lang, slug: r.slug })))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>
}): Promise<Metadata> {
  const { lang: langHam, slug } = await params
  const lang = langHam as Dil
  const r = rehberBul(slug)
  if (!r) return {}
  const i = r[lang]
  const url = `${SITE_URL}/${lang}/rehber/${r.slug}`
  return {
    title: i.h1,
    description: i.ozet,
    alternates: {
      canonical: url,
      languages: Object.fromEntries(DILLER.map((d) => [d, `${SITE_URL}/${d}/rehber/${r.slug}`])),
    },
    openGraph: { title: i.h1, description: i.ozet, url, type: 'article', locale: OG_LOCALE[lang] },
  }
}

export default async function RehberSayfasi({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>
}) {
  const { lang: langHam, slug } = await params
  const lang = langHam as Dil
  const m = METIN[lang]
  const r = rehberBul(slug)
  if (!r) notFound()

  const i = r[lang]
  const url = `${SITE_URL}/${lang}/rehber/${r.slug}`
  const gruplar = r.kategoriler
    .map((s) => kategoriBul(s, lang))
    .filter((k): k is NonNullable<typeof k> => Boolean(k))
  const digerleri = REHBERLER.filter((x) => x.slug !== r.slug)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLd(rehberSchema(i, url, lang, m.urunKatalogu))}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(sssSchema(i.sss, lang))} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLd(
          kirintiSchema([
            { ad: m.kirintiKatalog, url: `${SITE_URL}/${lang}` },
            { ad: m.rehberKirinti, url: `${SITE_URL}/${lang}` },
            { ad: i.ad, url },
          ])
        )}
      />

      <div className="hero">
        <div className="sarmal">
          <p className="kirinti">
            <Link href={`/${lang}`}>{m.kirintiKatalog}</Link> › {m.rehberKirinti} › {i.ad}
          </p>
          <h1>{i.h1}</h1>
          <p className="ozet">{i.ozet}</p>
          <div className="rozetler">
            <span className="rozet">{m.rehberRozet}</span>
            <span className="rozet pirinc">{m.rozetTeklifUzerine}</span>
          </div>
        </div>
      </div>

      <div className="sarmal">
        <section>
          <div className="metin">
            {i.giris.split('\n\n').map((p, n) => (
              <p key={n}>{p}</p>
            ))}
          </div>
        </section>

        <section>
          <h2>{m.rehberSssBaslik}</h2>
          <div className="sss">
            {i.sss.map((x, n) => (
              <details key={n} open={n === 0}>
                <summary>{x.s}</summary>
                <p className="cevap">{x.c}</p>
              </details>
            ))}
          </div>
        </section>

        <section>
          <h2>{m.rehberIlgiliBaslik}</h2>
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

        <div className="teklif">
          <h2>{m.teklifBaslik(i.ad)}</h2>
          <p>{m.teklifMetin}</p>
          <div className="teklif-butonlar">
            <a className="btn btn-birincil" href={`tel:${FIRMA.telefonHam}`}>
              {FIRMA.telefon}
            </a>
            <a
              className="btn btn-ikincil"
              href={`mailto:${FIRMA.epostaSatis}?subject=${encodeURIComponent(m.teklifKonu(i.ad))}`}
            >
              {m.teklifEposta}
            </a>
          </div>
        </div>

        <section>
          <h2>{m.rehberDigerBaslik}</h2>
          <div className="kartlar">
            {digerleri.map((d) => (
              <Link key={d.slug} href={`/${lang}/rehber/${d.slug}`} className="kart">
                <b>{d[lang].ad}</b>
                <span>{d[lang].ozet}</span>
                <em>{m.rehberRozet}</em>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </>
  )
}
