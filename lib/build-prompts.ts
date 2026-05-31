import { getServiceBySlug, type OrderRecord } from "@/lib/orders";
import { listJson, writeJson } from "@/lib/storage";
import { formatPrice } from "@/lib/utils";

export type BuildPromptRecord = {
  id: string;
  orderReference: string;
  customerName: string;
  customerEmail: string;
  serviceName: string;
  serviceCategory: string;
  status: OrderRecord["status"];
  title: string;
  prompt: string;
  createdAt: string;
  updatedAt: string;
};

const PROMPT_STORE = "techchimps-build-prompts";
const PROMPT_PREFIX = "prompts/";

function promptKey(reference: string) {
  return `${PROMPT_PREFIX}${reference}`;
}

function clean(value?: string | number | null) {
  return value === undefined || value === null || value === "" ? "Not specified" : String(value);
}

function categoryGuidance(order: OrderRecord) {
  switch (order.serviceCategory) {
    case "Quick Launch":
      return [
        "Make the first screen instantly clear and conversion-focused.",
        "Keep the experience lean, fast, mobile-first, and shareable.",
        "Include obvious contact, booking, payment, social, or lead-capture routes depending on the brief.",
        "Avoid filler sections. Every section must help the visitor take action."
      ];
    case "Websites":
      return [
        "Build a polished business website with strong hierarchy, trust signals, clear CTAs, and local SEO foundations.",
        "Use concise beginner-friendly wording, not corporate filler.",
        "Include mobile-first navigation, service sections, FAQ content, contact routes, and performance-minded assets.",
        "Make the design feel professional enough to sell, but simple enough for non-technical customers."
      ];
    case "Web Apps":
      return [
        "Build the actual usable workflow, not a static mockup.",
        "Include forms, validation, state handling, empty/loading/error states, and a sensible data model or local persistence when a backend is not available.",
        "Create a focused dashboard or task view if it helps the customer complete the main workflow.",
        "Prioritize clarity, speed, accessibility, and maintainable typed code."
      ];
    case "Windows Apps":
      return [
        "Design the desktop workflow around repeat use, clear controls, file handling, and friendly error states.",
        "If the repo is web-based, create a production-quality desktop-ready prototype or Electron/Tauri-ready structure that can be packaged later.",
        "Include import/export or settings only where useful to the requested workflow.",
        "Document how to run and package the tool."
      ];
    case "Discord":
      return [
        "Build a real bot architecture with commands, permissions, useful responses, setup notes, and environment variable guidance.",
        "Include ticket, moderation, welcome, logging, role, reminder, or webhook flows only where they fit the customer brief.",
        "Keep the admin experience simple and safe.",
        "Document deployment and hosting steps clearly."
      ];
    case "Care":
      return [
        "Treat this as a maintenance/support engagement with checks, fixes, reporting, and calm handoff notes.",
        "Create a practical checklist, risk list, improvement plan, and any lightweight scripts or docs that help delivery.",
        "Prioritize stability, backups, performance, accessibility, SEO, and customer-facing clarity.",
        "Do not overbuild; focus on reliable care work."
      ];
    default:
      return [
        "Build the simplest high-quality product that solves the customer's actual goal.",
        "Make practical assumptions where details are missing and document them."
      ];
  }
}

function lines(items: string[]) {
  return items.map((item) => `- ${item}`).join("\n");
}

function structuredAnswers(order: OrderRecord) {
  if (!order.serviceAnswers?.length) {
    return "- No structured service answers were captured. Use the customer brief and service promise.";
  }

  return order.serviceAnswers
    .map((item) => `- ${item.label}\n  Question: ${item.prompt}\n  Answer: ${item.answer}`)
    .join("\n");
}

function timelineLabel(value: string) {
  const labels: Record<string, string> = {
    "one-day": "1 day",
    "two-day": "2 days",
    "three-day": "3 days",
    "this-week": "this week",
    "this-month": "this month",
    flexible: "flexible"
  };

  return labels[value] ?? value;
}

