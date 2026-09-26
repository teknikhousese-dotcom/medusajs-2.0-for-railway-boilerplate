import type { Metadata } from "next"

/**
 * Technical SEO helpers for www.teknikhouse.se.
 *
 * The public host is always https://www.teknikhouse.se. The apex domain
 * 301-redirects to www (one.com .htaccess), so every canonical, sitemap entry,
 * og:url and JSON-LD id is written for www, never for the apex or the Railway
 * host. NEXT_PUBLIC_SITE_URL can override it (for a staging deploy).
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.teknikhouse.se"
).replace(/\/+$/, "")

export const SITE_NAME = "Teknikhouse"
export const LEGAL_NAME = "Nordic Teknik House AB"
export const ORG_NR = "559118-7488"
export const SITE_EMAIL = "info@teknikhouse.se"
export const FREE_SHIPPING_FROM_SEK = 999

export const ORG_ID = `${SITE_URL}/#organization`
export const WEBSITE_ID = `${SITE_URL}/#website`
export const STORE_ID = `${SITE_URL}/#butik`

export const DEFAULT_DESCRIPTION =
  "Mobilreservdelar, skärmar, batterier, verktyg och mobiltillbehör för iPhone, Samsung och fler märken. Eget lager i Stockholm, fri frakt över 999 kr och 30 dagars öppet köp."

/** Absolute www URL for a site path. No trailing slash except for the root. */
export const absUrl = (path: string = "/"): string => {
  if (/^https?:\/\//i.test(path)) return path
  let p = path.startsWith("/") ? path : `/${path}`
  p = p.replace(/\/+$/, "")
  return p ? `${SITE_URL}${p}` : `${SITE_URL}/`
}

/** canonical + hreflang (sv-SE and x-default) for one indexable URL. */
export const pageAlternates = (path: string): Metadata["alternates"] => {
  const url = absUrl(path)
  return {
    canonical: url,
    languages: { "sv-SE": url, "x-default": url },
  }
}

/** Robots meta for private or infinite pages: cart, checkout, account, search. */
export const NOINDEX: Metadata["robots"] = {
  index: false,
  follow: true,
  googleBot: { index: false, follow: true },
}

/** Serialise JSON-LD safely for a <script> tag. */
export const jsonLd = (data: unknown): string =>
  JSON.stringify(data).replace(/</g, "\\u003c")

/** Strip HTML to plain text for descriptions and JSON-LD. */
export const plainText = (html?: string | null, max: number = 5000): string => {
  if (!html) return ""
  const text = String(html)
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim()
  return text.length > max ? text.slice(0, max - 1).trimEnd() + "…" : text
}

/** Meta description: plain text cut on a word boundary at about 155 chars. */
export const metaDescription = (text?: string | null, max: number = 155): string => {
  const t = plainText(text, 2000)
  if (t.length <= max) return t
  const cut = t.slice(0, max)
  const sp = cut.lastIndexOf(" ")
  return (sp > 80 ? cut.slice(0, sp) : cut).replace(/[\s,.;:–-]+$/, "") + "…"
}

export const LOGO_URL = `${SITE_URL}/icon-512.png`

export const SE_ADDRESS = {
  "@type": "PostalAddress",
  streetAddress: "Sveavägen 139",
  postalCode: "113 46",
  addressLocality: "Stockholm",
  addressCountry: "SE",
}

/** 30 dagars öppet köp inom Sverige, kunden står för returfrakten (se /info/oppet-kop-retur). */
export const RETURN_POLICY = {
  "@type": "MerchantReturnPolicy",
  applicableCountry: "SE",
  returnPolicyCountry: "SE",
  returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
  merchantReturnDays: 30,
  returnMethod: "https://schema.org/ReturnByMail",
  returnFees: "https://schema.org/ReturnFeesCustomerResponsibility",
  merchantReturnLink: `${SITE_URL}/info/oppet-kop-retur`,
}

/** Fri frakt inom Sverige från 999 kr, skickas inom 0–1 dagar, 1–3 dagars transport. */
export const FREE_SHIPPING_DETAILS = {
  "@type": "OfferShippingDetails",
  shippingRate: { "@type": "MonetaryAmount", value: 0, currency: "SEK" },
  shippingDestination: { "@type": "DefinedRegion", addressCountry: "SE" },
  deliveryTime: {
    "@type": "ShippingDeliveryTime",
    handlingTime: { "@type": "QuantitativeValue", minValue: 0, maxValue: 1, unitCode: "DAY" },
    transitTime: { "@type": "QuantitativeValue", minValue: 1, maxValue: 3, unitCode: "DAY" },
  },
}

/** Organization (OnlineStore) + WebSite + physical Store, sitewide. */
export const siteGraph = () => ({
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "OnlineStore",
      "@id": ORG_ID,
      name: SITE_NAME,
      alternateName: "Teknikhouse.se",
      legalName: LEGAL_NAME,
      url: `${SITE_URL}/`,
      logo: { "@type": "ImageObject", url: LOGO_URL, width: 512, height: 512 },
      image: LOGO_URL,
      description: DEFAULT_DESCRIPTION,
      email: SITE_EMAIL,
      address: SE_ADDRESS,
      vatID: "SE559118748801",
      taxID: ORG_NR,
      foundingDate: "2014",
      areaServed: "SE",
      contactPoint: [
        {
          "@type": "ContactPoint",
          contactType: "customer service",
          email: SITE_EMAIL,
          areaServed: "SE",
          availableLanguage: ["sv", "en"],
        },
      ],
      sameAs: ["https://se.trustpilot.com/review/teknikhouse.se"],
      hasMerchantReturnPolicy: RETURN_POLICY,
    },
    {
      "@type": "WebSite",
      "@id": WEBSITE_ID,
      url: `${SITE_URL}/`,
      name: SITE_NAME,
      alternateName: "Teknikhouse.se",
      inLanguage: "sv-SE",
      publisher: { "@id": ORG_ID },
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${SITE_URL}/results/{search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "ElectronicsStore",
      "@id": STORE_ID,
      name: "Teknikhouse / Phone Rep – butik och verkstad",
      url: `${SITE_URL}/info/phone-rep`,
      image: LOGO_URL,
      email: SITE_EMAIL,
      address: SE_ADDRESS,
      parentOrganization: { "@id": ORG_ID },
      openingHoursSpecification: [
        {
          "@type": "OpeningHoursSpecification",
          dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
          opens: "10:00",
          closes: "18:00",
        },
        {
          "@type": "OpeningHoursSpecification",
          dayOfWeek: "Saturday",
          opens: "11:00",
          closes: "17:00",
        },
      ],
    },
  ],
})

