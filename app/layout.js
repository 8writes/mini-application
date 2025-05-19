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
  title: "MINI APP",
  description: "Something cool",
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
          hideProgressBar={true}
          newestOnTop={true}
          draggable
          transition={Zoom}
          closeOnClick={true}
          theme="dark"
          className="mt-20"
        />
        {children}
      </body>
    </html>
  );
}
