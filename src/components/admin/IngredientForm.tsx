"use client";

import { useState, useRef } from "react";
import { Ingredient } from "@/types/database";
import { X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface IngredientFormProps {
  ingredient?: Ingredient;
  onSuccess?: () => void;
  children: React.ReactNode;
}

const CATEGORIES = ["protein", "grain", "vegetable", "sauce", "topping", "side", "addon"];
const UNIT_TYPES = ["g", "ml", "oz", "cup", "tbsp", "tsp", "piece"];

export default function IngredientForm({ ingredient, onSuccess, children }: IngredientFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData(e.currentTarget);
      const storeId = "b0000000-0000-0000-0000-000000000001";

      const ingredientData = {
        store_id: storeId,
        name: formData.get("name") as string,
        category: formData.get("category") as string,
        cost_per_unit: parseFloat(formData.get("cost_per_unit") as string),
        unit_type: formData.get("unit_type") as string,
        calories_per_unit: formData.get("calories_per_unit")
          ? parseInt(formData.get("calories_per_unit") as string)
          : 0,
        protein_per_unit: parseFloat(formData.get("protein_per_unit") as string) || 0,
        carbs_per_unit: parseFloat(formData.get("carbs_per_unit") as string) || 0,
        fat_per_unit: parseFloat(formData.get("fat_per_unit") as string) || 0,
        is_organic: formData.get("is_organic") === "on",
        is_gluten_free: formData.get("is_gluten_free") === "on",
        is_vegan: formData.get("is_vegan") === "on",
        is_vegetarian: formData.get("is_vegetarian") === "on",
        supplier: formData.get("supplier") as string || null,
        par_level: formData.get("par_level")
          ? parseInt(formData.get("par_level") as string)
          : 0,
        storage_type: formData.get("storage_type") as string || "dry",
        is_available: formData.get("is_available") === "on",
        allergens: (formData.get("allergens") as string)?.split(",").filter((a) => a.trim()) || [],
      };

      if (ingredient?.id) {
        // Update existing ingredient
        await supabase
          .from("ingredients")
          .update(ingredientData)
          .eq("id", ingredient.id);
      } else {
        // Create new ingredient with current_stock initialized to par_level
        await supabase.from("ingredients").insert([
          {
            ...ingredientData,
            current_stock: ingredientData.par_level || 0,
          },
        ]);
      }

      setIsOpen(false);
      formRef.current?.reset();
      onSuccess?.();
    } catch (error) {
      console.error("Error saving ingredient:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div onClick={() => setIsOpen(true)}>{children}</div>

      {isOpen && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 flex items-center justify-between p-6 border-b border-gray-200 bg-white">
              <h2 className="text-xl font-bold text-gray-900">
                {ingredient ? "Edit Ingredient" : "Add Ingredient"}
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <X size={20} className="text-[#9a9080]" />
              </button>
            </div>

            {/* Form */}
            <form ref={formRef} onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-[#9a9080] uppercase tracking-wide">
                  Basic Information
                </h3>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Name</label>
                  <input
                    type="text"
                    name="name"
                    defaultValue={ingredient?.name}
                    required
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#3d6b2a]/50 transition-colors"
                    placeholder="Ingredient name"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">Category</label>
                    <select
                      name="category"
                      defaultValue={ingredient?.category}
                      required
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-[#3d6b2a]/50 transition-colors"
                    >
                      <option value="">Select category</option>
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">Unit Type</label>
                    <select
                      name="unit_type"
                      defaultValue={ingredient?.unit_type}
                      required
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-[#3d6b2a]/50 transition-colors"
                    >
                      <option value="">Select unit</option>
                      {UNIT_TYPES.map((unit) => (
                        <option key={unit} value={unit}>
                          {unit}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Supplier</label>
                  <input
                    type="text"
                    name="supplier"
                    defaultValue={ingredient?.supplier || ""}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#3d6b2a]/50 transition-colors"
                    placeholder="Supplier name"
                  />
                </div>
              </div>

              {/* Pricing */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-[#9a9080] uppercase tracking-wide">
                  Pricing & Stock
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">Cost per Unit</label>
                    <input
                      type="number"
                      name="cost_per_unit"
                      defaultValue={ingredient?.cost_per_unit}
                      step="0.01"
                      required
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#3d6b2a]/50 transition-colors"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">Par Level</label>
                    <input
                      type="number"
                      name="par_level"
                      defaultValue={ingredient?.par_level || ""}
                      min="0"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#3d6b2a]/50 transition-colors"
                      placeholder="100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Storage Type</label>
                  <select
                    name="storage_type"
                    defaultValue={ingredient?.storage_type || "dry"}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-[#3d6b2a]/50 transition-colors"
                  >
                    <option value="dry">Dry</option>
                    <option value="cold">Cold</option>
                    <option value="frozen">Frozen</option>
                    <option value="ambient">Ambient</option>
                  </select>
                </div>
              </div>

              {/* Nutrition */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-[#9a9080] uppercase tracking-wide">
                  Nutrition (per unit)
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">Calories</label>
                    <input
                      type="number"
                      name="calories_per_unit"
                      defaultValue={ingredient?.calories_per_unit || ""}
                      min="0"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#3d6b2a]/50 transition-colors"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">Protein (g)</label>
                    <input
                      type="number"
                      name="protein_per_unit"
                      defaultValue={ingredient?.protein_per_unit || ""}
                      step="0.1"
                      min="0"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#3d6b2a]/50 transition-colors"
                      placeholder="0.0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">Carbs (g)</label>
                    <input
                      type="number"
                      name="carbs_per_unit"
                      defaultValue={ingredient?.carbs_per_unit || ""}
                      step="0.1"
                      min="0"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#3d6b2a]/50 transition-colors"
                      placeholder="0.0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">Fat (g)</label>
                    <input
                      type="number"
                      name="fat_per_unit"
                      defaultValue={ingredient?.fat_per_unit || ""}
                      step="0.1"
                      min="0"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#3d6b2a]/50 transition-colors"
                      placeholder="0.0"
                    />
                  </div>
                </div>
              </div>

              {/* Allergens */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-[#9a9080] uppercase tracking-wide">
                  Allergens
                </h3>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Allergens (comma-separated)
                  </label>
                  <input
                    type="text"
                    name="allergens"
                    defaultValue={ingredient?.allergens?.join(", ") || ""}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#3d6b2a]/50 transition-colors"
                    placeholder="e.g., nuts, dairy, gluten"
                  />
                </div>
              </div>

              {/* Attributes */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-[#9a9080] uppercase tracking-wide">
                  Attributes
                </h3>

                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                    <input
                      type="checkbox"
                      name="is_organic"
                      defaultChecked={ingredient?.is_organic}
                      className="w-4 h-4 rounded accent-[#3d6b2a]"
                    />
                    <span className="text-sm font-medium text-gray-900">Organic</span>
                  </label>

                  <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                    <input
                      type="checkbox"
                      name="is_gluten_free"
                      defaultChecked={ingredient?.is_gluten_free}
                      className="w-4 h-4 rounded accent-[#3d6b2a]"
                    />
                    <span className="text-sm font-medium text-gray-900">Gluten Free</span>
                  </label>

                  <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                    <input
                      type="checkbox"
                      name="is_vegan"
                      defaultChecked={ingredient?.is_vegan}
                      className="w-4 h-4 rounded accent-[#3d6b2a]"
                    />
                    <span className="text-sm font-medium text-gray-900">Vegan</span>
                  </label>

                  <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                    <input
                      type="checkbox"
                      name="is_vegetarian"
                      defaultChecked={ingredient?.is_vegetarian}
                      className="w-4 h-4 rounded accent-[#3d6b2a]"
                    />
                    <span className="text-sm font-medium text-gray-900">Vegetarian</span>
                  </label>

                  <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                    <input
                      type="checkbox"
                      name="is_available"
                      defaultChecked={ingredient?.is_available !== false}
                      className="w-4 h-4 rounded accent-[#3d6b2a]"
                    />
                    <span className="text-sm font-medium text-gray-900">Available</span>
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 text-gray-900 rounded-xl hover:bg-gray-100 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2.5 bg-[#3d6b2a] hover:bg-[#2f5720] text-white rounded-xl transition-colors font-medium disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : ingredient ? "Update Ingredient" : "Create Ingredient"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
