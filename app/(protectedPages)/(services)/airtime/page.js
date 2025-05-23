"use client";
import { useGlobalContext } from "@/context/GlobalContext";
import { useGlobalContextData } from "@/context/GlobalContextData";
import { billzpaddi } from "@/lib/client";
import axios from "axios";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { FaChevronDown } from "react-icons/fa";
import { toast } from "react-toastify";
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
          {/**{selected?.image && (
            <Image
              src={selected?.image || "/icons/user.png"}
              alt={selected.name}
              width={24}
              height={24}
              className="rounded-full"
            />
          )}*/}
          <span>{selected ? selected.name : "Select Network"}</span>
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
              placeholder="Search Network..."
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
                {/**
                {isp.image && (
                  <Image
                    src={isp?.image || "/icons/user.png"}
                    alt={isp.name}
                    width={20}
                    height={20}
                    className="rounded-full"
                  />
                )}*/}
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
  selectedISP,
  phoneNumber,
  amount,
  onSuccess,
}) => {
  const { user } = useGlobalContext();
  const { wallet, fetchWallet, 
    getUniqueRequestId, uniqueRequestId, fetchTransactions } =
    useGlobalContextData();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");

  const totalAmount = amount ? Math.round(Number(amount) * 1) : 0;

  const handlePurchase = async () => {
    if (!amount || !phoneNumber || !selectedISP) {
      setError("Missing required information for purchase");
      return;
    }

    if (wallet?.balance < totalAmount) {
      setError("Insufficient funds");
      return;
    }

    setIsProcessing(true);

    try {
      const res = await fetch("/api/vtpass", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceID: selectedISP.serviceID,
          billersCode: phoneNumber,
          request_id: uniqueRequestId,
          phone: phoneNumber,
          amount: amount,
        }),
      });

      const data = await res.json();

      if (data.code === "016") {
        toast.error(data.response_description || "Transaction failed.", {
          autoClose: false,
        });

        await billzpaddi.from("transactions").insert({
          user_id: user?.user_id,
          amount: 0,
          type: "debit",
          description: "Airtime Purchase",
          status: "failed",
          reference: uniqueRequestId,
        });
        return;
      }

      if (data.code === "099") {
        toast.warning(data.response_description || "Transaction pending...", {
          autoClose: false,
        });

        await billzpaddi
          .from("wallets")
          .update({ balance: wallet.balance - totalAmount })
          .eq("user_id", user.user_id);

        await billzpaddi.from("transactions").insert({
          user_id: user?.user_id,
          amount: totalAmount,
          type: "debit",
          description: "Airtime Purchase",
          status: "pending",
          reference: uniqueRequestId,
        });
        return;
      }

      if (data.code === "000") {
        toast.success(
          data.response_description || "Transaction completed successfully.",
          { autoClose: false }
        );

        await billzpaddi
          .from("wallets")
          .update({ balance: wallet.balance - totalAmount })
          .eq("user_id", user.user_id);

        await billzpaddi.from("transactions").insert({
          user_id: user?.user_id,
          amount: totalAmount,
          type: "debit",
          description: "Airtime Purchase",
          status: "completed",
          reference: uniqueRequestId,
        });

        onSuccess();
        onOpenChange(false);
        return;
      }

      toast.error(
        data.response_description || "Purchase failed. Please try again.",
        { autoClose: false }
      );
    } catch (err) {
      toast.error(err.message || "Purchase failed. Please try again.", {
        autoClose: false,
      });
    } finally {
      fetchWallet();
      fetchTransactions();
      getUniqueRequestId();
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
              <span className="text-gray-400">Network:</span>
              <span className="text-white">{selectedISP?.name}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-400">Mobile Number:</span>
              <span className="text-white">{phoneNumber}</span>
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
  const [amount, setAmount] = useState("");
  const [isps, setIsps] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [phone, setPhone] = useState("");
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const detectISPFromPhone = (phone) => {
    const cleaned = phone.replace(/\D/g, "").slice(0, 4);
    const mapping = {
      mtn: [
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
      glo: ["0805", "0807", "0811", "0815", "0905", "0705"],
      airtel: ["0802", "0808", "0812", "0701", "0902", "0901", "0907"],
      "9mobile": ["0809", "0817", "0818", "0908", "0909"],
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
      setPhone(user?.phone || "");
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

  useEffect(() => {
    const fetchISPs = async () => {
      try {
        const res = await axios.get(
          "https://sandbox.vtpass.com/api/services?identifier=airtime",
          {
            headers: {
              "api-key": process.env.NEXT_PUBLIC_VTPASS_API_KEY,
              "public-key": process.env.NEXT_PUBLIC_VTPASS_PUBLIC_KEY,
            },
          }
        );
        const dataISPs =
          res.data.content?.filter(
            (item) => item.serviceID !== "foreign-airtime"
          ) || [];
        setIsps(dataISPs);
      } catch (err) {
        console.error("Error fetching networks:", err);
        toast.error("Failed to load networks");
      }
    };
    fetchISPs();
  }, []);

  const handleProceed = () => {
    if (!phone) {
      toast.error("Please enter a phone number");
      return;
    }
    if (!amount || Number(amount) < 50) {
      toast.info("Minimum amount is ₦50");
      return;
    }
    if (!selectedISP) {
      toast.error("Please select a network");
      return;
    }
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
        Airtime Purchase
      </h1>

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
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full md:w-1/2 px-4 py-3 rounded-lg bg-gray-800 text-white border border-gray-600 outline-none"
        />
      </div>

      <div className="mb-8">
        <input
          type="tel"
          placeholder="(minimum ₦50)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          min="50"
          className="w-full px-4 py-3 rounded-lg bg-gray-800 text-white border border-gray-600 outline-none"
        />
      </div>

      <button
        onClick={handleProceed}
        className="w-full bg-gray-900 hover:bg-gray-800 cursor-pointer text-white py-3 px-4 rounded-lg font-medium"
      >
        Proceed
      </button>

      <PurchaseDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        selectedISP={selectedISP}
        phoneNumber={phone}
        amount={amount}
        onSuccess={() => {
          setAmount("");
          setShowDialog(false);
        }}
      />
    </section>
  );
}
