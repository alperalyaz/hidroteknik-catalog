import Link from 'next/link'
import Script from 'next/script'
import { DILLER, DIL_ADI, FIRMA, ANA_SITE, HESAPLA_URL, type Dil } from '@/lib/site'
import { METIN } from '@/lib/metin'
import { isletmeSchema, jsonLd } from '@/lib/schema'
import { kategorilerIcin, AILELER } from '@/lib/veri'
import { SILINDIR_PARCALARI, parcaAdi } from '@/lib/silindir-parca'
import { REHBERLER } from '@/lib/rehber'

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
              {/*
                Logo <img> olarak basılır, next/image ile DEĞİL: katalog tamamen
                statik ve ölçü sabit (400×81). next/image burada optimizasyon
                sunucusu gerektirir, statik çıktının tek amacı olan "sunucusuz
                servis edilebilirlik"i bozardı. Boyutlar HTML'de verildiği için
                yerleşim kayması (CLS) da olmaz.
              */}
              <img
                className="marka-logo"
                src="/logo.png"
                width={400}
                height={81}
                alt={FIRMA.ad}
                fetchPriority="high"
              />
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

        {/*
          FOOTER — üç yatay bant.

          Eski hâlde 28 kategori tek <ul> olarak, 4 satırlık sütunlarla AYNI grid
          satırının kardeşiydi. CSS grid'de satır yüksekliğini en uzun çocuk
          belirler; auto-fit sütun SAYISINI ayarlar, satır YÜKSEKLİĞİNİ ayarlamaz.
          Bu yüzden footer 28 satır boyunca uzuyor, diğer üç sütun tepede kalıp
          altlarında koca boşluk bırakıyordu — sütun genişliğiyle oynayan hiçbir
          çözüm bunu düzeltemezdi.

          İki değişiklik birlikte gerekli: (1) 28 kalem dört aileye bölündü,
          (2) o blok kendi tam genişlikli bandına alındı. En uzun sütun 9 satır.
          Tek link bile kaldırılmadı — yalnız sunum değişti.
        */}
        <footer>
          <div className="sarmal">
            <div className="footer-bant">
              <div className="footer-gruplar">
                {AILELER.map(({ grup, anahtar }) => {
                  const uyeler = kategoriler.filter((k) => k.grup === grup)
                  if (!uyeler.length) return null
                  return (
                    <div key={grup}>
                      <h3>{m[anahtar]}</h3>
                      <ul>
                        {uyeler.map((k) => (
                          <li key={k.slug}>
                            <Link href={`/${lang}/${k.slug}`}>{k.ad}</Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="footer-alt-bant">
              <div>
                <h3>{m.parcaListeBaslik}</h3>
                <ul>
                  {SILINDIR_PARCALARI.map((p) => (
                    <li key={p.slug}>
                      <Link href={`/${lang}/silindir-parca/${p.slug}`}>{parcaAdi(p, lang)}</Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3>{m.rehberlerBaslik}</h3>
                <ul>
                  {REHBERLER.map((r) => (
                    <li key={r.slug}>
                      <Link href={`/${lang}/rehber/${r.slug}`}>{r[lang].ad}</Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3>{m.iletisim}</h3>
                <ul>
                  <li>
                    <a href={`tel:${FIRMA.telefonHam}`}>{FIRMA.telefon}</a>
                  </li>
                  <li>
                    <a href={`mailto:${FIRMA.epostaSatis}`}>{FIRMA.epostaSatis}</a>
                  </li>
                </ul>
                {/*
                  Saatler ve ilçe listeden ÇIKARILDI, silinmedi. Link kardeşleriyle
                  aynı <ul> içinde, aynı madde ritminde duruyorlardı; alt çizgi
                  kalkınca tıklanabilir olanla olmayan tamamen aynı görünecekti.
                */}
                <div className="footer-bilgi">
                  <span>
                    {m.haftaIci} {FIRMA.saatler.haftaIci}
                  </span>
                  <span>
                    {m.cumartesi} {FIRMA.saatler.cumartesi}
                  </span>
                  <span>
                    {FIRMA.adres.ilce} / {FIRMA.adres.il}
                  </span>
                </div>
              </div>
              <div>
                <h3>{m.kurumsal}</h3>
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

            <div className="footer-kunye">
              <img
                className="footer-logo"
                src="/logo-beyaz.png"
                width={400}
                height={81}
                alt={FIRMA.ad}
                loading="lazy"
              />
              {/*
                İki metin AYRI satırda duruyor, aralarına "·" konmuyor. Denendi ve
                bozuldu: flex sarma sırasında ayraç kendi span'ıyla birlikte alt
                satırın BAŞINA düşüp yetim kalıyor, CSS bunu göremiyor (bir öğenin
                satır başına düşüp düşmediği seçicilerle sorgulanamaz).
              */}
              <div className="footer-kunye-metin">
                <span>{m.footerAlt(FIRMA.kurulus)}</span>
                <span>{m.ftKunye}</span>
              </div>
            </div>
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
