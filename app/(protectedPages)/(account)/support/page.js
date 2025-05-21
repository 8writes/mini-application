"use client";
import Link from "next/link";
import { useGlobalContext } from "@/context/GlobalContext";
import { FaWhatsapp, FaEnvelope, FaHeadset, FaClock } from "react-icons/fa";

export default function Page() {
  const { user, isLoading } = useGlobalContext();

  if (!user || isLoading) {
    return (
      <div className="flex items-center justify-center h-[30rem]">
        <img
          src="/icons/loader-white.svg"
          alt="Loading..."
          className="w-20 h-20"
        />
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center justify-center bg-gray-700 text-white">
      <section className="max-w-4xl w-full space-y-8 px-4">
        {/* Header with icon */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center bg-blue-900/20 p-4 rounded-full">
            <FaHeadset className="text-3xl text-blue-400" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold">We're Here to Help</h1>
          <p className="text-gray-400">Choose your preferred support channel</p>
        </div>

        {/* Support Cards - 2 columns on desktop, 1 column on mobile */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* WhatsApp Card */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-green-500 transition-all duration-300 shadow-lg">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="bg-green-900/20 p-3 rounded-full">
                <FaWhatsapp className="text-3xl text-green-500" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">
                  Instant WhatsApp Support
                </h2>
                <p className="text-gray-400 mt-1">
                  Get real-time assistance from our team
                </p>
              </div>
              <Link
                href="https://wa.me/2349011023653"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg flex items-center justify-center gap-3 transition-colors duration-200 font-medium"
              >
                <FaWhatsapp />
                Start Chat
              </Link>
            </div>
          </div>

          {/* Email Card */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-blue-500 transition-all duration-300 shadow-lg">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="bg-blue-900/20 p-3 rounded-full">
                <FaEnvelope className="text-3xl text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Email Support</h2>
                <p className="text-gray-400 mt-1">
                  Detailed inquiries? We'll respond promptly
                </p>
              </div>
              <Link
                href="mailto:support@billzpaddi.com.ng"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center justify-center gap-3 transition-colors duration-200 font-medium"
              >
                <FaEnvelope />
                Send Email
              </Link>
            </div>
          </div>
        </div>

        {/* Support Hours - Full width below cards */}
        <div className="bg-gray-800/50 rounded-lg p-4 flex items-center gap-3 border border-gray-700">
          <FaClock className="text-yellow-400 text-xl" />
          <div>
            <p className="font-medium">24/7 Support Availability</p>
            <p className="text-sm text-gray-400">
              Typically respond within minutes
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
