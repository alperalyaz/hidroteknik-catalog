import { SITE_URL, ANA_SITE, FIRMA, VARSAYILAN_DIL, sayiFormat } from '@/lib/site'
import { KATEGORILER, kategoriUrunleri, urunAdiDuzelt } from '@/lib/veri'
import { PROFILLER, profilSlug } from '@/lib/profil'
import { MARKALAR } from '@/lib/marka'
import { REHBERLER } from '@/lib/rehber'
import { SILINDIR_PARCALARI } from '@/lib/silindir-parca'
import { URETICI_KODLARI, satirUreticiKodu } from '@/lib/uretici-kod'
import { GUNCELLEME } from '@/lib/guncelleme'

/**
 * llms-full.txt — kataloğun ELDE OLAN her kaleminin tek dosyada tam dökümü.
 *
 * `llms.txt` bir İÇİNDEKİLER'dir: ne olduğumuzu ve hangi sayfaların bulunduğunu
 * söyler. Bu dosya İÇERİĞİN KENDİSİDİR — 5.030 sızdırmazlık ölçüsü, 9.335
 * üretici katalog kodu, 574 örnek ürün satırı ve dört teknik rehberin tam
 * metni; hepsi tek istekte.
 *
 * ── NEDEN ──────────────────────────────────────────────────────────────────
 * Üretken bir motor cevabını ÇEKTİĞİ METİNDEN kurar. 306 sayfayı tek tek
 * gezmek zorunda kalan bir istemci pratikte birkaçını okur ve kalanı hiç
 * görmez. Tek dosya, "K21 40x50x8 kimde var" sorusunun cevabını bir istek
 * uzağa indirir.
 *
 * DÜRÜSTLÜK: burada sayfalarda OLMAYAN hiçbir şey yoktur. Bu dosya yeni bilgi
 * yayımlamaz, var olanı tek yerde toplar. Fiyat, iskonto, maliyet, tedarikçi
 * adı ve BİZİM stok kodumuz buraya da girmez — yayımlanan kod her yerde olduğu
 * gibi ÜRETİCİNİN kodudur.
 *
 * TR yayımlanır: kodlar ve ölçüler dilden bağımsızdır, çevrilen kısım ise
 * `llms.txt` üzerinden üç dilde de erişilebilir.
 */
export const dynamic = 'force-static'

const L = VARSAYILAN_DIL
const b = (s: string) => s.replace(/\s+/g, ' ').trim()

