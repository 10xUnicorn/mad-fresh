"use client";

import { useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Event } from "@/types/database";
import { Search, ChevronDown, Copy, Trash2, Edit2, Eye } from "lucide-react";

interface EventsListClientProps {
  initialEvents: Event[];
}

type EventStatus = "draft" | "published" | "sold_out" | "cancelled" | "completed";

const STATUS_COLORS: Record<EventStatus, { bg: string; text: string; badge: string }> = {
  draft: { bg: "bg-gray-50", text: "text-gray-700", badge: "bg-gray-200 text-gray-800" },
  published: { bg: "bg-green-50", text: "text-green-700", badge: "bg-green-200 text-green-800" },
  sold_out: { bg: "bg-yellow-50", text: "text-yellow-700", badge: "bg-yellow-200 text-yellow-800" },
  cancelled: { bg: "bg-red-50", text: "text-red-700", badge: "bg-red-200 text-red-800" },
  completed: { bg: "bg-blue-50", text: "text-blue-700", badge: "bg-blue-200 text-blue-800" },
};

const TEMPLATE_STYLES: Record<string, string> = {
  mad_fresh: "Mad Fresh",
  fire_smoke: "Fire & Smoke",
  clean_classic: "Clean Classic",
};

export default function EventsListClient({ initialEvents }: EventsListClientProps) {
  const [events, setEvents] = useState<Event[]>(initialEvents);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<EventStatus | "all">("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [cloningId, setCloningId] = useState<string | null>(null);
  const supabase = createClient();

  // Filter and search events
  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const matchesSearch =
        !searchQuery ||
        event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.venue_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.host_organization?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatusFilter =
        filterStatus === "all" || event.status === filterStatus;

      return matchesSearch && matchesStatusFilter;
    });
  }, [events, searchQuery, filterStatus]);

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Clone event
  const handleCloneEvent = async (event: Event) => {
    try {
      setCloningId(event.id);
      const newEventName = `Copy of ${event.name}`;

      const newSlug = newEventName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      const { data: newEvent, error } = await supabase
        .from("events")
        .insert({
          name: newEventName,
          slug: newSlug,
          description: event.description,
          description_html: event.description_html,
          event_date: event.event_date,
          start_time: event.start_time,
          end_time: event.end_time,
          venue_name: event.venue_name,
          venue_address: event.venue_address,
          max_capacity: event.max_capacity,
          is_free: event.is_free,
          ticket_price: event.ticket_price,
          hero_image_url: event.hero_image_url,
          cover_image_url: event.cover_image_url,
          collect_meal_preferences: event.collect_meal_preferences,
          donation_enabled: event.donation_enabled,
          donation_page_enabled: event.donation_page_enabled,
          donation_goal: event.donation_goal,
          waitlist_enabled: event.waitlist_enabled,
          newsletter_enabled: event.newsletter_enabled,
          host_organization: event.host_organization,
          host_logo_url: event.host_logo_url,
          host_contact_email: event.host_contact_email,
          host_contact_phone: event.host_contact_phone,
          template_style: event.template_style,
          tags: event.tags,
          status: "draft",
          store_id: event.store_id,
          current_rsvp_count: 0,
        })
        .select()
        .single();

      if (error) throw error;

      setEvents([newEvent, ...events]);
    } catch (error) {
      console.error("Error cloning event:", error);
      alert("Failed to clone event. Please try again.");
    } finally {
      setCloningId(null);
    }
  };

  // Delete event
  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm("Are you sure you want to delete this event? This action cannot be undone.")) {
      return;
    }

    try {
      setDeletingId(eventId);
      const { error } = await supabase
        .from("events")
        .delete()
        .eq("id", eventId);

      if (error) throw error;

      setEvents(events.filter((e) => e.id !== eventId));
    } catch (error) {
      console.error("Error deleting event:", error);
      alert("Failed to delete event. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  // Get unique statuses for filter
  const uniqueStatuses = Array.from(
    new Set(events.map((e) => e.status))
  ) as EventStatus[];

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      {/* Header with controls */}
      <div className="px-6 py-4 border-b border-gray-200 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search
              size={18}
              className="absolute left-3 top-3 text-[#9a9080]"
            />
            <input
              type="text"
              placeholder="Search by event name, venue, or organization..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#3d6b2a]/50 transition-colors"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as EventStatus | "all")}
              className="appearance-none px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 cursor-pointer focus:outline-none focus:border-[#3d6b2a]/50 transition-colors pr-10"
            >
              <option value="all">All Status</option>
              {uniqueStatuses.map((status) => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
            <ChevronDown
              size={16}
              className="absolute right-3 top-3 text-[#9a9080] pointer-events-none"
            />
          </div>
        </div>

        {/* Result count */}
        <p className="text-sm text-[#9a9080]">
          Showing {filteredEvents.length} of {events.length} events
        </p>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
        {filteredEvents.length > 0 ? (
          filteredEvents.map((event) => {
            const colors = STATUS_COLORS[event.status] || STATUS_COLORS.draft;
            const isDeleting = deletingId === event.id;
            const isCloning = cloningId === event.id;
            const rsvpPercentage = event.max_capacity
              ? Math.round((event.current_rsvp_count / event.max_capacity) * 100)
              : 0;

            return (
              <div
                key={event.id}
                className={`border border-gray-200 rounded-xl p-5 transition-all hover:shadow-md ${colors.bg}`}
              >
                {/* Status Badge */}
                <div className="flex items-start justify-between mb-4">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${colors.badge}`}
                  >
                    {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                  </span>
                </div>

                {/* Event Name */}
                <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                  {event.name}
                </h3>

                {/* Event Details */}
                <div className="space-y-2 mb-4 text-sm text-[#9a9080]">
                  <div>
                    <p className="text-[#9a9080] text-xs mb-1">Date & Time</p>
                    <p className="font-medium text-gray-900">
                      {formatDate(event.event_date)}
                    </p>
                  </div>
                  {event.venue_name && (
                    <div>
                      <p className="text-[#9a9080] text-xs mb-1">Venue</p>
                      <p className="font-medium text-gray-900 line-clamp-1">
                        {event.venue_name}
                      </p>
                    </div>
                  )}
                  {event.host_organization && (
                    <div>
                      <p className="text-[#9a9080] text-xs mb-1">Host Organization</p>
                      <p className="font-medium text-gray-900 line-clamp-1">
                        {event.host_organization}
                      </p>
                    </div>
                  )}
                </div>

                {/* RSVP Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      RSVPs
                    </span>
                    <span className="text-sm text-[#9a9080]">
                      {event.current_rsvp_count} / {event.max_capacity}
                    </span>
                  </div>
                  <div className="w-full bg-gray-300 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-[#3d6b2a] h-full rounded-full transition-all"
                      style={{ width: `${Math.min(rsvpPercentage, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Template Style */}
                {event.template_style && (
                  <div className="mb-4 text-sm">
                    <p className="text-[#9a9080] text-xs mb-1">Template</p>
                    <p className="font-medium text-gray-900">
                      {TEMPLATE_STYLES[event.template_style] || event.template_style}
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4 border-t border-gray-200">
                  <a
                    href={`/admin/events/${event.id}/edit`}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-[#3d6b2a] hover:bg-[#3d6b2a]/90 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Edit2 size={16} />
                    <span className="hidden sm:inline">Edit</span>
                  </a>

                  <button
                    onClick={() => handleCloneEvent(event)}
                    disabled={isCloning}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Clone event"
                  >
                    <Copy size={16} />
                    <span className="hidden sm:inline">Clone</span>
                  </button>

                  <a
                    href={`/events/${event.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors"
                    title="View public page"
                  >
                    <Eye size={16} />
                    <span className="hidden sm:inline">View</span>
                  </a>

                  <button
                    onClick={() => handleDeleteEvent(event.id)}
                    disabled={isDeleting}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Delete event"
                  >
                    <Trash2 size={16} />
                    <span className="hidden sm:inline">Delete</span>
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full text-center py-12">
            <div className="flex flex-col items-center">
              <div className="p-3 rounded-lg bg-gray-100 mb-4">
                <Search size={32} className="text-[#7a7060]" />
              </div>
              <p className="text-[#9a9080] text-lg font-medium mb-1">No events found</p>
              <p className="text-[#7a7060] text-sm">
                {searchQuery || filterStatus !== "all"
                  ? "Try adjusting your filters"
                  : "Create your first event to get started"}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
