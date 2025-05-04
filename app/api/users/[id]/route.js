import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { v2 as cloudinary } from "cloudinary";
import { z } from "zod";

// configure cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// validate schema
const userSchema = z.object({
  first_name: z.string().min(3, "Name must be at least 3 characters long"),
  last_name: z.string().min(3, "Name must be at least 3 characters long"),
  email: z.string().email(),
  role: z.string().default("user"),
  status: z.boolean().default(true),
  profile_photo: z.string().optional(),
});

// GET
export async function GET(_, { params }) {
  try {
    const { id } = params;

    if (!ObjectId.isValid(id)) {
      return new Response(JSON.stringify({ message: "Invalid user ID" }), {
        status: 400,
      });
    }

    const client = await clientPromise;
    const db = client.db("mini_app");

    const user = await db
      .collection("users")
      .findOne({ _id: new ObjectId(id) });

    if (!user) {
      return new Response(JSON.stringify({ message: "User not found" }), {
        status: 404,
      });
    }

    // remove sensitive data
    const { password, ...userData } = user;

    return new Response(JSON.stringify({ user: userData }), { status: 200 });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ message: "Failed to fetch user" }), {
      status: 500,
    });
  }
}

// PUT
export async function PUT(req, { params }) {
  try {
    const body = await req.json();
    const { id } = params;

    if (!ObjectId.isValid(id)) {
      return new Response(JSON.stringify({ message: "Invalid user ID" }), {
        status: 400,
      });
    }

    // validate input
    const parsed = userSchema.safeParse(body);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({
          message: "Invalid input",
          errors: parsed.error.format(),
        }),
        { status: 400 }
      );
    }

    const validated = parsed.data;

    const client = await clientPromise;
    const db = client.db("mini_app");

    await db.collection("users").updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          ...validated,
          updatedAt: new Date(),
        },
      }
    );

    // fetch the updated user and get the profile photo
    const updatedUser = await db
      .collection("users")
      .findOne(
        { _id: new ObjectId(id) },
        { projection: { profile_photo: 1, _id: 0 } }
      );

    // return the id and photo to be used to add or update image
    return new Response(
      JSON.stringify({
        message: "User updated",
        id,
        profile_photo: updatedUser?.profile_photo || null,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ message: "Failed to update user" }), {
      status: 500,
    });
  }
}

// DELETE
export async function DELETE(_, { params }) {
  try {
    const { id } = params;

    if (!ObjectId.isValid(id)) {
      return new Response(JSON.stringify({ message: "Invalid user ID" }), {
        status: 400,
      });
    }

    const client = await clientPromise;
    const db = client.db("mini_app");

    // fetch the user
    const user = await db
      .collection("users")
      .findOne({ _id: new ObjectId(id) });

    if (!user) {
      return new Response(JSON.stringify({ message: "User not found" }), {
        status: 404,
      });
    }

    if (user?.profile_photo?.public_id) {
      await cloudinary.uploader.destroy(user.profile_photo.public_id);
    }

    // then we delete the user
    await db.collection("users").deleteOne({
      _id: new ObjectId(id),
    });

    return new Response(JSON.stringify({ message: "User deleted" }), {
      status: 200,
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ message: "Failed to delete user" }), {
      status: 500,
    });
  }
}