export function GET() {
  const toplam = KATEGORILER.reduce((a, k) => a + kategoriUrunleri(k.slug).toplam, 0)
  const olcuSayisi = PROFILLER.reduce((a, p) => a + p.olculer.length, 0)
  const kodSayisi = URETICI_KODLARI.reduce(
    (a, g) => a + g.seriler.reduce((x, s) => x + s.kodlar.length, 0),
    0
  )
  const p: string[] = []

  p.push(`# ${FIRMA.ad} — Ürün Kataloğu (tam döküm)`)
  p.push('')
  p.push(`> ${FIRMA.kurulus}'ten beri endüstriyel hidrolik ve pnömatik malzeme tedarikçisi.`)
  p.push(`> Merkez: ${FIRMA.adres.ilce} / ${FIRMA.adres.il}, Türkiye. Türkiye geneli sevkiyat ve ihracat.`)
  p.push(`> Bu dosya kataloğun tam dökümüdür: ${sayiFormat(toplam, L)} kalem stok,`)
  p.push(`> ${sayiFormat(olcuSayisi, L)} sızdırmazlık ölçüsü, ${sayiFormat(kodSayisi, L)} üretici katalog kodu.`)
  p.push(`> Gezinilebilir sürüm: ${SITE_URL}/${L} · Özet: ${SITE_URL}/llms.txt`)
  p.push('')
  p.push('## İletişim')
  p.push('')
  p.push(`- Telefon: ${FIRMA.telefon}`)
  p.push(`- E-posta: ${FIRMA.eposta} (genel), ${FIRMA.epostaSatis} (satış)`)
  p.push(`- Adres: ${FIRMA.adres.sokak}, ${FIRMA.adres.postaKodu} ${FIRMA.adres.ilce} / ${FIRMA.adres.il}`)
  p.push(`- Konum: ${FIRMA.konum.lat}, ${FIRMA.konum.lng}`)
  p.push(`- Çalışma saatleri: Hafta içi ${FIRMA.saatler.haftaIci}, Cumartesi ${FIRMA.saatler.cumartesi}`)
  p.push('')
  p.push('## Bu dosya nasıl okunur')
  p.push('')
  p.push('- Fiyat YOKTUR ve yayımlanmaz; satış teklif üzerinedir.')
  p.push('- Yayımlanan kodlar ÜRETİCİNİN katalog kodlarıdır (ör. HansaFlex HD106,')
  p.push('  Kastaş K21-040/11). Hidroteknik\'in kendi stok kodu yayımlanmaz.')
  p.push('- Sızdırmazlık ölçüsü üç sayıdır: mil tarafında iç × dış × yükseklik,')
  p.push('  piston tarafında dış × iç × yükseklik. Sıra elemanın nereye oturduğunu söyler.')
  p.push('- "kalem" = ayrı stok kartı. Kategori listeleri temsili örnektir; profil')
  p.push('  ölçü listeleri ve üretici kod listeleri TAMDIR.')
  p.push('')

  /* ── Ürün grupları ─────────────────────────────────────────────────────── */
  p.push('## Ürün grupları')
  p.push('')
  p.push(`Son güncelleme: ${GUNCELLEME.kategori}`)
  p.push('')
  for (const k of KATEGORILER) {
    const { toplam: t, liste } = kategoriUrunleri(k.slug)
    p.push(`### ${k.ad}`)
    p.push('')
    p.push(`- Adres: ${SITE_URL}/${L}/${k.slug}`)
    p.push(`- Stokta: ${sayiFormat(t, L)} kalem`)
    p.push(`- Özet: ${b(k.ozet)}`)
    if (k.markalar?.length) p.push(`- Markalar: ${k.markalar.join(', ')}`)
    if (k.standartlar?.length) p.push(`- Standartlar: ${k.standartlar.join(', ')}`)
    p.push('')
    if (liste.length) {
      p.push(`Örnek ürünler (${liste.length} satır, en çok hareket görenler):`)
      p.push('')
      for (const u of liste) {
        const kod = satirUreticiKodu(u.kod)
        const ek = [kod && `üretici kodu ${kod}`, u.marka, u.model].filter(Boolean).join(', ')
        p.push(`- ${urunAdiDuzelt(u.ad)}${ek ? ` (${ek})` : ''}`)
      }
      p.push('')
    }
    if (k.sss?.length) {
      for (const s of k.sss) {
        p.push(`**${b(s.s)}** ${b(s.c)}`)
        p.push('')
      }
    }
  }

  /* ── Kastaş profil ölçüleri — TAM ────────────────────────────────────── */
  p.push('## Kastaş sızdırmazlık profilleri — tam ölçü listesi')
  p.push('')
  p.push('Sızdırmazlıkta arama ürün adıyla değil profil kodu ve ölçüyle yapılır')
  p.push('("K21 40x50x8"). Aşağıdaki listeler her profilin stoktaki ölçülerinin')
  p.push('TAMAMIDIR. Listede olmayan ölçüler de Kastaş kataloğundan temin edilir.')
  p.push('')
  p.push(`Son güncelleme: ${GUNCELLEME.profil}`)
  p.push('')
  for (const pr of PROFILLER) {
    p.push(`### Kastaş ${pr.kod}`)
    p.push('')
    p.push(`- Adres: ${SITE_URL}/${L}/profil/${profilSlug(pr.kod)}`)
    p.push(`- Stokta: ${sayiFormat(pr.adet, L)} ölçü`)
    p.push(`- Takıldığı yer: ${pr.yer}`)
    if (pr.ad.tr) p.push(`- İşlevi: ${b(pr.ad.tr)}`)
    else p.push('- İşlevi: Kastaş kataloğundan doğrulanamadı, boş bırakıldı.')
    p.push(`- Çap aralığı: Ø${pr.capMin}–Ø${pr.capMax} mm`)
    if (pr.pu) p.push('- Poliüretan (PU) seçeneği var')
    p.push('')
    for (const o of pr.olculer) {
      p.push(`- ${o.kod}${o.olcu ? ` — ${o.olcu} mm` : ''}`)
    }
    p.push('')
  }

  /* ── Üretici katalog kodları — TAM ───────────────────────────────────── */
  p.push('## Üretici katalog kodları')
  p.push('')
  p.push('Sanayide ürün bizim stok kodumuzla değil üreticinin katalog koduyla')
  p.push('aranır. Aşağıdaki kodların tamamı temin edilebilir; bir kısmı stoktadır.')
  p.push('')
  p.push(`Son güncelleme: ${GUNCELLEME.ureticiKod}`)
  p.push('')
  for (const g of URETICI_KODLARI) {
    p.push(`### ${g.marka} — ${KATEGORILER.find((k) => k.slug === g.kategori)?.ad ?? g.kategori}`)
    p.push('')
    p.push(`- Adres: ${SITE_URL}/${L}/${g.kategori}`)
    p.push(`- Kod deseni: ${g.kodDeseni} (örnek ${g.kodOrnek})`)
    p.push('')
    for (const s of g.seriler) {
      const ad = s.seriAdiUreticinin === false ? s.seri : `${s.seri} serisi`
      p.push(`**${g.marka} ${ad}** — ${b(s.aciklama.tr)}`)
      if (typeof s.stokAdet === 'number') p.push(`Stokta ${sayiFormat(s.stokAdet, L)} kart.`)
      if (s.ozellikler?.length) {
        for (const o of s.ozellikler) p.push(`${o.etiket.tr}: ${o.degerler.join(', ')}`)
      }
      p.push('')
      for (const kod of s.kodlar) p.push(`- ${kod}`)
      p.push('')
    }
  }

  /* ── Markalar ───────────────────────────────────────────────────────── */
  p.push('## Markalar')
  p.push('')
  p.push(`Son güncelleme: ${GUNCELLEME.marka}`)
  p.push('')
  for (const m of MARKALAR) {
    p.push(`### ${m.ad}`)
    p.push('')
    p.push(`- Adres: ${SITE_URL}/${L}/marka/${m.slug}`)
    p.push(`- Stokta: ${sayiFormat(m.adet, L)} kalem`)
    p.push(`- ${b(m.ozet.tr)}`)
    if (m.giris?.tr) p.push('')
    if (m.giris?.tr) p.push(b(m.giris.tr))
    p.push('')
  }

  /* ── Silindir yedek parçaları ───────────────────────────────────────── */
  p.push('## Hidrolik silindir yedek parçaları')
  p.push('')
  p.push(`Son güncelleme: ${GUNCELLEME.silindirParca}`)
  p.push('')
  for (const x of SILINDIR_PARCALARI) {
    p.push(`- ${x.tr} — ${SITE_URL}/${L}/silindir-parca/${x.slug} — ${x.adet} ölçü, Ø${x.capMin}–${x.capMax} mm`)
  }
  p.push('')

  /* ── Teknik rehberler — TAM METİN ───────────────────────────────────── */
  p.push('## Teknik rehberler')
  p.push('')
  p.push(`Son güncelleme: ${GUNCELLEME.rehber}`)
  p.push('')
  for (const r of REHBERLER) {
    p.push(`### ${r.tr.h1}`)
    p.push('')
    p.push(`Adres: ${SITE_URL}/${L}/rehber/${r.slug}`)
    p.push('')
    p.push(b(r.tr.ozet))
    p.push('')
    if (r.tr.giris) {
      p.push(b(r.tr.giris))
      p.push('')
    }
    for (const s of r.tr.sss ?? []) {
      p.push(`**${b(s.s)}** ${b(s.c)}`)
      p.push('')
    }
  }

  p.push('## Diğer kaynaklar')
  p.push('')
  p.push(`- Kurumsal site: ${ANA_SITE}`)
  p.push('- Hidrolik hesaplayıcı (TR): https://hesapla.hidroteknik.com.tr')
  p.push('- Hydraulic calculator (EN): https://calculate.hidroteknik.com.tr')
  p.push(`- İngilizce katalog: ${SITE_URL}/en`)
  p.push(`- Rusça katalog: ${SITE_URL}/ru`)
  p.push('')

  return new Response(p.join('\n'), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
