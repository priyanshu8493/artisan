import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE = "session";

function secretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET || "dev-insecure-secret-change-me";
  return new TextEncoder().encode(secret);
}

async function getRole(req: NextRequest): Promise<string | null> {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    // Role lives in the user record; embed it at sign-time for edge checks
    return typeof payload.role === "string" ? payload.role : null;
  } catch {
    return null;
  }
}

/** Detect region from CDN geo headers; default US */
function detectRegion(req: NextRequest): "US" | "GB" {
  const country =
    req.headers.get("x-vercel-ip-country") ||
    req.headers.get("cf-ipcountry") ||
    req.cookies.get("region")?.value ||
    "";
  return country.toUpperCase() === "GB" ? "GB" : "US";
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const role = await getRole(req);

  const isSellerArea =
    pathname.startsWith("/seller") || pathname.startsWith("/api/seller");
  const isAdminArea =
    pathname.startsWith("/admin") || pathname.startsWith("/api/admin");
  const isAccountArea =
    pathname.startsWith("/account") ||
    pathname.startsWith("/wishlist") ||
    pathname.startsWith("/api/account");

  let res: NextResponse;

  if ((isSellerArea || isAccountArea || isAdminArea) && !role) {
    if (pathname.startsWith("/api/")) {
      res = NextResponse.json({ error: "Sign in required." }, { status: 401 });
    } else {
      const url = new URL("/login", req.url);
      url.searchParams.set("next", pathname);
      res = NextResponse.redirect(url);
    }
  } else if (isSellerArea && role && !["SELLER", "ADMIN"].includes(role)) {
    if (pathname.startsWith("/api/")) {
      res = NextResponse.json({ error: "Not authorized." }, { status: 403 });
    } else {
      res = NextResponse.redirect(new URL("/", req.url));
    }
  } else if (isAdminArea && role !== "ADMIN") {
    if (pathname.startsWith("/api/")) {
      res = NextResponse.json({ error: "Not authorized." }, { status: 403 });
    } else {
      res = NextResponse.redirect(new URL("/", req.url));
    }
  } else {
    res = NextResponse.next();
  }

  // Persist region cookie for currency/shipping logic
  if (!req.cookies.get("region")) {
    res.cookies.set("region", detectRegion(req), {
      path: "/",
      maxAge: 60 * 60 * 24 * 180,
      sameSite: "lax",
    });
  }

  return res;
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/seller/:path*",
    "/account/:path*",
    "/wishlist/:path*",
    "/api/admin/:path*",
    "/api/seller/:path*",
    "/api/account/:path*",
    "/((?!_next/static|_next/image|favicon.ico|uploads).*)",
  ],
};
