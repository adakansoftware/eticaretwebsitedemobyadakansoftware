import { cache } from "react";
import { prisma } from "@/lib/prisma";

export const getSiteSettings = cache(async () => {
  const settings = await prisma.siteSettings.findFirst({
    select: {
      siteName: true,
      contactPhone: true,
      whatsappNumber: true,
      email: true,
      address: true,
      instagram: true,
      checkoutMessage: true,
      bankAccountInfo: true,
      shippingFee: true,
      freeShippingThreshold: true
    }
  });

  if (!settings) {
    return null;
  }

  return {
    ...settings,
    shippingFee: settings.shippingFee ? Number(settings.shippingFee) : 0,
    freeShippingThreshold: settings.freeShippingThreshold
      ? Number(settings.freeShippingThreshold)
      : null
  };
});
