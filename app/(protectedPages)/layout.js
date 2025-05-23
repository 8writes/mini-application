"use client";
import NavBar from "@/components/navigations/navbar";
import SideNav from "@/components/navigations/sideNav";
import { GlobalProvider } from "@/context/GlobalContext";
import { GlobalProviderData } from "@/context/GlobalContextData";

export default function PagesLayout({ children }) {
  return (
    <GlobalProvider>
      <GlobalProviderData>
        <section>
          <NavBar />
          <div className="flex">
            <SideNav />
            <main className="flex-1 bg-gray-700 py-24 md:px-10 md:py-28 overflow-auto min-h-screen">
              {children}
            </main>
          </div>
        </section>
      </GlobalProviderData>
    </GlobalProvider>
  );
}
