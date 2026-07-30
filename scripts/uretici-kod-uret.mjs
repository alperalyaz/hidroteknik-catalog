/**
 * data/uretici-kodlari.json üretir.
 *
 * KAYNAK: ss reposundaki tedarikci_kaynak_kalem (tedarikçi fiyat listesi CSV'leri).
 * YAYIMLANAN: yalnız üretici katalog KODU + ölçü ekseni.
 * YAYIMLANMAYAN: fiyat (hiçbir tipi), tedarikçi adı, iskonto, maliyet.
 *
 * DÜRÜSTLÜK KURALI: yalnız GERÇEKTEN STOKLADIĞIMIZ serilerin kodları yayımlanır.
 * "Bu serinin her ölçüsünü veririz" doğrulanabilir; "üreticinin tüm kataloğunu
 * veririz" değil. stokAdet alanı o seride kaç aktif stok kartımız olduğunu tutar.
 */
import { writeFileSync } from 'node:fs'

/** Pemaks silindir kodu: SERİ-ÇAP(3)-TİP-STROK(4) → PAG-032-SN-0025 */
const pad = (n, g) => String(n).padStart(g, '0')
const kodUret = (seri, tip, cap, strok) => `${seri}-${pad(cap, 3)}-${tip}-${pad(strok, 4)}`

const STROK_UZUN = [25, 50, 80, 100, 125, 160, 200, 250, 300, 320, 350, 400, 450, 500, 600, 700, 800, 900, 1000]
const CAP_ISO = [32, 40, 50, 63, 80, 100]

