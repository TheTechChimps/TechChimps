"use client";

import { ChevronDown, Menu, MessageCircle, Sparkles, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { AdminLink } from "@/components/admin/admin-link";
import { ButtonLink } from "@/components/ui/button";
import { publicServices, serviceCategories } from "@/data/services";
import { formatPrice } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/pricing", label: "Pricing" },
  { href: "/find-us", label: "Find us" },
  { href: "/faq", label: "FAQ" },
  { href: "/portal", label: "Login" }
];

const serviceGroups = serviceCategories.map((category) => ({
  category,
  items: publicServices.filter((service) => service.category === category)
}));

const mobileNavItems = navItems.filter((item) => item.href !== "/find-us" && item.href !== "/portal");

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);

  const closeMenus = () => {
    setMegaOpen(false);
    setMenuOpen(false);
  };

  return (
    <header className="navbar-wrap">
      <nav aria-label="Main navigation" className="navbar container">
        <Link aria-label="TechChimps home" className="brand" href="/" onClick={closeMenus}>
          <span className="brand-mark">
            <Image alt="" height={40} priority src="/images/techchimps-logo-square-small.png" width={40} />
          </span>
          <span>
            <strong>TechChimps</strong>
            <small>Powered by bananas</small>
          </span>
        </Link>

        <div className="nav-links">
          <button
            aria-expanded={megaOpen}
            className="nav-mega-button"
            onClick={() => setMegaOpen((value) => !value)}
            type="button"
          >
            Services menu <ChevronDown aria-hidden size={16} />
          </button>
          {navItems.map((item) => (
            <Link href={item.href} key={item.href} onClick={() => setMegaOpen(false)}>
              {item.label}
            </Link>
          ))}
        </div>

        <div className="nav-actions">
          <ButtonLink href="/request" size="sm" variant="primary">
            Request
          </ButtonLink>
          <button
            aria-expanded={menuOpen}
            aria-label="Open navigation menu"
            className="icon-button mobile-toggle"
            onClick={() => setMenuOpen((value) => !value)}
            type="button"
          >
            {menuOpen ? <X aria-hidden size={20} /> : <Menu aria-hidden size={20} />}
          </button>
        </div>
      </nav>

      {megaOpen ? (
        <div className="mega-menu container">
          <div className="mega-inner">
            <div className="mega-intro">
              <span className="eyebrow">
                <Sparkles size={15} /> Service menu
              </span>
              <h2>Choose exactly what you need.</h2>
              <p>Every TechChimps service is listed here with clear starting prices.</p>
              <div className="mega-actions">
                <Link href="/request" onClick={() => setMegaOpen(false)}>
                  <MessageCircle aria-hidden size={18} />
                  Custom request
                </Link>
                <Link href="/pricing" onClick={() => setMegaOpen(false)}>
                  View all prices
                </Link>
              </div>
            </div>
            <div className="mega-services">
              {serviceGroups.map((group) => (
                <details className="mega-category" key={group.category}>
                  <summary>
                    <span>{group.category}</span>
                    <small>{group.items.length} options</small>
                    <ChevronDown aria-hidden size={16} />
                  </summary>
                  <div>
                    {group.items.map((service) => {
                      const Icon = service.icon;
                      return (
                        <Link
                          className="mega-service-link"
                          href={`/services/${service.slug}`}
                          key={service.slug}
                          onClick={() => setMegaOpen(false)}
                        >
                          <Icon aria-hidden size={17} />
                          <span>
                            {service.name}
                            <small>{formatPrice(service.price, service.priceSuffix)}</small>
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {menuOpen ? (
        <div className="mobile-menu">
          {mobileNavItems.map((item) => (
            <Link href={item.href} key={item.href} onClick={closeMenus}>
              {item.label}
            </Link>
          ))}
          <div aria-label="Quick actions" className="mobile-quick-actions">
            <Link href="/request" onClick={closeMenus}>
              Request
            </Link>
            <Link href="/portal" onClick={closeMenus}>
              Client portal
            </Link>
            <Link href="/find-us" onClick={closeMenus}>
              Find us
            </Link>
          </div>
          <div className="mobile-service-menu">
            <span>Services</span>
            {serviceGroups.map((group) => (
              <details key={group.category}>
                <summary>
                  <strong>{group.category}</strong>
                  <small>{group.items.length} options</small>
                  <ChevronDown aria-hidden size={16} />
                </summary>
                <div>
                  {group.items.map((service) => (
                    <Link href={`/services/${service.slug}`} key={service.slug} onClick={closeMenus}>
                      {service.name}
                      <small>{formatPrice(service.price, service.priceSuffix)}</small>
                    </Link>
                  ))}
                </div>
              </details>
            ))}
          </div>
          <AdminLink label="Admin" onNavigate={closeMenus} />
        </div>
      ) : null}
    </header>
  );
}
