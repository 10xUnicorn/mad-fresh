import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy | Mad Fresh Kitchen",
  description:
    "Privacy Policy for Mad Fresh Kitchen. Learn how we collect, use, and protect your personal information when you use madfresh.app.",
};

export default function PrivacyPage() {
  return (
    <main className="bg-[#faf8f3] min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[#7a7060] hover:text-[#3d6b2a] transition-colors mb-8 text-sm"
        >
          <ArrowLeft size={16} />
          Back to Home
        </Link>

        <h1 className="text-3xl sm:text-4xl font-black text-[#1e2d18] mb-2">
          Privacy Policy
        </h1>
        <p className="text-[#9a9080] text-sm mb-10">
          Last updated: May 13, 2026
        </p>

        <div className="space-y-10 text-[#4a5e3a] leading-relaxed">
          {/* Introduction */}
          <section>
            <p>
              Mad Fresh Kitchen (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or
              &ldquo;our&rdquo;) operates the website and mobile application at{" "}
              <span className="text-[#75F663]">madfresh.app</span> (the
              &ldquo;Service&rdquo;). This Privacy Policy explains how we
              collect, use, disclose, and safeguard your information when you
              visit our Service, place orders, or otherwise interact with us.
            </p>
            <p className="mt-4">
              By using the Service, you agree to the collection and use of
              information in accordance with this policy. If you do not agree
              with the terms of this policy, please do not access the Service.
            </p>
          </section>

          {/* Information We Collect */}
          <section>
            <h2 className="text-xl font-bold text-[#1e2d18] mb-4">
              1. Information We Collect
            </h2>

            <h3 className="text-lg font-semibold text-[#1e2d18] mb-2">
              Personal Information You Provide
            </h3>
            <p className="mb-3">
              When you create an account, place an order, or contact us, we may
              collect:
            </p>
            <ul className="list-disc list-inside space-y-1 text-[#7a7060] ml-2">
              <li>Full name</li>
              <li>Email address</li>
              <li>Phone number</li>
              <li>Delivery address</li>
              <li>
                Payment information (processed securely through Stripe &mdash;
                we do not store your full card number)
              </li>
              <li>Order history and meal preferences</li>
              <li>Dietary restrictions or allergy information you share</li>
              <li>Account login credentials</li>
            </ul>

            <h3 className="text-lg font-semibold text-[#1e2d18] mt-6 mb-2">
              Information Collected Automatically
            </h3>
            <p className="mb-3">
              When you access the Service, we may automatically collect:
            </p>
            <ul className="list-disc list-inside space-y-1 text-[#7a7060] ml-2">
              <li>
                Device information (browser type, operating system, device
                model)
              </li>
              <li>IP address and approximate geographic location</li>
              <li>Pages viewed, time spent, and navigation patterns</li>
              <li>Referring URL and search terms</li>
              <li>Cookies and similar tracking technologies</li>
            </ul>
          </section>

          {/* How We Use Your Information */}
          <section>
            <h2 className="text-xl font-bold text-[#1e2d18] mb-4">
              2. How We Use Your Information
            </h2>
            <p className="mb-3">
              We use the information we collect for the following purposes:
            </p>
            <ul className="list-disc list-inside space-y-1 text-[#7a7060] ml-2">
              <li>
                <strong className="text-[#4a5e3a]">Order fulfillment:</strong>{" "}
                Processing, preparing, and delivering your meals
              </li>
              <li>
                <strong className="text-[#4a5e3a]">Account management:</strong>{" "}
                Creating and maintaining your account, managing subscriptions
              </li>
              <li>
                <strong className="text-[#4a5e3a]">Communications:</strong>{" "}
                Sending order confirmations, delivery updates, and customer
                support responses
              </li>
              <li>
                <strong className="text-[#4a5e3a]">Marketing:</strong> Sending
                promotional offers, menu updates, and newsletters (with your
                consent; you may opt out at any time)
              </li>
              <li>
                <strong className="text-[#4a5e3a]">Improvement:</strong>{" "}
                Analyzing usage patterns to improve our Service, menu, and user
                experience
              </li>
              <li>
                <strong className="text-[#4a5e3a]">
                  Security &amp; fraud prevention:
                </strong>{" "}
                Detecting and preventing fraudulent transactions or unauthorized
                access
              </li>
              <li>
                <strong className="text-[#4a5e3a]">Legal compliance:</strong>{" "}
                Meeting legal obligations and resolving disputes
              </li>
            </ul>
          </section>

          {/* Third-Party Services */}
          <section>
            <h2 className="text-xl font-bold text-[#1e2d18] mb-4">
              3. Third-Party Services
            </h2>
            <p className="mb-4">
              We use trusted third-party service providers to operate the
              Service. These providers have access only to the information
              necessary to perform their functions and are obligated to protect
              your data:
            </p>
            <div className="space-y-4">
              <div className="border border-white/10 rounded-xl p-4">
                <h4 className="font-semibold text-white">
                  Stripe{" "}
                  <span className="text-[#9a9080] font-normal">
                    &mdash; Payment Processing
                  </span>
                </h4>
                <p className="text-[#7a7060] text-sm mt-1">
                  Handles all payment transactions securely. Your credit card
                  details are transmitted directly to Stripe and never touch our
                  servers. Stripe is PCI DSS Level 1 certified. See{" "}
                  <a
                    href="https://stripe.com/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#3d6b2a] hover:underline"
                  >
                    Stripe&apos;s Privacy Policy
                  </a>
                  .
                </p>
              </div>
              <div className="border border-white/10 rounded-xl p-4">
                <h4 className="font-semibold text-white">
                  Supabase{" "}
                  <span className="text-[#9a9080] font-normal">
                    &mdash; Authentication &amp; Database
                  </span>
                </h4>
                <p className="text-[#7a7060] text-sm mt-1">
                  Provides secure user authentication and data storage. Your
                  account credentials are encrypted and managed through
                  Supabase&apos;s infrastructure. See{" "}
                  <a
                    href="https://supabase.com/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#3d6b2a] hover:underline"
                  >
                    Supabase&apos;s Privacy Policy
                  </a>
                  .
                </p>
              </div>
              <div className="border border-white/10 rounded-xl p-4">
                <h4 className="font-semibold text-white">
                  Resend{" "}
                  <span className="text-[#9a9080] font-normal">
                    &mdash; Transactional Email
                  </span>
                </h4>
                <p className="text-[#7a7060] text-sm mt-1">
                  Delivers order confirmations, password resets, and other
                  transactional emails. Resend processes your email address and
                  name to deliver messages on our behalf. See{" "}
                  <a
                    href="https://resend.com/legal/privacy-policy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#3d6b2a] hover:underline"
                  >
                    Resend&apos;s Privacy Policy
                  </a>
                  .
                </p>
              </div>
              <div className="border border-white/10 rounded-xl p-4">
                <h4 className="font-semibold text-white">
                  Vercel{" "}
                  <span className="text-[#9a9080] font-normal">
                    &mdash; Hosting &amp; Infrastructure
                  </span>
                </h4>
                <p className="text-[#7a7060] text-sm mt-1">
                  Hosts and serves the Service. Vercel may collect standard web
                  server logs including IP addresses and request data. See{" "}
                  <a
                    href="https://vercel.com/legal/privacy-policy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#3d6b2a] hover:underline"
                  >
                    Vercel&apos;s Privacy Policy
                  </a>
                  .
                </p>
              </div>
            </div>
            <p className="mt-4 text-sm text-[#9a9080]">
              We do not sell, rent, or trade your personal information to third
              parties for their marketing purposes.
            </p>
          </section>

          {/* Cookies and Local Storage */}
          <section>
            <h2 className="text-xl font-bold text-[#1e2d18] mb-4">
              4. Cookies &amp; Local Storage
            </h2>
            <p className="mb-3">
              We use cookies and browser local storage to:
            </p>
            <ul className="list-disc list-inside space-y-1 text-[#7a7060] ml-2">
              <li>Keep you signed in to your account</li>
              <li>Remember your cart contents and preferences</li>
              <li>Analyze site traffic and usage patterns</li>
              <li>Improve the overall user experience</li>
            </ul>
            <p className="mt-3">
              You can control cookies through your browser settings. Disabling
              cookies may affect the functionality of the Service.
            </p>
          </section>

          {/* Data Retention */}
          <section>
            <h2 className="text-xl font-bold text-[#1e2d18] mb-4">
              5. Data Retention
            </h2>
            <p>
              We retain your personal information for as long as your account is
              active or as needed to provide you with the Service. We may also
              retain certain information as required by law, to resolve disputes,
              enforce our agreements, or for legitimate business purposes such as
              financial record-keeping.
            </p>
            <p className="mt-3">
              Order history and transaction records are retained for a minimum of
              seven (7) years to comply with tax and accounting regulations. If
              you delete your account, we will remove your personal information
              within thirty (30) days, except where retention is required by law.
            </p>
          </section>

          {/* Data Security */}
          <section>
            <h2 className="text-xl font-bold text-[#1e2d18] mb-4">
              6. Data Security
            </h2>
            <p>
              We implement industry-standard security measures to protect your
              personal information, including encryption in transit (TLS/SSL),
              secure authentication, and access controls. However, no method of
              electronic transmission or storage is 100% secure, and we cannot
              guarantee absolute security.
            </p>
          </section>

          {/* Your Rights */}
          <section>
            <h2 className="text-xl font-bold text-[#1e2d18] mb-4">
              7. Your Rights &amp; Choices
            </h2>
            <p className="mb-3">
              Depending on your location, you may have the following rights
              regarding your personal data:
            </p>
            <ul className="list-disc list-inside space-y-1 text-[#7a7060] ml-2">
              <li>
                <strong className="text-[#4a5e3a]">Access:</strong> Request a
                copy of the personal information we hold about you
              </li>
              <li>
                <strong className="text-[#4a5e3a]">Correction:</strong> Request
                that we correct inaccurate or incomplete data
              </li>
              <li>
                <strong className="text-[#4a5e3a]">Deletion:</strong> Request
                that we delete your personal information, subject to legal
                retention requirements
              </li>
              <li>
                <strong className="text-[#4a5e3a]">Opt-out:</strong> Unsubscribe
                from marketing communications at any time by clicking the
                &ldquo;unsubscribe&rdquo; link in any email or contacting us
                directly
              </li>
              <li>
                <strong className="text-[#4a5e3a]">Data portability:</strong>{" "}
                Request your data in a commonly used, machine-readable format
              </li>
            </ul>
            <p className="mt-3">
              To exercise any of these rights, please contact us at{" "}
              <a
                href="mailto:hello@madfresh.app"
                className="text-[#3d6b2a] hover:underline"
              >
                hello@madfresh.app
              </a>
              . We will respond to your request within thirty (30) days.
            </p>
          </section>

          {/* California Residents */}
          <section>
            <h2 className="text-xl font-bold text-[#1e2d18] mb-4">
              8. California Privacy Rights (CCPA)
            </h2>
            <p>
              If you are a California resident, the California Consumer Privacy
              Act (CCPA) provides you with specific rights regarding your
              personal information, including the right to know what data we
              collect, the right to request deletion, and the right to opt out of
              the sale of personal information.
            </p>
            <p className="mt-3">
              <strong className="text-white">
                We do not sell your personal information.
              </strong>{" "}
              California residents may submit a verifiable consumer request to
              access or delete their personal data by emailing{" "}
              <a
                href="mailto:hello@madfresh.app"
                className="text-[#3d6b2a] hover:underline"
              >
                hello@madfresh.app
              </a>
              . We will verify your identity before fulfilling any request and
              respond within forty-five (45) days.
            </p>
          </section>

          {/* Arizona Residents */}
          <section>
            <h2 className="text-xl font-bold text-[#1e2d18] mb-4">
              9. Arizona Residents
            </h2>
            <p>
              Mad Fresh Kitchen is based in Tempe, Arizona. While Arizona does
              not currently have a comprehensive state privacy law equivalent to
              the CCPA, we are committed to providing all customers with
              transparency and control over their personal data regardless of
              their state of residence. Arizona residents may exercise the same
              rights described in Section 7 above.
            </p>
          </section>

          {/* Children's Privacy */}
          <section>
            <h2 className="text-xl font-bold text-[#1e2d18] mb-4">
              10. Children&apos;s Privacy
            </h2>
            <p>
              The Service is not intended for individuals under the age of 13. We
              do not knowingly collect personal information from children under
              13. If we become aware that a child under 13 has provided us with
              personal information, we will take steps to delete such information
              promptly. If you are a parent or guardian and believe your child
              has provided us with personal data, please contact us at{" "}
              <a
                href="mailto:hello@madfresh.app"
                className="text-[#3d6b2a] hover:underline"
              >
                hello@madfresh.app
              </a>
              .
            </p>
          </section>

          {/* Changes to This Policy */}
          <section>
            <h2 className="text-xl font-bold text-[#1e2d18] mb-4">
              11. Changes to This Privacy Policy
            </h2>
            <p>
              We may update this Privacy Policy from time to time. When we do, we
              will revise the &ldquo;Last updated&rdquo; date at the top of this
              page and, for material changes, notify you via email or a prominent
              notice on the Service. Your continued use of the Service after any
              changes constitutes acceptance of the updated policy.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-xl font-bold text-[#1e2d18] mb-4">
              12. Contact Us
            </h2>
            <p>
              If you have questions or concerns about this Privacy Policy or our
              data practices, please contact us:
            </p>
            <div className="mt-4 border border-white/10 rounded-xl p-5 space-y-2 text-[#7a7060]">
              <p className="text-white font-semibold">Mad Fresh Kitchen</p>
              <p>Tempe, Arizona</p>
              <p>
                Email:{" "}
                <a
                  href="mailto:hello@madfresh.app"
                  className="text-[#3d6b2a] hover:underline"
                >
                  hello@madfresh.app
                </a>
              </p>
              <p>
                Website:{" "}
                <a
                  href="https://madfresh.app"
                  className="text-[#3d6b2a] hover:underline"
                >
                  madfresh.app
                </a>
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
