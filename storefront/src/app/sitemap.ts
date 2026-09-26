import type { MetadataRoute } from "next"

import { absUrl } from "@lib/seo"
import { buildCategoryPathMap, productHref } from "@lib/util/teknik-url"

/**
 * /sitemap.xml
 *
 * Lists the clean public URLs exactly as the site links them:
 * /<dept>/<brand>/<model> for categories and /<category-path>/<handle> for
 * products (the old teknikhouse.se structure, see lib/util/teknik-url.ts),
 * always on https://www.teknikhouse.se. No /se prefix, no query strings.
 *
 * Talks to the Store API directly with a minimal field set, so the whole
 * catalogue fits in one request per 200 products and no price calculation
 * is triggered. One file holds up to 50,000 URLs, far above the catalogue.
 */
export const revalidate = 3600

const BACKEND = (process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "").replace(/\/+$/, "")
const PUBKEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""
const PAGE_SIZE = 200
const MAX_PAGES = 200

type Entry = MetadataRoute.Sitemap[number]

type Cat = {
  id: string
  handle?: string | null
  parent_category_id?: string | null
  updated_at?: string | null
  metadata?: Record<string, unknown> | null
}

type Prod = {
  handle?: string | null
  updated_at?: string | null
  thumbnail?: string | null
  metadata?: Record<string, unknown> | null
  categories?: { handle?: string | null }[] | null
}

const INFO_PAGES = [
  "om-oss",
  "villkor",
  "oppet-kop-retur",
  "integritetspolicy",
  "produktklassificering",
  "phone-rep",
  "salj-din-enhet",
]

const date = (value?: string | null): Date | undefined => {
  if (!value) return undefined
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? undefined : d
}

const store = async <T,>(path: string): Promise<T> => {
  const res = await fetch(`${BACKEND}${path}`, {
    headers: { "x-publishable-api-key": PUBKEY },
    next: { revalidate: 3600 },
  })
  if (!res.ok) throw new Error(`${path} answered ${res.status}`)
  return res.json() as Promise<T>
}

const allCategories = async (): Promise<Cat[]> => {
  const data = await store<{ product_categories: Cat[] }>(
    "/store/product-categories?limit=1000&fields=id,handle,parent_category_id,updated_at,metadata"
  )
  return data.product_categories || []
}

const allProducts = async (): Promise<Prod[]> => {
  const out: Prod[] = []
  for (let page = 0; page < MAX_PAGES; page++) {
    const data = await store<{ products: Prod[]; count: number }>(
      `/store/products?limit=${PAGE_SIZE}&offset=${page * PAGE_SIZE}` +
        "&fields=handle,updated_at,thumbnail,metadata,categories.handle"
    )
    const batch = data.products || []
    out.push(...batch)
    if (batch.length < PAGE_SIZE || out.length >= (data.count || 0)) break
  }
  return out
}

const allPosts = async (): Promise<{ slug?: string; published_at?: string; updated_at?: string }[]> => {
  const data = await store<{ posts?: { slug?: string; published_at?: string; updated_at?: string }[] }>(
    "/store/blog"
  )
  return Array.isArray(data?.posts) ? data.posts : []
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  const entries: Entry[] = [
    { url: absUrl("/"), lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: absUrl("/store"), changeFrequency: "daily", priority: 0.8 },
    { url: absUrl("/campaigns"), changeFrequency: "daily", priority: 0.7 },
    { url: absUrl("/blogg"), changeFrequency: "weekly", priority: 0.6 },
    { url: absUrl("/contact"), changeFrequency: "yearly", priority: 0.4 },
    { url: absUrl("/retail-application"), changeFrequency: "yearly", priority: 0.3 },
    ...INFO_PAGES.map(
      (slug): Entry => ({
        url: absUrl(`/info/${slug}`),
        changeFrequency: "monthly",
        priority: slug === "salj-din-enhet" || slug === "phone-rep" ? 0.6 : 0.4,
      })
    ),
  ]

  if (!BACKEND) {
    console.warn("sitemap: NEXT_PUBLIC_MEDUSA_BACKEND_URL is not set, only static pages listed.")
    return entries
  }

  const [categories, products, posts] = await Promise.all([
    allCategories().catch((e) => {
      console.warn("sitemap: could not list categories:", e)
      return [] as Cat[]
    }),
    allProducts().catch((e) => {
      console.warn("sitemap: could not list products:", e)
      return [] as Prod[]
    }),
    allPosts().catch((e) => {
      console.warn("sitemap: could not list blog posts:", e)
      return []
    }),
  ])

  const pathMap = buildCategoryPathMap(categories)
  const seen = new Set(entries.map((e) => e.url))
  const push = (e: Entry) => {
    if (seen.has(e.url)) return
    seen.add(e.url)
    entries.push(e)
  }

  for (const c of categories) {
    if (!c.handle) continue
    if (String(c.metadata?.noindex ?? "") === "1") continue
    const path = pathMap.get(c.handle)
    if (!path) continue
    push({
      url: absUrl(`/${path}`),
      lastModified: date(c.updated_at),
      changeFrequency: "weekly",
      priority: path.includes("/") ? 0.6 : 0.8,
    })
  }

  for (const p of products) {
    if (!p.handle) continue
    const img = p.thumbnail && /^https?:\/\//.test(p.thumbnail) ? [p.thumbnail] : undefined
    push({
      url: absUrl(productHref(p, pathMap)),
      lastModified: date(p.updated_at),
      changeFrequency: "weekly",
      priority: 0.7,
      ...(img ? { images: img } : {}),
    })
  }

  for (const post of posts) {
    if (!post?.slug) continue
    push({
      url: absUrl(`/blogg/${post.slug}`),
      lastModified: date(post.updated_at || post.published_at),
      changeFrequency: "monthly",
      priority: 0.5,
    })
  }

  return entries
}
