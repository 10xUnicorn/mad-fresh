"use client";

import { X } from "lucide-react";
import { Recipe } from "@/types/database";

interface NutritionModalProps {
  recipe: Recipe;
  onClose: () => void;
}

export default function NutritionModal({ recipe, onClose }: NutritionModalProps) {
  // Use real recipe nutrition data with fallbacks to "N/A"
  const formatValue = (value: number | null | undefined): string => {
    return value !== null && value !== undefined ? String(value) : "N/A";
  };

  const nutritionFacts = {
    servings: 1,
    calories: formatValue(recipe.calories),
    protein: formatValue(recipe.protein_grams),
    carbs: formatValue(recipe.carbs_grams),
    fat: formatValue(recipe.fat_grams),
    fiber: formatValue(recipe.fiber_grams),
    sodium: formatValue(recipe.sodium_mg),
    sugar: formatValue(recipe.sugar_grams),
    cholesterol: formatValue(recipe.cholesterol_mg),
    saturatedFat: formatValue(recipe.saturated_fat_grams),
    transFat: formatValue(recipe.trans_fat_grams),
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass rounded-3xl p-8 max-w-md w-full space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-[#1e2d18]">Nutrition Facts</h2>
          <button
            onClick={onClose}
            className="text-[#7a7060] hover:text-[#1e2d18] transition"
          >
            <X size={24} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Recipe name */}
          <div className="pb-4 border-b border-[#ddd8cc]">
            <p className="text-sm text-[#7a7060] mb-1">Per Serving</p>
            <h3 className="text-lg font-semibold text-[#1e2d18]">{recipe.name}</h3>
          </div>

          {/* Primary nutrition */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[#4a5e3a]">Calories</span>
              <span className="text-2xl font-bold text-[#3d6b2a]">
                {nutritionFacts.calories}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-[#f2efe8] rounded-lg p-3 text-center">
                <p className="text-xs text-[#7a7060] mb-1">Protein</p>
                <p className="text-xl font-bold text-[#3d6b2a]">
                  {nutritionFacts.protein === "N/A" ? "N/A" : `${nutritionFacts.protein}g`}
                </p>
              </div>
              <div className="bg-[#f2efe8] rounded-lg p-3 text-center">
                <p className="text-xs text-[#7a7060] mb-1">Carbs</p>
                <p className="text-xl font-bold text-[#3d6b2a]">
                  {nutritionFacts.carbs === "N/A" ? "N/A" : `${nutritionFacts.carbs}g`}
                </p>
              </div>
              <div className="bg-[#f2efe8] rounded-lg p-3 text-center">
                <p className="text-xs text-[#7a7060] mb-1">Fat</p>
                <p className="text-xl font-bold text-[#3d6b2a]">
                  {nutritionFacts.fat === "N/A" ? "N/A" : `${nutritionFacts.fat}g`}
                </p>
              </div>
            </div>
          </div>

          {/* Detailed nutrition */}
          <div className="pt-4 border-t border-[#ddd8cc] space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-[#7a7060]">Fiber</span>
              <span className="text-[#1e2d18]">{nutritionFacts.fiber === "N/A" ? "N/A" : `${nutritionFacts.fiber}g`}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#7a7060]">Sugar</span>
              <span className="text-[#1e2d18]">{nutritionFacts.sugar === "N/A" ? "N/A" : `${nutritionFacts.sugar}g`}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#7a7060]">Sodium</span>
              <span className="text-[#1e2d18]">{nutritionFacts.sodium === "N/A" ? "N/A" : `${nutritionFacts.sodium}mg`}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#7a7060]">Cholesterol</span>
              <span className="text-[#1e2d18]">{nutritionFacts.cholesterol === "N/A" ? "N/A" : `${nutritionFacts.cholesterol}mg`}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#7a7060]">Saturated Fat</span>
              <span className="text-[#1e2d18]">{nutritionFacts.saturatedFat === "N/A" ? "N/A" : `${nutritionFacts.saturatedFat}g`}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#7a7060]">Trans Fat</span>
              <span className="text-[#1e2d18]">{nutritionFacts.transFat === "N/A" ? "N/A" : `${nutritionFacts.transFat}g`}</span>
            </div>
          </div>

          {/* Disclaimer */}
          <p className="text-xs text-[#9a9080] pt-4 border-t border-[#ddd8cc]">
            Nutrition information is estimated based on standard recipes.
            Actual values may vary. Always consult packaging for exact details.
          </p>
        </div>

        <button
          onClick={onClose}
          className="w-full bg-[#f2efe8] hover:bg-[#f0ece3] text-[#1e2d18] font-semibold py-2.5 rounded-lg transition"
        >
          Close
        </button>
      </div>
    </div>
  );
}
