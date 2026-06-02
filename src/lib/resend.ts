import { Resend } from "resend";

/**
 * Configured Resend client for sending branded emails
 * Using hello@madfresh.app as the from address
 */
export function getResend() {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error(
      "RESEND_API_KEY is not configured. Please add it to .env.local"
    );
  }

  return new Resend(apiKey);
}

/**
 * Standard "from" address for all Mad Fresh Kitchen emails
 */
export const MAD_FRESH_FROM = "Mad Fresh Kitchen <hello@madfresh.app>";

/**
 * Reply-to address for order-related emails
 */
export const MAD_FRESH_REPLY_TO = "order@madfresh.app";

/**
 * Fun tips and food facts to include in email footers
 * One is selected per email for a personalized touch
 */
export const foodTipsAndFacts = [
  "🥑 Did you know? Avocados have more potassium than bananas!",
  "💪 Meal prep tip: Cook grains in bulk — they keep for 5 days in the fridge.",
  "🔥 'The secret ingredient is always love.' — Chef Unknown",
  "🥦 Fun fact: Broccoli is actually a flower that we eat before it blooms!",
  "🍋 Pro tip: Squeeze fresh lemon on your greens to boost iron absorption.",
  "🌿 Did you know? Fresh herbs can be frozen in olive oil for weeks.",
  "🎯 Meal prep hack: Prep your proteins first — they take the longest.",
  "✨ Wellness tip: Eating the rainbow ensures you get diverse nutrients.",
  "⚡ Energy boost: Pair carbs with protein for sustained energy throughout the day.",
  "🧂 Chef's secret: Season as you cook, not just at the end.",
];

/**
 * Get a random food tip based on order number or current time
 */
export function getRandomFoodTip(seed?: string): string {
  const index = seed
    ? seed
        .split("")
        .reduce((acc, char) => acc + char.charCodeAt(0), 0) %
      foodTipsAndFacts.length
    : Math.floor(Math.random() * foodTipsAndFacts.length);
  return foodTipsAndFacts[index];
}
