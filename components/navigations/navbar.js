"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useGlobalContext } from "@/context/GlobalContext";
import { toast } from "react-toastify";
import { HiOutlineLogout } from "react-icons/hi";

export default function NavBar() {
  const { user } = useGlobalContext();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();
  const dropdownRef = useRef(null);

  // toggle dropdown
  const toggleDropdown = () => {
    setIsDropdownOpen((prevState) => !prevState);
  };

  // handle logout
  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      // logout user
      const res = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (res.ok) {
        // clear token from localStorage
        localStorage.removeItem("token_mini_app");

        router.push("/auth/login");
        toast.success("Logged out");
      } else {
        toast.error("Failed to logout");
        console.error("Failed to logout");
      }
    } catch (err) {
      console.error("Error during logout:", err);
    } finally {
      setIsLoggingOut(false);
    }
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

  console.log(user);
  return (
    <div className="bg-gray-900 text-white">
      <section className="flex justify-between items-center p-4 md:px-10 w-full md:max-w-7xl mx-auto">
        <div className="text-xl uppercase">Mini App</div>
        <div className="relative flex items-center">
          {/* User Avatar */}
          <Image
            src={user?.profile_photo?.url || "/default-profile.png"}
            alt="User avatar"
            width={40}
            height={40}
            className="rounded-full h-10 w-10 object-cover border cursor-pointer"
            onClick={toggleDropdown}
          />

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div
              ref={dropdownRef}
              className="absolute right-0 top-14 mt-2 w-44 bg-white shadow-lg rounded-md border border-gray-200"
            >
              <ul className="py-2 text-sm text-gray-700">
                <li className="text-base px-4 py-2 text-gray-800 border-b border-gray-200">
                  {user?.last_name} {user?.first_name?.charAt(0)}.
                </li>
                <li
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-gray-100 transition-colors duration-200 cursor-pointer"
                >
                  <HiOutlineLogout className="text-xl" />
                  {isLoggingOut ? "Logging out..." : "Logout"}
                </li>
              </ul>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
