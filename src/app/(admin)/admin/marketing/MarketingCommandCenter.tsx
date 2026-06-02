"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Mail, Gift, Target, TrendingUp, Zap, Users, Send, Eye, Plus, Search,
  FileText, Code, Bell, Clock, CheckCircle, XCircle, RefreshCw, Copy,
  ChevronRight, ChevronLeft, Filter, X, AlertTriangle, Trash2, Edit3,
  LayoutTemplate, Megaphone, ArrowRight, Globe, UserCheck, UserX, Tag,
  CalendarDays, ShoppingBag, Inbox, Archive,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Campaign {
  id: string;
  name: string;
  type: string;
  subject: string;
  preview_text: string;
  body: string;
  body_html: string;
  status: string;
  recipient_count: number;
  delivered_count: number;
  failed_count: number;
  open_count: number;
  click_count: number;
  audience_filter: any;
  from_name: string;
  from_email: string;
  reply_to: string;
  editor_mode: string;
  scheduled_for: string;
  sent_at: string;
  created_at: string;
}

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  subject: string;
  preview_text: string;
  body_html: string;
  suggested_segment: any;
  cta_text: string;
  cta_url: string;
  is_system: boolean;
}

interface Contact {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  source: string;
  contact_type: string;
  has_active_subscription: boolean;
  total_orders: number;
  is_newsletter_subscribed: boolean;
  tags: any;
  created_at: string;
  last_order_date: string;
  unsubscribed_at: string | null;
}

interface Props {
  campaigns: Campaign[];
  templates: Template[];
  contacts: Contact[];
  events: any[];
  pushNotifications: any[];
  stats: {
    totalContacts: number;
    newsletterSubs: number;
    activeSubs: number;
    totalCampaigns: number;
    sentCampaigns: number;
    draftCampaigns: number;
    scheduledCampaigns: number;
    leads: number;
    customers: number;
    vendors: number;
  };
}

type View = "dashboard" | "campaign_builder" | "template_library" | "campaign_detail" | "push_builder";
type CampaignStep = "type" | "template" | "recipients" | "compose" | "preview" | "send";

// ─── Stat Card ───────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, accent }: { icon: any; label: string; value: number | string; accent?: boolean }) {
  return (
    <div className={`rounded-xl p-4 border ${accent ? "bg-[#e9f0e4] border-[#3d6b2a]/20" : "bg-white border border-[#ddd8cc]"}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon size={16} className={accent ? "text-[#3d6b2a]" : "text-[#9a9080]"} />
        <span className="text-xs text-[#9a9080] font-medium">{label}</span>
      </div>
      <p className={`text-2xl font-bold ${accent ? "text-[#3d6b2a]" : "text-[#1e2d18]"}`}>{value}</p>
    </div>
  );
}

// ─── Campaign Status Badge ───────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    draft: "bg-gray-100 text-[#9a9080]",
    scheduled: "bg-blue-50 text-blue-700",
    sending: "bg-amber-50 text-amber-700",
    sent: "bg-[#e9f0e4] text-[#3d6b2a]",
    cancelled: "bg-red-50 text-red-700",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${colors[status] || colors.draft}`}>
      {status}
    </span>
  );
}

// ─── Category Badge ──────────────────────────────────────────────────────────

