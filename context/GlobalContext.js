"use client";

import { billzpaddi } from "@/app/api/client/client";
import { useRouter } from "next/navigation";
import { createContext, useContext, useState, useEffect } from "react";
import { toast } from "react-toastify";

const GlobalContext = createContext();

export const useGlobalContext = () => useContext(GlobalContext);

export const GlobalProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const router = useRouter();

  // Get user ID from stored token
  const getUserIdFromToken = () => {
    const token = JSON.parse(
      localStorage.getItem("sb-xwgqadrwygwhwvqcwsde-auth-token") || "null"
    );
    return token?.user?.id || null;
  };

  // Check authentication status only (no user fetching)
  const checkAuthStatus = async () => {
    try {
      const {
        data: { session },
        error,
      } = await billzpaddi.auth.getSession();
      return true;
    } catch (err) {
      console.error("Auth check failed:", err);
      return false;
    }
  };

  // Fetch user data using token's user ID
  const fetchUserData = async () => {
    setIsLoading(true);
    const userId = getUserIdFromToken();

    if (!userId) {
      await handleLogout();
      return;
    }

    try {
      const { data: userData, error } = await billzpaddi
        .from("users")
        .select()
        .eq("user_id", userId)
        .single();

      if (error || !userData) throw error || new Error("User not found");

      if (userData.status === false) {
        toast.error("Account restricted. Contact support.", {
          toastId: "account-disabled",
          autoClose: false,
        });
        await handleLogout();
        return;
      }

      setUser(userData);
    } catch (err) {
      console.error("User fetch error:", err);
      await handleLogout();
      localStorage.removeItem("sb-xwgqadrwygwhwvqcwsde-auth-token");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await billzpaddi.auth.signOut();
      localStorage.removeItem("sb-xwgqadrwygwhwvqcwsde-auth-token");
      router.push("/auth/login");
    } catch (err) {
      console.error("Signout error:", err);
    } finally {
      localStorage.removeItem("sb-xwgqadrwygwhwvqcwsde-auth-token");
      setUser(null);
      router.push("/auth/login");
    }
  };

  const initialize = async () => {
    const isAuthenticated = await checkAuthStatus();
    if (!isAuthenticated) {
      await handleLogout();
      localStorage.removeItem("sb-xwgqadrwygwhwvqcwsde-auth-token");
      return;
    }
  };

  useEffect(() => {
    fetchUserData();
    initialize();
  }, []);

  return (
    <GlobalContext.Provider
      value={{
        user,
        isLoading,
        isSidebarOpen,
        setIsSidebarOpen,
        handleLogout,
        getUserIdFromToken,
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
};
