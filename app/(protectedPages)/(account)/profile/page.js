"use client";
import { useGlobalContext } from "@/context/GlobalContext";
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
      <section className="">
        <div className="flex flex-wrap justify-between gap-2 items-center mb-6">
          <h1 className="text-2xl md:text-3xl uppercase">
           Profile
          </h1>
        </div>
      </section>
    </div>
  );
}
