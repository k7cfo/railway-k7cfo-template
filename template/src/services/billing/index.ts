import Stripe from "stripe";
import { env } from "../../env.js";

export const billingStatus = env.STRIPE_SECRET_KEY ? "connected" : "unconfigured";
export function stripeClient(): Stripe {
  if (!env.STRIPE_SECRET_KEY) throw new Error("Billing is disabled. Configure STRIPE_SECRET_KEY first.");
  return new Stripe(env.STRIPE_SECRET_KEY);
}
export function requirePriceId(): string {
  if (!env.STRIPE_PRICE_ID) throw new Error("Stripe is configured but STRIPE_PRICE_ID is missing.");
  return env.STRIPE_PRICE_ID;
}
