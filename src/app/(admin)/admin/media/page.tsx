import { createClient } from "@/lib/supabase/server";
import MediaLibrary from "@/components/admin/MediaLibrary";
import { Image as ImageIcon } from "lucide-react";

const STORE_ID = "b0000000-0000-0000-0000-000000000001";

export default async function MediaPage() {
  const supabase = await createClient();

  // Fetch media folders and assets in parallel
  const [{ data: folders }, { data: assets }, { count: assetCount }] =
    await Promise.all([
      supabase
        .from("media_folders")
        .select("*")
        .eq("store_id", STORE_ID)
        .order("sort_order", { ascending: true }),
      supabase
        .from("media_assets")
        .select("*")
        .eq("store_id", STORE_ID)
        .order("created_at", { ascending: false })
        .limit(100),
      supabase
        .from("media_assets")
        .select("*", { count: "exact", head: true })
        .eq("store_id", STORE_ID),
    ]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-[#e9f0e4]">
            <ImageIcon size={28} className="text-[#3d6b2a]" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-[#1e2d18]">Media Library</h1>
            <p className="text-[#7a7060] mt-1">Manage your images and media assets</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <p className="text-[#9a9080] text-sm font-medium mb-1">Total Assets</p>
          <p className="text-3xl font-bold text-gray-900">{assetCount || 0}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <p className="text-[#9a9080] text-sm font-medium mb-1">Folders</p>
          <p className="text-3xl font-bold text-gray-900">{folders?.length || 0}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <p className="text-[#9a9080] text-sm font-medium mb-1">Storage Used</p>
          <p className="text-3xl font-bold text-gray-900">—</p>
        </div>
      </div>

      {/* Media Library Component */}
      <MediaLibrary
        initialFolders={folders || []}
        initialAssets={assets || []}
        storeId={STORE_ID}
      />
    </div>
  );
}
