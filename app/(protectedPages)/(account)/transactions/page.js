"use client";
import { useGlobalContext } from "@/context/GlobalContext";
import { useState, useEffect } from "react";
import { HiSearch, HiFilter, HiArrowDown, HiArrowUp } from "react-icons/hi";
import { FaExchangeAlt } from "react-icons/fa";

export default function TransactionsPage() {
  const { user, isLoading } = useGlobalContext();
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");
  const [conversionRate] = useState(50); // 1 BLZ = 50 Naira

  // Convert Naira to BLZ
  const nairaToBlz = (naira) => (naira / conversionRate).toFixed(2);

  useEffect(() => {
    // Fetch transactions from API
    const fetchTransactions = async () => {
      // Simulate API call with mock data
      setTimeout(() => {
        const mockTransactions = [
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
        ];
        setTransactions(mockTransactions);
        setFilteredTransactions(mockTransactions);
      }, 1000);
    };

    fetchTransactions();
  }, []);

  useEffect(() => {
    // Filter and sort transactions
    let result = [...transactions];

    // Apply search filter
    if (searchTerm) {
      result = result.filter(
        (txn) =>
          txn.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          txn.reference.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply type filter
    if (filter !== "all") {
      result = result.filter((txn) => txn.type === filter);
    }

    // Apply sorting
    result.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">Transaction History</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">1 BLZ = ₦50</span>
        </div>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Search */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <HiSearch className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search transactions..."
            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Filter */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <HiFilter className="text-gray-400" />
          </div>
          <select
            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 appearance-none outline-none"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All Transactions</option>
            <option value="credit">Credits</option>
            <option value="debit">Debits</option>
          </select>
        </div>

        {/* Sort */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FaExchangeAlt className="text-gray-400" />
          </div>
          <select
            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 appearance-none outline-none"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-gray-700 font-medium text-gray-400 text-sm">
          <div className="col-span-5 md:col-span-6">Description</div>
          <div className="col-span-3 md:col-span-2 text-center">Amount</div>
          <div className="col-span-2 hidden md:block">Date</div>
          <div className="col-span-4 md:col-span-2 text-right">Status</div>
        </div>

        {/* Transactions List */}
        {filteredTransactions.length > 0 ? (
          <ul className="divide-y divide-gray-700">
            {filteredTransactions.map((txn) => (
              <li
                key={txn.id}
                className="hover:bg-gray-700/50 transition-colors"
              >
                <div className="grid grid-cols-12 gap-4 p-4 items-center">
                  {/* Description */}
                  <div className="col-span-5 md:col-span-6 flex items-center gap-3">
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
                      <p className="text-xs text-gray-400 md:hidden">
                        {new Date(txn.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="col-span-3 md:col-span-2 text-center">
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

                  {/* Date (Desktop) */}
                  <div className="col-span-2 hidden md:block">
                    <p className="text-sm">
                      {new Date(txn.date).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(txn.date).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>

                  {/* Status */}
                  <div className="col-span-4 md:col-span-2 text-right">
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
              <p>No transactions match your search criteria</p>
            ) : (
              <p>No transactions found</p>
            )}
          </div>
        )}
      </div>

      {/* Pagination would go here */}
      {/* <div className="mt-6 flex justify-center">
        <Pagination />
      </div> */}
    </div>
  );
}