export type Crumb = { name: string; path: string }

export const breadcrumbLd = (crumbs: Crumb[]) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: crumbs.map((c, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: c.name,
    item: absUrl(c.path),
  })),
})

type Cat = {
  id: string
  name?: string | null
  handle?: string | null
  parent_category_id?: string | null
}

/** Category chain from the root down to `handle` (for breadcrumbs). */
export const categoryChain = (categories: Cat[], handle?: string | null): Cat[] => {
  if (!handle) return []
  const byId = new Map(categories.map((c) => [c.id, c]))
  const start = categories.find((c) => c.handle === handle)
  const chain: Cat[] = []
  let cur: Cat | undefined = start
  let guard = 0
  while (cur && guard++ < 10) {
    chain.unshift(cur)
    cur = cur.parent_category_id ? byId.get(cur.parent_category_id) : undefined
  }
  return chain
}

const truthy = (v: unknown) => v === true || v === "true" || v === 1 || v === "1"
const falsy = (v: unknown) => v === false || v === "false" || v === 0 || v === "0"

/** Same stock rule as the Google Shopping feed (backend/src/api/google-feed). */
export const productInStock = (product: any): boolean => {
  const meta = product?.metadata || {}
  if (falsy(meta.in_stock)) return false
  if (truthy(meta.in_stock)) return true
  if (truthy(meta.oandligt)) return true
  const qty = Number(meta.antal)
  return Number.isFinite(qty) ? qty > 0 : true
}

