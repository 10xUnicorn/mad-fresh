import { createServiceClient } from "@/lib/supabase/server";
import { FileText } from "lucide-react";
import SOPListManager from "@/components/admin/SOPListManager";

export const metadata = { title: "SOPs | Mad Fresh Kitchen" };

export default async function SOPsPage() {
  const service = createServiceClient();
  const STORE_ID = "b0000000-0000-0000-0000-000000000001";

  const [catsRes, sopsRes] = await Promise.all([
    service
      .from("sop_categories")
      .select("*")
      .eq("store_id", STORE_ID)
      .eq("is_active", true)
      .order("sort_order"),
    service
      .from("sops")
      .select(`
        id, title, slug, description, status, version, visible_to_roles,
        time_percent, assigned_to, created_at, updated_at, published_at,
        category_id,
        sop_categories(id, name, slug, icon, color),
        sop_steps(id)
      `)
      .eq("store_id", STORE_ID)
      .neq("status", "archived")
      .order("updated_at", { ascending: false }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1e2d18] flex items-center gap-2">
            <FileText size={24} className="text-[#3d6b2a]" />
            Standard Operating Procedures
          </h1>
          <p className="text-sm text-[#7a7060] mt-1">
            Documented processes for every area of operations
          </p>
        </div>
      </div>

      <SOPListManager
        initialCategories={(catsRes.data || []) as any}
        initialSOPs={(sopsRes.data || []) as any}
      />
    </div>
  );
}
