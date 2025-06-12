"use client";
import { billzpaddi } from "@/lib/client";
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

  // Check and maintain user session
  const checkSession = async () => {
    setIsLoading(true);
    try {
      const {
        data: { session },
        error,
      } = await billzpaddi.auth.getSession();

      if (!session || error) {
        await handleLogout();
        return;
      }

      const { data: userData, error: userError } = await billzpaddi
        .from("users")
        .select()
        .eq("user_id", session.user.id)
        .single();

      if (userError || !userData)
        throw userError || new Error("User data not found");
      if (userData.status === false) {
        toast.error("Your account is restricted. Please contact support.", {
          toastId: "account-disabled",
          autoClose: false,
        });
        await handleLogout();
        return;
      }

      setUser(userData);
    } catch (err) {
      console.error("Session check failed:", err);
      await handleLogout();
    } finally {
      setIsLoading(false);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await billzpaddi.auth.signOut();
      localStorage.removeItem("sb-xwgqadrwygwhwvqcwsde-auth-token");
      setUser(null);
      router.push("/auth/login");
    } catch (err) {
      console.error("Logout error:", err);
      // Force cleanup if Supabase logout fails
      localStorage.removeItem("sb-xwgqadrwygwhwvqcwsde-auth-token");
      router.push("/auth/login");
    }
  };

  // Set up auth state listener
  useEffect(() => {
    const {
      data: { subscription },
    } = billzpaddi.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT") {
        await handleLogout();
      } else if (session) {
        await checkSession();
      }
    });

    // Initial session check
    checkSession();

    return () => subscription?.unsubscribe();
  }, []);

  return (
    <GlobalContext.Provider
      value={{
        user,
        isLoading,
        isSidebarOpen,
        setIsSidebarOpen,
        handleLogout,
        checkSession,
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
};
