// context/PinContext.js
"use client";
import { createContext, useContext, useState } from "react";
import CryptoJS from "crypto-js";
import { billzpaddi } from "@/lib/client";
import { PinDialog } from "@/components/dialogs/pinDialog";
import { useGlobalContext } from "./GlobalContext";
import { toast } from "react-toastify";

const PinContext = createContext();

export const PinProvider = ({ children }) => {
  const { user } = useGlobalContext();
  const [isPinDialogOpen, setIsPinDialogOpen] = useState(false);
  const [pinCallback, setPinCallback] = useState(null);
  const [pinError, setPinError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  const decryptPin = (encryptedPin) => {
    const secretKey =
      process.env.NEXT_PUBLIC_BILLZ_AUTH_KEY || "default-secret-key";
    const bytes = CryptoJS.AES.decrypt(encryptedPin, secretKey);
    return bytes.toString(CryptoJS.enc.Utf8);
  };

  const verifyPin = async (userId, enteredPin) => {
    try {
      const { data, error } = await billzpaddi
        .from("wallets")
        .select("pin")
        .eq("user_id", userId)
        .single();

      if (error || !data) {
        throw new Error("No PIN found for this user");
      }

      const decryptedPin = decryptPin(data.pin);
      return decryptedPin === enteredPin;
    } catch (error) {
      console.error("PIN verification error:", error);
      return false;
    }
  };

  const showPinDialog = () => {
    return new Promise((resolve) => {
      setPinCallback(() => resolve);
      setIsPinDialogOpen(true);
    });
  };

  const handlePinSubmit = async (enteredPin) => {
    setIsVerifying(true);
    setPinError("");

    try {
      if (enteredPin === true) {
        pinCallback(true);
        setIsPinDialogOpen(false);
        return;
      }
      const isValid = await verifyPin(user?.user_id, enteredPin);
      if (isValid) {
        pinCallback(true);
        setIsPinDialogOpen(false);
      } else {
        setPinError("Invalid PIN");
        toast.error("Invalid PIN. Please try again.");
      }
    } catch (error) {
      setPinError("Verification failed");
      toast.error("Verification failed. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handlePinCancel = () => {
    pinCallback(false);
    setIsPinDialogOpen(false);
  };

  return (
    <PinContext.Provider value={{ showPinDialog }}>
      {children}
      <PinDialog
        isOpen={isPinDialogOpen}
        onConfirm={handlePinSubmit}
        onCancel={handlePinCancel}
        error={pinError}
        isLoading={isVerifying}
      />
    </PinContext.Provider>
  );
};

export const usePin = () => {
  const context = useContext(PinContext);
  if (!context) {
    throw new Error("usePin must be used within a PinProvider");
  }
  return context;
};
