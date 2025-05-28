"use client";
import { useEffect, useState, useRef } from "react";
import { useGlobalContext } from "@/context/GlobalContext";
import { FaTv, FaChevronDown, FaSync, FaExchangeAlt } from "react-icons/fa";
import Image from "next/image";
import { useGlobalContextData } from "@/context/GlobalContextData";
import { toast } from "react-toastify";
import { billzpaddi } from "@/lib/client";
import Link from "next/link";

const CustomDropdown = ({
  options,
  selected,
  setSelected,
  isOpen,
  setIsOpen,
  dropdownRef,
}) => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredOptions = options.filter((service) =>
    service.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 outline-none"
      >
        <div className="flex items-center gap-2">
          {/**
          {selected?.image && (
            <Image
              src={selected.image}
              alt={selected.name}
              width={24}
              height={24}
              className="rounded-full"
            />
          )} */}
          <span>{selected ? selected.name : "Select TV Provider"}</span>
        </div>
        <FaChevronDown
          className={`transition-transform ${
            isOpen ? "transform rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-gray-800 border border-gray-700 rounded-lg shadow-lg max-h-60 overflow-auto">
          <div className="sticky top-0 p-2 bg-gray-800">
            <input
              type="text"
              placeholder="Search TV provider..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded-md outline-none"
            />
          </div>

          {filteredOptions.length > 0 ? (
            filteredOptions.map((service) => (
              <div
                key={service.serviceID}
                onClick={() => {
                  setSelected(service);
                  setIsOpen(false);
                  setSearchQuery("");
                }}
                className={`px-4 py-2 hover:bg-gray-700 cursor-pointer flex items-center gap-2 ${
                  selected?.serviceID === service.serviceID
                    ? "bg-blue-900/20"
                    : ""
                }`}
              >
                {/** 
                {service.image && (
                  <Image
                    src={service.image}
                    alt={service.name}
                    width={20}
                    height={20}
                    className="rounded-full"
                  />
                )}*/}
                <span>{service.name}</span>
              </div>
            ))
          ) : (
            <div className="px-4 py-2 text-gray-400">No results found</div>
          )}
        </div>
      )}
    </div>
  );
};

const PurchaseDialog = ({
  open,
  onOpenChange,
  selectedPlan,
  selectedService,
  smartCardNumber,
  phoneNumber,
  onSuccess,
  verificationData,
}) => {
  const { user } = useGlobalContext();
  const {
    wallet,
    fetchWallet,
    getUniqueRequestId,
    uniqueRequestId,
    fetchTransactions,
  } = useGlobalContextData();
  const [walletBalance, setWalletBalance] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");

  // For DSTV/GOtv renewal, use the verified amount if available
  const isRenewal = selectedPlan?.name.includes("Renew");
  const amount =
    isRenewal && verificationData?.Renewal_Amount
      ? verificationData.Renewal_Amount
      : selectedPlan?.variation_amount;

  const totalAmount = amount ? Math.round(Number(amount) * 1.0) : 0;

  useEffect(() => {
    const fetchWalletBalance = async () => {
      try {
        const { data: walletData, error: fetchError } = await billzpaddi
          .from("wallets")
          .select("balance")
          .eq("user_id", user.user_id)
          .single();

        if (fetchError || !walletData) {
          throw new Error("Failed to fetch wallet balance");
        }

        setWalletBalance(walletData?.balance);
      } catch (err) {
        console.error("Failed to fetch wallet balance:", err);
        toast.error("Failed to load wallet balance");
      }
    };

    if (open && user) {
      fetchWalletBalance();
      setError("");
    }
  }, [open, user]);

  useEffect(() => {
    getUniqueRequestId();
  }, []);

  const handlePurchase = async () => {
    if (
      !selectedPlan ||
      !smartCardNumber ||
      !selectedService ||
      !uniqueRequestId
    ) {
      setError("Missing required information for purchase");
      return;
    }

    if (walletBalance < totalAmount) {
      setError("Insufficient funds");
      return;
    }

    setIsProcessing(true);

    try {
      // 1. Create pending transaction
      const { error: createError } = await billzpaddi
        .from("transactions")
        .insert({
          user_id: user?.user_id,
          amount: totalAmount,
          type: "debit",
          description: `TV Subscription (${selectedService.name})`,
          status: "pending",
          reference: uniqueRequestId,
          metadata: {
            plan: selectedPlan.name,
            smart_card: smartCardNumber,
            provider: selectedService.name,
          },
        });

      if (createError) throw new Error("Failed to record transaction");

      // 2. Deduct from wallet
      const { error: updateError } = await billzpaddi
        .from("wallets")
        .update({ balance: walletBalance - totalAmount })
        .eq("user_id", user?.user_id);

      if (updateError) throw new Error("Failed to update wallet balance");

      // 3. Make VTpass purchase
      const payload = {
        serviceID: selectedService.serviceID,
        billersCode: smartCardNumber,
        request_id: uniqueRequestId,
        variation_code: selectedPlan.variation_code,
        phone: phoneNumber,
        amount: amount,
      };

      console.log("VTpass payload:", payload);

      // Add subscription_type for DSTV/GOtv
      if (["dstv", "gotv"].includes(selectedService.serviceID.toLowerCase())) {
        payload.subscription_type = isRenewal ? "renew" : "change";
      }

      const res = await fetch("/api/vtpass/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      // 4. Update transaction based on response
      let transactionStatus = "failed";
      let toastMessage = data.response_description;
      let toastType = "error";

      switch (data.code) {
        case "000": // Success
          transactionStatus = "completed";
          toastType = "success";
          break;
        case "099": // Pending
          transactionStatus = "pending";
          toastType = "warning";
          break;
        default:
          transactionStatus = "failed";
          // Refund if failed
          await billzpaddi
            .from("wallets")
            .update({ balance: walletBalance })
            .eq("user_id", user?.user_id);
          break;
      }

      // Update transaction record
      await billzpaddi
        .from("transactions")
        .update({
          status: transactionStatus,
          metadata: {
            ...data,
            updated_at: new Date().toISOString(),
          },
        })
        .eq("reference", uniqueRequestId);

      toast[toastType](toastMessage || getDefaultMessage(transactionStatus), {
        autoClose: false,
      });

      if (transactionStatus === "completed") {
        onSuccess();
        onOpenChange(false);
      }
    } catch (err) {
      console.error("Purchase error:", err);
      toast.error(err.message || "Purchase failed. Please try again.");

      // Refund wallet if error occurs
      await billzpaddi
        .from("wallets")
        .update({ balance: walletBalance })
        .eq("user_id", user?.user_id);
    } finally {
      fetchWallet();
      fetchTransactions();
      getUniqueRequestId();
      setIsProcessing(false);
    }
  };

  function getDefaultMessage(status) {
    const messages = {
      completed: "TV subscription successful!",
      pending: "Transaction pending...",
      failed: "Transaction failed. Funds refunded.",
    };
    return messages[status] || "Transaction processed";
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg border border-gray-700 w-full max-w-md">
        <div className="p-6">
          <h2 className="text-xl font-bold text-white mb-4">
            Confirm TV Subscription
          </h2>

          <div className="space-y-4">
            {verificationData?.Customer_Name && (
              <div className="flex justify-between">
                <span className="text-gray-400">Customer:</span>
                <span className="text-white">
                  {verificationData.Customer_Name}
                </span>
              </div>
            )}
            {verificationData?.Current_Bouquet && (
              <div className="flex justify-between">
                <span className="text-gray-400">Current Bouquet:</span>
                <span className="text-white">
                  {verificationData.Current_Bouquet}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-400">Provider:</span>
              <span className="text-white">{selectedService?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Smart Card:</span>
              <span className="text-white">{smartCardNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Phone:</span>
              <span className="text-white">{phoneNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Package:</span>
              <span className="text-white">{selectedPlan?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Amount:</span>
              <span className="text-white">
                ₦{totalAmount.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Balance:</span>
              <span
                className={
                  wallet?.balance >= totalAmount
                    ? "text-green-500"
                    : "text-red-500"
                }
              >
                ₦{wallet?.balance.toLocaleString()}
              </span>
            </div>
            {wallet?.balance < totalAmount && (
              <Link
                href="/wallet"
                className="flex justify-end bg-gray-700 w-fit ml-auto px-2 py-1 rounded-sm text-sm"
              >
                Top Up
              </Link>
            )}
          </div>

          {error && <div className="mt-4 text-red-500 text-sm">{error}</div>}

          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={() => onOpenChange(false)}
              disabled={isProcessing}
              className="px-4 py-2 bg-gray-700 cursor-pointer text-white rounded-md hover:bg-gray-600 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handlePurchase}
              disabled={isProcessing || wallet?.balance < totalAmount}
              className={`px-7 py-2 rounded-md cursor-pointer text-white ${
                wallet?.balance >= totalAmount
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-gray-600 cursor-not-allowed"
              } disabled:opacity-50`}
            >
              {isProcessing ? (
                "Processing..."
              ) : (
                <>{isRenewal ? "Renew" : "Subscribe"}</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function TvSubscriptionPage() {
  const { user, isLoading } = useGlobalContext();
  const { fetchWallet } = useGlobalContextData();
  const [selectedService, setSelectedService] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [tvServices, setTvServices] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [smartCardNumber, setSmartCardNumber] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationData, setVerificationData] = useState(null);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Set user's phone number if available
  useEffect(() => {
    if (user?.phone) {
      setPhoneNumber(user.phone);
    }
  }, [user]);

  // Fetch TV services
  useEffect(() => {
    const fetchTvServices = async () => {
      try {
        const res = await fetch(
          "https://vtpass.com/api/services?identifier=tv-subscription"
        );
        const data = await res.json();
        const filteredServices = (data.content || []).filter(
          (service) => service.serviceID.toLowerCase() !== "showmax"
        );
        setTvServices(filteredServices);
      } catch (err) {
        console.error("Error fetching TV services:", err);
        toast.error("Failed to load TV services");
      }
    };
    fetchTvServices();
  }, []);

  // Fetch plans when service is selected
  const fetchPlans = async (serviceID) => {
    if (!serviceID) return;
    try {
      setLoadingPlans(true);
      const res = await fetch(
        `https://vtpass.com/api/service-variations?serviceID=${serviceID}`
      );
      const data = await res.json();
      setPlans(data.content?.variations || []);
    } catch (err) {
      console.error("Error fetching TV plans:", err);
      toast.error("Failed to load TV packages");
    } finally {
      setLoadingPlans(false);
    }
  };

  useEffect(() => {
    if (selectedService?.serviceID) {
      fetchPlans(selectedService.serviceID);
    }
  }, [selectedService]);

  // Verify smart card before showing purchase dialog for DSTV/GOtv
  const verifyAndPurchase = async (plan) => {
    if (!smartCardNumber) {
      toast.error("Please enter your smart card number");
      return;
    }

    setSelectedPlan(plan);

    // For DSTV/GOtv, verify first
    if (
      ["dstv", "gotv", "startimes"].includes(
        selectedService.serviceID.toLowerCase()
      )
    ) {
      const toastVerify = toast.loading("Verifying smart card...");

      try {
        const res = await fetch("/api/vtpass/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            serviceID: selectedService.serviceID,
            billersCode: smartCardNumber,
          }),
        });

        const data = await res.json();
        if (data.code === "000" && !data.content.error) {
          setVerificationData(data.content);
          fetchWallet();
          setShowDialog(true);
        } else {
          toast.error(data.content.error || "Verification failed");
        }
      } catch (err) {
        console.error("Verification error:", err);
        toast.error(err || "Failed to verify smart card");
      } finally {
        toast.dismiss(toastVerify);
      }
    } else {
      // For other providers, proceed directly to purchase
      setVerificationData(null);
      fetchWallet();
      setShowDialog(true);
    }
  };

  const cleanPlanName = (name) => {
    return name
      .replace(/\s*-\s*[\d,]+(?:\.\d+)?\s*Naira/i, "")
      .replace(/\s*N\d+(?:,\d{3})*(?:\.\d+)?\s*/i, "")
      .trim();
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
    <section className="p-4 max-w-6xl mx-auto">
      <h1 className="text-2xl md:text-3xl font-bold mb-6 uppercase">
        TV Subscription
      </h1>

      <div className="flex flex-col md:flex-row items-center gap-4 mb-8">
        <div className="relative w-full md:w-1/2">
          <CustomDropdown
            options={tvServices}
            selected={selectedService}
            setSelected={setSelectedService}
            isOpen={isDropdownOpen}
            setIsOpen={setIsDropdownOpen}
            dropdownRef={dropdownRef}
          />
        </div>
        <input
          type="text"
          placeholder="Enter smart card/decoder number"
          value={smartCardNumber}
          onChange={(e) => setSmartCardNumber(e.target.value)}
          className="w-full md:w-1/2 px-4 py-3 rounded-lg bg-gray-800 outline-none text-white border border-gray-600"
        />
      </div>

      <div className="mb-8">
        <input
          type="tel"
          placeholder="Enter phone number"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          className="w-full px-4 py-3 rounded-lg bg-gray-800 outline-none text-white border border-gray-600"
        />
      </div>

      {loadingPlans ? (
        <div className="text-center">
          <img
            src="/icons/loader-white.svg"
            alt="Loading..."
            className="w-10 h-10 mx-auto"
          />
        </div>
      ) : (
        <>
          {plans.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {plans.map((plan, index) => (
                <div
                  key={`${selectedService?.serviceID}-${plan?.variation_code}-${index}`}
                  onClick={() => verifyAndPurchase(plan)}
                  className="bg-gray-800 p-4 rounded-md border border-gray-700 hover:border-blue-400 cursor-pointer"
                >
                  <div className="flex flex-col gap-3">
                    <FaTv className="text-blue-400 text-xl" />
                    <div>
                      <h3 className="text-white text-sm md:text-base font-semibold">
                        {cleanPlanName(plan.name)}
                      </h3>
                      <p className="text-blue-300 mt-1 text-sm md:text-base">
                        ₦
                        {Math.round(
                          Number(plan.variation_amount) * 1.0
                        ).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center pt-4">
              {selectedService
                ? "No packages available"
                : "Select a TV provider"}
            </p>
          )}
        </>
      )}

      <PurchaseDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        selectedPlan={selectedPlan}
        selectedService={selectedService}
        smartCardNumber={smartCardNumber}
        phoneNumber={phoneNumber}
        onSuccess={() => {
          setSelectedPlan(null);
          setVerificationData(null);
          setShowDialog(false);
        }}
        verificationData={verificationData}
      />
    </section>
  );
}
