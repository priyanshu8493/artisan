# Artisan Market

A premium full-stack marketplace for handmade handicrafts — customer storefront + seller dashboard, serving US & UK with regional currency, tax and shipping.

Built with **Next.js 15 (App Router) · React 19 · TypeScript · Prisma · Tailwind CSS · TanStack Query · Zustand · Zod · Recharts · TipTap**.

---

## Quick start

The schema ships configured for **PostgreSQL/Neon** (the deployment target).

```bash
npm install
# Put your Neon connection string in .env → DATABASE_URL="postgresql://…"
npm run db:push     # sync schema to the database
npm run db:seed     # demo sellers, products, orders, reviews, coupons, analytics
npm run dev         # http://localhost:3000
```

For fully offline development you can switch Prisma back to SQLite —
`dev.db` is git-ignored and local-only:

```bash
npm run db:switch:sqlite   # provider = "sqlite", DATABASE_URL="file:./dev.db"
npm run db:push && npm run db:seed
```

### Demo accounts

| Role     | Email                    | Password     | Area        |
| -------- | ------------------------ | ------------ | ----------- |
| Admin    | `rajibdgp2011@gmail.com` | `Admin@1234` | `/admin`    |
| Seller   | `maya@artisans.market`   | `Password123!` | `/seller` |
| Customer | `customer@demo.com`      | `Password123!` | storefront |

> **Admin**: the marketplace owner signs in at `/login` and is routed to `/admin`,
> where they can manage all listings, orders, categories, sellers, customers and
> reviews. Change the default password under **Admin → Profile**.

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
| `npm run db:seed`     | Reseed demo data (includes the admin account)  |
| `npm run db:admin`    | Idempotently create/update the admin account   |
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
    admin/           # Owner dashboard: overview, products, orders, categories,
                     #   sellers, customers, reviews, profile (password) — ADMIN-only
    api/             # Route handlers: auth, products, orders (checkout),
                     #   account, reviews, coupons, newsletter, analytics,
                     |   support, uploads, seller/*, admin/*
    sitemap.ts robots.ts
  components/        # ui/ design system · shop/ storefront · seller/ & admin/ dashboards
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
- **Sessions** are signed JWTs (`jose`) in an httpOnly cookie; role is embedded so edge middleware can gate `/seller` and `/admin` without a DB hit.
- **Admin** is role-gated twice — middleware (edge) and `requireAdmin()` in every `/api/admin` handler — and can manage listings, orders, categories, sellers, customers, reviews, and change its own password via the existing account endpoints.
- **Region** (US/GB) resolves from geo headers → `region` cookie; drives currency, VAT/state tax, shipping methods, address validation.
- **Rate limiting** (login/register/newsletter) uses an in-memory fixed window — swap the Map in `lib/rate-limit.ts` for Redis on multi-instance deployments.
- **Emails** print to console unless `RESEND_API_KEY` is set.

---

## Deploying to Neon (Vercel)

The schema avoids provider-only types (no enums/Json/scalar lists), so it runs unchanged on Postgres. **`prisma/schema.prisma` is committed with `provider = "postgresql"`.**

1. Create a project at [neon.tech](https://neon.tech) and copy the **pooled** connection string.

2. Push schema + seed it (run locally against Neon):

   ```bash
   # .env → DATABASE_URL="postgresql://…neon.tech/neondb?sslmode=require"
   npm run db:push
   npm run db:seed        # optional demo data
   ```

3. Set environment variables in **Vercel → Project → Settings → Environment Variables** (all environments):

   | Key                  | Value                                              |
   | -------------------- | -------------------------------------------------- |
   | `DATABASE_URL`       | Neon pooled connection string (`?sslmode=require`) |
   | `AUTH_SECRET`        | `openssl rand -hex 32` — rotate if ever committed  |
   | `NEXT_PUBLIC_SITE_URL` | `https://your-app.vercel.app`                    |
   | `RESEND_API_KEY`     | optional — emails log to console without it        |

4. Redeploy (`git push` or Vercel dashboard). Build runs `prisma generate && next build` automatically.

5. Working offline again:

   ```bash
   npm run db:switch:sqlite
   ```

> On serverless hosts, uploads go to the instance temp dir and are served via
> `/api/files/[name]` — fine for demos, but swap `/api/uploads` for S3/Cloudinary
> before real production use.

## Roadmap (explicitly deferred)

- Stripe Checkout + webhooks (order flow already reserves the seam)
- OAuth sign-in (Google/Apple), 2FA, login history
- Redis caching/rate-limit backend, Sentry monitoring
- Live chat, mobile app APIs
