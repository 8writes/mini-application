"use client";
import { useGlobalContext } from "@/context/GlobalContext";
import { useState, useEffect } from "react";
import { HiRefresh } from "react-icons/hi";
import { FaMoneyBillWave } from "react-icons/fa";
import { billzpaddi } from "@/lib/client";
import { toast } from "react-toastify";
import { useGlobalContextData } from "@/context/GlobalContextData";

export default function WalletPage() {
  const [PaystackPop, setPaystackPop] = useState(null);
  useEffect(() => {
    if (typeof window !== "undefined") {
      import("@paystack/inline-js").then((module) => {
        setPaystackPop(() => module.default);
      });
    }
  }, []);

  const { user, isLoading } = useGlobalContext();
  const { wallet, fetchWallet, fetchTransactions } = useGlobalContextData();
  const [isFunding, setIsFunding] = useState(false);
  const [amount, setAmount] = useState("");
  const [activePreset, setActivePreset] = useState(null);

  const presetAmounts = [1000, 2000, 5000, 10000];
  const paystackKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;
  const PROCESSING_FEE = 20; // Paystack processing fee in NGN

  // Calculate amount to credit including fee
  function calculateAmountToCredit(amount) {
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum)) {
      return 0;
    }

    let percentageFee = 0.015 * amountNum;
    let flatFee = amountNum >= 2500 ? 100 : 0;
    let totalFee = percentageFee + flatFee;

    // Cap fee at ₦2000
    if (totalFee > 2000) {
      totalFee = 2000;
    }

    return amountNum + totalFee;
  }

  const amountToCredit = calculateAmountToCredit(amount);

  const initializePayment = async () => {
    return new Promise((resolve, reject) => {
      const handler = PaystackPop.setup({
        key: paystackKey,
        email: user?.email.trim(),
        amount: amountToCredit * 100, // Convert to kobo
        currency: "NGN",
        callback: async (response) => {
          if (response.status === "success") {
            await updateWalletBalance(response.reference);
            resolve(response);
          } else {
            // Create failed transaction record
            const { error: transactionError } = await billzpaddi
              .from("transactions")
              .insert({
                user_id: user.user_id,
                amount: 0,
                type: "credit",
                description: "Wallet Funding",
                status: "failed",
                reference: response.reference || "none",
              });

            if (transactionError) throw transactionError;
            reject(toast.error("Payment failed."));
          }
        },
        onClose: () => reject(toast.error("Transaction was canceled by user.")),
      });
      handler.openIframe();
    });
  };

  const updateWalletBalance = async (reference) => {
    setIsFunding(true);
    try {
      const fundingAmount = parseFloat(amount);
      const currentBalance = parseFloat(wallet?.balance || 0);
      const newBalance = currentBalance + fundingAmount;

      // Update wallet balance
      const { error: walletError } = await billzpaddi
        .from("wallets")
        .update({ balance: newBalance })
        .eq("user_id", user?.user_id);

      if (walletError) throw walletError;

      // Create transaction record
      const { error: transactionError } = await billzpaddi
        .from("transactions")
        .insert({
          user_id: user.user_id,
          amount: fundingAmount,
          type: "credit",
          description: "Wallet Funding",
          status: "completed",
          reference,
        });

      if (transactionError) throw transactionError;

      // Refresh data
      fetchWallet();
      fetchTransactions();

      setAmount("");
      setActivePreset(null);
      toast.success(`Wallet funded with ₦${fundingAmount.toLocaleString()}`);
    } catch (error) {
      console.error("Wallet update error:", error);
      toast.error("Payment successful but wallet update failed");
    } finally {
      setIsFunding(false);
    }
  };

  const handleFundWallet = async (e) => {
    e.preventDefault();

    if (!amount || parseFloat(amount) <= 0) {
      toast.info("Please enter a valid amount");
      return;
    }

    const amountValue = parseFloat(amount);

    if (amountValue > wallet?.limit) {
      toast.error(`Max deposit of ₦${wallet?.limit.toLocaleString()}`);
      return;
    }

    // Fetch current wallet balance
    const { data: walletData, error: fetchError } = await billzpaddi
      .from("wallets")
      .select("balance")
      .eq("user_id", user?.user_id)
      .single();

    if (fetchError || !walletData) {
      toast.error("Failed to fetch wallet balance");
      return;
    }

    const currentBalance = walletData?.balance || 0;
    if (currentBalance >= wallet?.limit) {
      toast.error(`Max wallet balance of ₦${wallet?.limit.toLocaleString()}`);
      return;
    }

    try {
      await initializePayment();
    } catch (error) {
      console.error("Payment error:", error);
    }
  };

  const handleAmountChange = (e) => {
    const value = e.target.value;
    // Only allow numbers and one decimal point
    if (/^\d*\.?\d*$/.test(value) || value === "") {
      setAmount(value);
      setActivePreset(null);
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
                  ₦
                  {wallet?.balance?.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }) ?? "0.00"}
                </p>
              </div>
            </div>
            <button
              className="bg-gray-700 hover:bg-gray-600 cursor-pointer p-2 rounded-lg"
              onClick={() => {
                fetchWallet();
                //fetchData();
              }}
            >
              <HiRefresh className="text-xl" />
            </button>
          </div>

          {/* Wallet Info */}
          <div className="bg-gray-700/50 rounded-lg p-3 mb-6 text-sm">
            <div className="flex items-center justify-between flex-wrap gap-2 text-gray-300">
              <span>Wallet Limit ₦{wallet?.limit.toLocaleString()}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-yellow-400">Account Status:</span>
                <span
                  className={`${
                    user?.verified
                      ? "text-green-400 bg-green-500/10 "
                      : "text-red-400 bg-red-500/10 "
                  } text-xs px-2 py-0.5 rounded-md`}
                >
                  {user?.verified ? "Verified" : "Unverified"}
                </span>
              </div>
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
                    setAmount(preset.toString());
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
              <label className="block text-gray-400 mb-2">Enter Amount</label>
              <div className="relative">
                <input
                  type="tel" // Changed to text to better handle input
                  value={amount}
                  onChange={handleAmountChange}
                  placeholder="(minimum ₦100)"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 pl-12 outline-none"
                  required
                  min="100"
                  disabled={isFunding}
                />
                <span className="absolute left-3 top-3.5 text-gray-400">
                  NGN
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Processing fee: 1.5% {amountToCredit >= 2500 && <>+ NGN 100</>}
              </p>
              <p className="text-sm text-gray-400 mt-1">
                Total to pay: ₦{amountToCredit.toLocaleString()}
              </p>
            </div>
            <button
              type="submit"
              disabled={isFunding || !amount || parseFloat(amount) < 100}
              className={`w-full py-3 rounded-lg transition-colors font-medium ${
                isFunding || !amount || parseFloat(amount) < 100
                  ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
              }`}
            >
              {isFunding ? "Processing..." : "Fund Wallet"}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
