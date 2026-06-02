"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { StatusBadge } from "./OrderBadges";
import {
  CheckCircle,
  Clock,
  ChefHat,
  PackageCheck,
  Truck,
  Home,
  AlertCircle,
  X
} from "lucide-react";

const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "out_for_delivery",
  "delivered",
  "cancelled",
];

type Driver = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
};

interface OrderStatusManagerProps {
  orderId: string;
  currentStatus: string;
  currentAdminNotes: string;
  currentAssignedDriverId?: string;
  onStatusUpdate?: () => void;
}

export default function OrderStatusManager({
  orderId,
  currentStatus,
  currentAdminNotes,
  currentAssignedDriverId,
  onStatusUpdate,
}: OrderStatusManagerProps) {
  const supabase = createClient();
  const [status, setStatus] = useState(currentStatus);
  const [adminNotes, setAdminNotes] = useState(currentAdminNotes);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedDriverId, setSelectedDriverId] = useState(
    currentAssignedDriverId || ""
  );
  const [loading, setLoading] = useState(false);
  const [noteSaving, setNoteSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showDriverSelect, setShowDriverSelect] = useState(
    currentStatus === "out_for_delivery"
  );

  // Fetch drivers on mount
  useEffect(() => {
    async function fetchDrivers() {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("id, first_name, last_name, email")
        .eq("role", "driver");

      if (!error && data) {
        setDrivers(data as Driver[]);
      }
    }

    fetchDrivers();
  }, []);

  const handleStatusChange = async (newStatus: string) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // If changing to out_for_delivery, show driver select
      if (newStatus === "out_for_delivery") {
        setShowDriverSelect(true);
        return; // Don't update status until driver is selected
      }

      const response = await fetch(
        `/api/admin/orders/${orderId}/status`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: newStatus,
            assignedDriverId:
              newStatus === "out_for_delivery" ? selectedDriverId : undefined,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update order status");
      }

      setStatus(newStatus);
      setSuccess(`Order status updated to ${newStatus.replace(/_/g, " ")}`);
      onStatusUpdate?.();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update status"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAssignDriver = async () => {
    if (!selectedDriverId) {
      setError("Please select a driver");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/orders/${orderId}/status`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "out_for_delivery",
            assignedDriverId: selectedDriverId,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to assign driver");
      }

      setStatus("out_for_delivery");
      setShowDriverSelect(false);
      setSuccess("Order assigned to driver and marked as out for delivery");
      onStatusUpdate?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to assign driver");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotes = async () => {
    setNoteSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(
        `/api/admin/orders/${orderId}/notes`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ adminNotes }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to save notes");
      }

      setSuccess("Admin notes saved");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save notes");
    } finally {
      setNoteSaving(false);
    }
  };

  // Get icon for status
  const getStatusIcon = (s: string) => {
    switch (s) {
      case "pending":
        return <Clock size={16} />;
      case "confirmed":
        return <CheckCircle size={16} />;
      case "preparing":
        return <ChefHat size={16} />;
      case "ready":
        return <PackageCheck size={16} />;
      case "out_for_delivery":
        return <Truck size={16} />;
      case "delivered":
        return <Home size={16} />;
      case "cancelled":
        return <X size={16} />;
      default:
        return null;
    }
  };

  // Determine which actions should be available
  const getAvailableActions = () => {
    const actions = [];
    const statusIndex = ORDER_STATUSES.indexOf(status);

    // Allow forward progression
    if (statusIndex < ORDER_STATUSES.length - 2) {
      actions.push(ORDER_STATUSES[statusIndex + 1]);
    }

    // Always allow cancel (unless already cancelled or delivered)
    if (status !== "cancelled" && status !== "delivered") {
      actions.push("cancelled");
    }

    return actions;
  };

  const availableActions = getAvailableActions();

  return (
    <div className="space-y-6">
      {/* Current Status */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Fulfillment Status</h3>
        <div className="flex items-center gap-3">
          <StatusBadge status={status} />
          <span className="text-sm text-[#9a9080]">Current</span>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="space-y-2">
          {availableActions.length > 0 ? (
            availableActions.map((s) => (
              <button
                key={s}
                onClick={() => handleStatusChange(s)}
                disabled={loading || s === status}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                  s === "cancelled"
                    ? "bg-red-50 hover:bg-red-100 text-red-700 border border-red-200"
                    : s === status
                    ? "bg-[#3d6b2a] text-white"
                    : "bg-[#E8F5E3] text-[#3d6b2a] hover:bg-[#d4eecf] border border-[#3d6b2a]"
                }`}
              >
                <span className="flex-shrink-0">{getStatusIcon(s)}</span>
                <span className="flex-1 text-left">
                  {s === "out_for_delivery"
                    ? "Send for Delivery"
                    : s === "ready"
                    ? "Mark Ready"
                    : s === "preparing"
                    ? "Start Preparing"
                    : s === "confirmed"
                    ? "Confirm Order"
                    : s === "delivered"
                    ? "Mark Delivered"
                    : s === "cancelled"
                    ? "Cancel Order"
                    : s.replace(/_/g, " ")}
                </span>
                {loading && <span className="text-xs">...</span>}
              </button>
            ))
          ) : (
            <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl text-[#9a9080] text-sm">
              <AlertCircle size={14} />
              No actions available for this status
            </div>
          )}
        </div>
      </div>

      {/* Full Status Selector (for reference) */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <label className="block text-sm font-semibold text-gray-900 mb-4">
          All Statuses
        </label>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {ORDER_STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => handleStatusChange(s)}
              disabled={loading || s === status}
              className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                s === status
                  ? "bg-[#3d6b2a] text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50"
              }`}
            >
              {s.replace(/_/g, " ").charAt(0).toUpperCase() +
                s.replace(/_/g, " ").slice(1)}
            </button>
          ))}
        </div>

        {/* Driver Selection (shown when changing to out_for_delivery) */}
        {showDriverSelect && status !== "out_for_delivery" && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Assign Driver
            </label>
            <select
              value={selectedDriverId}
              onChange={(e) => setSelectedDriverId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-3 focus:ring-2 focus:ring-[#3d6b2a] focus:border-transparent"
            >
              <option value="">Select a driver...</option>
              {drivers.map((driver) => (
                <option key={driver.id} value={driver.id}>
                  {driver.first_name} {driver.last_name}
                </option>
              ))}
            </select>
            <button
              onClick={handleAssignDriver}
              disabled={loading || !selectedDriverId}
              className="w-full px-4 py-2 bg-[#3d6b2a] hover:bg-[#2f5720] text-white rounded-lg font-medium disabled:opacity-50 transition-colors"
            >
              {loading ? "Assigning..." : "Assign Driver"}
            </button>
            <button
              onClick={() => setShowDriverSelect(false)}
              className="w-full px-4 py-2 mt-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Admin Notes */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <label className="block text-sm font-semibold text-gray-900 mb-3">
          Admin Notes
        </label>
        <textarea
          value={adminNotes}
          onChange={(e) => setAdminNotes(e.target.value)}
          placeholder="Add notes about this order..."
          className="w-full px-4 py-3 border border-gray-300 rounded-lg font-mono text-sm resize-none focus:ring-2 focus:ring-[#3d6b2a] focus:border-transparent"
          rows={4}
        />
        <button
          onClick={handleSaveNotes}
          disabled={noteSaving || adminNotes === currentAdminNotes}
          className="mt-3 w-full px-4 py-2 bg-[#3d6b2a] hover:bg-[#2f5720] text-white rounded-lg font-medium disabled:opacity-50 transition-colors"
        >
          {noteSaving ? "Saving..." : "Save Notes"}
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          {success}
        </div>
      )}
    </div>
  );
}
