"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toggleWishlistAction } from "@/lib/actions/wishlist-actions";

type WishlistButtonProps = {
  productId: string;
  productSlug: string;
  isAuthenticated: boolean;
  isWishlisted: boolean;
};

export function WishlistButton({
  productId,
  productSlug,
  isAuthenticated,
  isWishlisted
}: WishlistButtonProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (!isAuthenticated) {
    return (
      <Button asChild variant="outline" className="w-full">
        <Link href="/login">Favori icin giris yap</Link>
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant={isWishlisted ? "default" : "outline"}
      className="w-full"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await toggleWishlistAction(productId, productSlug);
          router.refresh();
        })
      }
    >
      <Heart className={`mr-2 h-4 w-4 ${isWishlisted ? "fill-current" : ""}`} />
      {pending ? "Guncelleniyor..." : isWishlisted ? "Favorilerden cikar" : "Favorilere ekle"}
    </Button>
  );
}
