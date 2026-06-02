"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import {
  Heart,
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  QrCode,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Event, EventTemplateStyle } from "@/types/database";

type DonationAmount = "5" | "10" | "25" | "50" | "custom";

// Template style configuration (same as event page)
const TEMPLATE_STYLES: Record<
  EventTemplateStyle,
  {
    accentColor: string;
    accentHex: string;
    bgColor: string;
    ringColor: string;
    pillBg: string;
    pillBorder: string;
    textColor: string;
  }
> = {
  mad_fresh: {
    accentColor: "text-[#75F663]",
    accentHex: "#75F663",
    bgColor: "bg-[#faf8f3]",
    ringColor: "focus:ring-[#449531]",
    pillBg: "bg-[#449531]/15",
    pillBorder: "border-[#449531]/30",
    textColor: "text-[#1e2d18]",
  },
  fire_smoke: {
    accentColor: "text-[#FF6B35]",
    accentHex: "#FF6B35",
    bgColor: "bg-[#1a0a05]",
    ringColor: "focus:ring-[#FF6B35]",
    pillBg: "bg-[#FF6B35]/15",
    pillBorder: "border-[#FF6B35]/30",
    textColor: "text-[#1e2d18]",
  },
  clean_classic: {
    accentColor: "text-[#4A90D9]",
    accentHex: "#4A90D9",
    bgColor: "bg-[#fafafa]",
    ringColor: "focus:ring-[#4A90D9]",
    pillBg: "bg-[#4A90D9]/10",
    pillBorder: "border-[#4A90D9]/30",
    textColor: "text-gray-900",
  },
};

