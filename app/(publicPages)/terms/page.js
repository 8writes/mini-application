import Link from "next/link";

export default function Page() {
  return (
    <div className="min-h-[100dvh] bg-gray-800 text-gray-300 py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Terms & Conditions
          </h1>
          <p className="text-gray-400">
            Last Updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        <div className="space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">
              1. Acceptance of Terms
            </h2>
            <p className="mb-4">
              By accessing or using BillzPaddi services, you agree to be bound
              by these Terms. If you disagree with any part, you may not access
              our services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">
              2. Service Description
            </h2>
            <p className="mb-4">
              BillzPaddi platform provides comprehensive digital services including
              but not limited to airtime purchase, data bundles, TV
              subscriptions, and utility bill payments.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">
              3. User Responsibilities
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>You must be at least 18 years old to use our services</li>
              <li>
                You are responsible for maintaining account confidentiality
              </li>
              <li>All transactions are final unless otherwise stated</li>
              <li>You agree not to use our services for illegal activities</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">
              4. Payments & Refunds
            </h2>
            <p className="mb-4">
              All payments are processed through secure channels. Refunds are
              only granted for failed transactions as determined by our system.
              Service fees are non-refundable.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">
              5. Limitation of Liability
            </h2>
            <p className="mb-4">
              BillzPaddi shall not be liable for any indirect, incidental, or
              consequential damages resulting from use or inability to use our
              services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">
              6. Changes to Terms
            </h2>
            <p className="mb-4">
              We reserve the right to modify these terms at any time. Continued
              use after changes constitutes acceptance of the new terms.
            </p>
          </section>

          <div className="pt-8 border-t border-gray-800">
            <p className="text-gray-400">
              For questions regarding these terms, contact us at{" "}
              <Link
                href="mailto:support@billzpaddi.com.ng"
                className="text-blue-400 hover:underline"
              >
                support@billzpaddi.com.ng
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
