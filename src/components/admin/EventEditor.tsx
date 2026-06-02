"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Event, EventRsvp } from "@/types/database";
import EventRsvpTable from "./EventRsvpTable";
import { ArrowLeft, Save, Upload, Trash2, Plus, X, Bold, Italic, Link2, List, ListOrdered, Heading2, Heading3 } from "lucide-react";

const STORE_ID = "b0000000-0000-0000-0000-000000000001";

interface EventEditorProps {
  initialEvent?: Event;
  rsvps?: EventRsvp[];
}

const TEMPLATE_STYLES = [
  {
    id: "mad_fresh",
    name: "Mad Fresh",
    description: "Green & organic",
    accent: "#75F663",
    bgClass: "bg-gray-900",
  },
  {
    id: "fire_smoke",
    name: "Fire & Smoke",
    description: "Warm & bold",
    accent: "#FF6B35",
    bgClass: "bg-gray-800",
  },
  {
    id: "clean_classic",
    name: "Clean & Classic",
    description: "Minimal & elegant",
    accent: "#1a1a2e",
    bgClass: "bg-white",
  },
];

const TEMPLATE_STYLE_MAP = {
  mad_fresh: "mad_fresh",
  fire_smoke: "fire_smoke",
  clean_classic: "clean_classic",
} as const;

// Rich Text Editor Component
function RichTextEditor({
  value,
  onChange,
  placeholder = "Enter rich text..."
}: {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}) {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current && !editorRef.current.innerHTML) {
      editorRef.current.innerHTML = value || "";
    }
  }, []);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const executeCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const insertHeading = (level: 2 | 3) => {
    const tag = level === 2 ? "h2" : "h3";
    document.execCommand("formatBlock", false, `<${tag}>`);
    editorRef.current?.focus();
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="bg-gray-50 border-b border-gray-200 p-3 flex flex-wrap gap-1">
        <button
          onClick={() => executeCommand("bold")}
          className="p-2 hover:bg-gray-200 rounded transition-colors"
          title="Bold"
        >
          <Bold size={16} />
        </button>
        <button
          onClick={() => executeCommand("italic")}
          className="p-2 hover:bg-gray-200 rounded transition-colors"
          title="Italic"
        >
          <Italic size={16} />
        </button>
        <div className="w-px bg-gray-300" />
        <button
          onClick={() => insertHeading(2)}
          className="p-2 hover:bg-gray-200 rounded transition-colors text-sm font-bold"
          title="Heading 2"
        >
          H2
        </button>
        <button
          onClick={() => insertHeading(3)}
          className="p-2 hover:bg-gray-200 rounded transition-colors text-sm font-bold"
          title="Heading 3"
        >
          H3
        </button>
        <div className="w-px bg-gray-300" />
        <button
          onClick={() => executeCommand("insertUnorderedList")}
          className="p-2 hover:bg-gray-200 rounded transition-colors"
          title="Bullet List"
        >
          <List size={16} />
        </button>
        <button
          onClick={() => executeCommand("insertOrderedList")}
          className="p-2 hover:bg-gray-200 rounded transition-colors"
          title="Numbered List"
        >
          <ListOrdered size={16} />
        </button>
        <div className="w-px bg-gray-300" />
        <button
          onClick={() => {
            const url = prompt("Enter URL:");
            if (url) executeCommand("createLink", url);
          }}
          className="p-2 hover:bg-gray-200 rounded transition-colors"
          title="Add Link"
        >
          <Link2 size={16} />
        </button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        className="p-4 min-h-[200px] focus:outline-none overflow-auto text-gray-900 bg-white"
        suppressContentEditableWarning
      />
    </div>
  );
}

