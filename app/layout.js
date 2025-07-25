import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer, Zoom } from "react-toastify";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "BillzPaddi - Affordable Data Bundles, Airtime Top-ups and more",
  description:
    "BillzPaddi - Purchase of Airtime, Cheap Internet Data Bundles, Airtime Top up. Fast, secure, and reliable solutions for your everyday digital needs.",
  openGraph: {
    title: "BillzPaddi - Affordable Data Bundles, Airtime Top-ups and more",
    description:
      "BillzPaddi - Purchase of Airtime, Cheap Internet Data Bundles, Airtime Top up. Fast, secure, and reliable solutions for your everyday digital needs.",
    url: "https://www.billzpaddi.com.ng",
    siteName: "BillzPaddi",
    images: [
      {
        url: "https://www.billzpaddi.com.ng/og-image.png", // 🖼 Replace with actual hosted image URL
        width: 1200,
        height: 630,
        alt: "BillzPaddi - Fast, Secure Payments",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BillzPaddi - Affordable Data Bundles, Game Top-ups and more",
    description:
      "BillzPaddi - Purchase of Airtime, Cheap Internet Data Bundles, Games Direct Top up. Fast, secure, and reliable solutions for your everyday digital needs.",
    images: ["https://www.billzpaddi.com.ng/og-image.png"], // 🖼 Same image as above
  },
};


export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/** our toast */}
        <ToastContainer
          autoClose={1900}
          hideProgressBar
          draggable
          transition={Zoom}
          closeOnClick
          theme="dark"
          className="mt-4" // Responsive margin
          style={{ top: "4.7rem" }}
        />
        {children}
      </body>
    </html>
  );
}
