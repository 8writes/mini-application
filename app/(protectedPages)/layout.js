"use client";
import NavBar from "@/components/navigations/navbar";
import SideNav from "@/components/navigations/sideNav";
import { GlobalProvider } from "@/context/GlobalContext";
import { GlobalProviderData } from "@/context/GlobalContextData";
import { PinProvider } from "@/context/PinContext";
import { TransactionToastProvider } from "@/context/TransactionToastContext";

export default function PagesLayout({ children }) {
  return (
    <TransactionToastProvider>
      <GlobalProvider>
        <GlobalProviderData>
          <PinProvider>
            <section>
              <NavBar />
              <div className="flex">
                <SideNav />
                <main className="flex-1 bg-gray-700 py-24 md:px-10 md:py-28 overflow-auto min-h-screen">
                  {children}
                </main>
              </div>
            </section>
          </PinProvider>
        </GlobalProviderData>
      </GlobalProvider>
    </TransactionToastProvider>
  );
}
