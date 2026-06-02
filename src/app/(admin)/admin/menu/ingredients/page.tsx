import { createClient } from "@/lib/supabase/server";
import { Package, AlertTriangle, DollarSign, Thermometer, Apple } from "lucide-react";
import IngredientsManager from "@/components/admin/IngredientsManager";

export default async function IngredientsPage() {
  const supabase = await createClient();
  const STORE_ID = "b0000000-0000-0000-0000-000000000001";

  let items: any[] = [];
  let inv: any[] = [];
  let vendorsList: any[] = [];

  try {
    const [{ data: ingredients }, { data: inventory }, { data: vendors }] = await Promise.all([
      supabase.from("ingredients").select("*").eq("store_id", STORE_ID).order("category").order("name"),
      supabase.from("inventory").select("*").eq("store_id", STORE_ID),
      supabase.from("vendors").select("id, name").eq("store_id", STORE_ID),
    ]);
    items = (ingredients as any[]) || [];
    inv = (inventory as any[]) || [];
    vendorsList = (vendors as any[]) || [];
  } catch (err) {
    console.error("Error loading ingredients data:", err);
  }

  const invMap = new Map(inv.map((i) => [i.ingredient_id, i]));
  const totalValue = items.reduce((s, i) => s + (i.cost_per_unit || 0) * (i.par_level || 0), 0);
  const available = items.filter((i) => i.is_available).length;
  const unavailable = items.length - available;
  const fmt = (v: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(v);

  const categoryMap: Record<string, number> = {};
  items.forEach((i) => { categoryMap[i.category] = (categoryMap[i.category] || 0) + 1; });

  const storageMap: Record<string, number> = {};
  items.forEach((i) => { storageMap[i.storage_type || "unknown"] = (storageMap[i.storage_type || "unknown"] || 0) + 1; });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-[#1e2d18] mb-2 flex items-center gap-3">
          <Apple size={32} className="text-[#3d6b2a]" />
          Ingredients
        </h1>
        <p className="text-[#7a7060]">Manage ingredients, stock levels, and suppliers</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Package, label: "Total Ingredients", value: items.length },
          { icon: Package, label: "Available", value: available },
          { icon: AlertTriangle, label: "Unavailable", value: unavailable },
          { icon: DollarSign, label: "Inventory Value", value: fmt(totalValue) },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-gray-200 shadow-sm rounded-2xl p-5">
            <div className="p-2.5 rounded-xl bg-[#E8F5E3] w-fit mb-3">
              <s.icon size={20} className="text-[#3d6b2a]" />
            </div>
            <p className="text-[#9a9080] text-sm mb-1">{s.label}</p>
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
          </div>
        ))}
      </div>

      {/* By Category */}
      <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">By Category</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
          {Object.entries(categoryMap).sort((a, b) => b[1] - a[1]).map(([cat, count]) => (
            <div key={cat} className="bg-gray-50 rounded-xl p-4 border border-gray-200 text-center">
              <p className="text-2xl font-bold text-[#3d6b2a]">{count}</p>
              <p className="text-[#9a9080] text-xs capitalize mt-1">{cat}</p>
            </div>
          ))}
        </div>
      </div>

      {/* By Storage */}
      <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Thermometer size={20} className="text-[#3d6b2a]" /> Storage Breakdown
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Object.entries(storageMap).map(([type, count]) => (
            <div key={type} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <p className="text-gray-900 font-semibold">{count}</p>
              <p className="text-[#9a9080] text-xs capitalize">{type.replace(/_/g, " ")}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Ingredients Manager */}
      <IngredientsManager ingredients={items} vendors={vendorsList} />
    </div>
  );
}
