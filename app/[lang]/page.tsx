import type { Metadata } from 'next'
import Link from 'next/link'
import { DILLER, SITE_URL, FIRMA, sayiFormat, dilAlternatifleri, type Dil } from '@/lib/site'
import { METIN } from '@/lib/metin'
import { kategorilerIcin, kategoriUrunleri, AILELER } from '@/lib/veri'
import { REHBERLER } from '@/lib/rehber'
import { MARKALAR } from '@/lib/marka'
import { PROFILLER, profilSlug, yerMetni } from '@/lib/profil'
import { SILINDIR_PARCALARI, parcaAdi } from '@/lib/silindir-parca'

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
      languages: dilAlternatifleri(''),
    },
  }
}

export default async function KatalogAnaSayfa({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: langHam } = await params
  const lang = langHam as Dil
  const m = METIN[lang]
  const kategoriler = kategorilerIcin(lang)
  const toplamKalem = kategoriler.reduce((a, k) => a + kategoriUrunleri(k.slug).toplam, 0)

  // Sayaç şeridindeki her sayı VERİDEN türetilir, kopyaya gömülmez: 29. kategori
  // eklendiği gün sabit yazılmış bir sayı üç dilde birden yalan söylerdi ve
  // `npm run denetle` bunu göremezdi.
  const bosProfil = PROFILLER.filter((p) => !p.ad[lang]).length

  const SAYAC = [
    { hedef: 'urun-gruplari', deger: kategoriler.length, etiket: m.seritGrup },
    { hedef: 'silindir-parcalari', deger: SILINDIR_PARCALARI.length, etiket: m.seritSilindir },
    { hedef: 'profil-kodlari', deger: PROFILLER.length, etiket: m.seritProfil },
    { hedef: 'markalar', deger: MARKALAR.length, etiket: m.seritMarka },
  ]

  return (
    <>
      <div className="hero">
        <div className="sarmal">
          <h1>{m.anaSayfaBaslik}</h1>
          <p className="ozet">{m.anaSayfaOzet(FIRMA.kurulus, sayiFormat(toplamKalem, lang))}</p>
          <div className="hero-eylem">
            <a className="btn btn-hero" href={`mailto:${FIRMA.epostaSatis}`}>
              {m.heroTeklifBtn}
            </a>
            <a className="btn btn-hero-ikincil" href="#urun-gruplari">
              {m.heroGruplarBtn}
            </a>
          </div>
        </div>
      </div>

      <div className="sarmal">
        {/* Kataloğun büyüklüğünü tek bakışta veren şerit; dört hücre de sayfa içi
            bağlantı, yani okuyucu aradığı bölüme doğrudan iner. */}
        <ul className="serit">
          {SAYAC.map((s) => (
            <li key={s.hedef}>
              <a href={`#${s.hedef}`}>
                <span className="serit-deger">{sayiFormat(s.deger, lang)}</span>
                <span className="serit-etiket">{s.etiket}</span>
              </a>
            </li>
          ))}
        </ul>

        <section id="urun-gruplari">
          <div className="bolum-bas">
            <h2>{m.urunGruplari}</h2>
            <span className="bolum-sayac">{sayiFormat(kategoriler.length, lang)}</span>
          </div>
          <p className="bolum-not">{m.notGruplar}</p>
          {AILELER.map(({ grup, anahtar }) => {
            const uyeler = kategoriler.filter((k) => k.grup === grup)
            if (!uyeler.length) return null
            return (
              <div key={grup} className="aile">
                <h3>{m[anahtar]}</h3>
                <div className="kartlar">
                  {uyeler.map((k) => (
                    <Link key={k.slug} href={`/${lang}/${k.slug}`} className="kart">
                      <b>{k.ad}</b>
                      <span>{k.ozet.split('.')[0]}.</span>
                      <em>
                        {sayiFormat(kategoriUrunleri(k.slug).toplam, lang)} {m.kalem}
                      </em>
                    </Link>
                  ))}
                </div>
              </div>
            )
          })}
        </section>

        <section id="silindir-parcalari">
          <div className="bolum-bas">
            <h2>{m.parcaListeBaslik}</h2>
            <span className="bolum-sayac">{sayiFormat(SILINDIR_PARCALARI.length, lang)}</span>
          </div>
          <p className="bolum-not">{m.notSilindir}</p>
          <div className="kartlar">
            {SILINDIR_PARCALARI.map((p) => (
              <Link key={p.slug} href={`/${lang}/silindir-parca/${p.slug}`} className="kart">
                <b>{parcaAdi(p, lang)}</b>
                <span>{p.aciklama[lang].split('.')[0]}.</span>
                <em>
                  {m.parcaRozetOlcu(sayiFormat(p.adet, lang))} · Ø{p.capMin}–{p.capMax}
                </em>
              </Link>
            ))}
          </div>
        </section>

        <section id="profil-kodlari">
          <div className="bolum-bas">
            <h2>{m.profilBaslik}</h2>
            <span className="bolum-sayac">{sayiFormat(PROFILLER.length, lang)}</span>
          </div>
          <p className="bolum-not">{m.notProfil}</p>
          <div className="cipler">
            {PROFILLER.map((p) => (
              <Link key={p.kod} href={`/${lang}/profil/${profilSlug(p.kod)}`} className="cip">
                <b>{p.kod}</b>
                {/* İkinci satır: işlev doğrulanmışsa o yazılır, değilse ölçüden
                    TÜRETİLEN taraf (mil/piston). İkisi de yoksa satır hiç basılmaz —
                    boş bir satır bırakmak çipi bozardı.
                    `yer` veride Türkçe tutulur ('Mil'/'Piston'); ham basılırsa
                    İngilizce ve Rusça çipe Türkçe sızar, o yüzden çevrilir. */}
                {p.ad[lang] ? (
                  <span>{p.ad[lang]}</span>
                ) : p.yer ? (
                  <span>{yerMetni(p.yer, m)}</span>
                ) : null}
              </Link>
            ))}
          </div>
        </section>

        <section>
          <div className="bolum-bas">
            <h2>{m.rehberlerBaslik}</h2>
            <span className="bolum-sayac">{sayiFormat(REHBERLER.length, lang)}</span>
          </div>
          <p className="bolum-not">{m.notRehber}</p>
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

        <section id="markalar">
          <div className="bolum-bas">
            <h2>{m.markaKirinti}</h2>
            <span className="bolum-sayac">{sayiFormat(MARKALAR.length, lang)}</span>
          </div>
          <p className="bolum-not">{m.notMarka}</p>
          <div className="etiketler">
            {MARKALAR.map((b) => (
              <Link key={b.slug} href={`/${lang}/marka/${b.slug}`} className="etiket etiket-marka">
                {b.ad}
              </Link>
            ))}
          </div>
        </section>

        {/*
          "Neden Hidroteknik" üç paragrafının yerine geçen bölüm.

          Eskisi düz metin yığınıydı ve o tür bölümler doğrulanamayan genellemeye
          kayar ("yılların tecrübesi", "hızlı teslimat") — CLAUDE.md bunu zaten
          yasaklıyor. Buradaki üç hücrenin üçü de kataloğun GERÇEK çalışma
          biçimini anlatıyor, yani doğrulanabilir.

          Üçüncü hücredeki sayı cümlenin İÇİNDE değil YANINDA duruyor. Sebep
          dilbilgisel: TR'de "18'inde" eki son ünlüye bağlıdır (18'inde / 3'ünde),
          RU'da sayı ismin çekimini yönetir. Değer ayrı <dt> olunca hiçbir dilde
          çekim kırılmaz — sayı veriden türetilse bile.
        */}
        <section>
          <div className="bolum-bas">
            <h2>{m.basYaklasim}</h2>
          </div>
          <div className="yaklasim">
            <div className="yaklasim-hucre">
              <h3>{m.yaklasim1Bas}</h3>
              <p>{m.yaklasim1Metin}</p>
            </div>
            <div className="yaklasim-hucre">
              <h3>{m.yaklasim2Bas}</h3>
              <p>{m.yaklasim2Metin}</p>
            </div>
            <div className="yaklasim-hucre">
              <h3>{m.yaklasim3Bas}</h3>
              <p>{m.yaklasim3Metin}</p>
              <dl className="yaklasim-olcu">
                <dt>
                  {sayiFormat(bosProfil, lang)} / {sayiFormat(PROFILLER.length, lang)}
                </dt>
                <dd>{m.yaklasim3Etiket}</dd>
              </dl>
            </div>
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
