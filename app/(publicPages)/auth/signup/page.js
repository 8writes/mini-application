"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import Link from "next/link";
import { HiEye, HiEyeOff, HiRefresh } from "react-icons/hi";

import { billzpaddi } from "@/app/api/client/client";
import Image from "next/image";
import { signupSchema } from "@/utils/inputValidation";
import { callApi } from "@/utils/apiClient";

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
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [receivePromotions, setReceivePromotions] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isSending, setIsSending] = useState(false);

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

  const getVerificationCodeTemplate = (code) => `
<div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb;">
  <div style="text-align: center; margin-bottom: 24px;">
    <div style="font-size: 24px; font-weight: 700; color: #111827;">
      <img 
        src="https://www.billzpaddi.com.ng/billzpaddi-logo-icon.png" 
        alt="BillzPaddi Logo"
        width="20" height="20"
        style="vertical-align: middle; margin-right: 8px;" 
      />
      𝗕𝗶𝗹𝗹𝘇𝗣𝗮𝗱𝗱𝗶
    </div>
  </div>
  
  <div style="background-color: white; padding: 32px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <h2 style="color: #111827; font-size: 20px; font-weight: 600; margin-top: 0; margin-bottom: 16px;">Your Verification Code</h2>
    <p style="color: #4b5563; margin-bottom: 16px;">Please use the following verification code to complete your signup process:</p>
    
    <div style="background-color: #f3f4f6; padding: 16px; border-radius: 6px; text-align: center; margin-bottom: 24px;">
      <span style="font-size: 24px; font-weight: 700; letter-spacing: 2px; color: #111827;">${code}</span>
    </div>
    
    <p style="color: #6b7280; font-size: 14px; margin-bottom: 16px;">This code will expire in 5 minutes.</p>
    <p style="color: #6b7280; font-size: 14px; margin-bottom: 0;">If you didn't request this code, please ignore this email or contact support.</p>
  </div>
  
  <div style="text-align: center; margin-top: 24px; color: #9ca3af; font-size: 14px;">
    <p>© ${new Date().getFullYear()} BillzPaddi. All rights reserved.</p>
  </div>
</div>
`;

  // Countdown timer
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const generateVerificationCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  // API call functions
  const sendEmail = async (email, subject, html) => {
    try {
      const response = await fetch("/api/sendpulse", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          subject,
          message: html,
        }),
      });

      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error("Error sending email:", error);
      return false;
    }
  };

  const sendVerificationCode = async () => {
    if (!formData.email) {
      toast.info("Please enter your email first");
      return;
    }

    if (isSending) return; // Prevent multiple clicks

    setIsSending(true); // Start loading

    try {
      const code = generateVerificationCode();

      sessionStorage.setItem(
        "verificationCode",
        JSON.stringify({
          code,
          email: formData.email,
          expires: Date.now() + 5 * 60 * 1000, // 5 minutes expiration
        })
      );

      // Here we'll send the email
      const emailSent = await sendEmail(
        formData.email,
        "Your Email Verification Code",
        getVerificationCodeTemplate(code)
      );

      if (emailSent) {
        toast.success(`Verification code sent to ${formData.email}`);
        setIsCodeSent(true);
        setCountdown(120); // 2 minutes countdown
      } else {
        throw new Error("Failed to send email");
      }

      setIsCodeSent(true);
      setCountdown(120); // 2 minutes countdown
    } catch (error) {
      console.error("Error sending verification code:", error);
      toast.error("Failed to send verification code");
    } finally {
      setIsSending(false);
    }
  };

  const verifyCode = () => {
    const storedData = sessionStorage.getItem("verificationCode");
    if (!storedData) {
      toast.error("No verification code found. Please request a new one.");
      return;
    }

    const { code, email, expires } = JSON.parse(storedData);

    if (email !== formData.email) {
      toast.error("This code was sent to a different email");
      return;
    }

    if (Date.now() > expires) {
      toast.error("Verification code has expired");
      sessionStorage.removeItem("verificationCode");
      setIsCodeSent(false);
      return;
    }

    if (verificationCode === code) {
      setIsVerified(true);
      toast.success("Email verified successfully!");
    } else {
      toast.error("Invalid verification code");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const now = new Date();
    const hour = now.getHours();

    if (hour < 8 || hour >= 21) {
      toast.info("Please try again by 8AM");
      return;
    }

    if (!acceptedTerms) {
      toast.info("You must accept the terms and conditions");
      return;
    }

    if (!isVerified) {
      toast.info("Please verify your email first");
      return;
    }

    setIsSubmitting(true);

    const trimmedData = {
      ...formData,
      first_name: formData.first_name.trim(),
      last_name: formData.last_name.trim(),
      email: formData.email.trim().toLowerCase(),
      referral_code: formData.referral_code.trim(),
      accepted_terms: acceptedTerms,
      marketing_consent: receivePromotions,
    };

    const result = signupSchema.safeParse(trimmedData);

    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      const firstError = Object.values(errors)[0]?.[0];
      toast.error(firstError || "Invalid input");
      setIsSubmitting(false);
      return;
    }

    try {
      const { data, error: signUpError } = await billzpaddi.auth.signUp({
        email: trimmedData?.email,
        password: trimmedData?.password,
        options: {
          data: {
            first_name: trimmedData.first_name,
            last_name: trimmedData.last_name,
            role: trimmedData.role,
            referral_code: trimmedData.referral_code,
            accepted_terms: trimmedData.accepted_terms,
            marketing_consent: trimmedData.marketing_consent,
            email_verified: true, // Mark as verified
          },
        },
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

      await callApi("wallet/create", "POST", {
        email: trimmedData?.email,
        user_id: data.user.id,
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
    <main className="min-h-[100dvh] bg-gradient-to-r from-gray-700 to-gray-800 flex items-center justify-center pt-20 pb-10 px-4">
      <div className="w-full max-w-md bg-white p-6 rounded-2xl shadow-lg">
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
            <div className="flex flex-col md:flex-row gap-2">
              <input
                type="email"
                required
                placeholder="Email"
                disabled={isSubmitting || isVerified}
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="flex-1 px-4 py-2 border border-gray-400 rounded-md outline-none"
              />
              {!isVerified && (
                <button
                  type="button"
                  onClick={sendVerificationCode}
                  disabled={
                    isSubmitting || isVerified || countdown > 0 || isSending
                  }
                  className="px-3 py-2 bg-gray-600 text-white justify-center rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center cursor-pointer gap-1"
                >
                  {countdown > 0 ? (
                    `${Math.floor(countdown / 60)}:${(countdown % 60)
                      .toString()
                      .padStart(2, "0")}`
                  ) : (
                    <>
                      {isCodeSent ? <HiRefresh size={16} /> : null}
                      {isCodeSent ? "Resend" : "Get Code"}
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {isCodeSent && !isVerified && (
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-800">
                Verification Code
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  maxLength={6}
                  className="flex-1 px-4 py-2 border border-gray-400 rounded-md outline-none"
                />
                <button
                  type="button"
                  onClick={verifyCode}
                  disabled={verificationCode.length !== 6}
                  className="px-3 py-2 bg-blue-600 text-white cursor-pointer rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Verify
                </button>
              </div>
            </div>
          )}

          {isVerified && (
            <div className="text-green-600 text-sm">
              Email verified successfully!
            </div>
          )}

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

          {/* Terms and Conditions Checkbox */}
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                required
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="w-4 h-4 border border-gray-300 rounded bg-gray-50 outline-none cursor-pointer"
              />
            </div>
            <label
              htmlFor="terms"
              className="ms-2 text-sm text-gray-800 cursor-pointer"
            >
              I agree to the{" "}
              <Link href="/terms" className="text-blue-600 hover:underline">
                Terms and Conditions
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-blue-600 hover:underline">
                Privacy Policy
              </Link>
            </label>
          </div>

          {/* Promotional Emails Checkbox */}
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="promotions"
                name="promotions"
                type="checkbox"
                checked={receivePromotions}
                onChange={(e) => setReceivePromotions(e.target.checked)}
                className="w-4 h-4 border border-gray-300 rounded bg-gray-50 outline-none cursor-pointer"
              />
            </div>
            <label
              htmlFor="promotions"
              className="ms-2 text-sm text-gray-800 cursor-pointer"
            >
              I want to receive promotional emails and updates
            </label>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !acceptedTerms || !isVerified}
            className="w-full py-3 bg-gray-600 cursor-pointer hover:bg-gray-800 transition duration-150 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
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
