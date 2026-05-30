import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://techchimps.example";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/portal"]
    },
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl
  };
}
