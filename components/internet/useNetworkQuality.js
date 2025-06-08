import { useEffect, useState } from "react";

const useNetworkQuality = () => {
  const getEffectiveType = () =>
    navigator.connection?.effectiveType || "unknown";

  const [networkQuality, setNetworkQuality] = useState(getEffectiveType);

  useEffect(() => {
    if (navigator.connection) {
      const updateQuality = () => {
        setNetworkQuality(getEffectiveType());
      };
      navigator.connection.addEventListener("change", updateQuality);

      return () => {
        navigator.connection.removeEventListener("change", updateQuality);
      };
    }
  }, []);

  return networkQuality;
};

export default useNetworkQuality;
