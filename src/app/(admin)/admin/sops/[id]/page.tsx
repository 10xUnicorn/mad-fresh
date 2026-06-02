import SOPEditor from "@/components/admin/SOPEditor";
import { createServiceClient } from "@/lib/supabase/server";

export const metadata = { title: "Edit SOP | Mad Fresh Kitchen" };

const STORE_ID = "b0000000-0000-0000-0000-000000000001";

export default async function SOPEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const service = createServiceClient();

  const [sopRes, catsRes, rolesRes] = await Promise.all([
    service
      .from("sops")
      .select(`
        *,
        sop_categories(id, name, slug, icon, color),
        sop_steps(*, sop_resources(*))
      `)
      .eq("id", id)
      .single(),
    service
      .from("sop_categories")
      .select("*")
      .eq("store_id", STORE_ID)
      .eq("is_active", true)
      .order("sort_order"),
    service
      .from("user_roles")
      .select("user_id, role")
      .eq("store_id", STORE_ID)
      .eq("is_active", true),
  ]);

  if (!sopRes.data) {
    return (
      <div className="text-center py-20">
        <p className="text-[#9a9080] text-lg">SOP not found</p>
      </div>
    );
  }

  // Sort steps
  const sop = sopRes.data;
  if (sop.sop_steps) {
    sop.sop_steps.sort((a: any, b: any) => a.step_number - b.step_number);
  }

  // Get team member profiles
  const userIds = (rolesRes.data || []).map((r: any) => r.user_id);
  let teamMembers: { id: string; name: string; role: string }[] = [];

  if (userIds.length > 0) {
    const { data: profiles } = await service
      .from("user_profiles")
      .select("id, first_name, last_name, display_name, email")
      .in("id", userIds);

    teamMembers = (rolesRes.data || []).map((r: any) => {
      const profile = (profiles || []).find((p: any) => p.id === r.user_id) as any;
      const name = profile
        ? profile.display_name || `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || profile.email || "Unknown"
        : "Unknown";
      return { id: r.user_id, name, role: r.role };
    });
  }

  return (
    <SOPEditor
      sop={sop as any}
      categories={(catsRes.data || []) as any}
      teamMembers={teamMembers}
    />
  );
}
