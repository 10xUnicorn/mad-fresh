import type { Recipe, Order, UserProfile, UserAddress } from './types';

const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://madfresh.app';

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  token?: string;
}

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { method = 'GET', body, token } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => 'Unknown error');
    throw new ApiError(res.status, text);
  }

  // Some endpoints return no body (204)
  if (res.status === 204) return undefined as T;

  return res.json();
}

// ── Menu ──
export function fetchMenu() {
  return request<{ menu: Recipe[] }>('/api/menu');
}

// ── Checkout ──
export interface CheckoutPayload {
  items: Array<{ recipe_id: string; quantity: number; size?: string; customizations?: string[] }>;
  fulfillment_type: 'pickup' | 'delivery';
  address_id?: string;
  coupon_code?: string;
  donation_amount?: number;
  payment_method_id?: string;
}

export function createCheckout(payload: CheckoutPayload, token: string) {
  return request<{ order_id: string; client_secret?: string }>('/api/checkout', {
    method: 'POST',
    body: payload,
    token,
  });
}

// ── Orders ──
export function fetchOrders(token: string) {
  return request<{ orders: Order[] }>('/api/dashboard/reorder', { token });
}

export function modifyOrder(orderId: string, body: Record<string, unknown>, token: string) {
  return request<{ order: Order }>(`/api/orders/${orderId}/modify`, {
    method: 'PATCH',
    body,
    token,
  });
}

// ── Subscriptions ──
export function fetchSubscriptions(token: string) {
  return request<unknown>('/api/subscriptions', { token });
}

export function createSubscriptionCheckout(body: Record<string, unknown>, token: string) {
  return request<{ url: string }>('/api/subscriptions/checkout', {
    method: 'POST',
    body,
    token,
  });
}

export function manageSubscription(body: Record<string, unknown>, token: string) {
  return request<unknown>('/api/subscriptions/manage', {
    method: 'POST',
    body,
    token,
  });
}

// ── Rewards ──
export function redeemReward(body: { reward_id: string }, token: string) {
  return request<unknown>('/api/rewards/redeem', {
    method: 'POST',
    body,
    token,
  });
}

// ── Referrals ──
export function fetchReferralCode(token: string) {
  return request<{ code: string }>('/api/referrals/code', { token });
}

// ── Coupons ──
export function validateCoupon(code: string, token: string) {
  return request<{ valid: boolean; discount?: number; type?: string }>('/api/coupons/validate', {
    method: 'POST',
    body: { code },
    token,
  });
}

// ── Donations ──
export function fetchDonations(token: string) {
  return request<unknown>('/api/donations', { token });
}

// ── Payment Config ──
export function fetchPaymentConfig() {
  return request<{ publishableKey: string }>('/api/payment-config');
}

// ── Notification Preferences ──
export function updateNotificationPreferences(body: Record<string, unknown>, token: string) {
  return request<unknown>('/api/notification-preferences', {
    method: 'POST',
    body,
    token,
  });
}

export { ApiError };
