import { NextResponse } from "next/server";
import { signJWT } from "@/lib/jwt";
import { billzpaddi } from "@/lib/client";

export async function POST(req) {
  const { email, password } = await req.json();

  const { data, error } = await billzpaddi.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data?.user) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  // Sign a JWT with user ID/email
  const token = signJWT({ id: data.user.id, email: data.user.email });

  // Set HTTP-only cookie
  const response = NextResponse.json({ success: true });
  response.cookies.set("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });

  return response;
}
