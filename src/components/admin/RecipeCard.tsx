"use client";

import { Recipe } from "@/types/database";
import { Star, Eye, EyeOff, Edit2, Trash2, Pencil, Check, X, Globe, GlobeLock, AlertCircle } from "lucide-react";
import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

interface RecipeCardProps {
  recipe: Recipe;
  onRecipeUpdate?: () => void;
}

export default function RecipeCard({ recipe, onRecipeUpdate }: RecipeCardProps) {
  const [isAvailable, setIsAvailable] = useState(recipe.is_available);
  const [isVisible, setIsVisible] = useState(recipe.is_visible ?? true);
  const [isSoldOut, setIsSoldOut] = useState(recipe.is_sold_out ?? false);
  const [isFeatured, setIsFeatured] = useState(recipe.is_featured);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Inline edit state
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editCost, setEditCost] = useState(recipe.cost_to_make.toString());
  const [editCalories, setEditCalories] = useState((recipe.calories ?? 0).toString());
  const [editProtein, setEditProtein] = useState((recipe.protein_grams ?? 0).toString());
  const [localCost, setLocalCost] = useState(recipe.cost_to_make);
  const [localCalories, setLocalCalories] = useState(recipe.calories ?? 0);
  const [localProtein, setLocalProtein] = useState(recipe.protein_grams ?? 0);
  const inputRef = useRef<HTMLInputElement>(null);

  const supabase = createClient();

  const startEdit = (field: string) => {
    setEditingField(field);
    if (field === "cost") setEditCost(localCost.toString());
    if (field === "calories") setEditCalories(localCalories.toString());
    if (field === "protein") setEditProtein(localProtein.toString());
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const cancelEdit = () => setEditingField(null);

  const saveEdit = async (field: string) => {
    setIsUpdating(true);
    try {
      let updateData: Record<string, number> = {};
      if (field === "cost") {
        const val = parseFloat(editCost);
        if (isNaN(val)) { cancelEdit(); return; }
        updateData = { cost_to_make: val };
        setLocalCost(val);
      } else if (field === "calories") {
        const val = parseInt(editCalories);
        if (isNaN(val)) { cancelEdit(); return; }
        updateData = { calories: val };
        setLocalCalories(val);
      } else if (field === "protein") {
        const val = parseFloat(editProtein);
        if (isNaN(val)) { cancelEdit(); return; }
        updateData = { protein_grams: val };
        setLocalProtein(val);
      }
      await supabase.from("recipes").update(updateData).eq("id", recipe.id);
      setEditingField(null);
    } catch (error) {
      console.error("Error updating:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, field: string) => {
    if (e.key === "Enter") saveEdit(field);
    if (e.key === "Escape") cancelEdit();
  };

  const toggleAvailability = async () => {
    setIsUpdating(true);
    try {
      const newStatus = !isAvailable;
      await supabase
        .from("recipes")
        .update({ is_available: newStatus })
        .eq("id", recipe.id);
      setIsAvailable(newStatus);
    } catch (error) {
      console.error("Error updating recipe:", error);
      setIsAvailable(!isAvailable);
    } finally {
      setIsUpdating(false);
    }
  };

  const toggleFeatured = async () => {
    setIsUpdating(true);
    try {
      const newStatus = !isFeatured;
      await supabase
        .from("recipes")
        .update({ is_featured: newStatus })
        .eq("id", recipe.id);
      setIsFeatured(newStatus);
    } catch (error) {
      console.error("Error updating recipe:", error);
      setIsFeatured(!isFeatured);
    } finally {
      setIsUpdating(false);
    }
  };

  const deleteRecipe = async () => {
    if (!confirm("Are you sure you want to delete this recipe?")) return;

    setIsDeleting(true);
    try {
      await supabase.from("recipes").delete().eq("id", recipe.id);
      onRecipeUpdate?.();
    } catch (error) {
      console.error("Error deleting recipe:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const currentMargin = recipe.base_price - localCost;
  const marginPercent = recipe.base_price > 0 ? ((currentMargin / recipe.base_price) * 100).toFixed(1) : "0.0";

  return (
    <div className="bg-white border border-gray-200 shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-all group">
      {/* Image Placeholder */}
      <div className="h-40 bg-gradient-to-br from-[#3d6b2a]/10 to-[#3d6b2a]/10 border-b border-gray-200 flex items-center justify-center">
        {recipe.image_url ? (
          <img
            src={recipe.image_url}
            alt={recipe.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-[#3d6b2a]/50">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Header with Actions */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2">
              {recipe.name}
            </h3>
            <div className="flex gap-2">
              <span className="inline-block px-2 py-1 text-xs font-medium bg-[#3d6b2a]/20 text-[#3d6b2a] rounded">
                {recipe.category.charAt(0).toUpperCase() + recipe.category.slice(1)}
              </span>
              {recipe.cuisine_type && (
                <span className="inline-block px-2 py-1 text-xs font-medium bg-gray-100 text-[#9a9080] rounded">
                  {recipe.cuisine_type}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={toggleFeatured}
            disabled={isUpdating}
            className="p-1.5 rounded-lg hover:bg-gray-50 transition-colors"
            title={isFeatured ? "Remove from featured" : "Add to featured"}
          >
            <Star
              size={18}
              className={isFeatured ? "fill-[#3d6b2a] text-[#3d6b2a]" : "text-[#9a9080]"}
            />
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 py-3 border-y border-gray-200">
          <div>
            <p className="text-xs text-[#9a9080] mb-1">Price</p>
            <p className="text-sm font-semibold text-gray-900">${recipe.base_price.toFixed(2)}</p>
          </div>
          <div>
            <div className="flex items-center gap-1 mb-1">
              <p className="text-xs text-[#9a9080]">Cost</p>
              {editingField !== "cost" && (
                <button onClick={() => startEdit("cost")} className="p-0.5 rounded hover:bg-gray-100 transition-colors">
                  <Pencil size={10} className="text-[#7a7060]" />
                </button>
              )}
            </div>
            {editingField === "cost" ? (
              <div className="flex items-center gap-1">
                <span className="text-sm text-[#9a9080]">$</span>
                <input
                  ref={inputRef}
                  type="number"
                  step="0.01"
                  value={editCost}
                  onChange={(e) => setEditCost(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, "cost")}
                  className="w-14 text-sm font-semibold text-gray-900 border border-[#3d6b2a]/40 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-[#3d6b2a]"
                />
                <button onClick={() => saveEdit("cost")} className="p-0.5 rounded hover:bg-green-50"><Check size={12} className="text-[#3d6b2a]" /></button>
                <button onClick={cancelEdit} className="p-0.5 rounded hover:bg-red-50"><X size={12} className="text-red-500" /></button>
              </div>
            ) : (
              <p className="text-sm font-semibold text-gray-900">${localCost.toFixed(2)}</p>
            )}
          </div>
          <div>
            <div className="flex items-center gap-1 mb-1">
              <p className="text-xs text-[#9a9080]">Calories</p>
              {editingField !== "calories" && (
                <button onClick={() => startEdit("calories")} className="p-0.5 rounded hover:bg-gray-100 transition-colors">
                  <Pencil size={10} className="text-[#7a7060]" />
                </button>
              )}
            </div>
            {editingField === "calories" ? (
              <div className="flex items-center gap-1">
                <input
                  ref={inputRef}
                  type="number"
                  value={editCalories}
                  onChange={(e) => setEditCalories(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, "calories")}
                  className="w-14 text-sm font-semibold text-gray-900 border border-[#3d6b2a]/40 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-[#3d6b2a]"
                />
                <button onClick={() => saveEdit("calories")} className="p-0.5 rounded hover:bg-green-50"><Check size={12} className="text-[#3d6b2a]" /></button>
                <button onClick={cancelEdit} className="p-0.5 rounded hover:bg-red-50"><X size={12} className="text-red-500" /></button>
              </div>
            ) : (
              <p className="text-sm font-semibold text-gray-900">{localCalories} cal</p>
            )}
          </div>
          <div>
            <div className="flex items-center gap-1 mb-1">
              <p className="text-xs text-[#9a9080]">Protein</p>
              {editingField !== "protein" && (
                <button onClick={() => startEdit("protein")} className="p-0.5 rounded hover:bg-gray-100 transition-colors">
                  <Pencil size={10} className="text-[#7a7060]" />
                </button>
              )}
            </div>
            {editingField === "protein" ? (
              <div className="flex items-center gap-1">
                <input
                  ref={inputRef}
                  type="number"
                  step="0.1"
                  value={editProtein}
                  onChange={(e) => setEditProtein(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, "protein")}
                  className="w-14 text-sm font-semibold text-gray-900 border border-[#3d6b2a]/40 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-[#3d6b2a]"
                />
                <button onClick={() => saveEdit("protein")} className="p-0.5 rounded hover:bg-green-50"><Check size={12} className="text-[#3d6b2a]" /></button>
                <button onClick={cancelEdit} className="p-0.5 rounded hover:bg-red-50"><X size={12} className="text-red-500" /></button>
              </div>
            ) : (
              <p className="text-sm font-semibold text-gray-900">{localProtein}g</p>
            )}
          </div>
        </div>

        {/* Flags */}
        <div className="py-3 space-y-2">
          {recipe.dietary_flags && recipe.dietary_flags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {recipe.dietary_flags.slice(0, 2).map((flag) => (
                <span
                  key={flag}
                  className="text-xs px-2 py-0.5 bg-gray-100 text-[#9a9080] rounded"
                >
                  {flag}
                </span>
              ))}
              {recipe.dietary_flags.length > 2 && (
                <span className="text-xs px-2 py-0.5 bg-gray-100 text-[#9a9080] rounded">
                  +{recipe.dietary_flags.length - 2}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Status Toggles */}
        <div className="grid grid-cols-3 gap-1.5 mb-3">
          <button
            onClick={toggleAvailability}
            disabled={isUpdating}
            className={`flex items-center justify-center gap-1 px-2 py-2 rounded-lg font-medium text-xs transition-all ${
              isAvailable
                ? "bg-[#3d6b2a]/20 border border-[#3d6b2a]/30 text-[#3d6b2a]"
                : "bg-gray-100 border border-gray-200 text-[#9a9080]"
            } disabled:opacity-50`}
            title={isAvailable ? "Mark unavailable" : "Mark available"}
          >
            {isAvailable ? <Eye size={13} /> : <EyeOff size={13} />}
            {isAvailable ? "Active" : "Off"}
          </button>
          <button
            onClick={async () => {
              setIsUpdating(true);
              try {
                const val = !isVisible;
                await supabase.from("recipes").update({ is_visible: val }).eq("id", recipe.id);
                setIsVisible(val);
              } finally { setIsUpdating(false); }
            }}
            disabled={isUpdating}
            className={`flex items-center justify-center gap-1 px-2 py-2 rounded-lg font-medium text-xs transition-all ${
              isVisible
                ? "bg-blue-50 border border-blue-200 text-blue-700"
                : "bg-gray-100 border border-gray-200 text-[#9a9080]"
            } disabled:opacity-50`}
            title={isVisible ? "Hide from website" : "Show on website"}
          >
            {isVisible ? <Globe size={13} /> : <GlobeLock size={13} />}
            {isVisible ? "Visible" : "Hidden"}
          </button>
          <button
            onClick={async () => {
              setIsUpdating(true);
              try {
                const val = !isSoldOut;
                await supabase.from("recipes").update({ is_sold_out: val }).eq("id", recipe.id);
                setIsSoldOut(val);
              } finally { setIsUpdating(false); }
            }}
            disabled={isUpdating}
            className={`flex items-center justify-center gap-1 px-2 py-2 rounded-lg font-medium text-xs transition-all ${
              isSoldOut
                ? "bg-red-50 border border-red-200 text-red-700"
                : "bg-gray-100 border border-gray-200 text-[#9a9080]"
            } disabled:opacity-50`}
            title={isSoldOut ? "Mark in stock" : "Mark sold out"}
          >
            <AlertCircle size={13} />
            {isSoldOut ? "Sold Out" : "In Stock"}
          </button>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Link
            href={`/admin/menu/recipes/${recipe.id}/edit`}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-[#3d6b2a]/20 border border-[#3d6b2a]/30 text-[#3d6b2a] rounded-xl hover:bg-[#3d6b2a]/30 transition-colors font-medium text-sm"
          >
            <Edit2 size={16} />
            Edit
          </Link>

          <button
            onClick={deleteRecipe}
            disabled={isDeleting}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xl hover:bg-red-50 transition-colors font-medium text-sm disabled:opacity-50"
            title="Delete recipe"
          >
            <Trash2 size={16} />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
