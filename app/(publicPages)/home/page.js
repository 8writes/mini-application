import Link from "next/link";
import {
  HiOutlinePhone,
  HiChartBar,
  HiOutlineDesktopComputer,
  HiOutlineCash,
  HiOutlineClipboardCheck,
} from "react-icons/hi";
import { FaGamepad } from "react-icons/fa";
import Image from "next/image";

export default function Page() {
  const services = [
    {
      name: "Airtime",
      icon: <HiOutlinePhone className="w-8 h-8" />,
      href: "/airtime",
      description: "Instant airtime top-up for all networks",
    },
    {
      name: "Data",
      icon: <HiChartBar className="w-8 h-8" />,
      href: "/data",
      description: "Affordable data bundles for all devices",
    },
    {
      name: "TV",
      icon: <HiOutlineDesktopComputer className="w-8 h-8" />,
      href: "/tv",
      description: "Cable TV subscriptions and renewals",
    },
    {
      name: "Gaming",
      icon: <FaGamepad className="w-8 h-8" />,
      href: "/gaming",
      description: "Game credits and subscriptions",
    },
    {
      name: "Betting",
      icon: <HiOutlineCash className="w-8 h-8" />,
      href: "/betting",
      description: "Convert your betting codes instantly",
    },
    {
      name: "Business Tools",
      icon: <HiOutlineClipboardCheck className="w-8 h-8" />,
      href: "/generate-invoice",
      description: "Generate free invoices with ease",
    },
  ];

  return (
    <div className="min-h-[80dvh] text-white bg-gray-800">
      {/** Hero section */}
      <section className="pt-20 pb-12 text-center px-2">
        <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4">
          Explore Our Services
        </h2>
        <p className="text-base sm:text-lg text-gray-200 mb-6 max-w-2xl mx-auto">
          Buy Airtime, Affordable Data Bundles, Game Top-ups, Bet Code
          Conversions & more — Fast, secure, and reliable solutions tailored for
          your everyday digital needs.
        </p>
        <div className="mb-12">
          <Link href="/auth/signup">
            <button className="text-base border hover:border-gray-500 rounded-sm px-7 py-3 cursor-pointer transition-all duration-200">
              Get Started
            </button>
          </Link>
        </div>
      </section>

      {/** Services section */}
      <section className="pb-20 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {services.map((service) => (
            <Link key={service.name} href={service.href} className="group">
              <div className="bg-gray-700 hover:bg-gray-600 rounded-lg p-6 h-full transition-all duration-300 border border-gray-600 hover:border-gray-500">
                <div className="flex items-center mb-4">
                  <div className="p-3 rounded-full bg-gray-600 group-hover:bg-gray-500 mr-4 transition-all duration-300">
                    {service.icon}
                  </div>
                  <h3 className="text-xl font-semibold">{service.name}</h3>
                </div>
                <p className="text-gray-300">{service.description}</p>
              </div>
            </Link>
          ))}
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
