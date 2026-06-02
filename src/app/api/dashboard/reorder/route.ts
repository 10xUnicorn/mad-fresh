import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { order_id } = await req.json();
  if (!order_id) return NextResponse.json({ error: "order_id required" }, { status: 400 });

  // Verify order belongs to user
  const { data: order } = await supabase
    .from("orders")
    .select("id, customer_id")
    .eq("id", order_id)
    .single();

  if (!order || order.customer_id !== user.id) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  // Fetch order items with recipe info
  const { data: items } = await supabase
    .from("order_items")
    .select("recipe_id, quantity, unit_price, customizations, special_instructions")
    .eq("order_id", order_id);

  if (!items || items.length === 0) {
    return NextResponse.json({ error: "No items found in order" }, { status: 404 });
  }

  // Verify recipes are still active
  const recipeIds = items.map(i => i.recipe_id);
  const { data: recipes } = await supabase
    .from("recipes")
    .select("id, name, base_price, category, is_sold_out")
    .in("id", recipeIds);

  const recipeMap = new Map((recipes || []).map(r => [r.id, r]));

  const cartItems = items
    .filter(item => {
      const recipe = recipeMap.get(item.recipe_id);
      return recipe && !recipe.is_sold_out;
    })
    .map(item => {
      const recipe = recipeMap.get(item.recipe_id)!;
      return {
        recipe_id: item.recipe_id,
        name: recipe.name,
        price: Number(recipe.base_price),
        quantity: item.quantity,
        fulfillment_type: "pickup" as const,
        category: recipe.category,
      };
    });

  return NextResponse.json({ cart: cartItems });
}
