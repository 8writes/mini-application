"use client";

import UserDialog from "@/components/dialogs/userDialog";
import { useGlobalContext } from "@/context/GlobalContext";
import { billzpaddi } from "@/lib/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

  const router = useRouter();

  // fetch users with their wallet balance
  const fetchUsers = async () => {
    setLoading(true);
    try {
      // First fetch all users (except super_admin)
      const { data: usersData, error: usersError } = await billzpaddi
        .from("users")
        .select("*")
        .neq("role", "super_admin");

      if (usersError) throw usersError;

      // Then fetch all wallets
      const { data: walletsData, error: walletsError } = await billzpaddi
        .from("wallets")
        .select("*");

      if (walletsError) throw walletsError;

      // Combine users with their wallet balance
      const usersWithBalance = usersData.map((user) => {
        const wallet = walletsData.find((w) => w.user_id === user.user_id);
        return {
          ...user,
          balance: wallet?.balance || 0,
        };
      });

      setUsers(usersWithBalance);
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

  // toggle user status (ban/unban)
  const toggleUserStatus = async (userId, currentStatus) => {
    const confirm = window.confirm(
      `Are you sure you want to ${currentStatus ? "ban" : "unban"} this user?`
    );
    if (!confirm) return;

    try {
      const { error } = await billzpaddi
        .from("users")
        .update({ status: !currentStatus })
        .eq("user_id", userId);

      if (error) throw error;

      fetchUsers();
      toast.success(
        `User ${currentStatus ? "banned" : "unbanned"} successfully!`
      );
    } catch (err) {
      toast.error("Error updating user status");
      console.error("Error updating user status:", err);
    }
  };

  // delete a user
  const handleDelete = async (userId) => {
    const confirm = window.confirm(
      "Are you sure you want to delete this user?"
    );
    if (!confirm) return;

    try {
      // First delete the user's wallet
      const { error: walletError } = await billzpaddi
        .from("wallets")
        .delete()
        .eq("user_id", userId);

      if (walletError) throw walletError;

      // Then delete the user
      const { error: userError } = await billzpaddi
        .from("users")
        .delete()
        .eq("id", userId);

      if (userError) throw userError;

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
      (u.status ? "active" : "suspended").includes(searchTerm.toLowerCase()) ||
      u.balance.toString().includes(searchTerm.toLowerCase())
    );
  });

  // pagination
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);

  if (user?.role !== "super_admin") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60dvh] p-8 pb-20 gap-6 sm:p-20">
        <main className="flex flex-col gap-6 items-center text-center">
          <h1 className="text-4xl font-bold text-white">
            404 - Page Not Found
          </h1>
          <p className="text-lg text-white">
            Why are you trying to access this page? <br />
            Hope no problem? No page here o.
          </p>
        </main>
      </div>
    );
  }

  return (
    <div>
      <section className="px-4 py-10 md:p-10 w-full md:max-w-7xl mx-auto">
        <div className="flex flex-wrap justify-between gap-2 items-center mb-6">
          <h1 className="text-2xl md:text-3xl">Super Admin</h1>
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
                    placeholder="Search by name, role, status, or balance..."
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

            <div className="overflow-auto custom-scrollbar">
              {loading ? (
                <div className="flex justify-center py-10">
                  <img
                    src="/icons/loader-white.svg"
                    alt="Loading..."
                    className="w-14 h-14"
                  />
                </div>
              ) : (
                <>
                  <table className="min-w-full bg-gray-900 text-white border rounded-md shadow">
                    <thead className="bg-gray-800 text-left">
                      <tr>
                        <th className="p-3 border rounded-l-md whitespace-nowrap">
                          First Name
                        </th>
                        <th className="p-3 border whitespace-nowrap">
                          Last Name
                        </th>
                        <th className="p-3 border">Email</th>
                        <th className="p-3 border">Role</th>
                        <th className="p-3 border">Balance</th>
                        <th className="p-3 border">Status</th>
                        <th className="p-3 border text-center rounded-r-md">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentUsers.map((u) => (
                        <tr key={u.user_id} className="">
                          <td className="p-3 border">{u.first_name}</td>
                          <td className="p-3 border">{u.last_name}</td>
                          <td className="p-3 border">{u.email}</td>
                          <td className="p-3 border capitalize">{u.role}</td>
                          <td className="p-3 border">
                            ₦{u.balance.toLocaleString()}
                          </td>
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
                            <Link
                              href={`/portal/users/${u.user_id}`}
                              className="text-blue-600 hover:underline pr-4 cursor-pointer"
                            >
                              View
                            </Link>
                            <button
                              onClick={() => toggleUserStatus(u.id, u.status)}
                              className="text-yellow-600 hover:underline px-4 cursor-pointer"
                            >
                              {u.status ? "Ban" : "Unban"}
                            </button>
                            <button
                              onClick={() => handleDelete(u.id)}
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
            <h1>You are logged in as a USER on this cool app :)</h1>
          </div>
        )}

        {/** pagination */}
        {user?.role !== "user" && filteredUsers.length > usersPerPage && (
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
