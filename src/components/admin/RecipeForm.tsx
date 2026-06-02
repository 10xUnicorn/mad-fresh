"use client";

import { useState, useRef } from "react";
import { Recipe } from "@/types/database";
import { X, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface RecipeFormProps {
  recipe?: Recipe;
  onSuccess?: () => void;
  children: React.ReactNode;
}

const CATEGORIES = ["bowl", "wrap", "salad", "side", "drink", "dessert", "snack", "custom"];
const CUISINE_TYPES = ["american", "asian", "mexican", "mediterranean", "middle-eastern", "indian", "fusion"];
const DIETARY_FLAGS = ["vegan", "vegetarian", "gluten-free", "dairy-free", "keto", "paleo"];
const UNIT_TYPES = ["g", "ml", "oz", "cup", "tbsp", "tsp", "piece"];

export default function RecipeForm({ recipe, onSuccess, children }: RecipeFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDietaryFlags, setSelectedDietaryFlags] = useState<string[]>(
    recipe?.dietary_flags || []
  );
  const [tags, setTags] = useState<string[]>(recipe?.tags || []);
  const [tagInput, setTagInput] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const supabase = createClient();

  const handleDietaryFlagChange = (flag: string) => {
    setSelectedDietaryFlags((prev) =>
      prev.includes(flag) ? prev.filter((f) => f !== flag) : [...prev, flag]
    );
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData(e.currentTarget);
      const storeId = "b0000000-0000-0000-0000-000000000001";

      const recipeData = {
        store_id: storeId,
        name: formData.get("name") as string,
        description: formData.get("description") as string,
        category: formData.get("category") as string,
        cuisine_type: formData.get("cuisine_type") as string,
        base_price: parseFloat(formData.get("base_price") as string),
        cost_to_make: parseFloat(formData.get("cost_to_make") as string),
        profit_margin: 0,
        prep_time_minutes: formData.get("prep_time_minutes")
          ? parseInt(formData.get("prep_time_minutes") as string)
          : null,
        is_customizable: formData.get("is_customizable") === "on",
        is_featured: formData.get("is_featured") === "on",
        is_available: formData.get("is_available") === "on",
        dietary_flags: selectedDietaryFlags,
        tags,
        spice_level: parseInt(formData.get("spice_level") as string) || 1,
      };

      // Calculate profit margin
      recipeData.profit_margin = recipeData.base_price - recipeData.cost_to_make;

      if (recipe?.id) {
        // Update existing recipe
        await supabase
          .from("recipes")
          .update(recipeData)
          .eq("id", recipe.id);
      } else {
        // Create new recipe
        await supabase.from("recipes").insert([recipeData]);
      }

      setIsOpen(false);
      formRef.current?.reset();
      setSelectedDietaryFlags([]);
      setTags([]);
      setTagInput("");
      onSuccess?.();
    } catch (error) {
      console.error("Error saving recipe:", error);
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
                {recipe ? "Edit Recipe" : "Add Recipe"}
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                  <input
                    type="text"
                    name="name"
                    defaultValue={recipe?.name}
                    required
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#3d6b2a]/50 transition-colors"
                    placeholder="Recipe name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    name="description"
                    defaultValue={recipe?.description ?? ""}
                    rows={3}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#3d6b2a]/50 transition-colors resize-none"
                    placeholder="Recipe description"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                    <select
                      name="category"
                      defaultValue={recipe?.category}
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">Cuisine Type</label>
                    <select
                      name="cuisine_type"
                      defaultValue={recipe?.cuisine_type || ""}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-[#3d6b2a]/50 transition-colors"
                    >
                      <option value="">Select cuisine</option>
                      {CUISINE_TYPES.map((cuisine) => (
                        <option key={cuisine} value={cuisine}>
                          {cuisine.charAt(0).toUpperCase() + cuisine.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Pricing */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-[#9a9080] uppercase tracking-wide">
                  Pricing
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Base Price</label>
                    <input
                      type="number"
                      name="base_price"
                      defaultValue={recipe?.base_price}
                      step="0.01"
                      required
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#3d6b2a]/50 transition-colors"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Cost to Make</label>
                    <input
                      type="number"
                      name="cost_to_make"
                      defaultValue={recipe?.cost_to_make}
                      step="0.01"
                      required
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#3d6b2a]/50 transition-colors"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Prep Time (minutes)</label>
                  <input
                    type="number"
                    name="prep_time_minutes"
                    defaultValue={recipe?.prep_time_minutes || ""}
                    min="0"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#3d6b2a]/50 transition-colors"
                    placeholder="15"
                  />
                </div>
              </div>

              {/* Spice Level */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-[#9a9080] uppercase tracking-wide">
                  Spice Level
                </h3>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-gray-700">Heat Level</label>
                    <span className="text-sm text-[#3d6b2a] font-semibold">
                      {(document.querySelector('input[name="spice_level"]') as HTMLInputElement)?.value || "1"}
                      /5
                    </span>
                  </div>
                  <input
                    type="range"
                    name="spice_level"
                    defaultValue={recipe?.spice_level || "1"}
                    min="1"
                    max="5"
                    className="w-full accent-[#3d6b2a]"
                  />
                  <div className="flex justify-between text-xs text-[#9a9080] mt-2">
                    <span>Mild</span>
                    <span>Hot</span>
                  </div>
                </div>
              </div>

              {/* Dietary Flags */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-[#9a9080] uppercase tracking-wide">
                  Dietary Flags
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  {DIETARY_FLAGS.map((flag) => (
                    <label key={flag} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedDietaryFlags.includes(flag)}
                        onChange={() => handleDietaryFlagChange(flag)}
                        className="w-4 h-4 rounded accent-[#3d6b2a]"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        {flag.charAt(0).toUpperCase() + flag.slice(1)}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-[#9a9080] uppercase tracking-wide">
                  Tags
                </h3>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                    className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#3d6b2a]/50 transition-colors"
                    placeholder="Add tag"
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="px-4 py-2.5 bg-[#3d6b2a]/20 border border-[#3d6b2a]/30 text-[#3d6b2a] rounded-xl hover:bg-[#3d6b2a]/30 transition-colors"
                  >
                    <Plus size={18} />
                  </button>
                </div>

                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <div
                        key={tag}
                        className="flex items-center gap-2 px-3 py-1.5 bg-[#3d6b2a]/20 border border-[#3d6b2a]/30 text-[#3d6b2a] rounded-full text-sm"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="hover:text-[#3d6b2a]/70"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Toggles */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-[#9a9080] uppercase tracking-wide">
                  Options
                </h3>

                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                    <input
                      type="checkbox"
                      name="is_customizable"
                      defaultChecked={recipe?.is_customizable}
                      className="w-4 h-4 rounded accent-[#3d6b2a]"
                    />
                    <span className="text-sm font-medium text-gray-700">Allow Customization</span>
                  </label>

                  <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                    <input
                      type="checkbox"
                      name="is_featured"
                      defaultChecked={recipe?.is_featured}
                      className="w-4 h-4 rounded accent-[#3d6b2a]"
                    />
                    <span className="text-sm font-medium text-gray-700">Featured Item</span>
                  </label>

                  <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                    <input
                      type="checkbox"
                      name="is_available"
                      defaultChecked={recipe?.is_available !== false}
                      className="w-4 h-4 rounded accent-[#3d6b2a]"
                    />
                    <span className="text-sm font-medium text-gray-700">Available</span>
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
                  {isSubmitting ? "Saving..." : recipe ? "Update Recipe" : "Create Recipe"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
