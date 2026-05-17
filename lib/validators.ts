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
    .transform((value) => value?.trim() || undefined)
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
