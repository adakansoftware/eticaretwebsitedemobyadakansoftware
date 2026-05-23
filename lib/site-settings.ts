import { cache } from "react";
import { prisma } from "@/lib/prisma";

export const getSiteSettings = cache(async () => {
  return prisma.siteSettings.findFirst({
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
});
