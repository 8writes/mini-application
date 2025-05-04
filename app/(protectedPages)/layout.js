import NavBar from "@/components/navigations/navbar";
import { GlobalProvider } from "@/context/GlobalContext";

export default function PagesLayout({ children }) {
  return (
    <GlobalProvider>
      <section>
        <NavBar />
        {children}
      </section>
    </GlobalProvider>
  );
}
