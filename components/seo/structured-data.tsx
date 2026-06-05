import { publicServices } from "@/data/services";

export function StructuredData() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://techchimps.com";
  const schema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "TechChimps",
    description:
      "Friendly UK tech services studio building affordable websites, web apps, Discord bots, automations, desktop tools, maintenance, and custom software for beginners, creators, and businesses.",
    url: baseUrl,
    image: `${baseUrl}/images/techchimps-social-card-v5.png`,
    areaServed: "United Kingdom",
    telephone: "+447472457653",
    sameAs: [
      "https://www.instagram.com/thetechchimps/",
      "https://www.facebook.com/profile.php?id=61590253839961",
      "https://www.linkedin.com/in/tech-chimps-360287412/",
      "https://www.youtube.com/@TheTechChimps",
      "https://github.com/TheTechChimps",
      "https://wa.me/447472457653"
    ],
    priceRange: "GBP 19-299",
    knowsAbout: [
      "affordable web design UK",
      "beginner-friendly websites",
      "Discord bot development",
      "desktop app development",
      "automation services UK",
      "custom software development"
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
