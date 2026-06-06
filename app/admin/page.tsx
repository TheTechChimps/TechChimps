import {
  BadgePercent,
  Bell,
  Bot,
  CalendarCheck,
  CreditCard,
  Download,
  FileText,
  FolderKanban,
  Gauge,
  Mail,
  MessageSquareReply,
  Search,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  UserRoundCheck,
  Workflow
} from "lucide-react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminLogoutButton } from "@/components/admin/admin-logout-button";
import { AdminAppPanel } from "@/components/admin/admin-app-panel";
import { Card } from "@/components/ui/card";
import { CodexPromptInbox } from "@/components/admin/codex-prompt-inbox";
import { CustomerListConsole } from "@/components/admin/customer-list-console";
import { DailyMaintenancePanel } from "@/components/admin/daily-maintenance-panel";
import { DiscountCodeManager } from "@/components/admin/discount-code-manager";
import { LiveChatConsole } from "@/components/admin/live-chat-console";
import { QaCleanupPanel } from "@/components/admin/qa-cleanup-panel";
import { PaymentHub } from "@/components/admin/payment-hub";
import { StatusIndicator } from "@/components/ui/status-indicator";
import { activityTimeline, automationFlows, emailTemplates, pipelineColumns } from "@/data/dashboard";
import { ADMIN_SESSION_COOKIE, getAdminSessionFromToken, isAdminCookieAuthenticated } from "@/lib/admin-session";
import { getIntegrationReadiness } from "@/lib/automation";
import { getLiveChatSessions } from "@/lib/live-chat";
import { getWaitingOrders, listOrders, type OrderRecord } from "@/lib/orders";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Admin and CRM Architecture",
  description:
    "Internal CRM, project pipeline, automation, support, invoice, subscription, asset, prompt, and activity architecture for TechChimps.",
  path: "/admin"
});

const adminModules = [
  "Client CRM",
  "Project pipeline",
  "Kanban tracking",
  "Invoices",
  "Maintenance subscriptions",
  "Support requests",
  "Onboarding status",
  "Automation logs",
  "Asset management",
  "Generated prompts",
  "Project notes"
];

const adminQuickLinks = [
  { href: "#support", icon: MessageSquareReply, label: "Reply to chats", meta: "Customers waiting" },
  { href: "#payments", icon: CreditCard, label: "Payment hub", meta: "Refunds and receipts" },
  { href: "#discounts", icon: BadgePercent, label: "Discounts", meta: "Codes and offers" },
  { href: "#customers", icon: UserRoundCheck, label: "Customer list", meta: "Details and updates" },
  { href: "#prompts", icon: Sparkles, label: "Build prompts", meta: "One-shot briefs" },
  { href: "#automation", icon: ShieldCheck, label: "Self-healing", meta: "Daily checks", mobileHidden: true },
  { href: "#pipeline", icon: Gauge, label: "Pipeline", meta: "Current work", mobileHidden: true }
];

function plural(value: number, singular: string, pluralLabel = `${singular}s`) {
  return `${value} ${value === 1 ? singular : pluralLabel}`;
}

function hasPaid(order: OrderRecord) {
  return Boolean(order.paidAt || order.stripePaymentStatus === "paid" || order.status === "paid_waiting_support" || order.status === "support_connected");
}

function buildAdminSummary({
  needReplyCount,
  paidWaitingCount,
  reviewCount
}: {
  needReplyCount: number;
  paidWaitingCount: number;
  reviewCount: number;
}) {
  if (needReplyCount) return `${plural(needReplyCount, "chat")} need a reply.`;
  if (paidWaitingCount) return `${plural(paidWaitingCount, "paid customer")} ready for handoff.`;
  if (reviewCount) return `${plural(reviewCount, "offer")} waiting for review.`;
  return "No urgent customer actions right now.";
}

