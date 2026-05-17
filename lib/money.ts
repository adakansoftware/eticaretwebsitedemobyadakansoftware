const DEFAULT_CURRENCY = "TRY";
const DEFAULT_LOCALE = "tr-TR";

export function formatMoney(value: number | string, currency = DEFAULT_CURRENCY, locale = DEFAULT_LOCALE) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency
  }).format(Number(value));
}

export function toNumber(value: number | string | null | undefined) {
  return Number(value ?? 0);
}
