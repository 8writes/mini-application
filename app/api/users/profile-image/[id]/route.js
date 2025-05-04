import { v2 as cloudinary } from "cloudinary";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// configure cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// POST
export async function POST(req, { params }) {
  const { id } = params;

  if (!ObjectId.isValid(id)) {
    return new Response(JSON.stringify({ message: "Invalid user ID" }), {
      status: 400,
    });
  }

  try {
    const formData = await req.formData();
    const image = formData.get("image");

    if (!image || typeof image === "string") {
      return new Response(
        JSON.stringify({ message: "No valid image provided" }),
        {
          status: 400,
        }
      );
    }

    // file size limit
    const maxSize = 5 * 1024 * 1024; // 6MB
    if (image.size > maxSize) {
      return new Response(
        JSON.stringify({ message: "Image exceeds 5MB limit" }),
        {
          status: 400,
        }
      );
    }

    // we prep the image to be uploaded to the cloud service
    const arrayBuffer = await image.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const mime = image.type;
    const dataUri = `data:${mime};base64,${base64}`;

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

    const uploadRes = await cloudinary.uploader.upload(dataUri, {
      folder: "mini_app_users",
      public_id: `user_${id}`,
      overwrite: true,
    });

    const updatedUser = await db.collection("users").updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          profile_photo: {
            url: uploadRes.secure_url,
            public_id: uploadRes.public_id,
          },
          updatedAt: new Date(),
        },
      }
    );

    return new Response(
      JSON.stringify({ message: "Image uploaded successfully", updatedUser }),
      {
        status: 200,
      }
    );
  } catch (cloudErr) {
    console.error("Cloudinary Upload Error:", cloudErr);
    return new Response(JSON.stringify({ message: "Image upload failed" }), {
      status: 500,
    });
  }
}

// PUT
export async function PUT(req, { params }) {
  const { id } = params;

  if (!ObjectId.isValid(id)) {
    return new Response(JSON.stringify({ message: "Invalid user ID" }), {
      status: 400,
    });
  }

  try {
    const formData = await req.formData();
    const image = formData.get("image");

    if (!image || typeof image === "string") {
      return new Response(
        JSON.stringify({ message: "No valid image provided" }),
        {
          status: 400,
        }
      );
    }

    // file size limit
    const maxSize = 5 * 1024 * 1024; // 6MB
    if (image.size > maxSize) {
      return new Response(
        JSON.stringify({ message: "Image exceeds 5MB limit" }),
        {
          status: 400,
        }
      );
    }

    const arrayBuffer = await image.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const mime = image.type;
    const dataUri = `data:${mime};base64,${base64}`;

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

    if (user?.profile_photo?.public_id) {
      await cloudinary.uploader.destroy(user.profile_photo.public_id);
    }

    const uploadRes = await cloudinary.uploader.upload(dataUri, {
      folder: "mini_app_users",
      public_id: `user_${id}`,
      overwrite: true,
    });

    await db.collection("users").updateOne(
      { _id: new ObjectId(id) },
      {
        $unset: { profile_photo: null },
      }
    );

    const updatedUser = await db.collection("users").updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          profile_photo: {
            url: uploadRes.secure_url,
            public_id: uploadRes.public_id,
          },
          updatedAt: new Date(),
        },
      }
    );

    return new Response(
      JSON.stringify({ message: "Image updated successfully", updatedUser }),
      {
        status: 200,
      }
    );
  } catch (cloudErr) {
    console.error("Cloudinary Update Error:", cloudErr);
    return new Response(JSON.stringify({ message: "Image update failed" }), {
      status: 500,
    });
  }
}

// DELETE
export async function DELETE(_, { params }) {
  const { id } = params;

  if (!ObjectId.isValid(id)) {
    return new Response(JSON.stringify({ message: "Invalid user ID" }), {
      status: 400,
    });
  }

  try {
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

    if (user?.profile_photo?.public_id) {
      await cloudinary.uploader.destroy(user.profile_photo.public_id);
    }

    const updatedUser = await db.collection("users").updateOne(
      { _id: new ObjectId(id) },
      {
        $set: { profile_photo: null },
      }
    );

    return new Response(
      JSON.stringify({ message: "Image deleted successfully", updatedUser }),
      {
        status: 200,
      }
    );
  } catch (cloudErr) {
    console.error("Cloudinary Deletion Error:", cloudErr);
    return new Response(JSON.stringify({ message: "Image deletion failed" }), {
      status: 500,
    });
  }
}
