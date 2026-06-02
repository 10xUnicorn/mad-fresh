"use client";

import { useState, useMemo } from "react";
import { Ingredient } from "@/types/database";
import { Search, Plus, Eye, EyeOff, Trash2, Edit2, ChevronDown } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import IngredientForm from "./IngredientForm";

interface Vendor {
  id: string;
  name: string;
}

interface IngredientsManagerProps {
  ingredients: Ingredient[];
  vendors: Vendor[];
}

const CATEGORIES = [
  "protein",
  "grain",
  "vegetable",
  "fruit",
  "dairy",
  "sauce",
  "spice",
  "oil",
  "other",
];

export default function IngredientsManager({
  ingredients: initialIngredients,
  vendors,
}: IngredientsManagerProps) {
  const [ingredients, setIngredients] = useState(initialIngredients);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const supabase = createClient();

  // Filter ingredients based on search and category
  const filteredIngredients = useMemo(() => {
    return ingredients.filter((ing) => {
      const matchesSearch =
        ing.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (ing.description?.toLowerCase().includes(searchQuery.toLowerCase()) ??
          false);
      const matchesCategory = !selectedCategory || ing.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [ingredients, searchQuery, selectedCategory]);

  const toggleAvailability = async (id: string, currentStatus: boolean) => {
    try {
      await supabase
        .from("ingredients")
        .update({ is_available: !currentStatus })
        .eq("id", id);

      setIngredients((prev) =>
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
      setIngredients((prev) => prev.filter((ing) => ing.id !== id));
    } catch (error) {
      console.error("Error deleting ingredient:", error);
    } finally {
      setIsDeleting(null);
    }
  };

  const handleIngredientSuccess = () => {
    setEditingIngredient(null);
    setShowAddForm(false);
    // Refetch ingredients after save
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      {/* Header with Search and Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#7a7060]"
          />
          <input
            type="text"
            placeholder="Search ingredients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3d6b2a]/20 focus:border-[#3d6b2a]"
          />
        </div>

        <IngredientForm onSuccess={handleIngredientSuccess}>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-[#3d6b2a] hover:bg-[#2f5720] text-white rounded-xl font-medium transition-colors">
            <Plus size={18} />
            Add Ingredient
          </button>
        </IngredientForm>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
            selectedCategory === null
              ? "bg-[#3d6b2a] text-white"
              : "bg-white text-[#9a9080] border border-gray-200 hover:border-gray-300"
          }`}
        >
          All Categories
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? "bg-[#3d6b2a] text-white"
                : "bg-white text-[#9a9080] border border-gray-200 hover:border-gray-300"
            }`}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white border border-gray-200 shadow-sm rounded-2xl">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-6 py-3 text-left text-sm font-semibold text-[#9a9080]">
                Name
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-[#9a9080]">
                Category
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-[#9a9080]">
                Cost/Unit
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-[#9a9080]">
                Calories
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-[#9a9080]">
                Protein
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-[#9a9080]">
                Carbs
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-[#9a9080]">
                Fat
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-[#9a9080]">
                Supplier
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-[#9a9080]">
                Flags
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-[#9a9080]">
                Available
              </th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-[#9a9080]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredIngredients.map((ingredient) => (
              <tr
                key={ingredient.id}
                className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  {ingredient.name}
                </td>
                <td className="px-6 py-4 text-sm">
                  <span className="inline-block px-2.5 py-1 bg-[#3d6b2a]/10 text-[#3d6b2a] rounded text-xs font-medium">
                    {ingredient.category.charAt(0).toUpperCase() +
                      ingredient.category.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-[#9a9080]">
                  ${ingredient.cost_per_unit.toFixed(2)}
                </td>
                <td className="px-6 py-4 text-sm text-[#9a9080]">
                  {ingredient.calories_per_unit}
                </td>
                <td className="px-6 py-4 text-sm text-[#9a9080]">
                  {ingredient.protein_per_unit.toFixed(1)}g
                </td>
                <td className="px-6 py-4 text-sm text-[#9a9080]">
                  {ingredient.carbs_per_unit.toFixed(1)}g
                </td>
                <td className="px-6 py-4 text-sm text-[#9a9080]">
                  {ingredient.fat_per_unit.toFixed(1)}g
                </td>
                <td className="px-6 py-4 text-sm text-[#9a9080]">
                  {ingredient.supplier || "-"}
                </td>
                <td className="px-6 py-4 text-sm">
                  <div className="flex flex-wrap gap-1">
                    {ingredient.is_organic && (
                      <span className="text-xs px-2 py-0.5 bg-green-50 text-green-700 rounded">
                        Organic
                      </span>
                    )}
                    {ingredient.is_gluten_free && (
                      <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded">
                        GF
                      </span>
                    )}
                    {ingredient.is_vegan && (
                      <span className="text-xs px-2 py-0.5 bg-purple-50 text-purple-700 rounded">
                        Vegan
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm">
                  <button
                    onClick={() =>
                      toggleAvailability(ingredient.id, ingredient.is_available)
                    }
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    {ingredient.is_available ? (
                      <Eye size={18} className="text-[#3d6b2a]" />
                    ) : (
                      <EyeOff size={18} className="text-[#7a7060]" />
                    )}
                  </button>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <IngredientForm
                      ingredient={ingredient}
                      onSuccess={handleIngredientSuccess}
                    >
                      <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-[#9a9080] hover:text-gray-900">
                        <Edit2 size={18} />
                      </button>
                    </IngredientForm>

                    <button
                      onClick={() => deleteIngredient(ingredient.id)}
                      disabled={isDeleting === ingredient.id}
                      className="p-2 rounded-lg hover:bg-red-50 transition-colors text-[#9a9080] hover:text-red-700 disabled:opacity-50"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredIngredients.length === 0 && (
        <div className="text-center py-12">
          <p className="text-[#9a9080]">No ingredients found</p>
        </div>
      )}
    </div>
  );
}
