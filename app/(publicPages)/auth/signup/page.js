"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import Link from "next/link";
import { HiEye, HiEyeOff } from "react-icons/hi";
import { billzpaddi } from "@/lib/client";
import Image from "next/image";

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    role: "customer",
    referral_code: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Get referral code from URL if present
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const refCode = urlParams.get("ref");
      if (refCode) {
        setFormData((prev) => ({
          ...prev,
          referral_code: refCode,
        }));
      }
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("sb-xwgqadrwygwhwvqcwsde-auth-token");
    if (token) {
      router.push("/dashboard");
    }
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const trimmedData = {
      ...formData,
      first_name: formData.first_name.trim(),
      last_name: formData.last_name.trim(),
      email: formData.email.trim().toLowerCase(),
      referral_code: formData.referral_code.trim(),
    };

    try {
      const { data, error: signUpError } = await billzpaddi.auth.signUp({
        email: trimmedData?.email,
        password: trimmedData?.password,
      });

      if (signUpError) {
        toast.error(signUpError.message || "Signup failed");
        return;
      }

      const { password, ...dataToSave } = trimmedData;

      const { error } = await billzpaddi.from("users").insert(dataToSave);

      if (error) {
        toast.error(error.message || "Signup failed");
        return;
      }

      await billzpaddi.from("wallets").insert({
        balance: 0,
        email: trimmedData?.email,
      });

      await billzpaddi.from("invoice_generations").insert({
        invoice_count: 0,
        email: trimmedData?.email,
      });

      toast.success("Signup successful!");
      router.push("/auth/login");
    } catch (err) {
      toast.error("Something went wrong.");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-[100dvh] bg-gradient-to-r from-gray-700 to-gray-800 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white mt-10 p-6 rounded-2xl shadow-lg">
        <div className="text-center mb-6">
          <div className="text-3xl font-bold text-blue-900 mb-2 flex items-center gap-1 justify-center">
            <Image
              src="/billzpaddi-logo-icon.png"
              alt="BillzPaddi Logo"
              width={20}
              height={20}
            />{" "}
            𝗕𝗶𝗹𝗹𝘇𝗣𝗮𝗱𝗱𝗶
          </div>
          <p className="text-blue-800">Create An Account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-gray-800">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-800">
                First Name
              </label>
              <input
                type="text"
                required
                placeholder="First Name"
                disabled={isSubmitting}
                value={formData.first_name}
                onChange={(e) =>
                  setFormData({ ...formData, first_name: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-400 rounded-md outline-none"
              />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-800">
                Last Name
              </label>
              <input
                type="text"
                required
                placeholder="Last Name"
                disabled={isSubmitting}
                value={formData.last_name}
                onChange={(e) =>
                  setFormData({ ...formData, last_name: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-400 rounded-md outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-800">
              Email Address
            </label>
            <input
              type="email"
              required
              placeholder="Email"
              disabled={isSubmitting}
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-400 rounded-md outline-none"
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
                disabled={isSubmitting}
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

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-800">
              Referral Code (Optional)
            </label>
            <input
              type="text"
              placeholder="Enter referral code"
              disabled={isSubmitting}
              value={formData.referral_code}
              onChange={(e) =>
                setFormData({ ...formData, referral_code: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-400 rounded-md outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-gray-600 cursor-pointer hover:bg-gray-800 transition duration-150 text-white font-semibold rounded-lg disabled:opacity-50"
          >
            {isSubmitting ? "Signing up... " : "Sign Up"}
          </button>
        </form>

        <p className="text-gray-800 text-sm text-center mt-4">
          Already have an account{" "}
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
