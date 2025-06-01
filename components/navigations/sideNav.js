"use client";
import Link from "next/link";
import {
  HiOutlineHome,
  HiOutlineCreditCard,
  HiOutlinePhone,
  HiChartBar,
  HiOutlineDesktopComputer,
  HiOutlineCash,
  HiOutlineClipboardCheck,
  HiOutlineUserCircle,
  HiOutlineUsers,
  HiOutlineSupport,
  HiDocumentText,
} from "react-icons/hi";
import { FaGamepad, FaHeadset } from "react-icons/fa";
import { useGlobalContext } from "@/context/GlobalContext";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export default function SideNav() {
  const { isSidebarOpen, setIsSidebarOpen } = useGlobalContext();
  const sidebarRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close sidebar if clicked outside and it's open on mobile
      if (
        isSidebarOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target) &&
        !event.target.closest("[data-nav-toggle]")
      ) {
        // Exclude nav toggle button
        setIsSidebarOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isSidebarOpen, setIsSidebarOpen]);

  {
    /** 
        <NavItem href="/bills" icon={<HiOutlineClipboardCheck />}>
          Bills Payment
        </NavItem>*/
  }

  return (
    <div
      ref={sidebarRef}
      className={`
        fixed lg:sticky lg:top-0
        flex flex-col h-[100dvh] overflow-y-auto custom-scrollbar pt-20 bg-gray-800 pb-10 text-white w-64 shadow-lg
        transform transition-transform duration-300 ease-in-out
        z-40
        ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
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
        <NavItem href="/gaming" icon={<FaGamepad />}>
          Gaming
        </NavItem>
        <NavItem href="/betting" icon={<HiOutlineCash />}>
          Betting
        </NavItem>
        <NavItem href="/generate-invoice" icon={<HiDocumentText />}>
          Generate Invoice
        </NavItem>

        {/* ACCOUNT */}
        <div className="px-6 text-xs text-gray-400 uppercase mt-6 mb-1">
          Account
        </div>
        <NavItem href="/profile" icon={<HiOutlineUserCircle />}>
          Profile
        </NavItem>
        <NavItem href="/transactions" icon={<HiOutlineCreditCard />}>
          Transactions
        </NavItem>
        {/**  <NavItem href="/referral" icon={<HiOutlineUsers />}>
          Referral
        </NavItem>*/}
        <NavItem href="/support" icon={<FaHeadset />}>
          Support
        </NavItem>
      </nav>
    </div>
  );
}

function NavItem({ href, icon, children }) {
  const pathname = usePathname();
  const { setIsSidebarOpen } = useGlobalContext();
  const isActive = pathname === href;
  return (
    <>
      <Link
        href={href}
        onClick={() => setIsSidebarOpen(false)}
        className={`flex items-center gap-3 px-6 py-2 hover:bg-gray-700 transition duration-200 ease-in-out ${
          isActive ? "bg-gray-700 border-l-4 border-blue-500" : ""
        }`}
      >
        <span className={`text-lg ${isActive ? "text-blue-400" : ""}`}>
          {icon}
        </span>
        <span className={isActive ? "font-medium" : ""}>{children}</span>
      </Link>
    </>
  );
}
