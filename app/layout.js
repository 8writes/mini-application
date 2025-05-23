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
  title: "BillzPaddi - Affordable Data Bundles, Game Top-ups and more",
  description:
    "BillzPaddi - Purchase of Airtime, Cheap Internet Data Bundles, Games Direct Top up. Fast, secure, and reliable solutions for your everyday digital needs.",
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
