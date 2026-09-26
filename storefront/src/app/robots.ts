import type { MetadataRoute } from "next"

import { SITE_URL } from "@lib/seo"

/**
 * /robots.txt
 *
 * Public URLs are clean (no /se prefix), so the private and infinite paths are
 * listed without it. The /se/ tree itself only 308-redirects to the clean URL.
 * Everything else, including product and category pages, stays crawlable.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/cart",
          "/checkout",
          "/kassa-klar",
          "/account",
          "/order/",
          "/results/",
          "/search",
          "/wishlist",
          "/reset-password",
          "/*?*cart_id=",
          "/*?*sortBy=",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
