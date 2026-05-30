import {
  Bot,
  Code2,
  Globe2,
  MonitorCog,
  ShieldCheck,
  Sparkles,
  Wrench
} from "lucide-react";

export type ServiceCategory = "Quick Launch" | "Websites" | "Web Apps" | "Windows Apps" | "Discord" | "Care";

export type Service = {
  slug: string;
  category: ServiceCategory;
  name: string;
  price: number;
  priceSuffix?: string;
  timeline: string;
  summary: string;
  beginnerExplanation: string;
  includes: string[];
  outcomes: string[];
  icon: typeof Globe2;
};

export const services: Service[] = [
  {
    slug: "creator-link-hub",
    category: "Quick Launch",
    name: "Creator Link Hub",
    price: 49,
    timeline: "Same day",
    summary: "A sleek link-in-bio page for creators, streamers, DJs, sellers, and personal brands.",
    beginnerExplanation:
      "Best when you want one polished mobile-first page that sends people to your socials, offers, videos, products, bookings, or payments.",
    includes: ["Mobile-first link page", "Social buttons", "Featured offer block", "Basic brand styling"],
    outcomes: ["Look more professional", "Share one simple link", "Send followers to the right place"],
    icon: Globe2
  },
  {
    slug: "promo-booking-page",
    category: "Quick Launch",
    name: "Promo / Booking Page",
    price: 99,
    timeline: "1 day",
    summary: "A focused page for an offer, menu, booking link, event, product, or digital download.",
    beginnerExplanation:
      "Best when you need one clear page that turns attention into enquiries, bookings, or purchases.",
    includes: ["One focused page", "Offer or menu section", "Booking/contact CTA", "Basic SEO setup"],
    outcomes: ["Promote one thing clearly", "Make booking easier", "Share a professional link"],
    icon: Sparkles
  },
  {
    slug: "website-glow-up",
    category: "Quick Launch",
    name: "Website Glow-Up",
    price: 99,
    timeline: "1 day",
    summary: "A fast polish pass for an existing page that needs clearer wording, layout, mobile flow, or trust.",
    beginnerExplanation:
      "Best when your current site is live but feels messy, dated, or hard to understand.",
    includes: ["Copy tidy-up", "Mobile layout review", "CTA/trust improvements", "Quick performance notes"],
    outcomes: ["Look more professional", "Reduce confusion", "Make the next step clearer"],
    icon: Sparkles
  },
  {
    slug: "lead-capture-funnel",
    category: "Quick Launch",
    name: "Lead Capture Funnel",
    price: 75,
    timeline: "1-2 days",
    summary: "A simple landing page with a form and follow-up flow for collecting enquiries.",
    beginnerExplanation:
      "Best when you want people to leave their details for a quote, booking, callback, or offer.",
    includes: ["Landing page", "Lead form", "Thank-you state", "Auto-reply ready structure"],
    outcomes: ["Capture better leads", "Follow up faster", "Know what customers want"],
    icon: Code2
  },
  {
    slug: "simple-calculator-tool",
    category: "Quick Launch",
    name: "Instant Quote Calculator",
    price: 75,
    timeline: "1-2 days",
    summary: "A small calculator for quotes, savings, pricing, fitness, finance, trades, or estimates.",
    beginnerExplanation:
      "Best when customers need a quick answer before they contact you.",
    includes: ["One calculator flow", "Input validation", "Result screen", "Shareable page"],
    outcomes: ["Help customers decide", "Reduce repeat questions", "Create a useful lead magnet"],
    icon: Code2
  },
  {
    slug: "barebones-website",
    category: "Websites",
    name: "Barebones Website",
    price: 99,
    timeline: "1-2 days",
    summary: "A simple one-page online home for getting found and looking trustworthy.",
    beginnerExplanation:
      "Best when you need a clean page with your services, contact details, and a clear way for customers to enquire.",
    includes: ["One responsive page", "Contact CTA", "Basic SEO setup", "Launch checklist"],
    outcomes: ["Look legitimate quickly", "Share one clear link", "Make contacting you easier"],
    icon: Globe2
  },
  {
    slug: "standard-website",
    category: "Websites",
    name: "Standard Website",
    price: 149,
    timeline: "2-4 days",
    summary: "A polished small-business website with the pages customers expect.",
    beginnerExplanation:
      "A practical option for businesses that want a home page, services, trust proof, FAQs, and a stronger local presence.",
    includes: ["Up to 4 pages", "Service sections", "FAQ content", "Local SEO foundations"],
    outcomes: ["Better customer confidence", "Clear service navigation", "More useful search snippets"],
    icon: Sparkles
  },
  {
    slug: "advanced-website",
    category: "Websites",
    name: "Advanced Website",
    price: 199,
    timeline: "4-7 days",
    summary: "A conversion-focused website with richer sections, guided CTAs, and portfolio proof.",
    beginnerExplanation:
      "Designed for businesses that need more explanation, stronger visuals, and simple routes for different customer needs.",
    includes: ["Up to 7 pages", "Portfolio layout", "Guided forms", "Performance tuning"],
    outcomes: ["Reduced confusion", "More enquiries", "Cleaner mobile experience"],
    icon: Code2
  },
  {
    slug: "elite-website",
    category: "Websites",
    name: "Elite Website",
    price: 299,
    timeline: "1-1.5 weeks",
    summary: "A premium site with custom interactions, advanced content strategy, and launch support.",
    beginnerExplanation:
      "For teams that want the site to feel like a full digital brand, not just a brochure.",
    includes: ["Custom design system", "Advanced SEO structure", "Motion polish", "Launch support call"],
    outcomes: ["Premium first impression", "Higher trust", "Scalable content system"],
    icon: ShieldCheck
  },
  {
    slug: "basic-web-app",
    category: "Web Apps",
    name: "Basic Web App",
    price: 99,
    timeline: "3-4 days",
    summary: "A simple browser-based tool for forms, calculators, or one focused workflow.",
    beginnerExplanation:
      "Best when you need one useful online tool that customers or staff can open in a browser.",
    includes: ["One focused workflow", "Responsive interface", "Validation states", "Deployment setup"],
    outcomes: ["Less manual admin", "Faster customer actions", "A clear tool people can use"],
    icon: Code2
  },
  {
    slug: "standard-web-app",
    category: "Web Apps",
    name: "Standard Web App",
    price: 199,
    timeline: "4-10 days",
    summary: "A practical web app with multiple screens, saved data planning, and guided user flows.",
    beginnerExplanation:
      "A good middle option for dashboards, booking-style flows, calculators, or simple internal systems.",
    includes: ["Multi-screen interface", "API-ready structure", "Form validation", "Admin-ready layout"],
    outcomes: ["Cleaner workflows", "Better visibility", "Room to grow"],
    icon: Code2
  },
  {
    slug: "advanced-web-app",
    category: "Web Apps",
    name: "Advanced Web App",
    price: 299,
    timeline: "1-2 weeks",
    summary: "A larger web app with dashboards, accounts-ready architecture, and API planning.",
    beginnerExplanation:
      "A strong fit for businesses that need customer portals, project trackers, custom tools, or automations.",
    includes: ["Dashboard screens", "API layer plan", "Role-aware structure", "Automation hooks"],
    outcomes: ["Startup-ready foundation", "Better visibility", "Room to grow"],
    icon: MonitorCog
  },
  {
    slug: "basic-desktop-tool",
    category: "Windows Apps",
    name: "Basic Desktop Tool",
    price: 99,
    timeline: "2-3 days",
    summary: "A focused Windows utility for repetitive jobs, files, data entry, or small workflows.",
    beginnerExplanation:
      "Helpful when your work happens on a PC and you want a simple button-based tool instead of a spreadsheet workaround.",
    includes: ["Windows interface", "Simple workflow", "Installer guidance", "Usage notes"],
    outcomes: ["Save time", "Reduce mistakes", "Make repeat work easier"],
    icon: Wrench
  },
  {
    slug: "standard-desktop-tool",
    category: "Windows Apps",
    name: "Standard Desktop Tool",
    price: 199,
    timeline: "4-10 days",
    summary: "A more capable Windows tool with settings, file handling, and clearer workflow screens.",
    beginnerExplanation:
      "A balanced option when you need a reliable internal tool that does more than one small task.",
    includes: ["Multiple workflow screens", "Import/export basics", "Settings", "Friendly error states"],
    outcomes: ["Fewer repeat tasks", "Cleaner internal process", "More reliable outputs"],
    icon: MonitorCog
  },
  {
    slug: "advanced-desktop-tool",
    category: "Windows Apps",
    name: "Advanced Desktop Tool",
    price: 299,
    timeline: "1-2 weeks",
    summary: "A more capable desktop app with multiple screens, files, reporting, or integrations.",
    beginnerExplanation:
      "Good for internal teams that need a reliable custom tool without buying a large software package.",
    includes: ["Multi-screen app", "Import/export", "Settings", "Error handling"],
    outcomes: ["Custom fit", "Better team workflow", "Lower subscription reliance"],
    icon: MonitorCog
  },
  {
    slug: "custom-discord-bot",
    category: "Discord",
    name: "Basic Discord Bot",
    price: 99,
    timeline: "2-4 days",
    summary: "A simple custom Discord bot for commands, welcome messages, reminders, or support prompts.",
    beginnerExplanation:
      "A friendly starting point when you want your Discord server to answer simple questions or automate small jobs.",
    includes: ["Basic custom commands", "Welcome or reminder flow", "Hosting guidance", "Simple admin notes"],
    outcomes: ["Less repetitive admin", "Faster member help", "A bot built around your server"],
    icon: Bot
  },
  {
    slug: "standard-discord-bot",
    category: "Discord",
    name: "Standard Discord Bot",
    price: 199,
    timeline: "4-7 days",
    summary: "A stronger Discord bot with tickets, moderation helpers, logs, or role-based utilities.",
    beginnerExplanation:
      "Best when your community needs structured support, safer moderation, and clearer member flows.",
    includes: ["Ticket or support flow", "Moderation helpers", "Role-aware commands", "Bot documentation"],
    outcomes: ["Automated support", "Cleaner community management", "Better member experience"],
    icon: Bot
  },
  {
    slug: "advanced-discord-bot",
    category: "Discord",
    name: "Advanced Discord Bot",
    price: 299,
    timeline: "1-2 weeks",
    summary: "A more advanced Discord bot with dashboards, integrations, webhooks, or custom automation.",
    beginnerExplanation:
      "For communities or teams that want Discord connected to wider tools, reports, or business workflows.",
    includes: ["Advanced commands", "Webhook integrations", "Automation logs", "Admin-ready structure"],
    outcomes: ["Fewer manual jobs", "Better reporting", "A more professional community system"],
    icon: Bot
  },
  {
    slug: "monthly-care-plan",
    category: "Care",
    name: "Monthly Care Plan",
    price: 19,
    priceSuffix: "/month",
    timeline: "Monthly",
    summary: "Small monthly support for updates, checks, backups, and calm maintenance.",
    beginnerExplanation:
      "Ideal if you want someone technical nearby without paying for a big retainer.",
    includes: ["Monthly health check", "Small content updates", "Backup review", "Friendly support"],
    outcomes: ["Peace of mind", "Fewer surprises", "A site that stays cared for"],
    icon: ShieldCheck
  },
  {
    slug: "priority-support",
    category: "Care",
    name: "Priority Support",
    price: 49,
    priceSuffix: "/month",
    timeline: "Monthly",
    summary: "Faster response and priority help for growing sites, apps, and communities.",
    beginnerExplanation:
      "For teams that need help quickly when something changes, breaks, or needs improving.",
    includes: ["Priority response", "Urgent fixes", "Quarterly review", "Improvement suggestions"],
    outcomes: ["Faster help", "Lower stress", "Clearer next steps"],
    icon: ShieldCheck
  }
];

export const serviceCategories: ServiceCategory[] = [
  "Quick Launch",
  "Websites",
  "Web Apps",
  "Windows Apps",
  "Discord",
  "Care"
];
