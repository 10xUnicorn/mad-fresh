"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Plus, X, Trash2, GripVertical, ChevronDown, ChevronUp,
  Search, DollarSign, Star, Eye, EyeOff, Save, Loader2,
  Settings, Check, AlertCircle
} from "lucide-react";
import { BowlCustomizationCategory, BowlCustomizationItem, Ingredient } from "@/types/database";

const STORE_ID = "b0000000-0000-0000-0000-000000000001";

interface CategoryWithItems extends BowlCustomizationCategory {
  items: (BowlCustomizationItem & { ingredient?: Ingredient })[];
}

export default function BowlBuilderManager() {
  const supabase = createClient();
  const [categories, setCategories] = useState<CategoryWithItems[]>([]);
  const [allIngredients, setAllIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">("idle");

  // Modal state
  const [editingCategory, setEditingCategory] = useState<CategoryWithItems | null>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [targetCategoryId, setTargetCategoryId] = useState<string | null>(null);
  const [itemSearch, setItemSearch] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Category form
  const [categoryForm, setCategoryForm] = useState({
    name: "", slug: "", description: "",
    min_selections: 0, max_selections: 1,
    is_required: false, is_active: true,
  });

  // Load data
  useEffect(() => {
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [catRes, ingRes] = await Promise.all([
        supabase
          .from("bowl_customization_categories")
          .select("*")
          .eq("store_id", STORE_ID)
          .order("sort_order"),
        supabase
          .from("ingredients")
          .select("*")
          .eq("store_id", STORE_ID)
          .eq("is_available", true)
          .order("category, name"),
      ]);

      const cats = (catRes.data || []) as BowlCustomizationCategory[];
      setAllIngredients((ingRes.data || []) as Ingredient[]);

      // Load items for each category
      const catsWithItems: CategoryWithItems[] = [];
      for (const cat of cats) {
        const { data: items } = await supabase
          .from("bowl_customization_items")
          .select("*, ingredients(*)")
          .eq("category_id", cat.id)
          .order("sort_order");

        catsWithItems.push({
          ...cat,
          items: (items || []).map((item: Record<string, unknown>) => ({
            ...item,
            ingredient: item.ingredients as unknown as Ingredient,
          })) as (BowlCustomizationItem & { ingredient?: Ingredient })[],
        });
      }

      setCategories(catsWithItems);
      // Expand all by default
      setExpandedCategories(new Set(catsWithItems.map(c => c.id)));
    } catch (err) {
      console.error("Error loading bowl builder data:", err);
    } finally {
      setLoading(false);
    }
  };

  // ── Category CRUD ──
  const openNewCategory = () => {
    setCategoryForm({
      name: "", slug: "", description: "",
      min_selections: 0, max_selections: 1,
      is_required: false, is_active: true,
    });
    setEditingCategory(null);
    setShowCategoryModal(true);
  };

  const openEditCategory = (cat: CategoryWithItems) => {
    setCategoryForm({
      name: cat.name, slug: cat.slug, description: cat.description || "",
      min_selections: cat.min_selections, max_selections: cat.max_selections,
      is_required: cat.is_required, is_active: cat.is_active,
    });
    setEditingCategory(cat);
    setShowCategoryModal(true);
  };

  const saveCategory = async () => {
    if (!categoryForm.name.trim()) return;
    setSaving(true);
    try {
      const slug = categoryForm.slug || categoryForm.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const payload = {
        store_id: STORE_ID,
        name: categoryForm.name,
        slug,
        description: categoryForm.description || null,
        min_selections: categoryForm.min_selections,
        max_selections: categoryForm.max_selections,
        is_required: categoryForm.is_required,
        is_active: categoryForm.is_active,
        sort_order: editingCategory ? editingCategory.sort_order : categories.length,
      };

      if (editingCategory) {
        await supabase.from("bowl_customization_categories").update(payload).eq("id", editingCategory.id);
      } else {
        await supabase.from("bowl_customization_categories").insert([payload]);
      }

      setShowCategoryModal(false);
      await loadData();
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (err) {
      console.error("Error saving category:", err);
      setSaveStatus("error");
    } finally {
      setSaving(false);
    }
  };

  const deleteCategory = async (id: string) => {
    if (!confirm("Delete this category and all its items?")) return;
    await supabase.from("bowl_customization_categories").delete().eq("id", id);
    await loadData();
  };

  const toggleCategoryActive = async (cat: CategoryWithItems) => {
    await supabase
      .from("bowl_customization_categories")
      .update({ is_active: !cat.is_active })
      .eq("id", cat.id);
    setCategories(prev =>
      prev.map(c => c.id === cat.id ? { ...c, is_active: !c.is_active } : c)
    );
  };

  // ── Item CRUD ──
  const openAddItem = (categoryId: string) => {
    setTargetCategoryId(categoryId);
    setItemSearch("");
    setShowAddItemModal(true);
  };

  const addItemToCategory = async (ingredientId: string) => {
    if (!targetCategoryId) return;

    const category = categories.find(c => c.id === targetCategoryId);
    if (category?.items.some(i => i.ingredient_id === ingredientId)) {
      alert("This ingredient is already in this category");
      return;
    }

    await supabase.from("bowl_customization_items").insert([{
      category_id: targetCategoryId,
      ingredient_id: ingredientId,
      upcharge: 0,
      is_default: false,
      is_premium: false,
      is_available: true,
      sort_order: category?.items.length || 0,
    }]);

    await loadData();
  };

  const removeItem = async (itemId: string) => {
    await supabase.from("bowl_customization_items").delete().eq("id", itemId);
    setCategories(prev =>
      prev.map(cat => ({
        ...cat,
        items: cat.items.filter(i => i.id !== itemId),
      }))
    );
  };

  const updateItem = async (itemId: string, updates: Partial<BowlCustomizationItem>) => {
    await supabase.from("bowl_customization_items").update(updates).eq("id", itemId);
    setCategories(prev =>
      prev.map(cat => ({
        ...cat,
        items: cat.items.map(i => i.id === itemId ? { ...i, ...updates } : i),
      }))
    );
  };

  const toggleExpanded = (id: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Filtered ingredients for add modal
  const filteredIngredients = allIngredients.filter(ing => {
    if (!itemSearch) return true;
    return ing.name.toLowerCase().includes(itemSearch.toLowerCase()) ||
           ing.category.toLowerCase().includes(itemSearch.toLowerCase());
  });

  // Already-used ingredient IDs for the target category
  const usedIngredientIds = targetCategoryId
    ? new Set(categories.find(c => c.id === targetCategoryId)?.items.map(i => i.ingredient_id) || [])
    : new Set<string>();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-[#3d6b2a]" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#1e2d18]">Bowl Customization Steps</h2>
          <p className="text-sm text-[#7a7060] mt-1">
            Configure the Build Your Own Bowl flow — categories, ingredients, and upcharges
          </p>
        </div>
        <button
          onClick={openNewCategory}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#3d6b2a] hover:bg-[#2f5720] text-white rounded-xl font-medium transition-colors"
        >
          <Plus size={18} />
          Add Step
        </button>
      </div>

      {/* Save status */}
      {saveStatus === "saved" && (
        <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          <Check size={16} /> Saved successfully
        </div>
      )}

      {/* Categories */}
      {categories.length === 0 ? (
        <div className="text-center py-16 bg-white border border-gray-200 rounded-2xl">
          <Settings size={48} className="mx-auto text-[#4a5e3a] mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No customization steps yet</h3>
          <p className="text-[#9a9080] text-sm mb-6">Create steps like Base, Protein, Toppings, Sauce to build your BYOB flow</p>
          <button
            onClick={openNewCategory}
            className="px-4 py-2.5 bg-[#3d6b2a] hover:bg-[#2f5720] text-white rounded-xl font-medium transition-colors"
          >
            Create First Step
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {categories.map((cat, catIdx) => (
            <div
              key={cat.id}
              className={`bg-white border rounded-2xl overflow-hidden transition-colors ${
                cat.is_active ? "border-gray-200" : "border-gray-200 opacity-60"
              }`}
            >
              {/* Category Header */}
              <div
                className="flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleExpanded(cat.id)}
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#3d6b2a]/10 text-[#3d6b2a] font-bold text-sm">
                    {catIdx + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{cat.name}</h3>
                      {cat.is_required && (
                        <span className="text-xs px-2 py-0.5 bg-red-50 text-red-600 rounded-full font-medium">Required</span>
                      )}
                      {!cat.is_active && (
                        <span className="text-xs px-2 py-0.5 bg-gray-100 text-[#9a9080] rounded-full font-medium">Inactive</span>
                      )}
                    </div>
                    <p className="text-sm text-[#9a9080]">
                      {cat.description || "No description"} · {cat.items.length} items ·
                      {cat.max_selections === -1 ? " Unlimited" : ` Max ${cat.max_selections}`} selections
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleCategoryActive(cat); }}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    title={cat.is_active ? "Deactivate" : "Activate"}
                  >
                    {cat.is_active ? <Eye size={18} className="text-[#3d6b2a]" /> : <EyeOff size={18} className="text-[#7a7060]" />}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); openEditCategory(cat); }}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-[#9a9080]"
                    title="Edit step"
                  >
                    <Settings size={18} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteCategory(cat.id); }}
                    className="p-2 rounded-lg hover:bg-red-50 transition-colors text-[#7a7060] hover:text-red-600"
                    title="Delete step"
                  >
                    <Trash2 size={18} />
                  </button>
                  {expandedCategories.has(cat.id) ? <ChevronUp size={18} className="text-[#7a7060]" /> : <ChevronDown size={18} className="text-[#7a7060]" />}
                </div>
              </div>

              {/* Expanded Items */}
              {expandedCategories.has(cat.id) && (
                <div className="border-t border-gray-100">
                  {cat.items.length === 0 ? (
                    <div className="px-6 py-8 text-center">
                      <p className="text-[#7a7060] text-sm mb-3">No ingredients assigned yet</p>
                      <button
                        onClick={() => openAddItem(cat.id)}
                        className="text-sm text-[#3d6b2a] hover:text-[#2f5720] font-medium"
                      >
                        + Add Ingredient
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Table header */}
                      <div className="grid grid-cols-12 gap-4 px-6 py-2 bg-gray-50 text-xs font-semibold text-[#9a9080] uppercase tracking-wide">
                        <div className="col-span-3">Ingredient</div>
                        <div className="col-span-2">Category</div>
                        <div className="col-span-2">Upcharge</div>
                        <div className="col-span-1 text-center">Default</div>
                        <div className="col-span-1 text-center">Premium</div>
                        <div className="col-span-1 text-center">Active</div>
                        <div className="col-span-2 text-right">Actions</div>
                      </div>

                      {cat.items.map((item) => (
                        <div
                          key={item.id}
                          className="grid grid-cols-12 gap-4 px-6 py-3 border-t border-gray-50 items-center hover:bg-gray-50/50 transition-colors"
                        >
                          <div className="col-span-3">
                            <p className="text-sm font-medium text-gray-900">
                              {item.display_name || item.ingredient?.name || "Unknown"}
                            </p>
                            {item.ingredient?.allergens && item.ingredient.allergens.length > 0 && (
                              <div className="flex gap-1 mt-0.5">
                                {item.ingredient.allergens.map(a => (
                                  <span key={a} className="text-[10px] px-1.5 py-0.5 bg-red-50 text-red-600 rounded">
                                    {a}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="col-span-2">
                            <span className="text-xs px-2 py-1 bg-[#3d6b2a]/10 text-[#3d6b2a] rounded font-medium">
                              {item.ingredient?.category || "-"}
                            </span>
                          </div>

                          <div className="col-span-2">
                            <div className="flex items-center gap-1">
                              <DollarSign size={14} className="text-[#7a7060]" />
                              <input
                                type="number"
                                value={item.upcharge}
                                onChange={(e) => updateItem(item.id, { upcharge: parseFloat(e.target.value) || 0 })}
                                step="0.25"
                                min="0"
                                className="w-20 px-2 py-1 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#3d6b2a]/50"
                              />
                            </div>
                          </div>

                          <div className="col-span-1 text-center">
                            <button
                              onClick={() => updateItem(item.id, { is_default: !item.is_default })}
                              className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                                item.is_default
                                  ? "bg-[#3d6b2a] border-[#3d6b2a] text-white"
                                  : "border-gray-300 hover:border-gray-400"
                              }`}
                            >
                              {item.is_default && <Check size={14} />}
                            </button>
                          </div>

                          <div className="col-span-1 text-center">
                            <button
                              onClick={() => updateItem(item.id, { is_premium: !item.is_premium })}
                              className={`p-1 rounded transition-colors ${
                                item.is_premium ? "text-amber-500" : "text-[#4a5e3a] hover:text-[#7a7060]"
                              }`}
                            >
                              <Star size={18} fill={item.is_premium ? "currentColor" : "none"} />
                            </button>
                          </div>

                          <div className="col-span-1 text-center">
                            <button
                              onClick={() => updateItem(item.id, { is_available: !item.is_available })}
                              className="p-1 rounded transition-colors"
                            >
                              {item.is_available
                                ? <Eye size={18} className="text-[#3d6b2a]" />
                                : <EyeOff size={18} className="text-[#7a7060]" />}
                            </button>
                          </div>

                          <div className="col-span-2 text-right">
                            <button
                              onClick={() => removeItem(item.id)}
                              className="p-1.5 rounded-lg hover:bg-red-50 text-[#7a7060] hover:text-red-600 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </>
                  )}

                  {/* Add ingredient button */}
                  <div className="px-6 py-3 border-t border-gray-100">
                    <button
                      onClick={() => openAddItem(cat.id)}
                      className="flex items-center gap-2 text-sm text-[#3d6b2a] hover:text-[#2f5720] font-medium transition-colors"
                    >
                      <Plus size={16} />
                      Add Ingredient
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ═══ Category Modal ═══ */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">
                {editingCategory ? "Edit Step" : "New Customization Step"}
              </h2>
              <button onClick={() => setShowCategoryModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X size={20} className="text-[#9a9080]" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1.5">Step Name</label>
                <input
                  type="text"
                  value={categoryForm.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setCategoryForm(prev => ({
                      ...prev,
                      name,
                      slug: prev.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
                    }));
                  }}
                  placeholder="e.g., Base, Protein, Toppings"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-[#3d6b2a]/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1.5">Description</label>
                <input
                  type="text"
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Helper text shown to customers"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-[#3d6b2a]/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1.5">Min Selections</label>
                  <input
                    type="number"
                    value={categoryForm.min_selections}
                    onChange={(e) => setCategoryForm(prev => ({ ...prev, min_selections: parseInt(e.target.value) || 0 }))}
                    min="0"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-[#3d6b2a]/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1.5">Max Selections</label>
                  <input
                    type="number"
                    value={categoryForm.max_selections}
                    onChange={(e) => setCategoryForm(prev => ({ ...prev, max_selections: parseInt(e.target.value) || 1 }))}
                    min="-1"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-[#3d6b2a]/50"
                  />
                  <p className="text-xs text-[#7a7060] mt-1">Use -1 for unlimited</p>
                </div>
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                  <input
                    type="checkbox"
                    checked={categoryForm.is_required}
                    onChange={(e) => setCategoryForm(prev => ({ ...prev, is_required: e.target.checked }))}
                    className="w-4 h-4 rounded accent-[#3d6b2a]"
                  />
                  <span className="text-sm font-medium text-gray-900">Required step</span>
                </label>

                <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                  <input
                    type="checkbox"
                    checked={categoryForm.is_active}
                    onChange={(e) => setCategoryForm(prev => ({ ...prev, is_active: e.target.checked }))}
                    className="w-4 h-4 rounded accent-[#3d6b2a]"
                  />
                  <span className="text-sm font-medium text-gray-900">Active (visible to customers)</span>
                </label>
              </div>
            </div>

            <div className="flex gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowCategoryModal(false)}
                className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 text-gray-900 rounded-xl hover:bg-gray-100 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={saveCategory}
                disabled={saving || !categoryForm.name.trim()}
                className="flex-1 px-4 py-2.5 bg-[#3d6b2a] hover:bg-[#2f5720] text-white rounded-xl transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {editingCategory ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Add Ingredient Modal ═══ */}
      {showAddItemModal && (
        <div className="fixed inset-0 bg-black/20 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">Add Ingredient</h2>
              <button onClick={() => setShowAddItemModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X size={20} className="text-[#9a9080]" />
              </button>
            </div>

            <div className="p-4 border-b border-gray-100">
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7a7060]" />
                <input
                  type="text"
                  value={itemSearch}
                  onChange={(e) => setItemSearch(e.target.value)}
                  placeholder="Search ingredients..."
                  autoFocus
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-[#3d6b2a]/50"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              {filteredIngredients.length === 0 ? (
                <p className="text-center text-[#7a7060] py-8 text-sm">No ingredients found</p>
              ) : (
                filteredIngredients.map((ing) => {
                  const alreadyAdded = usedIngredientIds.has(ing.id);
                  return (
                    <button
                      key={ing.id}
                      onClick={() => !alreadyAdded && addItemToCategory(ing.id)}
                      disabled={alreadyAdded}
                      className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-colors ${
                        alreadyAdded
                          ? "opacity-40 cursor-not-allowed"
                          : "hover:bg-gray-50 cursor-pointer"
                      }`}
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">{ing.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-[#9a9080]">{ing.category}</span>
                          <span className="text-xs text-[#7a7060]">·</span>
                          <span className="text-xs text-[#9a9080]">{ing.calories_per_unit} cal</span>
                          <span className="text-xs text-[#7a7060]">·</span>
                          <span className="text-xs text-[#9a9080]">${ing.cost_per_unit.toFixed(2)}/unit</span>
                        </div>
                      </div>
                      {alreadyAdded ? (
                        <span className="text-xs text-[#7a7060] font-medium">Added</span>
                      ) : (
                        <Plus size={18} className="text-[#3d6b2a]" />
                      )}
                    </button>
                  );
                })
              )}
            </div>

            <div className="p-4 border-t border-gray-200">
              <button
                onClick={() => setShowAddItemModal(false)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 text-gray-900 rounded-xl hover:bg-gray-100 transition-colors font-medium"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
