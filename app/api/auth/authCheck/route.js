import { cookies } from "next/headers";
import { jwtVerify } from "jose";

export async function GET() {
  const token = cookies().get("token_mini_app")?.value;

  if (!token) {
    return new Response(JSON.stringify({ authenticated: false }), {
      status: 401,
    });
  }

  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(process.env.JWT_SECRET)
    );

    return new Response(
      JSON.stringify({ authenticated: true, user: payload }),
      { status: 200 }
    );
  } catch (error) {
    return new Response(JSON.stringify({ authenticated: false }), {
      status: 401,
    });
  }
}
