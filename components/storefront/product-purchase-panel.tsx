"use client";

import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { addToCartAction } from "@/lib/actions/cart-actions";
import { getVariantUnitPrice } from "@/lib/commerce";
import { formatPrice } from "@/lib/utils";

type ProductPurchasePanelProps = {
  productId: string;
  productSlug: string;
  productPrice: number;
  productSalePrice?: number | null;
  productStock: number;
  variants: Array<{
    id: string;
    name: string;
    value: string;
    sku: string;
    stock: number;
    priceDiff: number;
  }>;
};

export function ProductPurchasePanel({
  productId,
  productSlug,
  productPrice,
  productSalePrice,
  productStock,
  variants
}: ProductPurchasePanelProps) {
  const [pending, startTransition] = useTransition();
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(variants[0]?.id ?? null);
  const hasSingleVariantGroup = new Set(variants.map((variant) => variant.name)).size <= 1;

  const selectedVariant = useMemo(
    () => variants.find((variant) => variant.id === selectedVariantId) ?? null,
    [selectedVariantId, variants]
  );

  const unitPrice = getVariantUnitPrice(
    { price: productPrice, salePrice: productSalePrice },
    selectedVariant ? { priceDiff: selectedVariant.priceDiff } : null
  );
  const availableStock = selectedVariant?.stock ?? productStock;
  const canAddToCart = variants.length === 0 ? availableStock > 0 : Boolean(selectedVariant && availableStock > 0);

  return (
    <div className="mt-8 grid max-w-md gap-4">
      {variants.length > 0 ? (
        <div className="rounded-[1.7rem] border border-slate-200 bg-slate-50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-slate-500">
                Varyant secimi
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {selectedVariant
                  ? `${selectedVariant.name}: ${selectedVariant.value}`
                  : "Sepete eklemek icin varyant sec"}
              </p>
            </div>
            <p className="text-lg font-black text-slate-950">{formatPrice(unitPrice)}</p>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {variants.map((variant) => (
              <button
                key={variant.id}
                type="button"
                onClick={() => setSelectedVariantId(variant.id)}
                className={`rounded-full border px-4 py-2 text-sm font-bold transition ${
                  variant.id === selectedVariantId
                    ? "border-emerald-700 bg-emerald-700 text-white"
                    : "border-slate-200 bg-white text-slate-900 hover:border-emerald-400"
                }`}
              >
                {hasSingleVariantGroup ? variant.value : `${variant.name}: ${variant.value}`}
              </button>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
            <span>SKU: {selectedVariant?.sku ?? productSlug}</span>
            <span>{availableStock > 0 ? `${availableStock} stokta` : "Stokta yok"}</span>
          </div>
        </div>
      ) : null}

      <Button
        className="w-full"
        disabled={pending || !canAddToCart}
        onClick={() =>
          startTransition(async () => {
            await addToCartAction(productId, 1, selectedVariant?.id);
          })
        }
      >
        {pending ? "Ekleniyor..." : variants.length > 0 ? "Secili varyanti sepete ekle" : "Sepete ekle"}
      </Button>
    </div>
  );
}
