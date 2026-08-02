/**
 * Her kategoriden düşülen ortak eleme deseni.
 *
 * TEK KOPYA OLMAK ZORUNDA. Bu desen iki yerde kullanılıyor — `veri-cek.mjs`
 * kalem sayarken, `ornek-denetle.mjs` örnek satırları sınarken — ve ikisi
 * ayrışırsa denetim yalan söyler: veri tazeleme bir kaydı eler, denetçi elemez,
 * sonuç "kategorisine uymayan 0" der ama sayfada o kayıt durur. Eskiden iki ayrı
 * kopyaydı ve 02.08.2026'da gerçekten ayrıştılar.
 *
 * ── NE ELENİR ──────────────────────────────────────────────────────────────
 * 1. MUHTELİF TEZGÂH KARTLARI — adı tek bir cins isminden ibaret, ölçüsü ve
 *    modeli olmayan kayıtlar (`MUH.MUH.26` → "HORTUM"). Listede olmayan bir
 *    kalemi hızlıca satmak için açılmışlar; gerçek ürün değiller. Ölçüldü
 *    (30.07.2026): 16 kart, biri aylık 362 hareketle örnek tablonun en üstüne
 *    çıkıyordu.
 *
 * 2. OPERATÖR İŞARETLERİ — kartın kendisi "beni sil" ya da "adı sonra
 *    yazılacak" diyor. ERP'de açık kalmış not, ürün değil. Ölçüldü
 *    (02.08.2026, kod göçünden sonra): 14 "SİLİNİZ" + 2 yer tutucu.
 *
 * Desendeki her i-türevi harf `[İIiı]` sınıfıyla yazılır; sebebi CLAUDE.md'deki
 * Türkçe ı tuzağı (Postgres `~*` I → ı katlaması yapmaz).
 */
export const GENEL_HARIC = [
  '^ *(PN[ÖO]MAT[İIiı]K |H[İIiı]DROL[İIiı]K |KATR[İIiı]C |K[ÜU]RESEL |KELEBEK |AKT[ÜU]AT[ÖO]R |AKT[ÜU]AT[ÖO]RL[ÜU] )?(HORTUM|RAKOR|REKOR|N[İIiı]PEL|TAPA|VALF|POMPA|VANA|KELEPÇE|KEÇE|CONTA',
  '|S[İIiı]L[İIiı]ND[İIiı]R|NUTR[İIiı]NG|SOKET|ADAPT[ÖO]R|MANOMETRE|BOB[İIiı]N',
  '|F[İIiı]LTRE|SOĞUTUCU|H[İIiı]DROMOTOR|ELEKTR[İIiı]K MOTORU',
  '|TAM[İIiı]R TAK[İIiı]M[İIiı]|KEÇE TAK[İIiı]M[İIiı]|KROM M[İIiı]L)( *\\(.{0,20}\\))? *$',
  '|^ *S[İIiı]L[İIiı]N[İIiı]Z *$',
  '|KOD G[İIiı]R[İIiı]N[İIiı]?[İIiı]?Z',
].join('')
