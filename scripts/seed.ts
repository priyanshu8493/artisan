/* Seed script: categories, artisans, products (with generated SVG art),
   customers, orders, reviews, coupons and analytics events.
   Run: npm run db:seed */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const db = new PrismaClient();
const PUBLIC_DIR = join(process.cwd(), "public");

// ---------- deterministic RNG ----------
function makeRng(seedStr: string) {
  let h = 2166136261;
  for (let i = 0; i < seedStr.length; i++) {
    h ^= seedStr.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h ^= h << 13; h ^= h >>> 17; h ^= h << 5;
    return ((h >>> 0) % 100000) / 100000;
  };
}
const pick = <T>(rng: () => number, arr: readonly T[]): T => arr[Math.floor(rng() * arr.length)];

// ---------- procedural SVG art ----------
interface Palette { bg: string; tones: [string, string, string]; }

function productSvg(seed: string, p: Palette): string {
  const rng = makeRng(seed);
  const W = 1200, H = 1500;
  const shapes: string[] = [];
  // large soft blobs
  const blobCount = 3 + Math.floor(rng() * 3);
  for (let i = 0; i < blobCount; i++) {
    const cx = 150 + rng() * 900, cy = 200 + rng() * 1100;
    const r = 180 + rng() * 320;
    const fill = p.tones[i % 3];
    const op = (0.35 + rng() * 0.4).toFixed(2);
    shapes.push(`<circle cx="${cx.toFixed(0)}" cy="${cy.toFixed(0)}" r="${r.toFixed(0)}" fill="${fill}" opacity="${op}" filter="url(#soft)"/>`);
  }
  // hand-drawn arcs
  const arcCount = 2 + Math.floor(rng() * 4);
  for (let i = 0; i < arcCount; i++) {
    const x1 = rng() * W, y1 = rng() * H, x2 = rng() * W, y2 = rng() * H;
    const stroke = pick(rng, p.tones);
    shapes.push(`<path d="M ${x1.toFixed(0)} ${y1.toFixed(0)} Q ${(rng() * W).toFixed(0)} ${(rng() * H).toFixed(0)} ${x2.toFixed(0)} ${y2.toFixed(0)}" stroke="${stroke}" stroke-width="${(8 + rng() * 26).toFixed(0)}" fill="none" opacity="0.5" stroke-linecap="round"/>`);
  }
  // vessel silhouette (artisan motif)
  const vx = W / 2 + (rng() - 0.5) * 240, vy = H / 2 + (rng() - 0.5) * 300;
  const vw = 170 + rng() * 130, vh = vw * (1.15 + rng() * 0.5);
  const accent = pick(rng, p.tones);
  shapes.push(`<g opacity="0.9">
    <path d="M ${vx} ${vy - vh / 2}
             C ${vx + vw / 2} ${vy - vh / 2}, ${vx + vw * 0.62} ${vy}, ${vx + vw * 0.55} ${vy + vh * 0.28}
             C ${vx + vw * 0.5} ${vy + vh * 0.52}, ${vx + vw * 0.48} ${vy + vh / 2}, ${vx} ${vy + vh / 2}
             C ${vx - vw * 0.48} ${vy + vh / 2}, ${vx - vw * 0.5} ${vy + vh * 0.52}, ${vx - vw * 0.55} ${vy + vh * 0.28}
             C ${vx - vw * 0.62} ${vy}, ${vx - vw / 2} ${vy - vh / 2}, ${vx} ${vy - vh / 2} Z"
          fill="#211E1B" opacity="0.82"/>
    <path d="M ${vx - vw * 0.34} ${vy - vh * 0.18} Q ${vx} ${vy - vh * 0.34} ${vx + vw * 0.34} ${vy - vh * 0.18}"
          stroke="${accent}" stroke-width="14" fill="none" opacity="0.85"/>
    <circle cx="${vx}" cy="${vy + vh * 0.12}" r="${(vw * 0.16).toFixed(0)}" fill="${p.bg}" opacity="0.25"/>
  </g>`);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${p.bg}"/><stop offset="100%" stop-color="${p.tones[2]}" stop-opacity="0.7"/>
    </linearGradient>
    <filter id="soft"><feGaussianBlur stdDeviation="46"/></filter>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>${shapes.join("")}
</svg>`;
}

function tileSvg(seed: string, p: Palette): string {
  const rng = makeRng(seed);
  const S = 800;
  const parts: string[] = [];
  for (let i = 0; i < 5; i++) {
    const r = 90 + rng() * 260;
    parts.push(`<circle cx="${(rng() * S).toFixed(0)}" cy="${(rng() * S).toFixed(0)}" r="${r.toFixed(0)}" fill="${p.tones[i % 3]}" opacity="${(0.4 + rng() * 0.35).toFixed(2)}" filter="url(#b)"/>`);
  }
  parts.push(`<path d="M ${(S*0.3).toFixed(0)} ${(S*0.68).toFixed(0)} C ${(S*0.42).toFixed(0)} ${(S*0.30).toFixed(0)}, ${(S*0.58).toFixed(0)} ${(S*0.30).toFixed(0)}, ${(S*0.70).toFixed(0)} ${(S*0.68).toFixed(0)} Z" fill="#211E1B" opacity="0.78"/>`);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}">
  <defs><filter id="b"><feGaussianBlur stdDeviation="40"/></filter></defs>
  <rect width="${S}" height="${S}" fill="${p.bg}"/>${parts.join("")}</svg>`;
}

function heroSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900">
  <defs>
    <linearGradient id="hg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#F1E8DC"/><stop offset="55%" stop-color="#E7DACA"/><stop offset="100%" stop-color="#C4623A" stop-opacity="0.35"/>
    </linearGradient>
    <filter id="hb"><feGaussianBlur stdDeviation="60"/></filter>
  </defs>
  <rect width="1600" height="900" fill="url(#hg)"/>
  <circle cx="1180" cy="240" r="330" fill="#C4623A" opacity="0.45" filter="url(#hb)"/>
  <circle cx="420" cy="700" r="380" fill="#2F4A3E" opacity="0.35" filter="url(#hb)"/>
  <circle cx="880" cy="520" r="210" fill="#B98A38" opacity="0.4" filter="url(#hb)"/>
  <path d="M 640 640 C 700 400, 900 400, 960 640 Z" fill="#211E1B" opacity="0.75"/>
  <path d="M 700 560 Q 800 480 900 560" stroke="#FAF6F0" stroke-width="12" fill="none" opacity="0.7"/>
  <path d="M 250 250 Q 500 120 750 230" stroke="#2E3A59" stroke-width="18" fill="none" opacity="0.35" stroke-linecap="round"/>
  <path d="M 1050 720 Q 1250 620 1450 700" stroke="#A94F2C" stroke-width="22" fill="none" opacity="0.4" stroke-linecap="round"/>
</svg>`;
}

function avatarSvg(seed: string): string {
  const rng = makeRng(seed);
  const palettes: Palette[] = [
    { bg: "#F1E8DC", tones: ["#C4623A", "#2F4A3E", "#E7DACA"] },
    { bg: "#E7DACA", tones: ["#2E3A59", "#B98A38", "#FAF6F0"] },
    { bg: "#DCE5DF", tones: ["#2F4A3E", "#C4623A", "#F1E8DC"] },
  ];
  const p = pick(rng, palettes);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">
  <rect width="400" height="400" fill="${p.bg}"/>
  <circle cx="${120 + rng() * 160}" cy="${120 + rng() * 160}" r="${70 + rng() * 60}" fill="${p.tones[0]}" opacity="0.65" filter="url(#a)"/>
  <circle cx="${120 + rng() * 160}" cy="${180 + rng() * 140}" r="${50 + rng() * 50}" fill="${p.tones[1]}" opacity="0.6" filter="url(#a)"/>
  <defs><filter id="a"><feGaussianBlur stdDeviation="24"/></filter></defs>
  <path d="M 200 130 C 245 130 255 175 235 205 C 275 215 290 260 290 310 L 110 310 C 110 260 125 215 165 205 C 145 175 155 130 200 130 Z" fill="#211E1B" opacity="0.8"/>
</svg>`;
}

async function saveArt(relPath: string, svg: string) {
  const full = join(PUBLIC_DIR, relPath);
  writeFileSync(full, svg);
  return `/${relPath}`;
}

// ---------- data ----------
const PALETTES: Record<string, Palette> = {
  "pottery-ceramics": { bg: "#F1E8DC", tones: ["#C4623A", "#E08A63", "#E7DACA"] },
  "textiles-weaving": { bg: "#E9E4EE", tones: ["#2E3A59", "#5B6B94", "#D9CFE0"] },
  jewelry: { bg: "#F5EDDD", tones: ["#B98A38", "#D9B36A", "#EFE3D3"] },
  woodwork: { bg: "#EFE3D3", tones: ["#5C4028", "#8A6642", "#DCCBB2"] },
  "glass-art": { bg: "#E3EBF3", tones: ["#3A6EA5", "#7FA8CE", "#D5E2EE"] },
  "leather-goods": { bg: "#EAE0D4", tones: ["#4A3426", "#7A5C44", "#D9C8B4"] },
  "candles-soap": { bg: "#F3EEE3", tones: ["#8A7B5C", "#C9BCA0", "#EDE6D6"] },
  "wall-art-prints": { bg: "#E6ECE8", tones: ["#2F4A3E", "#6E8F80", "#D8E2DC"] },
};

