# Artisan Market

A premium full-stack marketplace for handmade handicrafts — customer storefront + seller dashboard, serving US & UK with regional currency, tax and shipping.

Built with **Next.js 15 (App Router) · React 19 · TypeScript · Prisma · Tailwind CSS · TanStack Query · Zustand · Zod · Recharts · TipTap**.

---

## Quick start

```bash
npm install
npm run db:push     # create dev.db from prisma/schema.prisma
npm run db:seed     # demo sellers, products, orders, reviews, coupons, analytics
npm run dev         # http://localhost:3000
```

### Demo accounts (password `Password123!`)

| Role     | Email                    |
| -------- | ------------------------ |
| Seller   | `maya@artisans.market`   |
| Customer | `customer@demo.com`      |

Demo coupons: **WELCOME10** (10% off) · **HANDMADE20** ($20 off $100+).

### Scripts

| Script                | Purpose                                        |
| --------------------- | ---------------------------------------------- |
| `npm run dev`         | Dev server                                     |
| `npm run build`       | Prisma generate + production build             |
| `npm start`           | Serve the production build                     |
| `npm test`            | Vitest unit tests                              |
| `npm run typecheck`   | `tsc --noEmit`                                 |
| `npm run db:push`     | Sync schema to database                        |
| `npm run db:seed`     | Reseed demo data                               |
| `npm run db:reset`    | Drop, push, reseed                             |
| `npm run db:switch:pg` / `db:switch:sqlite` | Toggle provider for deploy/dev |

---

## Architecture

```
src/
  app/
    (shop)/          # Storefront: home, catalog, PDP, cart, checkout,
                     #   orders/[orderNumber], account/*, wishlist,
                     |   artisans/*, legal, contact
    seller/          # Dashboard: home, products (+ new/edit), orders (+ detail),
                     #   analytics, reviews, messages, settings — role-guarded in layout + middleware
    api/             # Route handlers: auth, products, orders (checkout),
                     #   account, reviews, coupons, newsletter, analytics,
                     |   support, uploads, seller/*
    sitemap.ts robots.ts
  components/        # ui/ design system · shop/ storefront · seller/ dashboard
  lib/               # constants, money (FX/tax/shipping), auth (JWT sessions),
                     #   api helpers, validators (zod), email, rate-limit, db
  hooks/ store/      # TanStack Query hooks · zustand cart (persisted)
scripts/
  seed.ts            # Procedural SVG art + rich demo dataset
  switch-provider.mjs
prisma/schema.prisma # Portable: SQLite (dev) ↔ PostgreSQL (Neon prod)
```

### Key decisions

- **Prices are USD cents at rest.** GBP display conversion (`GBP_PER_USD = 0.79`) happens in UI helpers; order totals convert at creation.
- **Server-authoritative checkout**: `/api/orders` re-prices every item from the DB, validates stock, and decrements transactionally with a `StockLog` entry. Client prices are never trusted.
- **Payments are stubbed for Stripe**: `Payment.provider = "manual"`, refund op flips payment status + logs a `ShipmentEvent`. Wire real charges into `/api/orders`.
- **Uploads go to local disk** (`public/uploads`, 8 MB cap) via a swappable handler — swap for S3/Cloudinary keeping the same multipart → `{ url }` contract.
- **Sessions** are signed JWTs (`jose`) in an httpOnly cookie; role is embedded so edge middleware can gate `/seller` without a DB hit.
- **Region** (US/GB) resolves from geo headers → `region` cookie; drives currency, VAT/state tax, shipping methods, address validation.
- **Rate limiting** (login/register/newsletter) uses an in-memory fixed window — swap the Map in `lib/rate-limit.ts` for Redis on multi-instance deployments.
- **Emails** print to console unless `RESEND_API_KEY` is set.

---

## Deploying to Neon (PostgreSQL)

The schema avoids SQLite-only types (no enums/Json/scalar lists), so it runs unchanged on Postgres.

1. Create a project at [neon.tech](https://neon.tech) and copy the pooled connection string.

2. Switch the schema provider:

   ```bash
   npm run db:switch:pg      # provider = "postgresql" in prisma/schema.prisma
   ```

3. Set environment variables (Vercel or host of choice):

   ```env
   DATABASE_URL="postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require"
   AUTH_SECRET="<openssl rand -hex 32>"
   NEXT_PUBLIC_SITE_URL="https://yourdomain.com"
   RESEND_API_KEY="..."        # optional but recommended in prod
   EMAIL_FROM="Artisan Market <orders@yourdomain.com>"
   ```

4. Push schema and seed:

   ```bash
   npm run db:push
   npm run db:seed            # optional demo data
   ```

5. Build & run:

   ```bash
   npm run build && npm start
   ```

6. To return to local development:

   ```bash
   npm run db:switch:sqlite
   ```

> On serverless hosts, uploads to `public/uploads` are ephemeral — point `/api/uploads` at S3/Cloudinary before going live.

## Roadmap (explicitly deferred)

- Stripe Checkout + webhooks (order flow already reserves the seam)
- OAuth sign-in (Google/Apple), 2FA, login history
- Redis caching/rate-limit backend, Sentry monitoring
- Admin panel, live chat, mobile app APIs
