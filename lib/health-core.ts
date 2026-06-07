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
    }
  ];
}
