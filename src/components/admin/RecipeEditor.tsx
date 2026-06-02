"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  ArrowLeft, Save, Plus, X, Trash2, GripVertical,
  ChevronDown, ChevronUp, Search, Scale,
  Bookmark, AlertCircle, Check, Loader2,
  Clock, DollarSign, Flame, Leaf
} from "lucide-react";
import { useRouter } from "next/navigation";

// ── Types ──
interface IngredientData {
  id: string;
  name: string;
  category: string;
  unit_type: string;
  cost_per_unit: number;
  calories_per_unit: number;
  protein_per_unit: number;
  carbs_per_unit: number;
  fat_per_unit: number;
  fiber_per_unit: number;
  sodium_per_unit: number;
  sugar_per_unit: number;
  cholesterol_per_unit: number;
  saturated_fat_per_unit: number;
  trans_fat_per_unit: number;
  allergens: string[];
  is_organic: boolean;
  is_gluten_free: boolean;
  is_vegan: boolean;
  is_vegetarian: boolean;
}

interface RecipeIngredientRow {
  id?: string;
  ingredient_id: string;
  ingredient?: IngredientData;
  quantity: number;
  unit_type: string;
  is_default: boolean;
  is_removable: boolean;
  is_substitutable: boolean;
  substitute_group: string;
  display_name: string;
  sort_order: number;
}

interface RecipeStep {
  id?: string;
  step_number: number;
  instruction: string;
  duration_minutes: number | null;
  tip: string;
}

interface RecipePreset {
  id?: string;
  name: string;
  scale_factor: number;
  servings: number;
  notes: string;
  is_default: boolean;
}

interface NutritionFacts {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sodium: number;
  sugar: number;
  cholesterol: number;
  saturated_fat: number;
  trans_fat: number;
}

interface RecipeData {
  id?: string;
  name: string;
  description: string;
  category: string;
  cuisine_type: string;
  base_price: number;
  cost_to_make: number;
  prep_time_minutes: number | null;
  cook_time_minutes: number | null;
  servings: number;
  serving_size: string;
  yield_amount: string;
  yield_unit: string;
  spice_level: number;
  dietary_flags: string[];
  tags: string[];
  is_customizable: boolean;
  is_featured: boolean;
  is_available: boolean;
  is_seasonal: boolean;
}

// ── Constants ──
const CATEGORIES = ["bowl", "wrap", "salad", "side", "drink", "dessert", "snack", "custom"];
const CUISINE_TYPES = ["american", "asian", "mexican", "mediterranean", "middle-eastern", "indian", "fusion"];
const DIETARY_FLAGS = ["vegan", "vegetarian", "gluten-free", "dairy-free", "keto", "paleo"];
const UNIT_TYPES = ["g", "ml", "oz", "cup", "tbsp", "tsp", "piece", "lb", "kg", "each"];
const STORE_ID = "b0000000-0000-0000-0000-000000000001";

const DAILY_VALUES: Record<string, number> = {
  fat: 78, saturated_fat: 20, cholesterol: 300, sodium: 2300,
  carbs: 275, fiber: 28, sugar: 50, protein: 50,
};

function convertToBaseUnit(quantity: number, fromUnit: string, toUnit: string): number {
  if (fromUnit === toUnit) return quantity;
  const toGrams: Record<string, number> = {
    g: 1, kg: 1000, oz: 28.3495, lb: 453.592,
    ml: 1, cup: 236.588, tbsp: 14.787, tsp: 4.929,
    piece: 1, each: 1,
  };
  return quantity * (toGrams[fromUnit] || 1) / (toGrams[toUnit] || 1);
}

