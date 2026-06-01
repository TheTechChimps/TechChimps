import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://techchimps.com");

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/portal"]
    },
    sitemap: new URL("/sitemap.xml", siteUrl).toString(),
    host: siteUrl.host
  };
}
