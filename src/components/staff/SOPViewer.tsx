"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Search, FileText, ChevronRight, Clock, Users, Check,
  AlertTriangle, ExternalLink, Video, ArrowLeft, Loader,
  CheckCircle2, BookOpen, X
} from "lucide-react";
import SafeHTML from "@/components/SafeHTML";

interface SOPCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string;
  color: string;
  sort_order: number;
}

interface SOPListItem {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  status: string;
  version: number;
  visible_to_roles: string[];
  time_percent: number | null;
  updated_at: string;
  published_at: string | null;
  category_id: string | null;
  sop_categories: { id: string; name: string; slug: string; icon: string; color: string } | null;
  sop_steps: { id: string }[];
}

interface SOPStep {
  id: string;
  title: string;
  description: string | null;
  content_html: string;
  step_number: number;
  estimated_minutes: number | null;
  is_critical: boolean;
  checklist: Array<{ text: string; done?: boolean }>;
  sop_resources?: Array<{
    id: string;
    resource_type: string;
    title: string;
    url: string;
    description: string | null;
  }>;
}

interface SOPDetail {
  id: string;
  title: string;
  description: string | null;
  content_html: string;
  status: string;
  version: number;
  visible_to_roles: string[];
  time_percent: number | null;
  updated_at: string;
  published_at: string | null;
  sop_categories: { id: string; name: string; slug: string; icon: string; color: string } | null;
  sop_steps: SOPStep[];
}

