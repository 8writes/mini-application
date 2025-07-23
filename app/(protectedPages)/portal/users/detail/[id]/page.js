"use client";

import { billzpaddi } from "@/app/api/client/client";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useRouter, usePathname } from "next/navigation";
import NotificationDialog from "@/components/dialogs/notificationDialog";
import { useGlobalContext } from "@/context/GlobalContext";
import Link from "next/link";
import { FaUserFriends, FaWallet } from "react-icons/fa";
import { format } from "date-fns";
import { callApi } from "@/utils/apiClient";

export default function Page() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading } = useGlobalContext();

  // Extract userId from URL path
  const userId = pathname.split("/").pop();

  const [userData, setUserData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [referrals, setReferrals] = useState([]);
  const [earnings, setEarnings] = useState(0);
  const [referralCode, setReferralCode] = useState("");
  const [showNotificationDialog, setShowNotificationDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const transactionsPerPage = 10;

  // 🔥 Generate referral code from email (without @domain)
  useEffect(() => {
    if (userData?.email) {
      const code = userData.email.split("@")[0];
      setReferralCode(code);
      fetchReferralData(code);
    }
  }, [userData]);

  // Fetch user details and transactions
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch user data
        const { data: userData, error: userError } = await billzpaddi
          .from("users")
          .select("*")
          .eq("user_id", userId)
          .single();

        if (userError) throw userError;

        const walletData = await callApi("wallet/fetch", "POST", {
          user_id: userId,
        });

        // Fetch transactions
        const { data: transactionsData, error: transactionsError } =
          await billzpaddi
            .from("transactions")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false });

        if (transactionsError) throw transactionsError;

        setUserData({
          ...userData,
          balance: walletData?.balance || 0,
        });
        setTransactions(transactionsData || []);
      } catch (error) {
        toast.error("Error fetching user data");
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchData();
    }
  }, [userId]);

  // 🚀 Fetch referral data
  const fetchReferralData = async (code) => {
    try {
      // 1. Get all users who used this referral code
      const { data: referredUsers, error: referralError } = await billzpaddi
        .from("users")
        .select("user_id, email, created_at")
        .eq("referral_code", code);

      if (referralError) throw referralError;

      // 2. Check which referrals are qualified (total credit transactions >= 2000)
      const qualifiedReferrals = await Promise.all(
        referredUsers.map(async (referredUser) => {
          // Get sum of all credit transactions for this user
          const { data: transactionsData, error: txError } = await billzpaddi
            .from("transactions")
            .select("amount")
            .eq("user_id", referredUser.user_id)
            .eq("type", "credit")
            .eq("status", "completed");

          if (txError) throw txError;

          const totalCredits = transactionsData.reduce(
            (sum, tx) => sum + tx.amount,
            0
          );

          return {
            ...referredUser,
            qualified: totalCredits >= 2000,
          };
        })
      );

      // 3. Calculate earnings (150 per qualified referral, max 10)
      const qualifiedCount = Math.min(
        qualifiedReferrals.filter((ref) => ref.qualified).length,
        10
      );
      const totalEarnings = qualifiedCount * 150;

      setReferrals(qualifiedReferrals);
      setEarnings(totalEarnings);
    } catch (error) {
      console.error("Error fetching referrals:", error);
      toast.error("Failed to load referral data");
    } finally {
    }
  };

  // Toggle user status
  const toggleUserStatus = async () => {
    const confirm = window.confirm(
      `Are you sure you want to ${
        userData?.status ? "ban" : "unban"
      } this user?`
    );

    if (!confirm) return;

    try {
      const { error } = await billzpaddi
        .from("users")
        .update({ status: !userData?.status })
        .eq("user_id", userId);

      if (error) throw error;

      setUserData((prev) => ({ ...prev, status: !prev.status }));
      toast.success(
        `User ${userData?.status ? "banned" : "unbanned"} successfully!`
      );
    } catch (err) {
      toast.error("Error updating user status");
      console.error("Error:", err);
    }
  };

  // Toggle edit mode
  const toggleEdit = () => {
    setIsEditing(!isEditing);
  };

  // Handle edit input changes
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Save edited user data
  const saveUserData = async () => {
    try {
      const { error } = await billzpaddi
        .from("users")
        .update(editData)
        .eq("user_id", userId);

      if (error) throw error;

      setUserData((prev) => ({
        ...prev,
        ...editData,
      }));
      setIsEditing(false);
      toast.success("User details updated successfully!");
    } catch (err) {
      toast.error("Error updating user details");
      console.error("Error:", err);
    }
  };

  // Delete user
  const handleDelete = async () => {
    const confirm = window.confirm(
      "Are you sure you want to delete this user?"
    );
    if (!confirm) return;

    try {
      // Delete wallet first
      await billzpaddi.from("wallets").delete().eq("user_id", userId);

      // Delete transactions
      await billzpaddi.from("transactions").delete().eq("user_id", userId);

      // Delete notifications
      await billzpaddi.from("notifications").delete().eq("user_id", userId);

      // Finally delete user
      await billzpaddi.from("users").delete().eq("user_id", userId);

      toast.success("User deleted successfully!");
      router.push("/users");
    } catch (err) {
      toast.error("Error deleting user");
      console.error("Error:", err);
    }
  };

  // Filter transactions
  const filteredTransactions = transactions.filter(
    (t) =>
      t.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.amount.toString().includes(searchTerm.toLowerCase()) ||
      t.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get current transactions for pagination
  const indexOfLastTransaction = currentPage * transactionsPerPage;
  const indexOfFirstTransaction = indexOfLastTransaction - transactionsPerPage;
  const currentTransactions = filteredTransactions.slice(
    indexOfFirstTransaction,
    indexOfLastTransaction
  );

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Reset to first page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

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

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <img
          src="/icons/loader-white.svg"
          alt="Loading..."
          className="w-14 h-14"
        />
      </div>
    );
  }

  if (!userData) {
    return <div className="text-center py-10">User not found</div>;
  }

  return (
    <div className="px-4 py-10 md:p-10 w-full md:max-w-7xl mx-auto">
      <div className="pb-6">
        <Link
          href="/portal/users"
          className="px-6 py-4 text-white bg-gray-700 rounded-md hover:bg-gray-600  cursor-pointer"
        >
          ← Back to Users
        </Link>
      </div>

      {/* Referral Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <div className="flex items-center gap-3">
            <div className="bg-blue-900/20 p-2 rounded-full">
              <FaUserFriends className="text-blue-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Total Referrals</p>
              <p className="text-xl font-semibold">
                {loading ? "--" : referrals.length}/10
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <div className="flex items-center gap-3">
            <div className="bg-green-900/20 p-2 rounded-full">
              <FaWallet className="text-green-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Earnings</p>
              <p className="text-xl font-semibold">
                ₦{loading ? "--" : earnings.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 mb-8">
        {/* User Profile Card */}
        <div className="bg-gray-800 text-white p-6 rounded-lg shadow border col-span-2">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-full bg-gray-500 flex items-center justify-center text-2xl font-bold">
                {userData?.first_name[0]}
                {userData?.last_name[0]}
              </div>
              <div>
                {isEditing ? (
                  <div className="space-y-2 space-x-3">
                    <input
                      type="text"
                      name="first_name"
                      value={editData.first_name}
                      onChange={handleEditChange}
                      className="bg-gray-700 text-white p-1 rounded"
                    />
                    <input
                      type="text"
                      name="last_name"
                      value={editData.last_name}
                      onChange={handleEditChange}
                      className="bg-gray-700 text-white p-1 rounded"
                    />
                  </div>
                ) : (
                  <h2 className="text-xl font-semibold">
                    {userData?.first_name} {userData?.last_name}
                  </h2>
                )}
                {isEditing ? (
                  <input
                    type="email"
                    name="email"
                    value={editData.email}
                    onChange={handleEditChange}
                    className="bg-gray-700 text-white p-1 mt-2 rounded w-full"
                  />
                ) : (
                  <>
                    <p className="text-gray-300">{userData?.email}</p>
                    <p className="text-white text-xs pt-2">
                      {userData?.user_id}
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <span className="text-gray-400">Phone:</span>
              {isEditing ? (
                <input
                  type="text"
                  name="phone"
                  value={editData.phone}
                  onChange={handleEditChange}
                  className="ml-2 bg-gray-700 text-white p-1 rounded"
                />
              ) : (
                <span className="ml-2">
                  {userData?.phone || "Not provided"}
                </span>
              )}
            </div>
            <div>
              <span className="text-gray-400">Role:</span>
              <span className="ml-2 capitalize">{userData?.role}</span>
            </div>
            <div>
              <span className="text-gray-400">Status:</span>
              <span
                className={`ml-2 px-2 py-1 rounded-full text-xs ${
                  userData?.status
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {userData?.status ? "Active" : "Suspended"}
              </span>
            </div>
            <div>
              <span className="text-gray-400">Balance:</span>
              <span className="ml-2 font-semibold">
                ₦{userData?.balance?.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-gray-400">Joined:</span>
              <span className="ml-2">
                {new Date(userData?.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={toggleUserStatus}
              className={`px-4 py-2 rounded cursor-pointer ${
                userData?.status
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-green-100 text-green-800"
              }`}
            >
              {userData?.status ? "Ban User" : "Unban User"}
            </button>
            <button
              onClick={() => setShowNotificationDialog(true)}
              className="px-4 py-2 bg-blue-100 text-blue-800 cursor-pointer rounded"
            >
              Send Notification
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-100 text-red-800 cursor-pointer rounded"
            >
              Delete User
            </button>
          </div>
          <div className="flex justify-end pt-4 gap-4 items-center">
            {isEditing && (
              <button
                onClick={() => setIsEditing(false)}
                className="px-7 py-2 cursor-pointer border text-white rounded bg-gray-700"
              >
                Cancel
              </button>
            )}
            <button
              onClick={isEditing ? saveUserData : toggleEdit}
              className="px-7 py-2 cursor-pointer bg-green-600 text-white rounded hover:bg-green-700"
            >
              {isEditing ? "Save" : "Edit"}
            </button>
          </div>
        </div>

        {/* Transactions Section */}
        <div className="bg-gray-800 text-white p-6 rounded-lg shadow border col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Transactions</h2>
            <div className="text-sm text-gray-400">
              Showing {indexOfFirstTransaction + 1}-
              {Math.min(indexOfLastTransaction, filteredTransactions.length)} of{" "}
              {filteredTransactions.length} transactions
            </div>
          </div>

          {/* Search */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="p-2 border rounded w-full max-w-md bg-gray-700 text-white"
            />
          </div>

          {filteredTransactions.length > 0 ? (
            <>
              <div className="overflow-auto custom-scrollbar">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left p-3">Reference</th>
                      <th className="text-left p-3">Description</th>
                      <th className="text-left p-3">Amount</th>
                      <th className="text-left p-3">Type</th>
                      <th className="text-left p-3">Status</th>
                      <th className="text-left p-3">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentTransactions.map((txn) => (
                      <tr
                        key={txn.id}
                        className="border-b border-gray-700 hover:bg-gray-700"
                      >
                        <td className="p-3">{txn.reference}</td>
                        <td className="p-3 whitespace-nowrap">
                          {txn.description}
                        </td>
                        <td className="p-3">₦{txn.amount.toLocaleString()}</td>
                        <td className="p-3 capitalize">{txn.type}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              txn.status === "success"
                                ? "bg-green-100 text-green-800"
                                : txn.status === "failed"
                                ? "bg-red-100 text-red-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {txn.status}
                          </span>
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          {format(new Date(txn?.created_at), "PPpp")}
                        </td>
                        <td className="p-3">
                          <Link
                            href={`/portal/users/detail/transaction/${txn.reference}`}
                            className="text-blue-400 hover:underline"
                          >
                            View Details
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              <div className="flex justify-between items-center mt-4">
                <button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`px-4 py-2 rounded ${
                    currentPage === 1
                      ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                      : "bg-gray-600 text-white cursor-pointer hover:bg-gray-500"
                  }`}
                >
                  Previous
                </button>

                <div className="flex space-x-2">
                  {Array.from(
                    {
                      length: Math.ceil(
                        filteredTransactions.length / transactionsPerPage
                      ),
                    },
                    (_, i) => (
                      <button
                        key={i + 1}
                        onClick={() => paginate(i + 1)}
                        className={`px-3 py-1 rounded  ${
                          currentPage === i + 1
                            ? "bg-gray-900 text-white"
                            : "bg-gray-600 text-white cursor-pointer hover:bg-gray-500"
                        }`}
                      >
                        {i + 1}
                      </button>
                    )
                  ).slice(
                    Math.max(0, currentPage - 3),
                    Math.min(
                      Math.ceil(
                        filteredTransactions.length / transactionsPerPage
                      ),
                      currentPage + 2
                    )
                  )}
                </div>

                <button
                  onClick={() => paginate(currentPage + 1)}
                  disabled={
                    currentPage ===
                    Math.ceil(filteredTransactions.length / transactionsPerPage)
                  }
                  className={`px-4 py-2 rounded ${
                    currentPage ===
                    Math.ceil(filteredTransactions.length / transactionsPerPage)
                      ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                      : "bg-gray-600 text-white cursor-pointer hover:bg-gray-500"
                  }`}
                >
                  Next
                </button>
              </div>
            </>
          ) : (
            <p className="text-gray-500 py-4">No transactions found</p>
          )}
        </div>
      </div>

      {/* Notification Dialog */}
      {showNotificationDialog && (
        <NotificationDialog
          userId={userId}
          onClose={() => setShowNotificationDialog(false)}
        />
      )}
    </div>
  );
}
