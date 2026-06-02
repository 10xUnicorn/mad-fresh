"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Search,
  X,
  ChefHat,
  Apple,
  Users,
  ShoppingBag,
  RefreshCw,
  UtensilsCrossed,
  FileText,
  Truck,
  Calendar,
  Clock,
  ArrowRight,
} from "lucide-react";

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SearchResult {
  id: string;
  title: string;
  category: string;
  description?: string;
  navPath: string;
  icon: React.ReactNode;
}

const STORE_ID = "b0000000-0000-0000-0000-000000000001";
const SEARCH_DEBOUNCE_MS = 300;
const RESULTS_PER_CATEGORY = 5;

const CATEGORY_CONFIG = {
  recipes: {
    icon: <ChefHat size={18} />,
    label: "Recipes",
    color: "from-orange-400 to-orange-600",
    textColor: "text-orange-600",
  },
  ingredients: {
    icon: <Apple size={18} />,
    label: "Ingredients",
    color: "from-green-400 to-green-600",
    textColor: "text-green-600",
  },
  contacts: {
    icon: <Users size={18} />,
    label: "Contacts",
    color: "from-blue-400 to-blue-600",
    textColor: "text-blue-600",
  },
  orders: {
    icon: <ShoppingBag size={18} />,
    label: "Orders",
    color: "from-purple-400 to-purple-600",
    textColor: "text-purple-600",
  },
  subscriptions: {
    icon: <RefreshCw size={18} />,
    label: "Subscriptions",
    color: "from-cyan-400 to-cyan-600",
    textColor: "text-cyan-600",
  },
  catering: {
    icon: <UtensilsCrossed size={18} />,
    label: "Catering",
    color: "from-amber-400 to-amber-600",
    textColor: "text-amber-600",
  },
  proposals: {
    icon: <FileText size={18} />,
    label: "Proposals",
    color: "from-red-400 to-red-600",
    textColor: "text-red-600",
  },
  vendors: {
    icon: <Truck size={18} />,
    label: "Vendors",
    color: "from-slate-400 to-slate-600",
    textColor: "text-slate-600",
  },
  events: {
    icon: <Calendar size={18} />,
    label: "Events",
    color: "from-pink-400 to-pink-600",
    textColor: "text-pink-600",
  },
};

