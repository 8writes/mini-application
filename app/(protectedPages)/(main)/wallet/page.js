"use client";
import { useGlobalContext } from "@/context/GlobalContext";
import { useState, useEffect } from "react";
import { HiRefresh } from "react-icons/hi";
import { FaMoneyBillWave, FaBank, FaPiggyBank, FaCopy } from "react-icons/fa";
import { billzpaddi } from "@/lib/client";
import { toast } from "react-toastify";
import { useGlobalContextData } from "@/context/GlobalContextData";
import { TbTransfer } from "react-icons/tb";

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
  const {
    wallet,
    fetchWallet,
    getUniqueRequestId,
    uniqueRequestId,
    fetchTransactions,
  } = useGlobalContextData();
  const [isFunding, setIsFunding] = useState(false);
  const [amount, setAmount] = useState("");
  const [activePreset, setActivePreset] = useState(null);
  const [activeTab, setActiveTab] = useState("instant"); // 'instant' or 'bank'
  const [bankDetails, setBankDetails] = useState({
    accountName: "EMMANUEL CHISOM",
    accountNumber: "9153374542",
    bankName: "OPay",
  });

  const presetAmounts = [1000, 2000, 5000, 10000];
  const paystackKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;

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

  useEffect(() => {
    getUniqueRequestId();
  }, []);

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
          email: user?.email,
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

  const handleBankTransfer = async (e) => {
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

    setIsFunding(true);
    try {
      const fundingAmount = parseFloat(amount);
      const reference = `bank${uniqueRequestId}`;

      // Create pending transaction record
      const { error: transactionError } = await billzpaddi
        .from("transactions")
        .insert({
          user_id: user?.user_id,
          email: user?.email,
          amount: fundingAmount,
          type: "credit",
          description: "Wallet Funding (Bank Transfer)",
          status: "pending",
          reference,
        });

      if (transactionError) throw transactionError;

      toast.success(`Bank transfer request submitted.`, { autoClose: false });
      setAmount("");
      setActivePreset(null);
    } catch (error) {
      console.error("Bank transfer error:", error);
      toast.error("Failed to submit bank transfer request");
    } finally {
      setIsFunding(false);
      getUniqueRequestId();
      fetchTransactions();
      fetchWallet();
    }
  };

  const handleFundWallet = async (e) => {
    e.preventDefault();

    if (activeTab === "instant") {
      await handleInstantDeposit(e);
    } else {
      await handleBankTransfer(e);
    }
  };

  const handleInstantDeposit = async (e) => {
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

          {/* Deposit Method Tabs */}
          <div className="flex border-b border-gray-700 mb-6">
            <button
              className={`py-2 px-4 font-medium cursor-pointer flex items-center gap-2 ${
                activeTab === "instant"
                  ? "text-blue-400 border-b-2 border-blue-400"
                  : "text-gray-400 hover:text-gray-300"
              }`}
              onClick={() => setActiveTab("instant")}
            >
              <TbTransfer />
              Instant Deposit
            </button>
            <button
              className={`py-2 px-4 font-medium cursor-pointer flex items-center gap-2 ${
                activeTab === "bank"
                  ? "text-blue-400 border-b-2 border-blue-400"
                  : "text-gray-400 hover:text-gray-300"
              }`}
              onClick={() => setActiveTab("bank")}
            >
              <FaPiggyBank />
              Bank Transfer
            </button>
          </div>

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
                  type="tel"
                  value={amount}
                  onChange={handleAmountChange}
                  placeholder={
                    activeTab === "instant"
                      ? "(minimum ₦100)"
                      : "(minimum ₦500)"
                  }
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 pl-12 outline-none"
                  required
                  min={activeTab === "instant" ? "100" : "500"}
                  disabled={isFunding}
                />
                <span className="absolute left-3 top-3.5 text-gray-400">
                  NGN
                </span>
              </div>

              {activeTab === "instant" ? (
                <>
                  <p className="text-sm text-gray-400 mt-1">
                    Paystack processing fee: 1.5%{" "}
                    {amountToCredit >= 2500 && <>+ ₦100</>}
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    Total to pay: ₦{amountToCredit.toLocaleString()}
                  </p>
                </>
              ) : (
                <p className="text-sm text-gray-400 mt-1">
                  No processing fees - manual approval required (may take up to
                  5 minutes)
                </p>
              )}
            </div>

            {activeTab === "bank" && (
              <div className="bg-gray-700/50 rounded-lg p-4 mb-4">
                <h3 className="font-medium text-gray-300 mb-2">
                  Bank Transfer Instructions
                </h3>
                <div className="space-y-2 text-sm text-gray-400">
                  <p>1. Transfer to our bank account:</p>
                  <div className="bg-gray-800 p-3 rounded-md space-y-2">
                    {/* Bank Name */}
                    <div className="flex justify-between items-center">
                      <p className="text-gray-300">
                        <span className="font-medium">Bank Name:</span>{" "}
                        {bankDetails.bankName}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(bankDetails.bankName);
                          toast.success("Bank name copied!");
                        }}
                        className="text-gray-400 cursor-pointer hover:text-white ml-2"
                        title="Copy bank name"
                      >
                        <FaCopy className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Account Name */}
                    <div className="flex justify-between items-center">
                      <p className="text-gray-300">
                        <span className="font-medium">Account Name:</span>{" "}
                        {bankDetails.accountName}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(
                            bankDetails.accountName
                          );
                          toast.success("Account name copied!");
                        }}
                        className="text-gray-400 cursor-pointer hover:text-white ml-2"
                        title="Copy account name"
                      >
                        <FaCopy className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Account Number */}
                    <div className="flex justify-between items-center">
                      <p className="text-gray-300">
                        <span className="font-medium">Account Number:</span>{" "}
                        {bankDetails.accountNumber}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(
                            bankDetails.accountNumber
                          );
                          toast.success("Account number copied!");
                        }}
                        className="text-gray-400 cursor-pointer hover:text-white ml-2"
                        title="Copy account number"
                      >
                        <FaCopy className="h-4 w-4" />
                      </button>
                    </div>
                    {/* Amount to send */}
                    <div className="flex justify-between items-center">
                      <p className="text-gray-300 text-base">
                        <span className="font-medium text-sm">
                          Amount to send:
                        </span>{" "}
                        ₦{parseFloat(amount).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div>
                    2. Use this reference in the transfer narration/remark:{" "}
                    <div className="flex flex-wrap items-center gap-2 bg-gray-800 p-2 rounded-md">
                      <code className="font-mono bg-gray-900 px-3 py-2 rounded flex-1">
                        bank{uniqueRequestId}
                      </code>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(
                            `bank${uniqueRequestId}`
                          );
                          toast.success("Reference copied!");
                        }}
                        className="bg-blue-600 cursor-pointer w-full md:w-fit hover:bg-blue-700 text-white px-3 py-2 rounded"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                  <p>
                    3. Click "Confirm Transfer" after completing the transfer
                  </p>
                  <p className="text-yellow-400 text-xs md:text-sm">
                    Note: <br /> 1. Transfers without the correct reference may
                    be delayed. <br /> 2. Incorrect amount will not get
                    approved.
                  </p>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={
                isFunding ||
                !amount ||
                (activeTab === "instant"
                  ? parseFloat(amount) < 100
                  : parseFloat(amount) < 500)
              }
              className={`w-full py-3 rounded-md transition-colors font-medium ${
                isFunding ||
                !amount ||
                (activeTab === "instant"
                  ? parseFloat(amount) < 100
                  : parseFloat(amount) < 500)
                  ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
              }`}
            >
              {isFunding
                ? "Processing..."
                : activeTab === "instant"
                ? "Pay with Paystack"
                : "Confirm Transfer"}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