export function generateBuildPrompt(order: OrderRecord) {
  const service = getServiceBySlug(order.serviceSlug);
  const serviceIncludes = service?.includes ?? [];
  const serviceOutcomes = service?.outcomes ?? [];
  const deliveryText =
    order.deliverySpeed === "rush50"
      ? "50% faster ETA selected"
      : order.deliverySpeed === "express"
        ? "Fast-track delivery selected"
        : order.deliverySpeed === "priority"
          ? "Priority delivery selected"
          : "Standard delivery";
  const offerText =
    order.offerMode === "standard"
      ? "Standard checkout/order"
      : `${order.offerMode === "discount" ? "Discounted" : "Custom"} offer: ${formatPrice(order.offerAmount ?? order.amount)}. Reason: ${
          order.offerReason || "No reason provided"
        }`;
  const priceText = order.discountCode
    ? `${formatPrice(order.amount, order.priceSuffix)} after ${order.discountCode} (${formatPrice(
        order.discountAmount ?? 0,
        order.priceSuffix
      )} off from ${formatPrice(order.originalAmount ?? order.baseAmount, order.priceSuffix)})`
    : formatPrice(order.amount, order.priceSuffix);
  const uploadText = order.uploadedFiles?.length
    ? order.uploadedFiles.map((file) => `- ${file.name} (${Math.round(file.size / 1024)}KB, ${file.type})`).join("\n")
    : order.attachmentNames.length
      ? lines(order.attachmentNames)
      : "- No files uploaded";

  return `You are Codex, acting as a senior product engineer, UX designer, conversion strategist, and launch-focused builder.

Your job is to complete this customer project in one strong implementation pass. Do not stop at a plan. Read the existing repo first, follow its stack and conventions, implement the working product, polish the UI, and verify it.

PROJECT SNAPSHOT
- Studio: TechChimps
- Customer: ${clean(order.contactName)}
- Customer email: ${clean(order.contactEmail)}
- Order reference: ${order.reference}
- Service: ${order.serviceName}
- Category: ${order.serviceCategory}
- Status: ${order.status.replaceAll("_", " ")}
- Price/estimate: ${priceText}
- Base estimate: ${formatPrice(order.baseAmount, order.priceSuffix)}
- Offer/payment mode: ${offerText}
- Budget comfort: ${clean(order.budget)}
- Timeline preference: ${clean(timelineLabel(order.timeline))}
- Delivery speed: ${deliveryText}
- Preferred completion date: ${clean(order.completionDate)}
- Live chat session: ${order.chatSessionId}

ATTACHED FILES OR EXAMPLES
${uploadText}

CUSTOMER BRIEF
${order.goals}

STRUCTURED SERVICE ANSWERS
Use these as the main source of truth for scope, features, content, workflow, integrations, and delivery decisions.
${structuredAnswers(order)}

SERVICE PROMISE
${service?.summary ?? order.serviceName}

BEGINNER-FRIENDLY EXPLANATION
${service?.beginnerExplanation ?? "Build a clear, friendly product that solves the customer's request."}

WHAT SHOULD BE INCLUDED
${serviceIncludes.length ? lines(serviceIncludes) : "- Decide the minimum complete feature set from the customer brief."}

TARGET OUTCOMES
${serviceOutcomes.length ? lines(serviceOutcomes) : "- Make the product useful, clear, responsive, and easy to launch."}

CATEGORY DELIVERY GUIDANCE
${lines(categoryGuidance(order))}

ONE-SHOT BUILD REQUIREMENTS
- Build the actual product or the closest production-ready implementation possible inside the current codebase.
- Make it feel polished, friendly, modern, and easy for non-technical users.
- Keep wording simple and direct. Avoid confusing technical language in the customer-facing UI.
- Use responsive layouts that fit mobile and desktop with no horizontal overflow.
- Add real controls, states, validation, empty states, loading states, and error states where the product needs them.
- Use accessible semantic HTML, labels, focus states, keyboard-friendly controls, and good contrast.
- Optimize for fast load time, sensible asset usage, and clean code.
- Keep the implementation modular, typed, and maintainable.
- Use existing design tokens, components, folder patterns, and utilities before adding new abstractions.
- Do not invent unrelated features that make the product harder to use.
- If any detail is missing, make a sensible commercial assumption and record it in a short handoff note.

DELIVERY CHECKLIST
- Implement the product end-to-end.
- Add or update focused tests/checks where the change has meaningful risk.
- Run typecheck, lint, build, or the repo's nearest available verification commands.
- Use browser QA for customer-facing screens and check desktop/mobile fit.
- Leave a concise handoff summary with what was built, how to run it, assumptions, and any remaining setup.

SUCCESS STANDARD
This should feel like a paid TechChimps delivery: clear, useful, polished, beginner-friendly, and ready for the customer to review.`;
}

export async function saveBuildPromptForOrder(order: OrderRecord) {
  const createdAt = new Date().toISOString();
  const prompt = generateBuildPrompt(order);
  const record: BuildPromptRecord = {
    id: order.reference,
    orderReference: order.reference,
    customerName: order.contactName,
    customerEmail: order.contactEmail,
    serviceName: order.serviceName,
    serviceCategory: order.serviceCategory,
    status: order.status,
    title: `${order.serviceName} build prompt`,
    prompt,
    createdAt,
    updatedAt: createdAt
  };

  await writeJson(PROMPT_STORE, promptKey(order.reference), record);
  return record;
}

export async function listBuildPrompts() {
  const prompts = await listJson<BuildPromptRecord>(PROMPT_STORE, PROMPT_PREFIX);
  return prompts.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function deleteBuildPrompt(reference: string) {
  await writeJson<BuildPromptRecord | null>(PROMPT_STORE, promptKey(reference), null);
}
