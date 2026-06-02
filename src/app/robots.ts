import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api/", "/checkout", "/dashboard", "/orders", "/account", "/profile", "/subscription"],
      },
    ],
    sitemap: "https://madfresh.app/sitemap.xml",
  };
}
