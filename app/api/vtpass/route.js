import axios from "axios";

export async function POST(request) {
  try {
    const body = await request.json();

    const response = await axios.post(
      "https://sandbox.vtpass.com/api/pay",
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
          "api-key": "a494a966debe749ecafb59b02305d4a0",
          "secret-key": "SK_756662e6102440ae2f57cd556057e449b0d4e0077cf",
          "Content-Type": "application/json",
        },
      }
    );

    if (response.data.code === "016") {
      return new Response(
        JSON.stringify({
          message: "Payment failed",
          data: response.data,
        }),
        { status: 500 }
      );
    } else if (response.data.code === "000") {
      return new Response(JSON.stringify(response.data), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } else if (response.data.code === "099") {
      return new Response(
        JSON.stringify({
          message: "Pending",
          data: response.data,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("VTpass Axios Error:", error.response?.data || error.message);
    return new Response(
      JSON.stringify({ message: "Payment failed", error: error.message }),
      { status: 500 }
    );
  }
}
