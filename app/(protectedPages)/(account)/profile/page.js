"use client";
import { useGlobalContext } from "@/context/GlobalContext";
import { useState } from "react";
import {
  HiUser,
  HiMail,
  HiPhone,
  HiLockClosed,
  HiLogout,
  HiPencilAlt,
} from "react-icons/hi";
import { FaUserShield, FaHistory } from "react-icons/fa";
import Image from "next/image";

export default function ProfilePage() {
  const { user, isLoading, logout } = useGlobalContext();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.first_name || "",
    lastName: user?.last_name || "",
    email: user?.email || "",
    phone: user?.phone || "",
  });

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Add your update profile logic here
    setIsEditing(false);
  };

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
                {user.last_name} {user.first_name?.[0]}.
              </h1>
              <p className="text-gray-400">@{user.email || "user"}</p>
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
                      value={formData.firstName}
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
                      value={formData.lastName}
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
                    value={formData.email}
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
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 outline-none"
                    required
                  />
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md cursor-pointer transition-colors"
                  >
                    Save Changes
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
                      {user.last_name} {user.first_name}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 py-3 border-b border-gray-700">
                  <HiMail className="text-gray-400 text-xl" />
                  <div>
                    <p className="text-gray-400">Email</p>
                    <p className="font-medium">{user.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 py-3 border-b border-gray-700">
                  <HiPhone className="text-gray-400 text-xl" />
                  <div>
                    <p className="text-gray-400">Phone</p>
                    <p className="font-medium">
                      {user.phone || "Not provided"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 py-3">
                  <FaHistory className="text-gray-400 text-xl" />
                  <div>
                    <p className="text-gray-400">Member Since</p>
                    <p className="font-medium">
                      {new Date(user.createdAt).toLocaleDateString()}
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
              <button className="w-full flex justify-between items-center p-3 hover:bg-gray-700 rounded-lg transition-colors">
                <span className="flex items-center gap-3">
                  <FaUserShield className="text-blue-400" />
                  Change Password
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
                onClick={logout}
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
