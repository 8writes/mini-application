"use client";
import { useGlobalContext } from "@/context/GlobalContext";
export default function Page() {
  const { user } = useGlobalContext();

  if (!user) {
    return;
  }

  return (
    <div>
      <section className="">
        <div className="flex flex-wrap justify-between gap-2 items-center mb-6">
          <h1 className="text-2xl md:text-3xl">
            Betting Services Coming Soon
          </h1>
        </div>
      </section>
    </div>
  );
}
