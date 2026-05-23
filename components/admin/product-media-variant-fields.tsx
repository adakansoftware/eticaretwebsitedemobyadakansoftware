"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import { Input } from "@/components/ui/input";

type VariantRow = {
  name: string;
  value: string;
  sku: string;
  barcode: string;
  stock: number | "";
  priceDiff: number | "";
};

type ProductMediaVariantFieldsProps = {
  defaultImageUrls?: string[];
  defaultVariants?: VariantRow[];
};

const inputClass =
  "border-white/10 bg-slate-950/80 text-white placeholder:text-slate-500 ring-white/10";

export function ProductMediaVariantFields({
  defaultImageUrls = [""],
  defaultVariants = []
}: ProductMediaVariantFieldsProps) {
  const [imageUrls, setImageUrls] = useState(defaultImageUrls.length > 0 ? defaultImageUrls : [""]);
  const [variants, setVariants] = useState<VariantRow[]>(defaultVariants);

  return (
    <div className="grid gap-6">
      <div className="rounded-[1.6rem] border border-white/10 bg-slate-950/45 p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-white">Urun galerisi</p>
            <p className="mt-1 text-xs text-slate-400">Birden fazla gorsel ekleyip sirali vitrin kur.</p>
          </div>
          <Button
            type="button"
            variant="outline"
            className="border-white/10 bg-white/5 text-white hover:bg-white/10"
            onClick={() => setImageUrls((current) => [...current, ""])}
          >
            <Plus className="mr-2 h-4 w-4" />
            Gorsel ekle
          </Button>
        </div>

        <div className="mt-4 grid gap-4">
          {imageUrls.map((imageUrl, index) => (
            <div key={`image-${index}`} className="rounded-[1.4rem] border border-white/10 p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <ImageUploadField
                    name="imageUrls"
                    folder="products"
                    placeholder="https://..."
                    defaultValue={imageUrl}
                  />
                </div>
                {imageUrls.length > 1 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-rose-200 hover:bg-rose-500/10 hover:text-rose-100"
                    onClick={() =>
                      setImageUrls((current) => current.filter((_, currentIndex) => currentIndex !== index))
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[1.6rem] border border-white/10 bg-slate-950/45 p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-white">Varyantlar</p>
            <p className="mt-1 text-xs text-slate-400">Renk, beden veya tek boyutlu secenekleri burada yonet.</p>
          </div>
          <Button
            type="button"
            variant="outline"
            className="border-white/10 bg-white/5 text-white hover:bg-white/10"
            onClick={() =>
              setVariants((current) => [
                ...current,
                { name: "", value: "", sku: "", barcode: "", stock: "", priceDiff: "" }
              ])
            }
          >
            <Plus className="mr-2 h-4 w-4" />
            Varyant ekle
          </Button>
        </div>

        {variants.length > 0 ? (
          <div className="mt-4 grid gap-4">
            {variants.map((variant, index) => (
              <div key={`variant-${index}`} className="rounded-[1.4rem] border border-white/10 p-4">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <p className="text-sm font-bold text-white">Varyant {index + 1}</p>
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-rose-200 hover:bg-rose-500/10 hover:text-rose-100"
                    onClick={() => setVariants((current) => current.filter((_, currentIndex) => currentIndex !== index))}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Kaldir
                  </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <Input name="variantNames" placeholder="Varyant grubu" defaultValue={variant.name} className={inputClass} />
                  <Input name="variantValues" placeholder="Deger" defaultValue={variant.value} className={inputClass} />
                  <Input name="variantSkus" placeholder="Varyant SKU" defaultValue={variant.sku} className={inputClass} />
                  <Input name="variantBarcodes" placeholder="Varyant barcode" defaultValue={variant.barcode} className={inputClass} />
                  <Input
                    name="variantStocks"
                    type="number"
                    placeholder="Stok"
                    defaultValue={variant.stock}
                    className={inputClass}
                  />
                  <Input
                    name="variantPriceDiffs"
                    type="number"
                    step="0.01"
                    placeholder="Fiyat farki"
                    defaultValue={variant.priceDiff}
                    className={inputClass}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-[1.4rem] border border-dashed border-white/10 px-4 py-5 text-sm text-slate-400">
            Bu urun tek varyantsa bos birakabilirsin.
          </div>
        )}
      </div>
    </div>
  );
}
