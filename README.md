# Adakan Commerce Core

Turkish-first, reusable e-commerce core for small and medium businesses.

This project is built as a serious commercial foundation rather than a throwaway demo. It keeps storefront, auth, admin, cart, checkout, payment placeholders, and inventory operations in one maintainable Next.js codebase.

## Stack

- Next.js App Router
- TypeScript
- Prisma
- PostgreSQL
- Tailwind CSS
- shadcn-style UI primitives
- Zod
- Server Actions
- Cookie + JWT based auth

## Current capabilities

- Storefront home page with premium hero, category discovery, featured products, and new arrivals
- Product catalog with search, category filter, brand filter, stock filter, sorting, and pagination
- Product detail page with pricing hierarchy and add-to-cart flow
- Cart with server-side quantity updates, coupon application, clear cart, and secure totals
- Checkout with address selection, payment method selection, coupon support, and snapshot-based order creation
- Account area with address management and order history
- Admin dashboard with revenue, orders, customers, product count, low stock visibility, and recent orders
- Admin product CRUD
- Admin category, brand, coupon, and banner CRUD
- Admin order list, order detail, status management, and manual payment-friendly flow
- Admin inventory log visibility with filters and pagination
- Site settings, seed data, banner, coupon, inventory log, wishlist, and review placeholder models

## Security model

- Client never decides price, role, stock, discount, or order total
- Cart totals are recalculated from database data
- Checkout revalidates stock inside a Prisma transaction
- Order items store snapshot fields such as product name, SKU, slug, brand, image, and unit price
- Admin routes are protected in both routing and server logic
- Zod validation is used for auth, cart, checkout, address, and admin product input
- Session cookies are HTTP-only

## Setup

1. Install dependencies

```powershell
npm install
```

2. Create environment files

Use `.env.example` as a starting point. In local development, Next.js reads `.env.local` and Prisma CLI can read `.env`.

Required variables:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/adakan_commerce_core?schema=public"
AUTH_SECRET="change-this-long-random-secret-min-32-chars"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

3. Generate Prisma client

```powershell
npx prisma generate
```

4. Apply migrations

```powershell
npx prisma migrate dev
```

5. Seed demo data

```powershell
npx prisma db seed
```

or

```powershell
npm run prisma:seed
```

6. Start development server

```powershell
npm run dev
```

7. Production build verification

```powershell
npm run build
```

## Local demo accounts

```txt
Admin
admin@adakancommerce.com
Admin12345

Customer
musteri@adakancommerce.com
User12345
```

## Useful scripts

```powershell
npm run dev
npm run dev:turbopack
npm run build
npm run prisma:generate
npm run prisma:migrate
npm run prisma:reset
npm run prisma:seed
npm run db:studio
```

Warning:
`npm run prisma:reset` deletes local development data.

## Folder structure

```txt
app/
  admin/                    Admin routes
  account/                  Customer account routes
  cart/ checkout/ orders/   Commerce flow routes
  products/ category/       Storefront catalog routes
  legal/                    Legal and contact pages
components/
  admin/                    Admin layout and panels
  storefront/               Header, product cards, cart UI
  ui/                       Shared primitives
lib/
  actions/                  Server actions
  auth.ts                   Session and role helpers
  auth-guards.ts            Shared auth guard helpers
  cart.ts                   Cart lookup and total calculation
  commerce.ts               Effective pricing and discount helpers
  money.ts                  Money formatting
  pagination.ts             Pagination helpers
  prisma.ts                 Prisma singleton
  slug.ts                   Slug generation
  validators.ts             Zod schemas
prisma/
  migrations/               Prisma migrations
  schema.prisma             Database schema
  seed.ts                   Realistic seed data
```

## Database design notes

The schema is intentionally prepared for commercial growth:

- `Product` supports active state, featured state, sale price, compare-at price, stock, low stock threshold, SEO fields, barcode, and search keywords
- `Category` and `Brand` support slugs and SEO fields
- `Order` and `OrderItem` store snapshot data so historical orders do not depend on current product prices
- `Coupon`, `Banner`, `SiteSettings`, `Payment`, `InventoryLog`, `Review`, and `WishlistItem` already exist
- `ProductVariant` and `ProductAttribute` provide room for catalog expansion

## Payment architecture

Implemented now:

- Bank transfer / EFT
- Cash on delivery
- Manual admin confirmation

Prepared for later:

- iyzico
- PayTR
- Stripe-like gateway integrations

The `Payment` model is already separated so provider transaction IDs, statuses, and reconciliation logic can be added later without redesigning the order core.

## Admin notes

Current admin scope:

- Dashboard visibility
- Product CRUD
- Category CRUD
- Brand CRUD
- Coupon CRUD
- Banner CRUD
- Order listing, detail, and status updates
- Inventory log visibility
- Customer overview
- Site settings visibility

Admin management notes:

- Categories and brands support slug, SEO fields, image URL, active/passive state, and safe delete rules
- Coupons are always enforced server-side at checkout; admin only defines the rule set
- Banners currently support title, subtitle, image URL, CTA, active state, and sort order
- Order detail page shows customer snapshot, address snapshot, payment state, line items, totals, and internal admin note flow
- Inventory log page currently lists product-based stock events; direct order relation is not stored in the current schema

## Production notes

Do not do these in production:

- Do not keep demo credentials
- Do not use the default `AUTH_SECRET`
- Do not use `prisma migrate reset`
- Do not seed fake sample orders and demo banners
- Do not rely only on UI-level admin hiding

Before production, add:

- Rate limiting for auth and sensitive mutations
- Audit logs for admin actions
- Error monitoring
- Object storage for image uploads
- Email/SMS notifications
- Legal text review
- Backup and database maintenance strategy

## Roadmap

- Full category, brand, coupon, and banner management
- Better product media gallery and image upload flow
- Wishlist UI and reviews UI
- Stronger order detail and return/cancellation operations
- Reporting and analytics
- Marketplace / ERP / cargo integrations
- Invoice and e-archive support
- Multi-language and multi-currency expansion
