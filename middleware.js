import { NextResponse } from "next/server";
import { verifySession, SESSION_COOKIE } from "./lib/session";

const PROTECTED_PREFIXES = ["/dashboard", "/daily-entry"];

export async function middleware(req) {
  const { pathname } = req.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;

  if (!session) {
    const loginUrl = new URL("/login", req.url);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/daily-entry/:path*"],
};
