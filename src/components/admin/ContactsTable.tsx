"use client";

import { useState, useMemo } from "react";
import { Contact, ContactSource, ContactType } from "@/types/database";
import { ChevronDown, Search } from "lucide-react";

interface ContactsTableProps {
  contacts: Contact[];
}

const SOURCE_COLORS: Record<ContactSource, { bg: string; text: string }> = {
  app_signup: { bg: "bg-blue-50", text: "text-blue-700" },
  website: { bg: "bg-purple-500/20", text: "text-purple-600" },
  event_rsvp: { bg: "bg-green-50", text: "text-green-700" },
  waitlist: { bg: "bg-cyan-500/20", text: "text-cyan-600" },
  newsletter: { bg: "bg-indigo-500/20", text: "text-indigo-600" },
  referral: { bg: "bg-pink-500/20", text: "text-pink-600" },
  catering_inquiry: { bg: "bg-orange-500/20", text: "text-orange-600" },
  import: { bg: "bg-gray-100", text: "text-[#9a9080]" },
};

export default function ContactsTable({ contacts }: ContactsTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSource, setFilterSource] = useState<ContactSource | "all">("all");
  const [filterContactType, setFilterContactType] = useState<ContactType | "all">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Filter and search contacts
  const filteredContacts = useMemo(() => {
    return contacts.filter((contact) => {
      const matchesSearch =
        !searchQuery ||
        contact.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.email.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesSourceFilter =
        filterSource === "all" || contact.source === filterSource;

      const matchesContactTypeFilter =
        filterContactType === "all" || contact.contact_type === filterContactType;

      return matchesSearch && matchesSourceFilter && matchesContactTypeFilter;
    });
  }, [contacts, searchQuery, filterSource, filterContactType]);

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Get unique sources for filter dropdown
  const uniqueSources = Array.from(
    new Set(contacts.map((c) => c.source))
  ) as ContactSource[];

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      {/* Header with controls */}
      <div className="px-6 py-4 border-b border-gray-200 space-y-4">
        {/* Contact Type Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setFilterContactType("all")}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              filterContactType === "all"
                ? "bg-[#3d6b2a] text-white"
                : "bg-gray-50 text-[#9a9080] border border-gray-200 hover:border-gray-300"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterContactType("lead")}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              filterContactType === "lead"
                ? "bg-[#3d6b2a] text-white"
                : "bg-gray-50 text-[#9a9080] border border-gray-200 hover:border-gray-300"
            }`}
          >
            Leads
          </button>
          <button
            onClick={() => setFilterContactType("customer")}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              filterContactType === "customer"
                ? "bg-[#3d6b2a] text-white"
                : "bg-gray-50 text-[#9a9080] border border-gray-200 hover:border-gray-300"
            }`}
          >
            Customers
          </button>
          <button
            onClick={() => setFilterContactType("vendor")}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              filterContactType === "vendor"
                ? "bg-[#3d6b2a] text-white"
                : "bg-gray-50 text-[#9a9080] border border-gray-200 hover:border-gray-300"
            }`}
          >
            Vendors
          </button>
        </div>

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
              value={filterSource}
              onChange={(e) =>
                setFilterSource(
                  e.target.value as ContactSource | "all"
                )
              }
              className="appearance-none px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 cursor-pointer focus:outline-none focus:border-[#3d6b2a]/50 transition-colors pr-10"
            >
              <option value="all">All Sources</option>
              {uniqueSources.map((source) => (
                <option key={source} value={source}>
                  {source
                    .split("_")
                    .map(
                      (word) =>
                        word.charAt(0).toUpperCase() + word.slice(1)
                    )
                    .join(" ")}
                </option>
              ))}
            </select>
            <ChevronDown
              size={16}
              className="absolute right-3 top-3 text-[#9a9080] pointer-events-none"
            />
          </div>

          {/* Export CSV button (placeholder) */}
          <button className="px-4 py-2 bg-[#3d6b2a] hover:bg-[#3d6b2a]/90 text-white font-medium rounded-lg transition-colors whitespace-nowrap">
            Export CSV
          </button>
        </div>

        {/* Result count */}
        <p className="text-sm text-[#9a9080]">
          Showing {filteredContacts.length} of {contacts.length} contacts
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
                Source
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-[#9a9080] uppercase tracking-wider">
                Waitlist
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-[#9a9080] uppercase tracking-wider">
                Newsletter
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-[#9a9080] uppercase tracking-wider">
                Lead Score
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-[#9a9080] uppercase tracking-wider">
                Created
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredContacts.length > 0 ? (
              filteredContacts.map((contact) => {
                const colors =
                  SOURCE_COLORS[contact.source] || SOURCE_COLORS.import;
                const isExpanded = expandedId === contact.id;

                return (
                  <tr
                    key={contact.id}
                    className="border-b border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() =>
                      setExpandedId(
                        isExpanded ? null : contact.id
                      )
                    }
                  >
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {contact.first_name} {contact.last_name}
                    </td>
                    <td className="px-6 py-4 text-sm text-[#3d6b2a]">
                      {contact.email}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {contact.phone || "—"}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${colors.bg} ${colors.text}`}
                      >
                        {contact.source
                          .split("_")
                          .map(
                            (word) =>
                              word.charAt(0).toUpperCase() + word.slice(1)
                          )
                          .join(" ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {contact.is_waitlist_member ? (
                        <span className="text-green-700">✓</span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {contact.is_newsletter_subscribed ? (
                        <span className="text-green-700">✓</span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {contact.lead_score}
                    </td>
                    <td className="px-6 py-4 text-sm text-[#9a9080]">
                      {formatDate(contact.created_at)}
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
                  No contacts found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Detail panels below table (for expanded rows) */}
      {expandedId && (
        <div className="border-t border-gray-200 bg-gray-50/50 p-6">
          {(() => {
            const contact = filteredContacts.find(
              (c) => c.id === expandedId
            );
            if (!contact) return null;

            return (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs text-[#9a9080] uppercase tracking-wider mb-2">
                      Full Details
                    </p>
                    <div className="space-y-3">
                      <div>
                        <p className="text-[#9a9080] text-sm">Name</p>
                        <p className="text-gray-900 font-medium">
                          {contact.first_name} {contact.last_name}
                        </p>
                      </div>
                      <div>
                        <p className="text-[#9a9080] text-sm">Email</p>
                        <p className="text-[#3d6b2a] font-medium">
                          {contact.email}
                        </p>
                      </div>
                      <div>
                        <p className="text-[#9a9080] text-sm">Phone</p>
                        <p className="text-gray-900 font-medium">
                          {contact.phone || "Not provided"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-[#9a9080] uppercase tracking-wider mb-2">
                      Activity
                    </p>
                    <div className="space-y-3">
                      <div>
                        <p className="text-[#9a9080] text-sm">Total Orders</p>
                        <p className="text-gray-900 font-medium">
                          {contact.total_orders}
                        </p>
                      </div>
                      <div>
                        <p className="text-[#9a9080] text-sm">
                          Total Spent
                        </p>
                        <p className="text-gray-900 font-medium">
                          ${contact.total_spent.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[#9a9080] text-sm">
                          Last Order
                        </p>
                        <p className="text-gray-900 font-medium">
                          {contact.last_order_date
                            ? formatDate(contact.last_order_date)
                            : "Never"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {contact.notes && (
                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-xs text-[#9a9080] uppercase tracking-wider mb-2">
                      Notes
                    </p>
                    <p className="text-gray-700 text-sm">{contact.notes}</p>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
