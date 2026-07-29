import type { Metadata } from 'next'
import Link from 'next/link'
import { SITE_URL, FIRMA, ANA_SITE } from '@/lib/site'
import { KATEGORILER, kategoriUrunleri } from '@/lib/veri'

export const metadata: Metadata = {
  title: 'Hidrolik ve Pnömatik Ürün Kataloğu',
  description:
    '1984’ten beri endüstriyel hidrolik ve pnömatik malzeme tedarikçisi Hidroteknik’in ürün kataloğu: hidrolik hortum, rakor, silindir, pompa, valf, keçe/nutring ve o-ring. Türkiye geneli sevkiyat.',
  alternates: { canonical: `${SITE_URL}/tr` },
}

export default async function KatalogAnaSayfa({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  const toplamKalem = KATEGORILER.reduce((a, k) => a + kategoriUrunleri(k.slug).toplam, 0)

  return (
    <>
      <div className="hero">
        <div className="sarmal">
          <h1>Hidrolik ve pnömatik ürün kataloğu</h1>
          <p className="ozet">
            {FIRMA.kurulus}’ten beri endüstriyel hidrolik ve pnömatik malzeme tedarik ediyoruz.
            Aşağıdaki ürün gruplarında toplam {toplamKalem.toLocaleString('tr-TR')} kalem stok;
            Türkiye geneline sevkiyat ve ihracat.
          </p>
          <div className="rozetler">
            <span className="rozet">1984’ten beri</span>
            <span className="rozet">Hortum presleme yerinde</span>
            <span className="rozet pirinc">Aynı gün teklif</span>
          </div>
        </div>
      </div>

      <div className="sarmal">
        <section>
          <h2>Ürün grupları</h2>
          <div className="kartlar">
            {KATEGORILER.map((k) => {
              const adet = kategoriUrunleri(k.slug).toplam
              return (
                <Link key={k.slug} href={`/${lang}/${k.slug}`} className="kart">
                  <b>{k.ad}</b>
                  <span>{k.ozet.split('.')[0]}.</span>
                  <em>{adet.toLocaleString('tr-TR')} kalem</em>
                </Link>
              )
            })}
          </div>
        </section>

        <section>
          <h2>Neden Hidroteknik?</h2>
          <div className="metin">
            <p>
              Endüstriyel hidrolikte doğru parçayı bulmak, çoğu zaman kataloğu taramaktan değil,
              ölçüyü ve diş tipini doğru okumaktan geçer. Metrik, BSP, BSPT ve ORFS dişler gözle
              birbirine benzer; yanlış eşleştirilen bağlantı ilk basınçta sızdırır.
            </p>
            <p>
              Bu yüzden satış ekibimiz yalnızca stok kodu okumaz: elinizdeki parçanın fotoğrafından
              veya ölçüsünden doğru muadili belirler. Hortum presleme işlemi kendi tesisimizde
              yapıldığı için standart ölçülerde teslim genellikle aynı gün gerçekleşir.
            </p>
            <p>
              Hidrolik hesaplamalarınız için{' '}
              <a href="https://hesapla.hidroteknik.com.tr">ücretsiz hesaplayıcımızı</a> ve kurumsal
              bilgiler için <a href={ANA_SITE}>hidroteknik.com.tr</a> adresini kullanabilirsiniz.
            </p>
          </div>
        </section>

        <div className="teklif">
          <h2>Aradığınız ürünü bulamadınız mı?</h2>
          <p>
            Katalogda görünen kalemler stoğumuzun bir bölümüdür. İhtiyacınızı iletin; stokta yoksa
            tedarik süresiyle birlikte bilgi verelim.
          </p>
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
