"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoadingSubmit, setIsLoadingSubmit] = useState(false);
  const router = useRouter();
  
  useEffect(() => {
    // check for token
    const token = localStorage.getItem("token_mini_app");

    // if token then push to dashboard
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

      // set the token to local storage with 1 hr life span, same as cookie
      if (res.ok) {
        const tokenData = {
          value: "true",
          expiry: Date.now() + 3600000, // 1 hour
        };
        localStorage.setItem("token_mini_app", JSON.stringify(tokenData));

        router.push("/dashboard");
        toast.success("Logged in successfully");
      } else {
        const data = await res.json();
        toast.success(data.message || "Login failed");
        console.log(data.message || "Login failed");
      }
    } catch (err) {
      toast.error("Something went wrong");
      console.log(err || "Something went wrong");
    } finally {
      setIsLoadingSubmit(false);
    }
  };

  return (
    <main className="flex items-center justify-center min-h-screen">
      <form
        onSubmit={handleSubmit}
        className="border p-6 rounded shadow-md w-[90dvw] md:max-w-sm"
      >
        <h2 className="text-xl font-semibold mb-4">Welcome Back</h2>

        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="w-full mb-3 px-3 py-2 border rounded disabled:cursor-not-allowed"
          disabled={isLoadingSubmit}
          required
        />

        <div className="relative mb-4">
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
            className="w-full px-3 py-2 border rounded pr-10 disabled:cursor-not-allowed"
            disabled={isLoadingSubmit}
            required
          />
          <span
            className="absolute top-1/2 right-3 transform -translate-y-1/2 cursor-pointer select-none text-sm"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? "🙈" : "👁️"}
          </span>
        </div>

        <button
          type="submit"
          disabled={isLoadingSubmit}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
        >
          {isLoadingSubmit ? "Logging in..." : "Login"}
        </button>
      </form>
    </main>
  );
}
