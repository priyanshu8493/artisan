import { argv } from "node:process";
import { readFileSync, writeFileSync } from "node:fs";

const target = argv[2];
if (!["postgresql", "sqlite"].includes(target)) {
  console.error(`Usage: node scripts/switch-provider.mjs <postgresql|sqlite>`);
  process.exit(1);
}
const path = new URL("../prisma/schema.prisma", import.meta.url);
let content = readFileSync(path, "utf8");
const from = target === "postgresql" ? "sqlite" : "postgresql";
content = content.replace(
  new RegExp(`(datasource db \\{\\s*provider = )"${from}"`),
  `$1"${target}"`
);
writeFileSync(path, content);
console.log(`Prisma datasource provider switched to "${target}".`);
