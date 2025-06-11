import Link from "next/link";
import { FaWhatsapp, FaEnvelope, FaHeadset, FaClock } from "react-icons/fa";
import {
  HiOutlinePhone,
  HiChartBar,
  HiOutlineDesktopComputer,
  HiOutlineCash,
  HiOutlineClipboardCheck,
  HiOutlineShoppingBag,
  HiOutlineShoppingCart,
} from "react-icons/hi";
import { FaGamepad } from "react-icons/fa";

export default function Page() {
  const services = [
    { name: "Airtime", icon: <HiOutlinePhone className="w-6 h-6" /> },
    { name: "Data", icon: <HiChartBar className="w-6 h-6" /> },
    { name: "TV", icon: <HiOutlineDesktopComputer className="w-6 h-6" /> },
    {
      name: "Business Tools",
      icon: <HiOutlineClipboardCheck className="w-6 h-6" />,
    },
    {
      name: "BillzPaddi Store",
      icon: <HiOutlineShoppingCart className="w-6 h-6" />,
    },
  ];

  return (
    <div className="min-h-[100dvh] bg-gray-800 text-white">
      {/* Hero Section */}
      <section className="pt-20 pb-10 md:py-20 px-6 text-center bg-gradient-to-b from-gray-700 to-gray-800">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          About BillzPaddi
        </h1>
      </section>

      {/* Main Content */}
      <div className="container mx-auto px-6 pb-12">
        {/* Our Story */}
        <section className="mb-20">
          <div className="grid gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Our Story</h2>
              <p className="text-gray-300 mb-4">
                Founded in 2025, BillzPaddi is a simple platform for
                comprehensive digital services powered by Ozmictech Ventures
                with BN 7950319.
              </p>
              <p className="text-gray-300">
                Today, we serve customers across Nigeria, providing seamless
                access to essential digital services through our secure and
                user-friendly platform.
              </p>
            </div>
            {/**
            <div className="bg-gray-800 rounded-xl p-8 border border-gray-700">
              <h3 className="text-xl font-semibold mb-4">Our Mission</h3>
              <p className="text-gray-300 mb-6">
                To empower individuals and businesses with accessible, reliable,
                and innovative digital payment solutions.
              </p>
              <h3 className="text-xl font-semibold mb-4">Our Vision</h3>
              <p className="text-gray-300">
                To become Africa's leading digital services platform, bridging
                the gap between technology and everyday financial needs.
              </p>
            </div> */}
          </div>
        </section>

        {/* Services Overview */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold mb-8 text-center">Our Services</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {services.map((service, index) => (
              <div
                key={index}
                className="bg-gray-800 rounded-lg p-4 text-center hover:bg-gray-700 transition-colors"
              >
                <div className="flex justify-center mb-2">
                  <div className="p-3 rounded-full bg-gray-700">
                    {service.icon}
                  </div>
                </div>
                <h3 className="font-medium">{service.name}</h3>
              </div>
            ))}
          </div>
        </section>

        {/* Team/Values */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold mb-8 text-center">Our Values</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: "Innovation",
                desc: "Constantly evolving to meet customer needs",
              },
              {
                title: "Integrity",
                desc: "Honest and transparent in all dealings",
              },
              {
                title: "Customer Focus",
                desc: "Your satisfaction is our priority",
              },
            ].map((value, index) => (
              <div
                key={index}
                className="bg-gray-800 rounded-xl p-6 border border-gray-700"
              >
                <h3 className="text-xl font-semibold mb-3">{value.title}</h3>
                <p className="text-gray-300">{value.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Contact CTA */}
        <section className="bg-gray-800 rounded-xl p-8 border border-gray-700">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-4">Have Questions?</h2>
            <p className="text-gray-300 mb-6">
              Our support team is available 24/7 to assist you with any
              inquiries.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="https://wa.me/2349011023653"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg flex items-center justify-center gap-3 transition-colors"
              >
                <FaWhatsapp />
                WhatsApp Support
              </Link>
              <Link
                href="mailto:support@billzpaddi.com.ng"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center justify-center gap-3 transition-colors"
              >
                <FaEnvelope />
                Email Us
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
