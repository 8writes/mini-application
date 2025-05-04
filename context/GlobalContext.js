"use client";
import { useRouter } from "next/navigation";
import { createContext, useContext, useState, useEffect } from "react";

// context for global data
const GlobalContext = createContext();

// custom hook to use the GlobalContext
export const useGlobalContext = () => {
  return useContext(GlobalContext);
};

export const GlobalProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // check if user is authenticated
        const authResponse = await fetch("/api/auth/authCheck");
        const authData = await authResponse.json();

        // check for token
        const token = localStorage.getItem("token_mini_app");

        if (authData.authenticated && token) {
          // if user is logged in
          const { user } = authData;

          // fetch user data using userId
          const userResponse = await fetch(`/api/users/${user.userId}`);
          const userData = await userResponse.json();

          // set the user data in the context
          setUser(userData.user);
        } else {
          router.push("/auth/login");
        }

        // validate the token in localstorage
        const itemStr = localStorage.getItem("token_mini_app");

        if (itemStr) {
          const item = JSON.parse(itemStr);
          if (Date.now() > item.expiry) {
            localStorage.removeItem("token_mini_app");
          }
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
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
};
