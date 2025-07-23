"use client";
import { useState, useEffect } from "react";
import { useGlobalContext } from "@/context/GlobalContext";
import { useGlobalContextData } from "@/context/GlobalContextData";
import {
  FaUserFriends,
  FaWallet,
  FaCopy,
  FaGift,
  FaCheckCircle,
  FaSpinner,
  FaChevronRight,
  FaChevronLeft,
} from "react-icons/fa";
import { HiOutlineArrowRight } from "react-icons/hi";

import { billzpaddi } from "@/app/api/client/client";
import { toast } from "react-toastify";
import { callApi } from "@/utils/apiClient";

export default function ReferralPage() {
  const { user, fetchData, isLoading } = useGlobalContext();
  const {
    wallet,
    fetchWallet,
    getUniqueRequestId,
    uniqueRequestId,
    fetchTransactions,
  } = useGlobalContextData();
  const [referrals, setReferrals] = useState([]);
  const [earnings, setEarnings] = useState(0);
  const [referralCode, setReferralCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

  // 🔥 Generate referral code from email (without @domain)
  useEffect(() => {
    if (user?.email) {
      const code = user.email.split("@")[0];
      setReferralCode(code);
      fetchReferralData(code);
    }
  }, [user]);

  useEffect(() => {
    fetchWallet();
    fetchTransactions();
    getUniqueRequestId();
  }, []);

  // 🚀 Fetch referral data
  const fetchReferralData = async (code) => {
    try {
      setLoading(true);

      // 1. Get all users who used this referral code
      const { data: referredUsers, error: referralError } = await billzpaddi
        .from("users")
        .select("user_id, email, created_at")
        .eq("referral_code", code)
        .order("created_at", { ascending: false });

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
            qualified: totalCredits >= 3500,
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
      setLoading(false);
    }
  };

  // 💰 Claim earnings thr
  const claimEarnings = async () => {
    if (earnings < 1500) {
      toast.error("You need ₦1,500 to claim");
      return;
    }

    setClaiming(true);

    try {
      // 1. Update wallet balance
      await callApi("wallet/update", "PUT", {
        user_id: user.user_id,
        newBalance: wallet.balance + 1500,
      });

      // 2. Update user claim
      const { error: userError } = await billzpaddi
        .from("users")
        .update({ has_claimed_referral: true })
        .eq("user_id", user.user_id);

      if (userError) throw userError;

      // 2. Record transaction
      const { error: txError } = await billzpaddi.from("transactions").insert({
        user_id: user.user_id,
        email: user.email,
        amount: 1500,
        type: "credit",
        description: "Referral earnings claim",
        status: "completed",
        reference: uniqueRequestId,
        metadata: {
          referral_code: referralCode,
          referrals_count: referrals.filter((ref) => ref.qualified).length,
          claimed_at: new Date().toISOString(),
        },
      });

      if (txError) throw txError;

      // 3. Reset earnings
      setEarnings(0);
      toast.success("₦1,500 added to your wallet!");

      // Refresh data
      fetchWallet();
      fetchTransactions();
    } catch (error) {
      console.error("Claim error:", error);
      toast.error(error.message || "Claim failed");
    } finally {
      fetchWallet();
      fetchTransactions();
      getUniqueRequestId();
      setClaiming(false);
    }
  };

  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentReferrals = referrals.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(referrals.length / itemsPerPage);

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
      <section className="md:px-4">
        <div className="flex flex-wrap justify-between gap-2 items-center mb-6">
          <h1 className="text-2xl md:text-3xl uppercase">Referral</h1>
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
                  {loading ? "0" : referrals.length}/10
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
                <p className="text-gray-400 text-sm">Your Earnings</p>
                <p className="text-xl font-semibold">
                  ₦{loading ? "0" : earnings.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <div className="flex items-center gap-3">
              <div className="bg-purple-900/20 p-2 rounded-full">
                <HiOutlineArrowRight className="text-purple-400" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Max Potential</p>
                <p className="text-xl font-semibold">₦1,500</p>
              </div>
            </div>
          </div>
        </div>

        {/* Referral Code Section */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 mb-6">
          <h3 className="text-lg font-medium mb-4">Your Referral Code</h3>
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            <div className="relative flex-grow w-full md:w-auto">
              <input
                type="text"
                value={referralCode}
                readOnly
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 font-mono outline-none"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(referralCode);
                  toast.success("Copied referral code!");
                }}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 cursor-pointer text-gray-400 hover:text-white"
              >
                <FaCopy />
              </button>
            </div>
            <button
              onClick={() => {
                const link = `${window.location.origin}/auth/signup?ref=${referralCode}`;
                navigator.clipboard.writeText(link);
                toast.success("Referral link copied!");
              }}
              className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 cursor-pointer text-white py-3 px-6 rounded-md whitespace-nowrap"
            >
              Copy Referral Link
            </button>
          </div>
        </div>

        {/* Referral Details */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">How It Works</h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="bg-gray-700 p-1 rounded-full mt-1">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              </div>
              <p>
                Earn <span className="font-semibold">₦150</span> for each friend
                who signs up using your code and deposits a minimum of ₦3,500
              </p>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-gray-700 p-1 rounded-full mt-1">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              </div>
              <p>
                Maximum <span className="font-semibold">10 referrals</span>{" "}
                (₦1,500 total)
              </p>
            </div>

            <div className="flex items-start gap-3 pb-4">
              <div className="bg-gray-700 p-1 rounded-full mt-1">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              </div>
              <p>
                Claim button activates automatically when you reach ₦1,500 in
                earnings
              </p>
            </div>
            <button
              onClick={claimEarnings}
              disabled={
                earnings < 1500 || claiming || user?.has_claimed_referral
              }
              className={`flex items-center w-full justify-center gap-2 ${
                earnings >= 1500 && !user?.has_claimed_referral && !claiming
                  ? "bg-green-600 hover:bg-green-700 cursor-pointer"
                  : "bg-gray-600 cursor-not-allowed"
              } text-white py-3 px-4 rounded-md`}
            >
              {user?.has_claimed_referral ? (
                <>
                  <FaCheckCircle className="mr-1" />
                  Already Claimed
                </>
              ) : claiming ? (
                <>
                  <FaSpinner className="animate-spin mr-1" />
                  Processing...
                </>
              ) : (
                <>
                  <FaGift className="mr-1" />
                  Claim ₦1,500
                </>
              )}
            </button>
          </div>

          {/* Referrals List */}
          {referrals.length > 0 && (
            <div className="mt-6">
              <h4 className="font-medium mb-3">Your Referrals</h4>
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full">
                  <thead className="bg-gray-700 text-left">
                    <tr>
                      <th className="p-3">Email</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Earned</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentReferrals.map((ref) => (
                      <tr
                        key={ref.user_id}
                        className="border-b border-gray-700"
                      >
                        <td className="p-3">{ref.email}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              ref.qualified
                                ? "bg-green-900/20 text-green-400"
                                : "bg-yellow-900/20 text-yellow-400"
                            }`}
                          >
                            {ref.qualified ? "Qualified" : "Pending"}
                          </span>
                        </td>
                        <td className="p-3">{ref.qualified ? "₦150" : "--"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-6 text-sm">
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    className="px-3 py-1 border border-gray-500 rounded hover:bg-gray-500 cursor-pointer disabled:opacity-30"
                    disabled={currentPage === 1}
                  >
                    Previous
                  </button>

                  <span className="text-gray-400">
                    Page {currentPage} of {totalPages}
                  </span>

                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    className="px-3 py-1 border border-gray-500 rounded hover:bg-gray-500 cursor-pointer disabled:opacity-30"
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