export default function RecipeEditor({ recipeId }: { recipeId?: string }) {
  const router = useRouter();
  const supabase = createClient();
  const isNew = !recipeId;

  const [recipe, setRecipe] = useState<RecipeData>({
    name: "", description: "", category: "bowl", cuisine_type: "fusion",
    base_price: 14.99, cost_to_make: 0, prep_time_minutes: null,
    cook_time_minutes: null, servings: 1, serving_size: "1 bowl",
    yield_amount: "", yield_unit: "", spice_level: 1,
    dietary_flags: [], tags: [], is_customizable: true,
    is_featured: false, is_available: true, is_seasonal: false,
  });
  const [ingredients, setIngredients] = useState<RecipeIngredientRow[]>([]);
  const [steps, setSteps] = useState<RecipeStep[]>([]);
  const [presets, setPresets] = useState<RecipePreset[]>([]);

  const [activeTab, setActiveTab] = useState<"details" | "ingredients" | "steps" | "nutrition" | "presets">("details");
  const [allIngredients, setAllIngredients] = useState<IngredientData[]>([]);
  const [ingredientSearch, setIngredientSearch] = useState("");
  const [showIngredientDropdown, setShowIngredientDropdown] = useState(false);
  const [scaleFactor, setScaleFactor] = useState(1);
  const [customScale, setCustomScale] = useState("");
  const [showCustomScale, setShowCustomScale] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">("idle");
  const [isLoading, setIsLoading] = useState(!!recipeId);
  const [tagInput, setTagInput] = useState("");
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set());

  // Load all available ingredients
  useEffect(() => {
    supabase
      .from("ingredients")
      .select("*")
      .eq("store_id", STORE_ID)
      .eq("is_available", true)
      .order("name")
      .then(({ data }) => { if (data) setAllIngredients(data); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load existing recipe
  useEffect(() => {
    if (!recipeId) return;
    (async () => {
      setIsLoading(true);
      try {
        const { data: r } = await supabase.from("recipes").select("*").eq("id", recipeId).single();
        if (r) {
          setRecipe({
            id: r.id, name: r.name, description: r.description || "",
            category: r.category, cuisine_type: r.cuisine_type || "fusion",
            base_price: Number(r.base_price), cost_to_make: Number(r.cost_to_make),
            prep_time_minutes: r.prep_time_minutes, cook_time_minutes: r.cook_time_minutes,
            servings: r.servings || 1, serving_size: r.serving_size || "",
            yield_amount: r.yield_amount || "", yield_unit: r.yield_unit || "",
            spice_level: r.spice_level || 1, dietary_flags: r.dietary_flags || [],
            tags: r.tags || [], is_customizable: r.is_customizable ?? true,
            is_featured: r.is_featured ?? false, is_available: r.is_available ?? true,
            is_seasonal: r.is_seasonal ?? false,
          });
        }

        const { data: ri } = await supabase
          .from("recipe_ingredients")
          .select("*, ingredients(*)")
          .eq("recipe_id", recipeId)
          .order("sort_order");
        if (ri) {
          setIngredients(ri.map((row: Record<string, unknown>) => ({
            id: row.id as string,
            ingredient_id: row.ingredient_id as string,
            ingredient: row.ingredients as IngredientData,
            quantity: Number(row.quantity),
            unit_type: row.unit_type as string,
            is_default: row.is_default as boolean,
            is_removable: row.is_removable as boolean,
            is_substitutable: row.is_substitutable as boolean,
            substitute_group: (row.substitute_group as string) || "",
            display_name: (row.display_name as string) || "",
            sort_order: row.sort_order as number,
          })));
        }

        const { data: st } = await supabase.from("recipe_steps").select("*").eq("recipe_id", recipeId).order("step_number");
        if (st) setSteps(st.map((s: Record<string, unknown>) => ({
          id: s.id as string, step_number: s.step_number as number,
          instruction: s.instruction as string, duration_minutes: s.duration_minutes as number | null,
          tip: (s.tip as string) || "",
        })));

        const { data: pr } = await supabase.from("recipe_presets").select("*").eq("recipe_id", recipeId).order("name");
        if (pr) setPresets(pr.map((p: Record<string, unknown>) => ({
          id: p.id as string, name: p.name as string, scale_factor: Number(p.scale_factor),
          servings: p.servings as number, notes: (p.notes as string) || "", is_default: p.is_default as boolean,
        })));
      } catch (err) {
        console.error("Error loading recipe:", err);
      } finally {
        setIsLoading(false);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipeId]);

  // ── Nutrition calculation ──
  const nutrition = useMemo<NutritionFacts>(() => {
    const t: NutritionFacts = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sodium: 0, sugar: 0, cholesterol: 0, saturated_fat: 0, trans_fat: 0 };
    for (const ri of ingredients) {
      const ing = ri.ingredient || allIngredients.find(i => i.id === ri.ingredient_id);
      if (!ing) continue;
      const qty = convertToBaseUnit(ri.quantity, ri.unit_type, ing.unit_type);
      t.calories += ing.calories_per_unit * qty;
      t.protein += ing.protein_per_unit * qty;
      t.carbs += ing.carbs_per_unit * qty;
      t.fat += ing.fat_per_unit * qty;
      t.fiber += ing.fiber_per_unit * qty;
      t.sodium += ing.sodium_per_unit * qty;
      t.sugar += ing.sugar_per_unit * qty;
      t.cholesterol += ing.cholesterol_per_unit * qty;
      t.saturated_fat += ing.saturated_fat_per_unit * qty;
      t.trans_fat += ing.trans_fat_per_unit * qty;
    }
    const s = recipe.servings || 1;
    return {
      calories: Math.round(t.calories / s), protein: Math.round(t.protein * 10 / s) / 10,
      carbs: Math.round(t.carbs * 10 / s) / 10, fat: Math.round(t.fat * 10 / s) / 10,
      fiber: Math.round(t.fiber * 10 / s) / 10, sodium: Math.round(t.sodium / s),
      sugar: Math.round(t.sugar * 10 / s) / 10, cholesterol: Math.round(t.cholesterol / s),
      saturated_fat: Math.round(t.saturated_fat * 10 / s) / 10, trans_fat: Math.round(t.trans_fat * 10 / s) / 10,
    };
  }, [ingredients, allIngredients, recipe.servings]);

  const calculatedCost = useMemo(() => {
    let total = 0;
    for (const ri of ingredients) {
      const ing = ri.ingredient || allIngredients.find(i => i.id === ri.ingredient_id);
      if (!ing) continue;
      total += ing.cost_per_unit * convertToBaseUnit(ri.quantity, ri.unit_type, ing.unit_type);
    }
    return Math.round(total * 100) / 100;
  }, [ingredients, allIngredients]);

  const aggregatedAllergens = useMemo(() => {
    const s = new Set<string>();
    for (const ri of ingredients) {
      const ing = ri.ingredient || allIngredients.find(i => i.id === ri.ingredient_id);
      if (ing?.allergens) for (const a of ing.allergens) s.add(a);
    }
    return Array.from(s).sort();
  }, [ingredients, allIngredients]);

  const filteredIngredients = useMemo(() => {
    if (!ingredientSearch.trim()) return allIngredients.slice(0, 20);
    const q = ingredientSearch.toLowerCase();
    return allIngredients.filter(i => i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q)).slice(0, 20);
  }, [ingredientSearch, allIngredients]);

  const scaled = (qty: number) => Math.round(qty * scaleFactor * 100) / 100;

  const addIngredient = (ing: IngredientData) => {
    if (ingredients.some(ri => ri.ingredient_id === ing.id)) return;
    setIngredients(prev => [...prev, {
      ingredient_id: ing.id, ingredient: ing, quantity: 1, unit_type: ing.unit_type,
      is_default: true, is_removable: true, is_substitutable: false,
      substitute_group: "", display_name: "", sort_order: prev.length,
    }]);
    setIngredientSearch("");
    setShowIngredientDropdown(false);
  };

  const removeIngredient = (index: number) => setIngredients(prev => prev.filter((_, i) => i !== index));

  const updateIngredientRow = (index: number, field: string, value: unknown) => {
    setIngredients(prev => prev.map((row, i) => i === index ? { ...row, [field]: value } : row));
  };

  const addStep = () => {
    setSteps(prev => [...prev, { step_number: prev.length + 1, instruction: "", duration_minutes: null, tip: "" }]);
    setExpandedSteps(prev => new Set(prev).add(steps.length));
  };

  const removeStep = (index: number) => {
    setSteps(prev => prev.filter((_, i) => i !== index).map((s, i) => ({ ...s, step_number: i + 1 })));
  };

  const updateStep = (index: number, field: string, value: unknown) => {
    setSteps(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));
  };

  const setScale = (factor: number) => { setScaleFactor(factor); setShowCustomScale(false); };
  const applyCustomScale = () => { const v = parseFloat(customScale); if (v > 0) { setScaleFactor(v); setShowCustomScale(false); } };

  const saveCurrentAsPreset = () => {
    const name = prompt("Preset name:");
    if (!name) return;
    setPresets(prev => [...prev, { name, scale_factor: scaleFactor, servings: Math.round(recipe.servings * scaleFactor), notes: "", is_default: false }]);
  };

  const loadPreset = (preset: RecipePreset) => setScaleFactor(preset.scale_factor);
  const deletePreset = (index: number) => setPresets(prev => prev.filter((_, i) => i !== index));

  const addTag = () => {
    if (tagInput.trim() && !recipe.tags.includes(tagInput.trim())) {
      setRecipe(prev => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }));
      setTagInput("");
    }
  };

  // ── SAVE ──
  const handleSave = async () => {
    if (!recipe.name.trim()) { alert("Recipe name is required"); return; }
    setIsSaving(true);
    setSaveStatus("idle");
    try {
      const slug = recipe.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const costToUse = calculatedCost > 0 ? calculatedCost : recipe.cost_to_make;
      const payload = {
        store_id: STORE_ID, name: recipe.name, slug,
        description: recipe.description || null, category: recipe.category,
        cuisine_type: recipe.cuisine_type, base_price: recipe.base_price,
        cost_to_make: costToUse, profit_margin: recipe.base_price - costToUse,
        prep_time_minutes: recipe.prep_time_minutes, cook_time_minutes: recipe.cook_time_minutes,
        servings: recipe.servings, serving_size: recipe.serving_size || null,
        yield_amount: recipe.yield_amount || null, yield_unit: recipe.yield_unit || null,
        spice_level: recipe.spice_level, dietary_flags: recipe.dietary_flags, tags: recipe.tags,
        is_customizable: recipe.is_customizable, is_featured: recipe.is_featured,
        is_available: recipe.is_available, is_seasonal: recipe.is_seasonal,
      };

      let savedId = recipeId;
      if (recipeId) {
        const { error } = await supabase.from("recipes").update(payload).eq("id", recipeId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("recipes").insert([payload]).select("id").single();
        if (error) throw error;
        savedId = data.id;
      }

      // Ingredients
      await supabase.from("recipe_ingredients").delete().eq("recipe_id", savedId!);
      if (ingredients.length > 0) {
        const { error } = await supabase.from("recipe_ingredients").insert(
          ingredients.map((ri, i) => ({
            recipe_id: savedId!, ingredient_id: ri.ingredient_id, quantity: ri.quantity,
            unit_type: ri.unit_type, is_default: ri.is_default, is_removable: ri.is_removable,
            is_substitutable: ri.is_substitutable, substitute_group: ri.substitute_group || null,
            display_name: ri.display_name || null, sort_order: i,
          }))
        );
        if (error) throw error;
      }

      // Steps
      await supabase.from("recipe_steps").delete().eq("recipe_id", savedId!);
      if (steps.length > 0) {
        const { error } = await supabase.from("recipe_steps").insert(
          steps.map((s, i) => ({
            recipe_id: savedId!, step_number: i + 1, instruction: s.instruction,
            duration_minutes: s.duration_minutes, tip: s.tip || null,
          }))
        );
        if (error) throw error;
      }

      // Presets
      await supabase.from("recipe_presets").delete().eq("recipe_id", savedId!);
      if (presets.length > 0) {
        const { error } = await supabase.from("recipe_presets").insert(
          presets.map(p => ({
            recipe_id: savedId!, name: p.name, scale_factor: p.scale_factor,
            servings: p.servings, notes: p.notes || null, is_default: p.is_default,
          }))
        );
        if (error) throw error;
      }

      // Nutrition label
      await supabase.from("nutrition_labels").delete().eq("recipe_id", savedId!);
      if (ingredients.length > 0) {
        await supabase.from("nutrition_labels").insert({
          recipe_id: savedId!, serving_size: recipe.serving_size || `1/${recipe.servings}`,
          calories: nutrition.calories, total_fat: nutrition.fat, saturated_fat: nutrition.saturated_fat,
          trans_fat: nutrition.trans_fat, cholesterol: nutrition.cholesterol, sodium: nutrition.sodium,
          total_carbs: nutrition.carbs, fiber: nutrition.fiber, sugar: nutrition.sugar,
          protein: nutrition.protein, allergens: aggregatedAllergens, is_current: true,
        });
      }

      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
      if (isNew && savedId) router.replace(`/admin/menu/recipes/${savedId}/edit`);
    } catch (err) {
      console.error("Save error:", err);
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-[#3d6b2a]" /></div>;
  }

  const profitMargin = recipe.base_price - (calculatedCost > 0 ? calculatedCost : recipe.cost_to_make);
  const marginPercent = recipe.base_price > 0 ? ((profitMargin / recipe.base_price) * 100).toFixed(1) : "0";

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/admin/menu/recipes")} className="p-2 hover:bg-[#f0ece3] rounded-xl transition-colors">
            <ArrowLeft size={20} className="text-[#9a9080]" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-[#1e2d18]">{isNew ? "New Recipe" : recipe.name || "Edit Recipe"}</h1>
            <p className="text-sm text-[#9a9080]">{ingredients.length} ingredient{ingredients.length !== 1 ? "s" : ""} · {steps.length} step{steps.length !== 1 ? "s" : ""} · {nutrition.calories} cal/serving</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {saveStatus === "saved" && <span className="flex items-center gap-1.5 text-sm text-[#3d6b2a] font-medium"><Check size={16} /> Saved</span>}
          {saveStatus === "error" && <span className="flex items-center gap-1.5 text-sm text-red-600 font-medium"><AlertCircle size={16} /> Error saving</span>}
          <button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2 px-5 py-2.5 bg-[#3d6b2a] hover:bg-[#2f5720] text-white rounded-xl font-medium transition-colors disabled:opacity-50">
            {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            {isSaving ? "Saving..." : "Save Recipe"}
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        {[
          { label: "Price", value: `$${recipe.base_price.toFixed(2)}` },
          { label: "Cost", value: `$${(calculatedCost > 0 ? calculatedCost : recipe.cost_to_make).toFixed(2)}` },
          { label: "Margin", value: `${marginPercent}%`, color: profitMargin > 0 ? "text-[#3d6b2a]" : "text-red-600" },
          { label: "Calories", value: `${nutrition.calories}` },
          { label: "Protein", value: `${nutrition.protein}g` },
          { label: "Servings", value: `${recipe.servings}` },
        ].map(s => (
          <div key={s.label} className="bg-white border border-gray-200 rounded-xl p-3">
            <p className="text-xs text-[#9a9080] mb-1">{s.label}</p>
            <p className={`text-lg font-bold ${s.color || "text-gray-900"}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
        {(["details", "ingredients", "steps", "nutrition", "presets"] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`flex-1 px-4 py-2.5 rounded-lg font-medium text-sm transition-all capitalize ${activeTab === tab ? "bg-white text-gray-900 shadow-sm" : "text-[#9a9080] hover:text-gray-700"}`}>
            {tab === "nutrition" ? "Nutrition Facts" : tab}
          </button>
        ))}
      </div>

      {/* ═══ DETAILS TAB ═══ */}
      {activeTab === "details" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-semibold text-[#9a9080] uppercase tracking-wide">Basic Information</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Name *</label>
                <input type="text" value={recipe.name} onChange={e => setRecipe(p => ({ ...p, name: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-base focus:outline-none focus:border-[#3d6b2a]/50" placeholder="Recipe name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                <textarea value={recipe.description} onChange={e => setRecipe(p => ({ ...p, description: e.target.value }))} rows={3}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-base focus:outline-none focus:border-[#3d6b2a]/50 resize-none" placeholder="Describe the dish..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Category *</label>
                  <select value={recipe.category} onChange={e => setRecipe(p => ({ ...p, category: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-base focus:outline-none focus:border-[#3d6b2a]/50">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Cuisine</label>
                  <select value={recipe.cuisine_type} onChange={e => setRecipe(p => ({ ...p, cuisine_type: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-base focus:outline-none focus:border-[#3d6b2a]/50">
                    {CUISINE_TYPES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-semibold text-[#9a9080] uppercase tracking-wide">Timing & Yield</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Prep Time (min)</label>
                  <input type="number" min="0" value={recipe.prep_time_minutes ?? ""} onChange={e => setRecipe(p => ({ ...p, prep_time_minutes: e.target.value ? parseInt(e.target.value) : null }))}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-base focus:outline-none focus:border-[#3d6b2a]/50" placeholder="15" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Cook Time (min)</label>
                  <input type="number" min="0" value={recipe.cook_time_minutes ?? ""} onChange={e => setRecipe(p => ({ ...p, cook_time_minutes: e.target.value ? parseInt(e.target.value) : null }))}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-base focus:outline-none focus:border-[#3d6b2a]/50" placeholder="10" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Servings</label>
                  <input type="number" min="1" value={recipe.servings} onChange={e => setRecipe(p => ({ ...p, servings: parseInt(e.target.value) || 1 }))}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-base focus:outline-none focus:border-[#3d6b2a]/50" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Serving Size</label>
                  <input type="text" value={recipe.serving_size} onChange={e => setRecipe(p => ({ ...p, serving_size: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-base focus:outline-none focus:border-[#3d6b2a]/50" placeholder="1 bowl (350g)" />
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-semibold text-[#9a9080] uppercase tracking-wide">Pricing</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Base Price *</label>
                  <div className="relative">
                    <DollarSign size={16} className="absolute left-3 top-3 text-[#7a7060]" />
                    <input type="number" step="0.01" min="0" value={recipe.base_price} onChange={e => setRecipe(p => ({ ...p, base_price: parseFloat(e.target.value) || 0 }))}
                      className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-base focus:outline-none focus:border-[#3d6b2a]/50" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Cost{calculatedCost > 0 && <span className="text-xs text-[#3d6b2a] ml-1">(auto: ${calculatedCost.toFixed(2)})</span>}</label>
                  <div className="relative">
                    <DollarSign size={16} className="absolute left-3 top-3 text-[#7a7060]" />
                    <input type="number" step="0.01" min="0" value={calculatedCost > 0 ? calculatedCost : recipe.cost_to_make}
                      onChange={e => setRecipe(p => ({ ...p, cost_to_make: parseFloat(e.target.value) || 0 }))}
                      readOnly={calculatedCost > 0}
                      className={`w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-base focus:outline-none focus:border-[#3d6b2a]/50 ${calculatedCost > 0 ? "opacity-70 cursor-not-allowed" : ""}`} />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 px-4 py-3 bg-[#3d6b2a]/5 border border-[#3d6b2a]/10 rounded-xl">
                <span className="text-sm text-[#9a9080]">Profit Margin:</span>
                <span className={`text-sm font-bold ${profitMargin > 0 ? "text-[#3d6b2a]" : "text-red-600"}`}>${profitMargin.toFixed(2)} ({marginPercent}%)</span>
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-[#9a9080] uppercase tracking-wide">Spice Level</h3>
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Flame key={i} size={16} className={i < recipe.spice_level ? "text-orange-500 fill-orange-500" : "text-[#4a5e3a]"} onClick={() => setRecipe(p => ({ ...p, spice_level: i + 1 }))} style={{ cursor: "pointer" }} />
                  ))}
                </div>
              </div>
              <input type="range" min="1" max="5" value={recipe.spice_level} onChange={e => setRecipe(p => ({ ...p, spice_level: parseInt(e.target.value) }))} className="w-full accent-orange-500" />
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-3">
              <h3 className="text-sm font-semibold text-[#9a9080] uppercase tracking-wide">Dietary Flags</h3>
              <div className="grid grid-cols-2 gap-2">
                {DIETARY_FLAGS.map(flag => (
                  <label key={flag} className="flex items-center gap-2.5 p-2.5 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer">
                    <input type="checkbox" checked={recipe.dietary_flags.includes(flag)}
                      onChange={() => setRecipe(p => ({ ...p, dietary_flags: p.dietary_flags.includes(flag) ? p.dietary_flags.filter(f => f !== flag) : [...p.dietary_flags, flag] }))}
                      className="w-4 h-4 rounded accent-[#3d6b2a]" />
                    <span className="text-sm font-medium text-gray-700 capitalize">{flag}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-3">
              <h3 className="text-sm font-semibold text-[#9a9080] uppercase tracking-wide">Tags</h3>
              <div className="flex gap-2">
                <input type="text" value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addTag())}
                  className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-base focus:outline-none focus:border-[#3d6b2a]/50" placeholder="Add a tag..." />
                <button type="button" onClick={addTag} className="px-3 py-2.5 bg-[#3d6b2a]/10 text-[#3d6b2a] rounded-xl hover:bg-[#3d6b2a]/20"><Plus size={18} /></button>
              </div>
              {recipe.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {recipe.tags.map(tag => (
                    <span key={tag} className="flex items-center gap-1.5 px-3 py-1 bg-[#3d6b2a]/10 text-[#3d6b2a] rounded-full text-sm font-medium">
                      {tag}
                      <button onClick={() => setRecipe(p => ({ ...p, tags: p.tags.filter(t => t !== tag) }))}><X size={14} /></button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-3">
              <h3 className="text-sm font-semibold text-[#9a9080] uppercase tracking-wide">Options</h3>
              {[{ key: "is_customizable", label: "Allow Customization" }, { key: "is_featured", label: "Featured Item" }, { key: "is_available", label: "Available" }, { key: "is_seasonal", label: "Seasonal" }].map(opt => (
                <label key={opt.key} className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer">
                  <input type="checkbox" checked={(recipe as unknown as Record<string, unknown>)[opt.key] as boolean}
                    onChange={() => setRecipe(p => ({ ...p, [opt.key]: !(p as unknown as Record<string, unknown>)[opt.key] }))}
                    className="w-4 h-4 rounded accent-[#3d6b2a]" />
                  <span className="text-sm font-medium text-gray-700">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══ INGREDIENTS TAB ═══ */}
      {activeTab === "ingredients" && (
        <div className="space-y-4">
          {/* Scale Controls */}
          <div className="bg-white border border-gray-200 rounded-2xl p-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <Scale size={18} className="text-[#9a9080]" />
                <span className="text-sm font-medium text-gray-700">Scale Recipe:</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {[{ label: "½x", factor: 0.5 }, { label: "1x", factor: 1 }, { label: "2x", factor: 2 }, { label: "3x", factor: 3 }, { label: "5x", factor: 5 }, { label: "10x", factor: 10 }].map(s => (
                  <button key={s.label} onClick={() => setScale(s.factor)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${scaleFactor === s.factor ? "bg-[#3d6b2a] text-white" : "bg-gray-100 text-[#9a9080] hover:bg-gray-200"}`}>
                    {s.label}
                  </button>
                ))}
                {showCustomScale ? (
                  <div className="flex items-center gap-1">
                    <input type="number" step="0.1" min="0.1" autoFocus value={customScale} onChange={e => setCustomScale(e.target.value)} onKeyDown={e => e.key === "Enter" && applyCustomScale()}
                      className="w-16 px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-center" placeholder="1.5" />
                    <button onClick={applyCustomScale} className="px-2 py-1.5 bg-[#3d6b2a] text-white rounded-lg text-sm"><Check size={14} /></button>
                  </div>
                ) : (
                  <button onClick={() => setShowCustomScale(true)} className="px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 text-[#9a9080] hover:bg-gray-200">Custom</button>
                )}
                {scaleFactor !== 1 && <span className="text-xs text-[#9a9080] ml-2">({Math.round(recipe.servings * scaleFactor)} servings)</span>}
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="bg-white border border-gray-200 rounded-2xl p-4">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-3 text-[#7a7060]" />
              <input type="text" value={ingredientSearch} onChange={e => { setIngredientSearch(e.target.value); setShowIngredientDropdown(true); }} onFocus={() => setShowIngredientDropdown(true)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-base focus:outline-none focus:border-[#3d6b2a]/50" placeholder="Search ingredients to add..." />
              {showIngredientDropdown && filteredIngredients.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto z-20">
                  {filteredIngredients.map(ing => {
                    const already = ingredients.some(ri => ri.ingredient_id === ing.id);
                    return (
                      <button key={ing.id} onClick={() => !already && addIngredient(ing)} disabled={already}
                        className={`w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-gray-50 transition-colors ${already ? "opacity-40 cursor-not-allowed" : ""}`}>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{ing.name}</p>
                          <p className="text-xs text-[#9a9080]">{ing.category} · {ing.calories_per_unit} cal/{ing.unit_type} · ${ing.cost_per_unit}/{ing.unit_type}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {ing.is_organic && <Leaf size={14} className="text-[#3d6b2a]" />}
                          {already ? <span className="text-xs text-[#7a7060]">Added</span> : <Plus size={16} className="text-[#3d6b2a]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            {showIngredientDropdown && <div className="fixed inset-0 z-10" onClick={() => setShowIngredientDropdown(false)} />}
          </div>

          {/* Ingredient List */}
          {ingredients.length === 0 ? (
            <div className="bg-white border border-gray-200 border-dashed rounded-2xl p-12 text-center">
              <p className="text-[#9a9080] mb-2">No ingredients added yet</p>
              <p className="text-sm text-[#7a7060]">Search above to add ingredients</p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="hidden lg:grid grid-cols-12 gap-2 px-4 py-2 text-xs font-semibold text-[#9a9080] uppercase tracking-wide">
                <div className="col-span-3">Ingredient</div>
                <div className="col-span-1 text-center">Qty</div>
                <div className="col-span-1">Unit</div>
                <div className="col-span-1 text-right">Cal</div>
                <div className="col-span-1 text-right">Protein</div>
                <div className="col-span-1 text-right">Cost</div>
                <div className="col-span-1 text-center">Default</div>
                <div className="col-span-1 text-center">Removable</div>
                <div className="col-span-1"></div>
              </div>
              {ingredients.map((ri, index) => {
                const ing = ri.ingredient || allIngredients.find(i => i.id === ri.ingredient_id);
                if (!ing) return null;
                const qty = convertToBaseUnit(ri.quantity * scaleFactor, ri.unit_type, ing.unit_type);
                const rowCal = Math.round(ing.calories_per_unit * qty);
                const rowProt = Math.round(ing.protein_per_unit * qty * 10) / 10;
                const rowCost = Math.round(ing.cost_per_unit * qty * 100) / 100;
                return (
                  <div key={ri.ingredient_id} className="grid grid-cols-12 gap-2 items-center bg-white border border-gray-200 rounded-xl px-4 py-3 hover:border-[#3d6b2a]/20 transition-colors">
                    <div className="col-span-3 flex items-center gap-2">
                      <GripVertical size={14} className="text-[#4a5e3a] flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{ri.display_name || ing.name}</p>
                        <p className="text-xs text-[#7a7060]">{ing.category}</p>
                      </div>
                    </div>
                    <div className="col-span-1">
                      <input type="number" step="0.01" min="0" value={ri.quantity} onChange={e => updateIngredientRow(index, "quantity", parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-center focus:outline-none focus:border-[#3d6b2a]/50" />
                      {scaleFactor !== 1 && <p className="text-xs text-[#3d6b2a] text-center mt-0.5">{scaled(ri.quantity)}</p>}
                    </div>
                    <div className="col-span-1">
                      <select value={ri.unit_type} onChange={e => updateIngredientRow(index, "unit_type", e.target.value)}
                        className="w-full px-1 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#3d6b2a]/50">
                        {UNIT_TYPES.map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </div>
                    <div className="col-span-1 text-right text-sm text-gray-700">{rowCal}</div>
                    <div className="col-span-1 text-right text-sm text-gray-700">{rowProt}g</div>
                    <div className="col-span-1 text-right text-sm text-gray-700">${rowCost.toFixed(2)}</div>
                    <div className="col-span-1 text-center">
                      <input type="checkbox" checked={ri.is_default} onChange={() => updateIngredientRow(index, "is_default", !ri.is_default)} className="w-4 h-4 rounded accent-[#3d6b2a]" />
                    </div>
                    <div className="col-span-1 text-center">
                      <input type="checkbox" checked={ri.is_removable} onChange={() => updateIngredientRow(index, "is_removable", !ri.is_removable)} className="w-4 h-4 rounded accent-[#3d6b2a]" />
                    </div>
                    <div className="col-span-1 text-right">
                      <button onClick={() => removeIngredient(index)} className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
                    </div>
                  </div>
                );
              })}
              {/* Totals */}
              <div className="grid grid-cols-12 gap-2 items-center bg-[#3d6b2a]/5 border border-[#3d6b2a]/10 rounded-xl px-4 py-3 font-semibold">
                <div className="col-span-3 text-sm text-gray-700">Total ({ingredients.length} ingredients)</div>
                <div className="col-span-2"></div>
                <div className="col-span-1 text-right text-sm text-gray-900">{Math.round(nutrition.calories * recipe.servings)}</div>
                <div className="col-span-1 text-right text-sm text-gray-900">{(nutrition.protein * recipe.servings).toFixed(1)}g</div>
                <div className="col-span-1 text-right text-sm text-[#3d6b2a]">${(calculatedCost * scaleFactor).toFixed(2)}</div>
                <div className="col-span-3"></div>
              </div>
            </div>
          )}
          {aggregatedAllergens.length > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
              <div className="flex items-start gap-2">
                <AlertCircle size={18} className="text-orange-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-orange-800">Allergens:</p>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {aggregatedAllergens.map(a => <span key={a} className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs font-medium">{a}</span>)}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ STEPS TAB ═══ */}
      {activeTab === "steps" && (
        <div className="space-y-4">
          {steps.length === 0 ? (
            <div className="bg-white border border-gray-200 border-dashed rounded-2xl p-12 text-center">
              <p className="text-[#9a9080] mb-3">No preparation steps yet</p>
              <button onClick={addStep} className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#3d6b2a] text-white rounded-xl font-medium hover:bg-[#2f5720]"><Plus size={18} /> Add First Step</button>
            </div>
          ) : steps.map((step, index) => {
            const isExp = expandedSteps.has(index);
            return (
              <div key={index} className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50" onClick={() => setExpandedSteps(p => { const n = new Set(p); n.has(index) ? n.delete(index) : n.add(index); return n; })}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#3d6b2a] text-white flex items-center justify-center text-sm font-bold flex-shrink-0">{step.step_number}</div>
                    <input
                      type="text"
                      value={step.instruction}
                      onChange={e => { e.stopPropagation(); updateStep(index, "instruction", e.target.value); }}
                      onClick={e => e.stopPropagation()}
                      className="text-sm font-medium text-gray-900 bg-transparent border-none outline-none focus:ring-0 w-full truncate placeholder-gray-400"
                      placeholder="Step title..."
                    />
                    {step.duration_minutes && <span className="flex items-center gap-1 text-xs text-[#7a7060]"><Clock size={12} /> {step.duration_minutes}m</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={e => { e.stopPropagation(); removeStep(index); }} className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
                    {isExp ? <ChevronUp size={16} className="text-[#7a7060]" /> : <ChevronDown size={16} className="text-[#7a7060]" />}
                  </div>
                </div>
                {isExp && (
                  <div className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-3">
                    <div>
                      <label className="block text-xs font-medium text-[#9a9080] mb-1">Instruction</label>
                      <textarea value={step.instruction} onChange={e => updateStep(index, "instruction", e.target.value)} rows={3}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-[#3d6b2a]/50 resize-none" placeholder="Describe what to do..." />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-[#9a9080] mb-1">Duration (min)</label>
                        <input type="number" min="0" value={step.duration_minutes ?? ""} onChange={e => updateStep(index, "duration_minutes", e.target.value ? parseInt(e.target.value) : null)}
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-[#3d6b2a]/50" placeholder="5" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[#9a9080] mb-1">Pro Tip</label>
                        <input type="text" value={step.tip} onChange={e => updateStep(index, "tip", e.target.value)}
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-[#3d6b2a]/50" placeholder="Chef tip..." />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          <button onClick={addStep} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-dashed border-gray-300 text-[#9a9080] rounded-2xl hover:border-[#3d6b2a]/30 hover:text-[#3d6b2a] transition-colors">
            <Plus size={18} /> Add Step
          </button>
          {steps.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between">
              <span className="text-sm text-[#9a9080]">Total time from steps:</span>
              <span className="text-sm font-bold text-gray-900">{steps.reduce((t, s) => t + (s.duration_minutes || 0), 0)} minutes</span>
            </div>
          )}
        </div>
      )}

      {/* ═══ NUTRITION TAB ═══ */}
      {activeTab === "nutrition" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* FDA Nutrition Label */}
          <div className="bg-white border-2 border-gray-900 rounded-lg p-5 max-w-sm mx-auto lg:mx-0">
            <h2 className="text-3xl font-black text-gray-900 border-b border-gray-900 pb-1">Nutrition Facts</h2>
            <div className="border-b-8 border-gray-900 py-1">
              <p className="text-sm text-gray-900">{recipe.servings} serving{recipe.servings !== 1 ? "s" : ""} per recipe</p>
              <div className="flex justify-between items-end">
                <p className="text-sm font-bold text-gray-900">Serving size</p>
                <p className="text-sm font-bold text-gray-900">{recipe.serving_size || "1 serving"}</p>
              </div>
            </div>
            <div className="border-b-4 border-gray-900 py-1">
              <p className="text-sm font-bold text-gray-900">Amount per serving</p>
              <div className="flex justify-between items-baseline">
                <p className="text-3xl font-black text-gray-900">Calories</p>
                <p className="text-3xl font-black text-gray-900">{nutrition.calories}</p>
              </div>
            </div>
            <div className="text-right border-b border-gray-300 py-0.5">
              <p className="text-xs font-bold text-gray-900">% Daily Value*</p>
            </div>
            {[
              { label: "Total Fat", val: `${nutrition.fat}g`, dv: Math.round((nutrition.fat / DAILY_VALUES.fat) * 100), bold: true },
              { label: "  Saturated Fat", val: `${nutrition.saturated_fat}g`, dv: Math.round((nutrition.saturated_fat / DAILY_VALUES.saturated_fat) * 100), indent: true },
              { label: "  Trans Fat", val: `${nutrition.trans_fat}g`, dv: null, indent: true },
              { label: "Cholesterol", val: `${nutrition.cholesterol}mg`, dv: Math.round((nutrition.cholesterol / DAILY_VALUES.cholesterol) * 100), bold: true },
              { label: "Sodium", val: `${nutrition.sodium}mg`, dv: Math.round((nutrition.sodium / DAILY_VALUES.sodium) * 100), bold: true },
              { label: "Total Carbohydrate", val: `${nutrition.carbs}g`, dv: Math.round((nutrition.carbs / DAILY_VALUES.carbs) * 100), bold: true },
              { label: "  Dietary Fiber", val: `${nutrition.fiber}g`, dv: Math.round((nutrition.fiber / DAILY_VALUES.fiber) * 100), indent: true },
              { label: "  Total Sugars", val: `${nutrition.sugar}g`, dv: null, indent: true },
              { label: "Protein", val: `${nutrition.protein}g`, dv: Math.round((nutrition.protein / DAILY_VALUES.protein) * 100), bold: true, thick: true },
            ].map((r, i) => (
              <div key={i} className={`flex justify-between py-0.5 border-b ${r.thick ? "border-b-8 border-gray-900" : "border-gray-300"} ${r.indent ? "pl-6" : ""}`}>
                <p className={`text-sm ${r.bold ? "font-bold" : ""} text-gray-900`}>{r.label.trim()} <span className="font-normal">{r.val}</span></p>
                {r.dv !== null && r.dv !== undefined && <p className="text-sm font-bold text-gray-900">{r.dv}%</p>}
              </div>
            ))}
            <p className="text-xs text-[#9a9080] mt-2">* % Daily Value based on a 2,000 calorie diet.</p>
            {ingredients.length === 0 && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-xs text-yellow-700">Add ingredients to auto-calculate nutrition.</p>
              </div>
            )}
          </div>

          <div className="space-y-6">
            {/* Macro Breakdown */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <h3 className="text-sm font-semibold text-[#9a9080] uppercase tracking-wide mb-4">Macro Breakdown</h3>
              {nutrition.calories > 0 ? (() => {
                const pc = nutrition.protein * 4, cc = nutrition.carbs * 4, fc = nutrition.fat * 9;
                const tot = pc + cc + fc || 1;
                return (
                  <div className="space-y-3">
                    {[
                      { label: "Protein", cal: pc, color: "bg-blue-500", pct: Math.round((pc / tot) * 100) },
                      { label: "Carbs", cal: cc, color: "bg-yellow-500", pct: Math.round((cc / tot) * 100) },
                      { label: "Fat", cal: fc, color: "bg-red-400", pct: Math.round((fc / tot) * 100) },
                    ].map(m => (
                      <div key={m.label}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium text-gray-700">{m.label}</span>
                          <span className="text-[#9a9080]">{m.pct}% ({Math.round(m.cal)} cal)</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full ${m.color} rounded-full`} style={{ width: `${m.pct}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })() : <p className="text-sm text-[#7a7060]">No caloric data yet.</p>}
            </div>

            {/* Per-ingredient table */}
            {ingredients.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-2xl p-6">
                <h3 className="text-sm font-semibold text-[#9a9080] uppercase tracking-wide mb-4">Per Ingredient</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-[#9a9080] uppercase border-b border-gray-200">
                        <th className="text-left py-2 pr-3">Ingredient</th>
                        <th className="text-right py-2 px-2">Cal</th>
                        <th className="text-right py-2 px-2">Prot</th>
                        <th className="text-right py-2 px-2">Carbs</th>
                        <th className="text-right py-2 px-2">Fat</th>
                        <th className="text-right py-2 px-2">Fiber</th>
                        <th className="text-right py-2 pl-2">Sodium</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ingredients.map(ri => {
                        const ing = ri.ingredient || allIngredients.find(i => i.id === ri.ingredient_id);
                        if (!ing) return null;
                        const q = convertToBaseUnit(ri.quantity, ri.unit_type, ing.unit_type);
                        return (
                          <tr key={ri.ingredient_id} className="border-b border-gray-100">
                            <td className="py-2 pr-3 font-medium text-gray-900">{ing.name}</td>
                            <td className="text-right py-2 px-2 text-gray-700">{Math.round(ing.calories_per_unit * q)}</td>
                            <td className="text-right py-2 px-2 text-gray-700">{(ing.protein_per_unit * q).toFixed(1)}g</td>
                            <td className="text-right py-2 px-2 text-gray-700">{(ing.carbs_per_unit * q).toFixed(1)}g</td>
                            <td className="text-right py-2 px-2 text-gray-700">{(ing.fat_per_unit * q).toFixed(1)}g</td>
                            <td className="text-right py-2 px-2 text-gray-700">{(ing.fiber_per_unit * q).toFixed(1)}g</td>
                            <td className="text-right py-2 pl-2 text-gray-700">{Math.round(ing.sodium_per_unit * q)}mg</td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="font-bold border-t-2 border-gray-900">
                        <td className="py-2 pr-3">Per Serving</td>
                        <td className="text-right py-2 px-2">{nutrition.calories}</td>
                        <td className="text-right py-2 px-2">{nutrition.protein}g</td>
                        <td className="text-right py-2 px-2">{nutrition.carbs}g</td>
                        <td className="text-right py-2 px-2">{nutrition.fat}g</td>
                        <td className="text-right py-2 px-2">{nutrition.fiber}g</td>
                        <td className="text-right py-2 pl-2">{nutrition.sodium}mg</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ PRESETS TAB ═══ */}
      {activeTab === "presets" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Recipe Presets</h3>
              <p className="text-sm text-[#9a9080]">Save scaling configs for batch prep, catering, etc.</p>
            </div>
            <button onClick={saveCurrentAsPreset} className="flex items-center gap-2 px-4 py-2.5 bg-[#3d6b2a] text-white rounded-xl font-medium hover:bg-[#2f5720]">
              <Bookmark size={18} /> Save Current as Preset
            </button>
          </div>
          {presets.length === 0 && (
            <div className="bg-white border border-gray-200 border-dashed rounded-2xl p-8 text-center space-y-4">
              <p className="text-[#9a9080]">No presets saved yet. Quick-add common ones:</p>
              <div className="flex flex-wrap justify-center gap-2">
                {[
                  { name: "Single Serving", factor: 1 }, { name: "Double Batch", factor: 2 },
                  { name: "Family (4)", factor: 4 }, { name: "Catering (25)", factor: 25 },
                  { name: "Catering (50)", factor: 50 }, { name: "Catering (100)", factor: 100 },
                ].map(p => (
                  <button key={p.name} onClick={() => setPresets(prev => [...prev, { name: p.name, scale_factor: p.factor, servings: p.factor * recipe.servings, notes: "", is_default: false }])}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-[#3d6b2a]/10 hover:text-[#3d6b2a] transition-colors">
                    + {p.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          {presets.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {presets.map((preset, index) => (
                <div key={index} className="bg-white border border-gray-200 rounded-2xl p-5 space-y-3 hover:border-[#3d6b2a]/20 transition-colors">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-900">{preset.name}</h4>
                      <p className="text-sm text-[#9a9080]">{preset.scale_factor}x · {preset.servings} servings</p>
                    </div>
                    <button onClick={() => deletePreset(index)} className="p-1 text-[#7a7060] hover:text-red-500"><X size={16} /></button>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><p className="text-xs text-[#9a9080]">Total Cost</p><p className="font-semibold text-gray-900">${(calculatedCost * preset.scale_factor).toFixed(2)}</p></div>
                    <div><p className="text-xs text-[#9a9080]">Total Calories</p><p className="font-semibold text-gray-900">{nutrition.calories * preset.servings}</p></div>
                  </div>
                  <button onClick={() => loadPreset(preset)} className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-[#3d6b2a]/10 text-[#3d6b2a] rounded-xl text-sm font-medium hover:bg-[#3d6b2a]/20">
                    <Scale size={14} /> Apply Scale
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
