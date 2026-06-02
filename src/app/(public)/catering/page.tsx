"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  UtensilsCrossed,
  School,
  Building2,
  Users,
  Calendar,
  Clock,
  MapPin,
  Phone,
  Mail,
  User,
  FileText,
  CheckCircle2,
  ChevronRight,
  Loader2,
} from "lucide-react";
import Link from "next/link";

const STORE_ID = "b0000000-0000-0000-0000-000000000001";

type OrderType = "event" | "school" | "corporate" | null;

interface CateringPackage {
  id: string;
  name: string;
  description: string;
  price_per_person: number;
  min_guests: number;
  max_guests: number;
  sort_order: number;
}

const ORDER_TYPES = [
  {
    id: "event" as OrderType,
    label: "Event Catering",
    description: "Birthday parties, weddings, celebrations & social gatherings",
    icon: UtensilsCrossed,
    examples: ["Birthday Parties", "Weddings", "Private Events"],
  },
  {
    id: "school" as OrderType,
    label: "School Catering",
    description: "Recurring school lunches, district meal programs & student events",
    icon: School,
    examples: ["School Lunches", "District Programs", "Field Trips"],
  },
  {
    id: "corporate" as OrderType,
    label: "Corporate Catering",
    description: "Team lunches, executive meetings, office events & conferences",
    icon: Building2,
    examples: ["Team Lunches", "Board Meetings", "Office Events"],
  },
];

const DIETARY_OPTIONS = [
  { id: "vegetarian", label: "Vegetarian" },
  { id: "vegan", label: "Vegan" },
  { id: "gluten-free", label: "Gluten-Free" },
  { id: "halal", label: "Halal" },
  { id: "kosher", label: "Kosher" },
  { id: "nut-free", label: "Nut-Free" },
];

