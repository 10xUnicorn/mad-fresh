"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle2 } from "lucide-react";

export default function CateringForm() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    company: "",
    eventDate: "",
    eventTime: "",
    guestCount: "",
    eventType: "",
    dietaryRequirements: [] as string[],
    packagePreference: "",
    budgetRange: "",
    details: "",
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // Listen for auto-fill from calculator
  useEffect(() => {
    const handleAutoFill = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail) {
        setFormData((prev) => ({
          ...prev,
          guestCount: detail.guestCount || prev.guestCount,
          packagePreference: detail.packagePreference || prev.packagePreference,
          budgetRange: detail.budgetRange || prev.budgetRange,
          details: detail.details || prev.details,
        }));
      }
    };
    window.addEventListener("catering-calculator-fill", handleAutoFill);
    return () => window.removeEventListener("catering-calculator-fill", handleAutoFill);
  }, []);

  const eventTypes = [
    "Corporate Lunch",
    "Team Building",
    "Wedding",
    "Birthday",
    "Holiday Party",
    "Private Dinner",
    "Other",
  ];

  const dietaryOptions = [
    "Vegan",
    "Vegetarian",
    "Gluten-Free",
    "Dairy-Free",
    "Halal",
    "Kosher",
    "Nut-Free",
  ];

  const budgetRanges = [
    "Under $500",
    "$500-$1,000",
    "$1,000-$2,500",
    "$2,500-$5,000",
    "$5,000-$10,000",
    "$10,000+",
  ];

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDietaryChange = (option: string) => {
    setFormData((prev) => ({
      ...prev,
      dietaryRequirements: prev.dietaryRequirements.includes(option)
        ? prev.dietaryRequirements.filter((d) => d !== option)
        : [...prev.dietaryRequirements, option],
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const supabase = createClient();

      const { error: insertError } = await supabase
        .from("contacts")
        .insert({
          store_id: "b0000000-0000-0000-0000-000000000001",
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          source: "catering_inquiry",
          notes: JSON.stringify({
            company: formData.company,
            event_date: formData.eventDate,
            event_time: formData.eventTime,
            guest_count: formData.guestCount,
            event_type: formData.eventType,
            dietary_requirements: formData.dietaryRequirements,
            package_preference: formData.packagePreference,
            budget_range: formData.budgetRange,
            details: formData.details,
          }),
          is_newsletter_subscribed: true,
        });

      if (insertError) {
        throw insertError;
      }

      setSuccess(true);
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        company: "",
        eventDate: "",
        eventTime: "",
        guestCount: "",
        eventType: "",
        dietaryRequirements: [],
        packagePreference: "",
        budgetRange: "",
        details: "",
      });

      // Reset success message after 5 seconds
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to submit quote request";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <section
        id="catering-form"
        className="bg-[#faf8f3] py-20 px-4 sm:px-6 lg:px-8"
      >
        <div className="max-w-2xl mx-auto">
          <div className="bg-white border border-white/[0.06] rounded-2xl p-12 text-center space-y-6">
            <div className="flex justify-center mb-4">
              <CheckCircle2 className="w-16 h-16 text-[#75F663]" />
            </div>
            <h2 className="text-3xl font-bold text-white">Quote Request Sent!</h2>
            <p className="text-[#7a7060] text-lg">
              We'll be in touch within 24 hours to discuss your catering needs
              and provide a custom quote.
            </p>
            <p className="text-[#9a9080] text-sm">
              In the meantime, check out our{" "}
              <a href="/menu" className="text-[#75F663] hover:underline">
                full menu
              </a>
              .
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      id="catering-form"
      className="bg-[#faf8f3] py-20 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-black text-white mb-4">
            Request Your Free Quote
          </h2>
          <p className="text-[#7a7060] text-lg">
            Tell us about your event and we'll create a custom catering plan for
            you.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-300 text-sm">
              {error}
            </div>
          )}

          {/* Name row */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-[#4a5e3a] mb-2">
                First Name *
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                required
                className="w-full bg-white/5 border border-white/[0.06] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-[#75F663]/50 focus:outline-none transition"
                placeholder="John"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#4a5e3a] mb-2">
                Last Name *
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                required
                className="w-full bg-white/5 border border-white/[0.06] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-[#75F663]/50 focus:outline-none transition"
                placeholder="Smith"
              />
            </div>
          </div>

          {/* Email and Phone row */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-[#4a5e3a] mb-2">
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full bg-white/5 border border-white/[0.06] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-[#75F663]/50 focus:outline-none transition"
                placeholder="john@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#4a5e3a] mb-2">
                Phone *
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                required
                className="w-full bg-white/5 border border-white/[0.06] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-[#75F663]/50 focus:outline-none transition"
                placeholder="(480) 555-0123"
              />
            </div>
          </div>

          {/* Company */}
          <div>
            <label className="block text-sm font-medium text-[#4a5e3a] mb-2">
              Company/Organization Name (Optional)
            </label>
            <input
              type="text"
              name="company"
              value={formData.company}
              onChange={handleInputChange}
              className="w-full bg-white/5 border border-white/[0.06] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-[#75F663]/50 focus:outline-none transition"
              placeholder="Mad Fresh Inc."
            />
          </div>

          {/* Event Date and Time */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-[#4a5e3a] mb-2">
                Event Date *
              </label>
              <input
                type="date"
                name="eventDate"
                value={formData.eventDate}
                onChange={handleInputChange}
                required
                className="w-full bg-white/5 border border-white/[0.06] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-[#75F663]/50 focus:outline-none transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#4a5e3a] mb-2">
                Event Time *
              </label>
              <input
                type="time"
                name="eventTime"
                value={formData.eventTime}
                onChange={handleInputChange}
                required
                className="w-full bg-white/5 border border-white/[0.06] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-[#75F663]/50 focus:outline-none transition"
              />
            </div>
          </div>

          {/* Guest Count */}
          <div>
            <label className="block text-sm font-medium text-[#4a5e3a] mb-2">
              Number of Guests *
            </label>
            <input
              type="number"
              name="guestCount"
              value={formData.guestCount}
              onChange={handleInputChange}
              required
              min="1"
              className="w-full bg-white/5 border border-white/[0.06] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-[#75F663]/50 focus:outline-none transition"
              placeholder="50"
            />
          </div>

          {/* Event Type */}
          <div>
            <label className="block text-sm font-medium text-[#4a5e3a] mb-2">
              Event Type *
            </label>
            <select
              name="eventType"
              value={formData.eventType}
              onChange={handleInputChange}
              required
              className="w-full bg-white/5 border border-white/[0.06] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-[#75F663]/50 focus:outline-none transition"
            >
              <option value="">Select an event type...</option>
              {eventTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Dietary Requirements */}
          <div>
            <label className="block text-sm font-medium text-[#4a5e3a] mb-4">
              Dietary Requirements (Select all that apply)
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {dietaryOptions.map((option) => (
                <label
                  key={option}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={formData.dietaryRequirements.includes(option)}
                    onChange={() => handleDietaryChange(option)}
                    className="w-4 h-4 rounded bg-white/5 border border-white/[0.06] accent-[#75F663] cursor-pointer"
                  />
                  <span className="text-sm text-[#4a5e3a]">{option}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Package Preference */}
          <div>
            <label className="block text-sm font-medium text-[#4a5e3a] mb-4">
              Package Preference (Optional)
            </label>
            <div className="space-y-3">
              {["Corporate Fuel", "Event Spread", "Premium Experience", "Not Sure"].map(
                (pkg) => (
                  <label
                    key={pkg}
                    className="flex items-center gap-3 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="packagePreference"
                      value={pkg}
                      checked={formData.packagePreference === pkg}
                      onChange={handleInputChange}
                      className="w-4 h-4 accent-[#75F663] cursor-pointer"
                    />
                    <span className="text-sm text-[#4a5e3a]">{pkg}</span>
                  </label>
                )
              )}
            </div>
          </div>

          {/* Budget Range */}
          <div>
            <label className="block text-sm font-medium text-[#4a5e3a] mb-2">
              Budget Range (Optional)
            </label>
            <select
              name="budgetRange"
              value={formData.budgetRange}
              onChange={handleInputChange}
              className="w-full bg-white/5 border border-white/[0.06] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-[#75F663]/50 focus:outline-none transition"
            >
              <option value="">Select a budget range...</option>
              {budgetRanges.map((range) => (
                <option key={range} value={range}>
                  {range}
                </option>
              ))}
            </select>
          </div>

          {/* Additional Details */}
          <div>
            <label className="block text-sm font-medium text-[#4a5e3a] mb-2">
              Additional Details / Special Requests (Optional)
            </label>
            <textarea
              name="details"
              value={formData.details}
              onChange={handleInputChange}
              rows={4}
              className="w-full bg-white/5 border border-white/[0.06] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-[#75F663]/50 focus:outline-none transition resize-none"
              placeholder="Tell us anything else we should know about your event..."
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#449531] hover:bg-[#3a8229] disabled:bg-gray-600 text-white font-bold py-4 rounded-xl transition"
          >
            {loading ? "Submitting..." : "Request Quote"}
          </button>

          <p className="text-xs text-[#9a9080] text-center">
            We'll get back to you within 24 hours.
          </p>
        </form>
      </div>
    </section>
  );
}
