import Stripe from "stripe";

export const stripeApiVersion = "2026-04-22.dahlia";

export function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) return null;

  return new Stripe(secretKey, {
    apiVersion: stripeApiVersion
  });
}

export function getSiteUrl() {
  const fallback = process.env.NODE_ENV === "production" ? "https://techchimps.com" : "http://127.0.0.1:3000";
  return (process.env.NEXT_PUBLIC_SITE_URL || fallback).replace(/\/$/, "");
}
