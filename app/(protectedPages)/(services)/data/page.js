"use client";
import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useGlobalContext } from "@/context/GlobalContext";
import { FaWifi, FaChevronDown } from "react-icons/fa";
import Image from "next/image";
import { toast } from "react-toastify";
import { billzpaddi } from "@/lib/client";
import Link from "next/link";
import { useGlobalContextData } from "@/context/GlobalContextData";

const CustomDropdown = ({
  options,
  selected,
  setSelected,
  isOpen,
  setIsOpen,
  dropdownRef,
}) => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredOptions = options.filter((isp) =>
    isp.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 outline-none"
      >
        <div className="flex items-center gap-2">
          {selected?.image && (
            <Image
              src={selected.image}
              alt={selected.name}
              width={24}
              height={24}
              className="rounded-full"
            />
          )}
          <span>{selected ? selected.name : "Select ISP"}</span>
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
              placeholder="Search ISP..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded-md outline-none"
            />
          </div>

          {filteredOptions.length > 0 ? (
            filteredOptions.map((isp) => (
              <div
                key={isp.serviceID}
                onClick={() => {
                  setSelected(isp);
                  setIsOpen(false);
                  setSearchQuery("");
                }}
                className={`px-4 py-2 hover:bg-gray-700 cursor-pointer flex items-center gap-2 ${
                  selected?.serviceID === isp.serviceID ? "bg-blue-900/20" : ""
                }`}
              >
                {isp.image && (
                  <Image
                    src={isp.image}
                    alt={isp.name}
                    width={20}
                    height={20}
                    className="rounded-full"
                  />
                )}
                <span>{isp.name}</span>
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
  selectedISP,
  phoneNumber,
  onSuccess,
}) => {
  const { user, updateUser } = useGlobalContext();
  const { wallet, fetchWallet } = useGlobalContextData();
  const [walletBalance, setWalletBalance] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");

  const totalAmount = selectedPlan
    ? Math.round(Number(selectedPlan.variation_amount) * 1.01)
    : 0;

  useEffect(() => {
    const fetchWalletBalance = async () => {
      try {
        // Fetch current wallet balance for user.user_id
        const { data: walletData, error: fetchError } = await billzpaddi
          .from("wallets")
          .select("balance")
          .eq("user_id", user.user_id)
          .single();

        if (fetchError || !walletData) {
          throw new Error("Failed to fetch wallet balance");
        }

        const currentBalance = walletData.balance;
        setWalletBalance(currentBalance);
      } catch (err) {
        console.error("Failed to fetch wallet balance:", err);
        toast.error("Failed to load wallet balance");
      }
    };

    if (open && user) {
      fetchWalletBalance();
      fetchWallet();
      setError("");
    }
  }, [open, user]);

  const handlePurchase = async () => {
    if (!selectedPlan || !phoneNumber || !selectedISP) {
      setError("Missing required information for purchase");
      return;
    }

    if (walletBalance < totalAmount) {
      setError("Insufficient funds in your wallet");
      return;
    }

    setIsProcessing(true);
    setError("");

    try {
      // 1. First deduct from wallet
      // Deduct 5 from balance and update
      const { error: updateError } = await billzpaddi
        .from("wallets")
        .update({ balance: walletBalance - totalAmount })
        .eq("user_id", user.user_id);

      if (updateError) {
        throw new Error("Failed to update wallet balance");
      }

      // 2. Then make the VTpass purchase
      const res = await fetch("/api/vtpass", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceID: selectedISP.serviceID,
          variation_code: selectedPlan.variation_code,
          billersCode: phoneNumber,
          request_id: "reference",
          phone: phoneNumber,
          amount: selectedPlan.variation_amount,
        }),
      });

      const data = await res.json();
      console.log(data);

      toast.success("Data purchase successful!");
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      console.error("Purchase failed:", err);
      const errorMessage =
        err.response?.data?.message || "Purchase failed. Please try again.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      fetchWallet();
      setIsProcessing(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg border border-gray-700 w-full max-w-md">
        <div className="p-6">
          <h2 className="text-xl font-bold text-white mb-4">
            Confirm Purchase
          </h2>

          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-400">Product:</span>
              <span className="text-white">{selectedISP?.name}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-400">Mobile Number:</span>
              <span className="text-white">{phoneNumber}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-400">Data Bundle:</span>
              <span className="text-white">{selectedPlan?.name}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-400">Amount:</span>
              <span className="text-white">
                ₦{totalAmount.toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-400">Available Balance:</span>
              <span
                className={`${
                  walletBalance >= totalAmount
                    ? "text-green-500"
                    : "text-red-500"
                }`}
              >
                ₦{wallet.balance.toLocaleString()}
              </span>
            </div>
            {walletBalance <= totalAmount && (
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
              disabled={isProcessing || walletBalance < totalAmount}
              className={`px-7 py-2 rounded-md text-white cursor-pointer ${
                walletBalance >= totalAmount
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-gray-600 cursor-not-allowed"
              } disabled:opacity-50`}
            >
              {isProcessing ? "Processing..." : "Pay Now"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function Page() {
  const { user, isLoading } = useGlobalContext();
  const [selectedISP, setSelectedISP] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [isps, setIsps] = useState([]);
  const [activeTab, setActiveTab] = useState("Special");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [phone, setPhone] = useState("");
  const dropdownRef = useRef(null);

  const tabOrder = ["Special", "Daily", "Weekly", "Monthly"];

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

  const addGain = (baseAmount) => {
    return Math.round(Number(baseAmount) * 1.01); // 1% gain
  };

  const detectISPFromPhone = (phone) => {
    const cleaned = phone.replace(/\D/g, "").slice(0, 4);
    const mapping = {
      "mtn-data": [
        "0803",
        "0806",
        "0810",
        "0813",
        "0814",
        "0816",
        "0903",
        "0906",
        "0703",
      ],
      "glo-data": ["0805", "0807", "0811", "0815", "0905", "0705"],
      "airtel-data": ["0802", "0808", "0812", "0701", "0902", "0901", "0907"],
      "etisalat-data": ["0809", "0817", "0818", "0908", "0909"],
    };

    for (const [serviceID, prefixes] of Object.entries(mapping)) {
      if (prefixes.includes(cleaned)) {
        return serviceID;
      }
    }
    return null;
  };

  useEffect(() => {
    if (user) {
      setPhone(user?.phone);
    }
  }, [user]);

  useEffect(() => {
    if (phone.length >= 4) {
      const detectedISP = detectISPFromPhone(phone);
      if (detectedISP) {
        const isp = isps.find((i) => i.serviceID === detectedISP);
        if (isp) setSelectedISP(isp);
      }
    }
  }, [phone, isps]);

  const cleanPlanName = (name) => {
    return name
      .replace(/\s*-\s*[\d,]+(?:\.\d+)?\s*Naira/i, "")
      .replace(/\s*N\d+(?:,\d{3})*(?:\.\d+)?\s*/i, "")
      .trim();
  };

  const categorizePlans = (variations) => {
    const groups = { Daily: [], Weekly: [], Monthly: [], Special: [] };
    variations.forEach((plan) => {
      const name = cleanPlanName(plan.name).toLowerCase();
      if (name.includes("24 hrs") || name.includes("1 day"))
        groups.Daily.push(plan);
      else if (name.includes("7 days") || name.includes("week"))
        groups.Weekly.push(plan);
      else if (name.includes("30 days") || name.includes("month"))
        groups.Monthly.push(plan);
      else groups.Special.push(plan);
    });
    return groups;
  };

  useEffect(() => {
    const fetchISPs = async () => {
      try {
        const res = await axios.get(
          "https://sandbox.vtpass.com/api/services?identifier=data",
          {
            headers: {
              "api-key": "a494a966debe749ecafb59b02305d4a0",
              "public-key": "PK_572ee768e2c3700b6dc9f401353846d9d6626dbad03",
            },
          }
        );
        const dataISPs = res.data.content || [];
        setIsps(dataISPs);
        setSelectedISP(dataISPs[0] || null);
      } catch (err) {
        console.error("Error fetching ISPs:", err);
        toast.error("Failed to load ISPs");
      }
    };
    fetchISPs();
  }, []);

  useEffect(() => {
    const fetchPlans = async () => {
      if (!selectedISP?.serviceID) return;
      try {
        setLoadingPlans(true);
        const res = await axios.get(
          `https://sandbox.vtpass.com/api/service-variations?serviceID=${selectedISP.serviceID}`,
          {
            headers: {
              "api-key": "a494a966debe749ecafb59b02305d4a0",
              "public-key": "PK_572ee768e2c3700b6dc9f401353846d9d6626dbad03",
            },
          }
        );
        const variations = res.data.content.variations || [];
        const cleaned = variations.map((v) => ({
          ...v,
          name: cleanPlanName(v.name),
        }));
        setPlans(categorizePlans(cleaned));
      } catch (err) {
        console.error("Error fetching data plans:", err);
        toast.error("Failed to load data plans");
      } finally {
        setLoadingPlans(false);
      }
    };
    fetchPlans();
  }, [selectedISP]);

  const handlePlanClick = (plan) => {
    if (!phone && !user?.phone) {
      toast.error("Please enter a phone number");
      return;
    }
    setSelectedPlan(plan);
    setShowDialog(true);
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
        Data Subscription
      </h1>

      {/* ISP Select + Phone Input */}
      <div className="flex flex-col md:flex-row items-center gap-4 mb-8">
        <div className="relative w-full md:w-1/2">
          <CustomDropdown
            options={isps}
            selected={selectedISP}
            setSelected={setSelectedISP}
            isOpen={isDropdownOpen}
            setIsOpen={setIsDropdownOpen}
            dropdownRef={dropdownRef}
          />
        </div>
        <input
          type="tel"
          placeholder="Enter phone number"
          value={phone || ""}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full md:w-1/2 px-4 py-3 rounded-lg bg-gray-900 text-white border border-gray-700"
        />
      </div>

      {/* Loading */}
      {loadingPlans ? (
        <div className="text-center">
          <img
            src="/icons/loader-white.svg"
            alt="Loading plans..."
            className="w-10 h-10 mx-auto"
          />
        </div>
      ) : (
        <>
          {/* Tabs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {tabOrder.map((category) => (
              <button
                key={category}
                onClick={() => setActiveTab(category)}
                className={`px-4 py-2 rounded-full border cursor-pointer transition ${
                  activeTab === category
                    ? "bg-blue-500 text-white border-blue-500"
                    : "bg-gray-800 text-white border-gray-700"
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Plans for active tab */}
          {plans[activeTab]?.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {plans[activeTab].map((plan, index) => (
                <div
                  key={`${selectedISP?.serviceID}-${plan.variation_code}-${index}`}
                  onClick={() => handlePlanClick(plan)}
                  className="bg-gray-800 p-3 rounded-md border cursor-pointer border-gray-700 hover:border-blue-400 transition-all text-sm"
                >
                  <FaWifi className="text-blue-400 text-lg mb-1" />
                  <h3 className="text-white font-semibold text-sm md:text-base">
                    {plan.name}
                  </h3>
                  <p className="text-blue-300 mt-1">
                    ₦{addGain(plan.variation_amount).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center pt-4">
              No {activeTab} plans available.
            </p>
          )}
        </>
      )}

      <PurchaseDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        selectedPlan={selectedPlan}
        selectedISP={selectedISP}
        phoneNumber={phone || user?.phone}
        onSuccess={() => {
          setSelectedPlan(null);
          setShowDialog(false);
        }}
      />
    </section>
  );
}
