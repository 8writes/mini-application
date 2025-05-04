"use client";
import Image from "next/image";
import { useRef, useState } from "react";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import { HiOutlineUpload, HiOutlineX } from "react-icons/hi";

export default function UserDialog({ user, onClose, onCloseFetch }) {
  const [formData, setFormData] = useState({
    first_name: user?.first_name || "",
    last_name: user?.last_name || "",
    email: user?.email || "",
    role: user?.role || "user",
    status: user?.status ?? true,
    image: null,
    profile_photo: user?.profile_photo?.url || null,
  });
  const [preview, setPreview] = useState(user?.profile || null);
  const [submitting, setSubmitting] = useState(false);
  const [changes, setChanges] = useState(false);

  // handle image select and preview. also handle the checkbox
  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === "file") {
      const file = files[0];
      setFormData((prev) => ({ ...prev, image: file }));
      setPreview(URL.createObjectURL(file));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }
  };

  // delete an image
  const handleDeleteImage = async () => {
    if (!user?._id) return;

    try {
      const res = await fetch(`/api/users/profile-image/${user._id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errMsg = await res.json();
        toast.error(errMsg.message || "Failed to remove image");
        console.log(errMsg || "Failed to remove image.");
        return;
      }
      setFormData((prev) => ({ ...prev, profile_photo: null }));
    } catch (err) {
      console.error("Error deleting image:", err);
    }
  };

  // delete a user
  const handleDelete = async (id) => {
    const confirm = window.confirm(
      "Are you sure you want to delete this user?"
    );
    if (!confirm) return;
    try {
      await fetch(`/api/users/${id}`, { method: "DELETE" });
      onCloseFetch();
      toast.success("User deleted successfully!");
    } catch (err) {
      toast.error("Error deleting user");
      console.error("Error deleting user:", err);
    }
  };

  // submit a POST OR PUT using the "user" to perform the right action
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // basically we send just the normal json data without the image
      const method = user ? "PUT" : "POST";
      const endpoint = user ? `/api/users/${user._id}` : "/api/auth/signup";

      const jsonData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        role: formData.role,
        status: formData.status,
      };

      const res = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(jsonData),
      });

      if (!res.ok) {
        const errMsg = await res.json();
        toast.error(errMsg.message || "Failed to save");
        console.log(errMsg || "Failed to save.");
        return;
      }

      const userResponse = await res.json();

      // if an image is available we then handle it properly
      if (formData.image) {
        const imageFormData = new FormData();
        imageFormData.append("image", formData.image);

        // so we check from the first req res, to know if profile image is null or not and make a POST OR PUT
        const uploadMethod = userResponse.profile_image ? "PUT" : "POST";

        const imageRes = await fetch(
          `/api/users/profile-image/${userResponse.id}`,
          {
            method: uploadMethod,
            body: imageFormData,
          }
        );

        if (!imageRes.ok) {
          const errMsg = await imageRes.json();
          toast.error(errMsg.message || "Failed to upload image.");
          console.log(errMsg || "Failed to upload image.");
          return;
        }
      }

      // only close when adding new user
      if (!user) {
        onCloseFetch();
        toast.success("User added");
      } else {
        // here we want to know if changes have been made. (used to trigger fetchUsers())
        setChanges(true);
        toast.success("Changes saved");
      }
    } catch (err) {
      toast.error("Something went wrong.");
      console.error("Error saving user:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-white text-gray-900 p-6 rounded-lg w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          {" "}
          <h2 className="text-xl font-bold">
            {user ? "Edit User" : "Add User"}
          </h2>
          <button
            type="button"
            onClick={changes ? onCloseFetch : onClose}
            className=" cursor-pointer"
            disabled={submitting}
          >
            <HiOutlineX className="text-3xl" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/** we do not allow image process when Adding user in this app */}
          {user && (
            <div className="flex items-center gap-2">
              <label className="flex items-center text-sm mb-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleChange}
                  className="w-full cursor-pointer hidden"
                />
                <Image
                  src={
                    preview
                      ? preview
                      : formData.profile_photo || "/default-avatar.png"
                  }
                  alt="User profile photo"
                  width={40}
                  height={40}
                  className="rounded-full h-14 w-14 object-cover border border-gray-200 cursor-pointer"
                />
                {(preview || !formData.profile_photo) && (
                  <div className="px-2 cursor-pointer">
                    <HiOutlineUpload className="text-2xl text-gray-600" />
                  </div>
                )}
              </label>
              {formData.profile_photo && !preview && (
                <button
                  onClick={handleDeleteImage}
                  disabled={!formData.profile_photo}
                  className="cursor-pointer text-red-500"
                >
                  <HiOutlineX className="text-3xl hover:bg-gray-100 rounded-full" />
                </button>
              )}
            </div>
          )}

          <input
            name="first_name"
            placeholder="First Name"
            value={formData.first_name}
            onChange={handleChange}
            className="w-full p-2 border border-gray-400 rounded outline-none"
            required
          />
          <input
            name="last_name"
            placeholder="Last Name"
            value={formData.last_name}
            onChange={handleChange}
            className="w-full p-2 border border-gray-400 rounded outline-none"
            required
          />
          <input
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            type="email"
            className="w-full p-2 border border-gray-400 rounded outline-none"
            required
          />

          {/** default password set */}
          <h2 className="text-base text-gray-500">
            Default Password: Password12
          </h2>

          {/** role select */}
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="w-full p-2 border border-gray-400 rounded outline-none"
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>

          {/** status set */}
          <div className="flex items-center gap-4">
            <span className="text-base font-medium text-gray-700">Status:</span>
            <button
              type="button"
              onClick={() =>
                setFormData((prev) => ({ ...prev, status: !prev.status }))
              }
              className={`relative inline-flex h-6 w-11 items-center rounded-full cursor-pointer transition-colors focus:outline-none ${
                formData.status ? "bg-green-500" : "bg-gray-300"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  formData.status ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
            <span
              className={`px-3 py-1 rounded-full text-base ${
                formData.status
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {formData.status ? "Active" : "Suspended"}
            </span>
          </div>

          {user && (
            <h2 className="text-base text-gray-500">
              User since: {dayjs(user.createdAt).format("MMMM D, YYYY")}
            </h2>
          )}

          <div className="flex justify-end gap-3 pt-7">
            {user && (
              <button
                type="button"
                onClick={() => handleDelete(user._id)}
                className="px-4 py-2 rounded bg-red-300 hover:bg-red-400 cursor-pointer text-red-900"
                disabled={submitting}
              >
                Delete User
              </button>
            )}
            <button
              type="submit"
              className="px-7 py-2 rounded bg-green-600 text-white hover:bg-green-700 cursor-pointer disabled:opacity-50"
              disabled={submitting}
            >
              {submitting ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
