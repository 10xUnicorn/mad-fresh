// ═══════════════════════════════════════════
// Mad Fresh Kitchen — Database Types
// Auto-maps to Supabase schema
// ═══════════════════════════════════════════

// ── Enums ──
export type UserRole = 'super_admin' | 'admin' | 'manager' | 'staff' | 'driver' | 'customer';
export type OrderType = 'individual' | 'catering' | 'subscription' | 'event';
export type FulfillmentType = 'pickup' | 'delivery';
export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'completed' | 'cancelled' | 'refunded';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded' | 'partially_refunded';
export type SubscriptionStatus = 'active' | 'paused' | 'cancelled' | 'expired' | 'past_due';
export type BillingInterval = 'weekly' | 'monthly' | 'annual';
export type IngredientCategory = 'protein' | 'grain' | 'vegetable' | 'sauce' | 'topping' | 'side' | 'addon';
export type RecipeCategory = 'bowl' | 'wrap' | 'salad' | 'side' | 'drink' | 'dessert' | 'snack' | 'custom';
export type CuisineType = 'asian' | 'italian' | 'bbq' | 'mexican' | 'american' | 'mediterranean' | 'fusion' | 'mixed' | 'other';
export type UnitType = 'oz' | 'lb' | 'g' | 'kg' | 'each' | 'cup' | 'tbsp' | 'tsp';
export type StorageType = 'refrigerated' | 'frozen' | 'dry' | 'ambient';
export type CateringStatus = 'inquiry' | 'quoted' | 'deposit_paid' | 'confirmed' | 'preparing' | 'delivered' | 'completed' | 'cancelled';
export type SetupType = 'casual_buffet' | 'premium_plated' | 'individual_bowls' | 'drop_off';
export type EventStatus = 'draft' | 'published' | 'sold_out' | 'cancelled' | 'completed';
export type RsvpStatus = 'confirmed' | 'cancelled' | 'waitlisted' | 'checked_in';
export type InventoryStatus = 'in_stock' | 'low_stock' | 'out_of_stock' | 'on_order';
export type InventoryTransactionType = 'purchase' | 'usage' | 'waste' | 'adjustment' | 'count';
export type ExpenseCategory = 'ingredients' | 'labor' | 'rent' | 'utilities' | 'equipment' | 'marketing' | 'insurance' | 'licenses' | 'packaging' | 'delivery' | 'other';
export type NotificationType = 'push' | 'email' | 'sms' | 'in_app';
export type NotificationCategory = 'order_update' | 'subscription' | 'promotion' | 'event' | 'referral' | 'donation' | 'system';
export type CampaignType = 'push' | 'email' | 'sms';
export type CampaignStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'cancelled';
export type PromotionType = 'percentage' | 'fixed_amount' | 'free_item' | 'bogo' | 'free_delivery' | 'first_order_free';
export type ContactSource = 'app_signup' | 'website' | 'event_rsvp' | 'waitlist' | 'newsletter' | 'referral' | 'catering_inquiry' | 'import';
export type ContactType = 'lead' | 'customer' | 'vendor';
export type DonationType = 'percentage_of_order' | 'flat_amount' | 'meal_add_on' | 'subscription_transfer';
export type DonationStatus = 'collected' | 'allocated' | 'prepared' | 'delivered';
export type FoodPersonalityType = 'balanced_betty' | 'balanced_brad' | 'beefy_bro' | 'beefy_bella' | 'clean_machine' | 'social_foodie' | 'plant_power';
export type Gender = 'male' | 'female' | 'non_binary' | 'prefer_not_to_say';
export type FitnessGoal = 'weight_loss' | 'muscle_gain' | 'maintenance' | 'athletic_performance' | 'eat_healthy';
export type PlatformPlan = 'starter' | 'pro' | 'enterprise';
export type PlatformStatus = 'active' | 'trial' | 'suspended' | 'cancelled';
export type ReferralStatus = 'pending' | 'completed' | 'rewarded' | 'expired';
export type PurchaseOrderStatus = 'draft' | 'submitted' | 'confirmed' | 'received' | 'cancelled';
export type DayOfWeek = 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday';

