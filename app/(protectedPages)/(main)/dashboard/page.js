"use client";
import { useGlobalContext } from "@/context/GlobalContext";
import {
  HiArrowUp,
  HiArrowDown,
  HiRefresh,
  HiCreditCard,
  HiOutlineCash,
  HiChartBar,
  HiOutlinePhone,
  HiDocumentText,
  HiOutlineFire,
} from "react-icons/hi";
import { FaHistory, FaGamepad } from "react-icons/fa";
import Link from "next/link";
import { useGlobalContextData } from "@/context/GlobalContextData";
import BillzPaddiCarousel from "@/components/carousel/dashboardCarousel";
import { useEffect } from "react";
import { format } from "date-fns";

export default function DashboardPage() {
  const { user, isLoading } = useGlobalContext();
  const { wallet, transactions, fetchTransactions, fetchWallet } =
    useGlobalContextData();

  useEffect(() => {
    fetchWallet();
    fetchTransactions();
  }, []);

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
    <div className="p-4 md:p-6 md:pt-0">
      

      {/* Wallet Summary */}
      <section className="mb-8">
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <div>
                <h2 className="text-sm text-gray-400 mb-1">Wallet Balance</h2>
                <div className="flex flex-wrap items-end gap-2">
                  <p className="text-xl md:text-3xl font-bold">
                    ₦
                    {wallet?.balance?.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }) ?? "0.00"}
                  </p>
                </div>
              </div>
            </div>
            <Link href="/wallet" passHref>
              <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-sm cursor-pointer flex items-center gap-2 text-sm transition-colors">
                <HiArrowDown className="text-lg" />
                Add Money
              </button>
            </Link>
            {false && (
              <button
                onClick={() => window.location.reload()}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-sm cursor-pointer flex items-center gap-2 text-sm transition-colors"
              >
                <HiRefresh className="text-lg" />
                Refresh
              </button>
            )}
          </div>

          {/* Quick Actions - Made smaller */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            {/* Buy Data Button */}
            <Link href="/data" passHref>
              <button className="w-full bg-gray-700 cursor-pointer hover:bg-gray-600 p-3 rounded-lg flex flex-col items-center transition-colors">
                <div className="bg-purple-500/20 p-2 rounded-full mb-1">
                  <HiChartBar className="text-purple-400 text-lg" />
                </div>
                <span className="text-sm">Buy Data</span>
              </button>
            </Link>

            {/* Pay Bills Button */}
            <Link href="/airtime" passHref>
              <button className="w-full bg-gray-700 cursor-pointer hover:bg-gray-600 p-3 rounded-lg flex flex-col items-center transition-colors">
                <div className="bg-yellow-500/20 p-2 rounded-full mb-1">
                  <HiOutlinePhone className="text-yellow-400 text-lg" />
                </div>
                <span className="text-sm">Buy Airtime</span>
              </button>
            </Link>

            {/* Convert Invoice Code Button */}
            <Link href="/generate-invoice" passHref>
              <button className="w-full bg-gray-700 cursor-pointer hover:bg-gray-600 p-3 rounded-lg flex flex-col items-center transition-colors">
                <div className="bg-blue-500/20 p-2 rounded-full mb-1">
                  <HiDocumentText className="text-blue-400 text-lg" />
                </div>
                <span className="text-sm">Invoice</span>
              </button>
            </Link>

            {/* Another service button if needed */}
            <Link href="/all-services" passHref>
              <button className="w-full bg-gray-700 cursor-pointer hover:bg-gray-600 p-3 rounded-lg flex flex-col items-center transition-colors">
                <div className="bg-gray-400/20 p-2 rounded-full mb-1">
                  <HiOutlineFire className="text-gray-300 text-lg" />
                </div>
                <span className="text-sm">All Services</span>
              </button>
            </Link>
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
            className="text-sm text-gray-200 hover:underline pr-2"
          >
            View All
          </Link>
        </div>

        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          {transactions?.length > 0 ? (
            <ul className="divide-y divide-gray-700">
              {transactions?.slice(0, 5).map((txn) => (
                <li
                  key={txn.id}
                  className="px-4 py-2 hover:bg-gray-700/50 transition-colors"
                >
                  {" "}
                  <Link href={`/transactions/info/${txn.reference}`} className="block">
                    <div className="flex items-center justify-between">
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
                            <p className="text-sm font-medium">
                              {txn.description}
                            </p>
                            <p className="text-sm text-gray-400">
                              {format(new Date(txn?.created_at), "PPpp")}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Amount and Status (Right Side) */}
                      <div className="text-right ml-4">
                        <p
                          className={`font-medium ${
                            txn.type === "credit"
                              ? "text-green-400"
                              : "text-red-400"
                          }`}
                        >
                          {txn.type === "credit" ? "+" : "-"}₦
                          {txn.amount?.toLocaleString()}
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
                  </Link>
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
