import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import {
  Users,
  Calendar,
  ListChecks,
  ChefHat,
  ShoppingBag,
} from "lucide-react";

// KPI Card Component
function KPICard({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string | number;
}) {
  return (
    <div className="bg-white border border-[#ddd8cc] rounded-2xl p-4 sm:p-6">
      <div className="flex items-start justify-between mb-3 sm:mb-4">
        <div className="p-2 sm:p-3 rounded-lg bg-[#e9f0e4]">
          <Icon size={20} className="text-[#3d6b2a]" />
        </div>
      </div>
      <p className="text-[#7a7060] text-xs sm:text-sm font-medium mb-1">{label}</p>
      <p className="text-2xl sm:text-4xl font-black text-[#1e2d18]">{value}</p>
    </div>
  );
}

// Table Row Component
function TableRow({
  cells,
}: {
  cells: (string | React.ReactNode)[];
}) {
  return (
    <tr className="border-b border-[#ede9e2] hover:bg-[#f0ece3] transition-colors">
      {cells.map((cell, idx) => (
        <td
          key={idx}
          className="px-6 py-4 text-sm text-[#7a7060] first:text-[#1e2d18] first:font-medium"
        >
          {cell}
        </td>
      ))}
    </tr>
  );
}

export default async function AdminDashboard() {
  const supabase = await createClient();
  const STORE_ID = "b0000000-0000-0000-0000-000000000001";

  // First, fetch the most recent published event (or next upcoming event)
  const { data: eventData, error: eventError } = await supabase
    .from("events")
    .select("id, name, event_date")
    .eq("store_id", STORE_ID)
    .eq("is_published", true)
    .order("event_date", { ascending: false })
    .limit(1)
    .single();

  const eventId = eventData?.id || null;
  const eventName = eventData?.name || "No Events";

  // Fetch all KPI data in parallel
  const [
    { count: totalContacts },
    { data: launchRsvps },
    { count: waitlistCount },
    { count: recipesCount },
    { count: ordersCount },
    { data: recentContacts },
    { data: recentRsvps },
  ] = await Promise.all([
    supabase
      .from("contacts")
      .select("*", { count: "exact", head: true }),
    eventId
      ? supabase
          .from("event_rsvps")
          .select("*")
          .eq("event_id", eventId)
      : Promise.resolve({ data: [] }),
    supabase
      .from("contacts")
      .select("*", { count: "exact", head: true })
      .eq("is_waitlist_member", true),
    supabase
      .from("recipes")
      .select("*", { count: "exact", head: true }),
    supabase
      .from("orders")
      .select("*", { count: "exact", head: true }),
    supabase
      .from("contacts")
      .select("id, first_name, email, source, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
    eventId
      ? supabase
          .from("event_rsvps")
          .select("id, first_name, email, num_guests, rsvp_status, created_at")
          .eq("event_id", eventId)
          .order("created_at", { ascending: false })
          .limit(5)
      : Promise.resolve({ data: [] }),
  ]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <KPICard icon={Users} label="Total Contacts" value={totalContacts || 0} />
        <KPICard icon={Calendar} label={`RSVPs for ${eventName}`} value={launchRsvps?.length || 0} />
        <KPICard icon={ListChecks} label="Waitlist Members" value={waitlistCount || 0} />
        <KPICard icon={ChefHat} label="Menu Items" value={recipesCount || 0} />
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Contacts */}
        <div className="bg-white border border-[#ddd8cc] rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[#ddd8cc]">
            <h3 className="text-lg font-semibold text-[#1e2d18]">Recent Contacts</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#f2efe8]">
                <tr className="border-b border-[#ddd8cc]">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#9a9080] uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#9a9080] uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#9a9080] uppercase tracking-wider">Source</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#9a9080] uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentContacts && recentContacts.length > 0 ? (
                  recentContacts.map((contact: any) => (
                    <TableRow
                      key={contact.id}
                      cells={[
                        contact.first_name || "—",
                        <span className="text-[#3d6b2a]">{contact.email}</span>,
                        contact.source || "organic",
                        formatDate(contact.created_at),
                      ]}
                    />
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-[#9a9080]">
                      No contacts yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent RSVPs */}
        <div className="bg-white border border-[#ddd8cc] rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[#ddd8cc]">
            <h3 className="text-lg font-semibold text-[#1e2d18]">
              {eventId ? `RSVPs for ${eventName}` : "Recent RSVPs"}
            </h3>
          </div>
          <div className="overflow-x-auto">
            {!eventId ? (
              <div className="px-6 py-8 text-center text-[#9a9080]">
                No events available. Create an event to see RSVPs.
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-[#f2efe8]">
                  <tr className="border-b border-[#ddd8cc]">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#9a9080] uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#9a9080] uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#9a9080] uppercase tracking-wider">Guests</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#9a9080] uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentRsvps && recentRsvps.length > 0 ? (
                    recentRsvps.map((rsvp: any) => (
                      <TableRow
                        key={rsvp.id}
                        cells={[
                          rsvp.first_name || "—",
                          <span className="text-[#3d6b2a]">{rsvp.email}</span>,
                          rsvp.num_guests || 1,
                          <span
                            className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                              rsvp.rsvp_status === "attending"
                                ? "bg-[#e9f0e4] text-[#3d6b2a]"
                                : rsvp.rsvp_status === "pending"
                                  ? "bg-amber-50 text-amber-700"
                                  : "bg-[#f2efe8] text-[#7a7060]"
                            }`}
                          >
                            {rsvp.rsvp_status || "pending"}
                          </span>,
                        ]}
                      />
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-[#9a9080]">
                        No RSVPs yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-3 sm:gap-4 flex-wrap">
        <Link
          href="/admin/contacts"
          className="px-6 py-3 bg-[#3d6b2a] hover:bg-[#2f5720] text-white font-semibold rounded-lg transition-colors inline-flex items-center gap-2"
        >
          <Users size={18} />
          View All Contacts
        </Link>
        <Link
          href="/admin/events"
          className="px-6 py-3 bg-[#3d6b2a] hover:bg-[#2f5720] text-white font-semibold rounded-lg transition-colors inline-flex items-center gap-2"
        >
          <Calendar size={18} />
          View All RSVPs
        </Link>
        <Link
          href="/admin/menu"
          className="px-6 py-3 bg-[#3d6b2a] hover:bg-[#2f5720] text-white font-semibold rounded-lg transition-colors inline-flex items-center gap-2"
        >
          <ChefHat size={18} />
          Manage Menu
        </Link>
      </div>
    </div>
  );
}
