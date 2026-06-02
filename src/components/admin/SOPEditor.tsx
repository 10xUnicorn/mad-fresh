"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import LinkExtension from "@tiptap/extension-link";
import ImageExtension from "@tiptap/extension-image";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import {
  ArrowLeft, Save, Eye, Loader, Plus, Trash2, GripVertical,
  Bold, Italic, UnderlineIcon, List, ListOrdered, Link2, Image,
  Heading1, Heading2, Undo, Redo, Video, ExternalLink,
  ChevronDown, ChevronUp, Clock, AlertTriangle, Check, X, Users,
  ListTodo
} from "lucide-react";
import SOPTaskManager from "./SOPTaskManager";

interface Step {
  id: string;
  title: string;
  description: string | null;
  content_html: string;
  step_number: number;
  estimated_minutes: number | null;
  is_critical: boolean;
  checklist: Array<{ text: string; done?: boolean }>;
  sop_resources?: Array<{ id: string; resource_type: string; title: string; url: string; description: string | null }>;
}

interface SOPCategory {
  id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
}

interface SOPData {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  content_html: string;
  status: string;
  version: number;
  visible_to_roles: string[];
  time_percent: number | null;
  assigned_to: string[] | null;
  category_id: string | null;
  sop_categories: SOPCategory | null;
  sop_steps: Step[];
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
}

interface Props {
  sop: SOPData;
  categories: SOPCategory[];
  teamMembers?: TeamMember[];
}

const ROLE_OPTIONS = [
  { value: "admin", label: "Admin" },
  { value: "manager", label: "Manager" },
  { value: "staff", label: "Kitchen Staff" },
  { value: "driver", label: "Driver" },
];

// ── Tiptap Toolbar ──
function EditorToolbar({ editor }: { editor: any }) {
  if (!editor) return null;

  const addLink = () => {
    const url = prompt("Enter URL:");
    if (url) editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const addImage = () => {
    const url = prompt("Enter image URL:");
    if (url) editor.chain().focus().setImage({ src: url }).run();
  };

  const btnClass = (active: boolean) =>
    `p-1.5 rounded transition ${active ? "bg-[#3d6b2a]/15 text-[#3d6b2a]" : "text-[#9a9080] hover:bg-gray-100 hover:text-gray-700"}`;

  return (
    <div className="flex items-center gap-0.5 flex-wrap px-3 py-2 border-b border-gray-200 bg-gray-50 rounded-t-xl">
      <button onClick={() => editor.chain().focus().toggleBold().run()} className={btnClass(editor.isActive("bold"))} title="Bold"><Bold size={16} /></button>
      <button onClick={() => editor.chain().focus().toggleItalic().run()} className={btnClass(editor.isActive("italic"))} title="Italic"><Italic size={16} /></button>
      <button onClick={() => editor.chain().focus().toggleUnderline().run()} className={btnClass(editor.isActive("underline"))} title="Underline"><UnderlineIcon size={16} /></button>
      <div className="w-px h-5 bg-gray-200 mx-1" />
      <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={btnClass(editor.isActive("heading", { level: 2 }))} title="Heading"><Heading2 size={16} /></button>
      <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={btnClass(editor.isActive("bulletList"))} title="Bullet List"><List size={16} /></button>
      <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className={btnClass(editor.isActive("orderedList"))} title="Numbered List"><ListOrdered size={16} /></button>
      <div className="w-px h-5 bg-gray-200 mx-1" />
      <button onClick={addLink} className={btnClass(editor.isActive("link"))} title="Add Link"><Link2 size={16} /></button>
      <button onClick={addImage} className={btnClass(false)} title="Add Image"><Image size={16} /></button>
      <div className="w-px h-5 bg-gray-200 mx-1" />
      <button onClick={() => editor.chain().focus().undo().run()} className={btnClass(false)} title="Undo"><Undo size={16} /></button>
      <button onClick={() => editor.chain().focus().redo().run()} className={btnClass(false)} title="Redo"><Redo size={16} /></button>
    </div>
  );
}

// ── Rich Text Editor Wrapper ──
function RichTextEditor({ content, onChange, placeholder }: { content: string; onChange: (html: string) => void; placeholder?: string }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      LinkExtension.configure({ openOnClick: false }),
      ImageExtension,
      Placeholder.configure({ placeholder: placeholder || "Start writing..." }),
    ],
    content,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none px-4 py-3 min-h-[120px] focus:outline-none text-gray-900",
      },
    },
  });

  return (
    <div className="border border-gray-300 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-[#3d6b2a]/20 focus-within:border-[#3d6b2a]">
      <EditorToolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}

