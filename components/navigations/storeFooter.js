import Link from "next/link";

export default function StoreFooter() {
  return (
    <div className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
      <section className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-8">
          {/* About Store Column */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">About BillzPaddi Store</h3>
            <p className="text-gray-300 text-sm">
              BillzPaddi Store is your trusted platform for seamless purchase of
              products from verified existing businesses.
              We are committed to providing a secure and user-friendly shopping
              experience. <br/> Read More about us{" "}
              <Link
                href="/about"
                className="text-blue-400 hover:underline transition-colors">
                here
                </Link>
            </p>
          </div>

          {/* Legal Column */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Resources</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/shipping"
                  className="hover:text-gray-300 transition-colors"
                >
                  Shipping & Delivery
                </Link>
              </li>
              <li>
                <Link
                  href="/refund"
                  className="hover:text-gray-300 transition-colors"
                >
                  Refund Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="hover:text-gray-300 transition-colors"
                >
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="hover:text-gray-300 transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Company Column */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Company</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/about"
                  className="hover:text-gray-300 transition-colors"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="hover:text-gray-300 transition-colors"
                >
                  Contact Us
                </Link>
              </li>
              <li>
                <Link
                  href="/faq"
                  className="hover:text-gray-300 transition-colors"
                >
                  FAQs
                </Link>
              </li>
            </ul>
          </div>

          {/* Support Column */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Support</h3>
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <span>WhatsApp:</span>
                <Link
                  href="https://wa.me/2349163366286"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-gray-300 transition-colors"
                >
                  +234 916 336 6286
                </Link>
              </li>
              <li className="flex items-center gap-2">
                <span>Email:</span>
                <a
                  href="mailto:support@billzpaddi.com.ng"
                  className="hover:text-gray-300 transition-colors"
                >
                  support@billzpaddi.com.ng
                </a>
              </li>
              <li className="flex items-center gap-2">
                <span>Hours:</span>
                <span className="text-gray-300">Mon-Sun, 8AM-10PM</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright Section */}
        <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
          <p>
            &copy; {new Date().getFullYear()} Ozmictech Ventures. All rights
            reserved.
          </p>
        </div>
      </section>
    </div>
  );
}
