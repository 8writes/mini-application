import TransactionStatusModal from "@/components/dialogs/feedbackDialog";
import { createRoot } from "react-dom/client";

// Track active toasts to prevent duplicates
const activeToasts = new Set();

const showTransactionToast = ({ status, message, uniqueRequestId }) => {
  // Create container if it doesn't exist
  let toastContainer = document.getElementById("transaction-toast-container");

  if (!toastContainer) {
    toastContainer = document.createElement("div");
    toastContainer.id = "transaction-toast-container";
    document.body.appendChild(toastContainer);
  }

  // Create a unique ID for this toast
  const toastId = uniqueRequestId || `toast-${Date.now()}`;

  // Don't show duplicate toasts
  if (activeToasts.has(toastId)) return;
  activeToasts.add(toastId);

  // Create root if it doesn't exist
  if (!toastContainer._root) {
    toastContainer._root = createRoot(toastContainer);
  }

  const closeToast = () => {
    activeToasts.delete(toastId);
    // Delay unmounting to allow animations to complete
    setTimeout(() => {
      toastContainer._root.unmount();
      if (activeToasts.size === 0) {
        toastContainer.remove();
      }
    }, 300);
  };

  toastContainer._root.render(
    <TransactionStatusModal
      key={toastId}
      status={status}
      message={message}
      uniqueRequestId={uniqueRequestId}
      onClose={closeToast}
    />
  );

  // Auto-close for success messages after 5 seconds
  if (status === "success") {
    setTimeout(closeToast, 5000);
  }
};

// Create the toast object
const transactionToast = {
  success: (message, uniqueRequestId) =>
    showTransactionToast({ status: "success", message, uniqueRequestId }),

  warning: (message, uniqueRequestId) =>
    showTransactionToast({ status: "warning", message, uniqueRequestId }),

  error: (message, uniqueRequestId) =>
    showTransactionToast({ status: "error", message, uniqueRequestId }),

  show: (options) => showTransactionToast(options),
};

export default transactionToast;
