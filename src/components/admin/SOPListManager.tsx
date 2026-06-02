"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus, Search, FileText, ChevronRight, X, Loader,
  Eye, EyeOff, Clock, Users, Filter
} from "lucide-react";

interface SOPCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string;
  color: string;
  sort_order: number;
}

interface SOP {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  status: string;
  version: number;
  visible_to_roles: string[];
  time_percent: number | null;
  assigned_to: string[] | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  category_id: string | null;
  sop_categories: { id: string; name: string; slug: string; icon: string; color: string } | null;
  sop_steps: { id: string }[];
}

interface Props {
  initialCategories: SOPCategory[];
  initialSOPs: SOP[];
}

const ROLE_OPTIONS = [
  { value: "admin", label: "Admin" },
  { value: "manager", label: "Manager" },
  { value: "staff", label: "Kitchen Staff" },
  { value: "driver", label: "Driver" },
];

export default function SOPListManager({ initialCategories, initialSOPs }: Props) {
  const router = useRouter();
  const [sops, setSOPs] = useState<SOP[]>(initialSOPs);
  const [categories] = useState<SOPCategory[]>(initialCategories);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);

  // Create form
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newCategoryId, setNewCategoryId] = useState("");
  const [newRoles, setNewRoles] = useState<string[]>([]);

  const filteredSOPs = sops.filter(sop => {
    if (selectedCategory && sop.category_id !== selectedCategory) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        sop.title.toLowerCase().includes(q) ||
        (sop.description || "").toLowerCase().includes(q) ||
        (sop.sop_categories?.name || "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    setCreating(true);

    try {
      const res = await fetch("/api/admin/sops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          description: newDesc.trim() || null,
          categoryId: newCategoryId || null,
          visibleToRoles: newRoles,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Navigate to the editor
      router.push(`/admin/sops/${data.id}`);
    } catch (err: any) {
      alert(err.message || "Failed to create SOP");
    } finally {
      setCreating(false);
    }
  };

  const categorySOPCounts = categories.map(cat => ({
    ...cat,
    count: sops.filter(s => s.category_id === cat.id).length,
  }));

  return (
    <>
      {/* Category Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {categorySOPCounts.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
            className={`text-left p-4 rounded-xl border-2 transition-all ${
              selectedCategory === cat.id
                ? "border-[#3d6b2a] bg-[#E8F5E3]"
                : "border-gray-200 bg-white hover:border-gray-300"
            }`}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[#1e2d18] text-sm font-bold mb-2"
              style={{ backgroundColor: cat.color + "25", color: cat.color }}
            >
              {cat.count}
            </div>
            <p className="text-sm font-semibold text-gray-900 line-clamp-1">{cat.name}</p>
            <p className="text-[11px] text-[#9a9080] line-clamp-1 mt-0.5">{cat.description}</p>
          </button>
        ))}
      </div>

      {/* Search + Create */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7a7060]" />
          <input
            type="text"
            placeholder="Search SOPs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#3d6b2a] focus:ring-2 focus:ring-[#3d6b2a]/20"
          />
        </div>
        {selectedCategory && (
          <button
            onClick={() => setSelectedCategory(null)}
            className="px-4 py-2.5 text-sm font-medium text-[#9a9080] bg-gray-100 rounded-xl hover:bg-gray-200 transition flex items-center gap-1.5"
          >
            <X size={14} /> Clear Filter
          </button>
        )}
        <button
          onClick={() => setShowCreate(true)}
          className="px-5 py-2.5 bg-[#3d6b2a] hover:bg-[#2f5720] text-white font-semibold rounded-xl transition inline-flex items-center gap-2 whitespace-nowrap"
        >
          <Plus size={18} /> New SOP
        </button>
      </div>

      {/* SOP List */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        {filteredSOPs.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {filteredSOPs.map(sop => (
              <Link
                key={sop.id}
                href={`/admin/sops/${sop.id}`}
                className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition group"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: (sop.sop_categories?.color || "#6B7280") + "15",
                    color: sop.sop_categories?.color || "#6B7280",
                  }}
                >
                  <FileText size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-900 truncate">{sop.title}</p>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      sop.status === "published"
                        ? "bg-green-50 text-green-600"
                        : "bg-amber-50 text-amber-600"
                    }`}>
                      {sop.status}
                    </span>
                    {sop.version > 1 && (
                      <span className="text-[10px] text-[#7a7060]">v{sop.version}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    {sop.sop_categories && (
                      <span className="text-[11px] text-[#9a9080]">{sop.sop_categories.name}</span>
                    )}
                    <span className="text-[11px] text-[#7a7060] flex items-center gap-0.5">
                      <Clock size={10} /> {sop.sop_steps?.length || 0} steps
                    </span>
                    {sop.visible_to_roles.length > 0 && (
                      <span className="text-[11px] text-[#7a7060] flex items-center gap-0.5">
                        <Users size={10} /> {sop.visible_to_roles.join(", ")}
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight size={16} className="text-[#4a5e3a] group-hover:text-[#9a9080] shrink-0" />
              </Link>
            ))}
          </div>
        ) : (
          <div className="px-6 py-16 text-center">
            <FileText size={36} className="mx-auto mb-3 text-[#4a5e3a]" />
            <p className="text-[#9a9080] font-medium">
              {searchQuery || selectedCategory ? "No SOPs match your filter" : "No SOPs created yet"}
            </p>
            <p className="text-[#7a7060] text-sm mt-1">Create your first SOP to start documenting processes</p>
            <button
              onClick={() => setShowCreate(true)}
              className="mt-4 px-5 py-2.5 bg-[#3d6b2a] text-white font-semibold rounded-xl hover:bg-[#2f5720] transition inline-flex items-center gap-2 text-sm"
            >
              <Plus size={16} /> Create First SOP
            </button>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/20 flex items-end sm:items-center justify-center z-50">
          <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[90dvh] flex flex-col">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">New SOP</h3>
              <button onClick={() => setShowCreate(false)} className="p-2 hover:bg-gray-100 rounded-lg text-[#9a9080]">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Title *</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g., Chicken Breast Marinating Process"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3d6b2a]/30 focus:border-[#3d6b2a]"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Description</label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  rows={2}
                  placeholder="Brief overview of what this SOP covers"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3d6b2a]/30 focus:border-[#3d6b2a] resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Category</label>
                <select
                  value={newCategoryId}
                  onChange={(e) => setNewCategoryId(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3d6b2a]/30 focus:border-[#3d6b2a] bg-white"
                >
                  <option value="">Select category...</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Visible to Roles</label>
                <div className="flex flex-wrap gap-2">
                  {ROLE_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => {
                        setNewRoles(prev =>
                          prev.includes(opt.value)
                            ? prev.filter(r => r !== opt.value)
                            : [...prev, opt.value]
                        );
                      }}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                        newRoles.includes(opt.value)
                          ? "bg-[#E8F5E3] border-[#3d6b2a] text-[#3d6b2a]"
                          : "bg-gray-50 border-gray-200 text-[#9a9080] hover:border-gray-300"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-[#7a7060] mt-1.5">
                  {newRoles.length === 0 ? "Visible to all roles" : `Visible to: ${newRoles.join(", ")}`}
                </p>
              </div>
            </div>

            <div className="flex gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 sm:rounded-b-2xl">
              <button
                onClick={() => setShowCreate(false)}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:border-gray-400 transition min-h-[44px]"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={creating || !newTitle.trim()}
                className="flex-1 px-4 py-2.5 bg-[#3d6b2a] hover:bg-[#2f5720] text-white font-medium rounded-lg transition disabled:opacity-50 min-h-[44px] flex items-center justify-center gap-2"
              >
                {creating ? <><Loader size={16} className="animate-spin" /> Creating...</> : "Create & Edit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
