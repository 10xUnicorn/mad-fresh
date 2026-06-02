'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, X, Package, ClipboardList, Search, ChevronDown, Eye, RotateCcw } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface IncludeItem {
  name: string;
}

interface AddOnItem {
  name: string;
  price?: number;
  description?: string;
}

interface MenuItem {
  recipe_id: string;
  name: string;
  price: number;
  quantity_per_person?: number;
  image_url?: string;
}

interface EquipmentItem {
  name: string;
  quantity: number;
  notes?: string;
}

interface Recipe {
  id: string;
  name: string;
  base_price: number;
  image_url?: string;
}

interface CateringPackage {
  id: string;
  store_id: string;
  name: string;
  description: string;
  cuisine_type: string;
  min_guests: number;
  max_guests: number | null;
  price_per_person: number;
  flat_price?: number;
  includes: IncludeItem[];
  add_ons?: AddOnItem[];
  setup_options?: any[];
  image_url?: string;
  menu_items?: MenuItem[];
  equipment?: EquipmentItem[];
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

interface CateringOrder {
  id: string;
  order_number?: string;
  event_name?: string;
  event_date: string;
  event_time?: string;
  contact_name: string;
  contact_email?: string;
  contact_phone?: string;
  venue_name?: string;
  venue_address?: string;
  estimated_guests: number;
  final_guest_count?: number;
  total_amount: number;
  deposit_amount?: number;
  payment_status?: string;
  status: string;
  stripe_payment_intent_id?: string;
  special_instructions?: string;
  menu_selections?: Record<string, unknown>[];
  add_ons_selected?: Record<string, unknown>[];
  cancel_reason?: string;
  created_at: string;
  order_type?: string;
  school_name?: string;
  school_district?: string;
  company_name?: string;
  department?: string;
  po_number?: string;
  billing_contact_name?: string;
  billing_contact_email?: string;
  billing_address?: string;
  is_recurring?: boolean;
  contract_start_date?: string;
  contract_end_date?: string;
  requires_insurance_cert?: boolean;
  requires_health_permit?: boolean;
  staffing_needed?: number;
  internal_notes?: string;
}

interface CateringManagerProps {
  initialPackages: CateringPackage[];
  initialOrders: CateringOrder[];
}

export default function CateringManager({ initialPackages, initialOrders }: CateringManagerProps) {
  const supabase = createClient();
  const STORE_ID = 'b0000000-0000-0000-0000-000000000001';

  const [activeTab, setActiveTab] = useState<'packages' | 'orders'>('packages');
  const [packages, setPackages] = useState<CateringPackage[]>(initialPackages);
  const [orders, setOrders] = useState<CateringOrder[]>(initialOrders);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showOrderDetailsModal, setShowOrderDetailsModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [cancelingOrderId, setCancelingOrderId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [recipeSearch, setRecipeSearch] = useState('');
  const [showRecipeDropdown, setShowRecipeDropdown] = useState(false);
  const [contacts, setContacts] = useState<any[]>([]);
  const [contactSearch, setContactSearch] = useState('');
  const [showContactDropdown, setShowContactDropdown] = useState(false);
  const [orderTypeFilter, setOrderTypeFilter] = useState<'all' | 'event' | 'school' | 'corporate'>('all');

  const [formData, setFormData] = useState<Partial<CateringPackage>>({
    name: '',
    description: '',
    min_guests: 10,
    max_guests: 100,
    price_per_person: 0,
    flat_price: 0,
    includes: [] as IncludeItem[],
    add_ons: [] as AddOnItem[],
    menu_items: [] as MenuItem[],
    equipment: [] as EquipmentItem[],
    is_active: true,
  });

  const [newEquipment, setNewEquipment] = useState({ name: '', quantity: 1, notes: '' });

  const [orderFormData, setOrderFormData] = useState({
    contact_id: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    package_id: '',
    event_name: '',
    event_date: '',
    event_time: '',
    venue_name: '',
    venue_address: '',
    estimated_guests: 25,
    special_instructions: '',
    payment_status: 'unpaid' as 'unpaid' | 'deposit_paid' | 'paid_in_full',
    total_amount: 0,
    deposit_amount: 0,
    subtotal: 0,
    tax_amount: 0,
    add_ons: [] as AddOnItem[],
    order_type: 'event',
    school_name: '',
    school_district: '',
    company_name: '',
    department: '',
    po_number: '',
    billing_contact_name: '',
    billing_contact_email: '',
    billing_address: '',
    is_recurring: false,
    contract_start_date: '',
    contract_end_date: '',
    requires_insurance_cert: false,
    requires_health_permit: false,
    staffing_needed: 0,
    internal_notes: '',
  });

  const fmt = (v: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v);

  // Fetch recipes when modal opens
  useEffect(() => {
    if (showModal && recipes.length === 0) {
      const fetchRecipes = async () => {
        try {
          const { data } = await supabase
            .from('recipes')
            .select('id, name, base_price, image_url')
            .order('name');
          if (data) {
            setRecipes(data as Recipe[]);
          }
        } catch (error) {
          console.error('Error fetching recipes:', error);
        }
      };
      fetchRecipes();
    }
  }, [showModal]);

  // Fetch contacts when order modal opens
  useEffect(() => {
    if (showOrderModal && contacts.length === 0) {
      const fetchContacts = async () => {
        try {
          const { data } = await supabase
            .from('contacts')
            .select('id, name, email, phone')
            .eq('store_id', STORE_ID)
            .order('name');
          if (data) {
            setContacts(data);
          }
        } catch (error) {
          console.error('Error fetching contacts:', error);
        }
      };
      fetchContacts();
    }
  }, [showOrderModal]);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      min_guests: 10,
      max_guests: 100,
      price_per_person: 0,
      flat_price: 0,
      includes: [],
      add_ons: [],
      menu_items: [],
      equipment: [],
      is_active: true,
    });
    setEditingId(null);
    setRecipeSearch('');
    setNewEquipment({ name: '', quantity: 1, notes: '' });
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (pkg: CateringPackage) => {
    setFormData(pkg);
    setEditingId(pkg.id);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked,
      }));
    } else if (name === 'min_guests' || name === 'max_guests' || name === 'price_per_person' || name === 'flat_price') {
      setFormData(prev => ({
        ...prev,
        [name]: parseFloat(value) || 0,
      }));
    } else if (name === 'includes') {
      const items = value
        .split(',')
        .map(item => item.trim())
        .filter(item => item.length > 0)
        .map(item => ({ name: item }));
      setFormData(prev => ({
        ...prev,
        [name]: items,
      }));
    } else if (name === 'add_ons') {
      const items = value
        .split(',')
        .map(item => item.trim())
        .filter(item => item.length > 0)
        .map(item => ({ name: item }));
      setFormData(prev => ({
        ...prev,
        [name]: items,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const addMenuItem = (recipe: Recipe) => {
    const newMenuItem: MenuItem = {
      recipe_id: recipe.id,
      name: recipe.name,
      price: recipe.base_price,
      quantity_per_person: 1,
      image_url: recipe.image_url,
    };
    setFormData(prev => ({
      ...prev,
      menu_items: [...(prev.menu_items || []), newMenuItem],
    }));
    setRecipeSearch('');
    setShowRecipeDropdown(false);
  };

  const removeMenuItem = (recipeId: string) => {
    setFormData(prev => ({
      ...prev,
      menu_items: (prev.menu_items || []).filter(item => item.recipe_id !== recipeId),
    }));
  };

  const addEquipment = () => {
    if (!newEquipment.name.trim()) {
      alert('Equipment name is required');
      return;
    }
    setFormData(prev => ({
      ...prev,
      equipment: [...(prev.equipment || []), { ...newEquipment }],
    }));
    setNewEquipment({ name: '', quantity: 1, notes: '' });
  };

  const removeEquipment = (index: number) => {
    setFormData(prev => ({
      ...prev,
      equipment: (prev.equipment || []).filter((_, i) => i !== index),
    }));
  };

  const filteredRecipes = recipes.filter(r =>
    r.name.toLowerCase().includes(recipeSearch.toLowerCase())
  ).filter(r => !(formData.menu_items || []).some(m => m.recipe_id === r.id));

  const filteredContacts = contacts.filter(c =>
    c.name.toLowerCase().includes(contactSearch.toLowerCase()) ||
    (c.email && c.email.toLowerCase().includes(contactSearch.toLowerCase())) ||
    (c.phone && c.phone.includes(contactSearch))
  );

  const blankOrderFormData = {
    contact_id: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    package_id: '',
    event_name: '',
    event_date: '',
    event_time: '',
    venue_name: '',
    venue_address: '',
    estimated_guests: 25,
    special_instructions: '',
    payment_status: 'unpaid' as 'unpaid' | 'deposit_paid' | 'paid_in_full',
    total_amount: 0,
    deposit_amount: 0,
    subtotal: 0,
    tax_amount: 0,
    add_ons: [] as AddOnItem[],
    order_type: 'event',
    school_name: '',
    school_district: '',
    company_name: '',
    department: '',
    po_number: '',
    billing_contact_name: '',
    billing_contact_email: '',
    billing_address: '',
    is_recurring: false,
    contract_start_date: '',
    contract_end_date: '',
    requires_insurance_cert: false,
    requires_health_permit: false,
    staffing_needed: 0,
    internal_notes: '',
  };

  const openCreateOrderModal = () => {
    setOrderFormData(blankOrderFormData);
    setContactSearch('');
    setShowOrderModal(true);
  };

  const closeOrderModal = () => {
    setShowOrderModal(false);
    setOrderFormData(blankOrderFormData);
  };

  const handleOrderInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setOrderFormData(prev => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked,
      }));
    } else if (type === 'number') {
      setOrderFormData(prev => ({
        ...prev,
        [name]: parseInt(value) || 0,
      }));
    } else {
      setOrderFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const selectContact = (contact: any) => {
    setOrderFormData(prev => ({
      ...prev,
      contact_id: contact.id,
      contact_name: contact.name,
      contact_email: contact.email || '',
      contact_phone: contact.phone || '',
    }));
    setContactSearch(contact.name);
    setShowContactDropdown(false);
  };

  const calculateOrderTotal = () => {
    const selectedPackage = packages.find(p => p.id === orderFormData.package_id);
    if (!selectedPackage) return 0;
    const packageTotal = selectedPackage.price_per_person * orderFormData.estimated_guests;
    const addOnsTotal = (orderFormData.add_ons || []).reduce((sum, item) => sum + (item.price || 0), 0);
    return packageTotal + addOnsTotal;
  };

  const saveOrder = async () => {
    if (!orderFormData.contact_name || !orderFormData.package_id || !orderFormData.event_date) {
      alert('Contact name, package, and event date are required');
      return;
    }

    setLoading(true);
    try {
      const selectedPackage = packages.find(p => p.id === orderFormData.package_id);
      const totalAmount = calculateOrderTotal();

      // Generate order number
      const orderNumber = `CAT-${Date.now().toString().slice(-8)}`;

      const { data, error } = await supabase
        .from('catering_orders')
        .insert({
          store_id: STORE_ID,
          contact_id: orderFormData.contact_id || null,
          order_number: orderNumber,
          event_name: orderFormData.event_name,
          event_date: orderFormData.event_date,
          event_time: orderFormData.event_time || null,
          contact_name: orderFormData.contact_name,
          contact_email: orderFormData.contact_email || null,
          contact_phone: orderFormData.contact_phone || null,
          venue_name: orderFormData.venue_name || null,
          venue_address: orderFormData.venue_address || null,
          estimated_guests: orderFormData.estimated_guests,
          package_id: orderFormData.package_id,
          special_instructions: orderFormData.special_instructions || null,
          total_amount: totalAmount,
          payment_status: orderFormData.payment_status,
          status: 'pending',
          created_at: new Date().toISOString(),
          order_type: orderFormData.order_type || 'event',
          school_name: orderFormData.school_name || null,
          school_district: orderFormData.school_district || null,
          company_name: orderFormData.company_name || null,
          department: orderFormData.department || null,
          po_number: orderFormData.po_number || null,
          billing_contact_name: orderFormData.billing_contact_name || null,
          billing_contact_email: orderFormData.billing_contact_email || null,
          billing_address: orderFormData.billing_address || null,
          is_recurring: orderFormData.is_recurring || false,
          contract_start_date: orderFormData.contract_start_date || null,
          contract_end_date: orderFormData.contract_end_date || null,
          requires_insurance_cert: orderFormData.requires_insurance_cert || false,
          requires_health_permit: orderFormData.requires_health_permit || false,
          staffing_needed: orderFormData.staffing_needed || null,
          internal_notes: orderFormData.internal_notes || null,
        })
        .select();

      if (error) throw error;

      if (data && data[0]) {
        setOrders(prev => [data[0], ...prev]);
      }

      closeOrderModal();
    } catch (error) {
      console.error('Error saving order:', error);
      alert('Error creating order');
    } finally {
      setLoading(false);
    }
  };

  const openOrderDetailsModal = (order: CateringOrder) => {
    setOrderFormData({
      contact_id: order.id || '',
      contact_name: order.contact_name,
      contact_email: order.contact_email || '',
      contact_phone: order.contact_phone || '',
      package_id: '',
      event_name: order.event_name || '',
      event_date: order.event_date,
      event_time: order.event_time || '',
      venue_name: order.venue_name || '',
      venue_address: order.venue_address || '',
      estimated_guests: order.estimated_guests || 25,
      special_instructions: order.special_instructions || '',
      payment_status: (order.payment_status as any) || 'unpaid',
      total_amount: order.total_amount || 0,
      deposit_amount: order.deposit_amount || 0,
      subtotal: 0,
      tax_amount: 0,
      add_ons: [] as AddOnItem[],
      order_type: order.order_type || 'event',
      school_name: order.school_name || '',
      school_district: order.school_district || '',
      company_name: order.company_name || '',
      department: order.department || '',
      po_number: order.po_number || '',
      billing_contact_name: order.billing_contact_name || '',
      billing_contact_email: order.billing_contact_email || '',
      billing_address: order.billing_address || '',
      is_recurring: order.is_recurring || false,
      contract_start_date: order.contract_start_date || '',
      contract_end_date: order.contract_end_date || '',
      requires_insurance_cert: order.requires_insurance_cert || false,
      requires_health_permit: order.requires_health_permit || false,
      staffing_needed: order.staffing_needed || 0,
      internal_notes: order.internal_notes || '',
    });
    setEditingOrderId(order.id);
    setShowOrderDetailsModal(true);
  };

  const closeOrderDetailsModal = () => {
    setShowOrderDetailsModal(false);
    setEditingOrderId(null);
    setOrderFormData(blankOrderFormData);
  };

  const updateOrder = async () => {
    if (!editingOrderId) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('catering_orders')
        .update({
          event_name: orderFormData.event_name,
          event_date: orderFormData.event_date,
          event_time: orderFormData.event_time || null,
          contact_name: orderFormData.contact_name,
          contact_email: orderFormData.contact_email || null,
          contact_phone: orderFormData.contact_phone || null,
          venue_name: orderFormData.venue_name || null,
          venue_address: orderFormData.venue_address || null,
          estimated_guests: orderFormData.estimated_guests,
          payment_status: orderFormData.payment_status,
          updated_at: new Date().toISOString(),
          order_type: orderFormData.order_type || 'event',
          school_name: orderFormData.school_name || null,
          school_district: orderFormData.school_district || null,
          company_name: orderFormData.company_name || null,
          department: orderFormData.department || null,
          po_number: orderFormData.po_number || null,
          billing_contact_name: orderFormData.billing_contact_name || null,
          billing_contact_email: orderFormData.billing_contact_email || null,
          billing_address: orderFormData.billing_address || null,
          is_recurring: orderFormData.is_recurring || false,
          contract_start_date: orderFormData.contract_start_date || null,
          contract_end_date: orderFormData.contract_end_date || null,
          requires_insurance_cert: orderFormData.requires_insurance_cert || false,
          requires_health_permit: orderFormData.requires_health_permit || false,
          staffing_needed: orderFormData.staffing_needed || null,
          internal_notes: orderFormData.internal_notes || null,
        })
        .eq('id', editingOrderId);

      if (error) throw error;

      setOrders(prev =>
        prev.map(o =>
          o.id === editingOrderId
            ? {
                ...o,
                event_name: orderFormData.event_name,
                event_date: orderFormData.event_date,
                event_time: orderFormData.event_time,
                contact_name: orderFormData.contact_name,
                contact_email: orderFormData.contact_email,
                contact_phone: orderFormData.contact_phone,
                venue_name: orderFormData.venue_name,
                venue_address: orderFormData.venue_address,
                estimated_guests: orderFormData.estimated_guests,
              }
            : o
        )
      );

      closeOrderDetailsModal();
      alert('Order updated successfully');
    } catch (error) {
      console.error('Error updating order:', error);
      alert('Error updating order');
    } finally {
      setLoading(false);
    }
  };

  const openCancelModal = (orderId: string) => {
    setCancelingOrderId(orderId);
    setCancelReason('');
    setShowCancelModal(true);
  };

  const closeCancelModal = () => {
    setShowCancelModal(false);
    setCancelingOrderId(null);
    setCancelReason('');
  };

  const cancelOrder = async () => {
    if (!cancelingOrderId) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('catering_orders')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString(),
        })
        .eq('id', cancelingOrderId);

      if (error) throw error;

      setOrders(prev =>
        prev.map(o => (o.id === cancelingOrderId ? { ...o, status: 'cancelled' } : o))
      );

      closeCancelModal();
      alert('Order cancelled successfully');
    } catch (error) {
      console.error('Error cancelling order:', error);
      alert('Error cancelling order');
    } finally {
      setLoading(false);
    }
  };

  const processRefund = async (orderId: string) => {
    if (!confirm('Are you sure you want to process a refund for this order?')) return;

    setLoading(true);
    try {
      const response = await fetch('/api/refunds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Refund failed');

      setOrders(prev =>
        prev.map(o =>
          o.id === orderId
            ? { ...o, status: 'refunded', payment_status: 'refunded' }
            : o
        )
      );

      alert('Refund processed successfully');
    } catch (error) {
      console.error('Error processing refund:', error);
      alert('Error processing refund');
    } finally {
      setLoading(false);
    }
  };

  const savePackage = async () => {
    if (!formData.name || formData.price_per_person === undefined) {
      alert('Name and price per person are required');
      return;
    }

    setLoading(true);
    try {
      if (editingId) {
        // Update existing package
        const { error } = await supabase
          .from('catering_packages')
          .update({
            name: formData.name,
            description: formData.description,
            min_guests: formData.min_guests,
            max_guests: formData.max_guests,
            price_per_person: formData.price_per_person,
            flat_price: formData.flat_price,
            includes: formData.includes,
            add_ons: formData.add_ons,
            menu_items: formData.menu_items || [],
            equipment: formData.equipment || [],
            is_active: formData.is_active,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingId);

        if (error) throw error;

        setPackages(prev =>
          prev.map(p =>
            p.id === editingId
              ? { ...p, ...formData, updated_at: new Date().toISOString() }
              : p
          )
        );
      } else {
        // Create new package
        const { data, error } = await supabase
          .from('catering_packages')
          .insert({
            store_id: STORE_ID,
            name: formData.name,
            description: formData.description,
            cuisine_type: 'mixed',
            min_guests: formData.min_guests,
            max_guests: formData.max_guests,
            price_per_person: formData.price_per_person,
            flat_price: formData.flat_price,
            includes: formData.includes,
            add_ons: formData.add_ons,
            menu_items: formData.menu_items || [],
            equipment: formData.equipment || [],
            is_active: formData.is_active,
          })
          .select()
          .single();

        if (error) throw error;
        if (data) {
          setPackages(prev => [...prev, data]);
        }
      }

      closeModal();
    } catch (error) {
      console.error('Error saving package:', error);
      alert('Error saving package');
    } finally {
      setLoading(false);
    }
  };

  const deletePackage = async (id: string) => {
    if (!confirm('Are you sure you want to delete this package?')) return;

    setLoading(true);
    try {
      const { error } = await supabase.from('catering_packages').delete().eq('id', id);

      if (error) throw error;

      setPackages(prev => prev.filter(p => p.id !== id));
    } catch (error) {
      console.error('Error deleting package:', error);
      alert('Error deleting package');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-50 text-yellow-700';
      case 'confirmed':
        return 'bg-blue-50 text-blue-700';
      case 'completed':
        return 'bg-green-50 text-green-700';
      case 'cancelled':
        return 'bg-red-50 text-red-600';
      default:
        return 'bg-gray-50 text-[#4a5e3a]';
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex gap-4 border-b border-[#ddd8cc]">
        <button
          onClick={() => setActiveTab('packages')}
          className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors ${
            activeTab === 'packages'
              ? 'text-[#3d6b2a] border-b-2 border-[#3d6b2a]'
              : 'text-[#7a7060] hover:text-[#4a5e3a]'
          }`}
        >
          <Package size={18} />
          Packages
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors ${
            activeTab === 'orders'
              ? 'text-[#3d6b2a] border-b-2 border-[#3d6b2a]'
              : 'text-[#7a7060] hover:text-[#4a5e3a]'
          }`}
        >
          <ClipboardList size={18} />
          Orders
        </button>
      </div>

      {/* Packages Tab */}
      {activeTab === 'packages' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-[#1e2d18]">
              Catering Packages ({packages.length})
            </h2>
            <button
              onClick={openCreateModal}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#449531] hover:bg-[#2f5720] text-white font-medium rounded-xl transition-colors text-sm"
            >
              <Plus size={16} />
              Create Package
            </button>
          </div>

          {packages.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {packages.map(pkg => (
                <div key={pkg.id} className="bg-white rounded-xl p-5 border border-[#ddd8cc] hover:border-[#3d6b2a]/30 transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-[#1e2d18] font-semibold flex-1">{pkg.name}</h3>
                    {!pkg.is_active && (
                      <span className="px-2 py-0.5 bg-gray-100 text-[#7a7060] text-xs rounded-full font-medium">
                        Inactive
                      </span>
                    )}
                  </div>
                  <p className="text-[#9a9080] text-sm mb-4">{pkg.description || 'No description'}</p>

                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex justify-between text-[#9a9080]">
                      <span>Per person</span>
                      <span className="text-[#449531] font-medium">{fmt(pkg.price_per_person)}</span>
                    </div>
                    <div className="flex justify-between text-[#9a9080]">
                      <span>Flat price</span>
                      <span className="text-[#4a5e3a]">{fmt(pkg.flat_price || 0)}</span>
                    </div>
                    <div className="flex justify-between text-[#9a9080]">
                      <span>Guests</span>
                      <span className="text-[#4a5e3a]">
                        {pkg.min_guests}–{pkg.max_guests || '∞'}
                      </span>
                    </div>
                  </div>

                  {pkg.includes && pkg.includes.length > 0 && (
                    <div className="mb-4 text-sm">
                      <p className="text-[#9a9080] font-medium mb-2">Includes:</p>
                      <ul className="list-disc list-inside space-y-1">
                        {pkg.includes.map((item, idx) => (
                          <li key={idx} className="text-[#7a7060] text-xs">
                            {typeof item === 'string' ? item : item.name}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex gap-2 pt-4 border-t border-[#ddd8cc]">
                    <button
                      onClick={() => openEditModal(pkg)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white border border-[#ddd8cc] hover:border-[#449531] hover:text-[#449531] text-[#4a5e3a] rounded-lg transition-colors font-medium text-sm"
                    >
                      <Pencil size={14} />
                      Edit
                    </button>
                    <button
                      onClick={() => deletePackage(pkg.id)}
                      disabled={loading}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-50 border border-red-200 hover:border-red-300 hover:bg-red-100 text-red-700 rounded-lg transition-colors font-medium text-sm disabled:opacity-50"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-xl border border-[#ddd8cc]">
              <Package size={32} className="mx-auto mb-3 text-[#7a7060]" />
              <p className="text-[#9a9080] mb-4">No catering packages yet. Create your first package to get started.</p>
              <button
                onClick={openCreateModal}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#449531] hover:bg-[#2f5720] text-white font-medium rounded-xl transition-colors text-sm"
              >
                <Plus size={16} />
                Create Package
              </button>
            </div>
          )}
        </div>
      )}

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-[#1e2d18]">Catering Orders ({orders.length})</h2>
            <button
              onClick={openCreateOrderModal}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#449531] hover:bg-[#2f5720] text-white font-medium rounded-xl transition-colors text-sm"
            >
              <Plus size={16} />
              New Order
            </button>
          </div>

          {/* Order Type Filter Pills */}
          <div className="flex gap-2">
            {(['all', 'event', 'school', 'corporate'] as const).map(type => (
              <button
                key={type}
                onClick={() => setOrderTypeFilter(type)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors capitalize ${
                  orderTypeFilter === type
                    ? 'bg-[#449531] text-white'
                    : 'bg-white border border-[#ddd8cc] text-[#7a7060] hover:border-[#3d6b2a]/30 hover:text-[#4a5e3a]'
                }`}
              >
                {type === 'all' ? 'All Orders' : type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>

          {orders.filter(o => orderTypeFilter === 'all' || (o.order_type || 'event') === orderTypeFilter).length > 0 ? (
            <div className="overflow-x-auto border border-[#ddd8cc] rounded-xl bg-white">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-[#ddd8cc]">
                    <th className="px-6 py-3 text-left text-[#7a7060] font-medium">Order #</th>
                    <th className="px-6 py-3 text-left text-[#7a7060] font-medium">Contact</th>
                    <th className="px-6 py-3 text-left text-[#7a7060] font-medium">Event</th>
                    <th className="px-6 py-3 text-left text-[#7a7060] font-medium">Type</th>
                    <th className="px-6 py-3 text-left text-[#7a7060] font-medium">Date</th>
                    <th className="px-6 py-3 text-left text-[#7a7060] font-medium">Guests</th>
                    <th className="px-6 py-3 text-left text-[#7a7060] font-medium">Total</th>
                    <th className="px-6 py-3 text-left text-[#7a7060] font-medium">Status</th>
                    <th className="px-6 py-3 text-right text-[#7a7060] font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.filter(o => orderTypeFilter === 'all' || (o.order_type || 'event') === orderTypeFilter).map(order => (
                    <tr key={order.id} className="border-b border-[#ede9e2] hover:bg-[#f0ece3] transition-colors">
                      <td className="px-6 py-3 text-[#4a5e3a] text-xs font-mono">{order.order_number || order.id.slice(0, 8)}</td>
                      <td className="px-6 py-3 text-[#1e2d18] font-medium">{order.contact_name || '—'}</td>
                      <td className="px-6 py-3 text-[#4a5e3a]">{order.event_name || '—'}</td>
                      <td className="px-6 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${
                          order.order_type === 'school' ? 'bg-blue-50 text-blue-700' :
                          order.order_type === 'corporate' ? 'bg-purple-50 text-purple-700' :
                          'bg-[#e9f0e4] text-[#3d6b2a]'
                        }`}>
                          {order.order_type || 'event'}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-[#4a5e3a]">
                        {order.event_date
                          ? new Date(order.event_date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : '—'}
                      </td>
                      <td className="px-6 py-3 text-[#4a5e3a]">{order.estimated_guests || '—'}</td>
                      <td className="px-6 py-3 text-[#1e2d18] font-semibold">{fmt(order.total_amount || 0)}</td>
                      <td className="px-6 py-3">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusBadgeColor(
                            order.status
                          )}`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openOrderDetailsModal(order)}
                            className="p-2 text-[#449531] hover:bg-[#449531] hover:text-white rounded-lg transition-colors"
                            title="View order details"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => {
                              setEditingOrderId(order.id);
                              openOrderDetailsModal(order);
                            }}
                            className="p-2 text-[#449531] hover:bg-[#449531] hover:text-white rounded-lg transition-colors"
                            title="Edit order"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => openCancelModal(order.id)}
                            className="p-2 text-red-500 hover:bg-red-500/20 rounded-lg transition-colors"
                            title="Cancel order"
                          >
                            <Trash2 size={16} />
                          </button>
                          {order.payment_status === 'paid_in_full' && (
                            <button
                              onClick={() => processRefund(order.id)}
                              className="p-2 text-blue-400 hover:bg-blue-400/20 rounded-lg transition-colors"
                              title="Process refund"
                            >
                              <RotateCcw size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-xl border border-[#ddd8cc]">
              <ClipboardList size={32} className="mx-auto mb-3 text-[#7a7060]" />
              <p className="text-[#9a9080]">
                {orderTypeFilter === 'all'
                  ? 'No catering orders yet. Orders will appear here as inquiries come in.'
                  : `No ${orderTypeFilter} orders found.`}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/20 flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full my-8 border border-[#ddd8cc]">
            {/* Modal Header */}
            <div className="sticky top-0 flex justify-between items-center px-6 py-4 border-b border-[#ddd8cc] bg-white rounded-t-2xl z-10">
              <h3 className="text-lg font-semibold text-[#1e2d18]">
                {editingId ? 'Edit Package' : 'Create Package'}
              </h3>
              <button
                onClick={closeModal}
                className="p-1 hover:bg-[#f0ece3] rounded-lg transition-colors text-[#9a9080] hover:text-[#4a5e3a]"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-[#4a5e3a]">Package Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name || ''}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 bg-white border border-[#ddd8cc] rounded-lg text-[#1e2d18] placeholder-[#9a9080] focus:border-[#3d6b2a] focus:outline-none focus:ring-2 focus:ring-[#3d6b2a]/20"
                  placeholder="e.g., Classic Buffet"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-[#4a5e3a]">Description</label>
                <textarea
                  name="description"
                  value={formData.description || ''}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-white border border-[#ddd8cc] rounded-lg text-[#1e2d18] placeholder-[#9a9080] focus:border-[#3d6b2a] focus:outline-none focus:ring-2 focus:ring-[#3d6b2a]/20"
                  placeholder="Describe this catering package..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-[#4a5e3a]">Min Guests</label>
                  <input
                    type="number"
                    name="min_guests"
                    value={formData.min_guests || 0}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 bg-white border border-[#ddd8cc] rounded-lg text-[#1e2d18] placeholder-[#9a9080] focus:border-[#3d6b2a] focus:outline-none focus:ring-2 focus:ring-[#3d6b2a]/20"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-[#4a5e3a]">Max Guests</label>
                  <input
                    type="number"
                    name="max_guests"
                    value={formData.max_guests || 0}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 bg-white border border-[#ddd8cc] rounded-lg text-[#1e2d18] placeholder-[#9a9080] focus:border-[#3d6b2a] focus:outline-none focus:ring-2 focus:ring-[#3d6b2a]/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-[#4a5e3a]">Price Per Person *</label>
                  <input
                    type="number"
                    name="price_per_person"
                    value={formData.price_per_person || 0}
                    onChange={handleInputChange}
                    step="0.01"
                    className="w-full px-4 py-2.5 bg-white border border-[#ddd8cc] rounded-lg text-[#1e2d18] placeholder-[#9a9080] focus:border-[#3d6b2a] focus:outline-none focus:ring-2 focus:ring-[#3d6b2a]/20"
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-[#4a5e3a]">Flat Price</label>
                  <input
                    type="number"
                    name="flat_price"
                    value={formData.flat_price || 0}
                    onChange={handleInputChange}
                    step="0.01"
                    className="w-full px-4 py-2.5 bg-white border border-[#ddd8cc] rounded-lg text-[#1e2d18] placeholder-[#9a9080] focus:border-[#3d6b2a] focus:outline-none focus:ring-2 focus:ring-[#3d6b2a]/20"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-[#4a5e3a]">Includes (comma-separated)</label>
                <textarea
                  name="includes"
                  value={(formData.includes || []).map(i => typeof i === 'string' ? i : i.name).join(', ')}
                  onChange={handleInputChange}
                  rows={2}
                  className="w-full px-4 py-2.5 bg-white border border-[#ddd8cc] rounded-lg text-[#1e2d18] placeholder-[#9a9080] focus:border-[#3d6b2a] focus:outline-none focus:ring-2 focus:ring-[#3d6b2a]/20"
                  placeholder="e.g., plates, utensils, linens, beverages"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-[#4a5e3a]">Add-ons (comma-separated)</label>
                <textarea
                  name="add_ons"
                  value={(formData.add_ons || []).map(i => typeof i === 'string' ? i : i.name).join(', ')}
                  onChange={handleInputChange}
                  rows={2}
                  className="w-full px-4 py-2.5 bg-white border border-[#ddd8cc] rounded-lg text-[#1e2d18] placeholder-[#9a9080] focus:border-[#3d6b2a] focus:outline-none focus:ring-2 focus:ring-[#3d6b2a]/20"
                  placeholder="e.g., caesar salad, grilled chicken, pasta primavera"
                />
              </div>

              {/* Menu Items Section */}
              <div className="space-y-3 border-t border-[#ddd8cc] pt-5">
                <label className="block text-sm font-medium text-[#4a5e3a]">Menu Items</label>

                {/* Recipe Search */}
                <div className="relative">
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-3 text-[#7a7060]" size={16} />
                      <input
                        type="text"
                        value={recipeSearch}
                        onChange={(e) => {
                          setRecipeSearch(e.target.value);
                          setShowRecipeDropdown(true);
                        }}
                        onFocus={() => setShowRecipeDropdown(true)}
                        className="w-full pl-9 pr-4 py-2.5 bg-white border border-[#ddd8cc] rounded-lg text-[#1e2d18] placeholder-[#9a9080] focus:border-[#3d6b2a] focus:outline-none focus:ring-2 focus:ring-[#3d6b2a]/20 text-sm"
                        placeholder="Search recipes..."
                      />
                    </div>
                  </div>

                  {/* Recipe Dropdown */}
                  {showRecipeDropdown && recipeSearch.length > 0 && filteredRecipes.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-whiteborder border-[#ddd8cc] rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                      {filteredRecipes.map(recipe => (
                        <button
                          key={recipe.id}
                          onClick={() => addMenuItem(recipe)}
                          className="w-full text-left px-4 py-2.5 hover:bg-[#f0ece3] border-b border-[#ede9e2] last:border-b-0 flex justify-between items-center"
                        >
                          <span className="text-sm text-[#4a5e3a] font-medium">{recipe.name}</span>
                          <span className="text-xs text-[#9a9080]">{fmt(recipe.base_price)}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Selected Menu Items */}
                <div className="space-y-2">
                  {(formData.menu_items || []).length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {(formData.menu_items || []).map(item => (
                        <div
                          key={item.recipe_id}
                          className="bg-[#449531] text-white px-3 py-2 rounded-lg flex items-center gap-2 text-sm"
                        >
                          <span>{item.name}</span>
                          <span className="text-xs opacity-75">({fmt(item.price)})</span>
                          <button
                            onClick={() => removeMenuItem(item.recipe_id)}
                            className="ml-1 hover:opacity-80"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-[#9a9080] italic">No menu items selected</p>
                  )}
                </div>
              </div>

              {/* Equipment Section */}
              <div className="space-y-3 border-t border-[#ddd8cc] pt-5">
                <label className="block text-sm font-medium text-[#4a5e3a]">Equipment & Supplies</label>

                {/* Add Equipment Form */}
                <div className="space-y-2">
                  <input
                    type="text"
                    value={newEquipment.name}
                    onChange={(e) => setNewEquipment(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Equipment name (e.g., tables, chairs, linens)"
                    className="w-full px-4 py-2.5 bg-white border border-[#ddd8cc] rounded-lg text-[#1e2d18] placeholder-[#9a9080] focus:border-[#3d6b2a] focus:outline-none focus:ring-2 focus:ring-[#3d6b2a]/20 text-sm"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      min="1"
                      value={newEquipment.quantity}
                      onChange={(e) => setNewEquipment(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                      placeholder="Quantity"
                      className="px-4 py-2.5 bg-white border border-[#ddd8cc] rounded-lg text-[#1e2d18] placeholder-[#9a9080] focus:border-[#3d6b2a] focus:outline-none focus:ring-2 focus:ring-[#3d6b2a]/20 text-sm"
                    />
                    <button
                      onClick={addEquipment}
                      className="px-4 py-2.5 bg-[#449531] hover:bg-[#2f5720] text-white font-medium rounded-lg transition-colors text-sm"
                    >
                      Add Item
                    </button>
                  </div>
                  <input
                    type="text"
                    value={newEquipment.notes}
                    onChange={(e) => setNewEquipment(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Notes (optional)"
                    className="w-full px-4 py-2.5 bg-white border border-[#ddd8cc] rounded-lg text-[#1e2d18] placeholder-[#9a9080] focus:border-[#3d6b2a] focus:outline-none focus:ring-2 focus:ring-[#3d6b2a]/20 text-sm"
                  />
                </div>

                {/* Equipment List */}
                <div className="space-y-2">
                  {(formData.equipment || []).length > 0 ? (
                    <div className="bg-[#f2efe8] rounded-lg p-3 space-y-2">
                      {(formData.equipment || []).map((item, idx) => (
                        <div key={idx} className="flex justify-between items-start bg-whitep-2 rounded border border-[#ddd8cc]">
                          <div className="text-sm flex-1">
                            <p className="text-[#1e2d18] font-medium">{item.name}</p>
                            <p className="text-[#9a9080] text-xs">Qty: {item.quantity} {item.notes ? `• ${item.notes}` : ''}</p>
                          </div>
                          <button
                            onClick={() => removeEquipment(idx)}
                            className="text-red-500 hover:text-red-700 ml-2"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-[#9a9080] italic">No equipment items added</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2 border-t border-[#ddd8cc]">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active || false}
                  onChange={handleInputChange}
                  className="w-4 h-4 border border-[#ddd8cc] rounded focus:outline-none focus:ring-2 focus:ring-[#449531] cursor-pointer"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-[#4a5e3a] cursor-pointer">
                  Active
                </label>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 flex gap-3 px-6 py-4 border-t border-[#ddd8cc] bg-[#f2efe8]">
              <button
                onClick={closeModal}
                className="flex-1 px-4 py-2.5 border border-[#ddd8cc] hover:border-white/20 text-[#4a5e3a] font-medium rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={savePackage}
                disabled={loading}
                className="flex-1 px-4 py-2.5 bg-[#449531] hover:bg-[#2f5720] text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : editingId ? 'Update Package' : 'Create Package'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Creation Modal */}
      {showOrderModal && (
        <div className="fixed inset-0 bg-black/20 flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full my-8 border border-[#ddd8cc]">
            {/* Modal Header */}
            <div className="sticky top-0 flex justify-between items-center px-6 py-4 border-b border-[#ddd8cc] bg-white rounded-t-2xl z-10">
              <h3 className="text-lg font-semibold text-[#1e2d18]">Create Catering Order</h3>
              <button
                onClick={closeOrderModal}
                className="p-1 hover:bg-[#f0ece3] rounded-lg transition-colors text-[#9a9080] hover:text-[#4a5e3a]"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              {/* Order Type Selector */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-[#4a5e3a]">Order Type *</label>
                <div className="flex gap-2">
                  {(['event', 'school', 'corporate'] as const).map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setOrderFormData(prev => ({ ...prev, order_type: type }))}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors capitalize ${
                        orderFormData.order_type === type
                          ? 'bg-[#449531] text-white border border-[#449531]'
                          : 'bg-[#f2efe8] border border-[#ddd8cc] text-[#7a7060] hover:border-[#3d6b2a]/30 hover:text-[#4a5e3a]'
                      }`}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Contact Selection */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-[#4a5e3a]">Contact Name *</label>
                <div className="relative">
                  <div className="flex items-center gap-2 relative">
                    <Search size={16} className="absolute left-3 text-[#7a7060]" />
                    <input
                      type="text"
                      value={contactSearch}
                      onChange={(e) => {
                        setContactSearch(e.target.value);
                        setShowContactDropdown(true);
                      }}
                      onFocus={() => setShowContactDropdown(true)}
                      placeholder="Search contacts..."
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#ddd8cc] rounded-lg text-[#1e2d18] placeholder-[#9a9080] focus:border-[#3d6b2a] focus:outline-none focus:ring-2 focus:ring-[#3d6b2a]/20"
                    />
                    {contactSearch && (
                      <button
                        onClick={() => {
                          setContactSearch('');
                          setOrderFormData(prev => ({
                            ...prev,
                            contact_id: '',
                            contact_name: '',
                            contact_email: '',
                            contact_phone: '',
                          }));
                        }}
                        className="absolute right-3 text-[#7a7060] hover:text-[#7a7060]"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>

                  {showContactDropdown && filteredContacts.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-whiteborder border-[#ddd8cc] rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                      {filteredContacts.map(contact => (
                        <button
                          key={contact.id}
                          onClick={() => selectContact(contact)}
                          className="w-full text-left px-4 py-2.5 hover:bg-[#f0ece3] border-b border-[#ede9e2] last:border-b-0 text-sm"
                        >
                          <div className="font-medium text-[#1e2d18]">{contact.name}</div>
                          {contact.email && <div className="text-xs text-[#9a9080]">{contact.email}</div>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {!contactSearch && (
                  <input
                    type="text"
                    name="contact_name"
                    value={orderFormData.contact_name}
                    onChange={handleOrderInputChange}
                    placeholder="Or enter contact name manually"
                    className="w-full px-4 py-2.5 bg-white border border-[#ddd8cc] rounded-lg text-[#1e2d18] placeholder-[#9a9080] focus:border-[#3d6b2a] focus:outline-none focus:ring-2 focus:ring-[#3d6b2a]/20 mt-2"
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-[#4a5e3a]">Email</label>
                  <input
                    type="email"
                    name="contact_email"
                    value={orderFormData.contact_email}
                    onChange={handleOrderInputChange}
                    className="w-full px-4 py-2.5 bg-white border border-[#ddd8cc] rounded-lg text-[#1e2d18] placeholder-[#9a9080] focus:border-[#3d6b2a] focus:outline-none focus:ring-2 focus:ring-[#3d6b2a]/20"
                    placeholder="email@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-[#4a5e3a]">Phone</label>
                  <input
                    type="tel"
                    name="contact_phone"
                    value={orderFormData.contact_phone}
                    onChange={handleOrderInputChange}
                    className="w-full px-4 py-2.5 bg-white border border-[#ddd8cc] rounded-lg text-[#1e2d18] placeholder-[#9a9080] focus:border-[#3d6b2a] focus:outline-none focus:ring-2 focus:ring-[#3d6b2a]/20"
                    placeholder="(480) 382-7755"
                  />
                </div>
              </div>

              {/* Package Selection */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-[#4a5e3a]">Package *</label>
                <select
                  name="package_id"
                  value={orderFormData.package_id}
                  onChange={handleOrderInputChange}
                  className="w-full px-4 py-2.5 bg-white border border-[#ddd8cc] rounded-lg text-[#1e2d18] placeholder-[#9a9080] focus:border-[#3d6b2a] focus:outline-none focus:ring-2 focus:ring-[#3d6b2a]/20"
                >
                  <option value="">Select a package...</option>
                  {packages.map(pkg => (
                    <option key={pkg.id} value={pkg.id}>
                      {pkg.name} ({fmt(pkg.price_per_person)}/person)
                    </option>
                  ))}
                </select>
              </div>

              {/* Event Details */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-[#4a5e3a]">Event Name</label>
                <input
                  type="text"
                  name="event_name"
                  value={orderFormData.event_name}
                  onChange={handleOrderInputChange}
                  placeholder="e.g., Corporate Lunch, Wedding Reception"
                  className="w-full px-4 py-2.5 bg-white border border-[#ddd8cc] rounded-lg text-[#1e2d18] placeholder-[#9a9080] focus:border-[#3d6b2a] focus:outline-none focus:ring-2 focus:ring-[#3d6b2a]/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-[#4a5e3a]">Event Date *</label>
                  <input
                    type="date"
                    name="event_date"
                    value={orderFormData.event_date}
                    onChange={handleOrderInputChange}
                    className="w-full px-4 py-2.5 bg-white border border-[#ddd8cc] rounded-lg text-[#1e2d18] placeholder-[#9a9080] focus:border-[#3d6b2a] focus:outline-none focus:ring-2 focus:ring-[#3d6b2a]/20"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-[#4a5e3a]">Event Time</label>
                  <input
                    type="time"
                    name="event_time"
                    value={orderFormData.event_time}
                    onChange={handleOrderInputChange}
                    className="w-full px-4 py-2.5 bg-white border border-[#ddd8cc] rounded-lg text-[#1e2d18] placeholder-[#9a9080] focus:border-[#3d6b2a] focus:outline-none focus:ring-2 focus:ring-[#3d6b2a]/20"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-[#4a5e3a]">Venue Name</label>
                <input
                  type="text"
                  name="venue_name"
                  value={orderFormData.venue_name}
                  onChange={handleOrderInputChange}
                  placeholder="e.g., Tempe Convention Center"
                  className="w-full px-4 py-2.5 bg-white border border-[#ddd8cc] rounded-lg text-[#1e2d18] placeholder-[#9a9080] focus:border-[#3d6b2a] focus:outline-none focus:ring-2 focus:ring-[#3d6b2a]/20"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-[#4a5e3a]">Venue Address</label>
                <input
                  type="text"
                  name="venue_address"
                  value={orderFormData.venue_address}
                  onChange={handleOrderInputChange}
                  placeholder="e.g., 455 S 48th St, Tempe, AZ 85281"
                  className="w-full px-4 py-2.5 bg-white border border-[#ddd8cc] rounded-lg text-[#1e2d18] placeholder-[#9a9080] focus:border-[#3d6b2a] focus:outline-none focus:ring-2 focus:ring-[#3d6b2a]/20"
                />
              </div>

              {/* Guest Count */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-[#4a5e3a]">Estimated Guests</label>
                <input
                  type="number"
                  name="estimated_guests"
                  min="1"
                  value={orderFormData.estimated_guests}
                  onChange={handleOrderInputChange}
                  className="w-full px-4 py-2.5 bg-white border border-[#ddd8cc] rounded-lg text-[#1e2d18] placeholder-[#9a9080] focus:border-[#3d6b2a] focus:outline-none focus:ring-2 focus:ring-[#3d6b2a]/20"
                />
              </div>

              {/* Payment Status */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-[#4a5e3a]">Payment Status</label>
                <select
                  name="payment_status"
                  value={orderFormData.payment_status}
                  onChange={handleOrderInputChange}
                  className="w-full px-4 py-2.5 bg-white border border-[#ddd8cc] rounded-lg text-[#1e2d18] placeholder-[#9a9080] focus:border-[#3d6b2a] focus:outline-none focus:ring-2 focus:ring-[#3d6b2a]/20"
                >
                  <option value="unpaid">Unpaid</option>
                  <option value="deposit_paid">Deposit Paid</option>
                  <option value="paid_in_full">Paid in Full</option>
                </select>
              </div>

              {/* Special Instructions */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-[#4a5e3a]">Special Instructions</label>
                <textarea
                  name="special_instructions"
                  value={orderFormData.special_instructions}
                  onChange={handleOrderInputChange}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-white border border-[#ddd8cc] rounded-lg text-[#1e2d18] placeholder-[#9a9080] focus:border-[#3d6b2a] focus:outline-none focus:ring-2 focus:ring-[#3d6b2a]/20"
                  placeholder="Any dietary restrictions, setup preferences, or special requests..."
                />
              </div>

              {/* School-Specific Fields */}
              {orderFormData.order_type === 'school' && (
                <div className="space-y-4 border-t border-[#ddd8cc] pt-4">
                  <p className="text-sm font-semibold text-blue-400 uppercase tracking-wide">School Details</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-[#4a5e3a]">School Name</label>
                      <input
                        type="text"
                        name="school_name"
                        value={orderFormData.school_name}
                        onChange={handleOrderInputChange}
                        className="w-full px-4 py-2.5 bg-white border border-[#ddd8cc] rounded-lg text-[#1e2d18] placeholder-[#9a9080] focus:border-[#3d6b2a] focus:outline-none focus:ring-2 focus:ring-[#3d6b2a]/20"
                        placeholder="e.g., Mesa High School"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-[#4a5e3a]">School District</label>
                      <input
                        type="text"
                        name="school_district"
                        value={orderFormData.school_district}
                        onChange={handleOrderInputChange}
                        className="w-full px-4 py-2.5 bg-white border border-[#ddd8cc] rounded-lg text-[#1e2d18] placeholder-[#9a9080] focus:border-[#3d6b2a] focus:outline-none focus:ring-2 focus:ring-[#3d6b2a]/20"
                        placeholder="e.g., Mesa Unified School District"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      name="is_recurring"
                      id="new_is_recurring"
                      checked={orderFormData.is_recurring}
                      onChange={handleOrderInputChange}
                      className="w-4 h-4 border border-[#ddd8cc] rounded focus:outline-none focus:ring-2 focus:ring-[#449531] cursor-pointer"
                    />
                    <label htmlFor="new_is_recurring" className="text-sm font-medium text-[#4a5e3a] cursor-pointer">
                      Recurring order
                    </label>
                  </div>
                  {orderFormData.is_recurring && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-[#4a5e3a]">Contract Start</label>
                        <input
                          type="date"
                          name="contract_start_date"
                          value={orderFormData.contract_start_date}
                          onChange={handleOrderInputChange}
                          className="w-full px-4 py-2.5 bg-white border border-[#ddd8cc] rounded-lg text-[#1e2d18] focus:border-[#3d6b2a] focus:outline-none focus:ring-2 focus:ring-[#3d6b2a]/20"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-[#4a5e3a]">Contract End</label>
                        <input
                          type="date"
                          name="contract_end_date"
                          value={orderFormData.contract_end_date}
                          onChange={handleOrderInputChange}
                          className="w-full px-4 py-2.5 bg-white border border-[#ddd8cc] rounded-lg text-[#1e2d18] focus:border-[#3d6b2a] focus:outline-none focus:ring-2 focus:ring-[#3d6b2a]/20"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Corporate-Specific Fields */}
              {orderFormData.order_type === 'corporate' && (
                <div className="space-y-4 border-t border-[#ddd8cc] pt-4">
                  <p className="text-sm font-semibold text-purple-400 uppercase tracking-wide">Corporate Details</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-[#4a5e3a]">Company Name</label>
                      <input
                        type="text"
                        name="company_name"
                        value={orderFormData.company_name}
                        onChange={handleOrderInputChange}
                        className="w-full px-4 py-2.5 bg-white border border-[#ddd8cc] rounded-lg text-[#1e2d18] placeholder-[#9a9080] focus:border-[#3d6b2a] focus:outline-none focus:ring-2 focus:ring-[#3d6b2a]/20"
                        placeholder="e.g., Acme Corp"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-[#4a5e3a]">Department</label>
                      <input
                        type="text"
                        name="department"
                        value={orderFormData.department}
                        onChange={handleOrderInputChange}
                        className="w-full px-4 py-2.5 bg-white border border-[#ddd8cc] rounded-lg text-[#1e2d18] placeholder-[#9a9080] focus:border-[#3d6b2a] focus:outline-none focus:ring-2 focus:ring-[#3d6b2a]/20"
                        placeholder="e.g., Marketing"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-[#4a5e3a]">PO Number</label>
                    <input
                      type="text"
                      name="po_number"
                      value={orderFormData.po_number}
                      onChange={handleOrderInputChange}
                      className="w-full px-4 py-2.5 bg-white border border-[#ddd8cc] rounded-lg text-[#1e2d18] placeholder-[#9a9080] focus:border-[#3d6b2a] focus:outline-none focus:ring-2 focus:ring-[#3d6b2a]/20"
                      placeholder="Purchase order number"
                    />
                  </div>
                  <p className="text-xs text-[#9a9080] font-medium uppercase tracking-wide mt-2">Billing Contact</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-[#4a5e3a]">Billing Contact Name</label>
                      <input
                        type="text"
                        name="billing_contact_name"
                        value={orderFormData.billing_contact_name}
                        onChange={handleOrderInputChange}
                        className="w-full px-4 py-2.5 bg-white border border-[#ddd8cc] rounded-lg text-[#1e2d18] placeholder-[#9a9080] focus:border-[#3d6b2a] focus:outline-none focus:ring-2 focus:ring-[#3d6b2a]/20"
                        placeholder="Full name"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-[#4a5e3a]">Billing Contact Email</label>
                      <input
                        type="email"
                        name="billing_contact_email"
                        value={orderFormData.billing_contact_email}
                        onChange={handleOrderInputChange}
                        className="w-full px-4 py-2.5 bg-white border border-[#ddd8cc] rounded-lg text-[#1e2d18] placeholder-[#9a9080] focus:border-[#3d6b2a] focus:outline-none focus:ring-2 focus:ring-[#3d6b2a]/20"
                        placeholder="billing@company.com"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-[#4a5e3a]">Billing Address</label>
                    <input
                      type="text"
                      name="billing_address"
                      value={orderFormData.billing_address}
                      onChange={handleOrderInputChange}
                      className="w-full px-4 py-2.5 bg-white border border-[#ddd8cc] rounded-lg text-[#1e2d18] placeholder-[#9a9080] focus:border-[#3d6b2a] focus:outline-none focus:ring-2 focus:ring-[#3d6b2a]/20"
                      placeholder="123 Main St, Phoenix, AZ 85001"
                    />
                  </div>
                </div>
              )}

              {/* Compliance & Logistics — always shown */}
              <div className="space-y-4 border-t border-[#ddd8cc] pt-4">
                <p className="text-sm font-semibold text-[#7a7060] uppercase tracking-wide">Compliance & Logistics</p>
                <div className="flex flex-col gap-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="requires_insurance_cert"
                      checked={orderFormData.requires_insurance_cert}
                      onChange={handleOrderInputChange}
                      className="w-4 h-4 border border-[#ddd8cc] rounded focus:outline-none focus:ring-2 focus:ring-[#449531] cursor-pointer"
                    />
                    <span className="text-sm font-medium text-[#4a5e3a]">Requires insurance certificate</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="requires_health_permit"
                      checked={orderFormData.requires_health_permit}
                      onChange={handleOrderInputChange}
                      className="w-4 h-4 border border-[#ddd8cc] rounded focus:outline-none focus:ring-2 focus:ring-[#449531] cursor-pointer"
                    />
                    <span className="text-sm font-medium text-[#4a5e3a]">Requires health permit</span>
                  </label>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-[#4a5e3a]">Staffing Needed</label>
                  <input
                    type="number"
                    name="staffing_needed"
                    min="0"
                    value={orderFormData.staffing_needed}
                    onChange={handleOrderInputChange}
                    className="w-full px-4 py-2.5 bg-white border border-[#ddd8cc] rounded-lg text-[#1e2d18] placeholder-[#9a9080] focus:border-[#3d6b2a] focus:outline-none focus:ring-2 focus:ring-[#3d6b2a]/20"
                    placeholder="Number of staff required"
                  />
                </div>
              </div>

              {/* Internal Notes */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-[#4a5e3a]">Internal Notes</label>
                <textarea
                  name="internal_notes"
                  value={orderFormData.internal_notes}
                  onChange={handleOrderInputChange}
                  rows={2}
                  className="w-full px-4 py-2.5 bg-white border border-[#ddd8cc] rounded-lg text-[#1e2d18] placeholder-[#9a9080] focus:border-[#3d6b2a] focus:outline-none focus:ring-2 focus:ring-[#3d6b2a]/20"
                  placeholder="Internal notes visible only to admin..."
                />
              </div>

              {/* Total Amount */}
              {orderFormData.package_id && (
                <div className="bg-[#449531]/10 border border-[#449531]/30 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[#4a5e3a] font-medium">Estimated Total:</span>
                    <span className="text-2xl font-bold text-[#3d6b2a]">{fmt(calculateOrderTotal())}</span>
                  </div>
                  <p className="text-xs text-[#7a7060] mt-2">
                    {packages.find(p => p.id === orderFormData.package_id)?.price_per_person && (
                      <>
                        {fmt(packages.find(p => p.id === orderFormData.package_id)!.price_per_person)} × {orderFormData.estimated_guests} guests
                      </>
                    )}
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 flex gap-3 px-6 py-4 border-t border-[#ddd8cc] bg-[#f2efe8]">
              <button
                onClick={closeOrderModal}
                className="flex-1 px-4 py-2.5 border border-[#ddd8cc] hover:border-white/20 text-[#4a5e3a] font-medium rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveOrder}
                disabled={loading}
                className="flex-1 px-4 py-2.5 bg-[#449531] hover:bg-[#2f5720] text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create Order'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {showOrderDetailsModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full my-8 border border-[#ddd8cc]">
            {/* Modal Header */}
            <div className="sticky top-0 flex justify-between items-center px-6 py-4 border-b border-[#ddd8cc] bg-white rounded-t-2xl z-10">
              <h3 className="text-lg font-semibold text-[#1e2d18]">
                {editingOrderId ? 'Edit Order' : 'View Order Details'}
              </h3>
              <button
                onClick={closeOrderDetailsModal}
                className="text-[#7a7060] hover:text-[#7a7060] transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="px-6 py-4 space-y-6">
              {/* Event Details */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-[#4a5e3a] uppercase tracking-wide">Event Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-[#4a5e3a]">Event Name</label>
                    {editingOrderId ? (
                      <input
                        type="text"
                        name="event_name"
                        value={orderFormData.event_name}
                        onChange={handleOrderInputChange}
                        className="w-full px-4 py-2.5 bg-white border border-[#ddd8cc] rounded-lg text-[#1e2d18] placeholder-[#9a9080] focus:border-[#3d6b2a] focus:outline-none focus:ring-2 focus:ring-[#3d6b2a]/20"
                      />
                    ) : (
                      <p className="text-[#1e2d18] font-medium">{orderFormData.event_name || '—'}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-[#4a5e3a]">Event Date</label>
                    {editingOrderId ? (
                      <input
                        type="date"
                        name="event_date"
                        value={orderFormData.event_date}
                        onChange={handleOrderInputChange}
                        className="w-full px-4 py-2.5 bg-white border border-[#ddd8cc] rounded-lg text-[#1e2d18] placeholder-[#9a9080] focus:border-[#3d6b2a] focus:outline-none focus:ring-2 focus:ring-[#3d6b2a]/20"
                      />
                    ) : (
                      <p className="text-[#1e2d18] font-medium">
                        {orderFormData.event_date
                          ? new Date(orderFormData.event_date).toLocaleDateString()
                          : '—'}
                      </p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-[#4a5e3a]">Event Time</label>
                    {editingOrderId ? (
                      <input
                        type="time"
                        name="event_time"
                        value={orderFormData.event_time}
                        onChange={handleOrderInputChange}
                        className="w-full px-4 py-2.5 bg-white border border-[#ddd8cc] rounded-lg text-[#1e2d18] placeholder-[#9a9080] focus:border-[#3d6b2a] focus:outline-none focus:ring-2 focus:ring-[#3d6b2a]/20"
                      />
                    ) : (
                      <p className="text-[#1e2d18] font-medium">{orderFormData.event_time || '—'}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-[#4a5e3a]">Estimated Guests</label>
                    {editingOrderId ? (
                      <input
                        type="number"
                        name="estimated_guests"
                        min="1"
                        value={orderFormData.estimated_guests}
                        onChange={handleOrderInputChange}
                        className="w-full px-4 py-2.5 bg-white border border-[#ddd8cc] rounded-lg text-[#1e2d18] placeholder-[#9a9080] focus:border-[#3d6b2a] focus:outline-none focus:ring-2 focus:ring-[#3d6b2a]/20"
                      />
                    ) : (
                      <p className="text-[#1e2d18] font-medium">{orderFormData.estimated_guests || '—'}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-4 border-t border-[#ddd8cc] pt-4">
                <h4 className="text-sm font-semibold text-[#4a5e3a] uppercase tracking-wide">Contact Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-[#4a5e3a]">Contact Name</label>
                    {editingOrderId ? (
                      <input
                        type="text"
                        name="contact_name"
                        value={orderFormData.contact_name}
                        onChange={handleOrderInputChange}
                        className="w-full px-4 py-2.5 bg-white border border-[#ddd8cc] rounded-lg text-[#1e2d18] placeholder-[#9a9080] focus:border-[#3d6b2a] focus:outline-none focus:ring-2 focus:ring-[#3d6b2a]/20"
                      />
                    ) : (
                      <p className="text-[#1e2d18] font-medium">{orderFormData.contact_name || '—'}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-[#4a5e3a]">Contact Email</label>
                    {editingOrderId ? (
                      <input
                        type="email"
                        name="contact_email"
                        value={orderFormData.contact_email}
                        onChange={handleOrderInputChange}
                        className="w-full px-4 py-2.5 bg-white border border-[#ddd8cc] rounded-lg text-[#1e2d18] placeholder-[#9a9080] focus:border-[#3d6b2a] focus:outline-none focus:ring-2 focus:ring-[#3d6b2a]/20"
                      />
                    ) : (
                      <p className="text-[#1e2d18] font-medium">{orderFormData.contact_email || '—'}</p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-[#4a5e3a]">Contact Phone</label>
                  {editingOrderId ? (
                    <input
                      type="tel"
                      name="contact_phone"
                      value={orderFormData.contact_phone}
                      onChange={handleOrderInputChange}
                      className="w-full px-4 py-2.5 bg-white border border-[#ddd8cc] rounded-lg text-[#1e2d18] placeholder-[#9a9080] focus:border-[#3d6b2a] focus:outline-none focus:ring-2 focus:ring-[#3d6b2a]/20"
                    />
                  ) : (
                    <p className="text-[#1e2d18] font-medium">{orderFormData.contact_phone || '—'}</p>
                  )}
                </div>
              </div>

              {/* Venue Information */}
              <div className="space-y-4 border-t border-[#ddd8cc] pt-4">
                <h4 className="text-sm font-semibold text-[#4a5e3a] uppercase tracking-wide">Venue Information</h4>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-[#4a5e3a]">Venue Name</label>
                  {editingOrderId ? (
                    <input
                      type="text"
                      name="venue_name"
                      value={orderFormData.venue_name}
                      onChange={handleOrderInputChange}
                      className="w-full px-4 py-2.5 bg-white border border-[#ddd8cc] rounded-lg text-[#1e2d18] placeholder-[#9a9080] focus:border-[#3d6b2a] focus:outline-none focus:ring-2 focus:ring-[#3d6b2a]/20"
                    />
                  ) : (
                    <p className="text-[#1e2d18] font-medium">{orderFormData.venue_name || '—'}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-[#4a5e3a]">Venue Address</label>
                  {editingOrderId ? (
                    <input
                      type="text"
                      name="venue_address"
                      value={orderFormData.venue_address}
                      onChange={handleOrderInputChange}
                      className="w-full px-4 py-2.5 bg-white border border-[#ddd8cc] rounded-lg text-[#1e2d18] placeholder-[#9a9080] focus:border-[#3d6b2a] focus:outline-none focus:ring-2 focus:ring-[#3d6b2a]/20"
                    />
                  ) : (
                    <p className="text-[#1e2d18] font-medium">{orderFormData.venue_address || '—'}</p>
                  )}
                </div>
              </div>

              {/* Payment Status */}
              <div className="space-y-4 border-t border-[#ddd8cc] pt-4">
                <h4 className="text-sm font-semibold text-[#4a5e3a] uppercase tracking-wide">Payment</h4>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-[#4a5e3a]">Payment Status</label>
                  {editingOrderId ? (
                    <select
                      name="payment_status"
                      value={orderFormData.payment_status}
                      onChange={handleOrderInputChange}
                      className="w-full px-4 py-2.5 bg-white border border-[#ddd8cc] rounded-lg text-[#1e2d18] placeholder-[#9a9080] focus:border-[#3d6b2a] focus:outline-none focus:ring-2 focus:ring-[#3d6b2a]/20"
                    >
                      <option value="unpaid">Unpaid</option>
                      <option value="deposit_paid">Deposit Paid</option>
                      <option value="paid_in_full">Paid in Full</option>
                    </select>
                  ) : (
                    <p className="text-[#1e2d18] font-medium capitalize">{orderFormData.payment_status || '—'}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-[#4a5e3a]">Total Amount</label>
                  <p className="text-2xl font-bold text-[#3d6b2a]">{fmt(orderFormData.total_amount || 0)}</p>
                </div>
              </div>

              {/* Order Type Section */}
              <div className="space-y-4 border-t border-[#ddd8cc] pt-4">
                <h4 className="text-sm font-semibold text-[#4a5e3a] uppercase tracking-wide">Order Type</h4>
                {editingOrderId ? (
                  <div className="flex gap-2">
                    {(['event', 'school', 'corporate'] as const).map(type => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setOrderFormData(prev => ({ ...prev, order_type: type }))}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                          orderFormData.order_type === type
                            ? 'bg-[#449531] text-white border border-[#449531]'
                            : 'bg-[#f2efe8] border border-[#ddd8cc] text-[#7a7060] hover:border-[#3d6b2a]/30 hover:text-[#4a5e3a]'
                        }`}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </button>
                    ))}
                  </div>
                ) : (
                  <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium capitalize ${
                    orderFormData.order_type === 'school' ? 'bg-blue-500/15 text-blue-400' :
                    orderFormData.order_type === 'corporate' ? 'bg-purple-500/15 text-purple-400' :
                    'bg-[#449531]/15 text-[#3d6b2a]'
                  }`}>
                    {orderFormData.order_type || 'event'}
                  </span>
                )}
              </div>

              {/* School Fields in Details Modal */}
              {orderFormData.order_type === 'school' && (
                <div className="space-y-4 border-t border-[#ddd8cc] pt-4">
                  <h4 className="text-sm font-semibold text-blue-400 uppercase tracking-wide">School Details</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-[#4a5e3a]">School Name</label>
                      {editingOrderId ? (
                        <input
                          type="text"
                          name="school_name"
                          value={orderFormData.school_name}
                          onChange={handleOrderInputChange}
                          className="w-full px-4 py-2.5 bg-white border border-[#ddd8cc] rounded-lg text-[#1e2d18] placeholder-[#9a9080] focus:border-[#3d6b2a] focus:outline-none focus:ring-2 focus:ring-[#3d6b2a]/20"
                          placeholder="School name"
                        />
                      ) : (
                        <p className="text-[#1e2d18] font-medium">{orderFormData.school_name || '—'}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-[#4a5e3a]">School District</label>
                      {editingOrderId ? (
                        <input
                          type="text"
                          name="school_district"
                          value={orderFormData.school_district}
                          onChange={handleOrderInputChange}
                          className="w-full px-4 py-2.5 bg-white border border-[#ddd8cc] rounded-lg text-[#1e2d18] placeholder-[#9a9080] focus:border-[#3d6b2a] focus:outline-none focus:ring-2 focus:ring-[#3d6b2a]/20"
                          placeholder="District name"
                        />
                      ) : (
                        <p className="text-[#1e2d18] font-medium">{orderFormData.school_district || '—'}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {editingOrderId ? (
                      <>
                        <input
                          type="checkbox"
                          name="is_recurring"
                          id="det_is_recurring"
                          checked={orderFormData.is_recurring}
                          onChange={handleOrderInputChange}
                          className="w-4 h-4 border border-[#ddd8cc] rounded focus:outline-none focus:ring-2 focus:ring-[#449531] cursor-pointer"
                        />
                        <label htmlFor="det_is_recurring" className="text-sm font-medium text-[#4a5e3a] cursor-pointer">Recurring order</label>
                      </>
                    ) : (
                      <p className="text-sm text-[#4a5e3a]">Recurring: <span className="text-[#1e2d18] font-medium">{orderFormData.is_recurring ? 'Yes' : 'No'}</span></p>
                    )}
                  </div>
                  {(orderFormData.is_recurring || orderFormData.contract_start_date || orderFormData.contract_end_date) && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-[#4a5e3a]">Contract Start</label>
                        {editingOrderId ? (
                          <input
                            type="date"
                            name="contract_start_date"
                            value={orderFormData.contract_start_date}
                            onChange={handleOrderInputChange}
                            className="w-full px-4 py-2.5 bg-white border border-[#ddd8cc] rounded-lg text-[#1e2d18] focus:border-[#3d6b2a] focus:outline-none focus:ring-2 focus:ring-[#3d6b2a]/20"
                          />
                        ) : (
                          <p className="text-[#1e2d18] font-medium">{orderFormData.contract_start_date || '—'}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-[#4a5e3a]">Contract End</label>
                        {editingOrderId ? (
                          <input
                            type="date"
                            name="contract_end_date"
                            value={orderFormData.contract_end_date}
                            onChange={handleOrderInputChange}
                            className="w-full px-4 py-2.5 bg-white border border-[#ddd8cc] rounded-lg text-[#1e2d18] focus:border-[#3d6b2a] focus:outline-none focus:ring-2 focus:ring-[#3d6b2a]/20"
                          />
                        ) : (
                          <p className="text-[#1e2d18] font-medium">{orderFormData.contract_end_date || '—'}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Corporate Fields in Details Modal */}
              {orderFormData.order_type === 'corporate' && (
                <div className="space-y-4 border-t border-[#ddd8cc] pt-4">
                  <h4 className="text-sm font-semibold text-purple-400 uppercase tracking-wide">Corporate Details</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-[#4a5e3a]">Company Name</label>
                      {editingOrderId ? (
                        <input
                          type="text"
                          name="company_name"
                          value={orderFormData.company_name}
                          onChange={handleOrderInputChange}
                          className="w-full px-4 py-2.5 bg-white border border-[#ddd8cc] rounded-lg text-[#1e2d18] placeholder-[#9a9080] focus:border-[#3d6b2a] focus:outline-none focus:ring-2 focus:ring-[#3d6b2a]/20"
                          placeholder="Company name"
                        />
                      ) : (
                        <p className="text-[#1e2d18] font-medium">{orderFormData.company_name || '—'}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-[#4a5e3a]">Department</label>
                      {editingOrderId ? (
                        <input
                          type="text"
                          name="department"
                          value={orderFormData.department}
                          onChange={handleOrderInputChange}
                          className="w-full px-4 py-2.5 bg-white border border-[#ddd8cc] rounded-lg text-[#1e2d18] placeholder-[#9a9080] focus:border-[#3d6b2a] focus:outline-none focus:ring-2 focus:ring-[#3d6b2a]/20"
                          placeholder="Department"
                        />
                      ) : (
                        <p className="text-[#1e2d18] font-medium">{orderFormData.department || '—'}</p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-[#4a5e3a]">PO Number</label>
                    {editingOrderId ? (
                      <input
                        type="text"
                        name="po_number"
                        value={orderFormData.po_number}
                        onChange={handleOrderInputChange}
                        className="w-full px-4 py-2.5 bg-white border border-[#ddd8cc] rounded-lg text-[#1e2d18] placeholder-[#9a9080] focus:border-[#3d6b2a] focus:outline-none focus:ring-2 focus:ring-[#3d6b2a]/20"
                        placeholder="Purchase order number"
                      />
                    ) : (
                      <p className="text-[#1e2d18] font-medium">{orderFormData.po_number || '—'}</p>
                    )}
                  </div>
                  <p className="text-xs text-[#9a9080] font-medium uppercase tracking-wide mt-1">Billing Contact</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-[#4a5e3a]">Billing Name</label>
                      {editingOrderId ? (
                        <input
                          type="text"
                          name="billing_contact_name"
                          value={orderFormData.billing_contact_name}
                          onChange={handleOrderInputChange}
                          className="w-full px-4 py-2.5 bg-white border border-[#ddd8cc] rounded-lg text-[#1e2d18] placeholder-[#9a9080] focus:border-[#3d6b2a] focus:outline-none focus:ring-2 focus:ring-[#3d6b2a]/20"
                        />
                      ) : (
                        <p className="text-[#1e2d18] font-medium">{orderFormData.billing_contact_name || '—'}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-[#4a5e3a]">Billing Email</label>
                      {editingOrderId ? (
                        <input
                          type="email"
                          name="billing_contact_email"
                          value={orderFormData.billing_contact_email}
                          onChange={handleOrderInputChange}
                          className="w-full px-4 py-2.5 bg-white border border-[#ddd8cc] rounded-lg text-[#1e2d18] placeholder-[#9a9080] focus:border-[#3d6b2a] focus:outline-none focus:ring-2 focus:ring-[#3d6b2a]/20"
                        />
                      ) : (
                        <p className="text-[#1e2d18] font-medium">{orderFormData.billing_contact_email || '—'}</p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-[#4a5e3a]">Billing Address</label>
                    {editingOrderId ? (
                      <input
                        type="text"
                        name="billing_address"
                        value={orderFormData.billing_address}
                        onChange={handleOrderInputChange}
                        className="w-full px-4 py-2.5 bg-white border border-[#ddd8cc] rounded-lg text-[#1e2d18] placeholder-[#9a9080] focus:border-[#3d6b2a] focus:outline-none focus:ring-2 focus:ring-[#3d6b2a]/20"
                      />
                    ) : (
                      <p className="text-[#1e2d18] font-medium">{orderFormData.billing_address || '—'}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Compliance & Logistics */}
              <div className="space-y-4 border-t border-[#ddd8cc] pt-4">
                <h4 className="text-sm font-semibold text-[#4a5e3a] uppercase tracking-wide">Compliance & Logistics</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    {editingOrderId ? (
                      <>
                        <input
                          type="checkbox"
                          name="requires_insurance_cert"
                          id="det_insurance"
                          checked={orderFormData.requires_insurance_cert}
                          onChange={handleOrderInputChange}
                          className="w-4 h-4 border border-[#ddd8cc] rounded focus:outline-none focus:ring-2 focus:ring-[#449531] cursor-pointer"
                        />
                        <label htmlFor="det_insurance" className="text-sm font-medium text-[#4a5e3a] cursor-pointer">Insurance cert required</label>
                      </>
                    ) : (
                      <p className="text-sm text-[#4a5e3a]">Insurance cert: <span className={`font-medium ${orderFormData.requires_insurance_cert ? 'text-yellow-400' : 'text-[#9a9080]'}`}>{orderFormData.requires_insurance_cert ? 'Required' : 'Not required'}</span></p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {editingOrderId ? (
                      <>
                        <input
                          type="checkbox"
                          name="requires_health_permit"
                          id="det_health"
                          checked={orderFormData.requires_health_permit}
                          onChange={handleOrderInputChange}
                          className="w-4 h-4 border border-[#ddd8cc] rounded focus:outline-none focus:ring-2 focus:ring-[#449531] cursor-pointer"
                        />
                        <label htmlFor="det_health" className="text-sm font-medium text-[#4a5e3a] cursor-pointer">Health permit required</label>
                      </>
                    ) : (
                      <p className="text-sm text-[#4a5e3a]">Health permit: <span className={`font-medium ${orderFormData.requires_health_permit ? 'text-yellow-400' : 'text-[#9a9080]'}`}>{orderFormData.requires_health_permit ? 'Required' : 'Not required'}</span></p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-[#4a5e3a]">Staffing Needed</label>
                  {editingOrderId ? (
                    <input
                      type="number"
                      name="staffing_needed"
                      min="0"
                      value={orderFormData.staffing_needed}
                      onChange={handleOrderInputChange}
                      className="w-full px-4 py-2.5 bg-white border border-[#ddd8cc] rounded-lg text-[#1e2d18] placeholder-[#9a9080] focus:border-[#3d6b2a] focus:outline-none focus:ring-2 focus:ring-[#3d6b2a]/20"
                    />
                  ) : (
                    <p className="text-[#1e2d18] font-medium">{orderFormData.staffing_needed ? `${orderFormData.staffing_needed} staff` : '—'}</p>
                  )}
                </div>
              </div>

              {/* Internal Notes */}
              <div className="space-y-2 border-t border-[#ddd8cc] pt-4">
                <label className="block text-sm font-medium text-[#4a5e3a]">Internal Notes</label>
                {editingOrderId ? (
                  <textarea
                    name="internal_notes"
                    value={orderFormData.internal_notes}
                    onChange={handleOrderInputChange}
                    rows={3}
                    className="w-full px-4 py-2.5 bg-white border border-[#ddd8cc] rounded-lg text-[#1e2d18] placeholder-[#9a9080] focus:border-[#3d6b2a] focus:outline-none focus:ring-2 focus:ring-[#3d6b2a]/20"
                    placeholder="Internal notes visible only to admin..."
                  />
                ) : (
                  <p className="text-[#4a5e3a] text-sm whitespace-pre-wrap">{orderFormData.internal_notes || '—'}</p>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 flex gap-3 px-6 py-4 border-t border-[#ddd8cc] bg-[#f2efe8]">
              <button
                onClick={closeOrderDetailsModal}
                className="flex-1 px-4 py-2.5 border border-[#ddd8cc] hover:border-white/20 text-[#4a5e3a] font-medium rounded-lg transition-colors"
              >
                {editingOrderId ? 'Cancel' : 'Close'}
              </button>
              {editingOrderId && (
                <button
                  onClick={updateOrder}
                  disabled={loading}
                  className="flex-1 px-4 py-2.5 bg-[#449531] hover:bg-[#2f5720] text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cancel Order Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full border border-[#ddd8cc]">
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-[#ddd8cc]">
              <h3 className="text-lg font-semibold text-[#1e2d18]">Cancel Order</h3>
              <button
                onClick={closeCancelModal}
                className="text-[#7a7060] hover:text-[#7a7060] transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="px-6 py-4 space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-600">
                  <strong>Warning:</strong> Canceling this order cannot be undone. Please provide a reason for the cancellation.
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-[#4a5e3a]">Cancellation Reason</label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Please explain why this order is being cancelled..."
                  rows={4}
                  className="w-full px-4 py-2.5 bg-white border border-[#ddd8cc] rounded-lg text-[#1e2d18] placeholder-[#9a9080] focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex gap-3 px-6 py-4 border-t border-[#ddd8cc] bg-[#f2efe8]">
              <button
                onClick={closeCancelModal}
                className="flex-1 px-4 py-2.5 border border-[#ddd8cc] hover:border-white/20 text-[#4a5e3a] font-medium rounded-lg transition-colors"
              >
                Keep Order
              </button>
              <button
                onClick={cancelOrder}
                disabled={loading || !cancelReason.trim()}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Cancelling...' : 'Cancel Order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
