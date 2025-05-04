"use client";
import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useGlobalContext } from "@/context/GlobalContext";

export default function NavBar() {
  const { user } = useGlobalContext();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const router = useRouter();

  // toggle dropdown
  const toggleDropdown = () => {
    setIsDropdownOpen((prevState) => !prevState);
  };

  // handle logout
  const handleLogout = async () => {
    try {
      // logout user
      const res = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (res.ok) {
        // clear token from localStorage
        localStorage.removeItem("token_mini_app");

        router.push("/auth/login");
      } else {
        console.error("Failed to logout");
      }
    } catch (err) {
      console.error("Error during logout:", err);
    }
  };

  console.log(user)
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
            <div className="absolute right-0 top-14 mt-2 p-2 bg-white text-black shadow-lg rounded-md w-40 border border-gray-200">
              <ul>
                <li
                  onClick={handleLogout}
                  className="cursor-pointer px-3 py-1 hover:bg-gray-200 transition-colors duration-200"
                >
                  Logout
                </li>
              </ul>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