export default function SOPViewer() {
  const [sops, setSOPs] = useState<SOPListItem[]>([]);
  const [categories, setCategories] = useState<SOPCategory[]>([]);
  const [userRole, setUserRole] = useState("");
  const [loading, setLoading] = useState(true);

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Detail view
  const [selectedSOP, setSelectedSOP] = useState<SOPDetail | null>(null);
  const [loadingSOP, setLoadingSOP] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [checkedItems, setCheckedItems] = useState<Record<string, Set<number>>>({}); // stepId -> checked indexes

  // Task assignments for the current SOP
  const [taskMap, setTaskMap] = useState<Record<string, { id: string; status: string; assigned_to: string | null }>>({});
  // stepId -> task info

  useEffect(() => {
    fetchSOPs();
  }, []);

  const fetchSOPs = async () => {
    try {
      const res = await fetch("/api/staff/sops");
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setSOPs(data.sops || []);
      setCategories(data.categories || []);
      setUserRole(data.userRole || "");
    } catch {
      // handle silently
    } finally {
      setLoading(false);
    }
  };

  const openSOP = async (id: string) => {
    setLoadingSOP(true);
    setCompletedSteps(new Set());
    setCheckedItems({});
    setTaskMap({});
    try {
      const [sopRes, tasksRes] = await Promise.all([
        fetch(`/api/staff/sops?id=${id}`),
        fetch(`/api/staff/tasks?sop_id=${id}`),
      ]);
      if (!sopRes.ok) throw new Error("Failed to load SOP");
      const sopData = await sopRes.json();
      setSelectedSOP(sopData);

      // Build task map: stepId -> task
      if (tasksRes.ok) {
        const taskData = await tasksRes.json();
        const map: Record<string, { id: string; status: string; assigned_to: string | null }> = {};
        const doneSteps = new Set<string>();
        for (const t of (taskData.tasks || [])) {
          if (t.sop_step_id) {
            map[t.sop_step_id] = { id: t.id, status: t.status, assigned_to: t.assigned_to };
            if (t.status === "done") doneSteps.add(t.sop_step_id);
          }
        }
        setTaskMap(map);
        setCompletedSteps(doneSteps);
      }
    } catch {
      alert("Could not load this SOP");
    } finally {
      setLoadingSOP(false);
    }
  };

  const toggleStepComplete = async (stepId: string) => {
    const isCompleting = !completedSteps.has(stepId);
    setCompletedSteps(prev => {
      const next = new Set(prev);
      if (next.has(stepId)) next.delete(stepId);
      else next.add(stepId);
      return next;
    });

    // If there's a task linked to this step, update it
    const task = taskMap[stepId];
    if (task) {
      try {
        await fetch("/api/staff/tasks", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: task.id,
            status: isCompleting ? "done" : "todo",
          }),
        });
        setTaskMap(prev => ({
          ...prev,
          [stepId]: { ...prev[stepId], status: isCompleting ? "done" : "todo" },
        }));
      } catch {
        // silent — UI already updated
      }
    }
  };

  const toggleCheckItem = (stepId: string, idx: number) => {
    setCheckedItems(prev => {
      const stepSet = new Set(prev[stepId] || []);
      if (stepSet.has(idx)) stepSet.delete(idx);
      else stepSet.add(idx);
      return { ...prev, [stepId]: stepSet };
    });
  };

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

  const categorySOPCounts = categories.map(cat => ({
    ...cat,
    count: sops.filter(s => s.category_id === cat.id).length,
  })).filter(cat => cat.count > 0);

  const totalMinutes = selectedSOP?.sop_steps?.reduce(
    (sum, s) => sum + (s.estimated_minutes || 0), 0
  ) || 0;

  // ── Detail View ──
  if (selectedSOP) {
    const progress = selectedSOP.sop_steps.length > 0
      ? Math.round((completedSteps.size / selectedSOP.sop_steps.length) * 100)
      : 0;

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start gap-4">
          <button
            onClick={() => setSelectedSOP(null)}
            className="mt-1 p-2 hover:bg-gray-100 rounded-lg text-[#9a9080] transition shrink-0"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {selectedSOP.sop_categories && (
                <span
                  className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full"
                  style={{
                    backgroundColor: selectedSOP.sop_categories.color + "15",
                    color: selectedSOP.sop_categories.color,
                  }}
                >
                  {selectedSOP.sop_categories.name}
                </span>
              )}
              <span className="text-[11px] text-[#7a7060]">v{selectedSOP.version}</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900">{selectedSOP.title}</h1>
            {selectedSOP.description && (
              <p className="text-sm text-[#9a9080] mt-1">{selectedSOP.description}</p>
            )}
            <div className="flex items-center gap-4 mt-2 text-[12px] text-[#7a7060]">
              {totalMinutes > 0 && (
                <span className="flex items-center gap-1">
                  <Clock size={12} /> ~{totalMinutes} min total
                </span>
              )}
              <span className="flex items-center gap-1">
                <BookOpen size={12} /> {selectedSOP.sop_steps.length} steps
              </span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        {selectedSOP.sop_steps.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-gray-700">Progress</span>
              <span className="text-sm font-bold text-[#3d6b2a]">{progress}%</span>
            </div>
            <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#3d6b2a] rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-[11px] text-[#7a7060] mt-1.5">
              {completedSteps.size} of {selectedSOP.sop_steps.length} steps completed
            </p>
          </div>
        )}

        {/* Overview */}
        {selectedSOP.content_html && (
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Overview</h2>
            <SafeHTML
              html={selectedSOP.content_html}
              className="prose prose-sm max-w-none text-gray-700"
            />
          </div>
        )}

        {/* Steps */}
        <div className="space-y-3">
          {selectedSOP.sop_steps.map((step, i) => {
            const isCompleted = completedSteps.has(step.id);
            const stepChecked = checkedItems[step.id] || new Set();

            return (
              <div
                key={step.id}
                className={`bg-white border rounded-xl overflow-hidden transition-all ${
                  isCompleted
                    ? "border-green-200 bg-green-50/30"
                    : step.is_critical
                    ? "border-amber-200"
                    : "border-gray-200"
                }`}
              >
                {/* Step Header */}
                <div className="flex items-start gap-3 p-4">
                  <button
                    onClick={() => toggleStepComplete(step.id)}
                    className={`mt-0.5 w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 transition ${
                      isCompleted
                        ? "bg-[#3d6b2a] border-[#3d6b2a] text-[#1e2d18]"
                        : "border-gray-300 hover:border-[#3d6b2a]"
                    }`}
                  >
                    {isCompleted ? <Check size={14} /> : <span className="text-xs font-bold text-[#7a7060]">{i + 1}</span>}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className={`text-sm font-semibold ${isCompleted ? "text-[#7a7060] line-through" : "text-gray-900"}`}>
                        {step.title}
                      </h3>
                      {step.is_critical && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 flex items-center gap-0.5">
                          <AlertTriangle size={10} /> Critical
                        </span>
                      )}
                      {taskMap[step.id] && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5 ${
                          taskMap[step.id].status === "done"
                            ? "bg-green-50 text-green-600"
                            : taskMap[step.id].status === "in_progress"
                            ? "bg-blue-50 text-blue-600"
                            : "bg-gray-50 text-[#9a9080]"
                        }`}>
                          {taskMap[step.id].status === "done" ? "Completed" : taskMap[step.id].status === "in_progress" ? "In Progress" : "Assigned"}
                        </span>
                      )}
                    </div>
                    {step.estimated_minutes && (
                      <span className="text-[11px] text-[#7a7060] flex items-center gap-0.5 mt-0.5">
                        <Clock size={10} /> {step.estimated_minutes} min
                      </span>
                    )}
                  </div>
                </div>

                {/* Step Content */}
                {(step.content_html || step.checklist?.length > 0 || (step.sop_resources && step.sop_resources.length > 0)) && (
                  <div className="px-4 pb-4 pl-14 space-y-3">
                    {step.content_html && (
                      <SafeHTML
                        html={step.content_html}
                        className="prose prose-sm max-w-none text-[#9a9080]"
                      />
                    )}

                    {/* Checklist */}
                    {step.checklist && step.checklist.length > 0 && (
                      <div className="space-y-1.5">
                        {step.checklist.map((item, ci) => (
                          <button
                            key={ci}
                            onClick={() => toggleCheckItem(step.id, ci)}
                            className="flex items-start gap-2 w-full text-left group"
                          >
                            <div className={`mt-0.5 w-4.5 h-4.5 rounded border flex items-center justify-center shrink-0 transition ${
                              stepChecked.has(ci)
                                ? "bg-[#3d6b2a] border-[#3d6b2a] text-[#1e2d18]"
                                : "border-gray-300 group-hover:border-[#3d6b2a]"
                            }`}>
                              {stepChecked.has(ci) && <Check size={10} />}
                            </div>
                            <span className={`text-sm ${stepChecked.has(ci) ? "text-[#7a7060] line-through" : "text-gray-700"}`}>
                              {item.text}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Resources */}
                    {step.sop_resources && step.sop_resources.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {step.sop_resources.map(res => (
                          <a
                            key={res.id}
                            href={res.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition"
                          >
                            {res.resource_type === "video" ? <Video size={12} /> : <ExternalLink size={12} />}
                            {res.title}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Completion */}
        {progress === 100 && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center">
            <CheckCircle2 size={32} className="mx-auto mb-2 text-[#3d6b2a]" />
            <p className="text-lg font-bold text-[#3d6b2a]">All Steps Completed!</p>
            <p className="text-sm text-green-600 mt-1">Great work following this procedure.</p>
          </div>
        )}
      </div>
    );
  }

  // ── List View ──
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader size={24} className="animate-spin text-[#3d6b2a]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <BookOpen size={22} className="text-[#3d6b2a]" />
          Standard Procedures
        </h1>
        <p className="text-sm text-[#9a9080] mt-0.5">Step-by-step guides for your role</p>
      </div>

      {/* Category Filter */}
      {categorySOPCounts.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
              !selectedCategory
                ? "bg-[#3d6b2a] text-[#1e2d18]"
                : "bg-gray-100 text-[#9a9080] hover:bg-gray-200"
            }`}
          >
            All ({sops.length})
          </button>
          {categorySOPCounts.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
              className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
                selectedCategory === cat.id
                  ? "bg-[#3d6b2a] text-[#1e2d18]"
                  : "bg-gray-100 text-[#9a9080] hover:bg-gray-200"
              }`}
            >
              {cat.name} ({cat.count})
            </button>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7a7060]" />
        <input
          type="text"
          placeholder="Search procedures..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#3d6b2a] focus:ring-2 focus:ring-[#3d6b2a]/20"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7a7060]">
            <X size={14} />
          </button>
        )}
      </div>

      {/* SOP Cards */}
      {filteredSOPs.length > 0 ? (
        <div className="space-y-2">
          {filteredSOPs.map(sop => (
            <button
              key={sop.id}
              onClick={() => openSOP(sop.id)}
              disabled={loadingSOP}
              className="w-full flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-4 hover:border-[#3d6b2a]/30 hover:shadow-sm transition text-left group"
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
                <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-[#3d6b2a] transition">
                  {sop.title}
                </p>
                <div className="flex items-center gap-3 mt-0.5">
                  {sop.sop_categories && (
                    <span className="text-[11px] text-[#9a9080]">{sop.sop_categories.name}</span>
                  )}
                  <span className="text-[11px] text-[#7a7060] flex items-center gap-0.5">
                    <BookOpen size={10} /> {sop.sop_steps?.length || 0} steps
                  </span>
                </div>
              </div>
              <ChevronRight size={16} className="text-[#4a5e3a] group-hover:text-[#3d6b2a] shrink-0 transition" />
            </button>
          ))}
        </div>
      ) : (
        <div className="py-16 text-center">
          <BookOpen size={36} className="mx-auto mb-3 text-[#4a5e3a]" />
          <p className="text-[#9a9080] font-medium">
            {searchQuery || selectedCategory ? "No procedures match your search" : "No procedures available yet"}
          </p>
          <p className="text-[#7a7060] text-sm mt-1">
            Check back soon — your team is building out guides for your role.
          </p>
        </div>
      )}
    </div>
  );
}
