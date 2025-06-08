"use client";
import { useState, useEffect } from "react";
import { FaWifi, FaSignal, FaUnlink } from "react-icons/fa";

const NetworkIndicator = () => {
  const [status, setStatus] = useState({
    icon: <FaWifi />,
    color: "text-gray-500",
    label: "Offline",
  });

  useEffect(() => {
    // Only run on client side
    const updateStatus = () => {
      const isOnline =
        typeof navigator !== "undefined" ? navigator.onLine : true;
      let networkQuality = "unknown";

      if (typeof navigator !== "undefined" && "connection" in navigator) {
        const conn =
          navigator.connection ||
          navigator.mozConnection ||
          navigator.webkitConnection;
        networkQuality = conn?.effectiveType || "unknown";
      }

      if (!isOnline) {
        setStatus({
          icon: <FaUnlink />,
          color: "text-red-500",
          label: "Offline",
        });
        return;
      }

      switch (networkQuality) {
        case "slow-2g":
        case "2g":
          setStatus({
            icon: <FaSignal />,
            color: "text-red-500",
            label: "2G",
          });
          break;
        case "3g":
          setStatus({
            icon: <FaSignal />,
            color: "text-yellow-500",
            label: "3G",
          });
          break;
        case "4g":
          setStatus({
            icon: <FaWifi />,
            color: "text-green-500",
            label: "4G",
          });
          break;
        case "5g":
          setStatus({
            icon: <FaWifi />,
            color: "text-green-500",
            label: "5G",
          });
          break;
        default:
          setStatus({
            icon: <FaWifi />,
            color: "text-gray-500",
            label: "Online",
          });
      }
    };

    updateStatus();

    // Set up event listeners
    if (typeof window !== "undefined") {
      window.addEventListener("online", updateStatus);
      window.addEventListener("offline", updateStatus);

      if ("connection" in navigator) {
        const conn =
          navigator.connection ||
          navigator.mozConnection ||
          navigator.webkitConnection;
        conn.addEventListener("change", updateStatus);
      }
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("online", updateStatus);
        window.removeEventListener("offline", updateStatus);

        if ("connection" in navigator) {
          const conn =
            navigator.connection ||
            navigator.mozConnection ||
            navigator.webkitConnection;
          conn.removeEventListener("change", updateStatus);
        }
      }
    };
  }, []);

  return (
    <div className="flex items-center gap-2">
      <span className={`${status.color} text-lg`}>{status.icon}</span>
      <span className="text-sm font-medium">{status.label}</span>
    </div>
  );
};

export default NetworkIndicator;