// ── Core Tables ──

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  website_url: string | null;
  support_email: string | null;
  support_phone: string | null;
  timezone: string;
  currency: string;
  subscription_plan: PlatformPlan;
  subscription_status: PlatformStatus;
  trial_ends_at: string | null;
  stripe_account_id: string | null;
  settings: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Store {
  id: string;
  organization_id: string;
  name: string;
  slug: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  email: string | null;
  operating_hours: Record<string, { open: string; close: string }>;
  delivery_radius_miles: number | null;
  delivery_fee: number;
  free_delivery_minimum: number | null;
  pickup_enabled: boolean;
  delivery_enabled: boolean;
  delivery_days: DayOfWeek[];
  tax_rate: number;
  is_active: boolean;
  hero_image_url: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  phone: string | null;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  avatar_url: string | null;
  date_of_birth: string | null;
  gender: Gender | null;
  dietary_preferences: string[];
  allergens: string[];
  food_personality_type: FoodPersonalityType | null;
  food_personality_data: Record<string, unknown> | null;
  fitness_goals: FitnessGoal | null;
  default_address_id: string | null;
  notification_preferences: { push: boolean; email: boolean; sms: boolean; marketing: boolean };
  referral_code: string;
  referred_by_user_id: string | null;
  total_meals_donated: number;
  stripe_customer_id: string | null;
  is_newsletter_subscribed: boolean;
  is_waitlist_member: boolean;
  last_active_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserAddress {
  id: string;
  user_id: string;
  label: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  zip_code: string;
  latitude: number | null;
  longitude: number | null;
  delivery_instructions: string | null;
  is_default: boolean;
}

export interface UserRoleAssignment {
  id: string;
  user_id: string;
  organization_id: string;
  store_id: string | null;
  role: UserRole;
  permissions: Record<string, boolean>;
  is_active: boolean;
  invited_by: string | null;
  invited_at: string;
  accepted_at: string | null;
}

export interface Ingredient {
  id: string;
  store_id: string;
  name: string;
  category: IngredientCategory;
  description: string | null;
  image_url: string | null;
  cost_per_unit: number;
  unit_type: UnitType;
  calories_per_unit: number;
  protein_per_unit: number;
  carbs_per_unit: number;
  fat_per_unit: number;
  fiber_per_unit: number;
  sodium_per_unit: number;
  sugar_per_unit: number;
  cholesterol_per_unit: number;
  saturated_fat_per_unit: number;
  trans_fat_per_unit: number;
  allergens: string[];
  is_organic: boolean;
  is_gluten_free: boolean;
  is_vegan: boolean;
  is_vegetarian: boolean;
  supplier: string | null;
  supplier_sku: string | null;
  par_level: number;
  reorder_quantity: number;
  shelf_life_days: number | null;
  storage_type: StorageType;
  is_available: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Recipe {
  id: string;
  store_id: string;
  name: string;
  slug: string;
  description: string | null;
  category: RecipeCategory;
  cuisine_type: CuisineType;
  image_url: string | null;
  gallery_images: string[];
  base_price: number;
  cost_to_make: number;
  profit_margin: number;
  prep_time_minutes: number | null;
  is_customizable: boolean;
  is_build_your_own: boolean;
  max_included_toppings: number;
  extra_topping_price: number;
  serving_size: string | null;
  is_featured: boolean;
  is_available: boolean;
  is_visible: boolean;
  is_sold_out: boolean;
  is_seasonal: boolean;
  available_start_date: string | null;
  available_end_date: string | null;
  tags: string[];
  dietary_flags: string[];
  spice_level: number;
  servings: number;
  yield_amount: string | null;
  yield_unit: string | null;
  cook_time_minutes: number | null;
  popularity_score: number;
  sort_order: number;
  // Nutrition facts per serving
  calories: number | null;
  protein_grams: number | null;
  carbs_grams: number | null;
  fat_grams: number | null;
  fiber_grams: number | null;
  sodium_mg: number | null;
  sugar_grams: number | null;
  cholesterol_mg: number | null;
  saturated_fat_grams: number | null;
  trans_fat_grams: number | null;
  created_at: string;
  updated_at: string;
}

export interface RecipeIngredient {
  id: string;
  recipe_id: string;
  ingredient_id: string;
  quantity: number;
  unit_type: UnitType;
  is_default: boolean;
  is_removable: boolean;
  is_substitutable: boolean;
  substitute_group: string | null;
  display_name: string | null;
  sort_order: number;
}

export interface RecipeStep {
  id: string;
  recipe_id: string;
  step_number: number;
  instruction: string;
  duration_minutes: number | null;
  tip: string | null;
  created_at: string;
}

export interface RecipePreset {
  id: string;
  recipe_id: string;
  name: string;
  scale_factor: number;
  servings: number;
  notes: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface NutritionLabel {
  id: string;
  recipe_id: string;
  serving_size: string | null;
  calories: number;
  total_fat: number;
  saturated_fat: number;
  trans_fat: number;
  cholesterol: number;
  sodium: number;
  total_carbs: number;
  fiber: number;
  sugar: number;
  protein: number;
  allergens: string[];
  label_pdf_url: string | null;
  is_current: boolean;
  generated_at: string;
}

export interface Order {
  id: string;
  store_id: string;
  customer_id: string;
  subscription_id: string | null;
  order_number: string;
  order_type: OrderType;
  fulfillment_type: FulfillmentType;
  status: OrderStatus;
  items_subtotal: number;
  discount_amount: number;
  discount_code: string | null;
  delivery_fee: number;
  service_fee: number;
  tax_amount: number;
  tip_amount: number;
  donation_amount: number;
  total_amount: number;
  payment_status: PaymentStatus;
  payment_method: string | null;
  stripe_payment_intent_id: string | null;
  delivery_address_id: string | null;
  delivery_instructions: string | null;
  scheduled_for: string | null;
  pickup_time: string | null;
  delivered_at: string | null;
  estimated_prep_time: number | null;
  special_instructions: string | null;
  referral_code_used: string | null;
  source: string;
  is_gift: boolean;
  gift_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  recipe_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  customizations: Array<{ ingredient_id: string; action: 'add' | 'remove' | 'substitute'; price_delta: number }>;
  special_instructions: string | null;
  label_printed: boolean;
  label_data: Record<string, unknown> | null;
}

export interface SubscriptionPlan {
  id: string;
  store_id: string;
  name: string;
  description: string | null;
  meals_per_week: number;
  price_weekly: number;
  price_monthly: number;
  price_annual: number;
  food_personality_types: FoodPersonalityType[];
  dietary_focus: string[];
  is_transferable: boolean;
  is_founding_member_price: boolean;
  founding_member_price_weekly: number | null;
  max_founding_members: number | null;
  is_active: boolean;
  stripe_price_id_weekly: string | null;
  stripe_price_id_monthly: string | null;
  stripe_price_id_annual: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  customer_id: string;
  store_id: string;
  plan_id: string;
  status: SubscriptionStatus;
  billing_interval: BillingInterval;
  current_price: number;
  stripe_subscription_id: string | null;
  start_date: string;
  next_billing_date: string;
  next_delivery_date: string;
  customization_deadline: string;
  default_meals: Record<string, unknown>[];
  delivery_day: DayOfWeek;
  delivery_address_id: string | null;
  paused_until: string | null;
  pause_reason: string | null;
  cancelled_at: string | null;
  cancel_reason: string | null;
  is_founding_member: boolean;
  transferred_to_user_id: string | null;
  transferred_at: string | null;
  created_at: string;
  updated_at: string;
}

export type EventTemplateStyle = 'mad_fresh' | 'fire_smoke' | 'clean_classic';

export interface Event {
  id: string;
  store_id: string;
  name: string;
  slug: string;
  description: string | null;
  description_html: string | null;
  event_date: string;
  start_time: string;
  end_time: string;
  venue_name: string;
  venue_address: string;
  venue_latitude: number | null;
  venue_longitude: number | null;
  max_capacity: number | null;
  current_rsvp_count: number;
  is_free: boolean;
  ticket_price: number | null;
  hero_image_url: string | null;
  cover_image_url: string | null;
  gallery_images: string[];
  rsvp_form_config: Record<string, unknown>;
  collect_meal_preferences: boolean;
  post_rsvp_redirect_url: string | null;
  post_rsvp_page_config: Record<string, unknown>;
  donation_enabled: boolean;
  donation_page_enabled: boolean;
  donation_goal: number;
  donation_qr_code_url: string | null;
  waitlist_enabled: boolean;
  newsletter_enabled: boolean;
  template_style: EventTemplateStyle;
  host_organization: string | null;
  host_logo_url: string | null;
  host_contact_email: string | null;
  host_contact_phone: string | null;
  flyer_pdf_url: string | null;
  tags: string[];
  registration_deadline: string | null;
  is_multi_day: boolean;
  end_date: string | null;
  status: EventStatus;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

export interface EventDonation {
  id: string;
  event_id: string;
  store_id: string;
  donor_name: string | null;
  donor_email: string | null;
  donor_phone: string | null;
  amount: number;
  message: string | null;
  is_anonymous: boolean;
  payment_status: 'pending' | 'completed' | 'failed' | 'refunded';
  stripe_payment_intent_id: string | null;
  created_at: string;
}

export interface EventRsvp {
  id: string;
  event_id: string;
  user_id: string | null;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  guest_count: number;
  meal_preferences: Record<string, unknown> | null;
  dietary_restrictions: string[] | null;
  custom_responses: Record<string, unknown> | null;
  status: RsvpStatus;
  checked_in_at: string | null;
  joined_newsletter: boolean;
  joined_waitlist: boolean;
  donation_amount: number;
  source: string;
  created_at: string;
}

export interface CateringPackage {
  id: string;
  store_id: string;
  name: string;
  description: string | null;
  cuisine_type: CuisineType;
  min_guests: number;
  max_guests: number | null;
  price_per_person: number;
  flat_price: number | null;
  includes: Record<string, unknown>[];
  add_ons: Array<{ name: string; price: number; description: string }>;
  setup_options: Array<{ name: string; price: number; description: string }>;
  image_url: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Donation {
  id: string;
  store_id: string;
  donor_id: string | null;
  order_id: string | null;
  type: DonationType;
  amount: number;
  meals_equivalent: number;
  partner_organization_id: string | null;
  status: DonationStatus;
  delivered_at: string | null;
  delivery_notes: string | null;
  created_at: string;
}

export interface Promotion {
  id: string;
  store_id: string;
  name: string;
  display_title: string;
  description: string | null;
  code: string;
  type: PromotionType;
  value: number;
  min_order_amount: number;
  max_discount_amount: number | null;
  max_uses_total: number | null;
  max_uses_per_user: number;
  current_uses: number;
  applies_to: string;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  show_on_website: boolean;
  banner_image_url: string | null;
  is_referral_reward: boolean;
  is_founding_member: boolean;
  created_at: string;
  updated_at: string;
}

export interface PaymentSettings {
  id: string;
  store_id: string;
  provider: string;
  stripe_account_id: string | null;
  stripe_publishable_key: string | null;
  stripe_secret_key_encrypted: string | null;
  stripe_webhook_secret_encrypted: string | null;
  currency: string;
  tax_rate: number;
  delivery_fee: number;
  free_delivery_minimum: number | null;
  tip_enabled: boolean;
  tip_presets: number[];
  auto_capture: boolean;
  statement_descriptor: string | null;
  is_live_mode: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ── Bowl Customization ──

export interface BowlCustomizationCategory {
  id: string;
  store_id: string;
  name: string;
  slug: string;
  description: string | null;
  min_selections: number;
  max_selections: number;
  is_required: boolean;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BowlCustomizationItem {
  id: string;
  category_id: string;
  ingredient_id: string;
  display_name: string | null;
  upcharge: number;
  is_default: boolean;
  is_premium: boolean;
  calories_override: number | null;
  is_available: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  // Joined
  ingredient?: Ingredient;
}

export interface Contact {
  id: string;
  store_id: string;
  user_id: string | null;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  source: ContactSource;
  contact_type: ContactType | null;
  tags: string[];
  total_orders: number;
  total_spent: number;
  last_order_date: string | null;
  has_active_subscription: boolean;
  is_newsletter_subscribed: boolean;
  is_waitlist_member: boolean;
  events_attended: number;
  referrals_made: number;
  meals_donated: number;
  food_personality_type: FoodPersonalityType | null;
  notes: string | null;
  last_contacted_at: string | null;
  lead_score: number;
  created_at: string;
  updated_at: string;
}
