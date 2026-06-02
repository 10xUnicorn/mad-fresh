// ═══════════════════════════════════════════
// Mad Fresh Kitchen — Brand Constants
// ═══════════════════════════════════════════

export const BRAND = {
  name: 'Mad Fresh Kitchen',
  tagline: "Arizona's Elite Meal Prep Delivery & Corporate Catering",
  url: 'https://madfresh.app',
  location: {
    address: '455 S 48th St',
    city: 'Tempe',
    state: 'AZ',
    zip: '85281',
    full: '455 S 48th St, Tempe, AZ 85281',
    lat: 33.4148,
    lng: -111.9068,
  },
  hours: {
    mon: { open: '08:00', close: '15:00' },
    tue: { open: '08:00', close: '15:00' },
    wed: { open: '08:00', close: '15:00' },
    thu: { open: '08:00', close: '15:00' },
    fri: { open: '08:00', close: '15:00' },
    sat: { open: '08:00', close: '20:00' },
    sun: { open: '10:00', close: '14:00' },
  },
  social: {
    instagram: 'https://instagram.com/eatmadfresh',
  },
  contact: {
    email: 'info@madfresh.app',
  },
} as const;

export const COLORS = {
  primary: '#449531',
  accent: '#75F663',
  dark: '#161616',
  white: '#FFFFFF',
  gray: '#F7F7F7',
  grayMed: '#A0A0A0',
  grayDark: '#333333',
} as const;

export const LAUNCH_EVENT = {
  name: 'Mad Fresh App Launch Party',
  date: '2026-05-28',
  startTime: '19:00',
  endTime: '21:00',
  venue: 'Mad Fresh Kitchen',
  address: BRAND.location.full,
  capacity: 100,
  isFree: true,
  collectMealPreferences: true,
  donationEnabled: true,
  waitlistEnabled: true,
  newsletterEnabled: true,
} as const;

export const VOLUME_DISCOUNTS = [
  { min: 25, max: 49, percent: 10 },
  { min: 50, max: 74, percent: 15 },
  { min: 75, max: 99, percent: 20 },
  { min: 100, max: null, percent: 20 },
] as const;

export const SUBSCRIPTION_PLANS = {
  small: { meals: 5, label: 'Small', weekly: 75, monthly: 285, annual: 3300 },
  medium: { meals: 5, label: 'Medium', weekly: 79, monthly: 300, annual: 3471 },
  large: { meals: 5, label: 'Large', weekly: 90, monthly: 342, annual: 3960 },
} as const;

export const CATERING_CANCELLATION = {
  fullRefundBeforeDays: 30,
  halfRefundBeforeDays: 7,
  noRefundAfterDays: 7,
  depositPercent: 50,
  balanceDueBeforeDays: 7,
  guestCountFinalizationHours: 48,
} as const;

export const DONATION_RATE = {
  costPerMeal: 5,
  defaultPercentOfOrder: 10,
} as const;

export const CUSTOMIZATION_DEADLINE = {
  dayOfWeek: 'wednesday' as const,
  time: '23:59',
  description: 'Wednesday at 11:59 PM',
} as const;

export const REFERRAL_REWARDS = {
  individual: {
    referrer: 'half_off_meal',
    referred: 'half_off_first',
  },
  catering: {
    referrer: 'free_week',
  },
} as const;
