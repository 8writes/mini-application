"use client";

import { useGlobalContext } from "@/context/GlobalContext";
import { useGlobalContextData } from "@/context/GlobalContextData";
import { usePin } from "@/context/PinContext";

import { billzpaddi } from "@/app/api/client/client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { FaArrowLeft } from "react-icons/fa";
import { toast } from "react-toastify";
import { callApi } from "@/utils/apiClient";

export default function Page() {
  const { user } = useGlobalContext();
  const {
    wallet,
    fetchWallet,
    getUniqueRequestId,
    uniqueRequestId,
    fetchTransactions,
  } = useGlobalContextData();
  const [recipientEmail, setRecipientEmail] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [users, setUsers] = useState([]);
  const [filteredRecipients, setFilteredRecipients] = useState([]);
  const [showRecipientDropdown, setShowRecipientDropdown] = useState(false);
  const [recipientInfo, setRecipientInfo] = useState(null);
  const [totalAmount, setTotalAmount] = useState(0);
  const { showPinDialog } = usePin();

  // Calculate total amount whenever amount changes
  useEffect(() => {
    const amountNum = parseFloat(amount) || 0;
    const fee = amountNum ? (amountNum < 2500 ? 25 : 50) : 0;
    setTotalAmount(amountNum + fee);
  }, [amount]);

  useEffect(() => {
    getUniqueRequestId();
    fetchWallet();
  }, []);

  // Fetch all users (except current user) for recipient suggestions
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await callApi("users/fetch", "POST", {
          currentUser: user?.user_id,
        });

        setUsers(data || []);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    if (user?.user_id) fetchUsers();
  }, [user]);

  // Verify recipient when email changes and contains '@'
  useEffect(() => {
    if (recipientEmail.includes("@")) {
      verifyRecipient();
    }
  }, [recipientEmail, showRecipientDropdown]);

  // Filter recipients based on email input
  useEffect(() => {
    if (recipientEmail.length > 1) {
      const filtered = users.filter((u) =>
        u.email.toLowerCase().includes(recipientEmail.toLowerCase())
      );
      setFilteredRecipients(filtered);
      setShowRecipientDropdown(true);
    } else {
      setFilteredRecipients([]);
      setShowRecipientDropdown(false);
      setRecipientInfo(null);
    }
  }, [recipientEmail, users]);

  const verifyRecipient = async () => {
    if (!recipientEmail.includes("@")) {
      setRecipientInfo(null);
      return;
    }

    setVerifying(true);
    try {
     
     const data = users.find((user) => user.email.toLowerCase() === recipientEmail.toLowerCase());

      if (!data) {
        setRecipientInfo(null);
      } else {
        setRecipientInfo({
          name: `${data.first_name} ${data.last_name}`,
          email: data.email,
          userId: data.user_id,
        });
      }
    } catch (error) {
      console.error("Verification error:", error);
      setRecipientInfo(null);
    } finally {
      setVerifying(false);
    }
  };

  const handleTransfer = async () => {
    if (!recipientEmail || !amount) {
      toast.error("Please fill all fields");
      return;
    }

    if (!recipientInfo) {
      toast.error("Please verify recipient first");
      return;
    }

    const amountNumber = parseFloat(amount);
    if (isNaN(amountNumber) || amountNumber <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (amountNumber < 500) {
      toast.info("Minimum amount of ₦500");
      return;
    }

    const isPinValid = await showPinDialog();
    if (!isPinValid) {
      return;
    }

    setLoading(true);

    try {
      // 1. Verify sender has sufficient balance (including fee)
      if (wallet.balance < totalAmount) {
        throw new Error(`Insufficient balance`);
      }

      // 2. Perform the transfer with fee
      // Deduct from sender (amount + fee)
      await callApi("wallet/update", "PUT", {
        user_id: user.user_id,
        newBalance: wallet.balance - totalAmount,
      });

      // Add to recipient (only the amount, not the fee)
      // fetch recipient wallet
      const recipientWallet = await callApi("wallet/fetch", "POST", {
        user_id: recipientInfo.userId,
      });

      // update wallet
      await callApi("wallet/update", "PUT", {
        user_id: recipientInfo.userId,
        newBalance: (recipientWallet.balance || 0) + amountNumber,
      });

      // 3. Record the transactions
      const { error: transactionError } = await billzpaddi
        .from("transactions")
        .insert([
          // Sender's debit transaction
          {
            user_id: user?.user_id,
            amount: amountNumber,
            type: "debit",
            status: "completed",
            reference: `out${uniqueRequestId}`,
            description: `Transfer to ${recipientEmail.split("@")[0]}`,
            unique_req_email: recipientEmail,
          },
          // receiver's credit transaction
          {
            user_id: recipientInfo.userId,
            amount: amountNumber,
            type: "credit",
            status: "completed",
            reference: `in${uniqueRequestId}`,
            description: `Transfer from ${user?.email.split("@")[0]}`,
            unique_req_email: user?.email,
          },
        ]);

      toast.success(
        `Successfully transferred ₦${amountNumber.toLocaleString()}`
      );
      setRecipientEmail("");
      setAmount("");
      setRecipientInfo(null);
    } catch (error) {
      toast.error(error.message || "Transfer failed");
      console.error("Transfer error:", error);
    } finally {
      setLoading(false);
      fetchWallet();
      fetchTransactions();
      getUniqueRequestId();
    }
  };

  const selectRecipient = (email) => {
    setRecipientEmail(email);
    setShowRecipientDropdown(false);
  };

  return (
    <div className="px-4 py-10 md:p-10 w-full md:max-w-3xl mx-auto">
      <div className="pb-6">
        <Link href="/wallet" className="">
          <button className="flex items-center py-4 gap-2 text-gray-200 hover:bg-gray-600 rounded-md px-4 transition-all duration-150  cursor-pointer mb-6">
            <FaArrowLeft /> Back to Transactions
          </button>
        </Link>
      </div>
      <h1 className="text-2xl md:text-3xl mb-6">Send Funds</h1>

      <div className="bg-gray-800 rounded-lg shadow p-6 mb-8">
        <div className="space-y-4">
          {/* Recipient Email Field */}
          <div className="relative">
            <label htmlFor="recipient" className="block text-gray-400 mb-2">
              Recipient Email
            </label>
            <input
              type="email"
              id="recipient"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="Enter recipient's email"
              className="w-full bg-gray-700 border border-gray-600 rounded-md px-4 py-2 text-white outline-none"
            />
            {false && (
              <div className="absolute z-10 mt-1 w-full bg-gray-700 border border-gray-600 rounded-md shadow-lg max-h-60 overflow-auto">
                {filteredRecipients.map((user) => (
                  <div
                    key={user.user_id}
                    className="px-4 py-2 hover:bg-gray-600 cursor-pointer flex items-center"
                    onClick={() => selectRecipient(user.email)}
                  >
                    <div className="flex-1">
                      <p className="text-white">{user.email}</p>
                      <p className="text-gray-400 text-sm">
                        {user.first_name} {user.last_name}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recipient Verification */}
          {verifying && (
            <div className="text-blue-400 text-sm">Verifying recipient...</div>
          )}
          {recipientInfo && !verifying && (
            <div className="bg-gray-700 p-3 rounded-md">
              <p className="text-green-400 text-sm font-medium">
                Recipient Verified:
              </p>
              <p className="text-white text-sm">{recipientInfo.name}</p>
            </div>
          )}
          {!recipientInfo && !verifying && recipientEmail.includes("@") && (
            <div className="text-yellow-400 text-sm">
              Recipient not found. Please check the email address.
            </div>
          )}

          {/* Amount Field */}
          <div>
            <label htmlFor="amount" className="block text-gray-400 mb-2">
              Amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                NGN
              </span>
              <input
                type="tel"
                id="amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="(minimum ₦500)"
                className="w-full bg-gray-700 border pl-14 border-gray-600 rounded-md px-10 py-2 text-white outline-none"
                min="500"
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
                ₦
                {parseFloat(amount)
                  ? (parseFloat(amount) < 2500 ? 25 : 50).toFixed(2)
                  : "0.00"}
              </span>
            </div>
            <div className="flex justify-between font-medium">
              <span className="text-gray-300">Total:</span>
              <span className="text-white">
                ₦
                {totalAmount.toLocaleString("en-NG", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>

          {/* Transfer Button */}
          <button
            onClick={handleTransfer}
            disabled={loading || !recipientInfo || !amount}
            className={`w-full py-3 px-4 rounded-md font-medium ${
              loading || !recipientInfo || !amount
                ? "bg-gray-600 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700 cursor-pointer"
            } text-white transition-colors`}
          >
            {loading ? "Processing..." : "Send Funds"}
          </button>
        </div>
      </div>
    </div>
  );
}
