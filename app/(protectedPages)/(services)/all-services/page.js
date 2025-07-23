import Link from "next/link";
import {
  HiOutlineFire,
  HiOutlineShoppingBag,
  HiOutlineLightningBolt,
  HiOutlineTicket,
  HiOutlineHome,
  HiOutlineAcademicCap,
  HiOutlineCog,
  HiOutlineGlobe,
  HiOutlineCurrencyDollar,
  HiOutlineDeviceMobile,
  HiOutlineDocumentText,
  HiOutlineSearch,
  HiChartBar,
  HiShoppingBag,
} from "react-icons/hi";

export default function Page() {
  // Categories of services
  const serviceCategories = [
    {
      name: "Airtime & Data",
      services: [
        {
          name: "Airtime",
          icon: <HiOutlineDeviceMobile className="text-2xl text-yellow-500" />,
          link: "/airtime",
        },
        {
          name: "Data",
          icon: <HiChartBar className="text-2xl text-purple-500" />,
          link: "/data",
        },
      ],
    },
    {
      name: "Bill Payments",
      services: [
        {
          name: "Electricity",
          icon: <HiOutlineLightningBolt className="text-2xl text-blue-500" />,
          link: "/electricity",
        },
        {
          name: "Education",
          icon: <HiOutlineAcademicCap className="text-2xl text-indigo-500" />,
          link: "/education",
        },
        {
          name: "TV Subscription",
          icon: <HiOutlineHome className="text-2xl text-green-500" />,
          link: "/tv",
        },
      ],
    },
    {
      name: "Business Services",
      services: [
        {
          name: "Generate Invoice",
          icon: <HiOutlineDocumentText className="text-2xl text-red-500" />,
          link: "/generate-invoice",
        },
        {
          name: "My Store",
          icon: <HiOutlineShoppingBag className="text-2xl text-pink-500" />,
          link: "/my-store",
        },
      ],
    },
    {
      name: "Other Services",
      services: [
        {
          name: "Fund Wallet",
          icon: <HiOutlineCurrencyDollar className="text-2xl text-green-500" />,
          link: "/wallet",
        },
      ],
    },
  ];

  return (
    <div className="p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">All Services</h1>
          <p className="text-gray-400">
            Choose from our wide range of services
          </p>
        </div>

        {/* Services Grid */}
        <div className="space-y-10">
          {serviceCategories.map((category, index) => (
            <div
              key={index}
              className="bg-gray-800 rounded-xl border border-gray-700 p-6"
            >
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <HiOutlineFire className="text-blue-500" />
                {category.name}
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {category.services.map((service, sIndex) => (
                  <Link href={service.link} key={sIndex} passHref>
                    <div className="bg-gray-700 hover:bg-gray-600 rounded-lg p-4 cursor-pointer transition-colors flex flex-col items-center text-center">
                      <div className="mb-3">{service.icon}</div>
                      <h3 className="font-medium text-sm md:text-base">
                        {service.name}
                      </h3>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
