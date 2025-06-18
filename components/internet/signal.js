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
    const updateStatus = () => {
      const isOnline =
        typeof navigator !== "undefined" ? navigator.onLine : true;
      let networkType = "unknown";
      let downlinkSpeed = 0;

      if (typeof navigator !== "undefined" && "connection" in navigator) {
        const conn =
          navigator.connection ||
          navigator.mozConnection ||
          navigator.webkitConnection;
        networkType = conn?.effectiveType || "unknown";
        downlinkSpeed = conn?.downlink || 0;
      }

      if (!isOnline) {
        setStatus({
          icon: <FaUnlink />,
          color: "text-red-500",
          label: "Offline",
        });
        return;
      }

      // Improved detection that works on mobile and desktop
      if (networkType === "unknown" && downlinkSpeed > 0) {
        // Estimate network type based on speed if effectiveType isn't available
        if (downlinkSpeed > 10) networkType = "4g";
        else if (downlinkSpeed > 5) networkType = "3g";
        else if (downlinkSpeed > 0.5) networkType = "2g";
      }

      switch (networkType) {
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
          // For unknown types, show speed if available
          const label =
            downlinkSpeed > 0 ? `${downlinkSpeed.toFixed(1)} Mbps` : "";
          setStatus({
            icon: <FaWifi />,
            color: "text-green-500",
            label,
          });
      }
    };

    updateStatus();

    // Event listeners
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
