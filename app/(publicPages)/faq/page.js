"use client";

import { useState } from "react";
import {
  FaChevronDown,
  FaChevronUp,
  FaWhatsapp,
  FaLock,
  FaShieldAlt,
  FaUserLock,
  FaCreditCard,
  FaEnvelope,
} from "react-icons/fa";

export default function Page() {
  const [activeIndex, setActiveIndex] = useState(null);

  const toggleFAQ = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  const faqs = [
    {
      question: "Is my payment information secure with BillzPaddi?",
      answer:
        "Absolutely. We use bank-level 256-bit SSL encryption to protect all transactions. Your payment details are never stored on our servers and are processed through PCI-DSS compliant payment gateways.",
      icon: <FaLock className="text-blue-400 mr-3" />,
      category: "security",
    },
    {
      question:
        "What should I do if a transaction fails but my account was debited?",
      answer:
        "Don't worry! First, wait 5-10 minutes as some transactions may take time to process. If the issue persists, contact our support team with your transaction reference number. We'll investigate and ensure you get either the service you paid for or a full refund within 24 hours.",
      icon: <FaCreditCard className="text-blue-400 mr-3" />,
      category: "transactions",
    },
    {
      question: "How does BillzPaddi protect my personal data?",
      answer:
        "We adhere to strict data protection regulations. Your personal information is encrypted and only used to provide our services. We never sell or share your data with third parties without your consent, except as required by law.",
      icon: <FaUserLock className="text-blue-400 mr-3" />,
      category: "privacy",
    },
    {
      question: "Why was my account temporarily suspended?",
      answer:
        "Accounts may be suspended if we detect unusual activity to prevent fraud. This could include multiple failed login attempts, suspicious transactions, or violation of our terms. Contact support to verify your identity and restore access.",
      icon: <FaShieldAlt className="text-blue-400 mr-3" />,
      category: "account",
    },
    {
      question: "How long does it take to receive purchased airtime/data?",
      answer:
        "95% of transactions are completed within 30 seconds. During high traffic periods, it may take up to 5 minutes. If you haven't received your purchase after 10 minutes, please contact support with your transaction details.",
      icon: <FaCreditCard className="text-blue-400 mr-3" />,
      category: "services",
    },
    {
      question: "Can I get a refund for a service I purchased?",
      answer:
        "Refunds are available for failed transactions or undelivered services. For accidental purchases, we review each case individually. Refund requests must be made within 7 days of the transaction.",
      icon: <FaCreditCard className="text-blue-400 mr-3" />,
      category: "transactions",
    },
    {
      question: "What security measures protect my account?",
      answer:
        "We employ multiple layers of security including: Two-Factor Authentication (2FA), login alerts, device recognition, and regular security audits. We recommend using a strong, unique password and enabling 2FA for maximum protection.",
      icon: <FaShieldAlt className="text-blue-400 mr-3" />,
      category: "security",
    },
    {
      question: "How do I report suspicious activity on my account?",
      answer:
        "Immediately contact our support team through the official channels if you notice any unauthorized activity. Change your password and enable 2FA if available. We monitor for fraud 24/7 and will take immediate action to secure your account.",
      icon: <FaLock className="text-blue-400 mr-3" />,
      category: "security",
    },
  ];

  const categories = [
    { id: "all", name: "All Questions" },
    { id: "security", name: "Security" },
    { id: "privacy", name: "Privacy" },
    { id: "transactions", name: "Transactions" },
    { id: "account", name: "Account" },
    { id: "services", name: "Services" },
  ];

  const [activeCategory, setActiveCategory] = useState("all");

  const filteredFAQs =
    activeCategory === "all"
      ? faqs
      : faqs.filter((faq) => faq.category === activeCategory);

  return (
    <div className="min-h-[100dvh] bg-gray-800 text-white py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Find answers to common questions about our services, security
            measures, and account management.
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-3 justify-center mb-8">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium cursor-pointer transition-colors ${
                activeCategory === category.id
                  ? "bg-blue-600 text-white"
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700"
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* FAQ List */}
        <div className="space-y-4">
          {filteredFAQs.map((faq, index) => (
            <div
              key={index}
              className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden"
            >
              <button
                className="w-full flex items-center cursor-pointer justify-between p-5 text-left"
                onClick={() => toggleFAQ(index)}
              >
                <div className="flex items-center">
                  {faq.icon}
                  <span className="font-medium">{faq.question}</span>
                </div>
                {activeIndex === index ? (
                  <FaChevronUp className="text-gray-400" />
                ) : (
                  <FaChevronDown className="text-gray-400" />
                )}
              </button>

              {activeIndex === index && (
                <div className="px-5 pb-5 pt-2 bg-gray-800/50 border-t border-gray-700">
                  <p className="text-gray-300">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Support CTA */}
        <div className="mt-12 text-center">
          <h3 className="text-xl font-semibold mb-4">Still have questions?</h3>
          <p className="text-gray-400 mb-6">
            Our support team is available 24/7 to assist you with any other
            inquiries.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://wa.me/2349011023653"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg flex items-center justify-center gap-3 transition-colors"
            >
              <FaWhatsapp />
              WhatsApp Support
            </a>
            <a
              href="mailto:support@billzpaddi.com.ng"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center justify-center gap-3 transition-colors"
            >
              <FaEnvelope />
              Email Us
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
