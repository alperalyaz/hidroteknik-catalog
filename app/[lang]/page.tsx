import type { Metadata } from 'next'
import Link from 'next/link'
import { DILLER, SITE_URL, FIRMA, ANA_SITE, HESAPLA_URL, sayiFormat, type Dil } from '@/lib/site'
import { METIN } from '@/lib/metin'
import { kategorilerIcin, kategoriUrunleri } from '@/lib/veri'
import { REHBERLER } from '@/lib/rehber'
import { MARKALAR } from '@/lib/marka'

const BASLIK: Record<Dil, string> = {
  tr: 'Hidrolik ve Pnömatik Ürün Kataloğu',
  en: 'Hydraulic & Pneumatic Product Catalog',
  ru: 'Каталог гидравлической и пневматической продукции',
}
const ACIKLAMA: Record<Dil, string> = {
  tr: '1984’ten beri endüstriyel hidrolik ve pnömatik malzeme tedarikçisi Hidroteknik’in ürün kataloğu: hidrolik hortum, rakor, silindir, pompa, valf, keçe/nutring ve o-ring. Türkiye geneli sevkiyat.',
  en: "Hidroteknik's product catalog — industrial hydraulic and pneumatic parts supplier since 1984: hydraulic hose, fittings, cylinders, pumps, valves, seals/rod seals and O-rings. Worldwide shipping by air cargo.",
  ru: 'Каталог продукции Hidroteknik — поставщика промышленных гидравлических и пневматических комплектующих с 1984 года: гидравлические рукава, фитинги, цилиндры, насосы, клапаны, уплотнения и O-ring. Доставка по всему миру авиакарго.',
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>
}): Promise<Metadata> {
  const { lang: langHam } = await params
  const lang = langHam as Dil
  const url = `${SITE_URL}/${lang}`
  return {
    title: BASLIK[lang],
    description: ACIKLAMA[lang],
    alternates: {
      canonical: url,
      languages: Object.fromEntries(DILLER.map((d) => [d, `${SITE_URL}/${d}`])),
    },
  }
}

export default async function KatalogAnaSayfa({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: langHam } = await params
  const lang = langHam as Dil
  const m = METIN[lang]
  const kategoriler = kategorilerIcin(lang)
  const toplamKalem = kategoriler.reduce((a, k) => a + kategoriUrunleri(k.slug).toplam, 0)

  return (
    <>
      <div className="hero">
        <div className="sarmal">
          <h1>{m.anaSayfaBaslik}</h1>
          <p className="ozet">{m.anaSayfaOzet(FIRMA.kurulus, sayiFormat(toplamKalem, lang))}</p>
          <div className="rozetler">
            <span className="rozet">{m.rozetKurulus(FIRMA.kurulus)}</span>
            <span className="rozet">{m.rozetPreslemeYerinde}</span>
            <span className="rozet pirinc">{m.rozetAyniGunTeklif}</span>
          </div>
        </div>
      </div>

      <div className="sarmal">
        <section>
          <h2>{m.urunGruplari}</h2>
          <div className="kartlar">
            {kategoriler.map((k) => {
              const adet = kategoriUrunleri(k.slug).toplam
              return (
                <Link key={k.slug} href={`/${lang}/${k.slug}`} className="kart">
                  <b>{k.ad}</b>
                  <span>{k.ozet.split('.')[0]}.</span>
                  <em>
                    {sayiFormat(adet, lang)} {m.kalem}
                  </em>
                </Link>
              )
            })}
          </div>
        </section>

        <section>
          <h2>{m.rehberlerBaslik}</h2>
          <div className="kartlar">
            {REHBERLER.map((r) => (
              <Link key={r.slug} href={`/${lang}/rehber/${r.slug}`} className="kart">
                <b>{r[lang].ad}</b>
                <span>{r[lang].ozet}</span>
                <em>{m.rehberRozet}</em>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <h2>{m.markaKirinti}</h2>
          <div className="etiketler">
            {MARKALAR.map((b) => (
              <Link key={b.slug} href={`/${lang}/marka/${b.slug}`} className="etiket etiket-marka">
                {b.ad}
              </Link>
            ))}
          </div>
        </section>

        <section>
          <h2>{m.nedenBaslik}</h2>
          <div className="metin">
            <p>{m.nedenP1}</p>
            <p>{m.nedenP2}</p>
            <p dangerouslySetInnerHTML={{ __html: m.nedenP3(ANA_SITE, HESAPLA_URL[lang]) }} />
          </div>
        </section>

        <div className="teklif">
          <h2>{m.bulamadinizBaslik}</h2>
          <p>{m.bulamadinizMetin}</p>
          <div className="teklif-butonlar">
            <a className="btn btn-birincil" href={`tel:${FIRMA.telefonHam}`}>
              {FIRMA.telefon}
            </a>
            <a className="btn btn-ikincil" href={`mailto:${FIRMA.epostaSatis}`}>
              {FIRMA.epostaSatis}
            </a>
          </div>
        </div>
      </div>
    </>
  )
}
