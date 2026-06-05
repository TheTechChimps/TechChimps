import { ExternalLink, Mail, MessageCircle, Phone, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { ContactLiveChatButton } from "@/components/contact-live-chat-button";
import { LiveSupportWidget } from "@/components/sections/live-support-widget";
import { getContactPhone } from "@/lib/contact";
import { createMetadata } from "@/lib/seo";

const contactPhone = getContactPhone();

const socialLinks = [
  {
    name: "Instagram",
    handle: "@TheTechChimps",
    href: "https://www.instagram.com/thetechchimps/",
    description: "Updates, launches, offers.",
    cta: "Open",
    accent: "#e4405f",
    surface: "linear-gradient(135deg, #f58529, #dd2a7b 48%, #8134af)"
  },
  {
    name: "Facebook",
    handle: "@TheTechChimps",
    href: "https://www.facebook.com/profile.php?id=61590253839961",
    description: "Page updates and messages.",
    cta: "Open",
    accent: "#1877f2",
    surface: "linear-gradient(135deg, #1877f2, #4fa3ff)"
  },
  {
    name: "LinkedIn",
    handle: "Tech Chimps",
    href: "https://www.linkedin.com/in/tech-chimps-360287412/",
    description: "Business updates and services.",
    cta: "Open",
    accent: "#0a66c2",
    surface: "linear-gradient(135deg, #0a66c2, #53b7ff)"
  },
  {
    name: "YouTube",
    handle: "@TheTechChimps",
    href: "https://www.youtube.com/@TheTechChimps",
    description: "Demos, videos, walkthroughs.",
    cta: "Open",
    accent: "#ff0033",
    surface: "linear-gradient(135deg, #ff0033, #ff7a45)"
  },
  {
    name: "GitHub",
    handle: "TheTechChimps",
    href: "https://github.com/TheTechChimps",
    description: "Projects, code, portfolio proof.",
    cta: "Open",
    accent: "#f6f8fa",
    surface: "linear-gradient(135deg, #24292f, #586069)"
  },
  {
    name: "WhatsApp",
    handle: "TechChimps.com",
    href: contactPhone.whatsappHref,
    description: "Quick questions and direct chat.",
    cta: "Message",
    accent: "#25d366",
    surface: "linear-gradient(135deg, #075e54, #25d366)"
  }
];

function SocialLogo({ name }: { name: string }) {
  if (name === "Instagram") {
    return (
      <svg aria-hidden viewBox="0 0 24 24">
        <rect fill="none" height="17.6" rx="5" stroke="currentColor" strokeWidth="2.1" width="17.6" x="3.2" y="3.2" />
        <circle cx="12" cy="12" fill="none" r="4.15" stroke="currentColor" strokeWidth="2.1" />
        <circle cx="17.35" cy="6.65" fill="currentColor" r="1.2" />
      </svg>
    );
  }

  if (name === "LinkedIn") {
    return (
      <svg aria-hidden viewBox="0 0 24 24">
        <path d="M5.2 8.7h3.2v10.5H5.2V8.7Zm1.6-5.1a1.9 1.9 0 1 1 0 3.8 1.9 1.9 0 0 1 0-3.8Zm4.2 5.1h3.1v1.44h.04c.44-.83 1.52-1.7 3.12-1.7 3.34 0 3.96 2.2 3.96 5.06v5.7H18v-5.05c0-1.2-.02-2.75-1.68-2.75-1.68 0-1.94 1.31-1.94 2.67v5.13H11V8.7Z" />
      </svg>
    );
  }

  if (name === "Facebook") {
    return (
      <svg aria-hidden viewBox="0 0 24 24">
        <path d="M14.56 22v-8.34h2.81l.42-3.26h-3.23V8.32c0-.94.26-1.59 1.62-1.59h1.73V3.82a23.1 23.1 0 0 0-2.52-.13c-2.49 0-4.2 1.52-4.2 4.31v2.4H8.37v3.26h2.82V22h3.37Z" />
      </svg>
    );
  }

  if (name === "YouTube") {
    return (
      <svg aria-hidden viewBox="0 0 24 24">
        <path d="M22.3 6.7a3.05 3.05 0 0 0-2.14-2.16C18.27 4.03 12 4.03 12 4.03s-6.27 0-8.16.51A3.05 3.05 0 0 0 1.7 6.7 31.78 31.78 0 0 0 1.2 12c0 1.74.17 3.52.5 5.3a3.05 3.05 0 0 0 2.14 2.16c1.89.51 8.16.51 8.16.51s6.27 0 8.16-.51a3.05 3.05 0 0 0 2.14-2.16c.33-1.78.5-3.56.5-5.3 0-1.74-.17-3.52-.5-5.3ZM9.86 15.55v-7.1L16.02 12l-6.16 3.55Z" />
      </svg>
    );
  }

  if (name === "WhatsApp") {
    return (
      <svg aria-hidden viewBox="0 0 24 24">
        <path d="M12.04 2.1a9.82 9.82 0 0 0-8.4 14.88L2.5 21.9l5.04-1.12a9.82 9.82 0 1 0 4.5-18.68Zm0 17.82a7.98 7.98 0 0 1-4.06-1.1l-.29-.17-2.99.67.68-2.9-.2-.31a7.98 7.98 0 1 1 6.86 3.81Zm4.43-5.98c-.24-.12-1.43-.7-1.65-.78-.22-.08-.38-.12-.54.12-.16.24-.62.78-.76.94-.14.16-.28.18-.52.06-.24-.12-1.02-.38-1.94-1.2-.72-.64-1.2-1.43-1.34-1.67-.14-.24-.02-.37.1-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.2-.48-.4-.41-.54-.42h-.46c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2s.86 2.32.98 2.48c.12.16 1.69 2.58 4.09 3.62.57.25 1.02.4 1.37.51.58.18 1.1.15 1.52.09.46-.07 1.43-.58 1.63-1.14.2-.56.2-1.04.14-1.14-.06-.1-.22-.16-.46-.28Z" />
      </svg>
    );
  }

  return (
    <svg aria-hidden viewBox="0 0 24 24">
      <path d="M12 .7C5.75.7.7 5.75.7 12c0 5 3.24 9.24 7.73 10.74.57.1.78-.24.78-.54v-2.01c-3.14.68-3.8-1.35-3.8-1.35-.52-1.3-1.26-1.66-1.26-1.66-1.02-.7.08-.69.08-.69 1.14.08 1.74 1.18 1.74 1.18 1.01 1.73 2.66 1.23 3.31.94.1-.73.4-1.23.72-1.52-2.51-.28-5.15-1.25-5.15-5.57 0-1.23.44-2.24 1.17-3.03-.12-.29-.51-1.44.11-2.99 0 0 .95-.3 3.11 1.16.9-.25 1.87-.38 2.83-.38s1.93.13 2.83.38c2.16-1.46 3.11-1.16 3.11-1.16.62 1.55.23 2.7.11 2.99.73.79 1.17 1.8 1.17 3.03 0 4.33-2.64 5.28-5.16 5.56.41.35.77 1.04.77 2.1v3.12c0 .3.2.65.78.54A11.31 11.31 0 0 0 23.3 12C23.3 5.75 18.25.7 12 .7Z" />
    </svg>
  );
}

export const metadata = createMetadata({
  title: "Contact Us",
  description:
    "Contact TechChimps by email, phone, WhatsApp, live chat, Instagram, Facebook, LinkedIn, YouTube, and GitHub for friendly support and service updates.",
  path: "/find-us",
  keywords: [
    "contact TechChimps",
    "TechChimps Instagram",
    "TechChimps Facebook",
    "TechChimps YouTube",
    "TechChimps GitHub",
    "TechChimps LinkedIn",
    "TechChimps WhatsApp"
  ]
});

export default function FindUsPage() {
  return (
    <main>
      <section className="section find-us-hero">
        <div className="container find-us-hero-inner">
          <div className="find-us-copy">
            <span className="eyebrow">
              <Sparkles aria-hidden size={16} /> Contact TechChimps
            </span>
            <h1 className="headline">Contact us.</h1>
            <p className="subtitle">
              Ask a question, start a live chat, message us on WhatsApp, or follow the latest websites, apps, bots,
              creative work, audio, video, and automation updates.
            </p>
            <div className="button-row">
              <Link className="button button-primary button-lg" href="/request">
                Start a request
              </Link>
              <ContactLiveChatButton />
              <a className="button button-secondary button-lg" href="mailto:techchimps@proton.me">
                <Mail aria-hidden size={18} /> Email us
              </a>
              <a className="button button-secondary button-lg" href={contactPhone.telHref}>
                <Phone aria-hidden size={18} /> {contactPhone.display}
              </a>
            </div>
          </div>

          <div className="find-us-brand-card">
            <Image
              alt="TechChimps glossy monkey and banana logo"
              height={220}
              priority
              src="/images/techchimps-logo-square.png"
              width={220}
            />
            <strong>TechChimps</strong>
            <span>Powered by bananas</span>
          </div>
        </div>
      </section>

      <section className="section-tight find-us-social-section">
        <div className="container">
          <div className="find-us-grid">
            {socialLinks.map((social) => {
              return (
                <a
                  className="find-us-card"
                  href={social.href}
                  key={social.name}
                  aria-label={`Open TechChimps on ${social.name}`}
                  rel="noreferrer"
                  style={
                    {
                      "--social-accent": social.accent,
                      "--social-surface": social.surface
                    } as CSSProperties
                  }
                  target="_blank"
                >
                  <span className="find-us-icon">
                    <SocialLogo name={social.name} />
                  </span>
                  <span className="find-us-card-copy">
                    <span>{social.name}</span>
                    <strong>{social.handle}</strong>
                    <small>{social.description}</small>
                  </span>
                  <span className="find-us-card-action">
                    {social.cta}
                    <ExternalLink aria-hidden size={17} />
                  </span>
                </a>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section-tight find-us-band">
        <div className="container find-us-cta">
          <div>
            <span className="eyebrow">
              <MessageCircle aria-hidden size={16} /> Prefer a direct chat?
            </span>
            <h2 className="title">Tell us what you want built.</h2>
            <p className="subtitle">We will turn the idea into a clear price, a simple plan, and a friendly next step.</p>
          </div>
          <Link className="button button-primary button-lg" href="/request">
            Open request
          </Link>
        </div>
      </section>

      <LiveSupportWidget />
    </main>
  );
}
