import { createServiceClient } from "@/lib/supabase/server";
import { Recipe } from "@/types/database";
import MenuClient from "@/components/menu/MenuClient";

export const metadata = {
  title: "Menu | Mad Fresh Kitchen",
  description: "Browse our chef-crafted protein bowls with customizable options.",
};

export const dynamic = "force-dynamic";

async function getRecipes(): Promise<Recipe[]> {
  try {
    // Use service client for public menu — no auth needed, bypasses cookie issues in Next.js 16
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from("recipes")
      .select("*")
      .eq("is_available", true)
      .eq("is_visible", true)
      .order("is_featured", { ascending: false })
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("Error fetching recipes:", error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error("Failed to fetch recipes:", err);
    return [];
  }
}

export default async function MenuPage() {
  const recipes = await getRecipes();

  return <MenuClient recipes={recipes} />;
}
