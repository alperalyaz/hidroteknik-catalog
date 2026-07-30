import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { DILLER, SITE_URL, FIRMA, sayiFormat, type Dil } from '@/lib/site'
import { METIN } from '@/lib/metin'
import { KATEGORILER, kategoriBul, kategorilerIcin, kategoriUrunleri, urunAdiDuzelt } from '@/lib/veri'
import { profilBul, profilSlug } from '@/lib/profil'
import { kategoriSchema, sssSchema, kirintiSchema, jsonLd } from '@/lib/schema'

const OG_LOCALE: Record<Dil, string> = { tr: 'tr_TR', en: 'en_US', ru: 'ru_RU' }

export function generateStaticParams() {
  return DILLER.flatMap((lang) => KATEGORILER.map((k) => ({ lang, slug: k.slug })))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>
}): Promise<Metadata> {
  const { lang: langHam, slug } = await params
  const lang = langHam as Dil
  const k = kategoriBul(slug, lang)
  if (!k) return {}
  const url = `${SITE_URL}/${lang}/${slug}`
  return {
    title: k.h1,
    description: k.ozet,
    alternates: {
      canonical: url,
      languages: Object.fromEntries(DILLER.map((d) => [d, `${SITE_URL}/${d}/${slug}`])),
    },
    openGraph: { title: k.h1, description: k.ozet, url, type: 'website', locale: OG_LOCALE[lang] },
  }
}

export default async function KategoriSayfasi({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>
}) {
  const { lang: langHam, slug } = await params
  const lang = langHam as Dil
  const m = METIN[lang]
  const k = kategoriBul(slug, lang)
  if (!k) notFound()

  const { toplam, liste } = kategoriUrunleri(slug)
  const url = `${SITE_URL}/${lang}/${slug}`
  const digerleri = kategorilerIcin(lang).filter((x) => x.slug !== slug)
  // Türkçe "İ" harfi tuzağı yüzünden küçük harfe çevirirken locale açıkça 'tr' verilmeli;
  // diğer dillerde varsayılan yeterli.
  const adKucuk = k.ad.toLocaleLowerCase(lang === 'tr' ? 'tr' : undefined)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLd(kategoriSchema(k, liste, url, lang, m.urunKatalogu))}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(sssSchema(k.sss, lang))} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLd(
          kirintiSchema([
            { ad: m.kirintiKatalog, url: `${SITE_URL}/${lang}` },
            { ad: k.ad, url },
          ])
        )}
      />

      <div className="hero">
        <div className="sarmal">
          <p className="kirinti">
            <Link href={`/${lang}`}>{m.kirintiKatalog}</Link> › {k.ad}
          </p>
          <h1>{k.h1}</h1>
          <p className="ozet">{k.ozet}</p>
          <div className="rozetler">
            <span className="rozet">{m.rozetStokta(sayiFormat(toplam, lang))}</span>
            <span className="rozet">{m.rozetSevkiyat}</span>
            <span className="rozet pirinc">{m.rozetTeklifUzerine}</span>
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

        {Boolean(k.markalar?.length || k.standartlar?.length) && (
          <section>
            <h2>{m.markalarStandartlarBaslik}</h2>
            <div className="etiketler">
              {k.markalar?.map((marka) => (
                <span key={marka} className="etiket etiket-marka">
                  {marka}
                </span>
              ))}
              {k.standartlar?.map((s) => (
                <span key={s} className="etiket">
                  {s}
                </span>
              ))}
            </div>
            <p className="tablo-not">{m.markaAramaNotu(adKucuk)}</p>
          </section>
        )}

        {Boolean(k.profiller?.length) && (
          <section>
            <h2>{m.profilBaslik}</h2>
            <div className="tablo-kutu">
              <table>
                <thead>
                  <tr>
                    <th>{m.profilTabloProfil}</th>
                    <th>{m.profilTabloYer}</th>
                    <th>{m.profilTabloOlcu}</th>
                    <th>{m.profilTabloOrnek}</th>
                  </tr>
                </thead>
                <tbody>
                  {k.profiller!.map((p) => {
                    // Kendi sayfası olan profiller link olur; olmayanlar düz metin
                    // kalır (KBT/KPB/KSB gibi birleşik satırlarda sayfa yoktur).
                    const sayfa = profilBul(p.kod)
                    return (
                    <tr key={p.kod}>
                      <td>
                        {sayfa ? (
                          <Link href={`/${lang}/profil/${profilSlug(p.kod)}`} className="profil-kod">
                            {p.kod}
                          </Link>
                        ) : (
                          <b className="profil-kod">{p.kod}</b>
                        )}
                        {p.ad ? <span className="profil-ad">{p.ad}</span> : null}
                      </td>
                      <td>{p.yer}</td>
                      <td>
                        {sayiFormat(p.adet, lang)} {m.profilOlcuBirimi}
                      </td>
                      <td className="model">{p.ornek}</td>
                    </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {k.profilNot ? <p className="tablo-not">{k.profilNot}</p> : null}
          </section>
        )}

        <section>
          <h2>{m.ornekBaslik(k.ad)}</h2>
          <div className="tablo-kutu">
            <table>
              <thead>
                <tr>
                  <th>{m.tabloUrun}</th>
                  <th>{m.tabloMarka}</th>
                  <th>{m.tabloModel}</th>
                  <th>{m.tabloStokKodu}</th>
                </tr>
              </thead>
              <tbody>
                {liste.map((u) => (
                  <tr key={u.kod}>
                    <td>{urunAdiDuzelt(u.ad)}</td>
                    <td>{u.marka || '—'}</td>
                    <td className="model">{u.model || '—'}</td>
                    <td className="kod">{u.kod}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="tablo-not">{m.ornekAltNot(sayiFormat(toplam, lang), adKucuk)}</p>
        </section>

        <section>
          <h2>{m.sssBaslik}</h2>
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
          <h2>{m.teklifBaslik(k.ad)}</h2>
          <p>{m.teklifMetin}</p>
          <div className="teklif-butonlar">
            <a className="btn btn-birincil" href={`tel:${FIRMA.telefonHam}`}>
              {FIRMA.telefon}
            </a>
            <a
              className="btn btn-ikincil"
              href={`mailto:${FIRMA.epostaSatis}?subject=${encodeURIComponent(m.teklifKonu(k.ad))}`}
            >
              {m.teklifEposta}
            </a>
          </div>
        </div>

        <section>
          <h2>{m.digerGruplarBaslik}</h2>
          <div className="kartlar">
            {digerleri.map((d) => {
              const adet = kategoriUrunleri(d.slug).toplam
              return (
                <Link key={d.slug} href={`/${lang}/${d.slug}`} className="kart">
                  <b>{d.ad}</b>
                  <span>{d.ozet.split('.')[0]}.</span>
                  <em>
                    {sayiFormat(adet, lang)} {m.kalem}
                  </em>
                </Link>
              )
            })}
          </div>
        </section>
      </div>
    </>
  )
}
