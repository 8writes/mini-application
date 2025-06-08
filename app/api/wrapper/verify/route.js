import axios from "axios";

export async function POST(req) {
  try {
    const body = await req.json();
    const { serviceID, billersCode } = body;

    if (!serviceID || !billersCode) {
      return new Response(
        JSON.stringify({ error: "Missing serviceID or billersCode" }),
        { status: 400 }
      );
    }

    const { data } = await axios.post(
      // "https://sandbox.vtpass.com/api/merchant-verify"
      "https://vtpass.com/api/merchant-verify",
      { serviceID, billersCode },
      {
        headers: {
          "api-key": process.env.NEXT_PUBLIC_BILLZ_API_KEY,
          "secret-key": process.env.BILLZ_SECRET_KEY,
          // "api-key": "a494a966debe749ecafb59b02305d4a0", TEST API Key
          // "secret-key": "SK_309c8d29497aa50254c4595dbab77bafcb3a6b2f7e0",TEST Secret Key
          "Content-Type": "application/json",
        },
      }
    );

    return new Response(JSON.stringify(data), { status: 200 });
  } catch (error) {
    console.error("API error:", error?.response?.data || error.message);

    const status = error?.response?.status || 500;
    const message = error?.response?.data?.message || "Internal server error";

    return new Response(JSON.stringify({ error: message }), {
      status,
    });
  }
}
