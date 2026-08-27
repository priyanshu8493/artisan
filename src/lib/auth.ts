import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { db } from "./db";
import type { Region } from "./constants";

const COOKIE_NAME = "session";
const SESSION_DAYS = 7;

function secretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET || "dev-insecure-secret-change-me";
  return new TextEncoder().encode(secret);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function signSessionToken(
  userId: string,
  role: string = "CUSTOMER"
): Promise<string> {
  return new SignJWT({ sub: userId, role })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(secretKey());
}

export async function signSessionForUser(user: { id: string; role: string }) {
  const token = await signSessionToken(user.id, user.role);
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function verifySessionToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

export async function createSessionCookie(userId: string, role = "CUSTOMER"): Promise<void> {
  await signSessionForUser({ id: userId, role });
}

export async function destroySessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: string;
  region: Region;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const userId = await verifySessionToken(token);
  if (!userId) return null;
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, role: true, region: true },
  });
  if (!user) return null;
  return user as SessionUser;
}

/** Throws ApiError(401)/ApiError(403) — pair with api handler wrapper */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new ApiError(401, "You must be signed in.");
  return user;
}

export async function requireRole(...roles: string[]): Promise<SessionUser> {
  const user = await requireUser();
  if (!roles.includes(user.role)) throw new ApiError(403, "Not authorized.");
  return user;
}

/** Admin only — used across /api/admin routes */
export async function requireAdmin(): Promise<SessionUser> {
  return requireRole("ADMIN");
}

/** Seller or admin — used across /api/seller routes */
export async function requireSeller() {
  const sessionUser = await requireRole("SELLER", "ADMIN");
  const profile = await db.sellerProfile.findUnique({
    where: { userId: sessionUser.id },
  });
  if (!profile) throw new ApiError(403, "Seller profile not found.");
  return { user: sessionUser, seller: profile };
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}
