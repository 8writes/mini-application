"use client";
import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiCheckCircle, FiClock, FiAlertCircle } from "react-icons/fi";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function TransactionStatusModal({
  status = "success",
  message = "",
  uniqueRequestId = "",
  onClose = () => {},
}) {
  const modalRef = useRef(null);

  // Generate unique key for this modal instance
  const modalKey = useRef(
    `modal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  ).current;

  // Close modal on ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const statusConfig = {
    success: {
      icon: <FiCheckCircle className="w-12 h-12 text-green-500" />,
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500",
      title: "Transaction Successful",
      defaultMessage: "Your transaction was completed successfully",
    },
    warning: {
      icon: <FiClock className="w-12 h-12 text-yellow-500" />,
      bgColor: "bg-yellow-500/10",
      borderColor: "border-yellow-500",
      title: "Transaction Pending",
      defaultMessage: "Your transaction is being processed",
    },
    error: {
      icon: <FiAlertCircle className="w-12 h-12 text-red-500" />,
      bgColor: "bg-red-500/10",
      borderColor: "border-red-500",
      title: "Transaction Failed",
      defaultMessage: "Your transaction could not be completed",
    },
    default: {
      icon: <FiAlertCircle className="w-12 h-12 text-gray-500" />,
      bgColor: "bg-gray-500/10",
      borderColor: "border-gray-500",
      title: "Transaction Status",
      defaultMessage: "Transaction status unknown",
    },
  };

  const { icon, bgColor, borderColor, title, defaultMessage } =
    statusConfig[status] || statusConfig.default;

  const getStatusColor = () => {
    switch (status) {
      case "success":
        return {
          bg: "bg-green-600 hover:bg-green-500",
          text: "text-white",
        };
      case "warning":
        return {
          bg: "bg-yellow-600 hover:bg-yellow-500",
          text: "text-white",
        };
      case "error":
        return {
          bg: "bg-red-600 hover:bg-red-500",
          text: "text-white",
        };
      default:
        return {
          bg: "bg-blue-600 hover:bg-blue-500",
          text: "text-white",
        };
    }
  };

  const statusColor = getStatusColor();

  return (
    <div className="fixed inset-0 z-[9999]">
      <AnimatePresence>
        {/* Backdrop with fade animation */}
        <motion.div
          key={`${modalKey}-modal`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />

        {/* Modal with slide-up animation */}
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            ref={modalRef}
            className={`relative w-full max-w-md rounded-xl border ${borderColor} ${bgColor} p-6 shadow-lg`}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 cursor-pointer text-gray-100 hover:text-gray-200 transition-colors"
              aria-label="Close modal"
            >
              <FiX className="w-7 h-7" />
            </button>

            {/* Status content */}
            <div className="flex flex-col items-center text-center">
              <div className="mb-4">{icon}</div>
              <h3 className="text-xl font-bold mb-2">{title}</h3>
              <p className="text-white mb-6 bg-amber-50/10 backdrop-blur-sm px-2 py-1 uppercase">
                {message || defaultMessage}
              </p>

              {/* Action buttons */}
              <div className="flex gap-3 w-full">
                {uniqueRequestId && (
                  <Link
                    href={`/transactions/info/${uniqueRequestId}`}
                    className={`flex-1 w-full py-3 px-4 text-center rounded-md ${statusColor.bg} ${statusColor.text} transition-colors`}
                    onClick={onClose}
                    prefetch={true}
                  >
                    View Details
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </AnimatePresence>
    </div>
  );
}
