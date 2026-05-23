type PriceLike = {
  price: number | string | { toString(): string };
  salePrice?: number | string | { toString(): string } | null;
};

type VariantPriceLike = {
  priceDiff?: number | string | { toString(): string } | null;
};

export function getEffectiveUnitPrice(product: PriceLike) {
  const salePrice = product.salePrice == null ? null : Number(product.salePrice);
  const price = Number(product.price);
  return salePrice && salePrice > 0 ? salePrice : price;
}

export function getVariantUnitPrice(product: PriceLike, variant?: VariantPriceLike | null) {
  return getEffectiveUnitPrice(product) + Number(variant?.priceDiff ?? 0);
}

export function getDiscountPercentage(
  price: number | string | { toString(): string },
  compareAtPrice?: number | string | { toString(): string } | null
) {
  const current = Number(price);
  const compare = Number(compareAtPrice ?? 0);
  if (!compare || compare <= current) return 0;
  return Math.round(((compare - current) / compare) * 100);
}
