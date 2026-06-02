import { createClient } from "@/lib/supabase/server";
import EventsListClient from "@/components/admin/EventsListClient";
import { Event } from "@/types/database";
import { Calendar, Users, TrendingUp, DollarSign } from "lucide-react";

// Stats Card Component
function StatsCard({
  icon: Icon,
  label,
  value,
  prefix = "",
  suffix = "",
}: {
  icon: any;
  label: string;
  value: string | number;
  prefix?: string;
  suffix?: string;
}) {
  return (
    <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 rounded-lg bg-[#E8F5E3]">
          <Icon size={24} className="text-[#3d6b2a]" />
        </div>
      </div>
      <p className="text-[#9a9080] text-sm font-medium mb-1">{label}</p>
      <p className="text-3xl font-bold text-gray-900">
        {prefix}
        {value}
        {suffix}
      </p>
    </div>
  );
}

export default async function EventsPage() {
  const supabase = await createClient();
  const STORE_ID = "b0000000-0000-0000-0000-000000000001";

  // Fetch all events
  const { data: events, error: eventsError } = await supabase
    .from("events")
    .select("*")
    .eq("store_id", STORE_ID)
    .order("event_date", { ascending: false });

  if (eventsError) {
    console.error("Error fetching events:", eventsError);
  }

  // Fetch all RSVPs to calculate stats
  const { data: allRsvps, error: rsvpsError } = await supabase
    .from("event_rsvps")
    .select("event_id, status, donation_amount");

  if (rsvpsError) {
    console.error("Error fetching RSVPs:", rsvpsError);
  }

  // Calculate stats
  const totalEvents = events?.length || 0;
  const upcomingEvents = events?.filter((e) => {
    const eventDate = new Date(e.event_date);
    return eventDate > new Date();
  }).length || 0;
  const totalRsvps = allRsvps?.length || 0;
  const totalRevenue = allRsvps?.reduce(
    (sum, rsvp) => sum + (rsvp.donation_amount || 0),
    0
  ) || 0;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#1e2d18] mb-1">Events</h1>
          <p className="text-[#7a7060]">{totalEvents} total events</p>
        </div>
        <a
          href="/admin/events/new"
          className="px-4 py-2 bg-[#3d6b2a] hover:bg-[#3d6b2a]/90 text-white font-medium rounded-lg transition-colors whitespace-nowrap"
        >
          Create Event
        </a>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard icon={Calendar} label="Total Events" value={totalEvents} />
        <StatsCard
          icon={TrendingUp}
          label="Upcoming Events"
          value={upcomingEvents}
        />
        <StatsCard icon={Users} label="Total RSVPs" value={totalRsvps} />
        <StatsCard
          icon={DollarSign}
          label="Donation Revenue"
          value={totalRevenue}
          prefix="$"
        />
      </div>

      {/* Events List Client Component */}
      <EventsListClient initialEvents={events || []} />
    </div>
  );
}