// PM seyrek matris — kodlar veritabanından birebir alındı (üretilemez).
const PM_KODLARI =
  'PM-008-SNA-0010;PM-008-SNA-0025;PM-008-SNA-0050;PM-008-SNA-0080;PM-008-SNA-0100;PM-008-SNA-0125;PM-008-SNA-0160;PM-010-FSNA-0010;PM-010-FSNA-0025;PM-010-FSNA-0050;PM-010-SNA-0010;PM-010-SNA-0025;PM-010-SNA-0050;PM-010-SNA-0080;PM-010-SNA-0100;PM-010-SNA-0125;PM-010-SNA-0160;PM-012-FSNA-0010;PM-012-FSNA-0025;PM-012-FSNA-0050;PM-012-SNA-0010;PM-012-SNA-0025;PM-012-SNA-0050;PM-012-SNA-0080;PM-012-SNA-0100;PM-012-SNA-0125;PM-012-SNA-0160;PM-016-DNA-0010;PM-016-DNA-0025;PM-016-DNA-0050;PM-016-DNA-0080;PM-016-DNA-0100;PM-016-DNA-0125;PM-016-DNA-0160;PM-016-DNA-0200;PM-016-DNA-0250;PM-016-DNA-0320;PM-016-DNA-0400;PM-016-DNA-0500;PM-016-DYA-0010;PM-016-DYA-0025;PM-016-DYA-0050;PM-016-DYA-0080;PM-016-DYA-0100;PM-016-DYA-0125;PM-016-DYA-0160;PM-016-DYA-0200;PM-016-DYA-0250;PM-016-DYA-0320;PM-016-DYA-0500;PM-016-FSNA-0010;PM-016-FSNA-0025;PM-016-FSNA-0050;PM-016-RSNA-0010;PM-016-RSNA-0025;PM-016-RSNA-0050;PM-016-SNA-0010;PM-016-SNA-0025;PM-016-SNA-0050;PM-016-SNA-0080;PM-016-SNA-0100;PM-016-SNA-0125;PM-016-SNA-0160;PM-016-SYA-0010;PM-016-SYA-0025;PM-016-SYA-0050;PM-016-SYA-0080;PM-016-SYA-0100;PM-016-SYA-0125;PM-016-SYA-0160;PM-016-SYA-0200;PM-016-SYA-0250;PM-016-SYA-0320;PM-020-DNA-0010;PM-020-DNA-0025;PM-020-DNA-0050;PM-020-DNA-0080;PM-020-DNA-0100;PM-020-DNA-0125;PM-020-DNA-0160;PM-020-DNA-0200;PM-020-DNA-0250;PM-020-DNA-0320;PM-020-DNA-0400;PM-020-DNA-0500;PM-020-DYA-0010;PM-020-DYA-0025;PM-020-DYA-0050;PM-020-DYA-0080;PM-020-DYA-0100;PM-020-DYA-0125;PM-020-DYA-0160;PM-020-DYA-0200;PM-020-DYA-0250;PM-020-DYA-0320;PM-020-DYA-0500;PM-020-FSNA-0010;PM-020-FSNA-0025;PM-020-FSNA-0050;PM-020-RSNA-0010;PM-020-RSNA-0025;PM-020-RSNA-0050;PM-020-SNA-0010;PM-020-SNA-0025;PM-020-SNA-0050;PM-020-SNA-0080;PM-020-SNA-0100;PM-020-SNA-0125;PM-020-SNA-0160;PM-020-SYA-0010;PM-020-SYA-0025;PM-020-SYA-0050;PM-020-SYA-0080;PM-020-SYA-0100;PM-020-SYA-0125;PM-020-SYA-0160;PM-020-SYA-0200;PM-020-SYA-0250;PM-020-SYA-0320;PM-025-DNA-0010;PM-025-DNA-0025;PM-025-DNA-0050;PM-025-DNA-0080;PM-025-DNA-0100;PM-025-DNA-0125;PM-025-DNA-0160;PM-025-DNA-0200;PM-025-DNA-0250;PM-025-DNA-0320;PM-025-DNA-0400;PM-025-DNA-0500;PM-025-DYA-0010;PM-025-DYA-0025;PM-025-DYA-0050;PM-025-DYA-0080;PM-025-DYA-0100;PM-025-DYA-0125;PM-025-DYA-0160;PM-025-DYA-0200;PM-025-DYA-0250;PM-025-DYA-0320;PM-025-DYA-0500;PM-025-FSNA-0010;PM-025-FSNA-0025;PM-025-FSNA-0050;PM-025-RSNA-0010;PM-025-RSNA-0025;PM-025-RSNA-0050;PM-025-SNA-0010;PM-025-SNA-0025;PM-025-SNA-0050;PM-025-SNA-0080;PM-025-SNA-0100;PM-025-SNA-0125;PM-025-SNA-0160;PM-025-SYA-0010;PM-025-SYA-0025;PM-025-SYA-0050;PM-025-SYA-0080;PM-025-SYA-0100;PM-025-SYA-0125;PM-025-SYA-0160;PM-025-SYA-0200;PM-025-SYA-0250;PM-025-SYA-0320'.split(
    ';'
  )

