import { publicServices } from "@/data/services";
import { getContactPhone } from "@/lib/contact";

export function StructuredData() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://techchimps.com";
  const contactPhone = getContactPhone();
  const schema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "TechChimps",
    description:
      "Friendly UK tech services studio building affordable websites, web apps, creative design, audio services, video edits, custom beats, Python programs, Discord bots, automations, desktop tools, document support, maintenance, and custom software for beginners, creators, and businesses.",
    url: baseUrl,
    image: `${baseUrl}/images/techchimps-social-card-v5.png`,
    areaServed: "United Kingdom",
    telephone: contactPhone.e164,
    sameAs: [
      "https://www.instagram.com/thetechchimps/",
      "https://www.facebook.com/profile.php?id=61590253839961",
      "https://www.linkedin.com/in/tech-chimps-360287412/",
      "https://www.youtube.com/@TheTechChimps",
      "https://github.com/TheTechChimps",
      contactPhone.whatsappHref
    ],
    priceRange: "GBP 19-299",
    knowsAbout: [
      "affordable web design UK",
      "beginner-friendly websites",
      "Discord bot development",
      "desktop app development",
      "automation services UK",
      "custom software development",
      "logo design UK",
      "video editing services UK",
      "mixing and mastering UK",
      "Python automation services",
      "document formatting help"
    ],
    makesOffer: publicServices.map((service) => ({
      "@type": "Offer",
      name: service.name,
      price: service.price,
      priceCurrency: "GBP",
      description: service.summary,
      url: `${baseUrl}/services/${service.slug}`
    }))
  };

  return (
    <script
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      id="local-business-schema"
      type="application/ld+json"
    />
  );
}
