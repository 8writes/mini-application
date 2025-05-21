"use client";
import { useGlobalContext } from "@/context/GlobalContext";
import { useState, useEffect } from "react";
import { HiSearch, HiFilter, HiArrowDown, HiArrowUp } from "react-icons/hi";
import { FaExchangeAlt } from "react-icons/fa";
import { useGlobalContextData } from "@/context/GlobalContextData";

export default function TransactionsPage() {
  const { user, isLoading } = useGlobalContext();
  const { transactions } = useGlobalContextData();
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");
  const [conversionRate] = useState(50); // 1 BLZ = 50 Naira

  const nairaToBlz = (naira) => (naira / conversionRate).toFixed(2);

  useEffect(() => {
    let result = [...transactions];

    if (searchTerm) {
      result = result.filter(
        (txn) =>
          txn.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          txn.reference.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filter !== "all") {
      result = result.filter((txn) => txn.type === filter);
    }

    result.sort((a, b) => {
      const dateA = new Date(a.created_at);
      const dateB = new Date(b.created_at);
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });

    setFilteredTransactions(result);
  }, [searchTerm, filter, sortOrder, transactions]);

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
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Transaction History</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">1 BLZ = ₦50</span>
        </div>
      </div>

      {/* Controls - Stacked on mobile */}
      <div className="flex flex-col space-y-3 mb-6 md:grid md:grid-cols-3 md:gap-4 md:space-y-0">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <HiSearch className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search..."
            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 outline-none text-sm md:text-base"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <HiFilter className="text-gray-400" />
          </div>
          <select
            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 appearance-none outline-none text-sm md:text-base"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All</option>
            <option value="credit">Credits</option>
            <option value="debit">Debits</option>
          </select>
        </div>

        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FaExchangeAlt className="text-gray-400" />
          </div>
          <select
            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 appearance-none outline-none text-sm md:text-base"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
          </select>
        </div>
      </div>

      {/* Transactions - Card view on mobile */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        {/* Desktop Table Header (hidden on mobile) */}
        <div className="hidden md:grid md:grid-cols-5 gap-4 p-4 border-b border-gray-700 font-medium text-gray-400 text-sm">
          <div className="col-span-2">Transaction</div>
          <div className="text-center">Amount</div>
          <div>Date</div>
          <div className="text-right">Status</div>
        </div>

        {filteredTransactions.length > 0 ? (
          <ul className="divide-y divide-gray-700">
            {filteredTransactions.map((txn) => (
              <li
                key={txn.id}
                className="hover:bg-gray-700/50 transition-colors"
              >
                {/* Mobile View */}
                <div className="md:hidden p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-3">
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
                        <p className="text-xs text-gray-400">
                          {new Date(txn.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
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
                      <span
                        className={`inline-block mt-1 px-2 py-1 rounded-full text-xs font-medium ${
                          txn.status === "completed"
                            ? "bg-green-900/20 text-green-400"
                            : txn.status === "pending"
                            ? "bg-yellow-900/20 text-yellow-400"
                            : "bg-red-900/20 text-red-400"
                        }`}
                      >
                        {txn.status.charAt(0).toUpperCase() +
                          txn.status.slice(1)}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-2 text-sm text-gray-400">
                    <p>₦{txn.amount.toLocaleString()}</p>
                    <p className="text-xs">{txn.reference}</p>
                  </div>
                </div>

                {/* Desktop View */}
                <div className="hidden md:grid md:grid-cols-5 gap-4 p-4 items-center">
                  <div className="col-span-2 flex items-center gap-3">
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
                      <p className="text-xs text-gray-400">{txn.reference}</p>
                    </div>
                  </div>

                  <div className="text-center">
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
                  </div>

                  <div>
                    <p className="text-sm">
                      {new Date(txn.created_at).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(txn.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>

                  <div className="text-right">
                    <span
                      className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                        txn.status === "completed"
                          ? "bg-green-900/20 text-green-400"
                          : txn.status === "pending"
                          ? "bg-yellow-900/20 text-yellow-400"
                          : "bg-red-900/20 text-red-400"
                      }`}
                    >
                      {txn.status.charAt(0).toUpperCase() + txn.status.slice(1)}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-8 text-center text-gray-400">
            {searchTerm ? (
              <p>No matching transactions found</p>
            ) : (
              <p>No transactions available</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