const seriler = [
  {
    seri: 'PAG',
    stokAdet: 154,
    tipler: [{ kod: 'SN', tr: 'manyetik pistonlu, yastıklı', en: 'magnetic piston, cushioned', ru: 'магнитный поршень, с демпфированием' }],
    caplar: CAP_ISO,
    stroklar: STROK_UZUN,
    tamMatris: true,
    kodlar: CAP_ISO.flatMap((c) => STROK_UZUN.map((s) => kodUret('PAG', 'SN', c, s))),
    aciklama: {
      tr: 'ISO 15552 profil gövdeli standart pnömatik silindir. Katalogdaki en çok stokladığımız Pemaks serisi.',
      en: 'Standard pneumatic cylinder with an ISO 15552 profile body. The Pemaks series we stock most deeply.',
      ru: 'Стандартный пневмоцилиндр с профильным корпусом ISO 15552. Серия Pemaks, которую мы держим на складе шире всего.',
    },
  },
  {
    seri: 'DMC',
    stokAdet: 154,
    tipler: [{ kod: 'SYA', tr: 'manyetik pistonlu, yastıklı, çift etkili', en: 'magnetic piston, cushioned, double-acting', ru: 'магнитный поршень, с демпфированием, двустороннего действия' }],
    caplar: CAP_ISO,
    stroklar: STROK_UZUN,
    tamMatris: true,
    kodlar: CAP_ISO.flatMap((c) => STROK_UZUN.map((s) => kodUret('DMC', 'SYA', c, s))),
    aciklama: {
      tr: 'ISO 15552 ölçülerinde manyetik yastıklı silindir. PAG ile aynı ölçü matrisinde, farklı gövde ailesi.',
      en: 'Magnetic, cushioned cylinder to ISO 15552 dimensions. Same size matrix as PAG, a different body family.',
      ru: 'Магнитный демпфированный цилиндр в размерах ISO 15552. Та же размерная матрица, что у PAG, другое семейство корпуса.',
    },
  },
  {
    seri: 'PM',
    stokAdet: 93,
    tipler: [
      { kod: 'SNA', tr: 'tek milli, manyetik', en: 'single rod, magnetic', ru: 'односторонний шток, магнитный' },
      { kod: 'SYA', tr: 'tek milli, manyetik, yastıklı', en: 'single rod, magnetic, cushioned', ru: 'односторонний шток, магнитный, демпфированный' },
      { kod: 'DNA', tr: 'çift milli, manyetik', en: 'double rod, magnetic', ru: 'двусторонний шток, магнитный' },
      { kod: 'DYA', tr: 'çift milli, manyetik, yastıklı', en: 'double rod, magnetic, cushioned', ru: 'двусторонний шток, магнитный, демпфированный' },
      { kod: 'FSNA', tr: 'ön flanşlı', en: 'front flange', ru: 'с передним фланцем' },
      { kod: 'RSNA', tr: 'arka flanşlı', en: 'rear flange', ru: 'с задним фланцем' },
    ],
    caplar: [8, 10, 12, 16, 20, 25],
    stroklar: [10, 25, 50, 80, 100, 125, 160, 200, 250, 320, 400, 500],
    tamMatris: false,
    kodlar: PM_KODLARI,
    aciklama: {
      tr: 'Kalem (mini) silindir. Küçük çaplarda, dar montaj yerlerinde kullanılır. Ölçü matrisi seyrektir — her çap her tipte ve her strokta üretilmez, aşağıdaki liste gerçekte var olan kodlardır.',
      en: 'Pen (mini) cylinder for small bores and tight installations. The size matrix is sparse — not every bore exists in every type and stroke, so the list below is of codes that actually exist.',
      ru: 'Мини-цилиндр («карандашный») для малых диаметров и стеснённого монтажа. Размерная матрица разрежена — не каждый диаметр выпускается в каждом типе и ходе, поэтому ниже перечислены реально существующие коды.',
    },
  },
]

const cikti = [
  {
    kategori: 'pnomatik-silindir',
    marka: 'Pemaks',
    markaSlug: 'pemaks',
    kodDeseni: 'SERİ-ÇAP-TİP-STROK',
    kodOrnek: 'PAG-100-SN-0320',
    seriler,
  },
]

// Doğrulama: tam matris iddiası aritmetikle tutmalı.
for (const g of cikti) {
  for (const s of g.seriler) {
    if (s.tamMatris) {
      const beklenen = s.caplar.length * s.stroklar.length * s.tipler.length
      if (s.kodlar.length !== beklenen) {
        throw new Error(`${s.seri}: tamMatris iddiası tutmuyor (${s.kodlar.length} ≠ ${beklenen})`)
      }
    }
    if (new Set(s.kodlar).size !== s.kodlar.length) throw new Error(`${s.seri}: çift kod var`)
  }
}

writeFileSync('/home/user/hidroteknik-catalog/data/uretici-kodlari.json', JSON.stringify(cikti, null, 1) + '\n')
const toplam = cikti.reduce((a, g) => a + g.seriler.reduce((b, s) => b + s.kodlar.length, 0), 0)
console.log(`${cikti.length} grup · ${cikti[0].seriler.length} seri · ${toplam} üretici kodu`)
for (const s of seriler) console.log(`  ${s.seri.padEnd(5)} ${String(s.kodlar.length).padStart(4)} kod · ${s.stokAdet} stok kartı · tamMatris=${s.tamMatris}`)
