import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { ApiError } from "./auth";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function fail(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

type Handler = () => Promise<Response>;

/** Wraps route handlers with consistent error mapping */
export async function handle(fn: Handler): Promise<Response> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof ZodError) {
      const first = err.errors[0];
      return fail(first ? `${first.path.join(".")}: ${first.message}` : "Invalid input.", 422);
    }
    if (err instanceof ApiError) {
      return fail(err.message, err.status);
    }
    console.error("[api]", err);
    return fail("Something went wrong. Please try again.", 500);
  }
}

export async function readJson<T>(req: Request): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    throw new ApiError(400, "Invalid JSON body.");
  }
}
