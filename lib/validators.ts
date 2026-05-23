import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, "Ad en az 2 karakter olmali"),
  email: z.string().email("Gecerli e-posta gir"),
  password: z.string().min(8, "Sifre en az 8 karakter olmali")
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Gecerli bir e-posta adresi gir")
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(32, "Sifirlama baglantisi gecersiz"),
    newPassword: z.string().min(8, "Sifre en az 8 karakter olmali"),
    confirmPassword: z.string().min(8, "Sifre tekrari en az 8 karakter olmali")
  })
  .superRefine((value, ctx) => {
    if (value.newPassword !== value.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmPassword"],
        message: "Sifre tekrari yeni sifre ile ayni olmali"
      });
    }
  });

export const cartQuantitySchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1).max(99)
});

export const cartItemIdSchema = z.object({
  itemId: z.string().min(1, "Sepet urunu bulunamadi")
});

export const cartItemUpdateSchema = z.object({
  itemId: z.string().min(1, "Sepet urunu bulunamadi"),
  quantity: z.coerce.number().int().min(1, "Adet en az 1 olmali").max(99, "En fazla 99 adet secilebilir")
});

export const couponCodeSchema = z.object({
  couponCode: z
    .string()
    .max(32, "Kupon kodu en fazla 32 karakter olabilir")
    .optional()
    .transform((value) => value?.trim().toUpperCase() || undefined)
});

export const checkoutSchema = z.object({
  addressId: z.string().min(1),
  paymentMethod: z.enum(["BANK_TRANSFER", "CASH_ON_DELIVERY"]),
  customerNote: z.string().max(500).optional(),
  couponCode: z
    .string()
    .max(32)
    .optional()
    .transform((value) => value?.trim().toUpperCase() || undefined)
});

export const addressSchema = z.object({
  title: z.string().min(2, "Adres basligi en az 2 karakter olmali"),
  fullName: z.string().min(2, "Ad soyad en az 2 karakter olmali"),
  phone: z.string().min(10, "Telefon numarasi gecersiz"),
  city: z.string().min(2, "Sehir bilgisi gerekli"),
  district: z.string().min(2, "Ilce bilgisi gerekli"),
  address: z.string().min(10, "Adres detayi en az 10 karakter olmali"),
  postalCode: z.string().max(12).optional(),
  isDefault: z
    .union([z.literal("on"), z.literal("true"), z.literal("false"), z.literal("")])
    .optional()
    .transform((value) => value === "on" || value === "true")
});

export const productAdminSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  description: z.string().min(10),
  shortDescription: z.string().optional().transform((value) => value || undefined),
  seoTitle: z.string().max(70).optional().transform((value) => value || undefined),
  seoDescription: z.string().max(160).optional().transform((value) => value || undefined),
  barcode: z.string().max(64).optional().transform((value) => value || undefined),
  price: z.coerce.number().positive(),
  salePrice: z
    .union([z.coerce.number().positive(), z.literal("")])
    .optional()
    .transform((value) => (value === "" || value === undefined ? undefined : value)),
  compareAtPrice: z
    .union([z.coerce.number().positive(), z.literal("")])
    .optional()
    .transform((value) => (value === "" || value === undefined ? undefined : value)),
  sku: z.string().min(2),
  stock: z.coerce.number().int().min(0),
  lowStockThreshold: z.coerce.number().int().min(0).default(5),
  isActive: z.coerce.boolean().default(true),
  isFeatured: z.coerce.boolean().default(false),
  categoryId: z.string().min(1),
  brandId: z.string().optional().transform((value) => value || undefined),
  imageUrl: z
    .string()
    .url("Gecerli bir gorsel URL gir")
    .or(z.literal(""))
    .optional()
    .transform((value) => (value === "" || value === undefined ? undefined : value))
});

export const categoryAdminSchema = z.object({
  name: z.string().min(2, "Kategori adi en az 2 karakter olmali"),
  slug: z.string().optional().transform((value) => value?.trim() || undefined),
  description: z.string().max(500).optional().transform((value) => value || undefined),
  seoTitle: z.string().max(70).optional().transform((value) => value || undefined),
  seoDescription: z.string().max(160).optional().transform((value) => value || undefined),
  imageUrl: z
    .string()
    .url("Gecerli bir kategori gorsel URL gir")
    .or(z.literal(""))
    .optional()
    .transform((value) => (value === "" || value === undefined ? undefined : value)),
  isActive: z.coerce.boolean().default(true)
});

export const brandAdminSchema = z.object({
  name: z.string().min(2, "Marka adi en az 2 karakter olmali"),
  slug: z.string().optional().transform((value) => value?.trim() || undefined),
  description: z.string().max(500).optional().transform((value) => value || undefined),
  seoTitle: z.string().max(70).optional().transform((value) => value || undefined),
  seoDescription: z.string().max(160).optional().transform((value) => value || undefined),
  imageUrl: z
    .string()
    .url("Gecerli bir marka gorsel URL gir")
    .or(z.literal(""))
    .optional()
    .transform((value) => (value === "" || value === undefined ? undefined : value)),
  isActive: z.coerce.boolean().default(true)
});

