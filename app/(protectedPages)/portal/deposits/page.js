"use client";
import { useEffect, useState } from "react";
import { billzpaddi } from "@/lib/client";
import { toast } from "react-toastify";
import {
  FaCheck,
  FaTimes,
  FaHistory,
  FaSpinner,
  FaSearch,
} from "react-icons/fa";
import { useGlobalContextData } from "@/context/GlobalContextData";

export default function DepositApprovalPage() {
  const {
    wallet,
    fetchWallet,
    getUniqueRequestId,
    uniqueRequestId,
    fetchTransactions,
  } = useGlobalContextData();
  const [pendingDeposits, setPendingDeposits] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [userWallets, setUserWallets] = useState({});

  // Fetch pending deposits and user wallets
  const fetchPendingDeposits = async () => {
    setIsLoading(true);
    try {
      // First fetch all pending deposits
      const { data: depositsData, error: depositsError } = await billzpaddi
        .from("transactions")
        .select("*")
        .eq("status", "pending")
        .eq("type", "credit")
        .order("created_at", { ascending: false });

      if (depositsError) throw depositsError;

      // Get unique user IDs from deposits
      const userIds = [
        ...new Set(depositsData.map((deposit) => deposit.user_id)),
      ];

      // Fetch wallets for these users
      const { data: walletsData, error: walletsError } = await billzpaddi
        .from("wallets")
        .select("user_id, balance, users(email)")
        .in("user_id", userIds);

      if (walletsError) throw walletsError;

      // Create a wallet map for quick lookup
      const walletMap = {};
      walletsData.forEach((wallet) => {
        walletMap[wallet.user_id] = {
          balance: wallet.balance,
          email: wallet.users?.email || "Unknown",
        };
      });

      setUserWallets(walletMap);
      setPendingDeposits(depositsData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load pending deposits");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingDeposits();
  }, []);

  // Handle approval with wallet balance update
  const handleApprove = async (deposit) => {
    const userWallet = userWallets[deposit.user_id];
    if (!userWallet) {
      toast.error("User wallet not found");
      return;
    }

    if (
      !confirm(
        `Approve deposit of ₦${deposit.amount} from ${userWallet.email}?`
      )
    ) {
      return;
    }

    setProcessingId(deposit.id);
    try {
      // Calculate new balance
      const newBalance = userWallet.balance + deposit.amount;

      // Update wallet balance
      const { error: balanceError } = await billzpaddi
        .from("wallets")
        .update({ balance: newBalance })
        .eq("user_id", deposit.user_id);

      if (balanceError) throw balanceError;

      // Update transaction status
      const { error: transactionError } = await billzpaddi
        .from("transactions")
        .update({ status: "completed" })
        .eq("id", deposit.id);

      if (transactionError) throw transactionError;

      // Update local state
      setUserWallets((prev) => ({
        ...prev,
        [deposit.user_id]: {
          ...prev[deposit.user_id],
          balance: newBalance,
        },
      }));

      toast.success(
        `Deposit approved! ₦${deposit.amount} added to user's balance`
      );
      fetchPendingDeposits();
    } catch (error) {
      console.error("Approval error:", error);
      toast.error("Failed to approve deposit");
    } finally {
      setProcessingId(null);
      fetchWallet();
      fetchTransactions();
    }
  };

  // Handle decline
  const handleDecline = async (deposit) => {
    const userWallet = userWallets[deposit.user_id];
    if (
      !confirm(
        `Decline deposit of ₦${deposit.amount} from ${
          userWallet?.email || "user"
        }?`
      )
    ) {
      return;
    }

    setProcessingId(deposit.id);
    try {
      const { error } = await billzpaddi
        .from("transactions")
        .update({ status: "failed" })
        .eq("id", deposit.id);

      if (error) throw error;

      toast.success("Deposit declined");
      fetchPendingDeposits();
    } catch (error) {
      console.error("Decline error:", error);
      toast.error("Failed to decline deposit");
    } finally {
      setProcessingId(null);
      fetchWallet();
      fetchTransactions();
    }
  };

  // Format date and time
  const formatDateTime = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Filter deposits based on search term
  const filteredDeposits = pendingDeposits.filter((deposit) => {
    const userWallet = userWallets[deposit.user_id];
    const email = userWallet?.email || "";
    const reference = deposit.reference || "";
    const searchLower = searchTerm.toLowerCase();

    return (
      email.toLowerCase().includes(searchLower) ||
      reference.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-wrap gap-7 items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FaHistory className="text-gray-200" />
          Pending Deposits
        </h1>
        <div className="flex flex-wrap ml-auto items-center gap-4">
          <button
            onClick={fetchPendingDeposits}
            className="bg-gray-700 cursor-pointer  hover:bg-gray-600 px-3 py-2 rounded flex items-center gap-2"
            disabled={isLoading}
          >
            {isLoading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      <div className="relative mb-5">
        <input
          type="text"
          placeholder="Search by email or reference..."
          className="border rounded-md pl-10 pr-4 py-2 w-full md:w-96 outline-none"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <FaSearch className="absolute left-3 top-3 text-gray-400" />
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="flex justify-center py-10">
            <img
              src="/icons/loader-white.svg"
              alt="Loading..."
              className="w-14 h-14"
            />
          </div>
        </div>
      ) : filteredDeposits.length === 0 ? (
        <div className="bg-gray-800 rounded-lg p-8 text-center">
          <p className="text-gray-400">
            {searchTerm
              ? "No matching deposits found"
              : "No pending deposits found"}
          </p>
        </div>
      ) : (
        <div className="bg-gray-800 rounded-xl overflow-hidden custom-scrollbar border border-gray-700">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Reference
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Date/Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-gray-800 divide-y divide-gray-700">
                {filteredDeposits.map((deposit) => {
                  const userWallet = userWallets[deposit.user_id];
                  return (
                    <tr key={deposit.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-300">
                          {userWallet?.email || "Loading..."}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-green-400">
                          ₦{deposit.amount.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-400 font-mono bg-gray-900 px-2 py-1 rounded">
                          {deposit.reference}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-400">
                          {formatDateTime(deposit.created_at)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap flex gap-2">
                        <button
                          onClick={() => handleApprove(deposit)}
                          disabled={processingId === deposit.id || !userWallet}
                          className="bg-green-600 hover:bg-green-700 cursor-pointer text-white px-3 py-1 rounded flex items-center gap-1 disabled:opacity-50"
                        >
                          {processingId === deposit.id ? (
                            <FaSpinner className="animate-spin" />
                          ) : (
                            <FaCheck />
                          )}
                          Approve
                        </button>
                        <button
                          onClick={() => handleDecline(deposit)}
                          disabled={processingId === deposit.id || !userWallet}
                          className="bg-red-600 hover:bg-red-700 cursor-pointer text-white px-3 py-1 rounded flex items-center gap-1 disabled:opacity-50"
                        >
                          {processingId === deposit.id ? (
                            <FaSpinner className="animate-spin" />
                          ) : (
                            <FaTimes />
                          )}
                          Decline
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
