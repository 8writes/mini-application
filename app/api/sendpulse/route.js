// This is a API route that handles sending emails using SendPulse's SMTP service.
// It verifies the email address before sending the email and returns a response indicating success or failure.
import nodemailer from "nodemailer";

export async function POST(req) {
  try {
    const { email, subject, message } = await req.json();

    // get OAuth Token from SendPulse
    const tokenResponse = await fetch(
      "https://api.sendpulse.com/oauth/access_token",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grant_type: "client_credentials",
          client_id: process.env.SENDPULSE_CLIENT_ID,
          client_secret: process.env.SENDPULSE_CLIENT_SECRET,
        }),
      }
    );

    const tokenData = await tokenResponse.json();
    if (!tokenData.access_token) {
      return new Response(
        JSON.stringify({ error: "Failed to get access token" }),
        { status: 401 }
      );
    }

    // verify Email Before Sending
    const emailCheck = await fetch(
      "https://api.sendpulse.com/verifier-service/send-single-to-verify/",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      }
    );

    const emailData = await emailCheck.json();

    if (!emailData.result) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid email, cannot send.",
        }),
        { status: 400 }
      );
    }

    // configure SendPulse SMTP Transport
    const transporter = nodemailer.createTransport({
      host: "smtp-pulse.com",
      port: 465,
      secure: true, // SSL
      auth: {
        user: process.env.SENDPULSE_SMTP_USER,
        pass: process.env.SENDPULSE_SMTP_PASS,
      },
    });

    // send Email
    const info = await transporter.sendMail({
      from: `"BillzPaddi" <team@billzpaddi.com.ng>`,
      to: email,
      subject: subject,
      html: message,
    });

    return new Response(
      JSON.stringify({ success: true, messageId: info.messageId }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error sending email:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500 }
    );
  }
}
