import clientPromise from "@/lib/mongodb";
import { hash } from "bcryptjs";
import { z } from "zod";

// validate schema
const registerSchema = z.object({
  first_name: z.string().min(3, "Name must be at least 3 characters long"),
  last_name: z.string().min(3, "Name must be at least 3 characters long"),
  email: z.string().email(),
  password: z.string().min(6, "Password must be at least 6 characters long"),
  profile_photo: z.string().optional(),
  role: z.string(),
  status: z.boolean(),
});

export async function POST(req) {
  try {
    const body = await req.json();

    // validate input
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({
          message: "Invalid input",
          errors: parsed.error.format(),
        }),
        { status: 400 }
      );
    }

    // destructure data
    const { first_name, last_name, email, profile_photo, role, status, password } =
      parsed.data;

    // hash password
    const hashedPassword = await hash(password, 12);

    const client = await clientPromise;
    const db = client.db("mini_app");
    const usersCollection = db.collection("users");

    // check if user email taken
    const existingUser = await usersCollection.findOne({ email });
    if (existingUser) {
      return new Response(JSON.stringify({ message: "Email already in use" }), {
        status: 409,
      });
    }

    // structure data well to be saved
    const dataToSave = {
      first_name,
      last_name,
      email,
      password: hashedPassword,
      profile_photo,
      role,
      status,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // save the data to db
    await usersCollection.insertOne(dataToSave);

    return new Response(
      JSON.stringify({
        message: "User created successfully",
      }),
      { status: 201 }
    );
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ message: "Something went wrong" }), {
      status: 500,
    });
  }
}
