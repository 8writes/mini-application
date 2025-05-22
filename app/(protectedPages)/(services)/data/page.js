"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { useGlobalContext } from "@/context/GlobalContext";
import { FaWifi } from "react-icons/fa";
import Image from "next/image";

export default function Page() {
  const { user, isLoading } = useGlobalContext();
  const [phone, setPhone] = useState("");
  const [selectedISP, setSelectedISP] = useState("");
  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [isps, setIsps] = useState([]);
  const [activeTab, setActiveTab] = useState("Special");

  const tabOrder = ["Special", "Daily", "Weekly", "Monthly"];

  const addGain = (baseAmount) => {
    return Math.round(Number(baseAmount) * 1.01); // 1% gain
  };

  const detectISPFromPhone = (phone) => {
    const cleaned = phone.replace(/\D/g, "").slice(0, 4); // Only digits, first 4
    const mapping = {
      "mtn-data": [
        "0803",
        "0806",
        "0810",
        "0813",
        "0814",
        "0816",
        "0903",
        "0906",
        "0703",
      ],
      "glo-data": ["0805", "0807", "0811", "0815", "0905", "0705"],
      "airtel-data": ["0802", "0808", "0812", "0701", "0902", "0901", "0907"],
      "etisalat-data": ["0809", "0817", "0818", "0908", "0909"],
    };

    for (const [serviceID, prefixes] of Object.entries(mapping)) {
      if (prefixes.includes(cleaned)) {
        return serviceID;
      }
    }

    return null;
  };

  useEffect(() => {
    if (phone.length >= 4) {
      const detectedISP = detectISPFromPhone(phone);
      if (detectedISP && detectedISP !== selectedISP) {
        // Only set if detected and different
        setSelectedISP(detectedISP);
      }
    }
  }, [phone]);

  const cleanPlanName = (name) => {
    return name
      .replace(/\s*-\s*[\d,]+(?:\.\d+)?\s*Naira/i, "") // removes - 1,500 Naira
      .replace(/\s*N\d+(?:,\d{3})*(?:\.\d+)?\s*/i, "") // removes N200 or N2,000 etc anywhere
      .trim();
  };

  const categorizePlans = (variations) => {
    const groups = { Daily: [], Weekly: [], Monthly: [], Special: [] };

    variations.forEach((plan) => {
      const name = cleanPlanName(plan.name).toLowerCase();

      if (name.includes("24 hrs") || name.includes("1 day"))
        groups.Daily.push(plan);
      else if (name.includes("7 days") || name.includes("week"))
        groups.Weekly.push(plan);
      else if (name.includes("30 days") || name.includes("month"))
        groups.Monthly.push(plan);
      else groups.Special.push(plan);
    });

    return groups;
  };

  useEffect(() => {
    const fetchISPs = async () => {
      try {
        const res = await axios.get(
          "https://sandbox.vtpass.com/api/services?identifier=data",
          {
            headers: {
              "api-key": "a494a966debe749ecafb59b02305d4a0",
              "public-key": "PK_276d0fdcd21705adbe843ccfc6943aeca59ef5f22e4",
            },
          }
        );
        const dataISPs = res.data.content || [];
        setIsps(dataISPs);
        setSelectedISP(dataISPs[0]?.serviceID || "");
      } catch (err) {
        console.error("Error fetching ISPs:", err);
      }
    };

    fetchISPs();
  }, []);

  useEffect(() => {
    const fetchPlans = async () => {
      if (!selectedISP) return;
      try {
        setLoadingPlans(true);
        const res = await axios.get(
          `https://sandbox.vtpass.com/api/service-variations?serviceID=${selectedISP}`,
          {
            headers: {
              "api-key": "a494a966debe749ecafb59b02305d4a0",
              "public-key": "PK_276d0fdcd21705adbe843ccfc6943aeca59ef5f22e4",
            },
          }
        );
        const variations = res.data.content.variations || [];

        console.log(variations);

        // Clean names
        const cleaned = variations.map((v) => ({
          ...v,
          name: cleanPlanName(v.name),
        }));

        setPlans(categorizePlans(cleaned));
      } catch (err) {
        console.error("Error fetching data plans:", err);
      } finally {
        setLoadingPlans(false);
      }
    };

    fetchPlans();
  }, [selectedISP]);

  if (!user || isLoading) {
    return (
      <div className="flex items-center justify-center h-[30rem]">
        <img
          src="/icons/loader-white.svg"
          alt="Loading..."
          className="w-20 h-20"
        />
      </div>
    );
  }

  return (
    <section className="p-4 max-w-6xl mx-auto">
      <h1 className="text-2xl md:text-3xl font-bold mb-6 uppercase">
        Data Subscription
      </h1>

      {/* ISP Select + Phone Input */}
      <div className="flex flex-col md:flex-row items-center gap-4 mb-8">
        <div className="relative w-full md:w-1/2">
          <select
            value={selectedISP}
            onChange={(e) => setSelectedISP(e.target.value)}
            className="appearance-none w-full px-4 py-3 rounded-lg bg-gray-900 text-white border border-gray-700 pr-10"
          >
            {isps.map((isp) => (
              <option key={isp.serviceID} value={isp.serviceID}>
                {isp.name}
              </option>
            ))}
          </select>
          <div className="absolute top-3 right-4">
            <Image
              src={
                isps.find((isp) => isp.serviceID === selectedISP)?.image ||
                "/icons/user.png"
              }
              alt="ISP logo"
              width={30}
              height={30}
            />
          </div>
        </div>
        <input
          type="tel"
          placeholder="Enter phone number"
          value={phone || ""}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full md:w-1/2 px-4 py-3 rounded-lg bg-gray-900 text-white border border-gray-700"
        />
      </div>

      {/* Loading */}
      {loadingPlans ? (
        <div className="text-center">
          <img
            src="/icons/loader-white.svg"
            alt="Loading plans..."
            className="w-10 h-10 mx-auto"
          />
        </div>
      ) : (
        <>
          {/* Tabs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {tabOrder.map((category) => (
              <button
                key={category}
                onClick={() => setActiveTab(category)}
                className={`px-4 py-2 rounded-full border cursor-pointer transition ${
                  activeTab === category
                    ? "bg-blue-500 text-white border-blue-500"
                    : "bg-gray-800 text-white border-gray-700"
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Plans for active tab */}
          {plans[activeTab]?.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {plans[activeTab].map((plan, index) => (
                <div
                  key={`${selectedISP}-${plan.variation_code}-${index}`}
                  className="bg-gray-800 p-3 rounded-md border cursor-pointer border-gray-700 hover:border-blue-400 transition-all text-sm"
                >
                  <FaWifi className="text-blue-400 text-lg mb-1" />
                  <h3 className="text-white font-semibold text-sm md:text-base">
                    {plan.name}
                  </h3>
                  <p className="text-blue-300 mt-1">
                    ₦{addGain(plan.variation_amount).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center pt-4">
              No {activeTab} plans available.
            </p>
          )}
        </>
      )}
    </section>
  );
}
