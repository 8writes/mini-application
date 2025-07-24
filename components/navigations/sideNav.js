import { useRef, useEffect } from "react";
import { useGlobalContext } from "@/context/GlobalContext";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  HiOutlineHome,
  HiOutlineUser,
  HiOutlineCreditCard,
  HiOutlinePhone,
  HiOutlineDesktopComputer,
  HiOutlineCash,
  HiDocumentText,
  HiOutlineUsers,
  HiChartBar,
  HiOutlineShoppingBag,
  HiOutlineShoppingCart,
  HiOutlineFire,
} from "react-icons/hi";
import { FaGamepad, FaHeadset } from "react-icons/fa";

export default function Sidebar() {
  const { user, isSidebarOpen, setIsSidebarOpen } = useGlobalContext();
  const sidebarRef = useRef(null);
  const overlayRef = useRef(null);

  // Close sidebar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isSidebarOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target) &&
        overlayRef.current &&
        overlayRef.current.contains(event.target)
      ) {
        setIsSidebarOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isSidebarOpen, setIsSidebarOpen]);

  return (
    <>
      {/* Overlay for mobile */}
      <div
        ref={overlayRef}
        className={`
          fixed inset-0 bg-black/60 z-30
          transition-opacity duration-300 ease-in-out
          lg:hidden
          ${isSidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"}
        `}
      />

      {/* Sidebar */}
      <div
        ref={sidebarRef}
        className={`
          fixed lg:sticky lg:top-0
          flex flex-col h-[100dvh] overflow-y-auto custom-scrollbar pt-20 bg-gray-800 pb-10 text-white w-64 shadow-lg
          transform transition-transform duration-300 ease-in-out
          z-40
          ${
            isSidebarOpen
              ? "translate-x-0"
              : "-translate-x-full lg:translate-x-0"
          }
        `}
      >
        <nav className="flex flex-col mt-4 space-y-1">
          {/* MAIN */}
          <div className="px-6 text-xs text-gray-400 uppercase mt-4 mb-1">
            Main
          </div>
          <NavItem href="/dashboard" icon={<HiOutlineHome />}>
            Dashboard
          </NavItem>
          <NavItem href="/wallet" icon={<HiOutlineCreditCard />}>
            Wallet
          </NavItem>
          {/* SERVICES */}
          <div className="px-6 text-xs text-gray-400 uppercase mt-6 mb-1">
            Services
          </div>
          <NavItem href="/airtime" icon={<HiOutlinePhone />}>
            Airtime
          </NavItem>
          <NavItem href="/data" icon={<HiChartBar />}>
            Data
          </NavItem>
          <NavItem href="/tv" icon={<HiOutlineDesktopComputer />}>
            TV Subscription
          </NavItem>
          <NavItem href="/all-services" icon={<HiOutlineFire />}>
            All Services
          </NavItem>
          {/* ACCOUNT */}
          <div className="px-6 text-xs text-gray-400 uppercase mt-6 mb-1">
            Account
          </div>
          <NavItem href="/profile" icon={<HiOutlineUser />}>
            Profile
          </NavItem>
          <NavItem href="/transactions" icon={<HiOutlineCreditCard />}>
            Transactions
          </NavItem>
          <NavItem href="/referral" icon={<HiOutlineUsers />}>
            Referral
          </NavItem>
          <NavItem href="/support" icon={<FaHeadset />}>
            Support
          </NavItem>
          {/* ACCOUNT */}
          {user?.role === "super_admin" && (
            <>
              <div className="px-6 text-xs text-gray-400 uppercase mt-6 mb-1">
                Portal
              </div>
              <NavItem href="/portal/users" icon={<HiOutlineUser />}>
                Users
              </NavItem>
              <NavItem href="/portal/deposits" icon={<HiOutlineCash />}>
                Deposits
              </NavItem>
            </>
          )}
        </nav>
      </div>
    </>
  );
}

function NavItem({ href, icon, children }) {
  const pathname = usePathname();
  const { setIsSidebarOpen } = useGlobalContext();
  const isActive = pathname === href;
  return (
    <Link
      href={href}
      onClick={() => setIsSidebarOpen(false)}
      className={`flex items-center gap-3 px-6 py-2 transition-all  hover:bg-gray-700 duration-150 ease-in-out ${
        isActive ? "bg-gray-700 border-l-4 border-blue-500" : ""
      }`}
    >
      <span className={`text-lg ${isActive ? "text-blue-400" : ""}`}>
        {icon}
      </span>
      <span className={isActive ? "font-medium" : ""}>{children}</span>
    </Link>
  );
}
