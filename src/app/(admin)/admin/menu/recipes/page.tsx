import { createClient } from "@/lib/supabase/server";
import RecipeCard from "@/components/admin/RecipeCard";
import { Plus, Filter } from "lucide-react";
import { Suspense } from "react";
import Link from "next/link";

async function RecipesContent({ category }: { category?: string }) {
  const supabase = await createClient();
  const STORE_ID = "b0000000-0000-0000-0000-000000000001";

  let query = supabase
    .from("recipes")
    .select("*")
    .eq("store_id", STORE_ID)
    .order("name", { ascending: true });

  if (category && category !== "all") {
    query = query.eq("category", category);
  }

  const { data: recipes, error } = await query;

  if (error) {
    console.error("Error fetching recipes:", error);
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
        Failed to load recipes. Please try again.
      </div>
    );
  }

  if (!recipes || recipes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mb-4">
          <svg
            className="w-8 h-8 text-[#9a9080]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 6v6m0 0v6m0-6h6m0 0h6m0-6h6m0 0h6"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-[#1e2d18] mb-2">No recipes found</h3>
        <p className="text-[#7a7060] mb-4">
          {category && category !== "all"
            ? `No recipes in the ${category} category`
            : "Start by adding your first recipe"}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {recipes.map((recipe) => (
        <RecipeCard key={recipe.id} recipe={recipe} />
      ))}
    </div>
  );
}

export default function RecipesPage({
  searchParams,
}: {
  searchParams: { category?: string };
}) {
  const category = searchParams.category;

  const categories = [
    { value: "bowl", label: "Bowls" },
    { value: "wrap", label: "Wraps" },
    { value: "salad", label: "Salads" },
    { value: "side", label: "Sides" },
    { value: "drink", label: "Drinks" },
    { value: "dessert", label: "Desserts" },
    { value: "snack", label: "Snacks" },
    { value: "custom", label: "Custom" },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#1e2d18] mb-1">Recipes</h1>
          <p className="text-[#7a7060]">Manage your menu recipes</p>
        </div>
        <Link href="/admin/menu/recipes/new" className="flex items-center gap-2 px-4 py-2.5 bg-[#3d6b2a] hover:bg-[#2f5720] text-white rounded-xl font-medium transition-colors">
          <Plus size={20} />
          Add Recipe
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-3">
        <Filter size={20} className="text-[#9a9080]" />
        <div className="flex gap-2 overflow-x-auto pb-2">
          <a
            href="/admin/menu/recipes?category=all"
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
              (category || "all") === "all"
                ? "bg-[#3d6b2a] text-white"
                : "bg-white text-[#9a9080] hover:text-[#1e2d18] border border-[#ddd8cc]"
            }`}
          >
            All Categories
          </a>
          {categories.map((cat) => (
            <a
              key={cat.value}
              href={`/admin/menu/recipes?category=${cat.value}`}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                category === cat.value
                  ? "bg-[#3d6b2a] text-white"
                  : "bg-white text-[#9a9080] hover:text-[#1e2d18] border border-[#ddd8cc]"
              }`}
            >
              {cat.label}
            </a>
          ))}
        </div>
      </div>

      {/* Recipes Grid */}
      <Suspense fallback={<div className="text-[#7a7060]">Loading recipes...</div>}>
        <RecipesContent category={category} />
      </Suspense>
    </div>
  );
}
