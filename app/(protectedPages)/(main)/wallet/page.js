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
import { billzpaddi } from "@/lib/client";
import { toast } from "react-toastify";
import { useGlobalContextData } from "@/context/GlobalContextData";

export default function WalletPage() {
  const { user, isLoading } = useGlobalContext();
  const { wallet, fetchWallet, fetchTransactions } = useGlobalContextData();
  const [isFunding, setIsFunding] = useState(false);
  const [amount, setAmount] = useState("");
  const [activePreset, setActivePreset] = useState(null);
  const [conversionRate] = useState(50); // 1 BLZ = 50 Naira

  // Convert Naira to BLZ
  const nairaToBlz = (naira) => naira / conversionRate;
  const blzToNaira = (blz) => blz * conversionRate;

  const presetAmounts = [1000, 2000, 5000, 10000];

  // Fund wallet
  const handleFundWallet = async (e) => {
    e.preventDefault();

    if (!amount) {
      toast.info("Enter an amount");
      return;
    }

    setIsFunding(true);

    try {
      // 1. First get the current wallet balance
      const { data: currentWallet, error: fetchError } = await billzpaddi
        .from("wallets")
        .select("balance")
        .eq("user_id", user?.user_id)
        .single();

      if (fetchError) throw fetchError;
      if (!currentWallet) throw new Error("Wallet not found");

      // 2. Calculate new balance (current + new amount)
      const currentBalance = parseFloat(currentWallet.balance);
      const fundingAmount = parseFloat(amount);
      const newBalance = currentBalance + fundingAmount;

      // 3. Update wallet with new balance
      const { data: updatedWallet, error: updateError } = await billzpaddi
        .from("wallets")
        .update({ balance: newBalance })
        .eq("user_id", user?.user_id)
        .select();

      if (updateError) throw updateError;

      const reference = `REF-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      // 4. Create a transaction record
      const { error: transactionError } = await billzpaddi
        .from("transactions")
        .insert({
          user_id: user.user_id,
          amount: blzToNaira(fundingAmount),
          type: "credit",
          description: "Wallet Funding",
          status: "completed",
          reference,
        });

      if (transactionError) throw transactionError;

      fetchWallet();
      fetchTransactions();
      setAmount("");
      setActivePreset(null);
      toast.success(`Wallet funded with ${fundingAmount} BLZ`);
    } catch (error) {
      console.error("Funding error:", error);
      toast.error(error.message || "Failed to fund wallet");
    } finally {
      setIsFunding(false);
    }
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
      {/* Wallet Balance Section */}
      <section className="mb-8">
        <h1 className="text-2xl md:text-3xl uppercase pb-5">Wallet</h1>
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-lg text-gray-400 mb-1">Wallet Balance</h2>
              <div className="flex flex-wrap items-end gap-2">
                <p className="text-xl md:text-3xl font-bold">
                  {wallet?.currency ?? "BLZ"}{" "}
                  {wallet?.balance?.toFixed(2) ?? "0.00"}
                </p>
                <p className="text-gray-400 text-sm mb-1">
                  (₦{blzToNaira(wallet?.balance).toLocaleString() ?? "0.00"})
                </p>
              </div>
            </div>
            <button
              className="bg-gray-700 hover:bg-gray-600 cursor-pointer p-2 rounded-lg"
              onClick={() => fetchWallet()}
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
                  placeholder="0"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 pl-12 outline-none"
                  required
                  min="1"
                  disabled={isFunding}
                />
                <span className="absolute left-3 top-3.5 text-gray-400">
                  BLZ
                </span>
              </div>
              {amount && (
                <p className="text-sm text-gray-400 mt-1">
                  ₦{blzToNaira(amount).toLocaleString()} NGN
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isFunding}
              className="w-full bg-blue-600 hover:bg-blue-700 cursor-pointer text-white py-3 rounded-lg transition-colors font-medium"
            >
              {isFunding ? "Processing..." : "Fund Wallet"}
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

                    {/* Amount and Status (Right Side) /////
                    <div className="text-right ml-4">
                      <p
                        className={`font-semibold ${
                          txn.type === "credit"
                            ? "text-green-400"
                            : "text-red-400"
                        }`}
                      >
                        {txn.type === "credit" ? "+" : "-"}
                        {txn.amount.toFixed(2)} BLZ
                      </p>
                      <p className="text-xs text-gray-400">
                        ₦{blzToNaira(txn.amount).toLocaleString()}
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
