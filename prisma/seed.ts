import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  await prisma.inventoryLog.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.address.deleteMany();
  await prisma.user.deleteMany();
  await prisma.banner.deleteMany();
  await prisma.siteSettings.deleteMany();

  const passwordHash = await bcrypt.hash("Admin12345", 12);
  const admin = await prisma.user.create({ data: { name: "Adakan Admin", email: "admin@adakancommerce.com", passwordHash, role: "ADMIN", phone: "+90 555 000 00 00" } });
  const user = await prisma.user.create({ data: { name: "Demo Müşteri", email: "musteri@adakancommerce.com", passwordHash: await bcrypt.hash("User12345", 12), role: "USER", phone: "+90 555 111 11 11" } });
  await prisma.address.create({ data: { userId: user.id, title: "Ev", fullName: "Demo Müşteri", phone: "+90 555 111 11 11", city: "Van", district: "İpekyolu", address: "Demo Mahallesi, Core Sokak No: 1", postalCode: "65000", isDefault: true } });

  const accessories = await prisma.category.create({ data: { name: "Telefon Aksesuarları", slug: "telefon-aksesuarlari", description: "Günlük kullanım için premium aksesuarlar" } });
  const office = await prisma.category.create({ data: { name: "Ofis Ürünleri", slug: "ofis-urunleri", description: "Çalışma masası ve üretkenlik ürünleri" } });
  const adakan = await prisma.brand.create({ data: { name: "Adakan Select", slug: "adakan-select" } });
  const nova = await prisma.brand.create({ data: { name: "NovaTech", slug: "novatech" } });

  const products = [
    { name: "Manyetik Premium Telefon Standı", slug: "manyetik-premium-telefon-standi", description: "Alüminyum gövdeli, masa üstü kullanım için sağlam ve premium telefon standı.", shortDescription: "Alüminyum premium stand", price: 749, compareAtPrice: 899, sku: "ADK-STAND-001", stock: 30, isFeatured: true, categoryId: accessories.id, brandId: adakan.id, image: "https://images.unsplash.com/photo-1616348436168-de43ad0db179" },
    { name: "Hızlı Şarj USB-C Kablo", slug: "hizli-sarj-usb-c-kablo", description: "Dayanıklı örgülü yapı, hızlı şarj desteği ve uzun ömürlü uç koruması.", shortDescription: "Örgülü USB-C kablo", price: 349, compareAtPrice: 449, sku: "ADK-CABLE-001", stock: 75, isFeatured: true, categoryId: accessories.id, brandId: nova.id, image: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0" },
    { name: "Minimalist Masa Organizer", slug: "minimalist-masa-organizer", description: "Kod yazarken masayı temiz tutmak için sade ve kullanışlı organizer.", shortDescription: "Premium masa düzeni", price: 1190, compareAtPrice: 1390, sku: "ADK-DESK-001", stock: 18, isFeatured: true, categoryId: office.id, brandId: adakan.id, image: "https://images.unsplash.com/photo-1497366754035-f200968a6e72" },
    { name: "Kablosuz Sessiz Mouse", slug: "kablosuz-sessiz-mouse", description: "Ofis, yazılım ve günlük kullanım için sessiz tıklamalı kablosuz mouse.", shortDescription: "Sessiz üretkenlik mouse", price: 899, compareAtPrice: null, sku: "ADK-MOUSE-001", stock: 24, isFeatured: true, categoryId: office.id, brandId: nova.id, image: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46" }
  ];

  for (const p of products) {
    const { image, ...data } = p;
    const product = await prisma.product.create({ data });
    await prisma.productImage.create({ data: { productId: product.id, url: image, alt: product.name, sortOrder: 0 } });
    await prisma.inventoryLog.create({ data: { productId: product.id, change: product.stock, reason: "SEED", note: "Başlangıç stok" } });
  }

  await prisma.siteSettings.create({ data: { siteName: "Adakan Commerce", contactPhone: "+90 555 000 00 00", whatsappNumber: "+90 555 000 00 00", email: "info@adakancommerce.com", address: "Van / Türkiye", instagram: "https://instagram.com/adakansoftware", primaryColor: "#0f172a", shippingFee: 99, freeShippingThreshold: 1500, bankAccountInfo: "Adakan Yazılım - TR00 0000 0000 0000 0000 0000 00" } });
  await prisma.banner.create({ data: { title: "Premium e-ticaret altyapısı", subtitle: "Türkçe öncelikli, güvenli ve özelleştirilebilir", imageUrl: "/uploads/banner.jpg", ctaLabel: "Ürünleri Gör", ctaHref: "/products", sortOrder: 1 } });

  console.log("Seed tamamlandı");
  console.log("Admin: admin@adakancommerce.com / Admin12345");
  console.log("User: musteri@adakancommerce.com / User12345");
}

main().finally(async () => prisma.$disconnect());
