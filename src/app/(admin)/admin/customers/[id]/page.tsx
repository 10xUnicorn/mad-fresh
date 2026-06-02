import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  User,
  Star,
  ShoppingBag,
  Package,
  MessageSquare,
  Tag,
} from "lucide-react";
import ContactEditor from "@/components/admin/ContactEditor";

const STORE_ID = "b0000000-0000-0000-0000-000000000001";

function ContactTypeBadge({ type }: { type: string | null }) {
  const styles: Record<string, string> = {
    customer: "bg-blue-50 text-blue-700 border-blue-200",
    lead: "bg-amber-50 text-amber-700 border-amber-200",
    vip: "bg-purple-50 text-purple-700 border-purple-200",
    partner: "bg-amber-50 text-amber-700 border-amber-200",
    vendor: "bg-[#f2efe8] text-[#7a7060] border-[#ddd8cc]",
  };
  const label = type || "contact";
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${styles[label] || styles.vendor}`}>
      {label.toUpperCase()}
    </span>
  );
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number | null | undefined;
  sub?: string;
}) {
  return (
    <div className="bg-white border border-[#ddd8cc] rounded-xl p-4">
      <p className="text-[#9a9080] text-xs font-medium mb-1">{label}</p>
      <p className="text-[#1e2d18] text-xl font-bold">{value ?? "—"}</p>
      {sub && <p className="text-[#9a9080] text-xs mt-0.5">{sub}</p>}
    </div>
  );
}

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Auth check
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) redirect("/admin/login");

  const service = createServiceClient();

  // Verify admin role
  const { data: role } = await service
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("store_id", STORE_ID)
    .eq("is_active", true)
    .in("role", ["admin", "super_admin"])
    .maybeSingle();

  if (!role) redirect("/admin");

  // Fetch contact
  const { data: contact, error } = await service
    .from("contacts")
    .select("*")
    .eq("id", id)
    .eq("store_id", STORE_ID)
    .single();

  if (error || !contact) redirect("/admin/contacts");

  // Fetch subscription plans for dropdown
  const { data: plans } = await service
    .from("subscription_plans")
    .select("id, name, price_weekly, price_monthly")
    .eq("store_id", STORE_ID)
    .eq("is_active", true)
    .order("name");

  const formatDate = (d: string | null | undefined) =>
    d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

  const formatCurrency = (v: number | null | undefined) =>
    v !== null && v !== undefined
      ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(v)
      : "—";

  return (
    <div className="space-y-8">
      {/* ── Header ── */}
      <div>
        <Link
          href="/admin/contacts"
          className="flex items-center gap-1 text-sm text-[#7a7060] hover:text-[#4a5e3a] mb-3 transition-colors w-fit"
        >
          <ChevronLeft size={16} /> Back to Contacts
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="w-14 h-14 rounded-2xl bg-[#e9f0e4] border border-[#3d6b2a]/15 flex items-center justify-center shrink-0">
              <span className="text-[#3d6b2a] text-xl font-bold">
                {(contact.first_name?.[0] || "?").toUpperCase()}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-3xl font-bold text-[#1e2d18]">
                  {contact.first_name} {contact.last_name}
                </h1>
                <ContactTypeBadge type={contact.contact_type} />
                {contact.lead_score !== null && contact.lead_score !== undefined && (
                  <span className="flex items-center gap-1 text-amber-700 text-sm font-semibold">
                    <Star size={14} fill="currentColor" /> {contact.lead_score}
                  </span>
                )}
              </div>
              <p className="text-[#7a7060] text-sm mt-1">
                {contact.email || "No email"} {contact.phone ? `· ${contact.phone}` : ""}
              </p>
              <p className="text-[#9a9080] text-xs mt-0.5">
                Contact since {formatDate(contact.created_at)}
                {contact.source ? ` · via ${contact.source}` : ""}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Order & Loyalty Stats (read-only) ── */}
      <div className="bg-white border border-[#ddd8cc] rounded-2xl overflow-hidden">
        <div className="px-6 py-4 flex items-center gap-3 border-b border-[#ddd8cc]">
          <div className="p-2 rounded-lg bg-[#e9f0e4]">
            <ShoppingBag size={18} className="text-[#3d6b2a]" />
          </div>
          <div>
            <h3 className="text-[#1e2d18] font-semibold">Order & Loyalty Stats</h3>
            <p className="text-[#9a9080] text-xs">Read-only — updated automatically</p>
          </div>
        </div>
        <div className="p-6 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-4">
          <StatCard label="Total Orders" value={contact.total_orders ?? 0} />
          <StatCard
            label="Total Spent"
            value={formatCurrency(contact.total_spent)}
          />
          <StatCard
            label="Last Order"
            value={formatDate(contact.last_order_date)}
          />
          <StatCard
            label="Customer Level"
            value={contact.customer_level ?? "—"}
          />
          <StatCard
            label="Lifetime Points"
            value={contact.lifetime_points ?? 0}
          />
          <StatCard
            label="Current Points"
            value={contact.current_points ?? 0}
          />
          <StatCard
            label="Meals Donated"
            value={contact.meals_donated ?? 0}
          />
          <StatCard
            label="Referrals Made"
            value={contact.referrals_made ?? 0}
          />
          <StatCard
            label="Events Attended"
            value={contact.events_attended ?? 0}
          />
          {contact.has_active_subscription !== null && (
            <StatCard
              label="Active Subscription"
              value={contact.has_active_subscription ? "Yes" : "No"}
            />
          )}
        </div>
      </div>

      {/* ── Editable Sections via ContactEditor ── */}
      <ContactEditor
        contact={{
          id: contact.id,
          // Personal Info
          first_name: contact.first_name,
          last_name: contact.last_name ?? null,
          email: contact.email ?? null,
          phone: contact.phone ?? null,
          birthday: contact.birthday ?? null,
          address_line1: contact.address_line1 ?? null,
          address_line2: contact.address_line2 ?? null,
          city: contact.city ?? null,
          state: contact.state ?? null,
          zip_code: contact.zip_code ?? null,
          // Subscription & Meal Preferences
          subscription_status: contact.subscription_status ?? null,
          subscription_plan_id: contact.subscription_plan_id ?? null,
          subscription_meal_size: contact.subscription_meal_size ?? null,
          subscription_cuisines: (contact.subscription_cuisines as string[] | null) ?? null,
          dietary_preferences: (contact.dietary_preferences as string[] | null) ?? null,
          allergens: (contact.allergens as string[] | null) ?? null,
          // Communication & Preferences
          is_newsletter_subscribed: contact.is_newsletter_subscribed ?? false,
          preferred_delivery_day: contact.preferred_delivery_day ?? null,
          preferred_delivery_time: contact.preferred_delivery_time ?? null,
          auto_order_enabled: contact.auto_order_enabled ?? false,
          quick_purchase_enabled: contact.quick_purchase_enabled ?? false,
          notes: contact.notes ?? null,
          // Tags & Classification
          contact_type: contact.contact_type ?? null,
          tags: (contact.tags as string[] | null) ?? null,
          lead_score: contact.lead_score ?? null,
          food_personality_type: contact.food_personality_type ?? null,
          source: contact.source ?? null,
        }}
        plans={(plans || []).map((p) => ({
          id: p.id,
          name: p.name,
          price_weekly: p.price_weekly,
          price_monthly: p.price_monthly,
        }))}
      />

      {/* ── Stripe & System Info ── */}
      {(contact.stripe_customer_id || contact.user_id) && (
        <div className="bg-white border border-[#ddd8cc] rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-[#e9f0e4]">
              <Package size={18} className="text-[#3d6b2a]" />
            </div>
            <h3 className="text-[#1e2d18] font-semibold">System References</h3>
          </div>
          <div className="space-y-2 text-sm">
            {contact.stripe_customer_id && (
              <div className="flex items-center gap-2">
                <span className="text-[#7a7060] w-36 shrink-0">Stripe Customer</span>
                <code className="bg-[#f2efe8] border border-[#ddd8cc] px-2 py-1 rounded text-xs font-mono text-[#4a5e3a]">
                  {contact.stripe_customer_id}
                </code>
              </div>
            )}
            {contact.user_id && (
              <div className="flex items-center gap-2">
                <span className="text-[#7a7060] w-36 shrink-0">Auth User ID</span>
                <code className="bg-[#f2efe8] border border-[#ddd8cc] px-2 py-1 rounded text-xs font-mono text-[#4a5e3a]">
                  {contact.user_id}
                </code>
              </div>
            )}
            <div className="flex items-center gap-2 pt-1">
              <span className="text-[#7a7060] w-36 shrink-0">Last Updated</span>
              <span className="text-[#4a5e3a] text-xs">{formatDate(contact.updated_at)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
