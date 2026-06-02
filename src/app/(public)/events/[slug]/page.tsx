"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle,
  Heart,
  AlertCircle,
  Loader,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import SafeHTML from "@/components/SafeHTML";
import { Event } from "@/types/database";
import { sendRsvpConfirmationEmail } from "@/app/actions/send-emails";

type MealPref = "chicken" | "steak" | "salmon" | "tofu" | "no_preference";

/* Floating food items — same as /register page */
const floatingFoods = [
  { emoji: "🥑", top: "5%", left: "3%", size: "text-4xl", delay: "0s", duration: "18s" },
  { emoji: "🥦", top: "12%", right: "5%", size: "text-3xl", delay: "2s", duration: "22s" },
  { emoji: "🍋", top: "25%", left: "6%", size: "text-2xl", delay: "4s", duration: "20s" },
  { emoji: "🥬", top: "40%", right: "4%", size: "text-4xl", delay: "1s", duration: "24s" },
  { emoji: "🫑", top: "55%", left: "2%", size: "text-3xl", delay: "3s", duration: "19s" },
  { emoji: "🍃", top: "68%", right: "6%", size: "text-2xl", delay: "5s", duration: "21s" },
  { emoji: "🥒", top: "78%", left: "5%", size: "text-3xl", delay: "2s", duration: "23s" },
  { emoji: "🌿", top: "85%", right: "3%", size: "text-2xl", delay: "4s", duration: "17s" },
  { emoji: "🥝", top: "15%", left: "90%", size: "text-2xl", delay: "6s", duration: "20s" },
  { emoji: "🥗", top: "50%", left: "92%", size: "text-3xl", delay: "0s", duration: "25s" },
  { emoji: "🌱", top: "35%", left: "1%", size: "text-xl", delay: "7s", duration: "16s" },
  { emoji: "🍈", top: "92%", right: "10%", size: "text-2xl", delay: "3s", duration: "22s" },
];

