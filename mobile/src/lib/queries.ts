import { supabase } from './supabase';

const STORE_ID = 'b0000000-0000-0000-0000-000000000001';

export async function fetchDashboardData(userId: string) {
  const [profileRes, streakRes, pointsRes, levelRes, achievementsRes, ordersRes, subscriptionRes] =
    await Promise.all([
      supabase.from('user_profiles').select('first_name, referral_code, total_meals_donated, food_personality_type').eq('id', userId).single(),
      supabase.from('customer_streaks').select('current_streak, longest_streak, streak_frozen').eq('user_id', userId).single(),
      supabase.from('reward_points').select('points').eq('user_id', userId).single(),
      supabase.from('customer_levels').select('level, lifetime_orders, lifetime_spend, lifetime_referrals').eq('user_id', userId).single(),
      supabase.from('customer_achievements').select('achievement_key').eq('user_id', userId),
      supabase.from('orders').select('id, order_number, status, total_amount, payment_status, created_at, fulfillment_type').eq('customer_id', userId).order('created_at', { ascending: false }).limit(5),
      supabase.from('subscriptions').select('id, status, billing_interval, current_price, next_delivery_date, delivery_day').eq('customer_id', userId).in('status', ['active', 'paused']).limit(1).single(),
    ]);

  return {
    profile: profileRes.data,
    streak: streakRes.data,
    points: pointsRes.data?.points ?? 0,
    level: levelRes.data,
    achievementCount: achievementsRes.data?.length ?? 0,
    recentOrders: ordersRes.data ?? [],
    subscription: subscriptionRes.data,
  };
}

export async function fetchOrdersList(userId: string) {
  const { data, error } = await supabase
    .from('orders')
    .select('id, order_number, status, total_amount, payment_status, created_at, fulfillment_type, order_type')
    .eq('customer_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw error;
  return data ?? [];
}

export async function fetchOrderDetail(orderId: string) {
  const [orderRes, itemsRes] = await Promise.all([
    supabase.from('orders').select('*').eq('id', orderId).single(),
    supabase.from('order_items').select('*, recipes(name, image_url)').eq('order_id', orderId),
  ]);

  return {
    order: orderRes.data,
    items: itemsRes.data ?? [],
  };
}

export async function fetchProfile(userId: string) {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data;
}

export async function updateProfile(userId: string, updates: Record<string, unknown>) {
  const { error } = await supabase
    .from('user_profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId);

  if (error) throw error;
}

export async function fetchAddresses(userId: string) {
  const { data, error } = await supabase
    .from('user_addresses')
    .select('*')
    .eq('user_id', userId)
    .order('is_default', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function createAddress(userId: string, address: Record<string, unknown>) {
  const { error } = await supabase
    .from('user_addresses')
    .insert({ ...address, user_id: userId });

  if (error) throw error;
}

export async function updateAddress(addressId: string, updates: Record<string, unknown>) {
  const { error } = await supabase
    .from('user_addresses')
    .update(updates)
    .eq('id', addressId);

  if (error) throw error;
}

export async function deleteAddress(addressId: string) {
  const { error } = await supabase
    .from('user_addresses')
    .delete()
    .eq('id', addressId);

  if (error) throw error;
}

export async function setDefaultAddress(userId: string, addressId: string) {
  // Unset all defaults first
  await supabase.from('user_addresses').update({ is_default: false }).eq('user_id', userId);
  // Set the new default
  const { error } = await supabase.from('user_addresses').update({ is_default: true }).eq('id', addressId);
  if (error) throw error;
}
