"use client";

import Image from "next/image";
import { useState } from "react";

type GalleryImage = {
  id: string;
  url: string;
  alt: string;
};

type ProductImageGalleryProps = {
  images: GalleryImage[];
  productName: string;
  discountPercentage: number;
};

const fallbackImage =
  "https://images.unsplash.com/photo-1523275335684-37898b6baf30";

export function ProductImageGallery({
  images,
  productName,
  discountPercentage
}: ProductImageGalleryProps) {
  const galleryImages = images.length > 0 ? images : [{ id: "fallback", url: fallbackImage, alt: productName }];
  const [activeImageId, setActiveImageId] = useState(galleryImages[0]?.id);
  const activeImage =
    galleryImages.find((image) => image.id === activeImageId) ?? galleryImages[0];

  return (
    <div className="overflow-hidden rounded-[2.6rem] border border-slate-200 bg-white/80 p-4 shadow-[0_24px_80px_rgba(15,23,42,0.06)] backdrop-blur">
      <div className="relative aspect-square overflow-hidden rounded-[2rem] bg-gradient-to-br from-stone-100 via-stone-50 to-amber-50">
        <Image
          src={activeImage.url}
          alt={activeImage.alt || productName}
          fill
          sizes="100vw"
          priority
          className="object-cover"
        />
        {discountPercentage > 0 ? (
          <div className="absolute left-5 top-5 rounded-full bg-amber-500 px-4 py-2 text-sm font-black text-slate-950">
            %{discountPercentage} indirim
          </div>
        ) : null}
      </div>

      {galleryImages.length > 1 ? (
        <div className="mt-4 grid grid-cols-4 gap-3">
          {galleryImages.map((image) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setActiveImageId(image.id)}
              className={`relative aspect-square overflow-hidden rounded-[1.3rem] border transition ${
                image.id === activeImage.id
                  ? "border-emerald-700 shadow-[0_0_0_3px_rgba(4,120,87,0.12)]"
                  : "border-slate-200"
              }`}
            >
              <Image
                src={image.url}
                alt={image.alt || productName}
                fill
                sizes="160px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
