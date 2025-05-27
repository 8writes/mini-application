import axios from "axios";

export async function POST(request) {
  try {
    const body = await request.json();

    const response = await axios.post(
      //"https://sandbox.vtpass.com/api/pay"
      "https://vtpass.com/api/pay",
      {
        serviceID: body.serviceID,
        variation_code: body.variation_code,
        billersCode: body.billersCode,
        request_id: body.request_id,
        phone: body.phone,
        amount: body.amount,
      },
      {
        headers: {
          "api-key": process.env.VTPASS_API_KEY,
          "secret-key": process.env.VTPASS_SECRET_KEY,
          // "api-key": "a494a966debe749ecafb59b02305d4a0", TEST API Key
          // "secret-key": "SK_309c8d29497aa50254c4595dbab77bafcb3a6b2f7e0", TEST Secret Key
          "Content-Type": "application/json",
        },
      }
    );

    return new Response(JSON.stringify(response.data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("VTpass Axios Error:", error.response?.data || error.message);
    return new Response(
      JSON.stringify({
        message: "Purchase failed. Please try again.",
        error: error.message,
        ok: false,
      }),
      { status: 500 }
    );
  }
}
