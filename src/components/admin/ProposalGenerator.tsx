'use client';

import React, { useState, useRef } from 'react';
import { FileText, Send, Link2, CheckCircle, Clock, Plus, X, Eye, ChevronDown, ChevronUp, Download, Trash2, Calculator } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface CateringOrder {
  id: string;
  order_number: string;
  event_name?: string;
  event_date: string;
  contact_name: string;
  contact_email?: string;
  contact_phone?: string;
  venue_name?: string;
  venue_address?: string;
  estimated_guests: number;
  total_amount?: number;
  status?: string;
}

interface CateringProposal {
  id: string;
  store_id: string;
  catering_order_id?: string | null;
  proposal_number: string;
  client_name: string;
  client_email?: string;
  client_phone?: string;
  event_name?: string;
  event_date?: string;
  venue?: string;
  guest_count?: number;
  package_name?: string;
  menu_items?: any;
  pricing_breakdown?: any;
  subtotal?: number;
  tax_amount?: number;
  total_amount?: number;
  deposit_required?: number;
  payment_terms?: string;
  notes?: string;
  status: string;
  sent_at?: string;
  viewed_at?: string;
  accepted_at?: string;
  created_at: string;
}

interface Props {
  cateringOrders: CateringOrder[];
  existingProposals: CateringProposal[];
}

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  days: number;
  people: number;
  price_per_unit: number;
  unit_label: string; // "per meal", "per person", "flat"
}

const STORE_ID = "b0000000-0000-0000-0000-000000000001";
const TAX_RATE = 0.086;

const newLineItem = (): LineItem => ({
  id: Math.random().toString(36).slice(2, 9),
  description: '',
  quantity: 1,
  days: 1,
  people: 0,
  price_per_unit: 0,
  unit_label: 'per meal',
});

const calcLineTotal = (item: LineItem) => {
  if (item.unit_label === 'per person') return item.people * item.days * item.price_per_unit;
  if (item.unit_label === 'per meal') return item.quantity * item.days * item.price_per_unit;
  return item.quantity * item.price_per_unit; // flat
};

