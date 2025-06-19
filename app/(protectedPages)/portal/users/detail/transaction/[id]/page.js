"use client";
import { useGlobalContextData } from "@/context/GlobalContextData";
import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { FaCopy, FaArrowLeft } from "react-icons/fa";
import { toast } from "react-toastify";
import { format } from "date-fns";
import Link from "next/link";
import { billzpaddi } from "@/lib/client";

export default function TransactionInfoPage() {
  const [transactions, setTransactions] = useState(null);
  const [transaction, setTransaction] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { id } = useParams();
  const router = useRouter();

  // Fetch user transactions
  const fetchTransactions = async () => {
    if (!id) return;
    try {
      const { data, error } = await billzpaddi
        .from("transactions")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTransactions(data);
    } catch (err) {
      console.error("Transactions fetch error:", err);
      toast.error("Failed to load transactions");
    }
  };

  // Fetch data
  useEffect(() => {
    fetchTransactions();
  }, []);

  useEffect(() => {
    fetchTransactions().then(() => {
      const foundTxn = transactions
        ? transactions.find((txn) => txn.reference === id)
        : null;
      setTransaction(foundTxn);
      setIsLoading(false);
    });
  }, [id, fetchTransactions, transactions]);

  // Format amount with currency
  const formatAmount = (amount) => {
    if (typeof amount === "number" || !isNaN(amount)) {
      return `₦${parseFloat(amount).toLocaleString()}`;
    }
    return amount;
  };

  // Memoize transaction details to prevent unnecessary recalculations
  const { transactionDetails, transactionData, transactionData1 } =
    useMemo(() => {
      if (!transaction?.metadata?.content?.transactions) {
        return {
          transactionDetails: [],
          transactionData: null,
          transactionData1: null,
        };
      }

      const txnData = transaction.metadata.content.transactions;
      const txnData1 = transaction.metadata;
      const details = [];

      // Essential fields
      if (txnData.product_name) {
        details.push({
          label: "Product",
          value: txnData.product_name,
        });
      }

      if (txnData.unique_element) {
        details.push({
          label: "Recipient",
          value: txnData.unique_element,
        });
      }

      if (txnData1.plan) {
        details.push({
          label: "Plan",
          value: txnData1.plan,
        });
      }

      if (txnData.amount) {
        details.push({
          label: "Amount",
          value: formatAmount(txnData.amount),
        });
      }

      if (txnData.status) {
        details.push({
          label: "Service Status",
          value:
            txnData.status.charAt(0).toUpperCase() + txnData.status.slice(1),
        });
      }

      if (txnData.transaction_date) {
        details.push({
          label: "Processed On",
          value: format(new Date(txnData.transaction_date), "PPpp"),
        });
      }

      return {
        transactionDetails: details,
        transactionData: txnData,
        transactionData1: txnData1,
      };
    }, [transaction]);

  if (isLoading || !transaction) {
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
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <Link href={`/portal/users/detail/${transaction?.user_id}`} className="">
        <button className="flex items-center py-4 gap-2 hover:bg-gray-600 rounded-md px-4 transition-all duration-150 text-gray-200 cursor-pointer mb-6">
          <FaArrowLeft /> Back
        </button>
      </Link>

      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
        <div className="flex flex-col md:flex-row justify-between gap-5 items-start mb-6">
          <div>
            <h1 className="text-lg md:text-2xl font-bold mb-1">
              Transaction Details
            </h1>
            <p className="text-gray-400 text-sm">
              {format(new Date(transaction?.created_at), "PPpp")}
            </p>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              transaction?.status === "completed"
                ? "bg-green-900/20 text-green-400"
                : transaction?.status === "pending"
                ? "bg-yellow-900/20 text-yellow-400"
                : "bg-red-900/20 text-red-400"
            }`}
          >
            {transaction?.status.charAt(0).toUpperCase() +
              transaction?.status.slice(1)}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-6 mb-8">
          <div className="bg-gray-700/50 p-4 rounded-lg">
            <div className="space-y-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-400">Reference</p>
                <div className="flex items-center gap-2">
                  <p className="text-gray-300">{transaction?.reference}</p>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(transaction?.reference);
                      toast.success("Copied to clipboard!");
                    }}
                    className="text-gray-400 cursor-pointer hover:text-white"
                  >
                    <FaCopy size={14} />
                  </button>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-400">Description</p>
                <p className="text-gray-300">{transaction?.description}</p>
              </div>
              {transactionData1?.plan && (
                <div>
                  <p className="text-sm text-gray-400">Plan</p>
                  <p className="text-gray-300">{transactionData1?.plan}</p>
                </div>
              )}
              {transactionData?.unique_element && (
                <div>
                  <p className="text-sm text-gray-400">Recipient</p>
                  <p className="text-gray-300">
                    {transactionData?.unique_element ?? "N/A"}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-400">Type</p>
                <p className="text-gray-300 capitalize">{transaction?.type}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Amount</p>
                <p
                  className={`font-semibold ${
                    transaction?.type === "credit"
                      ? "text-green-400"
                      : "text-red-400"
                  }`}
                >
                  {transaction?.type === "credit" ? "+" : "-"}₦
                  {transaction?.amount?.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Status</p>
                <p className="text-gray-300 uppercase">
                  {transaction?.metadata?.response_description
                    ? transaction?.metadata.response_description
                    : transaction?.status
                    ? transaction?.status.charAt(0).toUpperCase() +
                      transaction?.status.slice(1)
                    : "Unknown"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {false && (
          <div className="bg-gray-700/50 p-4 rounded-lg">
            <h3 className="font-medium text-gray-400 mb-3">Service Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
              {transactionDetails?.map((detail) => (
                <div key={detail?.label}>
                  <p className="text-sm text-gray-400 capitalize">
                    {detail?.label}
                  </p>
                  <p className="text-gray-300 break-all">{detail?.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
