"use client";
import { billzpaddi } from "@/lib/client";
import { useRouter } from "next/navigation";
import { createContext, useContext, useState, useEffect } from "react";
import { toast } from "react-toastify";

// context for global data
const GlobalContext = createContext();

// custom hook to use the GlobalContext
export const useGlobalContext = () => {
  return useContext(GlobalContext);
};

export const GlobalProvider = ({ children }) => {
  const [user, setUser] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const router = useRouter();

  // Fetch data
  const fetchData = async () => {
    setIsLoading(true);

    // check for token
    const tokenString = localStorage.getItem(
      "sb-xwgqadrwygwhwvqcwsde-auth-token"
    );
    const token = tokenString ? JSON.parse(tokenString) : null;

    if (!token) {
      toast.error("User not authenticated", {
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

      // set the user data in the context
      setUser(data);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setIsLoading(false);
    }
  };
  // Fetch data
  useEffect(() => {
    fetchData();
  }, [router]);

  // handle logout
  const handleLogout = async () => {
    try {
      const { error } = await billzpaddi.auth.signOut();

      if (!error) {
        // check for token
        localStorage.removeItem("sb-xwgqadrwygwhwvqcwsde-auth-token");
        router.push("/auth/login");
      } else {
        localStorage.removeItem("sb-xwgqadrwygwhwvqcwsde-auth-token");
        router.push("/auth/login");
      }
    } catch (err) {
      console.error("Error during logout:", err);
    }
  };

  return (
    <GlobalContext.Provider
      value={{
        user,
        isLoading,
        isSidebarOpen,
        setIsSidebarOpen,
        fetchData,
        handleLogout,
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
};
