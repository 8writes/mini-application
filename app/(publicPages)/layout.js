"use client";

import GlobalFooter from "@/components/navigations/globalFooter";
import GlobalNavbar from "@/components/navigations/globalNavbar";

export default function PagesLayout({ children }) {
  return (
    <section>
      <GlobalNavbar />
      <main className="pt-10 text-white">{children}</main>
      <GlobalFooter />
    </section>
  );
}
