"use client";

import StoreFooter from "@/components/navigations/storeFooter";
import StoreNavBar from "@/components/navigations/storeNavbar";
import { GlobalProvider } from "@/context/GlobalContext";
import { GlobalProviderData } from "@/context/GlobalContextData";

export default function PagesLayout({ children }) {
  return (
    <GlobalProvider>
      <GlobalProviderData>
        <section>
          <StoreNavBar />
          <main className="pt-10 text-white">{children}</main>
          <StoreFooter />
        </section>
      </GlobalProviderData>
    </GlobalProvider>
  );
}
