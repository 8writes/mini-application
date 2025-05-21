"use client";
import { useGlobalContext } from "@/context/GlobalContext";
import { useState, useEffect } from "react";
import {
  HiArrowUp,
  HiArrowDown,
  HiRefresh,
  HiCurrencyDollar,
} from "react-icons/hi";
import { FaMoneyBillWave } from "react-icons/fa";
import Link from "next/link";

export default function WalletPage() {
  const { user, isLoading } = useGlobalContext();
  const [wallet, setWallet] = useState({
    balance: 12500.75, // In Naira
    currency: "BLZ",
    transactions: [],
  });
  const [amount, setAmount] = useState("");
  const [activePreset, setActivePreset] = useState(null);
  const [conversionRate] = useState(50); // 1 BLZ = 50 Naira

  // Convert Naira to BLZ
  const nairaToBlz = (naira) => (naira / conversionRate).toFixed(2);
  const blzToNaira = (blz) => (blz * conversionRate);

  const presetAmounts = [1000, 2000, 5000, 10000];

  const handleFundWallet = (e) => {
    e.preventDefault();
    // Add your wallet funding logic here
    console.log(
      `Funding wallet with ${amount} BLZ (${blzToNaira(amount)} NGN)`
    );
    // Reset form
    setAmount("");
    setActivePreset(null);
  };

  useEffect(() => {
    // Fetch wallet data from API here
    // This is just mock data
    const fetchWalletData = async () => {
      // Simulate API call
      setTimeout(() => {
        setWallet({
          balance: 0,
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
        });
      }, 1000);
    };

    fetchWalletData();
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
    <div className="p-4 md:p-6">
      {/* Wallet Balance Section */}
      <section className="mb-8">
        <h1 className="text-2xl md:text-3xl uppercase pb-5">Wallet</h1>
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-lg text-gray-400 mb-1">Wallet Balance</h2>
              <div className="flex flex-wrap items-end gap-2">
                <p className="text-xl md:text-3xl font-bold">
                  {wallet.currency?? "BLZ"} {nairaToBlz(wallet.balance)}
                </p>
                <p className="text-gray-400 text-sm mb-1">
                  (₦{wallet.balance.toLocaleString()})
                </p>
              </div>
            </div>
            <button
              className="bg-gray-700 hover:bg-gray-600 cursor-pointer p-2 rounded-lg"
              onClick={() => window.location.reload()}
            >
              <HiRefresh className="text-xl" />
            </button>
          </div>

          {/* Currency Conversion Info */}
          <div className="bg-gray-700/50 rounded-lg p-3 mb-6 text-sm">
            <div className="flex items-center gap-2 text-gray-300">
              <HiCurrencyDollar />
              <span>1 BLZ = ₦50</span>
            </div>
          </div>
        </div>
      </section>

      {/* Fund Wallet Section */}
      <section className="mb-8">
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <FaMoneyBillWave className="text-gray-400" />
            Fund Your Wallet
          </h2>

          {/* Quick Top-Up Presets */}
          <div className="mb-6">
            <h3 className="text-gray-400 mb-3">Quick Top-Up (NGN)</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {presetAmounts.map((preset) => (
                <button
                  key={preset}
                  onClick={() => {
                    setActivePreset(preset);
                    setAmount(nairaToBlz(preset));
                  }}
                  className={`py-3 rounded-lg cursor-pointer transition-colors ${
                    activePreset === preset
                      ? "bg-blue-600 text-white"
                      : "bg-gray-700 hover:bg-gray-600"
                  }`}
                >
                  ₦{preset.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          {/* Manual Amount Input */}
          <form onSubmit={handleFundWallet}>
            <div className="mb-4">
              <label className="block text-gray-400 mb-2">
                Enter Amount (BLZ)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    setActivePreset(null);
                  }}
                  placeholder="0.00"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 pl-12 outline-none"
                  required
                  min="1"
                  step="0.01"
                />
                <span className="absolute left-3 top-3.5 text-gray-400">
                  BLZ
                </span>
              </div>
              {amount && (
                <p className="text-sm text-gray-400 mt-1">
                  ₦{blzToNaira(amount)} NGN
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 cursor-pointer text-white py-3 rounded-lg transition-colors font-medium"
            >
              Fund Wallet
            </button>
          </form>
        </div>
      </section>

      {/* Recent Transactions 
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Recent Transactions</h2>
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
                    {/* Transaction Details (Left Side) ////
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
                            {txn.reference || "No reference"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Amount and Status (Right Side) ////
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
      </section>*/}
    </div>
  );
}
