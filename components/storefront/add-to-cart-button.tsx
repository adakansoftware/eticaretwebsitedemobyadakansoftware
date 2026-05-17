"use client";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { addToCartAction } from "@/lib/actions/cart-actions";

export function AddToCartButton({ productId }: { productId: string }) {
  const [pending, startTransition] = useTransition();
  return <Button className="w-full" disabled={pending} onClick={() => startTransition(async () => { await addToCartAction(productId, 1); })}>{pending ? "Ekleniyor..." : "Sepete ekle"}</Button>;
}