/** Same condition rule as the Google Shopping feed. */
export const productCondition = (product: any): string => {
  const sk = String(product?.metadata?.skick || product?.metadata?.condition || "")
  if (/begagn|used/i.test(sk)) return "https://schema.org/UsedCondition"
  if (/refurb|renov/i.test(sk)) return "https://schema.org/RefurbishedCondition"
  return "https://schema.org/NewCondition"
}

export type ReviewData = {
  count: number
  average: number
  reviews: { author?: string; rating?: number; comment?: string; created_at?: string }[]
}

/**
 * Product JSON-LD with one Offer per priced variant (SEK incl. moms), the
 * 30-day return policy, free-shipping details from 999 kr, and ratings only
 * when real reviews exist.
 */
export const productLd = (product: any, url: string, reviews?: ReviewData | null) => {
  const meta = product?.metadata || {}
  const inStock = productInStock(product)
  const images: string[] = [
    product?.thumbnail,
    ...((product?.images || []).map((i: any) => i?.url) as string[]),
  ].filter((u, i, a): u is string => !!u && /^https?:\/\//.test(u) && a.indexOf(u) === i)
  const brand = String(meta.producer || meta.tillverkare || meta.brand || product?.collection?.title || SITE_NAME)
  const description = plainText(
    product?.description || meta.meta_description || product?.subtitle || product?.title,
    4900
  )

  const offers = (product?.variants || [])
    .filter((v: any) => v?.calculated_price?.calculated_amount != null)
    .map((v: any) => {
      const cp = v.calculated_price
      const price = Number(cp.calculated_amount)
      const original = Number(cp.original_amount ?? cp.calculated_amount)
      const currency = String(cp.currency_code || "sek").toUpperCase()
      const gtinRaw = String(v.ean || v.barcode || v.upc || meta.ean || meta.gtin || "").replace(/\D/g, "")
      const offer: Record<string, unknown> = {
        "@type": "Offer",
        url,
        sku: v.sku || undefined,
        gtin: /^\d{8}$|^\d{12,14}$/.test(gtinRaw) ? gtinRaw : undefined,
        price: price.toFixed(2),
        priceCurrency: currency,
        availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        itemCondition: productCondition(product),
        seller: { "@id": ORG_ID },
        hasMerchantReturnPolicy: RETURN_POLICY,
      }
      if (original > price) {
        offer.priceSpecification = [
          {
            "@type": "UnitPriceSpecification",
            price: price.toFixed(2),
            priceCurrency: currency,
            valueAddedTaxIncluded: true,
          },
          {
            "@type": "UnitPriceSpecification",
            priceType: "https://schema.org/StrikethroughPrice",
            price: original.toFixed(2),
            priceCurrency: currency,
            valueAddedTaxIncluded: true,
          },
        ]
      }
      if (currency === "SEK" && price >= FREE_SHIPPING_FROM_SEK) {
        offer.shippingDetails = FREE_SHIPPING_DETAILS
      }
      return offer
    })

  const v0: any = product?.variants?.[0] || {}
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${url}#product`,
    name: product?.title,
    description: description || undefined,
    url,
    image: images.length ? images : undefined,
    sku: v0.sku || undefined,
    mpn: String(meta.mpn || meta.artnr || v0.sku || "") || undefined,
    brand: { "@type": "Brand", name: brand },
    color: meta.color || meta.farg || undefined,
    category: product?.type?.value || undefined,
    offers: offers.length === 1 ? offers[0] : offers.length ? offers : undefined,
  }

  if (reviews && reviews.count > 0 && reviews.average > 0) {
    data.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: Number(reviews.average).toFixed(1),
      reviewCount: reviews.count,
      bestRating: 5,
      worstRating: 1,
    }
    data.review = (reviews.reviews || []).slice(0, 10).map((r) => ({
      "@type": "Review",
      reviewRating: { "@type": "Rating", ratingValue: r.rating || 5, bestRating: 5, worstRating: 1 },
      author: { "@type": "Person", name: r.author || "Kund" },
      reviewBody: r.comment || undefined,
      datePublished: r.created_at ? String(r.created_at).slice(0, 10) : undefined,
    }))
  }

  return data
}
