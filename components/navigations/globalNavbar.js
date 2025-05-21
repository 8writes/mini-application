"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { HiMenu, HiX } from "react-icons/hi";

export default function GlobalNavbar() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Close menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  // Add scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      className={`fixed w-full z-50 transition-all duration-300 ${
        isScrolled ? "bg-gray-900 shadow-lg" : "bg-gray-900"
      }`}
    >
      <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4 md:py-6">
          {/* Logo */}
          <div className="header__logo">
            <Link href="/home" className="text-2xl font-bold">
              𝗕𝗶𝗹𝗹𝘇𝗣𝗮𝗱𝗱𝗶
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link
              href="/home"
              className={`hover:bg-gray-800 px-4 py-2 rounded-md transition-all duration-200 ${
                pathname === "/home" ? "bg-gray-800" : ""
              }`}
            >
              Home
            </Link>
            <Link
              href="/faq"
              className={`hover:bg-gray-800 px-4 py-2 rounded-md transition-all duration-200 ${
                pathname === "/faq" ? "bg-gray-800" : ""
              }`}
            >
              FAQs
            </Link>
            <Link
              href="/about"
              className={`hover:bg-gray-800 px-4 py-2 rounded-md transition-all duration-200 ${
                pathname === "/about" ? "bg-gray-800" : ""
              }`}
            >
              About
            </Link>
            <Link
              href="/help"
              className={`hover:bg-gray-800 px-4 py-2 rounded-md transition-all duration-200 ${
                pathname === "/help" ? "bg-gray-800" : ""
              }`}
            >
              Support
            </Link>
          </nav>

          {/* Login Button - Desktop */}
          <div className="hidden md:block">
            <Link
              href="/auth/login"
              className={`bg-gray-800 hover:bg-gray-700 text-white px-7 py-3 rounded-md gap-3 transition-colors border border-gray-700 ${
                pathname === "/auth/login" ? "border-gray-500" : ""
              }`}
            >
              Login
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="text-2xl p-1 md:hidden focus:outline-none cursor-pointer bg-gray-800 rounded-md transition-colors duration-200"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <HiX size={30} /> : <HiMenu size={30} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div
            ref={menuRef}
            className="absolute left-0 right-0 mx-4 md:hidden bg-gray-900 rounded-lg mt-2 p-4 shadow-xl"
          >
            <nav className="flex flex-col space-y-2">
              <Link
                href="/home"
                className={`hover:bg-gray-700 px-4 py-3 rounded-md transition-all duration-200 ${
                  pathname === "/home" ? "bg-gray-700" : ""
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                href="/services"
                className={`hover:bg-gray-700 px-4 py-3 rounded-md transition-all duration-200 ${
                  pathname === "/services" ? "bg-gray-700" : ""
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Services
              </Link>
              <Link
                href="/about"
                className={`hover:bg-gray-700 px-4 py-3 rounded-md transition-all duration-200 ${
                  pathname === "/about" ? "bg-gray-700" : ""
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                About
              </Link>
              <Link
                href="/help"
                className={`hover:bg-gray-700 px-4 py-3 rounded-md transition-all duration-200 ${
                  pathname === "/help" ? "bg-gray-700" : ""
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Support
              </Link>
              <Link
                href="/auth/login"
                className={`bg-gray-800 hover:bg-gray-700 text-center text-white px-7 py-3 rounded-md gap-3 transition-colors border border-gray-700 ${
                  pathname === "/auth/login" ? "border-gray-500" : ""
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Login
              </Link>
            </nav>
          </div>
        )}
      </div>
    </div>
  );
}