export default function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<Record<string, SearchResult[]>>({});
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("madFresh_globalSearchRecent");
    if (stored) {
      setRecentSearches(JSON.parse(stored));
    }
  }, []);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onClose();
      }

      if (!isOpen) return;

      switch (e.key) {
        case "Escape":
          onClose();
          break;
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % (flatResults.length || 1));
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev === 0 ? (flatResults.length || 1) - 1 : prev - 1
          );
          break;
        case "Enter":
          e.preventDefault();
          const result = flatResults[selectedIndex];
          if (result) {
            handleSelectResult(result);
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, selectedIndex, results]);

  // Compute flat results for keyboard navigation
  const flatResults = useMemo(() => {
    return Object.values(results).flat();
  }, [results]);

  // Perform search with debouncing
  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setResults({});
      setSelectedIndex(0);
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const searchResults: Record<string, SearchResult[]> = {};

    try {
      // Search recipes
      const { data: recipes } = await supabase
        .from("recipes")
        .select("id, name, description")
        .or(
          `name.ilike.%${query}%,description.ilike.%${query}%`
        )
        .limit(RESULTS_PER_CATEGORY);

      if (recipes) {
        searchResults.recipes = recipes.map((r) => ({
          id: r.id,
          title: r.name,
          category: "recipes",
          description: r.description,
          navPath: `/admin/menu/recipes/${r.id}/edit`,
          icon: CATEGORY_CONFIG.recipes.icon,
        }));
      }

      // Search ingredients
      const { data: ingredients } = await supabase
        .from("ingredients")
        .select("id, name")
        .ilike("name", `%${query}%`)
        .limit(RESULTS_PER_CATEGORY);

      if (ingredients) {
        searchResults.ingredients = ingredients.map((i) => ({
          id: i.id,
          title: i.name,
          category: "ingredients",
          navPath: `/admin/menu/ingredients`,
          icon: CATEGORY_CONFIG.ingredients.icon,
        }));
      }

      // Search contacts
      const { data: contacts } = await supabase
        .from("user_profiles")
        .select("id, first_name, last_name, email")
        .or(
          `first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%`
        )
        .limit(RESULTS_PER_CATEGORY);

      if (contacts) {
        searchResults.contacts = contacts.map((c) => ({
          id: c.id,
          title: `${c.first_name} ${c.last_name}`.trim() || c.email,
          category: "contacts",
          description: c.email,
          navPath: `/admin/contacts`,
          icon: CATEGORY_CONFIG.contacts.icon,
        }));
      }

      // Search orders
      const { data: orders } = await supabase
        .from("orders")
        .select("id, order_number")
        .ilike("order_number", `%${query}%`)
        .limit(RESULTS_PER_CATEGORY);

      if (orders) {
        searchResults.orders = orders.map((o) => ({
          id: o.id,
          title: `Order ${o.order_number}`,
          category: "orders",
          navPath: `/admin/orders`,
          icon: CATEGORY_CONFIG.orders.icon,
        }));
      }

      // Search subscriptions via user_profiles
      const { data: subscriptions } = await supabase
        .from("subscriptions")
        .select("id, user_id, user_profiles(first_name, last_name)")
        .limit(RESULTS_PER_CATEGORY);

      if (subscriptions) {
        searchResults.subscriptions = subscriptions
          .filter((s) => {
            const profile = (s.user_profiles as any)?.[0];
            const fullName = profile
              ? `${profile.first_name} ${profile.last_name}`.toLowerCase()
              : "";
            return (
              fullName.includes(query.toLowerCase()) ||
              s.id.toLowerCase().includes(query.toLowerCase())
            );
          })
          .slice(0, RESULTS_PER_CATEGORY)
          .map((s) => {
            const profile = (s.user_profiles as any)?.[0];
            const fullName = profile
              ? `${profile.first_name} ${profile.last_name}`.trim()
              : "Unknown";
            return {
              id: s.id,
              title: `Subscription - ${fullName}`,
              category: "subscriptions",
              navPath: `/admin/subscriptions`,
              icon: CATEGORY_CONFIG.subscriptions.icon,
            };
          });
      }

      // Search catering orders
      const { data: catering } = await supabase
        .from("catering_orders")
        .select("id, company_name, contact_name")
        .or(
          `company_name.ilike.%${query}%,contact_name.ilike.%${query}%`
        )
        .limit(RESULTS_PER_CATEGORY);

      if (catering) {
        searchResults.catering = catering.map((c) => ({
          id: c.id,
          title: c.company_name || c.contact_name,
          category: "catering",
          description: c.contact_name,
          navPath: `/admin/catering`,
          icon: CATEGORY_CONFIG.catering.icon,
        }));
      }

      // Search proposals
      const { data: proposals } = await supabase
        .from("catering_proposals")
        .select("id, company_name")
        .ilike("company_name", `%${query}%`)
        .limit(RESULTS_PER_CATEGORY);

      if (proposals) {
        searchResults.proposals = proposals.map((p) => ({
          id: p.id,
          title: p.company_name,
          category: "proposals",
          navPath: `/admin/catering/proposals/${p.id}`,
          icon: CATEGORY_CONFIG.proposals.icon,
        }));
      }

      // Search vendors
      const { data: vendors } = await supabase
        .from("vendors")
        .select("id, name, contact_name")
        .or(
          `name.ilike.%${query}%,contact_name.ilike.%${query}%`
        )
        .limit(RESULTS_PER_CATEGORY);

      if (vendors) {
        searchResults.vendors = vendors.map((v) => ({
          id: v.id,
          title: v.name,
          category: "vendors",
          description: v.contact_name,
          navPath: `/admin/vendors`,
          icon: CATEGORY_CONFIG.vendors.icon,
        }));
      }

      // Search events
      const { data: events } = await supabase
        .from("events")
        .select("id, name")
        .ilike("name", `%${query}%`)
        .limit(RESULTS_PER_CATEGORY);

      if (events) {
        searchResults.events = events.map((e) => ({
          id: e.id,
          title: e.name,
          category: "events",
          navPath: `/admin/events`,
          icon: CATEGORY_CONFIG.events.icon,
        }));
      }

      setResults(searchResults);
      setSelectedIndex(0);
    } catch (error) {
      console.error("Search error:", error);
      setResults({});
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle search input change with debouncing
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      performSearch(value);
    }, SEARCH_DEBOUNCE_MS);
  };

  // Handle result selection
  const handleSelectResult = (result: SearchResult) => {
    // Add to recent searches
    const updated = [result.title, ...recentSearches.filter((s) => s !== result.title)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem("madFresh_globalSearchRecent", JSON.stringify(updated));

    // Navigate
    onClose();
    router.push(result.navPath);
  };

  // Handle recent search click
  const handleRecentClick = (query: string) => {
    setSearchQuery(query);
    performSearch(query);
  };

  // Handle clear search
  const handleClear = () => {
    setSearchQuery("");
    setResults({});
    setSelectedIndex(0);
    searchInputRef.current?.focus();
  };

  if (!isOpen) return null;

  const hasResults = Object.keys(results).length > 0;
  const totalResults = flatResults.length;

  return (
    <div className="fixed inset-0 z-[999] flex items-start justify-center pt-24">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl mx-4 bg-white rounded-lg shadow-2xl overflow-hidden">
        {/* Search Input */}
        <div className="border-b border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <Search size={20} className="text-[#7a7060] flex-shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search recipes, ingredients, contacts, orders..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="flex-1 outline-none text-base text-gray-900 placeholder-gray-500"
            />
            {searchQuery && (
              <button
                onClick={handleClear}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={18} className="text-[#7a7060]" />
              </button>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin">
                <Clock size={24} className="text-[#3d6b2a]" />
              </div>
            </div>
          ) : searchQuery ? (
            hasResults ? (
              <div className="divide-y divide-gray-200">
                {Object.entries(results).map(([category, categoryResults]) => (
                  <div key={category}>
                    {/* Category Header */}
                    <div className="px-4 py-3 bg-gray-50 flex items-center gap-2 sticky top-0 z-10">
                      {(CATEGORY_CONFIG[category as keyof typeof CATEGORY_CONFIG]?.icon)}
                      <span className="text-xs font-semibold text-[#9a9080] uppercase tracking-wider">
                        {CATEGORY_CONFIG[category as keyof typeof CATEGORY_CONFIG]?.label ||
                          category}
                      </span>
                      <span className="ml-auto text-xs text-[#9a9080]">
                        {categoryResults.length}
                      </span>
                    </div>

                    {/* Category Results */}
                    <div>
                      {categoryResults.map((result, idx) => {
                        const globalIndex = flatResults.indexOf(result);
                        const isSelected = globalIndex === selectedIndex;

                        return (
                          <button
                            key={`${category}-${result.id}`}
                            onClick={() => handleSelectResult(result)}
                            className={`w-full text-left px-4 py-3 transition-colors border-l-4 flex items-start justify-between gap-3 ${
                              isSelected
                                ? "bg-[#e9f0e4] border-[#3d6b2a]"
                                : "border-transparent hover:bg-gray-50 hover:border-gray-300"
                            }`}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-900 truncate">
                                {result.title}
                              </div>
                              {result.description && (
                                <div className="text-sm text-[#9a9080] truncate">
                                  {result.description}
                                </div>
                              )}
                            </div>
                            {isSelected && (
                              <ArrowRight
                                size={16}
                                className="text-[#3d6b2a] flex-shrink-0 mt-1"
                              />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-[#9a9080]">
                <Search size={32} className="mx-auto mb-3 text-[#4a5e3a]" />
                <p className="text-base">No results found for "{searchQuery}"</p>
                <p className="text-sm text-[#7a7060] mt-1">
                  Try searching with different keywords
                </p>
              </div>
            )
          ) : (
            // Recent searches view
            <div className="p-4">
              {recentSearches.length > 0 ? (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Clock size={16} className="text-[#7a7060]" />
                    <p className="text-xs font-semibold text-[#9a9080] uppercase tracking-wider">
                      Recent Searches
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((search) => (
                      <button
                        key={search}
                        onClick={() => handleRecentClick(search)}
                        className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        {search}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center text-[#9a9080] py-8">
                  <Search size={24} className="mx-auto mb-2 text-[#4a5e3a]" />
                  <p className="text-sm">Start typing to search</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 bg-gray-50 px-4 py-2.5 flex items-center justify-between text-xs text-[#9a9080]">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>Esc Close</span>
          </div>
          {totalResults > 0 && (
            <span>{totalResults} result{totalResults !== 1 ? "s" : ""}</span>
          )}
        </div>
      </div>
    </div>
  );
}
