import Link from 'next/link'
import { DILLER, FIRMA, ANA_SITE } from '@/lib/site'
import { isletmeSchema, jsonLd } from '@/lib/schema'
import { KATEGORILER } from '@/lib/veri'

export function generateStaticParams() {
  return DILLER.map((lang) => ({ lang }))
}

export default async function DilLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params

  return (
    <>
      {/* İşletme kimliği her sayfada beyan edilir — ana sitedeki şema ile aynı @id */}
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(isletmeSchema())} />

      <header className="ustbar">
        <div className="sarmal ustbar-ic">
          <Link href={`/${lang}`} className="marka">
            <b>HİDROTEKNİK</b>
            <span>Ürün Kataloğu</span>
          </Link>
          <a href={`tel:${FIRMA.telefonHam}`} className="ustbar-tel">
            {FIRMA.telefon}
          </a>
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
              <b>İletişim</b>
              <ul>
                <li>
                  <a href={`tel:${FIRMA.telefonHam}`}>{FIRMA.telefon}</a>
                </li>
                <li>
                  <a href={`mailto:${FIRMA.epostaSatis}`}>{FIRMA.epostaSatis}</a>
                </li>
                <li>Hafta içi {FIRMA.saatler.haftaIci}</li>
                <li>Cumartesi {FIRMA.saatler.cumartesi}</li>
              </ul>
            </div>
            <div>
              <b>Ürün grupları</b>
              <ul>
                {KATEGORILER.map((k) => (
                  <li key={k.slug}>
                    <Link href={`/${lang}/${k.slug}`}>{k.ad}</Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <b>Kurumsal</b>
              <ul>
                <li>
                  <Link href={`/${lang}/denizli-hidrolik`}>Denizli hidrolik</Link>
                </li>
                <li>
                  <a href={ANA_SITE}>hidroteknik.com.tr</a>
                </li>
                <li>
                  <a href="https://hesapla.hidroteknik.com.tr">Hidrolik hesaplayıcı</a>
                </li>
                <li>
                  <a href={`${ANA_SITE}/İletişim-1`}>İletişim</a>
                </li>
              </ul>
            </div>
          </div>
          <p className="footer-alt">
            {FIRMA.kurulus}’ten beri endüstriyel hidrolik ve pnömatik malzeme tedariki · Hizmet
            bölgesi: {FIRMA.hizmetBolgesi.join(', ')}
          </p>
        </div>
      </footer>
    </>
  )
}
