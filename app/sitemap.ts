import type { MetadataRoute } from "next";
import { publicServices } from "@/data/services";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://techchimps.example";
  const now = new Date();
  const staticRoutes = ["/services", "/pricing", "/find-us", "/process", "/faq", "/request", "/portal", "/privacy", "/terms", "/refunds"];

  return [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1
    },
    ...staticRoutes.map((route) => ({
      url: `${baseUrl}${route}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: route === "/request" ? 0.9 : 0.7
    })),
    ...publicServices.map((service) => ({
      url: `${baseUrl}/services/${service.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.8
    }))
  ];
}
