import { Mail, MapPin, Phone, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { CustomerAccountLink } from "@/components/portal/customer-account-link";
import { getContactEmail, getContactPhone } from "@/lib/contact";

export function Footer() {
  const contactEmail = getContactEmail();
  const contactPhone = getContactPhone();

  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div>
          <p className="eyebrow">TechChimps</p>
          <h2>Powered by bananas.</h2>
          <p>Affordable services for websites, apps, bots, creative work, audio, video, automation, and care plans.</p>
        </div>
        <div className="footer-links">
          <Link href="/services">Services</Link>
          <Link href="/pricing">Pricing</Link>
          <Link href="/find-us">Contact us</Link>
          <Link href="/request">Custom request</Link>
          <Link href="/process">Steps</Link>
          <Link href="/faq">FAQ</Link>
          <CustomerAccountLink />
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/refunds">Refunds</Link>
        </div>
        <div className="footer-contact">
          <span>
            <MapPin aria-hidden size={18} /> UK-friendly remote studio
          </span>
          <a href={`mailto:${contactEmail}`}>
            <Mail aria-hidden size={18} /> {contactEmail}
          </a>
          <a href={contactPhone.telHref}>
            <Phone aria-hidden size={18} /> {contactPhone.display}
          </a>
          <span>
            <ShieldCheck aria-hidden size={18} /> Support guarantee included
          </span>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>Developed by Wade2wavey est. 2026</span>
      </div>
    </footer>
  );
}