const SELLERS = [
  {
    email: "maya@artisans.market", name: "Maya Whitfield", shopName: "Whitfield Pottery",
    slug: "whitfield-pottery", tagline: "Wheel-thrown stoneware from the Hudson Valley",
    bio: "Maya trained as a ceramicist in Stoke-on-Trent before settling in New York's Hudson Valley. Every glaze is mixed by hand in small batches; every piece is thrown, trimmed and fired in her solar-powered studio.",
    city: "Beacon, NY", country: "US", featured: true,
  },
  {
    email: "ollie@artisans.market", name: "Ollie Hartley", shopName: "Hartley & Loom",
    slug: "hartley-loom", tagline: "Naturally dyed weaves from the Welsh borders",
    bio: "Ollie weaves on a 1920s Dobcross loom in a converted barn near Hay-on-Wye. Wool comes from a flock of Badger Face sheep two fields away; dyes are madder, weld and indigo.",
    city: "Hay-on-Wye, Wales", country: "GB", featured: true,
  },
  {
    email: "ines@artisans.market", name: "Inés Duarte", shopName: "Duarte Fine Jewelry",
    slug: "duarte-fine-jewelry", tagline: "Recycled gold & ethically sourced stones",
    bio: "A third-generation metalsmith from Santa Fe, Inés casts recycled gold and silver using lost-wax techniques her grandfather taught her. Each setting is carved by hand before casting.",
    city: "Santa Fe, NM", country: "US", featured: false,
  },
  {
    email: "tom@artisans.market", name: "Tom Ashworth", shopName: "Ashworth Woodcraft",
    slug: "ashworth-woodcraft", tagline: "Green wood turning in the Chilterns",
    bio: "Tom works with windfallen oak and ash from managed woodland around his Buckinghamshire workshop, turning each piece while the timber is still green so it dries into its own unique form.",
    city: "Great Missenden, England", country: "GB", featured: true,
  },
  {
    email: "sana@artisans.market", name: "Sana Iqbal", shopName: "Kiln & Wick",
    slug: "kiln-and-wick", tagline: "Small-batch candles poured in Brooklyn",
    bio: "Sana left architecture to pursue slower craft. Her soy candles are scented with steam-distilled botanicals and poured into vessels she throws herself — reusable, of course.",
    city: "Brooklyn, NY", country: "US", featured: false,
  },
  {
    email: "eleanor@artisans.market", name: "Eleanor Marsh", shopName: "Marsh & Glass",
    slug: "marsh-glass", tagline: "Kiln-formed glass from the Cornish coast",
    bio: "Eleanor gathers colour inspiration from Cornish tides — sea glass blues, granite greys, lichen greens — and fuses them into sculptural panels and tableware.",
    city: "St Ives, Cornwall", country: "GB", featured: false,
  },
];

interface SeedProduct {
  sellerSlug: string; categorySlug: string; title: string; priceCents: number;
  compareAtCents?: number; description: string; story: string; materials: string;
  color: string; dimensions: string; weightGrams: number; careInstructions: string;
  originCountry: "US" | "GB"; stock: number; featured?: boolean; variants?: { name: string; optionSize?: string; optionColor?: string; priceDeltaCents: number; stock: number }[];
  keywords: string;
}

