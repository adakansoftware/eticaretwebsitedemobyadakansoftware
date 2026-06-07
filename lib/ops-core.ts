export type OpsStatusInput = {
  lowStockProducts: number;
  stuckOrders: number;
  staleOutboxEvents: number;
  deadOutboxEvents: number;
  recentRateLimitBlocks: number;
  rateLimitAlertThreshold: number;
  expiredPasswordResetTokens: number;
  staleReplayGuards: number;
  missingSiteSettings: boolean;
  missingAdminUsers: boolean;
};

export type OpsSignal = {
  name: string;
  ok: boolean;
  detail?: string;
};

export function summarizeOpsStatus(input: OpsStatusInput) {
  const signals: OpsSignal[] = [
    {
      name: "low_stock",
      ok: input.lowStockProducts === 0,
      detail:
        input.lowStockProducts > 0
          ? `${input.lowStockProducts} urun dusuk stok sinirinda veya altinda`
          : undefined
    },
    {
      name: "stuck_orders",
      ok: input.stuckOrders === 0,
      detail:
        input.stuckOrders > 0
          ? `${input.stuckOrders} siparis beklenen sureden uzun suredir ilerlemiyor`
          : undefined
    },
    {
      name: "stale_outbox_events",
      ok: input.staleOutboxEvents === 0,
      detail:
        input.staleOutboxEvents > 0
          ? `${input.staleOutboxEvents} outbox olayi beklenenden uzun suredir islenmedi`
          : undefined
    },
    {
      name: "dead_outbox_events",
      ok: input.deadOutboxEvents === 0,
      detail:
        input.deadOutboxEvents > 0
          ? `${input.deadOutboxEvents} outbox olayi maksimum deneme sayisina ulasti`
          : undefined
    },
    {
      name: "rate_limit_blocks",
      ok: input.recentRateLimitBlocks < input.rateLimitAlertThreshold,
      detail:
        input.recentRateLimitBlocks >= input.rateLimitAlertThreshold
          ? `Son pencerede ${input.recentRateLimitBlocks} rate-limit blok olayi var`
          : undefined
    },
    {
      name: "expired_password_resets",
      ok: input.expiredPasswordResetTokens === 0,
      detail:
        input.expiredPasswordResetTokens > 0
          ? `${input.expiredPasswordResetTokens} temizlenmemis parola sifirlama kaydi var`
          : undefined
    },
    {
      name: "stale_replay_guards",
      ok: input.staleReplayGuards === 0,
      detail:
        input.staleReplayGuards > 0
          ? `${input.staleReplayGuards} temizlenmemis replay guard kaydi var`
          : undefined
    },
    {
      name: "site_settings",
      ok: !input.missingSiteSettings,
      detail: input.missingSiteSettings ? "Site ayarlari kaydi eksik" : undefined
    },
    {
      name: "admin_users",
      ok: !input.missingAdminUsers,
      detail: input.missingAdminUsers ? "En az bir admin kullanici bulunmuyor" : undefined
    }
  ];

  return {
    ok: signals.every((signal) => signal.ok),
    signals
  };
}
