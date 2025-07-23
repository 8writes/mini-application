"use client";

import StoreFooter from "@/components/navigations/storeFooter";
import SideNav from "@/components/navigations/sideNav";
import StoreNavBar from "@/components/navigations/storeNavbar";
import { GlobalProvider } from "@/context/GlobalContext";
import { GlobalProviderData } from "@/context/GlobalContextData";

export default function PagesLayout({ children }) {
  return (
    <GlobalProvider>
      <GlobalProviderData>
        <section>
          <StoreNavBar />
          <div className="flex">
            <main className="flex-1 bg-gray-700 py-24 md:px-10 md:py-28">
              {children}
            </main>
          </div>
          <StoreFooter />
        </section>
      </GlobalProviderData>
    </GlobalProvider>
  );
}
