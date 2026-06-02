"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Truck, Plus, UserPlus, Phone, Mail, MapPin, Loader2, CheckCircle2, X, Package } from "lucide-react";

interface Driver {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  is_active: boolean;
  activeDeliveries: number;
  completedToday: number;
}

interface DeliveryAssignment {
  id: string;
  order_id: string;
  status: string;
  assigned_at: string;
  delivered_at: string | null;
  order_number: string;
  customer_name: string;
}

export default function DriversPage() {
  const supabase = createClient();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDriver, setShowAddDriver] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null);
  const [driverDeliveries, setDriverDeliveries] = useState<DeliveryAssignment[]>([]);
  const [newDriver, setNewDriver] = useState({ first_name: "", last_name: "", email: "", phone: "" });
  const [saving, setSaving] = useState(false);

  const fetchDrivers = async () => {
    const { data: driverData } = await supabase
      .from("user_profiles")
      .select("id, first_name, last_name, email, phone, is_active")
      .eq("role", "driver")
      .order("first_name");

    if (!driverData) {
      setLoading(false);
      return;
    }

    // Get today's delivery counts
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: deliveryData } = await supabase
      .from("delivery_assignments")
      .select("driver_id, status")
      .in("driver_id", driverData.map((d) => d.id))
      .gte("assigned_at", today.toISOString());

    const enriched: Driver[] = driverData.map((driver) => {
      const driverDeliveries = (deliveryData || []).filter((d) => d.driver_id === driver.id);
      return {
        ...driver,
        is_active: driver.is_active ?? true,
        activeDeliveries: driverDeliveries.filter((d) => ["assigned", "picked_up", "in_transit"].includes(d.status)).length,
        completedToday: driverDeliveries.filter((d) => d.status === "delivered").length,
      };
    });

    setDrivers(enriched);
    setLoading(false);
  };

  const fetchDriverDeliveries = async (driverId: string) => {
    const { data } = await supabase
      .from("delivery_assignments")
      .select("id, order_id, status, assigned_at, delivered_at, orders(order_number, customer_name)")
      .eq("driver_id", driverId)
      .order("assigned_at", { ascending: false })
      .limit(20);

    setDriverDeliveries(
      (data || []).map((d: any) => ({
        id: d.id,
        order_id: d.order_id,
        status: d.status,
        assigned_at: d.assigned_at,
        delivered_at: d.delivered_at,
        order_number: d.orders?.order_number || "—",
        customer_name: d.orders?.customer_name || "Guest",
      }))
    );
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  useEffect(() => {
    if (selectedDriver) {
      fetchDriverDeliveries(selectedDriver);
    }
  }, [selectedDriver]);

  const handleAddDriver = async () => {
    if (!newDriver.first_name || !newDriver.last_name || !newDriver.email) return;
    setSaving(true);

    // Create a new user_profile with role 'driver'
    const { error } = await supabase.from("user_profiles").insert({
      id: crypto.randomUUID(),
      first_name: newDriver.first_name,
      last_name: newDriver.last_name,
      email: newDriver.email,
      phone: newDriver.phone,
      role: "driver",
      is_active: true,
    });

    if (!error) {
      setShowAddDriver(false);
      setNewDriver({ first_name: "", last_name: "", email: "", phone: "" });
      fetchDrivers();
    }
    setSaving(false);
  };

  const toggleDriverActive = async (driverId: string, isActive: boolean) => {
    await supabase.from("user_profiles").update({ is_active: !isActive }).eq("id", driverId);
    fetchDrivers();
  };

  const formatTime = (dateString: string) =>
    new Date(dateString).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 size={32} className="text-[#3d6b2a] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#1e2d18] flex items-center gap-3">
            <Truck size={32} className="text-[#3d6b2a]" /> Drivers
          </h1>
          <p className="text-[#7a7060] mt-1">{drivers.length} driver{drivers.length !== 1 ? "s" : ""} registered</p>
        </div>
        <button
          onClick={() => setShowAddDriver(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#3d6b2a] hover:bg-[#2f5720] text-white rounded-xl transition-colors font-medium"
        >
          <UserPlus size={20} /> Add Driver
        </button>
      </div>

      {/* Add Driver Modal */}
      {showAddDriver && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Add New Driver</h2>
            <button onClick={() => setShowAddDriver(false)} className="text-[#7a7060] hover:text-[#9a9080]">
              <X size={20} />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="First Name"
              value={newDriver.first_name}
              onChange={(e) => setNewDriver({ ...newDriver, first_name: e.target.value })}
              className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#3d6b2a] focus:border-transparent"
            />
            <input
              type="text"
              placeholder="Last Name"
              value={newDriver.last_name}
              onChange={(e) => setNewDriver({ ...newDriver, last_name: e.target.value })}
              className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#3d6b2a] focus:border-transparent"
            />
            <input
              type="email"
              placeholder="Email"
              value={newDriver.email}
              onChange={(e) => setNewDriver({ ...newDriver, email: e.target.value })}
              className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#3d6b2a] focus:border-transparent"
            />
            <input
              type="tel"
              placeholder="Phone"
              value={newDriver.phone}
              onChange={(e) => setNewDriver({ ...newDriver, phone: e.target.value })}
              className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#3d6b2a] focus:border-transparent"
            />
          </div>
          <button
            onClick={handleAddDriver}
            disabled={saving || !newDriver.first_name || !newDriver.last_name || !newDriver.email}
            className="mt-4 flex items-center gap-2 px-6 py-2.5 bg-[#3d6b2a] hover:bg-[#2f5720] text-white rounded-xl font-medium disabled:opacity-50 transition-colors"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            {saving ? "Adding..." : "Add Driver"}
          </button>
        </div>
      )}

      {/* Drivers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {drivers.map((driver) => (
          <div
            key={driver.id}
            className={`bg-white border rounded-2xl p-6 cursor-pointer transition-all hover:shadow-md ${
              selectedDriver === driver.id ? "border-[#3d6b2a] ring-2 ring-[#E8F5E3]" : "border-gray-200"
            }`}
            onClick={() => setSelectedDriver(selectedDriver === driver.id ? null : driver.id)}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#E8F5E3] flex items-center justify-center text-[#3d6b2a] font-bold text-sm">
                  {driver.first_name[0]}{driver.last_name[0]}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{driver.first_name} {driver.last_name}</p>
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                    driver.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-[#9a9080]"
                  }`}>
                    {driver.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); toggleDriverActive(driver.id, driver.is_active); }}
                className={`text-xs px-3 py-1 rounded-lg font-medium transition-colors ${
                  driver.is_active
                    ? "bg-red-50 text-red-600 hover:bg-red-100"
                    : "bg-green-50 text-green-600 hover:bg-green-100"
                }`}
              >
                {driver.is_active ? "Deactivate" : "Activate"}
              </button>
            </div>

            <div className="space-y-2 text-sm text-[#9a9080]">
              <div className="flex items-center gap-2"><Mail size={14} className="text-[#7a7060]" /> {driver.email}</div>
              {driver.phone && <div className="flex items-center gap-2"><Phone size={14} className="text-[#7a7060]" /> {driver.phone}</div>}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-xl font-bold text-[#3d6b2a]">{driver.activeDeliveries}</p>
                <p className="text-xs text-[#9a9080]">Active</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-gray-700">{driver.completedToday}</p>
                <p className="text-xs text-[#9a9080]">Today</p>
              </div>
            </div>
          </div>
        ))}

        {drivers.length === 0 && (
          <div className="col-span-full bg-white border border-gray-200 rounded-2xl p-12 text-center">
            <Truck size={48} className="mx-auto mb-4 text-[#4a5e3a]" />
            <p className="text-[#9a9080] text-lg font-medium">No drivers yet</p>
            <p className="text-[#7a7060] text-sm mt-1">Add your first driver to start assigning deliveries</p>
          </div>
        )}
      </div>

      {/* Selected Driver Deliveries */}
      {selectedDriver && driverDeliveries.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Package size={18} className="text-[#3d6b2a]" /> Recent Deliveries
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr className="border-b border-gray-200">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#9a9080] uppercase">Order</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#9a9080] uppercase">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#9a9080] uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#9a9080] uppercase">Assigned</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#9a9080] uppercase">Delivered</th>
                </tr>
              </thead>
              <tbody>
                {driverDeliveries.map((d) => (
                  <tr key={d.id} className="border-b border-gray-100">
                    <td className="px-6 py-3 text-sm font-medium text-gray-900">#{d.order_number}</td>
                    <td className="px-6 py-3 text-sm text-gray-700">{d.customer_name}</td>
                    <td className="px-6 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                        d.status === "delivered" ? "bg-green-100 text-green-700" :
                        d.status === "failed" ? "bg-red-100 text-red-700" :
                        "bg-blue-100 text-blue-700"
                      }`}>
                        {d.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm text-[#9a9080]">{formatTime(d.assigned_at)}</td>
                    <td className="px-6 py-3 text-sm text-[#9a9080]">{d.delivered_at ? formatTime(d.delivered_at) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
