import { cookies } from "next/headers";

export async function GET() {
  const token = crypto.randomUUID(); // Secure CSRF token

  const cookieStore = await cookies();
  cookieStore.set("token", token, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    maxAge: 10, 
  });

  return Response.json({ token });
}
