import { createClient, createServiceClient } from "@/lib/supabase/server";
import { Users, Shield } from "lucide-react";
import TeamManager from "@/components/admin/TeamManager";

export default async function TeamPage() {
  const supabase = await createClient();
  const service = createServiceClient();
  const STORE_ID = "b0000000-0000-0000-0000-000000000001";

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch team members using service client (bypasses RLS for full team view)
  const { data: roleAssignments, error: rolesError } = await service
    .from("user_roles")
    .select(
      `
      id,
      user_id,
      role,
      is_active,
      permissions,
      invited_at,
      accepted_at,
      invite_email,
      user_profiles(id, email, first_name, last_name, phone)
      `
    )
    .eq("store_id", STORE_ID)
    .eq("is_active", true);

  if (rolesError) {
    console.error("Error fetching team members:", rolesError);
  }

  // Normalize: ensure user_profiles fallback from invite_email
  const teamMembers = ((roleAssignments as any[]) || []).map((m: any) => ({
    ...m,
    user_profiles: m.user_profiles || {
      id: m.user_id,
      email: m.invite_email || "Unknown",
      first_name: null,
      last_name: null,
      phone: null,
    },
  }));
  const totalTeamMembers = teamMembers.length;
  const adminCount = teamMembers.filter(
    (m: any) => m.role === "admin" || m.role === "super_admin"
  ).length;
  const staffCount = teamMembers.filter(
    (m: any) => m.role === "staff" || m.role === "manager" || m.role === "driver"
  ).length;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#1e2d18] mb-1 flex items-center gap-3">
          <Users size={32} className="text-[#3d6b2a]" />
          Team Members
        </h1>
        <p className="text-[#7a7060]">{totalTeamMembers} team members</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex items-center gap-4 bg-white border border-[#ddd8cc] rounded-xl p-4">
          <div className="p-3 rounded-lg bg-[#e9f0e4]">
            <Users size={20} className="text-[#3d6b2a]" />
          </div>
          <div>
            <p className="text-[#7a7060] text-sm">Total Team</p>
            <p className="text-2xl font-bold text-[#1e2d18]">{totalTeamMembers}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 bg-white border border-[#ddd8cc] rounded-xl p-4">
          <div className="p-3 rounded-lg bg-purple-50">
            <Shield size={20} className="text-purple-600" />
          </div>
          <div>
            <p className="text-[#7a7060] text-sm">Admins & Managers</p>
            <p className="text-2xl font-bold text-[#1e2d18]">{adminCount}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 bg-white border border-[#ddd8cc] rounded-xl p-4">
          <div className="p-3 rounded-lg bg-orange-50">
            <Users size={20} className="text-orange-600" />
          </div>
          <div>
            <p className="text-[#7a7060] text-sm">Staff & Drivers</p>
            <p className="text-2xl font-bold text-[#1e2d18]">{staffCount}</p>
          </div>
        </div>
      </div>

      {/* Team Manager (client component with Add/Edit/Search) */}
      <TeamManager
        initialMembers={teamMembers}
        currentUserId={user?.id || ""}
      />

      {/* Role Information */}
      <div className="bg-white border border-[#ddd8cc] rounded-2xl p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-[#1e2d18] mb-1">User Roles</h3>
          <p className="text-sm text-[#7a7060]">Available roles and their permissions</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { role: "Super Admin", description: "Full access to all features and settings" },
            { role: "Admin", description: "Manage team, orders, menu, and basic settings" },
            { role: "Manager", description: "View analytics, manage orders, and staff" },
            { role: "Kitchen Staff", description: "Prepare orders, view menu items" },
            { role: "Driver", description: "View and manage deliveries" },
            { role: "Customer", description: "Place orders and manage subscriptions" },
          ].map((item) => (
            <div key={item.role} className="p-4 bg-[#f2efe8] rounded-lg border border-[#ddd8cc]">
              <p className="text-[#1e2d18] font-semibold text-sm mb-1">{item.role}</p>
              <p className="text-[#9a9080] text-xs">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