export default function ProposalGenerator({ cateringOrders, existingProposals }: Props) {
  const [proposals, setProposals] = useState(existingProposals);
  const [loading, setLoading] = useState<string | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [expandedProposal, setExpandedProposal] = useState<string | null>(null);
  const supabase = createClient();

  // Form state
  const [form, setForm] = useState({
    catering_order_id: '',
    client_name: '',
    client_email: '',
    client_phone: '',
    event_name: '',
    event_date: '',
    venue: '',
    guest_count: '',
    package_name: '',
    notes: '',
    deposit_required: '',
    payment_terms: '50% deposit required to confirm booking, balance due 7 days before event.',
  });

  const [lineItems, setLineItems] = useState<LineItem[]>([newLineItem()]);

  const resetForm = () => {
    setForm({
      catering_order_id: '',
      client_name: '',
      client_email: '',
      client_phone: '',
      event_name: '',
      event_date: '',
      venue: '',
      guest_count: '',
      package_name: '',
      notes: '',
      deposit_required: '',
      payment_terms: '50% deposit required to confirm booking, balance due 7 days before event.',
    });
    setLineItems([newLineItem()]);
  };

  const prefillFromOrder = (orderId: string) => {
    const order = cateringOrders.find(o => o.id === orderId);
    if (!order) { resetForm(); return; }
    setForm({
      catering_order_id: orderId,
      client_name: order.contact_name || '',
      client_email: order.contact_email || '',
      client_phone: order.contact_phone || '',
      event_name: order.event_name || '',
      event_date: order.event_date || '',
      venue: order.venue_name ? `${order.venue_name}${order.venue_address ? ', ' + order.venue_address : ''}` : '',
      guest_count: order.estimated_guests?.toString() || '',
      package_name: '',
      notes: '',
      deposit_required: order.total_amount ? (order.total_amount * 0.5).toFixed(2) : '',
      payment_terms: '50% deposit required to confirm booking, balance due 7 days before event.',
    });
  };

  // Line item calculations
  const subtotal = lineItems.reduce((sum, item) => sum + calcLineTotal(item), 0);
  const taxAmount = subtotal * TAX_RATE;
  const totalAmount = subtotal + taxAmount;

  const addLineItem = () => setLineItems(prev => [...prev, newLineItem()]);
  const removeLineItem = (id: string) => setLineItems(prev => prev.filter(i => i.id !== id));
  const updateLineItem = (id: string, field: keyof LineItem, value: string | number) => {
    setLineItems(prev => prev.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const generateProposalNumber = () => {
    const d = new Date();
    const y = d.getFullYear().toString().slice(-2);
    const m = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    const r = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `MFK-${y}${m}${day}-${r}`;
  };

  const createProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading('create');

    try {
      const depositRequired = parseFloat(form.deposit_required) || totalAmount * 0.5;

      const pricingBreakdown = lineItems.map(item => ({
        description: item.description,
        quantity: item.quantity,
        days: item.days,
        people: item.people,
        price_per_unit: item.price_per_unit,
        unit_label: item.unit_label,
        line_total: calcLineTotal(item),
      }));

      const proposalData = {
        store_id: STORE_ID,
        catering_order_id: form.catering_order_id || null,
        proposal_number: generateProposalNumber(),
        client_name: form.client_name,
        client_email: form.client_email || null,
        client_phone: form.client_phone || null,
        event_name: form.event_name || null,
        event_date: form.event_date || null,
        venue: form.venue || null,
        guest_count: form.guest_count ? parseInt(form.guest_count) : null,
        package_name: form.package_name || null,
        menu_items: lineItems.map(i => i.description).filter(Boolean),
        pricing_breakdown: pricingBreakdown,
        subtotal,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        deposit_required: depositRequired,
        payment_terms: form.payment_terms || null,
        notes: form.notes || null,
        status: 'draft',
      };

      const { data, error } = await supabase
        .from('catering_proposals')
        .insert(proposalData)
        .select()
        .single();

      if (error) throw error;

      setProposals(prev => [data, ...prev]);
      setShowForm(false);
      resetForm();
    } catch (error) {
      console.error('Error creating proposal:', error);
      alert('Failed to create proposal. Check console for details.');
    } finally {
      setLoading(null);
    }
  };

  const updateProposalStatus = async (proposalId: string, newStatus: string) => {
    setLoading(proposalId);
    try {
      const updateData: Record<string, string> = { status: newStatus };
      if (newStatus === 'sent') updateData.sent_at = new Date().toISOString();
      const { error } = await supabase.from('catering_proposals').update(updateData).eq('id', proposalId);
      if (error) throw error;
      setProposals(prev => prev.map(p =>
        p.id === proposalId ? { ...p, status: newStatus } : p
      ));
    } catch (error) {
      console.error('Error updating proposal:', error);
    } finally {
      setLoading(null);
    }
  };

  const deleteProposal = async (proposalId: string) => {
    if (!confirm('Delete this proposal? This cannot be undone.')) return;
    setLoading(proposalId);
    try {
      const { error } = await supabase.from('catering_proposals').delete().eq('id', proposalId);
      if (error) throw error;
      setProposals(prev => prev.filter(p => p.id !== proposalId));
    } catch (error) {
      console.error('Error deleting proposal:', error);
    } finally {
      setLoading(null);
    }
  };

  const copyProposalLink = (proposalId: string) => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    navigator.clipboard.writeText(`${baseUrl}/proposals/${proposalId}`);
    setCopyFeedback(proposalId);
    setTimeout(() => setCopyFeedback(null), 2000);
  };

  // PDF Generation
  const generatePDF = async (proposal: CateringProposal) => {
    setLoading(`pdf-${proposal.id}`);
    try {
      const breakdown = Array.isArray(proposal.pricing_breakdown) ? proposal.pricing_breakdown : [];
      const eventDate = proposal.event_date ? new Date(proposal.event_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'TBD';
      const createdDate = new Date(proposal.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

      const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1a1a1a;line-height:1.6;background:#fff}
.page{max-width:800px;margin:0 auto;padding:40px}
.header{background:linear-gradient(135deg,#1a3a1a,#2d5a2d);padding:40px;text-align:center;color:#fff;border-radius:8px 8px 0 0}
.logo{font-size:28px;font-weight:700;color:#75F663;letter-spacing:2px}
.tagline{color:#b0e0b0;font-size:12px;text-transform:uppercase;letter-spacing:1px;margin-top:4px}
.proposal-badge{display:inline-block;background:#75F663;color:#0a0a0a;padding:6px 16px;border-radius:20px;font-weight:700;font-size:13px;margin-top:16px}
.content{padding:32px 40px}
.section{margin-bottom:28px}
.section-title{font-size:14px;font-weight:700;color:#3d6b2a;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;padding-bottom:8px;border-bottom:2px solid #3d6b2a}
.info-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px}
.info-block h4{font-size:11px;text-transform:uppercase;color:#3d6b2a;letter-spacing:1px;margin-bottom:4px}
.info-block p{font-size:13px;color:#444;margin:2px 0}
.event-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.event-card{background:#f8f9fa;padding:14px;border-left:3px solid #3d6b2a;border-radius:0 4px 4px 0}
.event-label{font-size:10px;text-transform:uppercase;color:#3d6b2a;letter-spacing:1px;font-weight:600}
.event-value{font-size:14px;color:#1a1a1a;font-weight:500;margin-top:2px}
table{width:100%;border-collapse:collapse;margin:12px 0}
th{background:#f0f7ef;text-align:left;padding:10px 12px;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:#3d6b2a;font-weight:700;border-bottom:2px solid #3d6b2a}
td{padding:10px 12px;font-size:13px;color:#444;border-bottom:1px solid #eee}
td:last-child,th:last-child{text-align:right}
.total-row td{font-weight:700;font-size:15px;color:#3d6b2a;border-top:2px solid #3d6b2a;border-bottom:none;padding-top:14px}
.subtotal-row td{color:#666;font-size:12px}
.terms{background:#f8f9fa;padding:16px;border-left:3px solid #3d6b2a;font-size:12px;color:#666;border-radius:0 4px 4px 0}
.terms ul{margin-left:16px;margin-top:6px}
.terms li{margin-bottom:4px}
.footer{text-align:center;padding:24px;border-top:1px solid #eee;font-size:11px;color:#999}
.footer a{color:#3d6b2a}
@media print{.page{padding:20px}.header{padding:24px}}
</style></head><body><div class="page">
<div class="header">
<div class="logo">MAD FRESH KITCHEN</div>
<div class="tagline">Professional Catering Services</div>
<div class="proposal-badge">PROPOSAL ${proposal.proposal_number}</div>
</div>
<div class="content">
<div class="section">
<div class="info-grid">
<div class="info-block"><h4>Prepared For</h4>
<p><strong>${proposal.client_name}</strong></p>
${proposal.client_email ? `<p>${proposal.client_email}</p>` : ''}
${proposal.client_phone ? `<p>${proposal.client_phone}</p>` : ''}
</div>
<div class="info-block"><h4>Proposal Details</h4>
<p><strong>#${proposal.proposal_number}</strong></p>
<p>Date: ${createdDate}</p>
<p>Status: ${proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}</p>
</div></div></div>

<div class="section">
<div class="section-title">Event Details</div>
<div class="event-grid">
${proposal.event_name ? `<div class="event-card"><div class="event-label">Event</div><div class="event-value">${proposal.event_name}</div></div>` : ''}
<div class="event-card"><div class="event-label">Date</div><div class="event-value">${eventDate}</div></div>
${proposal.guest_count ? `<div class="event-card"><div class="event-label">Guests</div><div class="event-value">${proposal.guest_count} people</div></div>` : ''}
${proposal.venue ? `<div class="event-card"><div class="event-label">Venue</div><div class="event-value">${proposal.venue}</div></div>` : ''}
</div></div>

<div class="section">
<div class="section-title">Pricing Breakdown</div>
<table>
<thead><tr><th>Description</th><th>Qty</th><th>Days</th><th>Rate</th><th>Total</th></tr></thead>
<tbody>
${breakdown.map((item: any) => `<tr>
<td>${item.description || 'Line item'}</td>
<td>${item.unit_label === 'per person' ? (item.people || item.quantity) : item.quantity}</td>
<td>${item.days || 1}</td>
<td>$${(item.price_per_unit || 0).toFixed(2)} ${item.unit_label || ''}</td>
<td>$${(item.line_total || 0).toFixed(2)}</td>
</tr>`).join('')}
<tr class="subtotal-row"><td colspan="4">Subtotal</td><td>$${(proposal.subtotal || 0).toFixed(2)}</td></tr>
<tr class="subtotal-row"><td colspan="4">Tax (8.6%)</td><td>$${(proposal.tax_amount || 0).toFixed(2)}</td></tr>
<tr class="total-row"><td colspan="4">TOTAL</td><td>$${(proposal.total_amount || 0).toFixed(2)}</td></tr>
</tbody></table>
${proposal.deposit_required ? `<p style="font-size:12px;color:#666;margin-top:8px">Deposit required: <strong>$${Number(proposal.deposit_required).toFixed(2)}</strong></p>` : ''}
</div>

${proposal.notes ? `<div class="section"><div class="section-title">Notes</div><p style="font-size:13px;color:#444">${proposal.notes}</p></div>` : ''}

<div class="section">
<div class="section-title">Terms & Conditions</div>
<div class="terms"><ul>
<li><strong>Payment:</strong> ${proposal.payment_terms || '50% deposit required to confirm booking, balance due 7 days before event.'}</li>
<li><strong>Cancellation:</strong> Full refund if cancelled 30+ days in advance. 50% fee within 30 days.</li>
<li><strong>Menu Changes:</strong> Custom menus available. Additional charges may apply.</li>
<li><strong>Dietary Needs:</strong> Please inform us of any dietary restrictions in advance.</li>
</ul></div></div>
</div>
<div class="footer">
<p><strong>Mad Fresh Kitchen</strong> &middot; 455 S 48th St, Tempe, AZ 85281</p>
<p><a href="mailto:order@madfresh.app">order@madfresh.app</a> &middot; (480) 382-7755</p>
<p style="margin-top:8px">&copy; ${new Date().getFullYear()} Mad Fresh Kitchen. All rights reserved.</p>
</div></div></body></html>`;

      // Open in new tab for print/save as PDF
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const win = window.open(url, '_blank');
      if (win) {
        win.onload = () => {
          setTimeout(() => win.print(), 500);
        };
      }
    } catch (err) {
      console.error('Error generating PDF:', err);
    } finally {
      setLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-700 border-gray-200',
      sent: 'bg-blue-50 text-blue-700 border-blue-200',
      viewed: 'bg-purple-50 text-purple-700 border-purple-200',
      accepted: 'bg-green-50 text-green-700 border-green-200',
      declined: 'bg-red-50 text-red-700 border-red-200',
    };
    return styles[status] || styles.draft;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted': return <CheckCircle className="w-3.5 h-3.5" />;
      case 'viewed': return <Eye className="w-3.5 h-3.5" />;
      case 'sent': return <Send className="w-3.5 h-3.5" />;
      default: return <Clock className="w-3.5 h-3.5" />;
    }
  };

  const getOrderLabel = (orderId: string | null | undefined) => {
    if (!orderId) return null;
    const order = cateringOrders.find(o => o.id === orderId);
    return order ? `${order.order_number} — ${order.contact_name}` : orderId.slice(0, 8);
  };

  const fmt = (v: number) => `$${v.toFixed(2)}`;

  return (
    <div className="space-y-6">
      {/* Create Proposal Button */}
      <div className="flex justify-end">
        <button
          onClick={() => { setShowForm(!showForm); if (!showForm) resetForm(); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#3d6b2a] hover:bg-[#2f5720] text-white rounded-xl font-medium transition-colors"
        >
          {showForm ? <X size={20} /> : <Plus size={20} />}
          {showForm ? 'Cancel' : 'New Proposal'}
        </button>
      </div>

      {/* Create Proposal Form */}
      {showForm && (
        <form onSubmit={createProposal} className="bg-white border border-gray-200 shadow-sm rounded-2xl overflow-hidden">
          <div className="p-6 space-y-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Calculator size={22} className="text-[#3d6b2a]" />
              Build Proposal
            </h2>

            {/* Link to Order */}
            {cateringOrders.length > 0 && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Link to Catering Order (optional)</label>
                <select
                  value={form.catering_order_id}
                  onChange={(e) => prefillFromOrder(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#3d6b2a]/40"
                >
                  <option value="">— Standalone proposal —</option>
                  {cateringOrders.map(order => (
                    <option key={order.id} value={order.id}>
                      {order.order_number} — {order.contact_name} — {new Date(order.event_date).toLocaleDateString()} ({order.estimated_guests} guests)
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Client Info */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Client Name *</label>
                <input required value={form.client_name} onChange={(e) => setForm(f => ({ ...f, client_name: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#3d6b2a]/40" placeholder="John Smith" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                <input type="email" value={form.client_email} onChange={(e) => setForm(f => ({ ...f, client_email: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#3d6b2a]/40" placeholder="john@example.com" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Phone</label>
                <input value={form.client_phone} onChange={(e) => setForm(f => ({ ...f, client_phone: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#3d6b2a]/40" placeholder="(480) 555-0123" />
              </div>
            </div>

            {/* Event Info */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Event Name</label>
                <input value={form.event_name} onChange={(e) => setForm(f => ({ ...f, event_name: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#3d6b2a]/40" placeholder="Company Lunch" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Event Date</label>
                <input type="date" value={form.event_date} onChange={(e) => setForm(f => ({ ...f, event_date: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#3d6b2a]/40" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Guest Count</label>
                <input type="number" value={form.guest_count} onChange={(e) => setForm(f => ({ ...f, guest_count: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#3d6b2a]/40" placeholder="50" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Package</label>
                <input value={form.package_name} onChange={(e) => setForm(f => ({ ...f, package_name: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#3d6b2a]/40" placeholder="Premium Experience" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Venue</label>
              <input value={form.venue} onChange={(e) => setForm(f => ({ ...f, venue: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#3d6b2a]/40" placeholder="Event Center, 123 Main St" />
            </div>

            {/* === LINE ITEM CALCULATOR === */}
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-b border-gray-200">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Calculator size={16} className="text-[#3d6b2a]" />
                  Pricing Calculator
                </h3>
                <button type="button" onClick={addLineItem} className="flex items-center gap-1 text-sm font-medium text-[#3d6b2a] hover:text-[#2f5720]">
                  <Plus size={14} /> Add Line
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-3 py-2 text-left text-xs font-semibold text-[#9a9080] uppercase tracking-wide w-[30%]">Description</th>
                      <th className="px-3 py-2 text-center text-xs font-semibold text-[#9a9080] uppercase tracking-wide">Type</th>
                      <th className="px-3 py-2 text-center text-xs font-semibold text-[#9a9080] uppercase tracking-wide">Qty</th>
                      <th className="px-3 py-2 text-center text-xs font-semibold text-[#9a9080] uppercase tracking-wide">Days</th>
                      <th className="px-3 py-2 text-center text-xs font-semibold text-[#9a9080] uppercase tracking-wide">People</th>
                      <th className="px-3 py-2 text-center text-xs font-semibold text-[#9a9080] uppercase tracking-wide">Rate</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold text-[#9a9080] uppercase tracking-wide">Total</th>
                      <th className="px-3 py-2 w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {lineItems.map((item) => (
                      <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                        <td className="px-3 py-2">
                          <input value={item.description} onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                            className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#3d6b2a]/40"
                            placeholder="Bowl meals, Setup fee..." />
                        </td>
                        <td className="px-3 py-2">
                          <select value={item.unit_label} onChange={(e) => updateLineItem(item.id, 'unit_label', e.target.value)}
                            className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#3d6b2a]/40">
                            <option value="per meal">Per Meal</option>
                            <option value="per person">Per Person</option>
                            <option value="flat">Flat</option>
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <input type="number" min="0" value={item.quantity} onChange={(e) => updateLineItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                            className="w-16 px-2 py-1.5 border border-gray-200 rounded-lg text-sm text-center focus:outline-none focus:ring-1 focus:ring-[#3d6b2a]/40" />
                        </td>
                        <td className="px-3 py-2">
                          <input type="number" min="1" value={item.days} onChange={(e) => updateLineItem(item.id, 'days', parseInt(e.target.value) || 1)}
                            className="w-14 px-2 py-1.5 border border-gray-200 rounded-lg text-sm text-center focus:outline-none focus:ring-1 focus:ring-[#3d6b2a]/40" />
                        </td>
                        <td className="px-3 py-2">
                          <input type="number" min="0" value={item.people} onChange={(e) => updateLineItem(item.id, 'people', parseInt(e.target.value) || 0)}
                            className="w-16 px-2 py-1.5 border border-gray-200 rounded-lg text-sm text-center focus:outline-none focus:ring-1 focus:ring-[#3d6b2a]/40"
                            disabled={item.unit_label !== 'per person'} />
                        </td>
                        <td className="px-3 py-2">
                          <div className="relative">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[#7a7060] text-xs">$</span>
                            <input type="number" step="0.01" min="0" value={item.price_per_unit} onChange={(e) => updateLineItem(item.id, 'price_per_unit', parseFloat(e.target.value) || 0)}
                              className="w-20 pl-5 pr-2 py-1.5 border border-gray-200 rounded-lg text-sm text-right focus:outline-none focus:ring-1 focus:ring-[#3d6b2a]/40" />
                          </div>
                        </td>
                        <td className="px-3 py-2 text-right font-semibold text-gray-900">
                          {fmt(calcLineTotal(item))}
                        </td>
                        <td className="px-2 py-2">
                          {lineItems.length > 1 && (
                            <button type="button" onClick={() => removeLineItem(item.id)}
                              className="p-1 rounded hover:bg-red-50 text-[#7a7060] hover:text-red-500 transition-colors">
                              <X size={14} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
                <div className="flex justify-end">
                  <div className="w-64 space-y-1">
                    <div className="flex justify-between text-sm text-[#9a9080]">
                      <span>Subtotal</span>
                      <span className="font-medium text-gray-900">{fmt(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-[#9a9080]">
                      <span>Tax (8.6%)</span>
                      <span className="font-medium text-gray-900">{fmt(taxAmount)}</span>
                    </div>
                    <div className="flex justify-between text-base font-bold pt-2 border-t border-gray-300">
                      <span className="text-gray-900">Total</span>
                      <span className="text-[#3d6b2a]">{fmt(totalAmount)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Deposit & Terms */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Deposit Required</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9a9080]">$</span>
                  <input type="number" step="0.01" value={form.deposit_required} onChange={(e) => setForm(f => ({ ...f, deposit_required: e.target.value }))}
                    className="w-full pl-7 pr-3 py-2.5 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#3d6b2a]/40"
                    placeholder={`${(totalAmount * 0.5).toFixed(2)} (50% default)`} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Notes</label>
                <input value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#3d6b2a]/40"
                  placeholder="Special dietary needs, setup notes..." />
              </div>
            </div>

            {/* Submit */}
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={loading === 'create' || !form.client_name || subtotal <= 0}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#3d6b2a] hover:bg-[#2f5720] text-white rounded-xl font-medium transition-colors disabled:opacity-50">
                <FileText size={18} />
                {loading === 'create' ? 'Creating...' : 'Create Proposal'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); resetForm(); }}
                className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Proposals List */}
      {proposals.length === 0 && !showForm ? (
        <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-12 text-center">
          <FileText className="w-12 h-12 text-[#4a5e3a] mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No proposals yet</h3>
          <p className="text-[#9a9080] mb-4">Create your first proposal to get started</p>
          <button onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#3d6b2a] hover:bg-[#2f5720] text-white rounded-xl font-medium transition-colors">
            <Plus size={18} /> New Proposal
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {proposals.map((proposal) => {
            const isExpanded = expandedProposal === proposal.id;
            const breakdown = Array.isArray(proposal.pricing_breakdown) ? proposal.pricing_breakdown : [];

            return (
              <div key={proposal.id} className="bg-white border border-gray-200 shadow-sm rounded-2xl overflow-hidden">
                {/* Row Summary */}
                <div className="flex items-center gap-4 p-5 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setExpandedProposal(isExpanded ? null : proposal.id)}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                      <span className="font-mono text-sm font-semibold text-gray-900">{proposal.proposal_number}</span>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusBadge(proposal.status)}`}>
                        {getStatusIcon(proposal.status)}
                        {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-[#9a9080] flex-wrap">
                      <span className="font-medium text-gray-900">{proposal.client_name}</span>
                      {proposal.event_name && <span>{proposal.event_name}</span>}
                      {proposal.event_date && <span>{new Date(proposal.event_date).toLocaleDateString()}</span>}
                      {proposal.guest_count && <span>{proposal.guest_count} guests</span>}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-lg font-bold text-gray-900">{fmt(Number(proposal.total_amount) || 0)}</p>
                    <p className="text-xs text-[#9a9080]">{new Date(proposal.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex-shrink-0 text-[#7a7060]">
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                </div>

                {/* Expanded */}
                {isExpanded && (
                  <div className="border-t border-gray-200 p-5 bg-gray-50/50 space-y-4">
                    {/* Contact & Event */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {proposal.client_email && <div><p className="text-xs font-semibold text-[#9a9080] uppercase tracking-wide mb-1">Email</p><p className="text-sm text-gray-900">{proposal.client_email}</p></div>}
                      {proposal.client_phone && <div><p className="text-xs font-semibold text-[#9a9080] uppercase tracking-wide mb-1">Phone</p><p className="text-sm text-gray-900">{proposal.client_phone}</p></div>}
                      {proposal.venue && <div><p className="text-xs font-semibold text-[#9a9080] uppercase tracking-wide mb-1">Venue</p><p className="text-sm text-gray-900">{proposal.venue}</p></div>}
                      {proposal.package_name && <div><p className="text-xs font-semibold text-[#9a9080] uppercase tracking-wide mb-1">Package</p><p className="text-sm text-gray-900">{proposal.package_name}</p></div>}
                    </div>

                    {/* Line Items Table */}
                    {breakdown.length > 0 && (
                      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                              <th className="px-4 py-2 text-left text-xs font-semibold text-[#9a9080] uppercase">Item</th>
                              <th className="px-4 py-2 text-center text-xs font-semibold text-[#9a9080] uppercase">Qty</th>
                              <th className="px-4 py-2 text-center text-xs font-semibold text-[#9a9080] uppercase">Days</th>
                              <th className="px-4 py-2 text-center text-xs font-semibold text-[#9a9080] uppercase">Rate</th>
                              <th className="px-4 py-2 text-right text-xs font-semibold text-[#9a9080] uppercase">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {breakdown.map((item: any, idx: number) => (
                              <tr key={idx} className="border-b border-gray-100">
                                <td className="px-4 py-2 text-gray-900">{item.description || 'Line item'}</td>
                                <td className="px-4 py-2 text-center text-[#9a9080]">{item.unit_label === 'per person' ? item.people : item.quantity}</td>
                                <td className="px-4 py-2 text-center text-[#9a9080]">{item.days || 1}</td>
                                <td className="px-4 py-2 text-center text-[#9a9080]">{fmt(item.price_per_unit || 0)} {item.unit_label}</td>
                                <td className="px-4 py-2 text-right font-medium text-gray-900">{fmt(item.line_total || 0)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
                          <div className="flex justify-end">
                            <div className="w-48 space-y-1">
                              <div className="flex justify-between text-xs text-[#9a9080]"><span>Subtotal</span><span>{fmt(Number(proposal.subtotal) || 0)}</span></div>
                              <div className="flex justify-between text-xs text-[#9a9080]"><span>Tax</span><span>{fmt(Number(proposal.tax_amount) || 0)}</span></div>
                              <div className="flex justify-between text-sm font-bold pt-1 border-t border-gray-300"><span>Total</span><span className="text-[#3d6b2a]">{fmt(Number(proposal.total_amount) || 0)}</span></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {proposal.notes && (
                      <div className="bg-white border border-gray-200 rounded-xl p-4">
                        <p className="text-xs font-semibold text-[#9a9080] uppercase tracking-wide mb-1">Notes</p>
                        <p className="text-sm text-gray-700">{proposal.notes}</p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2">
                      <button onClick={(e) => { e.stopPropagation(); generatePDF(proposal); }}
                        disabled={loading === `pdf-${proposal.id}`}
                        className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium bg-[#3d6b2a]/10 border border-[#3d6b2a]/20 text-[#3d6b2a] rounded-lg hover:bg-[#3d6b2a]/20 transition-colors disabled:opacity-50">
                        <Download size={15} />
                        {loading === `pdf-${proposal.id}` ? 'Generating...' : 'Download PDF'}
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); copyProposalLink(proposal.id); }}
                        className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                        <Link2 size={15} />
                        {copyFeedback === proposal.id ? 'Copied!' : 'Copy Link'}
                      </button>
                      {proposal.status === 'draft' && (
                        <button onClick={(e) => { e.stopPropagation(); updateProposalStatus(proposal.id, 'sent'); }}
                          disabled={loading === proposal.id}
                          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium bg-blue-50 border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50">
                          <Send size={15} /> Mark Sent
                        </button>
                      )}
                      {(proposal.status === 'sent' || proposal.status === 'viewed') && (
                        <button onClick={(e) => { e.stopPropagation(); updateProposalStatus(proposal.id, 'accepted'); }}
                          disabled={loading === proposal.id}
                          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium bg-green-50 border border-green-200 text-green-700 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50">
                          <CheckCircle size={15} /> Mark Accepted
                        </button>
                      )}
                      {proposal.status === 'draft' && (
                        <button onClick={(e) => { e.stopPropagation(); deleteProposal(proposal.id); }}
                          disabled={loading === proposal.id}
                          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium bg-red-50 border border-red-200 text-red-700 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50">
                          <Trash2 size={15} /> Delete
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
