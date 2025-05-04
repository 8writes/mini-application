import clientPromise from "@/lib/mongodb";

// GET all users
export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("mini_app");
    const usersCollection = db.collection("users");

    const allUsers = await usersCollection.find({}).toArray();

    // remove sensitive info from all users
    const users = allUsers.map(({ password, ...userData }) => userData);

    return new Response(JSON.stringify(users), { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ message: "Failed to fetch users" }), {
      status: 500,
    });
  }
}
