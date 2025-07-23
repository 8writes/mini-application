"use client";
import { useGlobalContext } from "@/context/GlobalContext";
import { useEffect, useState } from "react";
import {
  HiUser,
  HiMail,
  HiPhone,
  HiLockClosed,
  HiLogout,
  HiPencilAlt,
  HiEyeOff,
  HiEye,
  HiKey,
} from "react-icons/hi";
import { FaUserShield, FaHistory } from "react-icons/fa";
import Image from "next/image";

import { billzpaddi } from "@/app/api/client/client";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import CryptoJS from "crypto-js";
import { set } from "date-fns";

export default function ProfilePage() {
  const { user, fetchData, isLoading, handleLogout } = useGlobalContext();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isSavingPin, setIsSavingPin] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [forgotPinStep, setForgotPinStep] = useState(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [pinData, setPinData] = useState({
    newPin: "",
    confirmPin: "",
  });
  const [formData, setFormData] = useState({
    first_name: user?.first_name || "",
    last_name: user?.last_name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    old_password: "",
    password: "",
  });

  useEffect(() => {
    setFormData({
      first_name: user?.first_name || "",
      last_name: user?.last_name || "",
      email: user?.email || "",
      phone: user?.phone || "",
    });
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const { data, error } = await billzpaddi
        .from("users")
        .update({ phone: formData?.phone.trim() })
        .eq("user_id", user?.user_id)
        .select();

      if (error) {
        console.log(error.message || "Something went wrong");
        return;
      }

      fetchData();

      toast.success("Profile updated");
    } catch (err) {
      toast.error(err);
    } finally {
      setIsEditing(false);
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setIsSavingPassword(true);

    if (!formData.old_password && !formData.password) {
      toast.info("Fill the required field");
      setIsSavingPassword(false);
      return;
    }

    try {
      const { data: passwordConfirmData, error: passwordConfirmError } =
        await billzpaddi.auth.signInWithPassword({
          email: formData?.email,
          password: formData?.old_password,
        });

      if (passwordConfirmError) {
        toast.error("Incorrect old password");
        return;
      }

      const { data, error } = await billzpaddi.auth.updateUser({
        password: formData?.password,
      });

      if (error) {
        toast.error(error.message || "Something went wrong");
        return;
      }

      setFormData((prev) => ({ ...prev, password: "", old_password: "" }));

      toast.success("Password updated");

      await billzpaddi.auth.signOut();

      router.push("/auth/login");
    } catch (err) {
      toast.error(err);
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handlePinChange = (e) => {
    const { name, value } = e.target;
    // Only allow numeric input and limit to 4 digits
    if (/^\d*$/.test(value) && value.length <= 4) {
      setPinData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const encryptPin = (pin) => {
    const secretKey =
      process.env.NEXT_PUBLIC_BILLZ_AUTH_KEY || "default-secret-key";
    return CryptoJS.AES.encrypt(pin, secretKey).toString();
  };

  const handleSavePin = async (e) => {
    e.preventDefault();
    setIsSavingPin(true);

    if (!pinData.newPin || !pinData.confirmPin) {
      toast.error("Please enter and confirm your PIN");
      setIsSavingPin(false);
      return;
    }

    if (pinData.newPin.length !== 4) {
      toast.error("PIN must be 4 digits");
      setIsSavingPin(false);
      return;
    }

    if (pinData.newPin !== pinData.confirmPin) {
      toast.error("PINs do not match");
      setIsSavingPin(false);
      return;
    }

    try {
      const encryptedPin = encryptPin(pinData.newPin);

      // Save to wallet table
      const { data, error } = await billzpaddi
        .from("wallets")
        .update({
          user_id: user?.user_id,
          pin: encryptedPin,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user?.user_id);

      if (error) throw error;

      toast.success("PIN saved successfully");
      setPinData({ newPin: "", confirmPin: "" });
    } catch (error) {
      toast.error(error.message || "Failed to save PIN");
    } finally {
      setIsSavingPin(false);
    }
  };

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
        <p style="color: #4b5563; margin-bottom: 16px;">Please use the following verification code to reset your PIN:</p>
        
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

  const generateVerificationCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  // Countdown timer
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleForgotPin = async () => {
    setIsSavingPin(true);
    try {
      const code = generateVerificationCode();
      sessionStorage.setItem(
        "verificationCode",
        JSON.stringify({
          code,
          email: user?.email,
          expires: Date.now() + 5 * 60 * 1000, // 5 minutes expiration
        })
      );

      const emailSent = await sendEmail(
        user?.email,
        "Your PIN Reset Verification Code",
        getVerificationCodeTemplate(code)
      );

      if (emailSent) {
        toast.success(`Verification code sent to your email`);
        setIsCodeSent(true);
        setCountdown(300); // 5 minutes countdown
        setForgotPinStep("verify");
      } else {
        throw new Error("Failed to send email");
      }
    } catch (error) {
      toast.error(error.message || "Failed to send verification code");
    } finally {
      setIsSavingPin(false);
    }
  };

  const handleVerifyCode = () => {
    const storedCode = JSON.parse(sessionStorage.getItem("verificationCode"));

    if (!storedCode || storedCode.expires < Date.now()) {
      toast.error("Verification code expired");
      return;
    }

    if (verificationCode !== storedCode.code) {
      toast.error("Invalid verification code");
      return;
    }

    sessionStorage.removeItem("verificationCode");
    return true;
  };

  const handleResetPin = async () => {
    if (!pinData.newPin || !pinData.confirmPin) {
      toast.error("Please enter and confirm your new PIN");
      return;
    }

    if (pinData.newPin.length !== 4) {
      toast.error("PIN must be 4 digits");
      return;
    }

    if (pinData.newPin !== pinData.confirmPin) {
      toast.error("PINs do not match");
      return;
    }

    const isValid = handleVerifyCode();

    if (!isValid) return;

    setIsSavingPin(true);

    try {
      const encryptedPin = encryptPin(pinData.newPin);

      const { data, error } = await billzpaddi
        .from("wallets")
        .update({
          pin: encryptedPin,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user?.user_id);

      if (error) throw error;

      toast.success("PIN reset successfully");
      setPinData({ newPin: "", confirmPin: "" });
    } catch (error) {
      toast.error(error.message || "Failed to reset PIN");
    } finally {
      setIsSavingPin(false);
    }
  };

  if (!user || isLoading) {
    return (
      <div className="flex items-center justify-center h-[30rem]">
        <img
          src="/icons/loader-white.svg"
          alt="Loading..."
          className="w-20 h-20"
        />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      {/* Profile Header */}
      <section className="mb-8">
        <h1 className="text-2xl md:text-3xl uppercase pb-5">Profile</h1>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-gray-600 p-1 md:p-3 rounded-full">
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
                className="rounded-full object-cover border cursor-pointer"
              />
            </div>
            <div>
              <h1 className="text-xl md:text-3xl font-bold">
                {user?.last_name} {user?.first_name?.[0]}.
              </h1>
              <p className="text-gray-400">@{user?.email || "user"}</p>
            </div>
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="flex ml-auto items-center gap-2 bg-gray-700 cursor-pointer hover:bg-gray-600 px-4 py-2 rounded-lg transition-colors"
          >
            <HiPencilAlt />
            {isEditing ? "Cancel Editing" : "Edit Profile"}
          </button>
        </div>
      </section>

      {/* Profile Form */}
      <section className="flex md:grid flex-col-reverse lg:grid-cols-3 gap-6">
        {/* Personal Information */}
        <div className="lg:col-span-2 space-y-3">
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              Personal Information
            </h2>

            {isEditing ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-400 mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.first_name || ""}
                      onChange={handleInputChange}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 outline-none"
                      required
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.last_name || ""}
                      onChange={handleInputChange}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 outline-none"
                      required
                      readOnly
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-400 mb-2">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email || ""}
                    onChange={handleInputChange}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 outline-none"
                    required
                    readOnly
                  />
                </div>

                <div>
                  <label className="block text-gray-400 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone || ""}
                    onChange={handleInputChange}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 outline-none"
                    required
                    disabled={isSaving}
                  />
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="w-full flex justify-center items-center p-3 cursor-pointer hover:bg-gray-700 bg-gray-900 rounded-lg transition-colors"
                  >
                    {isSaving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-4 py-3 border-b border-gray-700">
                  <HiUser className="text-gray-400 text-xl" />
                  <div>
                    <p className="text-gray-400">Full Name</p>
                    <p className="font-medium">
                      {formData?.last_name} {formData?.first_name}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 py-3 border-b border-gray-700">
                  <HiMail className="text-gray-400 text-xl" />
                  <div>
                    <p className="text-gray-400">Email</p>
                    <p className="font-medium">{formData?.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 py-3 border-b border-gray-700">
                  <HiPhone className="text-gray-400 text-xl" />
                  <div>
                    <p className="text-gray-400">Phone</p>
                    <p className="font-medium">
                      {formData?.phone || "Not provided"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 py-3">
                  <FaHistory className="text-gray-400 text-xl" />
                  <div>
                    <p className="text-gray-400">Member Since</p>
                    <p className="font-medium">
                      {new Date(user?.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
          {/* Security */}
          <div className="bg-gray-800 w-full rounded-xl p-6 border border-gray-700">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <HiLockClosed className="text-gray-400" />
              Security
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block mb-1 text-sm font-medium text-white">
                  Old Password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    disabled={isSavingPassword}
                    value={formData.old_password || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, old_password: e.target.value })
                    }
                    className="w-full px-4 py-2 border pr-10 text-white border-gray-400 rounded-lg outline-none disabled:opacity-50"
                    placeholder="******"
                  />
                  <span
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 cursor-pointer"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <HiEyeOff size={20} />
                    ) : (
                      <HiEye size={20} />
                    )}
                  </span>
                </div>
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium text-white">
                  New Password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    disabled={isSavingPassword}
                    value={formData.password || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className="w-full px-4 py-2 border pr-10 text-white border-gray-400 rounded-lg outline-none disabled:opacity-50"
                    placeholder="******"
                  />
                  <span
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 cursor-pointer"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <HiEyeOff size={20} />
                    ) : (
                      <HiEye size={20} />
                    )}
                  </span>
                </div>
              </div>
              <button
                onClick={handleChangePassword}
                className="w-full flex justify-center items-center p-3 cursor-pointer hover:bg-gray-700 bg-gray-900 rounded-lg transition-colors"
              >
                <span className="flex items-center gap-3">
                  <FaUserShield className="text-blue-400" />
                  {isSavingPassword ? "Updating..." : "Change Password"}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Account Actions */}
        <div className="space-y-6">
          {/* PIN Settings */}
          <div className="bg-gray-800 w-full rounded-xl p-6 border border-gray-700">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <HiKey className="text-gray-400" />
              PIN Settings
            </h2>
            <div className="space-y-4">
              {false ? (
                <>
                  {/* Existing PIN Update Form */}
                  <div>
                    <label className="block mb-1 text-sm font-medium text-white">
                      New PIN (4 digits) *
                    </label>
                    <div className="relative">
                      <input
                        type={showPin ? "tel" : "password"}
                        name="newPin"
                        value={pinData.newPin}
                        onChange={handlePinChange}
                        className="w-full px-4 py-2 border pr-10 text-white border-gray-400 rounded-lg outline-none"
                        placeholder="••••"
                        maxLength={4}
                        inputMode="numeric"
                      />
                      <span
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 cursor-pointer"
                        onClick={() => setShowPin(!showPin)}
                      >
                        {showPin ? <HiEyeOff size={20} /> : <HiEye size={20} />}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block mb-1 text-sm font-medium text-white">
                      Confirm PIN *
                    </label>
                    <div className="relative">
                      <input
                        type={showPin ? "tel" : "password"}
                        name="confirmPin"
                        value={pinData.confirmPin}
                        onChange={handlePinChange}
                        className="w-full px-4 py-2 border pr-10 text-white border-gray-400 rounded-lg outline-none"
                        placeholder="••••"
                        maxLength={4}
                        inputMode="numeric"
                      />
                      <span
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 cursor-pointer"
                        onClick={() => setShowPin(!showPin)}
                      >
                        {showPin ? <HiEyeOff size={20} /> : <HiEye size={20} />}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={handleSavePin}
                    disabled={isSavingPin}
                    className="w-full flex justify-center items-center p-3 cursor-pointer hover:bg-gray-700 bg-gray-900 rounded-lg transition-colors"
                  >
                    {isSavingPin ? "Saving..." : "Save PIN"}
                  </button>
                </>
              ) : (
                <>
                  {/* Forgot PIN Flow */}
                  {!isCodeSent ? (
                    <div className="flex flex-col gap-4">
                      <div>
                        <p className="text-sm text-gray-400 mb-2">
                          To set/reset your PIN, we'll send a verification code to
                          your registered email.
                        </p>
                        <button
                          onClick={handleForgotPin}
                          className="w-full flex justify-center items-center p-3 cursor-pointer hover:bg-gray-700 bg-gray-900 rounded-lg transition-colors"
                        >
                          {isSavingPin ? "Requesting OTP..." : "Request OTP"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* OTP Verification */}
                      <div>
                        <label className="block mb-1 text-sm font-medium text-white">
                          Verification Code *
                        </label>
                        <div className="flex flex-col gap-2">
                          <input
                            type="text"
                            value={verificationCode}
                            onChange={(e) =>
                              setVerificationCode(e.target.value)
                            }
                            className="flex-1 px-4 py-2 border text-white border-gray-400 rounded-lg outline-none"
                            placeholder="Enter 6-digit OTP"
                            maxLength={6}
                            inputMode="numeric"
                          />
                        </div>
                      </div>

                      {/* New PIN Setup (shown after OTP verification) */}
                      {verificationCode.length === 6 && (
                        <>
                          <div>
                            <label className="block mb-1 text-sm font-medium text-white">
                              New PIN (4 digits) *
                            </label>
                            <div className="relative">
                              <input
                                type={showPin ? "tel" : "password"}
                                name="newPin"
                                value={pinData.newPin}
                                onChange={handlePinChange}
                                className="w-full px-4 py-2 border pr-10 text-white border-gray-400 rounded-lg outline-none"
                                placeholder="••••"
                                maxLength={4}
                                inputMode="numeric"
                              />
                              <span
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 cursor-pointer"
                                onClick={() => setShowPin(!showPin)}
                              >
                                {showPin ? (
                                  <HiEyeOff size={20} />
                                ) : (
                                  <HiEye size={20} />
                                )}
                              </span>
                            </div>
                          </div>
                          <div>
                            <label className="block mb-1 text-sm font-medium text-white">
                              Confirm PIN *
                            </label>
                            <div className="relative">
                              <input
                                type={showPin ? "tel" : "password"}
                                name="confirmPin"
                                value={pinData.confirmPin}
                                onChange={handlePinChange}
                                className="w-full px-4 py-2 border pr-10 text-white border-gray-400 rounded-lg outline-none"
                                placeholder="••••"
                                maxLength={4}
                                inputMode="numeric"
                              />
                              <span
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 cursor-pointer"
                                onClick={() => setShowPin(!showPin)}
                              >
                                {showPin ? (
                                  <HiEyeOff size={20} />
                                ) : (
                                  <HiEye size={20} />
                                )}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={handleResetPin}
                            disabled={isSavingPin}
                            className="w-full flex justify-center items-center p-3 cursor-pointer hover:bg-gray-700 bg-gray-900 rounded-lg transition-colors"
                          >
                            {isSavingPin ? "Saving..." : "Reset PIN"}
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Account Management */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <HiUser className="text-gray-400" />
              Account
            </h2>
            <div className="space-y-4">
              <button
                onClick={() =>
                  toast.info("Contact support to deactivate account")
                }
                className="w-full text-left cursor-pointer flex items-center gap-3 p-3 hover:bg-gray-700 rounded-lg transition-colors text-red-400"
              >
                <HiLogout className="text-xl" />
                Deactivate Account
              </button>
              <button
                onClick={handleLogout}
                className="w-full text-left flex cursor-pointer items-center gap-3 p-3 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <HiLogout className="text-xl" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
