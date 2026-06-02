"use client";

import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";

interface CartItem {
  recipe_id: string;
  name: string;
  price: number;
  quantity: number;
  fulfillment_type: string;
}

export default function ReorderButton({ items }: { items: CartItem[] }) {
  const router = useRouter();

  const handleReorder = () => {
    // Set cart in localStorage with items from this order
    const cartItems = items.map((item) => ({
      recipe_id: item.recipe_id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      fulfillment_type: item.fulfillment_type || "pickup",
    }));

    localStorage.setItem("cart", JSON.stringify(cartItems));
    window.dispatchEvent(new Event("cart-updated"));
    router.push("/cart");
  };

  return (
    <button
      onClick={handleReorder}
      className="flex items-center gap-2 px-4 py-2 bg-[#f2efe8] border border-[#ddd8cc] text-[#1e2d18] font-semibold rounded-lg text-sm hover:bg-[#e9f0e4] hover:border-[#3d6b2a]/30 transition"
    >
      <RefreshCw size={16} />
      Reorder
    </button>
  );
}
