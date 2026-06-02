"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X, Plus, Trash2, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Order, OrderItem, Recipe, SubscriptionPlan, UserProfile, Contact } from "@/types/database";

interface CreateOrderFormProps {
  children: React.ReactNode;
}

type OrderTab = "one-time" | "subscription" | "catering";

interface OrderItemLocal {
  recipe_id: string;
  recipe_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface CustomerOption {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  source: "contact" | "user_profile";
}

export default function CreateOrderForm({ children }: CreateOrderFormProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<OrderTab>("one-time");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([]);
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([]);
  const [recipeSearch, setRecipeSearch] = useState("");
  const [showRecipeDropdown, setShowRecipeDropdown] = useState(false);

  // One-time customer search state
  const [oneTimeCustomerResults, setOneTimeCustomerResults] = useState<CustomerOption[]>([]);
  const [oneTimeSearchLoading, setOneTimeSearchLoading] = useState(false);
  const [oneTimeShowDropdown, setOneTimeShowDropdown] = useState(false);
  const [oneTimeSelectedCustomer, setOneTimeSelectedCustomer] = useState<CustomerOption | null>(null);

  // Subscription customer search state
  const [subscriptionCustomerResults, setSubscriptionCustomerResults] = useState<CustomerOption[]>([]);
  const [subscriptionSearchLoading, setSubscriptionSearchLoading] = useState(false);
  const [subscriptionShowDropdown, setSubscriptionShowDropdown] = useState(false);
  const [subscriptionSelectedCustomer, setSubscriptionSelectedCustomer] = useState<CustomerOption | null>(null);

  const supabase = createClient();
  const storeId = "b0000000-0000-0000-0000-000000000001";
  const formRef = useRef<HTMLFormElement>(null);

  // Form states - One-Time
  const [oneTimeState, setOneTimeState] = useState({
    customer_search: "",
    customer_id: "",
    is_new_customer: false,
    new_customer_first_name: "",
    new_customer_last_name: "",
    new_customer_email: "",
    new_customer_phone: "",
    fulfillment_type: "pickup" as "pickup" | "delivery",
    delivery_street: "",
    delivery_city: "",
    delivery_state: "",
    delivery_zip: "",
    pickup_delivery_date: "",
    pickup_delivery_time: "",
    order_items: [] as OrderItemLocal[],
    special_instructions: "",
    payment_status: "pending" as "pending" | "paid" | "comp",
    notes: "",
  });

  // Form states - Subscription
  const [subscriptionState, setSubscriptionState] = useState({
    customer_search: "",
    customer_id: "",
    is_new_customer: false,
    new_customer_first_name: "",
    new_customer_last_name: "",
    new_customer_email: "",
    new_customer_phone: "",
    plan_id: "",
    start_date: "",
    delivery_day: "monday" as any,
    fulfillment_type: "delivery" as "pickup" | "delivery",
    delivery_street: "",
    delivery_city: "",
    delivery_state: "",
    delivery_zip: "",
    meals_per_week: "3",
    payment_frequency: "weekly" as "weekly" | "monthly",
    notes: "",
  });

  // Form states - Catering
  const [cateringState, setCateringState] = useState({
    customer_name: "",
    company_name: "",
    contact_first_name: "",
    contact_last_name: "",
    contact_email: "",
    contact_phone: "",
    event_date: "",
    event_time: "",
    event_type: "corporate" as "corporate" | "wedding" | "birthday" | "private_party" | "other",
    guest_count_min: "",
    guest_count_max: "",
    venue_street: "",
    venue_city: "",
    venue_state: "",
    venue_zip: "",
    dietary_requirements: [] as string[],
    budget_range: "",
    package_type: "buffet_style" as "buffet_style" | "individual_boxes" | "family_style" | "custom",
    menu_preferences: "",
    setup_cleanup: false,
    staff_needed: false,
    notes: "",
  });

  // Load recipes and plans on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [recipesRes, plansRes] = await Promise.all([
          supabase.from("recipes").select("*").eq("store_id", storeId).order("name"),
          supabase.from("subscription_plans").select("*").eq("store_id", storeId).order("name"),
        ]);

        if (recipesRes.data) setRecipes(recipesRes.data);
        if (plansRes.data) setSubscriptionPlans(plansRes.data);
      } catch (error) {
        console.error("Error loading data:", error);
      }
    };

    if (isOpen) loadData();
  }, [isOpen]);

  // Filter recipes based on search
  useEffect(() => {
    const filtered = recipes.filter((recipe) =>
      recipe.name.toLowerCase().includes(recipeSearch.toLowerCase())
    );
    setFilteredRecipes(filtered);
  }, [recipeSearch, recipes]);

  // Search customers (contacts + user_profiles) for one-time orders
  useEffect(() => {
    const searchOneTimeCustomers = async () => {
      if (oneTimeState.customer_search.length < 2) {
        setOneTimeCustomerResults([]);
        setOneTimeShowDropdown(false);
        return;
      }
      setOneTimeSearchLoading(true);
      const search = oneTimeState.customer_search.toLowerCase();

      const [contactsRes, userProfilesRes] = await Promise.all([
        supabase
          .from("contacts")
          .select("id, first_name, last_name, email, phone, contact_type, source")
          .eq("store_id", storeId)
          .or(`email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%,phone.ilike.%${search}%`)
          .limit(15),
        supabase
          .from("user_profiles")
          .select("id, first_name, last_name, email, phone")
          .or(`email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%,phone.ilike.%${search}%`)
          .limit(10),
      ]);

      const contacts: CustomerOption[] = (contactsRes.data || []).map((c: any) => ({
        id: c.id,
        first_name: c.first_name,
        last_name: c.last_name,
        email: c.email,
        phone: c.phone,
        source: "contact",
        contact_type: c.contact_type,
      }));

      const userProfiles: CustomerOption[] = (userProfilesRes.data || []).map((u: any) => ({
        id: u.id,
        first_name: u.first_name,
        last_name: u.last_name,
        email: u.email,
        phone: u.phone,
        source: "user_profile",
      }));

      // Deduplicate by email (prefer user_profile over contact)
      const emailSeen = new Set<string>();
      const deduped: CustomerOption[] = [];
      for (const u of userProfiles) {
        if (u.email) emailSeen.add(u.email.toLowerCase());
        deduped.push(u);
      }
      for (const c of contacts) {
        if (c.email && emailSeen.has(c.email.toLowerCase())) continue;
        if (c.email) emailSeen.add(c.email.toLowerCase());
        deduped.push(c);
      }

      const results = deduped.slice(0, 12);
      setOneTimeCustomerResults(results);
      setOneTimeShowDropdown(results.length > 0);
      setOneTimeSearchLoading(false);
    };

    const timer = setTimeout(searchOneTimeCustomers, 300);
    return () => clearTimeout(timer);
  }, [oneTimeState.customer_search]);

  // Search customers (contacts + user_profiles) for subscription orders
  useEffect(() => {
    const searchSubscriptionCustomers = async () => {
      if (subscriptionState.customer_search.length < 2) {
        setSubscriptionCustomerResults([]);
        setSubscriptionShowDropdown(false);
        return;
      }
      setSubscriptionSearchLoading(true);
      const search = subscriptionState.customer_search.toLowerCase();

      const [contactsRes, userProfilesRes] = await Promise.all([
        supabase
          .from("contacts")
          .select("id, first_name, last_name, email, phone, contact_type, source")
          .eq("store_id", storeId)
          .or(`email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%,phone.ilike.%${search}%`)
          .limit(15),
        supabase
          .from("user_profiles")
          .select("id, first_name, last_name, email, phone")
          .or(`email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%,phone.ilike.%${search}%`)
          .limit(10),
      ]);

      const contacts: CustomerOption[] = (contactsRes.data || []).map((c: any) => ({
        id: c.id,
        first_name: c.first_name,
        last_name: c.last_name,
        email: c.email,
        phone: c.phone,
        source: "contact",
        contact_type: c.contact_type,
      }));

      const userProfiles: CustomerOption[] = (userProfilesRes.data || []).map((u: any) => ({
        id: u.id,
        first_name: u.first_name,
        last_name: u.last_name,
        email: u.email,
        phone: u.phone,
        source: "user_profile",
      }));

      // Deduplicate by email
      const emailSeen = new Set<string>();
      const deduped: CustomerOption[] = [];
      for (const u of userProfiles) {
        if (u.email) emailSeen.add(u.email.toLowerCase());
        deduped.push(u);
      }
      for (const c of contacts) {
        if (c.email && emailSeen.has(c.email.toLowerCase())) continue;
        if (c.email) emailSeen.add(c.email.toLowerCase());
        deduped.push(c);
      }

      const results = deduped.slice(0, 12);
      setSubscriptionCustomerResults(results);
      setSubscriptionShowDropdown(results.length > 0);
      setSubscriptionSearchLoading(false);
    };

    const timer = setTimeout(searchSubscriptionCustomers, 300);
    return () => clearTimeout(timer);
  }, [subscriptionState.customer_search]);

  // Auto-populate meals_per_week and payment_frequency when subscription plan changes
  useEffect(() => {
    if (subscriptionState.plan_id && subscriptionPlans.length > 0) {
      const selectedPlan = subscriptionPlans.find((p) => p.id === subscriptionState.plan_id);
      if (selectedPlan) {
        setSubscriptionState((prev) => ({
          ...prev,
          meals_per_week: String(selectedPlan.meals_per_week),
          payment_frequency: "weekly",
        }));
      }
    }
  }, [subscriptionState.plan_id, subscriptionPlans]);

  const calculateOneTimeTotal = () => {
    const subtotal = oneTimeState.order_items.reduce((sum, item) => sum + item.total_price, 0);
    const tax = subtotal * 0.085;
    const deliveryFee = oneTimeState.fulfillment_type === "delivery" ? 5 : 0;
    return { subtotal, tax, deliveryFee, total: subtotal + tax + deliveryFee };
  };

  const handleAddRecipeItem = (recipe: Recipe) => {
    setOneTimeState((prev) => ({
      ...prev,
      order_items: [
        ...prev.order_items,
        {
          recipe_id: recipe.id,
          recipe_name: recipe.name,
          quantity: 1,
          unit_price: recipe.base_price,
          total_price: recipe.base_price,
        },
      ],
    }));
    setRecipeSearch("");
    setShowRecipeDropdown(false);
  };

  const handleUpdateOrderItem = (
    index: number,
    field: "quantity" | "unit_price",
    value: string | number
  ) => {
    setOneTimeState((prev) => {
      const updated = [...prev.order_items];
      const item = updated[index];
      const quantity = field === "quantity" ? Number(value) : item.quantity;
      const unit_price = field === "unit_price" ? Number(value) : item.unit_price;

      updated[index] = {
        ...item,
        quantity,
        unit_price,
        total_price: quantity * unit_price,
      };

      return { ...prev, order_items: updated };
    });
  };

  const handleRemoveOrderItem = (index: number) => {
    setOneTimeState((prev) => ({
      ...prev,
      order_items: prev.order_items.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (activeTab === "one-time") {
        await handleCreateOneTimeOrder();
      } else if (activeTab === "subscription") {
        await handleCreateSubscription();
      } else {
        await handleCreateCateringOrder();
      }

      setIsOpen(false);
      formRef.current?.reset();
      router.refresh();
    } catch (error) {
      console.error("Error creating order:", error);
      alert("Failed to create order. See console for details.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateOneTimeOrder = async () => {
    const totals = calculateOneTimeTotal();

    let customerId = oneTimeState.customer_id;

    // Create new customer if needed
    if (oneTimeState.is_new_customer && oneTimeState.new_customer_email) {
      const { data: newContact, error: contactError } = await supabase
        .from("contacts")
        .insert([
          {
            store_id: storeId,
            first_name: oneTimeState.new_customer_first_name,
            last_name: oneTimeState.new_customer_last_name,
            email: oneTimeState.new_customer_email,
            phone: oneTimeState.new_customer_phone || null,
          },
        ])
        .select()
        .single();

      if (contactError || !newContact) throw contactError;
      customerId = newContact.id;
    }

    const orderData = {
      store_id: storeId,
      customer_id: customerId || null,
      order_type: "individual",
      fulfillment_type: oneTimeState.fulfillment_type,
      status: "pending",
      items_subtotal: totals.subtotal,
      discount_amount: 0,
      delivery_fee: totals.deliveryFee,
      service_fee: 0,
      tax_amount: totals.tax,
      tip_amount: 0,
      donation_amount: 0,
      total_amount: totals.total,
      payment_status: oneTimeState.payment_status,
      delivery_instructions: oneTimeState.special_instructions,
      scheduled_for: `${oneTimeState.pickup_delivery_date}T${oneTimeState.pickup_delivery_time}`,
      special_instructions: oneTimeState.special_instructions,
      source: "admin",
    };

    // Insert order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert([orderData])
      .select()
      .single();

    if (orderError || !order) throw orderError;

    // Insert order items
    const orderItems = oneTimeState.order_items.map((item) => ({
      order_id: order.id,
      recipe_id: item.recipe_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.total_price,
      customizations: [],
    }));

    if (orderItems.length > 0) {
      const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
      if (itemsError) throw itemsError;
    }
  };

  const handleCreateSubscription = async () => {
    let customerId = subscriptionState.customer_id;

    // Create new customer if needed
    if (subscriptionState.is_new_customer && subscriptionState.new_customer_email) {
      const { data: newContact, error: contactError } = await supabase
        .from("contacts")
        .insert([
          {
            store_id: storeId,
            first_name: subscriptionState.new_customer_first_name,
            last_name: subscriptionState.new_customer_last_name,
            email: subscriptionState.new_customer_email,
            phone: subscriptionState.new_customer_phone || null,
          },
        ])
        .select()
        .single();

      if (contactError || !newContact) throw contactError;
      customerId = newContact.id;
    }

    // Get the selected plan's price
    const plan = subscriptionPlans.find(p => p.id === subscriptionState.plan_id);
    const price = subscriptionState.payment_frequency === 'weekly'
      ? (plan?.price_weekly || 0)
      : (plan?.price_monthly || 0);

    const subscriptionData = {
      customer_id: customerId || null,
      store_id: storeId,
      plan_id: subscriptionState.plan_id,
      status: "active",
      billing_interval: subscriptionState.payment_frequency,
      current_price: price,
      start_date: subscriptionState.start_date,
      next_billing_date: subscriptionState.start_date,
      next_delivery_date: subscriptionState.start_date,
      customization_deadline: subscriptionState.start_date,
      default_meals: [],
      delivery_day: subscriptionState.delivery_day,
    };

    const { error } = await supabase.from("subscriptions").insert([subscriptionData]);
    if (error) throw error;
  };

  const handleCreateCateringOrder = async () => {
    const cateringData = {
      store_id: storeId,
      contact_name: `${cateringState.contact_first_name} ${cateringState.contact_last_name}`.trim(),
      contact_email: cateringState.contact_email,
      contact_phone: cateringState.contact_phone,
      event_name: `${cateringState.event_type} - ${cateringState.company_name || cateringState.customer_name}`,
      event_date: cateringState.event_date,
      event_time: cateringState.event_time || '12:00',
      venue_address: [cateringState.venue_street, cateringState.venue_city, cateringState.venue_state, cateringState.venue_zip].filter(Boolean).join(', '),
      estimated_guests: parseInt(cateringState.guest_count_max) || parseInt(cateringState.guest_count_min) || 0,
      dietary_requirements: cateringState.dietary_requirements.length > 0 ? JSON.stringify(cateringState.dietary_requirements) : null,
      setup_type: cateringState.package_type,
      special_instructions: cateringState.notes,
      status: 'inquiry',
      payment_status: 'pending',
    };

    const { error } = await supabase.from("catering_orders").insert([cateringData]);
    if (error) throw error;
  };

  const totals = calculateOneTimeTotal();

  return (
    <>
      <div onClick={() => setIsOpen(true)}>{children}</div>

      {isOpen && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-lg">
            {/* Header */}
            <div className="sticky top-0 flex items-center justify-between p-6 border-b border-gray-200 bg-white">
              <h2 className="text-xl font-bold text-gray-900">Create Order</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} className="text-[#9a9080]" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 bg-gray-50">
              {(["one-time", "subscription", "catering"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 px-6 py-3 font-medium transition-colors ${
                    activeTab === tab
                      ? "bg-[#3d6b2a] text-white"
                      : "bg-gray-100 text-[#9a9080] hover:bg-gray-200"
                  }`}
                >
                  {tab === "one-time" ? "One-Time Order" : tab === "subscription" ? "Subscription" : "Catering"}
                </button>
              ))}
            </div>

            {/* Form Content */}
            <form ref={formRef} onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* ============ ONE-TIME ORDER ============ */}
              {activeTab === "one-time" && (
                <div className="space-y-6">
                  {/* Customer Section */}
                  <div className="space-y-4">
                    <h3 className="text-[#9a9080] text-sm font-semibold uppercase tracking-wide">Customer</h3>
                    {!oneTimeState.is_new_customer ? (
                      <div className="space-y-2">
                        <label className="text-gray-700 text-sm font-medium">Search Customer</label>
                        {!oneTimeSelectedCustomer ? (
                          <>
                            <div className="relative">
                              <input
                                type="text"
                                placeholder="Search by name, email, or phone..."
                                value={oneTimeState.customer_search}
                                onChange={(e) => setOneTimeState((prev) => ({ ...prev, customer_search: e.target.value }))}
                                onFocus={() => oneTimeState.customer_search.length >= 2 && setOneTimeShowDropdown(true)}
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#3d6b2a]/50"
                              />
                              {oneTimeShowDropdown && oneTimeCustomerResults.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto z-50">
                                  {oneTimeCustomerResults.map((customer) => (
                                    <button
                                      key={`${customer.source}-${customer.id}`}
                                      type="button"
                                      onClick={() => {
                                        setOneTimeSelectedCustomer(customer);
                                        setOneTimeState((prev) => ({
                                          ...prev,
                                          customer_id: customer.id,
                                          customer_search: `${customer.first_name} ${customer.last_name}`,
                                        }));
                                        setOneTimeShowDropdown(false);
                                      }}
                                      className="w-full text-left px-4 py-2.5 hover:bg-[#E8F5E3] transition text-sm border-b border-gray-100 last:border-0"
                                    >
                                      <div className="flex justify-between items-start">
                                        <span className="font-medium text-gray-900">{customer.first_name} {customer.last_name}</span>
                                        <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                                          customer.source === 'user_profile' ? 'bg-green-50 text-green-700' :
                                          (customer as any).contact_type === 'customer' ? 'bg-blue-50 text-blue-700' :
                                          (customer as any).contact_type === 'lead' ? 'bg-amber-50 text-amber-700' :
                                          'bg-gray-100 text-[#9a9080]'
                                        }`}>
                                          {customer.source === 'user_profile' ? 'User' :
                                           (customer as any).contact_type ? (customer as any).contact_type.charAt(0).toUpperCase() + (customer as any).contact_type.slice(1) : 'Contact'}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-[#9a9080] text-xs">{customer.email}</span>
                                        {customer.phone && <span className="text-[#7a7060] text-xs">· {customer.phone}</span>}
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                            {oneTimeSearchLoading && <p className="text-xs text-[#7a7060]">Searching...</p>}
                            <button
                              type="button"
                              onClick={() => setOneTimeState((prev) => ({ ...prev, is_new_customer: true }))}
                              className="text-sm text-[#3d6b2a] hover:text-[#2f5720] font-medium"
                            >
                              + Create New Customer
                            </button>
                          </>
                        ) : (
                          <div className="bg-[#E8F5E3] border border-[#3d6b2a]/20 rounded-xl px-4 py-3">
                            <p className="text-sm font-medium text-gray-900">
                              {oneTimeSelectedCustomer.first_name} {oneTimeSelectedCustomer.last_name}
                            </p>
                            <p className="text-xs text-[#9a9080]">{oneTimeSelectedCustomer.email}</p>
                            <button
                              type="button"
                              onClick={() => {
                                setOneTimeSelectedCustomer(null);
                                setOneTimeState((prev) => ({
                                  ...prev,
                                  customer_id: "",
                                  customer_search: "",
                                }));
                              }}
                              className="text-xs text-[#3d6b2a] hover:text-[#2f5720] font-medium mt-2"
                            >
                              Change customer
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <input
                          type="text"
                          placeholder="First Name"
                          value={oneTimeState.new_customer_first_name}
                          onChange={(e) =>
                            setOneTimeState((prev) => ({
                              ...prev,
                              new_customer_first_name: e.target.value,
                            }))
                          }
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#3d6b2a]/50"
                        />
                        <input
                          type="text"
                          placeholder="Last Name"
                          value={oneTimeState.new_customer_last_name}
                          onChange={(e) =>
                            setOneTimeState((prev) => ({
                              ...prev,
                              new_customer_last_name: e.target.value,
                            }))
                          }
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#3d6b2a]/50"
                        />
                        <input
                          type="email"
                          placeholder="Email"
                          value={oneTimeState.new_customer_email}
                          onChange={(e) =>
                            setOneTimeState((prev) => ({
                              ...prev,
                              new_customer_email: e.target.value,
                            }))
                          }
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#3d6b2a]/50"
                        />
                        <input
                          type="tel"
                          placeholder="Phone"
                          value={oneTimeState.new_customer_phone}
                          onChange={(e) =>
                            setOneTimeState((prev) => ({
                              ...prev,
                              new_customer_phone: e.target.value,
                            }))
                          }
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#3d6b2a]/50"
                        />
                        <button
                          type="button"
                          onClick={() => setOneTimeState((prev) => ({ ...prev, is_new_customer: false }))}
                          className="text-sm text-[#3d6b2a] hover:text-[#2f5720] font-medium"
                        >
                          Search Existing Customer
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Fulfillment Section */}
                  <div className="space-y-4">
                    <h3 className="text-[#9a9080] text-sm font-semibold uppercase tracking-wide">Fulfillment</h3>
                    <div className="space-y-2">
                      <label className="text-gray-700 text-sm font-medium">Type</label>
                      <select
                        value={oneTimeState.fulfillment_type}
                        onChange={(e) =>
                          setOneTimeState((prev) => ({
                            ...prev,
                            fulfillment_type: e.target.value as "pickup" | "delivery",
                          }))
                        }
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 focus:outline-none focus:border-[#3d6b2a]/50"
                      >
                        <option value="pickup">Hot Pickup</option>
                        <option value="cold_pickup">Cold Pickup</option>
                        <option value="delivery">Delivery</option>
                      </select>
                    </div>

                    {oneTimeState.fulfillment_type === "delivery" && (
                      <div className="space-y-3 pt-2">
                        <input
                          type="text"
                          placeholder="Street Address"
                          value={oneTimeState.delivery_street}
                          onChange={(e) =>
                            setOneTimeState((prev) => ({
                              ...prev,
                              delivery_street: e.target.value,
                            }))
                          }
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#3d6b2a]/50"
                        />
                        <div className="grid grid-cols-3 gap-3">
                          <input
                            type="text"
                            placeholder="City"
                            value={oneTimeState.delivery_city}
                            onChange={(e) =>
                              setOneTimeState((prev) => ({
                                ...prev,
                                delivery_city: e.target.value,
                              }))
                            }
                            className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#3d6b2a]/50"
                          />
                          <input
                            type="text"
                            placeholder="State"
                            value={oneTimeState.delivery_state}
                            onChange={(e) =>
                              setOneTimeState((prev) => ({
                                ...prev,
                                delivery_state: e.target.value,
                              }))
                            }
                            className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#3d6b2a]/50"
                          />
                          <input
                            type="text"
                            placeholder="ZIP"
                            value={oneTimeState.delivery_zip}
                            onChange={(e) =>
                              setOneTimeState((prev) => ({
                                ...prev,
                                delivery_zip: e.target.value,
                              }))
                            }
                            className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#3d6b2a]/50"
                          />
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div>
                        <label className="text-gray-700 text-sm font-medium">Date</label>
                        <input
                          type="date"
                          value={oneTimeState.pickup_delivery_date}
                          onChange={(e) =>
                            setOneTimeState((prev) => ({
                              ...prev,
                              pickup_delivery_date: e.target.value,
                            }))
                          }
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 focus:outline-none focus:border-[#3d6b2a]/50"
                        />
                      </div>
                      <div>
                        <label className="text-gray-700 text-sm font-medium">Time</label>
                        <input
                          type="time"
                          value={oneTimeState.pickup_delivery_time}
                          onChange={(e) =>
                            setOneTimeState((prev) => ({
                              ...prev,
                              pickup_delivery_time: e.target.value,
                            }))
                          }
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 focus:outline-none focus:border-[#3d6b2a]/50"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Items Section */}
                  <div className="space-y-4">
                    <h3 className="text-[#9a9080] text-sm font-semibold uppercase tracking-wide">Items</h3>
                    <div className="relative">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Search recipes..."
                          value={recipeSearch}
                          onChange={(e) => setRecipeSearch(e.target.value)}
                          onFocus={() => setShowRecipeDropdown(true)}
                          className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#3d6b2a]/50"
                        />
                      </div>

                      {showRecipeDropdown && filteredRecipes.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 max-h-48 overflow-y-auto">
                          {filteredRecipes.map((recipe) => (
                            <button
                              key={recipe.id}
                              type="button"
                              onClick={() => handleAddRecipeItem(recipe)}
                              className="w-full text-left px-4 py-2.5 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 text-sm"
                            >
                              <div className="font-medium text-gray-900">{recipe.name}</div>
                              <div className="text-[#9a9080] text-xs">${recipe.base_price.toFixed(2)}</div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Order Items List */}
                    {oneTimeState.order_items.length > 0 && (
                      <div className="space-y-2">
                        {oneTimeState.order_items.map((item, index) => (
                          <div key={index} className="flex gap-2 items-end p-3 bg-gray-50 rounded-xl">
                            <div className="flex-1">
                              <label className="text-xs text-[#9a9080] font-medium">Item</label>
                              <div className="text-sm font-medium text-gray-900">{item.recipe_name}</div>
                            </div>
                            <div className="w-20">
                              <label className="text-xs text-[#9a9080] font-medium">Qty</label>
                              <input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => handleUpdateOrderItem(index, "quantity", e.target.value)}
                                className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-gray-900 focus:outline-none focus:border-[#3d6b2a]/50"
                              />
                            </div>
                            <div className="w-24">
                              <label className="text-xs text-[#9a9080] font-medium">Price</label>
                              <input
                                type="number"
                                step="0.01"
                                value={item.unit_price}
                                onChange={(e) => handleUpdateOrderItem(index, "unit_price", e.target.value)}
                                className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-gray-900 focus:outline-none focus:border-[#3d6b2a]/50"
                              />
                            </div>
                            <div className="w-24">
                              <label className="text-xs text-[#9a9080] font-medium">Total</label>
                              <div className="text-sm font-semibold text-gray-900">${item.total_price.toFixed(2)}</div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveOrderItem(index)}
                              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                            >
                              <Trash2 size={16} className="text-[#9a9080]" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Special Instructions */}
                  <div className="space-y-2">
                    <label className="text-gray-700 text-sm font-medium">Special Instructions</label>
                    <textarea
                      placeholder="Any special instructions or dietary notes..."
                      value={oneTimeState.special_instructions}
                      onChange={(e) =>
                        setOneTimeState((prev) => ({
                          ...prev,
                          special_instructions: e.target.value,
                        }))
                      }
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#3d6b2a]/50 resize-none h-20"
                    />
                  </div>

                  {/* Payment Status */}
                  <div className="space-y-2">
                    <label className="text-gray-700 text-sm font-medium">Payment Status</label>
                    <select
                      value={oneTimeState.payment_status}
                      onChange={(e) =>
                        setOneTimeState((prev) => ({
                          ...prev,
                          payment_status: e.target.value as "pending" | "paid" | "comp",
                        }))
                      }
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 focus:outline-none focus:border-[#3d6b2a]/50"
                    >
                      <option value="pending">Pending</option>
                      <option value="paid">Paid</option>
                      <option value="comp">Comp (Free)</option>
                    </select>
                  </div>

                  {/* Order Totals */}
                  <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-[#9a9080]">Subtotal</span>
                      <span className="text-gray-900 font-medium">${totals.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#9a9080]">Tax (8.5%)</span>
                      <span className="text-gray-900 font-medium">${totals.tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#9a9080]">Delivery Fee</span>
                      <span className="text-gray-900 font-medium">${totals.deliveryFee.toFixed(2)}</span>
                    </div>
                    <div className="border-t border-gray-200 pt-2 flex justify-between">
                      <span className="text-gray-900 font-semibold">Total</span>
                      <span className="text-gray-900 font-bold text-lg">${totals.total.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="space-y-2">
                    <label className="text-gray-700 text-sm font-medium">Notes</label>
                    <textarea
                      placeholder="Internal notes..."
                      value={oneTimeState.notes}
                      onChange={(e) =>
                        setOneTimeState((prev) => ({
                          ...prev,
                          notes: e.target.value,
                        }))
                      }
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#3d6b2a]/50 resize-none h-20"
                    />
                  </div>
                </div>
              )}

              {/* ============ SUBSCRIPTION ============ */}
              {activeTab === "subscription" && (
                <div className="space-y-6">
                  {/* Customer Section */}
                  <div className="space-y-4">
                    <h3 className="text-[#9a9080] text-sm font-semibold uppercase tracking-wide">Customer</h3>
                    {!subscriptionSelectedCustomer ? (
                      <div className="space-y-2">
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Search by email or name..."
                            value={subscriptionState.customer_search}
                            onChange={(e) =>
                              setSubscriptionState((prev) => ({
                                ...prev,
                                customer_search: e.target.value,
                              }))
                            }
                            onFocus={() => subscriptionState.customer_search.length >= 2 && setSubscriptionShowDropdown(true)}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#3d6b2a]/50"
                          />
                          {subscriptionShowDropdown && subscriptionCustomerResults.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto z-50">
                              {subscriptionCustomerResults.map((customer) => (
                                <button
                                  key={`${customer.source}-${customer.id}`}
                                  type="button"
                                  onClick={() => {
                                    setSubscriptionSelectedCustomer(customer);
                                    setSubscriptionState((prev) => ({
                                      ...prev,
                                      customer_id: customer.id,
                                      customer_search: `${customer.first_name} ${customer.last_name}`,
                                    }));
                                    setSubscriptionShowDropdown(false);
                                  }}
                                  className="w-full text-left px-4 py-2.5 hover:bg-[#E8F5E3] transition text-sm border-b border-gray-100 last:border-0"
                                >
                                  <div className="flex justify-between items-start">
                                    <span className="font-medium text-gray-900">{customer.first_name} {customer.last_name}</span>
                                    <span className="text-xs text-[#7a7060]">{customer.source === 'contact' ? 'Contact' : 'User'}</span>
                                  </div>
                                  <span className="text-[#9a9080] text-xs">{customer.email}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        {subscriptionSearchLoading && <p className="text-xs text-[#7a7060]">Searching...</p>}
                        <button
                          type="button"
                          onClick={() => setSubscriptionState((prev) => ({ ...prev, is_new_customer: true }))}
                          className="text-sm text-[#3d6b2a] hover:text-[#2f5720] font-medium"
                        >
                          + Create New Customer
                        </button>
                      </div>
                    ) : subscriptionState.is_new_customer ? (
                      <div className="space-y-3">
                        <input
                          type="text"
                          placeholder="First Name"
                          value={subscriptionState.new_customer_first_name}
                          onChange={(e) =>
                            setSubscriptionState((prev) => ({
                              ...prev,
                              new_customer_first_name: e.target.value,
                            }))
                          }
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#3d6b2a]/50"
                        />
                        <input
                          type="text"
                          placeholder="Last Name"
                          value={subscriptionState.new_customer_last_name}
                          onChange={(e) =>
                            setSubscriptionState((prev) => ({
                              ...prev,
                              new_customer_last_name: e.target.value,
                            }))
                          }
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#3d6b2a]/50"
                        />
                        <input
                          type="email"
                          placeholder="Email"
                          value={subscriptionState.new_customer_email}
                          onChange={(e) =>
                            setSubscriptionState((prev) => ({
                              ...prev,
                              new_customer_email: e.target.value,
                            }))
                          }
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#3d6b2a]/50"
                        />
                        <input
                          type="tel"
                          placeholder="Phone"
                          value={subscriptionState.new_customer_phone}
                          onChange={(e) =>
                            setSubscriptionState((prev) => ({
                              ...prev,
                              new_customer_phone: e.target.value,
                            }))
                          }
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#3d6b2a]/50"
                        />
                        <button
                          type="button"
                          onClick={() => setSubscriptionState((prev) => ({ ...prev, is_new_customer: false }))}
                          className="text-sm text-[#3d6b2a] hover:text-[#2f5720] font-medium"
                        >
                          Search Existing Customer
                        </button>
                      </div>
                    ) : (
                      <div className="bg-[#E8F5E3] border border-[#3d6b2a]/20 rounded-xl px-4 py-3">
                        <p className="text-sm font-medium text-gray-900">
                          {subscriptionSelectedCustomer.first_name} {subscriptionSelectedCustomer.last_name}
                        </p>
                        <p className="text-xs text-[#9a9080]">{subscriptionSelectedCustomer.email}</p>
                        <button
                          type="button"
                          onClick={() => {
                            setSubscriptionSelectedCustomer(null);
                            setSubscriptionState((prev) => ({
                              ...prev,
                              customer_id: "",
                              customer_search: "",
                            }));
                          }}
                          className="text-xs text-[#3d6b2a] hover:text-[#2f5720] font-medium mt-2"
                        >
                          Change customer
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Plan & Dates */}
                  <div className="space-y-4">
                    <h3 className="text-[#9a9080] text-sm font-semibold uppercase tracking-wide">Plan Details</h3>
                    <div className="space-y-2">
                      <label className="text-gray-700 text-sm font-medium">Subscription Plan</label>
                      <select
                        value={subscriptionState.plan_id}
                        onChange={(e) =>
                          setSubscriptionState((prev) => ({
                            ...prev,
                            plan_id: e.target.value,
                          }))
                        }
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 focus:outline-none focus:border-[#3d6b2a]/50"
                      >
                        <option value="">Select a plan</option>
                        {subscriptionPlans.map((plan) => (
                          <option key={plan.id} value={plan.id}>
                            {plan.name} - {plan.meals_per_week} meals/week
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-gray-700 text-sm font-medium">Start Date</label>
                        <input
                          type="date"
                          value={subscriptionState.start_date}
                          onChange={(e) =>
                            setSubscriptionState((prev) => ({
                              ...prev,
                              start_date: e.target.value,
                            }))
                          }
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 focus:outline-none focus:border-[#3d6b2a]/50"
                        />
                      </div>
                      <div>
                        <label className="text-gray-700 text-sm font-medium">Delivery Day</label>
                        <select
                          value={subscriptionState.delivery_day}
                          onChange={(e) =>
                            setSubscriptionState((prev) => ({
                              ...prev,
                              delivery_day: e.target.value,
                            }))
                          }
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 focus:outline-none focus:border-[#3d6b2a]/50"
                        >
                          <option value="monday">Monday</option>
                          <option value="tuesday">Tuesday</option>
                          <option value="wednesday">Wednesday</option>
                          <option value="thursday">Thursday</option>
                          <option value="friday">Friday</option>
                          <option value="saturday">Saturday</option>
                          <option value="sunday">Sunday</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Fulfillment */}
                  <div className="space-y-4">
                    <h3 className="text-[#9a9080] text-sm font-semibold uppercase tracking-wide">Fulfillment</h3>
                    <div className="space-y-2">
                      <label className="text-gray-700 text-sm font-medium">Type</label>
                      <select
                        value={subscriptionState.fulfillment_type}
                        onChange={(e) =>
                          setSubscriptionState((prev) => ({
                            ...prev,
                            fulfillment_type: e.target.value as "pickup" | "delivery",
                          }))
                        }
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 focus:outline-none focus:border-[#3d6b2a]/50"
                      >
                        <option value="delivery">Delivery</option>
                        <option value="pickup">Pickup</option>
                      </select>
                    </div>

                    {subscriptionState.fulfillment_type === "delivery" && (
                      <div className="space-y-3 pt-2">
                        <input
                          type="text"
                          placeholder="Street Address"
                          value={subscriptionState.delivery_street}
                          onChange={(e) =>
                            setSubscriptionState((prev) => ({
                              ...prev,
                              delivery_street: e.target.value,
                            }))
                          }
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#3d6b2a]/50"
                        />
                        <div className="grid grid-cols-3 gap-3">
                          <input
                            type="text"
                            placeholder="City"
                            value={subscriptionState.delivery_city}
                            onChange={(e) =>
                              setSubscriptionState((prev) => ({
                                ...prev,
                                delivery_city: e.target.value,
                              }))
                            }
                            className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#3d6b2a]/50"
                          />
                          <input
                            type="text"
                            placeholder="State"
                            value={subscriptionState.delivery_state}
                            onChange={(e) =>
                              setSubscriptionState((prev) => ({
                                ...prev,
                                delivery_state: e.target.value,
                              }))
                            }
                            className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#3d6b2a]/50"
                          />
                          <input
                            type="text"
                            placeholder="ZIP"
                            value={subscriptionState.delivery_zip}
                            onChange={(e) =>
                              setSubscriptionState((prev) => ({
                                ...prev,
                                delivery_zip: e.target.value,
                              }))
                            }
                            className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#3d6b2a]/50"
                          />
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div>
                        <label className="text-gray-700 text-sm font-medium">Meals per Week</label>
                        <input
                          type="number"
                          min="1"
                          value={subscriptionState.meals_per_week}
                          readOnly
                          className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-700 cursor-not-allowed"
                        />
                        <p className="text-xs text-[#9a9080] mt-1">Auto-populated from selected plan</p>
                      </div>
                      <div>
                        <label className="text-gray-700 text-sm font-medium">Payment Frequency</label>
                        <select
                          value={subscriptionState.payment_frequency}
                          disabled
                          className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-700 cursor-not-allowed"
                        >
                          <option value="weekly">Weekly</option>
                          <option value="monthly">Monthly</option>
                        </select>
                        <p className="text-xs text-[#9a9080] mt-1">Auto-populated from selected plan</p>
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="space-y-2">
                    <label className="text-gray-700 text-sm font-medium">Notes</label>
                    <textarea
                      placeholder="Internal notes..."
                      value={subscriptionState.notes}
                      onChange={(e) =>
                        setSubscriptionState((prev) => ({
                          ...prev,
                          notes: e.target.value,
                        }))
                      }
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#3d6b2a]/50 resize-none h-20"
                    />
                  </div>
                </div>
              )}

              {/* ============ CATERING ============ */}
              {activeTab === "catering" && (
                <div className="space-y-6">
                  {/* Contact Info */}
                  <div className="space-y-4">
                    <h3 className="text-[#9a9080] text-sm font-semibold uppercase tracking-wide">Contact Information</h3>
                    <input
                      type="text"
                      placeholder="Customer/Company Name"
                      value={cateringState.company_name}
                      onChange={(e) =>
                        setCateringState((prev) => ({
                          ...prev,
                          company_name: e.target.value,
                        }))
                      }
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#3d6b2a]/50"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="Contact First Name"
                        value={cateringState.contact_first_name}
                        onChange={(e) =>
                          setCateringState((prev) => ({
                            ...prev,
                            contact_first_name: e.target.value,
                          }))
                        }
                        className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#3d6b2a]/50"
                      />
                      <input
                        type="text"
                        placeholder="Contact Last Name"
                        value={cateringState.contact_last_name}
                        onChange={(e) =>
                          setCateringState((prev) => ({
                            ...prev,
                            contact_last_name: e.target.value,
                          }))
                        }
                        className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#3d6b2a]/50"
                      />
                    </div>
                    <input
                      type="email"
                      placeholder="Email"
                      value={cateringState.contact_email}
                      onChange={(e) =>
                        setCateringState((prev) => ({
                          ...prev,
                          contact_email: e.target.value,
                        }))
                      }
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#3d6b2a]/50"
                    />
                    <input
                      type="tel"
                      placeholder="Phone"
                      value={cateringState.contact_phone}
                      onChange={(e) =>
                        setCateringState((prev) => ({
                          ...prev,
                          contact_phone: e.target.value,
                        }))
                      }
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#3d6b2a]/50"
                    />
                  </div>

                  {/* Event Details */}
                  <div className="space-y-4">
                    <h3 className="text-[#9a9080] text-sm font-semibold uppercase tracking-wide">Event Details</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-gray-700 text-sm font-medium">Event Date</label>
                        <input
                          type="date"
                          value={cateringState.event_date}
                          onChange={(e) =>
                            setCateringState((prev) => ({
                              ...prev,
                              event_date: e.target.value,
                            }))
                          }
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 focus:outline-none focus:border-[#3d6b2a]/50"
                        />
                      </div>
                      <div>
                        <label className="text-gray-700 text-sm font-medium">Event Time</label>
                        <input
                          type="time"
                          value={cateringState.event_time}
                          onChange={(e) =>
                            setCateringState((prev) => ({
                              ...prev,
                              event_time: e.target.value,
                            }))
                          }
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 focus:outline-none focus:border-[#3d6b2a]/50"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-gray-700 text-sm font-medium">Event Type</label>
                      <select
                        value={cateringState.event_type}
                        onChange={(e) =>
                          setCateringState((prev) => ({
                            ...prev,
                            event_type: e.target.value as any,
                          }))
                        }
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 focus:outline-none focus:border-[#3d6b2a]/50"
                      >
                        <option value="corporate">Corporate</option>
                        <option value="wedding">Wedding</option>
                        <option value="birthday">Birthday</option>
                        <option value="private_party">Private Party</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-gray-700 text-sm font-medium">Min Guest Count</label>
                        <input
                          type="number"
                          min="1"
                          value={cateringState.guest_count_min}
                          onChange={(e) =>
                            setCateringState((prev) => ({
                              ...prev,
                              guest_count_min: e.target.value,
                            }))
                          }
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#3d6b2a]/50"
                        />
                      </div>
                      <div>
                        <label className="text-gray-700 text-sm font-medium">Max Guest Count</label>
                        <input
                          type="number"
                          min="1"
                          value={cateringState.guest_count_max}
                          onChange={(e) =>
                            setCateringState((prev) => ({
                              ...prev,
                              guest_count_max: e.target.value,
                            }))
                          }
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#3d6b2a]/50"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Venue */}
                  <div className="space-y-4">
                    <h3 className="text-[#9a9080] text-sm font-semibold uppercase tracking-wide">Venue Address</h3>
                    <input
                      type="text"
                      placeholder="Street Address"
                      value={cateringState.venue_street}
                      onChange={(e) =>
                        setCateringState((prev) => ({
                          ...prev,
                          venue_street: e.target.value,
                        }))
                      }
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#3d6b2a]/50"
                    />
                    <div className="grid grid-cols-3 gap-3">
                      <input
                        type="text"
                        placeholder="City"
                        value={cateringState.venue_city}
                        onChange={(e) =>
                          setCateringState((prev) => ({
                            ...prev,
                            venue_city: e.target.value,
                          }))
                        }
                        className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#3d6b2a]/50"
                      />
                      <input
                        type="text"
                        placeholder="State"
                        value={cateringState.venue_state}
                        onChange={(e) =>
                          setCateringState((prev) => ({
                            ...prev,
                            venue_state: e.target.value,
                          }))
                        }
                        className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#3d6b2a]/50"
                      />
                      <input
                        type="text"
                        placeholder="ZIP"
                        value={cateringState.venue_zip}
                        onChange={(e) =>
                          setCateringState((prev) => ({
                            ...prev,
                            venue_zip: e.target.value,
                          }))
                        }
                        className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#3d6b2a]/50"
                      />
                    </div>
                  </div>

                  {/* Dietary & Package */}
                  <div className="space-y-4">
                    <h3 className="text-[#9a9080] text-sm font-semibold uppercase tracking-wide">Dietary & Package</h3>
                    <div className="space-y-2">
                      <label className="text-gray-700 text-sm font-medium">Dietary Requirements</label>
                      <div className="space-y-2">
                        {["vegan", "vegetarian", "gluten-free", "dairy-free", "halal", "kosher"].map((diet) => (
                          <label key={diet} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={cateringState.dietary_requirements.includes(diet)}
                              onChange={(e) => {
                                setCateringState((prev) => ({
                                  ...prev,
                                  dietary_requirements: e.target.checked
                                    ? [...prev.dietary_requirements, diet]
                                    : prev.dietary_requirements.filter((d) => d !== diet),
                                }));
                              }}
                              className="w-4 h-4 rounded border-gray-300"
                            />
                            <span className="text-sm text-gray-700 capitalize">{diet}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-gray-700 text-sm font-medium">Budget Range</label>
                      <select
                        value={cateringState.budget_range}
                        onChange={(e) =>
                          setCateringState((prev) => ({
                            ...prev,
                            budget_range: e.target.value,
                          }))
                        }
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 focus:outline-none focus:border-[#3d6b2a]/50"
                      >
                        <option value="">Select budget range</option>
                        <option value="500-1000">$500 - $1,000</option>
                        <option value="1000-2500">$1,000 - $2,500</option>
                        <option value="2500-5000">$2,500 - $5,000</option>
                        <option value="5000-10000">$5,000 - $10,000</option>
                        <option value="10000+">$10,000+</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-gray-700 text-sm font-medium">Package Type</label>
                      <select
                        value={cateringState.package_type}
                        onChange={(e) =>
                          setCateringState((prev) => ({
                            ...prev,
                            package_type: e.target.value as any,
                          }))
                        }
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 focus:outline-none focus:border-[#3d6b2a]/50"
                      >
                        <option value="buffet_style">Buffet Style</option>
                        <option value="individual_boxes">Individual Boxes</option>
                        <option value="family_style">Family Style</option>
                        <option value="custom">Custom</option>
                      </select>
                    </div>
                  </div>

                  {/* Special Requests & Services */}
                  <div className="space-y-4">
                    <h3 className="text-[#9a9080] text-sm font-semibold uppercase tracking-wide">Services & Preferences</h3>
                    <textarea
                      placeholder="Menu preferences and special requests..."
                      value={cateringState.menu_preferences}
                      onChange={(e) =>
                        setCateringState((prev) => ({
                          ...prev,
                          menu_preferences: e.target.value,
                        }))
                      }
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#3d6b2a]/50 resize-none h-20"
                    />

                    <div className="space-y-2">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={cateringState.setup_cleanup}
                          onChange={(e) =>
                            setCateringState((prev) => ({
                              ...prev,
                              setup_cleanup: e.target.checked,
                            }))
                          }
                          className="w-4 h-4 rounded border-gray-300"
                        />
                        <span className="text-sm text-gray-700">Setup & Cleanup Needed</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={cateringState.staff_needed}
                          onChange={(e) =>
                            setCateringState((prev) => ({
                              ...prev,
                              staff_needed: e.target.checked,
                            }))
                          }
                          className="w-4 h-4 rounded border-gray-300"
                        />
                        <span className="text-sm text-gray-700">Staff Needed</span>
                      </label>
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="space-y-2">
                    <label className="text-gray-700 text-sm font-medium">Notes</label>
                    <textarea
                      placeholder="Internal notes..."
                      value={cateringState.notes}
                      onChange={(e) =>
                        setCateringState((prev) => ({
                          ...prev,
                          notes: e.target.value,
                        }))
                      }
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#3d6b2a]/50 resize-none h-20"
                    />
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end border-t border-gray-200 pt-6">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-[#3d6b2a] text-white rounded-xl hover:bg-[#2f5720] disabled:opacity-50 transition-colors font-medium"
                >
                  {isSubmitting ? "Creating..." : "Create Order"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
