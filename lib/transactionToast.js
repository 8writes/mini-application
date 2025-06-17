// lib/transaction-toast.js
import TransactionStatusModal from "@/components/dialogs/feedbackDialog";
import { createRoot } from "react-dom/client";

const showTransactionToast = ({ status, message, uniqueRequestId }) => {
  // Create container if it doesn't exist
  let toastContainer = document.getElementById("transaction-toast-container");
  if (!toastContainer) {
    toastContainer = document.createElement("div");
    toastContainer.id = "transaction-toast-container";
    document.body.appendChild(toastContainer);
  }

  // Create root if it doesn't exist
  if (!toastContainer._root) {
    toastContainer._root = createRoot(toastContainer);
  }

  const closeToast = () => {
    toastContainer._root.unmount();
    toastContainer.remove();
  };

  toastContainer._root.render(
    <TransactionStatusModal
      status={status}
      message={message}
      uniqueRequestId={uniqueRequestId}
      onClose={closeToast}
    />
  );
};

// Create the toast object
const transactionToast = {
  success: (message, uniqueRequestId) =>
    showTransactionToast({ status: "success", message, uniqueRequestId }),

  pending: (message, uniqueRequestId) =>
    showTransactionToast({ status: "pending", message, uniqueRequestId }),

  error: (message, uniqueRequestId) =>
    showTransactionToast({ status: "failed", message, uniqueRequestId }),

  show: (options) => showTransactionToast(options),
};

// Export as default
export default transactionToast;
