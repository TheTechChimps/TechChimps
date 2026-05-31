import type Stripe from "stripe";
import type { OrderRecord } from "@/lib/orders";
import { getSiteUrl } from "@/lib/stripe";

export async function createHostedCheckoutSession(
  stripe: Stripe,
  order: OrderRecord,
  {
    source = "techchimps-site"
  }: {
    source?: string;
  } = {}
) {
  const siteUrl = getSiteUrl();
  const mode = order.isSubscription ? "subscription" : "payment";

  return stripe.checkout.sessions.create({
    allow_promotion_codes: true,
    cancel_url: `${siteUrl}/request?checkout=cancelled&order=${order.reference}`,
    client_reference_id: order.reference,
    customer_email: order.contactEmail,
    invoice_creation: mode === "payment" ? { enabled: true } : undefined,
    line_items: [
      {
        price_data: {
          currency: "gbp",
          product_data: {
            description: order.goals.slice(0, 240),
            name: order.serviceName
          },
          recurring: order.isSubscription ? { interval: "month" } : undefined,
          unit_amount: Math.round(order.amount * 100)
        },
        quantity: 1
      }
    ],
    metadata: {
      chatSessionId: order.chatSessionId,
      deliverySpeed: order.deliverySpeed,
      discountAmount: order.discountAmount ? String(order.discountAmount) : "",
      discountCode: order.discountCode ?? "",
      discountPercent: order.discountPercent ? String(order.discountPercent) : "",
      offerMode: order.offerMode,
      orderReference: order.reference,
      serviceSlug: order.serviceSlug,
      source
    },
    mode,
    phone_number_collection: {
      enabled: true
    },
    success_url: `${siteUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}&order=${order.reference}`
  });
}
