"use client";

import { useState } from "react";
import { Ingredient } from "@/types/database";
import { Eye, EyeOff, Trash2, Edit2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import IngredientForm from "./IngredientForm";

interface IngredientsTableProps {
  ingredients: Ingredient[];
}

const STOCK_STATUS_CONFIG = {
  low: { label: "Low Stock", color: "bg-red-50 text-red-700 border-red-200" },
  medium: { label: "Medium Stock", color: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  high: { label: "Good Stock", color: "bg-green-50 text-green-700 border-green-200" },
};

export default function IngredientsTable({ ingredients }: IngredientsTableProps) {
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
  const [ingredientsList, setIngredientsList] = useState(ingredients);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const supabase = createClient();

  const getStockStatus = (ingredient: Ingredient) => {
    if (!ingredient.is_available) return "low";
    if (!ingredient.par_level) return "medium";
    return "high";
  };

  const toggleAvailability = async (id: string, currentStatus: boolean) => {
    try {
      await supabase
        .from("ingredients")
        .update({ is_available: !currentStatus })
        .eq("id", id);

      setIngredientsList((prev) =>
        prev.map((ing) =>
          ing.id === id ? { ...ing, is_available: !currentStatus } : ing
        )
      );
    } catch (error) {
      console.error("Error updating ingredient:", error);
    }
  };

  const deleteIngredient = async (id: string) => {
    if (!confirm("Are you sure you want to delete this ingredient?")) return;

    setIsDeleting(id);
    try {
      await supabase.from("ingredients").delete().eq("id", id);
      setIngredientsList((prev) => prev.filter((ing) => ing.id !== id));
    } catch (error) {
      console.error("Error deleting ingredient:", error);
    } finally {
      setIsDeleting(null);
    }
  };

  const handleIngredientUpdate = () => {
    setEditingIngredient(null);
  };

  return (
    <>
      <div className="overflow-x-auto border border-gray-200 shadow-sm rounded-2xl bg-white">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">Name</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">Category</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">Cost/Unit</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">Unit Type</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">Calories</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">Protein</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">Stock Status</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">Allergens</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">Available</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody>
            {ingredientsList.map((ingredient) => {
              const stockStatus = getStockStatus(ingredient);
              const statusConfig = STOCK_STATUS_CONFIG[stockStatus as keyof typeof STOCK_STATUS_CONFIG];

              return (
                <tr
                  key={ingredient.id}
                  className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {ingredient.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-[#9a9080]">
                    <span className="inline-block px-2.5 py-1 bg-[#3d6b2a]/20 text-[#3d6b2a] rounded text-xs font-medium">
                      {ingredient.category.charAt(0).toUpperCase() + ingredient.category.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-[#9a9080]">
                    ${ingredient.cost_per_unit.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-sm text-[#9a9080]">
                    {ingredient.unit_type}
                  </td>
                  <td className="px-6 py-4 text-sm text-[#9a9080]">
                    {ingredient.calories_per_unit}
                  </td>
                  <td className="px-6 py-4 text-sm text-[#9a9080]">
                    {ingredient.protein_per_unit}g
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`inline-block px-2.5 py-1 rounded text-xs font-medium border ${statusConfig.color}`}
                    >
                      {statusConfig.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-[#9a9080]">
                    {ingredient.allergens && ingredient.allergens.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {ingredient.allergens.slice(0, 2).map((allergen) => (
                          <span
                            key={allergen}
                            className="text-xs px-2 py-0.5 bg-red-50 text-red-700 rounded"
                          >
                            {allergen}
                          </span>
                        ))}
                        {ingredient.allergens.length > 2 && (
                          <span className="text-xs px-2 py-0.5 bg-gray-100 text-[#9a9080] rounded">
                            +{ingredient.allergens.length - 2}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-[#7a7060]">None</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <button
                      onClick={() => toggleAvailability(ingredient.id, ingredient.is_available)}
                      className="p-2 rounded-lg hover:bg-gray-50 transition-colors"
                      title={ingredient.is_available ? "Mark as unavailable" : "Mark as available"}
                    >
                      {ingredient.is_available ? (
                        <Eye size={18} className="text-[#3d6b2a]" />
                      ) : (
                        <EyeOff size={18} className="text-[#9a9080]" />
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <IngredientForm
                        ingredient={ingredient}
                        onSuccess={handleIngredientUpdate}
                      >
                        <button
                          className="p-2 rounded-lg hover:bg-gray-50 transition-colors text-[#9a9080] hover:text-gray-900"
                          title="Edit ingredient"
                        >
                          <Edit2 size={18} />
                        </button>
                      </IngredientForm>

                      <button
                        onClick={() => deleteIngredient(ingredient.id)}
                        disabled={isDeleting === ingredient.id}
                        className="p-2 rounded-lg hover:bg-red-50 transition-colors text-[#9a9080] hover:text-red-700 disabled:opacity-50"
                        title="Delete ingredient"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {editingIngredient && (
        <IngredientForm
          ingredient={editingIngredient}
          onSuccess={handleIngredientUpdate}
        >
          <div />
        </IngredientForm>
      )}
    </>
  );
}
