// components/PinDialog.js
"use client";
import { useGlobalContextData } from "@/context/GlobalContextData";
import Link from "next/link";
import { useState } from "react";
import { HiX, HiCheck, HiEye, HiEyeOff } from "react-icons/hi";

export const PinDialog = ({
  isOpen,
  onConfirm,
  onCancel,
  error,
  isLoading,
}) => {
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const { wallet } = useGlobalContextData();

  if (!isOpen) return null;

  const handlePinChange = (e) => {
    const value = e.target.value;
    if (/^\d*$/.test(value) && value.length <= 4) {
      setPin(value);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (pin.length === 4) {
      onConfirm(pin);
    } else {
      onConfirm(true);
    }
    setPin("");
  };

  const handleNoPin = (e) => {
    e.preventDefault();
    onConfirm(true);
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md border border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Enter Your PIN</h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-white cursor-pointer"
          >
            <HiX size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {wallet.pin ? (
            <>
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-300">
                  4-Digit PIN
                </label>
                <div className="relative">
                  <input
                    type={showPin ? "tel" : "password"}
                    value={pin}
                    onChange={handlePinChange}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none"
                    placeholder="••••"
                    inputMode="numeric"
                    autoFocus
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer text-gray-400 hover:text-white"
                    onClick={() => setShowPin(!showPin)}
                  >
                    {showPin ? <HiEyeOff size={20} /> : <HiEye size={20} />}
                  </button>
                </div>
              </div>
              <div className="flex w-full gap-3 pt-2">
                <button
                  type="button"
                  onClick={onCancel}
                  className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors cursor-pointer"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-600/20 disabled:cursor-not-allowed rounded-lg transition-colors cursor-pointer"
                  disabled={pin.length !== 4 || isLoading}
                >
                  {isLoading ? "Verifying..." : <>Confirm</>}
                </button>
              </div>{" "}
            </>
          ) : (
            <>
              <label className="block mb-2 text-sm font-medium text-gray-300">
                You can now set a 4-Digit PIN to secure your wallet.
              </label>
              <label
                onClick={onCancel}
                className="block mb-2 text-sm font-medium text-gray-300"
              >
                <Link
                  href="/profile"
                  className="text-base text-blue-500 underline"
                >
                  PIN Settings
                </Link>
              </label>
              <div className="flex w-full gap-3 pt-2">
                <button
                  type="button"
                  onClick={onCancel}
                  className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors cursor-pointer"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleNoPin}
                  className="flex-1 px-4 py-3 text-sm bg-green-600 hover:bg-green-700 disabled:bg-green-600/20 disabled:cursor-not-allowed rounded-lg transition-colors cursor-pointer"
                >
                  Proceed without PIN
                </button>
              </div>{" "}
            </>
          )}
        </form>
      </div>
    </div>
  );
};
