import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Seed script production ortaminda calistirilamaz.");
  }

  await prisma.review.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.inventoryLog.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.productAttribute.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.address.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.banner.deleteMany();
  await prisma.siteSettings.deleteMany();
  await prisma.user.deleteMany();

  const adminPasswordHash = await bcrypt.hash("Admin12345", 12);
  const userPasswordHash = await bcrypt.hash("User12345", 12);

  const admin = await prisma.user.create({
    data: {
      name: "Adakan Admin",
      email: "admin@adakancommerce.com",
      passwordHash: adminPasswordHash,
      role: "ADMIN",
      phone: "+90 555 000 00 00"
    }
  });

  const customer = await prisma.user.create({
    data: {
      name: "Demo Musteri",
      email: "musteri@adakancommerce.com",
      passwordHash: userPasswordHash,
      role: "USER",
      phone: "+90 555 111 11 11"
    }
  });

  const customerAddress = await prisma.address.create({
    data: {
      userId: customer.id,
      title: "Ev",
      fullName: "Demo Musteri",
      phone: "+90 555 111 11 11",
      city: "Van",
      district: "Ipekyolu",
      address: "Demo Mahallesi, Core Sokak No: 1",
      postalCode: "65000",
      isDefault: true
    }
  });

  const [accessories, office, audio] = await Promise.all([
    prisma.category.create({
      data: {
        name: "Telefon Aksesuarlari",
        slug: "telefon-aksesuarlari",
        description: "Gundelik kullanim icin premium aksesuarlar",
        seoTitle: "Telefon Aksesuarlari",
        seoDescription: "Sarj, stand ve premium telefon ekipmanlari"
      }
    }),
    prisma.category.create({
      data: {
        name: "Ofis Urunleri",
        slug: "ofis-urunleri",
        description: "Calisma masasi ve uretkenlik urunleri",
        seoTitle: "Ofis Urunleri",
        seoDescription: "Daha verimli bir masa kurmak icin ofis urunleri"
      }
    }),
    prisma.category.create({
      data: {
        name: "Ses Ekipmanlari",
        slug: "ses-ekipmanlari",
        description: "Cagri, muzik ve hibrid calisma icin secilmis ses urunleri",
        seoTitle: "Ses Ekipmanlari",
        seoDescription: "Kulaklik ve ses deneyimi odakli urunler"
      }
    })
  ]);

  const [adakanSelect, novaTech, urbanLoop] = await Promise.all([
    prisma.brand.create({
      data: {
        name: "Adakan Select",
        slug: "adakan-select",
        description: "Curated premium seckiler"
      }
    }),
    prisma.brand.create({
      data: {
        name: "NovaTech",
        slug: "novatech",
        description: "Guncel teknoloji odakli marka"
      }
    }),
    prisma.brand.create({
      data: {
        name: "Urban Loop",
        slug: "urban-loop",
        description: "Minimal islevsellik ve masaustu urunler"
      }
    })
  ]);

  const products = [
    {
      name: "Manyetik Premium Telefon Standi",
      slug: "manyetik-premium-telefon-standi",
      description: "Aluminyum govdeli, masaustu kullanim icin saglam ve premium telefon standi.",
      shortDescription: "Aluminyum premium stand",
      seoTitle: "Manyetik Premium Telefon Standi",
      seoDescription: "Telefon masasi kurulumunu premium bir seviyeye tasiyan manyetik stand",
      searchKeywords: "telefon standi manyetik premium",
      price: 899,
      salePrice: 749,
      compareAtPrice: 999,
      sku: "ADK-STAND-001",
      barcode: "8690000000001",
      stock: 30,
      lowStockThreshold: 8,
      isFeatured: true,
      categoryId: accessories.id,
      brandId: adakanSelect.id,
      image: "https://images.unsplash.com/photo-1616348436168-de43ad0db179",
      attributes: [
        { name: "Malzeme", value: "Aluminyum" },
        { name: "Uyumluluk", value: "Tum akilli telefonlar" }
      ]
    },
    {
      name: "Hizli Sarj USB-C Kablo",
      slug: "hizli-sarj-usb-c-kablo",
      description: "Dayanikli orgulu yapi, hizli sarj destegi ve uzun omurlu uc korumasi.",
      shortDescription: "Orgulu USB-C kablo",
      seoTitle: "Hizli Sarj USB-C Kablo",
      seoDescription: "Gunluk kullanim icin dayanikli ve hizli sarj destekli kablo",
      searchKeywords: "usb-c kablo hizli sarj orgulu",
      price: 449,
      salePrice: 349,
      compareAtPrice: 499,
      sku: "ADK-CABLE-001",
      barcode: "8690000000002",
      stock: 75,
      lowStockThreshold: 12,
      isFeatured: true,
      categoryId: accessories.id,
      brandId: novaTech.id,
      image: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0",
      attributes: [
        { name: "Uzunluk", value: "1.5m" },
        { name: "Guc", value: "60W" }
      ]
    },
    {
      name: "Minimalist Masa Organizer",
      slug: "minimalist-masa-organizer",
      description: "Kod yazarken masayi temiz tutmak icin sade ve kullanisli organizer.",
      shortDescription: "Premium masa duzeni",
      seoTitle: "Minimalist Masa Organizer",
      seoDescription: "Masaustu ekipmanlarini derli toplu tutmak icin premium organizer",
      searchKeywords: "masa organizer minimalist premium",
      price: 1390,
      salePrice: 1190,
      compareAtPrice: 1490,
      sku: "ADK-DESK-001",
      barcode: "8690000000003",
      stock: 18,
      lowStockThreshold: 5,
      isFeatured: true,
      categoryId: office.id,
      brandId: urbanLoop.id,
      image: "https://images.unsplash.com/photo-1497366754035-f200968a6e72",
      attributes: [
        { name: "Bolme", value: "4 goz" },
        { name: "Yuzey", value: "Mat kaplama" }
      ]
    },
    {
      name: "Kablosuz Sessiz Mouse",
      slug: "kablosuz-sessiz-mouse",
      description: "Ofis, yazilim ve gunluk kullanim icin sessiz tiklamali kablosuz mouse.",
      shortDescription: "Sessiz uretkenlik mouse",
      seoTitle: "Kablosuz Sessiz Mouse",
      seoDescription: "Gun boyu daha konforlu kullanim icin sessiz tiklamali mouse",
      searchKeywords: "kablosuz mouse sessiz ofis",
      price: 999,
      salePrice: 899,
      compareAtPrice: 1099,
      sku: "ADK-MOUSE-001",
      barcode: "8690000000004",
      stock: 24,
      lowStockThreshold: 6,
      isFeatured: true,
      categoryId: office.id,
      brandId: novaTech.id,
      image: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46",
      attributes: [
        { name: "Baglanti", value: "2.4Ghz" },
        { name: "Pil", value: "12 ay" }
      ]
    },
    {
      name: "Cift Suruculu Bluetooth Kulaklik",
      slug: "cift-suruculu-bluetooth-kulaklik",
      description: "Uzun toplanti gunleri ve muzik deneyimi icin dengeli ses veren hafif kulaklik.",
      shortDescription: "Gun boyu konforlu kulaklik",
      seoTitle: "Cift Suruculu Bluetooth Kulaklik",
      seoDescription: "Toplanti ve muzik deneyimi icin premium bluetooth kulaklik",
      searchKeywords: "bluetooth kulaklik premium ofis",
      price: 1790,
      salePrice: 1590,
      compareAtPrice: 1990,
      sku: "ADK-AUDIO-001",
      barcode: "8690000000005",
      stock: 14,
      lowStockThreshold: 4,
      isFeatured: false,
      categoryId: audio.id,
      brandId: adakanSelect.id,
      image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e",
      attributes: [
        { name: "Pil Omru", value: "32 saat" },
        { name: "Mikrofon", value: "Cift mikrofon" }
      ]
    }
  ];

  const createdProducts = [];
  for (const item of products) {
    const { image, attributes, ...data } = item;
    const product = await prisma.product.create({ data });

    await prisma.productImage.create({
      data: { productId: product.id, url: image, alt: product.name, sortOrder: 0 }
    });

    await prisma.productAttribute.createMany({
      data: attributes.map((attribute, index) => ({
        productId: product.id,
        name: attribute.name,
        value: attribute.value,
        sortOrder: index
      }))
    });

    await prisma.inventoryLog.create({
      data: {
        productId: product.id,
        change: product.stock,
        stockAfter: product.stock,
        reason: "SEED",
        note: "Baslangic stok"
      }
    });

    createdProducts.push(product);
  }

  await prisma.siteSettings.create({
    data: {
      siteName: "Adakan Commerce",
      contactPhone: "+90 555 000 00 00",
      whatsappNumber: "+90 555 000 00 00",
      email: "info@adakancommerce.com",
      address: "Van / Turkiye",
      instagram: "https://instagram.com/adakansoftware",
      primaryColor: "#0f172a",
      currencyCode: "TRY",
      checkoutMessage: "Banka havalesi odemelerinde siparisiniz manuel olarak onaylanir.",
      shippingFee: 99,
      freeShippingThreshold: 1500,
      bankAccountInfo: "Adakan Yazilim - TR00 0000 0000 0000 0000 0000 00"
    }
  });

  await prisma.banner.create({
    data: {
      title: "Premium e-ticaret altyapisi",
      subtitle: "Turkce oncelikli, guvenli ve ozellestirilebilir",
      imageUrl: "/uploads/banner.jpg",
      ctaLabel: "Urunleri Gor",
      ctaHref: "/products",
      sortOrder: 1
    }
  });

  await prisma.coupon.createMany({
    data: [
      {
        code: "HOSGELDIN100",
        description: "Ilk siparise 100 TL indirim",
        discountAmount: 100,
        minOrderAmount: 1000,
        usageLimit: 50,
        isActive: true
      },
      {
        code: "CORE10",
        description: "Secili siparislerde %10 indirim",
        discountPercent: 10,
        minOrderAmount: 1500,
        usageLimit: 100,
        isActive: true
      }
    ]
  });

  const order = await prisma.order.create({
    data: {
      orderNumber: "ADK-SEED-1001",
      userId: customer.id,
      addressId: customerAddress.id,
      status: "DELIVERED",
      paymentMethod: "BANK_TRANSFER",
      couponCode: "HOSGELDIN100",
      subtotal: 2498,
      discountTotal: 100,
      shippingTotal: 0,
      grandTotal: 2398,
      shippingFullName: customerAddress.fullName,
      shippingPhone: customerAddress.phone,
      shippingCity: customerAddress.city,
      shippingDistrict: customerAddress.district,
      shippingAddress: customerAddress.address,
      items: {
        create: [
          {
            productId: createdProducts[0].id,
            productName: createdProducts[0].name,
            productSlug: createdProducts[0].slug,
            productImage: products[0].image,
            productBrand: adakanSelect.name,
            sku: createdProducts[0].sku,
            unitPrice: 749,
            quantity: 1,
            lineTotal: 749
          },
          {
            productId: createdProducts[2].id,
            productName: createdProducts[2].name,
            productSlug: createdProducts[2].slug,
            productImage: products[2].image,
            productBrand: urbanLoop.name,
            sku: createdProducts[2].sku,
            unitPrice: 1190,
            quantity: 1,
            lineTotal: 1190
          },
          {
            productId: createdProducts[3].id,
            productName: createdProducts[3].name,
            productSlug: createdProducts[3].slug,
            productImage: products[3].image,
            productBrand: novaTech.name,
            sku: createdProducts[3].sku,
            unitPrice: 459,
            quantity: 1,
            lineTotal: 459
          }
        ]
      },
      payment: {
        create: {
          method: "BANK_TRANSFER",
          status: "CONFIRMED",
          amount: 2398,
          confirmedAt: new Date(),
          adminNote: "Seed odeme onayi"
        }
      }
    }
  });

  await prisma.review.create({
    data: {
      userId: customer.id,
      productId: createdProducts[0].id,
      rating: 5,
      title: "Cok memnun kaldim",
      body: "Masa kurulumunda hem premium duruyor hem de sabit duruyor.",
      status: "APPROVED"
    }
  });

  await prisma.product.update({
    where: { id: createdProducts[0].id },
    data: {
      ratingAverage: 5,
      ratingCount: 1
    }
  });

  await prisma.wishlistItem.create({
    data: {
      userId: customer.id,
      productId: createdProducts[4].id
    }
  });

  console.log("Seed tamamlandi");
  console.log("Admin: admin@adakancommerce.com / Admin12345");
  console.log("User: musteri@adakancommerce.com / User12345");
  console.log(`Ornek siparis: ${order.orderNumber}`);
}

main().finally(async () => prisma.$disconnect());
