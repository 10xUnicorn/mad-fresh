"use client";

import { useState, useEffect } from "react";
import {
  ListTodo, Plus, Loader, Check, Clock, AlertTriangle,
  Trash2, ChevronDown, ChevronRight, User, CalendarDays,
  CheckCircle2, Circle, Play, X, Filter, RefreshCw
} from "lucide-react";

interface SOPStep {
  id: string;
  title: string;
  step_number: number;
  is_critical: boolean;
  estimated_minutes: number | null;
  checklist: Array<{ text: string }>;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  priority: string;
  status: string;
  notes: string | null;
  sop_id: string | null;
  sop_step_id: string | null;
  assigned_to: string | null;
  completed_at: string | null;
  created_at: string;
  sop_steps: SOPStep | null;
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
}

interface SOPOption {
  id: string;
  title: string;
  stepCount: number;
}

interface Props {
  sopId?: string;
  sopTitle?: string;
  teamMembers: TeamMember[];
  sops: SOPOption[];
}

export default function SOPTaskManager({ sopId, sopTitle, teamMembers, sops }: Props) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showGenerateModal, setShowGenerateModal] = useState(false);

  // Generate form state
  const [genSopId, setGenSopId] = useState(sopId || "");
  const [genAssignTo, setGenAssignTo] = useState("");
  const [genDueDate, setGenDueDate] = useState("");
  const [genPriority, setGenPriority] = useState("normal");

  useEffect(() => {
    fetchTasks();
  }, [sopId, statusFilter]);

  const fetchTasks = async () => {
    try {
      let url = "/api/admin/tasks?";
      if (sopId) url += `sop_id=${sopId}&`;
      if (statusFilter !== "all") url += `status=${statusFilter}&`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setTasks(data || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const generateTasks = async () => {
    if (!genSopId) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/admin/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sopId: genSopId,
          assignedTo: genAssignTo || null,
          dueDate: genDueDate || null,
          priority: genPriority,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setShowGenerateModal(false);
      setGenSopId(sopId || "");
      setGenAssignTo("");
      setGenDueDate("");
      setGenPriority("normal");
      fetchTasks();
    } catch (err: any) {
      alert(err.message || "Failed to generate tasks");
    } finally {
      setGenerating(false);
    }
  };

  const updateTask = async (id: string, updates: Record<string, any>) => {
    try {
      const res = await fetch("/api/admin/tasks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...updates }),
      });
      if (!res.ok) throw new Error("Failed to update");
      setTasks(prev =>
        prev.map(t => {
          if (t.id !== id) return t;
          const updated = { ...t };
          if (updates.status) updated.status = updates.status;
          if (updates.assignedTo !== undefined) updated.assigned_to = updates.assignedTo;
          if (updates.priority) updated.priority = updates.priority;
          if (updates.status === "done") updated.completed_at = new Date().toISOString();
          if (updates.status === "todo" || updates.status === "in_progress") updated.completed_at = null;
          return updated;
        })
      );
    } catch {
      alert("Failed to update task");
    }
  };

  const deleteTask = async (id: string) => {
    if (!confirm("Delete this task?")) return;
    try {
      const res = await fetch(`/api/admin/tasks?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      setTasks(prev => prev.filter(t => t.id !== id));
    } catch {
      alert("Failed to delete");
    }
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case "done": return <CheckCircle2 size={16} className="text-green-500" />;
      case "in_progress": return <Play size={16} className="text-blue-500" />;
      default: return <Circle size={16} className="text-[#4a5e3a]" />;
    }
  };

  const priorityBadge = (priority: string) => {
    const styles: Record<string, string> = {
      high: "bg-red-50 text-red-600",
      normal: "bg-gray-50 text-[#9a9080]",
      low: "bg-blue-50 text-blue-500",
    };
    return (
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${styles[priority] || styles.normal}`}>
        {priority}
      </span>
    );
  };

  const getMemberName = (id: string | null) => {
    if (!id) return "Unassigned";
    return teamMembers.find(m => m.id === id)?.name || "Unknown";
  };

  // Group tasks by SOP step (for SOP-specific view)
  const groupedByStep = sopId
    ? tasks.reduce((acc, task) => {
        const stepNum = task.sop_steps?.step_number || 0;
        if (!acc[stepNum]) acc[stepNum] = { step: task.sop_steps, tasks: [] };
        acc[stepNum].tasks.push(task);
        return acc;
      }, {} as Record<number, { step: SOPStep | null; tasks: Task[] }>)
    : null;

  const todoCount = tasks.filter(t => t.status === "todo").length;
  const inProgressCount = tasks.filter(t => t.status === "in_progress").length;
  const doneCount = tasks.filter(t => t.status === "done").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader size={20} className="animate-spin text-[#3d6b2a]" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <ListTodo size={18} className="text-[#3d6b2a]" />
          <h3 className="text-sm font-bold text-[#1e2d18]">
            {sopTitle ? `Tasks: ${sopTitle}` : "All Tasks"}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchTasks()}
            className="p-2 text-[#7a7060] hover:text-[#9a9080] hover:bg-gray-100 rounded-lg transition"
            title="Refresh"
          >
            <RefreshCw size={14} />
          </button>
          <button
            onClick={() => {
              setGenSopId(sopId || "");
              setShowGenerateModal(true);
            }}
            className="px-3 py-1.5 bg-[#3d6b2a] text-white text-xs font-semibold rounded-lg hover:bg-[#2f5720] transition flex items-center gap-1.5"
          >
            <Plus size={14} /> Generate from SOP
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="flex items-center gap-3 text-xs">
        <button
          onClick={() => setStatusFilter("all")}
          className={`px-3 py-1.5 rounded-lg font-medium transition ${
            statusFilter === "all" ? "bg-white text-gray-900" : "bg-[#f2efe8] text-[#4a5e3a] hover:bg-[#f0ece3]"
          }`}
        >
          All ({tasks.length})
        </button>
        <button
          onClick={() => setStatusFilter("todo")}
          className={`px-3 py-1.5 rounded-lg font-medium transition ${
            statusFilter === "todo" ? "bg-white text-gray-900" : "bg-[#f2efe8] text-[#4a5e3a] hover:bg-[#f0ece3]"
          }`}
        >
          To Do ({todoCount})
        </button>
        <button
          onClick={() => setStatusFilter("in_progress")}
          className={`px-3 py-1.5 rounded-lg font-medium transition ${
            statusFilter === "in_progress" ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-600 hover:bg-blue-100"
          }`}
        >
          In Progress ({inProgressCount})
        </button>
        <button
          onClick={() => setStatusFilter("done")}
          className={`px-3 py-1.5 rounded-lg font-medium transition ${
            statusFilter === "done" ? "bg-green-600 text-white" : "bg-green-50 text-green-600 hover:bg-green-100"
          }`}
        >
          Done ({doneCount})
        </button>
      </div>

      {/* Task List */}
      {tasks.length === 0 ? (
        <div className="border-2 border-dashed border-[#ddd8cc] rounded-xl py-10 text-center">
          <ListTodo size={28} className="mx-auto mb-2 text-[#9a9080]" />
          <p className="text-[#7a7060] text-sm mb-3">No tasks yet</p>
          <button
            onClick={() => {
              setGenSopId(sopId || "");
              setShowGenerateModal(true);
            }}
            className="px-4 py-2 bg-[#3d6b2a] text-white text-sm font-semibold rounded-lg hover:bg-[#2f5720] transition inline-flex items-center gap-1.5"
          >
            <Plus size={14} /> Generate Tasks from SOP
          </button>
        </div>
      ) : groupedByStep ? (
        // Grouped by step view for SOP-specific
        <div className="space-y-3">
          {Object.entries(groupedByStep)
            .sort(([a], [b]) => Number(a) - Number(b))
            .map(([stepNum, { step, tasks: stepTasks }]) => (
              <div key={stepNum} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-100">
                  <span className="text-xs font-bold text-[#3d6b2a] bg-[#E8F5E3] w-6 h-6 rounded-full flex items-center justify-center shrink-0">
                    {step?.step_number || stepNum}
                  </span>
                  <span className="text-sm font-semibold text-gray-900 flex-1">
                    {step?.title || "Standalone Task"}
                  </span>
                  {step?.is_critical && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 flex items-center gap-0.5">
                      <AlertTriangle size={10} /> Critical
                    </span>
                  )}
                  {step?.estimated_minutes && (
                    <span className="text-[11px] text-[#7a7060] flex items-center gap-0.5">
                      <Clock size={10} /> {step.estimated_minutes}m
                    </span>
                  )}
                </div>
                <div className="divide-y divide-gray-100">
                  {stepTasks.map(task => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      teamMembers={teamMembers}
                      getMemberName={getMemberName}
                      statusIcon={statusIcon}
                      priorityBadge={priorityBadge}
                      onUpdate={updateTask}
                      onDelete={deleteTask}
                    />
                  ))}
                </div>
              </div>
            ))}
        </div>
      ) : (
        // Flat list view
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
          {tasks.map(task => (
            <TaskRow
              key={task.id}
              task={task}
              teamMembers={teamMembers}
              getMemberName={getMemberName}
              statusIcon={statusIcon}
              priorityBadge={priorityBadge}
              onUpdate={updateTask}
              onDelete={deleteTask}
            />
          ))}
        </div>
      )}

      {/* Generate Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Generate Tasks from SOP</h3>
              <button onClick={() => setShowGenerateModal(false)} className="p-1 text-[#7a7060] hover:text-[#9a9080]">
                <X size={18} />
              </button>
            </div>

            <p className="text-sm text-[#9a9080]">
              This will create an individual task for each step in the selected SOP.
            </p>

            <div className="space-y-3">
              {/* SOP Selection */}
              <div>
                <label className="block text-xs font-semibold text-[#9a9080] mb-1">SOP</label>
                <select
                  value={genSopId}
                  onChange={e => setGenSopId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#3d6b2a] bg-white"
                  disabled={!!sopId}
                >
                  <option value="">Select an SOP...</option>
                  {sops.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.title} ({s.stepCount} steps)
                    </option>
                  ))}
                </select>
              </div>

              {/* Assign To */}
              <div>
                <label className="block text-xs font-semibold text-[#9a9080] mb-1">Assign To</label>
                <select
                  value={genAssignTo}
                  onChange={e => setGenAssignTo(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#3d6b2a] bg-white"
                >
                  <option value="">Unassigned</option>
                  {teamMembers.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.role})
                    </option>
                  ))}
                </select>
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-xs font-semibold text-[#9a9080] mb-1">Due Date</label>
                <input
                  type="date"
                  value={genDueDate}
                  onChange={e => setGenDueDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#3d6b2a]"
                />
              </div>

              {/* Priority */}
              <div>
                <label className="block text-xs font-semibold text-[#9a9080] mb-1">Default Priority</label>
                <div className="flex gap-2">
                  {["low", "normal", "high"].map(p => (
                    <button
                      key={p}
                      onClick={() => setGenPriority(p)}
                      className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium border transition ${
                        genPriority === p
                          ? p === "high"
                            ? "bg-red-50 border-red-300 text-red-600"
                            : p === "low"
                            ? "bg-blue-50 border-blue-300 text-blue-600"
                            : "bg-gray-100 border-gray-400 text-gray-700"
                          : "bg-white border-gray-200 text-[#9a9080] hover:bg-gray-50"
                      }`}
                    >
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-[#7a7060] mt-1">Critical steps auto-set to High</p>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowGenerateModal(false)}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition text-sm"
              >
                Cancel
              </button>
              <button
                onClick={generateTasks}
                disabled={!genSopId || generating}
                className="flex-1 px-4 py-2.5 bg-[#3d6b2a] text-white font-medium rounded-lg hover:bg-[#2f5720] transition text-sm disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {generating ? <Loader size={14} className="animate-spin" /> : <Plus size={14} />}
                Generate Tasks
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Individual Task Row ──
function TaskRow({
  task,
  teamMembers,
  getMemberName,
  statusIcon,
  priorityBadge,
  onUpdate,
  onDelete,
}: {
  task: Task;
  teamMembers: TeamMember[];
  getMemberName: (id: string | null) => string;
  statusIcon: (status: string) => React.ReactNode;
  priorityBadge: (priority: string) => React.ReactNode;
  onUpdate: (id: string, updates: Record<string, any>) => void;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const cycleStatus = () => {
    const next: Record<string, string> = {
      todo: "in_progress",
      in_progress: "done",
      done: "todo",
    };
    onUpdate(task.id, { status: next[task.status] || "todo" });
  };

  // Extract just the step title (remove SOP prefix)
  const displayTitle = task.sop_steps
    ? task.sop_steps.title
    : task.title;

  return (
    <div className={`px-4 py-3 ${task.status === "done" ? "bg-green-50/30" : ""}`}>
      <div className="flex items-center gap-3">
        <button onClick={cycleStatus} className="shrink-0 hover:scale-110 transition-transform">
          {statusIcon(task.status)}
        </button>
        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setExpanded(!expanded)}>
          <p className={`text-sm font-medium truncate ${task.status === "done" ? "text-[#7a7060] line-through" : "text-gray-900"}`}>
            {displayTitle}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            {priorityBadge(task.priority)}
            <span className="text-[11px] text-[#7a7060] flex items-center gap-0.5">
              <User size={10} /> {getMemberName(task.assigned_to)}
            </span>
            {task.due_date && (
              <span className={`text-[11px] flex items-center gap-0.5 ${
                new Date(task.due_date) < new Date() && task.status !== "done"
                  ? "text-red-500 font-semibold" : "text-[#7a7060]"
              }`}>
                <CalendarDays size={10} /> {new Date(task.due_date).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1 text-[#7a7060] hover:text-[#9a9080]"
          >
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
          <button
            onClick={() => onDelete(task.id)}
            className="p-1 text-[#4a5e3a] hover:text-red-500 transition"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="mt-3 ml-7 space-y-3">
          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2">
            <select
              value={task.assigned_to || ""}
              onChange={e => onUpdate(task.id, { assignedTo: e.target.value || null })}
              className="px-2 py-1 border border-gray-200 rounded text-xs bg-white focus:outline-none focus:border-[#3d6b2a]"
            >
              <option value="">Unassigned</option>
              {teamMembers.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
            <select
              value={task.priority}
              onChange={e => onUpdate(task.id, { priority: e.target.value })}
              className="px-2 py-1 border border-gray-200 rounded text-xs bg-white focus:outline-none focus:border-[#3d6b2a]"
            >
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
            </select>
            <select
              value={task.status}
              onChange={e => onUpdate(task.id, { status: e.target.value })}
              className="px-2 py-1 border border-gray-200 rounded text-xs bg-white focus:outline-none focus:border-[#3d6b2a]"
            >
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
            </select>
          </div>

          {/* SOP Step Checklist */}
          {task.sop_steps?.checklist && task.sop_steps.checklist.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-[11px] font-semibold text-[#9a9080] mb-1.5 uppercase tracking-wide">Step Checklist</p>
              <div className="space-y-1">
                {task.sop_steps.checklist.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-[#9a9080]">
                    <Check size={10} className="text-[#3d6b2a] shrink-0" />
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Description / Critical flag */}
          {task.description && (
            <p className="text-xs text-[#9a9080]">{task.description}</p>
          )}

          {task.completed_at && (
            <p className="text-[11px] text-green-600">
              Completed {new Date(task.completed_at).toLocaleString()}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
