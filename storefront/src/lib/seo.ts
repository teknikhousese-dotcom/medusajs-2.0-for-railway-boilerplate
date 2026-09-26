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

/* ---------- Page titles and meta descriptions ---------- */

export const TITLE_MAX = 65
export const DESC_MAX = 160
const BRAND_SUFFIX = " | " + SITE_NAME

/** Correct casing for brand and model words (GOOGLE becomes Google, iphone becomes iPhone). */
const WORD_CASE: Record<string, string> = {
  iphone: "iPhone", ipad: "iPad", ipod: "iPod", imac: "iMac", macbook: "MacBook", airpods: "AirPods",
  apple: "Apple", samsung: "Samsung", galaxy: "Galaxy", huawei: "Huawei", honor: "Honor",
  sony: "Sony", xperia: "Xperia", google: "Google", pixel: "Pixel", oneplus: "OnePlus",
  motorola: "Motorola", moto: "Moto", lenovo: "Lenovo", lg: "LG", htc: "HTC", asus: "ASUS",
  zenfone: "Zenfone", nokia: "Nokia", lumia: "Lumia", xiaomi: "Xiaomi", redmi: "Redmi",
  nexus: "Nexus", blackview: "Blackview", microsoft: "Microsoft",
  pro: "Pro", max: "Max", plus: "Plus", mini: "Mini", ultra: "Ultra", lite: "Lite",
  edge: "Edge", note: "Note", compact: "Compact", premium: "Premium", style: "Style", tab: "Tab",
  hdmi: "HDMI", usb: "USB", ssd: "SSD", lcd: "LCD", oled: "OLED", led: "LED",
}

/** Drops a word run that repeats right after itself: "Samsung Galaxy Samsung Galaxy S22" becomes "Samsung Galaxy S22". */
export const dedupeWords = (text: string): string => {
  const words = String(text || "").split(/\s+/).filter(Boolean)
  for (let n = 3; n >= 1; n--) {
    let i = 0
    while (i + 2 * n <= words.length) {
      const a = words.slice(i, i + n).join(" ").toLowerCase()
      const b = words.slice(i + n, i + 2 * n).join(" ").toLowerCase()
      if (a === b) words.splice(i + n, n)
      else i++
    }
  }
  return words.join(" ")
}

/** Brand and model casing for a category name: ALL CAPS words are lowered, known brands keep their own casing. */
export const properName = (name?: string | null): string => {
  const words = String(name || "").replace(/\s+/g, " ").replace(/[.\s]+$/, "").trim().split(" ")
  const cased = words.map((w, i) => {
    const known = WORD_CASE[w.toLowerCase()]
    if (known) return known
    const letters = w.replace(/[^A-Za-zÅÄÖÉÜåäöéü]/g, "")
    if (letters.length >= 4 && !/\d/.test(w) && w === w.toUpperCase()) {
      const low = w.toLowerCase()
      return i === 0 ? low.charAt(0).toUpperCase() + low.slice(1) : low
    }
    return w
  })
  return dedupeWords(cased.join(" "))
}

/** No en or em dashes in titles and descriptions: a spaced dash becomes a comma. */
export const noDashes = (text?: string | null): string =>
  String(text || "")
    .replace(/\s+[–—-]+\s+/g, ", ")
    .replace(/[–—]/g, "-")
    .replace(/\s*,(\s*,)+/g, ",")
    .replace(/\s+/g, " ")
    .trim()

const DANGLING_END = /(\s+(och|&|till|för|med|i|på|av|samt|från))+$/i

