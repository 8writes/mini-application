import Link from "next/link";
import { FaTools, FaRocket } from "react-icons/fa";

export default function Page() {
  return (
    <div className="min-h-[100dvh] bg-gray-800 text-white flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-2xl mx-auto">
        <div className="inline-flex items-center justify-center bg-blue-900/20 p-6 rounded-full mb-8">
          <FaTools className="text-4xl text-blue-400" />
        </div>

        <h1 className="text-4xl md:text-5xl font-bold mb-6">
          Exciting Things Are Coming!
        </h1>

        <p className="text-xl text-gray-300 mb-8">
          We're working hard to bring you new features and services. Stay tuned
          for updates!
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/home"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md flex items-center justify-center gap-3 transition-colors"
          >
            Return Home
          </Link>
          <Link
            href="mailto:support@billzpaddi.com.ng"
            className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-lg flex items-center justify-center gap-3 transition-colors border border-gray-700"
          >
            Contact Us
          </Link>
        </div>
      </div>
    </div>
  );
}
