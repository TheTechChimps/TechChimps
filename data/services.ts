import {
  Bot,
  Code2,
  FileText,
  Globe2,
  Music,
  MonitorCog,
  Palette,
  ShieldCheck,
  Sparkles,
  Video,
  Wrench
} from "lucide-react";

export type ServiceCategory =
  | "Quick Launch"
  | "Creative Design"
  | "Music & Audio"
  | "Video Editing"
  | "Beat Production"
  | "Websites"
  | "Web Apps"
  | "Python Programs"
  | "Windows Apps"
  | "Discord"
  | "Document Help"
  | "Care"
  | "Custom Request";

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
    slug: "custom-request",
    category: "Custom Request",
    name: "Something Else",
    price: 0,
    timeline: "Agreed after review",
    summary: "A reviewed custom request for a product, fix, automation, integration, or idea that is not listed yet.",
    beginnerExplanation:
      "Choose this when none of the listed services quite fit. Tell us the idea in plain English and we will shape the simplest route with you before asking for payment.",
    includes: ["Human scope review", "Live support handoff", "Clear next step", "Friendly custom quote"],
    outcomes: ["No idea gets lost", "Get the right route", "Only pay after review"],
    icon: Wrench
  },
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
    slug: "profile-picture-avatar-art",
    category: "Creative Design",
    name: "Profile Picture / Avatar Art",
    price: 19,
    timeline: "Same day",
    summary: "A clean profile picture or avatar for socials, music pages, gaming, creators, or small brands.",
    beginnerExplanation:
      "Best when you want your profile to look finished and recognisable without needing a full brand package.",
    includes: ["One square profile design", "Simple colour direction", "Social-ready export", "One tidy revision"],
    outcomes: ["Look more professional", "Upgrade your first impression", "Match your online identity"],
    icon: Palette
  },
  {
    slug: "social-banner-design",
    category: "Creative Design",
    name: "Social Banner",
    price: 25,
    timeline: "Same day",
    summary: "A sleek header banner for YouTube, Facebook, LinkedIn, X, Twitch, or creator profiles.",
    beginnerExplanation:
      "Best when your page needs a strong top banner that says who you are and what you offer straight away.",
    includes: ["One platform banner", "Brand colours and text", "Correct export sizing", "One tidy revision"],
    outcomes: ["Cleaner profile layout", "Clearer offer", "More polished socials"],
    icon: Palette
  },
  {
    slug: "flyer-poster-design",
    category: "Creative Design",
    name: "Flyer / Poster Design",
    price: 35,
    timeline: "1 day",
    summary: "A bright flyer or poster for an event, offer, launch, service, music release, or local promotion.",
    beginnerExplanation:
      "Best when you need a simple design people can understand quickly on socials, WhatsApp, or print.",
    includes: ["One flyer or poster", "Clear call-to-action", "Social-ready export", "One tidy revision"],
    outcomes: ["Promote faster", "Explain the offer clearly", "Share a design that looks real"],
    icon: Palette
  },
  {
    slug: "business-card-brand-asset",
    category: "Creative Design",
    name: "Business Card / Brand Asset",
    price: 35,
    timeline: "1 day",
    summary: "A neat business card, menu card, price card, service card, or simple branded asset.",
    beginnerExplanation:
      "Best when you need one practical branded design to send, print, or use in customer messages.",
    includes: ["One practical brand asset", "Text and layout polish", "Export for sharing", "One tidy revision"],
    outcomes: ["Look more legitimate", "Send clearer information", "Keep branding consistent"],
    icon: Palette
  },
  {
    slug: "logo-concept",
    category: "Creative Design",
    name: "Logo Concept",
    price: 39,
    timeline: "1-2 days",
    summary: "A simple starter logo concept for a brand, creator, project, server, or small business.",
    beginnerExplanation:
      "Best when you need a clean logo direction before investing in a full identity system.",
    includes: ["One logo concept", "Simple colour palette", "Transparent PNG export", "One tidy revision"],
    outcomes: ["Give the brand a face", "Use it across socials", "Build a clearer visual direction"],
    icon: Palette
  },
  {
    slug: "full-social-brand-pack",
    category: "Creative Design",
    name: "Full Social Brand Pack",
    price: 79,
    timeline: "2-3 days",
    summary: "A compact visual pack with a profile image, banner, colours, and simple social templates.",
    beginnerExplanation:
      "Best when you want your main socials to look like they belong to the same brand.",
    includes: ["Profile image", "Main social banner", "Colour direction", "Two simple post templates"],
    outcomes: ["More consistent branding", "Cleaner social presence", "Faster launch visuals"],
    icon: Palette
  },
  {
    slug: "mastering-only",
    category: "Music & Audio",
    name: "Mastering Only",
    price: 49,
    timeline: "1-2 days",
    summary: "A final loudness, clarity, and polish pass for a finished mix.",
    beginnerExplanation:
      "Best when your song is already mixed and you want it to sound more release-ready across phones, speakers, and headphones.",
    includes: ["Stereo master", "Loudness and balance polish", "WAV/MP3 delivery", "One revision pass"],
    outcomes: ["More consistent playback", "Cleaner final sound", "Release-ready export"],
    icon: Music
  },
  {
    slug: "mixing-only",
    category: "Music & Audio",
    name: "Mixing Only",
    price: 69,
    timeline: "2-4 days",
    summary: "A mix pass that balances vocals, drums, instruments, effects, and space.",
    beginnerExplanation:
      "Best when you have stems or recorded parts and need the track to sound cleaner, wider, and more balanced.",
    includes: ["Stem mix", "Basic vocal/instrument polish", "Effects balance", "One revision pass"],
    outcomes: ["Cleaner levels", "Better vocal placement", "More professional sound"],
    icon: Music
  },
  {
    slug: "mixing-mastering",
    category: "Music & Audio",
    name: "Mixing + Mastering",
    price: 89,
    timeline: "3-5 days",
    summary: "A combined mix and master so your track moves from raw stems to a polished final export.",
    beginnerExplanation:
      "Best value when you need both the main mix and final release polish handled together.",
    includes: ["Full mix pass", "Final master", "WAV/MP3 delivery", "Two revision passes"],
    outcomes: ["Better value than separate services", "Cleaner finished track", "Ready-to-share audio"],
    icon: Music
  },
  {
    slug: "advanced-mix-master",
    category: "Music & Audio",
    name: "Advanced Mix + Master",
    price: 129,
    timeline: "4-7 days",
    summary: "A deeper mix and master for tracks that need more detailed vocal, stem, or creative processing.",
    beginnerExplanation:
      "Best when the track has more layers, needs stronger creative direction, or must sound more polished for a bigger release.",
    includes: ["Detailed stem balance", "Creative effects polish", "Final master", "Two revision passes"],
    outcomes: ["More refined sound", "Stronger release quality", "Clearer creative identity"],
    icon: Music
  },
  {
    slug: "short-video-edit",
    category: "Video Editing",
    name: "Short Video Edit",
    price: 49,
    timeline: "1-2 days",
    summary: "A sharp edit for clips under 60 seconds, ideal for TikTok, Instagram Reels, YouTube Shorts, or ads.",
    beginnerExplanation:
      "Best when you need one short clip made clear, punchy, and ready to post.",
    includes: ["Under 60 seconds", "Basic cuts and pacing", "Captions or text overlays", "Social-ready export"],
    outcomes: ["Post faster", "Hold attention", "Look more polished"],
    icon: Video
  },
  {
    slug: "standard-video-edit",
    category: "Video Editing",
    name: "Standard Video Edit",
    price: 99,
    timeline: "2-4 days",
    summary: "A clean edit for videos around 1-5 minutes with structure, pacing, text, and simple polish.",
    beginnerExplanation:
      "Best for explainers, business clips, music promos, creator content, or simple YouTube videos.",
    includes: ["1-5 minute edit", "Cuts and pacing", "Text/caption polish", "One revision pass"],
    outcomes: ["Clearer story", "Better retention", "Ready-to-upload video"],
    icon: Video
  },
  {
    slug: "long-video-edit",
    category: "Video Editing",
    name: "Long Video Edit",
    price: 149,
    timeline: "4-7 days",
    summary: "A longer edit for 5-15 minute videos with clearer structure, pacing, and presentation.",
    beginnerExplanation:
      "Best when you have more footage and need the final video to feel organised rather than thrown together.",
    includes: ["5-15 minute edit", "Footage tidy-up", "Sections and pacing", "One revision pass"],
    outcomes: ["Less messy footage", "More watchable content", "Clearer delivery"],
    icon: Video
  },
  {
    slug: "advanced-youtube-edit",
    category: "Video Editing",
    name: "Advanced / YouTube Edit",
    price: 199,
    timeline: "1-2 weeks",
    summary: "A bigger edit for 15-30 minute content with stronger story flow, assets, polish, and platform-ready structure.",
    beginnerExplanation:
      "Best for serious YouTube videos, launch content, training videos, podcasts, or detailed business content.",
    includes: ["15-30 minute edit", "Advanced structure", "Graphics/text polish", "Two revision passes"],
    outcomes: ["More professional video", "Cleaner viewer journey", "Stronger long-form content"],
    icon: Video
  },
  {
    slug: "basic-beat-lease",
    category: "Beat Production",
    name: "Basic Beat Lease",
    price: 49,
    timeline: "1-2 days",
    summary: "A ready-to-use beat lease direction for demos, content, freestyles, or early releases.",
    beginnerExplanation:
      "Best when you want a beat quickly and do not need exclusive ownership or stems.",
    includes: ["Beat direction match", "MP3/WAV delivery", "Simple usage notes", "One small tweak"],
    outcomes: ["Start recording faster", "Get a clear sound", "Keep the budget low"],
    icon: Music
  },
  {
    slug: "custom-beat-production",
    category: "Beat Production",
    name: "Custom Beat Production",
    price: 99,
    timeline: "3-5 days",
    summary: "A custom beat built around your genre, mood, references, and vocal style.",
    beginnerExplanation:
      "Best when you want a beat made for your voice, brand, or project rather than a generic track.",
    includes: ["Custom beat idea", "Genre and mood matching", "WAV delivery", "One revision pass"],
    outcomes: ["More personal sound", "Better fit for your vocals", "Ready to record"],
    icon: Music
  },
  {
    slug: "custom-beat-wav-stems",
    category: "Beat Production",
    name: "Custom Beat with WAV + Stems",
    price: 149,
    timeline: "4-7 days",
    summary: "A custom beat package with WAV and stems so it can be mixed, arranged, or adjusted properly.",
    beginnerExplanation:
      "Best when you plan to record properly and want more control over the final mix.",
    includes: ["Custom beat", "WAV export", "Tracked stems", "One revision pass"],
    outcomes: ["More mix control", "Cleaner studio workflow", "Better release preparation"],
    icon: Music
  },
  {
    slug: "exclusive-beat-package",
    category: "Beat Production",
    name: "Exclusive Beat Package",
    price: 199,
    timeline: "1-2 weeks",
    summary: "A higher-end custom beat package shaped for a release, artist identity, or campaign.",
    beginnerExplanation:
      "Best when the beat needs to feel unique to you and support a more serious release.",
    includes: ["Exclusive custom direction", "WAV and stems", "Arrangement polish", "Two revision passes"],
    outcomes: ["Distinct artist sound", "Stronger release identity", "More flexible final files"],
    icon: Music
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
    slug: "simple-python-script",
    category: "Python Programs",
    name: "Simple Python Script",
    price: 49,
    timeline: "1-2 days",
    summary: "A small Python script for a focused task, file job, data clean-up, or repeatable action.",
    beginnerExplanation:
      "Best when you do the same simple digital task often and want a script to handle it faster.",
    includes: ["One focused script", "Plain setup notes", "Basic error handling", "Usage example"],
    outcomes: ["Save repeat time", "Reduce small mistakes", "Get a practical tool"],
    icon: Code2
  },
  {
    slug: "python-automation-tool",
    category: "Python Programs",
    name: "Python Automation Tool",
    price: 99,
    timeline: "2-4 days",
    summary: "A Python automation for files, reports, scraping approved data, formatting, alerts, or small workflows.",
    beginnerExplanation:
      "Best when you want Python to take over a manual workflow that currently eats your time.",
    includes: ["Automation workflow", "Input/output handling", "Friendly instructions", "One revision pass"],
    outcomes: ["Less manual admin", "Faster repeat jobs", "Cleaner outputs"],
    icon: Code2
  },
  {
    slug: "advanced-python-program",
    category: "Python Programs",
    name: "Advanced Python Program",
    price: 199,
    timeline: "4-10 days",
    summary: "A more capable Python program with multiple steps, settings, files, reports, or integrations.",
    beginnerExplanation:
      "Best when the job has several steps and needs a stronger structure than a simple script.",
    includes: ["Multi-step workflow", "Settings or config", "Reports/logging", "Clear usage notes"],
    outcomes: ["More reliable process", "Better visibility", "A tool that can grow"],
    icon: Code2
  },
  {
    slug: "python-app-interface",
    category: "Python Programs",
    name: "Python App with Interface",
    price: 299,
    timeline: "1-2 weeks",
    summary: "A Python-powered tool with a simple interface so non-technical users can run it confidently.",
    beginnerExplanation:
      "Best when the tool needs buttons, settings, and clear screens instead of command-line use.",
    includes: ["Simple interface", "Python workflow", "Inputs and outputs", "Friendly error states"],
    outcomes: ["Easier for anyone to use", "Cleaner workflow", "Less technical friction"],
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
    slug: "document-formatting",
    category: "Document Help",
    name: "Document Formatting",
    price: 29,
    timeline: "Same day",
    summary: "A tidy formatting pass for documents, forms, reports, CVs, proposals, or business paperwork.",
    beginnerExplanation:
      "Best when the content is there but the layout needs to look cleaner, clearer, and easier to read.",
    includes: ["Formatting tidy-up", "Headings and spacing", "Readable layout", "Export guidance"],
    outcomes: ["Cleaner documents", "Better presentation", "Less formatting stress"],
    icon: FileText
  },
  {
    slug: "proofreading-improvements",
    category: "Document Help",
    name: "Proofreading + Improvements",
    price: 39,
    timeline: "Same day",
    summary: "A proofreading and clarity pass for wording, grammar, flow, and professional tone.",
    beginnerExplanation:
      "Best when you have written the content and want it checked, cleaned up, and made easier to understand.",
    includes: ["Grammar and spelling review", "Clarity improvements", "Tone polish", "Plain feedback notes"],
    outcomes: ["Clearer writing", "Fewer mistakes", "More confident submission"],
    icon: FileText
  },
  {
    slug: "work-paperwork-help",
    category: "Document Help",
    name: "Work Paperwork Help",
    price: 49,
    timeline: "1-2 days",
    summary: "Support with work-related forms, admin documents, templates, letters, reports, and paperwork structure.",
    beginnerExplanation:
      "Best when you need help organising your own information into a clearer professional document.",
    includes: ["Document structure help", "Wording tidy-up", "Template or layout support", "Checklist review"],
    outcomes: ["Less admin confusion", "Cleaner paperwork", "Faster completion"],
    icon: FileText
  },
  {
    slug: "study-support-pack",
    category: "Document Help",
    name: "Study Support Pack",
    price: 49,
    timeline: "1-2 days",
    summary: "Friendly study support for planning, explaining, proofreading, formatting, and structuring your own work.",
    beginnerExplanation:
      "Best when you want help understanding, organising, or improving work you are responsible for completing yourself.",
    includes: ["Structure guidance", "Proofreading support", "Explanation notes", "Formatting help"],
    outcomes: ["Clearer direction", "Better understanding", "More organised work"],
    icon: FileText
  },
  {
    slug: "research-notes-structure-help",
    category: "Document Help",
    name: "Research Notes / Structure Help",
    price: 59,
    timeline: "2-3 days",
    summary: "Help turning scattered notes, requirements, and sources into a clear outline or document plan.",
    beginnerExplanation:
      "Best when you have information but need a cleaner structure before writing, presenting, or finishing the document.",
    includes: ["Notes organisation", "Outline creation", "Section planning", "Plain next-step guidance"],
    outcomes: ["Less overwhelm", "Clearer structure", "Better organised thinking"],
    icon: FileText
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
  "Creative Design",
  "Music & Audio",
  "Video Editing",
  "Beat Production",
  "Websites",
  "Web Apps",
  "Python Programs",
  "Windows Apps",
  "Discord",
  "Document Help",
  "Care"
];

export const publicServices = services.filter((service) => service.slug !== "custom-request");
