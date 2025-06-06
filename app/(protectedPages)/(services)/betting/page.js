"use client";
import { useState, useEffect, useRef } from "react";
import { useGlobalContext } from "@/context/GlobalContext";
import {
  FaExchangeAlt,
  FaRobot,
  FaCoins,
  FaLock,
  FaChevronDown,
  FaSpinner,
} from "react-icons/fa";
import axios from "axios";
import { toast } from "react-toastify";
import { HiClipboardCopy, HiOutlineArrowRight } from "react-icons/hi";
import { setErrorMap } from "zod";
import { useGlobalContextData } from "@/context/GlobalContextData";
import { billzpaddi } from "@/lib/client";
import BetTopUp from "@/components/betting/topUp";
// import Select from "react-select";

const CustomDropdown = ({
  options,
  selected,
  setSelected,
  isOpen,
  setIsOpen,
  dropdownRef,
}) => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredOptions = options.filter((bookie) =>
    bookie.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full cursor-pointer bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 outline-none"
      >
        <span>{selected ? selected.name : "Select bookie"}</span>
        <FaChevronDown
          className={`transition-transform ${
            isOpen ? "transform rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-gray-800 border border-gray-700 rounded-lg shadow-lg max-h-60 overflow-auto">
          {/* Search Input */}
          <div className="p-2">
            <input
              type="text"
              placeholder="Search bookie..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 rounded-md bg-gray-700 border border-gray-600 text-white placeholder-gray-400 outline-none"
            />
          </div>

          {/* Options List */}
          {filteredOptions.length > 0 ? (
            filteredOptions.map((bookie) => (
              <div
                key={bookie.bookie}
                onClick={() => {
                  setSelected(bookie);
                  setIsOpen(false);
                  setSearchQuery(""); // Reset search
                }}
                className={`px-4 py-2 hover:bg-gray-700 cursor-pointer ${
                  selected?.bookie === bookie.bookie ? "bg-blue-900/20" : ""
                }`}
              >
                <div className="flex items-center gap-2">
                  {bookie.img && (
                    <img
                      src={bookie.img}
                      alt={bookie.brand}
                      className="w-5 h-5 rounded-full"
                    />
                  )}
                  <span>{bookie.name}</span>
                </div>
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

// Tab content components
function BetCodeConverter({
  bookingCode,
  setBookingCode,
  bookies,
  selectedBookie1,
  setSelectedBookie1,
  selectedBookie2,
  setSelectedBookie2,
  dropdownOpen1,
  setDropdownOpen1,
  dropdownOpen2,
  setDropdownOpen2,
  dropdownRef1,
  dropdownRef2,
  isConverting,
  convertCode,
  convertedCode,
  wallet,
  processingFee,
}) {
  return (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-medium mb-4">Convert Booking Code</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Booking Code
            </label>
            <input
              type="text"
              value={bookingCode}
              onChange={(e) => setBookingCode(e.target.value)}
              placeholder="Enter booking code"
              className="w-full bg-gray-700 border uppercase border-gray-600 rounded-lg px-4 py-3 outline-none"
            />
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6 md:mb-10">
            {/* Convert From */}
            <div className="w-full md:w-72 flex flex-col">
              <label className="text-sm text-gray-400 mb-2">Convert From</label>
              <CustomDropdown
                options={bookies}
                selected={selectedBookie1}
                setSelected={setSelectedBookie1}
                isOpen={dropdownOpen1}
                setIsOpen={setDropdownOpen1}
                dropdownRef={dropdownRef1}
              />
            </div>

            {/* Arrow */}
            <div className="flex items-center justify-center transform rotate-90 md:rotate-0 text-gray-400 text-2xl">
              <HiOutlineArrowRight />
            </div>

            {/* Convert To */}
            <div className="w-full md:w-72 flex flex-col">
              <label className="text-sm text-gray-400 mb-2">Convert To</label>
              <CustomDropdown
                options={bookies}
                selected={selectedBookie2}
                setSelected={setSelectedBookie2}
                isOpen={dropdownOpen2}
                setIsOpen={setDropdownOpen2}
                dropdownRef={dropdownRef2}
              />
            </div>
          </div>

          {/* Fee and Total Display */}
          <div className="bg-gray-700 p-3 rounded-md space-y-1">
            <p className="text-gray-300 text-sm mb-2">
              Wallet Balance: ₦
              {wallet?.balance?.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }) ?? "0.00"}
            </p>
            <div className="flex justify-between">
              <span className="text-gray-400 text-sm">Processing Fee:</span>
              <span className="text-white text-sm">
                ₦{processingFee.toFixed(2)}
              </span>
            </div>
          </div>
          <button
            onClick={convertCode}
            disabled={
              isConverting ||
              !bookingCode ||
              !selectedBookie1 ||
              !selectedBookie2
            }
            className={`w-full ${
              isConverting ||
              !bookingCode ||
              !selectedBookie1 ||
              !selectedBookie2
                ? "bg-gray-600 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700 cursor-pointer"
            } text-white transition-colors flex justify-center items-center  
               py-3 px-4 rounded-md `}
          >
            {isConverting ? <> Converting Code...</> : "Convert Code"}
          </button>

          {convertedCode && (
            <div className="mt-4 p-3 bg-gray-700/50 rounded-lg relative">
              <p className="text-yellow-400 text-sm mb-2">
                ⚠️ If you leave or refresh this page, the converted code will be
                lost.
              </p>
              <p className="text-gray-400 mb-1">Converted Code:</p>
              <div className="relative">
                <p className="font-mono text-lg bg-gray-800 p-2 rounded break-words">
                  {convertedCode}
                </p>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(convertedCode);
                    toast.success("Copied!");
                  }}
                  className="absolute top-3 cursor-pointer right-2 flex text-gray-400 hover:text-white"
                  title="Copy to clipboard"
                >
                  <HiClipboardCopy className="text-xl" /> Copy
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BettingServices() {
  const { user, isLoading } = useGlobalContext();
  const {
    wallet,
    fetchWallet,
    getUniqueRequestId,
    fetchTransactions,
    uniqueRequestId,
  } = useGlobalContextData();
  const [activeTab, setActiveTab] = useState("betcode");
  const [bookingCode, setBookingCode] = useState("");
  const [convertedCode, setConvertedCode] = useState("");
  const [isConverting, setIsConverting] = useState(false);
  const [bookies, setBookies] = useState([]);
  const [selectedBookie1, setSelectedBookie1] = useState(null);
  const [selectedBookie2, setSelectedBookie2] = useState(null);
  const [dropdownOpen1, setDropdownOpen1] = useState(false);
  const [dropdownOpen2, setDropdownOpen2] = useState(false);
  const [rate, setRate] = useState("");
  const dropdownRef1 = useRef(null);
  const dropdownRef2 = useRef(null);
  const [processingFee] = useState(75); // processing fee

  // Fetch conversion rate on component mount
  useEffect(() => {
    const fetchRate = async () => {
      try {
        const response = await axios.get(
          "https://betpaddi.com/api/v1/conversion/rate",
          {
            headers: {
              Authorization: `Bearer ${process.env.NEXT_PUBLIC_CONVERSION_BILLZ_PUBLIC_KEY}`,
            },
          }
        );

        if (response.status === 200) {
          const { rate } = response.data;
          setRate(rate);
        }
      } catch (error) {
        toast.error("Failed to load rate");
        console.error("Error fetching rate:", error);
      }
    };

    fetchRate();
  }, []);

  // Fetch bookies on component mount
  useEffect(() => {
    const fetchBookies = async () => {
      try {
        const response = await axios.get(
          "https://betpaddi.com/api/v1/conversion/bookies",
          {
            headers: {
              Authorization: `Bearer ${process.env.NEXT_PUBLIC_CONVERSION_BILLZ_PUBLIC_KEY}`,
            },
          }
        );

        if (response.status === 200) {
          const bookiesArray = Object.values(response.data.data);
          setBookies(bookiesArray);
        }
      } catch (error) {
        toast.error("Failed to load bookies");
        console.error("Error fetching bookies:", error);
      }
    };

    fetchBookies();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef1.current &&
        !dropdownRef1.current.contains(event.target)
      ) {
        setDropdownOpen1(false);
      }
      if (
        dropdownRef2.current &&
        !dropdownRef2.current.contains(event.target)
      ) {
        setDropdownOpen2(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    fetchWallet();
    getUniqueRequestId();
  }, []);

  const convertCode = async () => {
    // Validate inputs
    if (
      !bookingCode ||
      !selectedBookie1 ||
      !selectedBookie2 ||
      !uniqueRequestId
    ) {
      toast.error("Missing required information");
      return;
    }

    if (wallet?.balance < processingFee) {
      toast.error("Insufficient balance");
      return;
    }

    setIsConverting(true);

    try {
      // 1. First create a pending transaction record
      const { error: txError } = await billzpaddi.from("transactions").insert({
        user_id: user?.user_id,
        email: user?.email,
        amount: processingFee,
        type: "debit",
        description: `Code Conversion (${selectedBookie1.bookie} to ${selectedBookie2.bookie})`,
        status: "pending",
        reference: uniqueRequestId,
        metadata: {
          bookie1: selectedBookie1.bookie,
          bookie2: selectedBookie2.bookie,
          original_code: bookingCode,
          created_at: new Date().toISOString(),
        },
      });

      if (txError) throw new Error("Failed to record transaction");

      // 2. Deduct from wallet immediately
      const { error: walletError } = await billzpaddi
        .from("wallets")
        .update({ balance: wallet?.balance - processingFee })
        .eq("user_id", user?.user_id);

      if (walletError) throw new Error("Failed to deduct from wallet");

      const { token } = await fetch("/api/wrapper/auth-check").then((res) =>
        res.json()
      );

      // 3. Process conversion through secure API route
      const res = await fetch("/api/wrapper/convert", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": token,
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_BILLZ_AUTH_KEY}`,
        },
        credentials: "include",
        body: JSON.stringify({
          bookingCode,
          bookie1: selectedBookie1.bookie,
          bookie2: selectedBookie2.bookie,
        }),
      });

      const data = await res.json();

      // 4. Handle response and update transaction
      let newStatus = "failed";
      let toastType = "error";
      let message = data.message || "Conversion failed";
      let convertedCode = null;

      if (data.success) {
        newStatus = "completed";
        toastType = "success";
        convertedCode = data.convertedCode;
        setConvertedCode(convertedCode);
      } else {
        // Refund wallet if failed
        await billzpaddi
          .from("wallets")
          .update({ balance: wallet.balance })
          .eq("user_id", user.user_id);
      }

      // Update transaction status
      await billzpaddi
        .from("transactions")
        .update({
          status: newStatus,
          metadata: {
            ...data,
            converted_code: convertedCode,
            updated_at: new Date().toISOString(),
          },
        })
        .eq("reference", uniqueRequestId);

      // Show appropriate notification
      toast[toastType](message, {
        autoClose: newStatus === "completed" ? 5000 : false,
      });
    } catch (err) {
      console.error("Conversion error:", err);
      toast.error(err.message || "Conversion failed");

      // Attempt to refund if error occurred after deduction
      try {
        await billzpaddi
          .from("wallets")
          .update({ balance: wallet?.balance })
          .eq("user_id", user.user_id);
      } catch (refundError) {
        console.error("Refund failed:", refundError);
      }
    } finally {
      // Refresh data
      fetchWallet();
      fetchTransactions();
      getUniqueRequestId();
      setIsConverting(false);
    }
  };

  // Other tab components (AI Prediction, Free Prediction, Top Up) remain the same as before
  const AIPrediction = () => (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 text-center">
      <div className="inline-flex items-center justify-center bg-blue-900/20 p-4 rounded-full mb-4">
        <FaLock className="text-2xl text-blue-400" />
      </div>
      <h3 className="text-xl font-medium mb-2">Premium AI Predictions</h3>
      <p className="text-gray-400 mb-6">
        Unlock our advanced AI predictions for just ₦250
      </p>
      <button
        onClick={() => toast.info("Under maintenance")}
        className="bg-gray-900 cursor-pointer hover:bg-gray-700 text-white py-3 px-6 rounded-md font-medium"
      >
        Unlock for ₦250
      </button>
    </div>
  );

  const FreePrediction = () => (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <h3 className="text-lg font-medium mb-4">Free Predictions</h3>
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 text-center">
        <h3 className="text-xl font-medium mb-2">Coming Soon!</h3>
        <p className="text-gray-400">
          We're working on bringing you a seamless top-up experience
        </p>
      </div>
    </div>
  );

  const TopUp = () => (
    <>
      <BetTopUp />
    </>
  );

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
      <section className="md:px-4">
        <div className="flex flex-wrap justify-between gap-2 items-center mb-6">
          <h1 className="text-2xl md:text-3xl uppercase">Betting</h1>
        </div>

        {/* Tab Navigation */}
        <div className="grid grid-cols-2 md:grid-cols-4 border-b border-gray-700 mb-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab("betcode")}
            className={`px-4 py-2 font-medium cursor-pointer whitespace-nowrap ${
              activeTab === "betcode"
                ? "text-blue-400 border-b-2 border-blue-400"
                : "text-gray-400"
            }`}
          >
            <FaExchangeAlt className="inline mr-2" />
            Code Converter
          </button>
          {false && (
            <button
              onClick={() => setActiveTab("topup")}
              className={`px-4 py-2 font-medium cursor-pointer whitespace-nowrap ${
                activeTab === "topup"
                  ? "text-blue-400 border-b-2 border-blue-400"
                  : "text-gray-400"
              }`}
            >
              <FaCoins className="inline mr-2" />
              Top Up
            </button>
          )}
          <button
            onClick={() => setActiveTab("ai")}
            className={`px-4 py-2 font-medium cursor-pointer whitespace-nowrap ${
              activeTab === "ai"
                ? "text-blue-400 border-b-2 border-blue-400"
                : "text-gray-400"
            }`}
          >
            <FaRobot className="inline mr-2" />
            AI Predictions
          </button>
          <button
            onClick={() => setActiveTab("free")}
            className={`px-4 py-2 font-medium cursor-pointer whitespace-nowrap ${
              activeTab === "free"
                ? "text-blue-400 border-b-2 border-blue-400"
                : "text-gray-400"
            }`}
          >
            <FaRobot className="inline mr-2" />
            Free Predictions
          </button>
        </div>

        {/* Tab Content */}
        <div className="max-w-3xl mx-auto">
          {activeTab === "betcode" && (
            <BetCodeConverter
              bookingCode={bookingCode}
              setBookingCode={setBookingCode}
              bookies={bookies}
              selectedBookie1={selectedBookie1}
              setSelectedBookie1={setSelectedBookie1}
              selectedBookie2={selectedBookie2}
              setSelectedBookie2={setSelectedBookie2}
              dropdownOpen1={dropdownOpen1}
              setDropdownOpen1={setDropdownOpen1}
              dropdownOpen2={dropdownOpen2}
              setDropdownOpen2={setDropdownOpen2}
              dropdownRef1={dropdownRef1}
              dropdownRef2={dropdownRef2}
              isConverting={isConverting}
              convertCode={convertCode}
              convertedCode={convertedCode}
              wallet={wallet}
              processingFee={processingFee}
            />
          )}
          {activeTab === "ai" && <AIPrediction />}
          {activeTab === "free" && <FreePrediction />}
          {activeTab === "topup" && <TopUp />}
        </div>
      </section>
    </div>
  );
}
