import { toast } from "react-toastify";

export const callApi = async (endpoint, method = "GET", body = null) => {
  const { token } = await fetch("/api/wrapper/auth-check").then((res) =>
    res.json()
  );

  const headers = {
    "Content-Type": "application/json",
    "X-CSRF-Token": token,
    Authorization: `Bearer ${process.env.NEXT_PUBLIC_BILLZ_AUTH_KEY}`,
  };

  const res = await fetch(`/api/wrapper/${endpoint}`, {
    method,
    headers,
    credentials: "include",
    body: body ? JSON.stringify(body) : null,
  });

  const data = await res.json();

  if (!res.ok) {
    toast.error(data.message || "API error");
    return;
  }

  return data;
};