export default function DonatePage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"form" | "success">("form");
  const [submitLoading, setSubmitLoading] = useState(false);

  // Form state
  const [donationAmount, setDonationAmount] = useState<DonationAmount>("25");
  const [customAmount, setCustomAmount] = useState("");
  const [donorName, setDonorName] = useState("");
  const [donorEmail, setDonorEmail] = useState("");
  const [donorMessage, setDonorMessage] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [totalDonated, setTotalDonated] = useState(0);

  // Fetch event and donation total
  useEffect(() => {
    async function fetchEvent() {
      if (!slug) return;

      try {
        const supabase = createClient();
        const { data, error: queryError } = await supabase
          .from("events")
          .select("*")
          .eq("slug", slug)
          .single();

        if (queryError || !data) {
          setError("Event not found");
          return;
        }

        setEvent(data);

        // Fetch total donations for this event
        const { data: donations } = await supabase
          .from("event_donations")
          .select("amount")
          .eq("event_id", data.id)
          .eq("payment_status", "completed");

        if (donations) {
          setTotalDonated(donations.reduce((sum, d) => sum + (d.amount || 0), 0));
        }
      } catch {
        setError("Failed to load event");
      } finally {
        setLoading(false);
      }
    }

    fetchEvent();
  }, [slug]);

  async function handleDonation(e: React.FormEvent) {
    e.preventDefault();
    if (!event) return;

    setSubmitLoading(true);
    setSubmitError("");

    try {
      const finalAmount =
        donationAmount === "custom" ? parseFloat(customAmount) : parseFloat(donationAmount);

      if (isNaN(finalAmount) || finalAmount <= 0) {
        setSubmitError("Please enter a valid donation amount");
        setSubmitLoading(false);
        return;
      }

      const supabase = createClient();

      const { error: donationError } = await supabase
        .from("event_donations")
        .insert({
          event_id: event.id,
          donor_name: isAnonymous ? "Anonymous" : donorName,
          donor_email: isAnonymous ? null : donorEmail,
          amount: finalAmount,
          message: donorMessage || null,
          is_anonymous: isAnonymous,
          payment_status: "pending",
          store_id: event.store_id,
        });

      if (donationError) {
        setSubmitError("Something went wrong. Please try again.");
        setSubmitLoading(false);
        return;
      }

      setStep("success");
    } catch {
      setSubmitError("Something went wrong. Please try again.");
    } finally {
      setSubmitLoading(false);
    }
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-[#faf8f3] pt-24 pb-16 flex items-center justify-center">
          <div className="text-[#7a7060]">Loading event...</div>
        </main>
        <Footer />
      </>
    );
  }

  if (error || !event) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-[#faf8f3] pt-24 pb-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="glass rounded-3xl p-8 sm:p-12 text-center">
              <AlertCircle size={48} className="text-red-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-[#1e2d18] mb-2">
                {error || "Event not found"}
              </h2>
              <Link
                href="/events"
                className="inline-block mt-6 text-[#75F663] hover:underline"
              >
                Back to all events
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const template = TEMPLATE_STYLES[event.template_style];
  const finalAmount =
    donationAmount === "custom" ? (customAmount ? parseFloat(customAmount) : 0) : parseFloat(donationAmount);
  const progressPercentage = event.donation_goal
    ? Math.min((totalDonated || 0) / event.donation_goal, 1) * 100
    : 0;

  return (
    <>
      <Navbar />
      <main className={`min-h-screen ${template.bgColor} pt-24 pb-16`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <Link
            href={`/events/${event.slug}`}
            className={`inline-flex items-center gap-2 hover:${template.accentColor} transition text-sm mb-8 ${
              template.bgColor === "bg-[#fafafa]"
                ? "text-[#9a9080] hover:text-[#4A90D9]"
                : "text-[#9a9080] hover:text-[#1e2d18]"
            }`}
          >
            <ArrowLeft size={16} />
            Back to event
          </Link>

          {/* Header */}
          <div className="glass rounded-3xl p-8 sm:p-12 mb-8">
            <div
              className={`inline-flex items-center gap-2 ${template.pillBg} border ${template.pillBorder} rounded-full px-4 py-1.5 mb-6`}
            >
              <Heart
                size={16}
                className={template.accentColor}
                style={{ color: template.accentHex }}
              />
              <span className={`text-sm font-medium ${template.accentColor}`}>
                Make an Impact
              </span>
            </div>

            <h1
              className={`text-4xl sm:text-5xl font-black ${template.textColor} tracking-tight mb-4`}
            >
              Support {event.name}
            </h1>

            <p
              className={`text-lg ${
                template.bgColor === "bg-[#fafafa]"
                  ? "text-[#9a9080]"
                  : "text-[#7a7060]"
              } max-w-2xl`}
            >
              Your donation helps us continue hosting amazing events and creating memorable
              experiences for our community.
            </p>

            {/* Donation Goal Progress */}
            {event.donation_goal && event.donation_goal > 0 && (
              <div className="mt-8 pt-6 border-t border-white/10">
                <div className="flex justify-between items-center mb-3">
                  <span
                    className={`text-sm font-semibold ${
                      template.bgColor === "bg-[#fafafa]"
                        ? "text-gray-700"
                        : "text-[#7a7060]"
                    }`}
                  >
                    Donation Goal
                  </span>
                  <span className={`text-sm font-bold ${template.accentColor}`}>
                    ${totalDonated || 0} / ${event.donation_goal}
                  </span>
                </div>
                <div
                  className={`h-2 rounded-full overflow-hidden ${
                    template.bgColor === "bg-[#fafafa]"
                      ? "bg-gray-200"
                      : "bg-white/10"
                  }`}
                >
                  <div
                    className="h-full transition-all duration-500"
                    style={{
                      width: `${Math.min(progressPercentage, 100)}%`,
                      backgroundColor: template.accentHex,
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Donation Form / Success */}
          {step === "success" ? (
            <div className="glass rounded-3xl p-8 sm:p-12 text-center space-y-6 max-w-2xl mx-auto">
              <CheckCircle
                size={56}
                className={template.accentColor}
                style={{ color: template.accentHex }}
              />
              <h2 className={`text-3xl font-black ${template.textColor}`}>
                Thank You!
              </h2>
              <p
                className={`${
                  template.bgColor === "bg-[#fafafa]"
                    ? "text-[#9a9080]"
                    : "text-[#7a7060]"
                } text-lg`}
              >
                Your generous donation of{" "}
                <strong className={template.accentColor}>
                  ${finalAmount.toFixed(2)}
                </strong>{" "}
                will make a real difference. We'll send a receipt{" "}
                {!isAnonymous && "to"}{" "}
                {!isAnonymous && donorEmail ? (
                  <>
                    <strong className={template.textColor}>{donorEmail}</strong>
                  </>
                ) : (
                  "shortly"
                )}
                .
              </p>

              <div className="grid sm:grid-cols-2 gap-4 pt-4 max-w-md mx-auto">
                <Link
                  href="/"
                  className={`font-semibold py-3 rounded-full text-center transition ${
                    template.bgColor === "bg-[#fafafa]"
                      ? "bg-[#4A90D9] text-[#1e2d18] hover:bg-[#3a7acd]"
                      : ""
                  }`}
                  style={{
                    backgroundColor:
                      template.bgColor === "bg-[#fafafa]"
                        ? "#4A90D9"
                        : template.accentHex,
                    color:
                      template.bgColor === "bg-[#fafafa]" ? "white" : "black",
                  }}
                >
                  Back to Home
                </Link>
                <Link
                  href={`/events/${event.slug}`}
                  className={`border font-semibold py-3 rounded-full text-center transition ${
                    template.bgColor === "bg-[#fafafa]"
                      ? "border-gray-300 text-gray-900 hover:bg-gray-100"
                      : "border-white/20 text-[#1e2d18] hover:bg-white/5"
                  }`}
                >
                  Back to Event
                </Link>
              </div>

              <div className="glass rounded-2xl p-6 mt-6 max-w-md mx-auto">
                <p
                  className={`text-sm ${
                    template.bgColor === "bg-[#fafafa]"
                      ? "text-[#9a9080]"
                      : "text-[#7a7060]"
                  }`}
                >
                  Please contact us for tax deduction information
                </p>
              </div>
            </div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {/* QR Code Section */}
              {event.donation_qr_code_url && (
                <div className="lg:col-span-1">
                  <div className="glass rounded-3xl p-6 h-full flex flex-col items-center justify-center">
                    <p
                      className={`text-sm font-semibold mb-4 ${
                        template.bgColor === "bg-[#fafafa]"
                          ? "text-gray-700"
                          : "text-[#7a7060]"
                      }`}
                    >
                      Scan to Donate
                    </p>
                    <div className="relative w-40 h-40 rounded-2xl overflow-hidden bg-white p-2">
                      <Image
                        src={event.donation_qr_code_url}
                        alt="Donation QR Code"
                        fill
                        className="object-contain"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Form Section */}
              <div
                className={`lg:col-span-${event.donation_qr_code_url ? "2" : "3"}`}
              >
                <form
                  onSubmit={handleDonation}
                  className="glass rounded-3xl p-8 sm:p-12 space-y-6"
                >
                  <h2 className={`text-2xl font-bold ${template.textColor}`}>
                    Choose Your Amount
                  </h2>

                  {/* Amount Presets */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { value: "5" as DonationAmount, label: "$5" },
                      { value: "10" as DonationAmount, label: "$10" },
                      { value: "25" as DonationAmount, label: "$25" },
                      { value: "50" as DonationAmount, label: "$50" },
                    ].map((preset) => (
                      <button
                        key={preset.value}
                        type="button"
                        onClick={() => {
                          setDonationAmount(preset.value);
                          setCustomAmount("");
                        }}
                        className={`py-3 rounded-xl font-semibold transition ${
                          donationAmount === preset.value
                            ? template.bgColor === "bg-[#fafafa]"
                              ? "bg-[#4A90D9] text-[#1e2d18]"
                              : ""
                            : template.bgColor === "bg-[#fafafa]"
                              ? "border border-gray-300 text-gray-900 hover:bg-gray-100"
                              : "border border-white/20 text-[#1e2d18] hover:bg-white/5"
                        }`}
                        style={
                          donationAmount === preset.value
                            ? {
                                backgroundColor:
                                  template.bgColor === "bg-[#fafafa]"
                                    ? "#4A90D9"
                                    : template.accentHex,
                                color:
                                  template.bgColor === "bg-[#fafafa]"
                                    ? "white"
                                    : "black",
                              }
                            : {}
                        }
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>

                  {/* Custom Amount */}
                  <div>
                    <label
                      className={`text-xs uppercase tracking-wider block mb-2 ${
                        template.bgColor === "bg-[#fafafa]"
                          ? "text-gray-700"
                          : "text-[#7a7060]"
                      }`}
                    >
                      Custom Amount
                    </label>
                    <div className="relative">
                      <span
                        className={`absolute left-4 top-3 text-lg font-semibold ${
                          template.bgColor === "bg-[#fafafa]"
                            ? "text-[#9a9080]"
                            : "text-[#9a9080]"
                        }`}
                      >
                        $
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        placeholder="Enter amount"
                        value={customAmount}
                        onChange={(e) => {
                          setCustomAmount(e.target.value);
                          setDonationAmount("custom");
                        }}
                        className={`w-full pl-8 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 ${template.ringColor} ${
                          template.bgColor === "bg-[#fafafa]"
                            ? "bg-gray-100 border border-gray-300 text-gray-900 placeholder-gray-600"
                            : "bg-white/5 border border-white/10 text-[#1e2d18] placeholder-gray-600"
                        }`}
                      />
                    </div>
                  </div>

                  {/* Donor Info */}
                  <div className="pt-4 border-t border-white/10">
                    <h3 className={`text-lg font-bold ${template.textColor} mb-4`}>
                      Your Information
                    </h3>

                    {!isAnonymous && (
                      <>
                        <div className="grid sm:grid-cols-2 gap-4 mb-4">
                          <div>
                            <label
                              className={`text-xs uppercase tracking-wider block mb-1 ${
                                template.bgColor === "bg-[#fafafa]"
                                  ? "text-gray-700"
                                  : "text-[#7a7060]"
                              }`}
                            >
                              Full Name *
                            </label>
                            <input
                              type="text"
                              required={!isAnonymous}
                              value={donorName}
                              onChange={(e) => setDonorName(e.target.value)}
                              className={`w-full rounded-xl px-4 py-3 focus:outline-none focus:ring-2 ${template.ringColor} ${
                                template.bgColor === "bg-[#fafafa]"
                                  ? "bg-gray-100 border border-gray-300 text-gray-900 placeholder-gray-600"
                                  : "bg-white/5 border border-white/10 text-[#1e2d18] placeholder-gray-600"
                              }`}
                            />
                          </div>
                          <div>
                            <label
                              className={`text-xs uppercase tracking-wider block mb-1 ${
                                template.bgColor === "bg-[#fafafa]"
                                  ? "text-gray-700"
                                  : "text-[#7a7060]"
                              }`}
                            >
                              Email *
                            </label>
                            <input
                              type="email"
                              required={!isAnonymous}
                              value={donorEmail}
                              onChange={(e) => setDonorEmail(e.target.value)}
                              className={`w-full rounded-xl px-4 py-3 focus:outline-none focus:ring-2 ${template.ringColor} ${
                                template.bgColor === "bg-[#fafafa]"
                                  ? "bg-gray-100 border border-gray-300 text-gray-900 placeholder-gray-600"
                                  : "bg-white/5 border border-white/10 text-[#1e2d18] placeholder-gray-600"
                              }`}
                            />
                          </div>
                        </div>
                      </>
                    )}

                    {/* Anonymous Toggle */}
                    <label className="flex items-center gap-3 cursor-pointer mb-4">
                      <input
                        type="checkbox"
                        checked={isAnonymous}
                        onChange={(e) => setIsAnonymous(e.target.checked)}
                        className={`w-4 h-4 rounded ${
                          template.bgColor === "bg-[#fafafa]"
                            ? "border-gray-300 bg-gray-100"
                            : "border-white/20 bg-white/5"
                        }`}
                        style={{
                          accentColor: template.accentHex,
                        }}
                      />
                      <span
                        className={`text-sm ${
                          template.bgColor === "bg-[#fafafa]"
                            ? "text-gray-700"
                            : "text-[#7a7060]"
                        }`}
                      >
                        I prefer to donate anonymously
                      </span>
                    </label>
                  </div>

                  {/* Message */}
                  <div>
                    <label
                      className={`text-xs uppercase tracking-wider block mb-1 ${
                        template.bgColor === "bg-[#fafafa]"
                          ? "text-gray-700"
                          : "text-[#7a7060]"
                      }`}
                    >
                      Message (optional)
                    </label>
                    <textarea
                      placeholder="Share why you're supporting this cause..."
                      value={donorMessage}
                      onChange={(e) => setDonorMessage(e.target.value)}
                      rows={3}
                      className={`w-full rounded-xl px-4 py-3 focus:outline-none focus:ring-2 ${template.ringColor} resize-none ${
                        template.bgColor === "bg-[#fafafa]"
                          ? "bg-gray-100 border border-gray-300 text-gray-900 placeholder-gray-600"
                          : "bg-white/5 border border-white/10 text-[#1e2d18] placeholder-gray-600"
                      }`}
                    />
                  </div>

                  {submitError && (
                    <p className="text-red-400 text-sm">{submitError}</p>
                  )}

                  <button
                    type="submit"
                    disabled={submitLoading}
                    className={`w-full font-bold py-4 rounded-full text-lg disabled:opacity-50 transition ${
                      template.bgColor === "bg-[#fafafa]"
                        ? "bg-[#4A90D9] text-[#1e2d18] hover:bg-[#3a7acd]"
                        : ""
                    }`}
                    style={{
                      backgroundColor:
                        template.bgColor === "bg-[#fafafa]"
                          ? "#4A90D9"
                          : template.accentHex,
                      color:
                        template.bgColor === "bg-[#fafafa]" ? "white" : "black",
                    }}
                  >
                    {submitLoading
                      ? "Processing..."
                      : `Donate $${finalAmount.toFixed(2)}`}
                  </button>

                  <p
                    className={`text-xs text-center ${
                      template.bgColor === "bg-[#fafafa]"
                        ? "text-[#9a9080]"
                        : "text-[#9a9080]"
                    }`}
                  >
                    100% of your donation goes directly to supporting this event.
                  </p>
                </form>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
