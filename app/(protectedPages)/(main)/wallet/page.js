"use client";
import { useGlobalContext } from "@/context/GlobalContext";
import { useState, useEffect, act } from "react";
import { HiRefresh } from "react-icons/hi";
import {
  FaMoneyBillWave,
  FaBank,
  FaPiggyBank,
  FaCopy,
  FaPaperPlane,
} from "react-icons/fa";
import { billzpaddi } from "@/lib/client";
import { toast } from "react-toastify";
import { useGlobalContextData } from "@/context/GlobalContextData";
import { TbTransfer } from "react-icons/tb";
import Link from "next/link";

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
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState("instant"); // 'instant' or 'bank'
  const [copiedRef, setCopiedRef] = useState(false);
  const [bankDetails, setBankDetails] = useState({
    accountName: "EMMANUEL CHISOM",
    accountNumber: "9153374542",
    bankName: "OPay",
  });

  const presetAmounts = [1000, 2000, 5000, 10000];
  const paystackKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;
  const squadKey = process.env.NEXT_PUBLIC_SQUAD_PUBLIC_KEY;

  useEffect(() => {
    fetchWallet();
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile(); // Initial check
    window.addEventListener("resize", checkMobile); // Update on resize

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleBankTabClick = () => {
    if (isMobile) {
      setActiveTab("bank");
    } else {
      toast.info("Bank Transfer is only available on mobile.");
    }
  };

  // Calculate amount to credit including fee Paystack
  function calculateAmountToCreditPaystack(amount) {
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

  // Calculate amount to credit including fee Squad
  function calculateAmountToCreditSquad(amount) {
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum)) {
      return 0;
    }

    // Calculate 1.5% fee
    let percentageFee = 0.012 * amountNum;

    // Cap fee at ₦1,500
    if (percentageFee > 1500) {
      percentageFee = 1500;
    }

    return amountNum + percentageFee;
  }

  const amountToCredit = parseFloat(amount); // calculateAmountToCreditPaystack(amount);

  useEffect(() => {
    getUniqueRequestId();
  }, []);

  const initializePaymentInactive = async () => {
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

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.squadco.com/widget/squad.min.js";
    script.async = true;

    script.onload = () => console.log("Squad script loaded successfully");
    script.onerror = () => console.error("Failed to load Squad script");
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const initializePayment = async () => {
    if (!window.Squad) {
      console.error("Squad script not loaded");
      return;
    }

    const squadInstance = new window.Squad({
      onClose: () => console.log("Widget closed"),
      onLoad: () => console.log("Widget loaded successfully"),
      onSuccess: async (response) => {
        await updateWalletBalance(response.transaction_ref);
      },
      key: squadKey,
      email: user?.email.trim(),
      amount: amountToCredit * 100,
      customer_name: user?.last_name + " " + user?.first_name,
      pass_charge: true,
      currency_code: "NGN",
      initiate_type: "inline",
    });

    squadInstance.setup();
    squadInstance.open();
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

    if (amountValue < 500) {
      toast.info("Minimum amount of ₦500");
      return;
    }

    if (amountValue > wallet?.limit) {
      toast.error(`Max deposit of ₦${wallet?.limit.toLocaleString()}`);
      return;
    }

    setIsFunding(true);

    // Fetch current wallet balance
    const { data: walletData, error: fetchError } = await billzpaddi
      .from("wallets")
      .select("balance")
      .eq("user_id", user?.user_id)
      .single();

    if (fetchError || !walletData) {
      toast.error("Failed to fetch wallet balance");
      setIsFunding(false);
      return;
    }

    const currentBalance = walletData?.balance + parseFloat(amount);
    if (currentBalance > wallet?.limit) {
      toast.error(`Max wallet balance of ₦${wallet?.limit.toLocaleString()}`);
      setIsFunding(false);
      return;
    }

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
      setCopiedRef(false);
    }
  };

  const handleFundWallet = async (e) => {
    e.preventDefault();

    if (activeTab === "instant") {
      //toast.info("Currently Unavailable.");
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

    if (amountValue < 500) {
      toast.error(`Minimum deposit is ₦500`);
      return;
    }

    if (amountValue > wallet?.limit) {
      toast.error(`Max deposit of ₦${wallet?.limit.toLocaleString()}`);
      return;
    }

    setIsFunding(true);

    // Fetch current wallet balance
    const { data: walletData, error: fetchError } = await billzpaddi
      .from("wallets")
      .select("balance")
      .eq("user_id", user?.user_id)
      .single();

    if (fetchError || !walletData) {
      toast.error("Failed to fetch wallet balance");

      setIsFunding(false);
      return;
    }

    const currentBalance = walletData?.balance + parseFloat(amount);
    if (currentBalance > wallet?.limit) {
      toast.error(`Max wallet balance of ₦${wallet?.limit.toLocaleString()}`);

      setIsFunding(false);
      return;
    }

    try {
      toast.info("Currently Unavailable.");
      // await initializePayment();
    } catch (error) {
      console.error("Payment error:", error);
    } finally {
      setIsFunding(false);
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
          {/* Wallet Info */}
          <Link href="/wallet/send" className="w-full md:w-fit">
            <div className="bg-gray-700 hover:bg-gray-900/80 transition-all duration-200 w-full md:w-fit rounded-md p-3 mb-6 text-sm">
              <div className="flex items-center justify-center flex-wrap gap-2 text-white">
                <FaPaperPlane className="text-white" />
                <span>Send Funds</span>
              </div>
            </div>
          </Link>
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
            {/* */}
            <button
              className={`py-2 px-4 font-medium cursor-pointer flex items-center gap-2 ${
                activeTab === "instant"
                  ? "text-blue-400 border-b-2 border-blue-400"
                  : "text-gray-400 hover:text-gray-300"
              }`}
              onClick={() => setActiveTab("instant")}
            >
              <TbTransfer className="hidden md:block" />
              Instant Deposit
            </button>
            <button
              className={`py-2 px-4 relative font-medium cursor-pointer flex items-center gap-2 transition-all duration-200 group ${
                activeTab === "bank"
                  ? "text-blue-400"
                  : "text-gray-400 hover:text-gray-300"
              }`}
              onClick={handleBankTabClick}
            >
              <FaPiggyBank className="hidden md:block" />
              <span className="relative">
                <span className="relative z-10">Bank Transfer</span>
                {/* 0 Fee badge */}
                <span className="absolute -top-4 -right-4 md:-right-5 text-xs bg-green-500 text-white px-1.5 py-0.5 rounded-full whitespace-nowrap flex items-center justify-center">
                  0 Fee
                  {/* Small triangle pointer for badge */}
                  <span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 rotate-45 bg-green-500"></span>
                </span>
              </span>
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
                      ? "(minimum ₦500)"
                      : "(minimum ₦500)"
                  }
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 pl-12 outline-none"
                  required
                  min={activeTab === "instant" ? "500" : "500"}
                  disabled={isFunding}
                />
                <span className="absolute left-3 top-3.5 text-gray-400">
                  NGN
                </span>
              </div>

              {activeTab === "instant" ? (
                <>
                  <p className="text-sm text-gray-300 mt-1">
                    Processing fee applies
                  </p>
                  <p className="text-base text-gray-300 mt-1">
                    Amount: ₦{(amountToCredit || 0).toLocaleString()}
                  </p>
                </>
              ) : (
                <p className="text-sm text-gray-200 mt-1">
                  No processing fee -{" "}
                  <span className="text-gray-400">
                    (may take up to 1 minute){" "}
                  </span>
                </p>
              )}
            </div>

            {activeTab === "bank" && (
              <div className="bg-gray-700/50 rounded-lg p-4 mb-4">
                <h3 className="font-medium text-lg text-gray-200">
                  Bank Transfer Instructions
                </h3>
                <div className="space-y-2 text-sm text-gray-200">
                  <p className="pt-5 text-gray-400">Our Bank Details:</p>
                  <div className="bg-gray-800 p-3 rounded-md space-y-2">
                    {/* Bank Name */}
                    <div className="flex justify-between items-center">
                      <p className="text-gray-400">
                        <span className="font-medium">Bank Name:</span>{" "}
                        <br className="md:hidden" />
                        <span className="text-base bg-green-800 text-white px-2">
                          {bankDetails.bankName}
                        </span>
                      </p>
                    </div>

                    {/* Account Name */}
                    <div className="flex justify-between items-center">
                      <p className="text-gray-400">
                        <span className="font-medium">Account Name:</span>{" "}
                        <br className="md:hidden" />
                        <span className="text-base bg-green-800 text-white px-2">
                          {bankDetails.accountName}
                        </span>
                      </p>
                    </div>

                    {/* Amount to send */}
                    <div className="flex justify-between items-center">
                      <p className="text-gray-400 text-base">
                        <span className="font-medium text-sm">
                          Amount to send:
                        </span>{" "}
                        <br className="md:hidden" />
                        <span className="text-base bg-green-800 text-white px-2">
                          ₦
                          {amount ? (
                            <>{parseFloat(amount).toLocaleString()} </>
                          ) : (
                            "0.00"
                          )}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div>
                    {/* Account Number */}
                    <div>
                      <p className="pt-5">
                        <span className="text-lg inline-block font-bold pb-2">
                          {" "}
                          Step 1.{" "}
                        </span>
                        <br /> Click{" "}
                        <span className="text-base bg-green-800 text-white">
                          "Copy Account Number"
                        </span>{" "}
                        to your bank app.
                      </p>
                      <div className="flex flex-wrap items-center gap-2 bg-gray-800 p-2 rounded-md">
                        <code
                          className="font-mono bg-gray-900 px-3 py-2 rounded flex-1 select-none pointer-events-none"
                          onCopy={(e) => {
                            e.preventDefault();
                            toast.error(
                              "Click the copy button to copy the account number."
                            );
                          }}
                        >
                          {bankDetails.accountNumber}
                        </code>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(
                              bankDetails.accountNumber
                            );
                            toast.success("Account number copied!");
                          }}
                          className="bg-blue-600 cursor-pointer w-full md:w-fit hover:bg-blue-700 text-white px-3 py-2 rounded"
                        >
                          Copy Account Number
                        </button>
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="pt-5">
                      <span className="text-lg inline-block font-bold pb-2">
                        {" "}
                        Step 2.{" "}
                      </span>{" "}
                      <br /> Click{" "}
                      <span className="text-base bg-green-800 text-white">
                        "Copy Reference"
                      </span>{" "}
                      and add it to transfer narration or remark.{" "}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 bg-gray-800 p-2 rounded-md">
                      <code
                        className="font-mono bg-gray-900 px-3 py-2 rounded flex-1 select-none pointer-events-none"
                        onCopy={(e) => {
                          e.preventDefault();
                          toast.error(
                            "Click the Copy Reference button to copy the reference."
                          );
                        }}
                      >
                        bank{uniqueRequestId}
                      </code>
                      <button
                        type="submit"
                        onClick={() => {
                          if (!amount) {
                            toast.info("Please enter an amount first.");
                            return;
                          }
                          navigator.clipboard.writeText(
                            `bank${uniqueRequestId}`
                          );
                          toast.success("Reference copied!");
                          setCopiedRef(true);
                        }}
                        className="bg-blue-600 cursor-pointer w-full md:w-fit hover:bg-blue-700 text-white px-3 py-2 rounded"
                      >
                        Copy Reference
                      </button>
                    </div>
                  </div>
                  {false && (
                    <p className="py-5">
                      3. Click{" "}
                      <span className="text-base bg-green-800 text-white">
                        " Confirm Transfer "
                      </span>{" "}
                      after completing the transfer.
                    </p>
                  )}
                  {false && (
                    <p className="text-yellow-400 text-xs md:text-sm">
                      Note: <br /> 1. Transfers without the correct reference
                      may be delayed. <br /> 2. Incorrect amount will be
                      refunded.
                    </p>
                  )}
                  <div className="mt-6 text-center">
                    <p className="text-gray-200 text-sm">
                      Confused or stuck? <br />{" "}
                      <Link
                        href="/faq"
                        className="text-blue-400 hover:underline"
                      >
                        FAQs
                      </Link>{" "}
                      or{" "}
                      <Link
                        href="https://wa.me/2349163366286"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-400 hover:underline"
                      >
                        WhatsApp Support
                      </Link>
                      .
                    </p>
                  </div>
                </div>
              </div>
            )}
            {activeTab === "instant" && (
              <button
                type="submit"
                disabled={
                  (!copiedRef && activeTab === "bank") ||
                  isFunding ||
                  !amount ||
                  (activeTab === "instant"
                    ? parseFloat(amount) < 100
                    : parseFloat(amount) < 500)
                }
                className={`w-full py-3 rounded-md transition-colors font-medium ${
                  (!copiedRef && activeTab === "bank") ||
                  isFunding ||
                  !amount ||
                  (activeTab === "instant"
                    ? parseFloat(amount) < 100
                    : parseFloat(amount) < 500)
                    ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-700 text-white cursor-pointer"
                }`}
              >
                {isFunding
                  ? "Processing..."
                  : activeTab === "instant"
                  ? "Fund Wallet (Instant)"
                  : "Confirm Transfer"}
              </button>
            )}
          </form>
        </div>
      </section>
    </div>
  );
}
