import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Terms of Service | Mad Fresh Kitchen",
  description:
    "Terms of Service for Mad Fresh Kitchen. Review the terms and conditions that govern your use of madfresh.app and our meal prep delivery services.",
};

export default function TermsPage() {
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
          Terms of Service
        </h1>
        <p className="text-[#9a9080] text-sm mb-10">
          Last updated: May 13, 2026
        </p>

        <div className="space-y-10 text-[#4a5e3a] leading-relaxed">
          {/* Introduction */}
          <section>
            <p>
              Welcome to Mad Fresh Kitchen. These Terms of Service
              (&ldquo;Terms&rdquo;) govern your access to and use of the website
              and application at{" "}
              <span className="text-[#75F663]">madfresh.app</span> (the
              &ldquo;Service&rdquo;), operated by Mad Fresh Kitchen
              (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;),
              located in Tempe, Arizona.
            </p>
            <p className="mt-4">
              By accessing or using the Service, you agree to be bound by these
              Terms. If you do not agree to these Terms, you may not use the
              Service.
            </p>
          </section>

          {/* Account Registration */}
          <section>
            <h2 className="text-xl font-bold text-[#1e2d18] mb-4">
              1. Account Registration
            </h2>
            <p>
              To place orders and access certain features of the Service, you
              must create an account. When registering, you agree to:
            </p>
            <ul className="list-disc list-inside space-y-1 text-[#7a7060] ml-2 mt-3">
              <li>Provide accurate, current, and complete information</li>
              <li>
                Maintain and promptly update your account information as needed
              </li>
              <li>
                Keep your password secure and confidential &mdash; you are
                responsible for all activity under your account
              </li>
              <li>
                Notify us immediately at{" "}
                <a
                  href="mailto:hello@madfresh.app"
                  className="text-[#3d6b2a] hover:underline"
                >
                  hello@madfresh.app
                </a>{" "}
                if you suspect unauthorized access to your account
              </li>
            </ul>
            <p className="mt-3">
              You must be at least 18 years old to create an account and use the
              Service.
            </p>
          </section>

          {/* Ordering and Pricing */}
          <section>
            <h2 className="text-xl font-bold text-[#1e2d18] mb-4">
              2. Ordering &amp; Pricing
            </h2>
            <p>
              All orders placed through the Service are subject to availability
              and acceptance. We reserve the right to:
            </p>
            <ul className="list-disc list-inside space-y-1 text-[#7a7060] ml-2 mt-3">
              <li>
                Refuse or cancel any order for any reason, including errors in
                pricing or product information
              </li>
              <li>
                Limit order quantities or restrict orders to certain geographic
                areas
              </li>
              <li>
                Modify menu items, pricing, and availability at any time without
                prior notice
              </li>
            </ul>
            <p className="mt-3">
              Prices displayed on the Service are in U.S. dollars and are
              inclusive of applicable taxes unless otherwise noted. We strive to
              display accurate pricing, but errors may occur. If an error
              affects your order, we will notify you and provide the option to
              confirm or cancel the order at the corrected price.
            </p>
          </section>

          {/* Cancellation Policy */}
          <section>
            <h2 className="text-xl font-bold text-[#1e2d18] mb-4">
              3. Order Cancellation
            </h2>
            <p>
              Because our meals are freshly prepared, cancellation options depend
              on timing:
            </p>
            <ul className="list-disc list-inside space-y-1 text-[#7a7060] ml-2 mt-3">
              <li>
                <strong className="text-[#4a5e3a]">
                  Before preparation begins:
                </strong>{" "}
                Orders may be cancelled for a full refund
              </li>
              <li>
                <strong className="text-[#4a5e3a]">
                  After preparation has started:
                </strong>{" "}
                Orders cannot be cancelled or refunded, as ingredients have
                already been allocated and cooking has begun
              </li>
            </ul>
            <p className="mt-3">
              The cutoff for order modifications and cancellations will be
              clearly communicated during the ordering process. If you need to
              cancel, please contact us as soon as possible at{" "}
              <a
                href="mailto:hello@madfresh.app"
                className="text-[#3d6b2a] hover:underline"
              >
                hello@madfresh.app
              </a>
              .
            </p>
          </section>

          {/* Delivery */}
          <section>
            <h2 className="text-xl font-bold text-[#1e2d18] mb-4">
              4. Delivery Terms &amp; Service Area
            </h2>
            <p>
              We currently deliver within the greater Tempe and Phoenix
              metropolitan area. Delivery availability, windows, and fees are
              displayed during the checkout process and may vary based on your
              location.
            </p>
            <ul className="list-disc list-inside space-y-1 text-[#7a7060] ml-2 mt-3">
              <li>
                You are responsible for providing an accurate delivery address
                and being available to receive your order
              </li>
              <li>
                Delivery times are estimates and are not guaranteed; delays may
                occur due to traffic, weather, or other factors outside our
                control
              </li>
              <li>
                If a delivery cannot be completed due to an incorrect address or
                unavailability, a redelivery fee may apply
              </li>
              <li>
                Local pickup is also available at our Tempe kitchen during posted
                hours
              </li>
            </ul>
          </section>

          {/* Subscriptions */}
          <section>
            <h2 className="text-xl font-bold text-[#1e2d18] mb-4">
              5. Subscriptions
            </h2>
            <p>
              We may offer subscription-based meal plans. If you subscribe:
            </p>
            <ul className="list-disc list-inside space-y-1 text-[#7a7060] ml-2 mt-3">
              <li>
                <strong className="text-[#4a5e3a]">No lock-in:</strong>{" "}
                Subscriptions can be cancelled at any time through your account
                settings or by contacting us
              </li>
              <li>
                Cancellation takes effect at the end of your current billing
                cycle &mdash; you will continue to receive meals through the end
                of the period you have already paid for
              </li>
              <li>
                We may change subscription pricing with at least fourteen (14)
                days&apos; notice before your next billing cycle
              </li>
              <li>
                You may pause your subscription for up to four (4) consecutive
                weeks without losing your plan pricing
              </li>
            </ul>
          </section>

          {/* Payment */}
          <section>
            <h2 className="text-xl font-bold text-[#1e2d18] mb-4">
              6. Payment Processing
            </h2>
            <p>
              All payments are processed securely through{" "}
              <strong className="text-white">Stripe</strong>. By providing
              payment information, you represent that you are authorized to use
              the payment method and authorize us to charge it for your orders.
            </p>
            <ul className="list-disc list-inside space-y-1 text-[#7a7060] ml-2 mt-3">
              <li>
                We do not store your full credit card number on our servers
              </li>
              <li>
                Payment is collected at the time of order or at the start of
                each subscription billing cycle
              </li>
              <li>
                If a payment fails, we may attempt to reprocess it or contact
                you to update your payment method
              </li>
            </ul>
          </section>

          {/* Refunds */}
          <section>
            <h2 className="text-xl font-bold text-[#1e2d18] mb-4">
              7. Refund Policy
            </h2>
            <p>
              We want you to be satisfied with every meal. Our refund policy is
              as follows:
            </p>
            <ul className="list-disc list-inside space-y-1 text-[#7a7060] ml-2 mt-3">
              <li>
                <strong className="text-[#4a5e3a]">Quality issues:</strong> If
                you receive a meal that is damaged, spoiled, or significantly
                different from what was described, contact us within 24 hours of
                delivery with a photo. We will issue a full refund or
                replacement at our discretion.
              </li>
              <li>
                <strong className="text-[#4a5e3a]">Missing items:</strong> If
                items are missing from your order, contact us within 24 hours
                and we will arrange a refund or credit for the missing items.
              </li>
              <li>
                <strong className="text-[#4a5e3a]">Taste preference:</strong>{" "}
                Because food is perishable and prepared to order, we generally do
                not offer refunds based on personal taste preference.
              </li>
            </ul>
            <p className="mt-3">
              All refund requests should be directed to{" "}
              <a
                href="mailto:hello@madfresh.app"
                className="text-[#3d6b2a] hover:underline"
              >
                hello@madfresh.app
              </a>
              . Refunds are processed back to the original payment method within
              five to ten (5&ndash;10) business days.
            </p>
          </section>

          {/* Intellectual Property */}
          <section>
            <h2 className="text-xl font-bold text-[#1e2d18] mb-4">
              8. Intellectual Property
            </h2>
            <p>
              All content on the Service &mdash; including but not limited to
              text, graphics, logos, images, recipes, photography, software, and
              design &mdash; is the property of Mad Fresh Kitchen or its
              licensors and is protected by copyright, trademark, and other
              intellectual property laws.
            </p>
            <p className="mt-3">You may not:</p>
            <ul className="list-disc list-inside space-y-1 text-[#7a7060] ml-2 mt-2">
              <li>
                Copy, reproduce, distribute, or create derivative works from any
                content on the Service without our written permission
              </li>
              <li>
                Use our trademarks, logos, or branding without prior written
                consent
              </li>
              <li>
                Scrape, crawl, or use automated tools to extract content from
                the Service
              </li>
            </ul>
          </section>

          {/* User Conduct */}
          <section>
            <h2 className="text-xl font-bold text-[#1e2d18] mb-4">
              9. User Conduct
            </h2>
            <p>When using the Service, you agree not to:</p>
            <ul className="list-disc list-inside space-y-1 text-[#7a7060] ml-2 mt-3">
              <li>Violate any applicable local, state, or federal law</li>
              <li>
                Use the Service for any fraudulent or unlawful purpose
              </li>
              <li>
                Interfere with or disrupt the operation of the Service or its
                servers
              </li>
              <li>
                Attempt to gain unauthorized access to any part of the Service
                or other user accounts
              </li>
              <li>
                Submit false or misleading information, including fraudulent
                orders
              </li>
              <li>
                Harass, abuse, or harm Mad Fresh Kitchen staff, delivery
                partners, or other users
              </li>
            </ul>
          </section>

          {/* Limitation of Liability */}
          <section>
            <h2 className="text-xl font-bold text-[#1e2d18] mb-4">
              10. Limitation of Liability
            </h2>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, MAD FRESH
              KITCHEN AND ITS OWNERS, OFFICERS, EMPLOYEES, AND AGENTS SHALL NOT
              BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR
              PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS,
              DATA, OR USE, ARISING OUT OF OR RELATED TO YOUR USE OF THE
              SERVICE.
            </p>
            <p className="mt-3">
              OUR TOTAL LIABILITY FOR ANY CLAIM ARISING FROM OR RELATING TO THE
              SERVICE SHALL NOT EXCEED THE AMOUNT YOU PAID TO US IN THE TWELVE
              (12) MONTHS PRECEDING THE EVENT GIVING RISE TO THE CLAIM.
            </p>
            <p className="mt-3">
              The Service is provided on an &ldquo;as is&rdquo; and &ldquo;as
              available&rdquo; basis. We make no warranties, express or implied,
              regarding the Service, including warranties of merchantability,
              fitness for a particular purpose, or non-infringement.
            </p>
          </section>

          {/* Allergen Disclaimer */}
          <section>
            <h2 className="text-xl font-bold text-[#1e2d18] mb-4">
              11. Allergen &amp; Health Disclaimer
            </h2>
            <p>
              Our meals are prepared in a kitchen that handles common allergens,
              including but not limited to nuts, dairy, eggs, wheat, soy, and
              shellfish. While we take precautions to prevent cross-contamination,
              we cannot guarantee that any item is completely free of allergens.
            </p>
            <p className="mt-3">
              Nutritional information and allergen labels are provided for
              informational purposes only and may vary. If you have severe food
              allergies or medical dietary requirements, please consult your
              healthcare provider before ordering. Mad Fresh Kitchen is not
              responsible for adverse reactions resulting from allergen
              cross-contact.
            </p>
          </section>

          {/* Dispute Resolution */}
          <section>
            <h2 className="text-xl font-bold text-[#1e2d18] mb-4">
              12. Dispute Resolution
            </h2>
            <p>
              If a dispute arises between you and Mad Fresh Kitchen, we
              encourage you to contact us first at{" "}
              <a
                href="mailto:hello@madfresh.app"
                className="text-[#3d6b2a] hover:underline"
              >
                hello@madfresh.app
              </a>{" "}
              so we can attempt to resolve it informally.
            </p>
            <p className="mt-3">
              If informal resolution is not successful, any dispute, claim, or
              controversy arising out of or relating to these Terms or the
              Service shall be resolved through binding arbitration administered
              in Maricopa County, Arizona, in accordance with the rules of the
              American Arbitration Association. The arbitrator&apos;s decision
              shall be final and binding.
            </p>
            <p className="mt-3">
              You agree that any dispute resolution proceedings will be conducted
              only on an individual basis and not in a class, consolidated, or
              representative action.
            </p>
          </section>

          {/* Termination */}
          <section>
            <h2 className="text-xl font-bold text-[#1e2d18] mb-4">
              13. Termination
            </h2>
            <p>
              We reserve the right to suspend or terminate your account and
              access to the Service at our sole discretion, without notice, for
              conduct that we determine violates these Terms or is harmful to
              other users, us, or third parties, or for any other reason.
            </p>
            <p className="mt-3">
              You may close your account at any time by contacting us at{" "}
              <a
                href="mailto:hello@madfresh.app"
                className="text-[#3d6b2a] hover:underline"
              >
                hello@madfresh.app
              </a>{" "}
              or through your account settings. Upon termination, your right to
              use the Service ceases immediately. Any pending orders at the time
              of termination will be fulfilled or refunded at our discretion.
            </p>
          </section>

          {/* Changes to Terms */}
          <section>
            <h2 className="text-xl font-bold text-[#1e2d18] mb-4">
              14. Changes to These Terms
            </h2>
            <p>
              We may revise these Terms at any time by posting the updated
              version on the Service. The &ldquo;Last updated&rdquo; date at the
              top of this page indicates when the Terms were last revised. For
              material changes, we will provide notice via email or a prominent
              notice on the Service at least fourteen (14) days before the
              changes take effect.
            </p>
            <p className="mt-3">
              Your continued use of the Service after any changes constitutes
              your acceptance of the revised Terms.
            </p>
          </section>

          {/* Governing Law */}
          <section>
            <h2 className="text-xl font-bold text-[#1e2d18] mb-4">
              15. Governing Law
            </h2>
            <p>
              These Terms shall be governed by and construed in accordance with
              the laws of the State of Arizona, without regard to its conflict of
              law principles. Any legal action or proceeding not subject to
              arbitration shall be brought exclusively in the state or federal
              courts located in Maricopa County, Arizona.
            </p>
          </section>

          {/* Severability */}
          <section>
            <h2 className="text-xl font-bold text-[#1e2d18] mb-4">
              16. Severability
            </h2>
            <p>
              If any provision of these Terms is found to be unenforceable or
              invalid, that provision shall be limited or eliminated to the
              minimum extent necessary so that the remaining provisions of these
              Terms remain in full force and effect.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-xl font-bold text-[#1e2d18] mb-4">
              17. Contact Us
            </h2>
            <p>
              If you have questions about these Terms of Service, please contact
              us:
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
