import { BarChart3, CheckCircle2, CreditCard, FileSignature, MessageSquareReply, MousePointerClick, ShieldCheck, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { StatusIndicator } from "@/components/ui/status-indicator";
import type { AnalyticsSummary } from "@/lib/analytics";
import { formatPrice } from "@/lib/utils";

type AdminOverviewPanelProps = {
  analytics: AnalyticsSummary;
  earnings: {
    paidOrders: number;
    refunded: number;
    totalPaid: number;
  };
  focus: {
    needReplyCount: number;
    pendingSignoffs: number;
    reviewCount: number;
  };
};

export function AdminOverviewPanel({ analytics, earnings, focus }: AdminOverviewPanelProps) {
  const netEarnings = Math.max(0, earnings.totalPaid - earnings.refunded);
  const focusItems = [
    {
      href: "#support",
      icon: MessageSquareReply,
      label: focus.needReplyCount ? "Reply to waiting chats" : "Chats are calm",
      meta: focus.needReplyCount ? `${focus.needReplyCount} need attention` : "Nothing urgent",
      tone: focus.needReplyCount ? "warning" : "good"
    },
    {
      href: "#signoffs",
      icon: FileSignature,
      label: focus.pendingSignoffs ? "Final sign-offs waiting" : "Sign-offs tidy",
      meta: focus.pendingSignoffs ? `${focus.pendingSignoffs} customer approvals` : "No pending approvals",
      tone: focus.pendingSignoffs ? "warning" : "good"
    },
    {
      href: "#payments",
      icon: CreditCard,
      label: "Payment hub",
      meta: `${earnings.paidOrders} paid orders`,
      tone: earnings.paidOrders ? "active" : "good"
    },
    {
      href: "#customers",
      icon: Sparkles,
      label: "Customer list",
      meta: "Messages, requests, prompts",
      tone: "active"
    }
  ] as const;

  return (
    <Card className="admin-overview-panel">
      <div className="admin-overview-head">
        <div>
          <span className="eyebrow">
            <ShieldCheck size={15} /> Calm command view
          </span>
          <h2>Start here when the admin feels busy.</h2>
          <p>One simple view for urgent replies, approvals, money, traffic, and the next best action.</p>
        </div>
        <StatusIndicator label={focus.needReplyCount || focus.reviewCount || focus.pendingSignoffs ? "Action needed" : "All calm"} tone={focus.needReplyCount || focus.reviewCount || focus.pendingSignoffs ? "warning" : "good"} />
      </div>

      <div className="admin-overview-metrics">
        <div>
          <CreditCard aria-hidden size={18} />
          <span>Net earnings</span>
          <strong>{formatPrice(netEarnings)}</strong>
        </div>
        <div>
          <MousePointerClick aria-hidden size={18} />
          <span>Visits today</span>
          <strong>{analytics.today.total}</strong>
        </div>
        <div>
          <BarChart3 aria-hidden size={18} />
          <span>7 day visits</span>
          <strong>{analytics.total7Days}</strong>
        </div>
        <div>
          <CheckCircle2 aria-hidden size={18} />
          <span>Top page</span>
          <strong>{analytics.topPath.path}</strong>
        </div>
      </div>

      <div className="admin-focus-list">
        {focusItems.map((item) => {
          const Icon = item.icon;
          return (
            <a href={item.href} key={item.href}>
              <Icon aria-hidden size={18} />
              <span>
                <strong>{item.label}</strong>
                <small>{item.meta}</small>
              </span>
              <StatusIndicator label={item.tone === "warning" ? "Now" : "Open"} tone={item.tone} />
            </a>
          );
        })}
      </div>
    </Card>
  );
}