export const couponAdminSchema = z
  .object({
    code: z
      .string()
      .min(3, "Kupon kodu en az 3 karakter olmali")
      .max(32)
      .transform((value) => value.trim().toUpperCase()),
    type: z.enum(["PERCENTAGE", "FIXED_AMOUNT"]),
    value: z.coerce.number().positive("Kupon degeri sifirdan buyuk olmali"),
    minOrderAmount: z
      .union([z.coerce.number().nonnegative(), z.literal("")])
      .optional()
      .transform((value) => (value === "" || value === undefined ? undefined : value)),
    usageLimit: z
      .union([z.coerce.number().int().positive(), z.literal("")])
      .optional()
      .transform((value) => (value === "" || value === undefined ? undefined : value)),
    description: z.string().max(300).optional().transform((value) => value || undefined),
    startsAt: z.string().optional().transform((value) => value || undefined),
    endsAt: z.string().optional().transform((value) => value || undefined),
    isActive: z.coerce.boolean().default(true)
  })
  .superRefine((value, ctx) => {
    if (value.type === "PERCENTAGE" && value.value > 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["value"],
        message: "Yuzdesel kupon 100'den buyuk olamaz"
      });
    }

    if (value.startsAt && value.endsAt && new Date(value.endsAt) < new Date(value.startsAt)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endsAt"],
        message: "Bitis tarihi baslangic tarihinden once olamaz"
      });
    }
  });

export const bannerAdminSchema = z.object({
  title: z.string().min(2, "Banner basligi en az 2 karakter olmali"),
  subtitle: z.string().max(300).optional().transform((value) => value || undefined),
  imageUrl: z.string().url("Gecerli bir banner gorsel URL gir"),
  ctaLabel: z.string().max(40).optional().transform((value) => value || undefined),
  ctaHref: z
    .string()
    .url("Gecerli bir banner linki gir")
    .or(z.literal(""))
    .optional()
    .transform((value) => (value === "" || value === undefined ? undefined : value)),
  sortOrder: z.coerce.number().int().min(0).default(0),
  isActive: z.coerce.boolean().default(true)
});

export const orderAdminSchema = z.object({
  orderId: z.string().min(1, "Siparis bulunamadi"),
  status: z.enum([
    "PENDING",
    "WAITING_PAYMENT",
    "PAID",
    "PREPARING",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
    "REFUNDED"
  ]),
  adminNote: z.string().max(1000).optional().transform((value) => value || undefined),
  paymentStatus: z
    .enum(["WAITING", "CONFIRMED", "REJECTED", "REFUNDED"])
    .optional()
    .transform((value) => value || undefined)
});

export const siteSettingsAdminSchema = z.object({
  siteName: z.string().min(2, "Site adi en az 2 karakter olmali"),
  logoUrl: z
    .string()
    .url("Gecerli bir logo URL gir")
    .or(z.literal(""))
    .optional()
    .transform((value) => (value === "" || value === undefined ? undefined : value)),
  contactPhone: z.string().max(40).optional().transform((value) => value || undefined),
  whatsappNumber: z.string().max(40).optional().transform((value) => value || undefined),
  email: z.string().email("Gecerli e-posta gir").optional().or(z.literal("")).transform((value) => value || undefined),
  address: z.string().max(500).optional().transform((value) => value || undefined),
  instagram: z
    .string()
    .url("Gecerli bir Instagram URL gir")
    .or(z.literal(""))
    .optional()
    .transform((value) => (value === "" || value === undefined ? undefined : value)),
  primaryColor: z
    .string()
    .regex(/^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/, "Gecerli bir HEX renk gir")
    .or(z.literal(""))
    .optional()
    .transform((value) => (value === "" || value === undefined ? undefined : value)),
  shippingFee: z.coerce.number().min(0, "Kargo ucreti negatif olamaz"),
  freeShippingThreshold: z
    .union([z.coerce.number().min(0), z.literal("")])
    .optional()
    .transform((value) => (value === "" || value === undefined ? undefined : value)),
  bankAccountInfo: z.string().max(1000).optional().transform((value) => value || undefined),
  checkoutMessage: z.string().max(500).optional().transform((value) => value || undefined)
});

export const inventoryAdjustmentSchema = z.object({
  productId: z.string().min(1, "Urun secilmedi"),
  direction: z.enum(["INCREASE", "DECREASE"]),
  quantity: z.coerce.number().int().min(1, "Adet en az 1 olmali"),
  reason: z.enum(["ADMIN_ADJUSTMENT", "RETURNED"]),
  note: z.string().min(3, "Aciklayici bir not gir").max(500)
});

export const reviewAdminFilterSchema = z.object({
  rating: z.string().optional(),
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
  q: z.string().optional()
});

export const reviewStatusSchema = z.object({
  reviewId: z.string().min(1, "Yorum bulunamadi"),
  status: z.enum(["PENDING", "APPROVED", "REJECTED"])
});
