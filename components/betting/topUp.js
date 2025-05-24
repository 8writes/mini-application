import { useGlobalContext } from "@/context/GlobalContext";
import { useGlobalContextData } from "@/context/GlobalContextData";
import { billzpaddi } from "@/lib/client";
import axios from "axios";
import { useEffect, useRef, useState } from "react";
import { FaChevronDown, FaCoins, FaSpinner } from "react-icons/fa";
import { toast } from "react-toastify";

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
        className="flex items-center justify-between cursor-pointer w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 outline-none"
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
                key={bookie.code}
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

export default function BetTopUp() {
  const { user } = useGlobalContext();
  const {
    uniqueRequestId,
    wallet,
    fetchWallet,
    getUniqueRequestId,
    fetchTransactions,
  } = useGlobalContextData();
  const [formData, setFormData] = useState({
    bettingCompany: "",
    customerId: "",
    amount: "",
    requestId: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [orderStatus, setOrderStatus] = useState(null);
  const [bettingCompanies, setBettingCompanies] = useState([]);
  const [selectedBookie, setSelectedBookie] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [verifiedName, setVerifiedName] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);

  const dropdownRef = useRef();

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  useEffect(() => {
    const verifyCustomerId = async () => {
      if (
        !formData.customerId ||
        !selectedBookie ||
        formData.customerId.length < 5
      ) {
        setVerifiedName("");
        return;
      }

      setVerifying(true);
      try {
        const userID = "CK101247664";
        const apiKey =
          "USADV2F91301SEH77L1R27P57UUH08F9VTRBZSGDH40S1W25K60XA83871L60E22";
        const verifyUrl = `https://www.nellobytesystems.com/APIVerifyBettingV1.asp?UserID=${userID}&APIKey=${apiKey}&BettingCompany=${selectedBookie.code}&CustomerID=${formData.customerId}`;

        const res = await fetch(verifyUrl);
        const data = await res.json();

        if (data.status === "00") {
          setVerifiedName(data.customer_name || "Verified");
          setVerified(true);
        } else {
          setVerifiedName("Invalid Customer ID");
        }
      } catch (err) {
        setVerifiedName("Error verifying ID");
      } finally {
        setVerifying(false);
      }
    };

    verifyCustomerId();
  }, [formData.customerId, selectedBookie]);

  useEffect(() => {
    const fetchBettingCompanies = async () => {
      try {
        const res = await axios.get(
          "https://www.nellobytesystems.com/APIBettingCompaniesV2.asp"
        );
        const formatted = res.data.BETTING_COMPANY.map((item) => ({
          code: item.PRODUCT_CODE?.toLowerCase(),
          name: item.PRODUCT_CODE,
        }));
        setBettingCompanies(formatted);
      } catch (err) {
        console.error("Failed to fetch betting companies:", err);
      }
    };

    fetchBettingCompanies();
  }, []);
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const bettingCompanyVerify =
      selectedBookie?.code || formData.bettingCompany;

    if (!bettingCompanyVerify) {
      toast.info("Select a bookie");
      return;
    }

    if (!verified) {
      toast.error("Customer ID is invalid");
      return;
    }

    setIsLoading(true);

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

    if (currentBalance < formData.amount) {
      toast.error("Insufficient balance");
      setIsLoading(false);
      return;
    }

    try {
      const userID = "CK101247664";
      const apiKey =
        "USADV2F91301SEH77L1R27P57UUH08F9VTRBZSGDH40S1W25K60XA83871L60E22";
      const bettingCompany = selectedBookie?.code || formData.bettingCompany;
      const customerId = formData.customerId;

      // Step 2: Proceed with the top-up
      const fundUrl = `https://www.nellobytesystems.com/APIBettingV1.asp?UserID=${userID}&APIKey=${apiKey}&BettingCompany=${bettingCompany}&CustomerID=${customerId}&Amount=${formData.amount}&RequestID=${uniqueRequestId}`;

      const fundRes = await fetch(fundUrl);
      const fundData = await fundRes.json();

      if (fundData.statuscode === "100") {
        setOrderStatus(fundData);
        // Create transaction record
        const { error: transactionError } = await billzpaddi
          .from("transactions")
          .insert({
            user_id: user?.user_id,
            amount: formData.amount,
            type: "debit",
            description: "Betting Top Up",
            status: "completed",
            reference: uniqueRequestId,
          });

        if (transactionError) throw transactionError;

        fetchWallet();
        fetchTransactions();
        toast.success("TRANSACTION SUCCESSFUL");
      } else {
        // Create transaction record

        const { error: transactionError } = await billzpaddi
          .from("transactions")
          .insert({
            user_id: user?.user_id,
            amount: 0,
            type: "debit",
            description: "Betting Top Up",
            status: "failed",
            reference: uniqueRequestId,
          });
        
        if (transactionError) throw transactionError;
        throw new Error(fundData.status || "Top-up failed");
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      getUniqueRequestId();
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 max-w-md mx-auto">
      <div className="inline-flex items-center justify-center bg-blue-900/20 p-4 rounded-full mb-4">
        <FaCoins className="text-2xl text-blue-400" />
      </div>
      <h3 className="text-xl font-medium mb-4">Betting Wallet Top-Up</h3>

      {orderStatus ? (
        <div className="bg-gray-700 p-4 rounded-lg mb-4">
          <h4 className="font-medium text-green-400 mb-2">Order Received</h4>
          <p>Order ID: {orderStatus.orderid}</p>
          <p>Status: {orderStatus.status}</p>
          <button
            onClick={() => setOrderStatus(null)}
            className="mt-3 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
          >
            New Top-Up
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Betting Company
            </label>
            <CustomDropdown
              options={bettingCompanies}
              selected={selectedBookie}
              setSelected={setSelectedBookie}
              isOpen={dropdownOpen}
              setIsOpen={setDropdownOpen}
              dropdownRef={dropdownRef}
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Customer ID
            </label>
            <input
              type="text"
              name="customerId"
              value={formData.customerId}
              onChange={handleChange}
              className="w-full bg-gray-700 border border-gray-600 outline-none rounded py-2 px-3 text-white"
              placeholder=""
              required
            />
            {verifying ? (
              <p className="text-xs text-yellow-400 mt-1">Verifying...</p>
            ) : verifiedName ? (
              <p
                className={`text-xs mt-1 ${
                  verifiedName === "Invalid Customer ID" ||
                  verifiedName === "Error verifying ID"
                    ? "text-red-400"
                    : "text-green-400"
                }`}
              >
                {verifiedName}
              </p>
            ) : null}
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Amount (₦)
            </label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              className="w-full bg-gray-700 border border-gray-600 outline-none rounded py-2 px-3 text-white"
              placeholder="(minimum ₦100)"
              min="100"
              required
            />
          </div>
          <p className="text-gray-300 text-sm mb-2">
            Wallet Balance: ₦
            {wallet?.balance?.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }) ?? "0.00"}
          </p>
          <button
            type="submit"
            disabled={isLoading || verifying}
            className="w-full bg-gray-900 hover:bg-gray-700 cursor-pointer text-white py-3 px-4 rounded flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <FaSpinner className="animate-spin mr-2" />
                Processing...
              </>
            ) : (
              "Top Up"
            )}
          </button>
        </form>
      )}

      <p className="text-gray-400 text-center text-sm mt-4">
        Transactions are processed securely.
      </p>
    </div>
  );
}
