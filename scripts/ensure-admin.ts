/* Idempotent admin account ensure. Run: npm run db:admin
   Creates or updates the marketplace owner account with the given
   email/password. Use this (rather than a full reseed) on an existing
   database that was seeded before the admin account existed. */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "rajibdgp2011@gmail.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Admin@1234";
const ADMIN_NAME = process.env.ADMIN_NAME || "Rajib";

async function main() {
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
  const existing = await db.user.findUnique({ where: { email: ADMIN_EMAIL } });

  if (existing) {
    await db.user.update({
      where: { email: ADMIN_EMAIL },
      data: { passwordHash, role: "ADMIN", name: ADMIN_NAME },
    });
    console.log(`Updated admin ${ADMIN_EMAIL} (role: ADMIN).`);
  } else {
    await db.user.create({
      data: { email: ADMIN_EMAIL, passwordHash, name: ADMIN_NAME, role: "ADMIN" },
    });
    console.log(`Created admin ${ADMIN_EMAIL} (role: ADMIN).`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