// Gallery Images Component
function GalleryImages({
  images,
  onChange
}: {
  images: string[];
  onChange: (images: string[]) => void
}) {
  const [newUrl, setNewUrl] = useState("");

  const addImage = () => {
    if (newUrl.trim()) {
      onChange([...images, newUrl.trim()]);
      setNewUrl("");
    }
  };

  const removeImage = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          type="url"
          value={newUrl}
          onChange={(e) => setNewUrl(e.target.value)}
          placeholder="Enter image URL..."
          className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#3d6b2a]/50 text-base"
        />
        <button
          onClick={addImage}
          className="px-4 py-2 bg-[#3d6b2a] hover:bg-[#3d6b2a]/90 text-white rounded-lg font-medium flex items-center gap-2 transition-colors min-h-[44px]"
        >
          <Plus size={18} />
          Add
        </button>
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {images.map((url, index) => (
            <div key={index} className="relative group rounded-lg overflow-hidden border border-gray-200">
              <img src={url} alt={`Gallery ${index}`} className="w-full h-32 object-cover" />
              <button
                onClick={() => removeImage(index)}
                className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Tags Input Component
function TagsInput({
  tags,
  onChange
}: {
  tags: string[];
  onChange: (tags: string[]) => void
}) {
  const [inputValue, setInputValue] = useState("");

  const handleAddTag = () => {
    if (inputValue.trim() && !tags.includes(inputValue.trim())) {
      onChange([...tags, inputValue.trim()]);
      setInputValue("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    onChange(tags.filter((t) => t !== tag));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    if (value.includes(",")) {
      const newTags = value.split(",").map((t) => t.trim()).filter((t) => t && !tags.includes(t));
      onChange([...tags, ...newTags]);
      setInputValue("");
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAddTag();
            }
          }}
          placeholder="Add tags (comma-separated)..."
          className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#3d6b2a]/50 text-base"
        />
        <button
          onClick={handleAddTag}
          className="px-4 py-2 bg-[#3d6b2a] hover:bg-[#3d6b2a]/90 text-white rounded-lg font-medium transition-colors min-h-[44px]"
        >
          Add
        </button>
      </div>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <div
              key={tag}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#E8F5E3] text-[#3d6b2a] rounded-full text-sm font-medium"
            >
              {tag}
              <button
                onClick={() => handleRemoveTag(tag)}
                className="hover:opacity-70 transition-opacity"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function EventEditor({ initialEvent, rsvps = [] }: EventEditorProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("details");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [formData, setFormData] = useState({
    name: initialEvent?.name || "",
    slug: initialEvent?.slug || "",
    description: initialEvent?.description || "",
    description_html: initialEvent?.description_html || "",
    event_date: initialEvent?.event_date || "",
    start_time: initialEvent?.start_time || "09:00",
    end_time: initialEvent?.end_time || "17:00",
    is_multi_day: initialEvent?.is_multi_day || false,
    end_date: initialEvent?.end_date || "",
    venue_name: initialEvent?.venue_name || "",
    venue_address: initialEvent?.venue_address || "",
    hero_image_url: initialEvent?.hero_image_url || "",
    cover_image_url: initialEvent?.cover_image_url || "",
    gallery_images: initialEvent?.gallery_images || [],
    max_capacity: initialEvent?.max_capacity || "",
    is_free: initialEvent?.is_free ?? true,
    ticket_price: initialEvent?.ticket_price || "",
    collect_meal_preferences: initialEvent?.collect_meal_preferences || false,
    waitlist_enabled: initialEvent?.waitlist_enabled || false,
    newsletter_enabled: initialEvent?.newsletter_enabled || false,
    donation_enabled: initialEvent?.donation_enabled || false,
    donation_page_enabled: initialEvent?.donation_page_enabled || false,
    donation_goal: initialEvent?.donation_goal || "",
    donation_qr_code_url: initialEvent?.donation_qr_code_url || "",
    registration_deadline: initialEvent?.registration_deadline || "",
    status: initialEvent?.status || "draft",
    template_style: (initialEvent?.template_style || "mad_fresh") as "mad_fresh" | "fire_smoke" | "clean_classic",
    host_organization: initialEvent?.host_organization || "",
    host_logo_url: initialEvent?.host_logo_url || "",
    host_contact_email: initialEvent?.host_contact_email || "",
    host_contact_phone: initialEvent?.host_contact_phone || "",
    tags: initialEvent?.tags || [],
  });

  // Auto-generate slug from name
  useEffect(() => {
    if (formData.name && !initialEvent) {
      const generatedSlug = formData.name
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim();
      setFormData((prev) => ({ ...prev, slug: generatedSlug }));
    }
  }, [formData.name, initialEvent]);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async (publishStatus: "draft" | "published") => {
    setSaving(true);
    setMessage(null);

    try {
      const supabase = createClient();

      const payload = {
        store_id: STORE_ID,
        name: formData.name,
        slug: formData.slug,
        description: formData.description,
        description_html: formData.description_html,
        event_date: formData.event_date,
        start_time: formData.start_time,
        end_time: formData.end_time,
        is_multi_day: formData.is_multi_day,
        end_date: formData.is_multi_day ? formData.end_date : null,
        venue_name: formData.venue_name,
        venue_address: formData.venue_address,
        hero_image_url: formData.hero_image_url || null,
        cover_image_url: formData.cover_image_url || null,
        gallery_images: formData.gallery_images,
        max_capacity: formData.max_capacity ? parseInt(String(formData.max_capacity)) : null,
        is_free: formData.is_free,
        ticket_price: !formData.is_free && formData.ticket_price ? parseFloat(String(formData.ticket_price)) : null,
        collect_meal_preferences: formData.collect_meal_preferences,
        waitlist_enabled: formData.waitlist_enabled,
        newsletter_enabled: formData.newsletter_enabled,
        donation_enabled: formData.donation_enabled,
        donation_page_enabled: formData.donation_page_enabled && formData.donation_enabled,
        donation_goal: formData.donation_goal ? parseFloat(String(formData.donation_goal)) : 0,
        donation_qr_code_url: formData.donation_qr_code_url || null,
        registration_deadline: formData.registration_deadline || null,
        status: publishStatus,
        template_style: formData.template_style,
        host_organization: formData.host_organization || null,
        host_logo_url: formData.host_logo_url || null,
        host_contact_email: formData.host_contact_email || null,
        host_contact_phone: formData.host_contact_phone || null,
        tags: formData.tags,
      };

      if (initialEvent) {
        const { error } = await supabase
          .from("events")
          .update(payload)
          .eq("id", initialEvent.id)
          .eq("store_id", STORE_ID);

        if (error) throw error;
        setMessage({ type: "success", text: "Event updated successfully!" });
      } else {
        const { data, error } = await supabase
          .from("events")
          .insert(payload)
          .select()
          .single();

        if (error) throw error;
        setMessage({ type: "success", text: "Event created successfully!" });
        setTimeout(() => {
          router.push(`/admin/events/${data.id}/edit`);
        }, 1000);
      }
    } catch (error) {
      console.error("Error saving event:", error);
      setMessage({ type: "error", text: "Failed to save event. Please try again." });
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: "details", label: "Details" },
    { id: "venue", label: "Venue & Media" },
    { id: "template", label: "Template & Branding" },
    { id: "registration", label: "Registration & Donations" },
    ...(initialEvent ? [{ id: "rsvp", label: "RSVP Management" }] : []),
  ];

  return (
    <div className="space-y-6">
      {/* Sticky Top Bar — dark theme */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#ddd8cc] -mx-4 lg:-mx-8 -mt-4 lg:-mt-8 px-4 lg:px-8 py-4 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-[#3d6b2a] hover:opacity-80 font-medium transition-opacity"
          >
            <ArrowLeft size={18} />
            Back to Events
          </button>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {initialEvent?.id && (
              <a
                href={`/api/events/${initialEvent.id}/flyer`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 border border-[#ddd8cc] rounded-lg font-medium hover:bg-[#f2efe8] transition-colors text-sm text-[#4a5e3a] min-h-[44px] flex items-center justify-center"
                title="Open printable flyer with QR code"
              >
                🖨️ Flyer
              </a>
            )}
            <button
              onClick={() => handleSave("draft")}
              disabled={saving || !formData.name || !formData.event_date}
              className="px-4 py-2 border border-[#ddd8cc] rounded-lg font-medium hover:bg-[#f2efe8] disabled:opacity-50 transition-colors text-[#4a5e3a] min-h-[44px]"
            >
              Save Draft
            </button>
            <button
              onClick={() => handleSave("published")}
              disabled={saving || !formData.name || !formData.event_date}
              className="px-4 py-2 bg-[#3d6b2a] hover:bg-[#3d6b2a]/90 text-white rounded-lg font-medium flex items-center gap-2 disabled:opacity-50 transition-colors min-h-[44px]"
            >
              <Save size={18} />
              Publish
            </button>
          </div>
        </div>

        {/* Event Name and Status */}
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#1e2d18]">{formData.name || "Untitled Event"}</h1>
          </div>
          {message && (
            <div className={`text-sm font-medium ${message.type === "success" ? "text-[#3d6b2a]" : "text-red-600"}`}>
              {message.text}
            </div>
          )}
        </div>
      </div>

      {/* Tabs — dark theme */}
      <div className="border-b border-[#ddd8cc] flex gap-4 sm:gap-8 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`py-3 px-1 border-b-2 font-medium transition-colors whitespace-nowrap text-sm ${
              activeTab === tab.id
                ? "border-[#3d6b2a] text-[#3d6b2a]"
                : "border-transparent text-[#7a7060] hover:text-[#1e2d18]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content — white card */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 space-y-6">
        {/* Details Tab */}
        {activeTab === "details" && (
          <div className="space-y-6">
            {/* Event Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Event Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className="w-full px-4 py-2 text-base border border-gray-200 rounded-lg focus:outline-none focus:border-[#3d6b2a]/50"
                placeholder="Enter event name"
              />
            </div>

            {/* Slug */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Slug</label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => handleInputChange("slug", e.target.value)}
                className="w-full px-4 py-2 text-base border border-gray-200 rounded-lg focus:outline-none focus:border-[#3d6b2a]/50"
                placeholder="event-slug"
              />
              <p className="text-xs text-[#9a9080] mt-1">Auto-generated from name, or edit manually</p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                className="w-full px-4 py-2 text-base border border-gray-200 rounded-lg focus:outline-none focus:border-[#3d6b2a]/50 resize-none"
                rows={4}
                placeholder="Enter plain text description"
              />
            </div>

            {/* Rich Text Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Rich Text Description</label>
              <RichTextEditor
                value={formData.description_html}
                onChange={(html) => handleInputChange("description_html", html)}
                placeholder="Enter rich text description with formatting..."
              />
            </div>

            {/* Date & Time Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Event Date *</label>
                <input
                  type="date"
                  value={formData.event_date}
                  onChange={(e) => handleInputChange("event_date", e.target.value)}
                  className="w-full px-4 py-2 text-base border border-gray-200 rounded-lg focus:outline-none focus:border-[#3d6b2a]/50"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Start Time</label>
                <input
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => handleInputChange("start_time", e.target.value)}
                  className="w-full px-4 py-2 text-base border border-gray-200 rounded-lg focus:outline-none focus:border-[#3d6b2a]/50"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">End Time</label>
                <input
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => handleInputChange("end_time", e.target.value)}
                  className="w-full px-4 py-2 text-base border border-gray-200 rounded-lg focus:outline-none focus:border-[#3d6b2a]/50"
                />
              </div>
            </div>

            {/* Multi-day Toggle */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={formData.is_multi_day}
                onChange={(e) => handleInputChange("is_multi_day", e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-[#3d6b2a] focus:ring-[#3d6b2a]/50"
              />
              <label className="text-sm font-medium text-gray-700">Multi-day event</label>
            </div>

            {formData.is_multi_day && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">End Date</label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => handleInputChange("end_date", e.target.value)}
                  className="w-full px-4 py-2 text-base border border-gray-200 rounded-lg focus:outline-none focus:border-[#3d6b2a]/50"
                />
              </div>
            )}

            {/* Registration Deadline */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Registration Deadline (Optional)</label>
              <input
                type="datetime-local"
                value={formData.registration_deadline}
                onChange={(e) => handleInputChange("registration_deadline", e.target.value)}
                className="w-full px-4 py-2 text-base border border-gray-200 rounded-lg focus:outline-none focus:border-[#3d6b2a]/50"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
              <select
                value={formData.status}
                onChange={(e) => handleInputChange("status", e.target.value)}
                className="w-full px-4 py-2 text-base border border-gray-200 rounded-lg focus:outline-none focus:border-[#3d6b2a]/50"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="sold_out">Sold Out</option>
                <option value="cancelled">Cancelled</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Tags</label>
              <TagsInput tags={formData.tags} onChange={(tags) => handleInputChange("tags", tags)} />
            </div>
          </div>
        )}

        {/* Venue & Media Tab */}
        {activeTab === "venue" && (
          <div className="space-y-6">
            {/* Venue Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Venue Name</label>
              <input
                type="text"
                value={formData.venue_name}
                onChange={(e) => handleInputChange("venue_name", e.target.value)}
                className="w-full px-4 py-2 text-base border border-gray-200 rounded-lg focus:outline-none focus:border-[#3d6b2a]/50"
                placeholder="Enter venue name"
              />
            </div>

            {/* Venue Address */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Venue Address</label>
              <input
                type="text"
                value={formData.venue_address}
                onChange={(e) => handleInputChange("venue_address", e.target.value)}
                className="w-full px-4 py-2 text-base border border-gray-200 rounded-lg focus:outline-none focus:border-[#3d6b2a]/50"
                placeholder="Enter full address"
              />
            </div>

            {/* Hero Image */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Hero Image URL</label>
              <input
                type="url"
                value={formData.hero_image_url}
                onChange={(e) => handleInputChange("hero_image_url", e.target.value)}
                className="w-full px-4 py-2 text-base border border-gray-200 rounded-lg focus:outline-none focus:border-[#3d6b2a]/50"
                placeholder="https://example.com/image.jpg"
              />
              {formData.hero_image_url && (
                <img src={formData.hero_image_url} alt="Hero" className="mt-4 h-48 w-full object-cover rounded-lg" />
              )}
            </div>

            {/* Cover Image */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Cover Image URL</label>
              <input
                type="url"
                value={formData.cover_image_url}
                onChange={(e) => handleInputChange("cover_image_url", e.target.value)}
                className="w-full px-4 py-2 text-base border border-gray-200 rounded-lg focus:outline-none focus:border-[#3d6b2a]/50"
                placeholder="https://example.com/image.jpg"
              />
              {formData.cover_image_url && (
                <img src={formData.cover_image_url} alt="Cover" className="mt-4 h-48 w-full object-cover rounded-lg" />
              )}
            </div>

            {/* Gallery Images */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Gallery Images</label>
              <GalleryImages images={formData.gallery_images} onChange={(images) => handleInputChange("gallery_images", images)} />
            </div>
          </div>
        )}

        {/* Template & Branding Tab */}
        {activeTab === "template" && (
          <div className="space-y-6">
            {/* Template Style */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-4">Template Style</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {TEMPLATE_STYLES.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleInputChange("template_style", template.id)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      formData.template_style === template.id
                        ? "border-[#3d6b2a] bg-[#E8F5E3]"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className={`h-24 rounded-lg ${template.bgClass} mb-3`} style={{ borderLeft: `4px solid ${template.accent}` }} />
                    <p className="font-semibold text-gray-900">{template.name}</p>
                    <p className="text-xs text-[#9a9080]">{template.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Host Organization */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Host Organization</label>
              <input
                type="text"
                value={formData.host_organization}
                onChange={(e) => handleInputChange("host_organization", e.target.value)}
                className="w-full px-4 py-2 text-base border border-gray-200 rounded-lg focus:outline-none focus:border-[#3d6b2a]/50"
                placeholder="Organization name"
              />
            </div>

            {/* Host Logo URL */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Host Logo URL</label>
              <input
                type="url"
                value={formData.host_logo_url}
                onChange={(e) => handleInputChange("host_logo_url", e.target.value)}
                className="w-full px-4 py-2 text-base border border-gray-200 rounded-lg focus:outline-none focus:border-[#3d6b2a]/50"
                placeholder="https://example.com/logo.png"
              />
              {formData.host_logo_url && (
                <img src={formData.host_logo_url} alt="Logo" className="mt-4 h-16 w-auto" />
              )}
            </div>

            {/* Host Contact Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Host Contact Email</label>
              <input
                type="email"
                value={formData.host_contact_email}
                onChange={(e) => handleInputChange("host_contact_email", e.target.value)}
                className="w-full px-4 py-2 text-base border border-gray-200 rounded-lg focus:outline-none focus:border-[#3d6b2a]/50"
                placeholder="contact@example.com"
              />
            </div>

            {/* Host Contact Phone */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Host Contact Phone</label>
              <input
                type="tel"
                value={formData.host_contact_phone}
                onChange={(e) => handleInputChange("host_contact_phone", e.target.value)}
                className="w-full px-4 py-2 text-base border border-gray-200 rounded-lg focus:outline-none focus:border-[#3d6b2a]/50"
                placeholder="(555) 123-4567"
              />
            </div>
          </div>
        )}

        {/* Registration & Donations Tab */}
        {activeTab === "registration" && (
          <div className="space-y-6">
            {/* Max Capacity */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Max Capacity (Optional)</label>
              <input
                type="number"
                value={formData.max_capacity}
                onChange={(e) => handleInputChange("max_capacity", e.target.value)}
                className="w-full px-4 py-2 text-base border border-gray-200 rounded-lg focus:outline-none focus:border-[#3d6b2a]/50"
                placeholder="Leave blank for unlimited"
              />
            </div>

            {/* Is Free Toggle */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={formData.is_free}
                onChange={(e) => {
                  handleInputChange("is_free", e.target.checked);
                  if (e.target.checked) handleInputChange("ticket_price", "");
                }}
                className="w-4 h-4 rounded border-gray-300 text-[#3d6b2a] focus:ring-[#3d6b2a]/50"
              />
              <label className="text-sm font-medium text-gray-700">Free Event</label>
            </div>

            {!formData.is_free && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Ticket Price</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.ticket_price}
                  onChange={(e) => handleInputChange("ticket_price", e.target.value)}
                  className="w-full px-4 py-2 text-base border border-gray-200 rounded-lg focus:outline-none focus:border-[#3d6b2a]/50"
                  placeholder="0.00"
                />
              </div>
            )}

            {/* Collect Meal Preferences */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={formData.collect_meal_preferences}
                onChange={(e) => handleInputChange("collect_meal_preferences", e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-[#3d6b2a] focus:ring-[#3d6b2a]/50"
              />
              <label className="text-sm font-medium text-gray-700">Collect Meal Preferences</label>
            </div>

            {/* Waitlist Enabled */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={formData.waitlist_enabled}
                onChange={(e) => handleInputChange("waitlist_enabled", e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-[#3d6b2a] focus:ring-[#3d6b2a]/50"
              />
              <label className="text-sm font-medium text-gray-700">Enable Waitlist</label>
            </div>

            {/* Newsletter Enabled */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={formData.newsletter_enabled}
                onChange={(e) => handleInputChange("newsletter_enabled", e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-[#3d6b2a] focus:ring-[#3d6b2a]/50"
              />
              <label className="text-sm font-medium text-gray-700">Enable Newsletter Signup</label>
            </div>

            {/* Donation Enabled */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={formData.donation_enabled}
                onChange={(e) => {
                  handleInputChange("donation_enabled", e.target.checked);
                  if (!e.target.checked) handleInputChange("donation_page_enabled", false);
                }}
                className="w-4 h-4 rounded border-gray-300 text-[#3d6b2a] focus:ring-[#3d6b2a]/50"
              />
              <label className="text-sm font-medium text-gray-700">Enable Donations</label>
            </div>

            {formData.donation_enabled && (
              <>
                {/* Donation Goal */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Donation Goal Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.donation_goal}
                    onChange={(e) => handleInputChange("donation_goal", e.target.value)}
                    className="w-full px-4 py-2 text-base border border-gray-200 rounded-lg focus:outline-none focus:border-[#3d6b2a]/50"
                    placeholder="0.00"
                  />
                </div>

                {/* Donation QR Code URL */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Donation QR Code URL</label>
                  <input
                    type="url"
                    value={formData.donation_qr_code_url}
                    onChange={(e) => handleInputChange("donation_qr_code_url", e.target.value)}
                    className="w-full px-4 py-2 text-base border border-gray-200 rounded-lg focus:outline-none focus:border-[#3d6b2a]/50"
                    placeholder="https://example.com/qr.png"
                  />
                </div>

                {/* Donation Page Enabled */}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={formData.donation_page_enabled}
                    onChange={(e) => handleInputChange("donation_page_enabled", e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-[#3d6b2a] focus:ring-[#3d6b2a]/50"
                  />
                  <label className="text-sm font-medium text-gray-700">Enable Donation Page</label>
                </div>
              </>
            )}
          </div>
        )}

        {/* RSVP Management Tab */}
        {activeTab === "rsvp" && initialEvent && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Event RSVPs</h2>
              <EventRsvpTable rsvps={rsvps} eventId={initialEvent.id} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
