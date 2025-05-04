import { serialize } from "cookie";

export async function POST() {
  const cookie = serialize("token_mini_app", "", {
    httpOnly: true,
    path: "/",
    expires: new Date(0),
  });

  return new Response(JSON.stringify({ message: "Logged out" }), {
    status: 200,
    headers: { "Set-Cookie": cookie },
  });
}
