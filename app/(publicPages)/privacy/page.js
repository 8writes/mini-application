import Link from "next/link";

export default function Page() {
  return (
    <div className="min-h-[100dvh] bg-gray-800 text-gray-300 py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Privacy Policy
          </h1>
          <p className="text-gray-400">
            Last Updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        <div className="space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">
              1. Information We Collect
            </h2>
            <p className="mb-4">
              We collect personal information including but not limited to:
              name, email, phone number, necessary for service provision.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">
              2. How We Use Your Information
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>To provide and maintain our services</li>
              <li>To process transactions</li>
              <li>To send app updates notifications</li>
              <li>To improve user experience</li>
              <li>To comply with legal obligations</li>
              <li>To prevent fraud and enhance security</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">
              3. Data Protection
            </h2>
            <p className="mb-4">
              We implement industry-standard security measures including
              encryption, access controls, and regular security audits to
              protect your information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">
              4. Third-Party Sharing
            </h2>
            <p className="mb-4">
              We do not sell your personal data. We may share information with:
              payment processors, regulatory authorities (when required by law),
              and service providers essential to our operations.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">
              5. Your Rights
            </h2>
            <p className="mb-4">
              You have the right to access, correct, or request deletion of your
              personal data. Contact us at{" "}
              <Link
                href="mailto:support@billzpaddi.com.ng"
                className="text-blue-400 hover:underline"
              >
                support@billzpaddi.com.ng
              </Link>{" "}
              for data requests.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">
              6. Cookies & Tracking
            </h2>
            <p className="mb-4">
              We use cookies to enhance functionality. You can disable cookies
              in your browser settings, though this may affect service
              performance.
            </p>
          </section>

          <div className="pt-8 border-t border-gray-800">
            <p className="text-gray-400">
              This policy may be updated periodically. We'll notify users of
              significant changes through our platform or via email.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
