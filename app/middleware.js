import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

// protected routes
const protectedRoutes = ["/users"];

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // protect specific routes
  if (!protectedRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  const token = request.cookies.get("token")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    await jwtVerify(token, secret);
    return NextResponse.next();
  } catch (err) {
    console.error("JWT error:", err.message);
    return NextResponse.redirect(new URL("/login", request.url));
  }
}
