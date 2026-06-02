"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Save,
  Trash2,
  Calendar,
  Eye,
  UtensilsCrossed,
  AlertTriangle,
  CheckCircle,
  Send,
  ClipboardList,
  Printer,
  Package,
  Ban,
} from "lucide-react";

const STORE_ID = "b0000000-0000-0000-0000-000000000001";

const ITEM_TYPES = [
  "entree",
  "side",
  "grain",
  "vegetable",
  "fruit",
  "drink",
  "snack",
  "condiment",
] as const;

type ItemType = (typeof ITEM_TYPES)[number];

const ITEM_TYPE_LABELS: Record<ItemType, string> = {
  entree: "Entree",
  side: "Side",
  grain: "Grain",
  vegetable: "Vegetable",
  fruit: "Fruit",
  drink: "Drink",
  snack: "Snack",
  condiment: "Condiment",
};

const DAY_NAMES = ["monday", "tuesday", "wednesday", "thursday", "friday"] as const;
const DAY_LABELS: Record<string, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
};

const STATUS_FLOW: Record<string, { next: string; label: string }> = {
  draft: { next: "sent_to_school", label: "Send to School" },
  sent_to_school: { next: "approved", label: "Mark Approved" },
  approved: { next: "in_prep", label: "Start Prep" },
  in_prep: { next: "completed", label: "Mark Completed" },
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-[#4a5e3a]",
  sent_to_school: "bg-blue-50 text-blue-700",
  approved: "bg-[#e9f0e4] text-[#3d6b2a]",
  in_prep: "bg-amber-50 text-amber-700",
  completed: "bg-emerald-50 text-emerald-700",
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  sent_to_school: "Sent to School",
  approved: "Approved",
  in_prep: "In Prep",
  completed: "Completed",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface PlanItem {
  id?: string;
  day_id?: string;
  item_type: ItemType;
  recipe_id: string | null;
  custom_name: string;
  custom_description: string;
  servings_planned: number;
  serving_size: string;
  calories_per_serving: number;
  protein_per_serving: number;
  carbs_per_serving: number;
  fat_per_serving: number;
  contains_nuts: boolean;
  contains_dairy: boolean;
  contains_gluten: boolean;
  contains_soy: boolean;
  contains_eggs: boolean;
  contains_shellfish: boolean;
  allergen_notes: string;
  cost_per_serving: number;
  sort_order: number;
}

interface PlanDay {
  id?: string;
  plan_id?: string;
  day_of_week: string;
  meal_date: string;
  meal_label: string;
  is_no_service: boolean;
  no_service_reason: string;
  special_instructions: string;
  items: PlanItem[];
}

interface LunchPlan {
  id?: string;
  store_id: string;
  contract_id: string;
  week_start: string;
  week_label: string;
  status: string;
  total_meals: number;
  total_servings: number;
  estimated_cost: number;
  school_notes: string;
  kitchen_notes: string;
  approved_by: string;
  approved_at: string | null;
  days: PlanDay[];
}

interface Recipe {
  id: string;
  name: string;
  base_price: number;
  image_url: string | null;
  cost_to_make: number | null;
  dietary_flags: Record<string, boolean> | null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface SupplyItem {
  ingredient_name: string;
  category: string;
  total_quantity: number;
  unit_type: string;
  cost_per_unit: number;
  total_cost: number;
  supplier: string;
  recipes_used: string[];
  days_used: string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  allergens: any;
}

interface SchoolLunchCalendarProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialContracts: any[];
}

// ── Helpers ──────────────────────────────────────────────

function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function addDays(d: Date, n: number): Date {
  const date = new Date(d);
  date.setDate(date.getDate() + n);
  return date;
}

function formatDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

function formatDateDisplay(d: Date): string {
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  return `${months[d.getMonth()]} ${d.getDate()}`;
}

function formatDateLong(d: Date): string {
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function formatWeekRange(monday: Date): string {
  const friday = addDays(monday, 4);
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  const mMonth = months[monday.getMonth()];
  const fMonth = months[friday.getMonth()];
  if (mMonth === fMonth) {
    return `${mMonth} ${monday.getDate()} – ${friday.getDate()}, ${friday.getFullYear()}`;
  }
  return `${mMonth} ${monday.getDate()} – ${fMonth} ${friday.getDate()}, ${friday.getFullYear()}`;
}

function createEmptyItem(type: ItemType, sortOrder: number): PlanItem {
  return {
    item_type: type,
    recipe_id: null,
    custom_name: "",
    custom_description: "",
    servings_planned: 0,
    serving_size: "",
    calories_per_serving: 0,
    protein_per_serving: 0,
    carbs_per_serving: 0,
    fat_per_serving: 0,
    contains_nuts: false,
    contains_dairy: false,
    contains_gluten: false,
    contains_soy: false,
    contains_eggs: false,
    contains_shellfish: false,
    allergen_notes: "",
    cost_per_serving: 0,
    sort_order: sortOrder,
  };
}

function createEmptyDays(monday: Date): PlanDay[] {
  return DAY_NAMES.map((dayName, i) => {
    const date = addDays(monday, i);
    return {
      day_of_week: dayName,
      meal_date: formatDate(date),
      meal_label: `${DAY_LABELS[dayName]} Lunch`,
      is_no_service: false,
      no_service_reason: "",
      special_instructions: "",
      items: [],
    };
  });
}

function getAllergenFlags(item: PlanItem): string[] {
  const flags: string[] = [];
  if (item.contains_nuts) flags.push("Nuts");
  if (item.contains_dairy) flags.push("Dairy");
  if (item.contains_gluten) flags.push("Gluten");
  if (item.contains_soy) flags.push("Soy");
  if (item.contains_eggs) flags.push("Eggs");
  if (item.contains_shellfish) flags.push("Shellfish");
  return flags;
}

function getWeekAllergens(plan: LunchPlan | null): string[] {
  if (!plan) return [];
  const set = new Set<string>();
  for (const day of plan.days) {
    for (const item of day.items) {
      for (const flag of getAllergenFlags(item)) {
        set.add(flag);
      }
    }
  }
  return Array.from(set).sort();
}

// ── Component ────────────────────────────────────────────

export default function SchoolLunchCalendar({ initialContracts }: SchoolLunchCalendarProps) {
  const supabase = createClient();

  // ── State ──
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [contracts] = useState<any[]>(initialContracts);
  const [selectedContractId, setSelectedContractId] = useState<string>("");
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(getMonday(new Date()));
  const [currentPlan, setCurrentPlan] = useState<LunchPlan | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [viewMode, setViewMode] = useState<"calendar" | "kitchen">("calendar");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Day editor modal
  const [showDayModal, setShowDayModal] = useState(false);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(-1);
  const [editingDay, setEditingDay] = useState<PlanDay | null>(null);

  // Kitchen prep
  const [supplyList, setSupplyList] = useState<SupplyItem[]>([]);
  const [supplyGroupBy, setSupplyGroupBy] = useState<"ingredient" | "day">("ingredient");
  const [loadingSupply, setLoadingSupply] = useState(false);

  const schoolContracts = contracts.filter(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (c: any) => c.client_type === "school" && c.status === "active"
  );

  // ── Effects ──

  useEffect(() => {
    fetchRecipes();
    if (schoolContracts.length > 0 && !selectedContractId) {
      setSelectedContractId(schoolContracts[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedContractId) {
      fetchPlan();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedContractId, currentWeekStart]);

  // ── Data Fetching ──

  const fetchRecipes = useCallback(async () => {
    const { data } = await supabase
      .from("recipes")
      .select("id, name, base_price, image_url, cost_to_make, dietary_flags")
      .eq("store_id", STORE_ID)
      .eq("is_available", true)
      .order("name");
    if (data) setRecipes(data);
  }, [supabase]);

  const fetchPlan = useCallback(async () => {
    setLoading(true);
    const weekStr = formatDate(currentWeekStart);
    const { data, error } = await supabase
      .from("school_lunch_plans")
      .select("*, school_lunch_plan_days(*, school_lunch_plan_items(*))")
      .eq("contract_id", selectedContractId)
      .eq("week_start", weekStr)
      .single();

    if (error || !data) {
      setCurrentPlan(null);
      setLoading(false);
      return;
    }

    const plan: LunchPlan = {
      id: data.id,
      store_id: data.store_id,
      contract_id: data.contract_id,
      week_start: data.week_start,
      week_label: data.week_label || "",
      status: data.status || "draft",
      total_meals: data.total_meals || 0,
      total_servings: data.total_servings || 0,
      estimated_cost: data.estimated_cost || 0,
      school_notes: data.school_notes || "",
      kitchen_notes: data.kitchen_notes || "",
      approved_by: data.approved_by || "",
      approved_at: data.approved_at || null,
      days: (data.school_lunch_plan_days || [])
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .sort((a: any, b: any) => {
          const order = DAY_NAMES as readonly string[];
          return order.indexOf(a.day_of_week) - order.indexOf(b.day_of_week);
        })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((d: any) => ({
          id: d.id,
          plan_id: d.plan_id,
          day_of_week: d.day_of_week,
          meal_date: d.meal_date,
          meal_label: d.meal_label || "",
          is_no_service: d.is_no_service || false,
          no_service_reason: d.no_service_reason || "",
          special_instructions: d.special_instructions || "",
          items: (d.school_lunch_plan_items || [])
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .sort((x: any, y: any) => (x.sort_order || 0) - (y.sort_order || 0))
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .map((item: any) => ({
              id: item.id,
              day_id: item.day_id,
              item_type: item.item_type,
              recipe_id: item.recipe_id || null,
              custom_name: item.custom_name || "",
              custom_description: item.custom_description || "",
              servings_planned: item.servings_planned || 0,
              serving_size: item.serving_size || "",
              calories_per_serving: item.calories_per_serving || 0,
              protein_per_serving: item.protein_per_serving || 0,
              carbs_per_serving: item.carbs_per_serving || 0,
              fat_per_serving: item.fat_per_serving || 0,
              contains_nuts: item.contains_nuts || false,
              contains_dairy: item.contains_dairy || false,
              contains_gluten: item.contains_gluten || false,
              contains_soy: item.contains_soy || false,
              contains_eggs: item.contains_eggs || false,
              contains_shellfish: item.contains_shellfish || false,
              allergen_notes: item.allergen_notes || "",
              cost_per_serving: item.cost_per_serving || 0,
              sort_order: item.sort_order || 0,
            })),
        })),
    };

    setCurrentPlan(plan);
    setLoading(false);
  }, [supabase, selectedContractId, currentWeekStart]);

  // ── Actions ──

  const createNewPlan = async () => {
    if (!selectedContractId) return;
    setSaving(true);
    const weekStr = formatDate(currentWeekStart);
    const contract = schoolContracts.find((c) => c.id === selectedContractId);

    const { data: planData, error: planError } = await supabase
      .from("school_lunch_plans")
      .insert({
        store_id: STORE_ID,
        contract_id: selectedContractId,
        week_start: weekStr,
        week_label: `Week of ${formatWeekRange(currentWeekStart)}`,
        status: "draft",
        total_meals: 0,
        total_servings: 0,
        estimated_cost: 0,
        school_notes: "",
        kitchen_notes: "",
      })
      .select()
      .single();

    if (planError || !planData) {
      setSaving(false);
      return;
    }

    const days = createEmptyDays(currentWeekStart).map((d) => ({
      plan_id: planData.id,
      day_of_week: d.day_of_week,
      meal_date: d.meal_date,
      meal_label: d.meal_label,
      is_no_service: false,
      no_service_reason: "",
      special_instructions: "",
    }));

    await supabase.from("school_lunch_plan_days").insert(days);
    setSaving(false);
    await fetchPlan();
  };

  const updatePlanStatus = async (newStatus: string) => {
    if (!currentPlan?.id) return;
    setSaving(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updates: any = { status: newStatus, updated_at: new Date().toISOString() };
    if (newStatus === "approved") {
      updates.approved_at = new Date().toISOString();
      updates.approved_by = "Admin";
    }
    await supabase.from("school_lunch_plans").update(updates).eq("id", currentPlan.id);
    setCurrentPlan((prev) => (prev ? { ...prev, status: newStatus, ...updates } : prev));
    setSaving(false);
  };

  const openDayModal = (dayIndex: number) => {
    if (!currentPlan) return;
    const day = currentPlan.days[dayIndex];
    setSelectedDayIndex(dayIndex);
    setEditingDay(JSON.parse(JSON.stringify(day)));
    setShowDayModal(true);
  };

  const saveDayEdits = async () => {
    if (!editingDay || !currentPlan || selectedDayIndex < 0) return;
    setSaving(true);

    // Update the day record
    if (editingDay.id) {
      await supabase
        .from("school_lunch_plan_days")
        .update({
          is_no_service: editingDay.is_no_service,
          no_service_reason: editingDay.no_service_reason,
          special_instructions: editingDay.special_instructions,
          meal_label: editingDay.meal_label,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingDay.id);

      // Delete existing items for this day, then re-insert
      await supabase
        .from("school_lunch_plan_items")
        .delete()
        .eq("day_id", editingDay.id);

      if (!editingDay.is_no_service && editingDay.items.length > 0) {
        const itemsToInsert = editingDay.items.map((item, idx) => ({
          day_id: editingDay.id,
          item_type: item.item_type,
          recipe_id: item.recipe_id || null,
          custom_name: item.custom_name,
          custom_description: item.custom_description,
          servings_planned: item.servings_planned,
          serving_size: item.serving_size,
          calories_per_serving: item.calories_per_serving,
          protein_per_serving: item.protein_per_serving,
          carbs_per_serving: item.carbs_per_serving,
          fat_per_serving: item.fat_per_serving,
          contains_nuts: item.contains_nuts,
          contains_dairy: item.contains_dairy,
          contains_gluten: item.contains_gluten,
          contains_soy: item.contains_soy,
          contains_eggs: item.contains_eggs,
          contains_shellfish: item.contains_shellfish,
          allergen_notes: item.allergen_notes,
          cost_per_serving: item.cost_per_serving,
          sort_order: idx,
        }));
        await supabase.from("school_lunch_plan_items").insert(itemsToInsert);
      }
    }

    // Recalculate plan totals
    const updatedDays = [...currentPlan.days];
    updatedDays[selectedDayIndex] = editingDay;
    let totalMeals = 0;
    let totalServings = 0;
    let estimatedCost = 0;
    for (const day of updatedDays) {
      if (!day.is_no_service && day.items.length > 0) {
        totalMeals++;
        for (const item of day.items) {
          totalServings += item.servings_planned;
          estimatedCost += item.cost_per_serving * item.servings_planned;
        }
      }
    }

    if (currentPlan.id) {
      await supabase
        .from("school_lunch_plans")
        .update({
          total_meals: totalMeals,
          total_servings: totalServings,
          estimated_cost: estimatedCost,
          updated_at: new Date().toISOString(),
        })
        .eq("id", currentPlan.id);
    }

    setCurrentPlan((prev) =>
      prev
        ? {
            ...prev,
            days: updatedDays,
            total_meals: totalMeals,
            total_servings: totalServings,
            estimated_cost: estimatedCost,
          }
        : prev
    );

    setShowDayModal(false);
    setEditingDay(null);
    setSelectedDayIndex(-1);
    setSaving(false);
  };

  const addItemToDay = (type: ItemType) => {
    if (!editingDay) return;
    const sortOrder = editingDay.items.length;
    setEditingDay({
      ...editingDay,
      items: [...editingDay.items, createEmptyItem(type, sortOrder)],
    });
  };

  const updateItem = (itemIndex: number, updates: Partial<PlanItem>) => {
    if (!editingDay) return;
    const newItems = [...editingDay.items];
    newItems[itemIndex] = { ...newItems[itemIndex], ...updates };
    setEditingDay({ ...editingDay, items: newItems });
  };

  const removeItem = (itemIndex: number) => {
    if (!editingDay) return;
    const newItems = editingDay.items.filter((_, i) => i !== itemIndex);
    setEditingDay({ ...editingDay, items: newItems });
  };

  const selectRecipeForItem = (itemIndex: number, recipeId: string) => {
    if (!editingDay) return;
    if (recipeId === "custom") {
      updateItem(itemIndex, { recipe_id: null, custom_name: "", custom_description: "" });
      return;
    }
    const recipe = recipes.find((r) => r.id === recipeId);
    if (!recipe) return;
    const flags = recipe.dietary_flags || {};
    updateItem(itemIndex, {
      recipe_id: recipeId,
      custom_name: recipe.name,
      cost_per_serving: recipe.cost_to_make || recipe.base_price || 0,
      contains_nuts: !!flags.contains_nuts,
      contains_dairy: !!flags.contains_dairy,
      contains_gluten: !!flags.contains_gluten,
      contains_soy: !!flags.contains_soy,
      contains_eggs: !!flags.contains_eggs,
      contains_shellfish: !!flags.contains_shellfish,
    });
  };

  // ── Kitchen Prep Supply List ──

  const fetchSupplyList = useCallback(async () => {
    if (!currentPlan) return;
    setLoadingSupply(true);

    const recipeIds = new Set<string>();
    const recipeIdToDays = new Map<string, Set<string>>();
    const recipeIdToName = new Map<string, string>();

    for (const day of currentPlan.days) {
      if (day.is_no_service) continue;
      for (const item of day.items) {
        if (item.recipe_id) {
          recipeIds.add(item.recipe_id);
          if (!recipeIdToDays.has(item.recipe_id)) {
            recipeIdToDays.set(item.recipe_id, new Set());
          }
          recipeIdToDays.get(item.recipe_id)!.add(DAY_LABELS[day.day_of_week] || day.day_of_week);
          recipeIdToName.set(item.recipe_id, item.custom_name || "Unknown");
        }
      }
    }

    if (recipeIds.size === 0) {
      setSupplyList([]);
      setLoadingSupply(false);
      return;
    }

    const { data: riData } = await supabase
      .from("recipe_ingredients")
      .select("*, ingredients(*)")
      .in("recipe_id", Array.from(recipeIds));

    if (!riData || riData.length === 0) {
      setSupplyList([]);
      setLoadingSupply(false);
      return;
    }

    const ingredientMap = new Map<string, SupplyItem>();

    for (const ri of riData) {
      const ing = ri.ingredients;
      if (!ing) continue;
      const key = ing.id as string;
      const recipeName = recipeIdToName.get(ri.recipe_id) || "Unknown";
      const daysUsed = recipeIdToDays.get(ri.recipe_id) || new Set();

      if (ingredientMap.has(key)) {
        const existing = ingredientMap.get(key)!;
        existing.total_quantity += ri.quantity || 0;
        existing.total_cost = existing.total_quantity * existing.cost_per_unit;
        if (!existing.recipes_used.includes(recipeName)) {
          existing.recipes_used.push(recipeName);
        }
        for (const d of daysUsed) {
          if (!existing.days_used.includes(d)) existing.days_used.push(d);
        }
      } else {
        ingredientMap.set(key, {
          ingredient_name: ing.name || "Unknown",
          category: ing.category || "Other",
          total_quantity: ri.quantity || 0,
          unit_type: ri.unit_type || ing.unit_type || "",
          cost_per_unit: ing.cost_per_unit || 0,
          total_cost: (ri.quantity || 0) * (ing.cost_per_unit || 0),
          supplier: ing.supplier || "N/A",
          recipes_used: [recipeName],
          days_used: Array.from(daysUsed),
          allergens: ing.allergens || null,
        });
      }
    }

    setSupplyList(
      Array.from(ingredientMap.values()).sort((a, b) =>
        a.ingredient_name.localeCompare(b.ingredient_name)
      )
    );
    setLoadingSupply(false);
  }, [supabase, currentPlan]);

  useEffect(() => {
    if (viewMode === "kitchen" && currentPlan) {
      fetchSupplyList();
    }
  }, [viewMode, currentPlan, fetchSupplyList]);

  // ── Week Navigation ──

  const goToPrevWeek = () => {
    setCurrentWeekStart((prev) => addDays(prev, -7));
  };

  const goToNextWeek = () => {
    setCurrentWeekStart((prev) => addDays(prev, 7));
  };

  const goToThisWeek = () => {
    setCurrentWeekStart(getMonday(new Date()));
  };

  // ── Computed Values ──

  const weekAllergens = getWeekAllergens(currentPlan);
  const totalSupplyCost = supplyList.reduce((sum, s) => sum + s.total_cost, 0);

  // ── No school contracts empty state ──

  if (schoolContracts.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="bg-white border border-[#ddd8cc] rounded-2xl border border-[#ddd8cc] p-12 max-w-lg mx-auto">
          <GraduationCapIcon className="w-16 h-16 text-[#9a9080] mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-[#1e2d18] mb-2">No Active School Contracts</h2>
          <p className="text-[#7a7060]">
            Create one in the Contracts tab first to start planning school lunch menus.
          </p>
        </div>
      </div>
    );
  }

  // ── Render ──

  return (
    <div className="space-y-6">
      {/* ── Header: Contract Selector + Week Nav + View Toggle ── */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-4 justify-between">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Contract Selector */}
          <select
            value={selectedContractId}
            onChange={(e) => setSelectedContractId(e.target.value)}
            className="bg-white border border-[#ddd8cc] text-[#1e2d18] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#449531]"
          >
            {schoolContracts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.client_name} {c.school_name ? `- ${c.school_name}` : ""}
              </option>
            ))}
          </select>

          {/* Week Navigator */}
          <div className="flex items-center gap-2 bg-white border border-[#ddd8cc] rounded-xl px-2 py-1">
            <button
              onClick={goToPrevWeek}
              className="p-1.5 hover:bg-[#f2efe8] rounded-lg transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-[#7a7060]" />
            </button>
            <span className="text-sm text-[#1e2d18] font-medium px-2 min-w-[180px] text-center">
              {formatWeekRange(currentWeekStart)}
            </span>
            <button
              onClick={goToNextWeek}
              className="p-1.5 hover:bg-[#f2efe8] rounded-lg transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-[#7a7060]" />
            </button>
          </div>

          <button
            onClick={goToThisWeek}
            className="text-sm text-[#7a7060] hover:text-[#1e2d18] px-3 py-2 bg-[#f2efe8] rounded-xl transition-colors"
          >
            This Week
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex bg-white border border-[#ddd8cc] rounded-xl overflow-hidden">
            <button
              onClick={() => setViewMode("calendar")}
              className={`flex items-center gap-2 px-4 py-2 text-sm transition-colors ${
                viewMode === "calendar"
                  ? "bg-[#449531] text-white"
                  : "text-[#7a7060] hover:text-[#1e2d18]"
              }`}
            >
              <Calendar className="w-4 h-4" />
              Calendar
            </button>
            <button
              onClick={() => setViewMode("kitchen")}
              className={`flex items-center gap-2 px-4 py-2 text-sm transition-colors ${
                viewMode === "kitchen"
                  ? "bg-[#449531] text-white"
                  : "text-[#7a7060] hover:text-[#1e2d18]"
              }`}
            >
              <ClipboardList className="w-4 h-4" />
              Kitchen Prep
            </button>
          </div>

          {/* Create Plan */}
          {!currentPlan && !loading && (
            <button
              onClick={createNewPlan}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#449531] text-white rounded-xl text-sm font-medium hover:bg-[#3a8229] transition-colors disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              Create Plan
            </button>
          )}
        </div>
      </div>

      {/* ── Summary Cards ── */}
      {currentPlan && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-[#ddd8cc] rounded-2xl border border-[#ddd8cc] p-6">
            <p className="text-[#7a7060] text-sm mb-1">Total Meals</p>
            <p className="text-2xl font-bold text-[#1e2d18]">{currentPlan.total_meals}</p>
          </div>
          <div className="bg-white border border-[#ddd8cc] rounded-2xl border border-[#ddd8cc] p-6">
            <p className="text-[#7a7060] text-sm mb-1">Total Servings</p>
            <p className="text-2xl font-bold text-[#1e2d18]">{currentPlan.total_servings}</p>
          </div>
          <div className="bg-white border border-[#ddd8cc] rounded-2xl border border-[#ddd8cc] p-6">
            <p className="text-[#7a7060] text-sm mb-1">Estimated Cost</p>
            <p className="text-2xl font-bold text-[#3d6b2a]">
              ${currentPlan.estimated_cost.toFixed(2)}
            </p>
          </div>
          <div className="bg-white border border-[#ddd8cc] rounded-2xl border border-[#ddd8cc] p-6">
            <p className="text-[#7a7060] text-sm mb-1">Allergens This Week</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {weekAllergens.length > 0 ? (
                weekAllergens.map((a) => (
                  <span
                    key={a}
                    className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700"
                  >
                    {a}
                  </span>
                ))
              ) : (
                <span className="text-sm text-[#9a9080]">None flagged</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Status Bar ── */}
      {currentPlan && (
        <div className="flex items-center justify-between bg-white border border-[#ddd8cc] rounded-2xl border border-[#ddd8cc] px-6 py-4">
          <div className="flex items-center gap-3">
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                STATUS_COLORS[currentPlan.status] || STATUS_COLORS.draft
              }`}
            >
              {STATUS_LABELS[currentPlan.status] || currentPlan.status}
            </span>
            {currentPlan.approved_by && (
              <span className="text-xs text-[#9a9080]">
                Approved by {currentPlan.approved_by}
                {currentPlan.approved_at &&
                  ` on ${formatDateLong(new Date(currentPlan.approved_at))}`}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {STATUS_FLOW[currentPlan.status] && (
              <button
                onClick={() => updatePlanStatus(STATUS_FLOW[currentPlan.status].next)}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-[#449531] text-white rounded-xl text-sm font-medium hover:bg-[#3a8229] transition-colors disabled:opacity-50"
              >
                {currentPlan.status === "draft" && <Send className="w-4 h-4" />}
                {currentPlan.status === "sent_to_school" && <CheckCircle className="w-4 h-4" />}
                {currentPlan.status === "approved" && <UtensilsCrossed className="w-4 h-4" />}
                {currentPlan.status === "in_prep" && <CheckCircle className="w-4 h-4" />}
                {STATUS_FLOW[currentPlan.status].label}
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Loading ── */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#449531] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* ── No Plan State ── */}
      {!loading && !currentPlan && selectedContractId && (
        <div className="bg-white border border-[#ddd8cc] rounded-2xl border border-[#ddd8cc] p-12 text-center">
          <Calendar className="w-12 h-12 text-[#9a9080] mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-[#1e2d18] mb-1">No Plan for This Week</h3>
          <p className="text-[#7a7060] text-sm mb-4">
            Create a weekly lunch plan for {formatWeekRange(currentWeekStart)}
          </p>
          <button
            onClick={createNewPlan}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#449531] text-white rounded-xl text-sm font-medium hover:bg-[#3a8229] transition-colors disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            Create Weekly Plan
          </button>
        </div>
      )}

      {/* ── Calendar View ── */}
      {!loading && currentPlan && viewMode === "calendar" && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {currentPlan.days.map((day, dayIdx) => {
            const dateObj = new Date(day.meal_date + "T00:00:00");
            const itemsByType = ITEM_TYPES.reduce(
              (acc, type) => {
                acc[type] = day.items.filter((item) => item.item_type === type);
                return acc;
              },
              {} as Record<ItemType, PlanItem[]>
            );

            return (
              <div
                key={day.day_of_week}
                className={`bg-white border border-[#ddd8cc] rounded-2xl border border-[#ddd8cc] overflow-hidden transition-all hover:border-[#ddd8cc] ${
                  day.is_no_service ? "opacity-60" : ""
                }`}
              >
                {/* Day Header */}
                <div className="px-4 py-3 border-b border-[#ddd8cc] flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-[#1e2d18]">
                      {DAY_LABELS[day.day_of_week]}
                    </p>
                    <p className="text-xs text-[#9a9080]">{formatDateDisplay(dateObj)}</p>
                  </div>
                  <button
                    onClick={() => openDayModal(dayIdx)}
                    className="p-1.5 hover:bg-[#f2efe8] rounded-lg transition-colors"
                    title="Edit day"
                  >
                    <Eye className="w-4 h-4 text-[#7a7060]" />
                  </button>
                </div>

                {/* Day Content */}
                <div className="p-4 min-h-[180px]">
                  {day.is_no_service ? (
                    <div className="flex flex-col items-center justify-center h-full py-6">
                      <Ban className="w-8 h-8 text-[#9a9080] mb-2" />
                      <p className="text-sm font-medium text-[#7a7060]">No Service</p>
                      {day.no_service_reason && (
                        <p className="text-xs text-[#9a9080] mt-1 text-center">
                          {day.no_service_reason}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {ITEM_TYPES.map((type) => {
                        const items = itemsByType[type];
                        if (!items || items.length === 0) return null;
                        return (
                          <div key={type}>
                            <p className="text-[10px] font-semibold text-[#9a9080] uppercase tracking-wider mb-1">
                              {ITEM_TYPE_LABELS[type]}
                            </p>
                            {items.map((item, idx) => {
                              const allergens = getAllergenFlags(item);
                              return (
                                <div
                                  key={idx}
                                  className="flex items-start justify-between gap-1 mb-1"
                                >
                                  <div className="min-w-0 flex-1">
                                    <p className="text-xs text-[#4a5e3a] truncate">
                                      {item.custom_name || "Unnamed"}
                                    </p>
                                    <p className="text-[10px] text-[#9a9080]">
                                      {item.serving_size && `${item.serving_size}`}
                                      {item.calories_per_serving > 0 &&
                                        ` · ${item.calories_per_serving} cal`}
                                    </p>
                                  </div>
                                  {allergens.length > 0 && (
                                    <AlertTriangle className="w-3 h-3 text-amber-600 flex-shrink-0 mt-0.5" />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}

                      {day.items.length === 0 && (
                        <div className="text-center py-4">
                          <p className="text-xs text-[#9a9080]">No items yet</p>
                        </div>
                      )}

                      {/* Add Item Button */}
                      <button
                        onClick={() => openDayModal(dayIdx)}
                        className="w-full mt-2 flex items-center justify-center gap-1.5 py-2 text-xs text-[#9a9080] hover:text-[#3d6b2a] hover:bg-[#f2efe8] rounded-lg transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                        Add Item
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Kitchen Prep View ── */}
      {!loading && currentPlan && viewMode === "kitchen" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold text-[#1e2d18]">Supply &amp; Prep List</h3>
              <div className="flex bg-white border border-[#ddd8cc] rounded-xl overflow-hidden">
                <button
                  onClick={() => setSupplyGroupBy("ingredient")}
                  className={`px-3 py-1.5 text-xs transition-colors ${
                    supplyGroupBy === "ingredient"
                      ? "bg-[#449531] text-white"
                      : "text-[#7a7060] hover:text-[#1e2d18]"
                  }`}
                >
                  By Ingredient
                </button>
                <button
                  onClick={() => setSupplyGroupBy("day")}
                  className={`px-3 py-1.5 text-xs transition-colors ${
                    supplyGroupBy === "day"
                      ? "bg-[#449531] text-white"
                      : "text-[#7a7060] hover:text-[#1e2d18]"
                  }`}
                >
                  By Day
                </button>
              </div>
            </div>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 bg-[#f2efe8] text-[#4a5e3a] hover:text-[#1e2d18] rounded-xl text-sm transition-colors print:hidden"
            >
              <Printer className="w-4 h-4" />
              Print Prep Sheet
            </button>
          </div>

          {loadingSupply ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-[#449531] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : supplyList.length === 0 ? (
            <div className="bg-white border border-[#ddd8cc] rounded-2xl border border-[#ddd8cc] p-8 text-center">
              <Package className="w-10 h-10 text-[#9a9080] mx-auto mb-2" />
              <p className="text-[#7a7060] text-sm">
                No recipe-linked items this week. Add items with linked recipes to see the supply list.
              </p>
            </div>
          ) : (
            <>
              {/* Total Cost */}
              <div className="bg-white border border-[#ddd8cc] rounded-2xl border border-[#ddd8cc] p-4 flex items-center justify-between print:border-gray-300">
                <span className="text-sm text-[#7a7060]">Estimated Ingredient Cost</span>
                <span className="text-lg font-bold text-[#3d6b2a]">
                  ${totalSupplyCost.toFixed(2)}
                </span>
              </div>

              {supplyGroupBy === "ingredient" ? (
                <div className="bg-white border border-[#ddd8cc] rounded-2xl border border-[#ddd8cc] overflow-hidden print:border-gray-300">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#ddd8cc] text-left">
                        <th className="px-4 py-3 text-[#7a7060] font-medium">Ingredient</th>
                        <th className="px-4 py-3 text-[#7a7060] font-medium">Qty</th>
                        <th className="px-4 py-3 text-[#7a7060] font-medium">Unit</th>
                        <th className="px-4 py-3 text-[#7a7060] font-medium">Cost</th>
                        <th className="px-4 py-3 text-[#7a7060] font-medium">Supplier</th>
                        <th className="px-4 py-3 text-[#7a7060] font-medium">Used In</th>
                        <th className="px-4 py-3 text-[#7a7060] font-medium">Days</th>
                      </tr>
                    </thead>
                    <tbody>
                      {supplyList.map((item, idx) => (
                        <tr
                          key={idx}
                          className="border-b border-[#ddd8cc] hover:bg-[#f2efe8] transition-colors"
                        >
                          <td className="px-4 py-3 text-[#1e2d18] font-medium">
                            {item.ingredient_name}
                          </td>
                          <td className="px-4 py-3 text-[#4a5e3a]">
                            {item.total_quantity.toFixed(1)}
                          </td>
                          <td className="px-4 py-3 text-[#7a7060]">{item.unit_type}</td>
                          <td className="px-4 py-3 text-[#4a5e3a]">
                            ${item.total_cost.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-[#7a7060]">{item.supplier}</td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1">
                              {item.recipes_used.map((r, ri) => (
                                <span
                                  key={ri}
                                  className="text-xs px-1.5 py-0.5 bg-[#f2efe8] rounded text-[#7a7060]"
                                >
                                  {r}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1">
                              {item.days_used.map((d, di) => (
                                <span
                                  key={di}
                                  className="text-[10px] px-1.5 py-0.5 bg-[#e9f0e4] rounded text-[#3d6b2a]"
                                >
                                  {d}
                                </span>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                /* Group by Day */
                <div className="space-y-4">
                  {DAY_NAMES.map((dayName) => {
                    const dayLabel = DAY_LABELS[dayName];
                    const dayItems = supplyList.filter((s) => s.days_used.includes(dayLabel));
                    if (dayItems.length === 0) return null;
                    return (
                      <div
                        key={dayName}
                        className="bg-white border border-[#ddd8cc] rounded-2xl border border-[#ddd8cc] overflow-hidden"
                      >
                        <div className="px-4 py-3 border-b border-[#ddd8cc] bg-[#f2efe8]">
                          <h4 className="text-sm font-semibold text-[#1e2d18]">{dayLabel}</h4>
                        </div>
                        <div className="divide-y divide-[#ede9e2]">
                          {dayItems.map((item, idx) => (
                            <div
                              key={idx}
                              className="px-4 py-3 flex items-center justify-between"
                            >
                              <div>
                                <p className="text-sm text-[#1e2d18]">{item.ingredient_name}</p>
                                <p className="text-xs text-[#9a9080]">
                                  {item.recipes_used.join(", ")}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm text-[#4a5e3a]">
                                  {item.total_quantity.toFixed(1)} {item.unit_type}
                                </p>
                                <p className="text-xs text-[#9a9080]">{item.supplier}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Day Editor Modal ── */}
      {showDayModal && editingDay && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/20 backdrop-blur-sm overflow-y-auto py-8">
          <div className="bg-white rounded-2xl w-full max-w-3xl mx-4 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {DAY_LABELS[editingDay.day_of_week]} -{" "}
                  {formatDateLong(new Date(editingDay.meal_date + "T00:00:00"))}
                </h2>
                <p className="text-sm text-[#9a9080]">{editingDay.meal_label}</p>
              </div>
              <button
                onClick={() => {
                  setShowDayModal(false);
                  setEditingDay(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-[#9a9080]" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-5 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* No Service Toggle */}
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingDay.is_no_service}
                    onChange={(e) =>
                      setEditingDay({ ...editingDay, is_no_service: e.target.checked })
                    }
                    className="w-4 h-4 rounded border-gray-300 text-[#449531] focus:ring-[#449531]"
                  />
                  <span className="text-sm font-medium text-gray-700">No Service Day</span>
                </label>
                {editingDay.is_no_service && (
                  <input
                    type="text"
                    placeholder="Reason (e.g., Holiday, Teacher Workday)"
                    value={editingDay.no_service_reason}
                    onChange={(e) =>
                      setEditingDay({ ...editingDay, no_service_reason: e.target.value })
                    }
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-[#449531]"
                  />
                )}
              </div>

              {/* Item Sections */}
              {!editingDay.is_no_service && (
                <>
                  {ITEM_TYPES.map((type) => {
                    const typeItems = editingDay.items
                      .map((item, idx) => ({ item, idx }))
                      .filter(({ item }) => item.item_type === type);

                    return (
                      <div key={type} className="border border-gray-200 rounded-xl overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-3 bg-gray-50">
                          <h3 className="text-sm font-semibold text-gray-700">
                            {ITEM_TYPE_LABELS[type]}
                          </h3>
                          <button
                            onClick={() => addItemToDay(type)}
                            className="flex items-center gap-1 text-xs text-[#449531] hover:text-[#3a8229] font-medium transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Add {ITEM_TYPE_LABELS[type]}
                          </button>
                        </div>

                        {typeItems.length === 0 ? (
                          <div className="px-4 py-3">
                            <p className="text-xs text-[#7a7060] italic">
                              No {ITEM_TYPE_LABELS[type].toLowerCase()} items
                            </p>
                          </div>
                        ) : (
                          <div className="divide-y divide-gray-100">
                            {typeItems.map(({ item, idx }) => (
                              <div key={idx} className="px-4 py-4 space-y-3">
                                {/* Recipe Selector Row */}
                                <div className="flex items-start gap-3">
                                  <div className="flex-1 space-y-3">
                                    <div className="flex gap-3">
                                      <select
                                        value={item.recipe_id || "custom"}
                                        onChange={(e) =>
                                          selectRecipeForItem(idx, e.target.value)
                                        }
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-[#449531]"
                                      >
                                        <option value="custom">Custom Item</option>
                                        {recipes.map((r) => (
                                          <option key={r.id} value={r.id}>
                                            {r.name}
                                          </option>
                                        ))}
                                      </select>
                                      <button
                                        onClick={() => removeItem(idx)}
                                        className="p-2 text-red-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>

                                    {/* Custom name if no recipe */}
                                    {!item.recipe_id && (
                                      <div className="grid grid-cols-2 gap-3">
                                        <input
                                          type="text"
                                          placeholder="Item name"
                                          value={item.custom_name}
                                          onChange={(e) =>
                                            updateItem(idx, { custom_name: e.target.value })
                                          }
                                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-[#449531]"
                                        />
                                        <input
                                          type="text"
                                          placeholder="Description"
                                          value={item.custom_description}
                                          onChange={(e) =>
                                            updateItem(idx, {
                                              custom_description: e.target.value,
                                            })
                                          }
                                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-[#449531]"
                                        />
                                      </div>
                                    )}

                                    {/* Servings + Cost Row */}
                                    <div className="grid grid-cols-3 gap-3">
                                      <div>
                                        <label className="text-[10px] font-medium text-[#9a9080] uppercase">
                                          Servings
                                        </label>
                                        <input
                                          type="number"
                                          min={0}
                                          value={item.servings_planned}
                                          onChange={(e) =>
                                            updateItem(idx, {
                                              servings_planned: parseInt(e.target.value) || 0,
                                            })
                                          }
                                          className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-[#449531]"
                                        />
                                      </div>
                                      <div>
                                        <label className="text-[10px] font-medium text-[#9a9080] uppercase">
                                          Serving Size
                                        </label>
                                        <input
                                          type="text"
                                          placeholder="e.g. 4oz"
                                          value={item.serving_size}
                                          onChange={(e) =>
                                            updateItem(idx, { serving_size: e.target.value })
                                          }
                                          className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-[#449531]"
                                        />
                                      </div>
                                      <div>
                                        <label className="text-[10px] font-medium text-[#9a9080] uppercase">
                                          Cost/Serving ($)
                                        </label>
                                        <input
                                          type="number"
                                          min={0}
                                          step={0.01}
                                          value={item.cost_per_serving}
                                          onChange={(e) =>
                                            updateItem(idx, {
                                              cost_per_serving: parseFloat(e.target.value) || 0,
                                            })
                                          }
                                          className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-[#449531]"
                                        />
                                      </div>
                                    </div>

                                    {/* Nutrition Row */}
                                    <div className="grid grid-cols-4 gap-3">
                                      <div>
                                        <label className="text-[10px] font-medium text-[#9a9080] uppercase">
                                          Calories
                                        </label>
                                        <input
                                          type="number"
                                          min={0}
                                          value={item.calories_per_serving}
                                          onChange={(e) =>
                                            updateItem(idx, {
                                              calories_per_serving:
                                                parseInt(e.target.value) || 0,
                                            })
                                          }
                                          className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-[#449531]"
                                        />
                                      </div>
                                      <div>
                                        <label className="text-[10px] font-medium text-[#9a9080] uppercase">
                                          Protein (g)
                                        </label>
                                        <input
                                          type="number"
                                          min={0}
                                          step={0.1}
                                          value={item.protein_per_serving}
                                          onChange={(e) =>
                                            updateItem(idx, {
                                              protein_per_serving:
                                                parseFloat(e.target.value) || 0,
                                            })
                                          }
                                          className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-[#449531]"
                                        />
                                      </div>
                                      <div>
                                        <label className="text-[10px] font-medium text-[#9a9080] uppercase">
                                          Carbs (g)
                                        </label>
                                        <input
                                          type="number"
                                          min={0}
                                          step={0.1}
                                          value={item.carbs_per_serving}
                                          onChange={(e) =>
                                            updateItem(idx, {
                                              carbs_per_serving:
                                                parseFloat(e.target.value) || 0,
                                            })
                                          }
                                          className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-[#449531]"
                                        />
                                      </div>
                                      <div>
                                        <label className="text-[10px] font-medium text-[#9a9080] uppercase">
                                          Fat (g)
                                        </label>
                                        <input
                                          type="number"
                                          min={0}
                                          step={0.1}
                                          value={item.fat_per_serving}
                                          onChange={(e) =>
                                            updateItem(idx, {
                                              fat_per_serving:
                                                parseFloat(e.target.value) || 0,
                                            })
                                          }
                                          className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-[#449531]"
                                        />
                                      </div>
                                    </div>

                                    {/* Allergen Checkboxes */}
                                    <div>
                                      <label className="text-[10px] font-medium text-[#9a9080] uppercase block mb-1.5">
                                        Allergens
                                      </label>
                                      <div className="flex flex-wrap gap-3">
                                        {(
                                          [
                                            ["contains_nuts", "Nuts"],
                                            ["contains_dairy", "Dairy"],
                                            ["contains_gluten", "Gluten"],
                                            ["contains_soy", "Soy"],
                                            ["contains_eggs", "Eggs"],
                                            ["contains_shellfish", "Shellfish"],
                                          ] as const
                                        ).map(([field, label]) => (
                                          <label
                                            key={field}
                                            className="flex items-center gap-1.5 cursor-pointer"
                                          >
                                            <input
                                              type="checkbox"
                                              checked={
                                                item[field as keyof PlanItem] as boolean
                                              }
                                              onChange={(e) =>
                                                updateItem(idx, {
                                                  [field]: e.target.checked,
                                                })
                                              }
                                              className="w-3.5 h-3.5 rounded border-gray-300 text-[#449531] focus:ring-[#449531]"
                                            />
                                            <span className="text-xs text-[#9a9080]">
                                              {label}
                                            </span>
                                          </label>
                                        ))}
                                      </div>
                                      <input
                                        type="text"
                                        placeholder="Additional allergen notes"
                                        value={item.allergen_notes}
                                        onChange={(e) =>
                                          updateItem(idx, { allergen_notes: e.target.value })
                                        }
                                        className="mt-2 w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-[#449531]"
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Special Instructions */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1.5">
                      Special Instructions
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Any special instructions for this day..."
                      value={editingDay.special_instructions}
                      onChange={(e) =>
                        setEditingDay({ ...editingDay, special_instructions: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-[#449531] resize-none"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowDayModal(false);
                  setEditingDay(null);
                }}
                className="px-4 py-2 text-sm text-[#9a9080] hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveDayEdits}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2 bg-[#449531] text-white rounded-xl text-sm font-medium hover:bg-[#3a8229] transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Small helper component for empty state icon ──
function GraduationCapIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
      <path d="M6 12v5c0 1.1 2.7 3 6 3s6-1.9 6-3v-5" />
    </svg>
  );
}
