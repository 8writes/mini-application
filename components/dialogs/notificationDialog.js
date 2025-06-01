"use client";

import { useState } from "react";
import { billzpaddi } from "@/lib/client";
import { toast } from "react-toastify";

export default function NotificationDialog({ userId, onClose }) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await billzpaddi.from("notifications").insert({
        user_id: userId,
        message,
        is_read: false,
      });

      if (error) throw error;

      toast.success("Notification sent successfully!");
      onClose();
    } catch (err) {
      toast.error("Error sending notification");
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 text-white p-6 rounded-lg max-w-md w-full">
        <h2 className="text-xl font-semibold mb-4">Send Notification</h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-300 mb-2">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full p-2 border rounded outline-none"
              rows="4"
              required
            />
          </div>

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded cursor-pointer"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 cursor-pointer text-white rounded"
              disabled={loading}
            >
              {loading ? "Sending..." : "Send"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
