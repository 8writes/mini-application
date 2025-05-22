"use client";
import { useState, useEffect, useRef } from "react";
import { useGlobalContext } from "@/context/GlobalContext";
import {
  FaExchangeAlt,
  FaRobot,
  FaCoins,
  FaLock,
  FaChevronDown,
} from "react-icons/fa";
import axios from "axios";
import { toast } from "react-toastify";
import { HiClipboardCopy, HiOutlineArrowRight } from "react-icons/hi";
import { setErrorMap } from "zod";
import { useGlobalContextData } from "@/context/GlobalContextData";
import { billzpaddi } from "@/lib/client";
// import Select from "react-select";

const API_KEY =
  "5vQvjHdN3XXUluU2R2PZvBWXJwdPHkA0Pn24sVAyIpThtxEoansokYuhDIKMWJoF";

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
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 outline-none"
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:mb-10">
            {/* Convert From */}
            <div className="w-full flex flex-col justify-end">
              <label className="block text-sm text-gray-400 mb-2">
                Convert From
              </label>
              <CustomDropdown
                options={bookies}
                selected={selectedBookie1}
                setSelected={setSelectedBookie1}
                isOpen={dropdownOpen1}
                setIsOpen={setDropdownOpen1}
                dropdownRef={dropdownRef1}
              />
            </div>

            {/* Arrow - perfectly centered */}
            <div className="flex items-center justify-center">
              <HiOutlineArrowRight className="text-2xl text-gray-400 rotate-90 md:rotate-0" />
            </div>

            {/* Convert To */}
            <div className="w-full flex flex-col justify-end">
              <label className="block text-sm text-gray-400 mb-2">
                Convert To
              </label>
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
          <p className="text-gray-300 text-sm mb-2">
            Wallet Balance: {wallet?.currency} {wallet?.balance}
          </p>
          <p className="text-green-400 text-sm mb-2">
            You will be charged BLZ 1
          </p>
          <button
            onClick={convertCode}
            disabled={isConverting}
            className={`w-full bg-blue-600 hover:bg-blue-700 cursor-pointer text-white py-3 rounded-md font-medium ${
              isConverting ? "opacity-70 cursor-not-allowed" : ""
            }`}
          >
            {isConverting ? "Converting..." : "Convert Code"}
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
  const { wallet, fetchWallet, fetchTransactions } = useGlobalContextData();
  const [activeTab, setActiveTab] = useState("betcode");
  const [bookingCode, setBookingCode] = useState("");
  const [convertedCode, setConvertedCode] = useState("");
  const [isConverting, setIsConverting] = useState(false);
  const [bookies, setBookies] = useState([]);
  const [selectedBookie1, setSelectedBookie1] = useState(null);
  const [selectedBookie2, setSelectedBookie2] = useState(null);
  const [dropdownOpen1, setDropdownOpen1] = useState(false);
  const [dropdownOpen2, setDropdownOpen2] = useState(false);
  const dropdownRef1 = useRef(null);
  const dropdownRef2 = useRef(null);

  // Fetch bookies on component mount
  useEffect(() => {
    const fetchBookies = async () => {
      if (!user) return;
      try {
        const response = await axios.get(
          "https://betpaddi.com/api/v1/conversion/bookies",
          {
            headers: {
              Authorization: `Bearer ${API_KEY}`,
            },
          }
        );

        if (response.data.status === "success") {
          const bookiesArray = Object.values(response.data.data);
          setBookies(bookiesArray);
          // Set default selections
          const sportybetNg = bookiesArray.find(
            (b) => b.bookie === "sportybet:ng"
          );
          //  const bet9ja = bookiesArray.find((b) => b.bookie === "bet9ja");
          //  if (sportybetNg) setSelectedBookie2(sportybetNg);
          //  if (bet9ja) setSelectedBookie2(bet9ja);
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

  const convertCode = async () => {
    if (!bookingCode || !selectedBookie1 || !selectedBookie2) {
      toast.info("Please fill all fields");
      return;
    }

    setIsConverting(true);

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

      if (currentBalance < 50) {
        toast.error("Insufficient balance");
        setIsConverting(false);
        return;
      }

      setConvertedCode("");

      const response = await axios.post(
        "https://betpaddi.com/api/v1/conversion/convert-code",
        {
          code: bookingCode,
          bookie1: selectedBookie1.bookie,
          bookie2: selectedBookie2.bookie,
        },
        {
          headers: {
            Authorization: `Bearer ${API_KEY}`,
          },
        }
      );

      if (response.data.message === "Conversion successful") {
        const code =
          response?.data?.code?.converted_code || response?.data?.code;

        setConvertedCode(code);
        // Deduct from balance and update
        const { error: updateError } = await billzpaddi
          .from("wallets")
          .update({ balance: currentBalance - 50 })
          .eq("user_id", user.user_id);

        if (updateError) {
          throw new Error("Failed to update wallet balance");
        }

        // Create transaction record
        const { error: transactionError } = await billzpaddi
          .from("transactions")
          .insert({
            user_id: user?.user_id,
            amount: 50,
            type: "debit",
            description: "Code Conversion",
            status: "completed",
            reference: `CODE-${code}`,
          });

        if (transactionError) throw transactionError;

        toast.success("Code converted successfully!");
      } else {
        throw new Error("Unable to convert code");
      }
    } catch (error) {
      toast.error("Unable to convert code");
      console.error("Conversion error:", error);
    } finally {
      setIsConverting(false);
      fetchWallet();
      fetchTransactions();
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
        Unlock our advanced AI predictions for just 5 BLZ
      </p>
      <button className="bg-blue-600 cursor-pointer hover:bg-blue-700 text-white py-2 px-6 rounded-md font-medium">
        Unlock for 5 BLZ
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
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 text-center">
      <div className="inline-flex items-center justify-center bg-blue-900/20 p-4 rounded-full mb-4">
        <FaCoins className="text-2xl text-blue-400" />
      </div>
      <h3 className="text-xl font-medium mb-2">Top Up Coming Soon!</h3>
      <p className="text-gray-400">
        We're working on bringing you a seamless top-up experience
      </p>
    </div>
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
        <div className="flex border-b border-gray-700 mb-6 overflow-x-auto">
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
