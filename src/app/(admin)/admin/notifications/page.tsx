"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Bell, Mail, MessageSquare, CheckCircle2, XCircle, Clock, Loader2, RefreshCw, Search } from "lucide-react";

interface NotificationLog {
  id: string;
  recipient_email: string;
  notification_type: string;
  channel: string;
  subject: string;
  body: string;
  reference_type: string;
  reference_id: string;
  status: string;
  provider_message_id: string | null;
  created_at: string;
}

const NOTIFICATION_TYPES = [
  { key: "all", label: "All" },
  { key: "order_confirmation", label: "Order Confirmation" },
  { key: "order_status_update", label: "Status Update" },
  { key: "payment_received", label: "Payment" },
  { key: "delivery_update", label: "Delivery" },
];

export default function NotificationsPage() {
  const supabase = createClient();
  const [notifications, setNotifications] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const STORE_ID = "b0000000-0000-0000-0000-000000000001";

  const fetchNotifications = async () => {
    let query = supabase
      .from("notification_log")
      .select("*")
      .eq("store_id", STORE_ID)
      .order("created_at", { ascending: false })
      .limit(100);

    if (filter !== "all") {
      query = query.eq("notification_type", filter);
    }

    if (searchQuery) {
      query = query.or(`recipient_email.ilike.%${searchQuery}%,subject.ilike.%${searchQuery}%`);
    }

    const { data } = await query;
    setNotifications(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchNotifications();
  }, [filter, searchQuery]);

  // Stats
  const totalSent = notifications.filter((n) => n.status === "sent").length;
  const totalFailed = notifications.filter((n) => n.status === "failed").length;
  const totalPending = notifications.filter((n) => n.status === "pending").length;

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleString("en-US", {
      month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
    });

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case "email": return <Mail size={14} className="text-blue-500" />;
      case "sms": return <MessageSquare size={14} className="text-purple-500" />;
      default: return <Bell size={14} className="text-[#7a7060]" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "sent": return <CheckCircle2 size={14} className="text-green-500" />;
      case "failed": return <XCircle size={14} className="text-red-500" />;
      default: return <Clock size={14} className="text-yellow-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 size={32} className="text-[#3d6b2a] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#1e2d18] flex items-center gap-3">
            <Bell size={32} className="text-[#3d6b2a]" /> Notifications
          </h1>
          <p className="text-[#7a7060] mt-1">Track all customer communications</p>
        </div>
        <button
          onClick={() => { setLoading(true); fetchNotifications(); }}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-medium text-gray-700 transition-colors"
        >
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-6">
        <div className="bg-white border border-gray-200 rounded-2xl p-5 text-center">
          <CheckCircle2 size={24} className="text-green-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">{totalSent}</p>
          <p className="text-xs text-[#9a9080]">Sent</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-5 text-center">
          <Clock size={24} className="text-yellow-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">{totalPending}</p>
          <p className="text-xs text-[#9a9080]">Pending</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-5 text-center">
          <XCircle size={24} className="text-red-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">{totalFailed}</p>
          <p className="text-xs text-[#9a9080]">Failed</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-wrap gap-1">
              {NOTIFICATION_TYPES.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setFilter(t.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    filter === t.key
                      ? "bg-[#3d6b2a] text-white"
                      : "bg-gray-100 text-[#9a9080] hover:bg-gray-200"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7a7060]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by email or subject..."
                className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-[#3d6b2a] focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        {notifications.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr className="border-b border-gray-200">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#9a9080] uppercase">Channel</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#9a9080] uppercase">Recipient</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#9a9080] uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#9a9080] uppercase">Subject</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#9a9080] uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#9a9080] uppercase">Date</th>
                </tr>
              </thead>
              <tbody>
                {notifications.map((n) => (
                  <tr key={n.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3">{getChannelIcon(n.channel)}</td>
                    <td className="px-6 py-3 text-sm text-gray-700">{n.recipient_email || "—"}</td>
                    <td className="px-6 py-3">
                      <span className="inline-block px-2 py-0.5 bg-gray-100 text-[#9a9080] rounded-full text-xs font-medium">
                        {n.notification_type.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-900 max-w-xs truncate">{n.subject}</td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-1.5">
                        {getStatusIcon(n.status)}
                        <span className="text-xs font-medium text-[#9a9080]">{n.status}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-sm text-[#9a9080]">{formatDate(n.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-12 text-center">
            <Bell size={32} className="mx-auto mb-3 text-[#4a5e3a]" />
            <p className="text-[#9a9080]">No notifications found</p>
          </div>
        )}
      </div>
    </div>
  );
}
