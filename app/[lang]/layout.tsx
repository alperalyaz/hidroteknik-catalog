import Link from 'next/link'
import Script from 'next/script'
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

        {/*
          Hidroteknik AI canlı destek widget'ı — sağ altta launcher açar, tıklanınca
          /embed iframe'i gelir. Kataloğun tek harici betiği.

          ADRES NEDEN tawkto-one.vercel.app (chat.hidroteknik.com.tr DEĞİL):
          chat.hidroteknik.com.tr diye bir kayıt YOK — DNS'te NXDOMAIN döner (ölçüldü
          30.07.2026). Katalog o adrese baktığı sürece widget hiç yüklenmiyordu; istek
          daha DNS aşamasında ölüyordu, konsolda tek satır hata bile bırakmadan.
          Ana site (hidroteknik.com.tr) da widget'ı bu vercel.app adresinden yüklüyor
          ve orada çalışıyor — yani doğru adres budur.

          İleride chat.hidroteknik.com.tr gerçekten tanımlanırsa (Vercel'de özel alan
          adı + DNS CNAME) burası tek satırda oraya çevrilir. O zamana kadar var olmayan
          bir adrese işaret etmek widget'ı sessizce ölü tutuyor.
        */}
        {/*

          NEDEN next/script + lazyOnload (ham <script async> DEĞİL):
          - lazyOnload betiği window 'load' olayından SONRA, tarayıcı boşa düştüğünde
            (requestIdleCallback) enjekte eder. Katalog tamamen statik ve hafif; widget
            asla LCP ile ya da sayfa render'ıyla bant genişliği için yarışmaz.
          - Ham <script async> daha erken indirilirdi: React 19 <script async src> etiketini
            "hoistable resource" sayıp <head>'e taşır, yani HTML ayrıştırılırken indirmeye
            başlanır — <body> sonuna yazmış olmamız bunu değiştirmez. Kritik yoldan uzak
            durmanın tek güvenilir yolu lazyOnload.
          - Bedeli: betik yalnız hidrasyondan sonra çalışır, HTML'de <script> etiketi
            olarak GÖRÜNMEZ (adres RSC yükünde taşınır, istemcide enjekte edilir).
            JS kapalı tarayıcıda widget çıkmaz; sayfa içeriği zaten JS'siz tamdır.

          ÇİFT YÜKLEME: üç kat koruma var. (1) Bu layout istemci-taraflı gezinmede
          remount olmaz. (2) Olsa bile next/script aynı src'yi ScriptCache ile bir kez
          enjekte eder. (3) widget.js kendi içinde window.__hidroteknikAiYuklendi bayrağı
          taşır. Widget dili <html lang>'den okunur — o da hemen yukarıda ayarlanıyor.
        */}
        <Script
          id="hidroteknik-ai-widget"
          src="https://tawkto-one.vercel.app/widget.js"
          strategy="lazyOnload"
        />
      </body>
    </html>
  )
}
