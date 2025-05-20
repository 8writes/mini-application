import clientPromise from "@/lib/mongodb";
import { signJWT } from "@/lib/jwt";
import { serialize } from "cookie";
import { compare } from "bcryptjs";
import { z } from "zod";

// validate schema
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export async function POST(req) {
  try {
    const { email, password } = await req.json();

    // validate input
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      return new Response(
        JSON.stringify({
          message: "Invalid input",
          errors: parsed.error.format(),
        }),
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("mini_app");
    const usersCollection = db.collection("users");

    const user = await usersCollection.findOne({ email });
    if (!user) {
      return new Response(JSON.stringify({ message: "Invalid credentials" }), {
        status: 401,
      });
    }

    const isValid = await compare(password, user.password);
    
    if (!isValid) {
      return new Response(JSON.stringify({ message: "Invalid credentials" }), {
        status: 401,
      });
    }

    // create the user token
    const token = signJWT({
      userId: user._id.toString(),
      email: user.email,
      first_name: user.first_name,
    });

    // create cookie with token
    const cookie = serialize("token_mini_app", token, {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60, // 1 hour
    });

    return new Response(JSON.stringify({ message: "Logged in" }), {
      status: 200,
      headers: { "Set-Cookie": cookie },
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ message: "Something went wrong" }), {
      status: 500,
    });
  }
}