export default async function AdminPage() {
  const cookieStore = await cookies();
  const adminCookie = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  const adminUser = getAdminSessionFromToken(adminCookie);

  if (adminUser?.passwordChangeRequired) {
    redirect("/admin/change-password");
  }

  if (!isAdminCookieAuthenticated(adminCookie)) {
    redirect("/admin/login");
  }

  const integrationStatuses = getIntegrationReadiness();
  const [orders, waitingOrders, liveSessions] = await Promise.all([listOrders(), getWaitingOrders(), getLiveChatSessions()]);
  const needReplyCount = liveSessions.filter((session) => session.unreadVisitorMessages || session.priority !== "normal").length;
  const reviewCount = waitingOrders.filter(
    (order) => order.status === "offer_waiting_review" || order.status === "custom_request_waiting_review"
  ).length;
  const paidOrders = orders.filter(hasPaid);
  const paidWaitingCount = waitingOrders.filter((order) => order.status === "paid_waiting_support").length;
  const refundablePayments = paidOrders.filter((order) => order.stripeSessionId && order.amount > (order.refundedAmount ?? 0)).length;
  const adminStats = [
    { label: "Need reply", value: String(needReplyCount), tone: needReplyCount ? "warning" : "good" },
    { label: "Review offers", value: String(reviewCount), tone: reviewCount ? "warning" : "good" },
    { label: "Paid orders", value: String(paidOrders.length), tone: paidOrders.length ? "active" : "good" },
    { label: "Refundable", value: String(refundablePayments), tone: refundablePayments ? "active" : "good" }
  ];
  const adminSummary = buildAdminSummary({ needReplyCount, paidWaitingCount, reviewCount });

  return (
    <main>
      <section className="section admin-hero">
        <div className="container">
          <span className="eyebrow">TechChimps cockpit</span>
          <h1 className="title">Manage customers, chats, prompts, and automation fast.</h1>
          <p className="subtitle">A compact private workspace for daily replies, project handoffs, and self-healing checks.</p>
          <div className="admin-hero-actions">
            <StatusIndicator label={`${adminUser?.role ?? "owner"} access`} tone="good" />
            <a className="button button-secondary button-sm" href="/api/admin/backups">
              <Download aria-hidden size={16} />
              Download backup
            </a>
            <AdminLogoutButton />
          </div>
        </div>
      </section>

      <section className="section-tight admin-command-section">
        <div className="container">
          <Card className="admin-command-center">
            <div className="admin-command-copy">
              <span className="eyebrow">
                <Gauge size={15} /> Today at a glance
              </span>
              <strong>{adminSummary}</strong>
              <span>Jump straight to replies, offers, payments, refunds, prompts, or customer updates.</span>
            </div>
            <nav aria-label="Admin quick navigation" className="admin-quick-nav">
              {adminQuickLinks.map((item) => {
                const Icon = item.icon;

                return (
                  <a className={item.mobileHidden ? "admin-mobile-nav-hidden" : undefined} href={item.href} key={item.href}>
                    <Icon aria-hidden size={18} />
                    <span>
                      {item.label}
                      <small>{item.meta}</small>
                    </span>
                  </a>
                );
              })}
            </nav>
          </Card>
        </div>
      </section>

      <section className="section-tight">
        <div className="container">
          <AdminAppPanel />
        </div>
      </section>

      <section className="section-tight">
        <div className="container grid grid-4 admin-stat-grid">
          {adminStats.map((stat) => (
            <Card className="stat-card" key={stat.label}>
              <StatusIndicator label={stat.label} tone={stat.tone as "good" | "active" | "warning"} />
              <strong>{stat.value}</strong>
            </Card>
          ))}
        </div>
      </section>

      <section className="section-tight admin-mobile-secondary" id="automation">
        <div className="container">
          <Card className="integration-panel">
            <div>
              <span className="eyebrow">
                <Workflow size={15} /> Online automation readiness
              </span>
              <h2>Stripe, alerts, deploy hooks, and studio sync.</h2>
            </div>
            <div className="integration-grid">
              {integrationStatuses.map((item) => (
                <div key={item.name}>
                  <StatusIndicator label={item.ready ? "Ready" : "Needs env"} tone={item.ready ? "good" : "warning"} />
                  <strong>{item.name}</strong>
                  <span>{item.detail}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>

      <section className="section-tight admin-mobile-secondary">
        <div className="container admin-ops-grid">
          <DailyMaintenancePanel />
          <QaCleanupPanel />
        </div>
      </section>

      <section className="section-tight admin-toolbar-section">
        <div className="container admin-toolbar">
          <label className="field search-field">
            <span className="label">Search clients, projects, invoices, or notes</span>
            <span>
              <Search aria-hidden size={18} />
              <input className="input" placeholder="Search everything" />
            </span>
          </label>
          <div className="toolbar-filters" aria-label="Dashboard filters">
            <button type="button">All</button>
            <button type="button">Active</button>
            <button type="button">Care plans</button>
            <button type="button">Needs reply</button>
          </div>
        </div>
      </section>

      <section className="section-tight" id="support">
        <div className="container">
          <LiveChatConsole />
        </div>
      </section>

      <section className="section-tight" id="payments">
        <div className="container">
          <PaymentHub />
        </div>
      </section>

      <section className="section-tight" id="discounts">
        <div className="container">
          <DiscountCodeManager />
        </div>
      </section>

      <section className="section-tight" id="customers">
        <div className="container">
          <CustomerListConsole />
        </div>
      </section>

      <section className="section-tight" id="prompts">
        <div className="container">
          <CodexPromptInbox />
        </div>
      </section>

      <section className="section-tight admin-reference-section">
        <div className="container">
          <div className="admin-module-grid">
            {adminModules.map((module) => (
              <span className="pill" key={module}>
                {module}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="section admin-reference-section" id="pipeline">
        <div className="container">
          <div className="section-header">
            <span className="eyebrow">Kanban project tracking</span>
            <h2 className="title">Simple pipeline visibility for every job.</h2>
          </div>
          <div className="kanban">
            {pipelineColumns.map((column) => (
              <Card className="kanban-column" key={column.title}>
                <h3>
                  <FolderKanban aria-hidden size={19} />
                  {column.title}
                </h3>
                {column.items.map((item) => (
                  <div className="kanban-card" key={item}>
                    {item}
                  </div>
                ))}
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="section admin-systems admin-reference-section">
        <div className="container grid grid-3">
          <Card>
            <Bell aria-hidden size={24} />
            <h2>Notifications and activity</h2>
            <ul>
              {activityTimeline.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </Card>
          <Card>
            <Bot aria-hidden size={24} />
            <h2>Automation engine</h2>
            <ul>
              {automationFlows.map((flow) => (
                <li key={flow}>{flow}</li>
              ))}
            </ul>
          </Card>
          <Card>
            <Mail aria-hidden size={24} />
            <h2>Email system</h2>
            <ul>
              {emailTemplates.map((email) => (
                <li key={email.name}>
                  <strong>{email.name}</strong>
                  <span>{email.subject}</span>
                </li>
              ))}
            </ul>
          </Card>
          <Card>
            <FileText aria-hidden size={24} />
            <h2>Invoices and subscriptions</h2>
            <p>Stripe-ready event records for invoices, monthly care plans, priority support, and renewal reminders.</p>
          </Card>
          <Card>
            <UploadCloud aria-hidden size={24} />
            <h2>Asset management</h2>
            <p>Client uploads, brand files, generated assets, downloadable files, and deployment handoff materials.</p>
          </Card>
          <Card>
            <Sparkles aria-hidden size={24} />
            <h2>Generated prompts</h2>
            <p>Prompt history for briefs, onboarding summaries, task generation, AI guidance, and project notes.</p>
          </Card>
          <Card>
            <CalendarCheck aria-hidden size={24} />
            <h2>Onboarding status</h2>
            <p>Checklist states for content received, quote accepted, invoice paid, build started, QA, launch, and care.</p>
          </Card>
        </div>
      </section>
    </main>
  );
}