// ── Step Card ──
function StepCard({
  step,
  index,
  total,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
}: {
  step: Step;
  index: number;
  total: number;
  onUpdate: (data: Partial<Step>) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const [newCheckItem, setNewCheckItem] = useState("");

  const addChecklistItem = () => {
    if (!newCheckItem.trim()) return;
    onUpdate({ checklist: [...(step.checklist || []), { text: newCheckItem.trim() }] });
    setNewCheckItem("");
  };

  const removeChecklistItem = (i: number) => {
    onUpdate({ checklist: step.checklist.filter((_, idx) => idx !== i) });
  };

  const updateChecklistItem = (i: number, text: string) => {
    const updated = [...(step.checklist || [])];
    updated[i] = { ...updated[i], text };
    onUpdate({ checklist: updated });
  };

  const moveChecklistItem = (i: number, direction: "up" | "down") => {
    const items = [...(step.checklist || [])];
    const to = direction === "up" ? i - 1 : i + 1;
    if (to < 0 || to >= items.length) return;
    [items[i], items[to]] = [items[to], items[i]];
    onUpdate({ checklist: items });
  };

  const addResource = () => {
    const url = prompt("Enter resource URL (video, document, or link):");
    if (!url) return;
    const title = prompt("Resource title:") || "Resource";
    const type = url.match(/\.(mp4|webm|mov|youtube|vimeo)/i) ? "video" : "link";

    // Resources are saved with the SOP, not separately for now
    const resources = step.sop_resources || [];
    onUpdate({
      sop_resources: [...resources, { id: `new-${Date.now()}`, resource_type: type, title, url, description: null }] as any,
    });
  };

  return (
    <div className={`bg-white border rounded-xl overflow-hidden transition ${
      step.is_critical ? "border-red-200 bg-red-50/30" : "border-gray-200"
    }`}>
      {/* Step Header — drag handle + title */}
      <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-100">
        <div className="flex flex-col gap-0.5">
          <button onClick={onMoveUp} disabled={index === 0} className="text-[#7a7060] hover:text-[#9a9080] disabled:opacity-30 disabled:cursor-not-allowed"><ChevronUp size={14} /></button>
          <button onClick={onMoveDown} disabled={index === total - 1} className="text-[#7a7060] hover:text-[#9a9080] disabled:opacity-30 disabled:cursor-not-allowed"><ChevronDown size={14} /></button>
        </div>
        <GripVertical size={16} className="text-[#4a5e3a] cursor-grab shrink-0" />
        <span className="text-xs font-bold text-[#3d6b2a] bg-[#E8F5E3] w-6 h-6 rounded-full flex items-center justify-center shrink-0">{index + 1}</span>
        <input
          type="text"
          value={step.title}
          onChange={(e) => onUpdate({ title: e.target.value })}
          placeholder="Step title..."
          className="flex-1 text-sm font-semibold text-gray-900 bg-transparent border-none focus:outline-none"
        />
        <button onClick={() => setExpanded(!expanded)} className="p-1 text-[#7a7060] hover:text-[#9a9080]">
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        <button onClick={onDelete} className="p-1 text-[#7a7060] hover:text-red-500 transition">
          <Trash2 size={14} />
        </button>
      </div>

      {expanded && (
        <div className="p-4 space-y-4">
          {/* Step description */}
          <RichTextEditor
            content={step.content_html || ""}
            onChange={(html) => onUpdate({ content_html: html })}
            placeholder="Describe this step in detail..."
          />

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-xs text-[#9a9080]">
              <Clock size={12} />
              <input
                type="number"
                value={step.estimated_minutes || ""}
                onChange={(e) => onUpdate({ estimated_minutes: parseInt(e.target.value) || null })}
                placeholder="min"
                className="w-16 px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:border-[#3d6b2a]"
              />
              <span>minutes</span>
            </label>
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={step.is_critical}
                onChange={(e) => onUpdate({ is_critical: e.target.checked })}
                className="w-3.5 h-3.5 rounded border-gray-300 text-red-500 focus:ring-red-500/30"
              />
              <AlertTriangle size={12} className="text-red-600" />
              <span className="text-red-600 font-medium">Critical Step</span>
            </label>
          </div>

          {/* Checklist */}
          <div>
            <p className="text-xs font-semibold text-gray-700 mb-2">Checklist Items</p>
            <div className="space-y-1.5">
              {(step.checklist || []).map((item, i) => (
                <div key={i} className="flex items-center gap-1.5 bg-gray-50 rounded-lg px-2 py-1.5 group">
                  <div className="flex flex-col gap-0">
                    <button
                      onClick={() => moveChecklistItem(i, "up")}
                      disabled={i === 0}
                      className="text-[#4a5e3a] hover:text-[#9a9080] disabled:opacity-20 disabled:cursor-not-allowed p-0"
                    >
                      <ChevronUp size={12} />
                    </button>
                    <button
                      onClick={() => moveChecklistItem(i, "down")}
                      disabled={i === (step.checklist || []).length - 1}
                      className="text-[#4a5e3a] hover:text-[#9a9080] disabled:opacity-20 disabled:cursor-not-allowed p-0"
                    >
                      <ChevronDown size={12} />
                    </button>
                  </div>
                  <Check size={14} className="text-[#3d6b2a] shrink-0" />
                  <input
                    type="text"
                    value={item.text}
                    onChange={(e) => updateChecklistItem(i, e.target.value)}
                    className="text-sm text-gray-700 flex-1 bg-transparent border-none focus:outline-none focus:ring-0"
                  />
                  <button onClick={() => removeChecklistItem(i)} className="text-[#4a5e3a] hover:text-red-500 p-0.5 opacity-0 group-hover:opacity-100 transition">
                    <X size={12} />
                  </button>
                </div>
              ))}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCheckItem}
                  onChange={(e) => setNewCheckItem(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addChecklistItem()}
                  placeholder="Add checklist item..."
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#3d6b2a]"
                />
                <button
                  onClick={addChecklistItem}
                  disabled={!newCheckItem.trim()}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-[#9a9080] font-medium disabled:opacity-50 transition"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          {/* Resources */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-gray-700">Resources & Videos</p>
              <button
                onClick={addResource}
                className="text-xs text-[#3d6b2a] font-semibold hover:underline flex items-center gap-1"
              >
                <Plus size={12} /> Add Resource
              </button>
            </div>
            {(step.sop_resources || []).length > 0 && (
              <div className="space-y-1.5">
                {(step.sop_resources || []).map((res, i) => (
                  <div key={res.id} className="flex items-center gap-2 bg-blue-50 rounded-lg px-3 py-2">
                    {res.resource_type === "video" ? (
                      <Video size={14} className="text-blue-500 shrink-0" />
                    ) : (
                      <ExternalLink size={14} className="text-blue-500 shrink-0" />
                    )}
                    <a href={res.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline flex-1 truncate">
                      {res.title}
                    </a>
                    <button
                      onClick={() => {
                        onUpdate({ sop_resources: (step.sop_resources || []).filter((_, idx) => idx !== i) as any });
                      }}
                      className="text-[#7a7060] hover:text-red-500 p-0.5"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main SOP Editor ──
export default function SOPEditor({ sop, categories, teamMembers = [] }: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"editor" | "tasks">("editor");
  const [title, setTitle] = useState(sop.title);
  const [description, setDescription] = useState(sop.description || "");
  const [categoryId, setCategoryId] = useState(sop.category_id || "");
  const [contentHtml, setContentHtml] = useState(sop.content_html || "");
  const [visibleToRoles, setVisibleToRoles] = useState<string[]>(sop.visible_to_roles || []);
  const [status, setStatus] = useState(sop.status);
  const [steps, setSteps] = useState<Step[]>(sop.sop_steps || []);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  const toggleRole = (role: string) => {
    setVisibleToRoles(prev =>
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  };

  const addStep = () => {
    setSteps(prev => [
      ...prev,
      {
        id: `new-${Date.now()}`,
        title: "",
        description: null,
        content_html: "",
        step_number: prev.length + 1,
        estimated_minutes: null,
        is_critical: false,
        checklist: [],
        sop_resources: [],
      },
    ]);
  };

  const updateStep = (index: number, data: Partial<Step>) => {
    setSteps(prev => prev.map((s, i) => (i === index ? { ...s, ...data } : s)));
  };

  const deleteStep = (index: number) => {
    if (!confirm("Delete this step?")) return;
    setSteps(prev => prev.filter((_, i) => i !== index));
  };

  const moveStep = (from: number, direction: "up" | "down") => {
    const to = direction === "up" ? from - 1 : from + 1;
    if (to < 0 || to >= steps.length) return;
    const newSteps = [...steps];
    [newSteps[from], newSteps[to]] = [newSteps[to], newSteps[from]];
    setSteps(newSteps);
  };

  const handleSave = async (newStatus?: string) => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/sops", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: sop.id,
          title,
          description: description || null,
          categoryId: categoryId || null,
          contentHtml,
          visibleToRoles,
          status: newStatus || status,
          steps: steps.map((s, i) => ({
            title: s.title || `Step ${i + 1}`,
            description: s.description,
            contentHtml: s.content_html,
            estimatedMinutes: s.estimated_minutes,
            isCritical: s.is_critical,
            checklist: s.checklist,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (newStatus) setStatus(newStatus);
      setLastSaved(new Date().toLocaleTimeString());
    } catch (err: any) {
      alert(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const totalMinutes = steps.reduce((sum, s) => sum + (s.estimated_minutes || 0), 0);

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Link href="/admin/sops" className="p-2 hover:bg-gray-100 rounded-lg transition text-[#9a9080]">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-xl font-bold text-gray-900 bg-transparent border-none focus:outline-none w-full"
              placeholder="SOP Title..."
            />
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                status === "published" ? "bg-green-50 text-green-600" : "bg-amber-50 text-amber-600"
              }`}>
                {status}
              </span>
              {lastSaved && <span className="text-[11px] text-[#7a7060]">Saved at {lastSaved}</span>}
              {totalMinutes > 0 && (
                <span className="text-[11px] text-[#7a7060] flex items-center gap-0.5">
                  <Clock size={10} /> ~{totalMinutes} min total
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleSave()}
            disabled={saving}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:border-gray-400 transition text-sm flex items-center gap-2 min-h-[40px]"
          >
            {saving ? <Loader size={14} className="animate-spin" /> : <Save size={14} />}
            Save Draft
          </button>
          <button
            onClick={() => handleSave("published")}
            disabled={saving}
            className="px-4 py-2 bg-[#3d6b2a] text-white font-medium rounded-lg hover:bg-[#2f5720] transition text-sm flex items-center gap-2 min-h-[40px]"
          >
            <Eye size={14} /> Publish
          </button>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        <button
          onClick={() => setActiveTab("editor")}
          className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition ${
            activeTab === "editor"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-[#9a9080] hover:text-gray-700"
          }`}
        >
          Editor
        </button>
        <button
          onClick={() => setActiveTab("tasks")}
          className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition flex items-center justify-center gap-1.5 ${
            activeTab === "tasks"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-[#9a9080] hover:text-gray-700"
          }`}
        >
          <ListTodo size={14} /> Tasks
        </button>
      </div>

      {/* Tasks Tab */}
      {activeTab === "tasks" && (
        <SOPTaskManager
          sopId={sop.id}
          sopTitle={sop.title}
          teamMembers={teamMembers}
          sops={[{ id: sop.id, title: sop.title, stepCount: steps.length }]}
        />
      )}

      {/* Editor Tab */}
      {activeTab === "editor" && (<>
      {/* Settings Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-[#9a9080] mb-1.5">Category</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#3d6b2a] bg-white"
          >
            <option value="">None</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-[#9a9080] mb-1.5 flex items-center gap-1">
            <Users size={12} /> Visible to Roles
          </label>
          <div className="flex flex-wrap gap-1.5">
            {ROLE_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => toggleRole(opt.value)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium border transition ${
                  visibleToRoles.includes(opt.value)
                    ? "bg-[#E8F5E3] border-[#3d6b2a] text-[#3d6b2a]"
                    : "bg-gray-50 border-gray-200 text-[#9a9080] hover:border-gray-300"
                }`}
              >
                {opt.label}
              </button>
            ))}
            {visibleToRoles.length === 0 && (
              <span className="text-[11px] text-[#7a7060] self-center ml-1">All roles</span>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-semibold text-[#9a9080] mb-1.5">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          placeholder="Brief overview of this SOP..."
          className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3d6b2a]/20 focus:border-[#3d6b2a] resize-none"
        />
      </div>

      {/* Overview Content */}
      <div>
        <label className="block text-xs font-semibold text-[#9a9080] mb-1.5">Overview / Introduction</label>
        <RichTextEditor
          content={contentHtml}
          onChange={setContentHtml}
          placeholder="Write an overview or introduction for this SOP..."
        />
      </div>

      {/* Steps */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-gray-900">
            Steps ({steps.length})
            {totalMinutes > 0 && <span className="text-[#7a7060] font-normal ml-2">~{totalMinutes} min</span>}
          </h3>
          <button
            onClick={addStep}
            className="text-sm text-[#3d6b2a] font-semibold hover:underline flex items-center gap-1"
          >
            <Plus size={14} /> Add Step
          </button>
        </div>

        <div className="space-y-3">
          {steps.map((step, i) => (
            <StepCard
              key={step.id}
              step={step}
              index={i}
              total={steps.length}
              onUpdate={(data) => updateStep(i, data)}
              onDelete={() => deleteStep(i)}
              onMoveUp={() => moveStep(i, "up")}
              onMoveDown={() => moveStep(i, "down")}
            />
          ))}
        </div>

        {steps.length === 0 && (
          <div className="border-2 border-dashed border-gray-200 rounded-xl py-10 text-center">
            <p className="text-[#7a7060] text-sm mb-3">No steps added yet</p>
            <button
              onClick={addStep}
              className="px-5 py-2.5 bg-[#3d6b2a] text-white font-semibold rounded-xl hover:bg-[#2f5720] transition text-sm inline-flex items-center gap-2"
            >
              <Plus size={16} /> Add First Step
            </button>
          </div>
        )}
      </div>
      </>)}
    </div>
  );
}