export default function EventPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"form" | "success">("form");
  const [submitLoading, setSubmitLoading] = useState(false);

  // Form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [guests, setGuests] = useState(1);
  const [mealPref, setMealPref] = useState<MealPref>("no_preference");
  const [dietaryNotes, setDietaryNotes] = useState("");
  const [joinNewsletter, setJoinNewsletter] = useState(true);
  const [submitError, setSubmitError] = useState("");

  // Fetch event from DB
  useEffect(() => {
    async function fetchEvent() {
      if (!slug) return;
      try {
        const supabase = createClient();
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);

        let data = null;
        if (isUUID) {
          const res = await supabase.from("events").select("*").eq("id", slug).single();
          data = res.data;
        }
        if (!data) {
          const res = await supabase.from("events").select("*").eq("slug", slug).single();
          data = res.data;
        }

        if (!data) {
          setError("Event not found");
          return;
        }
        setEvent(data);
      } catch {
        setError("Failed to load event");
      } finally {
        setLoading(false);
      }
    }
    fetchEvent();
  }, [slug]);

  async function handleRSVP(e: React.FormEvent) {
    e.preventDefault();
    if (!event) return;

    setSubmitLoading(true);
    setSubmitError("");

    try {
      const supabase = createClient();

      const { error: rsvpError } = await supabase.from("event_rsvps").insert({
        event_id: event.id,
        first_name: firstName,
        last_name: lastName || "",
        email,
        phone: phone || null,
        guest_count: guests,
        meal_preferences: { preference: mealPref },
        dietary_restrictions: dietaryNotes ? { notes: dietaryNotes } : null,
        custom_responses: { join_newsletter: joinNewsletter },
        status: "confirmed",
        joined_newsletter: joinNewsletter,
        joined_waitlist: true,
      });

      if (rsvpError && rsvpError.code !== "23505") {
        setSubmitError("Something went wrong. Please try again.");
        setSubmitLoading(false);
        return;
      }

      const tags = [event.slug, "waitlist", "pre-launch"];
      if (joinNewsletter) tags.push("newsletter");

      await supabase.from("contacts").upsert(
        {
          store_id: event.store_id,
          email,
          first_name: firstName,
          last_name: lastName || null,
          phone: phone || null,
          source: "event_rsvp",
          tags,
          is_newsletter_subscribed: joinNewsletter,
          is_waitlist_member: true,
        },
        { onConflict: "store_id,email" }
      );

      // Send confirmation email (fire-and-forget via server action — errors logged server-side)
      sendRsvpConfirmationEmail({ firstName, email, guestCount: guests, eventId: event.id }).catch((err) => {
        console.error("[RSVP] Email send failed:", err);
      });

      setStep("success");

      // Redirect to waitlist after delay
      setTimeout(() => {
        router.push(
          `/register/waitlist?name=${encodeURIComponent(firstName)}&email=${encodeURIComponent(email)}`
        );
      }, 8000);
    } catch {
      setSubmitError("Something went wrong. Please try again.");
    } finally {
      setSubmitLoading(false);
    }
  }

  // Format helpers
  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${String(minutes).padStart(2, "0")} ${period}`;
  };

  const formatDate = (dateStr: string) => {
    // Parse as local date parts to avoid timezone shift
    const [year, month, day] = dateStr.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  // Build calendar event dates using America/Phoenix timezone (no DST)
  const getCalendarDates = () => {
    if (!event) return { start: "", end: "" };
    const d = event.event_date.replace(/-/g, "");
    const startHM = event.start_time.replace(/:/g, "").slice(0, 4);
    const endHM = event.end_time.replace(/:/g, "").slice(0, 4);
    // Google Calendar format: use local times (no Z suffix) with ctz param
    return {
      start: `${d}T${startHM}00`,
      end: `${d}T${endHM}00`,
    };
  };

  const getIcsContent = () => {
    if (!event) return "";
    const cal = getCalendarDates();
    return [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Mad Fresh Kitchen//EN",
      "BEGIN:VEVENT",
      `DTSTART;TZID=America/Phoenix:${cal.start}`,
      `DTEND;TZID=America/Phoenix:${cal.end}`,
      `SUMMARY:${event.name}`,
      `DESCRIPTION:${(event.description || "Join us for this Mad Fresh event!").replace(/\n/g, "\\n")}`,
      `LOCATION:${event.venue_address || event.venue_name || ""}`,
      "STATUS:CONFIRMED",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
  };

  /* ─── Full-screen standalone layout (covers parent navbar) ─── */
  return (
    <main className="fixed inset-0 z-50 overflow-y-auto flex flex-col" style={{ marginTop: "-4rem" }}>
      {/* === BACKGROUND === */}
      <div className="fixed inset-0 bg-gradient-to-br from-[#0a1f0a] via-[#0d2b0d] to-[#0a1a0a]" />

      {/* Organic green glow spots */}
      <div className="fixed top-[-10%] right-[-5%] w-[500px] h-[500px] bg-[#3d6b2a]/15 rounded-full blur-[120px]" />
      <div className="fixed bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-[#3d6b2a]/8 rounded-full blur-[140px]" />
      <div className="fixed top-[40%] left-[50%] -translate-x-1/2 w-[400px] h-[400px] bg-[#3d6b2a]/6 rounded-full blur-[100px]" />

      {/* Subtle grid texture */}
      <div
        className="fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(117,246,99,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(117,246,99,0.3) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Floating food items */}
      {floatingFoods.map((food, i) => (
        <div
          key={i}
          className={`fixed ${food.size} opacity-[0.12] pointer-events-none select-none`}
          style={{
            top: food.top,
            left: food.left,
            right: food.right,
            animation: `floatFood ${food.duration} ease-in-out ${food.delay} infinite`,
          }}
        >
          {food.emoji}
        </div>
      ))}

      {/* === CONTENT === */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header — standalone branding, no site nav */}
        <header className="w-full py-6 px-6">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <span className="text-2xl font-bold text-[#1e2d18] tracking-tight">
              MAD <span className="text-[#3d6b2a]">FRESH</span>
            </span>
            <span className="text-xs text-[#3d6b2a]/60 font-medium uppercase tracking-widest hidden sm:block">
              Tempe, Arizona
            </span>
          </div>
        </header>

        {/* Loading state */}
        {loading && (
          <div className="flex-1 flex items-center justify-center">
            <Loader className="animate-spin text-[#3d6b2a]" size={32} />
          </div>
        )}

        {/* Error state */}
        {!loading && (error || !event) && (
          <div className="flex-1 flex items-center justify-center px-4">
            <div className="backdrop-blur-xl bg-[#f2efe8] border border-[#ddd8cc] rounded-3xl p-8 sm:p-12 text-center max-w-md w-full">
              <AlertCircle size={48} className="text-red-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-[#1e2d18] mb-2">{error || "Event not found"}</h2>
              <p className="text-[#9a9080] text-sm">This event may have ended or the link may be incorrect.</p>
            </div>
          </div>
        )}

        {/* Event content */}
        {!loading && event && (
          <div className="flex-1 flex items-start justify-center px-4 sm:px-6 pb-16">
            <div className="max-w-4xl w-full">
              {/* Event header card */}
              <div className="backdrop-blur-xl bg-[#f2efe8] border border-[#ddd8cc] rounded-3xl p-8 sm:p-12 mb-8 shadow-2xl shadow-[#449531]/5">
                <div className="inline-flex items-center gap-2 bg-[#3d6b2a]/10 border border-[#75F663]/20 rounded-full px-4 py-1.5 mb-6">
                  <span className="w-2 h-2 bg-[#3d6b2a] rounded-full animate-pulse" />
                  <span className="text-sm text-[#3d6b2a] font-medium">
                    {event.is_free ? "Free Event" : `$${event.ticket_price}`}
                    {event.max_capacity && ` — Limited to ${event.max_capacity} Guests`}
                  </span>
                </div>

                <h1 className="text-4xl sm:text-5xl font-black text-[#1e2d18] tracking-tight mb-2">
                  Mad Fresh
                </h1>
                <h2 className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-[#75F663] to-[#449531] bg-clip-text text-transparent mb-6">
                  {event.name.replace(/^Mad Fresh\s*/i, "")}
                </h2>

                <div className="grid sm:grid-cols-2 gap-3 mb-6">
                  <div className="flex items-center gap-3 bg-white/[0.03] rounded-xl px-4 py-3">
                    <Calendar size={18} className="text-[#3d6b2a]" />
                    <span className="text-[#4a5e3a] text-sm">{formatDate(event.event_date)}</span>
                  </div>
                  <div className="flex items-center gap-3 bg-white/[0.03] rounded-xl px-4 py-3">
                    <Clock size={18} className="text-[#3d6b2a]" />
                    <span className="text-[#4a5e3a] text-sm">
                      {formatTime(event.start_time)} – {formatTime(event.end_time)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 bg-white/[0.03] rounded-xl px-4 py-3">
                    <MapPin size={18} className="text-[#3d6b2a]" />
                    <span className="text-[#4a5e3a] text-sm">
                      {event.venue_address || event.venue_name}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 bg-white/[0.03] rounded-xl px-4 py-3">
                    <Users size={18} className="text-[#3d6b2a]" />
                    <span className="text-[#4a5e3a] text-sm">
                      {event.max_capacity
                        ? `${event.max_capacity - (event.current_rsvp_count || 0)} spots available`
                        : "Open event"}
                    </span>
                  </div>
                </div>

                {/* Description */}
                {event.description_html ? (
                  <SafeHTML
                    html={event.description_html}
                    className="text-[#7a7060] leading-relaxed max-w-2xl text-sm sm:text-base space-y-3 [&_strong]:text-[#1e2d18] [&_strong]:font-semibold [&_em]:text-[#3d6b2a] [&_em]:not-italic [&_em]:font-medium"
                  />
                ) : event.description ? (
                  <div className="text-[#7a7060] leading-relaxed max-w-2xl text-sm sm:text-base space-y-3">
                    <p>
                      After 8 years feeding the Valley, <strong className="text-[#1e2d18] font-semibold">Mad Fresh is going digital</strong> — and you get to be in the room when it happens.
                    </p>
                    <p>
                      Be the <em className="text-[#3d6b2a] not-italic font-medium">first to access the app</em>, lock in{" "}
                      <strong className="text-[#1e2d18] font-semibold">founding member pricing that never goes up</strong>, and taste the bowls that keep your week on track so you never{" "}
                      <em className="italic">go mad</em> without your Mad Fresh meals again.
                    </p>
                    <p className="text-[#4a5e3a] font-medium">
                      Amazing food. Powerful connections.{" "}
                      <span className="text-[#3d6b2a]">Limited to {event.max_capacity || 100}</span> — once it&apos;s full, it&apos;s full.
                    </p>
                  </div>
                ) : null}
              </div>

              {/* Success / Form */}
              {step === "success" ? (
                <div className="backdrop-blur-xl bg-[#f2efe8] border border-[#ddd8cc] rounded-3xl p-8 sm:p-12 text-center space-y-6 shadow-2xl shadow-[#449531]/5">
                  <div className="w-20 h-20 rounded-full bg-[#3d6b2a]/10 flex items-center justify-center mx-auto">
                    <CheckCircle size={44} className="text-[#3d6b2a]" />
                  </div>
                  <h2 className="text-3xl font-black text-[#1e2d18]">You&apos;re in!</h2>
                  <p className="text-[#7a7060] text-lg max-w-md mx-auto">
                    Confirmation headed to{" "}
                    <strong className="text-[#3d6b2a]">{email}</strong>. See you there!
                  </p>
                  <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 max-w-md mx-auto">
                    <Heart size={24} className="text-[#3d6b2a] mx-auto mb-3" />
                    <p className="text-sm text-[#7a7060]">
                      Every $5 feeds a meal to someone in need. Donations will be
                      available on launch day.
                    </p>
                  </div>

                  {/* Add to Calendar */}
                  <div className="space-y-3 max-w-sm mx-auto">
                    <p className="text-xs text-[#9a9080] uppercase tracking-widest font-medium">Add to Calendar</p>
                    <div className="grid grid-cols-3 gap-2">
                      <a
                        href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.name)}&dates=${getCalendarDates().start}/${getCalendarDates().end}&ctz=America/Phoenix&details=${encodeURIComponent(event.description || "Join us for this Mad Fresh event!")}&location=${encodeURIComponent(event.venue_address || event.venue_name || "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-col items-center gap-1.5 bg-[#f2efe8] hover:bg-white/[0.08] border border-[#ddd8cc] rounded-xl px-3 py-3 transition-all group"
                      >
                        <svg viewBox="0 0 24 24" className="w-5 h-5 text-[#3d6b2a] group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                        <span className="text-xs text-[#7a7060] group-hover:text-[#1e2d18] transition-colors">Google</span>
                      </a>
                      <a
                        href={`data:text/calendar;charset=utf-8,${encodeURIComponent(getIcsContent())}`}
                        download={`${event.slug}.ics`}
                        className="flex flex-col items-center gap-1.5 bg-[#f2efe8] hover:bg-white/[0.08] border border-[#ddd8cc] rounded-xl px-3 py-3 transition-all group"
                      >
                        <svg viewBox="0 0 24 24" className="w-5 h-5 text-[#3d6b2a] group-hover:scale-110 transition-transform" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
                        <span className="text-xs text-[#7a7060] group-hover:text-[#1e2d18] transition-colors">Apple</span>
                      </a>
                      <a
                        href={`data:text/calendar;charset=utf-8,${encodeURIComponent(getIcsContent())}`}
                        download={`${event.slug}.ics`}
                        className="flex flex-col items-center gap-1.5 bg-[#f2efe8] hover:bg-white/[0.08] border border-[#ddd8cc] rounded-xl px-3 py-3 transition-all group"
                      >
                        <svg viewBox="0 0 24 24" className="w-5 h-5 text-[#3d6b2a] group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                        <span className="text-xs text-[#7a7060] group-hover:text-[#1e2d18] transition-colors">Outlook</span>
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-2 text-sm text-[#3d6b2a]/70">
                    <span className="w-1.5 h-1.5 bg-[#3d6b2a] rounded-full animate-pulse" />
                    Taking you to the waitlist...
                  </div>
                </div>
              ) : (
                <form
                  onSubmit={handleRSVP}
                  className="backdrop-blur-xl bg-[#f2efe8] border border-[#ddd8cc] rounded-3xl p-8 sm:p-12 space-y-6 shadow-2xl shadow-[#449531]/5"
                >
                  <div>
                    <h2 className="text-2xl font-bold text-[#1e2d18]">RSVP</h2>
                    <p className="text-[#9a9080] text-sm mt-1">Grab your free spot. Takes 30 seconds.</p>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-[#3d6b2a]/70 uppercase tracking-wider block mb-1.5 font-medium">First Name *</label>
                      <input type="text" required value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full bg-[#f2efe8] border border-[#ddd8cc] rounded-xl px-4 py-3 text-[#1e2d18] placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#75F663]/50 focus:border-[#75F663]/30 transition-all" />
                    </div>
                    <div>
                      <label className="text-xs text-[#3d6b2a]/70 uppercase tracking-wider block mb-1.5 font-medium">Last Name</label>
                      <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full bg-[#f2efe8] border border-[#ddd8cc] rounded-xl px-4 py-3 text-[#1e2d18] placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#75F663]/50 focus:border-[#75F663]/30 transition-all" />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-[#3d6b2a]/70 uppercase tracking-wider block mb-1.5 font-medium">Email *</label>
                      <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-[#f2efe8] border border-[#ddd8cc] rounded-xl px-4 py-3 text-[#1e2d18] placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#75F663]/50 focus:border-[#75F663]/30 transition-all" />
                    </div>
                    <div>
                      <label className="text-xs text-[#3d6b2a]/70 uppercase tracking-wider block mb-1.5 font-medium">Phone (optional)</label>
                      <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full bg-[#f2efe8] border border-[#ddd8cc] rounded-xl px-4 py-3 text-[#1e2d18] placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#75F663]/50 focus:border-[#75F663]/30 transition-all" />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-[#3d6b2a]/70 uppercase tracking-wider block mb-1.5 font-medium">Number of Guests *</label>
                      <select value={guests} onChange={(e) => setGuests(Number(e.target.value))} className="w-full bg-[#f2efe8] border border-[#ddd8cc] rounded-xl px-4 py-3 text-[#1e2d18] focus:outline-none focus:ring-2 focus:ring-[#75F663]/50 focus:border-[#75F663]/30 transition-all">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <option key={n} value={n} className="bg-[#0d2b0d]">{n} {n === 1 ? "guest" : "guests"}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-[#3d6b2a]/70 uppercase tracking-wider block mb-1.5 font-medium">Meal Preference</label>
                      <select value={mealPref} onChange={(e) => setMealPref(e.target.value as MealPref)} className="w-full bg-[#f2efe8] border border-[#ddd8cc] rounded-xl px-4 py-3 text-[#1e2d18] focus:outline-none focus:ring-2 focus:ring-[#75F663]/50 focus:border-[#75F663]/30 transition-all">
                        <option value="no_preference" className="bg-[#0d2b0d]">No preference</option>
                        <option value="chicken" className="bg-[#0d2b0d]">Chicken</option>
                        <option value="steak" className="bg-[#0d2b0d]">Steak</option>
                        <option value="salmon" className="bg-[#0d2b0d]">Salmon</option>
                        <option value="tofu" className="bg-[#0d2b0d]">Tofu (Vegan)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-[#3d6b2a]/70 uppercase tracking-wider block mb-1.5 font-medium">Dietary Restrictions / Allergies</label>
                    <input type="text" placeholder="e.g., gluten-free, nut allergy" value={dietaryNotes} onChange={(e) => setDietaryNotes(e.target.value)} className="w-full bg-[#f2efe8] border border-[#ddd8cc] rounded-xl px-4 py-3 text-[#1e2d18] placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#75F663]/50 focus:border-[#75F663]/30 transition-all" />
                  </div>

                  <div className="pt-2">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={joinNewsletter} onChange={(e) => setJoinNewsletter(e.target.checked)} className="w-4 h-4 rounded border-[#ddd8cc] bg-[#f2efe8] text-[#449531] focus:ring-[#449531]" />
                      <span className="text-sm text-[#7a7060]">Send me updates and offers from Mad Fresh</span>
                    </label>
                  </div>

                  {submitError && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                      <p className="text-red-400 text-sm">{submitError}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitLoading}
                    className="w-full font-bold py-4 rounded-full text-lg disabled:opacity-50 transition-all bg-gradient-to-r from-[#449531] to-[#75F663] text-[#0a1f0a] hover:shadow-lg hover:shadow-[#449531]/25 active:scale-[0.99]"
                  >
                    {submitLoading ? "Confirming..." : "Confirm My Free RSVP"}
                  </button>

                  <p className="text-xs text-[#9a9080] text-center">
                    {event.is_free
                      ? "Free event. No payment required. We'll send confirmation to your email."
                      : "We'll send confirmation to your email."}
                  </p>
                </form>
              )}
            </div>
          </div>
        )}

        <footer className="py-6 text-center relative z-10">
          <p className="text-xs text-[#1e2d18]/20">
            &copy; {new Date().getFullYear()} Mad Fresh Kitchen LLC
          </p>
        </footer>
      </div>

      {/* Keyframe animations */}
      <style jsx>{`
        @keyframes floatFood {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          25% { transform: translateY(-15px) rotate(5deg); }
          50% { transform: translateY(-8px) rotate(-3deg); }
          75% { transform: translateY(-20px) rotate(4deg); }
        }
      `}</style>
    </main>
  );
}
