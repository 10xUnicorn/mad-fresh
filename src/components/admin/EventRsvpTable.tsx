"use client";

import { useState, useMemo } from "react";
import { EventRsvp, RsvpStatus } from "@/types/database";
import { ChevronDown, Search, CheckCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface EventRsvpTableProps {
  rsvps: EventRsvp[];
  eventId: string;
}

const STATUS_COLORS: Record<RsvpStatus, { bg: string; text: string }> = {
  confirmed: { bg: "bg-green-50", text: "text-green-700" },
  cancelled: { bg: "bg-red-50", text: "text-red-700" },
  waitlisted: { bg: "bg-yellow-50", text: "text-yellow-700" },
  checked_in: { bg: "bg-green-50", text: "text-[#3d6b2a]" },
};

export default function EventRsvpTable({
  rsvps: initialRsvps,
  eventId,
}: EventRsvpTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<RsvpStatus | "all">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [rsvps, setRsvps] = useState<EventRsvp[]>(initialRsvps);
  const [isCheckingIn, setIsCheckingIn] = useState<string | null>(null);

  // Filter and search RSVPs
  const filteredRsvps = useMemo(() => {
    return rsvps.filter((rsvp) => {
      const matchesSearch =
        !searchQuery ||
        rsvp.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rsvp.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rsvp.email.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesFilter =
        filterStatus === "all" || rsvp.status === filterStatus;

      return matchesSearch && matchesFilter;
    });
  }, [rsvps, searchQuery, filterStatus]);

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Handle check-in
  const handleCheckIn = async (rsvpId: string) => {
    setIsCheckingIn(rsvpId);
    try {
      const supabase = createClient();

      const { error } = await supabase
        .from("event_rsvps")
        .update({
          status: "checked_in",
          checked_in_at: new Date().toISOString(),
        })
        .eq("id", rsvpId);

      if (error) {
        console.error("Error checking in RSVP:", error);
      } else {
        // Update local state
        setRsvps(
          rsvps.map((rsvp) =>
            rsvp.id === rsvpId
              ? {
                  ...rsvp,
                  status: "checked_in",
                  checked_in_at: new Date().toISOString(),
                }
              : rsvp
          )
        );
      }
    } catch (error) {
      console.error("Error during check-in:", error);
    } finally {
      setIsCheckingIn(null);
    }
  };

  // Get unique statuses for filter dropdown
  const uniqueStatuses = Array.from(
    new Set(rsvps.map((r) => r.status))
  ) as RsvpStatus[];

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
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#3d6b2a]/50 transition-colors"
            />
          </div>

          {/* Filter */}
          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) =>
                setFilterStatus(
                  e.target.value as RsvpStatus | "all"
                )
              }
              className="appearance-none px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 cursor-pointer focus:outline-none focus:border-[#3d6b2a]/50 transition-colors pr-10"
            >
              <option value="all">All Statuses</option>
              {uniqueStatuses.map((status) => (
                <option key={status} value={status}>
                  {status.split("_").map((word) =>
                    word.charAt(0).toUpperCase() + word.slice(1)
                  ).join(" ")}
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
          Showing {filteredRsvps.length} of {rsvps.length} RSVPs
        </p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr className="border-b border-gray-200">
              <th className="px-6 py-3 text-left text-xs font-semibold text-[#9a9080] uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-[#9a9080] uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-[#9a9080] uppercase tracking-wider">
                Phone
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-[#9a9080] uppercase tracking-wider">
                Guests
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-[#9a9080] uppercase tracking-wider">
                Meal Prefs
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-[#9a9080] uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-[#9a9080] uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-[#9a9080] uppercase tracking-wider">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredRsvps.length > 0 ? (
              filteredRsvps.map((rsvp) => {
                const colors =
                  STATUS_COLORS[rsvp.status] || STATUS_COLORS.confirmed;
                const isExpanded = expandedId === rsvp.id;

                return (
                  <tr
                    key={rsvp.id}
                    className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {rsvp.first_name} {rsvp.last_name}
                    </td>
                    <td className="px-6 py-4 text-sm text-[#3d6b2a]">
                      {rsvp.email}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {rsvp.phone || "—"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {rsvp.guest_count}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {rsvp.meal_preferences
                        ? Object.values(rsvp.meal_preferences).join(", ")
                        : "—"}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${colors.bg} ${colors.text}`}
                      >
                        {rsvp.status
                          .split("_")
                          .map(
                            (word) =>
                              word.charAt(0).toUpperCase() + word.slice(1)
                          )
                          .join(" ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#9a9080]">
                      {formatDate(rsvp.created_at)}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {rsvp.status !== "checked_in" ? (
                        <button
                          onClick={() => handleCheckIn(rsvp.id)}
                          disabled={isCheckingIn === rsvp.id}
                          className="flex items-center gap-1 px-3 py-1.5 bg-[#3d6b2a] hover:bg-[#3d6b2a]/90 disabled:opacity-50 text-gray-900 text-xs font-medium rounded-lg transition-colors"
                        >
                          <CheckCircle size={14} />
                          Check In
                        </button>
                      ) : (
                        <span className="text-[#3d6b2a] text-xs font-medium">
                          ✓ Checked In
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={8}
                  className="px-6 py-8 text-center text-[#9a9080]"
                >
                  No RSVPs found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
