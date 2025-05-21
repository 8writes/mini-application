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
} from "react-icons/hi";
import { FaUserShield, FaHistory } from "react-icons/fa";
import Image from "next/image";
import { billzpaddi } from "@/lib/client";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const { user, fetchData, isLoading, handleLogout } = useGlobalContext();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
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
        .update({ phone: formData?.phone })
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
            <div className="bg-gray-600 p-3 rounded-full">
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
                className="rounded-full h-10 w-10 object-cover border cursor-pointer"
              />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">
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
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Personal Information */}
        <div className="lg:col-span-2">
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
        </div>

        {/* Account Actions */}
        <div className="space-y-6">
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

          {/* Account Management */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <HiUser className="text-gray-400" />
              Account
            </h2>
            <div className="space-y-4">
              <button className="w-full text-left cursor-pointer flex items-center gap-3 p-3 hover:bg-gray-700 rounded-lg transition-colors text-red-400">
                <HiLogout className="text-xl" />
                Delete Account
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
