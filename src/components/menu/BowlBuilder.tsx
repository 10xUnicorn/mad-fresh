"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  X, ChevronLeft, ChevronRight, Check, Star,
  Plus, Minus, Loader, ShoppingBag, Info
} from "lucide-react";
import { BowlCustomizationCategory, BowlCustomizationItem, Ingredient } from "@/types/database";

interface ItemWithStock extends BowlCustomizationItem {
  ingredient?: Ingredient;
  out_of_stock?: boolean;
}

interface CategoryWithItems extends BowlCustomizationCategory {
  items: ItemWithStock[];
}

interface BowlSelection {
  ingredient_id: string;
  name: string;
  upcharge: number;
  category_slug: string;
}

interface BowlBuilderProps {
  basePrice: number;
  onAddToCart: (selections: BowlSelection[], totalUpcharge: number) => void;
  onClose: () => void;
}

export default function BowlBuilder({ basePrice, onAddToCart, onClose }: BowlBuilderProps) {
  const supabase = createClient();
  const [categories, setCategories] = useState<CategoryWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [selections, setSelections] = useState<Map<string, Set<string>>>(new Map());
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    loadCategories();
    // Lock body scroll
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadCategories = async () => {
    try {
      const { data: cats } = await supabase
        .from("bowl_customization_categories")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");

      if (!cats || cats.length === 0) {
        setLoading(false);
        return;
      }

      // Fetch inventory stock levels for all ingredients in one query
      const { data: inventoryData } = await supabase
        .from("inventory")
        .select("ingredient_id, current_stock, status")
        .eq("store_id", "b0000000-0000-0000-0000-000000000001");

      const stockMap = new Map<string, { stock: number; status: string }>();
      (inventoryData || []).forEach((inv: Record<string, unknown>) => {
        stockMap.set(inv.ingredient_id as string, {
          stock: Number(inv.current_stock) || 0,
          status: (inv.status as string) || "in_stock",
        });
      });

      const catsWithItems: CategoryWithItems[] = [];
      for (const cat of cats) {
        const { data: items } = await supabase
          .from("bowl_customization_items")
          .select("*, ingredients(*)")
          .eq("category_id", cat.id)
          .eq("is_available", true)
          .order("sort_order");

        const mappedItems: ItemWithStock[] = (items || []).map((item: Record<string, unknown>) => {
          const ingredient = item.ingredients as Record<string, unknown> | null;
          const ingredientId = item.ingredient_id as string;
          const inv = stockMap.get(ingredientId);

          // Item is out of stock if:
          // 1. The ingredient itself is marked unavailable, OR
          // 2. Inventory record exists and stock is 0 or status is "out_of_stock"
          const ingredientUnavailable = ingredient && ingredient.is_available === false;
          const inventoryEmpty = inv && (inv.stock <= 0 || inv.status === "out_of_stock");
          const outOfStock = ingredientUnavailable || inventoryEmpty;

          return {
            ...item,
            ingredient: ingredient as unknown as Ingredient,
            out_of_stock: outOfStock ? true : false,
          } as ItemWithStock;
        });

        // Sort: available items first, out-of-stock at the bottom
        mappedItems.sort((a, b) => {
          if (a.out_of_stock && !b.out_of_stock) return 1;
          if (!a.out_of_stock && b.out_of_stock) return -1;
          return (a.sort_order || 0) - (b.sort_order || 0);
        });

        catsWithItems.push({ ...cat, items: mappedItems });
      }

      setCategories(catsWithItems);

      // Pre-select defaults
      const defaultSelections = new Map<string, Set<string>>();
      catsWithItems.forEach(cat => {
        const defaults = cat.items
          .filter(i => i.is_default)
          .map(i => i.ingredient_id);
        if (defaults.length > 0) {
          defaultSelections.set(cat.id, new Set(defaults));
        }
      });
      setSelections(defaultSelections);
    } catch (err) {
      console.error("Error loading bowl categories:", err);
    } finally {
      setLoading(false);
    }
  };

  const currentCategory = categories[currentStep];
  const isLastStep = currentStep === categories.length - 1;
  const isFirstStep = currentStep === 0;

  // Toggle ingredient selection
  const toggleIngredient = (categoryId: string, ingredientId: string) => {
    const cat = categories.find(c => c.id === categoryId);
    if (!cat) return;

    // Prevent selecting out-of-stock items
    const item = cat.items.find(i => i.ingredient_id === ingredientId);
    if (item?.out_of_stock) return;

    setSelections(prev => {
      const next = new Map(prev);
      const current = new Set(next.get(categoryId) || []);

      if (current.has(ingredientId)) {
        current.delete(ingredientId);
      } else {
        // Enforce max selections
        if (cat.max_selections > 0 && current.size >= cat.max_selections) {
          if (cat.max_selections === 1) {
            // Single selection: swap to new choice
            current.clear();
            current.add(ingredientId);
          } else {
            // Multi-select at max: block addition
            return prev;
          }
        } else {
          current.add(ingredientId);
        }
      }

      next.set(categoryId, current);
      return next;
    });
  };

  // Compute total upcharge
  const totalUpcharge = useMemo(() => {
    let total = 0;
    categories.forEach(cat => {
      const selected = selections.get(cat.id);
      if (!selected) return;
      cat.items.forEach(item => {
        if (selected.has(item.ingredient_id)) {
          total += Number(item.upcharge) || 0;
        }
      });
    });
    return total;
  }, [categories, selections]);

  const totalPrice = (basePrice + totalUpcharge) * quantity;

  // Build flat selections array for cart
  const buildSelectionsArray = (): BowlSelection[] => {
    const result: BowlSelection[] = [];
    categories.forEach(cat => {
      const selected = selections.get(cat.id);
      if (!selected) return;
      cat.items.forEach(item => {
        if (selected.has(item.ingredient_id)) {
          result.push({
            ingredient_id: item.ingredient_id,
            name: item.display_name || item.ingredient?.name || "Unknown",
            upcharge: Number(item.upcharge) || 0,
            category_slug: cat.slug,
          });
        }
      });
    });
    return result;
  };

  // Validate current step
  const isCurrentStepValid = () => {
    if (!currentCategory) return true;
    if (!currentCategory.is_required) return true;
    const selected = selections.get(currentCategory.id);
    return selected ? selected.size >= currentCategory.min_selections : false;
  };

  const handleNext = () => {
    if (isLastStep) {
      // Add to cart
      onAddToCart(buildSelectionsArray(), totalUpcharge);
    } else {
      setCurrentStep(prev => Math.min(prev + 1, categories.length - 1));
    }
  };

  const handleBack = () => {
    if (isFirstStep) {
      onClose();
    } else {
      setCurrentStep(prev => Math.max(prev - 1, 0));
    }
  };

  const selectedCount = (categoryId: string) => selections.get(categoryId)?.size || 0;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center">
        <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl p-8 flex items-center justify-center min-h-[60vh]">
          <Loader className="animate-spin text-[#3d6b2a]" size={32} />
        </div>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center">
        <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl p-8 text-center">
          <p className="text-[#7a7060] mb-4">Bowl builder is not set up yet</p>
          <button onClick={onClose} className="text-[#3d6b2a] font-medium">Go Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center">
      <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[95dvh] flex flex-col animate-[mf-sheet-up_0.35s_ease-out]">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#ddd8cc]">
          <button onClick={handleBack} className="p-2 -ml-2 text-[#7a7060] hover:text-[#1e2d18] transition min-h-[44px]">
            {isFirstStep ? <X size={22} /> : <ChevronLeft size={22} />}
          </button>
          <div className="text-center">
            <h2 className="text-[#1e2d18] font-bold text-lg">Build Your Bowl</h2>
            <p className="text-[#9a9080] text-xs">Step {currentStep + 1} of {categories.length}</p>
          </div>
          <button onClick={onClose} className="p-2 -mr-2 text-[#7a7060] hover:text-[#1e2d18] transition min-h-[44px]">
            <X size={22} />
          </button>
        </div>

        {/* Step indicator dots */}
        <div className="flex items-center justify-center gap-2 py-3 px-5">
          {categories.map((cat, idx) => (
            <button
              key={cat.id}
              onClick={() => setCurrentStep(idx)}
              className={`h-2 rounded-full transition-all ${
                idx === currentStep
                  ? "w-8 bg-[#3d6b2a]"
                  : idx < currentStep
                    ? "w-2 bg-[#3d6b2a]/50"
                    : "w-2 bg-[#f0ece3]"
              }`}
            />
          ))}
        </div>

        {/* Step content */}
        <div className="flex-1 overflow-y-auto px-5 pb-4">
          <div className="mb-4">
            <h3 className="text-[#1e2d18] text-xl font-bold">{currentCategory.name}</h3>
            <p className="text-[#7a7060] text-sm mt-1">
              {currentCategory.description}
              {currentCategory.is_required && (
                <span className="text-[#3d6b2a] ml-1">
                  · Pick {currentCategory.min_selections === currentCategory.max_selections
                    ? currentCategory.min_selections
                    : `${currentCategory.min_selections}-${currentCategory.max_selections === -1 ? "any" : currentCategory.max_selections}`}
                </span>
              )}
            </p>
          </div>

          <div className="space-y-2">
            {currentCategory.items.map((item) => {
              const isSelected = selections.get(currentCategory.id)?.has(item.ingredient_id) || false;
              const upcharge = Number(item.upcharge) || 0;
              const outOfStock = item.out_of_stock || false;

              return (
                <button
                  key={item.id}
                  onClick={() => toggleIngredient(currentCategory.id, item.ingredient_id)}
                  disabled={outOfStock}
                  className={`w-full flex items-center justify-between p-4 rounded-xl transition-all min-h-[56px] ${
                    outOfStock
                      ? "bg-[#f2efe8] border-2 border-transparent opacity-50 cursor-not-allowed"
                      : isSelected
                        ? "bg-[#e9f0e4] border-2 border-[#3d6b2a]/30"
                        : "bg-[#f2efe8] border-2 border-transparent hover:bg-[#f0ece3]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Checkbox */}
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                      outOfStock
                        ? "border-[#ddd8cc] bg-[#f2efe8]"
                        : isSelected
                          ? "bg-[#3d6b2a] border-[#3d6b2a]"
                          : "border-[#ddd8cc]"
                    }`}>
                      {isSelected && !outOfStock && <Check size={14} className="text-white" />}
                    </div>

                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <span className={`font-medium text-sm ${outOfStock ? "text-[#9a9080] line-through" : "text-[#1e2d18]"}`}>
                          {item.display_name || item.ingredient?.name}
                        </span>
                        {item.is_premium && !outOfStock && (
                          <Star size={14} className="text-amber-400" fill="currentColor" />
                        )}
                        {outOfStock && (
                          <span className="text-[10px] uppercase tracking-wider font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                            Sold Out
                          </span>
                        )}
                      </div>
                      {item.ingredient && !outOfStock && (
                        <p className="text-[#9a9080] text-xs mt-0.5">
                          {item.ingredient.calories_per_unit} cal
                          {Number(item.ingredient.protein_per_unit) > 0 && ` · ${item.ingredient.protein_per_unit}g protein`}
                        </p>
                      )}
                    </div>
                  </div>

                  {upcharge > 0 && !outOfStock && (
                    <span className={`text-sm font-medium ${isSelected ? "text-[#3d6b2a]" : "text-[#7a7060]"}`}>
                      +${upcharge.toFixed(2)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-[#ddd8cc] p-5 space-y-3 safe-area-padding">
          {/* Quantity (only on last step) */}
          {isLastStep && (
            <div className="flex items-center justify-between">
              <span className="text-[#7a7060] text-sm">Quantity</span>
              <div className="flex items-center gap-3 bg-[#f2efe8] rounded-full px-1 py-1">
                <button
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-[#f2efe8] text-[#1e2d18] hover:bg-[#f0ece3] transition"
                >
                  <Minus size={16} />
                </button>
                <span className="text-[#1e2d18] font-bold w-6 text-center tabular-nums">{quantity}</span>
                <button
                  onClick={() => setQuantity(q => q + 1)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-[#f2efe8] text-[#1e2d18] hover:bg-[#f0ece3] transition"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Price summary */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-[#7a7060]">
              Bowl ${basePrice.toFixed(2)}
              {totalUpcharge > 0 && ` + $${totalUpcharge.toFixed(2)} extras`}
            </span>
            <span className="text-[#1e2d18] font-bold text-lg tabular-nums">
              ${totalPrice.toFixed(2)}
            </span>
          </div>

          {/* Action button */}
          <button
            onClick={handleNext}
            disabled={!isCurrentStepValid()}
            className={`w-full py-3.5 rounded-xl font-bold text-base transition-all flex items-center justify-center gap-2 min-h-[48px] ${
              isCurrentStepValid()
                ? "bg-[#3d6b2a] text-white hover:bg-[#2f5720] active:scale-[0.98]"
                : "bg-[#f2efe8] text-[#9a9080] cursor-not-allowed"
            }`}
          >
            {isLastStep ? (
              <>
                <ShoppingBag size={18} />
                Add to Bag · ${totalPrice.toFixed(2)}
              </>
            ) : (
              <>
                Next: {categories[currentStep + 1]?.name}
                <ChevronRight size={18} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
