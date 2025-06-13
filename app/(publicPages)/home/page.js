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

  return (
    <div className="min-h-[80dvh] text-white bg-gray-800">
      {/** Hero section */}
      <section className="pt-40 pb-7 text-center px-2">
        <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4">
          Explore Our Services
        </h2>
        <p className="text-base sm:text-lg text-gray-200 mb-6 max-w-2xl mx-auto">
          Airtime, Discounted Data, Game Top-ups & More — Fast, affordable, and
          always reliable.
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
