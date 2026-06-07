# Adakan Commerce Core

Bu repo artık yalnızca vitrin odaklı bir demo değil; auth, checkout, stok, admin operasyonları ve verify hattı sertleştirilmiş bir e-ticaret çekirdeği olarak düzenlenmiştir.

## Üretim odaklı öne çıkanlar

- Trusted-origin koruması ve request-id taşıyan proxy katmanı
- Güçlendirilmiş session/JWT ayarları
- Auth, checkout, upload ve admin mutasyonlarında rate-limit
- Checkout replay guard ile duplicate order azaltma
- Varyant bazlı stok düşümü ve iade/iptal stok geri yazımı
- Admin audit trail üzerinde request-id izi
- `live` ve `ready` health endpointleri
- Ops cleanup ve preflight scriptleri
- Birleşik `verify` hattı
- Unit-benzeri davranış testleri ve Playwright E2E paketi

## Stack

- Next.js App Router
- TypeScript
- Prisma + PostgreSQL
- Server Actions ve Route Handlers
- Zod
- Playwright

## Kurulum

```powershell
npm install
npx prisma generate
npx prisma migrate deploy
npm run prisma:seed
npm run dev
```

## Temel komutlar

```powershell
npm run lint
npm run typecheck
npm run test
npm run build
npm run verify
npm run e2e
npm run ops:preflight
npm run ops:assert
npm run ops:report
npm run ops:cleanup:dry
```

`npm run ops:cleanup:apply` operasyonel veri temizliği yapar; üretimde kontrollü kullanılmalıdır.

## Health endpointleri

- `GET /api/health/live`
- `GET /api/health/ready`
- `GET /api/health/ops`

`ready` çıktısı env, veritabanı ve kritik tablo kontrollerini döner. Yanıtlar `x-request-id` header’ı taşır.

## Güvenlik notları

- `AUTH_SECRET` uzun ve benzersiz olmalı
- `TRUSTED_ORIGINS` üretim domainleriyle doldurulmalı
- Admin mutasyonları hem auth hem trusted-origin hem rate-limit katmanından geçer
- Checkout create akışı duplicate submit’e karşı replay guard kullanır

## Sentry ve deploy

- Sentry istege bagli ve env-gated calisir; `SENTRY_DSN` veya `NEXT_PUBLIC_SENTRY_DSN` yoksa sessiz no-op kalir.
- `.github/workflows` altinda `CI`, `Ops Cron`, `Backup Drill`, `Deploy Staging` ve `Deploy Production` workflow’lari vardir.
- Staging/prod deploy icin `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, uygun ortam `DATABASE_URL`, `AUTH_SECRET`, `NEXT_PUBLIC_SITE_URL` ve gerekiyorsa Sentry secret’lari tanimlanmalidir.

## Operasyon rehberi

Ayrıntılı üretim adımları için:

- [OPERATIONS.md](C:/Users/adaka/Desktop/aktif%20projeler/eticaretdemobyadakansofttware/OPERATIONS.md)
- [STRENGTHENING.md](C:/Users/adaka/Desktop/aktif%20projeler/eticaretdemobyadakansofttware/STRENGTHENING.md)

## Seed politikası

- Demo seed sadece development / kontrollü test ortamı içindir
- Production’da seed çalıştırılmamalı

## Demo hesaplar

```txt
Admin
admin@adakancommerce.com
Admin12345

Customer
musteri@adakancommerce.com
User12345
```