function CategoryBadge({ category }: { category: string }) {
  const colors: Record<string, string> = {
    event: "bg-purple-50 text-purple-700",
    promotion: "bg-pink-50 text-pink-700",
    reactivation: "bg-amber-50 text-amber-700",
    nurture: "bg-cyan-50 text-cyan-700",
    announcement: "bg-blue-50 text-blue-700",
    thank_you: "bg-[#e9f0e4] text-[#3d6b2a]",
    referral: "bg-amber-50 text-amber-700",
    general: "bg-gray-100 text-[#9a9080]",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${colors[category] || colors.general}`}>
      {category.replace(/_/g, " ")}
    </span>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function MarketingCommandCenter({ campaigns, templates, contacts, events, pushNotifications, stats }: Props) {
  const router = useRouter();
  const [view, setView] = useState<View>("dashboard");
  const [campaignStep, setCampaignStep] = useState<CampaignStep>("type");
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Campaign builder state
  const [draft, setDraft] = useState({
    name: "",
    type: "email_blast",
    subject: "",
    preview_text: "",
    body_html: "",
    from_name: "Mad Fresh Kitchen",
    from_email: "hello@madfresh.app",
    reply_to: "order@madfresh.app",
    editor_mode: "rich_text" as "rich_text" | "html",
    template_id: "",
    scheduled_for: "",
  });

  // Recipient selection state
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [manualSelected, setManualSelected] = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode] = useState<"filter" | "manual">("filter");
  const [contactSearch, setContactSearch] = useState("");

  // Campaign detail state
  const [campaignRecipients, setCampaignRecipients] = useState<any[]>([]);
  const [recipientLoading, setRecipientLoading] = useState(false);
  const [recipientSearch, setRecipientSearch] = useState("");
  const [selectedRecipientIds, setSelectedRecipientIds] = useState<Set<string>>(new Set());

  // Push notification state
  const [pushDraft, setPushDraft] = useState({ title: "", body: "", destination_url: "", scheduled_for: "" });

  // ── Helpers ──

  const showToast = useCallback((type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const filteredContacts = useMemo(() => {
    let result = contacts.filter((c) => !c.unsubscribed_at);

    if (filters.source) result = result.filter((c) => c.source === filters.source);
    if (filters.contact_type) result = result.filter((c) => c.contact_type === filters.contact_type);
    if (filters.has_active_subscription !== undefined) result = result.filter((c) => c.has_active_subscription === filters.has_active_subscription);
    if (filters.is_newsletter_subscribed !== undefined) result = result.filter((c) => c.is_newsletter_subscribed === filters.is_newsletter_subscribed);
    if (filters.has_purchased === true) result = result.filter((c) => c.total_orders > 0);
    if (filters.has_purchased === false) result = result.filter((c) => !c.total_orders || c.total_orders === 0);
    if (filters.exclude_vendors) result = result.filter((c) => c.contact_type !== "vendor");

    if (contactSearch) {
      const q = contactSearch.toLowerCase();
      result = result.filter(
        (c) =>
          c.email.toLowerCase().includes(q) ||
          c.first_name?.toLowerCase().includes(q) ||
          c.last_name?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [contacts, filters, contactSearch]);

  const selectedRecipients = useMemo(() => {
    if (selectMode === "manual") {
      return contacts.filter((c) => manualSelected.has(c.id) && !c.unsubscribed_at);
    }
    return filteredContacts;
  }, [selectMode, manualSelected, filteredContacts, contacts]);

  // ── API calls ──

  const apiCall = async (body: any) => {
    const res = await fetch("/api/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return res.json();
  };

  const saveDraft = async () => {
    setLoading(true);
    try {
      const audienceFilter = selectMode === "manual"
        ? { contact_ids: Array.from(manualSelected) }
        : filters;

      const result = await apiCall({
        action: "create",
        ...draft,
        audience_filter: audienceFilter,
        status: "draft",
      });

      if (result.error) throw new Error(result.error);
      showToast("success", "Campaign saved as draft");
      router.refresh();
    } catch (err: any) {
      showToast("error", err.message);
    } finally {
      setLoading(false);
    }
  };

  const sendCampaign = async (campaignId?: string) => {
    setLoading(true);
    try {
      // First create the campaign if no ID
      let id = campaignId;
      if (!id) {
        const audienceFilter = selectMode === "manual"
          ? { contact_ids: Array.from(manualSelected) }
          : filters;

        const createResult = await apiCall({
          action: "create",
          ...draft,
          audience_filter: audienceFilter,
          status: "draft",
        });
        if (createResult.error) throw new Error(createResult.error);
        id = createResult.campaign.id;
      }

      const result = await apiCall({ action: "send", campaign_id: id });
      if (result.error) throw new Error(result.error);
      showToast("success", `Campaign sent! ${result.sent} delivered, ${result.failed} failed`);
      setView("dashboard");
      router.refresh();
    } catch (err: any) {
      showToast("error", err.message);
    } finally {
      setLoading(false);
    }
  };

  const sendTest = async () => {
    setLoading(true);
    try {
      const result = await apiCall({
        action: "send_test",
        to: draft.from_email || "dknightunicorn@gmail.com",
        subject: draft.subject,
        body_html: draft.body_html,
        preview_text: draft.preview_text,
      });
      if (result.error) throw new Error(result.error);
      showToast("success", "Test email sent! Check your inbox.");
    } catch (err: any) {
      showToast("error", err.message);
    } finally {
      setLoading(false);
    }
  };

  const resendCampaign = async (campaignId: string, recipientEmails?: string[]) => {
    setLoading(true);
    try {
      const result = await apiCall({
        action: "resend",
        campaign_id: campaignId,
        recipient_emails: recipientEmails,
      });
      if (result.error) throw new Error(result.error);
      showToast("success", `Resent to ${result.resent} recipients`);
      router.refresh();
    } catch (err: any) {
      showToast("error", err.message);
    } finally {
      setLoading(false);
    }
  };

  const savePushNotification = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          name: pushDraft.title,
          type: "push_notification",
          subject: pushDraft.title,
          body: pushDraft.body,
          status: "draft",
        }),
      });
      const result = await res.json();
      if (result.error) throw new Error(result.error);
      showToast("success", "Push notification saved as draft (ready for mobile integration)");
      setView("dashboard");
      router.refresh();
    } catch (err: any) {
      showToast("error", err.message);
    } finally {
      setLoading(false);
    }
  };

  const startFromTemplate = (template: Template) => {
    setDraft({
      ...draft,
      name: template.name,
      subject: template.subject,
      preview_text: template.preview_text || "",
      body_html: template.body_html,
      template_id: template.id,
    });
    if (template.suggested_segment) {
      setFilters(template.suggested_segment);
    }
    setView("campaign_builder");
    setCampaignStep("recipients");
  };

  const duplicateCampaign = (campaign: Campaign) => {
    setDraft({
      name: `${campaign.name} (Copy)`,
      type: campaign.type,
      subject: campaign.subject || "",
      preview_text: campaign.preview_text || "",
      body_html: campaign.body_html || campaign.body || "",
      from_name: campaign.from_name || "Mad Fresh Kitchen",
      from_email: campaign.from_email || "hello@madfresh.app",
      reply_to: campaign.reply_to || "order@madfresh.app",
      editor_mode: (campaign.editor_mode as "rich_text" | "html") || "rich_text",
      template_id: "",
      scheduled_for: "",
    });
    setView("campaign_builder");
    setCampaignStep("compose");
  };

  // ── Campaign Detail ──

  const openCampaignDetail = async (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setView("campaign_detail");
    setRecipientLoading(true);
    setSelectedRecipientIds(new Set());
    setRecipientSearch("");
    try {
      const res = await fetch(`/api/campaigns/${campaign.id}/recipients`);
      const data = await res.json();
      setCampaignRecipients(data.recipients || []);
    } catch {
      setCampaignRecipients([]);
    } finally {
      setRecipientLoading(false);
    }
  };

  const resendToSelected = async () => {
    if (!selectedCampaign || selectedRecipientIds.size === 0) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/campaigns/${selectedCampaign.id}/recipients`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "resend",
          recipient_ids: Array.from(selectedRecipientIds),
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      showToast("success", `Resent to ${data.sent} recipient${data.sent !== 1 ? "s" : ""}${data.failed ? `, ${data.failed} failed` : ""}`);
      // Refresh recipients
      openCampaignDetail(selectedCampaign);
    } catch (err: any) {
      showToast("error", err.message);
    } finally {
      setLoading(false);
    }
  };

  const resendAllFailed = async () => {
    if (!selectedCampaign) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/campaigns/${selectedCampaign.id}/recipients`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "resend" }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      showToast("success", `Resent to ${data.sent} failed recipient${data.sent !== 1 ? "s" : ""}`);
      openCampaignDetail(selectedCampaign);
    } catch (err: any) {
      showToast("error", err.message);
    } finally {
      setLoading(false);
    }
  };

  const resendSingle = async (recipientId: string) => {
    if (!selectedCampaign) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/campaigns/${selectedCampaign.id}/recipients`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "resend", recipient_ids: [recipientId] }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      showToast("success", "Email resent");
      openCampaignDetail(selectedCampaign);
    } catch (err: any) {
      showToast("error", err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Campaign Step Validation ──
  const canProceed = (step: CampaignStep): boolean => {
    switch (step) {
      case "type": return !!draft.type;
      case "template": return true; // optional
      case "recipients": return selectedRecipients.length > 0;
      case "compose": return !!draft.subject && !!draft.body_html;
      case "preview": return true;
      default: return true;
    }
  };

  const steps: CampaignStep[] = ["type", "template", "recipients", "compose", "preview", "send"];
  const stepIndex = steps.indexOf(campaignStep);

  // ─────────────────────────────────────────────────────────────────────────────
  // VIEWS
  // ─────────────────────────────────────────────────────────────────────────────

  // ── Dashboard View ──
  if (view === "dashboard") {
    return (
      <div className="space-y-6">
        {/* Toast */}
        {toast && (
          <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg ${toast.type === "success" ? "bg-green-500/90" : "bg-red-500/90"} text-white text-sm font-medium`}>
            {toast.message}
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
          <StatCard icon={Users} label="Total Contacts" value={stats.totalContacts} accent />
          <StatCard icon={Mail} label="Email Subscribers" value={stats.newsletterSubs} />
          <StatCard icon={Target} label="Leads" value={stats.leads} />
          <StatCard icon={ShoppingBag} label="Customers" value={stats.customers} />
          <StatCard icon={TrendingUp} label="Active Subs" value={stats.activeSubs} />
          <StatCard icon={Send} label="Sent Campaigns" value={stats.sentCampaigns} />
          <StatCard icon={FileText} label="Drafts" value={stats.draftCampaigns} />
          <StatCard icon={Clock} label="Scheduled" value={stats.scheduledCampaigns} />
          <StatCard icon={Zap} label="Vendors" value={stats.vendors} />
          <StatCard icon={LayoutTemplate} label="Templates" value={templates.length} />
        </div>

        {/* Primary Actions */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { icon: Mail, label: "New Campaign", color: "bg-[#3d6b2a] text-white hover:bg-[#2f5720]", action: () => { setView("campaign_builder"); setCampaignStep("type"); } },
            { icon: Gift, label: "New Promotion", color: "bg-purple-500/20 text-purple-400 border border-purple-500/30", action: () => router.push("/admin/promos") },
            { icon: Bell, label: "Push Notification", color: "bg-blue-500/20 text-blue-400 border border-blue-500/30", action: () => setView("push_builder") },
            { icon: LayoutTemplate, label: "Templates", color: "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30", action: () => setView("template_library") },
            { icon: Code, label: "Import HTML", color: "bg-orange-500/20 text-orange-400 border border-orange-500/30", action: () => { setDraft({ ...draft, editor_mode: "html" }); setView("campaign_builder"); setCampaignStep("compose"); } },
            { icon: Archive, label: "History", color: "bg-gray-500/20 text-[#7a7060] border border-[#ddd8cc]", action: () => { /* scrolls to history below */ document.getElementById("campaign-history")?.scrollIntoView({ behavior: "smooth" }); } },
          ].map((btn) => (
            <button
              key={btn.label}
              onClick={btn.action}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl font-semibold text-sm transition hover:scale-[1.02] ${btn.color}`}
            >
              <btn.icon size={22} />
              {btn.label}
            </button>
          ))}
        </div>

        {/* Campaign History */}
        <div id="campaign-history" className="bg-white border border-[#ddd8cc] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-[#1e2d18] flex items-center gap-2">
              <Inbox size={20} className="text-[#3d6b2a]" />
              Campaign History
            </h3>
          </div>

          {campaigns.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#ddd8cc]">
                    <th className="text-left py-2 px-3 text-[#9a9080] font-medium">Campaign</th>
                    <th className="text-left py-2 px-3 text-[#9a9080] font-medium">Status</th>
                    <th className="text-left py-2 px-3 text-[#9a9080] font-medium">Recipients</th>
                    <th className="text-left py-2 px-3 text-[#9a9080] font-medium">Delivered</th>
                    <th className="text-left py-2 px-3 text-[#9a9080] font-medium">Date</th>
                    <th className="text-right py-2 px-3 text-[#9a9080] font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((c) => (
                    <tr key={c.id} className="border-b border-[#ddd8cc] hover:bg-[#f0ece3] transition">
                      <td className="py-3 px-3">
                        <button onClick={() => openCampaignDetail(c)} className="text-left group">
                          <p className="text-[#1e2d18] font-medium group-hover:text-[#3d6b2a] transition">{c.name}</p>
                          <p className="text-[#9a9080] text-xs">{c.subject || "—"}</p>
                        </button>
                      </td>
                      <td className="py-3 px-3"><StatusBadge status={c.status} /></td>
                      <td className="py-3 px-3 text-[#7a7060]">{c.recipient_count || "—"}</td>
                      <td className="py-3 px-3 text-[#7a7060]">{c.delivered_count || "—"}</td>
                      <td className="py-3 px-3 text-[#9a9080] text-xs">
                        {c.sent_at ? new Date(c.sent_at).toLocaleDateString() : new Date(c.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center gap-1 justify-end">
                          {c.status === "sent" && (
                            <button
                              onClick={() => resendCampaign(c.id)}
                              className="p-1.5 rounded-lg hover:bg-[#f0ece3] text-[#7a7060] hover:text-[#3d6b2a] transition"
                              title="Resend Failed"
                            >
                              <RefreshCw size={14} />
                            </button>
                          )}
                          <button
                            onClick={() => duplicateCampaign(c)}
                            className="p-1.5 rounded-lg hover:bg-[#f0ece3] text-[#7a7060] hover:text-[#1e2d18] transition"
                            title="Duplicate"
                          >
                            <Copy size={14} />
                          </button>
                          {c.status === "draft" && (
                            <button
                              onClick={() => {
                                setDraft({
                                  name: c.name,
                                  type: c.type,
                                  subject: c.subject || "",
                                  preview_text: c.preview_text || "",
                                  body_html: c.body_html || c.body || "",
                                  from_name: c.from_name || "Mad Fresh Kitchen",
                                  from_email: c.from_email || "hello@madfresh.app",
                                  reply_to: c.reply_to || "order@madfresh.app",
                                  editor_mode: (c.editor_mode as "rich_text" | "html") || "rich_text",
                                  template_id: "",
                                  scheduled_for: c.scheduled_for || "",
                                });
                                setView("campaign_builder");
                                setCampaignStep("compose");
                              }}
                              className="p-1.5 rounded-lg hover:bg-[#f0ece3] text-[#7a7060] hover:text-[#1e2d18] transition"
                              title="Edit"
                            >
                              <Edit3 size={14} />
                            </button>
                          )}
                          {c.status === "draft" && (
                            <button
                              onClick={() => sendCampaign(c.id)}
                              className="px-2 py-1 rounded-lg bg-[#e9f0e4] text-[#3d6b2a] text-xs font-semibold hover:bg-[#e9f0e4] transition"
                            >
                              Send
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Mail size={32} className="mx-auto mb-3 text-[#9a9080]" />
              <p className="text-[#9a9080]">No campaigns yet. Create your first campaign to get started.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Template Library View ──
  if (view === "template_library") {
    return (
      <div className="space-y-6">
        {toast && (
          <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg ${toast.type === "success" ? "bg-green-500/90" : "bg-red-500/90"} text-white text-sm font-medium`}>
            {toast.message}
          </div>
        )}

        <div className="flex items-center justify-between">
          <div>
            <button onClick={() => setView("dashboard")} className="text-[#9a9080] hover:text-[#1e2d18] text-sm mb-2 flex items-center gap-1">
              <ChevronLeft size={14} /> Back to Dashboard
            </button>
            <h2 className="text-xl font-bold text-[#1e2d18] flex items-center gap-2">
              <LayoutTemplate size={22} className="text-[#3d6b2a]" />
              Email Templates ({templates.length})
            </h2>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((t) => (
            <div key={t.id} className="bg-white border border-[#ddd8cc] rounded-xl p-5 hover:border-[#3d6b2a]/30 transition group">
              <div className="flex items-start justify-between mb-3">
                <CategoryBadge category={t.category} />
                {t.is_system && <span className="text-[10px] text-[#9a9080] uppercase tracking-wider">system</span>}
              </div>
              <h3 className="text-[#1e2d18] font-semibold mb-1">{t.name}</h3>
              <p className="text-[#9a9080] text-xs mb-3 line-clamp-2">{t.description}</p>
              <p className="text-[#7a7060] text-xs mb-4 font-mono truncate">{t.subject}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => startFromTemplate(t)}
                  className="flex-1 px-3 py-2 rounded-lg bg-[#e9f0e4] text-[#3d6b2a] text-xs font-semibold hover:bg-[#e9f0e4] transition flex items-center justify-center gap-1"
                >
                  <Send size={12} /> Use Template
                </button>
                <button
                  onClick={() => {
                    setDraft({
                      ...draft,
                      name: t.name,
                      subject: t.subject,
                      preview_text: t.preview_text || "",
                      body_html: t.body_html,
                      editor_mode: "html",
                    });
                    setView("campaign_builder");
                    setCampaignStep("preview");
                  }}
                  className="px-3 py-2 rounded-lg bg-[#f2efe8] text-[#7a7060] text-xs font-semibold hover:bg-[#f0ece3] transition flex items-center gap-1"
                >
                  <Eye size={12} /> Preview
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Campaign Detail View ──
  if (view === "campaign_detail" && selectedCampaign) {
    const failedCount = campaignRecipients.filter((r) => r.status === "failed" || r.status === "bounced").length;
    const sentCount = campaignRecipients.filter((r) => r.status === "sent").length;
    const pendingCount = campaignRecipients.filter((r) => r.status === "pending").length;

    const filteredRecipientList = recipientSearch
      ? campaignRecipients.filter(
          (r) =>
            r.email?.toLowerCase().includes(recipientSearch.toLowerCase()) ||
            r.first_name?.toLowerCase().includes(recipientSearch.toLowerCase()) ||
            r.last_name?.toLowerCase().includes(recipientSearch.toLowerCase())
        )
      : campaignRecipients;

    return (
      <div className="space-y-6">
        {toast && (
          <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg ${toast.type === "success" ? "bg-green-500/90" : "bg-red-500/90"} text-white text-sm font-medium`}>
            {toast.message}
          </div>
        )}

        <div className="flex items-center justify-between">
          <div>
            <button onClick={() => setView("dashboard")} className="text-[#9a9080] hover:text-[#1e2d18] text-sm mb-2 flex items-center gap-1">
              <ChevronLeft size={14} /> Back to Dashboard
            </button>
            <h2 className="text-2xl font-bold text-[#1e2d18] flex items-center gap-2">
              <Mail size={24} className="text-[#3d6b2a]" />
              {selectedCampaign.name}
            </h2>
            <p className="text-[#7a7060] text-sm mt-1">{selectedCampaign.subject || "No subject"}</p>
          </div>
          <div className="flex items-center gap-2">
            {failedCount > 0 && (
              <button
                onClick={resendAllFailed}
                disabled={loading}
                className="px-4 py-2 rounded-lg bg-red-50 text-red-600 text-sm font-semibold hover:bg-red-100 transition disabled:opacity-50 flex items-center gap-1.5"
              >
                <RefreshCw size={14} /> Resend All Failed ({failedCount})
              </button>
            )}
            {selectedRecipientIds.size > 0 && (
              <button
                onClick={resendToSelected}
                disabled={loading}
                className="px-4 py-2 rounded-lg bg-[#e9f0e4] text-[#3d6b2a] text-sm font-semibold hover:bg-[#dde8d6] transition disabled:opacity-50 flex items-center gap-1.5"
              >
                <Send size={14} /> Resend Selected ({selectedRecipientIds.size})
              </button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: "Total", value: campaignRecipients.length, color: "text-[#1e2d18]" },
            { label: "Sent", value: sentCount, color: "text-green-400" },
            { label: "Failed", value: failedCount, color: "text-red-600" },
            { label: "Pending", value: pendingCount, color: "text-yellow-400" },
            { label: "Sent At", value: selectedCampaign.sent_at ? new Date(selectedCampaign.sent_at).toLocaleString() : "—", color: "text-[#7a7060]", isText: true },
          ].map((s) => (
            <div key={s.label} className="bg-white border border-[#ddd8cc] rounded-xl p-4 text-center">
              <p className="text-[#9a9080] text-xs mb-1">{s.label}</p>
              <p className={`text-xl font-bold ${s.color}`}>
                {(s as any).isText ? <span className="text-sm">{s.value}</span> : s.value}
              </p>
            </div>
          ))}
        </div>

        {/* Campaign Info */}
        <div className="bg-white border border-[#ddd8cc] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-[#1e2d18] mb-3">Campaign Details</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div><p className="text-[#9a9080]">Status</p><StatusBadge status={selectedCampaign.status} /></div>
            <div><p className="text-[#9a9080]">From</p><p className="text-[#1e2d18]">{selectedCampaign.from_name || "Mad Fresh Kitchen"}</p></div>
            <div><p className="text-[#9a9080]">Reply To</p><p className="text-[#1e2d18]">{selectedCampaign.reply_to || "—"}</p></div>
            <div><p className="text-[#9a9080]">Created</p><p className="text-[#1e2d18]">{new Date(selectedCampaign.created_at).toLocaleDateString()}</p></div>
          </div>
        </div>

        {/* Recipient Table */}
        <div className="bg-white border border-[#ddd8cc] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-[#1e2d18] flex items-center gap-2">
              <Users size={18} className="text-[#3d6b2a]" />
              Recipients ({campaignRecipients.length})
            </h3>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9a9080]" />
                <input
                  type="text"
                  value={recipientSearch}
                  onChange={(e) => setRecipientSearch(e.target.value)}
                  placeholder="Search recipients..."
                  className="bg-white border border-[#ddd8cc] rounded-lg pl-9 pr-3 py-2 text-sm text-[#1e2d18] placeholder-[#9a9080] focus:border-[#3d6b2a] focus:ring-2 focus:ring-[#3d6b2a]/20 w-64"
                />
              </div>
              {filteredRecipientList.length > 0 && (
                <button
                  onClick={() => {
                    if (selectedRecipientIds.size === filteredRecipientList.length) {
                      setSelectedRecipientIds(new Set());
                    } else {
                      setSelectedRecipientIds(new Set(filteredRecipientList.map((r) => r.id)));
                    }
                  }}
                  className="px-3 py-2 rounded-lg bg-[#f2efe8] text-[#7a7060] text-xs hover:bg-[#f0ece3] transition"
                >
                  {selectedRecipientIds.size === filteredRecipientList.length ? "Deselect All" : "Select All"}
                </button>
              )}
            </div>
          </div>

          {recipientLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#75F663] border-t-transparent mx-auto mb-3" />
              <p className="text-[#9a9080] text-sm">Loading recipients...</p>
            </div>
          ) : filteredRecipientList.length > 0 ? (
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white">
                  <tr className="border-b border-[#ddd8cc]">
                    <th className="text-left py-2 px-3 w-8"></th>
                    <th className="text-left py-2 px-3 text-[#9a9080] font-medium">Email</th>
                    <th className="text-left py-2 px-3 text-[#9a9080] font-medium">Name</th>
                    <th className="text-left py-2 px-3 text-[#9a9080] font-medium">Status</th>
                    <th className="text-left py-2 px-3 text-[#9a9080] font-medium">Sent At</th>
                    <th className="text-left py-2 px-3 text-[#9a9080] font-medium">Error</th>
                    <th className="text-right py-2 px-3 text-[#9a9080] font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecipientList.map((r) => (
                    <tr key={r.id} className="border-b border-[#ddd8cc] hover:bg-[#f0ece3] transition">
                      <td className="py-2.5 px-3">
                        <input
                          type="checkbox"
                          checked={selectedRecipientIds.has(r.id)}
                          onChange={(e) => {
                            const next = new Set(selectedRecipientIds);
                            if (e.target.checked) next.add(r.id);
                            else next.delete(r.id);
                            setSelectedRecipientIds(next);
                          }}
                          className="accent-[#75F663]"
                        />
                      </td>
                      <td className="py-2.5 px-3 text-[#1e2d18]">{r.email}</td>
                      <td className="py-2.5 px-3 text-[#7a7060]">
                        {[r.first_name, r.last_name].filter(Boolean).join(" ") || "—"}
                      </td>
                      <td className="py-2.5 px-3">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="py-2.5 px-3 text-[#9a9080] text-xs">
                        {r.sent_at ? new Date(r.sent_at).toLocaleString() : "—"}
                      </td>
                      <td className="py-2.5 px-3 text-red-600 text-xs max-w-[200px] truncate" title={r.failed_reason || ""}>
                        {r.failed_reason || "—"}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => resendSingle(r.id)}
                          disabled={loading}
                          className="p-1.5 rounded-lg hover:bg-[#f0ece3] text-[#7a7060] hover:text-[#3d6b2a] transition disabled:opacity-30"
                          title="Resend"
                        >
                          <RefreshCw size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Mail size={32} className="mx-auto mb-3 text-[#9a9080]" />
              <p className="text-[#9a9080]">No recipients found for this campaign.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Push Notification Builder ──
  if (view === "push_builder") {
    return (
      <div className="space-y-6 max-w-2xl">
        {toast && (
          <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg ${toast.type === "success" ? "bg-green-500/90" : "bg-red-500/90"} text-white text-sm font-medium`}>
            {toast.message}
          </div>
        )}

        <button onClick={() => setView("dashboard")} className="text-[#9a9080] hover:text-[#1e2d18] text-sm flex items-center gap-1">
          <ChevronLeft size={14} /> Back to Dashboard
        </button>
        <h2 className="text-xl font-bold text-[#1e2d18] flex items-center gap-2">
          <Bell size={22} className="text-blue-400" />
          Push Notification Builder
        </h2>
        <p className="text-[#9a9080] text-sm">Push notifications will be stored and ready for mobile app integration. Currently saved as drafts.</p>

        <div className="space-y-4 bg-white border border-[#ddd8cc] rounded-xl p-5">
          <div>
            <label className="block text-sm font-medium text-[#4a5e3a] mb-1">Title</label>
            <input
              value={pushDraft.title}
              onChange={(e) => setPushDraft({ ...pushDraft, title: e.target.value })}
              className="w-full bg-white border border-[#ddd8cc] rounded-lg px-3 py-2 text-[#1e2d18] text-sm placeholder-[#9a9080] focus:border-[#3d6b2a] focus:ring-2 focus:ring-[#3d6b2a]/20 focus:outline-none"
              placeholder="Notification title"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#4a5e3a] mb-1">Body</label>
            <textarea
              value={pushDraft.body}
              onChange={(e) => setPushDraft({ ...pushDraft, body: e.target.value })}
              rows={3}
              className="w-full bg-white border border-[#ddd8cc] rounded-lg px-3 py-2 text-[#1e2d18] text-sm placeholder-[#9a9080] focus:border-[#3d6b2a] focus:ring-2 focus:ring-[#3d6b2a]/20 focus:outline-none resize-none"
              placeholder="Notification body text"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#4a5e3a] mb-1">Destination URL (optional)</label>
            <input
              value={pushDraft.destination_url}
              onChange={(e) => setPushDraft({ ...pushDraft, destination_url: e.target.value })}
              className="w-full bg-white border border-[#ddd8cc] rounded-lg px-3 py-2 text-[#1e2d18] text-sm placeholder-[#9a9080] focus:border-[#3d6b2a] focus:ring-2 focus:ring-[#3d6b2a]/20 focus:outline-none"
              placeholder="/menu or https://..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#4a5e3a] mb-1">Schedule (optional)</label>
            <input
              type="datetime-local"
              value={pushDraft.scheduled_for}
              onChange={(e) => setPushDraft({ ...pushDraft, scheduled_for: e.target.value })}
              className="w-full bg-white border border-[#ddd8cc] rounded-lg px-3 py-2 text-[#1e2d18] text-sm placeholder-[#9a9080] focus:border-[#3d6b2a] focus:ring-2 focus:ring-[#3d6b2a]/20 focus:outline-none"
            />
          </div>

          {/* Preview */}
          {pushDraft.title && (
            <div className="border border-[#ddd8cc] rounded-xl p-4 bg-[#f2efe8]">
              <p className="text-xs text-[#9a9080] mb-2">Preview</p>
              <div className="bg-white rounded-lg p-3 flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#e9f0e4] flex items-center justify-center flex-shrink-0">
                  <Megaphone size={18} className="text-[#3d6b2a]" />
                </div>
                <div>
                  <p className="text-[#1e2d18] text-sm font-semibold">{pushDraft.title}</p>
                  <p className="text-[#7a7060] text-xs">{pushDraft.body || "..."}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={savePushNotification}
              disabled={!pushDraft.title || !pushDraft.body || loading}
              className="px-6 py-2.5 rounded-lg bg-blue-500/20 text-blue-400 font-semibold text-sm hover:bg-blue-500/30 transition disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save Draft"}
            </button>
            <button
              onClick={() => {
                showToast("success", "Push notification sent (mock) — ready for mobile integration");
              }}
              disabled={!pushDraft.title || !pushDraft.body}
              className="px-6 py-2.5 rounded-lg bg-[#3d6b2a] text-white hover:bg-[#2f5720] font-bold text-sm hover:bg-[#2f5720] transition disabled:opacity-50"
            >
              Send Mock
            </button>
          </div>
        </div>

        {/* Existing push notifications */}
        {pushNotifications.length > 0 && (
          <div className="bg-white border border-[#ddd8cc] rounded-xl p-5">
            <h3 className="text-[#1e2d18] font-semibold mb-3">Previous Notifications</h3>
            {pushNotifications.map((pn: any) => (
              <div key={pn.id} className="flex items-center justify-between py-2 border-b border-[#ddd8cc] last:border-0">
                <div>
                  <p className="text-[#1e2d18] text-sm">{pn.title || pn.name}</p>
                  <p className="text-[#9a9080] text-xs">{new Date(pn.created_at).toLocaleDateString()}</p>
                </div>
                <StatusBadge status={pn.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Campaign Builder View ──
  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg ${toast.type === "success" ? "bg-green-500/90" : "bg-red-500/90"} text-white text-sm font-medium`}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button onClick={() => setView("dashboard")} className="text-[#9a9080] hover:text-[#1e2d18] text-sm mb-1 flex items-center gap-1">
            <ChevronLeft size={14} /> Back
          </button>
          <h2 className="text-xl font-bold text-[#1e2d18]">New Email Campaign</h2>
        </div>
        <div className="flex gap-2">
          <button onClick={saveDraft} disabled={loading} className="px-4 py-2 rounded-lg bg-[#f2efe8] text-[#4a5e3a] text-sm font-medium hover:bg-[#f0ece3] transition">
            Save Draft
          </button>
        </div>
      </div>

      {/* Step Progress */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2">
        {steps.map((s, i) => (
          <button
            key={s}
            onClick={() => setCampaignStep(s)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition ${
              i === stepIndex
                ? "bg-[#e9f0e4] text-[#3d6b2a] border border-[#3d6b2a]/30"
                : i < stepIndex
                ? "bg-green-500/10 text-green-400"
                : "bg-[#f2efe8] text-[#9a9080]"
            }`}
          >
            {i < stepIndex ? <CheckCircle size={12} /> : <span className="w-4 h-4 rounded-full border border-current flex items-center justify-center text-[10px]">{i + 1}</span>}
            {s.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      {/* ── Step 1: Campaign Type ── */}
      {campaignStep === "type" && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { value: "email_blast", icon: Mail, label: "Email Blast", desc: "Send an email to a segment of contacts" },
            { value: "promotional", icon: Gift, label: "Promotional", desc: "Promote a deal, event, or new item" },
            { value: "event_campaign", icon: CalendarDays, label: "Event Campaign", desc: "Drive registrations or follow up on an event" },
            { value: "follow_up", icon: RefreshCw, label: "Follow-Up", desc: "Re-engage or follow up with contacts" },
            { value: "nurture", icon: Target, label: "Lead Nurture", desc: "Warm up leads with value-driven content" },
            { value: "custom", icon: Edit3, label: "Custom", desc: "Build from scratch with full control" },
          ].map((t) => (
            <button
              key={t.value}
              onClick={() => { setDraft({ ...draft, type: t.value }); setCampaignStep("template"); }}
              className={`text-left p-5 rounded-xl border transition hover:border-[#3d6b2a]/30 ${
                draft.type === t.value ? "border-[#3d6b2a]/50 bg-[#e9f0e4]" : "border-[#ddd8cc] bg-white border border-[#ddd8cc]"
              }`}
            >
              <t.icon size={24} className="text-[#3d6b2a] mb-3" />
              <p className="text-[#1e2d18] font-semibold mb-1">{t.label}</p>
              <p className="text-[#9a9080] text-xs">{t.desc}</p>
            </button>
          ))}
        </div>
      )}

      {/* ── Step 2: Choose Template ── */}
      {campaignStep === "template" && (
        <div className="space-y-4">
          <button
            onClick={() => setCampaignStep("recipients")}
            className="w-full p-5 rounded-xl border border-dashed border-[#ddd8cc] hover:border-[#3d6b2a]/30 transition text-left"
          >
            <div className="flex items-center gap-3">
              <Plus size={24} className="text-[#3d6b2a]" />
              <div>
                <p className="text-[#1e2d18] font-semibold">Start from Blank</p>
                <p className="text-[#9a9080] text-xs">Compose your email from scratch</p>
              </div>
            </div>
          </button>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {templates.map((t) => (
              <button
                key={t.id}
                onClick={() => startFromTemplate(t)}
                className="text-left p-4 rounded-xl border border-[#ddd8cc] bg-white border border-[#ddd8cc] hover:border-[#3d6b2a]/30 transition"
              >
                <CategoryBadge category={t.category} />
                <p className="text-[#1e2d18] font-semibold mt-2 mb-1 text-sm">{t.name}</p>
                <p className="text-[#9a9080] text-xs line-clamp-2">{t.description}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Step 3: Select Recipients ── */}
      {campaignStep === "recipients" && (
        <div className="space-y-4">
          {/* Mode toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setSelectMode("filter")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${selectMode === "filter" ? "bg-[#e9f0e4] text-[#3d6b2a]" : "bg-[#f2efe8] text-[#7a7060]"}`}
            >
              <Filter size={14} className="inline mr-1" /> Filter by Segment
            </button>
            <button
              onClick={() => setSelectMode("manual")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${selectMode === "manual" ? "bg-[#e9f0e4] text-[#3d6b2a]" : "bg-[#f2efe8] text-[#7a7060]"}`}
            >
              <UserCheck size={14} className="inline mr-1" /> Manual Selection
            </button>
          </div>

          {/* Recipient count */}
          <div className="flex items-center gap-3 bg-[#e9f0e4] border border-[#3d6b2a]/20 rounded-lg px-4 py-3">
            <Users size={18} className="text-[#3d6b2a]" />
            <span className="text-[#3d6b2a] font-bold text-lg">{selectedRecipients.length}</span>
            <span className="text-[#7a7060] text-sm">recipients selected</span>
            {selectedRecipients.some((c) => c.unsubscribed_at) && (
              <span className="text-orange-400 text-xs flex items-center gap-1 ml-auto">
                <AlertTriangle size={12} /> Unsubscribed contacts excluded
              </span>
            )}
          </div>

          {selectMode === "filter" ? (
            <div className="bg-white border border-[#ddd8cc] rounded-xl p-5 space-y-4">
              <h3 className="text-[#1e2d18] font-semibold text-sm">Segment Filters</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {/* Source filter */}
                <div>
                  <label className="text-xs text-[#9a9080] mb-1 block">Source</label>
                  <select
                    value={filters.source || ""}
                    onChange={(e) => setFilters({ ...filters, source: e.target.value || undefined })}
                    className="w-full bg-white border border-[#ddd8cc] rounded-lg px-3 py-2 text-[#1e2d18] text-sm placeholder-[#9a9080] focus:border-[#3d6b2a] focus:ring-2 focus:ring-[#3d6b2a]/20 focus:outline-none"
                  >
                    <option value="">All Sources</option>
                    <option value="app_signup">App Signup</option>
                    <option value="website">Website</option>
                    <option value="event_rsvp">Event RSVP</option>
                    <option value="waitlist">Waitlist</option>
                    <option value="newsletter">Newsletter</option>
                    <option value="referral">Referral</option>
                    <option value="catering_inquiry">Catering Inquiry</option>
                    <option value="import">Import</option>
                  </select>
                </div>

                {/* Contact type */}
                <div>
                  <label className="text-xs text-[#9a9080] mb-1 block">Contact Type</label>
                  <select
                    value={filters.contact_type || ""}
                    onChange={(e) => setFilters({ ...filters, contact_type: e.target.value || undefined })}
                    className="w-full bg-white border border-[#ddd8cc] rounded-lg px-3 py-2 text-[#1e2d18] text-sm placeholder-[#9a9080] focus:border-[#3d6b2a] focus:ring-2 focus:ring-[#3d6b2a]/20 focus:outline-none"
                  >
                    <option value="">All Types</option>
                    <option value="lead">Leads</option>
                    <option value="customer">Customers</option>
                    <option value="vendor">Vendors</option>
                    <option value="partner">Partners</option>
                  </select>
                </div>

                {/* Subscription status */}
                <div>
                  <label className="text-xs text-[#9a9080] mb-1 block">Subscription</label>
                  <select
                    value={filters.has_active_subscription === undefined ? "" : String(filters.has_active_subscription)}
                    onChange={(e) => setFilters({ ...filters, has_active_subscription: e.target.value === "" ? undefined : e.target.value === "true" })}
                    className="w-full bg-white border border-[#ddd8cc] rounded-lg px-3 py-2 text-[#1e2d18] text-sm placeholder-[#9a9080] focus:border-[#3d6b2a] focus:ring-2 focus:ring-[#3d6b2a]/20 focus:outline-none"
                  >
                    <option value="">Any</option>
                    <option value="true">Active Subscribers</option>
                    <option value="false">No Subscription</option>
                  </select>
                </div>

                {/* Newsletter */}
                <div>
                  <label className="text-xs text-[#9a9080] mb-1 block">Newsletter</label>
                  <select
                    value={filters.is_newsletter_subscribed === undefined ? "" : String(filters.is_newsletter_subscribed)}
                    onChange={(e) => setFilters({ ...filters, is_newsletter_subscribed: e.target.value === "" ? undefined : e.target.value === "true" })}
                    className="w-full bg-white border border-[#ddd8cc] rounded-lg px-3 py-2 text-[#1e2d18] text-sm placeholder-[#9a9080] focus:border-[#3d6b2a] focus:ring-2 focus:ring-[#3d6b2a]/20 focus:outline-none"
                  >
                    <option value="">Any</option>
                    <option value="true">Subscribed</option>
                    <option value="false">Not Subscribed</option>
                  </select>
                </div>

                {/* Purchased */}
                <div>
                  <label className="text-xs text-[#9a9080] mb-1 block">Purchase History</label>
                  <select
                    value={filters.has_purchased === undefined ? "" : String(filters.has_purchased)}
                    onChange={(e) => setFilters({ ...filters, has_purchased: e.target.value === "" ? undefined : e.target.value === "true" })}
                    className="w-full bg-white border border-[#ddd8cc] rounded-lg px-3 py-2 text-[#1e2d18] text-sm placeholder-[#9a9080] focus:border-[#3d6b2a] focus:ring-2 focus:ring-[#3d6b2a]/20 focus:outline-none"
                  >
                    <option value="">Any</option>
                    <option value="true">Has Purchased</option>
                    <option value="false">Never Purchased</option>
                  </select>
                </div>

                {/* Exclude vendors toggle */}
                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!filters.exclude_vendors}
                      onChange={(e) => setFilters({ ...filters, exclude_vendors: e.target.checked || undefined })}
                      className="rounded border-[#ddd8cc] bg-white text-[#3d6b2a] focus:ring-[#3d6b2a]/50"
                    />
                    <span className="text-sm text-[#7a7060]">Exclude Vendors</span>
                  </label>
                </div>
              </div>

              <button
                onClick={() => setFilters({})}
                className="text-xs text-[#9a9080] hover:text-[#1e2d18] transition"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            /* Manual selection */
            <div className="bg-white border border-[#ddd8cc] rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9a9080]" />
                  <input
                    value={contactSearch}
                    onChange={(e) => setContactSearch(e.target.value)}
                    className="w-full bg-white border border-[#ddd8cc] rounded-lg pl-8 pr-3 py-2 text-[#1e2d18] text-sm placeholder-[#9a9080] focus:border-[#3d6b2a] focus:ring-2 focus:ring-[#3d6b2a]/20 focus:outline-none"
                    placeholder="Search contacts..."
                  />
                </div>
                <button
                  onClick={() => {
                    const allIds = new Set(filteredContacts.map((c) => c.id));
                    setManualSelected(allIds);
                  }}
                  className="px-3 py-2 rounded-lg bg-[#f2efe8] text-[#7a7060] text-xs hover:bg-[#f0ece3] transition"
                >
                  Select All
                </button>
                <button
                  onClick={() => setManualSelected(new Set())}
                  className="px-3 py-2 rounded-lg bg-[#f2efe8] text-[#7a7060] text-xs hover:bg-[#f0ece3] transition"
                >
                  Clear
                </button>
              </div>
              <div className="max-h-64 overflow-y-auto space-y-1">
                {filteredContacts.map((c) => (
                  <label key={c.id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#f0ece3] cursor-pointer transition">
                    <input
                      type="checkbox"
                      checked={manualSelected.has(c.id)}
                      onChange={(e) => {
                        const next = new Set(manualSelected);
                        if (e.target.checked) next.add(c.id);
                        else next.delete(c.id);
                        setManualSelected(next);
                      }}
                      className="rounded border-[#ddd8cc] bg-white text-[#3d6b2a] focus:ring-[#3d6b2a]/50"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-[#1e2d18] text-sm truncate">{c.first_name} {c.last_name}</p>
                      <p className="text-[#9a9080] text-xs truncate">{c.email}</p>
                    </div>
                    <span className="text-xs text-[#9a9080]">{c.source}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Step 4: Compose ── */}
      {campaignStep === "compose" && (
        <div className="space-y-4">
          <div className="bg-white border border-[#ddd8cc] rounded-xl p-5 space-y-4">
            {/* Campaign name */}
            <div>
              <label className="text-xs text-[#9a9080] mb-1 block">Campaign Name</label>
              <input
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                className="w-full bg-white border border-[#ddd8cc] rounded-lg px-3 py-2 text-[#1e2d18] text-sm placeholder-[#9a9080] focus:border-[#3d6b2a] focus:ring-2 focus:ring-[#3d6b2a]/20 focus:outline-none"
                placeholder="e.g. Summer Promo Blast"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-[#9a9080] mb-1 block">Subject Line</label>
                <input
                  value={draft.subject}
                  onChange={(e) => setDraft({ ...draft, subject: e.target.value })}
                  className="w-full bg-white border border-[#ddd8cc] rounded-lg px-3 py-2 text-[#1e2d18] text-sm placeholder-[#9a9080] focus:border-[#3d6b2a] focus:ring-2 focus:ring-[#3d6b2a]/20 focus:outline-none"
                  placeholder="e.g. 🔥 Fresh Deals Inside — Just for You"
                />
              </div>
              <div>
                <label className="text-xs text-[#9a9080] mb-1 block">Preview Text</label>
                <input
                  value={draft.preview_text}
                  onChange={(e) => setDraft({ ...draft, preview_text: e.target.value })}
                  className="w-full bg-white border border-[#ddd8cc] rounded-lg px-3 py-2 text-[#1e2d18] text-sm placeholder-[#9a9080] focus:border-[#3d6b2a] focus:ring-2 focus:ring-[#3d6b2a]/20 focus:outline-none"
                  placeholder="Shows in inbox preview"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-[#9a9080] mb-1 block">From Name</label>
                <input
                  value={draft.from_name}
                  onChange={(e) => setDraft({ ...draft, from_name: e.target.value })}
                  className="w-full bg-white border border-[#ddd8cc] rounded-lg px-3 py-2 text-[#1e2d18] text-sm placeholder-[#9a9080] focus:border-[#3d6b2a] focus:ring-2 focus:ring-[#3d6b2a]/20 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-[#9a9080] mb-1 block">From Email</label>
                <input
                  value={draft.from_email}
                  onChange={(e) => setDraft({ ...draft, from_email: e.target.value })}
                  className="w-full bg-white border border-[#ddd8cc] rounded-lg px-3 py-2 text-[#1e2d18] text-sm placeholder-[#9a9080] focus:border-[#3d6b2a] focus:ring-2 focus:ring-[#3d6b2a]/20 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-[#9a9080] mb-1 block">Reply-To</label>
                <input
                  value={draft.reply_to}
                  onChange={(e) => setDraft({ ...draft, reply_to: e.target.value })}
                  className="w-full bg-white border border-[#ddd8cc] rounded-lg px-3 py-2 text-[#1e2d18] text-sm placeholder-[#9a9080] focus:border-[#3d6b2a] focus:ring-2 focus:ring-[#3d6b2a]/20 focus:outline-none"
                />
              </div>
            </div>

            {/* Editor mode toggle */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setDraft({ ...draft, editor_mode: "rich_text" })}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${draft.editor_mode === "rich_text" ? "bg-[#e9f0e4] text-[#3d6b2a]" : "bg-[#f2efe8] text-[#7a7060]"}`}
              >
                <Edit3 size={12} className="inline mr-1" /> Rich Text
              </button>
              <button
                onClick={() => setDraft({ ...draft, editor_mode: "html" })}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${draft.editor_mode === "html" ? "bg-[#e9f0e4] text-[#3d6b2a]" : "bg-[#f2efe8] text-[#7a7060]"}`}
              >
                <Code size={12} className="inline mr-1" /> HTML Code
              </button>
              <span className="text-xs text-[#9a9080] ml-2">
                Merge fields: {"{{first_name}}"}, {"{{last_name}}"}, {"{{email}}"}, {"{{custom_message | fallback}}"}
              </span>
            </div>

            {/* Email body editor */}
            <div>
              <label className="text-xs text-[#9a9080] mb-1 block">
                {draft.editor_mode === "html" ? "HTML Email Code" : "Email Body (HTML supported)"}
              </label>
              <textarea
                value={draft.body_html}
                onChange={(e) => setDraft({ ...draft, body_html: e.target.value })}
                rows={draft.editor_mode === "html" ? 20 : 12}
                className={`w-full bg-[#f2efe8] border border-[#ddd8cc] rounded-lg px-3 py-3 text-sm focus:outline-none focus:border-[#3d6b2a]/50 resize-y ${
                  draft.editor_mode === "html" ? "font-mono text-green-400" : "text-[#1e2d18]"
                }`}
                placeholder={draft.editor_mode === "html"
                  ? "Paste your full HTML email code here..."
                  : "<p>Hi {{first_name}},</p>\n<p>Your message here...</p>\n<p><a href=\"/menu\">Order Now</a></p>"
                }
              />
            </div>

            {/* Quick formatting buttons for rich text mode */}
            {draft.editor_mode === "rich_text" && (
              <div className="flex flex-wrap gap-1">
                {[
                  { label: "<h2>", insert: "<h2 style=\"color:#75F663;font-size:20px;font-weight:700;margin:0 0 12px;\">Heading</h2>" },
                  { label: "Bold", insert: "<strong style=\"color:#ffffff;\">bold text</strong>" },
                  { label: "Link", insert: "<a href=\"/menu\" style=\"color:#75F663;text-decoration:none;\">Link Text</a>" },
                  { label: "Button", insert: "<table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\"><tr><td align=\"center\" style=\"padding:16px 0;\"><a href=\"/menu\" style=\"display:inline-block;background-color:#75F663;color:#0a0a0a;padding:12px 32px;text-decoration:none;border-radius:6px;font-weight:700;font-size:14px;\">Button Text</a></td></tr></table>" },
                  { label: "Divider", insert: "<hr style=\"border:none;border-top:1px solid #1a1a1a;margin:20px 0;\" />" },
                  { label: "List", insert: "<ul style=\"padding-left:20px;\"><li style=\"color:#cccccc;margin-bottom:8px;\">Item 1</li><li style=\"color:#cccccc;margin-bottom:8px;\">Item 2</li></ul>" },
                  { label: "{{first_name}}", insert: "{{first_name}}" },
                  { label: "{{email}}", insert: "{{email}}" },
                ].map((btn) => (
                  <button
                    key={btn.label}
                    onClick={() => setDraft({ ...draft, body_html: draft.body_html + "\n" + btn.insert })}
                    className="px-2 py-1 rounded bg-[#f2efe8] text-[#7a7060] text-xs hover:bg-[#f0ece3] hover:text-[#1e2d18] transition"
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            )}

            {/* Validation warnings */}
            <div className="space-y-1">
              {!draft.subject && <p className="text-orange-400 text-xs flex items-center gap-1"><AlertTriangle size={12} /> Subject line is required</p>}
              {!draft.body_html && <p className="text-orange-400 text-xs flex items-center gap-1"><AlertTriangle size={12} /> Email body is required</p>}
              {draft.body_html && !draft.body_html.includes("unsubscribe") && (
                <p className="text-yellow-500/70 text-xs flex items-center gap-1"><AlertTriangle size={12} /> Unsubscribe link will be added automatically in the email footer</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Step 5: Preview ── */}
      {campaignStep === "preview" && (
        <div className="space-y-4">
          <div className="grid lg:grid-cols-2 gap-4">
            {/* Desktop preview */}
            <div className="bg-white border border-[#ddd8cc] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Globe size={14} className="text-[#9a9080]" />
                <span className="text-xs text-[#9a9080] font-medium">Desktop Preview</span>
              </div>
              <div className="bg-white border border-[#ddd8cc] rounded-lg overflow-hidden">
                <div className="p-3 border-b border-[#ddd8cc]">
                  <p className="text-[#1e2d18] text-sm font-semibold">{draft.subject || "(No subject)"}</p>
                  <p className="text-[#9a9080] text-xs">From: {draft.from_name} &lt;{draft.from_email}&gt;</p>
                  {draft.preview_text && <p className="text-[#9a9080] text-xs mt-1">{draft.preview_text}</p>}
                </div>
                <div
                  className="p-4 text-sm"
                  dangerouslySetInnerHTML={{
                    __html: (draft.body_html || "").replace(/\{\{first_name(?:\s*\|[^}]*)?\}\}/g, "John").replace(/\{\{last_name(?:\s*\|[^}]*)?\}\}/g, "Doe").replace(/\{\{email(?:\s*\|[^}]*)?\}\}/g, "john@example.com"),
                  }}
                />
              </div>
            </div>

            {/* Mobile preview */}
            <div className="bg-white border border-[#ddd8cc] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Bell size={14} className="text-[#9a9080]" />
                <span className="text-xs text-[#9a9080] font-medium">Mobile Preview</span>
              </div>
              <div className="mx-auto w-[320px] bg-white border border-[#ddd8cc] rounded-2xl overflow-hidden">
                <div className="p-3 border-b border-[#ddd8cc]">
                  <p className="text-[#1e2d18] text-xs font-semibold truncate">{draft.subject || "(No subject)"}</p>
                  <p className="text-[#9a9080] text-[10px]">{draft.from_name}</p>
                </div>
                <div
                  className="p-3 text-xs overflow-auto max-h-72"
                  dangerouslySetInnerHTML={{
                    __html: (draft.body_html || "").replace(/\{\{first_name(?:\s*\|[^}]*)?\}\}/g, "John"),
                  }}
                />
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-white border border-[#ddd8cc] rounded-xl p-5">
            <h3 className="text-[#1e2d18] font-semibold mb-3">Campaign Summary</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
              <div><span className="text-[#9a9080]">Campaign:</span> <span className="text-[#1e2d18] ml-1">{draft.name || "—"}</span></div>
              <div><span className="text-[#9a9080]">Type:</span> <span className="text-[#1e2d18] ml-1">{draft.type}</span></div>
              <div><span className="text-[#9a9080]">Recipients:</span> <span className="text-[#3d6b2a] ml-1 font-bold">{selectedRecipients.length}</span></div>
              <div><span className="text-[#9a9080]">Editor:</span> <span className="text-[#1e2d18] ml-1">{draft.editor_mode}</span></div>
            </div>
          </div>
        </div>
      )}

      {/* ── Step 6: Send ── */}
      {campaignStep === "send" && (
        <div className="max-w-lg mx-auto text-center space-y-6">
          <div className="bg-white border border-[#ddd8cc] rounded-xl p-8">
            <Send size={48} className="mx-auto text-[#3d6b2a] mb-4" />
            <h3 className="text-xl font-bold text-[#1e2d18] mb-2">Ready to Send?</h3>
            <p className="text-[#7a7060] text-sm mb-6">
              This will send to <strong className="text-[#3d6b2a]">{selectedRecipients.length}</strong> recipients immediately.
            </p>

            <div className="space-y-3">
              <button
                onClick={() => sendCampaign()}
                disabled={loading || selectedRecipients.length === 0}
                className="w-full py-3 rounded-xl bg-[#3d6b2a] text-white hover:bg-[#2f5720] font-bold text-sm hover:bg-[#2f5720] transition disabled:opacity-50"
              >
                {loading ? "Sending..." : `Send Now to ${selectedRecipients.length} recipients`}
              </button>
              <button
                onClick={sendTest}
                disabled={loading}
                className="w-full py-3 rounded-xl bg-[#f2efe8] text-[#4a5e3a] font-medium text-sm hover:bg-[#f0ece3] transition"
              >
                Send Test Email First
              </button>
              <button
                onClick={saveDraft}
                disabled={loading}
                className="w-full py-3 rounded-xl bg-[#f2efe8] text-[#7a7060] font-medium text-sm hover:bg-[#f0ece3] transition"
              >
                Save as Draft
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Navigation Buttons ── */}
      <div className="flex items-center justify-between pt-4 border-t border-[#ddd8cc]">
        <button
          onClick={() => stepIndex > 0 && setCampaignStep(steps[stepIndex - 1])}
          disabled={stepIndex === 0}
          className="px-4 py-2 rounded-lg bg-[#f2efe8] text-[#7a7060] text-sm font-medium hover:bg-[#f0ece3] transition disabled:opacity-30"
        >
          <ChevronLeft size={14} className="inline mr-1" /> Previous
        </button>

        {stepIndex < steps.length - 1 && (
          <button
            onClick={() => {
              if (canProceed(campaignStep)) {
                setCampaignStep(steps[stepIndex + 1]);
              }
            }}
            disabled={!canProceed(campaignStep)}
            className="px-6 py-2 rounded-lg bg-[#e9f0e4] text-[#3d6b2a] text-sm font-semibold hover:bg-[#dde8d6] transition disabled:opacity-30 flex items-center gap-1"
          >
            Next <ChevronRight size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
