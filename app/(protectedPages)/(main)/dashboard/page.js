"use client";
import { useGlobalContext } from "@/context/GlobalContext";
import {
  HiArrowUp,
  HiArrowDown,
  HiRefresh,
  HiCreditCard,
  HiOutlineCash,
} from "react-icons/hi";
import { FaMoneyBillWave, FaHistory } from "react-icons/fa";
import Link from "next/link";
import { useState } from "react";

export default function DashboardPage() {
  const { user, isLoading } = useGlobalContext();
  const [conversionRate] = useState(50); // 1 BLZ = 50 Naira

  // Convert Naira to BLZ
  const nairaToBlz = (naira) => (naira / conversionRate).toFixed(2);

  // Sample wallet data - replace with your actual data
  const wallet = {
    balance: 12500.75,
    currency: "BLZ",
    transactions: [
      {
        id: 1,
        type: "credit",
        amount: 5000,
        description: "Wallet Funding",
        date: "2023-06-15T10:30:00",
        status: "completed",
        reference: "REF-123456",
      },
      {
        id: 2,
        type: "debit",
        amount: 1500,
        description: "Airtime Purchase - MTN",
        date: "2023-06-14T14:45:00",
        status: "completed",
        reference: "REF-789012",
      },
      {
        id: 3,
        type: "credit",
        amount: 10000,
        description: "Referral Bonus",
        date: "2023-06-10T08:15:00",
        status: "completed",
        reference: "REF-345678",
      },
      {
        id: 4,
        type: "debit",
        amount: 2500,
        description: "DSTV Subscription",
        date: "2023-06-08T16:20:00",
        status: "completed",
        reference: "REF-901234",
      },
      {
        id: 5,
        type: "debit",
        amount: 500,
        description: "Data Purchase - Airtel",
        date: "2023-06-05T11:10:00",
        status: "failed",
        reference: "REF-567890",
      },
    ],
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
      {/* Welcome Section */}
      <section className="">
        <div className="flex flex-wrap justify-between gap-4 items-center">
          {/** <h1 className="text-2xl md:text-3xl font-bold">
            Welcome, {user?.last_name ?? "User"}
          </h1>
           
          <div className="text-sm text-gray-400">
            Last login: {new Date().toLocaleDateString()}
          </div>*/}
        </div>
        <h1 className="text-2xl md:text-3xl uppercase pb-5">Dashboard</h1>
      </section>

      {/* Wallet Summary */}
      <section className="mb-8">
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-lg text-gray-400 mb-1">Wallet Balance</h2>
              <p className="text-xl md:text-3xl font-bold">
                {wallet.currency} {wallet.balance.toLocaleString()}
              </p>
            </div>
            <div className="flex gap-3">
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-sm cursor-pointer flex items-center gap-2 text-sm transition-colors">
                <HiRefresh className="text-lg" />
                Refresh
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <button className="bg-gray-700 hover:bg-gray-600 p-4 rounded-lg flex flex-col items-center transition-colors">
              <div className="bg-green-500/20 p-3 rounded-full mb-2">
                <HiArrowDown className="text-green-400 text-xl" />
              </div>
              <span>Fund Wallet</span>
            </button>

            {/** 
            <button className="bg-gray-700 hover:bg-gray-600 p-4 rounded-lg flex flex-col items-center transition-colors">
              <div className="bg-blue-500/20 p-3 rounded-full mb-2">
                <HiArrowUp className="text-blue-400 text-xl" />
              </div>
              <span>Withdraw</span>
            </button>*/}

            <button className="bg-gray-700 hover:bg-gray-600 p-4 rounded-lg flex flex-col items-center transition-colors">
              <div className="bg-blue-500/20 p-3 rounded-full mb-2">
                <HiOutlineCash className="text-blue-400 text-xl" />
              </div>
              <span>Convert Bet Code</span>
            </button>

            <button className="bg-gray-700 hover:bg-gray-600 p-4 rounded-lg flex flex-col items-center transition-colors">
              <div className="bg-purple-500/20 p-3 rounded-full mb-2">
                <HiCreditCard className="text-purple-400 text-xl" />
              </div>
              <span>Buy Data</span>
            </button>

            <button className="bg-gray-700 hover:bg-gray-600 p-4 rounded-lg flex flex-col items-center transition-colors">
              <div className="bg-yellow-500/20 p-3 rounded-full mb-2">
                <FaMoneyBillWave className="text-yellow-400 text-xl" />
              </div>
              <span>Pay Bills</span>
            </button>
          </div>
        </div>
      </section>

      {/* Recent Transactions */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <FaHistory className="text-gray-400" />
            Recent Transactions
          </h2>
          <Link
            href="/transactions"
            className="text-sm text-blue-400 hover:underline"
          >
            View All
          </Link>
        </div>

        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          {wallet.transactions.length > 0 ? (
            <ul className="divide-y divide-gray-700">
              {wallet.transactions.map((txn) => (
                <li
                  key={txn.id}
                  className="p-4 hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    {/* Transaction Details (Left Side) */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <div
                          className={`p-2 rounded-lg ${
                            txn.type === "credit"
                              ? "bg-green-900/20 text-green-400"
                              : "bg-red-900/20 text-red-400"
                          }`}
                        >
                          {txn.type === "credit" ? (
                            <HiArrowDown className="text-lg" />
                          ) : (
                            <HiArrowUp className="text-lg" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{txn.description}</p>
                          <p className="text-sm text-gray-400">
                            {new Date(txn.date).toLocaleDateString()} •{" "}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Amount and Status (Right Side) */}
                    <div className="text-right ml-4">
                      <p
                        className={`font-semibold ${
                          txn.type === "credit"
                            ? "text-green-400"
                            : "text-red-400"
                        }`}
                      >
                        {txn.type === "credit" ? "+" : "-"}
                        {nairaToBlz(txn.amount)} BLZ
                      </p>
                      <p className="text-xs text-gray-400">
                        ₦{txn.amount.toLocaleString()}
                      </p>
                      <span
                        className={`inline-block mt-1 px-2 py-1 rounded-full text-xs font-medium ${
                          txn.status === "completed"
                            ? "bg-green-900/20 text-green-400"
                            : txn.status === "pending"
                            ? "bg-yellow-900/20 text-yellow-400"
                            : "bg-red-900/20 text-red-400"
                        }`}
                      >
                        {txn.status?.charAt(0).toUpperCase() +
                          txn.status?.slice(1) || "Pending"}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-8 text-center text-gray-400">
              No transactions yet
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
