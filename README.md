# TechChimps

Affordable websites, apps, Discord bots, desktop tools and automation for beginners, creators, communities and small businesses.

Powered by bananas.

![TechChimps brand card](https://techchimps.com/images/techchimps-social-card-v5.png)

## What We Build

TechChimps is a friendly UK digital studio. We turn normal ideas into clear digital products without confusing jargon or scary prices.

Services include:

- Creator link hubs from GBP 49
- Business websites from GBP 99
- Web apps and dashboards
- Discord bots and community tools
- Windows desktop tools
- Automation for repeat tasks
- Monthly care plans and support
- Custom software requests

No request is too big or too small. Tell us the dream product and we turn it into a clear price, a fast plan and a friendly build process.

## Portfolio

### TechChimps

https://techchimps.com

A complete studio website with service pages, transparent pricing, guided request forms, Stripe Checkout, live support, customer accounts, admin inboxes and automation-ready architecture.

### Wade2Wavey

https://wade2wavey.com

A branded creative web presence showing how a personal or creator brand can become a polished online identity.

## Why Work With Us

- Simple wording for non-technical customers
- Clear prices before you commit
- Fast delivery options
- Friendly live support
- Customer accounts and project inboxes
- Modern responsive design
- SEO foundations and performance focus
- Payment and onboarding automation

## Customer Flow

1. Choose a service or make a custom request.
2. Tell us what you want in plain English.
3. Get a clear estimate and delivery options.
4. Pay securely or send a custom offer for review.
5. Continue through live support and your customer portal.

## Tech Stack

Built with Next.js, TypeScript, Stripe Checkout, Vercel, Framer Motion, reusable components, responsive design systems and automation-ready APIs.

## Run locally

```bash
npm install
npm run dev
```

## Architecture

- `app/` contains the homepage, SEO routes, service pages, checkout success flow, admin architecture, portal architecture, and API routes.
- `components/ui/` contains reusable design-system primitives.
- `components/sections/` contains landing-page sections and guided UX widgets.
- `data/` keeps pricing, services, portfolio, FAQ, dashboard, automation, and email content data-driven.
- `lib/` contains SEO helpers, API abstraction, Stripe setup, order storage, automation hooks, live chat, and utilities.
- `hooks/` contains reusable client hooks such as autosaved local state.

The generated mascot asset is saved at `public/images/techchimps-mascot.png`.

## Payments, hosting, and automation

Standard orders create a Stripe Checkout Session. After Stripe confirms payment, the app opens an order-specific live chat thread and posts a waiting alert into the admin console. Custom or discounted offers go to review first, then trigger the same chat, studio sync, and notification hooks without charging the customer automatically.

Set these environment variables before going live:

```bash
NEXT_PUBLIC_SITE_URL=https://techchimps.com
NEXT_PUBLIC_CONTACT_EMAIL=techchimps@proton.me
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...
VERCEL_DEPLOY_HOOK_URL=...
STUDIO_NOTIFICATION_WEBHOOK_URL=...
CRM_API_URL=...
EMAIL_AUTOMATION_WEBHOOK_URL=...
EMAIL_FROM=techchimps@proton.me
ADMIN_PASSWORD=...
ADMIN_EMAIL=admin@techchimps.com
ADMIN_NAME=TechChimps Admin
ADMIN_USERS_JSON=
ADMIN_SESSION_SECRET=...
```

Vercel is the preferred hosting target. The storage layer uses Vercel Blob in production, then local memory for development when no storage token is present.

```bash
npm run setup:vercel
npm run sync:vercel-deploy-hook
npm run deploy:vercel
```

`setup:vercel` links/creates the Vercel project, syncs production environment variables, attempts to create Vercel Blob storage, adds `techchimps.com` and `www.techchimps.com`, and updates Namecheap DNS automatically when Namecheap API credentials are present.

`sync:vercel-deploy-hook` creates and saves the production deploy hook after the Vercel project is connected to a Git repository. Vercel blocks deploy hooks until Git is connected.

Use `/api/stripe/webhook` as the Stripe webhook endpoint and enable `checkout.session.completed`. `/api/automations/health` reports integration readiness and can be called with `POST` to run a self-healing sweep for paid orders that need their chat handoff repaired.

## Production operations

- Customer portal receipts are available at `/api/portal/receipts?reference=ORDER_REFERENCE` after Stripe generates an invoice or receipt.
- Admin backups are available from the dashboard or `/api/admin/backups` and include customers, orders, inbox messages, live chat, prompts, CRM records, and automation events.
- Admin login supports a single `ADMIN_PASSWORD` fallback or named users through `ADMIN_USERS_JSON`, for example:

```json
[
  {
    "email": "owner@techchimps.com",
    "name": "TechChimps Owner",
    "password": "use-a-long-private-password",
    "role": "owner"
  }
]
```

- Customer email is handled with normal click-to-send `mailto:` links using `NEXT_PUBLIC_CONTACT_EMAIL`. Customer updates also land in the portal inbox and admin automation log.
- Legal pages are live at `/privacy`, `/terms`, and `/refunds`.
