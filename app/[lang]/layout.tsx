import Link from 'next/link'
import { DILLER, DIL_ADI, FIRMA, ANA_SITE, HESAPLA_URL, type Dil } from '@/lib/site'
import { METIN } from '@/lib/metin'
import { isletmeSchema, jsonLd } from '@/lib/schema'
import { kategorilerIcin } from '@/lib/veri'

export function generateStaticParams() {
  return DILLER.map((lang) => ({ lang }))
}

/**
 * Gerçek kök gövde burasıdır (<html>/<body>). app/layout.tsx [lang] parametresini
 * göremediği için (dinamik segment yalnız kendi altındaki layout'lara geçer),
 * <html lang> doğru şekilde yalnız burada, dile göre ayarlanabilir.
 */
export default async function DilLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ lang: string }>
}) {
  const { lang: langHam } = await params
  const lang = langHam as Dil
  const m = METIN[lang]
  const kategoriler = kategorilerIcin(lang)

  return (
    <html lang={lang}>
      <body>
        {/* İşletme kimliği her sayfada beyan edilir — ana sitedeki şema ile aynı @id */}
        <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(isletmeSchema())} />

        <header className="ustbar">
          <div className="sarmal ustbar-ic">
            <Link href={`/${lang}`} className="marka">
              <b>HİDROTEKNİK</b>
              <span>{m.urunKatalogu}</span>
            </Link>
            <div className="ustbar-sag">
              <nav className="dil-degistirici" aria-label="Dil / Language / Язык">
                {DILLER.map((d, i) => (
                  <span key={d}>
                    {i > 0 && ' · '}
                    {d === lang ? (
                      <b>{DIL_ADI[d]}</b>
                    ) : (
                      <Link href={`/${d}`} hrefLang={d}>
                        {DIL_ADI[d]}
                      </Link>
                    )}
                  </span>
                ))}
              </nav>
              <a href={`tel:${FIRMA.telefonHam}`} className="ustbar-tel">
                {FIRMA.telefon}
              </a>
            </div>
          </div>
        </header>

        <main>{children}</main>

        <footer>
          <div className="sarmal">
            <div className="footer-ic">
              <div>
                <b>{FIRMA.ad}</b>
                <p style={{ margin: 0 }}>
                  {FIRMA.adres.sokak}
                  <br />
                  {FIRMA.adres.postaKodu} {FIRMA.adres.ilce} / {FIRMA.adres.il}
                </p>
              </div>
              <div>
                <b>{m.iletisim}</b>
                <ul>
                  <li>
                    <a href={`tel:${FIRMA.telefonHam}`}>{FIRMA.telefon}</a>
                  </li>
                  <li>
                    <a href={`mailto:${FIRMA.epostaSatis}`}>{FIRMA.epostaSatis}</a>
                  </li>
                  <li>
                    {m.haftaIci} {FIRMA.saatler.haftaIci}
                  </li>
                  <li>
                    {m.cumartesi} {FIRMA.saatler.cumartesi}
                  </li>
                </ul>
              </div>
              <div>
                <b>{m.urunGruplari}</b>
                <ul>
                  {kategoriler.map((k) => (
                    <li key={k.slug}>
                      <Link href={`/${lang}/${k.slug}`}>{k.ad}</Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <b>{m.kurumsal}</b>
                <ul>
                  {lang === 'tr' && (
                    <li>
                      <Link href={`/${lang}/denizli-hidrolik`}>{m.denizliHidrolik}</Link>
                    </li>
                  )}
                  <li>
                    <a href={ANA_SITE}>{m.anaSiteLinkEtiketi}</a>
                  </li>
                  <li>
                    <a href={HESAPLA_URL[lang]}>{m.hidrolikHesaplayici}</a>
                  </li>
                  <li>
                    <a href={`${ANA_SITE}/İletişim-1`}>{m.iletisim}</a>
                  </li>
                </ul>
              </div>
            </div>
            <p className="footer-alt">{m.footerAlt(FIRMA.kurulus)}</p>
          </div>
        </footer>
      </body>
    </html>
  )
}
