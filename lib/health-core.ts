export type HealthIndicator = {
  name: string;
  ok: boolean;
  detail?: string;
};

type EnvHealthInput = {
  authSecret: string;
  siteUrl: string;
  smtpHost?: string;
  smtpUser?: string;
  smtpPass?: string;
  smtpFrom?: string;
  uploadStorageDriver?: "local" | "s3";
  uploadPublicBaseUrl?: string;
  uploadS3Endpoint?: string;
  uploadS3Region?: string;
  nodeEnv?: string;
};

export function summarizeHealth(indicators: HealthIndicator[]) {
  return {
    ok: indicators.every((indicator) => indicator.ok),
    indicators
  };
}

export function getEnvHealthIndicatorsFromConfig(input: EnvHealthInput): HealthIndicator[] {
  return [
    {
      name: "auth_secret",
      ok:
        input.nodeEnv !== "production" ||
        input.authSecret !== "change-this-long-random-secret-min-32-chars",
      detail:
        input.nodeEnv === "production" &&
        input.authSecret === "change-this-long-random-secret-min-32-chars"
          ? "Varsayilan secret production icin gecersiz"
          : undefined
    },
    {
      name: "site_url",
      ok: Boolean(input.siteUrl)
    },
    {
      name: "smtp",
      ok: !input.smtpHost || Boolean(input.smtpUser && input.smtpPass && input.smtpFrom),
      detail:
        input.smtpHost && !(input.smtpUser && input.smtpPass && input.smtpFrom)
          ? "SMTP konfigurasyonu eksik"
          : undefined
    },
    {
      name: "upload_storage",
      ok:
        input.uploadStorageDriver !== "s3" ||
        Boolean(
          (input.uploadPublicBaseUrl && input.uploadPublicBaseUrl.length > 0) ||
            (input.uploadS3Endpoint && input.uploadS3Endpoint.length > 0) ||
            (input.uploadS3Region && input.uploadS3Region.length > 0)
        ),
      detail:
        input.uploadStorageDriver === "s3" &&
          !input.uploadPublicBaseUrl &&
          !input.uploadS3Endpoint &&
          !input.uploadS3Region
          ? "S3 driver icin endpoint veya public base URL tanimlanmali"
          : input.uploadStorageDriver === "s3"
            ? "S3-compatible object storage aktif"
            : "Local upload storage aktif"
    }
  ];
}
