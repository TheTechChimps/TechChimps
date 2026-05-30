import type { Metadata } from "next";

const siteName = "TechChimps";
const defaultDescription =
  "TechChimps is an affordable UK tech services studio for websites, web apps, Discord bots, automations, desktop tools, and custom software, with clear prices and friendly support.";

const socialImage = {
  url: "/images/techchimps-social-card-v5.png",
  width: 1200,
  height: 630,
  alt: "TechChimps branded preview card for affordable tech services, websites, apps, bots, automation, and custom software."
};

export function createMetadata({
  title,
  description = defaultDescription,
  path = "/",
  keywords = []
}: {
  title?: string;
  description?: string;
  path?: string;
  keywords?: string[];
} = {}): Metadata {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://techchimps.com";
  const pageTitle = title ? `${title} | ${siteName}` : `${siteName} | Affordable tech services, websites and apps`;
  const canonical = new URL(path, baseUrl).toString();

  return {
    metadataBase: new URL(baseUrl),
    title: pageTitle,
    description,
    keywords: [
      "affordable web design UK",
      "beginner-friendly websites",
      "Discord bot development",
      "desktop app development",
      "business websites",
      "automation services UK",
      "custom software development",
      ...keywords
    ],
    alternates: {
      canonical
    },
    openGraph: {
      title: pageTitle,
      description,
      url: canonical,
      siteName,
      images: [socialImage],
      locale: "en_GB",
      type: "website"
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description,
      images: [socialImage.url]
    }
  };
}
