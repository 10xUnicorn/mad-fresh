import { createServiceClient } from "@/lib/supabase/server";
import SOPTaskManager from "@/components/admin/SOPTaskManager";

export const metadata = { title: "Tasks | Mad Fresh Kitchen" };

const STORE_ID = "b0000000-0000-0000-0000-000000000001";

export default async function TasksPage() {
  const service = createServiceClient();

  // Get team members
  const { data: roles } = await service
    .from("user_roles")
    .select("user_id, role")
    .eq("store_id", STORE_ID)
    .eq("is_active", true);

  // Get user profiles for team members
  const userIds = (roles || []).map(r => r.user_id);
  let teamMembers: { id: string; name: string; role: string }[] = [];

  if (userIds.length > 0) {
    const { data: profiles } = await service
      .from("user_profiles")
      .select("id, first_name, last_name, display_name, email")
      .in("id", userIds);

    teamMembers = (roles || []).map(r => {
      const profile = (profiles || []).find((p: any) => p.id === r.user_id) as any;
      const name = profile
        ? profile.display_name || `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || profile.email || "Unknown"
        : "Unknown";
      return { id: r.user_id, name, role: r.role };
    });
  }

  // Get SOPs for the dropdown
  const { data: sopsData } = await service
    .from("sops")
    .select("id, title, sop_steps(id)")
    .eq("store_id", STORE_ID)
    .eq("status", "published")
    .order("title");

  const sops = (sopsData || []).map((s: any) => ({
    id: s.id,
    title: s.title,
    stepCount: s.sop_steps?.length || 0,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1e2d18] flex items-center gap-2">
          📋 Task Management
        </h1>
        <p className="text-sm text-[#7a7060] mt-1">
          Generate, assign, and track tasks from your SOPs
        </p>
      </div>

      <SOPTaskManager teamMembers={teamMembers} sops={sops} />
    </div>
  );
}
