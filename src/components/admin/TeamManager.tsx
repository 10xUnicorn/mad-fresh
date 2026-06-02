"use client";

import { useState } from "react";
import { UserPlus, X, Mail, Phone, Shield, Pencil, Trash2, Search, CheckSquare, Square, Loader, Send, Check } from "lucide-react";

type UserRole = "super_admin" | "admin" | "manager" | "staff" | "driver" | "customer";

interface TeamMember {
  id: string;
  user_id: string;
  role: UserRole;
  is_active: boolean;
  permissions: Record<string, boolean>;
  invited_at: string;
  accepted_at: string | null;
  user_profiles: {
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
  } | null;
}

interface TeamManagerProps {
  initialMembers: TeamMember[];
  currentUserId: string;
}

const ROLE_OPTIONS: { value: UserRole; label: string; description: string }[] = [
  { value: "admin", label: "Admin", description: "Full access to admin panel, team, settings" },
  { value: "manager", label: "Manager", description: "Manage orders, menu, analytics" },
  { value: "staff", label: "Kitchen Staff", description: "View kitchen queue, prep orders" },
  { value: "driver", label: "Driver", description: "View and manage deliveries" },
];

const PERMISSION_OPTIONS = [
  { key: "manage_orders", label: "Manage Orders" },
  { key: "manage_menu", label: "Manage Menu & Recipes" },
  { key: "manage_inventory", label: "Manage Inventory" },
  { key: "manage_catering", label: "Manage Catering" },
  { key: "manage_events", label: "Manage Events" },
  { key: "manage_marketing", label: "Manage Marketing" },
  { key: "manage_financials", label: "View Financials" },
  { key: "manage_settings", label: "Manage Settings" },
  { key: "manage_team", label: "Manage Team Members" },
  { key: "manage_customers", label: "Manage Customers" },
  { key: "manage_discounts", label: "Manage Discounts & Coupons" },
  { key: "manage_drivers", label: "Manage Drivers & Deliveries" },
];

const roleColors: Record<UserRole, { bg: string; text: string }> = {
  super_admin: { bg: "bg-red-500/20", text: "text-red-600" },
  admin: { bg: "bg-purple-500/20", text: "text-purple-600" },
  manager: { bg: "bg-blue-50", text: "text-blue-600" },
  staff: { bg: "bg-green-500/20", text: "text-green-700" },
  driver: { bg: "bg-orange-500/20", text: "text-orange-600" },
  customer: { bg: "bg-gray-100", text: "text-[#7a7060]" },
};

const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: PERMISSION_OPTIONS.map(p => p.key),
  manager: ["manage_orders", "manage_menu", "manage_inventory", "manage_catering", "manage_events", "manage_marketing", "manage_customers"],
  staff: ["manage_orders", "manage_inventory"],
  driver: ["manage_orders"],
};

