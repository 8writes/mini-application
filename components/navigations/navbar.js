"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useGlobalContext } from "@/context/GlobalContext";
import { toast } from "react-toastify";
import {
  HiOutlineLogout,
  HiMenu,
  HiX,
  HiOutlineSupport,
  HiOutlineUserCircle,
  HiOutlineUser,
} from "react-icons/hi";
import Link from "next/link";

import { billzpaddi } from "@/app/api/client/client";
import { FaHeadset } from "react-icons/fa";
import NetworkIndicator from "../internet/signal";

export default function NavBar() {
  const pathname = usePathname();
  const { user, isSidebarOpen, setIsSidebarOpen, handleLogout } =
    useGlobalContext();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  // const router = useRouter();
  const dropdownRef = useRef(null);

  // toggle dropdown
  const toggleDropdown = () => {
    setIsDropdownOpen((prevState) => !prevState);
  };

  // close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="fixed w-full bg-gray-900 text-white z-50">
      <section className="flex justify-between items-center px-3 py-4 md:py-5 md:px-10 w-full md:max-w-9xl mx-auto">
        <div className="flex items-center gap-4 md:gap-7 text-xl">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            aria-label="Toggle menu"
            className="text-2xl p-1 md:hidden focus:outline-none cursor-pointer z-50 bg-gray-800 rounded-md transition-colors duration-200"
          >
            {isSidebarOpen ? <HiX size={30} /> : <HiMenu size={30} />}
          </button>
          <div className="header__logo">
            <span className="text-2xl font-bold flex items-center gap-1">
              <Image
                src="/billzpaddi-logo-icon.png"
                alt="BillzPaddi Logo"
                width={20}
                height={20}
              />{" "}
              𝗕𝗶𝗹𝗹𝘇𝗣𝗮𝗱𝗱𝗶
            </span>
          </div>
        </div>
        <div className="relative flex gap-2 items-center">
          <NetworkIndicator />
          {/* User Avatar */}
          <Image
            src={
              user?.profile_photo?.url
                ? user?.profile_photo?.url
                : "/icons/user.png"
            }
            alt="User avatar"
            width={40}
            height={40}
            className="rounded-full h-10 w-10 object-cover border cursor-pointer"
            onClick={toggleDropdown}
          />

          {/* Dropdown Menu */}
          <div
            ref={dropdownRef}
            className={`
    absolute right-0 top-14 mt-2 w-60 bg-gray-800 shadow-lg rounded-md
    transition-all duration-200 ease-out
    ${
      isDropdownOpen
        ? "opacity-100 translate-y-0"
        : "opacity-0 translate-y-2 pointer-events-none"
    }
  `}
          >
            <ul className="py-2 text-sm text-gray-700">
              <li className="text-base px-4 py-2 text-white border-b mb-2 border-gray-700">
                {user?.last_name ?? "Fetching..."} {user?.first_name?.charAt(0)}
                .
              </li>
              <Link href="/profile" onClick={() => setIsDropdownOpen(false)}>
                <li
                  className={`flex items-center gap-2 text-white w-full px-4 py-2 hover:bg-gray-700 transition-colors duration-200 cursor-pointer ${
                    pathname === "/profile" ? "bg-gray-700 w-full" : ""
                  }`}
                >
                  <HiOutlineUser className="text-xl" />
                  Profile
                </li>
              </Link>

              <li
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 mt-2 text-white hover:bg-gray-700 transition-colors duration-200 cursor-pointer"
              >
                <HiOutlineLogout className="text-xl" />
                Logout
              </li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
