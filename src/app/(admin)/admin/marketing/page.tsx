import { createClient } from "@/lib/supabase/server";
import { Megaphone } from "lucide-react";
import MarketingCommandCenter from "./MarketingCommandCenter";

export default async function MarketingPage() {
  const supabase = await createClient();
  const STORE_ID = "b0000000-0000-0000-0000-000000000001";

  // Fetch all data in parallel
  const [
    { data: campaigns },
    { data: templates },
    { count: totalContacts },
    { count: newsletterSubs },
    { count: activeSubCount },
    { data: contacts },
    { data: events },
    { data: pushNotifications },
  ] = await Promise.all([
    supabase.from("campaigns").select("*").eq("store_id", STORE_ID).order("created_at", { ascending: false }),
    supabase.from("email_templates").select("*").eq("store_id", STORE_ID).order("category", { ascending: true }),
    supabase.from("contacts").select("*", { count: "exact", head: true }).eq("store_id", STORE_ID),
    supabase.from("contacts").select("*", { count: "exact", head: true }).eq("store_id", STORE_ID).eq("is_newsletter_subscribed", true),
    supabase.from("contacts").select("*", { count: "exact", head: true }).eq("store_id", STORE_ID).eq("has_active_subscription", true),
    supabase.from("contacts").select("id, email, first_name, last_name, source, contact_type, has_active_subscription, total_orders, is_newsletter_subscribed, tags, created_at, last_order_date, unsubscribed_at").eq("store_id", STORE_ID).order("created_at", { ascending: false }),
    supabase.from("events").select("id, name, event_date, status").eq("store_id", STORE_ID).order("event_date", { ascending: false }).limit(20),
    supabase.from("push_notifications").select("*").eq("store_id", STORE_ID).order("created_at", { ascending: false }),
  ]);

  const stats = {
    totalContacts: totalContacts || 0,
    newsletterSubs: newsletterSubs || 0,
    activeSubs: activeSubCount || 0,
    totalCampaigns: campaigns?.length || 0,
    sentCampaigns: campaigns?.filter((c: any) => c.status === "sent").length || 0,
    draftCampaigns: campaigns?.filter((c: any) => c.status === "draft").length || 0,
    scheduledCampaigns: campaigns?.filter((c: any) => c.status === "scheduled").length || 0,
    leads: contacts?.filter((c: any) => !c.total_orders || c.total_orders === 0).length || 0,
    customers: contacts?.filter((c: any) => c.total_orders && c.total_orders > 0).length || 0,
    vendors: contacts?.filter((c: any) => c.contact_type === "vendor").length || 0,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#1e2d18] mb-2 flex items-center gap-3">
          <Megaphone size={32} className="text-[#3d6b2a]" />
          Marketing Command Center
        </h1>
        <p className="text-[#7a7060]">Create campaigns, send emails, manage templates, and engage your audience</p>
      </div>

      <MarketingCommandCenter
        campaigns={campaigns || []}
        templates={templates || []}
        contacts={contacts || []}
        events={events || []}
        pushNotifications={pushNotifications || []}
        stats={stats}
      />
    </div>
  );
}