const PRODUCTS: SeedProduct[] = [
  { sellerSlug: "whitfield-pottery", categorySlug: "pottery-ceramics", title: "Ember Glaze Stoneware Vase", priceCents: 12800, compareAtCents: 15200,
    description: "A sculptural stoneware vase finished in Maya's signature ember glaze — layers of iron-rich amber breaking to cream where the flame licked hottest. Watertight; beautiful with a single stem or empty as an object.",
    story: "Thrown on the wheel one autumn morning, this shape took eleven attempts to perfect. The ember glaze is mixed from iron oxide and wood ash gathered from Maya's neighbour's stove.",
    materials: "Stoneware, food-safe glaze", color: "Terracotta", dimensions: "H 28cm × Ø 14cm", weightGrams: 1400,
    careInstructions: "Hand wash with mild soap. Not dishwasher safe. Avoid thermal shock.",
    originCountry: "US", stock: 12, featured: true, keywords: "vase, stoneware, terracotta, handmade ceramics",
    variants: [
      { name: 'Medium / Terracotta', optionSize: "Medium", optionColor: "Terracotta", priceDeltaCents: 0, stock: 8 },
      { name: 'Large / Terracotta', optionSize: "Large", optionColor: "Terracotta", priceDeltaCents: 3600, stock: 4 },
    ] },
  { sellerSlug: "whitfield-pottery", categorySlug: "pottery-ceramics", title: "Moonstone Dinner Plate Set of 4", priceCents: 16400,
    description: "Everyday plates with a softly speckled moonstone glaze and raw exposed rim. Each plate varies slightly in tone — the quiet signature of small-batch firing.",
    story: "The speckle comes from local granite dust sieved into the slip. Fired to cone 10 over fourteen hours.",
    materials: "Stoneware", color: "Cream", dimensions: "Ø 27cm each", weightGrams: 3400,
    careInstructions: "Dishwasher safe on gentle cycle. Microwave safe.",
    originCountry: "US", stock: 6, featured: false, keywords: "plates, dinnerware, ceramics, wedding gift" },
  { sellerSlug: "whitfield-pottery", categorySlug: "pottery-ceramics", title: "Forest Drip Espresso Cups Pair", priceCents: 6400,
    description: "Two espresso cups in deep forest green dripping over a matte sand base. Weighty in the hand, thin at the lip.",
    story: "Glazed upside down so gravity does the painting.",
    materials: "Porcelain", color: "Forest Green", dimensions: "H 6cm × Ø 6cm", weightGrams: 420,
    careInstructions: "Hand wash recommended.", originCountry: "US", stock: 18, keywords: "espresso, cups, green, porcelain" },

  { sellerSlug: "hartley-loom", categorySlug: "textiles-weaving", title: "Indigo Herringbone Throw", priceCents: 24500, compareAtCents: 28000,
    description: "A generously sized herringbone throw woven from undyed Welsh wool and dipped six times in a live indigo vat. Softens beautifully with use; the kind of heirloom that outlives trends.",
    story: "Woven on Ollie's 1920s Dobcross loom over two days. The indigo vat is fed with fructose and kept alive like sourdough.",
    materials: "100% Welsh wool, natural indigo", color: "Indigo", dimensions: "130 × 200 cm", weightGrams: 1600,
    careInstructions: "Dry clean or hand wash cold with pH-neutral soap. Air dry away from sun.",
    originCountry: "GB", stock: 5, featured: true, keywords: "throw, blanket, wool, indigo, wales" },
  { sellerSlug: "hartley-loom", categorySlug: "textiles-weaving", title: "Madder Rose Table Runner", priceCents: 9800,
    description: "Linen runner dyed with madder root to a dusty rose, hemmed by hand. The colour deepens gently over years of washing.",
    story: "Madder roots were grown and dried within twenty miles of the loom.",
    materials: "Belgian linen, madder dye", color: "Rust", dimensions: "45 × 180 cm", weightGrams: 500,
    careInstructions: "Machine wash cold, line dry, warm iron.", originCountry: "GB", stock: 9, keywords: "table runner, linen, natural dye" },
  { sellerSlug: "hartley-loom", categorySlug: "textiles-weaving", title: "Weld & Indigo Cushion Cover", priceCents: 7200,
    description: "Double-sided cushion cover: weld yellow on one side, indigo on the other. Two cushions in one.",
    story: "A study in the only two natural dyes that never fade quietly.",
    materials: "Wool-linen blend", color: "Sand", dimensions: "50 × 50 cm", weightGrams: 400,
    careInstructions: "Spot clean. Cushion pad not included.", originCountry: "GB", stock: 14, keywords: "cushion, pillow, natural dyes" },

  { sellerSlug: "duarte-fine-jewelry", categorySlug: "jewelry", title: "Terra Signet Ring · Recycled Gold", priceCents: 42000, compareAtCents: 48000,
    description: "A weighty signet ring hand-carved and cast in 14k recycled gold, with Inés' fingerprint-hammer texture across the face. Engraving available on request.",
    story: "Cast using the lost-wax method her grandfather used in his Santa Fe workshop in the 1950s.",
    materials: "14k recycled gold", color: "Gold", dimensions: "Face 12mm; sizes 5–11", weightGrams: 12,
    careInstructions: "Polish with jewellery cloth. Store separately.",
    originCountry: "US", stock: 4, featured: true, keywords: "ring, signet, gold, jewelry",
    variants: [
      { name: "Size 7", optionSize: "7", priceDeltaCents: 0, stock: 1 },
      { name: "Size 8", optionSize: "8", priceDeltaCents: 0, stock: 2 },
      { name: "Size 9", optionSize: "9", priceDeltaCents: 0, stock: 1 },
    ] },
  { sellerSlug: "duarte-fine-jewelry", categorySlug: "jewelry", title: "Desert Pearl Drop Earrings", priceCents: 18500,
    description: "Freshwater baroque pearls suspended from hand-forged sterling silver hooks that catch light like desert rain.",
    story: "Each pearl is matched by eye over weeks until pairs feel like siblings, not twins.",
    materials: "Sterling silver, freshwater pearls", color: "Cream", dimensions: "Drop 4cm", weightGrams: 8,
    careInstructions: "Avoid perfume contact. Wipe after wear.", originCountry: "US", stock: 11, keywords: "earrings, pearls, silver" },
  { sellerSlug: "duarte-fine-jewelry", categorySlug: "jewelry", title: "Turquoise Vein Cuff Bracelet", priceCents: 29500,
    description: "An open cuff in oxidised brass veined with Kingman turquoise chips — bold, architectural, endlessly wearable.",
    story: "The vein technique was borrowed from kintsugi: imperfection made precious.",
    materials: "Brass, turquoise", color: "Gold", dimensions: "Inner 16cm; adjustable", weightGrams: 46,
    careInstructions: "Patina will deepen; polish lightly if preferred bright.", originCountry: "US", stock: 7, keywords: "bracelet, cuff, turquoise, brass" },

  { sellerSlug: "ashworth-woodcraft", categorySlug: "woodwork", title: "Windfall Oak Serving Board", priceCents: 8900,
    description: "Carved from a single windfallen oak bough, this serving board keeps the tree's living edge on one side. Finished in food-safe walnut oil and beeswax.",
    story: "The oak stood in Hampden Common for 180 years before a storm gifted it to Tom's workshop.",
    materials: "English oak, beeswax finish", color: "Natural Wood", dimensions: "42 × 20 × 2.5 cm", weightGrams: 900,
    careInstructions: "Hand wash, dry immediately. Re-oil monthly.",
    originCountry: "GB", stock: 15, featured: true, keywords: "serving board, oak, chopping, cheese board" },
  { sellerSlug: "ashworth-woodcraft", categorySlug: "woodwork", title: "Green-Turned Ash Bowl", priceCents: 11200,
    description: "Turned while the ash was green, then dried slowly — the walls ripple organically as the wood remembers growing. One of one.",
    story: "No two green-turned bowls ever match; the drying warps them into individual characters.",
    materials: "English ash", color: "Natural Wood", dimensions: "Ø 24cm × H 9cm", weightGrams: 650,
    careInstructions: "Not for dishwasher or liquids. Re-oil as needed.", originCountry: "GB", stock: 3, keywords: "bowl, ash, woodturning" },
  { sellerSlug: "ashworth-woodcraft", categorySlug: "woodwork", title: "Walnut Coffee Scoop & Clip", priceCents: 3200,
   description: "A coffee scoop turned from offcut walnut with a built-in bag clip — the small luxury your kitchen counter deserves.",
    story: "Made entirely from offcuts too small for anything else.",
    materials: "Black walnut", color: "Natural Wood", dimensions: "14 cm long", weightGrams: 60,
    careInstructions: "Wipe clean; re-oil occasionally.", originCountry: "GB", stock: 32, keywords: "coffee, scoop, walnut, gift under 50" },

  { sellerSlug: "marsh-glass", categorySlug: "glass-art", title: "Tidal Glass Wall Panel", priceCents: 34000, compareAtCents: 38000,
    description: "A kiln-formed glass panel layered like low tide — granite grey, sea glass blue and lichen green flowing into each other. Arrives ready to hang with brass fixtures.",
    story: "Eleanor sketches each panel after walking the St Ives shore at dawn.",
    materials: "Fused glass, brass", color: "Slate Blue", dimensions: "40 × 60 cm", weightGrams: 3800,
    careInstructions: "Dust with soft cloth; avoid ammonia cleaners.",
    originCountry: "GB", stock: 2, featured: true, keywords: "wall art, glass, coastal, cornwall" },
  { sellerSlug: "marsh-glass", categorySlug: "glass-art", title: "Sea Glass Tumbler Pair", priceCents: 7600,
    description: "Two tumblers in frosted sea-glass tones with a whisper of gold leaf at the rim. Surprisingly sturdy; delightfully imperfect.",
    story: "The gold rim is brushed on before the second firing.",
    materials: "Fused glass, gold leaf", color: "Slate Blue", dimensions: "H 9cm × Ø 8cm", weightGrams: 600,
    careInstructions: "Hand wash only.", originCountry: "GB", stock: 10, keywords: "tumblers, glassware, sea glass" },

  { sellerSlug: "kiln-and-wick", categorySlug: "candles-soap", title: "Cedar & Smoke Soy Candle", priceCents: 4200,
    description: "Forty hours of cedarwood, vetiver and a curl of smoke, poured into a stoneware vessel you can reuse forever. Cotton wick, soy wax, nothing else.",
    story: "Scented after evenings in Tom Ashworth's workshop next door — literally.",
    materials: "Soy wax, cotton wick, stoneware vessel", color: "Charcoal", dimensions: "H 9cm × Ø 8cm · 220g", weightGrams: 500,
    careInstructions: "Trim wick to 5mm before each burn. First burn 2+ hours.",
    originCountry: "US", stock: 40, featured: true, keywords: "candle, soy, cedar, gift" },
  { sellerSlug: "kiln-and-wick", categorySlug: "candles-soap", title: "Cold-Process Oat Milk Soap Trio", priceCents: 2800,
    description: "Three bars of cold-process soap made with oat milk and shea butter: unscented, lavender, and honey & oat. Gentle enough for faces.",
    story: "Cured for six weeks on cedar racks — patience is the ingredient.",
    materials: "Oat milk, saponified oils, shea butter", color: "Cream", dimensions: "110g per bar", weightGrams: 350,
    careInstructions: "Store dry between uses.", originCountry: "US", stock: 55, keywords: "soap, handmade, sensitive skin" },

  { sellerSlug: "hartley-loom", categorySlug: "textiles-weaving", title: "Heirloom Baby Blanket", priceCents: 13500,
    description: "The softest thing Hartley & Loom makes: lambswool in undyed ecru with a hand-knotted fringe, destined to be kept for thirty years and fought over.",
    story: "Woven extra-wide so it works as a play mat, pram cover and eventual reading blanket.",
    materials: "Lambswool", color: "Cream", dimensions: "90 × 120 cm", weightGrams: 700,
    careInstructions: "Hand wash cool, dry flat.", originCountry: "GB", stock: 8, keywords: "baby, blanket, christening, heirloom" },
  { sellerSlug: "whitfield-pottery", categorySlug: "pottery-ceramics", title: "Speckled Bud Vase Trio", priceCents: 7800,
    description: "Three little bud vases in graduated heights, glazed in speckled oatmeal with pooling cobalt inside. Group them, scatter them, gift them.",
    story: "Glazed from what remained after the dinner plate runs — waste-not pottery.",
    materials: "Stoneware", color: "Sand", dimensions: "H 8–14cm", weightGrams: 900,
    careInstructions: "Hand wash.", originCountry: "US", stock: 20, keywords: "vase, trio, bud vases, shelf decor" },
  { sellerSlug: "duarte-fine-jewelry", categorySlug: "jewelry", title: "Sunrise Band Ring · Vermeil", priceCents: 12800,
    description: "A slim band with a rising-sun arch, gold vermeil over recycled sterling. Stackable, giftable, everyday.",
    story: "Inspired by New Mexico dawns through Inés' studio window.",
    materials: "Gold vermeil (2.5μ over recycled sterling)", color: "Gold", dimensions: "Band 2mm; sizes 5–10",
    weightGrams: 4, careInstructions: "Remove before swimming/showering.", originCountry: "US", stock: 16,
    keywords: "ring, band, stackable, vermeil",
    variants: [
      { name: "Size 6", optionSize: "6", priceDeltaCents: 0, stock: 6 },
      { name: "Size 7", optionSize: "7", priceDeltaCents: 0, stock: 6 },
      { name: "Size 8", optionSize: "8", priceDeltaCents: 0, stock: 4 },
    ] },
  { sellerSlug: "ashworth-woodcraft", categorySlug: "woodwork", title: "Cherry Wood Desk Organizer", priceCents: 6800,
    description: "Pen well, phone dock and card slot in one sculptural cherry block. Cable management hidden underneath.",
    story: "Designed when Tom's own desk descended into chaos during lockdown.",
    materials: "American cherry", color: "Natural Wood", dimensions: "22 × 10 × 8 cm", weightGrams: 750,
    careInstructions: "Dust dry; wax yearly.", originCountry: "GB", stock: 12, keywords: "desk, organizer, office, cherry" },
  { sellerSlug: "marsh-glass", categorySlug: "glass-art", title: "Lichen Green Oil & Vinegar Cruets", priceCents: 8900,
    description: "A pair of blown-glass cruets in mossy lichen green with cork stoppers. Bring the hedgerow to the dinner table.",
    story: "Blown one afternoon when the fog rolled in and stayed.",
    materials: "Blown glass, cork", color: "Forest Green", dimensions: "H 14cm × Ø 7cm", weightGrams: 800,
    careInstructions: "Hand wash, dry cork fully.", originCountry: "GB", stock: 9, keywords: "cruet, oil vinegar, glass, dining" },
  { sellerSlug: "kiln-and-wick", categorySlug: "candles-soap", title: "Wild Fig & Neroli Candle", priceCents: 4200,
    description: "Green fig leaf and neroli blossom in Sana's reusable stoneware vessel — summer in a jar, forty hours of it.",
    story: "The fig scent is anchored with a trace of tomato stem. Trust us.",
    materials: "Soy wax, cotton wick, stoneware vessel", color: "Terracotta", dimensions: "H 9cm × Ø 8cm · 220g", weightGrams: 500,
    careInstructions: "Trim wick before each burn.", originCountry: "US", stock: 36, keywords: "candle, fig, neroli, summer" },
];

