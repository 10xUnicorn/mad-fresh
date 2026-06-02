"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";


import { Calendar, MapPin, Users, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Event } from "@/types/database";

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchEvents() {
      try {
        const supabase = createClient();
        const { data, error: queryError } = await supabase
          .from("events")
          .select("*")
          .eq("status", "published")
          .order("event_date", { ascending: true });

        if (queryError) {
          setError("Failed to load events");
          return;
        }

        setEvents(data || []);
      } catch {
        setError("Something went wrong");
      } finally {
        setLoading(false);
      }
    }

    fetchEvents();
  }, []);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <>
      
      <main className="min-h-screen bg-[#faf8f3] pt-24 pb-16 relative overflow-hidden">
        {/* Organic glow spots */}
        <div className="absolute top-20 right-[-5%] w-[400px] h-[400px] bg-[#e9f0e4] rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-20 left-[-5%] w-[500px] h-[500px] bg-[#f2efe8] rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-[50%] left-[40%] w-[300px] h-[300px] bg-[#f2efe8] rounded-full blur-[80px] pointer-events-none" />
        {/* Subtle grid texture */}
        <div
          className="absolute inset-0 opacity-[0.02] pointer-events-none"
          style={{
            backgroundImage: "linear-gradient(rgba(61,107,42,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(61,107,42,0.08) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
        {/* Floating food accents */}
        <div className="absolute top-[8%] left-[4%] text-3xl opacity-[0.07] pointer-events-none select-none" style={{ animation: "floatEvents 18s ease-in-out infinite" }}>🥑</div>
        <div className="absolute top-[25%] right-[6%] text-2xl opacity-[0.05] pointer-events-none select-none" style={{ animation: "floatEvents 22s ease-in-out 2s infinite" }}>🥦</div>
        <div className="absolute top-[60%] left-[3%] text-2xl opacity-[0.06] pointer-events-none select-none" style={{ animation: "floatEvents 20s ease-in-out 4s infinite" }}>🍋</div>
        <div className="absolute top-[80%] right-[5%] text-3xl opacity-[0.05] pointer-events-none select-none" style={{ animation: "floatEvents 24s ease-in-out 1s infinite" }}>🥬</div>
        <style>{`
          @keyframes floatEvents {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            25% { transform: translateY(-12px) rotate(4deg); }
            50% { transform: translateY(-6px) rotate(-2deg); }
            75% { transform: translateY(-16px) rotate(3deg); }
          }
        `}</style>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          {/* Header */}
          <div className="mb-16 text-center">
            <h1 className="text-5xl sm:text-6xl font-black text-[#1e2d18] mb-4">
              Upcoming Events
            </h1>
            <p className="text-xl text-[#7a7060] max-w-2xl mx-auto">
              Join us for exclusive experiences, tastings, and launch parties.
            </p>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center items-center h-64">
              <div className="animate-pulse text-[#7a7060]">Loading events...</div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center text-[#dc2626] py-12">{error}</div>
          )}

          {/* Events Grid */}
          {!loading && events.length > 0 && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <Link
                  key={event.id}
                  href={`/events/${event.slug}`}
                  className="group"
                >
                  <div className="bg-white border border-[#ddd8cc] rounded-2xl overflow-hidden h-full flex flex-col hover:border-[#3d6b2a] transition">
                    {/* Image */}
                    {event.hero_image_url ? (
                      <div className="relative h-48 bg-[#f2efe8] overflow-hidden">
                        <Image
                          src={event.hero_image_url}
                          alt={event.name}
                          fill
                          className="object-cover group-hover:scale-105 transition duration-300"
                        />
                      </div>
                    ) : (
                      <div className="h-48 bg-gradient-to-br from-white/5 to-white/10 flex items-center justify-center">
                        <span className="text-[#9a9080]">No image</span>
                      </div>
                    )}

                    {/* Content */}
                    <div className="p-6 flex-grow flex flex-col">
                      <h3 className="text-xl font-bold text-white mb-3 group-hover:text-[#3d6b2a] transition line-clamp-2">
                        {event.name}
                      </h3>

                      <div className="space-y-2 mb-4 flex-grow">
                        <div className="flex items-center gap-2 text-sm text-[#7a7060]">
                          <Calendar size={16} className="flex-shrink-0" />
                          <span>{formatDate(event.event_date)}</span>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-[#7a7060]">
                          <MapPin size={16} className="flex-shrink-0" />
                          <span className="line-clamp-1">{event.venue_name}</span>
                        </div>

                        {event.max_capacity && (
                          <div className="flex items-center gap-2 text-sm text-[#7a7060]">
                            <Users size={16} className="flex-shrink-0" />
                            <span>
                              {event.current_rsvp_count || 0} of{" "}
                              {event.max_capacity} spots
                            </span>
                          </div>
                        )}
                      </div>

                      {/* CTA */}
                      <div className="flex items-center gap-2 text-[#3d6b2a] font-semibold text-sm mt-auto">
                        View Event
                        <ArrowRight size={16} className="group-hover:translate-x-1 transition" />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && events.length === 0 && (
            <div className="text-center py-16">
              <p className="text-[#7a7060] text-lg mb-4">
                No events scheduled yet.
              </p>
              <p className="text-[#9a9080]">Check back soon for exciting events!</p>
            </div>
          )}
        </div>
      </main>
      
    </>
  );
}
