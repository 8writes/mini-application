import Link from "next/link";

export default function GlobalFooter() {
  return (
    <div className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
      <section className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Legal Column */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Legal</h3>
            <ul className="space-y-2">
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

          {/* Services Column */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Company</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/about"
                  className="hover:text-gray-300 transition-colors"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  href="/coming-soon"
                  className="hover:text-gray-300 transition-colors"
                >
                  Careers
                </Link>
              </li>
              <li>
                <Link
                  href="/coming-soon"
                  className="hover:text-gray-300 transition-colors"
                >
                  Developers
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
                  href="https://wa.me/2349011023653"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-gray-300 transition-colors"
                >
                  +234 901 102 3653
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
            </ul>
          </div>
        </div>

        {/* Copyright Section */}
        <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
          <p>
            &copy; {new Date().getFullYear()} BillzPaddi. All rights reserved.
          </p>
        </div>
      </section>
    </div>
  );
}