export default function TeamManager({ initialMembers, currentUserId }: TeamManagerProps) {
  const [members, setMembers] = useState<TeamMember[]>(initialMembers);
  const [showModal, setShowModal] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Form state
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<UserRole>("staff");
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});

  const resetForm = () => {
    setEmail(""); setFirstName(""); setLastName(""); setPhone("");
    setRole("staff"); setPermissions({}); setEditingMember(null);
  };

  const openAdd = () => {
    resetForm();
    const defaults: Record<string, boolean> = {};
    (DEFAULT_ROLE_PERMISSIONS["staff"] || []).forEach(k => { defaults[k] = true; });
    setPermissions(defaults);
    setShowModal(true);
  };

  const openEdit = (member: TeamMember) => {
    setEditingMember(member);
    setEmail(member.user_profiles?.email || "");
    setFirstName(member.user_profiles?.first_name || "");
    setLastName(member.user_profiles?.last_name || "");
    setPhone(member.user_profiles?.phone || "");
    setRole(member.role);
    setPermissions(member.permissions || {});
    setShowModal(true);
  };

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    const defaults: Record<string, boolean> = {};
    (DEFAULT_ROLE_PERMISSIONS[newRole] || []).forEach(k => { defaults[k] = true; });
    setPermissions(defaults);
  };

  const togglePermission = (key: string) => {
    setPermissions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const allPermissionsSelected = PERMISSION_OPTIONS.every(p => permissions[p.key]);

  const toggleAllPermissions = () => {
    if (allPermissionsSelected) {
      setPermissions({});
    } else {
      const all: Record<string, boolean> = {};
      PERMISSION_OPTIONS.forEach(p => { all[p.key] = true; });
      setPermissions(all);
    }
  };

  const handleSave = async () => {
    if (!email) { setMessage({ type: "error", text: "Email is required" }); return; }
    setLoading(true);
    setMessage(null);

    try {
      if (editingMember) {
        const res = await fetch("/api/admin/team/members", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            memberId: editingMember.id,
            userId: editingMember.user_id,
            role,
            permissions,
            firstName,
            lastName,
            phone,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to update");

        setMembers((prev) =>
          prev.map((m) =>
            m.id === editingMember.id
              ? {
                  ...m, role, permissions,
                  user_profiles: m.user_profiles
                    ? { ...m.user_profiles, first_name: firstName, last_name: lastName, phone }
                    : null,
                }
              : m
          )
        );
        setMessage({ type: "success", text: "Team member updated" });
      } else {
        const res = await fetch("/api/admin/team/members", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, firstName, lastName, phone, role, permissions }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to add member");

        setMembers((prev) => [...prev, data.member]);
        setMessage({
          type: "success",
          text: data.message || `${firstName || email} added to the team`,
        });
      }

      setShowModal(false);
      resetForm();
    } catch (error: any) {
      console.error("Error saving team member:", error);
      setMessage({ type: "error", text: error.message || "Failed to save team member" });
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async (memberId: string) => {
    if (!confirm("Are you sure you want to remove this team member?")) return;

    try {
      const res = await fetch(`/api/admin/team/members?id=${memberId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to remove");

      setMembers((prev) => prev.filter((m) => m.id !== memberId));
      setMessage({ type: "success", text: "Team member removed" });
    } catch (error: any) {
      console.error("Error removing team member:", error);
      setMessage({ type: "error", text: error.message || "Failed to remove team member" });
    }
  };

  const filteredMembers = members.filter((m) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const profile = m.user_profiles;
    return (
      (profile?.email || "").toLowerCase().includes(q) ||
      (profile?.first_name || "").toLowerCase().includes(q) ||
      (profile?.last_name || "").toLowerCase().includes(q) ||
      m.role.toLowerCase().includes(q)
    );
  });

  return (
    <>
      {/* Message Toast */}
      {message && (
        <div
          className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2 ${
            message.type === "success"
              ? "bg-green-500/10 text-green-700 border border-green-500/20"
              : "bg-red-50 text-red-600 border border-red-500/20"
          }`}
        >
          {message.type === "success" ? <Check size={16} /> : <X size={16} />}
          {message.text}
          <button onClick={() => setMessage(null)} className="ml-auto p-1 hover:opacity-70">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Search + Add */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9a9080]" />
          <input
            type="text"
            placeholder="Search team members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#ddd8cc] rounded-xl text-[#1e2d18] placeholder-[#9a9080] text-sm focus:outline-none focus:border-[#3d6b2a] focus:ring-2 focus:ring-[#3d6b2a]/20"
          />
        </div>
        <button
          onClick={openAdd}
          className="px-5 py-2.5 bg-[#3d6b2a] hover:bg-[#2f5720] text-white font-semibold rounded-xl transition-colors inline-flex items-center justify-center gap-2 whitespace-nowrap"
        >
          <UserPlus size={18} />
          Add Team Member
        </button>
      </div>

      {/* Team Table */}
      <div className="bg-[#f8f6f1] border border-[#ddd8cc] rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#ddd8cc]">
          <h3 className="text-lg font-semibold text-[#1e2d18]">Team Directory</h3>
        </div>

        {filteredMembers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#ddd8cc]">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#7a7060] uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#7a7060] uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#7a7060] uppercase tracking-wider hidden sm:table-cell">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#7a7060] uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#7a7060] uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-[#7a7060] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map((member) => {
                  const profile = member.user_profiles;
                  const fullName = profile
                    ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim()
                    : "Unknown";
                  const colors = roleColors[member.role] || roleColors.customer;
                  const isPending = !member.accepted_at;

                  return (
                    <tr key={member.id} className="border-b border-[#ddd8cc] hover:bg-[#f0ece3] transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-[#1e2d18]">{fullName || "—"}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className="text-[#3d6b2a] flex items-center gap-2">
                          <Mail size={14} />
                          {profile?.email || "—"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-[#7a7060] hidden sm:table-cell">
                        {profile?.phone ? (
                          <span className="flex items-center gap-2">
                            <Phone size={14} className="text-[#9a9080]" />
                            {profile.phone}
                          </span>
                        ) : "—"}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${colors.bg} ${colors.text}`}>
                          {member.role.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {isPending ? (
                          <span className="inline-flex items-center gap-1 text-amber-600 text-xs font-medium bg-amber-500/10 px-2 py-1 rounded-full border border-amber-500/20">
                            <Send size={10} /> Invited
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-green-700 text-xs font-medium bg-green-500/10 px-2 py-1 rounded-full border border-green-500/20">
                            <Check size={10} /> Active
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEdit(member)}
                            className="p-2 text-[#7a7060] hover:text-[#3d6b2a] hover:bg-[#f2efe8] rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Pencil size={15} />
                          </button>
                          {member.user_id !== currentUserId && (
                            <button
                              onClick={() => handleDeactivate(member.id)}
                              className="p-2 text-[#7a7060] hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Remove"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-12 text-center">
            <Shield size={32} className="mx-auto mb-3 text-[#9a9080]" />
            <p className="text-[#7a7060] font-medium">{searchQuery ? "No team members match your search" : "No team members yet"}</p>
            <p className="text-[#9a9080] text-sm mt-1">Add your first team member to get started</p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/20 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white border border-[#ddd8cc] w-full sm:max-w-2xl sm:rounded-2xl rounded-t-2xl max-h-[90dvh] sm:max-h-[85dvh] flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-[#ddd8cc] shrink-0">
              <h3 className="text-lg font-semibold text-[#1e2d18]">
                {editingMember ? "Edit Team Member" : "Add Team Member"}
              </h3>
              <button
                onClick={() => { setShowModal(false); resetForm(); }}
                className="p-2 hover:bg-[#f2efe8] rounded-lg text-[#7a7060] min-w-[44px] min-h-[44px] flex items-center justify-center"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-[#1e2d18] mb-2">Email Address *</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={!!editingMember}
                  className="w-full px-4 py-2.5 bg-white border border-[#ddd8cc] rounded-lg text-[#1e2d18] text-sm focus:outline-none focus:ring-2 focus:ring-[#3d6b2a]/20 focus:border-[#3d6b2a] disabled:opacity-50 disabled:text-[#9a9080] placeholder-[#9a9080]"
                  placeholder="team@madfresh.com"
                />
                {!editingMember && (
                  <p className="text-xs text-[#9a9080] mt-1.5">
                    New users will receive an activation email to set up their account.
                  </p>
                )}
              </div>

              {/* Name */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#1e2d18] mb-2">First Name</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-[#ddd8cc] rounded-lg text-[#1e2d18] text-sm focus:outline-none focus:ring-2 focus:ring-[#3d6b2a]/20 focus:border-[#3d6b2a] placeholder-[#9a9080]"
                    placeholder="First name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#1e2d18] mb-2">Last Name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-[#ddd8cc] rounded-lg text-[#1e2d18] text-sm focus:outline-none focus:ring-2 focus:ring-[#3d6b2a]/20 focus:border-[#3d6b2a] placeholder-[#9a9080]"
                    placeholder="Last name"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-semibold text-[#1e2d18] mb-2">Phone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-[#ddd8cc] rounded-lg text-[#1e2d18] text-sm focus:outline-none focus:ring-2 focus:ring-[#3d6b2a]/20 focus:border-[#3d6b2a] placeholder-[#9a9080]"
                  placeholder="(555) 123-4567"
                />
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-semibold text-[#1e2d18] mb-2">Role *</label>
                <div className="grid grid-cols-2 gap-3">
                  {ROLE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => handleRoleChange(opt.value)}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${
                        role === opt.value
                          ? "border-[#3d6b2a] bg-[#3d6b2a]/10"
                          : "border-[#ddd8cc] hover:border-[#ddd8cc] bg-[#f8f6f1]"
                      }`}
                    >
                      <p className={`text-sm font-semibold ${role === opt.value ? "text-[#3d6b2a]" : "text-[#1e2d18]"}`}>
                        {opt.label}
                      </p>
                      <p className="text-xs text-[#9a9080] mt-0.5">{opt.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Permissions */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-[#1e2d18]">Custom Permissions</label>
                  <button
                    onClick={toggleAllPermissions}
                    className="text-xs font-semibold text-[#3d6b2a] hover:text-[#3d6b2a]/80 flex items-center gap-1.5 transition py-1 px-2"
                  >
                    {allPermissionsSelected ? (
                      <><Square size={14} /> Deselect All</>
                    ) : (
                      <><CheckSquare size={14} /> Select All</>
                    )}
                  </button>
                </div>
                <div className="space-y-1 bg-[#f8f6f1] border border-[#ddd8cc] rounded-lg p-4">
                  {PERMISSION_OPTIONS.map((perm) => (
                    <label key={perm.key} className="flex items-center gap-3 cursor-pointer py-1.5">
                      <input
                        type="checkbox"
                        checked={permissions[perm.key] || false}
                        onChange={() => togglePermission(perm.key)}
                        className="w-4 h-4 rounded border-[#ddd8cc] bg-[#f2efe8] text-[#3d6b2a] focus:ring-[#3d6b2a]/20"
                      />
                      <span className="text-sm text-[#4a5e3a]">{perm.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 px-6 py-4 border-t border-[#ddd8cc] bg-[#f8f6f1] shrink-0 sm:rounded-b-2xl">
              <button
                onClick={() => { setShowModal(false); resetForm(); }}
                className="flex-1 px-4 py-2.5 border border-[#ddd8cc] hover:border-[#ddd8cc] text-[#4a5e3a] font-medium rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={loading || !email}
                className="flex-1 px-4 py-2.5 bg-[#3d6b2a] hover:bg-[#2f5720] text-white font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><Loader size={16} className="animate-spin" /> Saving...</>
                ) : editingMember ? (
                  "Update Member"
                ) : (
                  <><Send size={14} /> Add Member</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
