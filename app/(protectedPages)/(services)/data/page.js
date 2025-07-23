"use client";
import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useGlobalContext } from "@/context/GlobalContext";
import { FaWifi, FaChevronDown } from "react-icons/fa";
import Image from "next/image";
import { toast } from "react-toastify";

import { billzpaddi } from "@/app/api/client/client";
import Link from "next/link";
import { useGlobalContextData } from "@/context/GlobalContextData";
import CountUpTimer from "@/components/count/countUpTimer";
import { motion, AnimatePresence } from "framer-motion";
import { set } from "zod";
import { useTransactionToast } from "@/context/TransactionToastContext";
import { FiX, FiCheckCircle, FiClock, FiAlertCircle } from "react-icons/fi";
import { usePin } from "@/context/PinContext";
import { callApi } from "@/utils/apiClient";

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
        <div className="absolute z-10 mt-1 w-full bg-gray-800 border border-gray-700 rounded-lg shadow-lg max-h-60 overflow-auto custom-scrollbar">
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
  hasDiscount,
  hasFridayDiscount,
  setHasDiscount,
  setHasFridayDiscount,
}) => {
  const { user, fetchData } = useGlobalContext();
  const {
    wallet,
    fetchWallet,
    getUniqueRequestId,
    uniqueRequestId,
    fetchTransactions,
  } = useGlobalContextData();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const transactionToast = useTransactionToast();
    const { showPinDialog } = usePin();

  useEffect(() => {
    if (open && user) {
      fetchWallet();
      setError("");
    }
  }, [open, user]);

  useEffect(() => {
    fetchWallet();
    getUniqueRequestId();
  }, []);

  const applyDiscount = !hasDiscount || hasFridayDiscount;

  const discountRates = {
    "mtn-data": 0.012, // 1.2%
    "glo-data": 0.014, // 1.4%
    "airtel-data": 0.013, // 1.3%
    "etisalat-data": 0.014, // 1.4%
  };

  const totalAmount = selectedPlan
    ? (() => {
        const amount = Number(selectedPlan.variation_amount);

        if (applyDiscount) {
          // Apply 2% discount across all
          return Math.round(amount * 0.98);
        } else {
          // Use selectedISP rate or fallback to 1%
          const rate = discountRates[selectedISP?.serviceID] || 0.01;
          const discount = Math.min(amount * rate, 300);
          return Math.round(amount - discount);
        }
      })()
    : 0;

  const handlePurchase = async () => {
    if (isNaN(totalAmount) || isNaN(phoneNumber)) {
      toast.error("Invalid input format");
      return;
    }

    if (!selectedPlan || !phoneNumber || !selectedISP || !uniqueRequestId) {
      toast.error("Missing required information for purchase");
      return;
    }

    if (!selectedPlan?.variation_code) {
      toast.error("Poor internet connection, please refresh page");
      return;
    }

    if (wallet?.balance < totalAmount) {
      toast.error("Insufficient funds");
      return;
    }

    const isPinValid = await showPinDialog();
    if (!isPinValid) {
      return;
    }

    setIsProcessing(true);

    try {
      // 1. First create a pending transaction record
      const { error: createError } = await billzpaddi
        .from("transactions")
        .insert({
          user_id: user?.user_id,
          email: user?.email,
          amount: totalAmount,
          type: "debit",
          description: `Data Purchase (${selectedISP.name})`,
          status: "pending",
          reference: uniqueRequestId,
          metadata: {
            plan: selectedPlan.name,
            phone: phoneNumber,
            isp: selectedISP.name,
          },
        });

      if (createError) throw new Error("Failed to record transaction");

      // 2. Deduct from wallet immediately (for pending transaction)
      await callApi("wallet/update", "PUT", {
        user_id: user?.user_id,
        newBalance: wallet?.balance - totalAmount,
      });

      const { token } = await fetch("/api/wrapper/auth-check").then((res) =>
        res.json()
      );

      // 3. Process payment with wrapper
      const res = await fetch("/api/wrapper/pay", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": token,
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_BILLZ_AUTH_KEY}`,
        },
        credentials: "include",
        body: JSON.stringify({
          serviceID: selectedISP.serviceID,
          variation_code: selectedPlan.variation_code,
          billersCode: phoneNumber,
          request_id: uniqueRequestId,
          phone: phoneNumber,
          amount: selectedPlan.variation_amount,
        }),
      });

      const data = await res.json();

      if (data.code === "000" && !hasDiscount) {
        // update discount
        await billzpaddi
          .from("users")
          .update({ has_claimed_data_discount: true })
          .eq("user_id", user?.user_id);

        setHasDiscount(true);
      }

      if (data.code === "000" && hasFridayDiscount) {
        // update discount
        await billzpaddi
          .from("users")
          .update({ friday_data_discount: false })
          .eq("user_id", user?.user_id);

        setHasFridayDiscount(false);
      }

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

        case "016": // Failed
        case "030": // Unreachable
        default:
          transactionStatus = "failed";
          // Refund if failed
           await callApi("wallet/update", "PUT", {
             user_id: user?.user_id,
             newBalance: wallet?.balance,
           });
          break;
      }

      // Update transaction record
      await billzpaddi
        .from("transactions")
        .update({
          status: transactionStatus,
          metadata: {
            ...data, // Store full API response
            updated_at: new Date().toISOString(),
            plan: selectedPlan.name,
          },
        })
        .eq("reference", uniqueRequestId);

      // Show appropriate toast
      transactionToast.show({
        status: toastType,
        message: toastMessage || getDefaultMessage(transactionStatus),
        uniqueRequestId,
      });

      if (transactionStatus === "completed") {
        onSuccess();
        onOpenChange(false);
      }
    } catch (err) {
      console.error("Purchase error:", err);
      transactionToast.show({
        status: "error",
        message: `You were not debited for this transaction`,
        uniqueRequestId,
      });

      // Attempt to refund if error occurred after deduction
      try {
        await callApi("wallet/update", "PUT", {
          user_id: user?.user_id,
          newBalance: wallet?.balance,
        });

        // Update transaction status
        await billzpaddi
          .from("transactions")
          .update({
            status: "refunded",
          })
          .eq("reference", uniqueRequestId);
      } catch (refundError) {
        console.error("Refund error:", refundError);
      }
    } finally {
      fetchWallet();
      fetchTransactions();
      getUniqueRequestId();
      setIsProcessing(false);
    }
  };

  // Helper function
  function getDefaultMessage(status) {
    const messages = {
      completed: "Data purchase successful!",
      pending: "Transaction is still processing...",
      failed: "Transaction failed. Funds refunded.",
    };
    return messages[status] || "Transaction processed";
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className="bg-gray-800 rounded-lg border border-gray-700 w-full max-w-md"
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white">Confirm Purchase</h2>
            {/* Close button */}
            <button
              onClick={() => onOpenChange(false)}
              className="cursor-pointer text-gray-100 hover:text-gray-200 transition-colors"
              aria-label="Close modal"
            >
              <FiX className="w-7 h-7" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-400">Network:</span>
              <span className="text-white">{selectedISP?.name}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-400">Phone:</span>
              <span className="text-white">{phoneNumber}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-400">Bundle:</span>
              <span className="text-white text-sm">{selectedPlan?.name}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-400">Amount:</span>
              <span className="text-white text-lg">
                ₦{totalAmount.toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between bg-gray-700 p-3 rounded-md space-y-1">
              <span className="text-gray-400">Wallet Balance:</span>
              <span
                className={`${
                  wallet?.balance >= totalAmount
                    ? "text-green-500"
                    : "text-red-500"
                }`}
              >
                ₦{wallet?.balance.toLocaleString()}
              </span>
            </div>
            {wallet?.balance < totalAmount && (
              <Link
                href="/wallet"
                className="flex justify-end bg-green-700 w-fit ml-auto px-2 py-1 rounded-sm text-sm"
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
              className="px-4 py-2 bg-gray-600 cursor-pointer text-white rounded-md hover:bg-gray-500 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handlePurchase}
              disabled={isProcessing || wallet?.balance < totalAmount}
              className={`px-7 py-2 rounded-md text-white ${
                wallet?.balance >= totalAmount
                  ? "bg-green-600 hover:bg-green-700 cursor-pointer "
                  : "bg-gray-700 cursor-not-allowed"
              } disabled:opacity-80`}
            >
              {isProcessing ? (
                <>
                  Processing...
                  <CountUpTimer end={100} />
                </>
              ) : (
                "Pay Now"
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default function Page() {
  const { user, isLoading } = useGlobalContext();
  const { wallet, fetchWallet } = useGlobalContextData();
  const [selectedISP, setSelectedISP] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [isps, setIsps] = useState([]);
  const [activeTab, setActiveTab] = useState("Daily");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [hasDiscount, setHasDiscount] = useState(null);
  const [hasFridayDiscount, setHasFridayDiscount] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [phone, setPhone] = useState("");
  const dropdownRef = useRef(null);
  const [openTooltipId, setOpenTooltipId] = useState(null);
  const tooltipRef = useRef(null);

  const tabOrder = [
    "Daily",
    "Weekly",
    "Special",
    "Monthly",
    "Mega",
    "Social",
    "TV",
    "Campus",
    "2-Weeks",
    "SME",
    "MiFi",
    "Others",
  ];

  useEffect(() => {
    setActiveTab("Daily");
  }, [selectedISP]);

  useEffect(() => {
    fetchWallet();
  }, []);

  // Close tooltip when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target)) {
        setOpenTooltipId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleTooltip = (id, e) => {
    e.stopPropagation();
    setOpenTooltipId(openTooltipId === id ? null : id);
  };

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

  useEffect(() => {
    const fetchDiscount = async () => {
      if (!user) return;

      const { data, error } = await billzpaddi
        .from("users")
        .select("has_claimed_data_discount, friday_data_discount")
        .eq("user_id", user?.user_id)
        .single();

      if (error) {
        console.error("Error fetching discount status:", error);
      } else {
        setHasDiscount(data?.has_claimed_data_discount);
        setHasFridayDiscount(data?.friday_data_discount);
      }
    };

    fetchDiscount();
  }, [user]);

  const applyDiscount = !hasDiscount || hasFridayDiscount;

  const addGain = (baseAmount) => {
    const amount = Number(baseAmount);

    if (applyDiscount) {
      // Flat 2% discount
      return Math.round(amount * 0.98);
    } else {
      // Define discount rates per ISP
      const discountRates = {
        "mtn-data": 0.012, // 1.2%
        "glo-data": 0.014, // 1.4%
        "airtel-data": 0.013, // 1.3%
        "etisalat-data": 0.014, // 1.4%
      };

      // Use 1% as default if not found
      const rate = discountRates[selectedISP?.serviceID] || 0.01;

      // Apply discount with ₦150 cap
      const discount = Math.min(amount * rate, 300);
      return Math.round(amount - discount);
    }
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
        "0706",
        "0704",
        "07025",
        "07026",
      ],
      "glo-data": [
        "0805",
        "0807",
        "0811",
        "0815",
        "0905",
        "0705",
        "0915",
        "08055",
        "08155",
      ],
      "airtel-data": [
        "0802",
        "0808",
        "0812",
        "0701",
        "0708",
        "0902",
        "0901",
        "0907",
        "08028",
        "08121",
        "07026",
      ],
      "etisalat-data": [
        // Formerly Etisalat
        "0809",
        "0817",
        "0818",
        "0908",
        "0909",
        "08097",
        "08187",
      ],
    };

    for (const [serviceID, prefixes] of Object.entries(mapping)) {
      if (prefixes.includes(cleaned)) {
        return serviceID;
      }
    }
    return null;
  };

  // 1. When user object changes, update phone state
  useEffect(() => {
    if (user?.phone) {
      setPhone(user.phone);
    }
  }, [user]);

  // 2. When phone input changes, detect ISP
  useEffect(() => {
    const defaultISP = isps.find((i) => i.serviceID === "airtel-data");
    if (defaultISP) {
      setSelectedISP(defaultISP);
    }
    if (phone?.length >= 4 && isps.length > 0) {
      const detectedISP = detectISPFromPhone(phone);

      if (detectedISP) {
        const isp = isps.find((i) => i.serviceID === detectedISP);
        if (isp) {
          setSelectedISP(isp);
        }
      }
    }
  }, [phone, isps]);

  const cleanPlanName = (name) => {
    if (!name) return "";

    // Remove price references (Naira, amounts)
    let cleaned = name.replace(/\d{1,3}(?:,\d{3})*\.?\d*\s*Naira/gi, "");

    // Remove hyphens and trim whitespace
    cleaned = cleaned.replace(/-/g, " ").trim();

    // Remove anything in parentheses that contains numbers
    cleaned = cleaned.replace(/\(.*?\d+.*?\)/g, "");

    // Remove duplicate whitespace
    cleaned = cleaned.replace(/\s+/g, " ");

    // Remove trailing/leading special characters
    cleaned = cleaned.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, "");

    // Capitalize first letter of each word (optional)
    cleaned = cleaned.replace(/\b\w/g, (char) => char.toUpperCase());

    return cleaned || name; // Fallback to original if empty
  };

  const categorizedPlans = (variations) => {
    const groups = {
      Daily: [],
      Weekly: [],
      Monthly: [],
      Mega: [],
      Social: [],
      Special: [],
      TV: [],
      Campus: [],
      "2-Weeks": [],
      SME: [],
      MiFi: [],
      Others: [],
    };

    variations.forEach((plan) => {
      const cleanName = cleanPlanName(plan.name).toLowerCase();
      const variationCode = plan.variation_code.toLowerCase();

      // General categorization
      if (cleanName.includes("sme") || variationCode.includes("sme")) {
        groups.SME.push(plan);
      } else if (
        cleanName.includes("social") ||
        variationCode.includes("social")
      ) {
        groups.Social.push(plan);
      } else if (
        cleanName.includes("special") ||
        variationCode.includes("special")
      ) {
        groups.Special.push(plan);
      } else if (
        cleanName.includes("campus") ||
        variationCode.includes("campus")
      ) {
        groups.Campus.push(plan);
      } else if (
        cleanName.includes("mifi") ||
        variationCode.includes("mifi") ||
        cleanName.includes("router")
      ) {
        groups.MiFi.push(plan);
      } else if (cleanName.includes("tv") || variationCode.includes("tv")) {
        groups.TV.push(plan);
      } else if (cleanName.includes("mega") || variationCode.includes("mega")) {
        groups.Mega.push(plan);
      }
      // Duration-based categorization
      else if (
        cleanName.includes("1day") ||
        cleanName.includes("1 day") ||
        cleanName.includes("24hr") ||
        cleanName.includes("24 hr") ||
        /(^|\s)n50($|\s)/.test(cleanName) ||
        /(^|\s)n100($|\s)/.test(cleanName) ||
        /(^|\s)n75($|\s)/.test(cleanName) ||
        /(^|\s)n200($|\s)/.test(cleanName)
      ) {
        groups.Daily.push(plan);
      } else if (
        cleanName.includes("2day") ||
        cleanName.includes("2 day") ||
        cleanName.includes("3day") ||
        cleanName.includes("daily") ||
        cleanName.includes("weekend") ||
        cleanName.includes("3 day")
      ) {
        groups.Daily.push(plan);
      } else if (
        cleanName.includes("7day") ||
        cleanName.includes("7 day") ||
        cleanName.includes("week") ||
        cleanName.includes("7days")
      ) {
        groups.Weekly.push(plan);
      } else if (
        cleanName.includes("14day") ||
        cleanName.includes("14 day") ||
        cleanName.includes("2week") ||
        cleanName.includes("2 week")
      ) {
        groups["2-Weeks"].push(plan);
      } else if (
        cleanName.includes("30day") ||
        cleanName.includes("30 day") ||
        cleanName.includes("month") ||
        cleanName.includes("30days")
      ) {
        groups.Monthly.push(plan);
      } else if (
        cleanName.includes("90day") ||
        cleanName.includes("120day") ||
        cleanName.includes("365day") ||
        cleanName.includes("90 day") ||
        cleanName.includes("oneoff") ||
        cleanName.includes("120 day") ||
        cleanName.includes("365 day")
      ) {
        groups.Monthly.push(plan);
      } else {
        groups.Others.push(plan);
      }
    });

    // Sort each category by price (ascending)
    Object.keys(groups).forEach((category) => {
      groups[category].sort(
        (a, b) =>
          parseFloat(a.variation_amount) - parseFloat(b.variation_amount)
      );
    });

    // Remove empty categories
    Object.keys(groups).forEach((category) => {
      if (groups[category].length === 0) {
        delete groups[category];
      }
    });

    return groups;
  };

  useEffect(() => {
    const fetchISPs = async () => {
      try {
        const res = await axios.get(
          "https://vtpass.com/api/services?identifier=data",
          {
            headers: {
              "api-key": process.env.NEXT_PUBLIC_BILLZ_API_KEY,
              "public-key": process.env.NEXT_PUBLIC_BILLZ_PUBLIC_KEY,
            },
          }
        );
        const dataISPs = res.data.content || [];
        const filteredISPs = dataISPs.filter(
          (isp) => isp.serviceID !== "spectranet"
        );
        setIsps(filteredISPs);
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
          `https://vtpass.com/api/service-variations?serviceID=${selectedISP.serviceID}`,
          {
            headers: {
              "api-key": process.env.NEXT_PUBLIC_BILLZ_API_KEY,
              "public-key": process.env.NEXT_PUBLIC_BILLZ_PUBLIC_KEY,
            },
          }
        );

        const variations = res.data.content.variations || [];

        const cleaned = variations.map((v) => ({
          ...v,
          name: cleanPlanName(v.name),
        }));

        setPlans(categorizedPlans(cleaned));
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
    if (!phone) {
      toast.error("Please enter a phone number");
      return;
    }
    setSelectedPlan(plan);
    fetchWallet();
    setShowDialog(true);
  };

  // Define discount rates per ISP
  const discountRates = {
    "mtn-data": 0.012, // 1.2%
    "glo-data": 0.014, // 1.4%
    "airtel-data": 0.013, // 1.3%
    "etisalat-data": 0.014, // 1.4%
  };

  // Use 1% as default if not found
  const rate = discountRates[selectedISP?.serviceID] || 0.01;

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
          className="w-full md:w-1/2 px-4 py-3 rounded-lg tracking-widest outline-none bg-gray-800 text-white border border-gray-600"
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
          {/* Tabs Container */}
          <div className="mb-6">
            {/* Scrollable Tabs - Only show tabs that have plans */}
            <div className="flex space-x-2 pb-2 overflow-x-auto custom-scrollbar">
              {tabOrder
                .filter((category) => plans[category]?.length > 0) // Only show tabs with plans
                .map((category) => (
                  <button
                    key={category}
                    onClick={() => setActiveTab(category)}
                    className={`flex-shrink-0 px-3 py-1 text-sm rounded-full border cursor-pointer transition whitespace-nowrap ${
                      activeTab === category
                        ? "bg-blue-500 text-white border-blue-500"
                        : "bg-gray-800 text-white border-gray-700 hover:bg-gray-700"
                    }`}
                  >
                    {category}
                  </button>
                ))}
            </div>
          </div>

          {/* Plans for active tab */}
          {plans[activeTab]?.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 overflow-y-auto">
              {plans[activeTab].map((plan, index) => (
                <div
                  key={`${selectedISP?.serviceID}-${plan?.variation_code}-${index}`}
                  onClick={() => handlePlanClick(plan)}
                  className="bg-gray-800 p-3 rounded-md border cursor-pointer border-gray-700 hover:border-blue-400 transition-all text-sm md:text-base"
                >
                  <div className="flex justify-between items-center mb-2 w-full">
                    <h3 className="text-blue-300 font-bold text-base md:text-lg">
                      {plan.name.match(/\d+(?:\.\d+)?\s?(?:MB|GB)/)?.[0] || ""}
                    </h3>
                    <FaWifi className="text-blue-400 text-lg inline-block mb-1" />
                  </div>

                  <h3 className="text-white tracking-wider font-semibold text-sm md:text-base">
                    <span className="text-gray-300 text-xs md:text-sm">
                      {plan.name.replace(/\d+(?:\.\d+)?\s?(?:MB|GB)/, "")}
                    </span>
                  </h3>

                  <p className="text-blue-200 mt-1">
                    ₦{addGain(plan?.variation_amount).toLocaleString()}
                  </p>
                  <p className="mt-1">
                    {!hasDiscount || hasFridayDiscount ? (
                      <span className="inline-flex items-center bg-green-50 text-green-700 text-xs font-medium px-2.5 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></span>
                        2% discount
                      </span>
                    ) : (
                      <span className="inline-flex items-center bg-blue-50 text-blue-700 text-xs font-medium px-2.5 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-1.5"></span>
                        {(rate * 100).toFixed(1)}% discount
                        {Number(plan?.variation_amount || 0) * rate > 300 && (
                          <span className="relative ml-1.5" ref={tooltipRef}>
                            <span
                              onClick={(e) =>
                                toggleTooltip(plan.variation_code, e)
                              }
                              className="flex items-center justify-center w-4 h-4 rounded-full bg-blue-200 text-blue-700 cursor-pointer select-none"
                            >
                              i
                            </span>

                            <span
                              id={`tooltip-${plan.variation_code}`}
                              className={`absolute z-50 w-20 p-2 text-xs text-gray-700 bg-white border border-gray-200 rounded-md shadow-md
                              left-1/2 -translate-x-1/2
                              bottom-5 mb-2
                               sm:mt-2
                              ${
                                openTooltipId === plan.variation_code
                                  ? "block"
                                  : "hidden"
                              }`}
                            >
                              Discount capped at ₦300.
                              <span className="absolute w-3 h-3 bg-white border-b border-r border-gray-200 rotate-45 -bottom-1.5 left-1/2 -translate-x-1/2"></span>
                            </span>
                          </span>
                        )}
                      </span>
                    )}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-300 text-center pt-4">
              Check "Others" for all plans
            </p>
          )}
        </>
      )}

      <PurchaseDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        selectedPlan={selectedPlan}
        selectedISP={selectedISP}
        hasDiscount={hasDiscount}
        hasFridayDiscount={hasFridayDiscount}
        setHasFridayDiscount={setHasFridayDiscount}
        setHasDiscount={setHasDiscount}
        phoneNumber={phone || user?.phone}
        onSuccess={() => {
          setSelectedPlan(null);
          setShowDialog(false);
        }}
      />
    </section>
  );
}