export default function CateringPage() {
  const [packages, setPackages] = useState<CateringPackage[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(true);
  const [selectedType, setSelectedType] = useState<OrderType>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [submitError, setSubmitError] = useState("");

  // Form fields
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [eventName, setEventName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [venueName, setVenueName] = useState("");
  const [venueAddress, setVenueAddress] = useState("");
  const [estimatedGuests, setEstimatedGuests] = useState<number | "">("");
  const [selectedPackageId, setSelectedPackageId] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [selectedDietary, setSelectedDietary] = useState<string[]>([]);

  // School fields
  const [schoolName, setSchoolName] = useState("");
  const [schoolDistrict, setSchoolDistrict] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [contractStartDate, setContractStartDate] = useState("");
  const [contractEndDate, setContractEndDate] = useState("");

  // Corporate fields
  const [companyName, setCompanyName] = useState("");
  const [department, setDepartment] = useState("");
  const [poNumber, setPoNumber] = useState("");
  const [billingContactName, setBillingContactName] = useState("");
  const [billingContactEmail, setBillingContactEmail] = useState("");
  const [billingAddress, setBillingAddress] = useState("");

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();

      // Fetch packages
      const { data: pkgs } = await supabase
        .from("catering_packages")
        .select("*")
        .eq("store_id", STORE_ID)
        .eq("is_active", true)
        .order("sort_order");

      if (pkgs) setPackages(pkgs);
      setLoadingPackages(false);

      // Pre-fill from auth
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setContactEmail(user.email ?? "");
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, phone")
          .eq("id", user.id)
          .single();
        if (profile) {
          setContactName(profile.full_name ?? "");
          setContactPhone(profile.phone ?? "");
        }
      }
    }
    fetchData();
  }, []);

  function toggleDietary(id: string) {
    setSelectedDietary((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  }

  const selectedPackage = packages.find((p) => p.id === selectedPackageId);
  const estimatedTotal =
    selectedPackage && estimatedGuests
      ? Number(estimatedGuests) * selectedPackage.price_per_person
      : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError("");

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const num = `CAT-${Date.now()}`;

    const payload: Record<string, unknown> = {
      store_id: STORE_ID,
      customer_id: user?.id ?? null,
      order_number: num,
      package_id: selectedPackageId || null,
      event_name: eventName,
      event_date: eventDate,
      event_time: eventTime,
      venue_name: venueName,
      venue_address: venueAddress,
      contact_name: contactName,
      contact_phone: contactPhone,
      contact_email: contactEmail,
      estimated_guests: estimatedGuests ? Number(estimatedGuests) : null,
      dietary_requirements: selectedDietary,
      special_instructions: specialInstructions,
      order_type: selectedType,
      status: "inquiry",
      payment_status: "unpaid",
      total_amount: estimatedTotal,
    };

    if (selectedType === "school") {
      payload.school_name = schoolName;
      payload.school_district = schoolDistrict;
      payload.is_recurring = isRecurring;
      if (isRecurring) {
        payload.contract_start_date = contractStartDate || null;
        payload.contract_end_date = contractEndDate || null;
      }
    }

    if (selectedType === "corporate") {
      payload.company_name = companyName;
      payload.department = department;
      payload.po_number = poNumber;
      payload.billing_contact_name = billingContactName;
      payload.billing_contact_email = billingContactEmail;
      payload.billing_address = billingAddress;
    }

    const { error } = await supabase.from("catering_orders").insert(payload);

    if (error) {
      setSubmitError(error.message);
      setSubmitting(false);
      return;
    }

    setOrderNumber(num);
    setSubmitted(true);
    setSubmitting(false);
  }

  // ── Confirmation screen ──
  if (submitted) {
    return (
      <div className="min-h-screen bg-[#faf8f3] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-[#e9f0e4] flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10 text-[#3d6b2a]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#1e2d18] mb-2">Request Submitted!</h1>
            <p className="text-[#7a7060]">
              Our team will reach out within 24 hours to confirm your catering details.
            </p>
          </div>
          <div className="bg-white border border-[#ddd8cc] rounded-2xl p-6 space-y-1">
            <p className="text-[#9a9080] text-sm">Your order number</p>
            <p className="text-[#3d6b2a] text-2xl font-mono font-bold">{orderNumber}</p>
            <p className="text-[#7a7060] text-sm mt-1">Save this for your records</p>
          </div>
          <Link
            href="/"
            className="inline-block px-6 py-3 rounded-xl bg-[#449531] hover:bg-[#449531]/80 text-[#1e2d18] font-semibold transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf8f3] text-[#1e2d18]">
      {/* Hero */}
      <div className="relative overflow-hidden border-b border-[#ddd8cc]">
        <div className="absolute inset-0 bg-gradient-to-br from-[#449531]/20 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-5xl mx-auto px-4 py-16 sm:py-24 relative">
          <div className="inline-flex items-center gap-2 bg-[#e9f0e4] border border-[#3d6b2a] rounded-full px-4 py-1.5 text-sm text-[#3d6b2a] font-medium mb-6">
            <UtensilsCrossed className="w-4 h-4" />
            Catering &amp; Events
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-[#1e2d18] mb-4 leading-tight">
            Catering &amp; Events
          </h1>
          <p className="text-lg sm:text-xl text-[#7a7060] max-w-2xl">
            From school lunches to corporate events — fresh, chef-crafted meals for any occasion.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-12 space-y-14">

        {/* Order type selector */}
        <section>
          <h2 className="text-xl font-semibold text-[#1e2d18] mb-2">What type of catering do you need?</h2>
          <p className="text-[#7a7060] text-sm mb-6">Select the category that best describes your event.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {ORDER_TYPES.map((type) => {
              const Icon = type.icon;
              const active = selectedType === type.id;
              return (
                <button
                  key={type.id}
                  onClick={() => setSelectedType(type.id)}
                  className={`text-left rounded-2xl border p-6 transition-all duration-200 ${
                    active
                      ? "border-[#3d6b2a] bg-[#e9f0e4] shadow-lg shadow-[#449531]/10"
                      : "border-[#ddd8cc] bg-white hover:border-[#ddd8cc] hover:bg-white/80"
                  }`}
                >
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${
                      active ? "bg-[#449531]/30" : "bg-[#f2efe8]"
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${active ? "text-[#3d6b2a]" : "text-[#7a7060]"}`} />
                  </div>
                  <h3 className={`font-semibold mb-1 ${active ? "text-[#1e2d18]" : "text-[#1e2d18]"}`}>
                    {type.label}
                  </h3>
                  <p className="text-[#9a9080] text-sm mb-3 leading-snug">{type.description}</p>
                  <div className="flex flex-wrap gap-1">
                    {type.examples.map((ex) => (
                      <span
                        key={ex}
                        className={`text-xs px-2 py-0.5 rounded-full border ${
                          active
                            ? "border-[#3d6b2a]/40 text-[#3d6b2a]/80 bg-[#e9f0e4]"
                            : "border-[#ddd8cc] text-[#9a9080]"
                        }`}
                      >
                        {ex}
                      </span>
                    ))}
                  </div>
                  {active && (
                    <div className="mt-4 flex items-center gap-1 text-[#3d6b2a] text-sm font-medium">
                      Selected <CheckCircle2 className="w-4 h-4" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* Package browser */}
        <section>
          <h2 className="text-xl font-semibold text-[#1e2d18] mb-2">Available Packages</h2>
          <p className="text-[#7a7060] text-sm mb-6">Browse our catering packages and select one in the form below.</p>
          {loadingPackages ? (
            <div className="flex items-center gap-3 text-[#9a9080] py-8">
              <Loader2 className="w-5 h-5 animate-spin" />
              Loading packages...
            </div>
          ) : packages.length === 0 ? (
            <div className="bg-white border border-[#ddd8cc] rounded-2xl p-8 text-center">
              <p className="text-[#9a9080]">No packages available at this time. Contact us for a custom quote.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {packages.map((pkg) => (
                <div
                  key={pkg.id}
                  className="bg-white border border-[#ddd8cc] rounded-2xl p-5 flex flex-col gap-3 hover:border-[#ddd8cc] transition-colors"
                >
                  <div>
                    <h3 className="font-semibold text-[#1e2d18] text-base">{pkg.name}</h3>
                    {pkg.description && (
                      <p className="text-[#7a7060] text-sm mt-1 leading-snug">{pkg.description}</p>
                    )}
                  </div>
                  <div className="flex items-end justify-between mt-auto pt-2 border-t border-[#ddd8cc]">
                    <div>
                      <p className="text-[#3d6b2a] text-lg font-bold">
                        ${Number(pkg.price_per_person).toFixed(2)}
                        <span className="text-[#9a9080] text-sm font-normal"> / person</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-[#9a9080] text-xs">
                      <Users className="w-3.5 h-3.5" />
                      {pkg.min_guests}–{pkg.max_guests} guests
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Request form — shown after type selection */}
        {selectedType && (
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-full bg-[#e9f0e4] flex items-center justify-center">
                <FileText className="w-4 h-4 text-[#3d6b2a]" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-[#1e2d18]">Catering Request</h2>
                <p className="text-[#7a7060] text-sm">Fill out the details below and we'll get back to you within 24 hours.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">

              {/* Contact info */}
              <fieldset className="bg-white border border-[#ddd8cc] rounded-2xl p-6 space-y-4">
                <legend className="text-sm font-semibold text-[#4a5e3a] px-1 mb-4 flex items-center gap-2">
                  <User className="w-4 h-4 text-[#3d6b2a]" /> Contact Information
                </legend>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm text-[#7a7060]">Full Name <span className="text-[#dc2626]">*</span></label>
                    <input
                      required
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="Jane Smith"
                      className="w-full bg-[#faf8f3] border border-[#ddd8cc] rounded-xl px-4 py-2.5 text-[#1e2d18] placeholder-gray-600 focus:outline-none focus:border-[#3d6b2a] transition-colors"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm text-[#7a7060]">Email <span className="text-[#dc2626]">*</span></label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9a9080]" />
                      <input
                        required
                        type="email"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        placeholder="jane@example.com"
                        className="w-full bg-[#faf8f3] border border-[#ddd8cc] rounded-xl pl-10 pr-4 py-2.5 text-[#1e2d18] placeholder-gray-600 focus:outline-none focus:border-[#3d6b2a] transition-colors"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm text-[#7a7060]">Phone <span className="text-[#dc2626]">*</span></label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9a9080]" />
                      <input
                        required
                        type="tel"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        placeholder="(555) 000-0000"
                        className="w-full bg-[#faf8f3] border border-[#ddd8cc] rounded-xl pl-10 pr-4 py-2.5 text-[#1e2d18] placeholder-gray-600 focus:outline-none focus:border-[#3d6b2a] transition-colors"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm text-[#7a7060]">Order Type</label>
                    <div className="bg-[#faf8f3] border border-[#ddd8cc] rounded-xl px-4 py-2.5 text-[#3d6b2a] font-medium capitalize flex items-center gap-2">
                      {selectedType === "event" && <UtensilsCrossed className="w-4 h-4" />}
                      {selectedType === "school" && <School className="w-4 h-4" />}
                      {selectedType === "corporate" && <Building2 className="w-4 h-4" />}
                      {ORDER_TYPES.find((t) => t.id === selectedType)?.label}
                    </div>
                  </div>
                </div>
              </fieldset>

              {/* Event details */}
              <fieldset className="bg-white border border-[#ddd8cc] rounded-2xl p-6 space-y-4">
                <legend className="text-sm font-semibold text-[#4a5e3a] px-1 mb-4 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#3d6b2a]" /> Event Details
                </legend>
                <div className="space-y-1.5">
                  <label className="text-sm text-[#7a7060]">Event Name <span className="text-[#dc2626]">*</span></label>
                  <input
                    required
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    placeholder="e.g. Annual Company Picnic"
                    className="w-full bg-[#faf8f3] border border-[#ddd8cc] rounded-xl px-4 py-2.5 text-[#1e2d18] placeholder-gray-600 focus:outline-none focus:border-[#3d6b2a] transition-colors"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm text-[#7a7060]">Event Date <span className="text-[#dc2626]">*</span></label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9a9080]" />
                      <input
                        required
                        type="date"
                        value={eventDate}
                        onChange={(e) => setEventDate(e.target.value)}
                        className="w-full bg-[#faf8f3] border border-[#ddd8cc] rounded-xl pl-10 pr-4 py-2.5 text-[#1e2d18] focus:outline-none focus:border-[#3d6b2a] transition-colors"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm text-[#7a7060]">Event Time <span className="text-[#dc2626]">*</span></label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9a9080]" />
                      <input
                        required
                        type="time"
                        value={eventTime}
                        onChange={(e) => setEventTime(e.target.value)}
                        className="w-full bg-[#faf8f3] border border-[#ddd8cc] rounded-xl pl-10 pr-4 py-2.5 text-[#1e2d18] focus:outline-none focus:border-[#3d6b2a] transition-colors"
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm text-[#7a7060]">Venue Name <span className="text-[#dc2626]">*</span></label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9a9080]" />
                    <input
                      required
                      value={venueName}
                      onChange={(e) => setVenueName(e.target.value)}
                      placeholder="e.g. The Grand Ballroom"
                      className="w-full bg-[#faf8f3] border border-[#ddd8cc] rounded-xl pl-10 pr-4 py-2.5 text-[#1e2d18] placeholder-gray-600 focus:outline-none focus:border-[#3d6b2a] transition-colors"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm text-[#7a7060]">Venue Address <span className="text-[#dc2626]">*</span></label>
                  <input
                    required
                    value={venueAddress}
                    onChange={(e) => setVenueAddress(e.target.value)}
                    placeholder="123 Main St, City, State 00000"
                    className="w-full bg-[#faf8f3] border border-[#ddd8cc] rounded-xl px-4 py-2.5 text-[#1e2d18] placeholder-gray-600 focus:outline-none focus:border-[#3d6b2a] transition-colors"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm text-[#7a7060]">Estimated Guests <span className="text-[#dc2626]">*</span></label>
                    <div className="relative">
                      <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9a9080]" />
                      <input
                        required
                        type="number"
                        min={1}
                        value={estimatedGuests}
                        onChange={(e) => setEstimatedGuests(e.target.value ? Number(e.target.value) : "")}
                        placeholder="50"
                        className="w-full bg-[#faf8f3] border border-[#ddd8cc] rounded-xl pl-10 pr-4 py-2.5 text-[#1e2d18] placeholder-gray-600 focus:outline-none focus:border-[#3d6b2a] transition-colors"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm text-[#7a7060]">Select Package</label>
                    <select
                      value={selectedPackageId}
                      onChange={(e) => setSelectedPackageId(e.target.value)}
                      className="w-full bg-[#faf8f3] border border-[#ddd8cc] rounded-xl px-4 py-2.5 text-[#1e2d18] focus:outline-none focus:border-[#3d6b2a] transition-colors"
                    >
                      <option value="">— Choose a package —</option>
                      {packages.map((pkg) => (
                        <option key={pkg.id} value={pkg.id}>
                          {pkg.name} (${Number(pkg.price_per_person).toFixed(2)}/person)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                {estimatedTotal !== null && (
                  <div className="bg-[#e9f0e4] border border-[#3d6b2a] rounded-xl px-4 py-3 flex items-center justify-between">
                    <span className="text-[#4a5e3a] text-sm">Estimated Total</span>
                    <span className="text-[#3d6b2a] font-bold text-lg">
                      ${estimatedTotal.toFixed(2)}
                    </span>
                  </div>
                )}
              </fieldset>

              {/* School-specific fields */}
              {selectedType === "school" && (
                <fieldset className="bg-white border border-[#ddd8cc] rounded-2xl p-6 space-y-4">
                  <legend className="text-sm font-semibold text-[#4a5e3a] px-1 mb-4 flex items-center gap-2">
                    <School className="w-4 h-4 text-[#3d6b2a]" /> School Information
                  </legend>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm text-[#7a7060]">School Name <span className="text-[#dc2626]">*</span></label>
                      <input
                        required
                        value={schoolName}
                        onChange={(e) => setSchoolName(e.target.value)}
                        placeholder="Lincoln Elementary School"
                        className="w-full bg-[#faf8f3] border border-[#ddd8cc] rounded-xl px-4 py-2.5 text-[#1e2d18] placeholder-gray-600 focus:outline-none focus:border-[#3d6b2a] transition-colors"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm text-[#7a7060]">School District</label>
                      <input
                        value={schoolDistrict}
                        onChange={(e) => setSchoolDistrict(e.target.value)}
                        placeholder="Westside Unified School District"
                        className="w-full bg-[#faf8f3] border border-[#ddd8cc] rounded-xl px-4 py-2.5 text-[#1e2d18] placeholder-gray-600 focus:outline-none focus:border-[#3d6b2a] transition-colors"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setIsRecurring(!isRecurring)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        isRecurring ? "bg-[#449531]" : "bg-[#e9f0e4]"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          isRecurring ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                    <span className="text-[#4a5e3a] text-sm">Recurring program / ongoing contract</span>
                  </div>
                  {isRecurring && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                      <div className="space-y-1.5">
                        <label className="text-sm text-[#7a7060]">Contract Start Date</label>
                        <input
                          type="date"
                          value={contractStartDate}
                          onChange={(e) => setContractStartDate(e.target.value)}
                          className="w-full bg-[#faf8f3] border border-[#ddd8cc] rounded-xl px-4 py-2.5 text-[#1e2d18] focus:outline-none focus:border-[#3d6b2a] transition-colors"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm text-[#7a7060]">Contract End Date</label>
                        <input
                          type="date"
                          value={contractEndDate}
                          onChange={(e) => setContractEndDate(e.target.value)}
                          className="w-full bg-[#faf8f3] border border-[#ddd8cc] rounded-xl px-4 py-2.5 text-[#1e2d18] focus:outline-none focus:border-[#3d6b2a] transition-colors"
                        />
                      </div>
                    </div>
                  )}
                </fieldset>
              )}

              {/* Corporate-specific fields */}
              {selectedType === "corporate" && (
                <fieldset className="bg-white border border-[#ddd8cc] rounded-2xl p-6 space-y-4">
                  <legend className="text-sm font-semibold text-[#4a5e3a] px-1 mb-4 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-[#3d6b2a]" /> Corporate Information
                  </legend>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm text-[#7a7060]">Company Name <span className="text-[#dc2626]">*</span></label>
                      <input
                        required
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="Acme Corporation"
                        className="w-full bg-[#faf8f3] border border-[#ddd8cc] rounded-xl px-4 py-2.5 text-[#1e2d18] placeholder-gray-600 focus:outline-none focus:border-[#3d6b2a] transition-colors"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm text-[#7a7060]">Department</label>
                      <input
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        placeholder="Engineering, Marketing, etc."
                        className="w-full bg-[#faf8f3] border border-[#ddd8cc] rounded-xl px-4 py-2.5 text-[#1e2d18] placeholder-gray-600 focus:outline-none focus:border-[#3d6b2a] transition-colors"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm text-[#7a7060]">PO Number</label>
                      <input
                        value={poNumber}
                        onChange={(e) => setPoNumber(e.target.value)}
                        placeholder="PO-12345"
                        className="w-full bg-[#faf8f3] border border-[#ddd8cc] rounded-xl px-4 py-2.5 text-[#1e2d18] placeholder-gray-600 focus:outline-none focus:border-[#3d6b2a] transition-colors"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm text-[#7a7060]">Billing Contact Name</label>
                      <input
                        value={billingContactName}
                        onChange={(e) => setBillingContactName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full bg-[#faf8f3] border border-[#ddd8cc] rounded-xl px-4 py-2.5 text-[#1e2d18] placeholder-gray-600 focus:outline-none focus:border-[#3d6b2a] transition-colors"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm text-[#7a7060]">Billing Contact Email</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9a9080]" />
                        <input
                          type="email"
                          value={billingContactEmail}
                          onChange={(e) => setBillingContactEmail(e.target.value)}
                          placeholder="billing@acme.com"
                          className="w-full bg-[#faf8f3] border border-[#ddd8cc] rounded-xl pl-10 pr-4 py-2.5 text-[#1e2d18] placeholder-gray-600 focus:outline-none focus:border-[#3d6b2a] transition-colors"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm text-[#7a7060]">Billing Address</label>
                    <input
                      value={billingAddress}
                      onChange={(e) => setBillingAddress(e.target.value)}
                      placeholder="456 Corporate Blvd, Suite 100, City, State 00000"
                      className="w-full bg-[#faf8f3] border border-[#ddd8cc] rounded-xl px-4 py-2.5 text-[#1e2d18] placeholder-gray-600 focus:outline-none focus:border-[#3d6b2a] transition-colors"
                    />
                  </div>
                </fieldset>
              )}

              {/* Dietary + special instructions */}
              <fieldset className="bg-white border border-[#ddd8cc] rounded-2xl p-6 space-y-5">
                <legend className="text-sm font-semibold text-[#4a5e3a] px-1 mb-4 flex items-center gap-2">
                  <UtensilsCrossed className="w-4 h-4 text-[#3d6b2a]" /> Dietary &amp; Special Requests
                </legend>
                <div>
                  <p className="text-sm text-[#7a7060] mb-3">Dietary requirements (select all that apply)</p>
                  <div className="flex flex-wrap gap-2">
                    {DIETARY_OPTIONS.map((opt) => {
                      const checked = selectedDietary.includes(opt.id);
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => toggleDietary(opt.id)}
                          className={`px-3 py-1.5 rounded-xl border text-sm transition-all ${
                            checked
                              ? "border-[#3d6b2a] bg-[#e9f0e4] text-[#3d6b2a]"
                              : "border-[#ddd8cc] bg-[#faf8f3] text-[#7a7060] hover:border-[#ddd8cc]"
                          }`}
                        >
                          {checked && <span className="mr-1">✓</span>}
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm text-[#7a7060]">Special Instructions</label>
                  <textarea
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                    placeholder="Any allergies, special setup needs, serving preferences, or other details we should know..."
                    rows={4}
                    className="w-full bg-[#faf8f3] border border-[#ddd8cc] rounded-xl px-4 py-2.5 text-[#1e2d18] placeholder-gray-600 focus:outline-none focus:border-[#3d6b2a] transition-colors resize-none"
                  />
                </div>
              </fieldset>

              {submitError && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-[#dc2626] text-sm">
                  {submitError}
                </div>
              )}

              {/* Submit */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-[#449531] hover:bg-[#449531]/80 disabled:opacity-50 disabled:cursor-not-allowed text-[#1e2d18] font-semibold transition-colors text-base"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      Submit Catering Request
                      <ChevronRight className="w-5 h-5" />
                    </>
                  )}
                </button>
                <p className="text-[#9a9080] text-sm text-center sm:text-left">
                  No payment required now — this is an inquiry only.
                </p>
              </div>
            </form>
          </section>
        )}

        {/* CTA if no type selected yet */}
        {!selectedType && (
          <div className="text-center py-6 text-[#9a9080] text-sm">
            Select a catering type above to see the request form.
          </div>
        )}

        {/* Footer note */}
        <div className="border-t border-[#ddd8cc] pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-[#9a9080]">
          <p>Questions? Contact us at <span className="text-[#7a7060]">catering@madfreshkitchen.com</span></p>
          <Link href="/" className="text-[#7a7060] hover:text-[#3d6b2a] transition-colors flex items-center gap-1">
            ← Back to Mad Fresh Kitchen
          </Link>
        </div>
      </div>
    </div>
  );
}
