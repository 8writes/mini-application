"use client";

import { useGlobalContext } from "@/context/GlobalContext";
import { useGlobalContextData } from "@/context/GlobalContextData";
import { billzpaddi } from "@/lib/client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

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
  const [processingFee] = useState(25); // ₦25 processing fee
  const [totalAmount, setTotalAmount] = useState(0);

  // Calculate total amount whenever amount changes
  useEffect(() => {
    const amountNum = parseFloat(amount) || 0;
    setTotalAmount(amountNum + processingFee);
  }, [amount, processingFee]);

  useEffect(() => {
    getUniqueRequestId();
    fetchWallet();
  }, []);

  // Fetch all users (except current user) for recipient suggestions
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data, error } = await billzpaddi
          .from("users")
          .select("user_id, email, first_name, last_name")
          .neq("user_id", user?.user_id);

        if (error) throw error;
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
      const { data, error } = await billzpaddi
        .from("users")
        .select("user_id, first_name, last_name, email")
        .eq("email", recipientEmail)
        .neq("user_id", user.user_id)
        .single();

      if (error || !data) {
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

    if (amountNumber < 50) {
      toast.info("Minimum amount of ₦500");
      return;
    }

    setLoading(true);

    try {
      // 1. Verify sender has sufficient balance (including fee)
      const { data: senderWallet, error: senderError } = await billzpaddi
        .from("wallets")
        .select("balance")
        .eq("user_id", user.user_id)
        .single();

      if (senderError) throw senderError;

      if (senderWallet.balance < totalAmount) {
        throw new Error(`Insufficient balance`);
      }

      // 2. Perform the transfer with fee
      // Deduct from sender (amount + fee)
      const { error: deductError } = await billzpaddi
        .from("wallets")
        .update({ balance: senderWallet.balance - totalAmount })
        .eq("user_id", user.user_id);

      if (deductError) throw deductError;

      // Add to recipient (only the amount, not the fee)
      const { data: recipientWallet, error: recipientWalletError } =
        await billzpaddi
          .from("wallets")
          .select("balance")
          .eq("user_id", recipientInfo.userId)
          .single();

      if (recipientWalletError) throw recipientWalletError;

      const { error: addError } = await billzpaddi
        .from("wallets")
        .update({ balance: (recipientWallet.balance || 0) + amountNumber })
        .eq("user_id", recipientInfo.userId);

      if (addError) throw addError;

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
            description: `Transfer to ${recipientEmail}`,
            unique_req_email: recipientEmail,
          },
          // receiver's credit transaction
          {
            user_id: recipientInfo.userId,
            amount: amountNumber,
            type: "credit",
            status: "completed",
            reference: `in${uniqueRequestId}`,
            description: `Transfer from ${user?.email}`,
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
        <Link
          href="/wallet"
          className="px-4 py-4 text-white bg-gray-700 rounded-md hover:bg-gray-600  cursor-pointer"
        >
          ← Back to Wallet
        </Link>
      </div>
      <h1 className="text-2xl md:text-3xl mb-6">Transfer Funds</h1>

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
                ₦{processingFee.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between font-medium">
              <span className="text-gray-300">Amount to send:</span>
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
                : "bg-blue-600 hover:bg-blue-700 cursor-pointer"
            } text-white transition-colors`}
          >
            {loading ? "Processing..." : "Transfer Funds"}
          </button>
        </div>
      </div>
    </div>
  );
}
