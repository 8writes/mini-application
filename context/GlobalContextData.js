"use client";
import { billzpaddi } from "@/app/api/client/client";
import { callApi } from "@/utils/apiClient";
import { useRouter } from "next/navigation";
import { createContext, useContext, useState, useEffect } from "react";
import { toast } from "react-toastify";

// Context for global data
const GlobalContextData = createContext();

// Custom hook to use the GlobalContextData
export const useGlobalContextData = () => {
  return useContext(GlobalContextData);
};

export const GlobalProviderData = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [uniqueRequestId, setUniqueRequestId] = useState();

  // Set up real-time subscriptions
  useEffect(() => {
    if (!user) return;

    // Wallet subscription
    const walletSubscription = billzpaddi
      .channel("wallet_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "wallets",
          filter: `user_id=eq.${user.user_id}`,
        },
        (payload) => {
          setWallet(payload.new);
        }
      )
      .subscribe();

    // Transactions subscription
    const transactionsSubscription = billzpaddi
      .channel("transactions_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "transactions",
          filter: `user_id=eq.${user.user_id}`,
        },
        () => {
          fetchTransactions(); // Refresh transactions list
        }
      )
      .subscribe();

    return () => {
      billzpaddi.removeChannel(walletSubscription);
      billzpaddi.removeChannel(transactionsSubscription);
    };
  }, [user]);

  // Fetch user data
  const fetchUserData = async () => {
    setIsLoading(true);

    // check for token
    const tokenString = localStorage.getItem(
      "sb-xwgqadrwygwhwvqcwsde-auth-token"
    );
    const token = tokenString ? JSON.parse(tokenString) : null;

    if (!token) {
      toast.error("Please login", {
        toastId: "auth",
      });
      router.push("/auth/login");

      return;
    }

    try {
      const { data, error } = await billzpaddi
        .from("users")
        .select()
        .eq("user_id", token?.user?.id)
        .single();

      if (error) throw error;

      if (data.status === false) {
        return;
      }

      setUser(data);
    } catch (err) {
      toast.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data
  useEffect(() => {
    fetchUserData();
  }, [router]);

  // Fetch user wallet
  const fetchWallet = async () => {
    if (!user) return;

    try {
      const result = await callApi("wallet/fetch", "POST", {
        user_id: user.user_id,
      });

      setWallet(result);
    } catch (err) {
      console.error("Wallet fetch error:", err);
      toast.error("Failed to load wallet data");
    }
  };

  // Fetch user transactions
  const fetchTransactions = async () => {
    if (!user) return;
    try {
      const { data, error } = await billzpaddi
        .from("transactions")
        .select()
        .eq("user_id", user?.user_id)
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
    fetchWallet();
    fetchTransactions();
  }, [user]);

  const getUniqueRequestId = () => {
    const lagosOffset = 60 * 60 * 1000; // Africa/Lagos is GMT+1
    const lagosDate = new Date(Date.now() + lagosOffset);

    const pad = (n) => (n < 10 ? "0" + n : n);

    const YYYY = lagosDate.getUTCFullYear();
    const MM = pad(lagosDate.getUTCMonth() + 1);
    const DD = pad(lagosDate.getUTCDate());
    const HH = pad(lagosDate.getUTCHours());
    const mm = pad(lagosDate.getUTCMinutes());

    const timestamp = `${YYYY}${MM}${DD}${HH}${mm}`;
    const randomStr = Math.random().toString(36).substring(2, 10); // e.g., 'ak7e3d8h'

    return `${timestamp}${randomStr}`;
  };

  const regenerateUniqueRequestId = () => {
    setUniqueRequestId(getUniqueRequestId());
  };

  return (
    <GlobalContextData.Provider
      value={{
        isLoading,
        wallet,
        transactions,
        fetchWallet,
        fetchTransactions,
        uniqueRequestId,
        getUniqueRequestId: regenerateUniqueRequestId,
      }}
    >
      {children}
    </GlobalContextData.Provider>
  );
};
