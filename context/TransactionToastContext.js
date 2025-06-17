// context/TransactionToastContext.js
"use client";

import TransactionStatusModal from "@/components/dialogs/feedbackDialog";
import { createContext, useContext, useState } from "react";

const TransactionToastContext = createContext(null);

export function TransactionToastProvider({ children }) {
  const [toastConfig, setToastConfig] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  const show = (config) => {
    setToastConfig(config);
    setIsVisible(true);
  };

  const hide = () => {
    setIsVisible(false);
    setTimeout(() => setToastConfig(null), 300);
  };

  return (
    <TransactionToastContext.Provider value={{ show, hide }}>
      {children}
      {toastConfig && (
        <TransactionStatusModal
          status={toastConfig.status}
          message={toastConfig.message}
          uniqueRequestId={toastConfig.uniqueRequestId}
          onClose={hide}
        />
      )}
    </TransactionToastContext.Provider>
  );
}

export function useTransactionToast() {
  const context = useContext(TransactionToastContext);
  if (!context) {
    throw new Error(
      "useTransactionToast must be used within a TransactionToastProvider"
    );
  }
  return context;
}
