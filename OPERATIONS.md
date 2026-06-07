# Operations Runbook

## Production checklist

- `AUTH_SECRET` üretim için döndürülmüş ve benzersiz mi
- `TRUSTED_ORIGINS` gerçek domainlerle tanımlı mı
- `NEXT_PUBLIC_SITE_URL` canlı origin’e işaret ediyor mu
- SMTP bilgileri test edildi mi
- `npx prisma migrate deploy` çalıştı mı
- son `npm run verify` ve `npm run e2e` geçti mi
- yedekleme ve restore prosedürü hazır mı
- admin audit log ve rate-limit tabloları izleniyor mu

## Deploy sırası

1. `npm install`
2. `npx prisma generate`
3. `npx prisma migrate deploy`
4. `npm run verify`
5. `npm run build`
6. uygulamayı ayağa kaldır
7. `GET /api/health/live`
8. `GET /api/health/ready`

9. `npm run ops:status`

## Ops status

HÄ±zlÄ± operasyon Ã¶zeti:

```powershell
npm run ops:status
```

Bu Ã¶zet ÅŸu sinyalleri raporlar:

- dÃ¼ÅŸÃ¼k stokta aktif Ã¼rÃ¼n sayÄ±sÄ±
- beklenenden uzun sÃ¼re aÃ§Ä±k kalan sipariÅŸler
- son penceredeki rate-limit blok olayÄ± sayÄ±sÄ±
- temizlenmemiÅŸ password reset token kayÄ±tlarÄ±
- temizlenmemiÅŸ replay guard kayÄ±tlarÄ±
- site settings ve admin kullanÄ±cÄ± varlÄ±ÄŸÄ±

## Cleanup / retention

Ön izleme:

```powershell
npm run ops:cleanup:dry
```

Uygulama:

```powershell
npm run ops:cleanup:apply
```

Temizlenen alanlar:

- eski admin audit kayıtları
- süresi geçmiş rate-limit kayıtları
- süresi geçmiş replay guard kayıtları
- eski password reset token’ları

## Backup / restore

- PostgreSQL yedeğini uygulama deploy’undan bağımsız periyodik alın
- migration öncesi snapshot alın
- restore sonrası `GET /api/health/ready` ile kontrol edin

## Incident notları

- checkout duplicate şüphesi varsa `OperationReplayGuard` ve ilgili `Order` kayıtlarını birlikte inceleyin
- admin operasyon şüphesinde `AdminAuditLog.requestId` üzerinden log korelasyonu yapın
- abuse şüphesinde `ActionRateLimit` tablolarını scope bazında inceleyin
