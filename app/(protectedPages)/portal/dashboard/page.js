"use client";

import UserDialog from "@/components/dialogs/userDialog";
import { useGlobalContext } from "@/context/GlobalContext";
import Image from "next/image";
import { useEffect, useState } from "react";
import { HiOutlineSearch } from "react-icons/hi";
import { toast } from "react-toastify";

export default function Page() {
  const { user, isLoading } = useGlobalContext();
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 5;
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  // fetch users
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      const filteredUsers = data.filter((user) => user?.role !== "super_admin");
      setUsers(filteredUsers);
    } catch (error) {
      toast.error("Error fetching users");
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // delete a user
  const handleDelete = async (id) => {
    const confirm = window.confirm(
      "Are you sure you want to delete this user?"
    );
    if (!confirm) return;
    try {
      await fetch(`/api/users/${id}`, { method: "DELETE" });
      fetchUsers();
      toast.success("User deleted successfully!");
    } catch (err) {
      toast.error("Error deleting user");
      console.error("Error deleting user:", err);
    }
  };

  // open dialog
  const openDialog = (user = null) => {
    setEditingUser(user);
    setShowDialog(true);
  };

  // close dialog fetch data
  const closeDialogFetch = () => {
    setEditingUser(null);
    setShowDialog(false);
    fetchUsers();
  };

  // close dialog no fetch
  const closeDialog = () => {
    setEditingUser(null);
    setShowDialog(false);
  };

  // filter users for search
  const filteredUsers = users?.filter((u) => {
    const fullName = `${u.first_name} ${u.last_name}`.toLowerCase();
    return (
      fullName.includes(searchTerm.toLowerCase()) ||
      u.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.status ? "active" : "suspended").includes(searchTerm.toLowerCase())
    );
  });

  // pagination
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);

  if (!user) {
    return;
  }
  return (
    <div>
      <section className="px-4 py-10 md:p-10 w-full md:max-w-7xl mx-auto">
        <div className="flex flex-wrap justify-between gap-2 items-center mb-6">
          <h1 className="text-2xl md:text-3xl">
            Welcome, {user?.last_name ?? "User"}
          </h1>
          {user?.role !== "user" && (
            <button
              onClick={() => openDialog()}
              className="bg-blue-600 text-white px-7 py-2 ml-auto rounded hover:bg-blue-700 transition cursor-pointer"
            >
              Add User
            </button>
          )}
        </div>
        {/** users table (paginated) */}
        {user?.role !== "user" ? (
          <>
            <div>
              <h1 className="text-lg pt-4 pb-2">All Users ({users?.length})</h1>

              {/** search */}
              <div className="mb-4">
                <div className="flex items-center border rounded w-full max-w-md px-2">
                  <HiOutlineSearch className="text-gray-400 text-xl mr-2" />
                  <input
                    type="text"
                    placeholder="Search by name, role, or status..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="flex-1 p-2 outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="overflow-auto hide-scrollbar">
              {loading ? (
                <div className="text-center py-10 text-gray-200">
                  Loading users...
                </div>
              ) : (
                <>
                  <table className="min-w-full bg-white text-gray-900 border rounded-md shadow">
                    <thead className="bg-gray-100 text-left">
                      <tr>
                        <th className="p-3 border rounded-l-md whitespace-nowrap">
                          Image
                        </th>
                        <th className="p-3 border rounded-l-md whitespace-nowrap">
                          First Name
                        </th>
                        <th className="p-3 border whitespace-nowrap">
                          Last Name
                        </th>
                        <th className="p-3 border">Email</th>
                        <th className="p-3 border">Role</th>
                        <th className="p-3 border">Status</th>
                        <th className="p-3 border text-center rounded-r-md">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentUsers.map((u) => (
                        <tr
                          key={u._id}
                          onClick={() => openDialog(u)}
                          className="hover:bg-gray-50 cursor-pointer"
                        >
                          <td className="p-3 border w-fit">
                            <Image
                              src={
                                u.profile_photo
                                  ? u.profile_photo.url
                                  : "/default-avatar.png"
                              }
                              alt={`${u.first_name} ${u.last_name}'s profile`}
                              width={40}
                              height={40}
                              className="rounded-full h-10 w-10 object-cover border border-gray-200"
                            />
                          </td>
                          <td className="p-3 border">{u.first_name}</td>
                          <td className="p-3 border">{u.last_name}</td>
                          <td className="p-3 border">{u.email}</td>
                          <td className="p-3 border capitalize">{u.role}</td>
                          <td className="p-3 border">
                            <span
                              className={`px-3 py-1 rounded-full ${
                                u.status
                                  ? "bg-green-100 text-green-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {u.status ? "Active" : "Suspended"}
                            </span>
                          </td>

                          <td className="p-3 border text-center whitespace-nowrap">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openDialog(u);
                              }}
                              className="text-blue-600 hover:underline pr-4 cursor-pointer"
                            >
                              Edit
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(u._id);
                              }}
                              className="text-red-600 hover:underline pl-4 cursor-pointer"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                      {filteredUsers.length === 0 && !loading && (
                        <tr>
                          <td colSpan="7" className="text-center p-5">
                            No users found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </>
              )}
            </div>
          </>
        ) : (
          <div>
            {/** role base render if logged in as user */}
            <h1>You are logged in as a USER on this cool app :) </h1>
          </div>
        )}

        {/** pagination */}
        {/** users table (paginated) */}
        {user?.role !== "user" && (
          <>
            {filteredUsers.length > usersPerPage && (
              <div className="flex justify-center gap-2 mt-4">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((prev) => prev - 1)}
                  className="px-4 py-2 border rounded disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="px-4 py-2">{currentPage}</span>
                <button
                  disabled={indexOfLastUser >= filteredUsers.length}
                  onClick={() => setCurrentPage((prev) => prev + 1)}
                  className="px-4 py-2 border rounded disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {/** dialog to add and edit user */}
      {showDialog && (
        <UserDialog
          user={editingUser}
          onCloseFetch={closeDialogFetch}
          onClose={closeDialog}
        />
      )}
    </div>
  );
}
