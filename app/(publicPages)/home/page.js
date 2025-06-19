import Link from "next/link";
import {
  HiOutlinePhone,
  HiChartBar,
  HiOutlineDesktopComputer,
  HiOutlineCash,
  HiOutlineClipboardCheck,
  HiOutlineShieldCheck,
  HiOutlineLightningBolt,
  HiOutlineCurrencyDollar,
  HiOutlineShoppingBag,
  HiOutlineShoppingCart,
} from "react-icons/hi";
import { FaGamepad, FaHandHoldingUsd } from "react-icons/fa";
import { FiClock } from "react-icons/fi";
import Image from "next/image";

export default function ServicesPage() {
  const services = [
    {
      name: "Airtime Top-Up",
      icon: <HiOutlinePhone className="w-6 h-6" />,
      href: "/airtime",
      description: "Instant airtime recharge",
      features: ["Instant delivery", "All networks supported", "24/7 service"],
    },
    {
      name: "Data Bundles",
      icon: <HiChartBar className="w-6 h-6" />,
      href: "/data",
      description: "Discounted data plans",
      features: [
        "Instant delivery",
        "All major providers",
        "Flexible validity",
      ],
    },
    {
      name: "TV Subscriptions",
      icon: <HiOutlineDesktopComputer className="w-6 h-6" />,
      href: "/tv",
      description: "TV subscriptions and renewals",
      features: [
        "Instant delivery",
        "DSTV, GOTV, Startimes",
        "Guided activation",
      ],
    },
    {
      name: "Business Solutions",
      icon: <HiOutlineClipboardCheck className="w-6 h-6" />,
      href: "/generate-invoice",
      description: "Professional invoice generation",
      features: ["Instant delivery", "Invoice generation", "Email delivery"],
    },
  ];

  const trustFactors = [
    {
      icon: <HiOutlineShieldCheck className="w-5 h-5" />,
      title: "Secure Transactions",
      description: "Powered by trusted payment providers",
    },
    {
      icon: <HiOutlineLightningBolt className="w-5 h-5" />,
      title: "Instant Delivery",
      description: "99.9% of transactions complete within 30 seconds",
    },
    {
      icon: <FaHandHoldingUsd className="w-5 h-5" />,
      title: "Best Rates",
      description: "Competitive pricing with no hidden charges",
    },
    {
      icon: <FiClock className="w-5 h-5" />,
      title: "24/7 Support",
      description: "Dedicated customer support anytime you need",
    },
  ];

  // Add this new comparison data
  const dataDiscountComparison = [
    {
      provider: "MTN",
      billzPaddiDiscount: "1.2%",
      icon: "/icons/mtn-logo.webp",
      amount: 5000,
    },
    {
      provider: "Glo",
      billzPaddiDiscount: "1.4%",
      icon: "/icons/glo-logo.webp",
      amount: 5000,
    },
    {
      provider: "Airtel",
      billzPaddiDiscount: "1.3%",
      icon: "/icons/airtel-logo.webp",
      amount: 5000,
    },
    {
      provider: "9mobile",
      billzPaddiDiscount: "1.4%",
      icon: "/icons/9mobile-logo.webp",
      amount: 5000,
    },
  ];

  return (
    <div className="min-h-[80dvh] text-white bg-gray-800">
      {/** Hero section */}
      <section className="pt-40 pb-7 text-center px-2">
        <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4">
          Explore Our Services
        </h2>
        <p className="text-base sm:text-lg text-gray-200 mb-6 max-w-2xl mx-auto">
          Airtime, Discounted Data, Business Tools & More — Fast, affordable,
          and always reliable.
        </p>
        <div className="mb-12">
          <Link href="/auth/signup">
            <button className="text-base border hover:border-gray-500 rounded-sm px-7 py-3 cursor-pointer transition-all duration-200">
              Get Started
            </button>
          </Link>
        </div>
      </section>

      {/** Trust indicators */}
      <section className="py-12 bg-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {trustFactors.map((factor, index) => (
              <div
                key={index}
                className="bg-gray-800/50 p-6 rounded-xl border border-gray-700 hover:border-blue-500 transition-all duration-300"
              >
                <div className="flex items-center mb-4">
                  <div className="p-2 rounded-lg bg-blue-900/20 mr-4 text-blue-400">
                    {factor.icon}
                  </div>
                  <h3 className="text-lg font-semibold">{factor.title}</h3>
                </div>
                <p className="text-gray-400">{factor.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/** Services section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Our Services</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Comprehensive digital solutions designed to simplify your life and
              business operations
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
            {services.map((service) => (
              <Link
                key={service.name}
                href={service.href}
                className="group transform hover:-translate-y-2 transition-all duration-300"
              >
                <div className="bg-gray-800 hover:bg-gray-700 rounded-xl p-6 h-full border border-gray-700 hover:border-blue-500 transition-all duration-300 shadow-lg">
                  <div className="flex items-start mb-4">
                    <div className="p-3 rounded-xl bg-blue-900/20 text-blue-400 mr-4 group-hover:bg-blue-900/30 transition-all duration-300">
                      {service.icon}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-1">
                        {service.name}
                      </h3>
                      <p className="text-gray-400">{service.description}</p>
                    </div>
                  </div>
                  <ul className="mt-4 space-y-2">
                    {service.features.map((feature, i) => (
                      <li
                        key={i}
                        className="flex items-center text-sm text-gray-400"
                      >
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Updated comparison section with ₦2,500 savings */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              Save More with BillzPaddi
            </h2>
            <p className="text-gray-300 max-w-2xl mx-auto">
              See how much you save when you buy ₦5,000 data bundles
            </p>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="min-w-full divide-y divide-gray-700">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Network
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Discount Rate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      You Pay
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Savings
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {dataDiscountComparison.map((item, index) => {
                    const discount = parseFloat(item.billzPaddiDiscount) / 100;
                    const savings = item.amount * discount;
                    const youPay = item.amount - savings;

                    return (
                      <tr key={index} className="hover:bg-gray-700/50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8">
                              <img
                                className="h-8 w-8 rounded-full"
                                src={item.icon}
                                alt={item.provider}
                              />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium">
                                {item.provider}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-green-400 font-semibold">
                          {item.billzPaddiDiscount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          ₦{youPay.toLocaleString("en-NG")}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-green-400 font-semibold">
                          ₦{savings.toFixed(0)} saved
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="mt-8 bg-gray-700/50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-2 text-center">
                Example Calculation
              </h3>
              <p className="text-gray-300 text-sm text-center">
                For ₦5,000 data with 1.4% discount: ₦5,000 - (1.4% of ₦5,000) =
                ₦4,930
              </p>
            </div>
            <div className="mt-6 text-center">
              <Link href="/data">
                <button className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-7 cursor-pointer rounded-md transition duration-200">
                  Buy Data Now
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="flex justify-center pb-7 px-7">
        <Image
          src="/images/app-desk.png"
          alt=""
          width={1000}
          height={1000}
          className="rounded-md shadow-2xl hidden md:block"
        />
        <Image
          src="/images/app-mobile.png"
          alt=""
          width={1000}
          height={1000}
          className="rounded-md shadow-2xl hidden"
        />
      </section>
    </div>
  );
}
