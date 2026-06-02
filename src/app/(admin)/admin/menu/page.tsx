import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ChefHat, Apple, Star, TrendingUp, Salad } from "lucide-react";

export default async function MenuPage() {
  const supabase = await createClient();
  const STORE_ID = "b0000000-0000-0000-0000-000000000001";

  const [{ count: recipeCount }, { count: ingredientCount }, { data: featured }, { data: recipes }] =
    await Promise.all([
      supabase.from("recipes").select("*", { count: "exact", head: true }).eq("store_id", STORE_ID),
      supabase.from("ingredients").select("*", { count: "exact", head: true }).eq("store_id", STORE_ID),
      supabase.from("recipes").select("*", { count: "exact", head: true }).eq("store_id", STORE_ID).eq("is_featured", true),
      supabase.from("recipes").select("base_price, cost_to_make").eq("store_id", STORE_ID),
    ]);

  const avgMargin =
    recipes && recipes.length > 0
      ? (recipes.reduce((sum: number, r: any) => sum + ((r.base_price - r.cost_to_make) / r.base_price) * 100, 0) / recipes.length).toFixed(0)
      : "0";

  const stats = [
    { icon: ChefHat, label: "Total Recipes", value: recipeCount ?? 0, href: "/admin/menu/recipes" },
    { icon: Apple, label: "Ingredients", value: ingredientCount ?? 0, href: "/admin/menu/ingredients" },
    { icon: Star, label: "Featured Items", value: featured?.length ?? 0, href: "/admin/menu/recipes" },
    { icon: TrendingUp, label: "Avg Profit Margin", value: `${avgMargin}%`, href: "/admin/menu/recipes" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-[#1e2d18] mb-2">Menu Management</h1>
        <p className="text-[#7a7060]">Manage your recipes, ingredients, and menu offerings</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="bg-white border border-gray-200 rounded-2xl p-6 hover:border-[#3d6b2a]/30 transition-colors group"
          >
            <div className="p-3 rounded-xl bg-[#E8F5E3] w-fit mb-4 group-hover:bg-green-50 transition-colors">
              <s.icon size={24} className="text-[#3d6b2a]" />
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">{s.value}</p>
            <p className="text-[#9a9080] text-sm">{s.label}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          href="/admin/menu/recipes"
          className="bg-white border border-gray-200 rounded-2xl p-8 hover:border-[#3d6b2a]/30 transition-colors group"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-xl bg-[#E8F5E3]">
              <ChefHat size={28} className="text-[#3d6b2a]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Recipes</h2>
              <p className="text-[#9a9080] text-sm">Manage bowls, wraps, salads, and more</p>
            </div>
          </div>
          <p className="text-[#9a9080] text-sm">
            Add, edit, and organize your menu items. Set pricing, nutrition info, dietary flags, and availability.
          </p>
        </Link>

        <Link
          href="/admin/menu/ingredients"
          className="bg-white border border-gray-200 rounded-2xl p-8 hover:border-[#3d6b2a]/30 transition-colors group"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-xl bg-[#E8F5E3]">
              <Apple size={28} className="text-[#3d6b2a]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Ingredients</h2>
              <p className="text-[#9a9080] text-sm">Track proteins, grains, veggies, sauces</p>
            </div>
          </div>
          <p className="text-[#9a9080] text-sm">
            Manage ingredient costs, nutrition data, allergens, suppliers, and stock levels.
          </p>
        </Link>

        <Link
          href="/admin/menu/bowl-builder"
          className="bg-white border border-gray-200 rounded-2xl p-8 hover:border-[#3d6b2a]/30 transition-colors group"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-xl bg-[#E8F5E3]">
              <Salad size={28} className="text-[#3d6b2a]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Bowl Builder</h2>
              <p className="text-[#9a9080] text-sm">Build Your Own Bowl setup</p>
            </div>
          </div>
          <p className="text-[#9a9080] text-sm">
            Configure customization steps, assign ingredients, set upcharges, and manage the BYOB flow.
          </p>
        </Link>
      </div>
    </div>
  );
}
