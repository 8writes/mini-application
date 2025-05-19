"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import Link from "next/link";

export default function LoginPage() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
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
        const tokenData = {
          value: "true",
          expiry: Date.now() + 3600000,
        };
        localStorage.setItem("token_mini_app", JSON.stringify(tokenData));
        router.push("/dashboard");
      } else {
        const data = await res.json();
        toast.error(data.message || "Login failed");
      }
    } catch (err) {
      toast.error("Something went wrong");
    } finally {
      setIsLoadingSubmit(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-r from-gray-300 to-gray-700 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white p-6 rounded-2xl shadow-lg">
        <div className="text-center mb-6">
          {/* Replace with your logo */}
          <div className="text-2xl font-bold text-blue-900 mb-2">
            BillzPaddi
          </div>
          <p className="text-gray-500">Welcome Back</p>
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

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-800">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                disabled={isLoadingSubmit}
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="w-full px-4 py-2 border pr-10 text-gray-800 border-gray-400 rounded-lg outline-none disabled:opacity-50"
                placeholder="******"
              />
              <span
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 cursor-pointer"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "🙈" : "👁️"}
              </span>
            </div>
          </div>

          <div className="flex justify-end">
            <Link href="/forgot-password" className="text-gray-800 text-sm hover:text-gray-700">
              Forgot Password<span className="rotate-20 inline-block">?</span>
            </Link>
          </div>

          <button
            type="submit"
            disabled={isLoadingSubmit}
            className="w-full py-3 bg-gray-600 cursor-pointer hover:bg-gray-800 transition duration-150 text-white font-semibold rounded-lg disabled:opacity-50"
          >
            {isLoadingSubmit ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </main>
  );
}
