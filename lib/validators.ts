import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, "Ad en az 2 karakter olmalı"),
  email: z.string().email("Geçerli e-posta gir"),
  password: z.string().min(8, "Şifre en az 8 karakter olmalı")
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export const cartQuantitySchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1).max(99)
});

export const checkoutSchema = z.object({
  addressId: z.string().min(1),
  paymentMethod: z.enum(["BANK_TRANSFER", "CASH_ON_DELIVERY"]),
  customerNote: z.string().max(500).optional()
});

export const productAdminSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  description: z.string().min(10),
  shortDescription: z.string().optional(),
  price: z.coerce.number().positive(),
  compareAtPrice: z.coerce.number().positive().optional(),
  sku: z.string().min(2),
  stock: z.coerce.number().int().min(0),
  isActive: z.coerce.boolean().default(true),
  isFeatured: z.coerce.boolean().default(false),
  categoryId: z.string().min(1),
  brandId: z.string().optional()
});
