"use client";
import { useGlobalContext } from "@/context/GlobalContext";
import { FaTools } from "react-icons/fa";
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
    <div>
      <section className="px-4">
        <div className="flex flex-wrap justify-between gap-2 items-center mb-6">
          <h1 className="text-2xl md:text-3xl uppercase">Airtime Purchase</h1>
        </div>
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center justify-center bg-blue-900/20 p-6 rounded-full mb-8">
            <FaTools className="text-4xl text-blue-400" />
          </div>

          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Exciting Things Are Coming!
          </h1>

          <p className="text-xl text-gray-300 mb-8">
            We're working hard to bring you new features and services. Stay
            tuned for updates!
          </p>
        </div>
      </section>
    </div>
  );
}
