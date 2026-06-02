import { createClient } from "@/lib/supabase/server";
import { Settings, CreditCard, Bell, ChevronRight } from "lucide-react";
import Link from "next/link";
import SettingsEditor from "@/components/admin/SettingsEditor";

export default async function SettingsPage() {
  const supabase = await createClient();
  const STORE_ID = "b0000000-0000-0000-0000-000000000001";

  // Fetch store data first, then organization
  const { data: store, error: storeError } = await supabase
    .from("stores")
    .select("*")
    .eq("id", STORE_ID)
    .single();

  const { data: organization, error: orgError } = store?.organization_id
    ? await supabase.from("organizations").select("*").eq("id", store.organization_id).single()
    : { data: null, error: null };

  if (storeError) console.error("Error fetching store:", storeError);
  if (orgError) console.error("Error fetching organization:", orgError);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#1e2d18] mb-2 flex items-center gap-3">
          <Settings size={32} className="text-[#3d6b2a]" />
          Settings
        </h1>
        <p className="text-[#7a7060]">Manage your store configuration and operations</p>
      </div>

      {/* Settings Links */}
      <div className="space-y-3">
        <Link href="/admin/settings/payments" className="block">
          <div className="bg-white border border-[#ddd8cc] rounded-2xl p-6 hover:border-[#3d6b2a]/30 hover:bg-[#f0ece3] transition-all group">
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-[#e9f0e4]">
                  <CreditCard size={20} className="text-[#3d6b2a]" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[#1e2d18]">Payment Settings</h3>
                  <p className="text-sm text-[#9a9080]">Configure Stripe keys, tax rates, delivery fees, and payment options</p>
                </div>
              </div>
              <ChevronRight size={20} className="text-[#9a9080] group-hover:text-[#3d6b2a] transition" />
            </div>
          </div>
        </Link>

        <Link href="/admin/settings/notifications" className="block">
          <div className="bg-white border border-[#ddd8cc] rounded-2xl p-6 hover:border-[#3d6b2a]/30 hover:bg-[#f0ece3] transition-all group">
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-[#e9f0e4]">
                  <Bell size={20} className="text-[#3d6b2a]" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[#1e2d18]">Notification Settings</h3>
                  <p className="text-sm text-[#9a9080]">Manage BCC recipients, email categories, and notification routing</p>
                </div>
              </div>
              <ChevronRight size={20} className="text-[#9a9080] group-hover:text-[#3d6b2a] transition" />
            </div>
          </div>
        </Link>
      </div>

      {/* Editable Settings Sections */}
      <SettingsEditor
        store={store ? {
          id: store.id,
          name: store.name,
          phone: store.phone,
          email: store.email,
          address_line1: store.address_line1,
          address_line2: store.address_line2,
          city: store.city,
          state: store.state,
          zip_code: store.zip_code,
          country: store.country,
          operating_hours: store.operating_hours,
          delivery_enabled: store.delivery_enabled,
          pickup_enabled: store.pickup_enabled,
          delivery_radius_miles: store.delivery_radius_miles,
          delivery_fee: store.delivery_fee,
          free_delivery_minimum: store.free_delivery_minimum,
          delivery_days: store.delivery_days,
          tax_rate: store.tax_rate,
        } : null}
        org={organization ? {
          id: organization.id,
          name: organization.name,
          timezone: organization.timezone,
          currency: organization.currency,
          subscription_plan: organization.subscription_plan,
          subscription_status: organization.subscription_status,
          support_email: organization.support_email,
          support_phone: organization.support_phone,
        } : null}
      />
    </div>
  );
}
