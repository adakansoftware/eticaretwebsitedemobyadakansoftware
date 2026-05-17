# Adakan Commerce Core

Turkish-first, reusable e-commerce MVP foundation for small and medium businesses.

Built from the requested brief: Next.js App Router, TypeScript, PostgreSQL, Prisma, Tailwind CSS, shadcn-style UI primitives, Zod validation, server-side auth/roles, admin/customer separation, secure cart and checkout rules.

## What is included

- Public storefront: home, product list, product detail, category, cart, checkout, legal pages
- User system: register, login, logout foundation, order history
- Admin panel: dashboard, product list, order list, customer list, settings overview
- Prisma schema for users, addresses, products, images, variants, categories, brands, cart, orders, coupons, banners, settings, payments, inventory logs
- JWT cookie auth with roles: USER and ADMIN
- Admin protection in middleware and server logic
- Server-side cart total calculation
- Server-side stock and activity checks
- Manual first-version payments: bank transfer/EFT and cash on delivery
- Realistic seed data

## Setup

```bash
cp .env.example .env
npm install
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed
npm run dev
```

Open:

```txt
http://localhost:3000
```

## Seed accounts

```txt
Admin:
admin@adakancommerce.com
Admin12345

Customer:
musteri@adakancommerce.com
User12345
```

## Environment variables

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/adakan_commerce_core?schema=public"
AUTH_SECRET="change-this-long-random-secret-min-32-chars"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

`AUTH_SECRET` must be a long random value in production.

## Folder structure

```txt
app/
  admin/                 Admin panel routes
  products/              Storefront product pages
  category/              Category pages
  cart/                  Cart page
  checkout/              Checkout page
  login/ register/       Auth pages
  legal/                 KVKK, contracts, privacy, returns, contact
components/
  storefront/            Public UI components
  admin/                 Admin shell/components
  ui/                    shadcn-style primitives
lib/
  actions/               Server actions
  auth.ts                JWT session and role helpers
  cart.ts                Server cart and total logic
  env.ts                 Env validation
  prisma.ts              Prisma singleton
  validators.ts          Zod schemas
prisma/
  schema.prisma          Database design
  seed.ts                Realistic seed data
```

## Architecture decisions

### Storefront vs admin separation

Admin routes live under `app/admin`. The admin panel is protected twice:

1. `middleware.ts` checks the JWT role before reaching `/admin` routes.
2. `requireAdmin()` is called in the admin layout and admin server actions.

This prevents the common mistake of only hiding admin buttons in the UI.

### Server-side business logic

The client never decides prices, stock, role, or order totals. Important checks run on the server:

- Product must be active.
- Product must have enough stock.
- Cart totals are calculated from database prices.
- Checkout rechecks stock inside a Prisma transaction.
- Stock decrement and order creation happen in one transaction.

### Payment architecture

The first version supports:

- `BANK_TRANSFER`
- `CASH_ON_DELIVERY`

Online providers such as iyzico or PayTR are intentionally not implemented yet. The `Payment` model exists so a provider integration can later store transaction IDs and statuses.

### MVP scope

Included now:

- Clean product/order/cart/user foundation
- Admin viewing screens
- Manual checkout
- Site settings model
- Inventory log model
- Seed data

Later features:

- Full product CRUD forms with image upload
- Address CRUD UI
- Coupon application UI
- Online payment provider integration
- E-mail/SMS notifications
- Advanced analytics
- Invoice/e-archive integration
- Search indexing
- Multi-language UI beyond Turkish-first content

## Security checklist

- [x] Zod validation for auth, cart, checkout, product admin input
- [x] HTTP-only session cookie
- [x] JWT role in session
- [x] Admin middleware
- [x] Server-side `requireAdmin()`
- [x] Server-side price calculation
- [x] Server-side stock validation
- [x] Prisma transaction during checkout
- [x] Environment validation
- [x] No sensitive env variables exposed to client

## Notes for production

Before production:

- Replace legal page placeholder text with lawyer-approved text.
- Use a real PostgreSQL database.
- Use a strong `AUTH_SECRET`.
- Add rate limiting to login/register.
- Add CSRF/rate-limit hardening for sensitive mutations if needed.
- Add image upload storage such as S3/R2.
- Add logging and error monitoring.
