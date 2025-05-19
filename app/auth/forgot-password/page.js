"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import Link from "next/link";
import { HiEye, HiEyeOff } from "react-icons/hi";

export default function LoginPage() {
  const [formData, setFormData] = useState({ email: "" });
  const [isLoadingSubmit, setIsLoadingSubmit] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token_mini_app");
    if (token) {
      router.push("/dashboard");
    }
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoadingSubmit(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
      }
    } catch (err) {
      toast.error("Something went wrong");
    } finally {
      setIsLoadingSubmit(false);
    }
  };

  return (
    <main className="min-h-[100dvh] bg-gradient-to-r from-gray-300 to-gray-700 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white p-6 rounded-2xl shadow-lg">
        <div className="text-center mb-6">
          {/* Replace with your logo */}
          <div className="text-3xl font-bold text-blue-900 mb-2">
            𝗕𝗶𝗹𝗹𝘇𝗣𝗮𝗱𝗱𝗶
          </div>
          <p className="text-blue-800">
            Forgot Password<span className="rotate-20 inline-block">?</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-800">
              Email Address
            </label>
            <input
              type="email"
              required
              disabled={isLoadingSubmit}
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="w-full px-4 py-2 border text-gray-800 border-gray-400 rounded-lg outline-none disabled:opacity-50"
              placeholder="you@example.com"
            />
          </div>

          <button
            type="submit"
            disabled={true}
            className="w-full py-3 bg-gray-600 cursor-pointer hover:bg-gray-800 transition duration-150 text-white font-semibold rounded-lg disabled:opacity-50"
          >
            {isLoadingSubmit ? "Sending..." : "Send Reset Link"}
          </button>
        </form>
        <p className="text-gray-800 text-sm text-center mt-4">
          Remembered Password{" "}
          <span className="rotate-20 inline-block">?</span>{" "}
          <Link
            href="/auth/login"
            className="text-gray-800 cursor-pointer hover:text-gray-700"
          >
            Login
          </Link>
        </p>
      </div>
    </main>
  );
}
