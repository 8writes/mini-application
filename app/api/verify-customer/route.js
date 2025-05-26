// app/api/verify-customer/route.js

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

    const vtpassResponse = await fetch(
      "https://vtpass.com/api/merchant-verify",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": process.env.NEXT_PUBLIC_VTPASS_API_KEY,
          "public-key": process.env.NEXT_PUBLIC_VTPASS_PUBLIC_KEY,
        },
        body: JSON.stringify({ serviceID, billersCode }),
      }
    );

    const data = await vtpassResponse.json();

    if (!vtpassResponse.ok) {
      return new Response(
        JSON.stringify({ error: data.message || "Verification failed" }),
        { status: vtpassResponse.status }
      );
    }

    return new Response(JSON.stringify(data), { status: 200 });
  } catch (error) {
    console.error("Server error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
    });
  }
}
