export const dynamic = "force-static";

import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/utils";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    { path: "/", priority: 1.0, changeFrequency: "weekly" as const },
    { path: "/for-litigators", priority: 0.9, changeFrequency: "monthly" as const },
    { path: "/for-per-diems", priority: 0.9, changeFrequency: "monthly" as const },
    { path: "/pricing", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/about", priority: 0.6, changeFrequency: "monthly" as const },
    { path: "/security", priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/faq", priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/waitlist", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/blog", priority: 0.5, changeFrequency: "weekly" as const },
    { path: "/legal/terms", priority: 0.3, changeFrequency: "yearly" as const },
    { path: "/legal/privacy", priority: 0.3, changeFrequency: "yearly" as const },
    { path: "/legal/ai-disclosure", priority: 0.3, changeFrequency: "yearly" as const },
  ];
  const now = new Date();
  return routes.map((r) => ({
    url: `${SITE_URL}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));
}
