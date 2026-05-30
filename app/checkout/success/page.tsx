import { CheckoutSuccessClient } from "@/components/checkout/checkout-success-client";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Payment Received",
  description: "TechChimps payment confirmation with automatic live support handoff.",
  path: "/checkout/success"
});

export default async function CheckoutSuccessPage({
  searchParams
}: {
  searchParams: Promise<{ order?: string; session_id?: string }>;
}) {
  const params = await searchParams;

  return <CheckoutSuccessClient orderReference={params.order} stripeSessionId={params.session_id} />;
}