const CUSTOMERS = [
  { email: "customer@demo.com", name: "Priya Sharma", region: "US" },
  { email: "james@example.co.uk", name: "James Whitmore", region: "GB" },
  { email: "sofia@example.com", name: "Sofia Reyes", region: "US" },
];

async function main() {
  console.log("Seeding…");
  mkdirSync(join(PUBLIC_DIR, "products"), { recursive: true });
  mkdirSync(join(PUBLIC_DIR, "categories"), { recursive: true });
  mkdirSync(join(PUBLIC_DIR, "people"), { recursive: true });

  await db.analyticsEvent.deleteMany();
  await db.stockLog.deleteMany();
  await db.supportMessage.deleteMany();
  await db.shipmentEvent.deleteMany();
  await db.payment.deleteMany();
  await db.orderItem.deleteMany();
  await db.review.deleteMany();
  await db.notification.deleteMany();
  await db.wishlistItem.deleteMany();
  await db.productVariant.deleteMany();
  await db.productImage.deleteMany();
  await db.product.deleteMany();
  await db.coupon.deleteMany();
  await db.address.deleteMany();
  await db.sellerProfile.deleteMany();
  await db.newsletterSubscriber.deleteMany();
  await db.user.deleteMany();
  await db.category.deleteMany();

  // Categories
  const catIdBySlug: Record<string, string> = {};
  let sortIdx = 0;
  const CATEGORY_DEFS = [
    { slug: "pottery-ceramics", name: "Pottery & Ceramics", description: "Hand-thrown stoneware, porcelain and earthenware from studio potters." },
    { slug: "textiles-weaving", name: "Textiles & Weaving", description: "Handwoven throws, naturally dyed linens and fibre art." },
    { slug: "jewelry", name: "Jewelry", description: "Forged metalwork, gemstone settings and precious beadwork." },
    { slug: "woodwork", name: "Woodwork", description: "Carved bowls, turned vessels and fine furniture accents." },
    { slug: "glass-art", name: "Glass Art", description: "Blown glass, kiln-formed pieces and stained glass craft." },
    { slug: "leather-goods", name: "Leather Goods", description: "Vegetable-tanned leather bags, wallets and accessories." },
    { slug: "candles-soap", name: "Candles & Soap", description: "Small-batch soy candles and cold-process artisan soaps." },
    { slug: "wall-art-prints", name: "Wall Art & Prints", description: "Original paintings, relief prints and hand-pulled screen prints." },
  ];
  for (const def of CATEGORY_DEFS) {
    const palette = PALETTES[def.slug];
    const url = await saveArt(`categories/${def.slug}.svg`, tileSvg(def.slug, palette));
    const cat = await db.category.create({
      data: { name: def.name, slug: def.slug, description: def.description, imageUrl: url, sortOrder: sortIdx++ },
    });
    catIdBySlug[def.slug] = cat.id;
  }

  // Hero
  await saveArt("hero.svg", heroSvg());

  // Sellers + their user accounts
  const passwordHash = await bcrypt.hash("Password123!", 12);
  const sellerIdBySlug: Record<string, string> = {};
  for (const s of SELLERS) {
    const user = await db.user.create({
      data: { email: s.email, passwordHash, name: s.name, role: "SELLER", region: s.country === "GB" ? "GB" : "US" },
    });
    const logo = await saveArt(`people/${s.slug}-logo.svg`, avatarSvg(s.slug + "-logo"));
    const banner = await saveArt(`people/${s.slug}-banner.svg`, productSvg(s.slug + "-banner", PALETTES["pottery-ceramics"]));
    const profile = await db.sellerProfile.create({
      data: {
        userId: user.id, shopName: s.shopName, slug: s.slug, tagline: s.tagline, bio: s.bio,
        logoUrl: logo, bannerUrl: banner, city: s.city, country: s.country,
        returnPolicy: "Returns accepted within 30 days in original condition. Bespoke commissions are final sale.",
        shippingPolicy: "Each piece is packed in recycled, plastic-free padding. Ships within 3 business days.",
        featured: s.featured, lowStockThreshold: 3,
      },
    });
    sellerIdBySlug[s.slug] = profile.id;
  }

  // Demo customer accounts
  const customerIds: { id: string; email: string; name: string }[] = [];
  for (const c of CUSTOMERS) {
    const user = await db.user.create({
      data: { email: c.email, passwordHash, name: c.name, role: "CUSTOMER", region: c.region as "US" | "GB" },
    });
    if (c.region === "US") {
      await db.address.create({
        data: {
          userId: user.id, label: "Home", fullName: c.name, line1: "128 Grove Street", line2: "Apt 4B",
          city: "Brooklyn", state: "NY", postalCode: "11221", country: "US", isDefault: true, phone: "+1 718 555 0142",
        },
      });
    } else {
      await db.address.create({
        data: {
          userId: user.id, label: "Home", fullName: c.name, line1: "42 Camden Row",
          city: "London", state: "Greater London", postalCode: "NW1 7EA", country: "GB", isDefault: true,
        },
      });
    }
    customerIds.push({ id: user.id, email: c.email, name: c.name });
  }

  // Products with generated art (4 images each)
  const productIds: { id: string; slug: string; sellerSlug: string; priceCents: number }[] = [];
  for (const p of PRODUCTS) {
    const palette = PALETTES[p.categorySlug];
    const images: string[] = [];
    for (let i = 0; i < 4; i++) {
      const url = await saveArt(`products/${p.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${i + 1}.svg`, productSvg(p.title + i + p.sellerSlug, palette));
      images.push(url);
    }
    const slug = p.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const product = await db.product.create({
      data: {
        sellerId: sellerIdBySlug[p.sellerSlug], categoryId: catIdBySlug[p.categorySlug],
        title: p.title, slug, description: p.description, story: p.story,
        sku: `AM-${p.categorySlug.slice(0, 3).toUpperCase()}-${String(productIds.length + 1).padStart(3, "0")}`,
        priceCents: p.priceCents, compareAtCents: p.compareAtCents ?? null,
        materials: p.materials, color: p.color, dimensions: p.dimensions, weightGrams: p.weightGrams,
        careInstructions: p.careInstructions, originCountry: p.originCountry,
        stock: p.stock, status: "ACTIVE", featured: p.featured ?? false,
        metaTitle: `${p.title} | Handmade on Artisan Market`,
        metaDescription: p.description.slice(0, 158), keywords: p.keywords,
        images: { create: images.map((url, i) => ({ url, alt: `${p.title} view ${i + 1}`, sortOrder: i })) },
        variants: p.variants ? { create: p.variants.map(v => ({ ...v })) } : undefined,
        stockLogs: { create: [{ delta: p.stock, reason: "INIT" }] },
      },
    });
    productIds.push({ id: product.id, slug, sellerSlug: p.sellerSlug, priceCents: p.priceCents });
  }

  // Reviews
  const reviewTexts = [
    { rating: 5, title: "Exceeded every expectation", body: "The photos don't capture how lovely this is in person. You can feel the maker's hands in every detail. Packaging was beautiful too — zero plastic." },
    { rating: 5, title: "My new favourite thing", body: "Ordered on Monday, arrived Thursday, in use ever since. The quality is genuinely heirloom-grade." },
    { rating: 4, title: "Beautiful, minor quirk", body: "Gorgeous craftsmanship and the story card was a lovely touch. Colour is slightly deeper than pictured, which I actually prefer." },
    { rating: 5, title: "Gifted and adored", body: "Bought this for my mother's birthday. She hasn't stopped talking about it. Will absolutely buy from this maker again." },
    { rating: 4, title: "Lovely piece", body: "Well made and shipped quickly. Would recommend to anyone who values handmade goods." },
  ];
  let reviewCount = 0;
  for (const prod of PRODUCTS) {
    const n = 2 + Math.floor(makeRng(prod.title)() * 3); // 2-4 reviews
    const pid = productIds.find(x => x.slug === prod.title.toLowerCase().replace(/[^a-z0-9]+/g, "-"))!.id;
    let sum = 0;
    for (let i = 0; i < n; i++) {
      const t = reviewTexts[(reviewCount + i) % reviewTexts.length];
      const cust = customerIds[(reviewCount + i) % customerIds.length];
      await db.review.create({
        data: {
          productId: pid, userId: cust.id, rating: t.rating, title: t.title, body: t.body,
          verifiedPurchase: true, createdAt: new Date(Date.now() - ((reviewCount * 3 + i) % 45) * 86400000),
        },
      });
      sum += t.rating;
    }
    reviewCount += n;
    await db.product.update({ where: { id: pid }, data: { ratingAvg: Math.round((sum / n) * 10) / 10, ratingCount: n } });
  }

  // Sample orders for dashboard richness
  const statuses = ["DELIVERED", "DELIVERED", "SHIPPED", "PROCESSING", "PENDING", "CANCELLED", "DELIVERED", "SHIPPED"];
  for (let i = 0; i < statuses.length; i++) {
    const status = statuses[i];
    const cust = customerIds[i % customerIds.length];
    const prod = productIds[i % productIds.length];
    const qty = 1 + (i % 2);
    const subtotal = prod.priceCents * qty;
    const shipping = subtotal > 7500 ? 0 : 599;
    const tax = Math.round(subtotal * 0.08);
    const placedAt = new Date(Date.now() - (i * 6 + 2) * 86400000);
    const order = await db.order.create({
      data: {
        orderNumber: `AM-SEED-${1000 + i}`, userId: cust.id, email: cust.email, status,
        subtotalCents: subtotal, shippingCents: shipping, taxCents: tax,
        totalCents: subtotal + shipping + tax, currency: cust.email.endsWith(".co.uk") || cust.email.includes("whitmore") ? "GBP" : "USD",
        region: cust.email.endsWith(".co.uk") || cust.email.includes("whitmore") ? "GB" : "US",
        shipFullName: cust.name, shipLine1: "128 Grove Street", shipCity: "Brooklyn", shipState: "NY",
        shipPostalCode: "11221", shipCountry: "US", placedAt,
        estimatedDeliveryMin: new Date(placedAt.getTime() + 4 * 86400000),
        estimatedDeliveryMax: new Date(placedAt.getTime() + 7 * 86400000),
        items: {
          create: [{
            productId: prod.id, title: PRODUCTS.find(p => p.title.toLowerCase().replace(/[^a-z0-9]+/g, "-") === prod.slug)!.title,
            unitPriceCents: prod.priceCents, quantity: qty,
            imageUrl: `/products/${prod.slug}-1.svg`,
          }],
        },
        payments: { create: [{ provider: "manual", amountCents: subtotal + shipping + tax, status: status === "CANCELLED" ? "REFUNDED" : "SUCCEEDED" }] },
        events: {
          create: [
            { status: "PENDING", message: "Order placed", createdAt: placedAt },
            ...(status !== "PENDING" ? [{ status: "PROCESSING", message: "Artisan preparing your pieces", createdAt: new Date(placedAt.getTime() + 86400000) }] : []),
            ...(["SHIPPED", "DELIVERED"].includes(status) ? [{ status: "SHIPPED", message: "Handed to carrier", createdAt: new Date(placedAt.getTime() + 2 * 86400000) }] : []),
            ...(status === "DELIVERED" ? [{ status: "DELIVERED", message: "Delivered — enjoy!", createdAt: new Date(placedAt.getTime() + 5 * 86400000) }] : []),
            ...(status === "CANCELLED" ? [{ status: "CANCELLED", message: "Cancelled at customer request", createdAt: new Date(placedAt.getTime() + 86400000) }] : []),
          ],
        },
      },
    });
    // sales attribution
    await db.product.update({ where: { id: prod.id }, data: { salesCount: { increment: qty } } });
    await db.analyticsEvent.create({
      data: { type: "PURCHASE", productId: prod.id, valueCents: subtotal, createdAt: placedAt },
    });
  }

  // Wishlist for demo customer
  await db.wishlistItem.create({
    data: { userId: customerIds[0].id, productId: productIds[3].id },
  });

  // Coupons
  await db.coupon.createMany({
    data: [
      { code: "WELCOME10", percentOff: 10, active: true, minSubtotalCents: 0 },
      { code: "HANDMADE20", amountOffCents: 2000, active: true, minSubtotalCents: 10000 },
    ],
  });

  // Newsletter sample
  await db.newsletterSubscriber.create({ data: { email: "early-adopter@example.com" } }).catch(() => {});

  // Analytics events over past 60 days for charts/funnel
  const rng = makeRng("analytics");
  for (let day = 60; day >= 0; day--) {
    const views = 8 + Math.floor(rng() * 22);
    const carts = Math.floor(views * (0.18 + rng() * 0.14));
    const purchases = Math.floor(carts * (0.25 + rng() * 0.25));
    const date = Date.now() - day * 86400000;
    for (let i = 0; i < views; i++)
      await db.analyticsEvent.create({ data: { type: "PRODUCT_VIEW", productId: productIds[Math.floor(rng() * productIds.length)].id, createdAt: new Date(date - i * 60000) } });
    for (let i = 0; i < carts; i++)
      await db.analyticsEvent.create({ data: { type: "ADD_TO_CART", productId: productIds[Math.floor(rng() * productIds.length)].id, createdAt: new Date(date - i * 120000) } });
    if (purchases > 0)
      await db.analyticsEvent.create({ data: { type: "PURCHASE", valueCents: 5000 + Math.floor(rng() * 30000), createdAt: new Date(date) } });
  }

  // Notifications for first seller (dashboard demo)
  const mayaUser = await db.user.findUniqueOrThrow({ where: { email: "maya@artisans.market" } });
  await db.notification.createMany({
    data: [
      { userId: mayaUser.id, type: "ORDER", title: "New order received", body: "Order AM-SEED-1002 is awaiting processing.", link: "/seller/orders" },
      { userId: mayaUser.id, type: "STOCK", title: "Low stock alert", body: "Forest Drip Espresso Cups Pair is running low.", link: "/seller/products" },
      { userId: mayaUser.id, type: "REVIEW", title: "New 5-star review", body: "Someone left you a glowing review.", link: "/seller/reviews" },
    ],
  });

  console.log(`Seeded: ${SELLERS.length} sellers, ${PRODUCTS.length} products, ${CUSTOMERS.length} customers.`);
  console.log("Logins (password: Password123!):");
  console.log("  seller   → maya@artisans.market");
  console.log("  customer → customer@demo.com");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
