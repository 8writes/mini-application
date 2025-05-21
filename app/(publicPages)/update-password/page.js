"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "react-toastify";
import Link from "next/link";
import { HiEye, HiEyeOff } from "react-icons/hi";
import { billzpaddi } from "@/lib/client";

export default function LoginPage() {
  const [formData, setFormData] = useState({ password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoadingSubmit, setIsLoadingSubmit] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const token = pathname.split("/").pop();

  useEffect(() => {
    if (!token) {
      router.push("/dashboard");
    }
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoadingSubmit(true);

    try {
      const { data, error } = await billzpaddi.auth.updateUser({
        password: formData?.password,
      });

      if (!error) {
        router.push("/dashboard");
      } else {
        toast.error(error.message || "Update failed");
      }
    } catch (err) {
      toast.error("Something went wrong");
    } finally {
      setIsLoadingSubmit(false);
    }
  };

  return (
    <main className="min-h-[100dvh] bg-gradient-to-r from-gray-700 to-gray-800 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white p-6 rounded-2xl shadow-lg">
        <div className="text-center mb-6">
          {/* Replace with your logo */}
          <div className="text-3xl font-bold text-blue-900 mb-2">
            𝗕𝗶𝗹𝗹𝘇𝗣𝗮𝗱𝗱𝗶
          </div>
          <p className="text-blue-800">Enter New Password</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
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
                {showPassword ? <HiEyeOff size={20} /> : <HiEye size={20} />}
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoadingSubmit}
            className="w-full py-3 bg-gray-600 cursor-pointer hover:bg-gray-800 transition duration-150 text-white font-semibold rounded-lg disabled:opacity-50"
          >
            {isLoadingSubmit ? "Submitting..." : "Change Password"}
          </button>
        </form>
      </div>
    </main>
  );
}
