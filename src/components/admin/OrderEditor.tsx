"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Pencil, Save, X, Trash2, Plus, DollarSign, Undo2,
  Loader2, Check, AlertTriangle, Receipt
} from "lucide-react";

interface OrderItem {
  id: string;
  recipe_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  special_instructions: string | null;
  recipe_name: string;
  recipe_image?: string;
  portion_size?: string;
}

interface OrderEditorProps {
  orderId: string;
  orderNumber: string;
  items: OrderItem[];
  subtotal: number;
  taxAmount: number;
  deliveryFee: number;
  tipAmount: number;
  discountAmount: number;
  totalAmount: number;
  paymentStatus: string;
  stripePaymentIntentId: string | null;
}

export default function OrderEditor({
  orderId,
  orderNumber,
  items: initialItems,
  subtotal: initialSubtotal,
  taxAmount: initialTax,
  deliveryFee: initialDeliveryFee,
  tipAmount: initialTip,
  discountAmount: initialDiscount,
  totalAmount: initialTotal,
  paymentStatus,
  stripePaymentIntentId,
}: OrderEditorProps) {
  const supabase = createClient();

  // Editing state
  const [isEditing, setIsEditing] = useState(false);
  const [items, setItems] = useState(initialItems);
  const [editSubtotal, setEditSubtotal] = useState(initialSubtotal);
  const [editTax, setEditTax] = useState(initialTax);
  const [editDeliveryFee, setEditDeliveryFee] = useState(initialDeliveryFee);
  const [editTip, setEditTip] = useState(initialTip);
  const [editDiscount, setEditDiscount] = useState(initialDiscount);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Refund state
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [refundType, setRefundType] = useState<"full" | "partial">("partial");
  const [refunding, setRefunding] = useState(false);

  // Adjust amount modal
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustField, setAdjustField] = useState<"discount" | "tip" | "delivery_fee" | "tax">("discount");
  const [adjustValue, setAdjustValue] = useState("");

  const computedTotal = () => {
    const itemsTotal = items.reduce((sum, i) => sum + i.unit_price * i.quantity, 0);
    return itemsTotal - editDiscount + editTax + editDeliveryFee + editTip;
  };

  // ── Item Editing ──
  const updateItemQuantity = (itemId: string, newQty: number) => {
    if (newQty < 1) return;
    setItems(prev =>
      prev.map(i => i.id === itemId ? { ...i, quantity: newQty, total_price: i.unit_price * newQty } : i)
    );
  };

  const updateItemPrice = (itemId: string, newPrice: number) => {
    setItems(prev =>
      prev.map(i => i.id === itemId ? { ...i, unit_price: newPrice, total_price: newPrice * i.quantity } : i)
    );
  };

  const removeItem = (itemId: string) => {
    if (items.length <= 1) {
      setSaveMessage({ type: "error", text: "Cannot remove the last item. Cancel the order instead." });
      return;
    }
    setItems(prev => prev.filter(i => i.id !== itemId));
  };

  // ── Save Changes ──
  const handleSave = async () => {
    setSaving(true);
    setSaveMessage(null);
    try {
      // Update each order item
      for (const item of items) {
        await supabase.from("order_items").update({
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.unit_price * item.quantity,
        }).eq("id", item.id);
      }

      // Delete removed items
      const currentItemIds = items.map(i => i.id);
      const removedItems = initialItems.filter(i => !currentItemIds.includes(i.id));
      for (const removed of removedItems) {
        await supabase.from("order_items").delete().eq("id", removed.id);
      }

      // Recalculate and update order totals
      const newSubtotal = items.reduce((sum, i) => sum + i.unit_price * i.quantity, 0);
      const newTotal = newSubtotal - editDiscount + editTax + editDeliveryFee + editTip;

      await supabase.from("orders").update({
        items_subtotal: newSubtotal,
        subtotal: newSubtotal,
        tax_amount: editTax,
        delivery_fee: editDeliveryFee,
        tip_amount: editTip,
        discount_amount: editDiscount,
        total_amount: newTotal,
      }).eq("id", orderId);

      setEditSubtotal(newSubtotal);
      setIsEditing(false);
      setSaveMessage({ type: "success", text: "Order updated successfully" });
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      console.error("Error saving order:", err);
      setSaveMessage({ type: "error", text: "Failed to save changes" });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setItems(initialItems);
    setEditSubtotal(initialSubtotal);
    setEditTax(initialTax);
    setEditDeliveryFee(initialDeliveryFee);
    setEditTip(initialTip);
    setEditDiscount(initialDiscount);
    setIsEditing(false);
  };

  // ── Refund ──
  const handleRefund = async () => {
    const amount = refundType === "full" ? initialTotal : parseFloat(refundAmount);
    if (!amount || amount <= 0) {
      setSaveMessage({ type: "error", text: "Please enter a valid refund amount" });
      return;
    }
    if (amount > initialTotal) {
      setSaveMessage({ type: "error", text: "Refund amount cannot exceed order total" });
      return;
    }

    setRefunding(true);
    setSaveMessage(null);

    try {
      // Call refund API
      const response = await fetch(`/api/admin/orders/${orderId}/refund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          reason: refundReason,
          type: refundType,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to process refund");
      }

      // Update order status
      const newPaymentStatus = refundType === "full" ? "refunded" : "partially_refunded";
      const newOrderStatus = refundType === "full" ? "refunded" : undefined;

      const updates: Record<string, unknown> = { payment_status: newPaymentStatus };
      if (newOrderStatus) updates.status = newOrderStatus;

      await supabase.from("orders").update(updates).eq("id", orderId);

      setShowRefundModal(false);
      setSaveMessage({ type: "success", text: `Refund of $${amount.toFixed(2)} processed` });
      setTimeout(() => window.location.reload(), 2000);
    } catch (err) {
      console.error("Error processing refund:", err);
      setSaveMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to process refund" });
    } finally {
      setRefunding(false);
    }
  };

  // ── Quick Adjust ──
  const handleAdjust = async () => {
    const value = parseFloat(adjustValue);
    if (isNaN(value) || value < 0) return;

    setSaving(true);
    try {
      const fieldMap: Record<string, string> = {
        discount: "discount_amount",
        tip: "tip_amount",
        delivery_fee: "delivery_fee",
        tax: "tax_amount",
      };

      const dbField = fieldMap[adjustField];

      // Calculate new total
      const stateUpdaters: Record<string, (v: number) => void> = {
        discount: setEditDiscount,
        tip: setEditTip,
        delivery_fee: setEditDeliveryFee,
        tax: setEditTax,
      };
      stateUpdaters[adjustField](value);

      const newDiscount = adjustField === "discount" ? value : editDiscount;
      const newTip = adjustField === "tip" ? value : editTip;
      const newDeliveryFee = adjustField === "delivery_fee" ? value : editDeliveryFee;
      const newTax = adjustField === "tax" ? value : editTax;
      const newTotal = editSubtotal - newDiscount + newTax + newDeliveryFee + newTip;

      await supabase.from("orders").update({
        [dbField]: value,
        total_amount: newTotal,
      }).eq("id", orderId);

      setShowAdjustModal(false);
      setSaveMessage({ type: "success", text: `${adjustField.replace("_", " ")} updated` });
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      setSaveMessage({ type: "error", text: "Failed to adjust amount" });
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);

  return (
    <div className="space-y-4">
      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        {!isEditing ? (
          <>
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#E8F5E3] text-[#3d6b2a] rounded-xl font-medium hover:bg-[#d4eecf] transition-colors text-sm"
            >
              <Pencil size={15} /> Edit Order
            </button>
            <button
              onClick={() => {
                setAdjustField("discount");
                setAdjustValue(String(editDiscount));
                setShowAdjustModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors text-sm"
            >
              <DollarSign size={15} /> Adjust Amounts
            </button>
            {paymentStatus === "paid" && (
              <button
                onClick={() => {
                  setRefundType("partial");
                  setRefundAmount("");
                  setRefundReason("");
                  setShowRefundModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-xl font-medium hover:bg-red-100 transition-colors text-sm"
              >
                <Undo2 size={15} /> Issue Refund
              </button>
            )}
          </>
        ) : (
          <>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-[#3d6b2a] text-white rounded-xl font-medium hover:bg-[#2f5720] transition-colors text-sm disabled:opacity-50"
            >
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              Save Changes
            </button>
            <button
              onClick={handleCancel}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors text-sm"
            >
              <X size={15} /> Cancel
            </button>
          </>
        )}
      </div>

      {/* Message */}
      {saveMessage && (
        <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium ${
          saveMessage.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
        }`}>
          {saveMessage.type === "success" ? <Check size={16} /> : <AlertTriangle size={16} />}
          {saveMessage.text}
        </div>
      )}

      {/* Editable Items Table */}
      {isEditing && (
        <div className="bg-white border border-[#3d6b2a]/20 rounded-2xl overflow-hidden ring-2 ring-[#3d6b2a]/10">
          <div className="px-6 py-3 bg-[#E8F5E3] border-b border-[#3d6b2a]/10">
            <p className="text-sm font-semibold text-[#3d6b2a] flex items-center gap-2">
              <Pencil size={14} /> Editing Order #{orderNumber}
            </p>
          </div>
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr className="border-b border-gray-200">
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#9a9080] uppercase">Item</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#9a9080] uppercase w-24">Qty</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#9a9080] uppercase w-32">Unit Price</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-[#9a9080] uppercase w-28">Total</th>
                <th className="px-4 py-3 w-12"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-gray-100">
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      {item.recipe_image && (
                        <img src={item.recipe_image} alt="" className="w-8 h-8 rounded-lg object-cover" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-900">{item.recipe_name}</p>
                        {item.portion_size && <p className="text-xs text-[#9a9080]">{item.portion_size}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateItemQuantity(item.id, parseInt(e.target.value) || 1)}
                      min="1"
                      className="w-16 px-2 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg text-center focus:outline-none focus:border-[#3d6b2a]/50"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <span className="text-[#7a7060] text-sm">$</span>
                      <input
                        type="number"
                        value={item.unit_price}
                        onChange={(e) => updateItemPrice(item.id, parseFloat(e.target.value) || 0)}
                        step="0.01"
                        min="0"
                        className="w-24 px-2 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#3d6b2a]/50"
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-medium text-gray-900 tabular-nums">
                    {formatCurrency(item.unit_price * item.quantity)}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-[#7a7060] hover:text-red-600 transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals in edit mode */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="max-w-xs ml-auto space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-[#9a9080]">Items Total</span>
                <span className="text-gray-900 tabular-nums">{formatCurrency(items.reduce((s, i) => s + i.unit_price * i.quantity, 0))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#9a9080]">Discount</span>
                <span className="text-red-600 tabular-nums">-{formatCurrency(editDiscount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#9a9080]">Tax</span>
                <span className="text-gray-900 tabular-nums">{formatCurrency(editTax)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#9a9080]">Delivery</span>
                <span className="text-gray-900 tabular-nums">{formatCurrency(editDeliveryFee)}</span>
              </div>
              {editTip > 0 && (
                <div className="flex justify-between">
                  <span className="text-[#9a9080]">Tip</span>
                  <span className="text-gray-900 tabular-nums">{formatCurrency(editTip)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold pt-2 border-t border-gray-200">
                <span className="text-gray-900">New Total</span>
                <span className="text-[#3d6b2a] tabular-nums">{formatCurrency(computedTotal())}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Refund Modal ═══ */}
      {showRefundModal && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Undo2 size={20} className="text-red-600" /> Issue Refund
              </h2>
              <button onClick={() => setShowRefundModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X size={20} className="text-[#9a9080]" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex justify-between text-sm">
                  <span className="text-[#9a9080]">Order Total</span>
                  <span className="font-bold text-gray-900">{formatCurrency(initialTotal)}</span>
                </div>
                {stripePaymentIntentId && (
                  <p className="text-xs text-[#7a7060] mt-1">
                    Stripe: {stripePaymentIntentId.slice(0, 20)}...
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-900">Refund Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => { setRefundType("full"); setRefundAmount(String(initialTotal)); }}
                    className={`p-3 rounded-xl border text-sm font-medium transition-colors ${
                      refundType === "full"
                        ? "border-red-400 bg-red-50 text-red-700"
                        : "border-gray-200 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    Full Refund
                  </button>
                  <button
                    onClick={() => { setRefundType("partial"); setRefundAmount(""); }}
                    className={`p-3 rounded-xl border text-sm font-medium transition-colors ${
                      refundType === "partial"
                        ? "border-red-400 bg-red-50 text-red-700"
                        : "border-gray-200 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    Partial Refund
                  </button>
                </div>
              </div>

              {refundType === "partial" && (
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1.5">Amount</label>
                  <div className="flex items-center gap-1">
                    <span className="text-[#7a7060] text-lg">$</span>
                    <input
                      type="number"
                      value={refundAmount}
                      onChange={(e) => setRefundAmount(e.target.value)}
                      step="0.01"
                      min="0.01"
                      max={initialTotal}
                      placeholder="0.00"
                      autoFocus
                      className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-lg font-medium focus:outline-none focus:border-red-400"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1.5">Reason (optional)</label>
                <textarea
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="Customer requested change, quality issue, etc."
                  rows={2}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-red-400 resize-none"
                />
              </div>

              {refundType === "full" && (
                <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <AlertTriangle size={16} className="text-amber-600 mt-0.5 shrink-0" />
                  <p className="text-xs text-amber-700">
                    Full refund will refund {formatCurrency(initialTotal)} and mark the order as refunded.
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowRefundModal(false)}
                className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 text-gray-900 rounded-xl hover:bg-gray-100 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleRefund}
                disabled={refunding || (refundType === "partial" && (!refundAmount || parseFloat(refundAmount) <= 0))}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {refunding ? <Loader2 size={16} className="animate-spin" /> : <Undo2 size={16} />}
                {refundType === "full"
                  ? `Refund ${formatCurrency(initialTotal)}`
                  : refundAmount ? `Refund ${formatCurrency(parseFloat(refundAmount) || 0)}` : "Refund"
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Adjust Amounts Modal ═══ */}
      {showAdjustModal && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <DollarSign size={20} className="text-[#3d6b2a]" /> Adjust Order Amounts
              </h2>
              <button onClick={() => setShowAdjustModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X size={20} className="text-[#9a9080]" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1.5">Field to Adjust</label>
                <select
                  value={adjustField}
                  onChange={(e) => {
                    const field = e.target.value as typeof adjustField;
                    setAdjustField(field);
                    const values = { discount: editDiscount, tip: editTip, delivery_fee: editDeliveryFee, tax: editTax };
                    setAdjustValue(String(values[field]));
                  }}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-[#3d6b2a]/50"
                >
                  <option value="discount">Discount</option>
                  <option value="delivery_fee">Delivery Fee</option>
                  <option value="tax">Tax</option>
                  <option value="tip">Tip</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1.5">New Amount</label>
                <div className="flex items-center gap-1">
                  <span className="text-[#7a7060] text-lg">$</span>
                  <input
                    type="number"
                    value={adjustValue}
                    onChange={(e) => setAdjustValue(e.target.value)}
                    step="0.01"
                    min="0"
                    className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-lg font-medium focus:outline-none focus:border-[#3d6b2a]/50"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowAdjustModal(false)}
                className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 text-gray-900 rounded-xl hover:bg-gray-100 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleAdjust}
                disabled={saving}
                className="flex-1 px-4 py-2.5 bg-[#3d6b2a] hover:bg-[#2f5720] text-white rounded-xl transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
