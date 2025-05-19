"use client";
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
  const [user, setUser] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const router = useRouter();

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // check if user is authenticated
        const authResponse = await fetch("/api/auth/authCheck");
        const authData = await authResponse.json();

        // validate the token in localstorage
        const tokenValidate = localStorage.getItem("token_mini_app");

        if (tokenValidate) {
          const item = JSON.parse(tokenValidate);
          if (Date.now() > item.expiry) {
            localStorage.removeItem("token_mini_app");
            router.push("/auth/login");
            return;
          }
        }

        // check for token
        const token = localStorage.getItem("token_mini_app");

        if (authData.authenticated && token) {
          // if user is logged in
          const { user } = authData;

          // fetch user data using userId
          const userResponse = await fetch(`/api/users/${user?.userId}`);
          const userData = await userResponse.json();

          // set the user data in the context
          setUser(userData?.user);
        } else {
          toast.error("User not authenticated");
          router.push("/auth/login");
        }

        setIsLoading(false);
      } catch (err) {
        console.error("Error fetching data:", err);
        setIsLoading(false);
      }
    };

    fetchData();
  }, [router]);

  return (
    <GlobalContext.Provider
      value={{
        user,
        isLoading,
        isSidebarOpen,
        setIsSidebarOpen,
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
};