/** Cuts text to at most max chars on a word boundary, never mid-word, without a dangling "och", comma or bracket. */
export const cutAtWord = (text: string, max: number): string => {
  const t = String(text || "").replace(/\s+/g, " ").trim()
  if (t.length <= max) return t
  const cut = t.slice(0, max + 1)
  const sp = cut.lastIndexOf(" ")
  let out = sp > 0 ? cut.slice(0, sp) : t.slice(0, max)
  for (let k = 0; k < 3; k++) {
    out = out.replace(/[\s,.;:/|+&(–—-]+$/, "").replace(DANGLING_END, "")
    const open = out.lastIndexOf("(")
    if (open > -1 && out.indexOf(")", open) === -1) out = out.slice(0, open)
  }
  return out.trim()
}

const BRAND_TAIL = /(\s*[-–—|:,]?\s*(köp (på|här)|teknik ?house|tekikhouse|teknikdelar|teknikh[a-z]*)(\.[a-z]{2,3})?\s*)+$/i

/** Removes old shop names and "Köp på" leftovers from the end of a stored title. */
export const stripBrand = (text?: string | null): string =>
  String(text || "").replace(/\s+/g, " ").replace(BRAND_TAIL, "").replace(DANGLING_END, "").trim()

/** A stored seo_title / meta_title is only used when it is clean; otherwise the builder decides. */
export const cleanStoredTitle = (text?: string | null, maxLen: number = TITLE_MAX - BRAND_SUFFIX.length): string => {
  const core = stripBrand(text)
  if (!core || core.length > maxLen) return ""
  if (/teknikdelar|köp (på|här)|\||[–—!]|\s-\s/i.test(core)) return ""
  if (dedupeWords(core).toLowerCase() !== core.toLowerCase()) return ""
  if (/(^|[^A-Za-zÅÄÖåäö])[A-ZÅÄÖ]{4,}([^A-Za-zÅÄÖåäö]|$)/.test(core)) return ""
  return core
}

/** "<core> | Teknikhouse", at most 65 chars, cut on a word boundary. Page 2+ gets ", sida N". */
export const pageTitle = (core: string, page?: number): string => {
  const paged = page && page > 1 ? ", sida " + page : ""
  const room = TITLE_MAX - BRAND_SUFFIX.length - paged.length
  const clean = dedupeWords(noDashes(stripBrand(core))) || SITE_NAME
  return cutAtWord(clean, room) + paged + BRAND_SUFFIX
}

const DESC_EXTRAS = [
  "Eget lager i Stockholm och snabb leverans.",
  "Fri frakt över 999 kr.",
  "30 dagars öppet köp.",
  "Garanti på allt du köper.",
  "Betala med Klarna eller Swish.",
]

/** A standard sentence is skipped when the text already covers the topic. */
const EXTRA_TOPICS: RegExp[] = [/leverans/i, /frakt/i, /öppet köp/i, /garanti/i, /klarna|swish/i]

/** Meta description of about 140 to 160 chars: a lead sentence plus the standard sentences that fit. No dashes. */
export const fitDescription = (lead?: string | null, extras: string[] = DESC_EXTRAS): string => {
  let out = dedupeWords(noDashes(plainText(lead, 2000)))
    .replace(/(fri frakt (över|från) )499\s*kr/gi, (_m: string, a: string) => a + "999 kr")
    .replace(/\.se\.se\b/gi, ".se")
  if (out.length > DESC_MAX || (out && !/[.!?]$/.test(out))) {
    const head = out.slice(0, DESC_MAX)
    const end = Math.max(head.lastIndexOf(". "), head.lastIndexOf("! "), head.lastIndexOf("? "), /[.!?]$/.test(head) ? head.length - 1 : -1)
    if (end >= 70) out = head.slice(0, end + 1)
    else if (out.length > DESC_MAX) out = cutAtWord(out, DESC_MAX - 1) + "…"
    else out += "."
  }
  for (const e of extras) {
    const topic = EXTRA_TOPICS.find((t) => t.test(e))
    if (topic && topic.test(out)) continue
    if (out.length + 1 + e.length <= DESC_MAX) out = (out ? out + " " : "") + e
  }
  return out
}

export type SeoCategory = {
  id?: string
  name?: string | null
  handle?: string | null
  description?: string | null
  parent_category_id?: string | null
  metadata?: Record<string, unknown> | null
}

const ROOT_TITLES: Record<string, string> = {
  mobilreservdelar: "Mobilreservdelar till iPhone, Samsung och fler",
  mobiltillbehor: "Mobiltillbehör: skal, skydd, laddare och kablar",
  batterier: "Batterier till mobil och surfplatta",
}

/** Brand categories whose own name is not what people search for. */
const BRAND_NAMES: Record<string, string> = {
  apple: "iPhone och iPad",
  google: "Google Pixel",
  "ovriga-tillverkare": "Övriga tillverkare",
}

const BRAND_TREES = ["mobilreservdelar", "mobiltillbehor"]

const handleSegment = (c?: SeoCategory, parent?: SeoCategory): string => {
  const h = String((c && c.handle) || "")
  const p = parent && parent.handle ? String(parent.handle) + "-" : ""
  return p && h.indexOf(p) === 0 ? h.slice(p.length) : h
}

/** Display name for the last category in a root-to-leaf chain ("Xperia M2" under Sony Xperia becomes "Sony Xperia M2"). */
export const categoryDisplayName = (chain: SeoCategory[]): string => {
  const last = chain[chain.length - 1]
  if (!last) return ""
  const root = String((chain[0] && chain[0].handle) || "")
  if (chain.length < 2 || BRAND_TREES.indexOf(root) === -1) return properName(last.name)
  const brandSeg = handleSegment(chain[1], chain[0])
  const brand = BRAND_NAMES[brandSeg] || properName(chain[1].name)
  if (chain.length === 2) return brand
  let name = properName(last.name)
  if (BRAND_NAMES[brandSeg]) return name
  if (/^övriga$/i.test(name)) return "Övriga " + brand
  const first = brand.split(" ")[0].toLowerCase()
  if (name.toLowerCase().split(" ").indexOf(first) === -1) name = dedupeWords(brand + " " + name)
  return name
}

/**
 * Category title, at most 65 chars:
 * "Samsung Galaxy S22 Ultra reservdelar | Teknikhouse",
 * "iPhone och iPad reservdelar: skärm och batteri | Teknikhouse".
 * A stored seo_title is used only outside the brand trees and only when clean.
 */
export const categoryTitle = (chain: SeoCategory[], page?: number): string => {
  const last = chain[chain.length - 1]
  if (!last) return pageTitle(SITE_NAME, page)
  const root = String((chain[0] && chain[0].handle) || "")
  const md: any = last.metadata || {}
  const custom = BRAND_TREES.indexOf(root) === -1 ? cleanStoredTitle(md.seo_title as string) : ""
  const name = categoryDisplayName(chain)
  let options: string[]
  if (chain.length === 1) {
    options = [ROOT_TITLES[root] || custom || name]
  } else if (root === "mobilreservdelar") {
    const base = /reservdel/i.test(name) ? name : name + " reservdelar"
    options = [base + ": skärm, batteri och delar", base + ": skärm och batteri", base]
  } else if (root === "mobiltillbehor") {
    const base = /tillbehör/i.test(name) ? name : name + " tillbehör"
    options = [base + ": skal, skydd och laddare", base + ": skal och skydd", base]
  } else if (root === "batterier" && chain.length >= 3) {
    options = [/batteri/i.test(name) ? name : name + " batterier"]
  } else {
    const rootName = properName(chain[0].name)
    options = [custom, name.toLowerCase().indexOf(rootName.toLowerCase()) > -1 ? "" : name + " | " + rootName, name]
  }
  const paged = page && page > 1 ? ", sida " + page : ""
  const room = TITLE_MAX - BRAND_SUFFIX.length - paged.length
  const usable = options.filter(Boolean)
  const pick = usable.find((o) => noDashes(o).length <= room) || usable[usable.length - 1] || name
  return pageTitle(pick, page)
}

/** Category meta description, 140 to 160 chars, Swedish, no dashes. */
export const categoryDescription = (chain: SeoCategory[]): string => {
  const last = chain[chain.length - 1]
  const md: any = (last && last.metadata) || {}
  const stored = plainText(String(md.seo_desc || ""), 2000)
  if (stored.length >= 100 && !/teknikdelar/i.test(stored)) return fitDescription(stored)
  const root = String((chain[0] && chain[0].handle) || "")
  const name = categoryDisplayName(chain)
  if (chain.length <= 1) return fitDescription(plainText(last && last.description, 2000) || name + " hos Teknikhouse, stort urval till bra priser.")
  if (root === "mobilreservdelar") return fitDescription("Reservdelar till " + name + ": skärmar, batterier, baksidor och smådelar i hög kvalitet.")
  if (root === "mobiltillbehor") return fitDescription("Tillbehör till " + name + ": skal, skärmskydd, laddare och kablar.")
  if (root === "batterier") return fitDescription("Nya batterier till " + name + " i hög kvalitet, enkla att byta själv.")
  return fitDescription("Köp " + name + " hos Teknikhouse till bra priser.")
}

/** Product title "<title> | Teknikhouse", cut on a word boundary. A clean meta_title wins. */
export const productTitle = (product: any): string => {
  const md: any = (product && product.metadata) || {}
  const stored = cleanStoredTitle(md.meta_title as string, 200)
  return pageTitle(stored || String((product && product.title) || ""))
}

/** Product meta description, 140 to 160 chars, no dashes. */
export const productDescription = (product: any): string => {
  const md: any = (product && product.metadata) || {}
  const sources = [md.meta_description, md.seo_desc, product && product.description, product && product.subtitle]
  const src = sources
    .map((s) => plainText(String(s || ""), 2000))
    .find((s) => s.length >= 50 && !/teknikdelar/i.test(s))
  const title = noDashes(String((product && product.title) || ""))
  return fitDescription(src || title + " hos Teknikhouse.")
}
